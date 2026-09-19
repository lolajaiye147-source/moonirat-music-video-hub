---
name: Moonirat V1 playback boundary
description: Defines the deliberate V1 boundary between reliable playback validation and future transcoding infrastructure.
---

Moonirat V1 should prioritize reliable playback, source compatibility, clear
errors, and evidence-backed browser validation. Do not turn codec compatibility
work into a transcoding service, background video-processing pipeline, or
permanent WebM derivative strategy.

**Why:** The creator explicitly confirmed that V1 stability is the priority.
A valid H.264/AAC object can fail in a restricted test runtime because of its
decoder, which is not evidence that Storage or the production media is broken.

**How to apply:** Keep direct H.264/AAC MP4 as the expected production path,
use temporary alternate-codec files only for diagnostics, and treat HLS
transcoding as a separate deliberate upgrade after V1 is stable.