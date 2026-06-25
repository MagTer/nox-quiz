// src/level.js — hand-authored level data + the builder that instantiates it.
//
// Single responsibility: hold ONE author-written ~3.5-screen linear level as plain
// data (floor runs, raised platforms, coins, spikes, goal, checkpoints) and expose
// buildLevel(LEVEL) which turns that data into the level BODY: merged-floor
// colliders + visual-only tiles + the tagged coin/spike/goal area() entities.
//
// Engine globals (add, sprite, rect, pos, area, body, play, vec2, Rect) come from
// Kaplay `global: true` — do NOT import them. Only ./config.js is a sibling import
// (this file lives in src/, so siblings are `./`, NOT `../`).
//
// INVARIANTS this module upholds (carried from Phase 8 / pinned in 09-PATTERNS):
//   - Merged-floor collider: each contiguous floor RUN gets ONE wide
//     body({ isStatic: true }) collider; floor TILES are drawn as separate
//     visual-only sprites with NO area()/body() (anti seam-stick, Pitfall 2).
//   - Colliders are thick (CONFIG.FLOOR_THICKNESS) so full-speed drops cannot
//     tunnel through them (Pitfall 3).
//   - buildLevel OWNS creation of the tagged coin/spike/goal area() entities so
//     Plan 03 can attach onCollide handlers to them. Spikes get a TIGHTENED
//     area({ shape, offset }) hitbox here — definitively, not deferred (Pitfall 4).
//   - No onCollide wiring and no coin counting here — that is Plan 03.

import { CONFIG } from "./config.js";

// Fail-loud guard for the one fragile global. `Rect` is a CLASS global (not a
// factory like `rect`), used below for the tightened spike hitbox shape. Unlike
// the factory globals, a Kaplay bump that renames/removes it — or a future
// kaplay({ global: false }) toggle — would turn `new Rect(...)` into a SILENT
// mid-build ReferenceError that half-builds the scene. With no test framework /
// build-time symbol check (CLAUDE.md), assert once at module load so the failure
// is obvious and points at the cause instead of surfacing deep in buildLevel.
// Pinned engine: Kaplay 3001 (lib/kaplay.mjs) — re-check `Rect` on any upgrade.
if (typeof Rect === "undefined") {
  throw new Error(
    "level.js: Kaplay global `Rect` is missing — check kaplay({ global }) / engine version",
  );
}

const T = CONFIG.TILE_SIZE; // 16px — floor visual-tile grid step
const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every floor run

// --- Authored level data (gentle left-to-right difficulty curve) ---
//
// Floor runs are { x, w } at FLOOR_Y; the empty spans between them are the gaps.
// Platforms are raised { x, y, w, h } ledges spanning the gaps so every gap is
// crossable. Coins arc over jumps; spikes sit on the floor with a generous
// checkpoint placed just before each (a respawn never costs meaningful progress —
// ADHD-safe). The goal caps the final run. Level extent ≈ CONFIG.LEVEL_RIGHT (2240).
export const LEVEL = {
  // Contiguous floor runs (one merged collider each). Gaps: 560..720, 1200..1360.
  floors: [
    { x: 0, w: 560 }, // opening run
    { x: 720, w: 480 }, // middle run (after gap 1)
    { x: 1360, w: 880 }, // final run to the goal (after gap 2), ends at 2240
  ],

  // Raised platforms (own merged collider each) — stepping stones over the gaps
  // and a small height-variety hop on the final run.
  platforms: [
    { x: 360, y: 240, w: 160, h: 24 }, // hop up before gap 1
    { x: 560, y: 192, w: 128, h: 24 }, // mid-gap-1 stepping stone
    { x: 1208, y: 232, w: 152, h: 24 }, // stepping stone across gap 2
    { x: 1640, y: 232, w: 160, h: 24 }, // late height-variety ledge
  ],

  // 10 coins arced over the jumps and along the runs (count exercised in Plan 03).
  //
  // NOTE — intentional off-grid placement: coins render at 32x32 (default `topleft`
  // anchor) while everything else is 16px and grid-aligned. The {x, y} below are the
  // coin's TOP-LEFT corner, so its visual CENTER sits 16px right/down of {x, y}. This
  // is deliberate hand-tuning (the 32px area() matches the sprite, so collection is
  // unaffected) — these are authored visual positions, NOT grid coordinates. When
  // editing, read {x, y} as the top-left, and add ~16px to picture the center.
  coins: [
    { x: 200, y: 264 },
    { x: 392, y: 184 },
    { x: 592, y: 136 },
    { x: 800, y: 264 },
    { x: 960, y: 264 },
    { x: 1240, y: 176 },
    { x: 1440, y: 264 },
    { x: 1680, y: 176 },
    { x: 1900, y: 264 },
    { x: 2080, y: 264 },
  ],

  // Floor spikes (sit ON the floor at FLOOR_Y). Each has a checkpoint just before it.
  spikes: [
    { x: 880, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // first hazard on the middle run
    { x: 1520, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // hazard on the final run
    { x: 2000, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // last hazard before the goal
  ],

  // Goal caps the final run.
  goal: { x: 2160, y: FLOOR_Y - CONFIG.GOAL_SIZE },

  // Respawn checkpoints — one near the start and one just BEFORE each spike.
  checkpoints: [
    { x: 96, y: FLOOR_Y - 48 }, // start-area checkpoint
    { x: 800, y: FLOOR_Y - 48 }, // before the first spike (x=880)
    { x: 1440, y: FLOOR_Y - 48 }, // before the second spike (x=1520)
    { x: 1920, y: FLOOR_Y - 48 }, // before the third spike (x=2000)
  ],
};

// buildLevel(level) instantiates the level body from the data.
//
// It creates: (1) merged-floor + platform static colliders with separate visual
// tiles, and (2) the tagged coin/spike/goal area() entities. It does NOT wire any
// onCollide handlers and does NOT count coins — Plan 03 does that.
export function buildLevel(level) {
  // --- Solid floor runs: ONE merged collider per run + separate visual tiles ---
  for (const run of level.floors) {
    // Merged wide static collider for the WHOLE run (fewer seams to stick on —
    // anti seam-stick, Pitfall 2). Thick enough to resist tunneling (Pitfall 3).
    add([
      rect(run.w, CONFIG.FLOOR_THICKNESS),
      pos(run.x, FLOOR_Y),
      area(),
      body({ isStatic: true }),
      "ground",
    ]);

    // Visual-only floor tiles across the run — NO area()/body() (the merged
    // collider above is the only physics body for this run).
    for (let tx = run.x; tx < run.x + run.w; tx += T) {
      add([sprite("ground"), pos(tx, FLOOR_Y)]);
    }
  }

  // --- Raised platforms: same merged-collider idiom + visual tiles on top ---
  for (const p of level.platforms) {
    add([
      rect(p.w, p.h),
      pos(p.x, p.y),
      area(),
      body({ isStatic: true }),
      "ground",
    ]);
    for (let tx = p.x; tx < p.x + p.w; tx += T) {
      add([sprite("ground"), pos(tx, p.y)]);
    }
  }

  // --- Coins (REQUIRED — buildLevel owns creation; tag + area() so Plan 03 wires) ---
  for (const c of level.coins) {
    const coin = add([sprite("coin"), pos(c.x, c.y), area(), "coin"]);
    coin.play("spin"); // looping spin anim registered in main.js loadSprite
  }

  // --- Spikes (REQUIRED — tightened hitbox set HERE, Pitfall 4, NOT in Plan 03) ---
  // The visible spike points occupy the upper-middle of the 16px tile; a full-tile
  // collider would kill the player from the empty top/sides (unfair). Shrink the
  // collider to SPIKE_HITBOX_W x SPIKE_HITBOX_H and offset it down-centered onto
  // the points so only a real touch on the spikes triggers a respawn.
  const spikeOffX = (CONFIG.SPIKE_SIZE - CONFIG.SPIKE_HITBOX_W) / 2; // center horizontally
  const spikeOffY = CONFIG.SPIKE_SIZE - CONFIG.SPIKE_HITBOX_H; // drop to the lower points
  for (const s of level.spikes) {
    add([
      sprite("spike"),
      pos(s.x, s.y),
      area({
        shape: new Rect(vec2(0), CONFIG.SPIKE_HITBOX_W, CONFIG.SPIKE_HITBOX_H),
        offset: vec2(spikeOffX, spikeOffY),
      }),
      "spike",
    ]);
  }

  // --- Goal (REQUIRED — tag + area() so Plan 03 wires onReachGoal) ---
  add([sprite("goal"), pos(level.goal.x, level.goal.y), area(), "goal"]);
}
