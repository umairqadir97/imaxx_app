import { useEffect, useRef } from 'react';
import { Platform, NativeModules } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tracksData from '../data/tracks.json';

// Dynamically resolve backend host for macbook and mobile physical devices (Android/iOS)
export const getBackendUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  // 1. Try stack trace resolution (100% reliable on physical devices and Expo Go)
  try {
    const err = new Error();
    const stack = err.stack || '';
    const match = stack.match(/(https?|exp):\/\/([0-9.]+):[0-9]+/);
    if (match && match[2]) {
      const host = match[2];
      if (host !== '127.0.0.1' && host !== 'localhost') {
        console.log(`[HostResolution] Resolved via stack trace: http://${host}:3000`);
        return `http://${host}:3000`;
      }
    }
  } catch (e) {
    // Fail silently
  }
  
  // 2. Fallback to NativeModules.SourceCode
  try {
    const scriptURL = NativeModules.SourceCode?.scriptURL || '';
    if (scriptURL && scriptURL.includes('://')) {
      const hostAndPort = scriptURL.split('://')[1];
      let host = hostAndPort.split(':')[0];
      if (host) {
        if (host === 'localhost' || host === '127.0.0.1') {
          if (Platform.OS === 'android') {
            host = '10.0.2.2'; // Loopback to host laptop from Android emulator
          }
        }
        console.log(`[HostResolution] Resolved via SourceCode: http://${host}:3000`);
        return `http://${host}:3000`;
      }
    }
  } catch (e) {
    console.log('[HostResolution] Failed to resolve Metro host:', e);
  }
  
  // Fallback for Android emulator if scriptURL is missing/invalid
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000'; // Fallback
};

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

export const CLOUDFRONT_BASE_URL = 'https://d25dywr0pyvqab.cloudfront.net';

export const getCloudFrontUrlForTrack = (track: any): string => {
  if (!track) return `${CLOUDFRONT_BASE_URL}/natural-sounds/jungle_soundtrack_0_to_10.mp3`;
  if (track.url && track.url.includes('cloudfront.net')) {
    return track.url;
  }
  if (track.s3Key) {
    return `${CLOUDFRONT_BASE_URL}/${encodeURI(track.s3Key)}`;
  }
  if (track.url && track.url.includes('.amazonaws.com/')) {
    const key = track.url.split('.amazonaws.com/')[1];
    if (key) return `${CLOUDFRONT_BASE_URL}/${key}`;
  }
  return track.url || `${CLOUDFRONT_BASE_URL}/natural-sounds/jungle_soundtrack_0_to_10.mp3`;
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

        const tracks = tracksData as any[];
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
          
          const downloadUrl = getCloudFrontUrlForTrack(track);

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
// Web Physical Storage Helpers (IndexedDB & Origin Private File System - OPFS)
// -------------------------------------------------------------
const openIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported on this platform.'));
      return;
    }
    const request = indexedDB.open('imaxx_physical_storage', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('audio_tracks')) {
        db.createObjectStore('audio_tracks');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getTrackFromWebPhysicalStorage = async (trackId: string): Promise<string | null> => {
  if (Platform.OS !== 'web') return null;

  // 1. Try reading from OPFS (Origin Private File System)
  try {
    if (navigator.storage && navigator.storage.getDirectory) {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(`track_${trackId}.mp3`, { create: false });
      const file = await fileHandle.getFile();
      if (file && file.size > 0) {
        console.log(`[OPFS Hit] Loaded track '${trackId}' from physical device storage.`);
        return URL.createObjectURL(file);
      }
    }
  } catch (e) {
    // Fallback to IndexedDB if OPFS file is not found or fails
  }

  // 2. Try reading from IndexedDB
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const transaction = db.transaction('audio_tracks', 'readonly');
      const store = transaction.objectStore('audio_tracks');
      const request = store.get(trackId);
      request.onsuccess = () => {
        const blob = request.result;
        if (blob instanceof Blob) {
          console.log(`[IndexedDB Hit] Loaded track '${trackId}' from physical database storage.`);
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
};

const saveTrackToWebPhysicalStorage = async (trackId: string, blob: Blob): Promise<void> => {
  if (Platform.OS !== 'web') return;

  // 1. Try writing to OPFS
  try {
    if (navigator.storage && navigator.storage.getDirectory) {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(`track_${trackId}.mp3`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      console.log(`[OPFS Saved] Track '${trackId}' written to physical device storage.`);
    }
  } catch (e) {
    console.log('[OPFS Save Error] Falling back to IndexedDB:', e);
  }

  // 2. Write to IndexedDB
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('audio_tracks', 'readwrite');
      const store = transaction.objectStore('audio_tracks');
      const request = store.put(blob, trackId);
      request.onsuccess = () => {
        console.log(`[IndexedDB Saved] Track '${trackId}' written to physical database storage.`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('[IndexedDB Save Failed]:', e);
  }
};

// -------------------------------------------------------------
// Playback Fetch-and-Stream Handler
// -------------------------------------------------------------
export const getOrDownloadTrack = async (trackId: string): Promise<string> => {
  // Local AsyncStorage playback counter increment (100% offline & local)
  try {
    const countsRaw = await AsyncStorage.getItem('iMaxx_track_play_counts');
    const counts = countsRaw ? JSON.parse(countsRaw) : {};
    counts[trackId] = (counts[trackId] || 0) + 1;
    await AsyncStorage.setItem('iMaxx_track_play_counts', JSON.stringify(counts));
  } catch (e) {
    // Ignore counter errors
  }

  // Resolve active track from tracks.json and construct CloudFront URL
  const activeTrack = (tracksData as any[]).find(t => t.id === trackId || String((t as any).num) === trackId);
  const cloudFrontUrl = getCloudFrontUrlForTrack(activeTrack);

  if (Platform.OS === 'web') {
    try {
      // 1. Check physical device storage (OPFS / IndexedDB)
      const physicalUrl = await getTrackFromWebPhysicalStorage(trackId);
      if (physicalUrl) {
        console.log(`[Web Physical Storage Hit] Playing track '${trackId}' from local storage cache.`);
        return physicalUrl;
      }
      
      // 2. Cache Miss: Stream directly from high-speed CloudFront CDN URL immediately!
      console.log(`[Web Physical Storage Miss] Streaming CloudFront URL for track '${trackId}': ${cloudFrontUrl}`);
      
      // Save CloudFront track blob to web OPFS/IndexedDB storage in background
      fetch(cloudFrontUrl)
        .then(res => {
          if (res.ok) return res.blob();
          throw new Error('CloudFront fetch notice');
        })
        .then(blob => saveTrackToWebPhysicalStorage(trackId, blob))
        .catch(() => {});
        
      return cloudFrontUrl;
    } catch (e) {
      return cloudFrontUrl;
    }
  }

  // Mobile platforms local encrypted caching layer
  const cacheDir = documentDir + 'audio_cache/';
  const encryptedFileUri = cacheDir + `${trackId}.enc`;
  const decryptedTempUri = cacheDirConst + `${trackId}_playback_temp.mp3`;

  // Proactively ensure audio_cache directory exists to prevent java.io.FileNotFoundException
  try {
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      console.log('[Directory Setup] Created missing audio_cache directory.');
    }
  } catch (e) {
    console.log('[Directory Setup] Failed to ensure audio_cache directory exists:', e);
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(encryptedFileUri);
    
    // 1. LOCAL STORAGE HIT: Play directly from local storage!
    if (fileInfo.exists && fileInfo.size && fileInfo.size > 0) {
      console.log(`[Local Storage Hit] Playing ${trackId} directly from local encrypted storage...`);
      
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
      // 2. LOCAL STORAGE MISS: Stream from CloudFront immediately & download to local storage in background
      console.log(`[Local Storage Miss] Streaming CloudFront URL for ${trackId}: ${cloudFrontUrl}`);
      console.log(`[Local Storage Miss] Downloading ${trackId} to local encrypted storage in background...`);
      
      // Start background download & encryption so future plays load 100% offline from local storage
      backgroundCacheTask(trackId, cloudFrontUrl, encryptedFileUri);
      
      // Return CloudFront URL for instant playback
      return cloudFrontUrl;
    }
  } catch (err) {
    console.log('Local storage read failure, falling back to CloudFront stream:', err);
    return cloudFrontUrl;
  }
};
 
// Background file caching/encryption helper to prevent locking UI
const backgroundCacheTask = async (trackId: string, downloadUrl: string, targetEncUri: string) => {
  try {
    // Proactively ensure target folder exists before writing
    const cacheDir = documentDir + 'audio_cache/';
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }

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

    const cachedUrlKey = `iMaxx_cached_img_url_${trackId}`;
    const lastCachedUrl = await AsyncStorage.getItem(cachedUrlKey);
    const fileInfo = await FileSystem.getInfoAsync(localImageUri);

    if (fileInfo.exists && lastCachedUrl === remoteUrl) {
      return localImageUri;
    } else {
      // Clean up old file if remote image URL changed (invalidation)
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(localImageUri, { idempotent: true });
      }
      
      console.log(`[Image Cache] Caching new image for ${trackId} in background: ${remoteUrl}`);
      FileSystem.downloadAsync(remoteUrl, localImageUri)
        .then(() => {
          AsyncStorage.setItem(cachedUrlKey, remoteUrl);
        })
        .catch(e => {
          console.log('[Image Cache] Download failed:', e);
        });
      return remoteUrl; // Return remote URL immediately for instant loading
    }
  } catch (err) {
    console.log('[Image Cache] Error:', err);
    return remoteUrl;
  }
};
