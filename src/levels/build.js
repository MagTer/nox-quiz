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
// lives in src/levels/, one directory below src/, so the config import is `../config.js`.
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
const FILL_CHUNK_COLS = CONFIG.TERRAIN.FILL_CHUNK_COLS; // <=40 cols — spike-proven {tiled:true} chunk ceiling (pure config read, safe at top level)
const FLOOR_FILL_DEPTH_PX = CONFIG.TERRAIN.FLOOR_FILL_DEPTH_PX; // px — floor-run underground fill depth (pure config read, safe at top level)
// NOTE: there is no platform fill depth any more. Platforms draw the atlas's PLATFORM
// frame (a 16px ledge, see buildLevel below) and no fill at all, so the old
// CONFIG.TERRAIN.PLATFORM_FILL_DEPTH_PX tunable was removed rather than left dangling.

// Dark-grunge palette per CLAUDE.md — matches src/scenes/select.js's own text color exactly
// (21-RESEARCH.md Finding 1 convention), now read from CONFIG.PALETTE.TEXT (VIS-01; Phase 26
// Plan 01). Applied to the door/math-gate/enemy glyph text() calls below as defensive
// codebase-convention cleanup (uncolored text() already defaults to opaque white per
// 21-RESEARCH.md, so this is not a bug fix — Finding 1 was REFUTED as the live cause).

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

  // --- Debug overlay (?debug=1) ---
  // Serve the game with ?debug=1 (e.g. http://localhost:8000/?debug=1) to make every
  // normally-invisible physics/trigger entity faintly visible: the merged floor and
  // platform colliders, the tall door/gate/enemy blockers, answer zones, pickup slots,
  // and the secret alcoves. Display-only — hitbox shapes, sizes, and tags are byte-
  // identical in both modes, so gameplay and the audit harness are unaffected.
  // `location` is browser-only, hence the typeof guard (this module must stay safely
  // node-importable for the validator/smoke scripts). This flag replaces the previous
  // "temporarily hand-edit opacity(0) in production code" playtest workaround.
  const DEBUG =
    typeof location !== "undefined" && new URLSearchParams(location.search).has("debug");
  const HIDDEN = DEBUG ? 0.35 : 0; // opacity for normally-invisible entities

  const g = levelData.geometry;

  // atlas-${biome} sprite selection (ART-02; Phase 32 Plan 03): biome is a required
  // field on every descriptor (Plan 32-02) and maps 1:1 to a baked per-biome terrain
  // atlas (swamp/town/cemetery/castle) — a direct lookup, no fallback branch.
  const atlasSprite = `atlas-${levelData.biome}`;

  // Frame order per docs/LEVEL-DESIGN.md §9: the baked atlas is a 48x32 sheet of
  // three 16x32 frames — frame 0 is the decorative cap (top surface), frame 1 is the
  // load-bearing fill (underground mass), frame 2 is the PLATFORM ledge.
  //
  // Frame 2 is the cap's own top 16px cell over a fully-transparent bottom half
  // (scripts/build-art-assets.py::_bake_biome_atlas). Drawn at the same CAP_FRAME_H
  // as the cap, it renders a 16px-thick ledge that EXACTLY matches a platform's 16px
  // `p.h` collider. It replaces the old cap+fill emission for platforms, which drew a
  // 48px slab (32px cap + a 32px fill starting 16px down) over that same 16px
  // collider — 32px of ledge hanging below the surface the player actually stands on,
  // which ate the headroom under the tier above (level-08's 75px rise measured -5px of
  // VISUAL clearance: the player's head rendered inside the ledge above her). FLOORS
  // are unaffected — they still want a thick, solid, deep mass and keep cap + fill.
  const CAP_FRAME = 0;
  const FILL_FRAME = 1;
  const PLATFORM_FRAME = 2;
  // WR-02 fix (32-REVIEW.md): each baked atlas frame is 16 wide x 32 tall (the "32x32
  // sheet of two 16x32 frames" from the comment above, confirmed against the real PNGs
  // — sliceX:2/sliceY:1 in main.js's load call). The last-tile width clamp below must
  // pass this explicit natural height alongside the clamped width, or Kaplay's
  // non-tiled sprite draw (which uses `width` alone as a UNIFORM x+y scale factor when
  // `height` is omitted) would also squish the cap art vertically, not just crop its
  // overhanging right edge.
  const CAP_FRAME_H = T * 2;

  // Occupancy-driven autotile cap+chunked-fill renderer (ART-02; Phase 32 Plan 03),
  // a near-verbatim port of the spike-proven recipe simplified to the real 2-frame
  // biome atlas. Emits ONLY tagged visual tiles (sprite, no area()/body()) — the
  // caller's merged rect()+body({isStatic:true}) collider block (below) stays the
  // sole physics body for the run, byte-unchanged; this helper only ever reads
  // runX/runY/runW/fillDepthPx, never geometry.
  //
  // Cemetery's cap frame is transparent in rows 0-9 (docs/LEVEL-DESIGN.md §9) — its
  // branch starts the fill body one tile-row earlier (at runY instead of runY + T,
  // with height fillDepthPx + T so it still reaches the same effective bottom depth)
  // and emits it before the cap-row loop, so the always-solid fill composites
  // underneath the cap as a decorative overlay rather than leaving a gap down to the
  // collider line. Castle and the other 2 biomes render through the standard path
  // as-is (per 32-CONTEXT.md — no special-casing beyond Cemetery).
  function emitTerrainRun(runX, runY, runW, fillDepthPx) {
    if (levelData.biome === "cemetery") {
      for (let cx = runX; cx < runX + runW; cx += FILL_CHUNK_COLS * T) {
        const chunkW = Math.min(FILL_CHUNK_COLS * T, runX + runW - cx);
        add([
          sprite(atlasSprite, {
            frame: FILL_FRAME,
            tiled: true,
            width: chunkW,
            height: fillDepthPx + T,
          }),
          pos(cx, runY),
          "ground-fill",
        ]);
      }
      for (let tx = runX; tx < runX + runW; tx += T) {
        // WR-02 fix (32-REVIEW.md): clamp the last cap tile's drawn width to the
        // remaining run pixels instead of letting a fixed-16px sprite overshoot the
        // run's right edge (matches how the fill-chunk loop above already clamps
        // chunkW). Only takes effect for the final tile of a run whose width isn't a
        // multiple of T; every other tile still gets the full T-wide sprite.
        const capW = Math.min(T, runX + runW - tx);
        add([
          sprite(atlasSprite, { frame: CAP_FRAME, width: capW, height: CAP_FRAME_H }),
          pos(tx, runY),
          "ground-cap",
        ]);
      }
      return;
    }

    for (let cx = runX; cx < runX + runW; cx += FILL_CHUNK_COLS * T) {
      const chunkW = Math.min(FILL_CHUNK_COLS * T, runX + runW - cx);
      add([
        sprite(atlasSprite, { frame: FILL_FRAME, tiled: true, width: chunkW, height: fillDepthPx }),
        pos(cx, runY + T),
        "ground-fill",
      ]);
    }
    for (let tx = runX; tx < runX + runW; tx += T) {
      // WR-02 fix (32-REVIEW.md): same last-tile clamp as the Cemetery branch above —
      // see that comment for the reasoning.
      const capW = Math.min(T, runX + runW - tx);
      add([
        sprite(atlasSprite, { frame: CAP_FRAME, width: capW, height: CAP_FRAME_H }),
        pos(tx, runY),
        "ground-cap",
      ]);
    }
  }

  // Raised-platform ledge renderer (WYSIWYG platform fix). Emits ONE row of
  // PLATFORM_FRAME tiles across the run and NO fill at all — the frame's transparent
  // bottom half is what makes the drawn ledge 16px thick instead of the old 48px
  // slab, so the visible platform matches its `rect(p.w, p.h)` collider exactly.
  // Same last-tile width clamp as the cap loop in emitTerrainRun (a run whose width
  // isn't a multiple of T must not overshoot its own right edge, WR-02), and the same
  // explicit CAP_FRAME_H natural height (Kaplay treats a lone `width` as a UNIFORM
  // x+y scale, which would vertically squash the ledge art). Visual-only: no area(),
  // no body() — the caller's merged collider is the sole physics body, unchanged.
  // Biome-agnostic: unlike emitTerrainRun there is no Cemetery special case, because
  // there is no fill to composite under a partly-transparent cap.
  function emitPlatformLedge(runX, runY, runW) {
    for (let tx = runX; tx < runX + runW; tx += T) {
      const tileW = Math.min(T, runX + runW - tx);
      add([
        sprite(atlasSprite, { frame: PLATFORM_FRAME, width: tileW, height: CAP_FRAME_H }),
        pos(tx, runY),
        "ground-cap",
      ]);
    }
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
      opacity(HIDDEN),
      "ground",
    ]);

    // Visual-only autotile cap+fill mass across the run — NO area()/body() (the
    // merged collider above is the only physics body for this run).
    emitTerrainRun(run.x, FLOOR_Y, run.w, FLOOR_FILL_DEPTH_PX);
  }

  // --- Raised platforms: same merged-collider idiom + a WYSIWYG 16px ledge on top ---
  for (const p of g.platforms) {
    // opacity(0): same reasoning as the floor-run collider above — without it the
    // collider renders with Kaplay's default flat-gray rect fill.
    add([
      rect(p.w, p.h),
      pos(p.x, p.y),
      area(),
      body({ isStatic: true }),
      opacity(HIDDEN),
      "ground",
    ]);
    // Ledge, NOT a terrain run: the drawn tile row is exactly as thick as this
    // collider (see PLATFORM_FRAME above). Do NOT swap this back to emitTerrainRun —
    // that is what drew a 48px slab over a 16px collider and stole the headroom
    // between tiers.
    emitPlatformLedge(p.x, p.y, p.w);
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

  // --- Sliding spikes (POL-02; Phase 39 — a horizontally-sliding ground hazard) ---
  // COMPOSES the spike entity above (same "spike" tag + same tightened SPIKE_HITBOX
  // area(), reusing spikeOffX/spikeOffY) with the mover's dt raised-cosine oscillation
  // below — so it routes to the EXISTING game.js:269 "spike"→respawn seam with ZERO new
  // wiring. The ONE structural difference from a mover: NO body() — a spike is a hazard
  // trigger, not a standable ledge. The pos-relative area() tracks the moving sprite
  // automatically. `onUpdate` + `dt()` ONLY (SAFE-01, no scheduler). Reads the EXEMPT
  // geometry.slidingSpikes key (stripped from the freeze hash like movers/patrollers);
  // guarded with `?? []` so levels without it still build.
  for (const s of g.slidingSpikes ?? []) {
    const spk = add([
      sprite("spike"),
      pos(s.x1, s.y1),
      area({
        shape: new Rect(vec2(0), CONFIG.SPIKE_HITBOX_W, CONFIG.SPIKE_HITBOX_H),
        offset: vec2(spikeOffX, spikeOffY),
      }),
      "spike",
    ]);
    const period = s.period ?? CONFIG.SLIDING_SPIKE.PERIOD_S; // per-slidingSpike override allowed
    let t = 0; // closure-local PER entity — never module-level (anti-leak)
    spk.onUpdate(() => {
      // dt-based, scheduler-free (SAFE-01 clean). Raised-cosine eases at BOTH ends.
      t += dt();
      const phase = (1 - Math.cos(((2 * Math.PI) / period) * t)) / 2; // 0 → 1 → 0
      spk.pos.x = s.x1 + (s.x2 - s.x1) * phase;
      spk.pos.y = s.y1 + (s.y2 - s.y1) * phase;
    });
  }

  // --- Goal (REQUIRED) — decoupled into a VISUAL flag + a load-bearing collider ---
  // Mirrors the door split below (invisible collider + separate visible art). WHY the
  // split: the flag needed to render bigger (quick 260717-j24 play-test — 16px read as
  // half a coin) WITHOUT touching the goal-trigger collider, which is genuinely load-
  // bearing — browser-boot / audit-endgate-key onCollide depend on the exact 16px area
  // at (g.goal.x, g.goal.y) (level-06 path-B halts ~13-16px short with ~0-3px overlap).
  //
  // (a) Cosmetic-only flag at GOAL_VISUAL_SIZE (32px). NO area(), tagged "goalflag" (NOT
  // "goal"). anchor("botleft") + pos(x, y+GOAL_SIZE) plants its base on the OLD 16px
  // footprint's bottom-left ground line and grows UP + to the RIGHT — never sinking into
  // the floor. NEVER scale() — it would resize a collider (there is none here) and drift.
  add([
    sprite("goal", { width: CONFIG.GOAL_VISUAL_SIZE, height: CONFIG.GOAL_VISUAL_SIZE }),
    anchor("botleft"),
    pos(g.goal.x, g.goal.y + CONFIG.GOAL_SIZE),
    "goalflag",
  ]);

  // (b) Load-bearing trigger collider — byte-identical to the old sprite-derived area:
  // same top-left origin (g.goal.x, g.goal.y) and same 16x16 GOAL_SIZE. Hidden via the
  // shared HIDDEN opacity (visible only under ?debug=1, like the door/gate blockers).
  add([
    rect(CONFIG.GOAL_SIZE, CONFIG.GOAL_SIZE),
    pos(g.goal.x, g.goal.y),
    opacity(HIDDEN),
    area(),
    "goal",
  ]);

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
      opacity(HIDDEN), // invisible — the visible panel below provides the art
      area(),
      body({ isStatic: true }),
      "door",
    ]);

    // Visible door panel — the cosmetic locked door the player sees. Real sprite art
    // (VIS-04; Phase 26 Plan 05) replaces the flat-color rect+glyph placeholder.
    const panel = add([sprite("door"), pos(d.x, d.y), "door-panel"]);

    // Stash linked visual objects on the blocker so door.js can clean everything up at once.
    blocker.panelObj = panel;
  }

  // --- Checkpoint math gates (MECH-04) ---
  for (const mg of g.mathGates ?? []) {
    // CR-02: same apex-derived tall invisible blocker as the door pattern above — the
    // cosmetic MATH_GATE.H (64px) box alone is well under the ~97px jump apex, so a
    // normal running jump cleared the checkpoint entirely, skipping the required
    // math-answer interaction. Solid collider lives on this tall blocker (tagged
    // "math-gate", the tag gates.js listens for); the visible panel below is purely
    // cosmetic with no area()/body(), same split the door uses.
    const blockerH = Math.ceil((CONFIG.JUMP_FORCE ** 2) / (2 * CONFIG.GRAVITY)) + 64; // apex + margin
    const gateObj = add([
      rect(CONFIG.MATH_GATE.W, blockerH),
      pos(mg.x, mg.y + CONFIG.MATH_GATE.H - blockerH),
      opacity(HIDDEN), // invisible — the visible panel below provides the art
      area(),
      body({ isStatic: true }),
      "math-gate",
    ]);

    const panel = add([sprite("math-gate"), pos(mg.x, mg.y), "math-gate-panel"]);

    const glyph = add([
      text("?", { size: CONFIG.MATH_GATE.GLYPH_SIZE }),
      anchor("center"),
      pos(mg.x + CONFIG.MATH_GATE.W / 2, mg.y + CONFIG.MATH_GATE.H / 2),
      color(CONFIG.PALETTE.TEXT[0], CONFIG.PALETTE.TEXT[1], CONFIG.PALETTE.TEXT[2]),
      "math-gate-glyph",
    ]);

    gateObj.panelObj = panel;
    gateObj.glyphObj = glyph;
  }

  // --- Defeat-enemy encounters (MECH-05) ---
  for (const e of g.enemies ?? []) {
    // CR-02: same apex-derived tall invisible blocker as doors/math-gates above — the
    // cosmetic ENEMY.H (32px) box alone is well under the ~97px jump apex, so a normal
    // running jump cleared the encounter entirely, skipping the required math-answer
    // interaction. Solid collider lives on this tall blocker (tagged "enemy", the tag
    // enemy.js listens for); the visible panel below is purely cosmetic with no
    // area()/body(), same split the door/math-gate use.
    const blockerH = Math.ceil((CONFIG.JUMP_FORCE ** 2) / (2 * CONFIG.GRAVITY)) + 64; // apex + margin
    const enemyObj = add([
      rect(CONFIG.ENEMY.W, blockerH),
      pos(e.x, e.y + CONFIG.ENEMY.H - blockerH),
      opacity(HIDDEN), // invisible — the visible panel below provides the art
      area(),
      body({ isStatic: true }),
      "enemy",
    ]);

    // Visible enemy panel — real animated sprite art (ART-05; Phase 33) replaces the
    // flat-color rect+glyph placeholder. CONFIG.ENEMY.SPRITES is now single-entry, but
    // existing level descriptors still carry variant:0/1/2 fields — modulo-safe index
    // keeps every variant value resolving to index 0 without touching level data.
    // x-offset centers the wider FRAME_W (64px) Hell hound frame over the unchanged
    // 32px-wide invisible blocker.
    const panel = add([
      sprite(CONFIG.ENEMY.SPRITES[(e.variant ?? 0) % CONFIG.ENEMY.SPRITES.length]),
      pos(e.x - (CONFIG.ENEMY.FRAME_W - CONFIG.ENEMY.W) / 2, e.y),
      "enemy-panel",
    ]);
    panel.play("idle"); // looping idle anim registered in main.js loadSprite

    enemyObj.panelObj = panel;
  }

  // --- Key/lock (mid-level NON-MATH gate seam; Phase 34.5, KEY-01/KEY-02) ---
  // The lock is a genuinely-solid apex-height wall (same door/math-gate/enemy
  // blocker split: invisible tall solid collider + a separate visible panel).
  // CONFIG.LOCK.W is load-bearing beyond visuals: scripts/lib/key-lock-check.mjs
  // partitions the reachability graph on an x-band of exactly this width, so the
  // blocker's footprint here MUST stay in sync with that config value.
  for (const l of g.locks ?? []) {
    const blockerH = Math.ceil((CONFIG.JUMP_FORCE ** 2) / (2 * CONFIG.GRAVITY)) + 64; // apex + margin
    const blocker = add([
      rect(CONFIG.LOCK.W, blockerH),
      pos(l.x, l.y + CONFIG.LOCK.H - blockerH),
      opacity(HIDDEN), // invisible — the visible panel below provides the art
      area(),
      body({ isStatic: true }),
      "lock",
    ]);

    // Visible lock panel — a COLORED-RECT placeholder (NOT sprite("door") — wrong
    // art — and NOT a new sprite, which would churn the asset manifest; real art
    // is Phase 35). Telegraphed, not secret: always visible, not opacity(HIDDEN).
    const panel = add([
      rect(CONFIG.LOCK.W, CONFIG.LOCK.H),
      pos(l.x, l.y),
      color(CONFIG.LOCK.PANEL_COLOR[0], CONFIG.LOCK.PANEL_COLOR[1], CONFIG.LOCK.PANEL_COLOR[2]),
      "lock-panel",
    ]);

    // Stash the panel on the blocker so key.js's lock-open branch destroys both
    // together (same idiom as the door blocker's blocker.panelObj above).
    blocker.panelObj = panel;

    // WR-01: stash the descriptor's keyId (or null for the common no-id single-
    // pair case) on the blocker so key.js's lock-open branch can check it holds
    // the MATCHING key, not just any key. Direct property assignment, same
    // pattern as panelObj above — no new component needed.
    blocker.keyId = l.keyId ?? null;
  }

  // --- Key (walk-through pickup; Phase 34.5, KEY-01) ---
  // Visible and telegraphed — CONTEXT locks "no hidden/secret keys" (unlike the
  // secretAlcove below, which IS a secret). The player walks THROUGH it (no
  // body() — pickup is wired via onCollide, not a blocker).
  for (const k of g.keys ?? []) {
    // Footprint-pinned to CONFIG.KEY.W/H (20px, load-bearing) via sprite({width,
    // height}) + a bare area() — same pinning idiom as the goal above (Phase
    // 34.6.1 Plan 03, D-04). NEVER scale() here. The DEBUG branch keeps its
    // magenta tint OVER the real sprite so ?debug=1 still marks keys; the
    // non-debug branch drops the old gold CONFIG.KEY.COLOR fill (now vestigial —
    // the sprite provides the art) but keeps full opacity.
    const keyObj = add([
      sprite("key", { width: CONFIG.KEY.W, height: CONFIG.KEY.H }),
      pos(k.x, k.y),
      area(),
      ...(DEBUG
        ? [color(255, 0, 255), opacity(0.8)] // bright magenta debug marker (alcove idiom)
        : [opacity(1)]),
      "key",
    ]);
    // WR-01: mirrors the lock blocker's keyId stash above — null for the common
    // no-id single-pair case.
    keyObj.keyId = k.keyId ?? null;
  }

  // --- Secret XP alcoves (LVL-06 — optional, silent, walk-through-only bonus) ---
  // No blocker collider, no visible panel, no glyph: this is a walk-through bonus, not
  // a barrier, unlike every other mechanic block above. Guarded with ?? [] so every
  // existing level (which has no secretAlcove key yet) still builds without error.
  // Invisible in normal play (it IS a secret); under ?debug=1 it renders as a bright
  // magenta marker so playtest/sign-off walkthroughs can find all 8 without reading
  // level data. Debug-only fill — the shipped game keeps the no-pink rule.
  for (const a of g.secretAlcove ?? []) {
    add([
      rect(CONFIG.ALCOVE_SIZE, CONFIG.ALCOVE_SIZE),
      pos(a.x, a.y),
      area(),
      ...(DEBUG ? [color(255, 0, 255), opacity(0.8)] : [opacity(0)]),
      "secret-alcove",
    ]);
  }

  // --- Decorative props (ART-06/ART-07; Phase 35 — optional, VISUAL-ONLY layer) ---
  // Reads levelData.props (a TOP-LEVEL descriptor field, NOT g.props) so the
  // validator's `geometry` object stays byte-frozen by construction — props are
  // structurally invisible to validate-levels.mjs / check-geometry-frozen.mjs.
  // Each prop is the ONLY pure sprite+pos+z entity class in this builder: NO
  // area(), NO body(), NO rect(), NO tall apex-blocker — that collider-freedom is
  // exactly what makes props validator-neutral (they can never gate a route).
  // Depth: on-surface props (layer "surface") sit at CONFIG.PROPS.Z_SURFACE,
  // everything else (background, the default) at CONFIG.PROPS.Z_BACK — BOTH
  // negative, so a prop can never occlude the z(0) player/coins/terrain/mechanics.
  // Guarded with ?? [] so the not-yet-dressed levels (no props field) still build.
  //
  // AMBIENT LIFE (MOT-03/MECH-05; Phase 36): a light-source prop (sprite key matching
  // LIGHT_RE — lantern|lamp|candle, ALL four biomes' light keys) gets a continuous
  // dt-sine FLICKER on its opacity: a pure `onUpdate` + `dt()` visual loop, NO scheduler
  // (SAFE-01), NO area()/body() (props stay collider-free — cosmetic only). The flicker
  // rides a per-light `litLevel` baseline (opacity = flicker * litLevel), so the MECH-05
  // alcove-linked light can start DIM and be brightened later without a second opacity
  // writer fighting this loop.
  //
  // MECH-05 link (no descriptor edit — reads EXISTING placed props/entities): the light
  // nearest a geometry.secretAlcove entry (within CONFIG.AMBIENT.LINK_DIST) is tagged
  // "alcove-light" and starts at litLevel DIM. 36-10 placed exactly one lantern directly
  // below the alcove in the swamp (level-01) and cemetery (level-06) biomes for this; every
  // other level's lights sit far from any alcove and flicker at full litLevel 1. game.js's
  // lightAmbient() tweens a tagged light's litLevel DIM -> 1 on discovery (or on entry when
  // already found — DERIVED from progress.hasSecretFound), positive-only.
  const LIGHT_RE = /lantern|lamp|candle/; // MOT-03 flicker selector — all 4 biomes' light keys
  const alcovesForLink = g.secretAlcove ?? [];
  for (const pr of levelData.props ?? []) {
    // POL-04 (Phase 39): an OPT-IN solid prop (barrel/crate) — the ONLY prop that gets
    // physics. A solid prop is never a light (mutually exclusive), so exclude it from the
    // flicker/alcove-light paths below. Collider dims come from a config/descriptor
    // PRIMARY source (pr.solidW/H, else CONFIG.PROPS.SOLID_W/H) — NEVER an async read of
    // the loaded sprite's width/height (Kaplay loads sprites async; the size may not be
    // readable here at construction time), and the SAME sizing the reachability model
    // (reachability.mjs solidBoxes) uses, so the built collider matches the checked box.
    const isSolid = pr.solid === true;
    const solidW = pr.solidW ?? CONFIG.PROPS.SOLID_W;
    const solidH = pr.solidH ?? CONFIG.PROPS.SOLID_H;
    const isLight = !isSolid && LIGHT_RE.test(pr.sprite);
    // A light is "alcove-linked" if it sits within LINK_DIST of any secret alcove.
    const linked =
      isLight &&
      alcovesForLink.some(
        (a) => Math.hypot(a.x - pr.x, a.y - pr.y) <= CONFIG.AMBIENT.LINK_DIST,
      );
    const propObj = add([
      sprite(pr.sprite),
      pos(pr.x, pr.y),
      // Solid props sit at play depth (SOLID_Z, z(0)) so they visually block; default
      // decoration props stay at the negative Z_SURFACE/Z_BACK depths (behind the player).
      z(
        isSolid
          ? CONFIG.PROPS.SOLID_Z
          : pr.layer === "surface"
            ? CONFIG.PROPS.Z_SURFACE
            : CONFIG.PROPS.Z_BACK,
      ),
      opacity(1),
      "prop",
      // Opt-in solid: static collider sized from the config/descriptor PRIMARY source
      // above (magic-number-free). Default props (no `solid`) add NO area()/body() — the
      // header invariant (props are the one pure sprite+pos+z entity class) holds for them.
      ...(isSolid
        ? [area({ shape: new Rect(vec2(0), solidW, solidH) }), body({ isStatic: true })]
        : []),
      // Tag alcove-linked lights so game.js's lightAmbient() can find + brighten them.
      ...(linked ? ["alcove-light"] : []),
    ]);

    if (isLight) {
      // litLevel: the flicker's brightness baseline. Alcove-linked lights start DIM (MECH-05,
      // brightened on discovery); every other light burns full (litLevel 1). Plain property
      // (not a component) — game.js's lightAmbient() tweens it up; this loop reads it.
      propObj.litLevel = linked ? CONFIG.AMBIENT.DIM : 1;
      let ft = 0; // closure-local phase accumulator PER prop — never module-level (anti-leak)
      propObj.onUpdate(() => {
        // dt-based, scheduler-free (SAFE-01). Two nested sines = an organic, non-periodic
        // flame flicker; multiplied by litLevel so a dim alcove light stays proportionally dim.
        ft += dt();
        const flick =
          CONFIG.AMBIENT.BASE +
          CONFIG.AMBIENT.AMP *
            (0.5 +
              0.5 * Math.sin(ft * CONFIG.AMBIENT.FREQ + Math.sin(ft * CONFIG.AMBIENT.FREQ2)));
        propObj.opacity = flick * propObj.litLevel;
      });
    }
  }

  // --- Moving platforms (MOT-02; Phase 36 — dt raised-cosine ping-pong, explicit carry) ---
  // Reads geometry.movers, a NEW motion key EXCLUDED from the check-geometry-frozen
  // snapshot (36-01) and read by the Phase-30 mover-reachability validator — so the
  // static geometry stays byte-frozen while movers are still reachability-checked.
  // Each mover is a solid body({isStatic:true}) ledge that oscillates between its two
  // descriptor endpoints. The oscillation is a dt-based RAISED-COSINE
  // ((1 - cos(2π t / period)) / 2): 0 → 1 → 0, so it reaches EXACTLY (x1,y1) at
  // phase 0 and (x2,y2) at phase 1 (the two points the validator tests) and eases to
  // REST at both ends. It is `onUpdate` + `dt()` ONLY — no setTimeout/wait/loop
  // scheduler (SAFE-01).
  //
  // EXPLICIT RIDER CARRY (2026-07-20 — reverses the Phase-36 "native carry" claim, which
  // a live Playwright probe on L8's moat ferry REFUTED): Kaplay 3001.0.19's body()
  // stickToPlatform does NOT reliably carry a rider on a pos-teleported static mover —
  // the rider drifted toward the trailing edge while the raised-cosine accelerated
  // (~17px lost in 0.6s) and the engine then dropped curPlatform entirely mid-ride,
  // freezing the rider while the deck sailed on (the play-test "I fall off the back"
  // report). So each frame this loop applies the deck's OWN (dx,dy) to any player
  // standing on the deck — detected geometrically (grounded + feet at deck top + center
  // over the padded span, the same predicate mechanic-drive.mjs's isOnMover ride proof
  // uses; curPlatform() is deliberately NOT trusted). Native stick is disabled on the
  // player body (player.js stickToPlatform: false), so this is the SINGLE carrier —
  // double-apply is impossible by construction.
  // Guarded with `?? []` so all currently-inert levels build unchanged.
  for (const m of g.movers ?? []) {
    const w = m.w ?? CONFIG.MOVER.WIDTH;
    const plat = add([
      sprite(m.sprite ?? CONFIG.MOVER.SPRITE, {
        frame: CONFIG.MOVER.FRAME, // PLATFORM ledge frame (2)
        tiled: true, // tile the 16px ledge frame across the ledge width
        width: w,
        height: CONFIG.MOVER.HEIGHT,
      }),
      pos(m.x1, m.y1),
      // Tightened collider: the opaque top LEDGE_H of the frame (its lower half is
      // transparent), mirroring the 16px static-platform collider so a rider stands on
      // the visible surface, not on empty space. Rect guarded at top of buildLevel.
      area({ shape: new Rect(vec2(0), w, CONFIG.MOVER.LEDGE_H) }),
      body({ isStatic: true }), // solid; stickToPlatform on the RIDER does the carry
      "mover",
    ]);
    const period = m.period ?? CONFIG.MOVER.PERIOD_S; // per-mover override allowed
    let t = 0; // closure-local PER mover — never module-level (anti-leak)
    plat.onUpdate(() => {
      // dt-based, scheduler-free (SAFE-01 clean). Raised-cosine eases at BOTH ends.
      t += dt();
      const phase = (1 - Math.cos(((2 * Math.PI) / period) * t)) / 2; // 0 → 1 → 0
      const nx = m.x1 + (m.x2 - m.x1) * phase;
      const ny = m.y1 + (m.y2 - m.y1) * phase;
      const ddx = nx - plat.pos.x; // this frame's deck delta — applied to riders below
      const ddy = ny - plat.pos.y;
      plat.pos.x = nx;
      plat.pos.y = ny;
      // Explicit rider carry (see the block comment above): any player standing on the
      // deck moves by EXACTLY the deck's delta this frame, so a rider standing anywhere
      // on the deck — including the trailing edge — tracks it perfectly at any ferry
      // speed. Rider dims come from the entity itself (16x32 area, pos = top-left), so
      // no player-size literal leaks in here; tolerances are CONFIG.MOVER tunables.
      for (const rider of get("player")) {
        if (!rider.isGrounded()) continue;
        const feet = rider.pos.y + rider.height;
        const cx = rider.pos.x + rider.width / 2;
        const onDeck =
          Math.abs(feet - plat.pos.y) <= CONFIG.MOVER.CARRY_TOL_Y &&
          cx >= plat.pos.x - CONFIG.MOVER.CARRY_PAD_X &&
          cx <= plat.pos.x + w + CONFIG.MOVER.CARRY_PAD_X;
        if (onDeck) {
          rider.pos.x += ddx;
          rider.pos.y += ddy;
        }
      }
    });
  }

  // --- Patrollers (MOT-01; Phase 36 — native patrol(), gentle respawn-hazard) ---
  // Reads geometry.patrollers (the second NEW motion key excluded from the freeze
  // snapshot). Each patroller is a slow, telegraphed walker driven by the engine's
  // built-in patrol() component (dt-based, scheduler-free) between its two waypoints
  // with endBehavior "ping-pong". Tagged "patroller" — DISTINCT from "enemy" (the
  // math-blocker tag enemy.js listens for); contact is routed to the respawn seam in
  // game.js, NOT the challenge seam. Uses the distinct 8-frame skeleton WALK sprite
  // baked + loaded by 36-10. Guarded with `?? []` so inert levels build unchanged.
  for (const p of g.patrollers ?? []) {
    const foe = add([
      sprite(p.sprite ?? CONFIG.PATROLLER.SPRITE), // per-patroller override, config default
      pos(p.x1, p.y1),
      area(),
      patrol({
        // FRESH per-patroller waypoints array literal — "ping-pong" reverses it in
        // place, so a shared array would corrupt every patroller (36-RESEARCH Pitfall 6).
        waypoints: [vec2(p.x1, p.y1), vec2(p.x2, p.y2)],
        speed: p.speed ?? CONFIG.PATROLLER.SPEED,
        endBehavior: "ping-pong", // perpetual back-and-forth (string literal, not the banned loop( call)
      }),
      "patroller", // DISTINCT from "enemy" — routes to respawn(), never the math seam
    ]);
    // VENDORED-ENGINE BUG WORKAROUND (Kaplay 3001.0.19, found Phase 39-06 via live
    // Playwright probe): the patrol() factory initializes its internal "finished" flag
    // as `s = opts.waypoints != null` — so a patroller CONSTRUCTED with waypoints is
    // born "finished" and its update() body never runs: every patroller since Phase 36
    // stood FROZEN at (x1,y1) (the kid's "stationary skeleton" report was this, not
    // slowness). The `waypoints` SETTER is the only path that re-arms the component
    // (it resets the waypoint cursor AND clears the finished flag), so re-assigning
    // the same fresh array through it starts the ping-pong walk. Probe-verified:
    // frozen without this line; full-sweep ping-pong with it. Do NOT remove on a
    // Kaplay upgrade without re-probing (and never upgrade Kaplay casually — CLAUDE.md).
    foe.waypoints = [vec2(p.x1, p.y1), vec2(p.x2, p.y2)];
    foe.play("walk"); // visible walk-cycle telegraph (the "walk" anim registered in main.js)
    // FACE THE TRAVEL DIRECTION (2026-07-20 play-test: "skeletons moonwalk" — the walk
    // sprite always faced one way, so the return leg of the ping-pong read as a
    // moonwalk). patrol() never sets flipX, so derive facing from the per-frame x
    // delta here. The baked patroller sheet's frames natively face LEFT (verified
    // against assets/patroller.png + a live-browser screenshot), so moving RIGHT
    // needs flipX = true and moving LEFT needs flipX = false; a zero delta (the
    // ping-pong turn instant / a paused frame) keeps the last facing. Closure-local
    // prevX PER patroller (anti-leak, mirrors the mover's `t`); `onUpdate` only —
    // no scheduler (SAFE-01).
    let prevX = foe.pos.x;
    foe.onUpdate(() => {
      const dxp = foe.pos.x - prevX;
      prevX = foe.pos.x;
      if (dxp > 0) foe.flipX = true; // art faces LEFT natively -> flip to face right
      else if (dxp < 0) foe.flipX = false; // native facing already looks left
    });
  }
}
