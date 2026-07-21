---
phase: 34-level-quality-pass
plan: 02
subsystem: level-validation
tags: [reachability, coins, in-engine-gate, playwright, falsification, ceiling-bonk]
requires:
  - scripts/lib/reachability.mjs (planCoinWitnesses — Plan 34-01's witness contract)
  - scripts/calibrate-jump-envelope.mjs (the copied server/guard/repositionAndSettle skeleton)
  - scripts/audit-phase21-mechanics.mjs (the copied SAVE seeding + select-grid navigation)
provides:
  - scripts/audit-coins.mjs — the in-engine coin witness replay gate (all 8 levels, pass/fail)
  - an OBSTRUCTION-AWARE coin model (solidBoxes + arcIsClear in scripts/lib/reachability.mjs)
  - the CORRECTED unreachable-coin work list for Plans 34-03 / 34-04 / 34-05 (13 coins, not 5)
affects:
  - scripts/validate-levels.mjs (behavior only — ZERO source edits; more HARD-FAIL rows flow through existing plumbing)
tech-stack:
  added: []
  patterns: [in-engine-witness-replay, deliberate-playwright-duplication, falsifiable-model, aabb-arc-obstruction, under-credit-invariant]
key-files:
  created:
    - scripts/audit-coins.mjs
  modified:
    - scripts/lib/reachability.mjs
decisions:
  - "The engine FALSIFIED the static model on 9 coins. The model was tightened; the gate was not loosened, no tolerance was widened, no coin was rubber-stamped."
  - "Obstruction = the player's real 16x32 AABB entering a floor/platform collider (build.js's exact rect geometry) at any sampled instant BEFORE the coin box. Barriers and spikes are deliberately still NOT obstructions — neither can make a coin permanently unreachable."
  - "The witness's launch node is excluded from its own obstruction test — a player never bonks the ledge they departed, and including it would falsely reject every `fall` witness."
  - "Trace-budget exhaustion counts as OBSTRUCTED, never as clear: the model's stated invariant is that it must only ever UNDER-credit."
  - "The takeoff-fraction search (midpoint, then endpoints/quartiles) rescues coins reachable by a clear line from the same ledge — proven correct by level-04 coins[9], where the blind model's blocked dir=+1 arc was replaced by a clear dir=-1 arc the engine then collected."
metrics:
  duration: ~55m
  completed: 2026-07-14
  tasks: 2
  files_changed: 2
  coins_total: 132
  witnesses_replayed: 119
  witnesses_confirmed_in_engine: 119
  model_hard_fails_skipped: 13
status: complete
---

# Phase 34 Plan 02: In-Engine Coin Witness Replay Gate Summary

Built `scripts/audit-coins.mjs` — a real-browser gate that replays every witness the static model emits against the running Kaplay engine and demands the real `onCollide("coin")` handler fire — pointed it at all 8 levels, **watched it falsify the model on 9 coins**, tightened the model until the engine agreed, and re-ran it GREEN: **119 witnesses replayed, 119 confirmed by a real driven player.**

## The headline: THE MODEL WAS FALSIFIED, AND THAT IS THE GATE WORKING

**Run 1 (against Plan 34-01's model): RED — exit 1, 9 offenders.**

```
coins=132 witnessed=127 collected=118 (incidental=2) model-HARD-FAIL-skipped=5
  OFFENDER level-01 coins[10] x:2280 y:264 — model PASS (family=jump dir=1) but the real engine did NOT collect it.
  OFFENDER level-02 coins[10] x:2840 y:264 — model PASS (family=jump dir=1) but the real engine did NOT collect it.
  OFFENDER level-02 coins[13] x:3560 y:264 — model PASS (family=jump dir=1) but the real engine did NOT collect it.
  OFFENDER level-03 coins[11] x:3440 y:264 — model PASS (family=jump dir=1) but the real engine did NOT collect it.
  OFFENDER level-03 coins[14] x:4200 y:264 — model PASS (family=jump dir=1) but the real engine did NOT collect it.
  OFFENDER level-04 coins[9]  x:2600 y:264 — model PASS (family=jump dir=1) but the real engine did NOT collect it.
  OFFENDER level-04 coins[12] x:4040 y:264 — model PASS (family=jump dir=1) but the real engine did NOT collect it.
  OFFENDER level-04 coins[15] x:4760 y:264 — model PASS (family=jump dir=1) but the real engine did NOT collect it.
  OFFENDER level-06 coins[4]  x:860  y:176 — model PASS (family=jump dir=1) but the real engine did NOT collect it.
AUDIT-COINS: FAIL
```

**The diagnosis was exactly the failure mode 34-01 predicted and named: obstruction blindness — ceiling bonk.** Every offender sits under (or *inside*) an overhanging platform's solid collider. Hand-checked against the real descriptors:

| Offender | The solid that blocks it | What actually happens in the engine |
|---|---|---|
| level-01 coins[10] (2280,264) | platform 2240..2368 @ y250 h24 (collider 250..274), coin floats in the gap 2240..2400 beneath it | the rising arc's head hits the underside at y274; the coin's touch band is never entered on the modelled line |
| level-06 coins[4] (860,176) | platform 840..952 @ y190 h24 — the coin is *embedded in* the platform's own collider (coin box 176..208 vs solid 190..214) | from below, the head bonks y214 and can never reach the ≤208 the box requires; the platform itself is not spawn-reachable (needs a 130px rise from the floor) |
| the other 7 (all y:264) | the same authored motif: a coin arced over a pit with a platform lip jutting over it | identical ceiling bonk |

The static model's parabola sails straight through those solid boxes because — by its own documented limitation 1 — it did not know they existed. **This is precisely the class of bug that let a sawtoothed floor, grey-static ground, and unreachable coins ship past nine green gates: a check that does not play the game.** The gate played the game.

## The fix: TIGHTEN THE MODEL (the only sanctioned direction)

`scripts/lib/reachability.mjs` gained an obstruction check. Nothing was loosened: the takeoff sweep stayed at its capped 5 offsets, the cleared-entity set stayed at its documented five tags, and not one coin was marked PASS by hand.

| Added | What it does |
|---|---|
| `solidBoxes(geometry)` | the EXACT collider geometry `src/levels/build.js` emits — floors as `rect(run.w, CONFIG.FLOOR_THICKNESS)` at `(run.x, FLOOR_Y)` (build.js:170), platforms as `rect(p.w, p.h)` at `(p.x, p.y)` (build.js:188). Ids match `buildNodes`' ids. |
| `arcIsClear(...)` | samples the candidate arc at 1/120s from t=0 to the collection instant (and at the exact instant, so a hit between grid steps cannot dodge it) and rejects it if the player's real 16x32 AABB ever enters a solid box first. |
| takeoff-fraction search | for `jump` witnesses, tries midpoint → endpoints → quartiles of the admissible takeoff interval, so an obstructed *centre line* does not condemn a coin a *clear line from the same ledge* can still collect. Midpoint-first means every unobstructed 34-01 witness keeps its original `takeoffX` byte-for-byte. |

Three deliberate boundaries, each chosen to keep the model UNDER-crediting:

1. **The launch node is excluded from its own obstruction test.** A player never bonks the ledge they departed — and including it would false-reject *every* `fall` witness (whose `x0` is pinned to the departure edge, so the descending body overlaps its own floor's x-span for the first few px).
2. **Trace-budget exhaustion counts as OBSTRUCTED, never as clear.** "We ran out of budget to prove this arc is clean" resolves to "then it is not a witness."
3. **Spikes and door/math-gate/enemy blockers are still NOT obstructions.** Neither can make a coin *permanently* unreachable (no lockout state, no game-over, free checkpoint respawn — `reachability.mjs`'s own established DESIGN NOTE). Modelling them would under-credit for zero safety gain.

**Case S** was added to the self-test suite and pins the fix **in both directions**, using the real falsified geometry (level-01's actual coins[10], its overhang, and a spawn-reachability chain guarded by its own assertion):

- **without** solids (the old blind model): a witness IS found → it over-credited. *(If this assertion ever stops holding, the fixture has gone stale and the case is vacuous — so it is asserted, not assumed.)*
- **with** solids (the tightened model): the witness is `null` → HARD-FAIL.

Delete the obstruction check and Case S fails immediately with `OBSTRUCTION CHECK BROKEN`.

**Run 2 (against the tightened model): GREEN — exit 0.**

```
[level-01] coins=16 driven=14 incidental=0 skipped=2 NOT-COLLECTED=0
[level-02] coins=15 driven=12 incidental=0 skipped=3 NOT-COLLECTED=0
[level-03] coins=17 driven=14 incidental=0 skipped=3 NOT-COLLECTED=0
[level-04] coins=19 driven=16 incidental=0 skipped=3 NOT-COLLECTED=0
[level-05] coins=15 driven=15 incidental=0 skipped=0 NOT-COLLECTED=0
[level-06] coins=15 driven=14 incidental=0 skipped=1 NOT-COLLECTED=0
[level-07] coins=17 driven=16 incidental=0 skipped=1 NOT-COLLECTED=0
[level-08] coins=18 driven=18 incidental=0 skipped=0 NOT-COLLECTED=0

coins=132 witnessed=119 collected=119 (incidental=0) model-HARD-FAIL-skipped=13
AUDIT-COINS: ALL WITNESSED COINS COLLECTED
```

**119 + 13 = 132.** Every shipped coin is accounted for. Zero coins were "collected" by accident of a stale scene (incidental=0 — every one of the 119 was collected by its own driven witness), and 118 of the 119 collected at takeoff offset 0 (the sweep was barely needed; it did not paper over anything).

### The model corrected itself, and the engine confirmed it — level-04 coins[9]

The most instructive row in the whole run. The blind model proposed a `dir=+1` arc into a platform underside; the engine refused it (Run 1 offender). The tightened model rejected that arc *and found a genuinely clear one from the other side*:

```json
{"launchNodeId":"floor-4","launchY":320,"takeoffX":2765.55,"dir":-1,"family":"jump","t":0.6125}
```

Run 2 then **collected it in the real engine at offset 0**. The coin was always reachable — just not by the line the blind model claimed. This is what a correctly tightened model looks like: it kills the false claim without killing the true coin. (It is also why the takeoff-fraction/bidirectional search matters: a cruder tightening would have needlessly condemned this coin to a move it does not need.)

## THE CORRECTED WORK LIST — 13 coins (34-01's 5 was itself an undercount)

**Plans 34-03 / 34-04 / 34-05 execute against THESE 13 coins.** 34-01's 5-coin list is superseded (it missed the 8 ceiling-bonked ones); 34-CONTEXT.md's 32-coin list remains superseded and is an upper bound only.

| Level | coins[i] | (x, y) | Why unreachable |
|---|---|---|---|
| level-01 | coins[10] | (2280, 264) | ceiling-bonk (platform 2240..2368 @ y250 overhangs it) |
| level-01 | coins[12] | (2600, 136) | 120px rise over a bare floor — beyond even the theoretical apex |
| level-02 | coins[10] | (2840, 264) | ceiling-bonk |
| level-02 | coins[12] | (3260, 136) | 120px rise over a bare floor |
| level-02 | coins[13] | (3560, 264) | ceiling-bonk |
| level-03 | coins[11] | (3440, 264) | ceiling-bonk |
| level-03 | coins[13] | (3900, 128) | 128px rise over a bare floor |
| level-03 | coins[14] | (4200, 264) | ceiling-bonk |
| level-04 | coins[12] | (4040, 264) | ceiling-bonk |
| level-04 | coins[14] | (4460, 136) | 120px rise over a bare floor |
| level-04 | coins[15] | (4760, 264) | ceiling-bonk |
| level-06 | coins[4]  | (860, 176) | embedded in platform 840..952 @ y190's own collider; that platform is not spawn-reachable either |
| level-07 | coins[2]  | (420, 128) | 128px rise over a bare floor |

Scope for Wave 3: levels **05 and 08 need zero coin moves**; level-06 needs one; levels 01/07 need two; levels 02/03/04 need three each.

**`validate-levels.mjs` is still RED (13 HARD-FAILs) — deliberately** (34-CONTEXT.md decision 4: RED-first). It returns green at the end of Plan 34-05, once all 13 coins have moved. Do NOT "fix" this red by weakening the coin check.

## What the gate does and does NOT prove (stated in the script's own header)

- **PROVES, positively:** each coin the static model PASSes is collected by a real player driven with real key input (ArrowLeft/ArrowRight/Space, keys *held* so `CONFIG.JUMP_CUT` never truncates the arc) in the real engine. The proof is that the coin disappears from `get("coin")` — and `destroy(c)` on a coin happens in exactly **one** place in the entire codebase: inside `player.onCollide("coin", ...)` in `src/scenes/game.js:183-187`. There is no other way to produce that signal.
- **PROVES NOTHING about coins the model HARD-FAILs.** Absence of a successful drive is not proof of unreachability — this gate replays ONE witness, it does not search the input space. Those 13 coins are SKIPPED and reported as `model: "HARD-FAIL"`. Proving the negative stays the static model's job.

**The bounded entity clearing (threat T-34-04).** Once per level, the gate destroys exactly five tag families — `door`, `math-gate`, `enemy` (the tall invisible blockers), `spike`, `goal` — and nothing else. Justification is `reachability.mjs`'s own established DESIGN NOTE: the math mechanics have no lockout state (a wrong answer just re-asks, per `challenge.js`'s close-on-success-only semantics), so a barrier is always eventually passable; a spike hit costs a free checkpoint respawn (there is no game-over anywhere in this game); the goal is a level-end trigger that freezes the player, not an obstacle. **Nothing removed can make a coin permanently unreachable** — the set only prevents a 1.3s scripted burst from being derailed by mechanics `audit-phase21-mechanics.mjs` already covers end to end. The set is closed: widening it to rescue a RED is forbidden.

## Deviations from Plan

**None in direction.** The plan's Task 2 explicitly anticipated both outcomes and prescribed the response to RED (diagnose → tighten the model in `reachability.mjs` → re-run the self-tests and the validator → the newly-rejected coins join the work list). That is exactly what happened, including the plan's own predicted natural fix ("an obstruction check on the candidate trajectory: reject a witness whose sampled arc drives the player's AABB into a platform/floor collider before it reaches the coin box").

One implementation choice worth recording, because it goes *beyond* the plan's literal text rather than short of it:

**[Rule 2 - Missing critical functionality] The takeoff-fraction search inside the tightened model.** A literal reading of the plan's fix ("reject a witness whose sampled arc …") applied only to the model's single midpoint takeoff would have condemned level-04 coins[9] — a coin that is genuinely, demonstrably collectable (the engine collected it, offset 0, once a clear line was proposed). Rejecting a reachable coin is a *safe* error under the model's under-credit invariant, but it would have sent Plan 34-03 to move a coin that does not need moving, on false evidence. The model now tries the midpoint first (preserving every unobstructed 34-01 witness exactly) and falls back to the interval's endpoints/quartiles. This tightens the model's *claims* while keeping its *coverage* honest.

## Verification

| # | Check | Result |
|---|-------|--------|
| 1 | `node --check scripts/audit-coins.mjs` | parses |
| 2 | `bash scripts/check-import-safety.sh` | PASS (a727c13 — the gate stays node-safe) |
| 3 | `node scripts/audit-coins.mjs` | **exit 0**, ends with `AUDIT-COINS: ALL WITNESSED COINS COLLECTED` |
| 4 | all 132 coins accounted for | 119 collected (driven) + 0 incidental + 13 skipped-HARD-FAIL = 132 |
| 5 | all 8 levels covered | one `[level-0N]` line per level, coins=16/15/17/19/15/15/17/18 |
| 6 | `node scripts/lib/reachability.mjs` | `reachability-selftest: PASS` (cases 1–4, A–R, **plus new Case S**) |
| 7 | Case S both-directions guard | blind model over-credits level-01 coins[10]; tightened model returns `null` |
| 8 | `git status --porcelain src/levels/` | **empty** — this plan still moves no coins |
| 9 | `node scripts/validate-levels.mjs` | 132 coin rows, 13 HARD-FAILs — RED **by design** (RED-first) |
| 10 | `check-safety.sh` / `check-gate.sh` / `check-assets-manifest.mjs` | PASS (unaffected — no `src/` changes) |
| 11 | `grep -c "const PORT = 8772"` | 1 (8765–8771 all taken; documented in the header) |
| 12 | `grep -c resolvePlaywright` | 3 (boilerplate copied by hand per the deliberate-duplication convention) |

**In-engine proof IS claimed here, and it is the whole point.** Unlike 34-01 (a static model), this plan's evidence is a real browser, the real vendored Kaplay engine, the real player entity, real key input, the real 32x32 coin `area()`, and the real `onCollide("coin")` handler — 119 times over.

## Known Stubs

None. No `src/` runtime code was touched.

## Threat Flags

None. In-repo script change only. The local server is loopback-bound with the CR-02 resolve+clamp path-traversal guard copied verbatim (T-34-06, T-34-07 as planned). T-34-04 (fake pass via entity clearing) and T-34-05 (false green via a wide sweep) are both mitigated as specified: the cleared-tag set stayed at five, the sweep stayed at five offsets, and neither was touched when the gate went RED — the model was.

## For the Next Plans (34-03 / 34-04 / 34-05)

- **The work list is the 13 coins in the table above**, not 34-01's 5 and not 34-CONTEXT.md's 32.
- Eight of the 13 are **ceiling-bonk** coins: they need to be moved *out from under* their overhang (or the overhang re-thought), not just lowered. Lowering a coin that sits inside a platform's own collider fixes nothing.
- After moving coins, run BOTH: `node scripts/validate-levels.mjs` (must reach zero HARD-FAILs) **and** `node scripts/audit-coins.mjs` (must print `AUDIT-COINS: ALL WITNESSED COINS COLLECTED`). The static gate alone is not sufficient — that is the lesson this plan just paid for.

## Self-Check: PASSED

- `scripts/audit-coins.mjs` — FOUND (created)
- `scripts/lib/reachability.mjs` — FOUND (modified)
- `.planning/phases/34-level-quality-pass/34-02-SUMMARY.md` — FOUND (this file)
- commit `85253d5` (gate) — FOUND
- commit `8fcd136` (model tightening) — FOUND
