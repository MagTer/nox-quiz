# Phase 39 — Context (map + decisions)

Source: user's post-kid-playthrough feedback (2026-07-19) + a full code map of the
relevant mechanics/levels. This file is the research the planner should build on —
it is grounded in file:line evidence so plans don't need to re-discover.

## User decisions (locked, 2026-07-19)
1. **Skull (L1/L2)** → **swap for a lantern** (keep the secret-alcove flicker light).
2. **Moving spikes** → **slide along the ground** (horizontal patrol).
3. **Movers over holes** → **full re-placement** (relocate over real pits, remove static
   stepping-stones, update the walk-only audit harness to ride movers, re-freeze baseline).
4. **Skeletons** → **ground patrol** (drop to floor, visible sweep, off the coins).
5. **Barrels/boxes** → default **all 6 town props solid** (revisit only if a route breaks).

## Data model (from the map)
- Each level descriptor = `geometry` sub-object (frozen static arrays) + a **top-level**
  `props` array (decoration, outside geometry). Built by `src/levels/build.js`. Tunables in
  `src/config.js`. Registry `src/levels/index.js`.
- Ground/hole geometry: floors are `{x,w}` spans pinned to `FLOOR_Y=320`; **a hole is simply
  the empty x-range between two floor spans** (no explicit hole object). Platforms `{x,y,w,h}`.

## Frozen-geometry gate (critical constraint)
- `scripts/check-geometry-frozen.mjs` + baseline `scripts/fixtures/geometry-frozen-baseline.json`.
- Hashes `getLevel(id).geometry` with `{ movers, patrollers, ...frozen }` stripped → compact
  JSON per level, byte-compared. `--write` re-baselines. **NOT part of `check-gate.sh`** — run
  it explicitly.
- **EXEMPT (edit freely, no re-baseline):** `geometry.movers`, `geometry.patrollers`, and the
  entire top-level `props` array.
- **TRIPS the gate (needs `--write` acknowledgment):** floors, platforms, coins, spikes, goal,
  checkpoints, doors, mathGates, enemies, keys, locks, secretAlcove, bounds — even a 1px nudge.

## POL-01 — Skeletons (patrollers) → ground patrol
- Factory `build.js:580-595`: real Kaplay `patrol()` (waypoints, `endBehavior:"ping-pong"`,
  `foe.play("walk")`, sprite `patroller.png` skeleton). Contact → `respawn()` (game.js:277). The
  component WORKS — this is a placement/tuning fix, not missing movement.
- Current authored **hovering at y:214** over walk-lanes, directly above floor coins (y:264),
  slow ~40px/s / ~100px sweep → reads as "stationary skeleton floating on a coin."
- Placements (all y:214): L1 `1770-1880` (level-01.js:245); L2 two `900-1000`,`4560-4660`
  (level-02.js:323,329); L3 `1780-1960` (level-03.js:238); L4 two `460-560`,`3200-3300`
  (level-04.js:239,245); L5 `1150-1250` (level-05.js:214); L6 two `1900-2020`,`2470-2560`
  (level-06.js:217,221); L7 `450-550` (level-07.js:207); L8 two `960-1060`,`3560-3660`
  (level-08.js:346,350).
- Fix: lower waypoint y to a grounded value (skeleton frame 44×52; sit its feet on FLOOR_Y),
  widen + speed the sweep so it visibly walks, and shift x so it isn't parked over a floor coin.
  NOTE: a grounded skeleton across a walk-lane now genuinely blocks — that's the intended danger,
  but each level must stay clearable (there must be room to pass between sweeps or over it).
- The math-challenge blocker is a SEPARATE static hell-hound (`enemies` array, build.js:349-381) —
  do NOT confuse with the skeleton; leave enemies as-is unless a plan says otherwise.

## POL-02 — Sliding spikes (NEW mechanic)
- Current spikes: `build.js:243-260`, static `sprite("spike")` + tight static `area()` tagged
  `"spike"`, no body/onUpdate. Config `SPIKE_SIZE:16`, hitbox 12×8 (config.js:156-158). Contact →
  `respawn()` (game.js:269).
- No moving-spike code exists. Build it by reusing the **mover** oscillation pattern
  (`build.js:530-570`: `onUpdate` + `dt()` raised-cosine between `(x1,y1)`↔`(x2,y2)`). A sliding
  spike = spike sprite + spike `area()` + that oscillation, authored like a mover but tagged
  `"spike"`. New descriptor key (e.g. `geometry.slidingSpikes` or a `moving:true` spike) — decide
  whether it lives under an EXEMPT key or a frozen one (prefer an exempt/motion key so placement
  tuning doesn't churn the baseline; mirror how movers/patrollers are stripped).
- Validators/audit (`validate-levels.mjs`, `audit-phase21-mechanics.mjs`, reachability) must learn
  the new hazard so a level still validates and the walk-only driver can time past it.

## POL-03 — Movers over real holes (FULL, the big lift)
- Mover factory `build.js:530-570`; config `MOVER` (config.js:279-286). All 8 movers currently
  ride SOLID floor **deliberately** — the walk-only audit driver would softlock on a mover over a
  killing pit. Several sweeps are near-zero (~40px: L4/L7/L8).
- Real holes are bridged today by STATIC stepping-stones (frozen platforms), e.g. L8 moat
  1880-2520 (BARBICAN platforms level-08.js:91-95,114-126) and chasm 4480-5000.
- Full re-placement per level: pick a real pit, remove the static stepping-stones there (FROZEN
  edit), place/retune the mover to span it (EXEMPT edit), verify a missed hop falls to respawn
  (checkpoint reachable, no true softlock for a player).
- **Harness:** teach `scripts/browser-boot.mjs` AND `scripts/audit-phase21-mechanics.mjs` (and any
  reachability check in `validate-levels.mjs`) to ride a moving platform — else auto-verify can
  never cross the new gaps. The Playwright scripts are deliberately duplicated (CLAUDE.md) — fix
  identically in each copy by hand.
- **Re-freeze:** `node scripts/check-geometry-frozen.mjs --write` after the frozen edits, as the
  deliberate acknowledgment. Commit the new baseline.

## POL-04 — Solid props (barrels/boxes)
- Props loop `build.js:463-528`: sprite+pos+z(negative)+opacity ONLY, explicitly NO area/body
  (header build.js:467-469). Props render BEHIND the player (negative z, config.js:116-119).
- Barrels/crates only in town levels: L3 barrel@880, crate@1810, barrel@3400, crate@5420
  (level-03.js:269-273); L4 barrel@60, crate@2760 (level-04.js:272-273). All `layer:"surface"`.
- Add an opt-in `pr.solid` branch: give it `area()` + `body({isStatic:true})` sized to the sprite,
  and bring its z to >=0 so it visually blocks. It becomes route-affecting → the validator/audit
  must know a solid prop exists so a level stays clearable (player can jump it — check jump envelope
  in docs/LEVEL-DESIGN.md). Keep default props collider-free (don't regress the whole layer).

## POL-05 — Prop cleanup
- **Skull** = `prop-swamp-lantern` (baked from `fire-skull.png`, build-art-assets.py:1571-1583),
  at `{x:320,y:242,layer:"surface"}` in L1 (level-01.js:287) & L2 (level-02.js:377). It is ALSO the
  MECH-05 alcove light (build.js:490-527, game.js `lightAmbient()`) — sits within `LINK_DIST` of
  `secretAlcove@320,184`, tagged `"alcove-light"`, dim-until-discovered. **Swap for a non-skull
  light sprite** (bake/choose a lantern/candle) at the SAME coords with the SAME alcove-light link
  so the discovery glow survives.
- **Well** = `prop-town-well` `{x:4400,y:255,layer:"back"}` (level-03.js:265); L3 F5 spike at
  x:4460 (level-03.js:161). Move the well (prop, EXEMPT) clear of the spike — don't move the spike
  (frozen).
- **Columns** = `prop-castle-column` (church pillar w/ carved faces, build-art-assets.py:1644-1646),
  L8 all `layer:"back",y:130`: x:40 (spawn), x:3160 (over F3/F4 gap 3080-3240), x:6380 (over F7/F8
  gap 6280-6440) — level-08.js:374-376. Reposition all three to read as intentional (props, EXEMPT).

## Gate suite to run (CLAUDE.md)
`check-gate.sh`, `check-safety.sh`, `check-import-safety.sh`, `check-progress.sh`,
`check-assets-manifest.mjs`, `check-terrain-atlas.sh` (if build-art-assets.py touched for the
lantern), `validate-levels.mjs`, **`check-geometry-frozen.mjs`** (explicit; `--write` when POL-03
re-baselines), `browser-boot.mjs`, `audit-phase21-mechanics.mjs`. No phase closes on automation
alone — interactive proof + the VER-02 kid-UAT re-run.
