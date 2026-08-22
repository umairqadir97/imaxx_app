# 📱 iMaxx Mobile App & Backend Audio Service

**iMaxx** is an ADHD focus & habit-building mobile application built with **React Native / Expo**, **TypeScript**, **Redux Toolkit**, and **Styled Components**, paired with a Node.js backend server for S3 pre-signed URL security and local storage caching.

---

## 🎵 Numeric Track Catalog Reference

All tracks in `src/data/tracks.json` are indexed with numeric numbers (`num: 1` – `num: 12`) for quick reference:

| Num | Track ID | Title | Slogan | Category | Source |
|---|---|---|---|---|---|
| **1** | `focus` | COSTA RICA CANOPY | Costa Rica Forest | Focus | CDN |
| **2** | `relax` | DAWN AT SKÓGAFOSS | Iceland Waterfall | Relax | CDN |
| **3** | `sleep` | DEEP NEBULA | Cosmic Outer Space | Sleep | S3 |
| **4** | `move` | SYNTHWAVE DRIVE | Synthwave Radio | Relax | YouTube |
| **5** | `uplift` | LOFI STUDY CHILL | LoFi Beats to Relax | Relax | YouTube |
| **6** | `rain_2` | RAINFOREST SHOWER | Amazon Jungle | Relax | YouTube |
| **7** | `focus_1` | ADHD DEEP FLOW | Attention Circadian Stimulator | Focus | CDN |
| **8** | `focus_2` | GAMMA CONCENTRATION | Focus Frequencies Tuning | Focus | CDN |
| **9** | `sleep_1` | THETA DREAMSCAPE | Slowwave Sleep Sync | Sleep | CDN |
| **10** | `nature_1` | FOREST WIND | Deep Nature Whispering | Relax | CDN |
| **11** | `rain_1` | COZY ATTIC STORM | Raindrops on Shingles | Relax | CDN |
| **12** | `relax_1` | ZEN TEMPLE BOWL | Harmonic Resonator | Relax | CDN |

---

## 🚀 Backend Server & S3 Signed URL Caching Architecture

The backend audio service is located in the `/server` directory (`/server/server.js`).

### Features & Workflow:
1. **S3 Pre-signed URL Generation**: Generates 24-hour valid AWS S3 pre-signed URLs using `@aws-sdk/s3-request-presigner`.
2. **20-Hour Server-Side URL Cache**:
   * When a user requests a signed URL (`GET /api/tracks/:id/signed-url`), the server checks its in-memory cache.
   * If a cached signed URL exists and is **less than 20 hours old**, the server returns the cached URL instantly.
   * If the cached URL is **older than 20 hours** (or missing), the server generates a fresh 24-hour AWS S3 pre-signed URL, updates the cache, and returns it.
3. **App Playback & Local Storage Caching**:
   * **Local Storage Check**: When the user clicks to play a track, the mobile app first checks local file system storage (`audio_cache/{trackId}.enc`).
   * **Cache Hit**: If saved locally, the app plays directly from encrypted local storage with 0 latency and 0 network usage.
   * **Cache Miss**: If not saved locally, the app requests the signed URL from the backend server (`GET /api/tracks/:id/signed-url`), streams and plays the audio **immediately**, and downloads/encrypts the file to local storage in the background. On future plays, it loads 100% offline from local storage.

---

## 🛠️ Server Environment Variables (`server/.env`)

Secrets and AWS keys are managed in `server/.env`:

```env
PORT=3000

# AWS S3 Secrets
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=imaxx-audio-assets-prod-314694590067-us-east-1-an

# Signed URL Cache Settings
# Re-uses cached URL if less than 20 hours old
SIGNED_URL_CACHE_MAX_AGE_HOURS=20
# Validity period of generated S3 pre-signed URL (24 hours)
SIGNED_URL_EXPIRATION_SECONDS=86400

CDN_DOMAIN=https://cdn.dopamind.app
```

---

## 🏃 Running the App & Backend Server

### Start Backend Server:
*From root directory:*
```bash
npm run server
```
*Or from inside `/server` folder:*
```bash
npm start
```

### Start Mobile App (Expo Metro):
```bash
npm run start
```

### Start MacBook macOS Desktop App (Electron):
To test live changes inside a standalone macOS desktop app wrapper rather than a browser window:
1. Ensure the Expo Web server is running (press `w` in the Metro console or run `npm run web`).
2. Open a separate terminal window and run:
   ```bash
   npm run electron
   ```
This opens the app inside a dedicated macOS desktop window with hot-reloading (live reload) enabled! You can resize it, inspect it, and test changes instantly.

