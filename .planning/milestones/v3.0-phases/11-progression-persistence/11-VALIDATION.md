---
phase: 11
slug: progression-persistence
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-26
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — zero-dependency static Kaplay game, NO build/test harness (CLAUDE.md) |
| **Config file** | none |
| **Quick run command** | `node --check` on changed `.js` modules + structural greps (firewall/anti-leak) |
| **Full suite command** | headless `node` smoke of the PURE progress + brain math (`scripts/smoke-progress.mjs`) + serve over HTTP and play |
| **Estimated runtime** | ~10s (syntax + greps + headless math smoke) + manual browser playtest |

---

## Sampling Rate

- **After every task commit:** `node --check` changed modules; firewall greps (no Kaplay in progress.js, no storage in brain.js, no module-level mutable state)
- **After every plan wave:** run `scripts/smoke-progress.mjs` (XP curve/level thresholds, surplus carry, seedAccuracy adaptation) headlessly in node
- **Before `/gsd-verify-work`:** earn XP at the gate, level up, reload the page and confirm XP/level + weak-spot adaptation resume
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-00-01 | 00 | 0 | SAVE-01..04 | — | N/A | tooling | author scripts/check-progress.sh + scripts/smoke-progress.mjs | ❌ W0 | ⬜ pending |
| 11-01-01 | 01 | 1 | SAVE-01 | — | N/A | unit-ish | `node scripts/smoke-progress.mjs` asserts XP curve + level thresholds (verbatim v1/v2) | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 2 | SAVE-02, SAVE-03 | — | N/A | unit+manual | headless seedAccuracy adaptation smoke + `grep -L kaplay src/progress.js` + reload UAT | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 3 | SAVE-04 | — | N/A | manual+grep | `node --check src/ui/hud.js` + HUD reads progress (one-way) grep + browser level-up UAT | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No automated test framework — zero-dependency static game (CLAUDE.md). Wave 0 authors `scripts/check-progress.sh` (structural firewall/anti-leak greps) and `scripts/smoke-progress.mjs` (headless node import of the PURE progress + brain math). These ARE the automated checks.

*The pure-progress design (createProgress takes a `saved` object; localStorage only behind a guarded seam) is what makes the XP/level math node-testable despite node having no localStorage — this is the load-bearing structural decision and MUST be exercised.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Correct answer earns XP and levels up on the v1/v2 curve | SAVE-01 | Runtime + visual | Reach goal, answer correctly; confirm XP increases and a level-up occurs at the right threshold |
| XP/level/accuracy persist across tab close (versioned localStorage) | SAVE-02 | Browser storage | Earn XP, close the tab, reopen the URL; confirm XP/level restored from localStorage |
| Returning resumes progression AND weak-spot adaptation | SAVE-03 | Cross-visit behavior | After persisting weak-spot accuracy, reload; confirm question selection still targets weak tables (highest-risk; also covered by headless seedAccuracy smoke) |
| XP/level visible in-game; level-up shows a distinct moment | SAVE-04 | Visual | Confirm the HUD shows level + XP bar; crossing a threshold shows a level-up flash/banner |

*Phase 11 is progression/persistence on top of the Phase-10 gate; the pure XP/level/adaptation math is headlessly testable, runtime/visual behaviors are manual UAT by design.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (node --check + greps + headless progress/brain smoke) or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (check-progress.sh + smoke-progress.mjs)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-26 — pure-progress design makes XP/level + seedAccuracy adaptation headlessly node-testable; persistence + visual HUD behaviors routed to manual UAT per the no-build/no-test project constraint.
