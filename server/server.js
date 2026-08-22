const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'imaxx-audio-assets-prod-314694590067-us-east-1-an';
const CACHE_MAX_AGE_MS = (parseInt(process.env.SIGNED_URL_CACHE_MAX_AGE_HOURS, 10) || 20) * 60 * 60 * 1000; // 20 hours in ms
const URL_EXPIRATION_SECONDS = parseInt(process.env.SIGNED_URL_EXPIRATION_SECONDS, 10) || 86400; // 24 hours in seconds

// In-Memory Signed URL Cache: { [trackId]: { signedUrl: string, generatedAt: number, expiresAt: number } }
const signedUrlCache = new Map();

// Load tracks metadata with numeric indices from local tracks.json (Vercel) or fallback to src/data/tracks.json
const localTracksPath = path.join(__dirname, 'tracks.json');
const fallbackTracksPath = path.join(__dirname, '../src/data/tracks.json');
let tracksData = [];

function loadTracksData() {
  try {
    const tracksFilePath = fs.existsSync(localTracksPath) ? localTracksPath : fallbackTracksPath;
    if (fs.existsSync(tracksFilePath)) {
      const raw = fs.readFileSync(tracksFilePath, 'utf-8');
      tracksData = JSON.parse(raw);
    }
  } catch (err) {
    console.error('[Server] Failed to read tracks.json:', err);
  }
}
loadTracksData();

/**
 * Helper to generate or retrieve cached S3 pre-signed URL
 * Re-uses cached URL if generated less than 20 hours ago.
 */
const cacheFilePath = path.join(__dirname, 'presigned_urls_cache.json');

// Load persistent pre-signed URL dictionary from file
function loadCacheFromFile() {
  try {
    if (fs.existsSync(cacheFilePath)) {
      const raw = fs.readFileSync(cacheFilePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[Server] Failed to read pre-signed URLs cache file:', err);
  }
  return {};
}

// Write persistent pre-signed URL dictionary to file
function writeCacheToFile(cache) {
  try {
    fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server] Failed to write pre-signed URLs cache file:', err);
  }
}

/**
 * Helper to generate or retrieve cached S3 pre-signed URL
 * Re-uses cached URL if generated less than 20 hours ago.
 */
async function getOrGenerateSignedUrl(track) {
  const cacheKey = track.url || track.id;
  const now = Date.now();
  
  const cache = loadCacheFromFile();
  const cached = cache[cacheKey];

  // Return cached signed URL if valid and generated less than 20 hours ago
  if (cached && (now - cached.generatedAt) < CACHE_MAX_AGE_MS) {
    const ageHours = ((now - cached.generatedAt) / (1000 * 60 * 60)).toFixed(2);
    console.log(`[SignedURL Cache Hit] Track #${track.num} (${track.id}) - Cached URL age: ${ageHours} hrs`);
    return {
      streamUrl: cached.signedUrl,
      cached: true,
      generatedAt: cached.generatedAt,
      ageHours: parseFloat(ageHours),
    };
  }

  console.log(`[SignedURL Cache Miss] Track #${track.num} (${track.id}) - Generating fresh S3 signed URL (valid 24h)...`);

  // Parse S3 key and bucket dynamically from track URL
  let s3Key = track.s3Key;
  let bucketName = BUCKET_NAME;

  if (track.url) {
    try {
      const urlObj = new URL(track.url);
      const host = urlObj.hostname;

      // Extract bucket name from S3 host (supports virtual host styles)
      if (host.includes('.s3.')) {
        bucketName = host.split('.s3.')[0];
      } else if (host.includes('.s3-')) {
        bucketName = host.split('.s3-')[0];
      } else if (host.endsWith('.s3.amazonaws.com')) {
        bucketName = host.replace('.s3.amazonaws.com', '');
      }

      if (!s3Key) {
        // Pathname starts with '/', remove the leading slash
        s3Key = decodeURIComponent(urlObj.pathname.substring(1));
      }
    } catch (e) {
      console.error('[SignedURL] Error parsing track.url, falling back to default:', e);
    }
  }

  if (!s3Key) {
    s3Key = `audio/tracks/${track.id}-v1.mp3`;
  }

  try {
    console.log(`[S3 Request] Generating Signed URL. Bucket: ${bucketName}, Key: ${s3Key}`);
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    const freshSignedUrl = await getSignedUrl(s3Client, command, { expiresIn: URL_EXPIRATION_SECONDS });

    // Store in persistent file dictionary
    cache[cacheKey] = {
      trackId: track.id,
      trackNum: track.num,
      signedUrl: freshSignedUrl,
      generatedAt: now,
      expiresInSeconds: URL_EXPIRATION_SECONDS,
      maxAgeHours: parseInt(process.env.SIGNED_URL_CACHE_MAX_AGE_HOURS, 10) || 20,
    };
    writeCacheToFile(cache);

    // Keep in-memory cache synchronized as well
    signedUrlCache.set(track.id, {
      signedUrl: freshSignedUrl,
      generatedAt: now,
      expiresAt: now + (URL_EXPIRATION_SECONDS * 1000),
    });

    return {
      streamUrl: freshSignedUrl,
      cached: false,
      generatedAt: now,
      ageHours: 0,
    };
  } catch (err) {
    console.error(`[SignedURL Error] Failed for track ${track.id}:`, err);
    // Fallback to track's direct URL if S3 presigner fails
    return {
      streamUrl: track.url || `https://cdn.dopamind.app/audio/tracks/${track.id}-v1.mp3`,
      cached: false,
      fallback: true,
    };
  }
}

/**
 * 1. API: List all audio tracks with numeric indices and metadata
 */
app.get('/api/tracks', (req, res) => {
  loadTracksData();
  res.json(tracksData);
});

/**
 * 2. API: Get S3 Signed URL for any track (by track ID or numeric number)
 * Caches signed URL for 20 hours before regenerating a new 24h AWS signed URL.
 */
app.get('/api/tracks/:id/signed-url', async (req, res) => {
  loadTracksData();
  const { id } = req.params;

  // Search by track ID or numeric number
  const track = tracksData.find(t => t.id === id || String(t.num) === id);
  if (!track) {
    return res.status(404).json({ error: `Track '${id}' not found` });
  }

  const result = await getOrGenerateSignedUrl(track);
  res.json({
    trackNum: track.num,
    trackId: track.id,
    trackTitle: track.title,
    streamUrl: result.streamUrl,
    cached: result.cached,
    ageHours: result.ageHours || 0,
    expiresInHours: 24,
    cacheMaxAgeHours: 20,
  });
});

// Alias endpoint for backwards compatibility
app.get('/api/tracks/:id/stream-url', async (req, res) => {
  loadTracksData();
  const { id } = req.params;
  const track = tracksData.find(t => t.id === id || String(t.num) === id);
  if (!track) {
    return res.status(404).json({ error: `Track '${id}' not found` });
  }

  const result = await getOrGenerateSignedUrl(track);
  res.json({
    trackNum: track.num,
    trackId: track.id,
    streamUrl: result.streamUrl,
    cached: result.cached,
  });
});

const https = require('https');
const http = require('http');

/**
 * 3. API: Proxy download endpoint to bypass browser CORS limits on local laptop testing
 */
app.get('/api/tracks/:id/download', async (req, res) => {
  loadTracksData();
  const { id } = req.params;
  const track = tracksData.find(t => t.id === id || String(t.num) === id);
  if (!track) {
    return res.status(404).json({ error: `Track '${id}' not found` });
  }

  // If S3, fetch via S3 SDK client (runs on backend, bypassing CORS constraints)
  if (track.source === 's3' || (track.url && track.url.includes('.amazonaws.com/'))) {
    let s3Key = track.s3Key;
    let bucketName = BUCKET_NAME;

    if (track.url) {
      try {
        const urlObj = new URL(track.url);
        const host = urlObj.hostname;

        if (host.includes('.s3.')) {
          bucketName = host.split('.s3.')[0];
        } else if (host.includes('.s3-')) {
          bucketName = host.split('.s3-')[0];
        } else if (host.endsWith('.s3.amazonaws.com')) {
          bucketName = host.replace('.s3.amazonaws.com', '');
        }

        if (!s3Key) {
          s3Key = decodeURIComponent(urlObj.pathname.substring(1));
        }
      } catch (e) {
        console.error('[Download proxy] URL parsing error:', e);
      }
    }

    if (!s3Key) {
      s3Key = `audio/tracks/${track.id}-v1.mp3`;
    }

    try {
      console.log(`[Download proxy] Streaming track '${track.id}' from S3. Bucket: ${bucketName}, Key: ${s3Key}`);
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      });

      const s3Object = await s3Client.send(command);

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', s3Object.ContentType || 'audio/mpeg');
      if (s3Object.ContentLength) {
        res.setHeader('Content-Length', s3Object.ContentLength);
      }

      s3Object.Body.pipe(res);
      return;
    } catch (err) {
      console.error('[Download proxy S3 error]:', err);
    }
  }

  // Fallback for CDN or web links
  const fileUrl = track.url || `https://cdn.dopamind.app/audio/tracks/${track.id}-v1.mp3`;
  console.log(`[Download proxy] Streaming track '${track.id}' from Web URL: ${fileUrl}`);

  try {
    const client = fileUrl.startsWith('https') ? https : http;
    client.get(fileUrl, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirUrl = response.headers.location;
        const redirClient = redirUrl.startsWith('https') ? https : http;
        redirClient.get(redirUrl, (redirRes) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', redirRes.headers['content-type'] || 'audio/mpeg');
          if (redirRes.headers['content-length']) {
            res.setHeader('Content-Length', redirRes.headers['content-length']);
          }
          redirRes.pipe(res);
        });
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', response.headers['content-type'] || 'audio/mpeg');
        if (response.headers['content-length']) {
          res.setHeader('Content-Length', response.headers['content-length']);
        }
        response.pipe(res);
      }
    }).on('error', (e) => {
      console.error('[Download proxy Web request error]:', e);
      res.status(500).json({ error: 'Failed to stream track' });
    });
  } catch (e) {
    console.error('[Download proxy Web execution error]:', e);
    res.status(500).json({ error: 'Failed to stream download' });
  }
});

/**
 * 4. API: Playback counter increment
 */
app.post('/api/tracks/:id/play-increment', (req, res) => {
  const { id } = req.params;
  console.log(`[Play Count] Track #${id} play incremented`);
  res.json({ success: true, trackId: id });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', cachedUrlsCount: signedUrlCache.size, timestamp: new Date().toISOString() });
});

// Start server only when not running on Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🎧 iMaxx Audio Backend Server running at http://localhost:${PORT}`);
    console.log(`🔒 S3 Bucket: ${BUCKET_NAME}`);
    console.log(`⏱️ Signed URL Cache Max Age: ${CACHE_MAX_AGE_MS / (1000 * 60 * 60)} hours (URL validity: 24 hours)\n`);
  });
}

module.exports = app;
