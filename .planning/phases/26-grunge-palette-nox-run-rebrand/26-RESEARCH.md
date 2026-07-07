# Phase 26: Grunge Palette & Nox Run Rebrand - Research

**Researched:** 2026-07-07
**Domain:** Build-time art pipeline (Pillow/Python) + Kaplay 3001 runtime rendering + brand string sweep, on an existing no-build vendored-Kaplay platformer
**Confidence:** HIGH (all integration points verified by direct inspection of `src/config.js`, `src/levels/build.js`, `src/parallax.js`, `src/progress.js`, `src/scenes/title.js`, `scripts/build-art-assets.py`, and the full `mathlab`/`Math Lab` grep sweep of this exact repo); MEDIUM for the newly-sourced CC0 door/enemy pack contents (web-verified pack descriptions, not pixel-level asset inspection)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Palette Centralization & Expansion (VIS-01, VIS-02)**
- Centralized palette lives in a new `CONFIG.PALETTE` object in `src/config.js` (not a separate module) — matches the project's "all tunables live in config.js" convention.
- Add exactly 3 new hue-tinted darks: moss/dark green, cold blue-grey, muted rust/umber — matches the ROADMAP success criteria and prior STACK.md research verbatim.
- Document WCAG AA contrast per named role (bg/surface/text/text-dim/danger/reward/barrier/accent-1..n) as a table in the phase's evidence doc, with ratios checked via a small script rather than eyeballed.
- Add an explicit, checked banned-hue guardrail against magenta/pink (desaturated magenta/mauve reads as pink) in addition to human sign-off.

**Per-Level Theme Assignment (VIS-03)**
- Granularity: per-level — each of the 8 levels gets its own distinct background/accent theme tint (not paired/shared themes).
- What varies: background/parallax tint + one accent color per level. What stays universal across all themes: danger/spike red, door/gate barrier grey family, and the XP/reward accent green — these are load-bearing gameplay-safety colors and must not be re-themed.
- Sprite art scope: the player sprite is untouched. The existing tileset DOES get a light per-theme tint pass (not a full recolor) — narrower than "sprites fully untouched," but the player sprite specifically stays as v4.1 shipped it.
- Theme-to-level assignment follows pacing: calmer greens early, harsher rust/steel tones later as difficulty/tension ramps up across the 8-level progression. Not a strict formula — use judgment during planning, informed by each level's existing difficulty/table pool.

**Door & Enemy Sprite Art (VIS-04 — new requirement, added during this discussion)**
- Why this exists: doors currently render as a flat grey `rect()` panel with an "X" text glyph (mirrors the level-select locked-tile look). Enemies currently render as a flat red `rect()` with a "!" text glyph — `CONFIG.ENEMY.COLOR`'s own comment literally says `// muted red placeholder (NO pink)`, and a separate comment says "Compact square placeholder; Phase 18 replaces it with a sprite" — that replacement never happened across two prior art passes (v4.0 Phase 18, v4.1's art rework). Raised mid-discuss, echoing the user's own v5.0 kickoff framing recorded in Phase 22's context: "Make sure monster, doors and other parts of the game are reviewed and updated."
- Sourcing: source NEW real CC0 sprite packs for both door and enemy during this phase's own research step — do not force-fit whatever happens to already be vendored in `assets/`. Follow the exact same sourcing/licensing/CREDITS.md process already established for player/tileset/parallax/spike/goal/coin.
- Enemy variety: MULTIPLE distinct enemy/monster sprite variants (2-3), not one generic sprite reused everywhere.
- Animation: static sprites for both door and enemy. Enemy remains a single generic "enemy" gameplay concept (defeat-with-answer mechanic, `enemy.js`) even though its VISUAL representation now varies — variant selection is presentational only, not a new gameplay mechanic.
- Sign-off: mandatory human visual sign-off in the running game, matching v4.1's "no auto-approval" art standard exactly — same standard as the logo and per-level theming.

**Nox Run Logo & Wordmark (BRAND-01, BRAND-03)**
- Font: monogram by datagoblin (CC0) — the named recommendation from prior STACK.md research.
- Value-separation against the `#0a0a0a`-family background: a light/neon edge-highlight using the EXISTING `#00ff88` accent green (already on-brand, already the historical wordmark color in `title.js`'s `ACCENT_GREEN`) on a dark-green fill.
- Bake two sizes: a title-screen hero size and a small UI badge size — do not runtime-scale a single asset.
- Reveal animation triggers automatically on scene-enter (not gated behind a key-press) — it's a pure visual tween, unlike audio which needs a user gesture for `AudioContext`. One-shot, ≤500ms, non-strobing, no loop.

**Rebrand String Sweep & Save Safety (BRAND-02)**
- Sweep scope: FULL sweep — HTML `<title>`, title screen, level-select header, HUD/pause/help strings, `README.md`, `CREDITS.md`, `docker/Dockerfile` comments, `docs/`. Deferring docs/README was explicitly rejected.
- Allowlist: only historical "school-game" inspiration comments are allowed to keep referencing the original context. **The `mathlab_platformer_v2` localStorage save key is explicitly NOT allowlisted/preserved** — see the save-key decision below.
- Enforcement: the grep sweep + allowlist should be committed as a permanent regression check, matching the project's existing `check-*.sh` gate pattern (not just a one-time manual pass).

**Save Key — Explicit Decision Override (supersedes a previously LOCKED project decision)**
- The user explicitly confirmed the `mathlab_platformer_v2` localStorage save key may be freely renamed/changed as part of this rebrand, and that this intentionally resets her current pre-rebrand progress (all XP, levels, and unlocked-level state) to a fresh start. This was double-confirmed after Claude explicitly asked the user to verify they understood the real-world effect before locking it in.
- This OVERRIDES the prior binding project decision recorded across CLAUDE.md, STATE.md, ROADMAP.md's original success criterion 5, REQUIREMENTS.md's original BRAND-02 text, and PITFALLS.md's Pitfall 10 (all previously said the save key must never be touched). All of those documents have been updated in-place (2026-07-07).
- No pre-rebrand-save-resume verification is required as part of this phase's acceptance criteria.
- Practical implication for planning: if the save key IS renamed, `src/progress.js`'s guarded seams should still apply to whatever the new key is — the "never throw, forgiving defaults" behavior is a code-quality invariant independent of which literal key string is used.

### Claude's Discretion
- Exact theme-to-level pacing assignment (which specific level gets which of the palette's new hues) — informed by pacing guidance above, not user-specified per-level.
- Exact door/enemy sprite pack selection and specific enemy variant designs — to be sourced/proposed during phase research, then brought back for the mandatory human sign-off.
- Whether the save key literal actually changes vs. simply becomes unprotected (the requirement is "not required to survive," not "must be broken") — Claude's call during planning based on what's simplest/cleanest for the rebrand's actual string-sweep mechanics.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope (the door/enemy sprite addition was folded into this phase's own VIS-04 requirement rather than deferred, since it's the same category of work as the rest of Phase 26's art/rebrand scope).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-01 | Duplicated color literals centralized into `CONFIG.PALETTE` before any expansion | Full inventory of every duplicated color constant across `src/` collected below (Architecture Patterns → Pattern 1); confirms `CONFIG.PALETTE` does not yet exist |
| VIS-02 | Expanded grunge palette — hue-tinted darks (moss green, blue-grey, rust), WCAG AA contrast recorded per role, no pink | WCAG contrast formula + no existing contrast-check tooling documented (Don't Hand-Roll); banned-hue guardrail pattern documented (Common Pitfalls, Pitfall 12 carryover) |
| VIS-03 | Per-level background/accent theme tinting via the art pipeline, human sign-off | Parallax/tileset sprite-selection architecture traced end-to-end (`main.js` → `parallax.js` → `game.js` → `build.js`); confirms per-level theming requires NEW baked sprite variants + a theme-parameter thread, not a config-only change (Architecture Patterns → Pattern 2) |
| VIS-04 | Doors and enemies get real CC0 sprite art replacing placeholder rect+glyph rendering, human sign-off | New CC0 pack research (door: HorusKDI "6 Color Dungeon 16x16" gate tile; enemies: Kenney "Pixel Platformer"); exact `build.js`/`config.js` swap points identified (Architecture Patterns → Pattern 3) |
| BRAND-01 | Nox Run logo — dark green/black pixel wordmark (CC0 font), light/neon separation element, human sign-off | monogram font re-confirmed live/CC0 (Standard Stack); Pillow pipeline pattern to reuse identified |
| BRAND-02 | Full Math Lab → Nox Run string sweep; save key rename permitted, no resume-check required | Complete grep inventory of every "Math Lab"/"mathlab" occurrence in the live tree, including 3 locations NOT previously named in PITFALLS.md's Pitfall 10 (Runtime State Inventory) |
| BRAND-03 | Logo reveal animation on title screen, ≤500ms, non-strobing | `tween()` + `easings.easeOutQuad` + `onEnd(destroy)` self-clean idiom already used identically in `title.js`'s reset-flash and `hud.js`'s level-up flash — direct precedent to copy (Code Examples) |
</phase_requirements>

## Summary

Phase 26 is pure build-time-asset-and-config work layered onto a stable runtime — it needs **zero new runtime dependencies** (confirmed again this session; the only "new tech" is more Pillow-baked PNGs and more `CONFIG` entries, exactly the pattern the v5.0 STACK.md already established for audio/logo/palette). The real risk in this phase is not technology, it is **wiring surface area**: three separate subsystems (palette, parallax/tileset theming, door/enemy rendering) each touch multiple files, and two of them (VIS-03, VIS-04) require code changes beyond `config.js` — `src/parallax.js` and `src/levels/build.js` currently hardcode single global sprite names (`"bg-far"`/`"bg-mid"`/`"bg-near"`/`"ground"` and the door/enemy `rect()`+`color()`+`text()` calls), so per-level theming and sprite-art swaps both require threading a `theme` (already a `null`-placeholder field on every level descriptor) or new sprite-name parameter through `game.js` into these modules, not just editing `config.js`.

VIS-01's centralization has a large, concrete surface: **11 distinct color constants are duplicated across 6+ files** (`ACCENT_GREEN` alone appears in 5 files with byte-identical values), plus `config.js`'s own `DOOR`/`MATH_GATE` blocks intentionally mirror each other's `LOCKED_GREY`/`LOCKED_BORDER`. This must be swept into one `CONFIG.PALETTE` object before any new hues are added, exactly as CONTEXT.md and the prior PITFALLS.md (Pitfall 12) already specify.

VIS-04's new research need — real CC0 door/enemy sprites — resolved to two strong candidates verified this session via direct page-content fetch (not just search-snippet paraphrase): the **door** can come from the exact same OpenGameArt "6 Color Dungeon 16x16" pack that already supplies `spike.png`/`goal.png` (its own page description explicitly names a "gate" among its three animated elements — zero new license research needed, guaranteed palette/style match), and **enemies** are best sourced from Kenney's **"Pixel Platformer"** pack — the exact same pack `ground.png` already comes from — whose own itch.io listing text explicitly states it "includes platformer tiles including various environments, blocks, items, HUD elements and **both characters and enemies**." Both are real, verifiable, CC0-licensed, and already-vendored-family packs; exact enemy variant count/appearance could not be confirmed pixel-by-pixel this session (WebFetch cannot render images) and should be the literal first task when this work starts — download, screenshot, and inspect before committing to specific sprites.

BRAND-02's save-key decision is already resolved by the user (freely rename-or-not, no resume check required) — but the grep sweep found **one location not previously named** in PITFALLS.md's "three audit scripts" framing: `scripts/check-progress.sh` also hardcodes the literal `'mathlab_platformer_v2'` string in a `grep -q` assertion (line 52-53), so a save-key rename touches **four** scripts, not three, plus `src/config.js` itself.

**Primary recommendation:** Do VIS-01 (centralize) strictly before VIS-02 (expand) and before VIS-03/VIS-04 start reading palette tokens — every other change in this phase reads from `CONFIG.PALETTE`, so sequencing it first avoids rework. Treat VIS-03's "8 distinct themes" as an extension of the *existing* two-function Pillow remap pipeline (`_remap`/`_remap_luminance`), parameterized by theme, not new tooling.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Palette token definition (VIS-01/02) | Build-time config (`src/config.js`) | Build-time art pipeline (`scripts/build-art-assets.py`) | JS runtime reads `CONFIG.PALETTE` for UI/rect colors; Python pipeline must read the SAME hex values for baked PNGs — single source of truth split across two languages, kept in sync by convention (no shared JSON exists yet) |
| Per-level theme selection (VIS-03) | Client/Browser (Kaplay scene — `sprite()` name selection) | Build-time art pipeline (bakes N variants) | Runtime picks WHICH pre-baked PNG to load per level; no runtime color computation (shader tinting explicitly rejected by prior STACK.md research) |
| Door/enemy sprite rendering (VIS-04) | Client/Browser (`src/levels/build.js` cosmetic panel) | Build-time art pipeline (crops/remaps source PNGs) | Collision/physics blocker stays untouched in `build.js`; only the `-panel` visual entity's component list changes from `rect()+color()` to `sprite()` |
| Logo/wordmark rendering (BRAND-01/03) | Build-time art pipeline (Pillow bake) | Client/Browser (`title.js` loads + tweens the baked PNG) | Identical pattern to `title-bg.png` — baked once, loaded via `loadSprite`, animated via existing `tween()` idiom |
| Brand string sweep (BRAND-02) | Static files (`index.html`, `README.md`, `docker/`, `docs/`) | Client/Browser (`title.js`, `select.js` in-world text) | No server tier exists (static nginx hosting); the sweep is a pure text/content change across both served files and in-canvas text() calls |
| Save key (BRAND-02 amendment) | Client/Browser (`localStorage`, origin-scoped) | Build/test tooling (4 scripts read the literal key) | Browser-only persistence; the "server" tier (nginx) never sees or cares about the key |

## Standard Stack

### Core

No new runtime libraries. This phase extends exactly the same two build-time tools the v5.0 STACK.md already locked in:

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Pillow | 10.2.0 (installed, verified `python3 -c "import PIL; print(PIL.__version__)"` in prior session) | Bakes logo PNGs, per-theme parallax/tileset PNGs, cropped door/enemy sprite PNGs | Already the project's sole art-pipeline dependency; `_remap`/`_remap_luminance` in `scripts/build-art-assets.py` already do everything this phase needs — new work is parameterization, not new functions |
| Kaplay 3001.0.19 (vendored, `lib/kaplay.mjs`) | pinned | `loadSprite`, `sprite()`, `color()`, `tween()`, `easings.easeOutQuad` for the reveal animation | Already vendored; zero new API surface needed — every primitive this phase needs (`sprite()`, `tween().onEnd()`) is already used identically elsewhere in the codebase (see Code Examples) |

### New Build-Time-Only Assets (not runtime dependencies)

| Asset | License | Source | Fit |
|-------|---------|--------|-----|
| monogram TTF by datagoblin | CC0 `[VERIFIED: datagoblin.itch.io/monogram]` | https://datagoblin.itch.io/monogram | Re-confirmed live and CC0 this session (2026-07-07) — same recommendation as prior STACK.md, still current. Monospace bitmap pixel font, TTF + bitmap variants. |
| "6 Color Dungeon 16x16" full tile sheet (for the door/gate tile) | CC0 `[VERIFIED: opengameart.org/content/6-color-dungeon-16x16]` | https://opengameart.org/content/6-color-dungeon-16x16 (source file: `16x16 dungeon tiles.png`) | Already the exact source of `assets/spike.png`/`assets/goal.png` — this session's direct page-content fetch confirms the pack's own description: "The gate, coin and torch have some simple animations." A "gate" tile exists in this pack. Only the door-panel crop is new; license research is already done (see `assets/LICENSES/spike.txt`/`goal.txt` for the proof-file template). |
| Kenney "Pixel Platformer" (for enemy sprites) | CC0 `[VERIFIED: kenney-assets.itch.io/pixel-platformer]` | https://kenney.nl/assets/pixel-platformer / https://kenney-assets.itch.io/pixel-platformer (`kenney_pixel-platformer.zip`, 254 kB) | Already the exact source of `assets/tiles/ground.png` (vendored under `assets/_kenney-src/pixel-platformer/`). This session's raw-HTML fetch of the itch.io page confirms literal license text ("Creative Commons Zero v1.0 Universal") and the pack's own description: "This package includes platformer tiles including various environments, blocks, items, HUD elements and **both characters and enemies**." `[ASSUMED]` exact enemy sprite count/appearance — not pixel-verified this session (WebFetch/WebSearch cannot render the actual sprite sheet image); confirm by downloading and visually inspecting before committing to specific enemy variants. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Kenney "Pixel Platformer" enemies (side-view style, matches existing ground.png) | Kenney "Tiny Creatures" (CC0, 100+ monsters, expansion to Kenney "Tiny Dungeon") `[ASSUMED — pack existence/license verified via WebSearch, not WebFetch this session]` | "Tiny" family packs are Kenney's top-down/chibi RPG style, not the side-scroller platformer style already used for player/ground — a style mismatch risk if picked instead of/blended with Pixel Platformer's own enemies. Use ONLY if Pixel Platformer's built-in enemy roster turns out too thin (fewer than 2-3 usable variants) after visual inspection. |
| Kenney "Pixel Platformer" enemies | Kenney "Platformer Pack Redux" (360 assets) or "New Platformer Pack" (440 assets), both CC0 `[ASSUMED]` | Larger Kenney packs, more enemy variety likely, but a different (rounder/cartoonier) native art style than Pixel Platformer's blockier look — irrelevant in practice since the Python remap pipeline (`_remap`/`_remap_luminance`) already retints ANY source art onto the locked dark-grunge palette regardless of native colors (proven by `build_player`/`build_ground` already doing this). Fall back to these only if Pixel Platformer's roster is insufficient. |
| HorusKDI "6 Color Dungeon 16x16" gate tile for the door | Kenney "Tiny Dungeon" (130 assets, CC0, includes dungeon architecture) `[ASSUMED]` | Also a top-down RPG-style pack, not side-view — worse style fit than the already-proven 6-Color-Dungeon pack, which is already vendored-family and side-agnostic (a static gate icon works in either orientation). No reason to use this unless the 6-Color-Dungeon gate tile is unusable. |

**Installation:**
```bash
# No pip/npm install — Pillow 10.2.0 already installed (verified prior session).
# New assets are manually downloaded + vendored with license proofs, same as all prior CC0 assets:
#   assets/_font-src/monogram.ttf                    <- datagoblin monogram (CC0, build-time only)
#   assets/_opengameart-src/6-color-dungeon/*.png     <- HorusKDI dungeon sheet (CC0) — NEW vendor dir,
#                                                          parallel convention to assets/_kenney-src/
#   assets/_kenney-src/pixel-platformer/ (extend)     <- add enemy source frames to the EXISTING dir
#     (ground.png's tile_0000-0004.png already live here — enemy frames are new files in the same dir)
```

**Version verification:** Pillow version already verified in the prior v5.0 research session (`python3 -c "import PIL; print(PIL.__version__)"` → `10.2.0`, satisfies the `Image.Dither.NONE` requirement already in use). No package-registry lookup applies to this phase — there are no npm/pip/cargo package installs; every new dependency is a static CC0 asset file, not a package.

## Package Legitimacy Audit

**Not applicable — this phase installs zero packages.** No `npm install`, `pip install`, or `cargo add` occurs anywhere in this phase's scope; the project's own zero-new-runtime-dependency posture (confirmed again this session by grep of `package.json`/build scripts — none exists at the project root) holds. The "legitimacy" analog for this phase is CC0 license verification of newly-sourced art/font assets, which is covered under Standard Stack above (each new asset is tagged `[VERIFIED]`, `[CITED]`, or `[ASSUMED]` per its actual verification level) and must still go through the project's existing `assets/LICENSES/*.txt` proof-file discipline (see `CREDITS.md`'s existing per-asset row format) before being credited/shipped.

**Packages removed due to [SLOP] verdict:** none — no packages evaluated.
**Packages flagged as suspicious [SUS]:** none — no packages evaluated.

## Architecture Patterns

### System Architecture Diagram

```
                         BUILD TIME (Python/Pillow — scripts/build-art-assets.py)
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  CONFIG.PALETTE (src/config.js)  ── manually mirrored ──►  PALETTE dict      │
  │       (hex tokens: bg/surface/text/danger/reward/barrier/accent-1..4)       │
  │                                            │                                 │
  │                    ┌───────────────────────┼────────────────────────┐       │
  │                    ▼                       ▼                        ▼       │
  │           ENVIRONMENT_PALETTE_    door/enemy source crops    logo composite │
  │           THEME_1..8 (NEW, per-  (6-Color-Dungeon gate;      (monogram TTF  │
  │           level, built FROM      Pixel-Platformer enemy       + Pillow      │
  │           CONFIG.PALETTE's new   frames) ── _remap() ──►      layering)     │
  │           hues) ── _remap_                    │                    │        │
  │           luminance() ──►                     ▼                    ▼        │
  │                    │            assets/door.png            assets/logo-    │
  │                    ▼            assets/enemy-{1,2,3}.png    {hero,badge}.png│
  │      assets/parallax/{far,mid,near}-theme-N.png                             │
  │      assets/tiles/ground-theme-N.png (light tint pass)                     │
  └─────────────────────────────────────────────────────────────────────────────┘
                                          │  (all outputs are static PNGs, committed to git)
                                          ▼
                         RUNTIME (browser — Kaplay 3001, src/*.js)
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  main.js: loadSprite("door", …), loadSprite("enemy-1"/"-2"/"-3", …),        │
  │           loadSprite("bg-far-theme-N", …) × 8, loadSprite("ground-theme-N") │
  │           loadSprite("logo-hero"/"logo-badge", …)                           │
  │                    │                                                        │
  │                    ▼                                                        │
  │  levels/index.js → level-0N.js (theme: "theme-N" instead of null)          │
  │                    │                                                        │
  │                    ▼                                                        │
  │  scenes/game.js: reads levelData.theme → passes to:                        │
  │      ├─► parallax.js: makeParallaxLayers(bounds, theme) → picks "bg-*-theme-N" │
  │      └─► levels/build.js: buildLevel(levelData) → picks "ground-theme-N",  │
  │              sprite("door") for door-panel, sprite("enemy-N") for          │
  │              enemy-panel — REPLACES rect()+color()+text() glyph calls,     │
  │              collision blocker (opacity(HIDDEN) rect + area + body)        │
  │              is UNCHANGED (physics untouched)                              │
  │                    │                                                        │
  │                    ▼                                                        │
  │  scenes/title.js: on scene-enter, add([sprite("logo-hero"), …]) +          │
  │      tween(0,1,≤0.5,…).onEnd() reveal — same self-clean idiom as the       │
  │      existing "Progress reset." flash banner                              │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/config.js               # + CONFIG.PALETTE, extended DOOR/ENEMY blocks (sprite refs, not just color)
src/levels/build.js         # door/enemy panel: rect()+color() -> sprite(); floor/platform: sprite("ground") -> sprite(`ground-${theme}`)
src/parallax.js             # makeParallaxLayers(bounds) -> makeParallaxLayers(bounds, theme); sprite name templated
src/levels/level-0N.js      # theme: null -> theme: "theme-N" (8 distinct values)
src/scenes/title.js         # logo sprite + reveal tween added; ACCENT_GREEN etc. -> CONFIG.PALETTE reads
src/scenes/select.js        # local color consts -> CONFIG.PALETTE reads
src/ui/*.js, src/fx.js      # local color consts -> CONFIG.PALETTE reads
scripts/build-art-assets.py # + PALETTE dict mirroring CONFIG.PALETTE, N theme sub-palettes, build_logo(), build_door(), build_enemies(), build_ground() parameterized by theme
scripts/check-rebrand.sh    # NEW — permanent grep gate (allowlist: save key literal if kept, school-game comments), mirrors check-safety.sh's pattern
scripts/check-contrast.mjs  # NEW (or .py) — small WCAG ratio calculator reading CONFIG.PALETTE, prints/asserts per-role ratios
assets/_font-src/           # NEW — monogram.ttf + license proof
assets/_opengameart-src/    # NEW — parallel convention to _kenney-src, for the 6-Color-Dungeon full sheet
CREDITS.md                  # + rows for door/enemy/font sources
```

### Pattern 1: Centralize-then-expand palette (VIS-01 before VIS-02)

**What:** Sweep every duplicated color-array literal into one `CONFIG.PALETTE` object with named roles, BEFORE adding the 3 new hues.
**When to use:** First task of this phase — every other task (VIS-02/03/04, and even the logo) reads from the centralized tokens.
**Evidence — the full duplication inventory found this session (`grep -n "= \[0x" src/**/*.js`):**

| Constant | Value | Duplicated in |
|----------|-------|----------------|
| `ACCENT_GREEN` | `[0x00,0xff,0x88]` | `src/scenes/title.js`, `src/ui/hud.js`, `src/scenes/select.js` (as `ACCENT_GREEN`/`SELECTABLE_BORDER`), `src/fx.js`, `src/ui/mathGate.js` — **5 files** |
| `LABEL_FG`/`HINT_FG` | `[0xe8,0xe8,0xe8]` | `src/ui/challenge.js` (`LABEL_FG`), `src/scenes/select.js` (`LABEL_FG`), `src/levels/build.js` (`LABEL_FG`), `src/scenes/title.js` (`HINT_FG`), `src/ui/hud.js` (`HINT_FG`) — **5 files** |
| `PANEL_BG` | `[20,20,20]` | `src/ui/challenge.js`, `src/scenes/title.js` |
| `PANEL_BORDER` | `[0x33,0x33,0x33]` | `src/ui/challenge.js`, `src/scenes/title.js`; also `src/ui/hud.js`'s `TRACK_GREY` is the same value |
| `DANGER_RED`/`ACCENT_RED` | `[0xff,0x44,0x33]` | `src/ui/challenge.js` (`ACCENT_RED`), `src/scenes/title.js` (`DANGER_RED`), `src/config.js` `CONFIG.ENEMY.COLOR` — **3 locations, 2 files + 1 config block** |
| `LOCKED_GREY` | `[0x44,0x44,0x44]` | `src/config.js` `CONFIG.DOOR.LOCKED_GREY` AND `CONFIG.MATH_GATE.LOCKED_GREY` (already commented as an intentional mirror), `src/scenes/select.js` |
| `LOCKED_BORDER` | `[0x55,0x55,0x55]` | `src/config.js` `CONFIG.DOOR.LOCKED_BORDER` AND `CONFIG.MATH_GATE.LOCKED_BORDER`, `src/scenes/select.js` |
| `BOX_BG`/`PICKUP_BG` | `[30,30,30]` | `src/ui/challenge.js` (`BOX_BG`), `src/config.js` `CONFIG.COLLECT.PICKUP_BG` |
| `BOX_BORDER`/`PICKUP_BORDER` | `[0x44,0x44,0x44]` | `src/ui/challenge.js` (`BOX_BORDER`), `src/config.js` `CONFIG.COLLECT.PICKUP_BORDER` |
| `CLEARED_BLUE` | `[0x66,0xcc,0xff]` | `src/scenes/select.js` only (not yet duplicated, but a candidate accent-role token) |
| `CURSOR_BORDER` | `[0xff,0xff,0xff]` | `src/scenes/select.js` only |

`CONFIG.PALETTE` does not exist yet — confirmed by full read of `src/config.js` this session.

### Pattern 2: Per-level theming requires baked sprite variants, not runtime tint

**What:** `src/parallax.js`'s `makeParallaxLayers(bounds)` hardcodes the sprite names `"bg-far"`/`"bg-mid"`/`"bg-near"` (single global set, loaded once in `main.js`). `src/levels/build.js`'s floor/platform loops call `sprite("ground", {...})` with a literal string, also single global. Neither currently reads `levelData.theme` (which exists as a `null` placeholder on every level descriptor — confirmed in all 8 `src/levels/level-0N.js` files, comment: `theme: null, // Phase 18 placeholder — visual theming`).
**When to use:** VIS-03's implementation. Two structural options exist:
1. **Baked-variant approach (recommended — matches prior STACK.md decision).** Extend `build-art-assets.py` to emit N theme-specific PNG sets (`assets/parallax/far-theme-N.png` etc., `assets/tiles/ground-theme-N.png`), `main.js` `loadSprite`s all of them under theme-qualified names, and `parallax.js`/`build.js` accept a `theme` parameter to select which sprite name to use. This is a parameterization of the EXISTING `_remap`/`_remap_luminance` functions — no new pipeline code, just a loop over 8 sub-palettes (built from `CONFIG.PALETTE`'s 3 new hues + existing neutrals) instead of one call.
2. **Runtime `color()` tint (rejected by prior STACK.md research: "Runtime Kaplay shader tinting | Never — shaders add complexity and per-frame cost for what is a build-time color decision").** Kaplay's `color()` component does exist and multiplies a sprite's rendered color per the official docs example (`add([sprite("bean"), color(0,0,255)])`) `[CITED: kaplayjs.com/docs/api/ctx/color/]` — but this exact multiply-tint behavior was **not verified against the vendored 3001.0.19 minified build** this session (the file is fully minified with no readable function names, unlike the audio API which STACK.md verified by reading source directly). Given the project's own established distrust of current kaplay.dev docs for this pinned build ("do NOT trust current kaplay.dev docs blindly — they describe 4000-series builds"), do not choose this path without an empirical spike first. **Recommendation: use option 1.**
**Example (extending the existing pattern, not new code):**
```python
# Source: scripts/build-art-assets.py (existing _remap_luminance already does this;
# VIS-03 just calls it in a loop with N sub-palettes instead of once)
THEME_PALETTES = {
    "theme-1": [ENVIRONMENT_PALETTE[0], MOSS_GREEN, ENVIRONMENT_PALETTE[4]],   # calm, early levels
    # ... 8 entries total, built from CONFIG.PALETTE's 3 new hues + existing neutrals
}
for theme_id, palette in THEME_PALETTES.items():
    remapped = _remap_luminance(far_source, palette)
    save(remapped, f"assets/parallax/far-{theme_id}.png")
```

### Pattern 3: Door/enemy sprite swap is contained to the cosmetic panel — collision untouched

**What:** `src/levels/build.js`'s door/math-gate/enemy loops already split an INVISIBLE tall collision blocker (`opacity(HIDDEN), area(), body({isStatic:true}), "door"`/`"enemy"` tag) from a separate cosmetic `-panel` entity (currently `rect()+color()+outline()`) and a separate `-glyph` text entity ("X"/"?"/"!"). Both mechanics modules (`door.js`, `gates.js`, `enemy.js`) destroy `panelObj`/`glyphObj` together at resolution time via `if (enemyObj.panelObj) destroy(enemyObj.panelObj); if (enemyObj.glyphObj) destroy(enemyObj.glyphObj);` (confirmed identical pattern in all 3 mechanics files).
**When to use:** VIS-04's implementation. Swap ONLY the `-panel` entity's component list from `rect(W,H), pos(...), color(...), outline(...)` to `sprite("door")` / `sprite(enemyVariant)`, `pos(...)`. Leave the blocker (physics) and the `panelObj`/`glyphObj` stash-and-destroy wiring completely alone. Whether the `-glyph` text ("X"/"!") is kept alongside the new sprite or dropped is an open planning decision (a real sprite may not need the glyph) — see Open Questions.
**Example:**
```javascript
// Source: src/levels/build.js (current, lines 253-258) — the ONLY lines VIS-04 touches for enemies
const panel = add([
  rect(CONFIG.ENEMY.W, CONFIG.ENEMY.H),
  pos(e.x, e.y),
  color(...CONFIG.ENEMY.COLOR),
  "enemy-panel",
]);
// becomes (variant chosen from e.g. e.variant ?? default rotation):
const panel = add([
  sprite(CONFIG.ENEMY.SPRITES[e.variant ?? 0]),  // e.g. "enemy-1"/"enemy-2"/"enemy-3"
  pos(e.x, e.y),
  "enemy-panel",
]);
```

### Anti-Patterns to Avoid
- **Editing `CONFIG.DOOR`/`CONFIG.MATH_GATE`'s deliberate mirror out of sync:** the two blocks intentionally share `LOCKED_GREY`/`LOCKED_BORDER` per an existing code comment ("Mirrors DOOR dimensions/palette so the locked checkpoint reads as a related barrier"). If VIS-04 gives doors real sprite art but math-gates stay flat-color, keep this an explicit, documented decision (they ARE different mechanics — door vs. checkpoint — so divergence may be correct) rather than an accidental drift.
- **Recoloring the player sprite or the base tileset shape** — explicitly out of scope per CONTEXT.md and REQUIREMENTS.md's own Out-of-Scope table ("Recoloring the signed-off v4.1 sprites | Sprites passed human sign-off; palette expansion tints themes, not the validated art").
- **Runtime shader/color-multiply tinting instead of baked PNGs** — already rejected by prior STACK.md research; stay consistent (see Pattern 2).
- **Forgetting `scripts/check-progress.sh`'s hardcoded key grep** when touching the save key — see Runtime State Inventory below; this is a 4th location beyond the "three audit scripts" PITFALLS.md Pitfall 10 named.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| WCAG contrast ratio calculation | A from-scratch color-science library | The standard relative-luminance + contrast-ratio formula (W3C WCAG 2.x, ~15 lines: sRGB→linear via the 0.03928 threshold piecewise function, then `(L1+0.05)/(L2+0.05)`) implemented directly in a small Node/Python script reading `CONFIG.PALETTE` | This is a well-defined, stable public formula (not an evolving library problem) — writing ~15 lines against the spec is appropriate and matches the project's "small script rather than eyeballed" instruction; no npm/pip dependency needed or wanted (zero-new-dependency posture) |
| CC0 license verification | Manual eyeballing / trusting pack names from memory | The project's own established `assets/LICENSES/*.txt` proof-file process (quote the source page's own "License(s):" field, record the exact URL, date-stamp the verification) | Already a proven, working process (9 existing proof files); Phase 26 just adds 3 more (font, door, enemy) following the identical template |
| Per-theme palette design | Inventing arbitrary new hex values per level | Reuse `CONFIG.PALETTE`'s 3 new hue tokens (moss/blue-grey/rust) + existing neutrals in different proportions/weightings per theme, exactly as `ENVIRONMENT_PALETTE_FAR/MID/NEAR/TITLE` already do today (documented in `build-art-assets.py`: "all reused from ENVIRONMENT_PALETTE's existing tokens, never invented") | Keeps every theme provably inside the locked, sign-off-validated luminance band; prevents the exact drift Pitfall 12 warns about |

**Key insight:** every "don't hand-roll" concern in this phase is really "don't invent new colors/logic outside the two already-proven mechanisms (centralized token table + Pillow remap functions)" — the pipeline itself needs zero new capability, just more disciplined parameterization.

## Runtime State Inventory

> Triggered by BRAND-02's rename/rebrand scope (Math Lab → Nox Run string sweep + optional save-key rename).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | The `mathlab_platformer_v2` blob itself, already living in her browser's localStorage (origin-scoped). Per the confirmed user decision, this is explicitly ALLOWED to be orphaned/reset — no migration required. | None required by decision, but if the key literal changes, `CONFIG.SAVE.KEY` (single source, `src/config.js:168`) is the only in-app write; no other in-app write path exists (confirmed: `src/progress.js`'s `loadSave()`/`writeSave()`/`resetSave()` are the only 3 localStorage call sites in `src/`). |
| Live service config | None — no external services (no n8n/Datadog/Tailscale/etc. analogs in this static-site project). | None. |
| OS-registered state | None — no OS-level task scheduler, pm2, launchd, systemd registrations for this static-file game. | None. |
| Secrets/env vars | None — no `.env`, no SOPS, no CI/CD env vars reference "mathlab" or "Math Lab" (grep confirmed zero hits outside `src/`, `scripts/`, `docs/`, `README.md`, `CREDITS.md`, `docker/`). | None. |
| Build artifacts / test-fixture literals | **`scripts/check-progress.sh` lines 52-53** hardcode `grep -q 'mathlab_platformer_v2' "$ROOT/src/config.js"` as a gate assertion — this is a **4th script** hardcoding the save-key literal, distinct from the "three audit scripts" (`browser-boot.mjs`, `screenshot-phase20.mjs`, `audit-phase21-mechanics.mjs`) PITFALLS.md's Pitfall 10 already named. If the key literal changes, this grep assertion must be updated to the new literal in the SAME commit, or it becomes a permanently-failing (or worse, silently-stale) gate. | Code edit: update the literal in `check-progress.sh` alongside `config.js` and the 3 audit scripts' `SAVE_KEY` consts, IF the key literal is changed. If the key literal is kept, no action. |

**Full grep-verified inventory of "mathlab"/"Math Lab" occurrences in the live tree (this session, `grep -rni "math lab\|mathlab"`):**

| File | Line(s) | Content | Sweep disposition |
|------|---------|---------|--------------------|
| `src/config.js` | 163, 168 | Comment referencing the old v3.0 key + `KEY: "mathlab_platformer_v2"` | Comment: rewrite. Literal: rename or keep per Claude's discretion (decision already made that either is acceptable) |
| `src/config.js` | 217, 221 | `TITLE` block comments: `"Math Lab" wordmark` ×2 | Rewrite to Nox Run |
| `src/progress.js` | 28, 204 | Comments referencing `mathlab_save_*` (the SCHOOL GAME's keys, not this game's) | **ALLOWLIST — do not touch.** These describe someone else's keys per existing project convention. |
| `src/progress.js` | 299, 304, 310, 329, 331, 350 | Six `console.warn("[MathLab] ...")` calls | Rewrite tag to `[NoxRun]` (not explicitly named in CONTEXT.md's sweep scope list, but caught by the "full sweep" mandate and the grep-gate's own logic — these are developer-facing console strings, lower priority than user-facing UI but still literal "MathLab" occurrences) |
| `src/main.js` | 1 | Header comment: `Math Lab v3.0 game shell` | Rewrite |
| `src/index.html` | 6, 37, 41 | `<title>Math Lab — loading</title>`, file:// fallback `<title>`, fallback `<h1>` | Rewrite — explicitly named in CONTEXT.md (`HTML title`) |
| `src/scenes/title.js` | 1, 28, 38, 50, 53 | Header/inline comments + the literal `text("Math Lab", ...)` wordmark call | Rewrite — the wordmark call itself becomes the new logo sprite (BRAND-01), comments follow |
| `scripts/check-progress.sh` | 52-53 | `grep -q 'mathlab_platformer_v2' ...` gate assertion | See Build Artifacts row above |
| `scripts/generate-art-assets.py` | 2 | Docstring: "placeholder pixel-art assets for Math Lab" | Rewrite (this script is a labeled dev/prototyping tool per its own docstring, low priority but still a hit) |
| `scripts/build-art-assets.py` | 2 | Docstring: "real-CC0-art pixel assets for Math Lab" | Rewrite |
| `docs/DEPLOY.md` | 1, 3 | "Deploying Math Lab to a web URL", "Math Lab ships as..." | Rewrite — explicitly named (`docs/`) |
| `docs/DEPLOY.md` | 76-81 | Docker image/container names `mathlab:phase7`, `--name mathlab` | Rewrite — these are literal command examples a developer would copy-paste; stale naming here is a real (if low-severity) footgun |
| `docker/Dockerfile` | 1 | Comment: "Single-stage static file server for Math Lab." | Rewrite — explicitly named (`docker/Dockerfile comments`) |
| `README.md` | 1 | `# Math Lab v3.0 — The Platformer` | Rewrite — explicitly named |
| `CREDITS.md` | 3 | "Math Lab ships a small subset of third-party pixel art..." | Rewrite — explicitly named |

**Console-warning tag rewrite is a judgment call, not a hard requirement** — CONTEXT.md's sweep scope list names HTML title, title screen, docs, Docker, README explicitly but not console strings. Recommend including them anyway since the negative grep gate (BRAND-02's "permanent regression check") will otherwise need an awkward allowlist entry for `[MathLab]` specifically, which is more fragile than just renaming 6 short strings.

## Common Pitfalls

> The prior milestone's `.planning/research/PITFALLS.md` (2026-07-05) already documents Pitfalls 10-13 in full depth for this exact phase's domain (save-key/origin wipe, stale-brand scatter, palette contrast/semantics, invisible logo). Pitfall 10's save-key section carries an explicit "Superseded 2026-07-07" annotation reflecting the CONTEXT.md override — the deployed-origin half of that pitfall is UNCHANGED (no URL change planned). Do not re-derive those four pitfalls here; the planner should read them directly. This section adds ONLY pitfalls specific to this session's NEW findings (VIS-04, the parallax/tileset wiring gap, and the 4th save-key-literal location).

### Pitfall A: `scripts/check-progress.sh`'s hardcoded save-key grep is a silent trap if the key is renamed

**What goes wrong:** If the save key literal changes (Claude's discretion, permitted this phase) and only `src/config.js` + the 3 audit scripts' `SAVE_KEY` consts are updated, `check-progress.sh`'s line 52-53 `grep -q 'mathlab_platformer_v2' "$ROOT/src/config.js"` starts failing — not because anything is broken, but because the gate is checking for the OLD literal that no longer exists in the file it's grepping. The failure message ("missing NEW versioned save key...") will be actively misleading (it will look like a regression, not a stale assertion).
**Why it happens:** This script's assertion was written when `mathlab_platformer_v2` was expected to be permanent; it was never updated when the CONTEXT.md decision made the key renameable, and it is easy to miss because it lives in a shell gate script, not in `src/` where a "rename Math Lab" sweep naturally focuses attention.
**How to avoid:** If the key literal is renamed, update this grep pattern in the SAME commit as `config.js`'s `KEY:` value change. If the key literal is kept as-is (the "simpler" option per Claude's discretion note), this pitfall is moot — document that choice explicitly so a future contributor doesn't wonder why an old-looking key survived a full rebrand.
**Warning signs:** `check-progress.sh` failing after a save-key-touching commit with a message about a "missing" key that was, in fact, intentionally renamed.
**Phase to address:** This phase, as part of BRAND-02 — a one-line addition to the sweep's own verification checklist.

### Pitfall B: Per-level theming silently no-ops if only `config.js`/level descriptors change

**What goes wrong:** A plan that treats VIS-03 as "just add hex values to `CONFIG.PALETTE` and set `theme: "theme-N"` on each level descriptor" ships something that LOOKS complete (the data is there) but changes nothing visually — `parallax.js` and `build.js` don't read `levelData.theme` today; they call `sprite("bg-far")`/`sprite("ground")` with hardcoded literal names regardless of what theme is set. This is the exact "looks done but isn't" failure class the project's own PITFALLS.md checklist culture is built to catch.
**Why it happens:** `theme: null` looks like an already-wired optional field (it's read nowhere as `null` explicitly guards anything — it's simply never read at all), so it's easy to assume the plumbing exists because the placeholder does.
**How to avoid:** Any VIS-03 plan must include explicit tasks to (1) thread `theme` from `game.js`'s level-load into `makeParallaxLayers(bounds, theme)` and `buildLevel(levelData)` (already has `levelData` in scope, just needs to read `.theme`), and (2) verify via an actual in-browser screenshot per level (not just a code review) that 8 visually distinct backgrounds render — a static code check cannot catch a silently-ignored theme parameter.
**Warning signs:** All 8 levels look visually identical after the "theming" commit; `levelData.theme` never appears as a read (only a write/default) anywhere outside the level descriptor files.
**Phase to address:** This phase — make the wiring an explicit task, not folded silently into "add palette colors."

### Pitfall C: Sourcing enemy sprites from a stylistically mismatched pack

**What goes wrong:** Kenney's "Tiny Creatures"/"Tiny Dungeon" family (a legitimate, well-known CC0 monster source) is a top-down/chibi-RPG art style, visually distinct from the side-view walk-cycle style already established by `player.png` (Kenney "Platformer Characters") and implicitly expected for anything standing next to the player at the same camera angle. Using these sprites for the enemy panel without adaptation could read as visually inconsistent even after palette remap (remap fixes COLOR, not perspective/proportions).
**Why it happens:** "Tiny Creatures" is genuinely the easiest, most monster-rich CC0 pack to find via search (100+ monsters, one download) — the path of least resistance is also the style mismatch.
**How to avoid:** Try Kenney "Pixel Platformer" (same pack as `ground.png`, confirmed this session to include "characters and enemies") FIRST. Only fall back to Tiny Creatures/Tiny Dungeon if Pixel Platformer's roster is too thin, and if so, hand-pick individual sprites that read reasonably in profile/side-view rather than bulk-importing the set.
**Warning signs:** Enemy sprites that look like they're facing the camera (top-down) while the player sprite is clearly side-view; enemies that look "cuter"/rounder than the game's established grunge tone even after palette remap.
**Phase to address:** This phase's VIS-04 sourcing task — make "confirm side-view/profile orientation" an explicit checklist item before committing to a pack, alongside the license proof.

## Code Examples

### Self-cleaning tween reveal (BRAND-03 — direct precedent already in the codebase)

```javascript
// Source: src/scenes/title.js confirmReset() — the "Progress reset." banner,
// the EXACT idiom the logo reveal tween should copy (self-destroying tween,
// easeOutQuad, no timer/scheduler call, non-strobing single-shot)
const banner = add([
  text("Progress reset.", { size: T.PROMPT_SIZE }),
  anchor("center"),
  pos(center()),
  color(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]),
  opacity(1),
  fixed(),
  z(9500),
  "title",
]);
tween(1, 0, T.RESET_FLASH_MS / 1000, (v) => (banner.opacity = v), easings.easeOutQuad).onEnd(
  () => destroy(banner),
);
// For the logo reveal: tween opacity 0 -> 1 (or a subtle scale/opacity combo) over
// <= 500ms, triggered unconditionally at scene-enter (titleScene's top level, not
// inside an input handler) since it's a pure visual tween, not audio-gated.
```

### WCAG relative-luminance + contrast-ratio formula (for the VIS-02 contrast-check script)

```javascript
// Standard W3C WCAG 2.x formula — MEDIUM confidence [CITED: W3C WCAG 2.1 formula,
// well-established/stable spec, not expected to change]. No library needed.
function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
function contrastRatio(rgbA, rgbB) {
  const L1 = relativeLuminance(rgbA), L2 = relativeLuminance(rgbB);
  const [lighter, darker] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (lighter + 0.05) / (darker + 0.05); // AA text needs >= 4.5, UI components >= 3.0
}
```

### Door/enemy panel sprite swap (VIS-04 — see Architecture Patterns Pattern 3 for full context)

```javascript
// Source: src/levels/build.js current door-panel block (lines 174-181) — the pattern
// to follow for BOTH door and enemy panels. Only the -panel entity's components
// change; the blocker (collision) and -glyph (if kept) are untouched.
const panel = add([
  sprite("door"),      // was: rect(CONFIG.DOOR.W, CONFIG.DOOR.H), color(...CONFIG.DOOR.LOCKED_GREY), outline(2, ...)
  pos(d.x, d.y),
  "door-panel",
]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Door: flat grey `rect()` + "X" `text()` glyph | Real CC0 sprite (`assets/door.png`, sourced from the same pack as spike/goal) | This phase (VIS-04) | Visual coherence with the rest of the dark-grunge tileset; removes the "level-select locked-tile lookalike" placeholder feel |
| Enemy: flat red `rect()` + "!" `text()` glyph (comment: "Compact square placeholder; Phase 18 replaces it with a sprite" — never happened across 2 prior art passes) | Real CC0 sprite, 2-3 distinct variants | This phase (VIS-04) | Closes a debt item open since Phase 18 (v4.0) — two prior art passes (v4.0 Phase 18, v4.1's rework) both left this placeholder in place |
| Single global palette + single global parallax/tileset sprite set | Centralized `CONFIG.PALETTE` + 8 baked per-level theme variants | This phase (VIS-01/02/03) | "More levels" starts to feel like "more places," per the prior FEATURES.md differentiator framing |
| "Math Lab" branding throughout | "Nox Run" branding, full sweep + logo | This phase (BRAND-01/02/03) | Closes the v3.0-kickoff-era name; game now matches its actual identity established at the v3.0 pivot ("Nox Run" per CLAUDE.md's own project framing) |

**Deprecated/outdated:** The `mathlab_platformer_v2` save key's "never touch" status (PITFALLS.md Pitfall 10's original framing, STATE.md's original binding decision) is explicitly superseded for THIS phase only, by direct user confirmation — see User Constraints above. Do not treat this as a general precedent for future phases; it was a one-time, explicitly-confirmed exception.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Kenney "Pixel Platformer" pack's "characters and enemies" includes 2-3 usable, stylistically-consistent enemy sprite variants | Standard Stack, Pitfall C | If the pack turns out to have only 1 enemy type (or none usable at side-view), VIS-04's "2-3 distinct variants" requirement needs a fallback pack (Tiny Creatures / Platformer Pack Redux), adding sourcing time and a style-consistency risk documented in Pitfall C |
| A2 | Kaplay 3001.0.19's `color()` component multiplies a sprite's rendered pixels (standard tint behavior) | Architecture Patterns Pattern 2 | Not load-bearing — this assumption is explicitly NOT the recommended path (baked PNGs are); flagged only because it was considered and rejected. If ever revisited, verify empirically against the vendored build before relying on it, per this project's own established distrust of current kaplay.dev docs for the pinned 3001 build |
| A3 | The 6-Color-Dungeon "gate" tile (confirmed to exist in the pack) is visually and dimensionally usable as a door sprite once cropped/scaled to `CONFIG.DOOR.W/H` (32×64) | Standard Stack | If the gate tile is a small single 16×16 icon rather than a tall multi-cell shape, it will need vertical stretching/tiling to fill the 32×64 door footprint — same NEAREST-scale technique already used in `build_player()`'s Pattern 1 (shared scale factor, bottom-anchored), so this is a low-risk assumption, but the exact tile dimensions were not pixel-verified this session |
| A4 | Console `console.warn("[MathLab] ...")` tags in `src/progress.js` are worth including in the BRAND-02 sweep even though not explicitly named in CONTEXT.md's scope list | Runtime State Inventory | Low risk either way — omitting them just means 6 low-visibility dev-console strings survive, which is a minor, easily-deferred cleanup, not a functional issue |

**If this table is empty:** N/A — see rows above.

## Open Questions

1. **Does the door/enemy `-glyph` text ("X"/"?"/"!") stay alongside the new sprite art, or get removed?**
   - What we know: CONTEXT.md says static sprites replace "placeholder rect+glyph rendering" — reads as "the whole placeholder look" going away, but doesn't explicitly say the glyph text node itself is deleted vs. just visually de-emphasized/kept as a small icon overlay.
   - What's unclear: Whether removing the glyph loses any useful player-facing signal (e.g., "?" on math-gates communicates "answer a question here" at a glance; a generic locked-gate sprite might not).
   - Recommendation: Default to removing the glyph for door/enemy (the sprite art IS the signal), but the checkpoint math-gate's "?" glyph is explicitly OUT of VIS-04's scope (VIS-04 only names doors and enemies) — leave math-gate rendering untouched this phase unless CONTEXT.md's "mirrors DOOR" convention pulls it in as a side effect.

2. **Does the save key literal actually change, or stay as `mathlab_platformer_v2` while simply losing its "protected" status?**
   - What we know: Both are explicitly permitted per CONTEXT.md ("Claude's call during planning based on what's simplest/cleanest").
   - What's unclear: Which is actually simplest — renaming touches `config.js` + 4 scripts (3 audit scripts + `check-progress.sh`, per this session's finding) in one atomic commit; keeping it means a full grep sweep still finds and must special-case-allowlist this one literal (since it will keep matching `"mathlab"` in the negative grep gate).
   - Recommendation: Rename it (e.g., `noxrun_platformer_v1` or similar) — since a fresh start is already accepted, a clean new key avoids permanently special-casing an old-branded string in the new regression gate, and the 4-script update is small and mechanical.

3. **Exact per-level theme-to-level hue assignment (which of the 8 levels gets which accent).**
   - What we know: LEVEL_ORDER is a simple linear array (`level-01` → `level-08`, confirmed in `src/levels/index.js`); table pools per level are NOT strictly monotonic with LEVEL_ORDER (e.g., level-01 has the hard `[6,7,8,9]` pool by earlier deliberate design, level-05 has the easy `[2,3,4,5]` pool) — table pool alone is not a reliable pacing signal.
   - What's unclear: Whether "pacing" should be driven primarily by LEVEL_ORDER (play sequence — always monotonic) or by a blended difficulty signal (platforming + table pool, which is what Phase 25's own level-design work already established per-level).
   - Recommendation: Use LEVEL_ORDER as the primary pacing axis (calmer hues on level-01/02, harsher on level-07/08) since that's what the player actually experiences as "getting harder," with table-pool/verticality as a secondary tie-breaker within that ordering. This is Claude's discretion per CONTEXT.md — record the final table in the phase's evidence doc for sign-off.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Pillow (Python) | Logo/palette/door/enemy PNG baking | ✓ (verified prior session) | 10.2.0 | — |
| Python 3 | Running `build-art-assets.py` | ✓ (already the project's build-time runtime) | — | — |
| Node.js | Any new `check-contrast.mjs`/`check-rebrand.sh` gate script | ✓ | v22.22.2 (installed, verified prior session) | — |
| Internet access (one-time, for asset download) | Downloading the monogram TTF, the 6-Color-Dungeon full sheet, and Pixel Platformer enemy frames | Not independently verified this session (execution environment, not research environment) | — | If offline at execution time, this blocks VIS-04/BRAND-01 entirely — no local fallback exists for net-new CC0 assets; flag as a blocking prerequisite for whichever plan/task performs the download |

**Missing dependencies with no fallback:** None confirmed missing — all build-time tooling already verified present in the prior v5.0 research session and unchanged since (no new package installs occurred between then and now per this session's `package.json`/build-script grep).

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no JS test framework) — shell gate scripts (`scripts/check-*.sh`) + Playwright-driven browser scripts (`scripts/browser-boot.mjs`, `scripts/audit-phase21-mechanics.mjs`) ARE the suite, per project convention |
| Config file | none — see Wave 0 gaps below |
| Quick run command | `bash scripts/check-safety.sh && node scripts/validate-levels.mjs` (fast structural/safety checks) |
| Full suite command | `bash scripts/check-gate.sh && bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-progress.sh && node scripts/validate-levels.mjs && node scripts/browser-boot.mjs` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|-------------|
| VIS-01 | `CONFIG.PALETTE` exists; no scene/UI file has a raw `[0x.., 0x.., 0x..]` color literal outside `config.js` | static/manual | `grep -rn "= \[0x" src/scenes/ src/ui/ src/fx.js src/levels/build.js` should return zero rows (a new negative-grep check) | ❌ Wave 0 — new grep gate |
| VIS-02 | Every named palette role clears WCAG AA (4.5:1 text / 3:1 UI); no hue in the banned magenta/pink band | automated | `node scripts/check-contrast.mjs` (NEW) | ❌ Wave 0 |
| VIS-03 | All 8 levels render visually distinct backgrounds/accents in the running game | manual (human sign-off, per CONTEXT.md mandate) | screenshot each level via `scripts/browser-boot.mjs` extension or manual playtest | ❌ Wave 0 — extend browser-boot or add a per-level screenshot task |
| VIS-04 | Door and each enemy variant render as real sprites; collision/trigger behavior unchanged | automated (existing) + manual | `node scripts/audit-phase21-mechanics.mjs` (regression: `triggered: true` for every door/enemy encounter, unchanged from pre-VIS-04 baseline) + human visual sign-off | ✓ existing harness, extend assertions if needed |
| BRAND-01 | Logo renders legibly at both baked sizes, at real title-screen scale | manual (human sign-off) | in-browser screenshot at actual canvas size (640×360 internal, 1.5× displayed) | ❌ Wave 0 — no automated legibility test possible (this is inherently a human-judgment check per Pitfall 13) |
| BRAND-02 | Zero un-allowlisted "math lab"/"mathlab" occurrences remain | automated | `bash scripts/check-rebrand.sh` (NEW — grep + allowlist, permanent gate per CONTEXT.md) | ❌ Wave 0 |
| BRAND-03 | Logo reveal animation completes in ≤500ms, one-shot, non-strobing | automated (timing) + manual (visual) | `bash scripts/check-safety.sh` already asserts no `setTimeout`/`setInterval`/`wait()`/`loop()` anywhere in `src/` — the reveal must use `tween()` only, which the existing gate already enforces; duration ≤500ms is a code-review/manual check against `T.LOGO_REVEAL_MS` in `config.js` | ✓ existing `check-safety.sh` covers the "no scheduler" half; new manual check for the ≤500ms value |

### Sampling Rate
- **Per task commit:** `bash scripts/check-safety.sh` (fast, catches timer/glyph regressions immediately)
- **Per wave merge:** Full suite command above, plus the two NEW gates (`check-rebrand.sh`, `check-contrast.mjs`) once they exist
- **Phase gate:** Full suite green + all 5 human-sign-off items (palette hazard-readability, per-level themes, door/enemy sprites, logo, logo reveal) closed before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `scripts/check-rebrand.sh` — new permanent negative-grep gate for BRAND-02 (allowlist: school-game comments in `progress.js`, + the save-key literal IF kept unchanged)
- [ ] `scripts/check-contrast.mjs` (or `.py`) — new WCAG ratio calculator for VIS-02, reading `CONFIG.PALETTE`
- [ ] A negative-grep check for VIS-01 (no raw color-array literals outside `config.js` in scene/UI files) — could be folded into `check-safety.sh` or a new small script
- [ ] Per-level screenshot/visual-diff capability for VIS-03's 8-theme sign-off — extend `scripts/browser-boot.mjs` or add a dedicated screenshot script (precedent: `scripts/screenshot-phase20.mjs` already exists as a template)
- [ ] `assets/_font-src/` and `assets/_opengameart-src/` directories — do not exist yet, need creating with the same license-proof discipline as `assets/_kenney-src/`

## Security Domain

> `security_enforcement: true` in `.planning/config.json` (ASVS level 1, block on "high"). This phase is a build-time-asset/visual/branding phase with no new network, auth, session, or data-input surface — the applicable ASVS categories below are correspondingly minimal.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | no | No auth surface anywhere in this project (client-only game, no accounts) |
| V3 Session Management | no | No sessions; localStorage progress is not a security boundary |
| V4 Access Control | no | No access-control surface |
| V5 Input Validation | no (no new input) | N/A — no new user-input surface is added by palette/sprite/rebrand work; `src/progress.js`'s existing validated-field save-loading (already-shipped, unchanged by this phase) remains the only "untrusted input" boundary in this project, and this phase does not touch it |
| V6 Cryptography | no | No crypto anywhere in this project |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Sourcing non-CC0 art/font and shipping it in a public repo (license/IP risk, not a STRIDE-classic threat but a real project risk) | — (out-of-STRIDE, but flagged per project's own security-adjacent CC0 discipline) | Same `assets/LICENSES/*.txt` proof-file process already used for all 9 existing assets — quote the source's own license declaration, verify it says CC0 (not CC-BY/CC-BY-SA), date-stamp the check |
| Rebrand touching `docker/nginx.conf`/`docker/Dockerfile` carelessly (config drift, not part of THIS phase's scope but adjacent) | Tampering (config) | This phase only touches Dockerfile COMMENTS (per CONTEXT.md's sweep scope), not the actual `COPY`/`EXPOSE`/`nginx.conf` directives — verify the diff touches ONLY comment lines in `docker/Dockerfile`, confirmed unchanged functional config |

No further security surface identified for this phase.

## Sources

### Primary (HIGH confidence — direct repo inspection this session)
- `src/config.js` (full read) — confirms `CONFIG.PALETTE` does not exist; DOOR/MATH_GATE/ENEMY/COLLECT/SAVE block contents and exact line numbers
- `src/levels/build.js` (full read) — door/math-gate/enemy panel+blocker+glyph structure; `LABEL_FG` local duplication; debug-overlay pattern
- `src/parallax.js` (full read) — confirms hardcoded `"bg-far"`/`"bg-mid"`/`"bg-near"` sprite names, no theme parameter
- `src/progress.js` (full read) — save-key seam, all 3 localStorage call sites, console.warn tag locations
- `src/scenes/title.js` (full read) — existing tween/self-clean idiom, local color constants
- `scripts/build-art-assets.py` (full read) — `_remap`/`_remap_luminance` functions, `ENVIRONMENT_PALETTE*` sub-palette pattern, `build_player`/`build_ground`/`build_parallax`/`build_title_bg` functions
- `CREDITS.md`, `assets/LICENSES/spike.txt`, `assets/LICENSES/goal.txt` — existing license-proof template and the "6 Color Dungeon 16x16" pack's already-vetted provenance
- Full-repo grep sweeps (`grep -rni "math lab\|mathlab"`, `grep -n "= \[0x"`) — complete duplication/rebrand inventories in this Sources → Runtime State Inventory and Architecture Patterns sections
- `.planning/config.json` — `nyquist_validation: true`, `security_enforcement: true` (ASVS level 1)
- `.planning/phases/26-grunge-palette-nox-run-rebrand/26-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/research/STACK.md`, `.planning/research/FEATURES.md`, `.planning/research/PITFALLS.md` — full reads, prior-milestone research and locked decisions

### Secondary (MEDIUM confidence — WebFetch/WebSearch verified against official pages this session)
- [monogram by datagoblin](https://datagoblin.itch.io/monogram) — re-confirmed live, CC0, this session
- [6 Color Dungeon 16x16 — OpenGameArt](https://opengameart.org/content/6-color-dungeon-16x16) — raw-HTML fetch confirmed "The gate, coin and torch have some simple animations" and CC0 license
- [Pixel Platformer — Kenney (itch.io)](https://kenney-assets.itch.io/pixel-platformer) — raw-HTML fetch confirmed literal text "includes platformer tiles including various environments, blocks, items, HUD elements and both characters and enemies" and "Creative Commons Zero v1.0 Universal" license
- [Kenney Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon), [Kenney Tiny Creatures / clintbellanger](https://opengameart.org/content/tiny-creatures) — pack existence/CC0/content-summary via WebSearch (not raw-HTML-verified) — fallback candidates only, see Alternatives Considered
- [KAPLAY Docs, color](https://kaplayjs.com/docs/api/ctx/color/) — `color()` component example syntax (NOT verified against the vendored 3001.0.19 minified build — see Assumption A2)

### Tertiary (LOW confidence — WebSearch summary only, not independently cross-checked)
- Kenney "Platformer Pack Redux"/"New Platformer Pack" asset counts and general contents — search-snippet only, not fetched directly this session

## Metadata

**Confidence breakdown:**
- Standard stack (Pillow/Kaplay, zero new deps): HIGH — direct repo inspection, matches already-verified prior STACK.md
- Architecture (palette/parallax/build.js wiring): HIGH — every integration point read directly from the live source this session
- VIS-04 asset sourcing (door/enemy packs): MEDIUM — pack existence, license, and top-level content description verified via raw-HTML fetch; exact pixel-level sprite roster NOT verified (WebFetch cannot render images) — flagged explicitly in Assumptions Log
- Pitfalls: HIGH for repo-specific findings (save-key 4th script, theme-wiring gap) — carried forward at HIGH/MEDIUM from prior PITFALLS.md for the 4 reused pitfalls (10-13)

**Research date:** 2026-07-07
**Valid until:** ~30 days for the repo-inspection findings (stable until the next phase touches these files); ~14 days for the CC0 pack recommendations (asset pack availability/URLs can change; re-verify at download time regardless, per the project's own license-proof discipline)
