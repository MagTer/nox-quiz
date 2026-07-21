---
phase: 34-level-quality-pass
plan: 03
subsystem: levels
tags: [coins, reachability, ceiling-bonk, in-engine-proof, coins-not-geometry]
requires:
  - scripts/lib/reachability.mjs (Plan 34-02's obstruction-aware coin model)
  - scripts/audit-coins.mjs (Plan 34-02's in-engine witness replay gate)
  - scripts/validate-levels.mjs (the static coin-reachability HARD-FAIL rows = the work list)
provides:
  - levels 04/05/06/07 with ZERO unreachable coins — proven statically AND in the real engine
  - scripts/smoke-progress.mjs level-04 golden coins fixture, honestly re-baselined
affects:
  - scripts/validate-levels.mjs (behavior only — 13 coin HARD-FAILs down to 8; the remaining 8 are levels 01/02/03, Plan 34-05's scope)
tech-stack:
  added: []
  patterns: [coins-not-geometry, minkowski-walk-band, fingerprint-frozen-geometry, in-engine-arbiter]
key-files:
  created: []
  modified:
    - src/levels/level-04.js
    - src/levels/level-06.js
    - src/levels/level-07.js
    - scripts/smoke-progress.mjs
decisions:
  - "Levels 05 and 08 needed ZERO coin moves — confirmed against the live validator, not assumed from a copied list."
  - "Two of the five coins were CEILING-BONKED under gap-bridging platforms. Lowering them fixes nothing; both were moved ONTO the bridge's walk band (platform top - 56), which is where the player actually walks."
  - "level-06 coins[4] was embedded INSIDE an unreachable platform's own collider. Moved LEFT of the overhang, not up (the platform needs a 130px rise — nobody will ever stand on it)."
  - "The two bare-floor coins were lowered to y:176 (80px rise) — the arc height this codebase has already PROVEN collectable in-engine (level-04's coin@5060), not to the 88.331px envelope edge where a real 12-year-old's imperfect jump would miss."
  - "Zero geometry edits, asserted by sha256 fingerprint of floors+platforms per level rather than by a git-diff proxy (which would pass vacuously once Task 1 is committed)."
metrics:
  duration: ~50m
  completed: 2026-07-14
  tasks: 3
  files_changed: 4
  coins_moved: 5
  geometry_edits: 0
status: complete
---

# Phase 34 Plan 03: Coin Reachability Fix, Levels 04-07 Summary

Moved the 5 unreachable coins in levels 04/05/06/07 onto arcs the player actually flies through — **coins only, geometry byte-frozen** — and proved it twice: the static model went green, and then a real driven player in the real Kaplay engine **collected every single one**.

**Levels 04-07 now have ZERO skipped coins in the in-engine gate: 19/19, 15/15, 15/15, 17/17 collected.**

## The work list — re-derived, not copied

The prompt supplied a 5-coin list; I re-derived it from `node scripts/validate-levels.mjs` as the plan demanded. It matched exactly:

| Level | coins[i] | was | why unreachable |
|---|---|---|---|
| level-04 | coins[12] | (4040, 264) | **ceiling-bonk** — floated in gap 4000..4160 *under* the bridging platform (4000..4128 @ y250, collider 250..274) |
| level-04 | coins[14] | (4460, 136) | 120px rise over bare floor-7 — past even the never-observed theoretical apex (96.57px) |
| level-04 | coins[15] | (4760, 264) | **ceiling-bonk** under the bridging platform (4720..4848 @ y250) |
| level-06 | coins[4] | (860, 176) | **embedded inside** platform 840..952 @ y190's own collider (190..214) |
| level-07 | coins[2] | (420, 128) | 128px rise over bare floor-0 — past the theoretical apex |

**level-05 needed zero moves** — its file was never touched. (Levels 01/02/03's 8 remaining HARD-FAILs are Plan 34-05's; level-08 is 34-04's. Neither was touched.)

## The moves, and why each is where it is

The player's standing top-left is `surfaceY - 32`; a coin's pass-through box spans `coin.y - 32 .. coin.y + 32`. So `surfaceY - 56` is dead-centre of the walk band — that is the shipped `y:264` floor-coin motif (320 - 56), and it generalises to any surface.

| Coin | now | reasoning |
|---|---|---|
| level-04 coins[12] | **(4040, 194)** | The bridge platform's top is y250, so 250 - 56 = **194** puts the coin in the walk band *on top of the bridge the player already crosses*. Same x — it still reads as "the coin at the bridge". Lowering it would have been useless: the solid was **above** it. |
| level-04 coins[15] | **(4760, 194)** | Identical motif, identical fix (bridge 4720..4848 @ y250). |
| level-04 coins[14] | **(4460, 176)** | Bare floor-7, no platform anywhere near — must come down. y:176 needs an 80px rise (< the 88.331px envelope), and is the *same arc height as this level's own coin@5060*, which the engine already collects. Keeps the arc. |
| level-06 coins[4] | **(790, 184)** | The coin sat *inside* platform 840..952's collider, and that platform is itself unreachable (130px rise). So there was no "up" to move it to. Moved **left of the overhang** (clear of 840..952) onto a real 72px-rise jump arc off floor-1 — preserving its role as the arc coin between the floor coins at 700 and 1080. |
| level-07 coins[2] | **(420, 176)** | Bare floor-0. Lowered to an 80px rise, same proven arc height. |

Every moved coin carries an inline comment in the descriptor saying what it was and why it moved. **No coin was deleted, no level was flattened** — counts stayed 19/15/15/17.

### Why not push the bare-floor coins to the envelope edge?

The hard ceiling is a **rise** of 88.331px, which permits a coin as high as `y:168` (88.0px rise) — a 0.33px margin. I did not use it. A pickup that demands an apex-perfect jump is exactly the precision pressure this project forbids, and 34-01's summary is explicit that the model must under-credit. `y:176` (80px, 8px of slack) is the height this codebase has already *demonstrated* in-engine.

## Geometry is byte-frozen — asserted, not promised

34-CONTEXT.md decision 2 (binding): **move the coins, never the geometry.** The plan's own PLAN-CHECK note replaced the original `git diff | grep 'w:'` check because it would pass *vacuously* once Task 1 was committed (a diff against HEAD is empty after you commit). The absolute assertion was used instead — a sha256 of each level's `{floors, platforms}`:

```
GEOMETRY FROZEN level-04: 71d96d6331c28bbc
GEOMETRY FROZEN level-05: 5b2a2e2bb8e1b3f4
GEOMETRY FROZEN level-06: 2595472f98a44e46
GEOMETRY FROZEN level-07: a19895f336b8036e
```

All four match their pre-phase fingerprints exactly. **The kid-validated platforming feel is untouched, and no geometry drift can hide inside Phase 35's art diff.**

## The in-engine proof (Task 3) — the part that actually matters

Static green is what shipped this bug in the first place. `node scripts/audit-coins.mjs` drives a real player with real key input in the real engine and demands the real `onCollide("coin")` handler fire:

```
[level-04] coins=19 obstacles-cleared=12 driven=19 incidental=0 skipped=0 NOT-COLLECTED=0
[level-05] coins=15 obstacles-cleared=6  driven=15 incidental=0 skipped=0 NOT-COLLECTED=0
[level-06] coins=15 obstacles-cleared=6  driven=15 incidental=0 skipped=0 NOT-COLLECTED=0
[level-07] coins=17 obstacles-cleared=5  driven=17 incidental=0 skipped=0 NOT-COLLECTED=0

coins=132 witnessed=124 collected=124 (incidental=0) model-HARD-FAIL-skipped=8
AUDIT-COINS: ALL WITNESSED COINS COLLECTED
```

`skipped=0` on all four of my levels — before this plan, levels 04/06/07 had 3/1/1 skipped. The gate's witnessed count rose 119 → 124: **the 5 moved coins are the 5 new witnesses, and the engine collected all 5.** Their individual rows:

```json
{"level":"level-04","coin":12,"x":4040,"y":194,"model":"PASS","family":"walk","dir":1,"collected":true,"via":"driven","offsetUsed":0}
{"level":"level-04","coin":14,"x":4460,"y":176,"model":"PASS","family":"jump","dir":1,"collected":true,"via":"driven","offsetUsed":0}
{"level":"level-04","coin":15,"x":4760,"y":194,"model":"PASS","family":"walk","dir":1,"collected":true,"via":"driven","offsetUsed":0}
{"level":"level-06","coin":4, "x":790, "y":184,"model":"PASS","family":"jump","dir":1,"collected":true,"via":"driven","offsetUsed":0}
{"level":"level-07","coin":2, "x":420, "y":176,"model":"PASS","family":"jump","dir":1,"collected":true,"via":"driven","offsetUsed":0}
```

Two details worth reading: **`via: "driven"`** (not `incidental` — each was collected by its own witness, not swept up by accident), and **`offsetUsed: 0`** on all five (the takeoff-fraction sweep was never needed — these are clean centre-line collections, not marginal rescues).

The remaining `skipped=8` are levels 01/02/03 — **Plan 34-05's work list, untouched here.** `validate-levels.mjs` is still RED overall for exactly those 8. That is the expected RED-first state, not a regression.

## Deviations from Plan

**None.** No deviation rule fired. The plan's work list, the coin-only constraint, the walk-band arithmetic and the fingerprint assertion were all followed as written.

One environmental finding, recorded because it cost real time and will bite the next parallel wave:

**`browser-boot.mjs` and the FPS floor are unreliable under parallel execution.** My first `browser-boot.mjs` run died on `EADDRINUSE :8765` (the sibling 34-04 executor's copy of the same hard-coded port), and once it did start, it reported `level-04: far-end drive stalled at x:3800` plus FPS floor breaches on levels 05/08. **I did not assume these were flakes — I A/B'd them.** Reverting *only* `src/levels/level-04.js` to its pre-plan state (`git checkout 7d77360 -- src/levels/level-04.js`) and re-running produced a *worse* result: **6 FPS failures, including on levels 01/02/03 which this plan never touches**, and the level-04 far-end stall *did not reproduce*. That is dispositive: the failures track machine load (loadavg was 8.2 with the sibling's Chromium running), not my coins. Re-run on a quiet machine (loadavg 0.5), with my coins in place:

```
Browser boot: PASS — title -> select -> all levels loaded with no runtime errors.   [exit 0]
```

The far-end stall is a headless bot death-loop at level-04's spike@3880 (checkpoint 3800), ~1400px away from the nearest coin I moved — coins carry no solid collider and cannot obstruct a player, so there is no mechanism by which they could cause it. Flagged for the phase, not fixed here (out of scope; would be a change to a Playwright script this plan does not own).

## Verification

| # | Check | Result |
|---|-------|--------|
| 1 | `validate-levels.mjs` coin HARD-FAILs for levels 04-07 | **0** (was 5) |
| 2 | Geometry fingerprint, all 4 levels | **FROZEN** — sha256 of floors+platforms identical to pre-phase |
| 3 | Coin counts | **COUNTS-OK** — 19/15/15/17 unchanged |
| 4 | `bash scripts/check-progress.sh` | **PASS** (`smoke-progress: PASS`) with the re-baselined level-04 fixture |
| 5 | `git diff` of smoke-progress: lines carrying a width key | **0** — only the coins array changed |
| 6 | `node scripts/audit-coins.mjs` | **exit 0** — 124/124 collected; levels 04-07 skipped=0, NOT-COLLECTED=0 |
| 7 | `node scripts/browser-boot.mjs` | **exit 0** — PASS (quiet machine; see Deviations) |
| 8 | `node scripts/audit-phase21-mechanics.mjs` | **exit 0** — `ALL MECHANICS RESOLVED`, **24/24 `triggered: true`, zero `triggered: false`** |
| 9 | `check-safety.sh` / `check-import-safety.sh` / `check-gate.sh` | **PASS** |
| 10 | `node scripts/check-assets-manifest.mjs` | **PASS** — 37 assets |
| 11 | `node scripts/lib/reachability.mjs` | `reachability-selftest: PASS` (model untouched — the coins moved, not the gate) |
| 12 | `git status --short src/levels/level-05.js`, `level-08.js` | **empty** — neither touched (05 needed nothing; 08 is 34-04's) |

**In-engine proof IS claimed here** (check 6): the real vendored Kaplay engine, the real player entity, real held key input, the real 32x32 coin `area()`, and the real `onCollide("coin")` handler — the only place in the entire codebase that can destroy a coin.

**Human sign-off is NOT claimed.** Every coin is now *provably collectable by a driven bot*; whether the repositioned coins *read well* to a 12-year-old is a judgment call for the phase's interactive checkpoint.

## Known Stubs

None. No `src/` runtime code was touched — this plan changed level data only.

## Threat Flags

None. Pure level-data edit: no new input, no new dependency, no runtime code, no trust boundary. The plan's threat register is fully discharged: **T-34-08** (geometry tamper) — fingerprint-frozen, all 4 levels; **T-34-09** (silent coin deletion) — counts asserted 19/15/15/17; **T-34-10** (a green gate that lies) — the in-engine gate collected all 5 moved coins, `via: driven`; **T-34-11** (a red gate elsewhere) — level-04's golden fixture re-baselined in its own commit, `check-progress.sh` green.

## Self-Check: PASSED

- `src/levels/level-04.js` — FOUND (modified)
- `src/levels/level-06.js` — FOUND (modified)
- `src/levels/level-07.js` — FOUND (modified)
- `scripts/smoke-progress.mjs` — FOUND (modified)
- `src/levels/level-05.js` — FOUND, unmodified (needed zero moves)
- commit `4bb7cc3` (coin moves) — FOUND
- commit `70404fe` (fixture re-baseline) — FOUND
