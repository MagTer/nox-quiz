---
phase: 35-biome-re-dress-props
plan: 07
subsystem: level-descriptors
tags: [props, castle, level-07, level-08, ramparts, throne-keep, geometry-frozen, ART-06, ART-07]
requires:
  - phase: 35-05
    provides: "baked prop-castle-{column,candles,candle-stand,arch} sprites + manifest rows"
  - phase: 35-03
    provides: "trial sign-off — approved restrained/legibility-first density template"
provides:
  - "src/levels/level-07.js — restrained castle props[] (horizontal ramparts wall-walk dressing)"
  - "src/levels/level-08.js — restrained castle props[] (vertical throne-keep finale dressing) + climb-altitude far-wall arches (T-35-11 black-mess mitigation)"
  - "all 8 levels now carry a props layer — Phase 35 placement rollout complete"
affects: [35-08]
tech-stack:
  added: []
  patterns:
    - "Horizontal level (bounds.top 0): background props anchored as wall/battlement dressing along the lateral run (base on the floor/walk line), never floating in a shaft"
    - "Tall vertical level (bounds.top -720): NO prop touches a tight-headroom climb tier — on-surface accents only on the lower-gauntlet floors; a restrained few background arch windows dress the shaft at climb altitude to defeat the parallax black-mess void"
key-files:
  created: []
  modified:
    - src/levels/level-07.js
    - src/levels/level-08.js
key-decisions:
  - "level-07 (The Ramparts, horizontal) dressed with 8 props: 2 background gothic columns + 2 background arch windows as battlement wall dressing, 4 on-surface candle/candle-stand accents on the WIDE low floors + the broad tower top — NONE on the narrow WALK/merlon/drawbridge/fork/tower lane"
  - "level-08 (The Throne Keep, vertical finale) dressed with 11 props: 3 background gauntlet columns + 3 background climb-altitude arch windows (the T-35-11 black-mess mitigation) + 5 on-surface candle/candle-stand accents on the lower-gauntlet floors ONLY — the entire switchback climb, its 26px-headroom tiers, and the KEY apex spur (KA) left pristine"
  - "level-08's slightly higher prop count (11 vs level-07's 8, vs cemetery's 9) is proportionate: it is the longest (7800px) + tallest (740px climb) level in the game, and the extra props are spread across the long lower gauntlet + tall shaft, staying restrained per-screen"
metrics:
  duration: ~25min
  tasks: 2
  files: 2
  completed: 2026-07-18
status: complete
---

# Phase 35 Plan 07: Biome Re-dress — Castle Placement (level-07 + level-08) Summary

Dressed the two castle levels — **level-07 "The Ramparts"** (a HORIZONTAL lateral
wall-walk, bounds.top 0) and **level-08 "The Throne Keep"** (the tallest vertical
switchback finale, bounds.top −720) — with a restrained castle props layer using the
plan-05-baked `prop-castle-*` sprites, to the plan-03-approved legibility-first density.
This is the final placement plan: **all 8 levels now carry a props layer.** Geometry stayed
byte-frozen throughout (props are the top-level `props: []` field, structurally invisible to
the validator). The T-35-11 "black mess" failure mode — worst at climb altitude — is
mitigated on level-08 by a restrained few background arch windows dressing the tall shaft,
verified by the required climb screenshot.

## What was built

### Task 1 — level-07 "The Ramparts" castle props (commit 1dc776f)
8 props on the horizontal wall-walk:
- **Background (z −8, wall dressing):** 2 `prop-castle-column` gothic pillars (framing the
  spawn wall @x60 and the final tower climb @x4780, base on the floor line) + 2
  `prop-castle-arch` battlement windows (a mid-wall window @x1580 and a keep-crown window
  @x5420 near the tower top). All anchored as intentional battlement dressing along the
  lateral run — not floating clutter (bounds.top 0, no tall shaft).
- **On-surface (z −3, floor accents):** 2 `prop-castle-candle-stand` + 2 `prop-castle-candles`
  on the WIDE low floors (W1/W2/W4) and the broad tower top (TT), at clear margins.
- Every prop clear of the DOOR@380, ENEMY@3700, spikes (2800/3800/4650), coins, GOAL@5580,
  and the secret alcove@690. NONE on the narrow WALK/merlon/drawbridge/fork/tower lane.

### Task 2 — level-08 "The Throne Keep" castle props + screenshots (commit 26c48c7)
11 props on the vertical finale:
- **Background (z −8):** 3 `prop-castle-column` gauntlet pillars on the lower run (F0 spawn
  @x40, F3/F4 gap @x3160, keep run-up @x6380) + 3 `prop-castle-arch` far-wall windows dressing
  the tall switchback shaft at climb altitude (@y−140, @y−320, @y−620) — the T-35-11
  black-mess mitigation, behind every tier (never occluding a route).
- **On-surface (z −3):** 3 `prop-castle-candles` + 2 `prop-castle-candle-stand` on the
  lower-gauntlet floors ONLY (F0/F1/F3/F6/F8), at clear margins.
- **The entire switchback climb is pristine:** no prop touches a climb tier (K1–K9, KL, KH,
  SUM), the 26px-headroom overlapping slots, or the KEY apex spur (KA). Clear of the
  DOOR@880, ENEMY@3500, spikes (1600/2800/4200/5280/6000), coins, GOAL@7620, KEY@7280, and
  the secret alcove@320.

## Verification (gates)

| Gate | Result |
|---|---|
| `node scripts/validate-levels.mjs` | **PASS** — 0 HARD-FAIL (all reachability green; props validator-neutral) |
| `node scripts/check-assets-manifest.mjs` | **PASS** — 58 assets verified on disk |
| `node scripts/check-geometry-frozen.mjs` | **PASS** — all 8 levels byte-identical to the frozen baseline |
| `node scripts/browser-boot.mjs` | **PASS** — title → select → all levels loaded, no runtime errors, budget/FPS-safe with props |
| `node scripts/screenshot-phase35-props.mjs level-07 level-08` | **PASS** — 3 shots captured (level-07 spawn; level-08 spawn + climb) |

### Screenshots captured
- `.planning/phases/35-biome-re-dress-props/prop-shots/level-07-castle-spawn.png` (horizontal — spawn shot only, bounds.top 0)
- `.planning/phases/35-biome-re-dress-props/prop-shots/level-08-castle-spawn.png`
- `.planning/phases/35-biome-re-dress-props/prop-shots/level-08-castle-climb.png` (bounds.top −720 — the T-35-11 climb-altitude legibility proof)

There is deliberately **no level-07 climb shot** — level-07 is horizontal (bounds.top 0), so
the capture script emits a spawn shot only, exactly as the corrected geometry expects.

### Visual review (against the known failure modes)
- **Legibility (LOCKED):** PASS — every play lane clear; coins, door, and the secret-alcove
  hop unobstructed. Props are background-depth pillars/windows or small on-surface candles,
  never over the play lane.
- **"Black mess" parallax regression (T-35-11):** PASS — level-08's tall shaft reads as a
  rich, coherent castle interior at climb altitude (gothic arch windows + columns), no
  achromatic void.
- **Biome read (ART-07):** PASS — both levels unmistakably castle (carved gothic pillars with
  baked wall-lanterns, pointed-arch windows, altar candles).
- **Restrained density:** PASS — dressed, not cluttered, on both a lateral wall-walk and a tall climb.

## Perf / budget
- Props are a separate entity class (pure sprite+pos+z, NO area/body/rect collider) from the
  650 terrain-object cap. level-08 (the longest/tallest level) added 11 props; level-07 added 8.
  `browser-boot` PASS confirms both boot under budget and above the FPS floor with props present.

## Deviations from Plan

None — plan executed exactly as written. Geometry untouched (byte-frozen), props placed to the
plan-03-approved restrained approach, the corrected geometry honored (level-07 horizontal /
spawn-shot-only; level-08 vertical / spawn+climb), gates green.

## Known Stubs

None. Both `props` arrays reference only declared, on-disk `prop-castle-*` manifest keys; all
three screenshots render real baked art.

## Self-Check: PASSED

- Modified files exist: `src/levels/level-07.js` + `src/levels/level-08.js` — both carry a
  top-level `props` array (8 and 11 props respectively).
- Commits exist in git log: `1dc776f` (level-07), `26c48c7` (level-08).
- Screenshots on disk: `level-07-castle-spawn.png`, `level-08-castle-spawn.png`,
  `level-08-castle-climb.png` — all present in prop-shots/.
- Gates green: validate-levels, check-assets-manifest, check-geometry-frozen, browser-boot,
  screenshot capture.
