# Moonirat V1 Final Stabilization Report

**Report date:** 2026-08-31  
**Backend:** Existing Supabase project `pfjwulgedqvtolaazdap`  
**Release scope:** Small controlled beta

## Required status fields

V1_STATUS: CONDITIONAL_PASS
VIEWER_JOURNEY: PASS
CREATOR_JOURNEY: PASS
ADMIN_JOURNEY: PASS
FEEDBACK_JOURNEY: PASS
AUTH: PASS
RLS: PASS
DATABASE: PASS
STORAGE: PASS
VIEW_TRACKING: PASS
UPLOAD_RECOVERY: PASS
STORAGE_CLEANUP: PASS
PLAYBACK: MANUAL_ACTION_REQUIRED
DISCOVERY_SCALE: PASS
SEARCH_SCALE: PASS
MOBILE: PASS
SSR: PASS
TYPECHECK: PASS
BUILD: PASS
SECURITY: PASS
PERFORMANCE: WARN
SUPABASE_RATE_LIMITING: PASS
LEAKED_PASSWORD_PROTECTION: MANUAL_ACTION_REQUIRED
MP4_BROWSER_MATRIX: MANUAL_ACTION_REQUIRED
PUBLIC_BETA_READY: CONDITIONAL_PASS
P0_BLOCKERS: PASS
P1_BLOCKERS: PASS
WARNINGS: WARN
MANUAL_ACTIONS: MANUAL_ACTION_REQUIRED
FINAL_RECOMMENDATION: CONDITIONAL_PASS

## Meaning of the conditional pass

`CONDITIONAL_PASS` is an approval boundary, not a statement that the product
is broken. Moonirat has passed enough engineering validation to place a small
number of real viewers, followers, creators, and administrators on the
platform safely. The condition limits the cohort and keeps a small set of
manual or environment-dependent validations open; it does not authorize a
wide public launch.

## A. What was actually fixed

- No new product feature work was added during stabilization.
- The existing feedback journey was reverified as the V1 feedback surface for
  both authenticated viewers and creators.
- Explicit feedback-table grants are present: anonymous access is revoked,
  authenticated users receive only `SELECT` and `INSERT`, and service-role
  updates remain server-only.
- The feedback migration and grant-hardening migration are present in the
  repository and applied to the existing Supabase project.
- No second database, backend, payment system, AI system, comments system,
  permanent transcoding pipeline, or mock feedback data was introduced.

## B. What was actually tested

### Repository and architecture

- Audited the Moonirat source, package manifest, routing, Supabase clients,
  server functions, migrations, and artifact configuration.
- Supabase remains the only active data and authentication authority.
- Service-role references are limited to server configuration, server-only
  admin functions, and an integration test script; no browser bundle imports
  the service-role client.
- No Drizzle, Neon, Replit Postgres, Prisma, MongoDB, MySQL, demo data, or
  fake-success implementation was found in the production path.
- TanStack Start, React, TanStack Router, Supabase Auth, PostgreSQL, Storage,
  RLS, and existing route splitting remain intact.

### Viewer, creator, admin, and feedback journeys

- Existing disposable end-to-end evidence covers viewer discovery, search,
  playback, follows, playlists, watch history, creator upload/recovery,
  profile/dashboard behavior, and admin authorization/moderation.
- The feedback journey was tested with a disposable authenticated session:
  required-field validation, one submission, duplicate-click prevention,
  “My Feedback,” admin search/filter/review, status and priority update,
  user-visible response, and non-exposure of internal notes.
- The feedback journey is role-neutral after authentication, so viewers and
  creators use the same ownership-protected submission and history flow.
- Ordinary users cannot perform admin feedback mutations. Admin server
  functions validate the access token and confirm the admin role before using
  the service role.
- All disposable feedback rows and authentication accounts were removed.

### Live Supabase and security

- Live RLS is enabled on profiles, artists, videos, follows, playlists,
  playlist-video membership, watch history, video views, feedback submissions,
  and moderation actions.
- Live feedback grants now show only authenticated `SELECT`/`INSERT` and
  service-role mutation privileges. Anonymous feedback access is absent.
- Live feedback RLS policies cover authenticated owner insert/select and
  server-authorized admin update behavior.
- RLS testing confirmed user A could not read, modify, or delete user B's
  feedback; signed-out insert was blocked; and owners could see an authorized
  status/response update.
- Storage policies remain present for public playback/thumbnail/avatar reads
  and ownership-controlled writes/deletes.
- Existing qualified view tracking remains protected by the constrained RPC;
  direct anonymous/authenticated `video_views` inserts remain unavailable.
- Existing important foreign-key and feedback indexes were inspected without
  adding speculative duplicates.

### Build, SSR, routes, and browser smoke

- `pnpm --filter @workspace/moonirat run typecheck` passed.
- `pnpm --filter @workspace/moonirat run build` passed.
- SSR smoke returned HTTP 200 for `/`, `/discover`, `/search`, `/auth`,
  `/reset-password`, `/feedback`, and `/sitemap.xml`.
- Desktop and 375×812 mobile browser smoke rendered Home, Discover, Search,
  Auth, Reset Password, and Feedback without blank pages or crashes.
- Signed-out behavior, truthful loading/empty states, fixed bottom navigation,
  form usability, and no horizontal overflow were verified.
- No failed browser network requests or app-caused 401, 403, 404, 429, or 500
  responses were observed in the final smoke pass.

## C. What remains

- Supabase Leaked Password Protection is still disabled and requires a manual
  action in the existing project.
- The restricted Chromium environment cannot decode the valid H.264/AAC MP4
  fixture. Supported-browser playback validation remains outstanding.
- A fresh disposable viewer signup was accepted by Resend from the verified
  `auth@moonirat.space` sender and showed the expected email-verification
  acknowledgement. The delivery-test user was deleted after verification.
  The application still sends one signup request per submit, disables the
  submit button while pending, does not auto-retry, and does not fake success.
- The custom server-only signup and recovery link path uses Supabase Admin link
  generation plus Resend; service-role and delivery credentials remain outside
  the browser bundle. Fresh inbox click-through remains an environment-limited
  warning, not an account-creation failure.
- Non-blocking React hydration mismatch warnings remain on Search, Auth, Reset
  Password, and Feedback during client navigation.
- Lovable scaffolding remains in the Vite build helper, root error-reporting
  bridge, and an unreferenced OAuth adapter. It does not control Supabase
  authentication or production data, but remains portability/cleanup debt.
  This is explicitly deferred unless it creates an actual security, build, or
  deployment problem.
- Existing production bundle-size warnings remain; route splitting, bounded
  queries, and lazy HLS loading are already in place.

## D. Genuine blockers

- No unresolved P0 or P1 product-code blocker was discovered for the
  controlled-beta journeys.
- The remaining launch risks are security configuration and supported-browser
  validation items, not missing V1 product functionality.
- A wide public launch should not be approved until Leaked Password Protection
  and the supported-browser MP4 matrix are resolved.

## E. Manual and environment limitations

- Enable Leaked Password Protection in Supabase Authentication → Password
  Security when available, then rerun the Security Advisor.
- Validate MP4 playback, seeking, buffering, resume, invalid media handling,
  view threshold/cooldown, and mobile controls in Chrome with H.264 support,
  Firefox with platform codecs, Safari, iOS Safari, and Android Chrome.
- The valid H.264/AAC MP4 remains the V1 playback format. A restricted test
  browser's codec limitation does not justify adding WebM, transcoding, or a
  new playback pipeline.
- Continue monitoring the verified Resend sender and perform one real inbox
  click-through for signup confirmation and password recovery when a controlled
  beta mailbox is available. Do not restore the Supabase demo-limited browser
  mail path or weaken authentication to bypass delivery limits.
- Hydration warnings and Lovable residue are non-blocking stabilization debt.
  Do not chase the Lovable residue unless it becomes an actual security, build,
  or deployment defect.

## F. Controlled-beta decision

Moonirat V1 is ready for a **small controlled beta** with invited viewers,
followers, creators, and administrators, subject to monitoring the documented
warnings. It is not ready for a wide public launch.

No additional feature development should begin after this gate.