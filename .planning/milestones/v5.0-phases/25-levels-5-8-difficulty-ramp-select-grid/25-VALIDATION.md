---
phase: 25
slug: levels-5-8-difficulty-ramp-select-grid
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-06
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (project convention: no JS test framework — plain Node ES modules with a `check(cond, msg)`/`failures`-counter/`process.exit(1)` idiom, mirrored across every script) |
| **Config file** | none |
| **Quick run command** | `node scripts/smoke-progress.mjs` and `node scripts/validate-levels.mjs` (both fast, pure-data, no browser) |
| **Full suite command** | `bash scripts/check-gate.sh && bash scripts/check-safety.sh && bash scripts/check-progress.sh && node scripts/smoke-progress.mjs && node scripts/validate-levels.mjs && node scripts/browser-boot.mjs && node scripts/audit-phase21-mechanics.mjs` |
| **Estimated runtime** | ~30-60s for quick commands; several minutes for the full suite (Playwright-driven scripts) |

---

## Sampling Rate

- **After every task commit:** `node scripts/validate-levels.mjs` (fast, catches structural regressions immediately after each level descriptor is authored)
- **After every plan wave:** `node scripts/smoke-progress.mjs` + `bash scripts/check-gate.sh` + `bash scripts/check-safety.sh` + `bash scripts/check-progress.sh`
- **Before `/gsd-verify-work`:** Full suite green (including `browser-boot.mjs` and `audit-phase21-mechanics.mjs`, both AFTER the Pitfall-1 select-navigation fix)
- **Max feedback latency:** ~60s for quick commands

---

## Per-Task Verification Map

| Requirement | Behavior | Test Type | Automated Command | File Exists |
|-------------|----------|-----------|-------------------|-------------|
| LVL-02 | 4 new levels exist as pure-data descriptors through the registry | structural | `node scripts/validate-levels.mjs` (auto-discovers `LEVEL_ORDER`, zero code change needed) | ✅ |
| LVL-02 | `LEVEL_ORDER.length` reflects 8 levels | smoke | `node scripts/smoke-progress.mjs` | ✅ W0 (bump line 723's `=== 4` to `=== 8`) |
| LVL-03 | Gentle ramp + mixed-review level, no table-1 in any pool | structural + manual review | `node scripts/validate-levels.mjs` (reachability only) + manual read of each descriptor's `allowedTables` | ⚠️ no automated table-pool assertion exists — optional Wave 0 hardening |
| LVL-04 | 2×4 grid, locked/unlocked/cleared semantics preserved, pre-v5.0 save resumes correctly | interactive | `node scripts/browser-boot.mjs` (after Pitfall-1 fix) | ❌ W0 gap — the Pitfall-1 fix IS this test's enabling change |
| LVL-05 | Verticality segments, camera pans correctly | interactive + structural | `node scripts/validate-levels.mjs` (direction-agnostic reachability) + `node scripts/audit-phase21-mechanics.mjs` (after Pitfall-1 fix) | ✅ validator / ❌ audit until W0 fix lands |
| LVL-06 | Secret alcove awards XP, missing it costs nothing | manual only (by design) | none — intentionally uncovered by structural/interactive gates (validator/audit kind-lists hardcode `["doors","mathGates","enemies","collectZones"]`, excluding `secretAlcove`) | manual spot-check recommended |
| MATH-01 | Table 1 removed from level-02's pool | manual/grep | none automated today | optional W0: a one-line grep assertion in `check-progress.sh` |
| MATH-02 | Second-factor roll 1-9, brain.js diff limited to one line | manual diff review | `git diff src/math/brain.js` (manual, one-line expected) | manual review given LOCKED-file sensitivity |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-progress.mjs:723` — bump `LEVEL_ORDER.length === 4` to `=== 8` (mechanical, required)
- [ ] `scripts/browser-boot.mjs:134-139` — select-nav loop needs row/col awareness (required for LVL-04/LVL-05 interactive proof to reach levels 5-8 at all)
- [ ] `scripts/audit-phase21-mechanics.mjs:166-176,190-199` — same select-nav fix, applied independently per the project's "fix duplicated Playwright code by hand in each copy" convention (required)
- [ ] (Optional, non-blocking) grep-based `check-progress.sh` assertions for MATH-01 (level-02.js's pool excludes `1`) and MATH-02 (brain.js's roll is `* 9`, not `* 10`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Secret alcove is reachable and awards XP on touch | LVL-06 | Validator/audit kind-lists deliberately exclude `secretAlcove` — off the critical path by design ("missing it costs nothing") | Walk to each alcove's authored coordinates in a manual/interactive browser session per level; confirm XP increments and no soft-lock |
| MATH-02 diff scope | MATH-02 | LOCKED-file sensitivity; a single misplaced literal change is high-risk and best caught by human review, not a script | `git diff src/math/brain.js` — confirm exactly one line changed (`* 10` → `* 9` at the multiplicand roll), nothing else |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s for quick commands
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
