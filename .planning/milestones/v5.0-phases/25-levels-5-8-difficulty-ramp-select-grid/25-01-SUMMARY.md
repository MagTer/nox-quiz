---
phase: 25-levels-5-8-difficulty-ramp-select-grid
plan: "01"
subsystem: progression + mechanics
tags: [xp, mechanic, secret-alcove, LVL-06]
dependency-graph:
  requires: []
  provides:
    - "progress.addBonusXp(amount)"
    - "CONFIG.PROGRESS.XP_ALCOVE"
    - "src/mechanics/secretAlcove.js wireSecretAlcove({ player, progress })"
    - "buildLevel() geometry.secretAlcove loop"
  affects:
    - src/progress.js
    - src/config.js
    - src/mechanics/secretAlcove.js
    - src/levels/build.js
    - src/scenes/game.js
    - scripts/check-import-safety.sh
tech-stack:
  added: []
  patterns:
    - "Sibling XP method (addBonusXp) reusing addXp's identical carry-over while-loop, seeded from a raw amount instead of a table lookup"
    - "Walk-through-only tagged area() entity (no blocker collider) for a non-punishing collectible, unlike every other mechanic in build.js"
key-files:
  created:
    - src/mechanics/secretAlcove.js
  modified:
    - src/progress.js
    - src/config.js
    - src/levels/build.js
    - src/scenes/game.js
    - scripts/check-import-safety.sh
decisions:
  - "addBonusXp(amount) is a new sibling method on createProgress(), not a call-site reuse of addXp(table) — calculateXp(table) can only ever yield XP_EASY/XP_HARD (10/20), never an arbitrary flat amount like the alcove's 5"
  - "secretAlcove.js is the only mechanic wired with progress instead of brain in game.js, since it never opens a challenge and has no math-selection concern"
  - "build.js's new secretAlcove loop has NO blocker collider (walk-through trigger), unlike doors/gates/enemies which all need an apex-derived tall anti-jump-over blocker"
metrics:
  duration: "~3 min"
  completed: 2026-07-06
status: complete
---

# Phase 25 Plan 01: Secret-Alcove XP-Bonus Mechanism Summary

Built the secret-alcove XP-bonus mechanism end-to-end: a new `progress.addBonusXp(amount)` method for flat non-table-scaled XP awards, a new fire-once `wireSecretAlcove` collision mechanic that never pauses the player or opens a challenge, and the `build.js`/`game.js` wiring that turns a level's `geometry.secretAlcove` array into a silent, walk-through bonus.

## What Was Built

**Task 1 — `progress.js` addBonusXp + `config.js` XP_ALCOVE constant**

- `src/progress.js`: added `addBonusXp(amount)` immediately after the existing `addXp(table)` method, on the object literal `createProgress()` returns. It reuses the IDENTICAL carry-over while-loop body (`xp -= threshold(level); level += 1; leveledUp = true;`) but seeds it from `xp += amount` instead of `xp += calculateXp(table)`. `addXp` itself has zero diff.
- `src/config.js`: added `CONFIG.PROGRESS.XP_ALCOVE: 5` immediately after `XP_HARD: 20`, with an inline comment explaining it is deliberately below `XP_EASY` (10) so it reads as a bonus, not a shortcut.
- Verified both behavior cases: a fresh `createProgress().addBonusXp(5)` leaves xp=5, level=1, returns `false`; `createProgress({xp:198, level:1}).addBonusXp(5)` leaves xp=3, level=2, returns `true` (198+5=203 >= threshold(1)=200, surplus carried over, never reset to 0).

**Task 2 — `secretAlcove.js` mechanic (new) + `build.js` loop + `game.js` wiring + `check-import-safety.sh` scope**

- New `src/mechanics/secretAlcove.js` exports `wireSecretAlcove({ player, progress })`. A closure-local `const found = new Set()` fire-once latch (never module-level, anti-leak — same pattern as `enemy.js`'s `defeated` Set). On `player.onCollide("secret-alcove", ...)`: if already found, return; otherwise mark found, call `progress.addBonusXp(CONFIG.PROGRESS.XP_ALCOVE)`, and `destroy(alcoveObj)`. No `openChallenge` call, no `player.paused`, no `player.vel` zeroing — touching the alcove never freezes the player or opens any UI.
- `src/levels/build.js`: added a new loop after the `answerPickupSlots` block: `for (const a of g.secretAlcove ?? []) { add([rect(24, 24), pos(a.x, a.y), area(), opacity(0), "secret-alcove"]); }` — no blocker collider, no visible panel, no glyph, guarded with `?? []` so every existing level (none of which have a `secretAlcove` key yet) still builds without error.
- `src/scenes/game.js`: added `import { wireSecretAlcove } from "../mechanics/secretAlcove.js";` and `wireSecretAlcove({ player, progress });` alongside the other four mechanic wirings — the only call site passing `progress` instead of `brain`.
- `scripts/check-import-safety.sh`: added `"src/mechanics/secretAlcove.js"` to both the Section 0 existence/syntax loop and the Section 2 negative a727c13 scan loop, matching how `door.js`/`gates.js`/`enemy.js`/`collect.js` are already scoped.

## Verification

- `node -e` one-liner: both `addBonusXp` behavior cases pass (no-level-up and level-up-with-carry-over), `addXp` untouched.
- `bash scripts/check-import-safety.sh` → `import-safety checks: PASS` (secretAlcove.js is syntax-valid and a727c13-clean under the calibrated trap).
- `node scripts/validate-levels.mjs` → `validate-levels: PASS` (identical pass/fail state to immediately before this plan — still 4 levels, no level content changed; `secretAlcove` is intentionally not a recognized validator kind, per 25-RESEARCH.md Pitfall 3).

## Deviations from Plan

None — plan executed exactly as written.

One self-correction during execution: the initial `secretAlcove.js` header comment described the "no challenge / no freeze" contract using the literal strings `openChallenge` and `player.paused` in prose, which tripped the plan's own negative-grep acceptance check (`! grep -q "openChallenge"` / `! grep -q "player.paused"`). Reworded the comment to describe the same contract without using those literal tokens, then re-verified — this is a same-task self-fix during initial authoring, not a deviation from the plan's intent.

## Known Stubs

None. No level descriptor references `secretAlcove` yet (by design — this plan builds the mechanism only; Plans 25-03/25-04 wire actual content into it).

## Self-Check: PASSED

- FOUND: src/mechanics/secretAlcove.js
- FOUND: src/progress.js (addBonusXp present)
- FOUND: src/config.js (XP_ALCOVE present)
- FOUND commit b397477 (Task 1)
- FOUND commit 41704ff (Task 2)
