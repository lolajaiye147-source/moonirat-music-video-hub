# Moonirat V1 Controlled Beta Metrics

**Metrics start date:** 2026-08-31  
**Purpose:** Operational monitoring for the small controlled beta  
**Data authority:** Existing Supabase tables, Auth records, Storage outcomes,
and existing application behavior

## Measurement rules

1. Use real beta data only.
2. Do not infer activity from page loads or local UI state.
3. Do not add analytics infrastructure solely to fill a metric gap.
4. Record `NOT_ENOUGH_DATA` when the current schema or beta cohort does not
   support a trustworthy value.
5. Report counts for a fixed period, with the period and query timestamp.
6. Avoid exposing user identity in operational summaries; use aggregates and
   access-controlled admin queries.
7. A metric is not a product success criterion until there is enough real beta
   usage to establish a baseline.

## Current baseline

Because the live catalog is empty and the controlled beta has not accumulated
real user activity, the current values are:

| Metric group | Current value |
| --- | --- |
| Invited users | `NOT_ENOUGH_DATA` |
| Activated users | `NOT_ENOUGH_DATA` |
| Weekly active users | `NOT_ENOUGH_DATA` |
| Returning users | `NOT_ENOUGH_DATA` |
| Creators onboarded | `NOT_ENOUGH_DATA` |
| Videos uploaded/published | `NOT_ENOUGH_DATA` |
| Videos watched | `NOT_ENOUGH_DATA` |
| Qualified views | `NOT_ENOUGH_DATA` |
| Follows/playlists | `NOT_ENOUGH_DATA` |
| Reliability rates | `NOT_ENOUGH_DATA` |
| Retention and conversion | `NOT_ENOUGH_DATA` |

The zero-row live catalog is an environment state, not a fabricated claim that
beta engagement is zero.

## Metric source map

### Users

| Metric | Existing source | Definition | Status |
| --- | --- | --- | --- |
| Invited users | Operator cohort list; no in-app invitation table | Number of people explicitly included in the beta cohort | `NOT_ENOUGH_DATA` until the cohort list is maintained |
| Signups | Supabase Auth `auth.users.created_at` | New Auth users during the reporting window | Available without new app telemetry |
| Activated users | Supabase Auth plus `profiles.created_at` | Signed-up users who complete profile setup | Available as an operational query once cohort data exists |
| Weekly active users | Existing authenticated activity timestamps where available | Distinct beta users with qualifying activity in the last 7 days | `NOT_ENOUGH_DATA`; no universal activity-event table exists |
| Returning users | Existing activity timestamps | Users active in two or more reporting periods | `NOT_ENOUGH_DATA` until real activity history exists |

### Creators

| Metric | Existing source | Definition | Status |
| --- | --- | --- | --- |
| Creators onboarded | `artists.created_at` | Artist profiles created during the window | Available |
| Creators who upload | `videos.user_id`, `videos.created_at` | Distinct creator users with at least one video row | Available |
| Creators who upload repeatedly | `videos.user_id`, `videos.created_at` | Distinct creators with two or more uploads in the defined period | Available after real usage |
| Videos uploaded | `videos.created_at` | Video rows created during the window | Available |
| Videos published | `videos.is_public`, `videos.updated_at` | Videos transitioned to public state, using the available publication state | Available with the limitation that publication-transition history is not separately stored |
| Verification applications | `artists.verified`, `artists.updated_at` | Current verification state and changes observed during the window | Available only as state/change evidence; no separate application-event table exists |

### Viewers

| Metric | Existing source | Definition | Status |
| --- | --- | --- | --- |
| Videos watched | `watch_history.video_id`, `last_watched_at` | Distinct videos with persisted watch progress in the window | Available after real usage |
| Qualified views | `video_views.video_id`, `viewer_id`, `created_at` | Rows created by the qualified-view RPC after the contiguous threshold | Available |
| Follows | `follows.artist_id`, `follower_id`, `created_at` | Follow rows created in the window | Available |
| Playlists | `playlists.user_id`, `created_at` | Playlists created in the window | Available |
| Returning viewers | `watch_history.last_watched_at` and qualified-view timestamps | Viewers active in multiple periods | Available after real usage |
| Watch completion | `watch_history.completed` | Progress records marked complete by the existing 95% rule | Available where watch history is persisted |

### Feedback and safety

| Metric | Existing source | Definition | Status |
| --- | --- | --- | --- |
| Feedback submissions | `feedback_submissions.created_at` | Submissions by category and priority | Available |
| Feedback complaints | `feedback_submissions.type`, `status`, `priority` | Upload, playback, auth, discovery, and general complaints | Available |
| Moderation actions | `moderation_actions.created_at`, `action`, `status` | Moderation attempts and completed/failed outcomes | Available |
| Upload failures | Existing upload UI errors and operational logs | Failed or abandoned upload attempts | `NOT_ENOUGH_DATA`; no durable upload-attempt table exists |
| Playback failures | Existing player error handling and operational logs | Playback errors by environment/media | `NOT_ENOUGH_DATA`; no durable playback-error event table exists |
| HTTP errors | Workflow/browser logs and incident records | App-caused 4xx/5xx errors during the window | Available operationally, not as a durable Supabase metric |

## Reliability and engagement calculations

When enough real data exists, calculate:

- **Upload reliability:** completed/published uploads ÷ initiated uploads,
  only if initiated-upload counts are recorded consistently.
- **Playback reliability:** successful starts ÷ attempted starts, only if
  attempts and failures are observed through the same operational method.
- **Follow conversion:** distinct followers ÷ distinct viewers who watched a
  creator video in the same period.
- **Creator retention:** creators active in the next period ÷ creators active
  in the baseline period.
- **Viewer retention:** returning viewers in the next period ÷ viewers active
  in the baseline period.
- **Repeat upload rate:** creators with two or more uploads ÷ creators who
  uploaded.
- **Repeat viewing rate:** returning viewers ÷ viewers with at least one
  persisted watch activity.

Do not calculate a rate when its numerator or denominator is
`NOT_ENOUGH_DATA`, zero without a meaningful cohort, or collected through
incompatible sources.

## Beta review cadence

### Each operating day

- Review signup/auth failures and any HTTP 4xx/5xx incidents.
- Review upload failures, playback complaints, and feedback submissions.
- Review moderation and verification actions for failed outcomes.
- Confirm no new P0/P1 issue is being hidden as a P2/P3 item.

### Weekly

- Record the metric groups above for the fixed reporting window.
- Compare creator repeat uploads, viewer return activity, follows, qualified
  views, and feedback categories.
- Review Storage cleanup and moderation outcomes.
- Record a short operational note with evidence links or query timestamps.

### Beta exit

Do not create a beta exit recommendation until there is sufficient real usage
to evaluate reliability, viewer return, follow conversion, creator repeat
uploads, and feedback resolution. At that point create
`MOONIRAT_V1_CONTROLLED_BETA_EXIT_REPORT.md` with the required exit fields.