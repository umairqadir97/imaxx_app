const express = require('express');
const cors = require('cors');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize S3 Client (assuming AWS credentials are configured via IAM roles or Env variables)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'dopamind-audio-assets';
const CDN_DOMAIN = process.env.CDN_DOMAIN || 'https://cdn.dopamind.app';

// MOCK database tracks table
const tracks = [
  { id: 'focus', key: 'audio/tracks/focus-beat-v1.mp3', category: 'default-download', playCount: 0 },
  { id: 'relax', key: 'audio/tracks/relax-calm-v1.mp3', category: 'default-download', playCount: 0 },
  { id: 'sleep', key: 'audio/tracks/sleep-night-v1.mp3', category: 'relax', playCount: 0 },
  { id: 'move', key: 'audio/tracks/move-heartbeat-v1.mp3', category: 'move', playCount: 0 },
  { id: 'uplift', key: 'audio/tracks/uplift-serotonin-v1.mp3', category: 'uplift', playCount: 0 }
];

/**
 * 1. API: List all audio tracks with metadata and download rules
 */
app.get('/api/tracks', (req, res) => {
  res.json(tracks);
});

/**
 * 2. API: Serve S3 Signed URLs or CDN redirects with Cache-Control headers
 * Since the CDN has Cache-Control: public, max-age=31536000, immutable,
 * we route client requests to the CloudFront/CDN URL of the versioned object key.
 */
app.get('/api/tracks/:id/stream-url', async (req, res) => {
  const { id } = req.params;
  const track = tracks.find(t => t.id === id);
  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }

  try {
    // Strategy A: Serve via S3 pre-signed URL (if files are private)
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: track.key,
    });
    
    // Signed url valid for 24 hours (86400 seconds)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 86400 });

    // Strategy B: Serve via CDN custom domain (Preferred for performance)
    const cdnUrl = `${CDN_DOMAIN}/${track.key}`;

    res.json({
      trackId: id,
      streamUrl: cdnUrl, // Point to CloudFront CDN
      fallbackSignedUrl: signedUrl,
      cacheControl: 'public, max-age=31536000, immutable'
    });
  } catch (err) {
    console.error('Error generating pre-signed URL:', err);
    res.status(500).json({ error: 'Failed to generate media stream URL' });
  }
});

/**
 * 3. API: Record/Increment audio track playback counter in database
 */
app.post('/api/tracks/:id/play-increment', (req, res) => {
  const { id } = req.params;
  const track = tracks.find(t => t.id === id);
  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }

  track.playCount += 1;
  console.log(`Track ${id} playback incremented. Current Play Count: ${track.playCount}`);
  
  res.json({ 
    success: true, 
    trackId: id, 
    newPlayCount: track.playCount 
  });
});

app.listen(PORT, () => {
  console.log(`Backend audio service server listening on port ${PORT}`);
});
