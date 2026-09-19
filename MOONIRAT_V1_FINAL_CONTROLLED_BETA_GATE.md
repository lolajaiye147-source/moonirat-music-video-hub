# Moonirat V1 Final Controlled Public Beta Gate

**Gate date:** 2026-08-31  
**Repository/backend:** Existing Moonirat repository and Supabase project `pfjwulgedqvtolaazdap`

## Required gate fields

V1_STATUS: CONDITIONAL_PASS  
PUBLIC_BETA_READY: CONDITIONAL_PASS  
VIEWER_JOURNEY: PASS  
CREATOR_JOURNEY: PASS  
ADMIN_JOURNEY: PASS  
FEEDBACK_JOURNEY: PASS  
AUTH: WARN  
RLS: PASS  
VIEW_TRACKING: PASS  
UPLOAD_RECOVERY: PASS  
STORAGE_CLEANUP: PASS  
PLAYBACK: CONDITIONAL_PASS  
DISCOVERY_SCALE: PASS  
SEARCH_SCALE: PASS  
MOBILE: PASS  
TYPECHECK: PASS  
BUILD: PASS  
LEAKED_PASSWORD_PROTECTION: MANUAL_ACTION_REQUIRED  
MP4_BROWSER_MATRIX: MANUAL_ACTION_REQUIRED  
SUPABASE_RATE_LIMITING: WARN  
P0_BLOCKERS: PASS  
P1_BLOCKERS: PASS  
WARNINGS: WARN  
MANUAL_ACTIONS: MANUAL_ACTION_REQUIRED  
FINAL_RECOMMENDATION: CONDITIONAL_PASS

## Decision

Moonirat V1 is suitable for a **small, controlled beta** with invited viewers,
creators, and followers. This is not approval for a wide public launch.

`CONDITIONAL_PASS` is not a failed-release label. It means the engineering
validation is sufficient for a limited real-user cohort while the documented
manual and environment-dependent checks remain open.

There are no unresolved P0 or P1 product-code blockers in the certified V1
journeys. The conditional status separates functional readiness from the
remaining manual configuration and browser-environment validation.

## Current validation

- TanStack Start SSR, React, file-based TanStack routing, Supabase Auth,
  PostgreSQL, Storage, migrations, and RLS remain the production architecture.
- Moonirat TypeScript validation passes.
- The isolated production client, SSR, and Nitro build passes.
- SSR smoke requests returned HTTP 200 for `/`, `/discover`, `/search`, `/auth`,
  `/reset-password`, `/feedback`, and `/sitemap.xml`.
- A fresh desktop and 375×812 browser pass rendered Home, Discover, Search,
  Auth, Feedback, and Reset Password without blank pages or crashes.
- Public routes showed truthful loading/empty states. Signed-out feedback and
  authentication actions were clear and usable.
- No horizontal overflow was measured on the checked desktop and mobile
  routes, and bottom navigation did not cover the active content.
- The live catalog is currently empty: zero videos, artists, and profiles.
  Current browser validation therefore covers route behavior and empty states;
  data-dependent journey PASS fields retain the earlier disposable end-to-end
  evidence recorded by the production gate.
- The beta feedback journey retains direct browser, persistence, admin update,
  mobile, duplicate-prevention, and user-isolation evidence. All disposable
  feedback and authentication data was removed.

## Security

- RLS is enabled on profiles, artists, videos, follows, playlists,
  playlist-video membership, watch history, video views, feedback submissions,
  and moderation actions.
- Feedback table grants were hardened during this gate. Anonymous users now
  have no table privileges; authenticated users have only `SELECT` and
  `INSERT`; service-role mutations remain server-only.
- Feedback ownership policies permit authenticated users to create and read
  their own submissions. Admin review still requires server-side token and role
  validation.
- Anonymous and authenticated roles do not have direct `INSERT` on
  `video_views`. Qualified views continue through the constrained RPC.
- Service-role configuration remains isolated to server configuration, server
  modules, and non-production integration scripts. It is not exposed by the
  browser client.
- Supabase Leaked Password Protection remains disabled and must not be marked
  PASS. Authentication continues to function, but compromised-password
  screening is incomplete until the setting is enabled.

## Controlled limitations and warnings

- The available restricted Chromium runtime cannot decode the otherwise valid
  H.264/AAC MP4 fixture. Storage MIME type, byte-range delivery, and source
  validity passed previously. This is an environment limitation, not evidence
  of a broken media object.
- Chrome with H.264 support, Firefox with platform codecs, Safari, iOS Safari,
  and Android Chrome still require the documented manual playback matrix.
- A fresh public signup attempt returned Supabase HTTP 429 after repeated
  certification activity. The signup UI issues one request per submit, disables
  the button while pending, does not automatically retry, and does not simulate
  success. The evidence points to Supabase/auth-environment rate limiting rather
  than duplicate application requests.
- Non-fatal React hydration mismatch warnings remain observable during client
  navigation on Search, Auth, Feedback, and Reset Password. The routes remain
  usable, but this is not a clean browser-console PASS.
- The repository contains residual Lovable scaffolding: the Vite build helper,
  an error-reporting bridge, and an unreferenced Lovable OAuth adapter. Supabase
  remains the only active data/auth authority, and the adapter does not power
  the certified journeys, but the residue is a portability warning.
- Large production chunks remain a performance warning. Existing route
  splitting, bounded discovery/search pagination, lazy HLS loading, and query
  limits remain intact; no speculative optimization was added.

## Manual actions before wider public access

1. Enable Supabase **Authentication → Password Security → Leaked password
   protection** in the existing project when available, then rerun the Security
   Advisor. Do not bypass the control or change databases.
2. Complete the supported desktop/mobile H.264/AAC browser matrix and record
   initial playback, seeking, buffering, resume, invalid media, and mobile
   controls.
3. Recheck public signup after the Supabase rate-limit window resets. Escalate
   only if a single normal user submission still receives HTTP 429.

No further feature development is authorized by this gate.