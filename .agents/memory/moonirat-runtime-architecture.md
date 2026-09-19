---
name: Moonirat runtime architecture
description: Durable architecture constraint for Moonirat V1 runtime work.
---

Moonirat V1 must retain TanStack Start server-side rendering and file-based route splitting. A client-only router migration is not an acceptable runtime replacement.

Moonirat V1 product traffic should continue to use Supabase directly for Auth, PostgreSQL/RLS, and Storage. Replit is the current workspace and Node host, not an application data dependency; the separate Express API is not a proxy for existing product traffic unless a trusted server-only capability requires it.

**Why:** The user explicitly requires SSR and route splitting to remain intact while build/resource problems are diagnosed, and wants hosting portability without pretending Supabase or Replit own responsibilities they do not.

**How to apply:** Treat the TanStack Start Node build as the certification target. Preserve SSR output and route-level chunks, keep provider-specific hosting metadata outside product code, and add API routes only for operations that truly require a server trust boundary.