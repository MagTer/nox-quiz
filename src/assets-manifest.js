// src/assets-manifest.js — the single source of truth for every asset path
// this game loads (Phase 32 Plan 01, ART-02/ART-03).
//
// PURE DATA MODULE: zero imports, zero engine globals — safe to import from
// both Node (scripts/check-assets-manifest.mjs) and the browser (src/main.js,
// wired in Plan 32-04) with no side effects. `path` values are repo-root-
// relative (the `assets/...` convention main.js's existing loads already use
// before the `../` prefix is applied at the call site).
//
// 61 entries total, grouped by `kind`:
//   biome-atlas (4)  — Phase-31-baked 2-frame cap+fill ground atlases
//   biome-bg    (12) — Phase-31-baked per-biome parallax layers (far/mid/near x 4 biomes)
//   sprite      (11) — plain single-argument loadSprite calls, gate coverage only
//   sprite-anim (4)  — sliceX+anims sprites, gate coverage only (+patroller, Phase 36)
//   sound       (7)  — loadSound calls, gate coverage only
//   music       (1)  — loadMusic call, gate coverage only
//   prop        (22) — Phase-35-baked decorative props (swamp x4 + cemetery x7 +
//                      town x5 + castle x4) + Phase-36 light-source props
//                      (swamp-lantern + cemetery-lantern), loaded as single
//                      static frames by main.js's kind:"prop" branch

export const ASSETS_MANIFEST = [
  // --- biome-atlas: 4 entries ---
  { key: "atlas-swamp", path: "assets/tiles/atlas-swamp.png", kind: "biome-atlas" },
  { key: "atlas-town", path: "assets/tiles/atlas-town.png", kind: "biome-atlas" },
  { key: "atlas-cemetery", path: "assets/tiles/atlas-cemetery.png", kind: "biome-atlas" },
  { key: "atlas-castle", path: "assets/tiles/atlas-castle.png", kind: "biome-atlas" },

  // --- biome-bg: 12 entries (far/mid/near x swamp/town/cemetery/castle) ---
  { key: "bg-far-swamp", path: "assets/parallax/far-swamp.png", kind: "biome-bg" },
  { key: "bg-mid-swamp", path: "assets/parallax/mid-swamp.png", kind: "biome-bg" },
  { key: "bg-near-swamp", path: "assets/parallax/near-swamp.png", kind: "biome-bg" },
  { key: "bg-far-town", path: "assets/parallax/far-town.png", kind: "biome-bg" },
  { key: "bg-mid-town", path: "assets/parallax/mid-town.png", kind: "biome-bg" },
  { key: "bg-near-town", path: "assets/parallax/near-town.png", kind: "biome-bg" },
  { key: "bg-far-cemetery", path: "assets/parallax/far-cemetery.png", kind: "biome-bg" },
  { key: "bg-mid-cemetery", path: "assets/parallax/mid-cemetery.png", kind: "biome-bg" },
  { key: "bg-near-cemetery", path: "assets/parallax/near-cemetery.png", kind: "biome-bg" },
  { key: "bg-far-castle", path: "assets/parallax/far-castle.png", kind: "biome-bg" },
  { key: "bg-mid-castle", path: "assets/parallax/mid-castle.png", kind: "biome-bg" },
  { key: "bg-near-castle", path: "assets/parallax/near-castle.png", kind: "biome-bg" },

  // --- sprite: 11 entries, gate coverage only ---
  { key: "bg-far", path: "assets/parallax/far.png", kind: "sprite" },
  { key: "bg-mid", path: "assets/parallax/mid.png", kind: "sprite" },
  { key: "bg-near", path: "assets/parallax/near.png", kind: "sprite" },
  { key: "spike", path: "assets/spike.png", kind: "sprite" },
  { key: "goal", path: "assets/goal.png", kind: "sprite" },
  { key: "key", path: "assets/key.png", kind: "sprite" },
  { key: "title-bg", path: "assets/tiles/title-bg.png", kind: "sprite" },
  { key: "logo-hero", path: "assets/logo-hero.png", kind: "sprite" },
  { key: "logo-badge", path: "assets/logo-badge.png", kind: "sprite" },
  { key: "door", path: "assets/door.png", kind: "sprite" },
  { key: "math-gate", path: "assets/math-gate.png", kind: "sprite" },

  // --- sprite-anim: 3 entries, gate coverage only ---
  { key: "player", path: "assets/player-swamphunter.png", kind: "sprite-anim" },
  { key: "coin", path: "assets/coin.png", kind: "sprite-anim" },
  { key: "enemy-hellhound", path: "assets/enemy-hellhound.png", kind: "sprite-anim" },
  // Phase 36 (MOT-01): cosmetic ambient patroller — a shambling biped skeleton
  // walk cycle (8 frames), distinct from the quadruped idle-only enemy-hellhound.
  { key: "patroller", path: "assets/patroller.png", kind: "sprite-anim" },

  // --- sound: 7 entries, gate coverage only ---
  { key: "jump", path: "assets/sfx/jump.ogg", kind: "sound" },
  { key: "land", path: "assets/sfx/land.ogg", kind: "sound" },
  { key: "correct", path: "assets/sfx/correct.ogg", kind: "sound" },
  { key: "wrong", path: "assets/sfx/wrong.ogg", kind: "sound" },
  { key: "door", path: "assets/sfx/door.ogg", kind: "sound" },
  { key: "clear", path: "assets/sfx/clear.ogg", kind: "sound" },
  { key: "pickup", path: "assets/sfx/pickup.ogg", kind: "sound" },

  // --- music: 1 entry, gate coverage only ---
  { key: "ambient", path: "assets/music/ambient.ogg", kind: "music" },

  // --- prop: 20 entries (Phase 35 — swamp x4 + cemetery x7 + town x5 + castle x4) ---
  // Baked from the vendored, already-licensed Gothicvania packs by
  // scripts/build-art-assets.py::build_props(); loaded via main.js kind:"prop".
  // swamp/cemetery/castle are native color (all under the pink gate); town
  // carries the board's steel-blue-night no-pink pass (215,255,-60) — the town
  // pack ships a salmon dusk tint that trips the gate natively.
  { key: "prop-swamp-tree", path: "assets/props/swamp-tree.png", kind: "prop" },
  { key: "prop-swamp-reed", path: "assets/props/swamp-reed.png", kind: "prop" },
  { key: "prop-swamp-vine", path: "assets/props/swamp-vine.png", kind: "prop" },
  { key: "prop-swamp-fern", path: "assets/props/swamp-fern.png", kind: "prop" },
  // Phase 36 light-source (MOT-03/MECH-05): a bog will-o'-wisp (flaming skull).
  { key: "prop-swamp-lantern", path: "assets/props/swamp-lantern.png", kind: "prop" },
  { key: "prop-cemetery-statue", path: "assets/props/cemetery-statue.png", kind: "prop" },
  { key: "prop-cemetery-stone-1", path: "assets/props/cemetery-stone-1.png", kind: "prop" },
  { key: "prop-cemetery-stone-2", path: "assets/props/cemetery-stone-2.png", kind: "prop" },
  { key: "prop-cemetery-stone-3", path: "assets/props/cemetery-stone-3.png", kind: "prop" },
  { key: "prop-cemetery-stone-4", path: "assets/props/cemetery-stone-4.png", kind: "prop" },
  { key: "prop-cemetery-tree", path: "assets/props/cemetery-tree.png", kind: "prop" },
  { key: "prop-cemetery-bush", path: "assets/props/cemetery-bush.png", kind: "prop" },
  // Phase 36 light-source (MOT-03/MECH-05): a grave candle/lantern (Church-pack
  // altar-candle crop — a gothic grave/altar light, biome-coherent for a cemetery).
  { key: "prop-cemetery-lantern", path: "assets/props/cemetery-lantern.png", kind: "prop" },
  // town (levels 3-4) — pre-sliced street clutter, board steel-blue-night retint
  { key: "prop-town-barrel", path: "assets/props/town-barrel.png", kind: "prop" },
  { key: "prop-town-crate", path: "assets/props/town-crate.png", kind: "prop" },
  { key: "prop-town-street-lamp", path: "assets/props/town-street-lamp.png", kind: "prop" },
  { key: "prop-town-well", path: "assets/props/town-well.png", kind: "prop" },
  { key: "prop-town-sign", path: "assets/props/town-sign.png", kind: "prop" },
  // castle (levels 7-8) — Church-pack pillar + single-panel tileset crops, native
  { key: "prop-castle-column", path: "assets/props/castle-column.png", kind: "prop" },
  { key: "prop-castle-candles", path: "assets/props/castle-candles.png", kind: "prop" },
  { key: "prop-castle-candle-stand", path: "assets/props/castle-candle-stand.png", kind: "prop" },
  { key: "prop-castle-arch", path: "assets/props/castle-arch.png", kind: "prop" },
];
