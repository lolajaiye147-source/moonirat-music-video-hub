---
name: GitHub source of truth
description: Project workflow decision for keeping the GitHub repository authoritative.
---

The GitHub repository is the authoritative source for project code. Local workspace contents should be synchronized from the repository before development work, and changes should not replace or contradict the remote source without an intentional GitHub update.

**Why:** The user explicitly designated GitHub as the source of truth.

**How to apply:** Use the repository's default branch for syncs, keep credentials and local-only environment values out of source imports, and treat local generated or starter files as disposable when reconciling the project. GitHub HTTPS pushes require standard Basic auth with the protected token; bearer-header fetches may be rejected by Git transport.