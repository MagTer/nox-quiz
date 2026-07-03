---
phase: 14
slug: multi-scene-shell
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-29
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — `node --check` per module + new structural gate `scripts/check-import-safety.sh` + mandatory real browser boot (greps ≠ boots) |
| **Config file** | none — vanilla ES2020, no build step |
| **Quick run command** | `node --check src/scenes/<changed>.js` |
| **Full suite command** | `bash scripts/check-import-safety.sh && bash scripts/check-progress.sh` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** `node --check` the changed module(s)
- **After every plan wave:** `bash scripts/check-import-safety.sh && bash scripts/check-progress.sh`
- **Before `/gsd-verify-work`:** both gates green + the real-browser NAV-04 re-entry boot
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| W0 | — | 0 | NAV-04 | — | a727c13 import-safety gate exists + calibrated against a bad fixture | grep | `bash scripts/check-import-safety.sh` | ❌ W0 | ⬜ pending |
| NAV-01 | TBD | — | NAV-01 | — | title scene registered + boots; advances on key or click → select | check+boot | `node --check src/scenes/title.js` | ❌ W0 | ⬜ pending |
| NAV-02 | TBD | — | NAV-02 | — | select lists LEVEL_ORDER with locked/unlocked/cleared; only unlocked selectable | check+boot | `node --check src/scenes/select.js` | ❌ W0 | ⬜ pending |
| NAV-03 | TBD | — | NAV-03 | — | clear → markCleared+writeSave → go("select"); next level unlocked; no forced replay | check+boot | `node --check src/scenes/game.js` | ❌ W0 | ⬜ pending |
| NAV-04 | TBD | — | NAV-04 | — | enter→leave→re-enter ×2 leaks no handlers/colliders/tweens/effects; gate green | grep+boot | `bash scripts/check-import-safety.sh` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Create `scripts/check-import-safety.sh` — a727c13 negative grep targeting MODULE TOP LEVEL only (no engine globals outside scene-time function bodies) across `src/scenes/` + new UI helpers, modeled on `check-progress.sh`'s `strip_comments` + scoped grep. MUST be calibrated against a deliberately-bad fixture so it actually fails on a real top-level engine reference (Research Pitfall 5 — a naive whole-file grep false-flags legitimate in-body engine use).

*The import-safety gate is new infrastructure this phase creates; it must land (Wave 0) before/with the scene modules it guards.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| NAV-04 no-leak across re-entry | NAV-04 | Kaplay teardown + leaked handlers/colliders/tweens only observable at runtime; greps ≠ boots | Serve over HTTP; title→select→play→clear→select; then enter→leave→re-enter title, select, and a level TWICE each; confirm no double input, no ghost colliders/tweens/effects, no console errors |
| Full nav flow + dark-grunge title | NAV-01/02/03 | Visual + interaction judgment | Boot → title (Math Lab, press-to-start) → select (level-01 unlocked, locked tiles dimmed) → play → clear → returns to select; pick any unlocked level with arrows+Enter and with mouse |

*The import-safety grep is the automated backstop; the real browser boot is the mandatory final gate.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (check-import-safety.sh)
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
