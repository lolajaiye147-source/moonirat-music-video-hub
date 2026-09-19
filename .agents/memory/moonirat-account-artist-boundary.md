---
name: Moonirat account-to-artist boundary
description: Product identity rule separating universal accounts from optional artist profiles.
---

Every Moonirat signup creates a normal viewer/fan account. Artist identity is
optional and must be created explicitly through the artist onboarding and
dashboard journey. Generic display names are not unique artist handles and must
not be copied into a uniqueness-constrained username field.

**Why:** Moonirat connects creators with viewers and followers; treating every
new account as an artist excludes the default audience and makes ordinary names
collide with artist/profile identity constraints.

**How to apply:** Keep normal signup limited to generic account information.
Only artist onboarding should ask for artist name, stage identity, artist URL,
or creator-specific biography and permissions.