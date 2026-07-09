# Phase 26: Grunge Palette & Nox Run Rebrand - Context

**Gathered:** 2026-07-07
**Status:** Ready for planning

<domain>
## Phase Boundary

The game looks and reads as Nox Run — a richer dark-grunge identity with per-level
themes, real door/enemy sprites replacing their long-standing placeholder rects, and a
signed-off logo. Delivers: palette centralization + expansion (VIS-01, VIS-02),
per-level background/accent theming across all 8 levels including a light tileset tint
pass (VIS-03), real CC0 sprite art for doors and enemies replacing the flat-color
rect+glyph placeholders (VIS-04, added mid-discuss), the Nox Run logo/wordmark with
reveal animation (BRAND-01, BRAND-03), and a full Math Lab → Nox Run string sweep
(BRAND-02). Player sprite and existing tileset base art (beyond the tint pass) are
explicitly NOT touched — that art was human-signed-off in v4.1 and stays as-is.

</domain>

<decisions>
## Implementation Decisions

### Palette Centralization & Expansion (VIS-01, VIS-02)
- Centralized palette lives in a new `CONFIG.PALETTE` object in `src/config.js` (not a separate module) — matches the project's "all tunables live in config.js" convention.
- Add exactly 3 new hue-tinted darks: moss/dark green, cold blue-grey, muted rust/umber — matches the ROADMAP success criteria and prior STACK.md research verbatim.
  - **Revised 2026-07-07 (mid-execution, user request):** expanded from 3 to 8 accent hues — one dedicated accent per level — after Wave 3's bake exposed that 3 shared hues produced identical themes for levels 1/2, 3/4, and 7/8, undercutting VIS-03's distinctness requirement. See 26-12-PLAN.md.
- Document WCAG AA contrast per named role (bg/surface/text/text-dim/danger/reward/barrier/accent-1..n) as a table in the phase's evidence doc, with ratios checked via a small script rather than eyeballed.
- Add an explicit, checked banned-hue guardrail against magenta/pink (desaturated magenta/mauve reads as pink) in addition to human sign-off.

### Per-Level Theme Assignment (VIS-03)
- Granularity: per-level — each of the 8 levels gets its own distinct background/accent theme tint (not paired/shared themes).
- What varies: background/parallax tint + one accent color per level. What stays universal across all themes: danger/spike red, door/gate barrier grey family, and the XP/reward accent green — these are load-bearing gameplay-safety colors and must not be re-themed.
- Sprite art scope: the player sprite is untouched. The existing tileset DOES get a light per-theme tint pass (not a full recolor) — narrower than "sprites fully untouched," but the player sprite specifically stays as v4.1 shipped it.
- Theme-to-level assignment follows pacing: calmer greens early, harsher rust/steel tones later as difficulty/tension ramps up across the 8-level progression. Not a strict formula — use judgment during planning, informed by each level's existing difficulty/table pool.

### Door & Enemy Sprite Art (VIS-04 — new requirement, added during this discussion)
- **Why this exists:** doors currently render as a flat grey `rect()` panel with an "X" text glyph (mirrors the level-select locked-tile look). Enemies currently render as a flat red `rect()` with a "!" text glyph — `CONFIG.ENEMY.COLOR`'s own comment literally says `// muted red placeholder (NO pink)`, and a separate comment says "Compact square placeholder; Phase 18 replaces it with a sprite" — that replacement never happened across two prior art passes (v4.0 Phase 18, v4.1's art rework). This was raised by the user mid-discuss, echoing their own original v5.0 kickoff framing recorded in Phase 22's context: "Make sure monster, doors and other parts of the game are reviewed and updated."
- Sourcing: source NEW real CC0 sprite packs for both door and enemy during this phase's own research step — do not force-fit whatever happens to already be vendored in `assets/`. Follow the exact same sourcing/licensing/CREDITS.md process already established for player/tileset/parallax/spike/goal/coin.
- Enemy variety: MULTIPLE distinct enemy/monster sprite variants (2-3), not one generic sprite reused everywhere — more thematic richness across the 8 levels, at the cost of more asset sourcing/licensing work than a single variant.
- Animation: static sprites for both door and enemy (the recommended default — this was not one of the two questions the user asked to change, so it stands). Enemy remains a single generic "enemy" gameplay concept (defeat-with-answer mechanic, `enemy.js`) even though its VISUAL representation now varies — variant selection is presentational only, not a new gameplay mechanic.
- Sign-off: mandatory human visual sign-off in the running game, matching v4.1's "no auto-approval" art standard exactly — same standard as the logo and per-level theming.

### Nox Run Logo & Wordmark (BRAND-01, BRAND-03)
- Font: monogram by datagoblin (CC0) — the named recommendation from prior STACK.md research.
- Value-separation against the `#0a0a0a`-family background: a light/neon edge-highlight using the EXISTING `#00ff88` accent green (already on-brand, already the historical wordmark color in `title.js`'s `ACCENT_GREEN`) on a dark-green fill.
- Bake two sizes: a title-screen hero size and a small UI badge size — do not runtime-scale a single asset.
- Reveal animation triggers automatically on scene-enter (not gated behind a key-press) — it's a pure visual tween, unlike audio which needs a user gesture for `AudioContext`. One-shot, ≤500ms, non-strobing, no loop.

### Rebrand String Sweep & Save Safety (BRAND-02)
- Sweep scope: FULL sweep — HTML `<title>`, title screen, level-select header, HUD/pause/help strings, `README.md`, `CREDITS.md`, `docker/Dockerfile` comments, `docs/`. Deferring docs/README was explicitly rejected — prior PITFALLS.md research warns a partial rebrand "never gets finished."
- Allowlist: only historical "school-game" inspiration comments are allowed to keep referencing the original context. **The `mathlab_platformer_v2` localStorage save key is explicitly NOT allowlisted/preserved** — see the save-key decision below.
- Enforcement: the grep sweep + allowlist should be committed as a permanent regression check, matching the project's existing `check-*.sh` gate pattern (not just a one-time manual pass).

### Save Key — Explicit Decision Override (supersedes a previously LOCKED project decision)
- **The user explicitly confirmed the `mathlab_platformer_v2` localStorage save key may be freely renamed/changed as part of this rebrand, and that this intentionally resets her current pre-rebrand progress (all XP, levels, and unlocked-level state) to a fresh start.** This was double-confirmed after Claude explicitly asked the user to verify they understood the real-world effect (her actual save data resets, not a smooth migration) before locking it in.
- This OVERRIDES the prior binding project decision recorded across CLAUDE.md, STATE.md, ROADMAP.md's original success criterion 5, REQUIREMENTS.md's original BRAND-02 text, and `.planning/research/PITFALLS.md`'s Pitfall 10 (all of which previously said the save key must never be touched). All of those documents have been updated in-place (2026-07-07) to reflect this supersession — see each file's own "Superseded 2026-07-07" annotation.
- No pre-rebrand-save-resume verification is required as part of this phase's acceptance criteria.
- Practical implication for planning: if the save key IS renamed (not required, but now permitted), `src/progress.js`'s guarded seams should still apply to whatever the new key is — the "never throw, forgiving defaults" behavior is a code-quality invariant independent of which literal key string is used.

### Claude's Discretion
- Exact theme-to-level pacing assignment (which specific level gets which of the palette's new hues) — informed by pacing guidance above, not user-specified per-level.
- Exact door/enemy sprite pack selection and specific enemy variant designs — to be sourced/proposed during phase research, then brought back for the mandatory human sign-off.
- Whether the save key literal actually changes vs. simply becomes unprotected (the requirement is "not required to survive," not "must be broken") — Claude's call during planning based on what's simplest/cleanest for the rebrand's actual string-sweep mechanics.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/build-art-assets.py` — existing Pillow pipeline with both `_remap` (nearest-color, wide palettes) and `_remap_luminance` (narrow dark ramps) strategies already used for tileset/parallax; the same pipeline bakes the new logo PNGs and any door/enemy sprite processing.
- `assets/_kenney-src`, `assets/LICENSES/` — established provenance/license-proof pattern to extend for any newly-sourced door/enemy/font assets; `CREDITS.md` is the single source of truth for attribution.

### Established Patterns
- Door/enemy mechanics already split solid-collider-blocker (invisible, tagged e.g. `"door"`/`"enemy"`) from a separate cosmetic visual panel (`"door-panel"`, `"enemy-panel"`) in `src/levels/build.js` — swapping the cosmetic panel's `rect()`+`color()`+`text()` for a real `sprite()` call is a contained, low-risk change that doesn't touch collision/physics.
- `src/scenes/title.js` has its own local `ACCENT_GREEN` constant duplicating a color that should live in `CONFIG.PALETTE` — this is exactly the kind of duplication VIS-01 exists to centralize first.
- `src/config.js:117-123` (`ENEMY` block) and `src/config.js:96-104` (`DOOR` block) are the two config blocks VIS-04 will extend from flat-color literals to sprite-reference config.

### Integration Points
- `src/levels/build.js` — the ONE builder; both the palette expansion and the door/enemy sprite swap flow through here for every level.
- `src/config.js` — new `CONFIG.PALETTE` object plus extended `DOOR`/`ENEMY` blocks.
- `scripts/build-art-assets.py` — where the logo PNGs and any door/enemy sprite processing get baked.
- `CREDITS.md` / `assets/LICENSES/` — new entries for whatever door/enemy/font assets get sourced.

</code_context>

<specifics>
## Specific Ideas

- Doors and enemies must move past their current placeholder rect+glyph rendering — user specifically called this out as important, not a nice-to-have, referencing the game's current "weird placeholder" look.
- The save key is explicitly free to change — this is a deliberate, confirmed break from a previously locked decision, not an oversight to be caught later.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (the door/enemy sprite addition was folded into this phase's own VIS-04 requirement rather than deferred, since it's the same category of work as the rest of Phase 26's art/rebrand scope).

</deferred>
