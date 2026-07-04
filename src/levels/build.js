// src/levels/build.js — the ONE parameterized builder that instantiates a level.
//
// Single responsibility: take a level DESCRIPTOR (see ./level-01.js) and turn its
// `geometry` into the level BODY — merged-floor + platform static colliders with
// separate visual-only tiles, plus the tagged coin/spike/goal area() entities. It
// does NOT wire any onCollide handlers and does NOT count coins (the scene owns
// those), and it does NOT build checkpoints (those live in geometry and the scene
// reads them). The optional mechanics/theme/parallax descriptor slots are ignored
// here when unset.
//
// Engine globals (add, sprite, rect, pos, area, body, play, vec2, Rect) come from
// Kaplay `global: true` — do NOT import them; they are referenced ONLY inside the
// buildLevel body (after kaplay init). The ONLY import is ../config.js — this file
// lives in src/levels/, so the config sibling is TWO dirs up (`../`).
//
// INVARIANTS this module upholds (carried from Phase 8/9, lifted verbatim from the
// v3.0 src/level.js buildLevel):
//   - Merged-floor collider: each contiguous floor RUN gets ONE wide
//     body({isStatic:true}) collider; floor TILES are drawn as separate
//     visual-only sprites with NO area()/body() (anti seam-stick, Pitfall 2).
//   - Colliders are thick (CONFIG.FLOOR_THICKNESS) so full-speed drops cannot
//     tunnel through them (Pitfall 3). Do NOT switch to per-tile colliders or
//     Kaplay addLevel — that reintroduces the seam-stick the merge fixed.
//   - buildLevel OWNS creation of the tagged coin/spike/goal area() entities so the
//     scene can attach onCollide handlers. Spikes get a TIGHTENED area({ shape,
//     offset }) hitbox here — definitively, not deferred (Pitfall 4).

import { CONFIG } from "../config.js";

const T = CONFIG.TILE_SIZE; // 16px — floor visual-tile grid step (pure config read, safe at top level)
const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every floor run (pure config read, safe at top level)

// Dark-grunge palette per CLAUDE.md — matches src/scenes/select.js's own LABEL_FG exactly
// (21-RESEARCH.md Finding 1 convention). Plain data literal, safe at module top level (no
// engine global call). Applied to the door/math-gate/enemy glyph text() calls below as
// defensive codebase-convention cleanup (uncolored text() already defaults to opaque white
// per 21-RESEARCH.md, so this is not a bug fix — Finding 1 was REFUTED as the live cause).
const LABEL_FG = [0xe8, 0xe8, 0xe8];

// buildLevel(levelData) instantiates the level body from a descriptor's geometry.
//
// It creates: (1) merged-floor + platform static colliders with separate visual
// tiles, and (2) the tagged coin/spike/goal area() entities. It does NOT wire any
// onCollide handlers, does NOT count coins, and does NOT build checkpoints.
export function buildLevel(levelData) {
  // Fail-loud guard for the one fragile global, checked at USE time (after kaplay
  // init), NOT at module top level. `Rect` is a CLASS global (not a factory like
  // `rect`), used below for the tightened spike hitbox; a Kaplay bump / global:false
  // toggle would otherwise turn `new Rect(...)` into a silent mid-build
  // ReferenceError. The guard MUST stay inside this body — ES imports are hoisted
  // and evaluated BEFORE kaplay({ global }) runs in main.js, so a top-level check
  // would always throw at import and blank the game on every load (a727c13).
  if (typeof Rect === "undefined") {
    throw new Error(
      "build.js: Kaplay global `Rect` is missing — check kaplay({ global }) / engine version",
    );
  }

  const g = levelData.geometry;

  // Helper: pick the correct ground.png frame for a top-surface tile based on
  // its position within a run/platform. Pure visual pass — colliders are merged
  // separately and untouched (Phase 18 ART-02).
  function pickTopFrame(tx, runX, runW) {
    const isLeft = tx === runX;
    const isRight = tx + CONFIG.TILE_SIZE >= runX + runW;
    if (isLeft && isRight) return 0; // single-tile run
    if (isLeft) return 1;            // left edge
    if (isRight) return 3;           // right edge
    return 2;                        // center fill
  }

  // --- Solid floor runs: ONE merged collider per run + separate visual tiles ---
  for (const run of g.floors) {
    // Merged wide static collider for the WHOLE run (fewer seams to stick on —
    // anti seam-stick, Pitfall 2). Thick enough to resist tunneling (Pitfall 3).
    // opacity(0): this collider is taller (FLOOR_THICKNESS, e.g. 40px) than the visual
    // tile it sits under (T, 16px) — without opacity(0) it renders with Kaplay's default
    // rect fill (a flat mid-gray, NOT the dark-grunge ground.png palette), showing as a
    // glaring solid bar beneath every floor/platform (found via headless playtest — the
    // project's own door.js blocker already uses this exact opacity(0)-collider pattern).
    add([
      rect(run.w, CONFIG.FLOOR_THICKNESS),
      pos(run.x, FLOOR_Y),
      area(),
      body({ isStatic: true }),
      opacity(0),
      "ground",
    ]);

    // Visual-only floor tiles across the run — NO area()/body() (the merged
    // collider above is the only physics body for this run).
    for (let tx = run.x; tx < run.x + run.w; tx += T) {
      add([sprite("ground", { frame: pickTopFrame(tx, run.x, run.w) }), pos(tx, FLOOR_Y)]);
    }
  }

  // --- Raised platforms: same merged-collider idiom + visual tiles on top ---
  for (const p of g.platforms) {
    // opacity(0): same reasoning as the floor-run collider above — p.h (e.g. 24px) can
    // exceed the 16px visual tile height, exposing the collider's default gray fill.
    add([
      rect(p.w, p.h),
      pos(p.x, p.y),
      area(),
      body({ isStatic: true }),
      opacity(0),
      "ground",
    ]);
    for (let tx = p.x; tx < p.x + p.w; tx += T) {
      add([sprite("ground", { frame: pickTopFrame(tx, p.x, p.w) }), pos(tx, p.y)]);
    }
  }

  // --- Coins (REQUIRED — buildLevel owns creation; tag + area() so the scene wires) ---
  for (const c of g.coins) {
    const coin = add([sprite("coin"), pos(c.x, c.y), area(), "coin"]);
    coin.play("spin"); // looping spin anim registered in main.js loadSprite
  }

  // --- Spikes (REQUIRED — tightened hitbox set HERE, Pitfall 4, NOT deferred) ---
  // The visible spike points occupy the upper-middle of the 16px tile; a full-tile
  // collider would kill the player from the empty top/sides (unfair). Shrink the
  // collider to SPIKE_HITBOX_W x SPIKE_HITBOX_H and offset it down-centered onto
  // the points so only a real touch on the spikes triggers a respawn.
  const spikeOffX = (CONFIG.SPIKE_SIZE - CONFIG.SPIKE_HITBOX_W) / 2; // center horizontally
  const spikeOffY = CONFIG.SPIKE_SIZE - CONFIG.SPIKE_HITBOX_H; // drop to the lower points
  for (const s of g.spikes) {
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

  // --- Goal (REQUIRED — tag + area() so the scene wires onReachGoal) ---
  add([sprite("goal"), pos(g.goal.x, g.goal.y), area(), "goal"]);

  // --- Locked doors (optional — guarded so older/forward-looking levels without doors still build) ---
  for (const d of g.doors ?? []) {
    // Invisible vertical blocker: a tall solid collider that physically prevents bypassing
    // the door by jumping, and triggers the shared challenge seam on touch.
    // WR-04: derived from jump physics (apex height = JUMP_FORCE^2 / (2*GRAVITY), ~97px at
    // current tuning) + a fixed margin, rather than a bare literal — so a future retune of
    // CONFIG.JUMP_FORCE/CONFIG.GRAVITY can't silently shrink real coverage below the actual
    // jump arc and let the player jump over a locked door.
    const blockerH = Math.ceil((CONFIG.JUMP_FORCE ** 2) / (2 * CONFIG.GRAVITY)) + 64; // apex + margin
    const blocker = add([
      rect(CONFIG.DOOR.W, blockerH),
      pos(d.x, d.y + CONFIG.DOOR.H - blockerH),
      opacity(0), // invisible — the visible panel below provides the art
      area(),
      body({ isStatic: true }),
      "door",
    ]);

    // Visible door panel — the cosmetic locked door the player sees.
    const panel = add([
      rect(CONFIG.DOOR.W, CONFIG.DOOR.H),
      pos(d.x, d.y),
      color(...CONFIG.DOOR.LOCKED_GREY),
      outline(2, rgb(...CONFIG.DOOR.LOCKED_BORDER)),
      "door-panel",
    ]);

    // Visual lock glyph — purely cosmetic, no area() so it never collides.
    const glyph = add([
      text("X", { size: CONFIG.DOOR.GLYPH_SIZE }),
      anchor("center"),
      pos(d.x + CONFIG.DOOR.W / 2, d.y + CONFIG.DOOR.H / 2),
      color(LABEL_FG[0], LABEL_FG[1], LABEL_FG[2]),
      "door-glyph",
    ]);

    // Stash linked visual objects on the blocker so door.js can clean everything up at once.
    blocker.panelObj = panel;
    blocker.glyphObj = glyph;
  }

  // --- Checkpoint math gates (MECH-04) ---
  for (const mg of g.mathGates ?? []) {
    const gateObj = add([
      rect(CONFIG.MATH_GATE.W, CONFIG.MATH_GATE.H),
      pos(mg.x, mg.y),
      area(),
      body({ isStatic: true }),
      color(...CONFIG.MATH_GATE.LOCKED_GREY),
      outline(2, rgb(...CONFIG.MATH_GATE.LOCKED_BORDER)),
      "math-gate",
    ]);

    const glyph = add([
      text("?", { size: CONFIG.MATH_GATE.GLYPH_SIZE }),
      anchor("center"),
      pos(mg.x + CONFIG.MATH_GATE.W / 2, mg.y + CONFIG.MATH_GATE.H / 2),
      color(LABEL_FG[0], LABEL_FG[1], LABEL_FG[2]),
      "math-gate-glyph",
    ]);

    gateObj.glyphObj = glyph;
  }

  // --- Defeat-enemy encounters (MECH-05) ---
  for (const e of g.enemies ?? []) {
    const enemyObj = add([
      rect(CONFIG.ENEMY.W, CONFIG.ENEMY.H),
      pos(e.x, e.y),
      area(),
      body({ isStatic: true }),
      color(...CONFIG.ENEMY.COLOR),
      "enemy",
    ]);

    const glyph = add([
      text("!", { size: CONFIG.ENEMY.GLYPH_SIZE }),
      anchor("center"),
      pos(e.x + CONFIG.ENEMY.W / 2, e.y + CONFIG.ENEMY.H / 2),
      color(LABEL_FG[0], LABEL_FG[1], LABEL_FG[2]),
      "enemy-glyph",
    ]);

    enemyObj.glyphObj = glyph;
  }

  // --- Collect-the-answer zones (MECH-03) ---
  for (const z of g.collectZones ?? []) {
    const zoneObj = add([
      rect(CONFIG.COLLECT.ZONE_W, CONFIG.COLLECT.ZONE_H),
      pos(z.x, z.y),
      area(),
      opacity(0),
      "answer-zone",
    ]);

    zoneObj.slots = z.slots;
  }

  // --- Collect-the-answer pickup slots (MECH-03) ---
  for (const [i, s] of (g.answerPickupSlots ?? []).entries()) {
    const slotObj = add([
      rect(CONFIG.COLLECT.PICKUP_W, CONFIG.COLLECT.PICKUP_H),
      pos(s.x, s.y),
      area(),
      opacity(0),
      color(...CONFIG.COLLECT.PICKUP_BG),
      outline(2, rgb(...CONFIG.COLLECT.PICKUP_BORDER)),
      "answer-pickup-slot",
    ]);

    slotObj.slotIndex = i;
  }
}
