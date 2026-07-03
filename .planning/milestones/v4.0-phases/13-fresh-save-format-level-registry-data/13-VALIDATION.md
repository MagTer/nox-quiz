---
phase: 13
slug: fresh-save-format-level-registry-data
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-29
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — headless node smoke (`scripts/smoke-progress.mjs`) + structural grep gate (`scripts/check-progress.sh`) + mandatory real browser boot |
| **Config file** | none — vanilla ES2020, no build step |
| **Quick run command** | `node --check src/progress.js && node scripts/smoke-progress.mjs` |
| **Full suite command** | `bash scripts/check-progress.sh && node scripts/smoke-progress.mjs` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --check <changed-file>` + relevant smoke assertion
- **After every plan wave:** Run `bash scripts/check-progress.sh && node scripts/smoke-progress.mjs`
- **Before `/gsd-verify-work`:** Full suite green + real browser boot (level-01 loads from registry, progress persists under new key)
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| W0 | — | 0 | SAVE-05/06/07, LVL-02 | — / — | N/A | smoke+grep | `node scripts/smoke-progress.mjs` | ❌ W0 | ⬜ pending |
| SAVE-05 | TBD | 1 | SAVE-05 | — | corrupt/foreign/missing save → safe defaults, never bricks | smoke | `node scripts/smoke-progress.mjs` | ❌ W0 | ⬜ pending |
| SAVE-06 | TBD | 1 | SAVE-06 | — | per-level cleared map round-trips; unlock derived from LEVEL_ORDER | smoke | `node scripts/smoke-progress.mjs` | ❌ W0 | ⬜ pending |
| SAVE-07 | TBD | 1 | SAVE-07 | — | XP/level/practice-history persist and seed createBrain | smoke | `node scripts/smoke-progress.mjs` | ❌ W0 | ⬜ pending |
| LVL-02 | TBD | 1 | LVL-02 | — | registry ordered, level-01 verbatim geometry, builder pure-importable | smoke+grep | `node scripts/smoke-progress.mjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend `scripts/smoke-progress.mjs` — cleared-map round-trip, derived unlock, corrupt/foreign-save safe default, registry import, verbatim-geometry deep-equal for level-01
- [ ] Update `scripts/check-progress.sh` — new save key assert, levels/unlock asserts, negative import-safety grep for `src/levels/` (no engine globals at module top level)

*Headless node smoke + structural grep are the test infrastructure; Wave 0 extends them to the new save shape and registry.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Game boots and level-01 loads from the registry; progress persists under the new key across reload | LVL-02, SAVE-05/06/07 | Real browser boot — greps passing ≠ boots (Phase 09 lesson) | Open the game in a browser, play level-01, clear it, reload, confirm cleared state persists under the new localStorage key and the game still loads |

*Greps + smoke cover module logic; the real browser boot is the mandatory final gate.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
