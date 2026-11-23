# Test report (2026-11-23)
`pnpm install` PASS · `pnpm typecheck` PASS · `pnpm test` PASS (shared 19, i18n 3, api 4; web none) · `pnpm build` PASS (vite 143.9 kB).
`pnpm audit --prod --audit-level=high`: initially 1 high (zod) + 1 moderate (@hono/node-server); fixed by upgrading to zod 4.6.6+ and @hono/node-server 2.1.3+; now clean. Re-ran `pnpm check` PASS (shared 19, i18n 3, api 4).
NOT TESTED: browser E2E, RTL rendering, live AI, sandbox, Neon, CI on GitHub.

## Independent foundation hardening (2026-11-23)

- Corrected native Node TypeScript runtime import in `apps/api/src/server.ts`.
- Adjusted shared runtime exports to explicit `.ts` extensions; enabled TS extension checking.
- Added a Node 22 runtime `dist` artifact generation, `start` script and real `/health` process smoke test.
- CI now runs the smoke test after build.
- **LOCAL NOT TESTED:** pnpm install, typecheck, Vitest, API process smoke and browser E2E: this review environment cannot reach npm to obtain `pnpm@9.15.9` and dependencies (DNS `EAI_AGAIN`).
- **BLOCKED:** Dedicated gitleaks scan (not installed here). Regex-only secret scan remains insufficient for high-confidence public release.
- **NOT DEPLOYED:** No external database, AI provider, or E2B connection tested.
- GitHub Actions must verify this change before approval for merge.
