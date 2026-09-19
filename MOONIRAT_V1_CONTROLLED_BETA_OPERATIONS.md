# Moonirat V1 Controlled Beta Operations

**Operations phase:** Product validation only  
**Start date:** 2026-08-31  
**Release status:** `CONDITIONAL_PASS` for a small controlled beta  
**V1 scope:** Upload → Discover → Watch → Follow  
**Backend:** Existing Supabase project `pfjwulgedqvtolaazdap`

## What the conditional pass means

`CONDITIONAL_PASS` is not evidence that Moonirat is broken. It means the
engineering validation is sufficient to put a small number of real people on
the product safely, while a few manual or environment-dependent validations
remain open. Keep the cohort controlled and do not interpret this as approval
for a wide public launch.

## Operating rule

Moonirat V1 is frozen. This document is an operating procedure, not a feature
roadmap. Do not modify application code unless a real P0 or P1 production
defect is discovered.

Do not add monetization, ads, AI, comments, recommendations, microservices,
Stripe, another backend/database, transcoding, WebM derivatives, unnecessary
Realtime, or speculative infrastructure.

The validated H.264/AAC MP4 playback strategy remains unchanged. A restricted
testing browser's codec limitation is not a production failure and does not
justify another video format or pipeline.

Residual Lovable scaffolding is deferred. Investigate it only if it creates a
concrete security, build, or deployment problem.

## Initial cohort

- **Creators:** 5–15 initial creators.
- **Viewers/followers:** 20–50 initial users.
- Access should be invitation-led and manually controlled.
- The current application does not enforce an in-app invitation allowlist.
  Keep registration out of broad public promotion and onboard the approved
  cohort manually rather than creating a new access-control system for V1.
- Collect active feedback from every cohort group.
- Do not treat the controlled beta as approval for a wide public launch.

## Before each onboarding wave

1. Confirm the existing Supabase environment and server-only configuration are
   available without exposing service-role credentials.
2. Confirm authentication, logout/login, protected routes, and truthful
   rate-limit errors.
3. Confirm RLS, ownership boundaries, admin authorization, Storage policies,
   moderation authorization, and verification authorization.
4. Confirm upload recovery, Storage cleanup, qualified view tracking,
   pagination, invalid-media handling, and mobile navigation.
5. Confirm the latest stabilization report still shows no P0/P1 blocker.
6. Give each participant the journey checklist and the feedback route.

Use real Supabase data only. Do not seed or fabricate a catalog for reporting.

## Journeys to observe

### Viewer

**Signup/Login → Discover → Search → Watch → Follow → Playlist → Feedback**

Record whether the participant can complete the journey, where they stop, and
the exact error or user-visible behavior. Observe return activity in a later
period rather than inferring retention from a single session.

### Creator

**Signup/Login → Create Artist Profile → Upload → Publish → Dashboard →
Analytics → Verification → Feedback**

Record upload progress, recovery after interruption, publication state,
dashboard persistence, verification state, and any failure. Do not report
success based only on a toast or local UI state; verify persisted Supabase
state.

### Administrator

**Login → Review creators → Moderate videos → Review feedback → Audit activity**

Verify that admin actions are authorized, moderation removes the intended
content and Storage objects, feedback responses are user-visible while
internal notes remain private, and the audit trail records the outcome.

## Metrics

Track real observations only. Use `NOT_ENOUGH_DATA` when a metric has no
trustworthy beta value. The active ledger is
`MOONIRAT_V1_BETA_METRICS.md`; the source definitions and calculation rules
are in `MOONIRAT_V1_CONTROLLED_BETA_METRICS.md`.

Track where available:

- invited, activated, and returning users;
- creators onboarded, uploading, and uploading repeatedly;
- videos uploaded and published;
- qualified views, follows, and playlists;
- feedback submissions and verification applications;
- upload, playback, authentication, and HTTP failures.

Do not invent invite counts, active-user counts, conversion rates, retention,
failure rates, or playback success from an empty catalog or code inspection.

## Daily operating review

- Review new feedback, especially upload, playback, authentication, and
  discovery complaints.
- Review authentication failures, HTTP errors, upload failures, playback
  failures, and failed moderation actions.
- Check that no P0/P1 report is being reclassified as a cosmetic issue.
- Confirm any reported data mutation persisted in Supabase.
- Record observed metrics or `NOT_ENOUGH_DATA` in the active ledger.

## Weekly operating review

- Review viewer return, follow activity, qualified views, and playlist use.
- Review creator repeat uploads, publication success, and verification flow.
- Review feedback response status and moderation audit outcomes.
- Compare reliability and engagement only across equivalent reporting windows.
- Keep P2/P3 issues in the issue log for review; do not convert them into
  immediate feature work.

## Remaining conditions

- `LEAKED_PASSWORD_PROTECTION: MANUAL_ACTION_REQUIRED` remains open until the
  live Supabase setting is enabled and verified.
- `MP4_BROWSER_MATRIX: MANUAL_ACTION_REQUIRED` remains open until Chrome,
  Firefox, Safari, iOS Safari, and Android Chrome are tested with the valid
  MP4.
- `SUPABASE_RATE_LIMITING: WARN` is monitored during normal individual signup,
  not repeated certification attempts.
- `PERFORMANCE: WARN` is measured with real beta behavior before any
  architectural change.
- Hydration warnings remain non-blocking.
- Lovable scaffolding remains deferred unless it causes a real security, build,
  or deployment problem.

## Issue handling

Use `MOONIRAT_V1_BETA_ISSUE_LOG.md` for every discovered beta issue.

- **P0:** Security issue, data loss, or application unusable.
- **P1:** Core viewer or creator journey broken.
- **P2:** Important usability or reliability problem.
- **P3:** Minor or cosmetic issue.

Only P0/P1 issues authorize immediate engineering work. If one is discovered,
stop unrelated work, preserve the exact evidence, and report the issue before
implementing a targeted fix. Re-test the affected and adjacent journeys after
any approved fix.

## Beta exit

Do not recommend a wider beta or public launch based only on code quality.
After sufficient real usage, generate
`MOONIRAT_V1_CONTROLLED_BETA_EXIT_REPORT.md` with measured activity,
reliability, retention, issue severity, and security evidence.

Until that evidence exists, the recommendation remains:

`EXTEND_CONTROLLED_BETA`
