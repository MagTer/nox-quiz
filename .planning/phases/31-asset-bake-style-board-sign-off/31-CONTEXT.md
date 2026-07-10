# Phase 31: Asset Bake & Style-Board Sign-off - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning

<domain>
## Phase Boundary

A style-coherent SNES-fidelity dark pixel-art collection is vendored, license-clean, conformed, and human-approved on a style board before any of it touches game code — the hard blocking gate for every downstream art phase. Covers ART-01. Consumes `.planning/research/v6-scouting/` (ASSET-SCOUTING.md, SPIKE-FINDINGS.md, styleboard.py, existing style-board-*.png renders) as verified pre-work, not re-researched. Integration into `build.js`/level rendering is explicitly OUT — that's Phase 32 (terrain/parallax) and Phase 33 (player/entity animation).

</domain>

<decisions>
## Implementation Decisions

### Biome Pack Selection & Player Candidate
- Anchor collection: the Gothicvania family (ansimuz), all CC0 — ASSET-SCOUTING.md's Option 1, already style-boarded across all 4 renders.
- Biome → level mapping: Swamp (1–2) / Town (3–4) / Cemetery (5–6) / Castle (7–8) — the Castlevania calm→harsh arc, CONFIRMED by direct kid feedback on the actual style-board images ("Can they not all be there, just different levels?" — read as approval of all 4 biomes existing, each mapped to its own level pair, not a request to cut any).
- **Player sprite: Swamp Hunter (9-anim set) ships as the player across ALL 4 biomes** — kid's explicit pick over Gothic Hero after viewing the style board. This overrides the pre-work's default framing (Gothic Hero appeared in 3 of 4 renders); the style board must be regenerated showing Swamp Hunter in the town/cemetery/castle renders too, not just swamp.
- **Castle biome enemy: Hell hound replaces the fire skull** — kid's explicit complaint ("The monster in the castle biome is ugly") plus Claude's recommendation, accepted. Bonus: Hell hound is also the Phase 36 patrol-enemy candidate (ground-runner with a run cycle), so this pick avoids a second decision later — but wiring actual patrol MOVEMENT is still Phase 36's job, not this phase's (this phase only vendors/bakes the static sprite).
- Gothicvania Church does NOT ship as its own biome — fold its usable interior tileset/background accents into the Castle biome (levels 7–8) only, matching the "3–4 biomes covering 8 levels" requirement wording.

### Style-Board Sign-off Process
- The existing 4 style-board renders (built in pre-work, 640×360 exact internal res, NOX RUN badge overlaid) get REGENERATED via `styleboard.py` with the two decisions above baked in: Swamp Hunter as the player in all 4 renders, Hell hound in place of the fire skull in the castle render. The original renders are pre-decision reference material, not the artifact to sign off on.
- **Today's kid feedback (via the parent, live during discuss) is genuine round 1 — real, specific, and it already changed the plan (player swap, enemy swap).** It does NOT substitute for the execute-phase's formal `checkpoint:human-verify` gate. The regenerated board must still be shown fresh at execute time and get explicit re-confirmation — never treat "liked the concept" as "approved the final baked asset." Standing project precedent: never rubber-stamp a `checkpoint:human-verify` gate (Phases 25/27/28).
- Record the sign-off with both rounds quoted verbatim (today's discuss-round quotes above, plus whatever the execute-phase confirmation round produces) in the phase SUMMARY.md or a small dedicated sign-off note — matches this project's evidentiary standard for human-verify gates.
- The parent (user) may give the final execute-phase sign-off themselves — same standard as Phase 26 (logo) / Phase 27 (audio), which were both signed off by the parent alone. Getting the kid's read when possible (as happened today) is a bonus, not a hard requirement for every round.

### Pink-Scan Gate & Hue-Conform Pipeline
- Detection technique: HSV hue-range scan (Pillow) over each vendored PNG's opaque pixels, flagging pixels in the pink/magenta hue band — same technique already proven in `styleboard.py`'s hue-rotation pass on the town/cemetery skies.
- **Threshold: relaxed to ~8–10% of opaque pixels in the pink/magenta hue band** (explicit user correction — "she dislikes pink but we don't have to hunt it like it is the plague"). This only trips when pink is a DOMINANT hue (a whole sky, a whole character) — small incidental pink pixels (a highlight, a tiny detail) pass freely. Still HARD-FAIL tier when it does trip, since a dominant-pink asset at that threshold is unambiguously a real violation, not noise.
- Known pink assets to retint: the Town dusk sky (salmon-pink) and the Cemetery horizon glow (magenta) — the same two flagged in ASSET-SCOUTING.md, retinted via the same Pillow hue-conform approach already validated in the style-board renders (steel-blue/cold-blue results). The gate re-runs on both post-retint as regression proof.
- Gate location: a new standalone script (`scripts/check-pink-gate.sh` or `.mjs`), sibling to the existing `check-*.sh` gate family — not folded into `check-safety.sh`.

### Atlas/Anchor-Lip Convention & Vendoring Scope
- Anchor/lip convention: 16×32-compatible cap tiles (matches `CONFIG.TILE_SIZE = 16` and the existing 16×32 player collider), with the lip offset in px written down explicitly in a doc (new `ART-CONVENTIONS.md` or a new section in `docs/LEVEL-DESIGN.md` — Claude's discretion on exact location, not on whether it's written).
- Baking happens via an extension of the existing `scripts/build-art-assets.py` (Pillow, the same reproducible-pipeline convention already used for `player.png`/`ground.png` per CREDITS.md's Phase 20 correction) — not one-off manual crops.
- Explicitly excluded from vendoring: all music/audio files in every zip (CC-BY per ASSET-SCOUTING.md note #2 — Phase 27 already owns audio, and this content isn't ours to ship anyway), any enemy/prop variant not selected for the 8 levels, and any Gothicvania Patreon-collection sub-pack not selected (only the Gothic Castle env + Old Dark Castle interior + Gothic Hero-adjacent bestiary pieces actually used).
- Credits/licenses: follow the exact existing `CREDITS.md` table-row format (Asset / File / Author / Source / License / Used for), one `assets/LICENSES/<name>.txt` proof file per vendored asset group — same discipline as every existing row in that file.

### Claude's Discretion
- Exact doc location for the anchor/lip convention write-up (new file vs. new section in `docs/LEVEL-DESIGN.md`).
- Exact HSV hue-band bounds (degrees) for the pink-scan gate, as long as the ~8–10% dominant-pixel threshold and HARD-FAIL severity hold.
- Exact file/directory naming for the new vendored biome atlases under `assets/` (follow existing `assets/tiles/`, `assets/parallax/` sibling-directory conventions).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.planning/research/v6-scouting/styleboard.py` — pure-Pillow mock-screen renderer, already proven at 640×360 internal res with NOX RUN badge overlay; reuse (not rewrite) to regenerate the 4 renders with the new player/enemy picks.
- `.planning/research/v6-scouting/ASSET-SCOUTING.md` + `SPIKE-FINDINGS.md` — pack URLs, license verification, biome/pack mapping, and the autotile/anchor-lip technical groundwork (16×32 cap-tile recommendation originates here) — consumed as verified fact.
- `scripts/build-art-assets.py` — the existing reproducible Pillow asset-baking pipeline (used for `player.png`/`ground.png`); extend rather than duplicate for the new biome atlases.
- `CREDITS.md` + `assets/LICENSES/*.txt` — exact table/proof-file format to replicate for every new vendored asset group.
- `CONFIG.TILE_SIZE` (`src/config.js:80`, = 16) and `CONFIG.PALETTE` (`src/config.js:16`) — the grid and color-role conventions the new atlases must respect.

### Established Patterns
- Existing `check-*.sh` gate family (`check-gate.sh`, `check-safety.sh`, `check-import-safety.sh`, `check-progress.sh`) — the new pink-scan gate should read as a sibling script in this family, same invocation style.
- "No phase closes on greps/automation alone" + "never rubber-stamp `checkpoint:human-verify`" — both standing project rules apply directly to this phase's style-board sign-off, which is explicitly named as the first phase carrying a hard human-verify gate in v6.0 (per STATE.md).

### Integration Points
- `assets/` directory — new biome atlas subdirectories land as siblings to the existing `assets/tiles/`, `assets/parallax/`, `assets/sfx/` structure; nothing in this phase touches `src/` game code (that's Phases 32/33).
- `docs/LEVEL-DESIGN.md` — candidate location for the new anchor/lip convention documentation, already the doc-of-record for level-authoring rules.

</code_context>

<specifics>
## Specific Ideas

- Direct kid quotes captured live during this discuss session (via the parent relaying real-time feedback on the actual style-board images at http://192.168.10.113:8000/.planning/research/v6-scouting/style-board-sheet.png):
  - "Can they not all be there, just different levels?" — read as approval of the 4-biome/8-level structure as proposed.
  - "The monster in the castle biome is ugly" — specifically about the fire-skull enemy in `style-board-castle.png`; resolved by swapping to Hell hound.
- "She dislikes pink but we don't have to hunt it like it is the plague" — direct user quote shaping the relaxed ~8–10%-dominant-hue pink-scan threshold (not zero-tolerance).

</specifics>

<deferred>
## Deferred Ideas

- Hell hound's actual patrol/motion wiring (`patrol()`, waypoints, speed) — explicitly Phase 36 (World Motion & Ambient Life). This phase only vendors and bakes the static sprite.
- Terrain autotiling, multi-layer parallax integration, and player/entity animation wiring into `build.js`/game code — explicitly Phases 32 and 33.
- Any further biome/pack changes beyond the two decided swaps (player, castle enemy) — not raised, out of scope unless a future sign-off round surfaces something new.

</deferred>
