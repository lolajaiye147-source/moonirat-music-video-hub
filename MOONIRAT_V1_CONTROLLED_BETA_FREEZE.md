# Moonirat V1 Controlled Beta Freeze

**Freeze date:** 2026-08-31  
**Release status:** Small controlled beta only  
**Backend authority:** Existing Supabase project `pfjwulgedqvtolaazdap`

## Frozen product promise

Moonirat V1 is feature-frozen around:

**Upload → Discover → Watch → Follow**

The beta is intended to validate reliable use by both viewers/followers and
creators/artists, with administrators operating the safety and review loop.

## Frozen viewer loop

**Discover → Search → Watch → Follow → Playlist → Feedback**

Included behavior:

- Public Home, Discover, Search, artist, and video routes.
- Signed-out playback where a valid public video exists.
- Authentication, logout, protected routes, and session persistence.
- Follow persistence and follower state.
- Playlist creation and video membership persistence.
- Watch progress/resume and qualified view tracking.
- Authenticated feedback submission and owner-visible feedback history.

## Frozen creator loop

**Create Artist Profile → Upload → Publish → Dashboard → Analytics →
Verification → Feedback**

Included behavior:

- Profile and artist-profile creation/editing.
- Direct MP4 upload with progress and recoverable upload behavior.
- Video metadata creation, publication, editing, and deletion.
- Creator dashboard view and follower/view totals.
- Verification request/review state using the existing artist/admin flow.
- Authenticated creator feedback submission and history.

## Frozen administrator loop

**Authenticate → Verify Creators → Moderate Videos → Review Feedback → Audit**

Included behavior:

- Server-authorized admin access.
- Creator verification review.
- Video moderation with Storage cleanup.
- Feedback queue search/filter/review and user-visible response.
- Internal notes that remain hidden from submitting users.
- Moderation audit trail.

## Beta operating limits

- Recommended initial cohort: **5–15 creators** and **20–50
  viewers/followers**.
- Use invitation-led, manually controlled onboarding and active feedback
  collection.
- The current application does not enforce an invitation-only allowlist.
  Do not invent a large access-control system for this freeze; keep the
  registration link out of broad public promotion and onboard the approved
  cohort manually.
- This freeze is not approval for unrestricted public registration or a wide
  public launch.

## Change policy

No new V1 functionality should be added during the beta. Only P0 or P1 issues
authorize an immediate engineering change:

- **P0:** security issue, data loss, or app unusable.
- **P1:** core viewer or creator journey is broken.
- **P2:** important usability or reliability problem; collect for review.
- **P3:** cosmetic or minor improvement; defer.

Any P0/P1 fix must remain the smallest safe Supabase/TanStack Start-compatible
change, be re-tested on the affected journey and adjacent journey, and be
recorded in the beta issue log.

## Explicitly out of scope

- Monetization, Stripe, ads, and subscriptions.
- AI, recommendation engines, comments, or new social features.
- Microservices, another database, another backend, or architecture rewrites.
- Permanent WebM derivatives, speculative transcoding, or HLS infrastructure.
- Unnecessary Realtime or analytics infrastructure.
- Mock, demo, or seed data presented as real production content.

## Explicitly deferred stabilization work

- Residual Lovable scaffolding is monitored only. Do not remove or refactor it
  during the beta unless it creates a concrete security, build, or deployment
  problem.
- The validated H.264/AAC MP4 remains the only V1 playback format. Do not add
  another video format, transcoding, or playback pipeline solely because the
  restricted test browser cannot decode the valid media.

The next planned decision is a beta exit decision based on real usage evidence,
not a V1.1 feature roadmap.