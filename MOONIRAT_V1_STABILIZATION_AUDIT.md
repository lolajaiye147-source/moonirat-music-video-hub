# Moonirat V1 Stabilization Audit

**Audit date:** 2026-08-31  
**Backend:** Existing Supabase project `pfjwulgedqvtolaazdap`

## Repository and architecture findings

| Finding | Status | Evidence |
| --- | --- | --- |
| TanStack Start / React / TanStack Router architecture | PASS | Existing SSR entry, file-based routes, generated route tree, and Node Nitro build remain active. |
| Supabase as the only production data authority | PASS | Source data access uses the Supabase client; no Drizzle, Neon, Replit Postgres, Prisma, MongoDB, or MySQL production path was found. |
| Fake/demo/seed production data | PASS | No mock/demo/sample production arrays or fake-success timers were found. |
| Duplicate or nested production artifacts | PASS | Artifact tree and route structure were inspected; no duplicate app/backend tree was found. |
| Service-role isolation | PASS | Service-role configuration is server-only; browser code uses the publishable Supabase client. |
| Client/server boundary | PASS | Admin feedback and moderation mutations dynamically import the server-only Supabase admin client and validate access tokens/roles. |
| Existing migrations and ordering | PASS | Existing migrations remain intact; feedback grant hardening is a separate ordered migration after feedback creation. |
| Lovable scaffolding | WARN | The Vite build helper is still required by the current build, while the root error bridge and unreferenced OAuth adapter are residual cleanup debt. They do not control Supabase data/auth in certified journeys and are intentionally deferred unless they cause a real security, build, or deployment problem. |
| Environment configuration | PASS | Public Supabase values and server-only service-role configuration are separated; artifact routing uses the root preview path. |
| Route and SSR behavior | PASS | `/`, `/discover`, `/search`, `/auth`, `/reset-password`, `/feedback`, and `/sitemap.xml` returned HTTP 200. |
| Hydration behavior | WARN | Non-blocking React hydration mismatch warnings remain during client navigation on Search, Auth, Reset Password, and Feedback. |
| Runtime/network errors | PASS | Final browser smoke observed no app-caused 401, 403, 404, 429, or 500 requests and no blocking runtime crash. |

## Live Supabase findings

| Finding | Status | Evidence |
| --- | --- | --- |
| RLS on protected public tables | PASS | RLS is enabled on profiles, artists, videos, follows, playlists, playlist membership, watch history, video views, feedback submissions, and moderation actions. |
| Feedback ownership | PASS | Authenticated owners can insert/select their own feedback; cross-user reads and user updates/deletes were blocked and verified by persisted row state. |
| Feedback grants | PASS | Anonymous table access is revoked; authenticated users have only `SELECT` and `INSERT`; service-role mutations remain server-only. |
| Admin authorization | PASS | Admin list/update functions validate the Supabase access token and `admin` role before using service-role access. |
| Video-view bypass | PASS | Direct anonymous/authenticated `video_views` inserts remain unavailable; qualified views use the constrained RPC. |
| Storage policies | PASS | Public media reads and ownership-controlled avatar/thumbnail/video writes and deletes remain covered by Storage policies. |
| Foreign-key/query indexes | PASS | Existing important indexes and feedback lookup indexes were inspected; no speculative duplicate indexes were added. |
| Catalog state | WARN | Live videos, artists, and profiles are currently zero, so data-dependent playback/pagination journeys cannot be freshly exercised in this environment. |

## Authentication findings

| Finding | Status | Evidence |
| --- | --- | --- |
| Sign-in/sign-out/session behavior | PASS | Existing disposable-account evidence covers authentication and protected-route behavior. |
| Password reset | PASS | Reset route rendered and prior disposable verification covered recovery and re-login. |
| Signup request behavior | PASS | The auth route sends one `signUp` call per intentional submit and disables the button while pending; no automatic retry or fake success exists. |
| Supabase signup rate limit | WARN | A public signup attempt received HTTP 429 after repeated certification activity. The UI remains truthful and does not retry automatically. |
| Leaked Password Protection | MANUAL_ACTION_REQUIRED | The live Supabase control remains disabled/unavailable and must be enabled manually when available. |

## Playback findings

| Browser/environment | Status | Result |
| --- | --- | --- |
| Restricted Chromium fixture playback | MANUAL_ACTION_REQUIRED | Valid H.264/AAC MP4, MIME, byte-range, and source checks passed previously, but this runtime cannot decode the codec. This limitation does not justify another video format or pipeline. |
| Chrome desktop with H.264 support | MANUAL_ACTION_REQUIRED | Requires manual validation. |
| Firefox desktop with platform codecs | MANUAL_ACTION_REQUIRED | Requires manual validation. |
| Safari desktop | MANUAL_ACTION_REQUIRED | Requires manual validation. |
| iOS Safari | MANUAL_ACTION_REQUIRED | Requires manual validation. |
| Android Chrome | MANUAL_ACTION_REQUIRED | Requires manual validation. |
| Invalid media/error handling | PASS | Existing player behavior distinguishes unsupported codecs and playback failures without manufacturing a successful view. |
| View threshold/cooldown | PASS | Existing evidence covers the three-second contiguous threshold, seeking/buffering resistance, and 24-hour cooldown. |

## Performance and mobile findings

| Finding | Status | Evidence |
| --- | --- | --- |
| Route splitting and bounded discovery/search | PASS | Existing continuation pagination and route-level chunks remain active. |
| Query limits and N+1 risk | PASS | Data-access queries use bounded limits and existing joins; no obvious unbounded/N+1 production read was found. |
| Bundle size | WARN | Production build completes, but the largest existing client chunks remain above the Vite advisory threshold. No speculative rewrite was made. |
| Mobile layout/navigation | PASS | Desktop and 375×812 smoke tests found no horizontal overflow or bottom-navigation overlap on checked routes. |
| Accessibility basics | PASS | Labels, visible form controls, required-field browser validation, and usable mobile touch targets were observed on tested routes. |

## Release-candidate conclusion

- No genuine P0 or P1 product/security-code blocker was discovered.
- The release candidate is suitable for a **small controlled beta**.
- It is not ready for a wide public launch until Leaked Password Protection
  and the supported-browser H.264/AAC matrix are resolved.
- Remaining warnings are separated into manual Supabase configuration,
  supported-browser environment limitations, authentication rate-limit
  monitoring, hydration cleanup, and existing bundle-size debt.