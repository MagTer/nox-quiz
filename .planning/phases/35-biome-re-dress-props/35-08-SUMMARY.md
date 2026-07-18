---
phase: 35-biome-re-dress-props
plan: 08
subsystem: art-bake-cleanup + fx-restyle + phase-closeout
status: complete
tags: [theme-cleanup, dead-code-removal, coin-pop, fx, geometry-freeze, closeout, ART-06, ART-07]
requires:
  - "scripts/build-art-assets.py — the LIVE biome/prop bake path (build_ground/build_parallax/build_biome_*/_bake_biome_atlas) left untouched"
  - "src/fx.js pop() — the shared collect-flourish seam (coin/key/alcove call sites unchanged)"
  - "scripts/check-geometry-frozen.mjs + fixtures/geometry-frozen-baseline.json — the byte-frozen proof (Plan 01)"
  - "scripts/screenshot-phase35-props.mjs — the all-8 evidence capture (Plan 01)"
provides:
  - "A theme-N-free bake: no build_ground_theme/build_parallax_theme/THEME_PALETTES/_THEME_ACCENTS/_accent_sub family; no orphaned *theme*.png regenerate"
  - "CONFIG.FX.{POP_SPARK_COUNT, POP_SPARK_SIZE, POP_SPARK_DIST} — coin-collect twinkle tunables"
  - "A restyled fx.pop() — dark-grunge glint (rotated-diamond core + radiating diamond sparks) replacing the flat neon rect"
  - "Phase-35 closeout evidence: full gate suite + geometry-freeze green + all-8 spot-check screenshots"
affects:
  - "Every fx.pop() call site (coin collect, key pickup, secret alcove) now shows the twinkle — signature/z/'fx' tag unchanged so no call site edited"
  - "Phase 35 is provably closed: all 8 levels dressed, geometry byte-frozen, dead theme code gone — ready for /gsd-verify-work"
tech-stack:
  added: []
  patterns:
    - "Dead-bake-code deletion: grep-confirm no callers → remove def + its __main__ call → re-bake and confirm no orphan PNGs regenerate (Pitfall 5)"
    - "fx twinkle = multi-particle radial burst mirroring dust()'s per-particle self-cleaning tween().onEnd idiom (no scheduler)"
    - "45°-rotated rect() = diamond/glint — turns a placeholder-reading box into an intentional spark"
key-files:
  created: []
  modified:
    - scripts/build-art-assets.py
    - src/main.js
    - src/levels/build.js
    - scripts/screenshot-phase26.mjs
    - src/fx.js
    - src/config.js
decisions:
  - "KEEP the Python ACCENT_MOSS..ACCENT_EMBER tuples (now orphaned) per the plan's explicit delete-list scope — they mirror CONFIG.PALETTE.ACCENT_* (retained for check-contrast.mjs); deleting them was not in scope"
  - "Coin-pop accent stays CONFIG.PALETTE.REWARD (an existing non-pink palette accent, per key_links) — the fix is the FORM (glint + sparks), not the hue"
  - "pop() kept pure rect() visuals with NO area()/body() so coin counting + colliders are unaffected; signature/z/'fx' tag unchanged so all 3 call sites (coin/key/alcove) needed no edit"
  - "build_enemies()'s retired enemy-1/2/3.png regeneration logged to deferred-items.md (pre-existing, out of scope)"
metrics:
  duration: ~35min
  tasks: 3
  files: 6
  completed: 2026-07-18
---

# Phase 35 Plan 08: Consolidation / Closeout Summary

The dead pre-Phase-32 tint-theme bake code is gone (no future bake can re-litter `assets/` with
orphaned `ground-theme-*.png` / `{far,mid,near}-theme-*.png`), the deferred coin-collect `pop()` is
restyled from a flat neon rectangle that read as a missing-sprite placeholder into a dark-grunge
"glint" twinkle, and Phase 35 is proven green end-to-end: the full gate suite + the byte-frozen
geometry gate pass and all-8 spot-check screenshots are captured. The LIVE biome/prop bake path and
`check-contrast.mjs` are untouched; geometry stayed byte-identical to the post-34.6 baseline
throughout.

## What was built

### Task 1 — Delete dead tint-theme bake code + reword stale comments (commit 42609ef)

- `scripts/build-art-assets.py`: removed the `__main__` loop that iterated `THEME_PALETTES` calling
  `build_ground_theme` / `build_parallax_theme`, then removed those two now-orphaned functions plus
  the `_accent_sub` / `_mid_accent_sub` / `_near_accent_sub` helpers, the `_THEME_ACCENTS` map, and
  the `THEME_PALETTES` dict comprehension. Each was grep-confirmed to have no remaining caller before
  deletion. Net: **227 lines removed** from the bake.
- **LIVE path untouched:** `build_ground`, `build_parallax`, `build_biome_atlas_*`,
  `build_biome_parallax_*`, `_bake_biome_atlas`, `build_props`, and the shared
  `ENVIRONMENT_PALETTE_FAR/_MID/_NEAR` slices (still used by the live `build_parallax`) were left
  exactly as-is. The Python `ACCENT_MOSS..ACCENT_EMBER` tuples were kept per the plan's explicit
  delete-list scope (they mirror `CONFIG.PALETTE.ACCENT_*`, retained for `check-contrast.mjs`).
- **Stale comments reworded** to the per-biome atlas/parallax path (live code above each was NOT
  changed): `src/main.js` ("old hand-written per-theme-N block"), `src/levels/build.js` ("old
  theme-aware groundSprite ternary"), `scripts/screenshot-phase26.mjs` ("theme-tinted
  ground/parallax"). Also fixed three now-dangling references to the deleted functions inside
  `build-art-assets.py` docstrings/comments (`build_ground_theme()/build_parallax_theme()` idiom
  note; `_bottom_anchor` docstring; the LOGO_FILL `THEME_PALETTES above` reference).
- Re-bake produced **exit 0, NO `*theme*.png` regenerated, and zero TRACKED asset drift** — proving
  the live output is byte-identical.

### Task 2 — Restyle the coin-collect pop() (commit d2fa37b)

- **Problem (2026-07-17 play-test, folded in from quick 260717-j24):** the old `pop()` was a single
  flat `rect(POP_SIZE, POP_SIZE)` in neon-green — it read as a missing-sprite placeholder box.
- **Restyle approach:** `pop()` is now a dark-grunge collect **glint**: a small **45°-rotated
  diamond core** that flashes (scale `1 → POP_SCALE`, opacity `1 → 0`) surrounded by a ring of
  `POP_SPARK_COUNT` **diamond sparks** that fly outward by `POP_SPARK_DIST` and fade. Rotating the
  squares into diamonds is what turns the placeholder-reading box into an intentional spark; the
  radiating ring reads as a collect twinkle. It mirrors `dust()`'s per-particle rise/fade idiom
  (multi-particle, each self-cleaning).
- **Constraints honored:** accent stays `CONFIG.PALETTE.REWARD` (existing non-pink palette accent);
  new tunables `CONFIG.FX.POP_SPARK_COUNT/POP_SPARK_SIZE/POP_SPARK_DIST` (no magic numbers in
  `fx.js`); every transient self-cleans via a single `tween().onEnd(destroy)` — no
  `setTimeout/wait/loop/lifespan`, non-strobing (SAFE-01/SAFE-03); pure `rect()` visuals with **NO
  `area()`/`body()`** so coin counting and colliders are unaffected; `pop(at)` signature + `z(60)` +
  `"fx"` tag unchanged, so the coin/key/alcove call sites needed no edit; engine globals referenced
  inside the function body only (a727c13).

### Task 3 — Full-suite closeout + all-8 screenshots (no code change)

- Ran the full verification suite green across all 8 dressed levels, confirmed the byte-frozen
  geometry gate, and captured the final spot-check screenshots. No descriptor was modified.

## Verification results

Playwright driven with `PLAYWRIGHT_MJS_PATH=/home/magnus/.nvm/versions/node/v24.18.0/lib/node_modules/playwright/index.mjs`.

| Gate | Result |
|------|--------|
| `python3 scripts/build-art-assets.py` | PASS (exit 0; no `*theme*.png` regenerate; no tracked asset drift) |
| `find assets -name '*theme*' -not -path '*/_*-src/*'` | EMPTY (no orphaned theme PNGs) |
| `grep build_ground_theme\|build_parallax_theme\|THEME_PALETTES\|_THEME_ACCENTS` | nothing (all deleted) |
| `node scripts/validate-levels.mjs` | PASS |
| `node scripts/check-assets-manifest.mjs` | PASS (58 assets on disk) |
| `bash scripts/check-terrain-atlas.sh` | PASS (LIVE biome bake untouched) |
| `bash scripts/check-pink-gate.sh` | PASS (no pink; player-swamphunter allowlisted as before) |
| `bash scripts/check-gate.sh` | PASS |
| `bash scripts/check-safety.sh` | PASS (fx self-cleans via tween().onEnd; no scheduler) |
| `bash scripts/check-import-safety.sh` | PASS (a727c13 — no top-level engine globals) |
| `bash scripts/check-progress.sh` | PASS |
| `node scripts/check-contrast.mjs` | PASS (ACCENT_* + banned-hue guardrail intact) |
| `node scripts/check-geometry-frozen.mjs` | PASS — all 8 levels byte-identical to the post-34.6 baseline |
| `node scripts/browser-boot.mjs` | PASS — title → select → all 8 levels, no runtime errors (restyled pop fires, coins collect) |
| `node scripts/screenshot-phase35-props.mjs` | PASS — 12 shots (8 spawn + 4 climb) |

### All-8 spot-check screenshots

Captured to `.planning/phases/35-biome-re-dress-props/prop-shots/`:

- `level-01-swamp-spawn.png`
- `level-02-swamp-spawn.png`, `level-02-swamp-climb.png`
- `level-03-town-spawn.png`
- `level-04-town-spawn.png`, `level-04-town-climb.png`
- `level-05-cemetery-spawn.png`
- `level-06-cemetery-spawn.png`, `level-06-cemetery-climb.png`
- `level-07-castle-spawn.png` (horizontal — spawn only)
- `level-08-castle-spawn.png`, `level-08-castle-climb.png`

Spot-checked visually (ART-PARITY mandate): level-01 swamp reads as reeds/foliage on ledges with the
route + coins clearly legible; level-07 castle shows columns, gothic arches, stained-glass, torches,
a candle prop, and vines with the play lane clear. Props render behind/on-surface, never obscuring
the route (§8.5 legibility). Climb shots for the four vertical levels capture the upper switchbacks.

## Deviations from Plan

- **[Rule 3 — Blocking, environment] Missing castle build-source path on this dev host.** The bake
  aborted at the church/castle pack because it is nested one level deeper on this host
  (`_gothicvania-src/gothicvania-church-files/gothicvania church files/...`) than
  `build-art-assets.py` expects. Resolved with a **local, gitignored symlink** under
  `_gothicvania-src/` (build-source only) — no repo/code change. The partial bake up to the failure
  had already produced zero tracked drift; after the symlink the full bake completed exit 0. Logged
  in `deferred-items.md`.
- **[Coherence, from the deletion] Dangling comment references.** Three comments/docstrings inside
  `build-art-assets.py` referenced the now-deleted `build_ground_theme`/`build_parallax_theme`/
  `THEME_PALETTES`. Reworded to the live builders (directly caused by the Task 1 deletion; no code
  behavior change).

Otherwise the plan executed as written; Rules 1/2/4 did not trigger.

## Notes

- **prop-shots PNGs + STATE.md left uncommitted (CODE ONLY per orchestrator constraints).** The 12
  screenshots are regenerable evidence for `/gsd-verify-work`; STATE.md/ROADMAP/SUMMARY are the
  orchestrator's to commit.
- **`assets/enemy-1/2/3.png` regenerate as untracked bake byproducts** — pre-existing (retired in
  `7ab5a4d`, but `build_enemies()` still runs). Not staged; logged to `deferred-items.md`. Unrelated
  to theme-N cleanup.

## Known Stubs

None. The dead theme code is removed (not stubbed); the coin-pop is fully wired (all 3 call sites
render the new twinkle); no placeholder data was introduced.

## Self-Check: PASSED

- Modified files exist on disk: `scripts/build-art-assets.py`, `src/main.js`, `src/levels/build.js`,
  `scripts/screenshot-phase26.mjs`, `src/fx.js`, `src/config.js`.
- Commits exist: `42609ef` (theme deletion), `d2fa37b` (coin-pop restyle) — both in `git log`.
- All 15 verification rows above are green; all 12 screenshots present in `prop-shots/`.
