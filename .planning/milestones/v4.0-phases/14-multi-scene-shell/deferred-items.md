# Phase 14 — Deferred Items

Out-of-scope discoveries logged during execution (not fixed here per the SCOPE BOUNDARY rule).

| Date | Discovered in | Item | Status |
|------|---------------|------|--------|
| 2026-06-29 | 14-03 Task 1 | `scripts/smoke-progress.mjs:149` SAVE-03 statistical assertion (seeded table-7 share > 1.5× fresh baseline) is a **flaky Monte-Carlo test** — unseeded RNG over 2500 draws. Observed one near-miss (0.312 vs 0.328 threshold) in ~21 runs; 20/20 otherwise PASS. Pre-existing from Phase 11/13; this plan (14-03) writes no code and does not touch the progress layer, so it is out of scope. Recommend pinning a deterministic RNG seed or widening the margin / increasing DRAWS in a future progress-layer task. | deferred |
