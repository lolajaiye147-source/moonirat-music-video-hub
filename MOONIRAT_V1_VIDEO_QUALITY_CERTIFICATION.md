# MOONIRAT V1 — Video Quality & Playback Certification

**Certification date:** September 18, 2026  
**Scope:** Existing direct-upload/direct-playback H.264/AAC MP4 pipeline  
**Recommendation:** **A — Ready for controlled beta within the documented V1 constraints**

## Recommendation scale

- **A — Beta ready:** The current architecture is suitable for a controlled beta. Remaining limitations are documented operating constraints, not release blockers.
- **B — Conditional:** Beta should wait for one or more fixes in the current architecture.
- **C — Not ready:** The direct MP4 architecture is unsuitable and should be replaced before beta.

## Executive conclusion

Moonirat V1 can continue using its existing Supabase Storage and TanStack Start direct-playback architecture. Live certification preserved the exact uploaded bytes for four representative H.264/AAC MP4 files, including 720p, 1080p, portrait, and 60 fps media. Public delivery returned the correct MP4 content type and supported HTTP byte ranges. Database rows retained the correct public URLs and Storage paths. Cross-account attempts could not modify another creator's video object or video row.

No transcoding, HLS generation, WebM derivatives, lower-quality renditions, or new backend were added. Those systems are not required to begin a controlled V1 beta.

The recommendation is **A**, with these beta constraints:

1. Creators must upload H.264/AAC MP4 files.
2. Moonirat preserves the uploaded file and does not generate adaptive lower-quality versions.
3. Playback on slow connections depends on the uploaded bitrate and the viewer's available bandwidth.
4. Supported-browser playback still needs a final manual smoke test in normal current Chrome, Safari, and Firefox builds. Replit's test Chromium cannot decode the independently verified H.264 fixtures.

## Changes completed

### Upload contract

- Restricted the creator file picker and client validation to MP4.
- Added explicit creator guidance: `H.264/AAC MP4, up to 500MB`.
- Corrected limit wording to “500MB or smaller” for video and “5MB or smaller” for thumbnails.
- Added a clear disclosure that V1 preserves uploaded resolution and quality and does not create lower-quality versions.
- Preserved the existing direct Supabase Storage upload, retry, progress, and same-size recovery behavior.

### Playback

- Preserved direct MP4 playback from the stored public URL/path.
- Added `preload="metadata"` so opening a watch page does not eagerly download the full video.
- Preserved direct-source recovery, playback retry, progress saving, qualified view tracking, queue navigation, fullscreen, Media Session controls, and progressive Remote Playback/AirPlay support.

### Deletion and storage ownership

- Added `videos.thumbnail_storage_path` to track the actual thumbnail object independently from its public URL.
- New uploads save both video and thumbnail Storage paths.
- Creator deletion removes both Storage objects before deleting the database row.
- Live authorization checks confirmed that a second signed-in account cannot overwrite another creator's video object or update that creator's video row.

### Repeatable certification

- Added `pnpm --filter @workspace/moonirat run test:video-quality`.
- The integration script creates isolated temporary accounts and rows, uploads all fixtures through authenticated Supabase Storage, validates delivery and preservation, tests authorization boundaries, and removes all temporary rows, objects, artist data, and auth users in a `finally` cleanup.

## Live fixture matrix

All fixtures were four-second H.264 High Profile, `yuv420p`, AAC, 48 kHz MP4 files with the MP4 fast-start flag.

| Fixture | Resolution | FPS | Uploaded bytes | Public delivery | Downloaded media | Result |
|---|---:|---:|---:|---|---|---|
| Landscape 720p | 1280×720 | 30 | 1,418,473 | `200`, `video/mp4`, range `206` | Exact SHA-256; H.264/AAC and dimensions preserved | PASS |
| Landscape 1080p | 1920×1080 | 24 | 2,528,312 | `200`, `video/mp4`, range `206` | Exact SHA-256; H.264/AAC and dimensions preserved | PASS |
| Portrait | 720×1280 | 30 | 1,454,821 | `200`, `video/mp4`, range `206` | Exact SHA-256; H.264/AAC and dimensions preserved | PASS |
| Landscape high frame rate | 1280×720 | 60 | 1,839,558 | `200`, `video/mp4`, range `206` | Exact SHA-256; H.264/AAC and dimensions preserved | PASS |

For every fixture:

- The public `HEAD` response reported the exact uploaded byte length.
- A request for bytes `0-1023` returned `206 Partial Content` with the correct `Content-Range`.
- A complete public download matched the original SHA-256 hash.
- `ffprobe` confirmed H.264 High Profile, `yuv420p`, AAC, 48 kHz audio, original dimensions, original frame rate, and four-second duration after download.
- The public video row retained the correct `video_url`, `storage_path`, `thumbnail_storage_path`, ownership, and publication state.

Detailed machine-readable evidence is generated locally at:

`/tmp/moonirat-quality/live-certification-evidence.json`

The `/tmp` evidence and media fixtures are intentionally disposable and are not application assets.

## Authorization and cleanup results

| Check | Result |
|---|---|
| Another account overwrites the owner's video object | REJECTED |
| Another account updates the owner's video row | ZERO ROWS; persisted owner data unchanged |
| Temporary video rows after certification | REMOVED |
| Temporary video Storage objects after certification | ABSENT |
| Temporary thumbnail Storage objects after certification | ABSENT |
| Temporary artist and auth users | REMOVED |
| Uncached request after object deletion | Non-success response (`400`, Supabase missing-object behavior) |

Previously fetched public objects can remain in a CDN cache for the upload's one-hour cache-control TTL even after the underlying object has been deleted. Storage listings and cache-busted requests confirmed that the paid Storage objects were removed. This does not leave duplicate objects or paid storage behind, but immediate public revocation of a previously cached URL is not guaranteed during that TTL.

## Build and application checks

- TypeScript check: PASS
- TanStack Start production build: PASS
- Server and client bundles generated successfully: PASS
- Public preview and SSR response checks: PASS
- Existing qualified-view boundary remains unchanged: at least three watched seconds and a 24-hour counting cooldown.

## Browser playback status

### Verified

- The files are valid browser-oriented MP4 assets: H.264 High Profile, `yuv420p`, AAC audio, and fast-start metadata.
- Public delivery supports byte ranges required for normal seeking and progressive direct playback.
- The player assigns the direct public MP4 source and exposes recovery controls.

### Not available in this environment

Actual decoded playback cannot be certified in Replit's bundled test Chromium. That runtime returned media error 4 for an independently probed H.264/AAC fixture because its codec build lacks H.264 decoding support. This is an environment limitation, not evidence that the fixture or Storage delivery is invalid.

Before opening beta broadly, perform one short manual playback smoke test in:

- Current Chrome on Android or desktop
- Current Safari on iPhone or macOS
- Current Firefox on desktop

This manual check should cover start, seek, pause/resume, fullscreen, and a network interruption/retry.

## Known V1 limitations accepted for beta

1. **No adaptive bitrate:** Moonirat does not create lower-resolution renditions. A high-bitrate upload can buffer on a slow connection.
2. **Codec guidance rather than binary inspection in the browser:** The uploader enforces MP4 by MIME type/extension and tells creators to use H.264/AAC, but it does not parse the streams before upload.
3. **Large-file resilience is retry-based:** Direct uploads retry and recognize a completed same-size object, but they are not resumable multipart uploads.
4. **Cached deletion window:** A previously fetched public URL may remain cached for up to the configured one-hour TTL after deletion.
5. **Source quality controls output quality:** Moonirat preserves the source bytes; it cannot repair poor encoding, low resolution, clipping, or excessive source bitrate.

These are appropriate constraints for a controlled V1 beta as long as creator guidance and feedback monitoring remain active. They do not justify introducing transcoding infrastructure in this stabilization pass.

## Final certification

**A — Ready for controlled beta.**

Keep the current direct H.264/AAC MP4 pipeline. Do not add transcoding, generated HLS, WebM derivatives, or a replacement media backend before beta based on the evidence in this pass. Reconsider adaptive delivery only after real beta playback data shows that source bitrates or viewer network conditions cause a material failure rate.