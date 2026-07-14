---
phase: 34-level-quality-pass
plan: 01
subsystem: level-validation
tags: [reachability, validator, coins, red-first, jump-envelope]
requires:
  - scripts/lib/reachability.mjs (the existing node/graph/BFS engine — EXTENDED, never rewritten)
  - scripts/lib/jump-envelope.mjs (the FROZEN calibrated envelope: maxRise 88.331, runSpeed 218.043)
provides:
  - coin-reachability HARD-FAIL check inside checkLevelReachability()
  - planCoinWitnesses() — the witness contract Plan 34-02's in-engine replay consumes
  - the TRUE unreachable-coin work list for Plans 34-03 / 34-04 / 34-05
affects:
  - scripts/validate-levels.mjs (behavior only — ZERO source edits; rows flow through existing plumbing)
tech-stack:
  added: []
  patterns: [minkowski-expanded-hitbox, trajectory-sampling, witness-emitting-model, red-first-fixture, mutation-tested-guard]
key-files:
  created:
    - scripts/fixtures/bad-level-coin.js
  modified:
    - scripts/lib/reachability.mjs
decisions:
  - "A coin is modeled as a 48x64 Minkowski PASS-THROUGH box, never as a zero-width landing point — this is what supersedes the alcove model's over-reporting."
  - "The rise is clamped to the EMPIRICAL envelope.maxRise (88.331px), never to the theoretical apex (96.57px, never observed). The model must only ever UNDER-credit."
  - "Coin rows are PASS/HARD-FAIL only — no WARN tier. The 48x64 box already absorbs player imprecision; the real tightness arbiter is 34-02's in-engine replay."
  - "Plan Case Q's coordinate (y:224) was arithmetically wrong for its own stated intent and would have been a vacuous assertion. Implemented at y:160 — the coordinate that actually produces the specified 96px dead-band rise. Case strengthened, never weakened."
metrics:
  duration: ~50m
  completed: 2026-07-14
  tasks: 3
  files_changed: 2
  coins_checked: 132
  coins_unreachable: 5
status: complete
---

# Phase 34 Plan 01: Coin-Reachability Model (RED-First) Summary

Gave the level validator a coin-SHAPED reachability model — a 48x64 Minkowski pass-through box sampled mid-arc, bidirectionally, clamped to the empirically-measured jump envelope — proved it RED-first against a one-defect fixture, and re-derived the true unreachable-coin work list: **5 coins, not 32**.

## What Was Built

### 1. The coin model (`scripts/lib/reachability.mjs`, extended — never rewritten)

`bestMarginToPoint` (the alcove/mover POINT model) was **not touched**. Alcoves and movers keep using it. The coin model was added *alongside* it:

| Export | Role |
|--------|------|
| `PLAYER_W`/`PLAYER_H` (16/32) | provenance: `src/player.js:30`'s explicitly-locked `area({shape: new Rect(vec2(0), 16, 32)})` (the ART-04 collider lock) |
| `COIN_W`/`COIN_H` (32/32) | provenance: `src/levels/build.js:200`'s `sprite("coin") + area()`; coin.png is a 256x32 sheet of `CONFIG.COIN_FRAMES` (8) evenly-gridded frames |
| `coinTargetBox(coin)` | the Minkowski-expanded 48x64 set of player TOP-LEFT positions at which the player's AABB overlaps the coin's |
| `bestWitnessToCoin(coin, nodes, spawnPaths, envelope)` | best replayable witness, or `null` |
| `planCoinWitnesses(geometry, envelope)` | the pure, node-importable contract Plan 34-02 imports |
| `coin-reachability` row block | inside `checkLevelReachability()` — PASS / HARD-FAIL, no WARN tier |

**Why a coin is not an alcove.** The alcove model asks *"can I get to and STAND at this zero-width point"* — a **landing** question. `build.js` emits a coin as a 32x32 `area()` collected **mid-arc, in flight**: the player only has to **pass through** its box. Probing coins through the alcove model is what produced 34-CONTEXT.md's 32-coin figure; it systematically over-reports because it demands a landing where the game demands only a fly-through.

**Three witness families**, in simplest-to-replay preference order (`walk` → `fall` → `jump`; then smallest `t`; then `dir` +1 before −1):
- `walk` (t=0): the coin's box already contains the standing position. Structurally inexpressible in the alcove model.
- `fall` (t>0): jump force 0, `x0` **pinned** to the departure edge (a fall only begins once the player walks *off* it — a free `x0` would fabricate a player falling out of the middle of a solid platform).
- `jump` (t>0): `x0` free within the takeoff range, both directions evaluated.

**Bidirectional deliberately** (unlike `bestMarginToPoint`'s rightward-only model): a coin is off the critical path, so "forward progress only" is the wrong assumption; the box model makes the second direction nearly free; and level-08's Phase-34 switchback climb (Plan 34-04) reverses direction twice, so a rightward-only model would fabricate false HARD-FAILs there.

Every PASS row prints its **witness** into the descriptor (`family=… from <launchNodeId> takeoffX=… dir=…`) so 34-03/04/05 and 34-02's in-engine gate can both act on it. **A model that emits witnesses is a model that has made itself falsifiable.**

### 2. The three documented, load-bearing limitations

Documented in-file, not papered over:

1. **No obstruction modeling** — it does not know a platform underside can bonk the rising arc, that a spike sits in the walk path, or that a door blocker stands between takeoff and coin. `docs/LEVEL-DESIGN.md` §3 records ceiling-bonk as a real, *shipped* bug class. **This is the one limitation that can make the model OVER-credit — and it is exactly why Plan 34-02 exists**: `audit-coins.mjs` replays every witness in the real engine and falsifies any coin wrongly PASSed. This model is the cheap filter; the running game is the arbiter.
2. **No variable-height cut-jump** (`CONFIG.JUMP_CUT`) — under-credits, and keeps every PASS witness replayable with a plain hold-direction + tap-jump input.
3. **Rise clamped to the EMPIRICAL `maxRise` (88.331px), not the theoretical apex (96.57px)** — see below.

### 3. The envelope clamp — the invariant this plan exists to protect

**The model must only ever UNDER-credit. If a coin is doubtful, it is unreachable.**

`maxRise` = 88.331px is `minObservedRise (92.98) × 0.95` from real engine trials. The theoretical apex `JUMP_FORCE²/(2·GRAVITY)` = 96.57px **was never actually observed**. An unclamped model would credit coins in the **88.3–96.6px dead band** that the player cannot reach.

Note the asymmetry that makes this the dangerous one:

| Limitation | Direction | Caught by 34-02's in-engine replay? |
|---|---|---|
| 2 (no cut-jump) | under-credits | n/a — safe |
| 1 (no obstruction) | **over**-credits | **yes** — replay collects or does not |
| 3 unclamped (hypothetical) | **over**-credits | **NO — structurally cannot** |

The real engine has the same theoretical apex, so a scripted, frame-perfect hold-jump *would* collect a dead-band coin and turn 34-02's gate green — while a real 12-year-old, jumping imperfectly, never would. And a pickup demanding an apex-perfect jump is precisely the precision pressure this project forbids. Both clamps are implemented: a coarse per-node reject (`surfaceTop - box.y1 > envelope.maxRise`, the same cutoff `jumpReach()` applies) and a per-sample discard.

**Self-test Case Q is the guard, and it was mutation-tested.** Stripping both clamp guards and re-running the self-test produces:

```
Assertion failed: ENVELOPE CLAMP BROKEN: a coin needing 96px of rise (> the empirical
maxRise 88.331px, <= the never-observed theoretical apex 96.57px) MUST be unreachable
— the model is over-crediting, the one error 34-02 cannot catch.
Got {"launchNodeId":"floor-0","launchY":320,"takeoffX":132.59,"dir":1,"family":"jump","t":0.3458}
reachability-selftest: FAIL — 2 assertion(s) failed
```

The clamp is load-bearing and proven so. Case Q also carries a self-guard asserting its own fixture still sits in the dead band, so a future envelope retune cannot silently make it vacuous.

### 4. RED-first proof (`scripts/fixtures/bad-level-coin.js`)

One defect, nothing else wrong:

```
bad-level-coin-fixture | biome             | PASS      | "swamp"
bad-level-coin-fixture | over-hole         | PASS      | (no floating barriers)
bad-level-coin-fixture | spawn-goal        | PASS      | goal x:350 reached via floor-0 (marginRatio=0.000)
bad-level-coin-fixture | coin-reachability | HARD-FAIL | coins[0] x:200 y:60 unreachable from spawn
validate-levels: FAIL — 1 hard-failure(s) across 1 level(s)   [exit 1]
```

Exactly **1** HARD-FAIL, and it is the coin row. The coin needs 164px of rise — roughly double `maxRise` and far beyond even the theoretical apex — so the fixture cannot go stale if the envelope is ever re-measured.

**Zero edits to `scripts/validate-levels.mjs`** (`git diff --stat` empty), as predicted: it already prints every row from `checkLevelReachability` and adds `hardFailCount` straight through (lines 99-103), so the new gate wired itself through the existing plumbing. **Confirmed by reading it, as the plan required.**

---

## Task 3: THE TRUE WORK LIST

`node scripts/validate-levels.mjs` — **132 coin-reachability rows emitted (one per shipped coin across all 8 levels)**, proving every coin is genuinely checked, not silently skipped. Exit 1, RED — **by design** (34-CONTEXT.md decision 4).

### The full HARD-FAIL work list (verbatim from the run)

```
level-01 | coin-reachability | HARD-FAIL | coins[12] x:2600 y:136 unreachable from spawn
level-02 | coin-reachability | HARD-FAIL | coins[12] x:3260 y:136 unreachable from spawn
level-03 | coin-reachability | HARD-FAIL | coins[13] x:3900 y:128 unreachable from spawn
level-04 | coin-reachability | HARD-FAIL | coins[14] x:4460 y:136 unreachable from spawn
level-07 | coin-reachability | HARD-FAIL | coins[2]  x:420  y:128 unreachable from spawn
```

**5 unreachable coins. All 5 HARD-FAILs in the entire 8-level run are coin rows — zero non-coin HARD-FAILs**, so the RED is attributable purely to the new check.

### Old vs new: the coin model vs the alcove-model upper bound

| Level | coins | unreachable (ALCOVE model — 34-CONTEXT.md, **upper bound only**) | unreachable (**COIN model — THE WORK LIST**) | delta |
|-------|------:|-----:|-----:|------:|
| level-01 | 16 | 2 | **1** | −1 |
| level-02 | 15 | 3 | **1** | −2 |
| level-03 | 17 | 4 | **1** | −3 |
| level-04 | 19 | 4 | **1** | −3 |
| level-05 | 15 | 4 | **0** | −4 |
| level-06 | 15 | 6 | **0** | −6 |
| level-07 | 17 | 4 | **1** | −3 |
| level-08 | 18 | 5 | **0** | −5 |
| **total** | **132** | **32** | **5** | **−27** |

**Direction sanity gate (the plan's stop-and-re-derive condition): the coin model reports FEWER offenders than the point model on every single level — 5 vs 32.** A count *higher* than 32 would have meant the model was wrong (it must under-credit relative to the landing-question point model, never over-credit) and would have required stopping. It does not. 27 of the 32 alcove-model "offenders" were **false alarms** — coins the player passes straight through mid-arc but could never come to rest at.

### These 5 are not marginal calls

Each offender was hand-checked against the real geometry it floats over. Every one is impossible under **any** model — they are not dead-band judgment calls:

| Coin | Nearest supporting surface | Rise needed to clip even the box BOTTOM | Verdict |
|------|---------------------------|------:|---------|
| level-01 coins[12] (2600,136) | floor 2400..2880 @ y320 — no platform anywhere near | 120.0px | > 96.57 apex — impossible |
| level-02 coins[12] (3260,136) | floor 2960..3520 @ y320 — no platform | 120.0px | > 96.57 apex — impossible |
| level-03 coins[13] (3900,128) | floor 3560..4160 @ y320 — no platform | 128.0px | > 96.57 apex — impossible |
| level-04 coins[14] (4460,136) | floor 4160..4720 @ y320 — no platform | 120.0px | > 96.57 apex — impossible |
| level-07 coins[2]  (420,128)  | floors 0..460 / 600..1120 @ y320 — no platform | 128.0px | > 96.57 apex — impossible |

All five are the same authoring mistake: a decorative coin arced high over a **bare floor run** with no platform beneath it, at 120–128px of rise where the player's absolute physical ceiling is ~88px (and even the never-observed theoretical ceiling is 96.57px). These are unambiguously "she can see it and can never get it."

### THIS list — not the 32 — is the work list

**Plans 34-03 / 34-04 / 34-05 execute against these 5 coins.** 34-CONTEXT.md's 32-coin table is superseded and is an upper bound only; it must never be used as the work list. (Note the scope implication: levels 05, 06 and 08 need **zero** coin moves; levels 01–04 and 07 need exactly one each.)

**Zero coins moved in this plan. Zero level descriptors touched** — `git status --porcelain src/levels/` is empty.

---

## Expected Repo State: `validate-levels.mjs` is RED — deliberately

`node scripts/validate-levels.mjs` now exits **1** with 5 HARD-FAILs on the real levels. **This is the intended end state of this plan** (34-CONTEXT.md decision 4: "RED-first: land the check, let it go RED on the REAL offenders, then move coins until GREEN"). The gate returns green at the end of Plan 34-05, once all 5 coins have been moved.

**Do NOT "fix" this red by weakening, disabling, or WARN-tiering the coin check.**

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Self-test Case Q's specified coordinate was arithmetically wrong and would have been a vacuous assertion**
- **Found during:** Task 2 (implementing the self-test cases)
- **Issue:** The plan specified Case Q's dead-band coin at `{x:200, y:224}`. That coin's Minkowski box is `y ∈ [192, 256]`, and the part of the box the player must actually touch is its **BOTTOM** edge (256) — not its top. From the standing top-left y of 288, that is a **32px** rise: trivially reachable, well inside *both* the empirical envelope and the theoretical apex. **A clamped and an unclamped model both PASS that coin**, so the assertion `bestWitnessToCoin(...) === null` would have failed immediately on a correct implementation — and had it instead been "fixed" by relaxing the assertion, the phase's single most important guard would have silently tested nothing. The plan's own prose states the intent unambiguously ("box bottom sits in the dead band", "requires a rise of `288 - 192 = 96px`", "inside the theoretical apex, OUTSIDE the calibrated envelope") — it just names the wrong y.
- **Fix:** Implemented Case Q at `{x:200, y:160}` — the coordinate that actually produces box `y ∈ [128, 192]` and the plan's own stated 96px required rise (> 88.331 maxRise, ≤ 96.57 apex). The case is implemented at **full strength, not weakened**: mutation-testing confirms an unclamped model FAILS it and the clamped model PASSes it, which is precisely the behavior the plan demanded. Additionally added a self-guard inside Case Q asserting its fixture still sits in the dead band, so a future envelope retune cannot silently make it vacuous again.
- **Files modified:** `scripts/lib/reachability.mjs` (documented inline at the case)
- **Commit:** 0a47095

**2. [Rule 3 - Blocking] The plan labelled two distinct self-test cases "Case Q"**
- **Found during:** Task 2
- **Issue:** Both the envelope-clamp case and the omitted-`coins`-array case were labelled "Case Q".
- **Fix:** The omitted-array case is named **Case R**. Purely cosmetic; both cases implemented.
- **Commit:** 0a47095

## Verification

| # | Check | Result |
|---|-------|--------|
| 1 | `node scripts/lib/reachability.mjs` | `reachability-selftest: PASS` — all pre-existing cases (1–4, A–M) plus new N/O/P/Q/R |
| 2 | Case Q mutation test (clamps stripped) | **FAILS with "ENVELOPE CLAMP BROKEN"** — the guard is load-bearing, proven |
| 3 | `node scripts/validate-levels.mjs --fixture scripts/fixtures/bad-level-coin.js` | exit 1, **exactly 1** HARD-FAIL, and it is the `coin-reachability` row |
| 4 | `bash scripts/check-import-safety.sh` | PASS — the model stays pure/node-importable (a727c13) |
| 5 | `node scripts/validate-levels.mjs` | **132** coin-reachability rows over 8 levels; 5 HARD-FAILs = the work list |
| 6 | `git diff --stat scripts/validate-levels.mjs` | **empty** — the gate wired itself through existing plumbing |
| 7 | `git status --porcelain src/levels/` | **empty** — zero level descriptors touched |
| 8 | `grep -c bestMarginToPoint scripts/lib/reachability.mjs` | 15 (≥4) — the alcove/mover point model untouched, not replaced |
| 9 | `check-safety.sh` / `check-gate.sh` / `check-assets-manifest.mjs` | PASS (unaffected — no `src/` changes) |
| 10 | `--fixture bad-level-mover.js` | still exits 1 — pre-existing fixture behavior unchanged |

**Interactive/in-engine proof is deliberately NOT claimed here.** Per this project's standing rule ("checks that don't play the game lie", `.planning/research/ART-PARITY-STEERING.md` facts 7-11), this plan ships a *static model* and its *falsifiable witnesses*. Plan 34-02 replays those witnesses in the real running engine — that is where the model is confronted with the game.

## Known Stubs

None. No `src/` runtime code was touched; the two artifacts are complete and exercised.

## Threat Flags

None. Pure in-repo script-lib change: no network, no user input, no new dependency, no `src/` runtime code. T-34-01 (a gate that lies) and T-34-02 (silent constant drift) are both mitigated as planned — RED-first fixture + mutation-tested clamp + witness emission + source-line provenance comments naming `src/player.js:30` and `src/levels/build.js:200`.

## For the Next Plan (34-02)

- Import `planCoinWitnesses(geometry, envelope)` from `scripts/lib/reachability.mjs`. Witness fields are stable: `{ launchNodeId, launchY, takeoffX, dir, family, t }`, plus `{ index, coin, witness }` per entry.
- `witness === null` means the model calls the coin unreachable (the 5 above).
- A `walk` witness replays as "hold a direction"; `fall` as "hold a direction off the pinned edge"; `jump` as "hold a direction + tap jump" — no cut-jump, no frame-perfect timing, by construction.
- 34-02's job is to **falsify** this model: any coin PASSed here that the real engine fails to collect exposes limitation 1 (obstruction blindness), which is the expected and designed-for failure mode.

## Self-Check: PASSED

- `scripts/lib/reachability.mjs` — FOUND (modified)
- `scripts/fixtures/bad-level-coin.js` — FOUND (created)
- `.planning/phases/34-level-quality-pass/34-01-SUMMARY.md` — FOUND (this file)
- commit `d5d830c` — FOUND
- commit `0a47095` — FOUND
</content>
</invoke>
