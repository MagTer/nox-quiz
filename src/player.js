// src/player.js — the player entity factory + the hand-wired game-feel layer.
//
// Builds the CC0 sprite("player") entity (Phase 9 swapped the placeholder rect),
// wires the horizontal run, and — the heart of the game-feel phase — hand-wires
// the Mario-feel jump: variable height, coyote time, and jump buffering. None of
// that is in body(); it is layered on the engine primitives isGrounded() /
// jump() / vel + dt() timers.
//
// Engine globals (add, onUpdate, onKeyPress, onKeyRelease, isKeyDown, sprite, pos,
// area, body, opacity, dt) are exposed by Kaplay `global: true` — only CONFIG
// imports.
//
// dt discipline: body() integrates vel with dt() in its own move(), so we set
// vel.x directly and do NOT multiply by dt() (that would double-scale — RESEARCH
// Pattern 6). The game-feel timers are seconds and decrement by dt() so they are
// frame-rate independent (MOVE-05). Input is read in onUpdate (render loop), never
// onFixedUpdate (RESEARCH Pitfall 1), with onKeyPress/onKeyRelease for press edges.

import { CONFIG } from "./config.js";

// Jump keys: arrow-up, space, and W (consistent with the run WASD/arrows scheme).
const JUMP_KEYS = ["space", "up", "w"];

export function makePlayer(startX, startY) {
  const player = add([
    sprite("player"), // CC0 16x32 player sprite (replaces the Phase 8 placeholder rect)
    pos(startX, startY),
    area(), // collider matches the 16x32 sprite footprint (no transparent padding to tune)
    body({ maxVelocity: CONFIG.MAX_FALL_SPEED }), // gravity + collision + anti-tunnel terminal cap
    opacity(1), // enables the respawn flash (scene tweens player.opacity)
    "player",
  ]);

  // Game-feel timers — CLOSURE-LOCAL (anti-leak: never module-level), in seconds.
  // coyote: grace window after leaving the ground where a jump still fires.
  // buffer: window after a press where a not-yet-valid jump stays queued.
  let coyote = 0;
  let buffer = 0;

  player.onUpdate(() => {
    // Horizontal run: read held input, derive -1/0/+1, set vel.x = dir * RUN_SPEED.
    // body() applies dt() internally when integrating vel, so this is dt-correct.
    let dir = 0;
    if (isKeyDown("left") || isKeyDown("a")) dir -= 1;
    if (isKeyDown("right") || isKeyDown("d")) dir += 1;
    player.vel.x = dir * CONFIG.RUN_SPEED;

    // Coyote: refill to full while grounded, otherwise bleed down by dt() (clamp 0).
    if (player.isGrounded()) coyote = CONFIG.COYOTE_MS / 1000;
    else coyote = Math.max(0, coyote - dt());

    // Buffer always bleeds down by dt() (clamp 0).
    buffer = Math.max(0, buffer - dt());

    // Consume a buffered jump when we have ground OR coyote grace. Reset both
    // timers so the press is spent exactly once (no double-trigger).
    if (buffer > 0 && (player.isGrounded() || coyote > 0)) {
      player.jump(CONFIG.JUMP_FORCE);
      buffer = 0;
      coyote = 0;
    }
  });

  // Press registers a buffered jump (fires on the next grounded/coyote frame).
  // onKeyPress is a GLOBAL controller — player.paused does NOT pause it (the engine
  // only gates the object's own onUpdate). Without this guard, pressing jump while the
  // run is frozen (e.g. the math gate is open) still mutates `buffer`; that buffered
  // jump is latent today (only consumed inside the paused onUpdate) but would lurch the
  // player on any future unpause path that does not first zero `buffer`. Skipping the
  // write while paused keeps the freeze airtight without affecting normal jump feel.
  onKeyPress(JUMP_KEYS, () => {
    if (player.paused) return; // do not queue jumps while the run is frozen
    buffer = CONFIG.BUFFER_MS / 1000;
  });

  // Variable height: releasing while still rising cuts the upward velocity short.
  // Up is NEGATIVE Y in Kaplay (Vec2.UP = (0,-1)), so "rising" is vel.y < 0.
  onKeyRelease(JUMP_KEYS, () => {
    if (player.vel.y < 0) player.vel.y *= CONFIG.JUMP_CUT;
  });

  // Returned so the scene can attach checkpoint/respawn logic.
  return player;
}
