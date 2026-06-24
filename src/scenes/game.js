// src/scenes/game.js — the platformer test-strip scene callback.
//
// This scene OWNS all run state in its closure (CONTEXT-locked anti-leak, RESEARCH
// Pitfall 5 — no module-level `let` for run state). It is seeded via go("game", data).
//
// It is deliberately a STRESS HARNESS (RESEARCH Open Question #2): one MERGED wide
// static floor (fewer seams — anti seam-stick, RESEARCH Pattern 5 / Pitfall 2), a
// tall fast-drop ledge (exercises tunneling — Pitfall 3), and gap platforms (exercises
// gaps + landing edges). Building this first lets the MEDIUM-confidence collision risks
// be verified before the game-feel + camera layers (Plan 02) are stacked on top.
//
// scenes/ is one directory below src/, so sibling-module imports use `../`.
// Engine globals (add, onUpdate, onKeyPress, setGravity, vec2, rect, pos, area, body)
// come from Kaplay `global: true` — only our own modules are imported.

import { CONFIG } from "../config.js";
import { makePlayer } from "../player.js";
import { followCamera } from "../camera.js";

export function gameScene(data) {
  // Engine gravity for this scene (px/s^2). Set once on scene entry.
  setGravity(CONFIG.GRAVITY);

  // ALL run state lives HERE (closure), seeded via go("game", data) with default
  // guards. The full checkpoint/respawn logic lands in Plan 02 — the seed contract
  // is declared now so downstream code has a stable anchor to read.
  const startX = data?.startX ?? 64;
  const startY = data?.startY ?? 64;
  let lastCheckpoint = vec2(startX, startY); // eslint-disable-line no-unused-vars

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

  // --- Per-frame scene update ---
  // Frame-rate-independent camera follow, clamped to level bounds (MOVE-04).
  onUpdate(() => {
    followCamera(player);
  });
}
