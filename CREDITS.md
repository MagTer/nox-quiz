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
| 6 Color Dungeon 16x16 (gate/archway) | `assets/door.png` | HorusKDI | https://opengameart.org/content/6-color-dungeon-16x16 | CC0 | Locked door barrier sprite |
| New Platformer Pack (saw/barnacle/fly enemies) | `assets/enemy-1.png, assets/enemy-2.png, assets/enemy-3.png` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/new-platformer-pack | CC0 | Defeat-enemy encounter sprites — 3 variants |
| monogram (pixel font) | `assets/_font-src/monogram.ttf` | datagoblin | https://datagoblin.itch.io/monogram | CC0 | Baked into `assets/logo-hero.png`/`assets/logo-badge.png` — the "NOX RUN" title/select wordmark |
| Interface Sounds (select_001) | `assets/sfx/jump.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | CC0 | Jump SFX — short soft blip on the player's jump-key press (supersedes click_001, re-picked at the 27-07 human sound sign-off) |
| Impact Sounds (footstep_grass_001) | `assets/sfx/land.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/impact-sounds | CC0 | Landing SFX — soft footstep thud |
| Interface Sounds (confirmation_002) | `assets/sfx/correct.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | CC0 | Correct-answer SFX — bright-but-soft ascending chime, the one shared challenge seam |
| Interface Sounds (back_001) | `assets/sfx/wrong.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | CC0 | Wrong-answer SFX — soft, neutral decaying-tick tone (never a buzzer/alarm) |
| Interface Sounds (open_001) | `assets/sfx/door.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | CC0 | Door/gate-unlock SFX — short distinct upward sweep |
| Interface Sounds (maximize_002) | `assets/sfx/clear.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | CC0 | Level-clear SFX — calm, non-fanfare resolve swell |
| Interface Sounds (pluck_001) | `assets/sfx/pickup.ogg` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/interface-sounds | CC0 | Pickup/collect SFX — light plucked pop |
| Calm Loop | `assets/music/ambient.ogg` | wipics | https://opengameart.org/content/calm-loop | CC0 | Ambient music loop — the one calm bed for the entire game |

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
- `assets/enemy-1.png`, `assets/enemy-2.png`, `assets/enemy-3.png` (saw/barnacle/fly) were
  hand-picked from the **New Platformer Pack**'s larger `Sprites/Enemies/Default/` roster
  (which also includes worm/snail/slime variants) for a mechanical/monster/insect thematic
  spread — following the same "no vendor logos, single cropped tile" discipline as every
  other asset in this file.
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
  persistent ambient loop. The OpenGameArt.org fallback ("Calm Loop" by wipics,
  see row above) was used instead, per the same "verify License(s) on the
  asset's own page before vendoring" discipline used throughout this file.

## License reference

CC0 1.0 Universal — Public Domain Dedication:
https://creativecommons.org/publicdomain/zero/1.0/
