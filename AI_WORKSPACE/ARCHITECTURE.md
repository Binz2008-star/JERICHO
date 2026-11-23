# Architecture (current vs planned)
Implemented: packages/shared (run states, schemas), packages/i18n, apps/api (health + validation only), apps/web (Start screen only).
Planned: control plane DB, AI orchestrator, builder worker, packages/sandbox (E2B), packages/db, SSE events, version snapshots.
Boundary: generated apps run only in sandboxes; never access the control DB.

## Added 2026-11-23
packages/sandbox: `SandboxAdapter` interface + `LocalProcessSandbox` (DEV ONLY). packages/builder: `AppSpec` (zod), deterministic dev interpreter, static booking template, `VersionStore`. packages/shared: cost accounting.
Flow (local): prompt -> AppSpec -> files -> sandbox -> preview; change -> new spec -> new snapshot; undo -> previous snapshot; data in separate file.
