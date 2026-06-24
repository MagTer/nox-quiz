// src/player.js — the player entity factory.
//
// Builds the #00ff88 placeholder rect (real sprite arrives Phase 9) and wires the
// horizontal run. Follows the project's add([...]) component-list shape from the
// Phase 7 main.js. Engine globals (add, onUpdate, isKeyDown, rect, pos, area, body,
// color) are exposed by Kaplay `global: true` — only CONFIG needs importing.
//
// dt discipline: body() integrates vel with dt() in its own move(), so we set
// vel.x directly and do NOT multiply by dt() (that would double-scale — RESEARCH
// Pattern 6). Input is read in onUpdate (render loop), never onFixedUpdate
// (RESEARCH Pitfall 1).

import { CONFIG } from "./config.js";

export function makePlayer(startX, startY) {
  const player = add([
    rect(24, 32),
    pos(startX, startY),
    area(),
    body({ maxVelocity: CONFIG.MAX_FALL_SPEED }), // gravity + collision + anti-tunnel terminal cap
    color(0, 255, 136), // #00ff88 placeholder (real sprite = Phase 9)
    "player",
  ]);

  // Horizontal run: read held input, derive -1/0/+1, set vel.x = dir * RUN_SPEED.
  // body() applies dt() internally when integrating vel, so this is already dt-correct.
  player.onUpdate(() => {
    let dir = 0;
    if (isKeyDown("left") || isKeyDown("a")) dir -= 1;
    if (isKeyDown("right") || isKeyDown("d")) dir += 1;
    player.vel.x = dir * CONFIG.RUN_SPEED;
  });

  // Returned so the scene can attach checkpoint/respawn logic in Plan 02.
  return player;
}
