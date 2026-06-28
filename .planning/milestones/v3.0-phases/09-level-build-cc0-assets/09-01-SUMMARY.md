---
phase: 09-level-build-cc0-assets
plan: 01
subsystem: assets
tags: [cc0, opengameart, pixel-art, sprites, licensing, kaplay]

# Dependency graph
requires:
  - phase: 07-deploy-static-host
    provides: web-root path convention (assets/ sibling of served root) + Dockerfile COPY assets/
provides:
  - assets/tiles/ground.png (CC0 dark dungeon brick platform tile)
  - assets/spike.png (CC0 static spike hazard)
  - assets/goal.png (CC0 skull-flag goal marker)
  - assets/player.png (CC0 16x32 standing character)
  - assets/coin.png (CC0 evenly-gridded 8-frame spinning-coin spritesheet)
  - assets/LICENSES/*.txt (per-asset CC0 license proofs)
  - CREDITS.md (repo-root per-asset CC0 provenance, LEVEL-08)
affects: [09-02 (loadSprite/level build consumes these sprites), 09-03, phase-12-polish (art swap)]

# Tech tracking
tech-stack:
  added: []  # no code packages — only static CC0 image files vendored
  patterns:
    - "Per-asset CC0 verification at the source page + proof captured in assets/LICENSES/ + CREDITS.md row"
    - "Even-grid spritesheet re-layout (crop-to-content + center into uniform cells) for loadSprite sliceX"

key-files:
  created:
    - assets/tiles/ground.png
    - assets/spike.png
    - assets/goal.png
    - assets/player.png
    - assets/coin.png
    - assets/LICENSES/ground.txt
    - assets/LICENSES/spike.txt
    - assets/LICENSES/goal.txt
    - assets/LICENSES/player.txt
    - assets/LICENSES/coin.txt
    - CREDITS.md
  modified: []

key-decisions:
  - "Used OpenGameArt '6 Color Dungeon 16x16' (HorusKDI, CC0) for ground/spike/goal/player — one verified-CC0 dark dungeon pack covers four of five assets"
  - "Used OpenGameArt 'Rotating Coin' (PuddinThur, CC0) for the coin, re-gridded to an even 8x32px strip"
  - "REJECTED OpenGameArt 'spinning-coin-0' (magdum) — it is CC-BY-SA 3.0, not CC0 (the exact mixed-license trap RESEARCH Pitfall 6 warned about)"

patterns-established:
  - "LEVEL-08 provenance pattern: open the asset's own license page, confirm License(s): CC0, capture proof to assets/LICENSES/<asset>.txt, add a cross-matching CREDITS.md row"
  - "Coin re-grid: irregular source frames cropped-to-content and centered into uniform 32px cells -> loadSprite(..., {sliceX: 8})"

requirements-completed: [LEVEL-08]

# Metrics
duration: ~25min
completed: 2026-06-25
status: complete
---

# Phase 09 Plan 01: Source + vendor verified-CC0 dark/grunge assets Summary

**Five verified-CC0 dark-dungeon pixel sprites (ground/spike/goal/player from HorusKDI's "6 Color Dungeon 16x16" + PuddinThur's "Rotating Coin", all CC0 from OpenGameArt) vendored into `assets/` with per-asset license proofs and a CREDITS.md — no placeholder fallback needed, no vendor logos.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-06-25
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Sourced and verified-CC0 a real dark/grunge art set — no programmatic-placeholder fallback was needed
- Four of five sprites come from a single CC0 pack ("6 Color Dungeon 16x16", HorusKDI): solid brick ground, upward floor spikes, skull-flag goal, and a 16x32 standing player figure
- The coin ("Rotating Coin", PuddinThur, CC0) was re-laid-out from an irregular 508x64 source sheet into an evenly-gridded 256x32 strip (8 uniform 32px frames) ready for `loadSprite(..., { sliceX: 8 })`
- Caught and rejected a CC-BY-SA coin page (`spinning-coin-0`) — verified license per-asset, exactly as RESEARCH Pitfall 6 required
- LEVEL-08 satisfied: per-asset proofs in `assets/LICENSES/` + a cross-matching root `CREDITS.md`, no vendor logos

## Asset Provenance

Honest per-asset provenance for human license verification. **All five assets are REAL verified-CC0 downloads. No placeholders. No deferred sourcing.**

| Asset | Provenance | Pack / Author | Source URL | License (verified at source) |
|-------|-----------|---------------|-----------|------------------------------|
| `assets/tiles/ground.png` | REAL verified-CC0 | 6 Color Dungeon 16x16 / HorusKDI | https://opengameart.org/content/6-color-dungeon-16x16 | CC0 — "License(s): CC0" on the asset page |
| `assets/spike.png` | REAL verified-CC0 | 6 Color Dungeon 16x16 / HorusKDI | https://opengameart.org/content/6-color-dungeon-16x16 | CC0 — "License(s): CC0" on the asset page |
| `assets/goal.png` | REAL verified-CC0 | 6 Color Dungeon 16x16 / HorusKDI | https://opengameart.org/content/6-color-dungeon-16x16 | CC0 — "License(s): CC0" on the asset page |
| `assets/player.png` | REAL verified-CC0 | 6 Color Dungeon 16x16 / HorusKDI | https://opengameart.org/content/6-color-dungeon-16x16 | CC0 — "License(s): CC0" on the asset page |
| `assets/coin.png` | REAL verified-CC0 (mechanically re-gridded) | Rotating Coin / PuddinThur | https://opengameart.org/content/rotating-coin | CC0 — "License(s): CC0" on the asset page |

**Verification method:** Each asset's own OpenGameArt page was fetched this session (2026-06-25); the `License(s): CC0` declaration was read directly from each page (OpenGameArt's License(s) metadata field is the creator's authoritative license declaration). No asset was assumed CC0 from an aggregator listing alone.

**Coin processing note (full disclosure):** the original "Rotating Coin" sheet packs its 8 frames at *irregular* horizontal offsets (508x64). To meet the plan's even-grid requirement, each frame was cropped to its content and re-centered into uniform 32x32 cells, producing a 256x32 strip. This is a mechanical re-layout of the same CC0 pixels — no new artwork — so it remains CC0/public-domain.

**Deviation from the RESEARCH lead pack:** RESEARCH led with 0x72 "DungeonTileset II" (itch.io). itch.io downloads are gated/JS-driven and not cleanly fetchable headless, so per the pre-authorized strategy I sourced an equivalent verified-CC0 dark dungeon pack from OpenGameArt (direct file URLs) instead. The aesthetic target (dark/grunge, no pink, readable against `#0a0a0a`) is fully met.

**No vendor logos:** every shipped PNG is a single cropped pixel-art game tile/sprite — no company marks, watermarks, or splash logos.

## Task Commits

1. **Task 1: Source + vendor verified-CC0 assets** - `ab20572` (feat)
2. **Task 2: Author CREDITS.md** - `7160484` (docs)

## Files Created/Modified
- `assets/tiles/ground.png` - Solid dark brick ground/platform tile (16x16)
- `assets/spike.png` - Static upward floor-spike hazard (16x16)
- `assets/goal.png` - Skull-flag goal marker (16x16)
- `assets/player.png` - Standing hooded character (16x32)
- `assets/coin.png` - Spinning-coin spritesheet, even 8-frame strip (256x32)
- `assets/LICENSES/{ground,spike,goal,player,coin}.txt` - Per-asset CC0 proofs (source URL + quoted CC0 statement + tile coords)
- `CREDITS.md` - Repo-root per-asset provenance table + no-vendor-logo statement (LEVEL-08)

## Decisions Made
- **Sourced from OpenGameArt instead of the RESEARCH lead (0x72 / itch.io)** because itch.io downloads are gated and not headless-fetchable; OpenGameArt exposes direct CC0 file URLs and met the dark/grunge brief.
- **One pack (6 Color Dungeon 16x16) for four assets** keeps provenance simple and the look cohesive.
- **Rejected `spinning-coin-0`** after reading its page (CC-BY-SA 3.0) and chose `rotating-coin` (CC0) instead — per-asset license verification working as intended.

## Deviations from Plan

The plan's Task 1 is a `blocking-human` checkpoint. Per the orchestrator's explicit pre-authorization for this sequential run, I executed the user's pre-authorized sourcing strategy ("attempt real CC0 download, fall back to placeholders only if a clean verified-CC0 set cannot be obtained") end-to-end instead of hard-stopping at the checkpoint. A complete verified-CC0 set WAS obtained, so the placeholder fallback was not used. The human license-verification will be run by the orchestrator after this return.

No Rule 1-4 code deviations.

## Issues Encountered
- The RESEARCH-recommended `spinning-coin-0` OGA page is CC-BY-SA, not CC0 — rejected and replaced with a verified-CC0 coin (`rotating-coin`).
- The chosen coin sheet had irregular frame spacing — resolved by cropping-to-content and re-centering into a uniform 32px grid.
- itch.io (0x72 lead pack) is not cleanly fetchable headless — resolved by sourcing an equivalent CC0 dark dungeon pack from OpenGameArt.

## User Setup Required
None - no external service configuration required. No Dockerfile change needed (`docker/Dockerfile` already `COPY assets/ ...`).

## Next Phase Readiness
- All five sprites are vendored at the exact paths Plan 02 expects for `loadSprite("ground"|"spike"|"goal"|"player", "../assets/...")` and `loadSprite("coin", "../assets/coin.png", { sliceX: 8 })`.
- `player.png` is 16x32 (taller than a tile) — Plan 02 should set the player `area({ shape })` accordingly, and the coin `sliceX` is 8.
- LEVEL-08 is satisfied pending the human license sign-off the orchestrator will run.

## Self-Check: PASSED

---
*Phase: 09-level-build-cc0-assets*
*Completed: 2026-06-25*
