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

## 6a. Movers (`geometry.movers`) — preview ahead of Phase 36

No shipped level authors `geometry.movers` yet (Phase 36 places the first one), but the static validator (`node scripts/validate-levels.mjs`) already carries a `mover-reachability` check (`scripts/lib/reachability.mjs`, MOT-04) ready for it. Read this before authoring the first mover:

- The check models a mover as two ping-pong endpoints and tests both independently via **worst-case-extreme** reachability — the player may arrive exactly when the mover is parked at its least helpful endpoint, so BOTH endpoints must be independently reachable, and the check reports the tighter/harder (higher marginRatio) of the two.
- **HARD constraint — rightward-travel-only model:** each endpoint is only recognized as reachable via a hop launched from some already-reachable node whose own span sits **at or before** that endpoint's x position (the same rightward-only simplification `bestMarginToPoint` already applies to `secretAlcove` reachability). A mover endpoint reachable only by walking **left** from a later point in the level (e.g. after a required backtrack, or a mover parked behind a checkpoint) will HARD-FAIL this validator even if it is genuinely reachable in actual play.
- Practical guidance: place both ping-pong endpoints so each is reachable by walking/jumping rightward from spawn along the level's normal forward path — do not park a mover endpoint behind a backtrack until this rightward-only limitation is lifted.

## 7. Camera bounds

- level-01 derives its right edge from geometry; **level-02+ carry an explicit `bounds` field used AS-IS — bump `bounds.right` by hand when extending**, or the camera clamps short of the new goal.
- Keep all play space within y 0–360: the fall-respawn line is the GLOBAL `LEVEL_BOTTOM(360) + FALL_MARGIN(120)` (see game.js note), not per-level bounds.

## 8. Workflow (non-negotiable)

1. Author **pure data only** in `level-0N.js`; content never touches `build.js`.
2. Extend kid-validated levels by **appending after** existing geometry — never edit inside it.
3. Gate every edit: `node scripts/validate-levels.mjs` (zero HARD-FAIL) → `node scripts/browser-boot.mjs` → `node scripts/audit-phase21-mechanics.mjs` (every encounter `triggered: true`; `resolved: false` rows are known headless-timing flakiness, not acceptance failures).
4. Eyeball placements with `?debug=1` (colliders, blockers, zones, checkpoints, alcoves all render).

## 9. Biome atlas anchor/lip convention (ART-01)

Every baked biome terrain atlas (`assets/tiles/atlas-{swamp,town,cemetery,castle}.png`, Plan 31-04) is a 32x32 sheet of two 16x32 frames (cap, then fill), matching the locked `CONFIG.TILE_SIZE = 16` grid (`src/config.js`) and the player's own locked 16x32 collider (see Section 1's physics envelope, unchanged here). A single 16x32 cap-tile sprite is meant to visually read as "one tile of solid ground with a decorative lip" — grass/rock/roof/gold-trim detail up top, load-bearing body below — without needing a separate lip-only sprite layer.

**Measured lip offset per biome** (pixel-scanned from the real baked cap frame — the first 16x32 half of each `atlas-<biome>.png` — not from SPIKE-FINDINGS.md's exploratory "~20-24px" estimate, which does NOT hold across these actual crops):

| Biome | Lip offset (px, from top of the 32px-tall cap frame) | What the scan found |
|-------|-------------------------------------------------------|----------------------|
| Swamp | **~4px** | Rows 0-1 fully transparent, rows 2-3 a jagged partial-width grass-tuft edge, row 4 onward fully opaque (16/16 px) clear through to the tile's bottom edge — the shallow, clean case this convention was designed around. |
| Town | **~26px** | This crop is a full sloped-roof silhouette, not a shallow surface lip — opaque pixel count grows row-by-row from row 0 and only reaches full 16px width at row 26; rows 26-31 are the "solid ground" (wall) below the roofline. Treat Town's lip as unusually deep because the crop itself IS the decorative roof cap, not a thin trim on top of a wall block. |
| Cemetery | **does not fit the model — flagged, not averaged away** | The cap frame is only opaque in a middle band, rows 10-19 (a floating grass-tuft/mound shape), with BOTH rows 0-9 and rows 20-31 fully transparent. This crop was deliberately chosen off the tombstone-shadow region to stay pink-gate clean (31-04-SUMMARY.md), and the tradeoff is that it does not extend to the tile's bottom edge like the other three biomes. **Phase 32 follow-up:** do not composite this cap frame directly against a solid-ground line — either re-anchor it to the tile's bottom edge before use, or treat it as a decorative overlay drawn on top of the `fill` frame (the atlas's second 16x32 frame), which is itself the actual load-bearing tile for Cemetery. |
| Castle | **~0px by alpha, but the cap's visual highlight sits at the BOTTOM, not the top** | The cap frame is 100% opaque from row 0 straight through row 30 (no transparent decorative top at all) — but a row-luminance scan shows the crop's distinctive bright gold-trim highlight is concentrated in rows 27-31 (luminance jumps from ~11 to ~88), i.e. at the tile's BOTTOM edge, not its top. The native source crop is a vertical brick-pillar segment with a gold baseboard/plinth trim at its base, not a top-of-tile overhang. **Phase 32 follow-up:** if this frame is used as a ground cap, its decorative trim reads as an inverted lip (bottom-anchored, not top-anchored) — do not assume the "decorative-top / solid-ground-below" convention holds for Castle's cap frame without re-checking orientation first.

**Collider-vs-sprite warning (read before Phase 32 wires the autotile renderer):** the SPRITE artwork's decorative lip (top OR bottom, per the table above) must never be confused with the COLLIDER, which stays exactly at the tile's solid-ground line (`FLOOR_Y` / platform `y`, Section 2 above) — the lip is purely a rendering offset, never a physics offset. This is what lets downstream integration prove sprites don't lie about solid ground: the collider's y-position is derived from level geometry alone, unaffected by how many decorative pixels a given biome's cap sprite spends on its lip.

## Pending: review of shipped levels

The 8 current levels predate this doc. A dedicated review pass against these rules is captured in `.planning/todos/pending/2026-07-07-review-levels-against-level-design-rules.md` (known candidates: level-04's 1360px checkpoint gap, level-02's 2220px barrier-free stretch, whether the 72px paired barriers still feel deliberate).
