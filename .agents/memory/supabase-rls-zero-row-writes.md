---
name: Supabase RLS zero-row writes
description: How to assert blocked Supabase updates and deletes when PostgREST does not return an error.
---

An update or delete blocked by row-level security can complete without a client
error while matching and changing zero visible rows. Do not treat the absence of
an error as proof that the write was authorized.

**Why:** PostgREST can represent an RLS-filtered write as a successful operation
against an empty result set.

**How to apply:** After a write that should be denied, read the authoritative row
through an allowed identity or service role and assert that its values and
existence did not change. When useful, request affected rows explicitly as an
additional signal.