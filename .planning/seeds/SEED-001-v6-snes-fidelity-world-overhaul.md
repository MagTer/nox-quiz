---
id: SEED-001
status: dormant
planted: 2026-07-07
planted_during: v5.0 Phase 26 (Grunge Palette & Nox Run Rebrand)
trigger_when: v6.0 milestone kickoff — surface at the next /gsd-new-milestone after v5.0 closes
scope: large (full milestone)
---

# SEED-001: v6.0 — "SNES-Fidelity World" visual + world-motion overhaul (requirements draft)

## Why This Matters

Mid-Phase-26 the user judged the theming/rebrand direction insufficient: "It is not
changing things to the level I want. I was thinking more towards a 256 color Super
Mario game." A codebase scan confirmed the gap is **source-art fidelity, not the
engine**: player sprite is 5 colors total with a 2-frame run, ground tiles 5 colors,
parallax layers are flat 2–3 color triangle silhouettes, floors render as a single
16px tile strip floating over black, and nothing in the world moves except the player
and coins. Phase 26's tint-based theming re-colors this same minimal art, which is why
it can't reach the target look. The architecture IS ready (visuals already split from
colliders everywhere; levels are pure data through one builder; Kaplay handles
animated sprites; 640×360 exceeds SNES resolution) — the milestone is asset sourcing +
rendering work, not engine work.

Decisions locked with the user 2026-07-07 (via structured Q&A):

1. **Scope: visuals + world motion** — full art overhaul PLUS patrolling cosmetic
   enemies, moving platforms, animated props. Math-blocker mechanics keep their
   gameplay but get real animated art. (Not the bigger "new play mechanics" option —
   no stomping/question-blocks/power-ups this milestone.)
2. **Art direction: dark SNES** — keep the dark-grunge identity at SNES fidelity
   (Castlevania IV / Demon's Crest register: rich shading, dithered gradients, moody
   colored skies, torch-lit caves). No pink, no bubbly — unchanged.
3. **Art source: CC0 + CC-BY packs** — hand-curated artist-drawn packs (itch.io /
   OpenGameArt); CC-BY allowed with attribution via the existing CREDITS.md process.
   The Pillow pipeline shifts from *generating* art to *palette-conforming* sourced art.
4. **v5.0 fate: wrap lean** — finish Phase 26's rebrand/string-sweep minimally, keep
   Phase 27 (audio) and Phase 28 (verification), skip theming polish this milestone
   replaces.

## Requirements Draft

### Correction to the 8-theme model

Replace "8 tinted themes" with **3–4 real biomes, each covering 2–3 levels** (e.g.
forest → cave/underground → ruins/castle). Artist-drawn packs come as biomes; 8
distinct SNES-quality themes are unsourceable, and 8 hue-shifted tints of one pack is
exactly the trick that under-delivered in Phase 26. Distinctness comes from genuinely
different art per biome, not hue rotation.

### A. Art foundation

- **ART-01 — Cohesive asset set.** Source one style-coherent dark pixel-art collection
  (CC0/CC-BY) covering tilesets, backgrounds, player, enemies, and props for 3–4
  biomes. Cohesion is a hard requirement — a style-board mock screen gets human
  sign-off BEFORE any integration work. Licensing via existing CREDITS.md +
  assets/LICENSES/ pattern.
- **ART-02 — Filled terrain.** Ground becomes solid drawn mass: surface + underground
  fill + edge/corner tiles, replacing the floating 16px strip over black. Single
  biggest visual win. Code: extend build.js `pickTopFrame()` into a real autotiler;
  colliders untouched.
- **ART-03 — Real parallax backgrounds.** Sky gradient + 2–3 detail layers per biome,
  replacing flat triangle silhouettes.
- **ART-04 — Player character.** Animated character replacing the 5-color sprite:
  idle, run (4+ frames), jump, fall, land. EXPLICITLY overrides the v4.1 "player
  sprite untouched" lock — new human sign-off required.
- **ART-05 — Mechanic entities get real art.** Math gate loses the grey rect + "?"
  glyph; doors and enemy blockers get idle animations. Math mechanics themselves
  unchanged.
- **ART-06 — Props layer.** Optional `props` array in level descriptors (torches,
  crates, plants, chains — visual only, no colliders, validator-neutral).

### B. World motion

- **MOT-01 — Patrolling enemies.** Animated walk-cycle enemies patrolling between
  waypoints, dt-based `onUpdate` movement (no timers — check-safety compliant).
  Contact = spike-like respawn at checkpoint (existing, ADHD-safe hazard class).
  Distinct from stationary math-blocker enemies.
- **MOT-02 — Moving platforms.** Horizontal/vertical, player-carrying. Validator must
  learn them (validate reachability at both extremes); placed only in new or
  re-dressed sections to protect kid-validated geometry.
- **MOT-03 — Ambient animation.** Torch flames, shimmer, goal/checkpoint unlock
  animations — pure visual loops.

### C. Guardrails (carried forward, non-negotiable)

- All existing gates stay green: check-safety, a727c13, validate-levels, browser-boot,
  mechanics audit. New hazard placement passes validator + interactive audit + human
  sign-off.
- Level GEOMETRY of the 8 kid-validated levels preserved — re-dress, don't rebuild.
- No new runtime deps, no Kaplay upgrade, no build step. Pillow pipeline repurposed
  for palette-conformance (grunge-compliance pass, no-pink check) of sourced art.
- Math brain stays locked. No timers, no pressure.

### Rough phase shape

1. Art sourcing + style-board sign-off (make-or-break phase; everything downstream
   depends on it)
2. Terrain autotiling + filled ground
3. Backgrounds + parallax per biome
4. Player + entity animation
5. World motion (patrols, moving platforms, props)
6. Level re-dress across all 8 levels + full verification + kid sign-off

## When to Surface

**Trigger:** the next `/gsd-new-milestone` run (v6.0 kickoff) after v5.0 wraps lean
(Phase 26 minimal close → Phase 27 audio → Phase 28 verification).

## Scope Estimate

**Large — a full milestone** (~6 phases, per the phase shape above).

## Breadcrumbs

- `src/levels/build.js` — the ONE builder; autotiler (`pickTopFrame`), props layer,
  and all sprite-panel swaps land here
- `src/main.js` — sprite load manifest (will grow substantially; consider data-driven
  load list)
- `scripts/build-art-assets.py` — Pillow pipeline to repurpose for palette-conformance
- `scripts/validate-levels.mjs` + `scripts/lib/reachability.mjs` — must learn moving
  platforms (MOT-02)
- `scripts/check-safety.sh` — patrol movement must be dt-based `onUpdate`, no
  timers/schedulers
- `assets/` current inventory: player.png 80×32 5-color, tiles/ground*.png 5-color
  strips, parallax/* 2–3 color silhouettes — the fidelity baseline being replaced
- Related pending todos (overlap with phase 6 of the shape):
  `2026-07-07-fix-unreachable-pickups-ledges-and-level-07-08-repetition.md`,
  `2026-07-07-reconsider-secret-alcove-mechanic-discoverability-and-value.md`,
  backlog 999.1 (reconsider/remove collect-the-answer mechanic)

## Notes

Captured from an interactive requirements session (2026-07-07, mid-Phase-26). The
four numbered decisions above were explicit user choices, not defaults — treat them
as milestone-binding inputs unless the user revisits them at kickoff.
