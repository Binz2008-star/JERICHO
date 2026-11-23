# Security
Implemented+tested: path-traversal guard (`isSafeProjectPath`), strict input schemas, no client-supplied tenant IDs.
Not implemented: auth, authz, tenant isolation, rate limiting, secret redaction, audit log, sandbox, preview access control.
Rules: no secrets in repo/CI logs; `.env.example` placeholders only; generated apps never touch the control DB.
