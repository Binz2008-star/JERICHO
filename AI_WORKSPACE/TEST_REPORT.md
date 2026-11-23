# Test report (2026-11-23)
`pnpm install` PASS · `pnpm typecheck` PASS · `pnpm test` PASS (shared 19, i18n 3, api 4; web none) · `pnpm build` PASS (vite 143.9 kB).
`pnpm audit --prod --audit-level=high`: initially 1 high (zod) + 1 moderate (@hono/node-server); fixed by upgrading to zod 4.6.6+ and @hono/node-server 2.1.3+; now clean. Re-ran `pnpm check` PASS (shared 19, i18n 3, api 4).
NOT TESTED: browser E2E, RTL rendering, live AI, sandbox, Neon, CI on GitHub.
