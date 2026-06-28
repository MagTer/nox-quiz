---
phase: 10
slug: math-gate-integration-port-the-brain
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-25
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — zero-dependency static Kaplay game, NO build/test harness (CLAUDE.md) |
| **Config file** | none |
| **Quick run command** | `node --check` on changed `.js` modules (syntax gate) + targeted structural greps |
| **Full suite command** | headless brain smoke test (`node` import of src/math/brain.js) + serve over HTTP and play the gate in a browser |
| **Estimated runtime** | ~10s (syntax + grep + brain smoke) + manual playtest |

---

## Sampling Rate

- **After every task commit:** `node --check` changed modules; structural greps for firewall/anti-leak/no-timer assertions
- **After every plan wave:** import src/math/brain.js headlessly and assert it returns valid 4-choice questions; load the gate in a browser
- **Before `/gsd-verify-work`:** gate opens at goal, correct clears, wrong re-asks; no console errors
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | GATE-02, GATE-06 | — | N/A | unit-ish | `node -e import brain.js → assert {a,b,answer,choices.length===4}` + `grep -L kaplay src/math/brain.js` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 2 | GATE-01, GATE-04, GATE-05 | — | N/A | manual+grep | `node --check src/ui/mathGate.js` + grep no setTimeout/timer, no DOM innerHTML | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 3 | GATE-03 | — | N/A | manual+grep | `node --check src/scenes/game.js` + grep openMathGate in onReachGoal | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No automated test framework — zero-dependency static game (CLAUDE.md). Validation is `node --check` syntax gating, structural greps, a headless `node` import smoke test of the pure brain, plus manual browser playtest of the gate.

*The brain firewall (GATE-06) makes src/math/brain.js headlessly importable in plain node — this is the one genuinely automatable unit check and MUST be exercised.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Reaching goal shows in-world gate (game font/palette, avatar dimmed behind), not a DOM popup | GATE-01 | Visual/rendering | Serve over HTTP, reach goal; confirm Kaplay-rendered panel, level paused+dimmed behind |
| 4 multiple-choice answers, biased to 6–9 | GATE-02 | Visual + statistical bias | Open the gate repeatedly; confirm 4 choices, questions skew to 6–9 tables |
| Correct answer clears level with a celebratory moment | GATE-03 | Behavioral | Pick the correct answer; confirm celebration flash + LEVEL CLEAR |
| Wrong answer is forgiving — re-asks, no penalty, run does not end | GATE-04 | Behavioral | Pick a wrong answer; confirm mark/shake, same question retryable, no game-over, no progress lost |
| No countdown / no time pressure | GATE-05 | Behavioral/absence | Sit on the gate; confirm nothing counts down or auto-fails |
| Math module imports nothing from Kaplay; survives replays with no leaked state | GATE-06 | Architectural + runtime | `grep -L kaplay src/math/brain.js`; replay the level and re-open the gate — no duplicated handlers, fresh question state |

*Phase 10 is integration on top of Phases 8–9; gate behaviors are validated by manual browser playtest plus the headless brain smoke test by design.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (node --check + greps + brain smoke) or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-25 — brain firewall enables a real headless unit smoke test; gate runtime behaviors routed to manual UAT per the no-build/no-test-framework project constraint.
