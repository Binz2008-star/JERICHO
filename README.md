# JERICHO (provisional name; trademark not cleared)
Chat-first AI app builder. Describe it → watch it work → improve it.
## Local setup
```
corepack enable && pnpm install
pnpm check            # typecheck + tests + build
pnpm --filter @jericho/api dev
pnpm --filter @jericho/web dev
```
Copy `.env.example` to `.env`; fill only placeholders you own. Status: see `AI_WORKSPACE/PROGRESS.md`.

## API runtime (Node.js >=22.16)

The API deliberately uses Node's built-in TypeScript type stripping. Its `build`
command typechecks and copies `.ts` runtime files into `apps/api/dist`; it **does not**
transpile to JavaScript. Run from an installed pnpm workspace so `@jericho/shared`
is available; standalone copying of `dist` without its workspace dependencies is not
supported. Node's `--experimental-strip-types` flag is required on Node 22.

```bash
pnpm --filter @jericho/api build
pnpm --filter @jericho/api smoke
pnpm --filter @jericho/api start
```

Do not deploy the API until the target runtime meets this requirement and the
remote CI smoke test passes. No real authentication, data persistence or sandbox
exists at the foundation milestone.
