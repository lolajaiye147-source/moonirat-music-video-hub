---
name: Supabase task sandbox access
description: Environment-specific limitation observed when managing Moonirat's external Supabase project.
---

Supabase custom-MCP connection state and mounted SQL callbacks must be verified independently. The Moonirat connection now exposes callable `mcpSupabase_*` tools even though the expected local MCP skill file remains absent.

**Why:** Connection metadata appeared before usable callbacks in an earlier session; after reconnection the callbacks became available without the documented local usage file.

**How to apply:** Enumerate the actually mounted `mcpSupabase_*` callbacks, validate read-only argument schemas first, and use `applyMigration` for reviewed DDL. Keep Auth/PostgREST verification separate.