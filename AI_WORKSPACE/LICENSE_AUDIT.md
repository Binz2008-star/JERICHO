# License audit
## bolt.diy (stackblitz-labs/bolt.diy @ 72db5ce, 2026-11-21) — Status: Verified (source inspection)
- Repo license: MIT (StackBlitz, Inc. + contributors). Fine for code reuse with notice.
- Depends on `@webcontainer/api` (pinned `1.6.5-internal.2`). README states WebContainers have separate commercial terms for enterprise deployment. MIT does not cover it.
- WebContainers coupling is deep: workbench stores (files, previews, terminal), preview, deploy components, root/entry.server.
- Architecture mismatch: browser-side WebContainers vs. JERICHO's server-side isolated sandbox (E2B), DB provisioning, persisted runs, tenant isolation.
- Not audited: full transitive dependency license scan (NOT TESTED).
## Recommendation: NO-GO for forking/embedding. Original focused workspace.
Allowed: study patterns (prompt structure, streaming UI) and reuse tiny MIT snippets with attribution after review. No brand/assets copied.
WebContainers commercial terms: owner decision needed only if browser-side execution is ever reconsidered.
