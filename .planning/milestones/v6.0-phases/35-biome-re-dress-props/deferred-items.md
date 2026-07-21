# Phase 35 — Deferred / Out-of-Scope Items

Logged per the executor SCOPE BOUNDARY rule (do not fix here; surface for the owning workflow).

## build_enemies() regenerates retired enemy-1/2/3.png (pre-existing, unrelated to Plan 08)

- **Found during:** 35-08 Task 1 (running `python3 scripts/build-art-assets.py`).
- **Observation:** `enemy-1.png` / `enemy-2.png` / `enemy-3.png` were deliberately RETIRED from
  git in commit `7ab5a4d` ("chore(33-01): ... retire dead enemy-1/2/3 PNGs"), but `build_enemies()`
  is still wired into the `__main__` bake sequence, so every full bake re-creates them as untracked
  files in `assets/`. They are not referenced by `assets-manifest.js` (manifest gate green at 58
  assets) and the game uses `enemy-hellhound` instead.
- **Why not fixed here:** Out of scope for Plan 08 (dead tint-theme cleanup + coin-pop restyle +
  closeout). Removing `build_enemies()`/its `__main__` call is an enemy-asset concern, not a
  theme-N concern. No tracked drift results; the files are simply left untracked.
- **Suggested owner:** a future art/bake-cleanup pass (mirror the theme-N deletion pattern:
  drop `build_enemies()` + its `__main__` line once confirmed no consumer).

## Local build-source layout note (dev-host only, not a repo issue)

- The castle/church CC0 pack on this dev host is nested one extra level deeper
  (`_gothicvania-src/gothicvania-church-files/gothicvania church files/...`) than
  `build-art-assets.py` expects (`_gothicvania-src/gothicvania church files/...`). A local,
  gitignored symlink was created under `_gothicvania-src/` to let the bake complete for
  verification. `_gothicvania-src/` is gitignored (build-source only), so this is an
  environment setup detail, not a code change.
