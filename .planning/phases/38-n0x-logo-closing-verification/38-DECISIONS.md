# Phase 38 — Decisions & Resume Pointer

**Updated:** 2026-07-19

## LOGO PICK (BRAND-01) — SIGNED OFF ✅

**Chosen direction: Candidate A — "Emerald Chisel"** (user, 2026-07-19).

**BRAND-01 SIGNED OFF by user 2026-07-19** on the live title + level-select shots
(commit ee35994): "loggan och title screen ser jättebra ut." The baked logo A +
the SNES-fidelity castle-interior title backdrop are both approved. BRAND-01 is
CLOSED.

- Source preview: `.planning/phases/38-n0x-logo-closing-verification/brand-candidates/A-emerald-chisel.png`
  (+ `A-emerald-chisel-hero-transparent.png`).
- Generator: `brand-candidates/generate-v2.py` (function `a_emerald()`) — the repeatable source.
- Treatment: **uppercase N0X**, moss→neon-green chiseled bevel, neon rim-light + outer glow, drop shadow. SNES-fidelity (higher pixel grid than v1). Matches the current NOX RUN moss/neon identity — the "safe, strong evolution."

### BAKE DONE (2026-07-19, quick task 260719-iuv) — awaiting human sign-off
- `a_emerald()` ported into `scripts/build-art-assets.py` (`build_logo` + `_logo_*` helpers).
- `assets/logo-hero.png` (360×90, NEAREST upscale) + `assets/logo-badge.png` (144×36, LANCZOS
  downscale for legibility) re-baked.
- **Title backdrop also rebuilt** (`build_title_bg`): the old grey Kenney silhouette →
  Gothicvania castle-interior source at native SNES-fidelity color + darken + center
  vignette. Same 640×360 filename, no scene edit.
- All gates green incl. browser-boot PASS. Live title+select shots shown to user.
- REMAINING for BRAND-01: the human sign-off itself (multi-round). Not auto-closed.

### To bake it (the actual BRAND-01 work — DONE, steps kept for reference)
1. Port `a_emerald()` into `scripts/build-art-assets.py`'s `build_logo()` path (or a new `build_n0x_logo()`), producing the two real assets at their locked sizes:
   - `assets/logo-hero.png` — **360×90** (title hero)
   - `assets/logo-badge.png` — **144×36** (level-select badge)
   - Keep the transparent-background convention (RGBA), NEAREST upscale, no anti-alias smear.
2. `main.js` already loads `sprite("logo-hero")` / badge — no scene code change needed if filenames/sizes stay identical; just re-bake.
3. Gates after re-bake: `check-assets-manifest`, `check-pink-gate` (emerald is non-pink, will pass), `check-terrain-atlas` (build-art-assets.py touched), `browser-boot` (title + select render), plus a title/select screenshot for the BRAND-01 human sign-off (multi-round, do NOT rubber-stamp — Phase-26 standard).

## What remains in Phase 38 (the milestone finish line)

| Item | Who | Notes |
|------|-----|-------|
| **BRAND-01** bake A → hero+badge + sign-off | Claude bakes, USER signs off | ready to bake now |
| **VER-04** consolidated gate suite | Claude (autonomous) | whole game already green as of 37-07 |
| **VER-01** live Dokploy playthrough | USER | deploy `docker/` + play the live URL |
| **VER-02** kid-UAT | USER + kid | she plays the finished game — the real gate; covers all new content |
| **VER-03 / MOVE-05** non-60Hz feel | USER | on real hardware |
| **MOB-05** real-device audio proof | USER | on her phone (headless can't prove it) |
| **MOB-06** kid touch-layout tuning | USER + kid | watch her thumbs, tune CONFIG.TOUCH |
| **Deferred motion FEEL** (Phase 36) | USER + kid | rolls into the kid-UAT |

## RESUME (new session)

- State is persisted in git (local) + `.planning/STATE.md`. Milestone **v6.0, 12/13 (92%)**, Phase 38 is the final phase.
- Fresh session: `/gsd-next` or read `.planning/STATE.md` → current_phase 38.
- **First action on resume:** bake logo A (steps above), then hand to the user for the human gates.
- **Untracked strays to IGNORE** (pre-existing, not ours): `.planning/phases/26-grunge-palette-nox-run-rebrand/` (leftover dir) and `assets/enemy-{1,2,3}.png` (bake byproducts, logged in 35-08 deferred-items).
- **NOT pushed:** local `main` is ~77 commits ahead of `origin/main`. Push before a dev-host switch if you want an off-machine backup.
