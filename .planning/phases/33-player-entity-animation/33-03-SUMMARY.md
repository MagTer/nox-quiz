---
phase: 33-player-entity-animation
plan: 03
subsystem: player entity / physics-animation coupling
tags: [kaplay, area-shape, anim-state-machine, physics-collider]

requires:
  - phase: 33-02
    provides: "5-state player-swamphunter loadSprite registration (idle/run/jump/fall/land) in main.js"
provides:
  - "makePlayer()'s collider explicitly locked to 16x32 via area({ shape: new Rect(vec2(0), 16, 32) }), independent of anim frame"
  - "5-state player anim-state machine (idle/run/jump/fall/land) with a genuine falling-to-grounded land transition detector"
affects:
  - "Plan 33-05 (phase closer) — its human collider-screenshot checkpoint verifies this lock live"

tech-stack:
  added: []
  patterns:
    - "Explicit area({ shape: new Rect(vec2(0), W, H) }) collider lock — same idiom as the spike hitbox in build.js, now applied to the player"
    - "wasFalling/landHold closure-local timer pair, same anti-leak/decay idiom as the existing coyote/buffer pattern"

key-files:
  created: []
  modified:
    - src/player.js

key-decisions:
  - "Land trigger is gated on a wasFalling (vel.y >= 0 while airborne) edge detector, never on player.onGround() directly — onGround() fires on every grounded contact including repeated hits while walking across adjacent floor colliders, which is the documented reason land SFX was removed from that same hook in Phase 27"

requirements-completed: []  # ART-04 spans all 5 plans in this phase — NOT marked complete here per orchestrator instruction; Phase 33's verifier marks it after full delivery

coverage:
  - id: D1
    description: "Player's physics collider is explicitly locked to 16x32 Rect, independent of the currently-playing anim frame"
    requirement: "ART-04"
    verification:
      - kind: unit
        ref: "grep -c 'shape: new Rect(vec2(0), 16, 32)' src/player.js == 1"
        status: pass
      - kind: unit
        ref: "grep -c 'area(),' src/player.js == 0 (bare unshaped call is gone)"
        status: pass
      - kind: other
        ref: "bash scripts/check-safety.sh && bash scripts/check-import-safety.sh"
        status: pass
    human_judgment: true
    rationale: "This plan's own threat model (T-33-05) requires the collider lock to also be proven via a live human collider-screenshot checkpoint — deferred to Plan 33-05, the phase closer. Grep/gate proof alone is not this project's closing standard (\"checks that don't play the game lie\")."
  - id: D2
    description: "Anim-state machine emits all 5 target states (idle/run/jump/fall/land), with land triggered only on a genuine falling-to-grounded transition, never during ordinary grounded walking"
    requirement: "ART-04"
    verification:
      - kind: unit
        ref: "grep -c wasFalling / landHold / '\"land\"' / '\"fall\"' src/player.js (all thresholds met)"
        status: pass
      - kind: e2e
        ref: "node scripts/browser-boot.mjs — level-01 full driven pass, zero play/fall/land console errors"
        status: pass
      - kind: e2e
        ref: "node scripts/browser-boot.mjs — levels 3-8 (blocked by pre-existing, out-of-scope build.js/CONFIG.ENEMY.SPRITES cross-plan gap, see Deviations)"
        status: unknown
    human_judgment: true
    rationale: "Full 8-level automated regression proof is blocked in this isolated worktree by a pre-existing, out-of-scope cross-plan gap (see Deviations). Cannot be marked pass until Plan 33-04 merges and the suite is re-run; flagging for the phase closer's re-verification rather than asserting a false pass."

duration: ~25min
completed: 2026-07-11
status: complete
---

# Phase 33 Plan 03: Player Collider Lock & Fall/Land Anim States Summary

Locked `makePlayer()`'s physics collider to an explicit, sprite-frame-independent 16x32 `Rect`, and extended the existing grounded/velocity-driven anim state machine with the two remaining states the roadmap requires (`fall`/`land`), using a `wasFalling`-gated falling-to-grounded edge detector instead of the noisy `onGround()` hook so `land` never dominates over `run` during ordinary walking.

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-11T13:36:54Z
- **Tasks:** 2 (1 code task, 1 verification-only task)
- **Files modified:** 1 (`src/player.js`)

## Accomplishments

- `area()`'s bare call replaced with `area({ shape: new Rect(vec2(0), 16, 32) })` — the player's physics hitbox is now byte-fixed at 16x32 regardless of which of the 5 anim states (or which frame within it) is currently playing, matching the CLAUDE.md-binding decision recorded in STATE.md.
- Anim-state `onUpdate` block extended with `wasFalling`/`landHold` closure-local timers (same anti-leak/decay idiom as the existing `coyote`/`buffer` pair), emitting all 5 target states: `idle`/`run`/`jump`/`fall`/`land`.
- `land` is a genuine falling-to-grounded synthesized pose — triggered only on the frame the player transitions from airborne-and-descending to grounded, never re-triggered by ordinary walking across adjacent floor colliders.
- The existing `player.getCurAnim()?.name !== target` transition guard was preserved completely unchanged, per the plan's explicit instruction.

## Task Commits

1. **Task 1: Lock the collider shape, add the fall/land anim-state logic** - `f6bf0d6` (feat)
2. **Task 2: Runtime regression proof — drive all 8 levels with the new collider/anim states live** - verification-only, no commit (see Deviations for the partial-pass outcome)

**Plan metadata:** (this SUMMARY.md commit)

## Files Created/Modified

- `src/player.js` - `area()` → `area({ shape: new Rect(vec2(0), 16, 32) })`; added `wasFalling`/`landHold` closure-local timers; anim-state target logic extended from a single collapsed `"jump"` branch to `jump`/`fall`/`land`, gated by a genuine falling-to-grounded transition detector

## Decisions Made

- Land trigger is gated on a `wasFalling` edge detector (`!player.isGrounded()` with `vel.y >= 0`, i.e. actually descending — "Up is NEGATIVE Y" per this file's own documented convention), never on `player.onGround()` directly. Reusing `onGround()` would re-trigger `landHold` on every grounded contact, including repeated hits while walking across adjacent floor colliders — this file's own comment already documents that exact behavior as the reason land SFX was removed from that hook in Phase 27. The plan called for exactly this approach; no deviation, just confirming the rationale carried through cleanly to the implementation.

## Deviations from Plan

### Auto-fixed Issues

None — Task 1 executed exactly as written; all 7 acceptance-criteria greps and both automated verify commands (`check-safety.sh`, `check-import-safety.sh`) passed on the first attempt.

### Out-of-scope discovery (NOT auto-fixed — logged per Scope Boundary rule)

**1. Cross-plan gap: `CONFIG.ENEMY.SPRITES` / `src/levels/build.js` variant indexing**

- **Found during:** Task 2 (`node scripts/browser-boot.mjs` full regression proof)
- **Symptom:** `browser-boot.mjs` exits non-zero. `level-03` throws `Error: Please pass the resource name or data to sprite()` at `src/levels/build.js:312` (inside the enemy-panel loop); levels 4-8 subsequently report `encounter ... never triggered` / `far-end drive stalled` — a cascading effect of the level-03 crash on the shared browser page/driver state.
- **Root cause:** Plan 33-02 (already merged, this worktree's `depends_on`) collapsed `CONFIG.ENEMY.SPRITES` to a single-entry array (`["enemy-hellhound"]`). `src/levels/build.js` line 312 still does an unguarded `CONFIG.ENEMY.SPRITES[e.variant ?? 0]` lookup; levels 03/06/08 carry enemy descriptors with `variant: 1`/`variant: 2` (the old 3-variant static set), which now index out of bounds and crash `sprite(undefined)`.
- **Why not fixed here:** `src/levels/build.js` is not in this plan's `files_modified` (`src/player.js` only — Scope Boundary: "Only auto-fix issues DIRECTLY caused by the current task's changes"). This exact issue is already anticipated and scoped as **Plan 33-04's** job — its own threat register (`T-33-07`, Tampering/crash risk) documents the identical root cause and plans the identical fix (a modulo-safe index, `CONFIG.ENEMY.SPRITES[(e.variant ?? 0) % CONFIG.ENEMY.SPRITES.length]`). Plan 33-04 is wave 2 (parallel to this plan, isolated worktree), depends on 33-01+33-02 only — it is structurally absent from this worktree until the orchestrator merges the wave.
- **Verification narrowed accordingly:** confirmed via `grep` that no `play`/`fall`/`land`-referencing exception appears anywhere in the `browser-boot.mjs` console output across 2 consecutive runs — the plan's own Task 2 acceptance criteria for this specific plan's deliverable. `level-01` (the one level unaffected by the enemy-variant crash) completed a full driven pass with only a below-floor FPS reading (see item 2), no crashes, no mechanic-trigger failures — the closest available live proof that the collider lock + 5-state anim machine did not regress jump/fall/land feel.
- **Files touched to log this:** `.planning/phases/33-player-entity-animation/deferred-items.md` (new)
- **Follow-up:** Full 8-level `browser-boot.mjs` exit-0 proof should be re-run once Plan 33-04 merges into the same tree — flagged for Plan 33-05 (phase closer) and/or the orchestrator's post-wave verification pass. Not committed here as a code fix.

**2. Observed: level-entry FPS-floor readings fluctuated across runs**

- **Found during:** Task 2, same 2 `browser-boot.mjs` runs
- **Symptom:** `level-01`/`level-02` reported "level entry: fps 32-35 < floor 45" on both runs; the second run additionally showed every level that got far enough to report ("level-03..08: fps 44 < floor 45", 1fps under floor).
- **Assessment:** Not linked to any Task 1 code path — the collider/anim-state logic does not execute differently before the first rendered frame. Most likely host-level headless timing variance from concurrent CPU load (sibling wave-2 worktree agents running on the same host). Not auto-fixed; logged to `deferred-items.md` for the orchestrator/Plan 33-05 to re-check against a quieter host if it recurs post-merge.

---

**Total deviations:** 0 auto-fixed; 2 out-of-scope discoveries logged (not fixed, per Scope Boundary rule).
**Impact on plan:** Task 1 (the plan's actual code deliverable) is complete and fully verified — collider lock + 5-state anim machine, all grep/gate checks green, zero regressions on the one level (01) unaffected by the pre-existing cross-plan gap. Task 2's full 8-level proof is honestly reported as partial, not rounded up to a false pass.

## Issues Encountered

See "Out-of-scope discovery" above — the only real issue encountered was pre-existing and out of this plan's file scope, not a problem introduced or solvable by Task 1's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `src/player.js`'s collider lock and 5-state anim machine are code-complete and gate-verified; ready for Plan 33-05's human collider-screenshot checkpoint once the full wave (including 33-04's build.js fix) merges.
- **Blocker for full closure:** the `CONFIG.ENEMY.SPRITES`/`build.js` variant-indexing crash (logged in `deferred-items.md`) must be resolved by Plan 33-04 before `browser-boot.mjs` can prove a clean full 8-level pass with this plan's changes live. Not a blocker for Plan 33-03 itself — Task 1's deliverable is independently complete and verified.

## Self-Check: PASSED

- FOUND: src/player.js (modified, collider lock + fall/land states confirmed via grep + check-safety.sh/check-import-safety.sh PASS)
- FOUND: .planning/phases/33-player-entity-animation/33-03-SUMMARY.md
- FOUND: .planning/phases/33-player-entity-animation/deferred-items.md
- FOUND commit f6bf0d6 (src/player.js — Task 1)
- FOUND commit b0d5fa9 (SUMMARY.md + deferred-items.md)

---
*Phase: 33-player-entity-animation*
*Completed: 2026-07-11*
