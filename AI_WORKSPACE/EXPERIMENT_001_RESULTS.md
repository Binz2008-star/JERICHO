# Experiment 001 results (2026-11-23)
Runs: 15 per locale x 2 locales = 30 full lifecycles. Node v22.23.5, linux.
Lifecycle assertions failed: **0**

| Stage | n | p50 ms | p95 ms | max ms |
|---|---|---|---|---|
| interpret (deterministic) | 30 | 0.0 | 0.1 | 1.4 |
| render template | 30 | 0.1 | 0.1 | 0.2 |
| sandbox start -> listening | 30 | 43.0 | 54.4 | 67.7 |
| first GET / 200 | 30 | 4.3 | 7.7 | 47.6 |
| TIME TO FIRST PREVIEW (total) | 30 | 47.5 | 72.5 | 103.6 |
| create booking (HTTP) | 30 | 3.0 | 5.9 | 7.5 |
| restart + read persisted | 30 | 48.0 | 50.3 | 55.7 |
| apply change -> new preview | 30 | 49.2 | 53.6 | 89.1 |
| undo -> restored preview | 30 | 51.4 | 56.1 | 57.0 |
