# Level Design Rules — Nox Run

Authoring rules for `src/levels/level-0N.js` descriptors. Two tiers:

- **HARD** rules are enforced by `node scripts/validate-levels.mjs` (zero `HARD-FAIL` required) — breaking one ships an unplayable level.
- **SOFT** rules are calibrated targets distilled from the Phase 23 engine calibration and the Phase 24/25 authoring lessons — deviating needs a written reason in the level file.

Every number here is engine-measured or extracted from the 8 shipped levels — none are theory. If `CONFIG.RUN_SPEED / GRAVITY / JUMP_FORCE` is ever retuned, re-run `node scripts/calibrate-jump-envelope.mjs`, update `scripts/lib/jump-envelope.mjs`, and re-derive this doc's numbers.

## 1. The physics envelope (the numbers everything else derives from)

Frozen calibration (`scripts/lib/jump-envelope.mjs`, measured against the real engine 2026-07-05 at RUN_SPEED=240, GRAVITY=1400, JUMP_FORCE=520):

| Quantity | Measured | Design budget (5% margin shaved) |
|----------|----------|----------------------------------|
| Standing-jump rise | min 92.98px | **maxRise 88.331px** |
| Running-jump flat reach | min 170.50px | **~162px** (runSpeed 218.043 px/s × tFlat 0.7429s) |

- **HARD:** never require a single hop rising more than 88px, or a bare required gap wider than ~162px — the validator's Δy-aware BFS will HARD-FAIL it.
- Do NOT design against the closed-form numbers (96.57px rise / 178.29px reach) — they over-credit the player; Phase 22 proved they produce unreachable "reachable" placements.

## 2. Floors and gaps

Floors are `{ x, w }` runs pinned to `FLOOR_Y` (320). Everything snaps to the 16px tile grid.

- **SOFT:** standard gap widths are **120 / 140 / 160px** (the only values in all 8 shipped levels). 120 is easy, 160 is the comfortable maximum for a bare running jump.
- **HARD:** a gap wider than 160px must be bridged by a platform (level-04's 200px gaps all carry one).
- **HARD (over-hole rule):** never place a door / mathGate / enemy over a gap — its full-height blocker collider must stand on solid floor, or the player gets stuck against a barrier they can't ground in front of. This was a real shipped bug class (3 instances fixed in Phase 24).

## 3. Platforms (raised ledges)

- **SOFT rise per tier: 60–75px.** Use 65–75px when the landing span is wide (≥80px); drop to ~60px when the x-overlap window is narrow (~40px) — the wider rise makes the touch window too tight (24-RESEARCH physics caveat, applied in 24-03).
- **Verticality climbs (level-07/08 style): author as PLATFORMS, never floors** (floors are pinned to FLOOR_Y in build.js). Consecutive tiers need **~70px x-overlap** so the rising-jump trajectory root lands inside the window — 20–30px overlap produced false spawn-goal HARD-FAILs on both level-07 and level-08 (25-03).
- **Don't add stepping stones inside an independently-jumpable gap.** A platform at jump-arc height intercepts a real player's held running jump mid-flight even when the validator reads the gap as fine (25-07 finding: three such platforms removed from level-07).
- **Keep platform undersides out of spike-hop arcs.** A decorative low platform above a spike creates a ceiling-bonk that kills the hop (25-07 finding: three platforms raised in levels 03/04/06).

## 4. Math barriers (doors, mathGates, enemies)

The builder gives every barrier an invisible full-height blocker (jump apex + 64px) — they cannot be jumped over, so their spacing IS the level's question pacing.

- **SOFT spacing between consecutive barriers: 300–750px** (the shipped norm). Closer than ~300px reads as a wall of interruptions — the only shipped exception is the deliberate 72px door+gate set-piece pair (levels 01/04); if you author one, make it intentional and rare.
- Long barrier-free stretches (>1000px) are fine as breathers, but they exist today mostly on the Phase-24 extensions — flag them for the pending level review rather than copying the pattern.
- **HARD (mechanic reachability):** every door/mathGate/enemy must be reachable from spawn per the validator, and the interactive audit must show `triggered: true` for every encounter.

## 5. Checkpoints

Policy: a respawn never costs meaningful progress (ADHD-safe, no-game-over).

- **HARD:** one checkpoint near spawn, one just before EVERY spike/hazard cluster.
- **SOFT:** keep ≤700px between checkpoints on hazard-bearing stretches (shipped norm is 150–700px). Known outlier to revisit in the level review: level-04 has a 1360px checkpoint gap on its extension.

## 6. Secret alcove (LVL-06)

Exactly one per level: a 24×24 (`CONFIG.ALCOVE_SIZE`) invisible walk-through trigger.

- Place it **~70px above an early/mid-level platform** as one extra optional hop — off the required path, never signposted, never gating (the shipped pattern across all 8 levels).
- It must cost nothing to skip: never between the player and a required barrier or the goal.
- The validator (`node scripts/validate-levels.mjs`) checks alcove point-reachability via its `secret-alcove-reachability` row, and the interactive audit (`node scripts/audit-phase21-mechanics.mjs`) verifies real discovery via the entity-destroy/XP-delta signal (MECH-04) — both are live, automated coverage as of Phase 30. Playing with `?debug=1` (renders alcoves as magenta markers) remains a valid supplementary manual-eyeball step, just no longer the only verification path.

## 7. Camera bounds

- level-01 derives its right edge from geometry; **level-02+ carry an explicit `bounds` field used AS-IS — bump `bounds.right` by hand when extending**, or the camera clamps short of the new goal.
- Keep all play space within y 0–360: the fall-respawn line is the GLOBAL `LEVEL_BOTTOM(360) + FALL_MARGIN(120)` (see game.js note), not per-level bounds.

## 8. Workflow (non-negotiable)

1. Author **pure data only** in `level-0N.js`; content never touches `build.js`.
2. Extend kid-validated levels by **appending after** existing geometry — never edit inside it.
3. Gate every edit: `node scripts/validate-levels.mjs` (zero HARD-FAIL) → `node scripts/browser-boot.mjs` → `node scripts/audit-phase21-mechanics.mjs` (every encounter `triggered: true`; `resolved: false` rows are known headless-timing flakiness, not acceptance failures).
4. Eyeball placements with `?debug=1` (colliders, blockers, zones, checkpoints, alcoves all render).

## Pending: review of shipped levels

The 8 current levels predate this doc. A dedicated review pass against these rules is captured in `.planning/todos/pending/2026-07-07-review-levels-against-level-design-rules.md` (known candidates: level-04's 1360px checkpoint gap, level-02's 2220px barrier-free stretch, whether the 72px paired barriers still feel deliberate).
