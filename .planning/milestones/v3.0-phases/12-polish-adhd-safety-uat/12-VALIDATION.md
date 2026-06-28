---
phase: 12
slug: polish-adhd-safety-uat
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-27
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — zero-dependency static Kaplay game, NO build/test harness (CLAUDE.md) |
| **Config file** | none |
| **Quick run command** | `node --check` on changed `.js` modules + `bash scripts/check-safety.sh` |
| **Full suite command** | serve over HTTP and play in a browser (the final kid UAT) |
| **Estimated runtime** | ~10s (syntax + safety audit) + manual/kid playtest |

---

## Sampling Rate

- **After every task commit:** `node --check` changed modules; `bash scripts/check-safety.sh` (comment-stripped no-timer/forgiving audit)
- **After every plan wave:** load the game and confirm the juice/hint render without console errors
- **Before `/gsd-verify-work`:** safety audit green; juice + persistent hint visible; no console errors
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-00-01 | 00 | 0 | SAFE-01 | — | N/A | tooling | author scripts/check-safety.sh (comment-stripped no-timer/forgiving grep) | ❌ W0 | ⬜ pending |
| 12-01-01 | 01 | 1 | JUICE-01, JUICE-02, JUICE-03 | — | N/A | manual+grep | node --check src/fx.js + no setTimeout/setInterval/lifespan/wait( in src/fx.js + browser feel | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 2 | SAFE-02, SAFE-03 | — | N/A | manual+grep | persistent hint present (fixed) + node --check + browser contrast/readability | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No automated test framework — zero-dependency static game (CLAUDE.md). Wave 0 authors `scripts/check-safety.sh`: the SAFE-01 no-timer + forgiving audit. CRITICAL: it MUST strip comments before grepping (banned words like "setTimeout"/"game-over" already appear in existing code comments — a naive grep false-positives, per RESEARCH).

*This audit is the one repeatable automated gate for the ADHD-safety mandate across the whole game; the rest of the phase's "feel" verification is inherently kid-UAT.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Jump/land squash + dust feels satisfying-but-subtle | JUICE-01 | Feel/visual judgment | Jump and land repeatedly; confirm subtle squash + brief dust, not bouncy/over-stimulating |
| Coin collect has a satisfying pop | JUICE-02 | Feel/visual | Collect coins; confirm a quick pop+fade, not jarring |
| Level-clear has a distinct, brief, non-strobing celebration | JUICE-03 | Feel/visual | Clear the gate; confirm a celebratory burst layered on LEVEL CLEAR + level-up flash, no strobe |
| No timers/countdowns anywhere | SAFE-01 | Behavioral absence (+ grep) | Play through; nothing counts down or time-pressures (also audited by check-safety.sh) |
| Controls discoverable | SAFE-02 | Visual/UX | Confirm the persistent corner hint ("← → move · SPACE jump") is visible and readable on the Windows laptop |
| Readable contrast + not over-stimulating | SAFE-03 | Visual judgment | Confirm text/sprites/HUD read clearly on #0a0a0a and effects are calm — confirmed in UAT WITH THE KID |
| Overall feel/framing — "reads like a real game" | JUICE/SAFE | Kid reaction | Final kid play-test: she enjoys it, controls obvious, nothing stressful |

*Phase 12 is polish + an ADHD-safety audit; the no-timer/forgiving audit is automatable (comment-stripped grep), but feel/contrast/over-stimulation are validated only with the actual kid by design.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (node --check + check-safety.sh) or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (check-safety.sh)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-27 — no-timer/forgiving audit is a repeatable comment-stripped grep gate; juice feel, contrast, and over-stimulation are routed to the final kid UAT per the no-build/no-test project constraint and the "feel validated only with the user" mandate.
