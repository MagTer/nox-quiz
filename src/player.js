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
import * as input from "./input.js"; // the ONE input seam (MOB-02; Phase 37) — ORs keyboard + virtual buttons so the jump physics below are the single shared path

// Jump keys: arrow-up, space, and W (consistent with the run WASD/arrows scheme).
const JUMP_KEYS = ["space", "up", "w"];

export function makePlayer(startX, startY) {
  const player = add([
    sprite("player"), // CC0 16x32 player sprite (replaces the Phase 8 placeholder rect)
    pos(startX, startY),
    area({ shape: new Rect(vec2(0), 16, 32) }), // collider explicitly locked to 16x32 (ART-04) — independent of whichever anim frame is currently playing, so the visually taller player-swamphunter sheet can never silently resize the physics hitbox
    body({ maxVelocity: CONFIG.MAX_FALL_SPEED }), // gravity + collision + anti-tunnel terminal cap
    opacity(1), // enables the respawn flash (scene tweens player.opacity)
    scale(1), // VISUAL only — enables squash/stretch via .scaleTo() (JUICE-01); brief small deltas keep area() fair
    "player",
  ]);

  // Route the keyboard's jump keys THROUGH the input seam (MOB-02) so keyboard and
  // (future) touch buttons drive the SAME buffer/coyote/variable-height path registered
  // via input.onJumpPress/onJumpRelease below. Called ONCE per makePlayer, AFTER kaplay()
  // has run (engine globals safe). initKeyboardJump reset()s the seam's callback registry
  // first, so nothing accumulates across scene re-entries — hence it MUST run before the
  // onJumpPress/onJumpRelease registrations further down.
  input.initKeyboardJump(JUMP_KEYS);

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

  // Anim-state timers — CLOSURE-LOCAL (anti-leak: never module-level), same discipline
  // as coyote/buffer above. wasFalling tracks whether the player was airborne-and-descending
  // on the previous frame (drives the genuine falling-to-grounded land transition below).
  // landHold counts down the seconds remaining to hold the synthesized "land" pose.
  let wasFalling = false;
  let landHold = 0;

  player.onUpdate(() => {
    // Horizontal run: read held input via the seam, derive -1/0/+1, set vel.x = dir *
    // RUN_SPEED. input.isLeftHeld()/isRightHeld() OR the EXACT same keyboard keys
    // (left/a, right/d) with the virtual buttons, so keyboard movement is byte-identical
    // (the virtual term is always false on desktop). body() applies dt() internally when
    // integrating vel, so this is dt-correct.
    let dir = 0;
    if (input.isLeftHeld()) dir -= 1;
    if (input.isRightHeld()) dir += 1;
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

  // Press registers a buffered jump (fires on the next grounded/coyote frame). Registered
  // on the input seam (input.onJumpPress) instead of directly on onKeyPress — so BOTH the
  // keyboard (routed through initKeyboardJump above) and the future touch buttons drive
  // this SAME body. The body is byte-identical to the pre-seam onKeyPress handler.
  // The jump-fire path is a GLOBAL edge — player.paused does NOT pause it (the engine
  // only gates the object's own onUpdate). Without this guard, pressing jump while the
  // run is frozen (e.g. the math gate is open) still mutates `buffer`; that buffered
  // jump is latent today (only consumed inside the paused onUpdate) but would lurch the
  // player on any future unpause path that does not first zero `buffer`. Skipping the
  // write while paused keeps the freeze airtight without affecting normal jump feel.
  input.onJumpPress(() => {
    if (player.paused) return; // do not queue jumps while the run is frozen
    audio.playSfx("jump", CONFIG.AUDIO.JUMP_VOLUME);
    buffer = CONFIG.BUFFER_MS / 1000;
  });

  // Variable height: releasing while still rising cuts the upward velocity short.
  // Up is NEGATIVE Y in Kaplay (Vec2.UP = (0,-1)), so "rising" is vel.y < 0. Registered
  // on the input seam (input.onJumpRelease) — same edge for keyboard and touch, NO timer
  // (pure release-edge + vel.y sign). Body byte-identical to the pre-seam onKeyRelease.
  input.onJumpRelease(() => {
    if (player.vel.y < 0) player.vel.y *= CONFIG.JUMP_CUT;
  });

  // Animation state machine (Phase 18 ART-01). Driven by grounded state and
  // horizontal speed, with a small deadzone so tiny jitter doesn't flicker.
  player.onUpdate(() => {
    const deadzone = CONFIG.PLAYER_ANIM_DEADZONE;
    const speedX = Math.abs(player.vel.x);

    // Decay the land-pose hold timer (same clamp-at-0 idiom as coyote/buffer).
    landHold = Math.max(0, landHold - dt());

    // Track airborne-and-descending state and detect the genuine falling-to-grounded
    // transition. Deliberately NOT hooked off player.onGround() (see the comment on that
    // hook above) — onGround() fires on every grounded contact, including repeated hits
    // while walking across adjacent floor colliders, which would keep re-triggering
    // landHold during ordinary walking and starve the run anim. This wasFalling-gated
    // edge only fires once, on a real airborne-to-grounded transition.
    if (!player.isGrounded()) {
      // Up is NEGATIVE Y (Vec2.UP = (0,-1)) — descending is vel.y >= 0.
      wasFalling = player.vel.y >= 0;
    } else if (wasFalling) {
      landHold = CONFIG.PLAYER_LAND_HOLD_MS / 1000;
      wasFalling = false;
    }

    let target;
    if (landHold > 0) {
      target = "land";
    } else if (!player.isGrounded()) {
      target = player.vel.y < 0 ? "jump" : "fall";
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
