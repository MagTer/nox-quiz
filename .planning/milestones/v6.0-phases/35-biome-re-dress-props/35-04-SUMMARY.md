---
phase: 35-biome-re-dress-props
plan: 04
subsystem: props-art
tags: [props, level-dressing, swamp, cemetery, geometry-freeze, screenshot-evidence, rollout, ART-06, ART-07]
requires:
  - phase: 35-02
    provides: "11 baked prop sprites (swamp x4 + cemetery x7) + manifest kind:'prop' rows + build.js props emit loop + check-geometry-frozen.mjs + screenshot-phase35-props.mjs"
  - phase: 35-03
    provides: "human-approved trial look + legibility findings (the binding placement template)"
provides:
  - "level-02 (intense/vertical swamp) dressed with a restrained top-level props[] array; geometry byte-frozen"
  - "level-05 (calm cemetery intro V-valley) dressed with a restrained top-level props[] array; geometry byte-frozen"
  - "prop-shots/ — level-02 (spawn + climb) + level-05 (spawn) rollout screenshots for the plan-08 spot-check"
affects: [35-08, remaining-6-level rollout]
tech-stack:
  added: []
  patterns:
    - "Reuse-only rollout: dress a level by appending a top-level props[] referencing already-baked prop-{biome}-* keys — zero new art, geometry untouched"
    - "Vertical-level prop dressing: props on the CALM horizontal floor runs + background dead-corners only, OFF every climb/descent lane, key spur, and hazard"
    - "On-surface prop base rests on the ledge: y = surfaceY - spriteHeight (floor surface = FLOOR_Y 320)"
    - "Legibility guaranteed structurally: both prop layers at negative z (back -8, surface -3) render BEHIND every z(0) player/coin/terrain/mechanic"
key-files:
  created: []
  modified:
    - src/levels/level-02.js
    - src/levels/level-05.js
key-decisions:
  - "Mirrored the plan-03-approved trial discipline exactly: level-02 follows the level-01 swamp approach (3 background trees + 6 on-surface reed/fern/vine accents); level-05 follows the level-06 cemetery approach (2 background trees + 7 on-surface statue/stone-1..4/bush accents using the full rich vocabulary)."
  - "level-05 bounds.top = 0 (the V-valley stays within the 360px screen; highest point is the exit ledge y:118) — so the screenshot script correctly emitted a spawn shot ONLY for level-05, and spawn + climb for level-02 (bounds.top -560 < 0). The plan's own Task 2 text notes this (climb shot for level-02 only); the prompt's parenthetical 'level-05 bounds.top<0' is superseded by the descriptor's actual bounds.top 0."
  - "Left the pre-existing baked swamp parallax torches/flames untouched — they are frozen biome/parallax art (the non-blocking flag raised in the plan-03 sign-off), not props, and out of this plan's byte-frozen scope."
patterns-established:
  - "Reuse-only level dressing (append props[] with already-baked keys, no bake step)"
metrics:
  duration: ~20min
  tasks: 2
  files: 2
  completed: 2026-07-17
status: complete
---

# Phase 35 Plan 04: Biome Re-dress Props — Swamp + Cemetery Rollout Summary

Dressed the two remaining levels whose biomes were already baked and human-approved in the
trial (plans 02/03): **level-02** (the intense/vertical branching-switchback swamp) and
**level-05** (the calm cemetery DOWN–ACROSS–UP V-valley intro). Pure placement — REUSED the
already-on-disk `prop-swamp-*` and `prop-cemetery-*` sprites, baked ZERO new art. Each level
gained a restrained top-level `props[]` array applying the plan-03-approved density/placement
discipline; geometry left byte-frozen. Captured the rollout screenshots for the plan-08
spot-check.

## What was built

### Task 1 — Restrained swamp props on level-02 (commit 020c9a0)
- `src/levels/level-02.js`: appended a top-level `props[]` (sibling of `mechanics`/`biome`/
  `parallax`) — the `geometry` object byte-untouched. Follows the plan-03-approved level-01
  swamp approach: **3 background gnarled trees** (layer `back`, base at the floor line
  `y = 320 - 159 = 161`) behind the CALM horizontal floor runs (F1 left of the door, F5
  descent-landing, F8 run-in) + **6 on-surface reed/fern/vine accents** (layer `surface`,
  `y = surfaceY - height`) on clear floor tops (F0/F1/F4/F5/F7/F8).
- Because level-02 is the intense/vertical spire level, every prop is kept OFF both spire
  climb/descent lanes (spire 1 ~x2680..3800, spire 2 ~x4780..5480), the KEY spur/summit, and
  clear of the DOOR@800, ENEMY@6030, the four spikes (1370/1920/6100/6660), the coins, the
  KEY, and the GOAL@7360.
- Gates: `validate-levels` PASS (0 HARD-FAIL), `check-assets-manifest` PASS (49), `check-geometry-frozen` PASS (byte-identical).

### Task 2 — Cemetery props on level-05 + rollout screenshots (commit e54f7dd)
- `src/levels/level-05.js`: appended a top-level `props[]`. Follows the plan-03-approved
  level-06 cemetery approach: **2 background cemetery trees** (one framing the high spawn
  entrance ledge EL0, base at the ledge line `y = 150 - 117 = 33`; one in the catacomb depth
  behind F2, base `y = 320 - 117 = 203`) + **7 on-surface accents** using the full RICH
  vocabulary (statue + all four stone types + 2 bush) sparsely across the WIDE basin floors
  F1..F6.
- Props kept OFF the entry descent (EL0/ED1/ED2), the crypt fork (PLA/PLB/PHB) + coffin-lid
  pillars, and the out-climb stair (OC1..OC3/XL), and clear of the DOOR@1080, ENEMY@1850, the
  four spikes (1980/2760/3520/4270), the coins, and the GOAL@6180.
- Gates: `validate-levels` PASS, `check-assets-manifest` PASS, `check-geometry-frozen` PASS,
  `browser-boot` PASS (title -> select -> all 8 levels loaded, no runtime errors, under
  OBJECT_BUDGET / above FPS_FLOOR with props).

## Verification gate results

| Gate | Result |
|------|--------|
| `node scripts/validate-levels.mjs` | PASS (0 HARD-FAIL) |
| `node scripts/check-assets-manifest.mjs` | PASS (49 assets verified on disk) |
| `node scripts/check-geometry-frozen.mjs` | PASS (all 8 levels byte-identical to the frozen baseline) |
| `node scripts/browser-boot.mjs` | PASS (title -> select -> all levels loaded, no runtime errors) |
| `node scripts/screenshot-phase35-props.mjs level-02 level-05` | PASS (3 shots captured) |

## Screenshots produced (for the plan-08 spot-check)

All under `/home/magnus/dev/nox-quiz/.planning/phases/35-biome-re-dress-props/prop-shots/`:

| File | Shows |
|------|-------|
| `level-02-swamp-spawn.png` | Swamp spawn — a reed accent beside the player; every coin renders in front; route legible. |
| `level-02-swamp-climb.png` | Spire summit altitude — a clean vertical traversal lane, props kept at the floor line off the climb. |
| `level-05-cemetery-spawn.png` | Cemetery entrance ledge — the gnarled tree frames the spawn behind the player/coins (correct z-order, no occlusion); blue-moon parallax + tombstone silhouettes. |

Visual read (executor review): props are atmospheric background/on-surface accents; every
route, coin, hazard, mechanic, and the door/enemy/goal stay legible. Props render behind the
player/coins/terrain (both layers negative z) — no occlusion. On-surface bases rest on their
ledges (no floaters/sinkers). The look matches the plan-03-approved trial exactly (the
level-05 tree framing replicates the approved level-06 cemetery spawn framing).

## Deviations from Plan

### Design clarification (descriptor-faithful, documented)

**1. [Clarification] level-05 got a spawn shot only (not spawn + climb)**
- **Issue:** The execution prompt's constraint said "level-02 & 05 are vertical bounds.top<0
  so they get spawn AND climb shots." But `getLevel("level-05").bounds.top` is **0**, not
  negative — the V-valley stays within the 360px screen (its highest point is the exit ledge
  y:118). `screenshot-phase35-props.mjs` keys the climb shot on `bounds.top < 0` (geometry,
  never level parity), so it correctly emitted a spawn shot ONLY for level-05.
- **Resolution:** No code change. The plan's own Task 2 text is authoritative and already
  says "capture spawn shots (+ climb shot for level-02, a vertical even level)" — i.e. it
  expects the climb shot for level-02 only. level-02 (bounds.top -560) got spawn + climb as
  expected. Reported here because the prompt's parenthetical disagreed with the descriptor.

## Known Stubs

None. Both `props[]` arrays reference only already-baked, manifest-declared prop sprites on
disk (verified by `check-assets-manifest` — 49 assets green). No placeholders, no empty data
flowing to render.

## Self-Check: PASSED

- Modified files exist: `src/levels/level-02.js`, `src/levels/level-05.js` — both carry a
  top-level `props[]`; geometry byte-frozen (`check-geometry-frozen` PASS).
- Commits exist in git log: 020c9a0 (level-02), e54f7dd (level-05).
- Screenshots exist on disk: `prop-shots/level-02-swamp-spawn.png`,
  `prop-shots/level-02-swamp-climb.png`, `prop-shots/level-05-cemetery-spawn.png`.
- All gates green: validate-levels, check-assets-manifest, check-geometry-frozen, browser-boot, screenshot capture.
