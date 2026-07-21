---
phase: 35-biome-re-dress-props
plan: 06
subsystem: levels-art
tags: [props, town, level-03, level-04, placement, legibility, geometry-frozen, ART-06, ART-07]
requires:
  - phase: 35-05
    provides: "5 baked prop-town-* sprites (barrel/crate/street-lamp/well/sign), manifest-declared"
  - phase: 35-03
    provides: "approved trial density/placement discipline (restrained, background+on-surface only, legibility-first)"
provides:
  - "src/levels/level-03.js — town props array (8 props: 6 on-surface + 2 background)"
  - "src/levels/level-04.js — town props array (4 props: 3 on-surface + 1 background; MINIMAL, budget-safe)"
  - "both town levels dressed; geometry byte-frozen; screenshots captured"
affects: [35-08]
tech-stack:
  added: []
  patterns:
    - "Town (rich-vocabulary biome) deliberately UNDER-dressed vs its available prop set — legibility beats atmosphere; a few accents per level, not clutter"
    - "Vertical/budget-critical level (level-04, longest even) gets MINIMAL props — 4 total, only on the three wide floors, off every switchback/traverse/key-spur climb lane"
    - "Props are a separate 'prop'-tagged entity class — NOT counted against the ground-cap/ground-fill OBJECT_BUDGET (650), so placement cannot push terrain over budget"
key-files:
  created: []
  modified:
    - src/levels/level-03.js
    - src/levels/level-04.js
key-decisions:
  - "level-03 (Rooftop Descent, horizontal, bounds.top 0): 8 props — background street-lamp (town depth below the spawn rooftop) + background well behind the F5 street; on-surface barrels/crates/street-lamp/sign on clear street floors (F1/F2/F3/F4/F6/F8), each clear of the door@1060, enemy@2680, four spikes, coins, goal@7500, and OFF the roof/market-fork climb lanes."
  - "level-04 (Twin Towers/Clocktower, vertical, bounds.top -420, budget-critical longest even): MINIMAL 4 props — 1 background street-lamp behind F0 spawn + 3 on-surface accents (barrel F0, crate F1, sign F2) on the WIDE floors ONLY, off both switchback towers, the high beam traverse, the descents, and the KEY spur (BKEY). Kept the vertical climb lane + key spur clear."
  - "Object budget confirmed via headless probe: level-04 terrain-objects = 393 / OBJECT_BUDGET 650 (headroom 257). Props (4) are a separate entity class not counted against the terrain budget, so the budget concern (T-35-09) is structurally moot AND numerically safe."
metrics:
  duration: ~20min
  tasks: 2
  files: 2
  completed: 2026-07-18
status: complete
---

# Phase 35 Plan 06: Town Re-dress & Props — level-03 + level-04 Summary

Dressed the two **town** levels (level-03 "Rooftop Descent", the calm horizontal intro; level-04
"Twin Towers"/Clocktower, the intense/vertical longest-even level) with a restrained top-level
`props` array using the 5 town sprites baked in plan 05 (`prop-town-{barrel,crate,street-lamp,well,sign}`),
placed to the density/placement discipline approved at the plan-03 trial checkpoint. Geometry stayed
byte-frozen; both levels boot, reach the goal, and stay well under budget.

## What was built

### Task 1 — level-03 town props (commit c5905d2)
- Appended a top-level `props: [...]` to `LEVEL_03` (sibling of mechanics/biome/parallax) — **8 props**:
  - **2 background (layer "back", z −8):** a street-lamp (town depth below the spawn rooftop) + a well behind the F5 street.
  - **6 on-surface (layer "surface", z −3, y = 320 − spriteHeight):** barrel@F1, crate@F2, street-lamp@F3, barrel@F4, crate@F6, sign@F8.
- Every prop clear of the door@1060, enemy@2680, the four spikes (2820/3580/4460/6240), the coins,
  the goal@7500, and OFF the rooftop-descent + market-stall-fork climb lanes.

### Task 2 — level-04 town props + screenshots (commit fa84267)
- Appended a top-level `props: [...]` to `LEVEL_04` — **MINIMAL 4 props** (budget-critical, longest even):
  - **1 background (layer "back"):** street-lamp behind the F0 spawn (vertical town mood).
  - **3 on-surface:** barrel@F0 (spawn-left, before door@360), crate@F1 (before enemy@3100), sign@F2 (landing corner, before spike@4750).
- Props on the three WIDE floors ONLY — off both switchback towers, the high beam traverse, the
  descents, and the KEY spur (BKEY). Vertical climb lane + key spur kept clear.

## Object budget (level-04, T-35-09)

| Metric | Value |
|---|---|
| level-04 terrain objects (ground-cap + ground-fill) | **393** |
| OBJECT_BUDGET | 650 |
| Headroom | **257** |
| level-04 prop entities | 4 (separate 'prop' class — NOT budget-counted) |

Props are a distinct entity class from the terrain ground-cap/ground-fill tiles the budget gate
counts, so placement cannot push level-04 over the cap — and the terrain count itself sits at 393,
comfortably under 650.

## Screenshots (prop-shots/)

- `.planning/phases/35-biome-re-dress-props/prop-shots/level-03-town-spawn.png` (horizontal, bounds.top 0 → spawn only)
- `.planning/phases/35-biome-re-dress-props/prop-shots/level-04-town-spawn.png` (vertical → spawn)
- `.planning/phases/35-biome-re-dress-props/prop-shots/level-04-town-climb.png` (vertical → climb)

**Visual review:** all three read as restrained town dressing with clear play lanes — level-03's
background street-lamp nestles in the town below the rooftop; level-04's spawn shows a barrel + lamp
accent beside the player with the door plainly visible; the level-04 climb frame carries no props at
altitude (correct — surface props are floor-only). Coins, door, and routes all unobstructed. Matches
the plan-03 approved discipline.

## Verification (gates)

| Gate | Result |
|---|---|
| `node scripts/validate-levels.mjs` | **PASS** — 0 HARD-FAIL (props validator-neutral) |
| `node scripts/check-assets-manifest.mjs` | **PASS** — 58 assets on disk |
| `node scripts/check-geometry-frozen.mjs` | **PASS** — all 8 levels byte-identical to baseline |
| `node scripts/browser-boot.mjs` | **PASS** — title→select→all levels boot, reach goal, no runtime errors; level-04 under OBJECT_BUDGET + above FPS_FLOOR |
| `node scripts/screenshot-phase35-props.mjs level-03 level-04` | **PASS** — 3 screenshots saved (level-03 spawn, level-04 spawn+climb) |

## Deviations from Plan

None — plan executed exactly as written. Props placed to spec, geometry untouched, all gates green,
level-04 kept minimal and budget-safe.

## Known Stubs

None. All props reference real manifest-declared baked sprites (`prop-town-*`) and render in-engine
(confirmed by the captured screenshots).

## Self-Check: PASSED

- Modified files exist and carry the props arrays: `src/levels/level-03.js` (8 props), `src/levels/level-04.js` (4 props).
- Commits exist: c5905d2 (level-03), fa84267 (level-04).
- Screenshots exist on disk: level-03-town-spawn.png, level-04-town-spawn.png, level-04-town-climb.png.
- Gates green: validate-levels, check-assets-manifest, check-geometry-frozen, browser-boot, screenshot capture.
