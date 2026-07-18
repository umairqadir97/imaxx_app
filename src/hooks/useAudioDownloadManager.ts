import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tracksData from '../data/tracks.json';

const documentDir = (FileSystem as any).documentDirectory || '';
const cacheDirConst = (FileSystem as any).cacheDirectory || '';

// -------------------------------------------------------------
// SECURE FILE EMBEDDED XOR KEY (Prevents external playback)
// -------------------------------------------------------------
const XOR_KEY = 0xAA; // XOR mask byte
const HEADER_ENCRYPT_SIZE = 8192; // Encrypt first 8KB only for ultra-fast, non-blocking crypto

// XOR header bytes helper (works on base64 chunks)
const toggleHeaderCrypto = (base64Str: string): string => {
  if (Platform.OS === 'web') return base64Str; // Skip encryption on web for native audio streaming convenience
  
  try {
    // Convert base64 to binary string
    const binary = atob(base64Str);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
      // XOR byte toggle
      buffer[i] = binary.charCodeAt(i) ^ XOR_KEY;
    }
    
    // Convert back to base64
    let binarySignStr = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      binarySignStr += String.fromCharCode(buffer[i]);
    }
    return btoa(binarySignStr);
  } catch (e) {
    console.error('Crypto error:', e);
    return base64Str;
  }
};

export const useAudioDownloadManager = () => {
  const isDownloadingRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return; // Background caching handled natively by CDN on Web

    const initOnboardingDownloads = async () => {
      if (isDownloadingRef.current) return;
      
      try {
        const isFirstBoot = await AsyncStorage.getItem('iMaxx_first_boot_downloaded');
        if (isFirstBoot === 'true') return; // Already completed

        isDownloadingRef.current = true;
        console.log('[Onboarding] Starting background download of default-download tracks...');

        // Fetch tracks listing from backend server
        const response = await fetch('http://localhost:3000/api/tracks');
        if (!response.ok) throw new Error('Failed to fetch track config');
        
        const tracks = await response.json();
        const defaultDownloads = tracks.filter((t: any) => t.category === 'default-download');

        // Ensure cache directories exist
        const cacheDir = documentDir + 'audio_cache/';
        const dirInfo = await FileSystem.getInfoAsync(cacheDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        }

        // Background download default-download tracks
        for (const track of defaultDownloads) {
          const fileUri = cacheDir + `${track.id}.enc`;
          const fileCheck = await FileSystem.getInfoAsync(fileUri);
          if (fileCheck.exists) continue;

          console.log(`[Onboarding] Downloading ${track.id} in background...`);
          
          // Get stream URL from backend API
          const urlRes = await fetch(`http://localhost:3000/api/tracks/${track.id}/stream-url`);
          const urlData = await urlRes.json();
          const downloadUrl = urlData.streamUrl;

          // Temporary plain download path
          const tempUri = documentDir + `${track.id}_temp.mp3`;
          await FileSystem.downloadAsync(downloadUrl, tempUri);

          // Encrypt file header to prevent unauthorized playback
          const rawHeader = await FileSystem.readAsStringAsync(tempUri, {
            encoding: FileSystem.EncodingType.Base64,
            length: HEADER_ENCRYPT_SIZE
          });
          const encryptedHeader = toggleHeaderCrypto(rawHeader);

          // Write encrypted header to permanent location
          await FileSystem.writeAsStringAsync(fileUri, encryptedHeader, {
            encoding: FileSystem.EncodingType.Base64
          });

          // Append remaining unencrypted body of file
          const totalFileInfo = await FileSystem.getInfoAsync(tempUri);
          if (totalFileInfo.exists && totalFileInfo.size && totalFileInfo.size > HEADER_ENCRYPT_SIZE) {
            const fileBody = await FileSystem.readAsStringAsync(tempUri, {
              encoding: FileSystem.EncodingType.Base64,
              position: HEADER_ENCRYPT_SIZE
            });
            await FileSystem.writeAsStringAsync(fileUri, fileBody, {
              encoding: FileSystem.EncodingType.Base64,
              append: true
            });
          }

          // Delete unencrypted temporary file
          await FileSystem.deleteAsync(tempUri, { idempotent: true });
          console.log(`[Onboarding] Cached and encrypted track: ${track.id}`);
        }

        await AsyncStorage.setItem('iMaxx_first_boot_downloaded', 'true');
        console.log('[Onboarding] Background downloads completed.');
      } catch (err) {
        console.log('Background download manager error:', err);
      } finally {
        isDownloadingRef.current = false;
      }
    };

    // Small delay to let initial UI load instantly
    const timeout = setTimeout(initOnboardingDownloads, 3000);
    return () => clearTimeout(timeout);
  }, []);
};

// -------------------------------------------------------------
// Playback Fetch-and-Stream Handler
// -------------------------------------------------------------
export const getOrDownloadTrack = async (trackId: string): Promise<string> => {
  // Playback counter increment
  try {
    const countsRaw = await AsyncStorage.getItem('iMaxx_track_play_counts');
    const counts = countsRaw ? JSON.parse(countsRaw) : {};
    counts[trackId] = (counts[trackId] || 0) + 1;
    await AsyncStorage.setItem('iMaxx_track_play_counts', JSON.stringify(counts));

    // Optional: Notify backend database of play count increment
    fetch(`http://localhost:3000/api/tracks/${trackId}/play-increment`, { method: 'POST' }).catch(() => {});
  } catch (e) {
    // Ignore counter errors
  }

  // Resolve stream URL dynamically from tracks.json configuration file
  const activeTrack = (tracksData as any[]).find(t => t.id === trackId);
  const streamUrl = activeTrack?.url || `https://cdn.dopamind.app/audio/tracks/${trackId}-v1.mp3`;

  if (Platform.OS === 'web') {
    // Web platform browser handles progressive streaming and cache headers natively
    return streamUrl;
  }

  // Mobile platforms local encrypted caching layer
  const cacheDir = documentDir + 'audio_cache/';
  const encryptedFileUri = cacheDir + `${trackId}.enc`;
  const decryptedTempUri = cacheDirConst + `${trackId}_playback_temp.mp3`;

  try {
    const fileInfo = await FileSystem.getInfoAsync(encryptedFileUri);
    
    if (fileInfo.exists) {
      console.log(`[Cache Hit] Decrypting ${trackId} for playback...`);
      
      // Read encrypted header
      const encHeader = await FileSystem.readAsStringAsync(encryptedFileUri, {
        encoding: FileSystem.EncodingType.Base64,
        length: HEADER_ENCRYPT_SIZE
      });
      const decHeader = toggleHeaderCrypto(encHeader);

      // Write decrypted header to temporary playback file
      await FileSystem.writeAsStringAsync(decryptedTempUri, decHeader, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Append remaining original file body
      const encBody = await FileSystem.readAsStringAsync(encryptedFileUri, {
        encoding: FileSystem.EncodingType.Base64,
        position: HEADER_ENCRYPT_SIZE
      });
      await FileSystem.writeAsStringAsync(decryptedTempUri, encBody, {
        encoding: FileSystem.EncodingType.Base64,
        append: true
      });

      return decryptedTempUri;
    } else {
      console.log(`[Cache Miss] Streaming ${trackId} instantly and downloading in background...`);
      
      // Start background cache task so it's ready next time
      backgroundCacheTask(trackId, streamUrl, encryptedFileUri);
      
      // Return CDN stream url to play instantly (TikTok style)
      return streamUrl;
    }
  } catch (err) {
    console.log('Cache read failure, streaming directly:', err);
    return streamUrl;
  }
};

// Background file caching/encryption helper to prevent locking UI
const backgroundCacheTask = async (trackId: string, downloadUrl: string, targetEncUri: string) => {
  try {
    const tempUri = documentDir + `${trackId}_temp_bg.mp3`;
    await FileSystem.downloadAsync(downloadUrl, tempUri);

    // Encrypt header
    const rawHeader = await FileSystem.readAsStringAsync(tempUri, {
      encoding: FileSystem.EncodingType.Base64,
      length: HEADER_ENCRYPT_SIZE
    });
    const encryptedHeader = toggleHeaderCrypto(rawHeader);

    // Write encrypted header
    await FileSystem.writeAsStringAsync(targetEncUri, encryptedHeader, {
      encoding: FileSystem.EncodingType.Base64
    });

    // Append body
    const body = await FileSystem.readAsStringAsync(tempUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: HEADER_ENCRYPT_SIZE
    });
    await FileSystem.writeAsStringAsync(targetEncUri, body, {
      encoding: FileSystem.EncodingType.Base64,
      append: true
    });

    await FileSystem.deleteAsync(tempUri, { idempotent: true });
    console.log(`[Background Cache] Track cached successfully: ${trackId}`);
  } catch (err) {
    console.log('Background cache failed:', err);
  }
};

// -------------------------------------------------------------
// Playback Local Image Caching Handler
// -------------------------------------------------------------
export const getOrDownloadImage = async (trackId: string, remoteUrl: string): Promise<string> => {
  if (Platform.OS === 'web' || !remoteUrl) {
    return remoteUrl;
  }

  const imageCacheDir = documentDir + 'image_cache/';
  const localImageUri = imageCacheDir + `${trackId}.jpg`;

  try {
    // Ensure image cache directory exists
    const dirInfo = await FileSystem.getInfoAsync(imageCacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(imageCacheDir, { intermediates: true });
    }

    const fileInfo = await FileSystem.getInfoAsync(localImageUri);
    if (fileInfo.exists) {
      return localImageUri;
    } else {
      // Download image in the background
      console.log(`[Image Cache] Caching image for ${trackId} in background...`);
      FileSystem.downloadAsync(remoteUrl, localImageUri).catch(e => {
        console.log('[Image Cache] Download failed:', e);
      });
      return remoteUrl; // Return remote URL immediately for instant loading
    }
  } catch (err) {
    console.log('[Image Cache] Error:', err);
    return remoteUrl;
  }
};
