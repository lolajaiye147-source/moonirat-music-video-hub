# Moonirat V1 Auth Certification

Date: 2026-08-31  
Scope: Universal Moonirat account signup and the optional artist-profile boundary  
Overall result: **CONDITIONAL_PASS**

`CONDITIONAL_PASS` means the account model and affected journeys are sufficiently
validated for the controlled-beta cohort. Normal viewer account creation and
Resend delivery are now working. The remaining warnings are confirmation-link
click-through and the existing non-auth launch controls documented below.

## Required status fields

ACCOUNT_CREATION: PASS
VIEWER_SIGNUP: PASS
EMAIL_CONFIRMATION: WARN
LOGIN: PASS
PASSWORD_RESET: WARN
CREATOR_CONVERSION: PASS
ADMIN_AUTH: PASS
RLS: PASS
TYPECHECK: PASS
BUILD: PASS

## Certified account model

```text
Moonirat Account
  → Viewer / Fan by default
  → optionally Create Artist Profile
  → Creator Dashboard
```

Normal signup does not create an artist row or request artist/stage identity.
Artist name, URL slug, and artist bio remain in the explicit Artist Dashboard
onboarding flow.

## Gate results

| Gate | Result | Evidence |
| --- | --- | --- |
| Universal signup UI | PASS | Signup asks for Display name, Email, Password, and Confirm password. Artist/stage wording is absent. |
| Client validation | PASS | Mismatched passwords produce `Passwords do not match` and send zero signup requests. |
| Duplicate submission protection | PASS | Rapid repeated clicks produced exactly one Supabase signup POST and one error notice. |
| Account creation through the production path | PASS | A fresh disposable viewer signup created an account and returned the generic verification acknowledgement after Resend accepted the message. |
| Viewer signup | PASS | The official Resend delivery-test recipient completed one signup submission without a provider error; the disposable auth user was then removed. |
| Email delivery | PASS | Resend accepted a message from the verified `auth@moonirat.space` sender using the branded verification template. |
| Email confirmation click-through | WARN | The current restricted test environment did not open the delivered message; link generation, HTTPS redirect, and delivery acceptance passed, but the final inbox click was not freshly exercised. |
| Password reset delivery | WARN | The custom recovery-link path is implemented and uses the same verified Resend sender, but a fresh inbox click-through was not performed in this certification run. |
| Session versus verification handling | PASS (code path) | A returned session navigates into the app; a successful signup without a session shows an email-verification message and remains logged out. |
| Normal profile creation | PASS | Disposable users received `profiles.display_name`; optional `profiles.username` remained null. |
| Viewer default state | PASS | Disposable viewer had no artist row and reached Profile, Playlists, Feedback, and Artist Dashboard routes. |
| Viewer persistence | PASS | A disposable playlist persisted after reload. |
| Explicit creator onboarding | PASS | A separate normal account had no artist until Artist Dashboard creation, then received exactly one artist and reached Upload. |
| Admin isolation | PASS | Disposable accounts had no privileged role; viewer access to Admin was denied. |
| Mobile auth/profile layout | PASS | 375×812 auth, profile, and artist-dashboard views had no horizontal overflow; password controls remained usable. |
| Typecheck | PASS | `pnpm --filter @workspace/moonirat run typecheck` |
| Production build | PASS | TanStack Start client, SSR, and Nitro build completed. |
| SSR smoke | PASS | `/auth`, `/profile`, and `/artist-dashboard` returned HTTP 200. |
| Disposable-data cleanup | PASS | Auth users, profiles, artists, playlists, feedback rows, and the Resend delivery-test user created for certification were removed. |

## Database compatibility correction

The profile-creation trigger now reads generic `display_name` metadata directly.
Legacy clients that send `username` still receive a display-name fallback.
Normal signup no longer copies a display name into the unique optional username
column, so viewers are not forced into an artist-like or globally unique identity.

## Security regression notes

- The profile trigger remains `SECURITY DEFINER` with a fixed `public` search path.
- Browser login uses Supabase Auth; server-only signup and recovery link generation
  uses the service-role client and Resend connector without exposing either
  credential to client code.
- New normal accounts receive no artist or admin role automatically.
- Auth email delivery uses the verified `moonirat.space` sender and branded
  verification/password-reset templates with plain-text alternatives.
- Supabase security advisors reported no new finding for this trigger change.
- Existing qualified-view RPC and leaked-password-protection advisories are
  unchanged and remain outside this correction.

## Non-auth observation

The browser run observed an existing `403 permission denied` response when
submitting feedback. This is separate from universal account creation and belongs
to the existing feedback-journey work; it was not expanded into this task.

## Decision

The universal account correction and production email delivery path are
implemented and certified for controlled beta. `ACCOUNT_CREATION = PASS`,
`VIEWER_SIGNUP = PASS`, and `EMAIL_DELIVERY = PASS`. `EMAIL_CONFIRMATION` and
`PASSWORD_RESET` remain `WARN` until a real inbox click-through is exercised.