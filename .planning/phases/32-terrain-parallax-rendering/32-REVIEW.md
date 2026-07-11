---
phase: 32-terrain-parallax-rendering
reviewed: 2026-07-11T00:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - .claude/CLAUDE.md
  - scripts/browser-boot.mjs
  - scripts/check-assets-manifest.mjs
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
  critical: 1
  warning: 2
  info: 3
  total: 6
status: issues_found
---

# Phase 32: Terrain & Parallax Rendering Code Review Report

**Reviewed:** 2026-07-11
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Reviewed the autotile terrain renderer, biome-driven parallax threading, the new
assets manifest + existence gate, and the browser-boot terrain proof battery
delivered by this phase. Static verification (all shell gates, `validate-levels.mjs`,
`check-assets-manifest.mjs`) passes, and four of the five review-focus items hold up:

- **Documented biome anomalies match the implementation.** Pixel-scanned the four
  baked `atlas-<biome>.png` cap frames myself: Cemetery is opaque only in rows 10-19
  (both top and bottom transparent) and Castle is opaque rows 0-30 with its highlight
  concentrated at the bottom — both match `docs/LEVEL-DESIGN.md` §9's table exactly.
  `build.js`'s Cemetery special-case (compositing the cap as a decorative overlay on
  top of an always-solid fill, per §9's own suggested fix) and its decision to leave
  Castle's inverted lip un-special-cased (per `32-CONTEXT.md`'s explicit "render
  as-is, purely cosmetic" decision) both match the documented plan.
- **Collider code is genuinely byte-unchanged.** Diffed `build.js` against the
  immediate pre-Phase-32 commit (`86fa75b^`): the `rect()+area()+body({isStatic:true})`
  collider blocks for both floor runs and platforms are untouched; only the visual
  tile-emission helper (`emitTerrainRun`) changed.
- **a727c13 holds.** `bash scripts/check-import-safety.sh` passes; no new/modified
  file in this set references a Kaplay engine global at module top level.
- **The manifest-driven `main.js` load loop has no silent gaps.** Cross-checked
  every one of the 38 `ASSETS_MANIFEST` entries against `main.js`: every entry is
  loaded either by the `biome-atlas`/`biome-bg` loop or by an existing hand-written
  `loadSprite`/`loadSound`/`loadMusic` call, with no entry orphaned and no double-load.

The fifth focus item did **not** hold up: the new "far-end (goal)" proof added to
`scripts/browser-boot.mjs` (Plan 32-05) does not actually verify what it claims to.
I traced the code and then empirically reproduced it against a live headless browser
(see CR-01 below) — for level-01 the drive stalls roughly 2,580px short of the actual
goal, at the second locked encounter, yet the check still reports PASS. Since every
one of the 8 shipped levels has 2+ chained door/math-gate/enemy encounters, this is
not a level-01-specific edge case — the far-end check is very likely a no-op (reports
PASS regardless of real far-end rendering) for the whole level set, including exactly
the Castle climb-tier terrain the review was asked to pay attention to.

## Critical Issues

### CR-01: `browser-boot.mjs`'s new "far-end (goal)" render check never reaches the goal for any level with 2+ chained encounters (i.e. all 8 levels) — reports PASS regardless

**File:** `scripts/browser-boot.mjs:502-503`
**Issue:**

```js
await driveToXPlanned(page, level.geometry.goal.x, level.geometry);
await assertScreenshotNonBlank(page, errors, `${level.id}: far-end (goal)`);
```

`driveToXPlanned`'s own contract (`scripts/lib/mechanic-drive.mjs`) is: hold right,
navigate the jump envelope, and **stop as soon as it triggers any challenge** (any
door/math-gate/enemy — `triggered = s.ch > baseline`, `if (triggered) break;`). Its
`{ reachedX, triggered }` return value is discarded here, and its physics-solid
blockers (door/math-gate/enemy tall colliders per `build.js`'s own comments: "a tall
solid collider that physically prevents bypassing... by jumping") mean the player
genuinely cannot walk or jump past an unresolved encounter.

The `drivableEncounters` loop just above this (lines ~478-495) resolves **only the
level's first** door/math-gate/enemy encounter (`break;` unconditionally at the end of
its loop body — deliberate, documented scope for that check). Every one of the 8
shipped levels has at least 2 such encounters (level-01: 5, level-02: 4, level-03: 4,
level-04: 6, level-05: 3, level-06: 3, level-07: 2, level-08: 4), so the subsequent
far-end drive predictably runs into the **second, still-locked** encounter and stops
there — nowhere near `level.geometry.goal.x`.

I reproduced this empirically for level-01 (seeded save, title→select→level-01, drove
to and resolved the first math-gate at x:150, then drove toward the goal at x:3560):

```
Now driving to goal x: 3560
drive to goal result: { reachedX: 982.14, triggered: true } goal.x= 3560
screenshot bytes: 25196
```

The player stalled at the enemy encounter (x:1000), 2,578px short of the actual
goal — yet the screenshot there is unsurprisingly non-blank (mid-level scenery, not
blank), so `assertScreenshotNonBlank` passes trivially. `node scripts/browser-boot.mjs`
would therefore report **PASS** for this check on every run, regardless of whether the
real far-end terrain (the Castle climb tiers on level-07/08, the goal area on every
level) renders correctly or is completely broken — it is never actually visited.

This directly contradicts `32-05-PLAN.md`'s own stated "done" criterion — "Every
level's drive reaches its goal.x and passes a non-blank screenshot check there" — and
`32-05-SUMMARY.md`'s claim that this "prov[es] each level's true far end genuinely
renders." It is exactly the failure class this project's own CLAUDE.md standard warns
against: "Verification standard: no phase closes on greps/automation alone... Checks
that don't play the game lie."

**Fix:** Either (a) resolve every encounter along the path to the goal before driving
to `goal.x` (loop `resolveIfBoxed` after each `driveToXPlanned` trigger, not just the
first), or (b) check the returned `{ reachedX, triggered }` and push a hard error when
`reachedX` isn't within a small tolerance of `goal.x` (so a level whose path can't be
cleared surfaces as a real failure instead of a silent, misleading PASS):

```js
// Resolve every encounter on the way to the goal, not just the first.
let cursorX = 0;
for (const encounter of deriveEncounters(level.geometry).filter((e) => e.tag !== "secret-alcove")) {
  const { triggered } = await driveToXPlanned(page, encounter.x, level.geometry);
  if (triggered) await resolveIfBoxed(page);
}
const { reachedX } = await driveToXPlanned(page, level.geometry.goal.x, level.geometry);
if (Math.abs(reachedX - level.geometry.goal.x) > 32) {
  errors.push({
    type: "far-end-unreachable",
    message: `${level.id}: far-end drive stalled at x:${reachedX}, never reached goal.x:${level.geometry.goal.x}`,
  });
}
await assertScreenshotNonBlank(page, errors, `${level.id}: far-end (goal)`);
```

## Warnings

### WR-01: `atlas-${levelData.biome}` has no fallback and no validator — a missing/misspelled `biome` field will silently reference an unloaded sprite

**File:** `src/levels/build.js:79`
**Issue:** The theme-aware ternary this replaced had a safe default (`levelData.theme
? \`ground-${levelData.theme}\` : "ground"`). The Phase 32 replacement is
unconditional:

```js
const atlasSprite = `atlas-${levelData.biome}`;
```

with no `?? "swamp"`-style fallback, unlike every other optional descriptor slot in
this same function (`g.doors ?? []`, `g.mathGates ?? []`, `g.enemies ?? []`,
`g.secretAlcove ?? []`). This is a deliberate decision per `32-CONTEXT.md` ("biome is
a required field... no fallback"), but `scripts/validate-levels.mjs` was not extended
to enforce it — I grepped for `biome` in that script and found no reference. A future
level descriptor that omits `biome` or typos it (e.g. `"swap"`) would build without
any HARD-FAIL from the validator, then throw/log a Kaplay missing-sprite error mid
`buildLevel()` the first time that level is actually opened in a browser — the exact
class of "silent path bug" the manifest/existence-gate work in this same phase was
built to kill for asset paths, left open here for the `biome` field itself.
**Fix:** Add a `biome` presence + enum check to `validate-levels.mjs` (mirroring its
existing per-field HARD-FAIL checks), e.g.:

```js
const VALID_BIOMES = ["swamp", "town", "cemetery", "castle"];
if (!VALID_BIOMES.includes(level.biome)) {
  hardFail(`${level.id}: biome "${level.biome}" is missing or not one of ${VALID_BIOMES.join("/")}`);
}
```

### WR-02: Cap-tile art overhangs past the run's collider edge for widths not divisible by `CONFIG.TILE_SIZE` (16px) — up to 12px of solid-looking ground rendered over open gap air

**File:** `src/levels/build.js:130-132` (and the mirrored non-cemetery/cemetery cap
loops at lines 116-118)
**Issue:** The cap-tile loop steps in fixed 16px increments from the run's left edge:

```js
for (let tx = runX; tx < runX + runW; tx += T) {
  add([sprite(atlasSprite, { frame: CAP_FRAME }), pos(tx, runY), "ground-cap"]);
}
```

For any `runW` not a multiple of 16, the last tile's right edge extends past
`runX + runW` (the collider's actual right edge) by `16 - (runW % 16)` px. I checked
every floor/platform run across all 8 shipped levels: **36 of them** have a
non-multiple-of-16 width, with overhangs up to **12px**. A concrete visible case:
level-02's opening floor run is `{ x: 0, w: 520 }` (520 % 16 = 8), immediately
followed by a real, jumped gap at `520..700` — the last cap tile at `tx:512` spans
`[512, 528]`, i.e. 8px of solid-looking ground art rendered hanging in the open gap
past the actual collider/floor edge at x:520, with nothing under it.

This loop pattern predates Phase 32 (the old `pickTopFrame` visual-only floor-tile
loop used the identical `for (tx = run.x; tx < run.x + run.w; tx += T)` stepping), so
it is not a new regression this phase introduced — but the old placeholder tiles were
flat, generic ground sprites where an 8-12px overhang barely read as anything; the new
real per-biome atlas art (grass tufts, roof silhouettes, tombstone mounds, brick/gold
trim) makes an unsupported ground-texture sliver hanging past the collider edge more
visually noticeable, and this phase's own builder is where it would be natural to fix
(e.g. clamp the last tile's drawn width to the remaining pixels via
`width: Math.min(T, runX + runW - tx)`, matching how the fill chunk loop already
clamps its own last-chunk width).
**Fix:** Clamp (or crop) the last cap tile per run to the remaining pixel width
instead of letting a fixed 16px sprite overshoot the run's right edge.

## Info

### IN-01: Duplicate manifest key `"door"` used for two different asset kinds

**File:** `src/assets-manifest.js:48` (`kind: "sprite"`, `assets/door.png`) and
`src/assets-manifest.js:62` (`kind: "sound"`, `assets/sfx/door.ogg`)
**Issue:** Both entries share `key: "door"`. Harmless today (`main.js` loads both by
hand, `loadSprite("door", ...)` / `loadSound("door", ...)`, never via a manifest
key→asset lookup), but the module's own header frames itself as "the single source of
truth for every asset path" — a future consumer building a `Map` keyed by `key`
(a natural next step for a "single source of truth" manifest) would silently drop one
of these two entries.
**Fix:** Give the sound entry a distinct key, e.g. `"door-sfx"`.

### IN-02: Hand-loaded base `bg-far`/`bg-mid`/`bg-near` parallax sprites are unreachable in play

**File:** `src/main.js:83-85`; `src/parallax.js:61` (`layerName`)
**Issue:** `parallax.js`'s `layerName(base)` only falls back to the un-suffixed base
sprite name when a level's `biome` is falsy. All 8 shipped level descriptors set an
explicit `biome`, so this fallback path — and the three base sprites `main.js` still
loads by hand — are dead in the shipped game. Pre-existing since the old `theme`
system (every level already had a `theme` set pre-Phase-32 too), not a regression
introduced by this phase; noted for completeness since `main.js` is in this review's
scope.
**Fix:** Low priority — either leave as an intentional safety-net fallback (current
behavior) or remove the 3 unused hand-loads once confirmed genuinely dead.

### IN-03: `build.js`'s Cemetery-branch comment undersells the actual atlas anomaly

**File:** `src/levels/build.js:94`
**Issue:** The comment reads "Cemetery's cap frame is transparent in rows 0-9
(docs/LEVEL-DESIGN.md §9)". I pixel-scanned the real baked
`assets/tiles/atlas-cemetery.png` cap frame: rows 0-9 **and** rows 20-31 are fully
transparent (opaque only in the middle band, rows 10-19), matching §9's fuller
description ("BOTH rows 0-9 and rows 20-31 fully transparent"). The code's behavior is
already correct for the full anomaly (the fill is emitted at the run's full height
under the entire cap column, not just under rows 0-9), so this is a comment-accuracy
nit only, not a functional defect — but it could mislead a future maintainer reasoning
about why `fillDepthPx + T` (rather than some smaller offset) was chosen.
**Fix:** Update the comment to mention both transparent bands, matching §9's own
wording.

---

_Reviewed: 2026-07-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
