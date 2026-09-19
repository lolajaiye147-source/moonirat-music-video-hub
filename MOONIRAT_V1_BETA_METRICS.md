# Moonirat V1 Beta Metrics

**Reporting mode:** Real beta observations only  
**Baseline date:** 2026-08-31  
**Current beta status:** Not yet populated with real cohort activity  
**Data authority:** Existing Supabase records and observed operational errors

## Rules

- Do not fabricate metrics from code inspection, empty catalog state, or local
  UI state.
- Use `NOT_ENOUGH_DATA` when there is no trustworthy real-beta observation.
- Record the reporting window and query/observation date when values become
  available.
- Keep user-level data access restricted to authorized operations/admin use.
- Do not add analytics infrastructure solely to fill a missing metric.

## Current baseline

The live catalog is empty and no controlled-beta cohort has produced a
reportable observation in this ledger. These values intentionally remain
`NOT_ENOUGH_DATA`; an empty catalog is not reported as zero engagement.

| Metric | Current value | Source/observation |
| --- | --- | --- |
| Invited users | `NOT_ENOUGH_DATA` | Operator-managed cohort list has not been populated |
| Activated users | `NOT_ENOUGH_DATA` | No real beta cohort activity recorded |
| Returning users | `NOT_ENOUGH_DATA` | Requires activity across multiple reporting periods |
| Creators onboarded | `NOT_ENOUGH_DATA` | No beta cohort activity recorded |
| Creators uploading | `NOT_ENOUGH_DATA` | No beta cohort activity recorded |
| Repeat creators | `NOT_ENOUGH_DATA` | Requires real creator upload history |
| Videos uploaded | `NOT_ENOUGH_DATA` | No beta cohort activity recorded |
| Videos published | `NOT_ENOUGH_DATA` | No beta cohort activity recorded |
| Qualified views | `NOT_ENOUGH_DATA` | No beta viewing activity recorded |
| Follows | `NOT_ENOUGH_DATA` | No beta follow activity recorded |
| Playlists | `NOT_ENOUGH_DATA` | No beta playlist activity recorded |
| Feedback submissions | `NOT_ENOUGH_DATA` | No new beta submission recorded |
| Verification applications | `NOT_ENOUGH_DATA` | No beta application activity recorded |
| Upload failures | `NOT_ENOUGH_DATA` | No durable upload-attempt event source |
| Playback failures | `NOT_ENOUGH_DATA` | No durable playback-error event source |
| Authentication failures | `NOT_ENOUGH_DATA` | No normal-cohort observation recorded |
| HTTP errors | `NOT_ENOUGH_DATA` | No beta incident window recorded |

## Source definitions

- **Users:** Supabase Auth users and profile timestamps where they support the
  definition. Invitation counts remain operator-managed because the app has no
  invitation table.
- **Creators:** `artists` and `videos`, using persisted creation/publication
  state.
- **Viewers:** `watch_history`, `video_views`, `follows`, `playlists`, and
  `playlist_videos`.
- **Feedback:** `feedback_submissions`, including type, priority, status, and
  response timestamps.
- **Verification:** existing artist verification state and its observed
  changes; there is no separate verification-application event table.
- **Moderation:** `moderation_actions`, including started, failed, and
  completed outcomes.
- **Upload/playback/auth/HTTP failures:** record only when observed in the
  operational review or a durable existing source. Do not infer them from
  successful page rendering.

Detailed query boundaries and rate calculations are maintained in
`MOONIRAT_V1_CONTROLLED_BETA_METRICS.md`.

## Update cadence

- Update after each onboarding wave with the cohort and reporting window.
- Review reliability and issue counts daily.
- Review retention, repeat uploads, follow conversion, and repeat viewing
  weekly once enough data exists.
- Create the beta exit report only after sufficient real usage exists.
