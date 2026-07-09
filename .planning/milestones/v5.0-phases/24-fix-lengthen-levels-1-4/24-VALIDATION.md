---
phase: 24
slug: fix-lengthen-levels-1-4
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-06
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (project canon) — hand-rolled `check(cond, msg)` + failure-counter + `process.exit(1)` idiom, shared across `smoke-progress.mjs`, `validate-levels.mjs`, and the `over-hole-check.mjs`/`reachability.mjs` inline self-tests |
| **Config file** | none — direct `node scripts/*.mjs` invocation |
| **Quick run command** | `node scripts/validate-levels.mjs` |
| **Full suite command** | `node scripts/validate-levels.mjs && node scripts/smoke-progress.mjs && bash scripts/check-progress.sh && node scripts/audit-phase21-mechanics.mjs` |
| **Estimated runtime** | ~1s (validator + smoke, pure-data) + ~30-90s (interactive audit, browser-driven) |

---

## Sampling Rate

- **After every level-file edit:** `node scripts/validate-levels.mjs` (fast, pure-data — catches over-hole/reachability regressions immediately)
- **After all 4 levels' fixes + extensions land:** full suite — validator, `smoke-progress.mjs` (post re-baseline), `check-progress.sh`, interactive audit
- **Phase gate:** full suite green (validator zero HARD-FAILs, smoke PASS, audit 100% `triggered:true`) before writing `24-FINDINGS.md` and closing the phase

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD-defect-fix | TBD | 0 | VALID-04 | — | N/A | structural (pure-data) | `node scripts/validate-levels.mjs` | ✅ | ⬜ pending |
| TBD-extension | TBD | 0 | LVL-01 | — | Extensions appended strictly after existing geometry, never editing inside | structural (pure-data) | `node scripts/validate-levels.mjs` (re-run after extension) | ✅ | ⬜ pending |
| TBD-bounds | TBD | 0 | LVL-01 | — | Levels 2-4's explicit `bounds.right` bumped past new goal position; level-01 needs no change (camera derives bounds dynamically) | structural (pure-data) | manual inspection + `node scripts/validate-levels.mjs` | ✅ | ⬜ pending |
| TBD-smoke-rebaseline | TBD | 0 | LVL-01 | — | Old pre-extension geometry values retained in a comment, not silently overwritten | unit/regression | `node scripts/smoke-progress.mjs` | ✅ (needs re-baseline, not a new file) | ⬜ pending |
| TBD-interactive-audit | TBD | 0 | VALID-04, LVL-01 | — | N/A | integration/e2e (Playwright) | `node scripts/audit-phase21-mechanics.mjs` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Task IDs are TBD — the planner assigns real task/plan IDs; this map records the requirement→test binding established by research so the planner does not drop coverage.*

---

## Wave 0 Requirements

None — every test file this phase needs already exists (`scripts/validate-levels.mjs`, `scripts/smoke-progress.mjs`, `scripts/audit-phase21-mechanics.mjs` + its `lib/` dependencies, all built in Phase 23). The only "gap" is that `smoke-progress.mjs`'s 4 geometry-pinning blocks are currently pinned to pre-Phase-24 values and must be updated as part of this phase's own work — not a pre-existing infrastructure gap.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| Checkpoint density — no respawn loses more than one section | LVL-01 | No automated "section size" check exists; this is a data-authoring convention, not a testable assertion | Inspect each extended level's new checkpoints array: confirm one checkpoint immediately precedes each new hazard/mechanic, per CONTEXT.md's rule |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (checkpoint density is the one explicit manual-only exception, documented above)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none — all test infrastructure pre-exists from Phase 23)
- [x] No watch-mode flags
- [x] Feedback latency < 2s for the quick loop (interactive audit is a separate, slower phase-gate check, not part of per-task sampling)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-06 (autonomous pipeline — Nyquist structure verified against RESEARCH.md's Validation Architecture section; level-editing phase, no UI/UX judgment beyond the documented checkpoint convention)
