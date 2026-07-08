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
import * as fx from "./fx.js"; // engine-side juice (squash/stretch/dust) — JUICE-01
import * as audio from "./audio.js"; // SFX seam (Phase 27 AUD-01) — jump/land call sites

// Jump keys: arrow-up, space, and W (consistent with the run WASD/arrows scheme).
const JUMP_KEYS = ["space", "up", "w"];

export function makePlayer(startX, startY) {
  const player = add([
    sprite("player"), // CC0 16x32 player sprite (replaces the Phase 8 placeholder rect)
    pos(startX, startY),
    area(), // collider matches the 16x32 sprite footprint (no transparent padding to tune)
    body({ maxVelocity: CONFIG.MAX_FALL_SPEED }), // gravity + collision + anti-tunnel terminal cap
    opacity(1), // enables the respawn flash (scene tweens player.opacity)
    scale(1), // VISUAL only — enables squash/stretch via .scaleTo() (JUICE-01); brief small deltas keep area() fair
    "player",
  ]);

  // Land juice (JUICE-01): body().onGround fires when the feet hit the floor — squash
  // the player and kick up a few dust particles. Both are self-cleaning fx.js transients
  // (tween().onEnd(destroy), no timer). Registered after the entity exists (engine init
  // done — globals safe). A closure-local isGrounded() rising-edge in onUpdate below is the
  // documented fallback if this body config ever misses a landing (RESEARCH Open Q1 / A1).
  //
  // No land SFX (27-07 human sound sign-off, 2026-07-08): onGround() reads as a clean
  // rising-edge in isolation, but across real level geometry (many adjacent floor/platform
  // colliders) it fires often enough during ordinary walking to sound like erratic,
  // rapid-fire footsteps — the opposite of ADHD-safe. 27-CONTEXT.md/27-RESEARCH.md always
  // treated land SFX as optional judgment-call, defaulting to skip it unless sign-off asked
  // for one; the human sign-off asked to remove it instead. Visual juice (squash/dust) is
  // unaffected — only the sound was flagged as the problem.
  player.onGround(() => {
    fx.squash(player);
    fx.dust(player.pos);
  });

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
      fx.stretch(player); // JUICE-01: subtle taller/narrower stretch on the jump, eases back
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
    audio.playSfx("jump");
    buffer = CONFIG.BUFFER_MS / 1000;
  });

  // Variable height: releasing while still rising cuts the upward velocity short.
  // Up is NEGATIVE Y in Kaplay (Vec2.UP = (0,-1)), so "rising" is vel.y < 0.
  onKeyRelease(JUMP_KEYS, () => {
    if (player.vel.y < 0) player.vel.y *= CONFIG.JUMP_CUT;
  });

  // Animation state machine (Phase 18 ART-01). Driven by grounded state and
  // horizontal speed, with a small deadzone so tiny jitter doesn't flicker.
  player.onUpdate(() => {
    const deadzone = CONFIG.PLAYER_ANIM_DEADZONE;
    const speedX = Math.abs(player.vel.x);

    let target;
    if (!player.isGrounded()) {
      target = "jump";
    } else if (speedX >= deadzone) {
      target = "run";
    } else {
      target = "idle";
    }

    // Only call play() on real state transitions so loops don't reset to frame 0.
    if (player.getCurAnim()?.name !== target) {
      player.play(target);
    }

    // Face movement direction, but preserve the last facing direction at rest.
    if (speedX >= deadzone) {
      player.flipX = player.vel.x < 0;
    }
  });

  // Returned so the scene can attach checkpoint/respawn logic.
  return player;
}
