---
phase: 34-level-quality-pass
plan: 04
subsystem: level-geometry
tags: [level-08, switchback, climb, headroom, wysiwyg-platforms, checkpoint]

# Dependency graph
requires:
  - phase: 34-level-quality-pass
    provides: "Plan 34-01's coin-reachability model and 34-02's tightened obstruction-aware model + in-engine coin audit"
provides:
  - "level-08's end climb rebuilt as a switchback — LVL-02's differentiation from level-07's monotonic staircase"
  - "Two new defect classes found and fixed: HEADROOM (unruled) and the 48px-visual/16px-collider platform mismatch"
  - "WYSIWYG 16px platforms (atlas frame 2) — visual now equals collider"
affects: [34-06, 34.5]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Biome atlas is now THREE 16x32 frames: cap | fill | platform. Frame 2 = the cap crop's top 16px cell over a fully-transparent bottom half, so a platform draws as a 16px ledge at the cap's existing 32px draw height — no scaling, no new art."
    - "headroom = rise - visual_thickness - 32. With WYSIWYG platforms, visual == collider, so the physics number and the eye finally agree."

key-files:
  created: []
  modified:
    - src/levels/level-08.js
    - src/levels/build.js
    - src/config.js
    - scripts/build-art-assets.py
    - src/main.js
    - scripts/lib/terrain_scan.py
    - scripts/check-terrain-atlas.sh
    - assets/tiles/atlas-{swamp,town,cemetery,castle}.png
---

# Phase 34 Plan 04 — Level-08 Switchback Climb (LVL-02)

## What landed

Level-07's and level-08's end climbs were near-identical monotonic up-and-right staircases (~65–70px rise, widths shrinking 280→220, identical `h:24`). Level-08's is now a **switchback**: three tiers rightward, a reversal up-**left** (T4), then back up-right to a **wide 380px summit balcony** — where level-07 narrows to a 220px perch. Widths *grow* toward the summit instead of shrinking. Level-07 is unchanged and remains the reference staircase.

| Tier | x | y | w | h | rise | overlap | headroom |
|---|---|---|---|---|---|---|---|
| T1 | 2410 | 248 | 300 | 16 | 72 | — | — |
| T2 | 2640 | 173 | 280 | 16 | 75 | 70 | 27px |
| T3 | 2850 | 99 | 300 | 16 | 74 | 70 | 26px |
| **T4** | **2610** | **24** | 350 | 16 | 75 | 110 | 27px | ← **LEFTWARD reversal** |
| T5 | 2890 | −50 | 340 | 16 | 74 | 70 | 26px |
| T6 | 3160 | −125 | 380 | 16 | 75 | 70 | 27px | ← summit balcony |

Math density untouched: 1 door, 1 enemy, 0 mathGates. `bounds.right` unchanged (3540) — the switchback *folds back* instead of marching right, so the documented bounds trap never fired.

## The human checkpoint found two more defect classes — both invisible to every gate

The checkpoint was **not** rubber-stamped (config carries `auto_advance: true` / `mode: yolo`; standing precedent overrides it). The user rejected the first two looks.

### Rejection 1 — "It is a bit tight between the platforms vertically."

Correct, and **pre-existing**: `headroom = rise − thickness − 32` was **9–14px** on level-08's new climb and **9px on every single tier of level-07** — a 32px-tall player in a 41–46px slot. `docs/LEVEL-DESIGN.md` quantifies rise, gap and x-overlap but has **NO headroom rule**, and no gate checked it. That is exactly why 9px shipped unnoticed on a level that has been live for phases.

### Rejection 2 — "the ledges can be even thinner… at least 1/3 can be removed"

This one exposed a genuine architectural bug: **the platform's visible slab was 48px while its collider was 16px** — a 3× mismatch, and the two were fully decoupled in `build.js` (cap drawn 32 tall at `y`, plus a 32px fill starting at `y+16`). So:

- The `h:24 → h:16` fix from rejection 1 changed what she *collides with* and **did nothing to what she sees**.
- **Visual** headroom was `75 − 48 − 32 = −5px` — the player's head was literally rendered *inside* the ledge above her. The physics said 27px; the eye said −5px. The user was seeing a real defect, not being fussy.

Measured empirically (screenshot pixel-diff with terrain entities destroyed, not assumed): **48.7px** slab over a 16px collider.

**Fix (user chose the full one, not the cheap one):** a third atlas frame — the cap crop's top 16px cell over a fully-transparent bottom half — drawn at the cap's existing 32px height so it reads as a **16px ledge that exactly matches the 16px collider**. No scaling, no new art (this repo shipped grey static from a squashed bake; that mistake is not repeated). Floors keep their cap + deep fill and are visually unchanged.

Measured after: **16.0px**. Visual headroom now **+27px**, and visual == collider, so the two numbers finally agree.

`PLATFORM_FILL_DEPTH_PX` removed (nothing else read it), and the terrain pixel gate extended with a new **SLAB** check that hard-fails if the platform frame's bottom half ever fills back in — because no other gate would notice.

### Round 3 — APPROVED. Verbatim:

> "yes, looks better"

## Verification

- `validate-levels.mjs` — level-08 **zero HARD-FAILs**, all 18 coin rows PASS.
- `audit-coins.mjs` — exit 0; all 18 level-08 coins collected **by a real driven player**, including the 6 relocated climb coins.
- `check-terrain-atlas.sh` — PASS (24 checks). Proven it can still FAIL: fed four deliberately-broken atlases (stale 2-frame sheet, platform frame with bottom filled in, bottom-padded frame, achromatic remap) — all four exit 1.
- `check-safety` / `check-import-safety` / `check-gate` / `check-progress` / `check-assets-manifest` — PASS.
- Level geometry fingerprints byte-identical for levels 01–07; only `build.js` touched outside level-08.

## Known-red, deliberately

**`browser-boot.mjs` fails on level-08** — the harness can only drive **rightward** (`driveToXPlanned` holds ArrowRight and treats progress as monotonically-increasing x; `planTakeoffs` emits no leftward takeoffs), so it reads the switchback as a stall and dies. This was NOT fixed here (Rule 4: shared harness code every level's completion proof depends on). The user chose **Option A — fix the harness in its own plan**, because Phase 36's movers need bidirectional driving anyway.

**Until that lands, nothing automated proves level-08 is navigable from spawn.** `audit-coins` *teleports* the player onto each tier rather than driving from spawn, so it proves the coins are collectable *on* the tiers, not that the climb can be reached. The human's play is currently the only proof. This is stated plainly rather than buried — a red gate we agree to ignore is the same failure this phase exists to end, just inverted.

## Carried into Phase 34.5

Every level is being **rebuilt from scratch** (user decision, mid-phase). So:
- Level-07's 9px headroom was **deliberately NOT retrofitted** — throwaway work on geometry that is about to be replaced. It ships tight in the interim; this is a known state.
- These tier coordinates are a **design direction**, not a final layout. What survives is the *shape* (switchback, growing widths, wide summit) as 34.5's SC7, and the *rules* (headroom ≥ 24px, WYSIWYG platforms) that 34.5 authors against.

## Self-Check: PASSED
