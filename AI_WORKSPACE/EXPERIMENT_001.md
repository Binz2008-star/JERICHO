# Experiment 001 — risk spike (Proposed gates; results in EXPERIMENT_001_RESULTS.md)
Goal: de-risk generation reliability, sandbox lifecycle cost/latency, time-to-first-preview BEFORE building more UI.

## What was actually measured (local, 30 lifecycles)
Deterministic interpret -> static template render -> DEV local-process sandbox -> create booking -> restart (persistence) -> change theme -> undo.
Result: 0 assertion failures; code/data separation holds (undo reverts code, not data); XSS-escaped app name; 413/400 handling; corrupt data file is never overwritten.
Local first-preview p50 ~48 ms, p95 ~73 ms.

## What this does NOT prove (do not cite as evidence of the product working)
- LLM generation quality, latency, cost, or failure modes: NOT TESTED (BLOCKED: no provider key). The interpreter is keyword rules, labelled `dev-deterministic`.
- E2B cold start, install time, network, isolation, pricing: NOT TESTED (BLOCKED). `LocalProcessSandbox` is NOT isolated and is DEV ONLY.
- Dependency install (the generated app is zero-dependency by design; real apps are not). Expect seconds to minutes there, not milliseconds.
- Neon provisioning and migrations: NOT TESTED (BLOCKED).
- Browser rendering/RTL: NOT TESTED (HTML attributes asserted only).

## Unit-economics model (inputs unknown; do not fill with guesses)
cost_per_successful_app = (LLM cost per attempt x attempts per success) + sandbox seconds x price/sec + DB provisioning share.
Instrumented now: `computeRunCostMicroUsd` (prices injected, none hardcoded). Needed from live runs: tokens/run, attempts/success, sandbox seconds/run.

## Proposed go/no-go gates for the live spike (owner to approve thresholds)
1. >= 90% of a fixed 30-prompt AR/EN eval set reaches a verified preview within <= 3 attempts.
2. p95 time-to-first-preview <= 60 s including install.
3. Cost per successful app below an owner-set ceiling (verified pricing).
4. Zero cross-run data/secret leakage in isolation tests.
Next step to unlock: provider key + E2B authorization (or a Docker host for a stronger local adapter).
