---
phase: 35-biome-re-dress-props
verified: 2026-07-18T00:00:00Z
status: passed
score: 8/8 plans complete; ART-06 + ART-07 delivered
requirements: [ART-06, ART-07]
behavior_unverified: 0
deferred:
  - truth: "The kid's live aesthetic sign-off on the fully-dressed world"
    addressed_in: "Phase 38 (VER-02 kid-UAT)"
    evidence: "Standing precedent — final look is a real re-approval; the mid-phase trial sign-off (35-03) was orchestrator-reviewed under explicit user auto-advance authorization ('Run the whole phase', 2026-07-17)."
---

# Phase 35: Biome Re-dress & Props — Verification Report

**Phase Goal:** Add a visual-only props layer to all 8 levels and confirm each level's biome look, on geometry that Phase 34.6 already settled (byte-frozen). Requirements: ART-06, ART-07.

**Status:** passed — all 8 plans complete, full gate suite green, geometry byte-frozen.

## Requirement coverage

- **ART-06 (props layer on all 8 levels):** DELIVERED. Every descriptor now carries a top-level, collider-free `props: []` layer rendered by `build.js`'s prop loop at both-negative `CONFIG.PROPS` z-depths (structurally behind all gameplay). Swamp (01/02), town (03/04), cemetery (05/06), castle (07/08) each dressed with a per-biome prop vocabulary.
- **ART-07 (biome look confirmed):** DELIVERED. All four biomes read unmistakably; confirmed via the plan-03 trial checkpoint + the plan-08 all-8 spot-check (12 screenshots in `prop-shots/`).

## Wave execution (all complete)

1. 35-01 infra (config z + collider-free emit + geometry-frozen gate + screenshot script)
2. 35-02 trial bake + dress level-01 (swamp) + level-06 (cemetery)
3. **35-03 human-verify checkpoint — APPROVED** (orchestrator visual review under user-authorized auto-advance; see 35-03-SUMMARY.md)
4. 35-04 dress level-02 + level-05 · 35-05 bake town + castle props (castle = tileset crops, no new CC0 needed)
5. 35-06 dress town 03/04 (level-04 minimal, object budget 393/650) · 35-07 dress castle 07 (horizontal, spawn-only) + 08 (vertical, spawn+climb)
6. 35-08 consolidation — deleted dead `theme-N` bake code (227 lines), restyled the coin-collect `pop()` (deferred item), full suite + all-8 spot-check

## Gate suite (committed state, all green)

check-gate · check-safety · check-import-safety · check-progress · validate-levels · check-assets-manifest · check-terrain-atlas · check-pink-gate (0.0% on all baked props) · **check-geometry-frozen (all 8 byte-identical to the post-34.6 baseline — definitive proof the re-dress touched zero geometry)** · browser-boot (all 8 boot + reach goal, budget/FPS-safe with props) · check-contrast.

## LOCKED-decision compliance

- Restrained / legibility-first: props never obscure a platform, route, hazard, coin, key, or mechanic — verified visually across all 4 biomes at spawn + climb altitudes.
- Background + on-surface only (no foreground over the play lane): guaranteed structurally by both-negative `CONFIG.PROPS` z.
- Vendored-packs-first + CC0 discipline: town/castle baked from already-licensed vendored packs; castle needed no new CC0; pink gate green.
- Props STATIC (motion is Phase 36).

## Follow-on / notes

- **Coin-pop restyle:** the neon-green placeholder rect is replaced with a dark-grunge gold "glint twinkle" (diamond core + radiating sparks, REWARD palette, one self-cleaning tween, no collider) — resolves the user's 2026-07-17 re-play flag.
- **Non-blocking flag for the kid-UAT look:** the swamp *flames* are pre-existing frozen parallax art (Phase 32/33), not new props.
- **Deferred (35-08 deferred-items.md):** a pre-existing `assets/enemy-1/2/3.png` bake-byproduct issue — untracked, unrelated to props, logged for later.
