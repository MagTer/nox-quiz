# Phase 20: Real CC0 Art Redo & Human Sign-off - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss — grey areas presented as batch tables; user was away from keyboard (no response after 60s on Area 1), so all recommended answers below were auto-accepted per autonomous-mode fallback. Recommendations are grounded in direct research performed this session (see Research Performed), not guesses.

<domain>
## Phase Boundary

Replace Phase 18's procedurally-generated placeholder art — `assets/player.png` and
`assets/tiles/ground.png` (both silently overwritten by `scripts/generate-art-assets.py`,
drawing flat rectangles + random noise, despite CREDITS.md still claiming they're real
HorusKDI CC0 crops) plus the entirely new, entirely uncredited `assets/parallax/{far,mid,near}.png`
and `assets/tiles/title-bg.png` — with real, curated, licensed CC0 pixel art. Phase 18's
technical contract (`18-UI-SPEC.md`: frame layout, animation state machine, z-order, parallax
ratios, color/spacing/typography tokens) carries forward unchanged; only the asset *source*
changes. `spike.png`, `goal.png`, and `coin.png` remain untouched, genuine CC0 v3.0 assets —
out of scope. The phase closes with a mandatory, structurally-enforced human visual sign-off
before verification can pass — the exact process gap that let Phase 18 ship ungraded.

</domain>

<research_performed>
## Research Performed (this session, before proposals)

- Confirmed via `git log --stat` that Phase 18 (`f9062e9`) overwrote the real CC0
  `player.png`/`ground.png` vendored in v3.0 (`ab20572`) with procedural-script output, and
  added `parallax/*` + `title-bg.png` with **no** CREDITS.md/LICENSES entries at all. The most
  recent commit (`4950eaf`) patched the same procedural script (contrast fix), not real art.
- Confirmed network access works (`curl` reached opengameart.org and kenney.nl, HTTP 200).
- Downloaded and visually inspected the actual source sheet cited in
  `assets/LICENSES/player.txt`/`ground.txt` (`16x16 dungeon tiles.png`, 256×208px, 16×13 tile
  grid, "6 Color Dungeon 16x16" by HorusKDI). It contains dungeon wall/floor/loot-icon tiles
  and **exactly one static standing humanoid figure** — no run/walk/jump pose variants. Fine
  for a top-down crawler (its likely original v2.0 use); a poor fit for ART-05's idle/run/jump
  animation requirement.
- Confirmed Kenney's "Pixel Platformer" asset page states CC0 license explicitly and is tagged
  for the platformer genre (ships character walk-cycle sheets and tile edge/corner sets
  purpose-built for side-scrollers).

</research_performed>

<decisions>
## Implementation Decisions

### Area 1: Art Source Selection
- Player sprite (idle/run/jump, both facings): source from **Kenney's "Pixel Platformer"** CC0
  pack — it ships actual walk/jump animation frames, unlike the dungeon pack's single static
  figure.
- Ground/platform tileset (left/center/right/underside edge frames): source from the **same
  Kenney "Pixel Platformer"** pack for visual and technical consistency with the player sprite
  — it ships proper platformer tile-edge sets, unlike the dungeon pack.
- Parallax layers (far/mid/near) + title/select backdrop texture: source from a **Kenney
  background/atmosphere CC0 pack** (e.g. "Background Elements Redux" or equivalent) — same
  publisher/license process, purpose-built parallax-ready layers.
- `spike.png`, `goal.png`, `coin.png`: **untouched** — explicitly out of this phase's scope per
  ROADMAP.md (ART-05..08 name only player/tileset/parallax/title-select).

### Area 2: Palette & Visual Fit
- Apply a **palette-remap pass** to sourced art: recolor onto the locked dark-grunge tokens
  (`#0a0a0a` bg-adjacent darks, `#00ff88` accent, `#66ccff` cleared-blue, `#e8e8e8` label,
  `#444444`/`#555555` greys, no pink) while preserving the real artist's shapes/silhouettes/detail
  — this is what makes it "real curated art," not just a different palette of noise.
- Player silhouette **must** stay light/bright (equivalent to `#e8e8e8`/`#d8d8d8` tones with a
  `#00ff88` accent detail) against the `#0a0a0a` background — this is a hard-won fix (a real
  playtest previously reported "I can't see the player sprite"; the current procedural script's
  own docstring records the pixel-sampling investigation). Verify contrast in-browser, not just
  from the source file, before sign-off.
- Parallax/title-bg follow the ROADMAP's own suggested motif: **distant ruin/structure
  silhouettes with a deliberate horizon rhythm** — composed scenery, not abstract shapes.
- **No new animation states or timing** beyond what `18-UI-SPEC.md` already locked (idle/run/jump
  state machine, camera-driven parallax only, no timers, 400–500ms flash/motion cap) — the
  technical contract carries forward unchanged.

### Area 3: License & Credits Process
- **Rewrite** `assets/LICENSES/player.txt` and `ground.txt` to cite the new Kenney source
  (URL, exact frame/tile reference, quoted license line, verification date) — matching the
  existing format exactly (Asset / Source pack / Author / Source URL / Source file / Tile-or-frame
  ref / License / quoted declaration / CC0 full-text link / Verification / vendor-logo note).
- **Add new proof files** under `assets/LICENSES/` for parallax (one per asset, or one combined
  file if all three layers share a single source page) and for `title-bg.png`, in the same
  format.
- Update `CREDITS.md`'s player/ground rows to the new source, and add rows for parallax/title-bg
  — matching the existing table's rigor exactly (PROC-01's explicit bar).
- Record in the commit/CREDITS.md history that Phase 18 had shipped mislabeled procedural
  placeholders, now corrected — keeps the project record honest rather than silently overwriting
  (mirrors the honesty goal driving Phase 21).

### Area 4: Human Sign-off Mechanism (the PROC-02 process fix)
- Sign-off means an explicit **AskUserQuestion checkpoint presented with real screenshots (or a
  live local URL)** of the running game — player animating in a real level, tileset tiling in a
  real level, parallax scrolling with the camera, styled title/select screens — where the user
  must affirmatively respond before verification can pass.
- This gate is **structural**, not advisory: `VERIFICATION.md` is written/left as `human_needed`
  until the explicit confirmation is recorded, using the same routing the autonomous workflow
  already has for human-needed verification (not a silent auto-pass on automated checks alone).
- If the human finds an issue at sign-off: treat it like any other gaps-found path — fix and
  re-present for a second sign-off round before marking passed.
- Sign-off re-confirms against **Phase 20's own 6 success criteria** (player silhouette/animation,
  tile seams, parallax composition, title/select hierarchy, license proof, genuine sign-off) —
  these supersede Phase 18's original ART-01..04 wording for this milestone.

### Claude's Discretion
- Exact number/choice of Kenney background pack for parallax (as long as CC0 and thematically a
  ruin/structure motif), exact palette-remap technique (recolor script vs. manual edit), exact
  tile-frame-to-pixel mapping within the locked 5-frame sheets, and exact wording of the
  corrected CREDITS.md history note are at Claude's discretion during implementation.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets (unchanged technical contract from Phase 18)
- `src/main.js` — `loadSprite` calls for player (sliceX 5, anims idle/run/jump),
  ground (sliceX 5), bg-far/bg-mid/bg-near, title-bg. All calls stay after `kaplay()`.
- `src/player.js` — Animation state machine already implemented (idle/run/jump by grounded +
  velocity deadzone; flipX facing; `getCurAnim()?.name !== anim` guard). No logic changes
  expected — only the sprite sheet pixels change.
- `src/levels/build.js` — `pickTopFrame()` tile-frame selection logic already implemented
  (single/left/center/right by run position). No logic changes expected.
- `src/parallax.js`, `src/scenes/game.js` — Parallax layer creation + camera-driven update loop
  already implemented at locked ratios (0.15/0.45/0.75) and z-order (-30/-20/-10). No logic
  changes expected.
- `src/scenes/title.js` / `select.js` — Backdrop sprite + panel/tile styling already wired to
  `title-bg` and the locked color tokens. No logic changes expected.
- `CONFIG` constants in `src/config.js` (`PLAYER_FRAMES`, `PLAYER_ANIM_DEADZONE`,
  `PLAYER_IDLE_SPEED`, `PLAYER_RUN_SPEED`, `GROUND_FRAMES`, etc.) are already set — this phase
  is asset-content-only, not a config/logic phase.

### Established Patterns
- a727c13 discipline — engine globals only inside function bodies.
- Tween-only, self-destroying FX (`src/fx.js`); no timers anywhere (SAFE-01).
- `scripts/check-import-safety.sh` and `scripts/check-safety.sh` gates exist and should be
  re-run after asset changes (they check code, not pixels, but confirm no regressions slipped in
  alongside the asset swap).

### Integration Points
- All new/replaced PNGs are drop-in replacements at the exact existing paths
  (`assets/player.png`, `assets/tiles/ground.png`, `assets/parallax/{far,mid,near}.png`,
  `assets/tiles/title-bg.png`) with the exact existing dimensions/frame counts — no code changes
  to loading/animation/tiling/parallax logic are anticipated, only to `scripts/generate-art-assets.py`
  (replaced by a real sourcing+remap pipeline) and `CREDITS.md`/`assets/LICENSES/*`.

</code_context>

<specifics>
## Specific Ideas

- Continue using the **exact frame geometry** Phase 18 already locked: player 80×32 (5×16×32
  frames: idle×2/run×2/jump×1), ground 80×16 (5×16×16 frames: single/left/center/right/underside),
  parallax far 640×120 / mid 640×144 / near 640×90, title-bg 640×360.
  See `.planning/milestones/v4.0-phases/18-art-animation-parallax/18-UI-SPEC.md` for the full
  locked asset/loadSprite/animation contract — this is the source of truth for dimensions,
  ratios, and z-order; Phase 20 does not renegotiate it.
- `scripts/generate-art-assets.py` should likely be replaced or repurposed as a real
  download-source+crop+palette-remap pipeline (so the process is reproducible and auditable),
  rather than deleted with no trace — but the exact tooling shape is Claude's discretion.

</specifics>

<deferred>
## Deferred Ideas

- Audio/SFX/music, more worlds/level packs, deployment hardening — all remain out of scope for
  v4.1 per PROJECT.md's "Not in scope" note; unchanged from Phase 18.
- Any gameplay/logic changes — this is an asset-and-process redo only.

</deferred>

---

*Phase: 20-Real CC0 Art Redo & Human Sign-off*
*Context gathered: 2026-07-03*
