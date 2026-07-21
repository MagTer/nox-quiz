---
phase: 32-terrain-parallax-rendering
reviewed: 2026-07-11T10:28:42Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - .claude/CLAUDE.md
  - scripts/browser-boot.mjs
  - scripts/check-assets-manifest.mjs
  - scripts/lib/mechanic-drive.mjs
  - scripts/lib/route-planner.mjs
  - scripts/validate-levels.mjs
  - src/assets-manifest.js
  - src/config.js
  - src/levels/build.js
  - src/levels/level-01.js
  - src/levels/level-02.js
  - src/levels/level-03.js
  - src/levels/level-04.js
  - src/levels/level-05.js
  - src/levels/level-06.js
  - src/levels/level-07.js
  - src/levels/level-08.js
  - src/main.js
  - src/parallax.js
  - src/scenes/game.js
findings:
  critical: 0
  warning: 0
  info: 4
  total: 4
status: issues_found
---

# Phase 32: Terrain & Parallax Rendering Code Review Report (Re-review, Iteration 2)

**Reviewed:** 2026-07-11
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found (Info only — no unresolved Critical/Warning findings)

## Summary

Re-review of iteration 1's findings (CR-01, WR-01, WR-02 — all claimed fixed), plus
a fresh adversarial look at the two newly-touched test-harness modules
(`scripts/lib/route-planner.mjs`, `scripts/lib/mechanic-drive.mjs`) that were pulled
into scope by CR-01's real root cause. I did not trust the fixer's commit messages —
each fix was traced against current file contents, and every real verification gate
was actually run live in this session (not read as a prior claim):

- `node scripts/browser-boot.mjs` → **PASS** — "title -> select -> all levels loaded
  with no runtime errors." Every level's first mechanic triggered and resolved, and
  every level's far-end drive reached `goal.x` within the 32px tolerance, **including
  level-03 and level-04**, the two levels the deeper CR-01 root cause specifically
  stalled on.
- `node scripts/validate-levels.mjs` → **PASS** — zero HARD-FAILs across all 8
  levels; a `biome | PASS` row is present and live for every level (WR-01's new check
  is exercised, not just added-but-inert).
- `bash scripts/check-safety.sh` → **PASS**
- `bash scripts/check-import-safety.sh` → **PASS**
- `bash scripts/check-progress.sh` → **PASS** (includes `smoke-progress.mjs`)
- `bash scripts/check-gate.sh` → **PASS**
- `node scripts/check-assets-manifest.mjs` → **PASS** — 38/38 assets verified on disk
- `node scripts/lib/route-planner.mjs` (self-test) → **PASS**

### CR-01 — VERIFIED FIXED (two-layer fix, both layers checked)

The iteration-1 CR-01 (the `browser-boot.mjs` far-end check resolving only the
first encounter, then reporting a spurious PASS on a stalled drive) is fixed at
`scripts/browser-boot.mjs:506-511`: every remaining `drivableEncounters` on the path
is now driven-to and `resolveIfBoxed`'d before the final `driveToXPlanned(...,
goal.x, ...)` call, and the `reachedX` vs `goal.x` tolerance check (`> 32` px pushes
a real `far-end-unreachable` error) from the first fix layer is intact.

That first-layer fix then correctly surfaced the REAL underlying bug it was
designed to expose: `driveToXPlanned` deterministically stalling on level-03 and
level-04 due to a spike-hop-carries-past-a-nearby-mount's-fire-window conflict. I
traced that root-cause fix in `scripts/lib/route-planner.mjs`'s new
`computeMountTakeoffX` (Strategy 1: fold the spike's clearance into the mount's own
jump when the rise is still reachable from further back; Strategy 2: leave the
spike hop untouched and widen the mount's fire window to the spike hop's real,
empirically-measured landing spread) and its threading through
`pushHopTakeoffs`/`planTakeoffs` into `mechanic-drive.mjs`'s takeoff-firing loop
(`x > t.x + (t.fireWindow ?? FIRE_WINDOW[t.kind])`). The `fireWindow`-carrying
takeoff is correctly exempted from the takeoff-dedup merge step (a wide-window
Strategy-2 mount sitting close to its own conflicting spike must never absorb that
spike's separate, still-required takeoff) — confirmed by reading the dedup
condition (`t.fireWindow === undefined && last.fireWindow === undefined`). The live
`browser-boot.mjs` run in this session is the strongest possible confirmation short
of a manual human playtest: level-03 and level-04 no longer stall, and every level's
far-end genuinely renders.

### WR-01 — VERIFIED FIXED

`scripts/validate-levels.mjs:37-84` adds a `VALID_BIOMES` HARD-FAIL check
(`swamp/town/cemetery/castle`, matching `src/assets-manifest.js`'s 4 biome-atlas
keys exactly) that runs before the existing over-hole/reachability checks. Confirmed
live in the `validate-levels.mjs` run: `<level-id> | biome | PASS | "<biome>"` for
all 8 levels. Hand-checked every level file's `biome:` field against the 4 valid
values — all 8 match.

### WR-02 — VERIFIED FIXED

`src/levels/build.js`'s `emitTerrainRun` (both the Cemetery and standard branches)
now clamps the final cap tile's `width` to the run's remaining pixels AND passes an
explicit `height: CAP_FRAME_H` alongside the clamped width — this second part
matters because Kaplay's non-tiled sprite draw uses a bare `width` as a *uniform*
x+y scale factor when `height` is omitted, so a width-only clamp would have squished
the cap art vertically as an unintended side effect (the fix's own comment correctly
identifies this). Verified the 4 baked atlas PNGs are genuinely 32×32 (2 frames of
16×32 via `sliceX:2/sliceY:1`), matching the fix's stated assumption. The clamp is a
byte-identical no-op for every non-final tile, so no regression risk for the
already-passing common case.

### Fresh look at the newly-touched files

`route-planner.mjs` and `mechanic-drive.mjs` are dense, magic-number-heavy
test-harness code, but every constant carries an explicit empirical justification in
its own header comment, and the full 8-level `browser-boot.mjs` drive — which
exercises every takeoff-planning branch (mount/gap/spike, Strategy 1/2 spike
merges, the obstructed-flat-edge stepping-stone fallback, the alcove `targetY`
disambiguation) across every shipped level's real geometry — passes clean. No new
Critical or Warning findings surfaced from tracing the logic by hand (edge-cost
computation, minimax-bottleneck pathfinding, the obstructing-platform detection, the
takeoff dedup/suppression filters). One new Info-level dead-code item is noted below.

Iteration 1's three Info-level findings (IN-01/02/03) were **not** part of the
required fix set and remain open — re-verified below, not dropped.

## Info

### IN-01 (new): `driveToXClimbing` is exported but has zero live call sites

**File:** `scripts/lib/mechanic-drive.mjs:128`
**Issue:** `driveToXClimbing` (~140 lines including its stall/exhaustion
console.error paths) is still fully implemented and exported, but its own header
comment (lines 266-275) already documents it was retired at the Phase 24 close-out
in favor of `driveToXPlanned`. A repo-wide grep confirms every remaining reference
to `driveToXClimbing` is inside a comment (this file, `browser-boot.mjs`,
`route-planner.mjs`, `calibrate-jump-envelope.mjs`) — no script actually calls it.
This predates the current fix pass (already dead at Phase 24), but
`mechanic-drive.mjs` is newly in this review's scope this iteration, so it's worth
flagging: dead test-harness code with no live caller is a maintenance liability (a
future edit to the shared `driveToX*` return contract could silently drift out of
sync here since nothing exercises it) and slightly obscures which driver is
authoritative.
**Fix:** Delete `driveToXClimbing` now that `driveToXPlanned` has fully replaced it
(git history preserves the retired implementation), or add a `@deprecated` JSDoc tag
pointing at `driveToXPlanned`.

### IN-02 (carried forward, still open): Duplicate manifest key `"door"` used for two different asset kinds

**File:** `src/assets-manifest.js:48` (`kind: "sprite"`, `assets/door.png`) and
`src/assets-manifest.js:62` (`kind: "sound"`, `assets/sfx/door.ogg`)
**Issue:** Both entries still share `key: "door"` (unchanged since iteration 1).
Harmless today (`main.js` loads both by hand, never via a manifest key→asset
lookup), but the module's own header frames itself as "the single source of truth
for every asset path" — a future consumer building a `Map` keyed by `key` would
silently drop one of these two entries.
**Fix:** Give the sound entry a distinct key, e.g. `"door-sfx"`.

### IN-03 (carried forward, still open): Hand-loaded base `bg-far`/`bg-mid`/`bg-near` parallax sprites are unreachable in play

**File:** `src/main.js:83-85`; `src/parallax.js:61` (`layerName`)
**Issue:** `parallax.js`'s `layerName(base)` only falls back to the un-suffixed base
sprite name when a level's `biome` is falsy. All 8 shipped level descriptors set an
explicit `biome` (re-verified this iteration), so this fallback path — and the 3
base sprites `main.js` still loads by hand — remain dead in the shipped game.
Pre-existing since before Phase 32, not a regression; noted for completeness since
`main.js` is in this review's scope.
**Fix:** Low priority — either leave as an intentional safety-net fallback (current
behavior) or remove the 3 unused hand-loads once confirmed genuinely dead.

### IN-04 (carried forward, still open): `build.js`'s Cemetery-branch comment undersells the actual atlas anomaly

**File:** `src/levels/build.js:102` (line number shifted from iteration 1's :94
after the WR-02 diff, text unchanged)
**Issue:** The comment still reads "Cemetery's cap frame is transparent in rows 0-9
(docs/LEVEL-DESIGN.md §9)" — a real pixel-scan of the baked
`assets/tiles/atlas-cemetery.png` cap frame shows rows 0-9 **and** rows 20-31 are
fully transparent (opaque only in the middle band, rows 10-19), matching §9's fuller
description. The code's actual behavior is already correct for the full anomaly
(comment-accuracy nit only, not a functional defect), but it could mislead a future
maintainer reasoning about the `fillDepthPx + T` offset choice.
**Fix:** Update the comment to mention both transparent bands, matching §9's own
wording.

---

_Reviewed: 2026-07-11T10:28:42Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
