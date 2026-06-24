# Phase 8: Platformer Core (Movement / Physics / Camera) - Context

**Gathered:** 2026-06-24
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the intrinsically-fun platformer spine on a **test strip** (no real
level art yet — that is Phase 9). An avatar she controls with the keyboard runs left/right,
jumps with weight, lands solidly, and the camera follows smoothly — all frame-rate
independent. The gentle checkpoint-respawn policy is established here so Phase 9 hazards
inherit it.

In scope: input (arrows + WASD, Space/Up jump), gravity/jump physics with game-feel
(variable height, coyote time, jump buffering), solid landing/collision (no seam-stick, no
tunneling on fast drops), smooth clamped camera follow, dt-correct movement, fall-off-world
→ checkpoint respawn with progress preserved.

Out of scope: real level art and tile packs (Phase 9), coins/hazards as game content
(Phase 9 — only the respawn *policy* is built here), the math gate (Phase 10), XP/persistence
(Phase 11), juice/polish tuning with the kid (Phase 12). Avatar is a placeholder rect.

</domain>

<decisions>
## Implementation Decisions

### Movement Feel (starting tune values — final feel tuned with the kid in Phase 12)
- Run speed ~240 px/s — snappy Mario-feel, responsive
- Gravity ~1400 px/s²; jump impulse tuned to ~3-tile jump height
- Coyote time window ~100 ms — forgiving edge jumps
- Jump buffer window ~120 ms — pre-land jump presses register
- All values are starting points and MUST remain easy to tune (CONFIG constants, no magic
  numbers) — Phase 12 tunes them with the actual user.

### Avatar & Test Strip Structure
- Avatar in Phase 8 is a placeholder colored rect — real sprite arrives in Phase 9
- Test strip layout: a long flat run + a tall fast-drop ledge + a few gaps/platforms —
  deliberately stress-tests seam-stick and tunneling (research pitfall #7)
- Player/run state is initialized INSIDE the scene callback, passed via `go(name, data)`,
  and a `reset()` is exposed — avoids module-level state leaks across `go()`/respawns
  (research pitfall #3)
- Code layout: split into new `src/` modules (e.g. `player.js`, `camera.js`, `scenes/`)
  imported by `main.js`, replacing the Phase 7 smoke scene

### Camera Behavior
- Smooth lerp follow (no jitter), dt-corrected
- Clamp camera to level bounds — never show outside the level
- Follow X primarily with a gentle Y follow
- No lookahead for now — keep it simple; revisit in Phase 12 polish

### Respawn & Checkpoints
- Fall detection: respawn when the player's Y passes the level bottom + a margin
- Checkpoint model: lightweight checkpoint markers; last-touched marker is the respawn
  point — this establishes the policy Phase 9 hazards reuse
- Respawn transition: quick fade/flash, no game-over UI, instant control return
- Progress is preserved on respawn — no penalty (ADHD-safe locked decision: no lives, no
  game-over)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/main.js` — Phase 7 game shell that boots vendored Kaplay (`../lib/kaplay.mjs`) with
  `kaplay({ width:640, height:360, background:"#0a0a0a", canvas:#game })` and a smoke
  `scene("game")`. Phase 8 replaces the smoke scene with real platformer code.
- `src/index.html` — has the `file://` protocol guard inline (must stay) and loads
  `main.js` as a module. Canvas is `#game`, 640×360, dark `#0a0a0a` background.
- `lib/kaplay.mjs` — vendored Kaplay 3001.0.19 (pinned; code only against this version's API).

### Established Patterns
- Dark-grunge palette: background `#0a0a0a`, accent `#00ff88` (used in smoke scene text).
- `global: true` Kaplay default exposes `scene/add/text/pos/anchor/color/go` globally.
- No JS build step — plain ES2020 modules, relative imports resolve identically under the
  dev server and inside the nginx container.

### Integration Points
- `main.js` is the entry; new scene/player/camera modules import from it or are imported by it.
- Kaplay `body()`/`area()` provide gravity + collision; coyote/buffer/variable-height are
  NOT built into `body()` and must be wired manually (research flag).
- The checkpoint-respawn policy built here is the integration seam Phase 9 hazards plug into.

</code_context>

<specifics>
## Specific Ideas

- "Mario-feel" is the explicit reference target — responsive, weighty, forgiving.
- Build a long-flat-run + fast-drop stress strip EARLY to surface Kaplay collision edge cases
  (seam-stick / tunneling), which research rated MEDIUM-confidence.
- Movement must be verified on a non-60 Hz / throttled display (dt-correctness, MOVE-05).

</specifics>

<deferred>
## Deferred Ideas

- Final game-feel tuning (exact gravity/jump-impulse/coyote/buffer values) → Phase 12 with the kid.
- Real level art, coins, hazards as content → Phase 9 (only the respawn policy is built here).
- Camera lookahead and juice → Phase 12 polish.
- Double jump (MOVE2-01) → deferred beyond this milestone.

</deferred>
