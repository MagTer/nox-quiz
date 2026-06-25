# Credits

Math Lab ships a small subset of third-party pixel art for its platformer level.
**Every shipped asset is CC0 (Creative Commons Zero / Public Domain)** — verified at
each asset's own source page before vendoring. CC0 attribution is *optional*, but the
original authors are listed below as good practice.

Per-asset license proofs (source URL + the quoted CC0 declaration) live alongside the
art in [`assets/LICENSES/`](assets/LICENSES/). Each row below cross-matches one proof file.

## Assets

| Asset | File | Author | Source | License | Used for |
|-------|------|--------|--------|---------|----------|
| 6 Color Dungeon 16x16 (brick tile) | `assets/tiles/ground.png` | HorusKDI | https://opengameart.org/content/6-color-dungeon-16x16 | CC0 | Solid ground / platform tile |
| 6 Color Dungeon 16x16 (spikes) | `assets/spike.png` | HorusKDI | https://opengameart.org/content/6-color-dungeon-16x16 | CC0 | Static spike hazard (routes to respawn) |
| 6 Color Dungeon 16x16 (skull flag) | `assets/goal.png` | HorusKDI | https://opengameart.org/content/6-color-dungeon-16x16 | CC0 | Goal flag (fires `onReachGoal`) |
| 6 Color Dungeon 16x16 (figure) | `assets/player.png` | HorusKDI | https://opengameart.org/content/6-color-dungeon-16x16 | CC0 | Player character sprite (16x32) |
| Rotating Coin | `assets/coin.png` | PuddinThur | https://opengameart.org/content/rotating-coin | CC0 | Collectible spinning-coin spritesheet (8 frames) |

## Notes

- **No vendor logos or brand art ship** in the asset subset. Each PNG is a single
  cropped pixel-art game tile/sprite — no company marks, watermarks, or splash logos.
- `assets/tiles/ground.png`, `assets/spike.png`, `assets/goal.png`, and
  `assets/player.png` are cropped from one tile sheet (`16x16 dungeon tiles.png`) of the
  **6 Color Dungeon 16x16** pack — the exact tile coordinates are recorded in each
  proof file under `assets/LICENSES/`.
- `assets/coin.png` re-lays out the original "Rotating Coin" frames into an evenly-gridded
  256x32 horizontal strip (8 uniform 32px cells) for `loadSprite(..., { sliceX: 8 })`.
  This is a mechanical re-grid of the same CC0 pixels — still CC0/public-domain.
- A separate OpenGameArt page, `spinning-coin-0` (author *magdum*), was evaluated and
  **rejected**: it is CC-BY-SA 3.0, not CC0, and was **not** used.

## License reference

CC0 1.0 Universal — Public Domain Dedication:
https://creativecommons.org/publicdomain/zero/1.0/
