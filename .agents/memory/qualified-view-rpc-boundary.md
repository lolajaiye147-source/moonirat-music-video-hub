---
name: Qualified view RPC boundary
description: Why Moonirat intentionally exposes one constrained SECURITY DEFINER function for view qualification.
---

The qualified-view RPC is intentionally executable by anonymous and
authenticated clients even though Supabase Security Advisor flags public
`SECURITY DEFINER` functions.

**Why:** Anonymous playback must count without granting clients direct insert
access. The RPC enforces the watch threshold, derives identity from the request,
hashes anonymous network identity with a server-side salt, and applies the
24-hour cooldown atomically.

**How to apply:** Keep direct `video_views` inserts revoked. Treat the advisor
warning as accepted only while this RPC remains narrowly scoped, has bounded
inputs and an empty `search_path`, and does not accept caller-supplied viewer or
network identity.