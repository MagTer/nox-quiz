---
phase: 17
slug: build-the-levels
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-07-03
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | plain Node.js ES modules (no external test framework — project canon) |
| **Config file** | none |
| **Quick run command** | `node scripts/smoke-progress.mjs` |
| **Full suite command** | `bash scripts/check-gate.sh && bash scripts/check-import-safety.sh && bash scripts/check-safety.sh && node scripts/smoke-progress.mjs && node scripts/browser-boot.mjs` |
| **Estimated runtime** | ~25 seconds (browser boot dominates) |

---

## Sampling Rate

- **After every task commit:** Run `node scripts/smoke-progress.mjs`
- **After every plan wave:** Run the full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | LVL-04 | T-17-01 | Default bounds prevent camera crash on malformed input | static + import-safety | `bash scripts/check-import-safety.sh` | ✅ | ⬜ pending |
| 17-01-02 | 01 | 1 | LVL-04 | — | game.js passes level.bounds into followCamera | static | `grep -n "followCamera(player" src/scenes/game.js \| grep -q "level.bounds"` | ✅ | ⬜ pending |
| 17-02-01 | 02 | 2 | LVL-01, LVL-04 | T-17-03 | level-02 module has no engine globals at top level | static + import-safety | `node --check src/levels/level-02.js && bash scripts/check-import-safety.sh` | ✅ | ⬜ pending |
| 17-02-02 | 02 | 2 | LVL-01, LVL-04 | T-17-03 | level-03 module has no engine globals at top level | static + import-safety | `node --check src/levels/level-03.js && bash scripts/check-import-safety.sh` | ✅ | ⬜ pending |
| 17-02-03 | 02 | 2 | LVL-01, LVL-04 | T-17-03 | level-04 module has no engine globals at top level | static + import-safety | `node --check src/levels/level-04.js && bash scripts/check-import-safety.sh` | ✅ | ⬜ pending |
| 17-03-01 | 03 | 3 | LVL-01 | T-17-04 | Registry order and unlock derivation are correct | smoke | `node scripts/smoke-progress.mjs` | ✅ | ⬜ pending |
| 17-03-02 | 03 | 3 | LVL-01 | T-17-04 | expectedGeometry fixtures for new levels match authored data | smoke | `node scripts/smoke-progress.mjs` | ✅ | ⬜ pending |
| 17-04-01 | 04 | 4 | LVL-01, LVL-04 | T-17-05 | Browser boot navigates all levels without runtime errors | e2e | `node scripts/browser-boot.mjs` | ✅ | ⬜ pending |
| 17-04-02 | 04 | 4 | LVL-01, LVL-04 | — | Full static suite green | static | `bash scripts/check-gate.sh && bash scripts/check-import-safety.sh && bash scripts/check-safety.sh && node scripts/smoke-progress.mjs` | ✅ | ⬜ pending |
| 17-04-03 | 04 | 4 | LVL-01, LVL-04 | T-17-02 | Human confirms every level is completable and fair | manual | Human checkpoint — type "approved" | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:
- `scripts/smoke-progress.mjs` (pure Node.js ES module harness)
- `scripts/browser-boot.mjs` (Playwright real-browser boot)
- `scripts/check-gate.sh`
- `scripts/check-import-safety.sh`
- `scripts/check-safety.sh`

No new test files or framework installs are needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Every new level is start→goal completable with fair checkpoints and mechanics | LVL-01, LVL-04 | Jump distances, hazard timing, and "fun" cannot be statically verified | Serve game locally; play level-02, level-03, level-04 start→goal; confirm gaps are reachable, checkpoints precede hazards, mechanics re-ask on wrong answers, camera clamps correctly, Escape returns to select |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter (set after execution)

**Approval:** pending
