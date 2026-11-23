# JERICHO agent instructions
Source of truth: `AI_WORKSPACE/` (start with PROGRESS.md, DECISIONS.md, SECURITY.md).
- Independent of Rico/ECO/Nexus/Project-X. Never touch them.
- Branch `feature/*` only. No merge to main, no force-push, no push/PR without owner approval.
- Gate: `pnpm check` (typecheck + test + build) must pass. Never report mocks as live integrations.
- Report unexercised integrations as NOT TESTED; missing credentials as BLOCKED.
- Never print secrets; env var names only. Never trust client-supplied user_id/workspace_id.
