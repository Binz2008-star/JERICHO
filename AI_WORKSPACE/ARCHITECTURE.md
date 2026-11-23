# Architecture (current vs planned)
Implemented: packages/shared (run states, schemas), packages/i18n, apps/api (health + validation only), apps/web (Start screen only).
Planned: control plane DB, AI orchestrator, builder worker, packages/sandbox (E2B), packages/db, SSE events, version snapshots.
Boundary: generated apps run only in sandboxes; never access the control DB.
