# Credits

Nox Run ships a small subset of third-party pixel art for its platformer levels.
**Every shipped asset is CC0 (Creative Commons Zero / Public Domain)** — verified at
each asset's own source page before vendoring. CC0 attribution is *optional*, but the
original authors are listed below as good practice.

Per-asset license proofs (source URL + the quoted CC0 declaration) live alongside the
art in [`assets/LICENSES/`](assets/LICENSES/). Each row below cross-matches one proof file.

## Assets

| Asset | File | Author | Source | License | Used for |
|-------|------|--------|--------|---------|----------|
| Pixel Platformer (grass/dirt tiles) | `assets/tiles/ground.png` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/pixel-platformer | CC0 | Ground/platform tileset — left/center/right/underside frames |
| 6 Color Dungeon 16x16 (spikes) | `assets/spike.png` | HorusKDI | https://opengameart.org/content/6-color-dungeon-16x16 | CC0 | Static spike hazard (routes to respawn) |
| 6 Color Dungeon 16x16 (skull flag) | `assets/goal.png` | HorusKDI | https://opengameart.org/content/6-color-dungeon-16x16 | CC0 | Goal flag (fires `onReachGoal`) |
| Platformer Characters (Adventurer) | `assets/player.png` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/platformer-characters | CC0 | Player character sprite sheet — idle/stand/walk/jump (5x16x32) |
| Rotating Coin | `assets/coin.png` | PuddinThur | https://opengameart.org/content/rotating-coin | CC0 | Collectible spinning-coin spritesheet (8 frames) |
| Background Elements (composited) | `assets/parallax/far.png` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/background-elements | CC0 | Parallax far layer — distant mountain silhouette |
| Background Elements (composited) | `assets/parallax/mid.png` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/background-elements | CC0 | Parallax mid layer — temple/castle/tower + hills horizon rhythm |
| Background Elements (composited) | `assets/parallax/near.png` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/background-elements | CC0 | Parallax near layer — subtle hills texture |
| Background Elements (composited) | `assets/tiles/title-bg.png` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/background-elements | CC0 | Title/select screen backdrop — castle + hills + clouds |
| monogram (pixel font) | `assets/_font-src/monogram.ttf` | datagoblin | https://datagoblin.itch.io/monogram | CC0 | Baked into `assets/logo-hero.png`/`assets/logo-badge.png` — the "NOX RUN" title/select wordmark |
| Retro Sounds (jump1) | `assets/sfx/jump.ogg` | Kenney (Kenney Vleugels) | https://gamesounds.xyz/?dir=Kenney%27s+Sound+Pack%2FRetro+Sounds+1 | CC0 | Jump SFX — short 8-bit spring "boing" on the player's jump-key press (final pick after click_001 and select_001, chosen by ear at the 27-07 human sound sign-off) |
| Impact Sounds (footstep_grass_001) | `assets/sfx/land.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/impact-sounds | CC0 | Landing SFX — soft footstep thud |
| Interface Sounds (confirmation_002) | `assets/sfx/correct.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | CC0 | Correct-answer SFX — bright-but-soft ascending chime, the one shared challenge seam |
| Interface Sounds (back_001) | `assets/sfx/wrong.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | CC0 | Wrong-answer SFX — soft, neutral decaying-tick tone (never a buzzer/alarm) |
| Interface Sounds (open_001) | `assets/sfx/door.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | CC0 | Door/gate-unlock SFX — short distinct upward sweep |
| Interface Sounds (maximize_002) | `assets/sfx/clear.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | CC0 | Level-clear SFX — calm, non-fanfare resolve swell |
| Interface Sounds (pluck_001) | `assets/sfx/pickup.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | CC0 | Pickup/collect SFX — light plucked pop |
| Music Loops (Flowing Rocks) | `assets/music/ambient.ogg` | Kenney (Kenney Vleugels) | https://gamesounds.xyz/?dir=Kenney%27s+Sound+Pack%2FMusic+Loops%2FLoops | CC0 | Ambient music loop — the one calm bed for the entire game (supersedes "Calm Loop" by wipics, ~19.4s; re-picked at the 27-07 human sign-off for a longer ~30.8s loop) |
| Gothicvania Swamp (terrain/parallax/player) | `assets/tiles/atlas-swamp.png, assets/parallax/far-swamp.png, assets/parallax/mid-swamp.png, assets/parallax/near-swamp.png, assets/player-swamphunter.png` | ansimuz (Luis Zuno) | https://opengameart.org/sites/default/files/gothicvania_swamp_files.zip | CC0 | Levels 1-2 swamp biome terrain atlas, 3-layer parallax, and the player character sprite sheet (ships across all 4 biomes) |
| Gothicvania Town (terrain + dusk sky) | `assets/tiles/atlas-town.png, assets/parallax/far-town.png` | ansimuz (Luis Zuno) | https://opengameart.org/sites/default/files/gothicvania-town-files.zip | CC0 | Levels 3-4 town biome terrain atlas and dusk-sky parallax far layer (hue-conformed — the pack's native salmon-pink sky was retinted steel-blue per the no-pink rule) |
| Gothicvania Patreon Collection (night-town layers, castle env, hell hound, door) | `assets/parallax/mid-town.png, assets/parallax/near-town.png, assets/parallax/far-castle.png, assets/parallax/mid-castle.png, assets/enemy-hellhound.png, assets/tiles/atlas-castle.png, assets/door.png` | ansimuz (Luis Zuno) | https://opengameart.org/sites/default/files/%20gothicvania%20patreon%20collection.zip | CC0 | Levels 3-4 night-town parallax detail layers, levels 7-8 castle biome parallax (exterior + interior) and terrain atlas, the castle biome enemy sprite (static, idle-only this phase), and the locked-door barrier sprite (native-color castle-interior wooden-door crop, Phase 33) |
| Gothicvania Cemetery | `assets/tiles/atlas-cemetery.png, assets/parallax/far-cemetery.png, assets/parallax/mid-cemetery.png, assets/parallax/near-cemetery.png` | ansimuz (Luis Zuno) | https://opengameart.org/sites/default/files/gothicvania-cemetery-files_1.zip | CC0 | Levels 5-6 cemetery biome terrain atlas and 3-layer parallax (horizon glow hue-conformed — the pack's native magenta glow was retinted cold-blue per the no-pink rule) |
| Gothicvania Church (castle interior accent, math-gate) | `assets/parallax/near-castle.png, assets/math-gate.png` | ansimuz (Luis Zuno) | https://opengameart.org/sites/default/files/gothicvania%20church%20files.zip | CC0 | Levels 7-8 castle biome — church interior background accent, folded in as the castle biome's near parallax layer (per the "3-4 biomes covering 8 levels" requirement — Church does not ship as its own biome); also the math-gate mechanic panel (barred iron-lattice window + cross plaque crop, Phase 33) |

## Notes

- **No vendor logos or brand art ship** in the asset subset. Each PNG is a single
  cropped pixel-art game tile/sprite — no company marks, watermarks, or splash logos.
- `assets/spike.png` and `assets/goal.png` are cropped from one tile sheet
  (`16x16 dungeon tiles.png`) of the **6 Color Dungeon 16x16** pack — the exact
  tile coordinates are recorded in each proof file under `assets/LICENSES/`.
- `assets/coin.png` re-lays out the original "Rotating Coin" frames into an evenly-gridded
  256x32 horizontal strip (8 uniform 32px cells) for `loadSprite(..., { sliceX: 8 })`.
  This is a mechanical re-grid of the same CC0 pixels — still CC0/public-domain.
- A separate OpenGameArt page, `spinning-coin-0` (author *magdum*), was evaluated and
  **rejected**: it is CC-BY-SA 3.0, not CC0, and was **not** used.
- `assets/_font-src/monogram.ttf` was vendored from `monogram-extended.ttf` — an
  officially-listed companion file on the same CC0 "monogram" product page (a
  superset-glyph-coverage variant, not a different font), fetched via the page's own
  embedded `@font-face` URL rather than its base file's interactive purchase-flow
  download. Full provenance in `assets/LICENSES/monogram.txt`.
- **Phase 20 correction:** Phase 18 (v4.0) silently replaced the real, CC0-sourced
  `player.png`/`ground.png` above with procedurally-generated placeholder art
  (`scripts/generate-art-assets.py` drawing flat rectangles + random noise), while
  this file kept crediting the original HorusKDI crops as if they were still the
  shipped pixels. Phase 20 (v4.1) corrects the record: both assets are now real,
  licensed CC0 art from Kenney (see rows above and `assets/LICENSES/player.txt` /
  `ground.txt`), built through a reproducible pipeline
  (`scripts/build-art-assets.py`) instead of drawn procedurally.
- **Phase 27 (audio):** Kenney's "Music Jingles" pack (CC0, 85 files) was
  downloaded and inventoried as the first candidate for `assets/music/ambient.ogg`
  but **rejected** — its longest file measured 1.76s, far too short for a
  persistent ambient loop. The OpenGameArt.org fallback ("Calm Loop" by wipics)
  was used instead at ship time, per the same "verify License(s) on the
  asset's own page before vendoring" discipline used throughout this file. At
  the 27-07 human sound sign-off, "Calm Loop" (19.4s) was found to feel
  repetitive on loop; Kenney's actual "Music Loops" pack — the pack
  27-RESEARCH.md had originally flagged as a candidate before Music Jingles
  was checked instead — was located via the gamesounds.xyz CC0 mirror (Kenney's
  current site no longer lists this pack under its old slug) and "Flowing
  Rocks" (~30.8s, CC0, license verified) was picked by ear from 2 longer
  candidates and now ships instead (see row above).
- **Phase 31 (Gothicvania biome/character art):** the 5 Gothicvania packs
  (Swamp, Town, Cemetery, Church, Patreon Collection) are the first fully
  style-coherent, single-artist collection vendored in this project — all
  authored by ansimuz (Luis Zuno) in one consistent Castlevania-register
  style, superseding the "grab whatever's CC0" mixed-source approach of
  Phases 18/20/26. Each pack also bundles CC-BY music by Pascal Belisle
  ("Music License"/"Demo Music" credit sections in the packs' own
  `public-license.txt` files) — this music was explicitly **NOT** vendored;
  Phase 27 already owns this game's audio, and CC-BY-licensed content is not
  vendorable under this project's CC0-only art discipline. The raw pack
  files (zips + extracted trees) live in a gitignored
  `assets/_gothicvania-src/` scratch directory, never committed, and are
  re-fetchable any time from the 5 source URLs listed in the rows above.

## License reference

CC0 1.0 Universal — Public Domain Dedication:
https://creativecommons.org/publicdomain/zero/1.0/
