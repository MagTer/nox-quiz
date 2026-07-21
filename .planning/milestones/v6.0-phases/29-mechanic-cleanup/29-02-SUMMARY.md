---
phase: 29-mechanic-cleanup
plan: 02
subsystem: game-mechanics
tags: [kaplay, save-format, fx, level-select, math-mechanics]

# Dependency graph
requires:
  - phase: 29-mechanic-cleanup
    provides: 29-01's atomic removal of the collect-the-answer mechanic, leaving secretAlcove.js and select.js untouched and ready for this plan's feedback/marker work
provides:
  - src/progress.js's markSecretFound(id)/hasSecretFound(id), mirroring markCleared/isLevelCleared exactly, validated with the same no-spread named-key === true coercion pattern
  - CONFIG.SAVE.VERSION bumped 2 -> 3 (deliberate no-migration reset), with browser-boot.mjs/audit-phase21-mechanics.mjs's seeded save fixtures kept in sync
  - secret alcove discovery feedback — particle burst + "pickup" chime + rising "+5 XP" popup, exactly once per run
  - level-select positive-only star marker on any level whose secret has been found, persisted across reload via the version-3 save
  - genuine human sign-off (not rubber-stamped) confirming all of the above in a real browser
affects: [30-harness-extensions, 34-level-quality-pass, 36-mechanic-ambient-change]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "New fx effect (popupText) follows the file's established self-cleaning tween idiom (tag 'fx', tween().onEnd() destroy) rather than introducing a new cleanup mechanism"
    - "secretFound tracked as a second closure-local map alongside cleared in progress.js, same seeding/serialize/validate shape — establishes the pattern for future per-level boolean facts"

key-files:
  created: []
  modified:
    - src/progress.js
    - src/config.js
    - scripts/browser-boot.mjs
    - scripts/audit-phase21-mechanics.mjs
    - scripts/smoke-progress.mjs
    - src/fx.js
    - src/mechanics/secretAlcove.js
    - src/scenes/game.js
    - src/scenes/select.js

key-decisions:
  - "Save version bumped 2 -> 3 as a deliberate no-migration reset, matching the established Phase 26 Nox Run rebrand precedent — loadSave()'s existing version-mismatch guard resets to defaults() on any mismatch, so no migration code was written."
  - "popupText() renders in world-space (no fixed()) so it floats at the alcove's position and scrolls with the camera, distinct from the HUD's screen-space LEVEL UP banner."
  - "'★' verified to render cleanly in-browser during Task 2 — no TOFU_FALLBACK substitution needed."
  - "Task 3 checkpoint received genuine human sign-off from the actual project owner (not auto-approved) per the plan's explicit 'do not rubber-stamp' verification note and standing Phases 25/27/28 precedent."

requirements-completed: [MECH-03, MECH-06]

coverage:
  - id: D1
    description: "progress.js gains markSecretFound(id)/hasSecretFound(id), symmetric with markCleared/isLevelCleared; secretFound round-trips through serialize()/validate() using the existing no-spread named-key === true coercion pattern; a malformed secretFound value (non-boolean) coerces to false, never throws"
    requirement: "MECH-06"
    verification:
      - kind: unit
        ref: "node scripts/smoke-progress.mjs (new MECH-06 block: fresh hasSecretFound false, markSecretFound then hasSecretFound true and per-id isolated, serialize() emits secretFound:true, reseeded createProgress() round-trips true)"
        status: pass
      - kind: unit
        ref: "bash scripts/check-progress.sh"
        status: pass
      - kind: automated_ui
        ref: "node scripts/browser-boot.mjs (proves version-3 seeded SAVE_BLOB/RESUME_SAVE_BLOB fixtures still accepted, not silently reset to defaults)"
        status: pass
    human_judgment: false
  - id: D2
    description: "CONFIG.SAVE.VERSION bumped 2 -> 3; browser-boot.mjs and audit-phase21-mechanics.mjs's seeded save literals bumped in lockstep so their pre-unlocked-level fixtures remain valid under the new version"
    requirement: "MECH-06"
    verification:
      - kind: unit
        ref: "grep -c \"VERSION: 3\" src/config.js == 1; grep -c \"version: 3\" scripts/browser-boot.mjs == 2; grep -c \"version: 3\" scripts/audit-phase21-mechanics.mjs == 1"
        status: pass
      - kind: automated_ui
        ref: "node scripts/browser-boot.mjs && node scripts/audit-phase21-mechanics.mjs"
        status: pass
    human_judgment: false
  - id: D3
    description: "Touching a secret alcove fires a particle burst (fx.pop), an audible chime (audio.playSfx('pickup')), and a rising '+5 XP' world-space popup (fx.popupText), all together, exactly once per run; the alcove entity is destroyed so nothing re-triggers at that spot"
    requirement: "MECH-03"
    verification:
      - kind: manual_procedural
        ref: "Human sign-off, Task 3: touched the level-01 secret alcove at http://192.168.10.113:8001/src/index.html?debug=1 and confirmed burst + chime + popup fire together exactly once"
        status: pass
    human_judgment: true
    rationale: "Simultaneous audio/visual/particle feedback firing together exactly once is a real-browser sensory judgment (per CLAUDE.md's 'checks that don't play the game lie' standard) that automation cannot assert — genuine human sign-off was required and received, not rubber-stamped."
  - id: D4
    description: "Level-select shows a positive-only star marker on any level whose secret has been found (distinct from the number label and lock/check glyph), with no '0/1' or missing-secret framing anywhere on the screen; the marker persists across a full page reload, proving the secretFound fact round-trips through the version-3 save"
    requirement: "MECH-06"
    verification:
      - kind: manual_procedural
        ref: "Human sign-off, Task 3: confirmed the star marker on level-01's tile after finding its secret, confirmed no negative/missing framing anywhere, confirmed the marker survives a full page reload"
        status: pass
    human_judgment: true
    rationale: "Absence of negative framing anywhere on the screen and persistence across a real reload are visual/functional judgments best made by a human looking at the live select screen, not inferable from static greps or headless automation alone."

# Metrics
duration: 9min
completed: 2026-07-09
status: complete
---

# Phase 29 Plan 02: Alcove Discovery Feedback + Level-Select Secret Marker Summary

**Secret alcove touch now fires a particle burst + audible chime + rising "+5 XP" popup exactly once, and level-select shows a positive-only star marker that survives reload — both threaded through a version-3, no-migration save-format bump, with genuine human sign-off received in a real browser.**

## Performance

- **Duration:** 9 min (Tasks 1-2 active execution; Task 3 checkpoint elapsed separately, pending genuine human verification)
- **Started:** 2026-07-09T22:36:10+02:00
- **Completed:** 2026-07-09T22:45:22+02:00 (Tasks 1-2); Task 3 sign-off received in this session
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify)
- **Files modified:** 9

## Accomplishments
- `src/progress.js` gained `markSecretFound(id)`/`hasSecretFound(id)`, byte-for-byte mirroring `markCleared`/`isLevelCleared`, backed by a second closure-local `secretFound` map seeded the same way as `cleared`
- `serialize()` extended to emit `secretFound: true` alongside `cleared: true` for the union of both fact key sets, preserving the sparse "only true facts get an explicit key" output shape
- `validate()` extended with the same strict `=== true`, no-spread, named-key coercion for `secretFound` that already protects `cleared` against prototype pollution
- `CONFIG.SAVE.VERSION` bumped `2` → `3` as a deliberate no-migration reset; `scripts/browser-boot.mjs`'s two seeded `version: 2` literals and `scripts/audit-phase21-mechanics.mjs`'s one seeded literal bumped in lockstep so their pre-unlocked-level fixtures stay valid
- `scripts/smoke-progress.mjs` gained a new "MECH-06: secretFound round-trips" test block exercising the fresh-false / mark-then-true / per-id-isolated / serialize / reseed-round-trip behaviors
- `src/fx.js` gained `popupText(at, label)` — a self-cleaning, world-space rising/fading text effect tagged `"fx"`, following the file's existing `dust()` rise/fade tween idiom exactly
- `src/mechanics/secretAlcove.js`'s `wireSecretAlcove` gained a `levelId` param; its `onCollide` handler now calls `progress.markSecretFound(levelId)`, `fx.pop(...)`, `fx.popupText(..., "+5 XP")`, and `audio.playSfx("pickup")` before destroying the alcove entity
- `src/scenes/game.js`'s `wireSecretAlcove` call site threads `levelId: level.id` through
- `src/scenes/select.js` renders a positive-only neon-green star in a tile's top-right corner when `progress.hasSecretFound(t.id)` is true, verified to render cleanly (no tofu-fallback substitution needed for "★")
- **Genuine human sign-off received for Task 3** from the actual project owner at `http://192.168.10.113:8001/src/index.html?debug=1`, confirming: (a) touching the level-01 secret alcove fires the particle burst + chime + "+5 XP" popup together, exactly once; (b) level-select shows the positive-only star marker on level 1's tile with no "0/1" or missing-secret framing anywhere; (c) the marker survives a full page reload, proving the round-trip through the version-3 save format

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend the save format — secretFound flag + version bump** - `bd14f5d` (feat)
2. **Task 2: Alcove discovery feedback + level-select secret marker** - `bf7a8e0` (feat)
3. **Task 3: Human sign-off — alcove discovery feedback + select-screen marker** - checkpoint:human-verify, no code changes; sign-off recorded in this SUMMARY

**Plan metadata:** (this commit — SUMMARY.md + REQUIREMENTS.md)

## Files Created/Modified
- `src/progress.js` - `markSecretFound`/`hasSecretFound` added; `secretFound` closure-local map seeded, serialized, and validated alongside `cleared`
- `src/config.js` - `SAVE.VERSION` bumped 2→3; `FX.XP_POPUP_SIZE`/`FX.XP_POPUP_RISE`/`FX.XP_POPUP_MS` and `SELECT.SECRET_SIZE`/`SELECT.SECRET_INSET` tunables added
- `scripts/browser-boot.mjs` - seeded `SAVE_BLOB`/`RESUME_SAVE_BLOB` `version` literals bumped 2→3
- `scripts/audit-phase21-mechanics.mjs` - seeded `SAVE_BLOB` `version` literal bumped 2→3
- `scripts/smoke-progress.mjs` - new MECH-06 round-trip test block
- `src/fx.js` - new exported `popupText(at, label)` self-cleaning world-space effect
- `src/mechanics/secretAlcove.js` - `levelId` param threaded through; fires `markSecretFound`/`fx.pop`/`fx.popupText`/`audio.playSfx("pickup")` on touch
- `src/scenes/game.js` - `wireSecretAlcove` call site passes `levelId: level.id`
- `src/scenes/select.js` - positive-only star marker rendered when `progress.hasSecretFound(t.id)` is true

## Decisions Made
- Save version bumped 2 → 3 as a deliberate no-migration reset, matching the established Phase 26 Nox Run rebrand precedent — `loadSave()`'s existing version-mismatch guard already resets to `defaults()` on any mismatch, so no migration code was needed or written.
- `popupText()` renders in world-space (no `fixed()`) so it floats at the alcove's position and scrolls with the camera, deliberately distinct from the HUD's screen-space "LEVEL UP" banner.
- "★" verified to render cleanly in-browser during Task 2 execution — no `TOFU_FALLBACK` ASCII substitution was needed.
- Task 3's checkpoint received genuine human sign-off from the actual project owner (not auto-approved), per the plan's explicit "do not rubber-stamp this checkpoint" instruction and the standing Phases 25/27/28 precedent, and per this project's memory note to never silently auto-approve `checkpoint:human-verify` gates.

## Deviations from Plan

None - plan executed exactly as written across all three tasks.

## Issues Encountered

None. The full 7-command gate suite (`check-gate.sh`, `check-safety.sh`, `check-import-safety.sh`, `check-progress.sh`, `validate-levels.mjs`, `browser-boot.mjs`, `audit-phase21-mechanics.mjs`) passed green after Task 2's edits, and the human verification checkpoint was approved without any defects surfaced.

## User Setup Required

None - no external service configuration required. Bumping `CONFIG.SAVE.VERSION` to 3 intentionally resets any existing browser progress on next load — this is expected, documented player-facing behavior (same no-migration convention as the earlier Nox Run rebrand), not a setup step.

## Next Phase Readiness
- MECH-03/MECH-06 fully satisfied; the secret alcove now gives real discovery feedback and level-select carries a persistent, positive-only record of found secrets.
- Phase 30 (Harness Extensions, MECH-04) is unblocked: the alcove's entity-destroy/XP-delta trigger signal now exists cleanly for the interactive audit to key off, and this plan's `levelId`-threaded `wireSecretAlcove` signature is the shape MECH-04's automated coverage should build against.
- Phase 36 (MECH-05, persistent in-level ambient change e.g. torch lighting) can build directly on this plan's `markSecretFound`/`hasSecretFound` seam — the per-level fact is already tracked and persisted; only the ambient visual change itself remains.
- Save format is now version 3 across the codebase (`src/config.js`, both seeded harness fixtures) with no lingering version-2 references outside historical CLAUDE.md commentary.

## Self-Check: PASSED

- FOUND: `src/fx.js` exports `popupText`
- FOUND: `src/progress.js` exports `markSecretFound`/`hasSecretFound`
- FOUND: commit `bd14f5d` (feat: save format secretFound flag + version bump)
- FOUND: commit `bf7a8e0` (feat: alcove discovery feedback + level-select secret marker)
- FOUND: `.planning/phases/29-mechanic-cleanup/29-02-SUMMARY.md`

---
*Phase: 29-mechanic-cleanup*
*Completed: 2026-07-09*
