# Security
Implemented+tested: path-traversal guard (`isSafeProjectPath`), strict input schemas, no client-supplied tenant IDs.
Not implemented: auth, authz, tenant isolation, rate limiting, secret redaction, audit log, sandbox, preview access control.
Rules: no secrets in repo/CI logs; `.env.example` placeholders only; generated apps never touch the control DB.

## Added 2026-11-23 (local only)
Tested: generated-app HTML escaping (XSS), request-size limit (413), input validation (400), CSP + nosniff headers, atomic writes, corrupt-data refusal, sandbox path-traversal rejection, env scrubbing (host env not visible to child), start timeout + cleanup, max-lifetime kill.
Known gaps: LocalProcessSandbox shares host network/filesystem (SSRF/egress NOT mitigated); no per-sandbox CPU/memory limits; preview has no auth; abuse/phishing policy and content filtering absent; no package allowlist (templates are zero-dependency).
