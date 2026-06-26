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

  // --- Math brain (ported verbatim from archive/math-lab.html 604-619 — DO NOT re-tune) ---
  // The 6–9 weighting + EWMA constants are already validated; the selection math is
  // locked and out of scope to change. Read by src/math/brain.js (CONFIG.BRAIN.*) only.
  BRAIN: {
    ACCURACY_ALPHA: 0.15, // EWMA weight for a new answer
    MASTERY_THRESHOLD: 0.8, // 80% over last MASTERY_WINDOW → reduce drilling
    STRUGGLE_THRESHOLD: 0.6, // below this → STRUGGLE_BOOST weight
    STRUGGLE_BOOST: 1.5, // weight multiplier for a struggling table
    MASTERY_WINDOW: 10, // sliding window size for the mastery check
    HARD_TABLES: [6, 7, 8, 9], // drilled tables (biased selection)
    EASY_TABLES: [1, 2, 3, 4, 5], // confidence tables (lower selection share)
  },

  // --- Math gate UI (dark-grunge panel; Plan 02 consumes; Phase 12 retunes visuals) ---
  GATE: {
    DIM_OPACITY: 0.6, // full-screen dim layer opacity behind the panel
    PANEL_W: 420, // px — gate panel width
    PANEL_H: 220, // px — gate panel height
  },

  // --- Progression / XP (ported VERBATIM from archive/math-lab.html 604-619 — DO NOT re-tune) ---
  // The XP-per-table amounts and the level-threshold curve are the validated v1/v2 values.
  // Read by src/progress.js (Phase 11 Wave 1) only. HARD_TABLES/EASY_TABLES are intentionally
  // duplicated with CONFIG.BRAIN — different consumers (XP amount vs. selection weight); the
  // firewall keeps progress.js and brain.js independent. No HP/combat/dungeon fields (out of scope).
  PROGRESS: {
    XP_EASY: 10, // XP for a correct answer on tables 1–5
    XP_HARD: 20, // XP for a correct answer on tables 6–9
    BASE_XP: 200, // XP required for Level 1 → Level 2
    LEVEL_MULT: 1.3, // per-level threshold multiplier (threshold = round(BASE_XP * MULT^(L-1)))
    HARD_TABLES: [6, 7, 8, 9], // hard tables (award XP_HARD)
    EASY_TABLES: [1, 2, 3, 4, 5], // easy tables (award XP_EASY)
  },

  // --- Save / persistence (NEW namespaced key — independent of the archive's mathlab_save_*) ---
  // Phase 11 creates a fresh, independent platformer save. NO migration from the school game
  // (CONTEXT line 35-36). The old mathlab_save_v1/v2 keys are NEVER read or written.
  SAVE: {
    KEY: "mathlab_platformer_v1", // localStorage key for the platformer progression
    VERSION: 1, // bump for future save-format migrations
  },

  // --- HUD layout (level badge + XP bar + level-up flash; Wave 3 consumes; Phase 12 retunes) ---
  // FLASH_MS is 450 (NOT the archive's 800) — the ADHD-safe flash window per the STATE.md
  // v2.0 tech-debt note. Subtle, no scale-bomb. Phase 12 owns final juice tuning.
  HUD: {
    X: 16, // px — top-left anchor X
    Y: 16, // px — top-left anchor Y
    BADGE_SIZE: 18, // px — level badge text size
    BAR_W: 160, // px — XP bar width
    BAR_H: 10, // px — XP bar height
    BAR_DY: 24, // px — XP bar vertical offset below the badge
    FLASH_SIZE: 36, // px — level-up flash text size
    FLASH_MS: 450, // ms — level-up flash duration (ADHD-safe window; NOT archive's 800)
  },
};
