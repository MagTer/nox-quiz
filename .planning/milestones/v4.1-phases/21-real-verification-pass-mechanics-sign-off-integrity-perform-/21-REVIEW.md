---
phase: 21-real-verification-pass-mechanics-sign-off-integrity-perform-
reviewed: 2026-07-04T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - scripts/audit-phase21-mechanics.mjs
  - scripts/browser-boot.mjs
  - src/levels/build.js
  - src/mechanics/enemy.js
  - src/ui/challenge.js
findings:
  critical: 2
  warning: 4
  info: 4
  total: 10
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-07-04T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

This is a re-review pass. A previous `21-REVIEW.md` already on disk at this path reported a
shared-`"challenge"`-tag teardown bug and an incomplete path-traversal guard as its top
Critical findings. I re-verified both directly against the current code rather than trusting
the stale file: **both are now fixed**. `src/ui/challenge.js` now scopes every overlay object
and `close()`'s `destroyAll(...)` call to a per-invocation `instanceTag` (lines 103-131,
298-301), and both servers' path guards now require an exact match or a path-separator
boundary (`filePath !== ROOT_ABS && !filePath.startsWith(ROOT_ABS + sep)`) rather than a bare
`startsWith`. The prior review's other items (`browser-boot.mjs`'s zero-margin hold,
`driveToX`'s bare `24` pre-gap window, `build.js`'s magic-number door-blocker height) are
likewise fixed, each now derived from `CONFIG`/physics formulas with an explanatory comment.
The prior review's `SAVE_BLOB`-drift finding was fixed **only** in
`audit-phase21-mechanics.mjs` (now derives its unlock blob from live `LEVEL_ORDER`) — its
sibling `browser-boot.mjs` still has the hardcoded version; see WR-02 below.

This pass surfaced two new Critical findings that the prior pass missed, both confirmed by
**actually running the scripts** (headless Chromium via the project's playwright fallback),
not just by reading the code:

- `node scripts/browser-boot.mjs` — **exits 1** (its own header calls this the project's
  pass/fail commit gate) with `{"type":"mechanic","message":"math-gate at x:600 never
  resolved after cycling keys 1-4"}`, despite cycling all 4 answer keys being guaranteed
  (per `src/math/brain.js`) to include the correct one.
- `node scripts/audit-phase21-mechanics.mjs` — reports `AUDIT: FAILURES DETECTED`, 11 of 16
  encounters across all 4 levels failing `triggered`/`resolved`.

See CR-01 for the root cause (an absolute-zero challenge-count check that is invalid whenever
a prior challenge is deliberately left open, which is a documented, by-design behavior of
`collect.js`) and CR-02 for a second, independent, code-level finding in `build.js` (math
gates and enemies can be jumped clean over, unlike doors).

## Critical Issues

### CR-01: "Challenge resolved" detection is an absolute zero-count, broken whenever a prior challenge is deliberately left open

**File:** `scripts/browser-boot.mjs:164-177`, `scripts/audit-phase21-mechanics.mjs:209-235`

**Issue:** Both scripts detect "challenge resolved" via an absolute-zero read of the shared,
cross-instance `"challenge"` tag:
```js
const remaining = await page.evaluate(() => get("challenge").length);
if (remaining === 0) { /* treated as resolved */ }
```
`src/ui/challenge.js` documents (lines 103-114) that the generic `"challenge"` tag is
intentionally shared across every currently-open instance ("kept so external
callers/diagnostics like `get(\"challenge\").length` can still detect 'is ANY challenge open'
across instances"), and `src/mechanics/collect.js` deliberately leaves its collect-zone
challenge open — undestroyed — until the player touches the correct pickup, by design
("movement stays live... Movement and collision stay fully live through this challenge").

Every level with a `collectZones` entry (level-01, level-03, level-04) places that zone before
any other mechanic on the path. If the player has not resolved it by the time they reach the
next boxed mechanic, its leftover tagged objects keep `get("challenge").length` above zero
forever — so `=== 0` can never fire true for that mechanic, or any later one in the same
level, regardless of whether the player answered correctly.

Empirically confirmed by running both scripts:
- `browser-boot.mjs` exits 1 every run with `"math-gate at x:600 never resolved after
  cycling keys 1-4"` — level-01 has a collect zone at x:300 before the gate at x:600, and
  `q.choices` always contains the answer (`src/math/brain.js`), so the in-game challenge
  almost certainly *did* resolve; the detection is what's wrong.
- `audit-phase21-mechanics.mjs`'s own JSON output: `level-01 math-gate x:600 →
  triggered:true, resolved:false` and `level-04 math-gate x:320 → triggered:true,
  resolved:false`, while the structurally identical `level-02 math-gate x:420` (level-02 has
  no `collectZones`) correctly reports `resolved:true` — isolating the cause to "a
  collect-zone challenge was left open earlier in this level."

The irony: `driveToX`, a few dozen lines above `resolveIfBoxed` in the same file, already
solved this exact class of bug for *trigger* detection with a `baseline`/`>` comparison
(lines 130-136) instead of an absolute count — but `resolveIfBoxed` was never given the
equivalent fix.

Because `browser-boot.mjs` is the actual commit gate (unlike the diagnostic-only
`audit-phase21-mechanics.mjs`), this is a live, reproducible false-negative that will block
legitimate commits, or, if "fixed" by simply loosening the check, could mask real
regressions.

**Fix:** Capture a baseline immediately before pressing 1-4 and check for a decrease, exactly
mirroring `driveToX`'s own pattern:
```js
const initial = await page.evaluate(() => get("challenge").length);
if (initial === 0) return { resolved: false };
for (const k of ["1", "2", "3", "4"]) {
  await page.keyboard.press(k);
  await page.waitForTimeout(200);
  const left = await page.evaluate(() => get("challenge").length);
  if (left < initial) return { resolved: true }; // was: left === 0
}
return { resolved: false };
```
Apply the same `< initial` fix to `browser-boot.mjs`'s math-gate loop.

### CR-02: Checkpoint math-gates and enemy encounters have no anti-jump-over blocker — a player can clear them without answering

**File:** `src/levels/build.js:143-227`

**Issue:** The locked-door build code (lines 143-182) deliberately constructs a *separate*,
apex-derived tall invisible collider (`blockerH`, ~161px) specifically so "a future retune of
`CONFIG.JUMP_FORCE`/`CONFIG.GRAVITY` can't silently shrink real coverage below the actual jump
arc and let the player jump over a locked door" (lines 148-150). The checkpoint math-gate code
(lines 184-205) and the enemy-encounter code (lines 207-227), built in the same function
immediately afterward, use *only* their own cosmetic-height box (`CONFIG.MATH_GATE.H` = 64px,
`CONFIG.ENEMY.H` = 32px) as their sole solid collider — no equivalent tall blocker.

`CONFIG.JUMP_FORCE` (520) and `CONFIG.GRAVITY` (1400) give a jump apex of
`520² / (2·1400) ≈ 96.6px` (matching config.js's own comment: "~3-tile (~96px) jump"). Since
`96.6px > MATH_GATE.H (64px) > ENEMY.H (32px)`, a normal running jump clears either obstacle
with margin to spare — the player can jump straight over a checkpoint gate or enemy without
ever colliding with it, entirely skipping the required math-answer interaction these
mechanics exist to enforce.

`build.js`'s own comment for `MATH_GATE` states intent to match `DOOR`'s blocking behavior
("Mirrors DOOR dimensions/palette so the locked checkpoint reads as a related barrier") — the
palette was mirrored, but the anti-jump-over collider construction (the actual behavioral
parity that matters) was not. This directly undermines the app's core purpose (forcing
multiplication practice at these checkpoints); level-02's math-gate at x:420, for example,
sits on a long uninterrupted floor run with plenty of runway to build a full jump.

**Fix:** Give math-gates the same apex-derived tall blocker pattern already used for doors
(and reconsider whether enemies should be mandatory or intentionally avoidable):
```js
for (const mg of g.mathGates ?? []) {
  const blockerH = Math.ceil((CONFIG.JUMP_FORCE ** 2) / (2 * CONFIG.GRAVITY)) + 64;
  const blocker = add([
    rect(CONFIG.MATH_GATE.W, blockerH),
    pos(mg.x, mg.y + CONFIG.MATH_GATE.H - blockerH),
    opacity(0),
    area(),
    body({ isStatic: true }),
    "math-gate",
  ]);
  // visible panel + glyph stay separate, non-colliding cosmetic objects, same as doors
}
```

## Warnings

### WR-01: ~100 lines of server/MIME/playwright-resolution boilerplate duplicated verbatim between the two scripts

**File:** `scripts/browser-boot.mjs:1-95`, `scripts/audit-phase21-mechanics.mjs:1-262`

**Issue:** The playwright dynamic-resolution function, the `MIME` table, and the
path-traversal-guarded static file server are copy-pasted near-identically between both
scripts. A fix applied to one has to be manually re-applied to the other to stay in sync —
and that has already failed to happen for the `SAVE_BLOB` derivation (WR-02) and the `MIME`
table itself (IN-02).

**Fix:** Extract the shared server/MIME/playwright-resolution logic into a
`scripts/lib/serve.mjs` (or similar) module imported by both scripts.

### WR-02: `browser-boot.mjs`'s save blob is still hardcoded, unlike its sibling script's fixed version

**File:** `scripts/browser-boot.mjs:57-68,129`

**Issue:** `audit-phase21-mechanics.mjs` now derives its unlock blob from the live
`LEVEL_ORDER` import (its own comment: "so it can never silently drift out of sync with the
real level roster if a level is added or removed"). `browser-boot.mjs` still hardcodes three
literal level ids in `SAVE_BLOB.levels` and a fourth literal array
`["level-01", "level-02", "level-03", "level-04"]` at line 129 — exactly the drift risk the
sibling script already fixed. If a 5th level is added, this script will silently fail to
unlock/visit it, with `driveToX`-equivalent logic here (the fixed-timeout holds) producing no
clear error, just an incomplete/misleading pass.

**Fix:** Import `LEVEL_ORDER` from `../src/levels/index.js` here too and derive both the save
blob and the `levels` loop array from it, matching `audit-phase21-mechanics.mjs`.

### WR-03: `browser-boot.mjs`'s movement still relies on fixed timeouts, not live position polling

**File:** `scripts/browser-boot.mjs:141-177`

**Issue:** Unlike `audit-phase21-mechanics.mjs`'s `driveToX`, which polls `player.pos.x` every
100ms and reacts to real state, this script holds `ArrowRight` for durations computed by hand
from `CONFIG.RUN_SPEED` and assumed distances (`1000ms`, then `1250+150ms` — the margin was
already added per the fixed prior-review item, but the underlying approach is still
timing-based, not state-based). Any timing jitter, frame drops, or a future
`CONFIG.RUN_SPEED` retune (explicitly flagged elsewhere as a Phase-12 tuning target) can
desync these literals from the actual required travel time, causing the commit gate to fail
(or pass) for reasons unrelated to real regressions.

**Fix:** Reuse (or extract, per WR-01) `driveToX`'s poll-based approach here instead of fixed
waits.

### WR-04: `driveToX`'s per-gap jump model presses Space at most once per floor-to-floor gap, with no documented margin or assertion

**File:** `scripts/audit-phase21-mechanics.mjs:93-201`

**Issue:** `deriveGapRanges` produces exactly one gap entry per floor-to-floor transition, and
`driveToX`'s `jumped` Set (keyed by `gap.start`) permits only one `Space` press per gap for the
entire approach. This currently works only because every authored gap's width is narrower
than one full jump's horizontal travel distance (`RUN_SPEED × jump hangtime ≈ 178px`, versus
the levels' widest floor-to-floor gaps at ~180px or less) — a coincidence of the current
tuning that the code neither checks nor asserts. If a future level widens a gap, or
`CONFIG.RUN_SPEED`/`JUMP_FORCE`/`GRAVITY` are retuned (all three are explicitly called out
elsewhere as Phase-12 targets), this script would silently start reporting "mechanic
unreachable" for every encounter past that gap, with nothing connecting the failure to this
assumption.

**Fix:** Add an assertion/comment cross-checking `gap width < RUN_SPEED * jump hangtime` per
level at script startup so a future gap/tuning change fails loudly here instead of producing
a confusing "unreachable" diagnostic; consider supporting multiple jumps per gap.

## Info

### IN-01: Hardcoded, machine-specific Playwright fallback path duplicated verbatim in two files

**File:** `scripts/audit-phase21-mechanics.mjs:30-47`, `scripts/browser-boot.mjs:17-34`

**Issue:** Both scripts attempt normal dependency resolution first and accept a
`PLAYWRIGHT_MJS_PATH` override, but the final fallback is one specific developer's absolute
home directory / `nvm` Node version / global package location, copy-pasted identically into
both files. Breaks silently on any other machine/CI without the override set.

**Fix:** Add `playwright` as a real devDependency once this project has a `package.json`;
until then, extract the shared `resolvePlaywright()` helper into one module both scripts
import instead of duplicating it.

### IN-02: MIME type table drift between the two near-identical local servers

**File:** `scripts/audit-phase21-mechanics.mjs:56-66`, `scripts/browser-boot.mjs:42-54`

**Issue:** `browser-boot.mjs`'s `MIME` map includes `.wav`/`.mp3` entries; the otherwise
line-for-line-identical server in `audit-phase21-mechanics.mjs` does not. Any audio asset
loaded during the mechanics audit run would be served with the generic
`application/octet-stream` fallback instead of the correct audio MIME type.

**Fix:** Extract one shared `MIME` map (per WR-01) so the two copies cannot drift.

### IN-03: Answer-box layout constants in `challenge.js` are inline magic numbers, unlike sibling `CONFIG.GATE.*` constants

**File:** `src/ui/challenge.js:203-205`

**Issue:**
```js
const BOX_W = 84;
const BOX_H = 44;
const GAP = 16;
```
Every other layout dimension this file draws on (`CONFIG.GATE.PANEL_W`, `PANEL_H`,
`DIM_OPACITY`) is centralized in `CONFIG`, but these three are local literals, inconsistent
with the established convention and harder to retune alongside the panel size they must fit
inside.

**Fix:** Move `BOX_W`/`BOX_H`/`GAP` into `CONFIG.GATE` alongside `PANEL_W`/`PANEL_H`.

### IN-04: Visual floor/platform tiling can overhang the collider for non-tile-aligned widths

**File:** `src/levels/build.js:93-95, 110-112`

**Issue:** `for (let tx = run.x; tx < run.x + run.w; tx += T)` places a full `T`-wide visual
tile as long as its start x is `< run.x + run.w`. If `run.w` (or a platform's `p.w`) is ever
not an exact multiple of `CONFIG.TILE_SIZE`, the final tile's sprite extends past the
collider's actual right edge — a purely visual overhang beyond the physical solid region.
Every current level's runs/platforms happen to be tile-aligned, so this is currently latent,
not manifesting.

**Fix:** Add a dev-time assertion (`if (run.w % T !== 0) console.warn(...)`) in `buildLevel`,
or document the tile-alignment requirement on the level descriptor schema.

---

_Reviewed: 2026-07-04T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
