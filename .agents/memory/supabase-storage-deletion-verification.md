---
name: Supabase Storage deletion verification
description: How to distinguish deleted objects from cached public responses during cleanup checks.
---

Treat an authenticated Storage listing with the exact object name absent as the authoritative proof that a public object was removed. A cache-busted public request should also be non-successful, but Supabase may return `400` rather than `404` for a missing public object.

**Why:** Public URLs fetched before deletion can continue returning cached `200` responses for the object's cache-control TTL, even though the object no longer occupies Storage.

**How to apply:** For deletion tests, verify the object is absent from its bucket folder and make an uncached request. Do not require an exact `404`, and do not treat a previously cached `200` alone as proof that deletion failed.