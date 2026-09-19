# Moonirat V1 Beta Issue Log

**Log start date:** 2026-08-31  
**Scope:** Controlled-beta observations only  
**Current state:** No P0/P1 beta issues recorded

## Severity policy

- **P0:** Security issue, data loss, or application unusable.
- **P1:** Core viewer or creator journey broken.
- **P2:** Important usability or reliability problem.
- **P3:** Minor or cosmetic issue.

Only P0/P1 issues authorize immediate engineering work during the controlled
beta. P2/P3 issues remain collected for review and do not become speculative
features.

## Issue records

No controlled-beta issue has been recorded yet. Existing stabilization
warnings and manual actions remain documented in
`MOONIRAT_V1_FINAL_STABILIZATION_REPORT.md` and are not reclassified as new
beta incidents without real cohort evidence.

## Required issue template

Every discovered issue must have all fields below:

```text
DATE:
SEVERITY: P0 | P1 | P2 | P3
USER_TYPE: viewer | follower | creator | administrator | signed-out
JOURNEY: viewer | creator | admin | feedback | authentication | other
DESCRIPTION:
REPRODUCTION:
IMPACT:
STATUS: OPEN | INVESTIGATING | FIXED | VERIFIED | DEFERRED
FIX_REQUIRED: YES | NO
```

## Logging rules

- Record the exact observed behavior and reporting window.
- Include the smallest reproducible path without storing secrets or
  unnecessary personal data.
- Link the relevant feedback submission or audit evidence through authorized
  internal systems rather than copying private content into this log.
- A P0/P1 must be escalated before unrelated changes are made.
- A fix is not `VERIFIED` until the affected journey and an adjacent journey
  have been retested against real Supabase behavior.