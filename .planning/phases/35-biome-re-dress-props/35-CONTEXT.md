# Phase 35: Biome Re-dress & Props - Context

**Gathered:** 2026-07-16
**Status:** Ready for planning
**Mode:** Interactive discuss (user answered the 4 gray-area decisions live, 2026-07-16)

<domain>
## Phase Boundary

Add a **visual-only props layer** to all 8 levels and confirm each level's biome look, on
geometry that Phase 34.6 already settled. Requirements: **ART-06, ART-07**.

IMPORTANT framing (what is and isn't new work): biomes are ALREADY assigned per level (the
`biome` field: 1-2 swamp, 3-4 town, 5-6 cemetery, 7-8 castle) and the Phase-32 renderer ALREADY
auto-dresses each level's terrain (autotiled ground) + multi-layer parallax per biome. So the
levels already READ as their biome. This phase's genuinely-new deliverable is the **hand-placed
props layer** (torches, crates, chains, tombstones, reeds, banners…) declared in the descriptors,
plus a final look-pass and the deletion of the old pre-Phase-32 tint-theme assets.

IN SCOPE: a collider-free `props` layer in each descriptor + its renderer wiring; per-biome prop
sets; the 2-level trial → sign-off → remaining-6 rollout; deletion of dead tint-theme (`theme-N`)
assets/refs; geometry byte-frozen; full gate suite + validator green.

OUT OF SCOPE: world MOTION (Phase 36 — animated torch flicker, patrols, movers, ambient life; props
here are STATIC); mobile (37); n0x logo (38). Geometry MUST NOT change (byte-frozen, review-gated).
Math brain LOCKED. No Kaplay upgrade, no new runtime deps (a build-time Pillow bake + CC0 sourcing
is fine, mirroring Phase 31).
</domain>

<decisions>
## Implementation Decisions

### Prop density — RESTRAINED, legibility-first (user decision)
- Props are **sparse and atmospheric** — they must NEVER obscure a platform, the route, a hazard,
  a coin, the key, or a mechanic. Mood comes from a few well-placed accents, not density.
- **This is bound by §8.5 / the ADHD mandate: "she must always be able to SEE where she's going
  and every route."** Legibility beats atmosphere every time there's a conflict. The play lane
  stays clear.

### Prop layers — BACKGROUND + ON-SURFACE ONLY (user decision)
- Props render **behind the player** (parallax-adjacent depth) OR **resting on ledges/floors**
  (on-surface decoration). **NO foreground props over the play lane** — nothing that can cover the
  player, a jump arc, or a route. (The user explicitly declined the "foreground framing" option.)

### Prop art — vendored packs first, source ADDITIONAL CC0 where a biome is thin (user decision)
- Start from the CC0 Gothicvania biome packs already vendored + style-board-approved in Phase 31.
- Where a biome lacks enough prop variety, **source additional CC0 prop art** — which means this
  phase carries a real sourcing + license step like Phase 31: new assets get licenses in
  `assets/LICENSES/`, credits in `CREDITS.md`, named files only, and **the pink-hue scan gate
  (`check-pink-gate.sh`) MUST pass** over anything new (retint pink/magenta props via the proven
  Pillow hue-conform pass).

### Sign-off — 2-LEVEL TRIAL, then the rest (user decision — the prototype-first pattern again)
- Bake + place props on **2 trial levels FIRST**, capture per-level screenshots, get a genuine
  **human sign-off on the look**, and ONLY THEN dress the remaining 6 levels to the proven approach.
  Same rework-insurance pattern the user chose and validated in Phase 34.6.
- **A real mid-phase `checkpoint:human-verify` gate. Do NOT rubber-stamp** (standing precedent;
  auto_advance must not auto-approve — this is also where the "black mess" parallax regressions got
  caught across Phases 32/33, so a genuine human look is load-bearing).
- **Recommended trial pair (Claude's discretion, confirm at planning): two DIFFERENT biomes at
  different intensities** to maximize signal on both prop-vocabulary variety AND the
  density-vs-legibility question — e.g. **level-01 (swamp, calm)** + **level-04 or level-06 (an
  intense/vertical even level)**. Testing two biomes de-risks the per-biome prop sets better than
  two levels of one biome.

### Props are validator-neutral (hard)
- The `props` layer carries **NO colliders** — pure visual entities. The structural validator and
  all reachability/audit checks must stay green and UNAFFECTED by props (props never gate a route).
- **Geometry byte-frozen:** `floors`/`platforms`/`coins`/`checkpoints`/`door`/`enemy`/`goal`/
  `keys`/`secretAlcove`/`bounds` arrays byte-identical to their post-Phase-34.6 state (review-gated
  in the re-dress commits — this is the standing "geometry-frozen art diffs" mitigation).

### Old tint-theme cleanup
- Delete the dead pre-Phase-32 tint-theme assets, and audit/remove residual `theme-` references
  (grep flags `src/main.js` and `src/levels/build.js` — the plan must determine which are dead vs.
  live before deleting; do not break the biome path).

### Claude's Discretion
- Exact `props` descriptor data model (e.g. `props: [{ sprite, x, y, layer|z }]`), the per-biome
  prop vocabulary, z-ordering vs. terrain/parallax/player, the props renderer wiring in `build.js`,
  and precisely which 2 levels are the trial (within the recommendation above) — all at Claude's
  discretion within the rules above, surfaced at the 2-level trial checkpoint.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Art parity & the "black mess" lessons (normative)
- `.planning/research/ART-PARITY-STEERING.md` — `styleboard.py` is the normative spec; art plans
  must name exact sources/crops/retints; visual tasks require side-by-side style-board comparisons;
  gates don't look at pixels. The three-pass parallax "black mess" regression history lives here.
- `scripts/build-art-assets.py` — the Pillow bake pipeline (props likely bake here or a sibling).
- `assets/LICENSES/`, `CREDITS.md` — license/credit home for any newly-sourced CC0 props.

### Geometry-frozen + rules
- `docs/LEVEL-DESIGN.md` (incl. §8.5) — the level rules; geometry is frozen for this phase.
- `src/levels/build.js` — the ONE builder that will emit props entities (+ the `?debug=1` overlay).
- `src/parallax.js` — camera-driven biome background layers (props' depth relates to these).
- `src/levels/level-0N.js` — the 8 descriptors gaining a `props` field (geometry unchanged).

### Gates
- `scripts/check-pink-gate.sh` + `pink_scan.py` — must pass over any new prop art.
- `scripts/validate-levels.mjs` + `node scripts/check-assets-manifest.mjs` +
  `bash scripts/check-terrain-atlas.sh` — must stay green; every declared prop sprite path must
  exist on disk (manifest gate).
</canonical_refs>

<specifics>
## Specific Ideas
- Restrained biome prop vocabulary examples: swamp = reeds/dead trees/vines/bones; town =
  barrels/crates/lanterns/signs; cemetery = tombstones/crosses/urns; castle = torches/banners/
  chains/armor stands. Static in this phase (Phase 36 makes torches flicker).
- Props declared in `src/levels/level-0N.js` `props: []`, emitted by `build.js`, rendered
  behind-player or on-surface, never foreground.
- Trial: 2 levels, 2 biomes, screenshots, human sign-off, THEN the other 6.
</specifics>

<deferred>
## Deferred Ideas
- Animated/flickering torches, ambient motion, patrols, movers → Phase 36 (MOT-01..03, MECH-05).
- Foreground framing props over the play lane → declined by the user (kept out for legibility).
- Mobile responsive/touch → Phase 37. n0x logo → Phase 38.
- GHCR CI/CD → backlog todo (2026-07-15).
</deferred>
