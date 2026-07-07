# v6.0 Asset Scouting Report — "SNES-Fidelity World"

**Scouted:** 2026-07-07, outside the GSD harness by explicit user authorization (pre-work
for SEED-001, done in parallel with Phase 26 execution). Feeds v6.0's ART-01 phase.

**Method:** live web scouting (itch.io + OpenGameArt), license verification on the actual
pack pages/files, full download of every shortlisted pack, and visual inspection of
tilesets/backgrounds/characters. Preview crops are committed alongside this doc.

---

## Recommendation (Option 1): the Gothicvania family — ansimuz, all CC0

One artist, one Castlevania-register style, **CC0 (public domain, verified in each
zip's `public-license.txt` and on the OpenGameArt pages)** — the itch.io versions of
these same packs are now mostly paid, but ansimuz mirrors them free on OpenGameArt.
Covers 4 distinct dark biomes plus heroes, enemies, and layered parallax backgrounds.
16×16 tile grids — exactly matching `CONFIG.TILE_SIZE`.

| Pack | OGA download | Gives us |
|------|-------------|----------|
| Gothicvania Swamp | `https://opengameart.org/sites/default/files/gothicvania_swamp_files.zip` | Dark-forest/swamp biome: 3 loopable bg layers, 16×16 tileset, male hunter player (9 anims), 3 animated enemies (spider, swamp thing, ghost), FX |
| Gothicvania Town | `https://opengameart.org/sites/default/files/gothicvania-town-files.zip` | Dusk town biome: 2-layer parallax, tileset, houses/props, 4 animated NPC townsfolk |
| Gothicvania Cemetery | `https://opengameart.org/sites/default/files/gothicvania-cemetery-files_1.zip` | Graveyard biome: 3 loopable bgs, 16×16 tileset, player (6 anims), 3 animated enemies, 10 props |
| Gothicvania Church | `https://opengameart.org/sites/default/files/gothicvania%20church%20files.zip` | Gothic interior accents: tileset, backgrounds, player, wizard/ghoul/angel enemies |
| Gothicvania Patreon Collection (13 packs) | `https://opengameart.org/sites/default/files/%20gothicvania%20patreon%20collection.zip` | **Gothic Castle env + Old Dark Castle interior tilesets** (castle biome), **Gothic Hero** (12-frame run, idle/jump/attack), night-town parallax layers, and an enemy bestiary: flying demon, fire skull, dark ghost, hell beast, hell hound, nightmare creature, running wolf |

### Proposed biome → level mapping (Castlevania arc, calm → harsh)

| Levels | Biome | Source packs |
|--------|-------|--------------|
| 1–2 | Swamp / dark forest | Swamp |
| 3–4 | Town at dusk/night | Town + collection's night-town layers |
| 5–6 | Cemetery | Cemetery (+ Moon Graveyard backdrop accents, see Option 3) |
| 7–8 | Castle | Collection's Gothic Castle + Old Dark Castle + Church accents |

### Mechanic/motion coverage

- **Player (ART-04):** three candidates for her sign-off — Gothic Hero (caped, red/gold,
  12-frame run), Swamp hunter (9 anims), Cemetery player (6 anims). All ~40–48px tall
  vs. the current 16×32 collider: keep the physics hitbox, render the sprite larger
  (style-board phase must verify visual clipping on low ceilings).
- **Patrol enemies (MOT-01):** hell hound and running wolf are literal ground runners
  with run cycles; spider/ghost/demon give air/float variety.
- **Blocker enemies + doors (ART-05):** church/castle packs include doors, gates,
  statues; every enemy has idle frames for stationary math-blockers.
- **Props (ART-06, MOT-03):** torches/candles/lamps appear across town/church/castle
  packs; cemetery has 10 standalone props.

### Known gaps / flags

1. **Town dusk sky is salmon-pink** — violates the no-pink rule as-is. The Pillow
   pipeline must hue-shift it (rust/steel direction). Everything else surveyed is
   already dark green/blue/grey.
2. **Music inside the zips is CC-BY (Pascal Belisle)** — do NOT vendor the music;
   Phase 27 owns audio. Art is CC0; the music is the only attribution-bound content.
3. **Pack-to-pack palette drift** (same artist, different years) — the style board must
   prove biomes read as one game; minor palette-conform pass may be needed.
4. **No numeral/HUD glyphs** — keep the existing monogram font path for UI/wordmark.

---

## Option 2 (runner-up): Legacy Fantasy — High Forest (anokolisa, free)

`https://anokolisa.itch.io/sidescroller-pixelart-sprites-asset-pack-forest-16x16`
(downloaded via itch; 600+ sprites, 16×16, forest/ruins/lake/cave, animated warrior +
3 enemies, props, HUD). Beautiful and cohesive, BUT: **bright daylight register**
(cyan sky, lush greens, cute mushrooms) — fighting the dark-grunge constitution would
mean a global darkening retint with real mud risk. **No license file found inside the
zip**; the itch page says free-for-commercial. Verdict: keep as fallback, or quarry
individual props after a dark retint. Not the anchor.

## Option 3 (accent source): Moon Graveyard (anokolisa, free)

`https://anokolisa.itch.io/moon-graveyard` — near Symphony-of-the-Night quality
cemetery art, but **32×32 tiles** (grid mismatch with build.js's 16px step). Use is
limited to **parallax/backdrop material** (backgrounds don't care about the tile
grid) behind Cemetery-pack terrain. License: page says free for commercial use; no
license file in zip — treat as accent-only pending clarification.

## Rejected

- **Warped Caves (ansimuz, CC0):** heavy magenta/pink-purple identity — fails no-pink
  at the pack level; retinting would fight its entire palette.
- **RottingPixels 16×16 tileset family:** fine filler tiles (castle/cave/dungeon/
  nature, permissive custom license) but tiles-only (no bgs/enemies) and a flatter,
  simpler style than Gothicvania — would drag fidelity back down.
- **vnitti parallax packs:** high quality but bright/naturalistic; style clash.
- **Gothicvania itch.io collection ($83) / anokolisa Fantasy VL.I ($5/pack):** paid —
  excluded by the locked CC0/CC-BY decision (note: the OGA CC0 mirrors made the
  paid-vs-free question moot for the Gothicvania core).

## Downloads

All shortlisted zips were downloaded and extracted for inspection in this session's
scratchpad (`scouting/`). Nothing is vendored into `assets/` yet — that is v6.0
phase-1 work (with `assets/LICENSES/` + `CREDITS.md` entries). Every pack above is
re-fetchable from the stable OGA URLs in the table; itch.io packs (Options 2/3) can be
re-downloaded via the page's Download button (a session-key fetch script from this
scouting session is preserved in the scratchpad but the URLs are the durable record).

## Preview images (committed next to this doc)

- `preview-swamp.png` — Swamp pack full scene (player + enemies in situ)
- `preview-town.png` — Town tileset/props scene (note the pink-leaning sky)
- `preview-cemetery-bg.png` — Cemetery background layer
- `preview-gothic-castle.png` — Gothic Castle environment (levels 7–8 register)
- `preview-gothic-hero-run.png` — Gothic Hero 12-frame run cycle
- `preview-moon-graveyard.png` — Moon Graveyard (Option 3 accent quality bar)
- `preview-legacy-fantasy-tiles.png` — Legacy Fantasy tiles (Option 2, brighter register)
