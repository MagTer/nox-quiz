// src/scenes/game.js — the platformer test-strip scene callback.
//
// This scene OWNS all run state in its closure (CONTEXT-locked anti-leak, RESEARCH
// Pitfall 5 — no module-level `let` for run state). It is seeded via the go() data payload.
//
// It is deliberately a STRESS HARNESS (RESEARCH Open Question #2): one MERGED wide
// static floor (fewer seams — anti seam-stick, RESEARCH Pattern 5 / Pitfall 2), a
// tall fast-drop ledge (exercises tunneling — Pitfall 3), and gap platforms (exercises
// gaps + landing edges). Building this first lets the MEDIUM-confidence collision risks
// be verified before the game-feel + camera layers (Plan 02) are stacked on top.
//
// scenes/ is one directory below src/, so sibling-module imports use `../`.
// Engine globals (add, onUpdate, setGravity, vec2, rect, pos, area, body, opacity,
// onCollide, tween, easings) come from Kaplay `global: true` — only our own modules
// are imported.

import { CONFIG } from "../config.js";
import { makePlayer } from "../player.js";
import { followCamera } from "../camera.js";

export function gameScene(data) {
  // Engine gravity for this scene (px/s^2). Set once on scene entry.
  setGravity(CONFIG.GRAVITY);

  // ALL run state lives HERE (closure), seeded via the go() data payload with default
  // guards. lastCheckpoint is the respawn point — seeded at the start position and
  // updated to the last-touched checkpoint marker (the policy Phase 9 hazards reuse).
  const startX = data?.startX ?? 64;
  const startY = data?.startY ?? 64;
  let lastCheckpoint = vec2(startX, startY);

  // --- Stress strip ---

  // ONE merged wide static floor (not many tile colliders) — fewer seams to stick on.
  add([rect(1600, 32), pos(0, 320), area(), body({ isStatic: true }), "ground"]);

  // Tall fast-drop ledge: climb/jump onto it, then run off at full speed to exercise
  // tunneling against the floor below.
  add([rect(120, 160), pos(420, 160), area(), body({ isStatic: true }), "ground"]);

  // Gap platforms: two raised platforms separated by empty space (gaps + landing edges).
  add([rect(160, 24), pos(760, 240), area(), body({ isStatic: true }), "ground"]);
  add([rect(160, 24), pos(1060, 200), area(), body({ isStatic: true }), "ground"]);

  // --- Player ---
  // The coyote/buffer/variable-height jump now lives inside makePlayer (Plan 02).
  // The Plan 01 basic grounded jump was removed so there is exactly ONE jump path.
  const player = makePlayer(startX, startY);

  // --- Checkpoints (last-touched marker = respawn point) ---

  // Lightweight near-invisible marker entity; touching it sets the respawn point.
  function addCheckpoint(x, y) {
    return add([rect(8, 48), pos(x, y), area(), opacity(0.001), "checkpoint"]);
  }

  // Place markers across the strip: one near the start, one partway along by the
  // gap platforms (before the deeper drops).
  addCheckpoint(96, 272);
  addCheckpoint(820, 192);

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
