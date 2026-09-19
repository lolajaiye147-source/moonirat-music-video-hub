# Moonirat V1 Controlled Public Beta Readiness Gate

**Gate date:** 2026-08-31
**Repository/backend:** Existing Moonirat repository and Supabase project
`pfjwulgedqvtolaazdap`

## Final status fields

V1_STATUS: CONDITIONAL_PASS
VIEW_TRACKING: PASS
UPLOAD_RECOVERY: PASS
STORAGE_CLEANUP: PASS
DISCOVERY_SCALE: PASS
TYPECHECK: PASS
BUILD: PASS
SSR: PASS
RLS_SECURITY: PASS
STORAGE_SECURITY: PASS
LEAKED_PASSWORD_PROTECTION: MANUAL_ACTION_REQUIRED
MP4_COMPATIBILITY: BROWSER_LIMITATION
CREATOR_JOURNEY: PASS
VIEWER_JOURNEY: PASS
ADMIN_JOURNEY: PASS
FEEDBACK_JOURNEY: PASS
PUBLIC_BETA_READY: NO

## PASS

- TanStack Start, React, file-based routing, TanStack Query, Supabase Auth,
  PostgreSQL, Storage, RLS, and existing Realtime boundaries remain intact.
- TypeScript and the production client/SSR/Nitro build pass.
- SSR routes render through the registered Moonirat workflow.
- Existing RLS and ownership checks pass. Ordinary users cannot access admin
  operations, another user's private data, or another creator's content.
- Service-role credentials remain server-only and no production secret is
  committed.
- View tracking uses a durable three-second contiguous-play threshold and
  24-hour authenticated/anonymous cooldown. Seeking, pausing, buffering, and
  failed playback do not manufacture views. Direct `video_views` inserts are
  blocked.
- Creator uploads use real XHR progress, deterministic attempt IDs, bounded
  retries, object-existence recovery, and idempotent `videos.upload_id`
  publishing. Incomplete uploads do not become public.
- Admin moderation validates the access token and admin role server-side,
  removes the video and thumbnail Storage objects, then deletes the database
  row. Completed actions are durably audited.
- Discover and Search use bounded, stable, duplicate-free continuation pages.
  Browser certification expanded Discover from 12 to 24 unique cards and
  Search from 20 to 25 unique results.
- The live schema was inspected before index changes. Six requested indexes
  were already present and were not recreated. Only the missing
  `moderation_actions_actor_id_idx` was created and verified.
- Creator upload, viewer discovery/search/playback/follow/playlist/resume
  behavior, and admin authorization/removal were exercised with disposable
  live Supabase accounts. All disposable accounts, rows, objects, and
  temporary media were removed.
- Moonirat password authentication delegates to Supabase Auth
  `signInWithPassword`, server-generated signup/recovery links, and `updateUser`.
  Resend delivers the server-generated auth links from the verified
  `auth@moonirat.space` sender. The frontend has no independent
  password-strength policy.
- Disposable Supabase Auth verification passed login, recovery-link
  verification, password change, and re-login with HTTP 200. Passwords remained
  process-local and were not logged or persisted by Moonirat.
- Admin cleanup was verified authoritatively: target row count zero, video
  object count zero, thumbnail object count zero, and one completed audit row.
- The continuation run passed the Moonirat TypeScript check and isolated
  production build. The production Node SSR output returned HTTP 200 for `/`,
  `/discover`, `/search`, `/auth`, `/reset-password`, and `/sitemap.xml`.
- The live Supabase security structure still has RLS enabled on the relevant
  public tables, ownership/admin policies remain present, Storage object
  policies remain present, and `anon`/`authenticated` still lack direct
  `INSERT` on `video_views`.
- The beta feedback journey is implemented and certified for signed-out entry,
  authenticated viewer/creator submission and history, strict user isolation,
  server-authorized admin review, status/response visibility, error handling,
  and narrow mobile layouts. Disposable rows and users were removed.

## WARNINGS

- The available restricted Chromium runtime cannot decode the valid H.264/AAC
  MP4 fixture. Storage MIME type, byte-range delivery, and source validity pass;
  MP4 browser status is therefore `BROWSER_LIMITATION`, not a media/storage
  failure.
- The player now reports unsupported codecs distinctly and lazy-loads HLS.js.
  No permanent WebM derivative, transcoding service, or HLS pipeline was added.
- Supabase Performance Advisor reports informational unused-index warnings
  because the certification catalog is small, plus existing overlapping
  permissive SELECT policy notices. No RLS policy was weakened.
- Supabase Security Advisor warns that the intentionally constrained qualified
  view RPC is executable by anonymous and authenticated roles. This is the
  single hardened public write boundary; direct table inserts remain revoked.
- The former browser `signUp()` email-delivery path was replaced with a
  server-only Supabase Admin link-generation and Resend delivery path. A fresh
  disposable viewer signup was accepted by Resend after `moonirat.space` domain
  verification and the disposable user was removed. Inbox click-through was not
  freshly exercised in the restricted test environment.
- The 2026-08-31 continuation browser run reached the correct root routes and
  their empty states, but the live project contained zero videos, artists, and
  profiles. Playback, pagination with records, follow, playlist, resume,
  creator, and admin interactions therefore could not be freshly re-exercised.
  Their existing PASS fields retain the earlier disposable end-to-end evidence.
- A fresh disposable signup attempt was rejected by Supabase with HTTP 400
  `email_address_invalid`; the UI surfaced the returned message and no account
  was created.
- The feedback certification's public signup attempt was blocked by Supabase
  HTTP 429 rate limiting. The feedback journey itself was completed with an
  admin-created disposable account and independently verified in the database.
- The browser reported non-fatal React hydration mismatch warnings on
  Discover, Search, and Auth. The affected routes remained usable and did not
  crash, but the warnings should not be represented as a clean browser run.
- The workspace-wide aggregate build currently stops in the unrelated mockup
  sandbox because its build requires `PORT`. The Moonirat-specific production
  build—the gate target—passes.

## MANUAL ACTIONS

- Supabase Leaked Password Protection is currently unavailable/deferred and may
  require a paid Supabase plan. No plan change, new Supabase project, or
  replacement database is authorized for this gate.
- The live Supabase Security Advisor still reports
  `auth_leaked_password_protection` as disabled. This is a documented
  launch-gate exception and an incomplete security control, so the status is
  `MANUAL_ACTION_REQUIRED`, not `PASS`.
- Enable **Authentication → Password Security → Leaked password protection**
  in the existing Supabase project when it becomes available, then rerun the
  Security Advisor. Change the status to `PASS` only after the disabled warning
  disappears.
- Validate the direct H.264/AAC MP4 in desktop Chrome with H.264 support,
  desktop Firefox with platform codecs, desktop Safari, iOS Safari, and
  Android Chrome. Update `MP4_COMPATIBILITY` only from those results.

## BLOCKERS

- `LEAKED_PASSWORD_PROTECTION: MANUAL_ACTION_REQUIRED` remains unresolved
  because the live Security Advisor still reports it disabled.
- `MP4_COMPATIBILITY: BROWSER_LIMITATION` remains unresolved for the supported
  browser matrix because those runtimes are unavailable here.

## FINAL DECISION

The decision is `PUBLIC_BETA_READY: NO`.

The smallest actions required to reach YES are:

1. Enable Leaked Password Protection in the existing Supabase project when the
   setting is available, without changing plans or projects, and rerun the
   Security Advisor until the disabled warning is absent.
2. Complete the supported-browser H.264/AAC MP4 matrix.
