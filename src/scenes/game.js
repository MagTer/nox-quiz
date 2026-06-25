// src/scenes/game.js — the platformer scene callback.
//
// This scene OWNS all run state in its closure (CONTEXT-locked anti-leak, RESEARCH
// Pitfall 5 — no module-level `let` for run state). It is seeded via the go() data payload.
//
// Phase 9 replaced the Phase 8 stress-test strip with one hand-authored level:
// the geometry now comes from buildLevel(LEVEL) (level.js), and the player renders
// as a CC0 sprite. The Phase 8 spine is preserved verbatim — merged-floor colliders
// (anti seam-stick, Pitfall 2), the body({ maxVelocity }) anti-tunnel cap, the
// reposition-in-place reset()/respawn() (never game-over), the checkpoint
// last-touched promotion, and the clamped camera follow. Coin/spike/goal onCollide
// wiring is Plan 03 — buildLevel only CREATES those tagged entities here.
//
// scenes/ is one directory below src/, so sibling-module imports use `../`.
// Engine globals (add, onUpdate, setGravity, vec2, rect, pos, area, body, opacity,
// onCollide, tween, easings) come from Kaplay `global: true` — only our own modules
// are imported.

import { CONFIG } from "../config.js";
import { makePlayer } from "../player.js";
import { followCamera } from "../camera.js";
import { LEVEL, buildLevel } from "../level.js";

export function gameScene(data) {
  // Engine gravity for this scene (px/s^2). Set once on scene entry.
  setGravity(CONFIG.GRAVITY);

  // ALL run state lives HERE (closure), seeded via the go() data payload with default
  // guards. lastCheckpoint is the respawn point — seeded at the start position and
  // updated to the last-touched checkpoint marker (the policy Phase 9 hazards reuse).
  const startX = data?.startX ?? 64;
  const startY = data?.startY ?? 64;
  let lastCheckpoint = vec2(startX, startY);

  // --- Authored level body ---
  // buildLevel emits the merged-floor + platform colliders, the visual ground
  // tiles, and the tagged coin/spike/goal area() entities. It runs BEFORE the
  // player so the player spawns onto solid ground.
  buildLevel(LEVEL);

  // --- Player ---
  // The coyote/buffer/variable-height jump now lives inside makePlayer (Plan 02).
  // The Plan 01 basic grounded jump was removed so there is exactly ONE jump path.
  const player = makePlayer(startX, startY);

  // --- Checkpoints (last-touched marker = respawn point) ---

  // Lightweight near-invisible marker entity; touching it sets the respawn point.
  function addCheckpoint(x, y) {
    return add([rect(8, 48), pos(x, y), area(), opacity(0.001), "checkpoint"]);
  }

  // Place markers from the authored level data: one near the start and one just
  // before each spike (a respawn never costs meaningful progress — ADHD-safe).
  for (const cp of LEVEL.checkpoints) {
    addCheckpoint(cp.x, cp.y);
  }

  // Touching a checkpoint promotes it to the respawn point.
  player.onCollide("checkpoint", (c) => {
    lastCheckpoint = c.pos.clone();
  });

  // --- Respawn (reposition-in-place; NO go() — progress preserved, ADHD-safe) ---

  // reset() is the named anti-leak contract (CONTEXT line 45 / RESEARCH line 22):
  // reposition the player to the last-touched checkpoint, zero momentum, quick flash.
  // No game-over UI, no lives counter — instant control return.
  function reset() {
    player.pos = lastCheckpoint.clone();
    player.vel = vec2(0); // kill momentum so we cannot re-trigger the fall threshold
    // Quick flash: blink to near-invisible, then tween opacity back to full.
    player.opacity = 0.2;
    tween(0.2, 1, 0.18, (v) => (player.opacity = v), easings.easeOutQuad);
  }

  // respawn() is the fall-off-world caller; it delegates to the reset() contract.
  const respawn = reset;

  // --- Per-frame scene update ---
  onUpdate(() => {
    // Frame-rate-independent camera follow, clamped to level bounds (MOVE-04).
    followCamera(player);

    // Fall-off-world: respawn at the last-touched checkpoint (LEVEL-06).
    if (player.pos.y > CONFIG.LEVEL_BOTTOM + CONFIG.FALL_MARGIN) {
      respawn();
    }
  });
}
