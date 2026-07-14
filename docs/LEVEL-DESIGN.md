# Level Design Rules — Nox Run

Authoring rules for `src/levels/level-0N.js` descriptors. Two tiers:

- **HARD** rules are enforced by a gate (`node scripts/validate-levels.mjs`, zero `HARD-FAIL` required; plus the in-engine gates in section 8) — breaking one ships an unplayable, unfair, or physically cramped level.
- **SOFT** rules are calibrated targets distilled from the Phase 23 engine calibration and the Phase 24/25/34 authoring lessons — deviating needs a written reason in the level file.

Every number here is engine-measured or extracted from the shipped levels — none are theory. If `CONFIG.RUN_SPEED / GRAVITY / JUMP_FORCE` is ever retuned, re-run `node scripts/calibrate-jump-envelope.mjs`, update `scripts/lib/jump-envelope.mjs`, and re-derive this doc's numbers.

> **A HARD rule that is not enforced by a gate is not a rule.** This doc quantified rise, gap and x-overlap for four milestones while every tier of level-07 shipped with **9px** of headroom — a 32px player in a 41px slot — because there was no headroom rule and no gate that looked. A human found it at a checkpoint, not a green suite. Every HARD rule below names the gate that enforces it. If you add a HARD rule here, add its check in the same commit.

---

## 1. The physics envelope (the numbers everything else derives from)

Frozen calibration (`scripts/lib/jump-envelope.mjs`, measured against the real engine 2026-07-05 at RUN_SPEED=240, GRAVITY=1400, JUMP_FORCE=520):

| Quantity | Measured | Design budget (5% margin shaved) |
|----------|----------|----------------------------------|
| Standing-jump rise | min 92.98px | **maxRise 88.331px** |
| Running-jump flat reach | min 170.50px | **~162px** (runSpeed 218.043 px/s × tFlat 0.7429s) |

- **HARD:** never require a single hop rising more than **88.331px** (`JUMP_ENVELOPE.maxRise`), or a bare required gap wider than ~162px — the validator's Δy-aware BFS will HARD-FAIL it.
- Do NOT design against the closed-form numbers (96.57px rise / 178.29px reach). They over-credit the player: Phase 22 proved they produce unreachable "reachable" placements, and the 88.3–96.6px dead band is exactly where a scripted frame-perfect jump succeeds and a 12-year-old never does.
- The player collider is **16×32**, locked (`src/player.js`), independent of the animation frame. Every clearance number below is derived from that 32px height.

## 2. Floors and gaps

Floors are `{ x, w }` runs pinned to `FLOOR_Y` (320). Floors and gaps snap to the 16px tile grid. (Platform tier `y` deliberately does NOT — see section 3's grid trap.)

- **SOFT:** standard gap widths are **120 / 140 / 160px**. 120 is easy, 160 is the comfortable maximum for a bare running jump.
- **HARD:** a gap wider than 160px must be bridged by a platform (level-04's 200px gaps all carry one).
- **HARD (over-hole rule):** never place a door / mathGate / enemy over a gap — its full-height blocker collider must stand on solid floor, or the player gets stuck against a barrier they cannot ground in front of. Real shipped bug class (3 instances fixed in Phase 24). *Gate: `over-hole` rows in `validate-levels.mjs`.*

## 3. Platforms (raised ledges)

### 3.1 Thickness — 16px, WYSIWYG (HARD)

**A platform is 16px thick, and its visual is its collider.** (`h: 16`.)

Until Phase 34 the platform's *collider* was `p.h` (16–24px) while its *visual* was a **48px slab** — `build.js` drew a 32px cap at `y` plus a 32px fill starting at `y+16`. Measured empirically: **48.7px of drawn slab over a 16px collider.** So on level-08's 75px-rise climb the physics said 27px of headroom and the eye said **−5px**: the player's head was rendered *inside* the ledge above her. Fixed by atlas frame 2 (section 9) — a platform now draws as a 16px ledge that exactly matches its collider. Measured after: **16.0px**.

Floors keep their cap + deep fill and stay visually solid — this rule is about raised ledges only.

*Gate: `check-terrain-atlas.sh`'s SLAB check hard-fails if the platform frame's transparent bottom half ever fills back in.*

### 3.2 Headroom — ≥ 24px (HARD)

For **any two platforms that overlap in x** (an upper tier forming a ceiling over a lower walk):

```
headroom = (lower surface y) − (upper platform y + upper platform h) − 32   ≥ 24px
```

The 32 is the player's height. With the mandated 16px thickness this simplifies to:

```
rise − 48 ≥ 24     ⇒     rise ≥ 72px  for any overlapping tier pair
```

24px is the minimum clearance in which a 32px player does not read as wedged. Below it the climb feels like a crawlspace, and at 9px her head is drawn inside the ceiling.

**Why this rule exists:** level-07 ships **9px** on *every* tier of its end climb (65px rise, `h:24`), and level-08's first switchback draft had 9–14px. Neither was caught by any gate — this doc had rise, gap and overlap rules but no headroom rule at all. A human found it at a checkpoint.

*Gate: `headroom` rows in `validate-levels.mjs` (`scripts/lib/reachability.mjs`). It measures the ACTUAL `p.h`, not an assumed 16 — a fat platform fails on headroom even before the thickness rule bites.*

### 3.3 Rise bands

| Situation | Rise per tier |
|---|---|
| **Overlapping tiers** (an upper tier forms a ceiling over the lower walk) | **72–75px** — pinned between the 72px headroom floor (3.2) and the 75px comfort ceiling |
| **Non-overlapping tiers** (open air above; no ceiling) | **60–70px** — the gentler band |
| **HARD ceiling, always** | **never exceed 88.331px** (`JUMP_ENVELOPE.maxRise`) |

- **SOFT:** use the top of the band when the landing span is wide (≥80px); drop toward the bottom when the x-overlap window is narrow (~40px) — a wider rise makes the touch window too tight (24-RESEARCH physics caveat, applied in 24-03).
- Do NOT design against the closed-form 96.57px apex. See section 1.

### 3.4 The grid-snapping trap (READ THIS)

**Do NOT snap a climb tier's `y` to the 16px grid.** Floors and gaps snap; climb tiers deliberately do not. Snapping forces rise to a multiple of 16, and both neighbours of the 72–75px band are wrong:

- **64px rise** → headroom `64 − 48 = 16px`. Too cramped; fails 3.2.
- **80px rise** → 90% of her *maximum measured jump*, on **every single tier**. Too punishing for a 12-year-old, and a level that demands a near-max jump repeatedly is precision pressure this project forbids.

72–75px is not on the grid, and that is intentional. Author tier `y` at whatever value lands the rise in the band.

### 3.5 Verticality climbs, overlap, and arc hygiene

- **Verticality climbs (level-07/08 style): author as PLATFORMS, never floors** (floors are pinned to `FLOOR_Y` in `build.js`).
- **x-overlap between consecutive climb tiers: ~70px.** The rising-jump trajectory root must land inside the window — 20–30px of overlap produced false spawn-goal HARD-FAILs on both level-07 and level-08 (25-03).
- **Don't add stepping stones inside an independently-jumpable gap.** A platform at jump-arc height intercepts a real player's held running jump mid-flight even when the validator reads the gap as fine (25-07: three such platforms removed from level-07).
- **Keep platform undersides out of spike-hop arcs** — a decorative low platform above a spike creates a ceiling-bonk that kills the hop (25-07: three platforms raised in levels 03/04/06). Same physics as 3.2's headroom, applied to a hop rather than a walk.

## 3b. Coins (LVL-01) — HARD: every coin must be collectable

**HARD (coin reachability):** every coin in `geometry.coins` must be collectable. Two gates, both required:

1. `node scripts/validate-levels.mjs` — the `coin-reachability` row (static model).
2. `node scripts/audit-coins.mjs` — the in-engine witness replay: a **real driven player**, real key input, the real `onCollide("coin")` handler.

**A coin is a BOX you fly through, not a POINT you land on.** This distinction is why 32 unreachable coins survived four milestones and every green gate:

- `build.js` gives a coin a 32×32 `area()`. The player is 16×32. The Minkowski sum — the set of player top-left positions at which the coin is collected — is a **48×64 box**, not a zero-width point.
- The coin is collected **mid-arc**, in flight. The player only has to *pass through* that box, from any direction, at any speed.
- Probing coins through the **secret-alcove point model** (identical `{x, y}` shape, and the mistake that produced the original 32-coin figure) asks a *landing* question where the game only asks a *fly-through* question. It systematically **over-reports** unreachable coins. Do not reuse the alcove model for coins.

Authoring guidance:

- Walking height over a surface is roughly `surfaceY − 56` (the player's top-left y is `surfaceY − 32`; the coin's box extends 32px below its `y`). A coin near that height is collected by simply **walking through it** — no jump at all.
- An arc coin must sit within `maxRise` (88.331px) of the highest reachable surface beneath it, or no jump touches it at any x.
- The static model is **obstruction-aware** (`arcIsClear`, Phase 34-02): a candidate arc that drives the player's 16×32 body into a platform/floor collider before it reaches the coin is rejected — the ceiling-bonk class of section 3.5, which is how nine "reachable" coins were falsified by the real engine. It deliberately ignores spikes and door/gate/enemy blockers (none can make a coin *permanently* unreachable — no lockout state, no game-over, free respawn).
- The model only ever **under-credits** by design (it clamps rise to the empirical `maxRise` and omits the cut-jump family). If a coin is doubtful, it is unreachable. `audit-coins.mjs` is the arbiter.

## 4. Math barriers (doors, mathGates, enemies)

The builder gives every barrier an invisible full-height blocker (jump apex + 64px) — they cannot be jumped over, so their spacing IS the level's question pacing.

**Density is LOCKED at 1 door + 1 enemy + the end gate per level** (binding for Phases 34–38). A pacing deviation is never fixed by adding or removing a barrier.

- **SOFT spacing between consecutive barriers: 300–750px.** Closer than ~300px reads as a wall of interruptions — the only shipped exception is the deliberate 72px door+gate set-piece pair (levels 01/04); if you author one, make it intentional and rare.
- Long barrier-free stretches (>1000px) are fine as breathers.
- **HARD (mechanic reachability):** every door/mathGate/enemy must be reachable from spawn per the validator, and the interactive audit must show `triggered: true` for every encounter.

## 5. Checkpoints

Policy: a respawn never costs meaningful progress (ADHD-safe, no-game-over).

- **HARD:** one checkpoint near spawn, one just before EVERY spike/hazard cluster.
- **HARD:** one checkpoint before EVERY mover (see section 6b).
- **SOFT:** keep ≤700px between checkpoints on hazard-bearing stretches (shipped norm is 150–700px).

## 6. Secret alcove (LVL-06)

Exactly one per level: a 24×24 (`CONFIG.ALCOVE_SIZE`) invisible walk-through trigger.

- Place it **~70px above an early/mid-level platform** as one extra optional hop — off the required path, never signposted, never gating (the shipped pattern across all 8 levels).
- It must cost nothing to skip: never between the player and a required barrier or the goal.
- The validator checks alcove point-reachability via its `secret-alcove-reachability` row, and `node scripts/audit-phase21-mechanics.mjs` verifies real discovery via the entity-destroy/XP-delta signal (MECH-04). Playing with `?debug=1` (renders alcoves as magenta markers) remains a valid supplementary eyeball step.
- The alcove's model is a **landing** question about a zero-width point. That is correct for an alcove and **wrong for a coin** — see section 3b.

## 6a. Movers (`geometry.movers`) — the model

No shipped level authors `geometry.movers` yet (**Phase 36 places the first one**), but the static validator already carries a `mover-reachability` check (`scripts/lib/reachability.mjs`, MOT-04) ready for it.

- The check models a mover as two ping-pong endpoints and tests both independently via **worst-case-extreme** reachability — the player may arrive exactly when the mover is parked at its least helpful endpoint, so BOTH endpoints must be independently reachable. It reports the tighter (higher marginRatio) of the two; if either endpoint is flatly unreachable, the mover HARD-FAILs.
- **Known limitation of the STATIC check — rightward-travel-only.** `bestMarginToPoint` (the shared point model behind both the alcove and mover checks) skips any launch node whose span sits *after* the target's x (`if (point.x < n.xStart) continue`). So a mover endpoint reachable only by walking **left** from a later point in the level HARD-FAILs this check even if it is genuinely reachable in play. Until that is lifted: place both ping-pong endpoints so each is reachable by walking/jumping rightward from spawn along the level's normal forward path.
- This limitation is **specific to the static validator**, and is not the same thing as the browser driver's own rightward-only limitation. The in-engine harness (`scripts/browser-boot.mjs` + `scripts/lib/route-planner.mjs`) could originally only *drive* rightward, which is why level-08's switchback climb read as a stall; that is being fixed in its own Phase-34 harness plan. **Check what the code actually does before you trust either caveat** — they have different lifetimes and different owners.

## 6b. Motion design rules (HARD — read before authoring ANY mover, Phase 36+)

**These rules exist BEFORE the first mover exists.** Phase 36 is the first phase permitted to place one, and it inherits rules rather than a blank page — deliberately, because a motion rulebook written after the fact is a rationalization, not a rule.

**1. A checkpoint before every mover (HARD).** A moving platform or patrol section must sit behind a checkpoint, so a mistimed jump costs at most the approach, never real progress. This is section 5's respawn policy extended to motion.

**2. A missed moving platform means WAIT, never death (HARD).** If the player misses a mover, the level must leave them somewhere they can simply **wait for it to come back** — a ledge, a safe floor below, the previous tier. Never a pit that kills. Never a state they cannot recover from without a respawn. Movers ping-pong; the player must be able to ping-pong with them. There is no game-over anywhere in this game, and a mover must not become the first one. **No killing pits under movers.**

**3. Patrollers carry ZERO hurt wiring (HARD).** A patrolling enemy is cosmetic and/or blocking — **never damaging**. No damage, no health, no lives, no score penalty, no failure construct of any kind. Stationary math-blocker enemies keep their existing role and must stay visually distinct from patrollers.

**4. Movers are dt-based and telegraphed (HARD).** Motion is driven by `onUpdate` + `dt()`, never by a scheduler. `setTimeout`, `setInterval`, `wait()`, `loop()` and `lifespan()` are banned anywhere in `src/` — delayed effects use the `tween().onEnd()` self-clean idiom. A mover's path must be *readable before you commit to it*: its travel must be visible from the ledge you jump from. A mover you cannot see the far end of is a timing gamble, and timing gambles are pressure.

*Gates: `bash scripts/check-safety.sh` (SAFE-01 — the no-timer / no-punishment scan over the whole of `src/`) enforces rules 3 and 4 at the code level; rules 1 and 2 are authoring-side and are gated by the checkpoint rules in section 5 plus the `mover-reachability` row in `validate-levels.mjs`.* These four rules are the authoring-side statement of the same invariant `check-safety.sh` enforces — you should be able to obey them without ever reading the shell gate.

## 7. Camera bounds

- level-01 derives its right edge from geometry; **level-02+ carry an explicit `bounds` field used AS-IS — bump `bounds.right` by hand when extending**, or the camera clamps short of the new goal.
- Keep all play space within y 0–360 for floors; a climb may go negative (level-08's summit sits at y −125). The fall-respawn line is the GLOBAL `LEVEL_BOTTOM(360) + FALL_MARGIN(120)` (see `game.js`), not per-level bounds.

## 8. Difficulty ramp (agreed, Phase 34)

**The rules above stay constant across all 8 levels. What ramps is each level's USE of the band.**

| Levels | Gaps | Rises | Ceilings (overlapping tiers) |
|---|---|---|---|
| **L1–2** | 120px | gentle **60–70px** | **NONE.** No overlapping tiers at all — open air above every platform. |
| **L3–6** | 140–160px | mixed 60–75px | ceilings start appearing |
| **L7–8** | 160px | tight **72–75px** climbs | real ceilings, at the 24px headroom floor |

- **L1–2's "no ceilings at all" is the lever that makes level-01 a soft landing for a 12-year-old.** It is not an accident of the early levels being simple — it is the rule.
- **L7 and L8 must stay mechanically different (LVL-02):** level-07 is a **monotonic staircase**; level-08 keeps a **switchback** (a leftward-rising reversal, widths growing toward a wide summit balcony). They may not converge into the same climb again.

## 9. Workflow (non-negotiable)

1. Author **pure data only** in `level-0N.js`; content never touches `build.js`.
2. Gate every level edit — the full suite, in one run:
   ```
   bash scripts/check-gate.sh && bash scripts/check-safety.sh && bash scripts/check-import-safety.sh \
     && bash scripts/check-progress.sh && bash scripts/check-terrain-atlas.sh && bash scripts/check-pink-gate.sh \
     && node scripts/check-assets-manifest.mjs && node scripts/validate-levels.mjs \
     && node scripts/audit-coins.mjs && node scripts/browser-boot.mjs && node scripts/audit-phase21-mechanics.mjs
   ```
   `validate-levels.mjs` (zero HARD-FAIL) and `audit-coins.mjs` (every coin collected by a real driven player) are the two that speak directly to this doc's HARD rules. `audit-phase21-mechanics.mjs` always exits 0 by design — **read its output**, not its exit code: every door/enemy encounter must show `triggered: true` (`resolved: false` rows are known headless-timing flakiness).
3. Eyeball placements with `?debug=1` (colliders, blockers, zones, checkpoints, alcoves all render).
4. **Verification standard: no level change closes on a static check alone. Checks that don't play the game lie.** The full suite was green while this game shipped a sawtoothed floor, achromatic-grey ground, 32 unreachable coins, and 9px of headroom on every tier of level-07. A green suite is necessary and never sufficient — a human plays it, or it is not verified.

### 9.1 "Extend kid-validated levels by appending, never edit inside" — SUSPENDED for Phase 34.5

The standing convention (still the default, and still recorded in `CLAUDE.md`) is: levels 01–03 are kid-validated, so extend them by **appending after** existing geometry and never edit inside it.

**That convention is DELIBERATELY SUSPENDED for Phase 34.5**, at the user's explicit instruction: 34.5 rebuilds **every level from scratch** against this rulebook and doubles the level count. Appending is not available to a rebuild.

**State the cost plainly:** levels 01–03's kid sign-off **no longer covers them**. The geometry she approved will not be the geometry that ships. Phase 38's kid-UAT is therefore a **real re-approval**, not a regression check — it is the only sign-off the rebuilt levels will have, and it cannot be treated as a formality.

After 34.5 lands and Phase 38 re-approves, the append-only convention resumes.

## 10. Biome atlas frames (ART-01)

Every baked biome terrain atlas (`assets/tiles/atlas-{swamp,town,cemetery,castle}.png`, baked by `scripts/build-art-assets.py::_bake_biome_atlas`) is a **48×32 sheet of THREE 16×32 frames** on the locked `CONFIG.TILE_SIZE = 16` grid:

| Frame | Name | What it is | Where `build.js` draws it |
|---|---|---|---|
| **0** | `CAP_FRAME` | the walkable ground surface cell over its body — a native 16×32 window (two real 16px source cells), 1:1 pixels, **never scaled** | one stamp per 16px column across every **floor** run, at the run's `y`, drawn 32px tall |
| **1** | `FILL_FRAME` | the same block's body below the surface — the underground mass | tiled beneath every floor run to `FLOOR_FILL_DEPTH_PX` (64px) |
| **2** | `PLATFORM_FRAME` | **the cap's own TOP 16×16 cell, top-anchored in an otherwise fully-transparent 16×32 frame** | one row across every **raised platform**, drawn at the same 32px frame height — so it renders as a **16px ledge with nothing below it** (the WYSIWYG fix, section 3.1) |

Three properties of this bake are load-bearing:

- **Frame 2 is DERIVED from `cap_rect`, not a fourth hardcoded rect.** Re-pointing a biome's cap cannot desync its platform frame.
- **Frame 2's transparent bottom half is the whole fix.** If it ever fills back in, the platform silently returns to a 48px slab and eats the headroom of section 3.2. `check-terrain-atlas.sh`'s SLAB check exists solely to hard-fail that.
- **ZERO scaling and NO palette remap, anywhere in this bake.** Both crops are taken at the source tileset's native resolution. Squashing an 80px-wide ground island into a 16px cell is what turned the old ground into "a placeholder grey area that the player walks on"; `_remap_luminance` collapsing hue onto an achromatic ramp is what kept it grey. Both bugs are removed. Never "fit" art into a cell.

**Cap crops, as they actually ship** (verified against `build-art-assets.py`, 2026-07-14):

| Biome | Source crop | What the cap actually is |
|---|---|---|
| Swamp | `cap_rect=(64, 5, 80, 37)` | An interior column of the 80×59 mossy-rock ground island — mossy top surface over dirt. Repeats seamlessly. 0% dominant-pink, no retint. |
| Town | `cap_rect=(328, 137, 344, 169)` | The **cobbled ground block** — a flat top edge that tiles cleanly. **This replaced a ROOF TRIANGLE** (the sheet's largest island, picked by `islands()[0]`, which is only the ground block for swamp): stamped every 16px it tiled into a repeating sawtooth across every town floor. Retinted `hue_shift_band(215, 255, -60)` — the sheet is ~33% dominant-pink. |
| Cemetery | `cap_rect=(80, 55, 96, 87)` | Grass blades over a skull/dirt surface, opened at the island's real grass line (y=55), **not** its bbox top (39px of empty air). Deliberately cropped off the tombstone-shadow region to stay pink-gate clean. No retint. |
| Castle | `cap_rect=(664, 154, 680, 186)` | The gold surface lip over stone of a gold-lipped column — a flat, fully-opaque top edge. **This replaced an ARCH PEAK**, whose notched silhouette tiled into the same sawtooth as town's roof. The fill comes from the same column BELOW the lip (plain stone), because the original fill was another gold-*capped* brick that repeated bright gold lips down through the underground mass. |

> The old version of this section documented a **two**-frame atlas and measured "lip offsets" against caps that were a roof triangle and an arch peak. Both of those crops are gone, and both were bugs. There is no lip-offset convention any more: **the cap's top row IS the walkable surface**, for every biome, by construction — that is what `_bake_biome_atlas` asserts and what the sawtooth fix bought.

**Collider-vs-sprite rule:** the collider is derived from level geometry alone (`FLOOR_Y` / platform `y` + `p.h`), never from the sprite. For **floors** the sprite is deeper than the collider on purpose (the fill is decorative underground mass). For **platforms** the sprite and the collider are now the same 16px — and section 3.2's headroom rule depends on that staying true. No automated gate but `check-terrain-atlas.sh` looks at rendered pixels; every other gate in this project was green while the ground was grey static and sawtoothed (`.planning/research/ART-PARITY-STEERING.md`).

## 11. Level review

The 8 shipped levels were reviewed against this rulebook in Phase 34 (Plan 34-06). The result is **`docs/LEVEL-REVIEW.md`** — read it as the **input to Phase 34.5's rebuild**, not as a to-do list of patches. Every level is being rebuilt; the review records what each one gets wrong so the rebuild does not repeat it.
