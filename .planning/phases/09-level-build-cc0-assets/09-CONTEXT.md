# Phase 9: Level Build & CC0 Assets - Context

**Gathered:** 2026-06-24
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous)

<domain>
## Phase Boundary

This phase replaces the Phase 8 test strip with **one complete, polished, playable level**
built from a real CC0 dark/grunge pixel-art pack. The player traverses start → goal over
platforms, gaps, and solid ground (reusing the Phase 8 movement/camera/respawn spine),
collects coins, survives a gentle hazard that triggers checkpoint respawn (never game-over),
and reaches a goal flag that fires the hook the Phase 10 math gate will attach to. Every
asset's source and CC0 license is documented.

In scope: sourcing + vendoring a verified-CC0 dark/grunge pixel pack; loading sprites from
local files (no CDN); a hand-authored medium linear level (~3–4 screens) with reliable
collision; ~8–12 collectible coins (count tracked only — no XP yet); static spike hazards +
the existing fall-off-world trigger → checkpoint respawn; a goal flag that fires a single
`onReachGoal` event/stub; `CREDITS.md` + per-asset license records.

Out of scope: the actual math gate (Phase 10 — this phase only provides the `onReachGoal`
seam + a temporary stub); XP/persistence (Phase 11 — coins are counted, not yet scored);
enemies (deferred — static spikes only this phase); final feel/juice tuning with the kid
(Phase 12). The Phase 8 movement, camera, and checkpoint-respawn policy are reused, not rebuilt.

</domain>

<decisions>
## Implementation Decisions

### CC0 Asset Pack & Art Pipeline
- I (Claude) source ONE verified-CC0 dark/grunge pixel platformer pack (e.g. a Kenney or
  itch.io CC0 pack), vendor it locally under `assets/`, and document its license. No CDN —
  assets load from local files so the offline/no-build constraint holds. Pack is swappable in
  Phase 12 polish.
- Load via Kaplay 3001 `loadSprite` / `loadSpriteAtlas` (or sliced spritesheet) from the
  vendored files. Dark/grunge, no pink, readable silhouettes against the `#0a0a0a` background.

### Level Design & Layout
- One **medium linear level (~3–4 screens)** with a gentle difficulty curve and generous
  checkpoints — ADHD-safe, low-pressure, no time limits.
- **Hand-authored level data** (an array/object map) read by the scene to place platforms,
  gaps, coins, spikes, checkpoints, and the goal — no Tiled import dependency.
- Reliable collision reusing the Phase 8 `body()`/`area()` + merged-collider approach (no
  seam-stick, no tunneling). Camera clamps to the new level bounds.

### Coins, Hazard & Goal
- **~8–12 coins** placed throughout, simple pickup (collected count tracked in scene state
  only — XP scoring is Phase 11, not here).
- Hazard = **static spikes** + the existing fall-off-world trigger; both route through the
  Phase 8 checkpoint `reset()`/`respawn()` policy. Never a game-over, no lives. Enemies deferred.
- Goal = a goal flag that, on the player reaching it, fires a single **`onReachGoal`** event/
  callback. Phase 9 attaches a temporary stub (e.g. pause player + placeholder message); Phase
  10 wires the real in-world math gate to this exact seam. Keep the seam clean and single-point.

### Asset Licensing & Documentation
- `CREDITS.md` at repo root + an `assets/LICENSES/` area recording each asset's source URL and
  CC0 license proof. No vendor logos. This satisfies LEVEL-08.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/scenes/game.js` (Phase 8) — the scene with closure-owned run state seeded via
  `go("game", data)`, checkpoint markers + `onCollide("checkpoint")` last-touched respawn,
  named `reset()`/`respawn()` (reposition-in-place, no `go()`, progress preserved), camera
  follow + fall-off-world check in `onUpdate`. Phase 9 replaces the TEST STRIP geometry here
  with the real authored level but REUSES the respawn/camera/state machinery.
- `src/player.js` (Phase 8) — `makePlayer()` placeholder rect → Phase 9 swaps the rect for the
  CC0 sprite; movement/jump/coyote/buffer logic is unchanged.
- `src/camera.js` (Phase 8) — `followCamera()` frame-rate-independent clamp; Phase 9 feeds it
  the new level bounds.
- `src/config.js` (Phase 8) — all tunables; Phase 9 adds level/coin/spike/goal constants here
  (no magic numbers).
- `lib/kaplay.mjs` — vendored Kaplay 3001.0.19; use `loadSprite`/`area`/`body`/`onCollide`.

### Established Patterns
- No JS build step; plain ES2020 modules, relative imports; dark palette `#0a0a0a` bg,
  `#00ff88` accent. CONFIG-only constants (no magic numbers in logic).

### Integration Points
- `onReachGoal` is the integration seam Phase 10's math gate plugs into.
- The checkpoint-respawn policy from Phase 8 is the seam the new spikes/fall hazards reuse.
- Coin count lives in scene state now; Phase 11 will read collected results into XP.

</code_context>

<specifics>
## Specific Ideas

- Reference target: feels like a real little platformer level (think dark-cave/grunge tileset),
  readable silhouettes, satisfying coin pickups — but NO pressure, NO game-over, NO pink.
- Reuse the Phase 8 stress-tested collision approach so the real level inherits no seam-stick /
  tunneling.

</specifics>

<deferred>
## Deferred Ideas

- Enemies / patrolling hazards → beyond this phase (static spikes only here).
- The real math gate behavior → Phase 10 (Phase 9 only fires `onReachGoal`).
- Coin → XP scoring and persistence → Phase 11.
- Tiled-editor level pipeline → not needed; hand-authored data is sufficient.
- Final art swap / juice / feel tuning with the kid → Phase 12.

</deferred>
