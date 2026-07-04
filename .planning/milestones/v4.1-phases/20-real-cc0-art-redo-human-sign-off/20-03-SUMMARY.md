---
phase: 20-real-cc0-art-redo-human-sign-off
plan: 03
subsystem: testing
tags: [playwright, screenshot, human-verify, process]

requires:
  - phase: 20-real-cc0-art-redo-human-sign-off
    provides: "Plans 01-02's complete real-art asset set (player, ground, parallax, title-bg)"
provides:
  - scripts/screenshot-phase20.mjs — real in-game screenshot capture
  - 20-VERIFICATION.md — a genuine, two-round, human-confirmed sign-off (not self-certified)
  - A real, human-caught-and-fixed defect (ground/parallax/title-bg invisibility)
  - A list of real gameplay-mechanics bugs carried forward to Phase 21
affects: [21]

tech-stack:
  added: []
  patterns:
    - "Genuine blocking human sign-off: literal AskUserQuestion round-trip, response recorded verbatim, status stays human_needed until it exists — the first time this actually happened in this project's history (confirmed by 20-RESEARCH.md's repo-wide grep of phases 13-19)"

key-files:
  created:
    - scripts/screenshot-phase20.mjs
    - .planning/phases/20-real-cc0-art-redo-human-sign-off/phase20-{title,select,level-anim,parallax-a,parallax-b}.png
    - .planning/phases/20-real-cc0-art-redo-human-sign-off/20-VERIFICATION.md
  modified:
    - scripts/build-art-assets.py (ENVIRONMENT_PALETTE brightness fix, driven by real human feedback)
    - assets/tiles/ground.png, assets/parallax/{far,mid,near}.png, assets/tiles/title-bg.png (rebuilt post-fix)

key-decisions:
  - "When round 1's human sign-off found a real defect, fixed scripts/build-art-assets.py's ENVIRONMENT_PALETTE directly (widened 10-42 luminance to 10-136) rather than treating the report as a misunderstanding — verified the bug was real by comparing against this project's own known-good spike.png/goal.png (luminance up to 245)"
  - "When round 2 surfaced real gameplay-mechanics bugs (unanswerable math gate, missing question text, unclear door/enemy glyphs), did NOT attempt to fix them in this phase — they are door.js/gates.js/enemy.js/mathGate.js logic bugs, entirely outside ART-05..08/PROC-01/02's asset-only scope, and fixing them here would blur this phase's scope discipline. Recorded them verbatim for Phase 21, which already names these exact four files as its mandate."
  - "Asked a final, explicitly-scoped confirmation question (isolating just the 4 art areas) once it became clear round 2's broader feedback mixed in-scope and out-of-scope findings — this produced an unambiguous, literal 'yes' that satisfies PROC-02 without requiring the human to also adjudicate Phase 21-scope bugs before Phase 20 could close"

patterns-established:
  - "Scoped re-confirmation: when a human sign-off response surfaces both in-scope and out-of-scope findings, separate them explicitly and ask a narrower follow-up question rather than treating mixed feedback as ambiguous or blocking"

requirements-completed: [ART-05, ART-06, ART-07, ART-08, PROC-02]

coverage:
  - id: D1
    description: "Genuine, two-round, blocking human visual sign-off obtained and recorded verbatim in 20-VERIFICATION.md — not self-certified on automated checks alone"
    requirement: "PROC-02"
    verification:
      - kind: manual_procedural
        ref: "Two full AskUserQuestion round-trips this session, both with literal recorded responses; see 20-VERIFICATION.md's human_sign_off field"
        status: pass
    human_judgment: true
    rationale: "PROC-02 is, by definition, not automatable — this coverage entry documents that the human interaction genuinely happened, it does not stand in for it"
  - id: D2
    description: "Real defect found by round-1 human feedback (ground/parallax/title-bg invisible against background) fixed and re-verified"
    requirement: "ART-06, ART-07, ART-08"
    verification:
      - kind: unit
        ref: "python3 -c luminance extrema check: ground/far/mid/near/title-bg all now span 10-68 through 10-136, vs. the pre-fix 10-17 through 10-42"
        status: pass
      - kind: manual_procedural
        ref: "Round-2 human confirmation: 'The background is however now visible, so it is a good step in the right direction'"
        status: pass
    human_judgment: true
    rationale: "Legibility against the actual stage background is inherently a perceptual judgment; the automated luminance check corroborates but does not replace the human confirmation"

duration: ~40min (across two human sign-off rounds plus one real fix cycle)
completed: 2026-07-04
status: complete
---

# Phase 20 Plan 03: Real Screenshots + Genuine Human Sign-off Summary

**A real, two-round, blocking AskUserQuestion sign-off — the first genuine one in this project's history — caught and drove the fix of a real art-invisibility bug, then confirmed the fix, closing PROC-02 for real.**

## Performance

- **Duration:** ~40 min across screenshot capture, round-1 sign-off, a real fix cycle, round-2 sign-off, and a scoped confirmation follow-up
- **Tasks:** 2 completed (Task 1: screenshots + automated re-verification; Task 2: genuine human sign-off)
- **Files modified:** 8 (1 new script, 5 screenshots, 1 new VERIFICATION.md, plus the Plan 01/02 asset files re-touched by the fix)

## Accomplishments
- Built `scripts/screenshot-phase20.mjs` (port 8767, reusing `screenshot-phase18.mjs`'s server skeleton + `browser-boot.mjs`'s save-seed trick), capturing 5 real in-game screenshots
- Re-ran the full automated suite (5 scripts) — all green with the real Kenney-sourced asset set
- Conducted a genuine, literal, blocking `AskUserQuestion` sign-off — round 1 caught a real defect the automated suite and this agent's own visual inspection had both missed: ground/parallax/title-bg were quantized to a luminance range (10-42) nearly indistinguishable from the `#0a0a0a` background
- Fixed the defect by widening `ENVIRONMENT_PALETTE` to a 10-136 luminance range (still dark-grunge, no pink, no new hues), rebuilt all four affected assets, re-screenshotted, and re-ran the full automated suite (still green)
- Round 2 confirmed the fix worked but surfaced 3 real gameplay-mechanics bugs entirely outside this phase's scope — recorded verbatim and explicitly routed to Phase 21 rather than fixed here
- A final scoped question isolated Phase 20's own 4 art areas and obtained an unambiguous literal "yes" — closing PROC-02 for real, the first time this has actually happened in this project's history

## Task Commits

1. **Task 1: Build screenshot-phase20.mjs, capture screenshots, re-verify suite** - `d641fe8` (test)
2. **Task 2 (part A): Record round-1 sign-off, honest human_needed state** - `72e72c2` (docs)
3. **Fix: brighten ENVIRONMENT_PALETTE after round-1 defect report** - `3f06f21` (fix)
4. **Task 2 (part B): Record round-2 partial result, deferred state** - `55e8ad7` (docs), `f8dab6a` (STATE.md)
5. **Task 2 (part C): Record final genuine sign-off, status passed** - `cf2373d` (docs)

## Files Created/Modified
- `scripts/screenshot-phase20.mjs` - new screenshot capture script
- `.planning/phases/20-real-cc0-art-redo-human-sign-off/phase20-*.png` - 5 real screenshots (regenerated post-fix)
- `.planning/phases/20-real-cc0-art-redo-human-sign-off/20-VERIFICATION.md` - new, records the full two-round sign-off verbatim
- `scripts/build-art-assets.py` - `ENVIRONMENT_PALETTE` and per-layer sub-palettes widened (fix driven by round-1 feedback)
- `assets/tiles/ground.png`, `assets/parallax/{far,mid,near}.png`, `assets/tiles/title-bg.png` - rebuilt post-fix

## Decisions Made
- Treated round-1's "has real issues" report as ground truth requiring investigation, not a misunderstanding to argue past — confirmed the defect was real by comparing luminance values against this project's own known-good `spike.png`/`goal.png`.
- Explicitly declined to fix round-2's gameplay-mechanics findings inside this phase — they belong to `door.js`/`gates.js`/`enemy.js`/`mathGate.js`, entirely outside ART-05..08/PROC-01/02, and Phase 21 already exists specifically for this. Fixing them here would have blurred phase scope and duplicated Phase 21's future work.
- Asked one more narrowly-scoped question once it was clear round 2's feedback mixed in-scope and out-of-scope findings, rather than treating the mixed response as ambiguous or as an automatic block — this produced a clean, literal, unambiguous confirmation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Real defect, human-caught] ENVIRONMENT_PALETTE too dark to be visible in actual gameplay**
- **Found during:** Task 2, round-1 human sign-off (not caught by Task 1's automated checks or this agent's own prior visual inspection)
- **Issue:** `ground.png`/`parallax/*.png`/`title-bg.png` were quantized onto a luminance range of 10-42 (out of 255), while the stage background is luminance 10 — a difference small enough to read as "all black" on a real screen, even though a magnified synthetic preview (rendered against an artificial grey canvas) had looked fine to this agent.
- **Fix:** Widened `ENVIRONMENT_PALETTE` (and its derived per-layer sub-palettes) to span 10-136, reusing the project's own locked `#333333`/`#444444` border tokens plus two new mid-grey tones (`#666666`/`#888888`) — still achromatic dark-grunge, no pink, no new hues.
- **Files modified:** `scripts/build-art-assets.py`, `assets/tiles/ground.png`, `assets/parallax/far.png`, `assets/parallax/mid.png`, `assets/parallax/near.png`, `assets/tiles/title-bg.png`
- **Verification:** Re-ran the build, re-screenshotted, re-ran the full automated suite (still green), and obtained a second round of human confirmation ("the background is however now visible").
- **Committed in:** `3f06f21`

---

**Total deviations:** 1 auto-fixed (a real, human-caught visibility defect).
**Impact on plan:** Directly validates this phase's own reason for existing — a real human sign-off caught something automation and self-review both missed. No scope creep: the fix stayed entirely inside the palette constants this phase already owns.

## Issues Encountered
- Two `AskUserQuestion` calls (one for the initial ask, one for round-2 re-confirmation) received no response within the wait window — handled per PROC-02's explicit design: left `20-VERIFICATION.md` at `status: human_needed` and recorded the honest state in STATE.md's Deferred Verification table rather than fabricating a pass. The human later returned and engaged fully, resolving both.
- Round 2's human feedback mixed real Phase-20-scope confirmation ("background is however now visible") with real Phase-21-scope bug reports (math-gate/door/enemy issues) in one message — resolved by explicitly separating the two and asking one more narrowly-scoped question.

## Next Phase Readiness
- Phase 20 is fully verified and closed — `20-VERIFICATION.md` records `status: passed` with a genuine, literal, two-round human sign-off.
- Phase 21 has concrete, human-reported starting evidence for its mechanics audit: an unanswerable/unlabeled math-gate encounter, a defeat-enemy gate with no visible question text, and unclear door/enemy glyph sprites — all recorded verbatim in `20-VERIFICATION.md`'s "Carried Forward to Phase 21" section.

---
*Phase: 20-real-cc0-art-redo-human-sign-off*
*Completed: 2026-07-04*
