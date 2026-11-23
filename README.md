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
