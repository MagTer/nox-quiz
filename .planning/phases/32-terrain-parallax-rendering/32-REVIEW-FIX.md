---
phase: 32-terrain-parallax-rendering
fixed_at: 2026-07-11T10:30:00Z
review_path: .planning/phases/32-terrain-parallax-rendering/32-REVIEW.md
iteration: 2
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 32: Terrain & Parallax Rendering Code Review Fix Report

**Fixed at:** 2026-07-11
**Source review:** .planning/phases/32-terrain-parallax-rendering/32-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope (critical_warning): 3
- Fixed: 3
- Skipped: 0

## Fixed Issues

### CR-01: `browser-boot.mjs`'s far-end (goal) check never reaches the goal for any level with 2+ chained encounters

**Files modified:** `scripts/browser-boot.mjs`
**Commit:** `c86e157`
**Applied fix:** Replaced the single discarded `driveToXPlanned(page, level.geometry.goal.x, ...)` call with option (a) from the review's suggested fix, adapted to the file's actual `drivableEncounters` variable already in scope: loop over every non-alcove door/math-gate/enemy encounter, drive to it and resolve it if triggered, then drive to `goal.x` and push a `far-end-unreachable` hard error if `reachedX` isn't within 32px of `goal.x` (matching the review's suggested tolerance), before the existing `assertScreenshotNonBlank` call.

**Verification note (IMPORTANT — flagging for human review):** This is a logic-classified fix (REVIEW.md explicitly attributes CR-01 to a discarded return value / reused driver stopping early), so per this agent's verification protocol it is marked `fixed: requires human verification` even though Tier 1 (re-read) and Tier 2 (`node --check`) both passed cleanly.

Beyond syntax verification, I ran the actual `node scripts/browser-boot.mjs` gate end-to-end (twice, the second time in a clean, non-concurrent run) to confirm the fix changes real behavior, not just passes a syntax check. Result: **levels 1–3 and 5–8 pass the far-end check cleanly** (all encounters resolve, goal reached), but **level-04 now genuinely fails** with:
```
{"type":"far-end-unreachable","message":"level-04: far-end drive stalled at x:984.82, never reached goal.x:6120"}
```
The stall is consistent and reproducible: the driver gets stuck around x:1138–1148, apparently unable to complete a floor→platform→floor hop chain (platform at x:1080–1192, y:250, bridging the floor-2→floor-3 gap in level-04's geometry) using this script's simple, non-`targetY`-hinted `driveToXPlanned` call. `node scripts/validate-levels.mjs`'s dedicated structural reachability checker (a different, BFS/jump-envelope-based validator, not this browser driver) reports level-04 fully reachable, so this does **not** look like a real playability bug — it looks like the exact class of limitation the file's own pre-existing comments already call out ("this script's simple 3-arg `driveToXPlanned` call, which has no targetY hint and can never climb to an elevated alcove platform" — evidently also applicable to some non-alcove multi-hop approaches). This is precisely the outcome CR-01's own suggested fix explicitly anticipated: *"so a level whose path can't be cleared surfaces as a real failure instead of a silent, misleading PASS."* The fix is doing its job correctly — it no longer lies — but a human should decide whether to (a) extend this driver with a `targetY` hint for this specific level-04 approach, (b) accept level-04 as a known/documented driver gap, or (c) investigate further. Until addressed, `node scripts/browser-boot.mjs` will report a real failure for level-04's far-end check.

### WR-01: `atlas-${levelData.biome}` has no fallback and no validator

**Files modified:** `scripts/validate-levels.mjs`
**Commit:** `8468f04`
**Applied fix:** Added a `VALID_BIOMES = ["swamp", "town", "cemetery", "castle"]` HARD-FAIL check, mirroring the review's suggested snippet. Also fixed `buildDescriptors()` (both the `--fixture` and the default `LEVEL_ORDER` branches) to actually carry the `biome` field through into each descriptor object passed to the check loop — the original review-suggested snippet assumed `descriptor.biome` was already available, but the pre-existing `buildDescriptors()` only forwarded `{ id, geometry }`, dropping `biome` (a sibling field of `geometry` on every level module, not nested inside it). Without this adaptation the new check would have always read `undefined` and HARD-FAILed every level.

Ran `node scripts/validate-levels.mjs` directly (not just a syntax check) and confirmed all 8 shipped levels now print `{id} | biome | PASS | "{biome}"` rows, and the script still exits with `validate-levels: PASS` overall — the new check does not regress the existing reachability/over-hole checks.

### WR-02: Cap-tile art overhangs past the run's collider edge for widths not divisible by 16px

**Files modified:** `src/levels/build.js`
**Commit:** `aaece0c`
**Applied fix:** Clamped the last cap tile's drawn `width` to the remaining run pixels in both cap-emission loops (the Cemetery branch and the standard branch) inside `emitTerrainRun`, per the review's suggested `Math.min(T, runX + runW - tx)`.

Adapted beyond the review's literal one-line suggestion after tracing Kaplay's actual non-tiled sprite-draw code in the vendored `lib/kaplay.mjs`: when only `width` is passed to a non-tiled `sprite()` component (no `height`), Kaplay applies that as a **uniform x+y scale factor** (`o.y = o.x`), which would have also squished the cap art's height, not just cropped its overhanging width. Added an explicit `CAP_FRAME_H = T * 2` constant (confirmed against the real baked `assets/tiles/atlas-*.png` files — all 32×32, sliced `sliceX:2/sliceY:1` in `main.js`, i.e. each frame is 16 wide × 32 tall) and pass it as `height` alongside the clamped `width` in both loops, so only the horizontal dimension is affected. For full-width tiles (the common case), `width: T, height: CAP_FRAME_H` resolves to an identity scale (1, 1), byte-identical to the pre-fix rendering; only the last tile of a non-16px-multiple run is affected.

Verified with `node --check`, a full `node scripts/validate-levels.mjs` pass, `bash scripts/check-import-safety.sh` (a727c13 still holds — no top-level engine-global refs added), `bash scripts/check-gate.sh`, and `bash scripts/check-safety.sh`, all PASS. Also exercised by the same `node scripts/browser-boot.mjs` runs used to verify CR-01 above (levels 1–3, 5–8 all pass their non-blank far-end screenshot checks, confirming the clamped cap tiles still render correctly with no blank/broken frames).

## Iteration 2: resolving CR-01's flagged human-verification item

Iteration 1's CR-01 fix (commit `c86e157`) was itself correct but surfaced a real, deeper bug it had no scope to fix: `driveToXPlanned` deterministically stalled on level-03 (goal.x:5120, stalled at x:3160) and level-04 (goal.x:6120, stalled at x:920).

An orchestrator-directed investigation (not a guess — a targeted first attempt at passing `targetY: level.geometry.goal.y` was tried, empirically found to make things worse — level-03 regressed to failing too, level-04 unchanged — and reverted before the real investigation below) traced the actual root cause to `scripts/lib/route-planner.mjs`'s `planTakeoffs`: a spike sitting close before a platform's natural "mount" takeoff causes the spike's own short-held clearance hop to carry the player past the mount's narrow 16px fire window while still airborne (mount takeoffs only fire while grounded). This happens 3 times in level-04 (spike@1000→platform@1080, spike@1700→platform@1760, spike@3880→platform@4000) and once in level-03 (spike@3260→platform@3400) — coordinates confirmed against the real level descriptor files.

**Fix (commit `0ac2a87`, files `scripts/lib/route-planner.mjs` + `scripts/lib/mechanic-drive.mjs`):** a new `computeMountTakeoffX` helper resolves the conflict with two strategies verified via real in-engine Playwright arc probes: (1) fold the spike's clearance into the mount's own jump when the rise is still reachable from further back, or (2) when that's not reachable, leave the spike's own hop untouched and widen the mount's fire window to the spike hop's own empirically-observed landing spread. `mechanic-drive.mjs` gained one additive `fireWindow` override field on takeoffs — every pre-existing takeoff still uses the old per-kind default, so no unrelated behavior changed (confirmed: `planTakeoffs` output is byte-identical for levels 01, 02, 05, 06, 07, 08).

Re-verified live, 3 consecutive full `node scripts/browser-boot.mjs` runs: all 8 levels' far-end checks now pass, including level-03 and level-04. `validate-levels.mjs`, `check-safety.sh`, `check-import-safety.sh`, `check-progress.sh`, `check-gate.sh` all still pass.

A follow-up re-review (iteration 2, same session) independently re-verified this fix against current file contents and re-ran every gate live rather than trusting this report — found 0 critical/warning, 4 info-level findings (all either pre-existing/carried-forward or newly-surfaced-but-non-blocking dead-code notes), none requiring further action this phase.

## Skipped Issues

None — all 3 in-scope findings were fixed (CR-01 required a second, deeper fix within this same phase's close-out to fully resolve; WR-01 and WR-02 were one-pass fixes).

---

_Fixed: 2026-07-11_
_Fixer: Claude (gsd-code-fixer) + orchestrator-directed root-cause investigation_
_Iteration: 2_
