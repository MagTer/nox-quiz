---
phase: 35
slug: biome-re-dress-props
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-16
---

# Phase 35 — Validation Strategy

> Per-phase validation contract. This project has NO JS test framework — the shell/Playwright
> gates ARE the suite (CLAUDE.md). "Tests" below = those gates + screenshots.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (vanilla ES2020, no build); gates = bash + Node + Playwright + Pillow bake |
| **Quick run command** | `node scripts/validate-levels.mjs && node scripts/check-assets-manifest.mjs` |
| **Full suite command** | `node scripts/validate-levels.mjs && node scripts/check-assets-manifest.mjs && bash scripts/check-terrain-atlas.sh && bash scripts/check-pink-gate.sh && bash scripts/check-gate.sh && bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-progress.sh && node scripts/browser-boot.mjs` |
| **Estimated runtime** | ~90–180s (browser-boot dominates) |

---

## Sampling Rate

- **After adding props to a descriptor:** `node scripts/validate-levels.mjs` (must stay identical — props are validator-neutral) + `node scripts/check-assets-manifest.mjs` (every prop sprite path exists)
- **After any new prop art:** `bash scripts/check-pink-gate.sh` (no pink) + manifest gate
- **Geometry-frozen proof:** the NEW `scripts/check-geometry-frozen.mjs` vs `geometry-frozen-baseline.json` after every descriptor edit
- **Before `/gsd-verify-work`:** full suite green + the 2-level trial human sign-off

---

## Per-Task Verification Map

| Task | Requirement | Secure Behavior | Test Type | Automated Command | Status |
|------|-------------|-----------------|-----------|-------------------|--------|
| props data model + renderer | ART-06 | `props` top-level field, no colliders, z −8/−3 behind player; validator UNCHANGED | static + in-engine | `validate-levels.mjs` (byte-identical rows) + `check-geometry-frozen.mjs` | ⬜ |
| prop art bake/source + manifest | ART-06/07 | every prop sprite exists on disk; no pink | static | `check-assets-manifest.mjs` + `check-pink-gate.sh` | ⬜ |
| 2-level trial (swamp-thin + rich biome) | ART-06/07 | restrained/legibility look approved by human | screenshots + human | `screenshot-phase35-props.mjs` → checkpoint | ⬜ |
| remaining 6 levels | ART-06/07 | dressed to the approved approach; geometry frozen | static + screenshots | full suite | ⬜ |
| theme-N cleanup | ART-06 | dead bake code removed; biome path + check-contrast.mjs intact | static | full gate suite green | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red*

---

## Wave 0 Requirements

- [ ] NEW `scripts/check-geometry-frozen.mjs` + `geometry-frozen-baseline.json` — proves floors/platforms/coins/checkpoints/door/enemy/goal/keys/secretAlcove/bounds byte-identical to post-34.6 state (mitigation #4).
- [ ] NEW `scripts/screenshot-phase35-props.mjs` — per-level spawn + climb-altitude screenshots for the trial sign-off (clone the Phase-33 screenshot approach).
- [ ] `CONFIG.PROPS.{Z_BACK,Z_SURFACE}` tunables + a `kind:"prop"` manifest-load branch + the guarded `props` loop in `build.js`.

*Existing infra (validate-levels, check-assets-manifest, check-pink-gate, browser-boot) covers the rest.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Props "feel" — restrained, atmospheric, never obscuring the route; matches the style-board | ART-06/07 | Legibility + taste are subjective; §8.5 "always see the route" is human-judged | 2-level props trial: screenshots of the trial pair; human sign-off before dressing the other 6. `checkpoint:human-verify`, NOT rubber-stamped. |

---

## Validation Sign-Off

- [ ] Props proven validator-neutral (geometry rows byte-identical)
- [ ] Every prop sprite path exists (manifest) + no pink
- [ ] Geometry-frozen gate green
- [ ] 2-level trial human sign-off obtained
- [ ] `nyquist_compliant: true` set

**Approval:** pending
