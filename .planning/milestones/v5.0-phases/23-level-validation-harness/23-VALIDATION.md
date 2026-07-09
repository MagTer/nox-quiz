---
phase: 23
slug: level-validation-harness
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-05
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (project canon) — `smoke-progress.mjs`'s `check(cond, msg)` + failure-counter + `process.exit(1)` idiom IS this project's unit-test layer |
| **Config file** | none — direct `node scripts/*.mjs` invocation |
| **Quick run command** | `node scripts/validate-levels.mjs` |
| **Full suite command** | `node scripts/validate-levels.mjs && bash scripts/check-gate.sh && bash scripts/check-import-safety.sh && bash scripts/check-safety.sh && node scripts/smoke-progress.mjs` |
| **Estimated runtime** | ~5 seconds (validator + static gates are pure-data/no-browser; excludes the one-time manual calibration probe and the interactive audit, which are not part of this quick loop) |

---

## Sampling Rate

- **After every task commit:** `node scripts/validate-levels.mjs` (fast, pure-data, no browser — safe after every task touching `scripts/lib/reachability.mjs` or `scripts/lib/over-hole-check.mjs`)
- **After every plan wave:** Full suite (validator + all 4 existing static gates + smoke-progress)
- **Before `/gsd-verify-work`:** Full suite must be green, PLUS the RED-first proof recorded in `23-FINDINGS.md` must exist (a one-time, deliberate RED against untouched levels 1–4 — do NOT green up the validator against them in this phase; that is Phase 24's job)
- **Max feedback latency:** ~5 seconds (quick loop); the calibration probe and interactive audit retry harness are manual/interactive and run outside this latency budget

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD-reachability | TBD | 0 | VALID-01 | — | Malformed descriptor never throws — `?? []`-guarded per `build.js` convention | unit (pure-data) | `node scripts/validate-levels.mjs` | ❌ W0 | ⬜ pending |
| TBD-over-hole | TBD | 0 | VALID-01 | — | N/A | unit (pure-data) | `node scripts/validate-levels.mjs` | ❌ W0 | ⬜ pending |
| TBD-fixture-selftest | TBD | 0 | VALID-01 | — | N/A | integration (pure-data) | `node scripts/validate-levels.mjs --fixture scripts/fixtures/bad-level.js` (naming at implementer's discretion) | ❌ W0 | ⬜ pending |
| TBD-calibration | TBD | 0 | VALID-02 | T-23-01 | Any local server the probe stands up must replicate `browser-boot.mjs`'s CR-02 path-traversal guard + loopback-only bind | manual-only (one-time Playwright probe) | `node scripts/calibrate-jump-envelope.mjs` (human-reviewed, then frozen into a constant) | ❌ W0 | ⬜ pending |
| TBD-red-proof | TBD | 0 | VALID-02 | — | N/A | integration (pure-data) — this IS the RED-first proof, recorded in `23-FINDINGS.md` | `node scripts/validate-levels.mjs` against unmodified `src/levels/*.js` | ❌ W0 (depends on validator existing) | ⬜ pending |
| TBD-retry-harness | TBD | 0 | VALID-03 (groundwork) | — | N/A | manual/interactive (real browser, cannot be a fast unit test) | `node scripts/audit-phase21-mechanics.mjs` (upgraded) or a 23-named successor | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Task IDs are TBD — the planner assigns real task/plan IDs; this map records the requirement→test binding established by research so the planner does not drop coverage.*

---

## Wave 0 Requirements

- [ ] `scripts/lib/reachability.mjs` — BFS + Δy-aware jump-edge model (VALID-01)
- [ ] `scripts/lib/over-hole-check.mjs` — promotes Phase 22's proven exact-interval-arithmetic logic (VALID-01)
- [ ] `scripts/validate-levels.mjs` — orchestrator entry point, iterates `LEVEL_ORDER` (VALID-01)
- [ ] `scripts/calibrate-jump-envelope.mjs` — one-time Playwright probe (VALID-02)
- [ ] `scripts/fixtures/bad-level.js` (or equivalent) — recommended self-test fixture (not CONTEXT-required, strongly recommended per the `bad-scene.js` "deliberately-bad fixture proves the checker goes RED" convention already established in this repo)
- [ ] Retry-wrapper module wrapping `mechanic-drive.mjs`'s unmodified exports — interactive audit upgrade (VALID-03 groundwork)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| Jump envelope empirical measurement | VALID-02 | CONTEXT explicitly locks this as a manually-invoked, non-routine script — automating it into the per-commit path would violate the "does NOT launch a browser on every invocation" constraint | Run `node scripts/calibrate-jump-envelope.mjs` once; a human reviews the sampled rise/run values and variance, then the chosen constant + safety margin is frozen into `scripts/lib/reachability.mjs` with the raw measurement documented in a comment |
| Interactive mechanic-drive blind-spot reduction | VALID-03 (groundwork) | Drives the real running game end-to-end via Playwright — inherently a real-browser interactive audit, not a fast automated unit test | Run the upgraded retry-wrapper script against levels 1–4; confirm the previously-unreached encounters now register as reached across the retry budget (3–5 attempts), and that every still-unreached encounter after retries is documented in `23-FINDINGS.md` with level+position+mechanic+technical reason |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (calibration + interactive audit are the two explicit manual-only exceptions, documented above)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (the two manual-only items are isolated, bracketed by automated validator/gate runs)
- [x] Wave 0 covers all MISSING references (6 new files listed above, none exist yet)
- [x] No watch-mode flags
- [x] Feedback latency < 5s (quick loop; manual-only items excluded from this budget by design)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-05 (autonomous pipeline — Nyquist structure verified against RESEARCH.md's Validation Architecture section; no human UI/UX judgment required for this dev-tooling phase)
