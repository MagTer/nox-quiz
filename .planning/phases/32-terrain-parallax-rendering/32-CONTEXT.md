# Phase 32: Terrain & Parallax Rendering - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss (batch table proposals, all 3 areas accepted as-recommended)

<domain>
## Phase Boundary

Levels stand on solid, filled ground under real layered skies — the rendering machinery (autotiler, chunked fill, biome threading, manifest) lands with kid-validated geometry byte-frozen. In scope: the autotile terrain renderer (surface + underground fill + edges), real per-biome multi-layer parallax swapped in across all 8 levels, a data-driven assets manifest with an existence gate, and perf/screenshot checks added to browser-boot. Out of scope: level geometry changes (Phase 34), the props layer (Phase 35/ART-06), player/entity animation (Phase 33), and any biome re-crop/re-bake work beyond what Phase 31 already shipped.

</domain>

<decisions>
## Implementation Decisions

### Level → Biome Mapping (established fact, not re-litigated)

- Locked at v6.0 kickoff research (`ASSET-SCOUTING.md`, "Castlevania arc, calm → harsh"): levels 1–2 Swamp, 3–4 Town, 5–6 Cemetery, 7–8 Castle
- Phase 32 wires this mapping across all 8 levels now — the mapping is already fixed for all 8 and Phase 35 ("Biome Re-dress & Props") is scoped to the props layer and any re-dress corrections (ART-06/07), not base terrain — staging a subset now would mean redoing the terrain/parallax wiring twice

### Biome Terrain Rendering

- The real baked atlas (`assets/tiles/atlas-{biome}.png`) has only 2 frames (cap, fill) per biome — not the spike demo's 8 (left/mid/right cap variants). Simplify the autotiler to this reality: one cap frame repeats across every run's top row, chunked `{tiled:true}` fill beneath (≤40 cols/chunk, per SPIKE-FINDINGS.md). No dedicated corner/single-tile variant since the atlas doesn't have one.
- Cemetery's cap frame doesn't reach the tile's bottom edge (documented anomaly, `docs/LEVEL-DESIGN.md` §9) — composite it as a decorative overlay drawn on top of the fill frame, not directly against the solid-ground line, per §9's own suggested fix.
- Castle's cap trim is bottom-anchored/inverted (documented anomaly, same §9) — render as-is; it reads as a plinth/baseboard, purely cosmetic, no special-casing needed.
- Underground fill depth: floor runs fill down to the camera's lower clamp bound (never a visible gap when panning); thin platforms (floating, not ground) get a shallow 1–2 tile fill, not a deep mass.
- Collider-vs-sprite: the decorative lip (top or bottom, per biome) is a rendering offset only, never a physics offset — colliders stay exactly at `FLOOR_Y`/platform `y`, unaffected by cap-frame appearance (per §9's explicit warning).

### Assets Manifest

- Format: a plain JS module (e.g. `src/assets-manifest.js`) exporting a `{key, path, kind}` list — no build step, importable by both a Node gate script and browser `main.js`.
- Gate scope: for every manifest entry, assert the file exists on disk at its declared path. New single-purpose `scripts/check-assets-manifest.mjs`, added to CLAUDE.md's verification-gate list (matches the project's one-script-per-concern convention: check-gate/check-safety/check-import-safety/check-progress).
- `main.js` refactor: the biome/parallax/terrain loads (currently an 8×-repeated per-theme-N block) loop over the manifest instead of hand-written `loadSprite` calls. Door/enemy/player/audio `loadSprite`/`loadSound` calls stay hand-written — out of this phase's scope (Phase 33 territory).
- Coverage: the manifest covers the full asset surface `main.js` already loads (not just the new biome files) — a partial manifest defeats the "kills the silent-404 class" goal.

### Rollout & Cleanup Scope

- Delete the old per-level tinted `theme-N` ground/parallax assets (`ground-theme-N`, `bg-*-theme-N`) once biome art replaces them across all 8 levels — matches the "no unused pack content" spirit and the manifest/geometry-frozen goals. Git history preserves them if ever needed; no on-disk fallback kept.
- The new FPS/object-count-budget check (added to `browser-boot.mjs` per the ROADMAP's own wording) is a hard fail (non-zero exit) — matches `validate-levels.mjs`'s existing convention that silent perf regressions are exactly the failure class these gates exist to catch.

### Claude's Discretion

- Exact chunk-size tuning within the ≤40-column spike-proven ceiling, and the exact object-count budget threshold (informed by the spike's measured ~410-object safe case) are implementation parameters for planning/execution, not user-facing grey areas — set in `src/config.js` per the project's "no magic numbers in logic modules" convention.
- Whether the manifest's `kind` field distinguishes sprite vs sound vs future asset types, and the exact internal shape of the autotiler's occupancy-set/frame-picking helper functions, are implementation details left to the planner/executor, informed by `SPIKE-FINDINGS.md`'s already-proven recipe (`spike-code/main.js`).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `SPIKE-FINDINGS.md` Spike B: the full autotile + chunked-fill recipe is already spike-proven at 58fps (410 objects for a 5,600-tile level) — occupancy `Set` from `g.floors`/`g.platforms` on the 16px grid, cap row per-tile + fill as `{tiled:true}` chunks ≤40 cols. Port-ready idiom in `spike-code/main.js`.
- `docs/LEVEL-DESIGN.md` §9: per-biome lip-offset table with pixel-measured anchor conventions and explicit "Phase 32 follow-up" notes for Cemetery and Castle's anomalies — read before writing the frame-compositing logic.
- Existing `src/parallax.js` already builds exactly 3 layers (far/mid/near) with per-theme naming (`bg-far-theme-N` etc.) and camera-ratio-driven positioning — the layer *count* and *update* logic need no change, only the sprite-name source (biome instead of theme-N).
- Phase 31 already baked all art needed: 4× `atlas-{biome}.png` (2-frame cap+fill), 12× parallax layers (far/mid/near × 4 biomes), all pink-gate clean, licensed, credited.

### Established Patterns

- `src/levels/build.js` currently renders floor as a single visual-only top-row strip (`sprite(groundSprite, { frame: pickTopFrame(...) })`) with NO underground fill — this is the "floating 16px strip" the ROADMAP goal names directly. Merged-floor colliders (`rect()` + `body({isStatic:true})`, `opacity(0)`) are untouched by this phase — visual pass only.
- `src/main.js` currently hardcodes 8 sets of per-theme `loadSprite` calls (ground-theme-N, bg-{far,mid,near}-theme-N) in a `for (n of 1..8)` loop — this is exactly the block the manifest-driven refactor replaces with a 4-biome loop.
- No assets manifest exists anywhere in the repo today — this phase creates it from scratch.
- Debug overlay convention (`?debug=1`) already renders normally-invisible colliders — reuse for verifying autotile fill doesn't desync from collider position during manual testing.

### Integration Points

- `src/levels/build.js` — where the autotile renderer replaces the current single-row floor sprite loop.
- `src/parallax.js` / `src/scenes/game.js` — where per-level biome (not theme-N) selects which parallax sprite set loads.
- `src/main.js` — where the manifest-driven load loop replaces the current theme-N `loadSprite` block.
- `scripts/browser-boot.mjs` — where per-level screenshot, FPS, and far-end non-blank checks get added (existing script, per ROADMAP wording — extend, don't duplicate, matching this project's own noted exception for browser-boot specifically vs the deliberate duplication convention used by audit/calibrate scripts).
- New `scripts/check-assets-manifest.mjs` — new gate script, added to CLAUDE.md's "Verification gates" list.
- `docs/LEVEL-DESIGN.md` §9 — already written; Phase 32 is the consumer of its Cemetery/Castle follow-up notes, not the author.

</code_context>

<specifics>
## Specific Ideas

No additional specifics beyond the grey-area decisions above — all three areas (Biome Terrain Rendering, Assets Manifest, Rollout & Cleanup Scope) were accepted as recommended with no free-text overrides.

</specifics>

<deferred>
## Deferred Ideas

- Re-deriving true left/mid/right cap-tile variants (closer visual polish than the simplified 2-frame model) — deferred indefinitely unless a future human sign-off flags the simplified cap tiling as visually insufficient.
- Re-cropping Cemetery's cap frame to reach the tile's bottom edge, or re-deriving a top-anchored Castle cap crop — both explicitly deferred per §9's own "flagged, not averaged away" language; Phase 32 works around the anomalies rather than re-baking art (re-baking is Phase-31-scope tooling, not reopened here).

</deferred>
