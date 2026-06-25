// src/config.js — all tunable values in ONE place.
//
// CONTEXT-locked: no magic numbers in the player / camera / scene logic modules.
// Every movement, physics, and camera number they use comes from here, so Phase 12
// can retune the game feel with the kid in a single file. Leaf-level constants only:
// this module imports nothing.
//
// Starting tune values come from CONTEXT + 08-RESEARCH.md. JUMP_FORCE and
// MAX_FALL_SPEED are set explicitly (not relying on body() defaults — RESEARCH
// Open Question #1) and are tuned on the stress strip in 08-01 Task 3.

export const CONFIG = {
  // --- Movement / physics (CONTEXT starting tune values — tunable in Phase 12) ---
  RUN_SPEED: 240, // px/s — horizontal run speed (left/right)
  GRAVITY: 1400, // px/s^2 — downward acceleration applied by body()
  JUMP_FORCE: 520, // px/s — upward impulse; ~3-tile (~96px) jump at GRAVITY 1400 (tuned on strip)
  JUMP_CUT: 0.45, // unitless — variable-height: vel.y *= JUMP_CUT on early release (Plan 02)
  COYOTE_MS: 100, // ms — grace window to still jump just after leaving the ground (Plan 02)
  BUFFER_MS: 120, // ms — how long a pending jump press stays valid before landing (Plan 02)
  MAX_FALL_SPEED: 900, // px/s — terminal fall speed; body({ maxVelocity }) anti-tunnel cap

  // --- Camera (consumed in Plan 02) ---
  CAM_RATE: 10, // 1/s — half-life rate for 1 - exp(-CAM_RATE*dt()) smoothing (8..12)
  CAM_Y_FACTOR: 0.5, // unitless — gentle vertical follow relative to primary X follow

  // --- Level bounds (authored ~3.5-screen level) + respawn (FALL_MARGIN) ---
  LEVEL_LEFT: 0, // px — left world edge (camera clamp)
  LEVEL_RIGHT: 2240, // px — right world edge (matches the authored level pixel width, ~3.5 screens of 640px)
  LEVEL_TOP: 0, // px — top world edge (camera clamp)
  LEVEL_BOTTOM: 360, // px — bottom world edge (one 360px screen tall; level is linear/horizontal)
  FALL_MARGIN: 120, // px — respawn when player.pos.y > LEVEL_BOTTOM + FALL_MARGIN

  // --- Level / content (Phase 9) ---
  TILE_SIZE: 16, // px — CC0 pack native tile size (sprite slice + floor-tile grid math)
  FLOOR_Y: 320, // px — top edge of the floor runs (player stands at this Y)
  FLOOR_THICKNESS: 40, // px — merged-floor collider depth; thick to resist tunneling on tall drops (Pitfall 3)
  COIN_FRAMES: 8, // count — coin.png is a 256x32 sheet of 8 evenly-gridded 32px frames (sliceX)
  COIN_SPIN_SPEED: 12, // fps — coin spin anim frame rate
  // (No COIN_SIZE: coin placement is intentionally data-driven via raw {x, y} in
  // level.js — the 32px frame size is never read in logic, so no constant is kept.)
  SPIKE_SIZE: 16, // px — spike sprite footprint (full tile); the hitbox is tightened below
  SPIKE_HITBOX_W: 12, // px — tightened spike collider width (narrower than the 16px tile — fair points-only hit)
  SPIKE_HITBOX_H: 8, // px — tightened spike collider height (only the upper visible spikes, not the empty base)
  GOAL_SIZE: 16, // px — goal sprite footprint
};
