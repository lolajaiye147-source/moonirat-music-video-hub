---
name: Moonirat H.264 browser certification
description: How to interpret codec failures in Replit's browser-testing runtime during Moonirat playback certification.
---

Do not treat a Replit Chromium `MEDIA_ERR_SRC_NOT_SUPPORTED` result by itself as proof that a Moonirat MP4 violates the V1 H.264/AAC boundary. Confirm the asset independently and report playback-dependent checks as unavailable or warnings when the runtime exposes no H.264 support.

**Why:** A certification MP4 independently confirmed as H.264 High profile, `yuv420p`, and AAC-LC returned an empty `canPlayType` result and media error code 4 in the browser-testing Chromium runtime. Queue, responsive controls, and fullscreen remained testable, but playback, natural-end auto-advance, view qualification, and resume did not.

**How to apply:** Inspect the media with `ffprobe`, test playback in a supported Chrome/Safari/Firefox environment when available, and never promote playback-dependent statuses to PASS from code inspection alone.