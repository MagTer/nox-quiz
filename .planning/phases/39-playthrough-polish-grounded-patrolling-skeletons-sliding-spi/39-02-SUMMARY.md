---
phase: 39-playthrough-polish-grounded-patrolling-skeletons-sliding-spi
plan: 02
subsystem: assets
tags: [pixel-art, pillow, build-art-assets, prop, lantern, POL-05]

# Dependency graph
requires:
  - phase: 36-ambient-life
    provides: MECH-05 secret-alcove flicker light (LIGHT_RE selector + alcove-light link)
provides:
  - Non-skull hanging-lantern art for the L1/L2 secret-alcove light at the stable prop-swamp-lantern key/path
affects: [39-04 (POL-05 level-data swap/confirmation), prop-vocabulary, art-parity]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prop art swap via source-retarget only: change the bake_prop source crop, keep the output name so manifest key/path/loader/level-data and any key-matched links (LIGHT_RE) are untouched — only pixels change."

key-files:
  created: []
  modified:
    - scripts/build-art-assets.py
    - assets/props/swamp-lantern.png
    - CREDITS.md

key-decisions:
  - "Sourced the lantern from the already-vendored town street-lamp (single amber-glass head, crop 10,1,26,20) rather than adding new CC0 or reusing the identical cemetery altar-candle — a genuine, distinct 'lantern' shape, measured 0.0% pink native (no retint)."
  - "Kept the output name swamp-lantern (manifest key prop-swamp-lantern) so the MECH-05 alcove-light link + flicker survive with zero manifest/loader/level-data churn."
  - "Accepted the 16x19 lantern size (vs the old oversized 68x78 skull) — human signed off; reads as a proper small lantern, not a floating skull."

patterns-established:
  - "Art-only swap discipline: retarget source + keep output key = zero downstream churn and intact key-matched behavior links."

requirements-completed: [POL-05]

coverage:
  - id: D1
    description: "The L1/L2 secret-alcove light sprite is a non-skull hanging lantern at the stable prop-swamp-lantern key/path, still matching LIGHT_RE so the MECH-05 flicker + alcove-light link survive."
    requirement: "POL-05"
    verification:
      - kind: automated_ui
        ref: "visual: assets/props/swamp-lantern.png (16x19) — pixel inspection shows amber-glass lantern, no skull"
        status: pass
      - kind: manual_procedural
        ref: "human sign-off 2026-07-19: lantern reads correctly, dark-grunge, no pink; in-game L1 alcove flicker confirmed"
        status: pass
    human_judgment: true
    rationale: "Visual/aesthetic acceptance (reads as a lantern not a skull, grunge palette) and the in-game alcove flicker are human-judgment calls; automation only proves the file exists and the key still matches LIGHT_RE."
  - id: D2
    description: "Asset-manifest and terrain-atlas gates stay green after the build-art-assets.py change."
    requirement: "POL-05"
    verification:
      - kind: integration
        ref: "node scripts/check-assets-manifest.mjs — PASS (61 assets)"
        status: pass
      - kind: integration
        ref: "bash scripts/check-terrain-atlas.sh — PASS"
        status: pass
    human_judgment: false

# Metrics
duration: ~6min
completed: 2026-07-19
status: complete
---

# Phase 39 Plan 02: Non-skull swamp lantern (POL-05 asset half) Summary

**Re-baked `prop-swamp-lantern` from the town street-lamp's single amber-glass lantern head — the L1/L2 secret-alcove light is now a dark-grunge hanging lantern instead of a fire-skull, at the stable key/path so the MECH-05 flicker + alcove-light link survive untouched.**

## Performance

- **Duration:** ~6 min active (plus human sign-off wait at the checkpoint)
- **Completed:** 2026-07-19
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint, approved)
- **Files modified:** 3

## Accomplishments
- Retargeted the `swamp-lantern` bake in `scripts/build-art-assets.py` from the Fire-Skull frame to a single amber-glass lantern head cropped from the already-vendored town street-lamp (`crop=(10,1,26,20)`) — a genuine dark-grunge lantern, measured 0.0% pink native (no retint, no new CC0).
- Kept the output name `swamp-lantern` → manifest key `prop-swamp-lantern`, path, loader, and level data all unchanged; the sprite key still matches `build.js` `LIGHT_RE` (`/lantern|lamp|candle/`), so the secret-alcove flicker + dim-until-discovered glow survive.
- Moved the CREDITS attribution from the Gothicvania Patreon Collection (fire-skull) to the Gothicvania Town pack (street-lamp).
- Human signed off: the lantern reads correctly (non-skull, dark grunge, no pink), 16×19 size accepted as-is, in-game L1 alcove flicker confirmed.

## Task Commits

Each task was committed atomically:

1. **Task 1: Re-bake prop-swamp-lantern from a non-skull source** - `76baffe` (feat)
2. **Task 2: Human sign-off — lantern reads correctly + alcove flicker** - approved (no code change; checkpoint gate)

**Plan metadata:** _(this SUMMARY + STATE/ROADMAP)_

## Files Created/Modified
- `scripts/build-art-assets.py` - Swamp light-source bake retargeted from fire-skull → town street-lamp single lantern head; output name/key unchanged.
- `assets/props/swamp-lantern.png` - Re-baked pixels (16×19 amber-glass hanging lantern; was 68×78 fire-skull).
- `CREDITS.md` - Attribution for the swamp lantern moved from the Patreon (fire-skull) row to the Town (street-lamp) row.

## Decisions Made
- Chose the town street-lamp's single lantern head over the identical cemetery altar-candle crop so the swamp light is a distinct, literal lantern (matching the user's "swap skull for a lantern" decision) — measured 0.0% pink native, so baked native without retint.
- Accepted the smaller 16×19 footprint at the human-verify checkpoint rather than up-scaling (the pipeline does NO scaling by design); the human confirmed it reads well.

## Deviations from Plan

None affecting scope. One out-of-scope side effect handled:

### Out-of-scope observation (not committed)

**1. [Scope boundary] `build-art-assets.py` also regenerates `assets/logo-badge.png`**
- **Found during:** Task 1 (running the monolithic bake)
- **Issue:** A full bake re-emitted `assets/logo-badge.png` with different bytes (3186 → 4878) than the Phase-38 BRAND-01 signed-off version — unrelated to POL-05.
- **Fix:** Reverted `assets/logo-badge.png` to HEAD so this commit stays scoped to the lantern; logged the observation in the phase `deferred-items.md` for a future logo/prop-pipeline pass.
- **Files modified:** none (reverted)
- **Verification:** `git status` shows only the 3 intended files.

## Issues Encountered
None — both required gates (`check-assets-manifest.mjs`, `check-terrain-atlas.sh`) passed on the first run after the bake.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The asset half of POL-05 is done; plan **39-04** performs the level-data swap/confirmation (the L1/L2 prop already references the stable `prop-swamp-lantern` key, so no key change is needed there — 39-04 verifies coords + alcove link end-to-end).
- No blockers.

## Self-Check: PASSED

- `assets/props/swamp-lantern.png` — FOUND
- `39-02-SUMMARY.md` — FOUND
- Task 1 commit `76baffe` — FOUND

---
*Phase: 39-playthrough-polish-grounded-patrolling-skeletons-sliding-spi*
*Completed: 2026-07-19*
