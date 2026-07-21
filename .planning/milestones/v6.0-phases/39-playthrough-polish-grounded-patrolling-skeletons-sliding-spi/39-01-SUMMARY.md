---
phase: 39-playthrough-polish-grounded-patrolling-skeletons-sliding-spi
plan: 01
subsystem: game-engine
tags: [kaplay, level-builder, hazards, sliding-spike, solid-prop, reachability, harness]

# Dependency graph
requires:
  - phase: 36-motion-life
    provides: mover raised-cosine oscillation idiom + patroller motion keys + freeze-strip precedent
provides:
  - "geometry.slidingSpikes builder loop (dt raised-cosine horizontal spike, tagged 'spike', no body())"
  - "CONFIG.SLIDING_SPIKE.PERIOD_S tunable"
  - "pr.solid opt-in builder branch (static collider at play depth, config/descriptor-sized)"
  - "CONFIG.PROPS.SOLID_Z / SOLID_W / SOLID_H tunables"
  - "slidingSpikes stripped from the frozen-geometry hash (EXEMPT motion key)"
  - "reachability.solidBoxes(geometry, solidProps) models solid props as static AABBs"
  - "validate-levels passes the solid:true prop subset to clearability"
  - "driveToXPlanned reactive stall-recovery jump over a jump-over solid prop"
affects: [39-02, 39-03, 39-04, 39-05, 39-06, 39-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Compose two existing analogs (spike entity + mover oscillation) into a new hazard rather than greenfield code"
    - "Config/descriptor PRIMARY collider sizing (never async sprite dims) so the built collider matches the reachability model byte-for-byte"
    - "New motion key added to the freeze-strip destructure = EXEMPT (placement tuning never trips the gate)"

key-files:
  created: []
  modified:
    - src/config.js
    - src/levels/build.js
    - scripts/check-geometry-frozen.mjs
    - scripts/lib/mechanic-drive.mjs
    - scripts/lib/reachability.mjs
    - scripts/validate-levels.mjs

key-decisions:
  - "Sliding spike is an ADD-ALONGSIDE motion variant under geometry.slidingSpikes, sharing the SAME 'spike' tag + respawn seam (no second onCollide wire)"
  - "Solid prop collider sized from pr.solidW/H or CONFIG.PROPS.SOLID_W/H (24x24 default) as the PRIMARY synchronous source; async sprite introspection is at most a fallback"
  - "Solid and light are mutually exclusive (isLight = !isSolid && LIGHT_RE) so a solid prop never gets flicker/alcove-link"
  - "validate-levels passes envelope=undefined to let checkLevelReachability apply its own JUMP_ENVELOPE default (avoids re-importing the constant)"

patterns-established:
  - "Solid-prop stall-recovery: the walk-only driver detects a physical-x stall while grounded/driving-forward with no planned takeoff, and fires ONE envelope-bounded hop; cooldown-bounded so an unclearable wall still trips the hard stall guard"

requirements-completed: [POL-02, POL-04]

coverage:
  - id: D1
    description: "geometry.slidingSpikes renders a horizontally-sliding, 'spike'-tagged, body-less hazard via dt raised-cosine (no timer)"
    requirement: "POL-02"
    verification:
      - kind: automated
        ref: "bash scripts/check-safety.sh && bash scripts/check-import-safety.sh"
        status: pass
      - kind: manual_procedural
        ref: "in-engine: author a slidingSpikes entry and confirm it slides + respawns on contact (deferred to 39-04+ data plans / 39-05 browser-boot)"
        status: unknown
    human_judgment: true
    rationale: "This plan ships the builder capability with ZERO level-data placement; visual/functional proof of the moving spike requires a level authoring the key (39-04+) and the 39-05 browser-boot run."
  - id: D2
    description: "pr.solid gives a prop a static collider at play depth (config/descriptor-sized); default props stay collider-free negative-z"
    requirement: "POL-04"
    verification:
      - kind: automated
        ref: "bash scripts/check-import-safety.sh (import-safety) + grep source assertions (pr.solid branch has body({isStatic:true}) + SOLID_Z, no bare numeric dims)"
        status: pass
      - kind: manual_procedural
        ref: "in-engine: author solid:true on a town prop and confirm it blocks + is jump-clearable (deferred to 39-04+ / 39-05)"
        status: unknown
    human_judgment: true
    rationale: "Capability-only; blocking behaviour and jump-clearability are proven once a level authors solid:true and browser-boot crosses it (39-05)."
  - id: D3
    description: "Gate + harness know both hazards: slidingSpikes EXEMPT from freeze hash; reachability models solid props; validate-levels passes them; driver recovers over a solid prop"
    requirement: "POL-02, POL-04"
    verification:
      - kind: automated
        ref: "node scripts/check-geometry-frozen.mjs (PASS) && node scripts/validate-levels.mjs (0 HARD-FAIL)"
        status: pass
    human_judgment: false

# Metrics
duration: ~20min
completed: 2026-07-19
status: complete
---

# Phase 39 Plan 01: Sliding-Spike + Solid-Prop Builder Foundation Summary

**Two net-new builder capabilities — a dt-driven horizontally-sliding spike (geometry.slidingSpikes, shared 'spike' respawn seam) and an opt-in solid prop (pr.solid static collider at play depth) — plus the freeze-gate exemption, reachability model, validator plumbing, and walk-only driver stall-recovery that make both safe to author.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-19
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- **POL-02 sliding spike:** `geometry.slidingSpikes` builder loop composes the tightened spike hitbox (tagged `"spike"`, reusing the existing `game.js:269` respawn seam — zero new wiring) with the mover's `onUpdate`+`dt()` raised-cosine oscillation, and NO `body()`. Config `CONFIG.SLIDING_SPIKE.PERIOD_S` holds the period (per-entity `period` override).
- **POL-04 solid prop:** opt-in `pr.solid` branch adds `area()` + `body({ isStatic: true })` at `CONFIG.PROPS.SOLID_Z` (play depth z(0)), sized from `pr.solidW/H` or `CONFIG.PROPS.SOLID_W/H` (PRIMARY, magic-number-free, never async sprite dims). Default props stay collider-free at negative z.
- **Gate + harness awareness:** `slidingSpikes` stripped from the frozen hash (EXEMPT); `deriveEncounters` emits sliding spikes as idx-keyed `"spike"` encounters mapped to the spike-hop path; `solidBoxes(geometry, solidProps)` models solid props as static AABBs threaded through `planCoinWitnesses` + `checkLevelReachability`; `validate-levels` captures top-level props and passes the `solid:true` subset; `driveToXPlanned` gained a reactive stall-recovery hop over a jump-over solid prop — all in the SHARED lib (no copied code into browser-boot.mjs / audit-phase21-mechanics.mjs).

## Task Commits

1. **Task 1: POL-02 sliding-spike builder loop + config** - `10ce1e2` (feat)
2. **Task 2: POL-04 opt-in solid-prop branch + config** - `93a98c5` (feat)
3. **Task 3: Gate + harness awareness (sliding spike + solid prop)** - `65cc305` (feat)

## Files Created/Modified
- `src/config.js` - Added `CONFIG.SLIDING_SPIKE.PERIOD_S` and `CONFIG.PROPS.SOLID_Z/SOLID_W/SOLID_H`
- `src/levels/build.js` - Added `geometry.slidingSpikes` loop + `pr.solid` branch in the props loop
- `scripts/check-geometry-frozen.mjs` - Strip `slidingSpikes` from the freeze hash (EXEMPT)
- `scripts/lib/mechanic-drive.mjs` - `deriveEncounters` slidingSpikes emit + `driveToXPlanned` solid-prop stall-recovery jump
- `scripts/lib/reachability.mjs` - `solidBoxes(geometry, solidProps)` models solid props; threaded through `planCoinWitnesses` + `checkLevelReachability`; slidingSpikes passable note
- `scripts/validate-levels.mjs` - Capture top-level props, pass `solid:true` subset to clearability

## Decisions Made
- **Add-alongside sliding spike:** static `geometry.spikes` untouched; the sliding variant shares the `"spike"` tag + respawn seam (deliberate single-source coupling, not debt).
- **Config/descriptor PRIMARY sizing:** the solid-prop collider and the reachability model read the SAME `pr.solidW/H` / `CONFIG.PROPS.SOLID_W/H` source, so the checked box matches the built collider byte-for-byte — no reliance on async-loaded sprite dimensions.
- **Solid ≠ light:** `isLight = !isSolid && LIGHT_RE.test(...)` guarantees a solid prop never gets the flicker/alcove-light path.
- **envelope=undefined in validate-levels** to reuse `checkLevelReachability`'s own `JUMP_ENVELOPE` default rather than importing the constant.

## Deviations from Plan

None - plan executed exactly as written. All source assertions, `check-safety.sh`, `check-import-safety.sh`, `check-gate.sh`, `check-assets-manifest.mjs`, `check-geometry-frozen.mjs` (PASS), and `validate-levels.mjs` (0 HARD-FAIL) are green.

## Known Stubs
None. Both capabilities are intentionally INERT (guarded with `?? []` / opt-in `solid:true`) until the 39-04+ data plans author the new keys — this is the declared wave-1 code foundation, not an unwired stub. No level authors `slidingSpikes` or `solid:true` yet, so all gates pass unchanged.

## Issues Encountered
- `JUMP_ENVELOPE` is imported into `reachability.mjs` but not re-exported; rather than add a new import to `validate-levels.mjs`, passed `envelope=undefined` so the function's own default applies. Resolved cleanly.

## Next Phase Readiness
- The builder now understands `geometry.slidingSpikes` and `pr.solid`; the freeze gate ignores the new motion key; the reachability model + walk-only driver recognise both hazards.
- 39-04..39-07 (level-data plans) can now author `slidingSpikes` and `solid:true` against a builder + harness that already support them.
- 39-03 owns the browser-boot.mjs / audit-phase21-mechanics.mjs harness copies (the shared-lib import carries this plan's driver fix; no duplication was introduced here).
- 39-05's L3/L4 browser-boot acceptance depends on the solid-prop reachability + stall-recovery shipped here.

## Self-Check: PASSED

---
*Phase: 39-playthrough-polish-grounded-patrolling-skeletons-sliding-spi*
*Completed: 2026-07-19*
