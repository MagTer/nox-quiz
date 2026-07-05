# Stack Research

**Domain:** Browser 2D platformer (vendored Kaplay, no-build) — v5.0 "Nox Run — Real Levels" milestone additions
**Researched:** 2026-07-05
**Confidence:** HIGH (Kaplay audio API verified by direct inspection of the vendored `lib/kaplay.mjs` build, not docs; asset-source and format claims cross-checked web findings, MEDIUM)

> **Scope note (subsequent milestone):** The shipped stack — vanilla ES2020 modules, vendored **Kaplay 3001.0.19** (`lib/kaplay.mjs`, sha256 `fb4a4ef2…`, `kaplay({ global: true })`), no npm/build at runtime, nginx-static over Docker, guarded versioned localStorage, Pillow-based art pipeline (`scripts/build-art-assets.py`), Playwright audit harness (`scripts/browser-boot.mjs` + `scripts/lib/mechanic-drive.mjs`) — is validated and **not re-researched here**. This document covers ONLY the four NEW capability areas: (1) audio/SFX + ambient music, (2) level structural-validation tooling, (3) the Nox Run logo, (4) palette expansion. **Headline finding: v5.0 needs ZERO new runtime code dependencies.** Audio is already fully inside the vendored engine; validation is a new Node script over existing pure-data level modules; logo and palette are extensions of the existing Python pipeline. The only genuinely new *files* are CC0 audio assets and one CC0 pixel font (build-time only).

---

## Recommended Stack

### 1. Audio — the vendored Kaplay 3001.0.19 audio API (verified against `lib/kaplay.mjs` source)

Every claim in this table was confirmed by reading the minified vendored build itself, per the pin policy ("code against Kaplay 3001 API only"). Do NOT trust current kaplay.dev docs blindly — they describe 4000-series builds.

| API (in vendored build) | Verified behavior | Use for | Notes |
|--------------------------|-------------------|---------|-------|
| `loadSound(name, url)` | Fetches + `decodeAudioData` into a WebAudio buffer; registered as a real Asset (participates in load progress) | **All SFX** (jump, land, coin, correct/incorrect, door, level-clear) | Buffer decode = zero-latency replay, overlapping instances OK. |
| `loadMusic(name, url)` | Stores the URL in `assets.music` and creates `new Audio(url)` with `preload="auto"` — a *streaming* HTMLAudioElement path. **Does NOT participate in load progress** (returns a URL, not an Asset). | **The ambient music track(s)** | Streaming means a 2–3 MB track never blocks the boot loading screen. Same-origin nginx serving avoids its `crossOrigin="anonymous"` CORS wrinkle entirely. |
| `play(name, opts)` | Dispatches on name: registered music → streaming handle; else buffer AudioPlay. Verified options: `volume`, `loop`, `speed`, `detune`, `pan`, `seek`, `paused` | Everything | One call site for both kinds. |
| AudioPlay handle (SFX) | Verified surface: `stop()`, `play(t)`, `seek(t)`, get/set `paused` / `volume` / `speed` / `detune` / `pan` / `loop`, `duration()`, `time()`, `onEnd(cb)` | Per-sound control | |
| Music handle | Verified surface: `play()`, `seek()`, `stop()`, get/set `loop` / `paused` / `volume` (clamped 0–1) / `speed`; **`detune` is a no-op**; `onEnd(cb)` | Ambient loop control, music-volume setting | Set `loop: true` at `play()` time. |
| `setVolume(n)` / `getVolume()` | Sets/reads master gain node | **Mute toggle + master volume** | **`volume(n)` exists but is DEPRECATED in this exact build** — it fires "volume is deprecated. Use setVolume / getVolume instead." Use `setVolume`/`getVolume`. |
| `audioCtx` | The raw AudioContext is exported | Autoplay-policy unlock (see pitfall below) | |
| Tab-hide behavior | On hide: `audio.ctx.suspend()`; on show: resume — automatic **unless** `backgroundAudio: true` is passed to `kaplay()` | Keep the default (`false`) | Silence when she tabs away = correct, ADHD-friendly, zero code. |
| `burp()` | Built-in easter-egg sound | Optional gag | Free fun, zero bytes. |

**Critical integration pitfall (verified — this build has no gesture unlock):** the vendored 3001.0.19 contains **no** pointer/keyboard hook that calls `audioCtx.resume()`. The only resume paths are music-handle `.play()`, tab-show, and debug-unpause. Under Chrome/Edge autoplay policy the AudioContext starts *suspended* until a user gesture, so buffer SFX fired before any unlock are **silent**. Integration: in the first real input handler (the title screen's existing "press key to start" is the natural spot), call `audioCtx.resume()` and start the ambient music there. Never start music at module load.

**Recommended integration shape — one new module, `src/audio.js`:** a thin wrapper owning (a) `sfx(name, opts)` = `play(name, { volume: opts.volume * sfxVolume })`, (b) `startMusic(levelTheme)` / `stopMusic()` holding the single music handle, (c) mute/master/music/sfx settings persisted in the existing versioned localStorage save (bump save version in `progress.js`, same pattern as v4.0's `levels` field). Kaplay has **no audio buses** — only the master gain — so music-vs-SFX balance must live in this wrapper (music via handle `.volume`, SFX via per-`play()` volume multiply). This is ~60 lines, not a library.

**ADHD-safe audio guidance (design constraint, not stack):** default master volume modest (≈0.5), no failure "buzzer" (soft neutral tone on wrong answers), visible mute toggle on title + pause, ambient music low-intensity and loop-seamless.

### 2. Audio assets — formats and CC0 sources

| Decision | Choice | Why |
|----------|--------|-----|
| **Music format** | **OGG Vorbis**, ~96–128 kbps | MP3 has encoder padding (silent gap at start/end) that audibly breaks a seamless ambient loop; OGG loops gaplessly and is ~10× smaller than WAV. Fully supported (both `<audio>` and `decodeAudioData`) in Chrome, Edge, Firefox — the actual target (Windows laptop). Safari caveat: native Vorbis only since Safari 18.4 — irrelevant to this project's target platform; do not add an MP3 fallback for it. |
| **SFX format** | **OGG** (WAV acceptable for <10 KB one-shots) | Kenney packs ship OGG natively; decode cost is negligible for short clips. |
| **Size budget** | SFX: 2–50 KB each; ambient loop 1–3 min ≈ 1–3 MB | `loadMusic` streams, so the music track does not inflate boot time; total new asset weight stays well under the existing art footprint's order of magnitude. |

| Source | License | What to take | Fit |
|--------|---------|--------------|-----|
| **Kenney audio packs** ([kenney.nl/assets/category:Audio](https://kenney.nl/assets/category:Audio)) — *Interface Sounds* (100), *UI Audio* (50), *Impact Sounds* (130), *Music Jingles* (85), *Digital Audio* | **CC0**, no attribution required (verified on Kenney's own pages) | UI/answer clicks, landings/collects, level-clear jingle stinger | **First choice** — the project already vendors Kenney art; the exact provenance workflow exists (`assets/_kenney-src/`, `assets/LICENSES/*.txt` proof files, `CREDITS.md`). Vendor sounds under `assets/audio/` with the same per-asset license-proof discipline. |
| **OpenGameArt** — the curated "[CC0 — Calm / Relaxing Music](https://opengameart.org/content/cc0-calm-relaxing-music)" collection | CC0 (filter enforced by the collection) | **The ambient music loop(s)** — Kenney has jingles but no long calm ambient tracks | Pick 1–2 dark/calm loops; verify the CC0 declaration on each track's own page before vendoring (existing CREDITS.md rule). |
| **Freesound.org** with the CC0 license filter | CC0 when filtered | Gap-filler SFX if Kenney lacks a specific sound | Requires per-file license check; use only as fallback. |

### 3. Level structural validation — static analyzer + existing dynamic harness

**Recommendation: build a NEW static analyzer (`scripts/validate-levels.mjs`, plain Node, zero deps) as the primary structural gate, and keep/extend the existing Playwright mechanic-drive as the dynamic proof layer.** Not either/or — they catch different failure classes.

| Layer | Tool | Catches | Why this split |
|-------|------|---------|----------------|
| **Static (NEW)** | `scripts/validate-levels.mjs` — Node ≥18 script importing level descriptors directly | Unreachable platforms/areas, gaps wider than the jump envelope, doors/gates/spawns placed over floor holes (the known v4 bug class), mechanics positioned off any walkable surface, goal unreachable | Level modules are **pure data** (verified: `level-01.js` imports only `config.js`, no engine globals — an existing enforced invariant), so Node 22 imports them with zero mocking. Runs in milliseconds per level at authoring time; scales trivially to 8 levels. |
| **Dynamic (existing, extend)** | `scripts/browser-boot.mjs` + `scripts/lib/mechanic-drive.mjs` (Playwright) | Engine-level truth: real collision, real jump physics, challenge UI resolution | Already exists and validated in v4.1; extend `LEVEL_ORDER` coverage from 4 → 8 levels. Its known blind spot (6/16 encounters unreachable due to spike-timing resonance in the traversal model) is exactly why the static layer must own *reachability* claims. |

**How the static analyzer works (no new tech):** the jump envelope is already derived and documented in `mechanic-drive.mjs` from `src/config.js` (RUN_SPEED 240, GRAVITY 1400, JUMP_FORCE 520 → max rise ≈ 96.6 px, max single-jump horizontal ≈ 178 px). Build a graph: nodes = floor runs + platforms from `geometry`; edges = jump transitions within the envelope (with a safety margin, e.g. 0.9×, so "barely possible" doesn't pass); BFS from spawn to goal; then assert every door/gate/enemy/collect/checkpoint x-position lies on a reachable surface and every door/mathGate sits over solid floor (x within a floor run, not a gap). Exit non-zero on violation → wire into the same check-gate flow as the other `scripts/check-*.sh` gates.

**Explicitly rejected for this:** browser-based static analysis (needless Playwright launch for pure math), and any physics-simulation library — the closed-form ballistic envelope the project already trusts is sufficient and consistent with the dynamic layer's model. Playwright itself stays a *dev-machine* tool resolved via the existing `resolvePlaywright()` shim (env override + fallback path) — do **not** add a package.json for it; that would break the zero-npm posture that shim was explicitly written to preserve (WR-02 comment in `browser-boot.mjs`).

### 4. Nox Run logo — pre-rendered PNG via the existing Python pipeline

**Recommendation: bake the wordmark as PNG(s) in `scripts/build-art-assets.py` (Pillow + a CC0 pixel TTF), load via the existing `loadSprite` path.** Reject runtime Kaplay text styling for the logo.

| Option | Verdict | Why |
|--------|---------|-----|
| **Pre-rendered PNG (Pillow `ImageFont` + CC0 pixel font, nearest-neighbor upscale)** | ✅ **Use this** | A "fancy dark green/black" treatment (outline, shadow, grime texture, two-tone fill) is trivial layered raster work in Pillow and impossible-to-ugly in runtime text. Pixel-crisp at the native 640×360 canvas. Flows through the exact pipeline + mandatory human visual sign-off process v4.1 established. Zero runtime cost, zero new runtime files besides the PNG. |
| Kaplay `loadFont` + styled `text()` | ❌ For the logo | Kaplay 3001 text styling = color/scale/outline only; grunge texture/gradient needs shaders. Also adds a runtime TTF fetch for a static image. Fine to keep using plain `text()` for small in-UI occurrences of the name. |
| Hand-drawn logo in an editor | ❌ | Loses reproducibility; the pipeline's palette remap guarantees the logo stays on-token if the palette shifts. |

| Font candidate | License | Notes |
|----------------|---------|-------|
| **monogram** by datagoblin ([datagoblin.itch.io/monogram](https://datagoblin.itch.io/monogram)) | **CC0** | First choice: TTF + bitmap variants, 10 KB, crisp at small sizes, well-known in pixel games. |
| Public Pixel by GGBotNet ([ggbot.itch.io/public-pixel-font](https://ggbot.itch.io/public-pixel-font)) | CC0 | Solid alternative, wider glyphs. |
| Kenney Fonts pack | CC0 | Matches existing Kenney provenance; blockier look. |

The TTF is a **build-time-only** input: vendor it under `assets/_font-src/` with a license proof (same `_kenney-src` pattern); only the rendered PNGs ship. Emit two sizes (title-screen hero + small UI badge) rather than runtime-scaling one. Dark-green tokens must be chosen to clear the `#0a0a0a` background — same luminance lesson the v4.1 sign-off already taught (the 10–42 luminance ramp was invisible); keep the green fill ≥ ~luminance 60 with a brighter edge highlight. The rebrand itself is otherwise just text: `index.html` `<title>`, title-scene copy, `README.md`, `CREDITS.md` header.

### 5. Palette expansion — zero new stack, extend the existing remap pipeline

**No new tools.** `scripts/build-art-assets.py` already has both remap strategies needed: `_remap` (nearest-color, wide-luminance palettes) and `_remap_luminance` (narrow dark ramps), both driven by plain Python color lists. Pillow 10.2.0 is installed (needs ≥9.1 for the `Image.Dither` enum already in use — satisfied).

Recommended changes, all within the existing file's idioms:

- **Centralize the palette as named tokens** in one dict at the top of the script (today PLAYER_PALETTE / ENVIRONMENT_PALETTE / per-layer sub-palettes are separate literals). The Nox Run dark-green brand tokens live here too, so logo, tiles, and parallax stay coherent.
- **Expand ENVIRONMENT_PALETTE with hue-tinted darks**, not more greys: moss/dark green (brand-aligned), cold blue-greys (the BLUE_TINT precedent exists), muted rust/umber. Keep every addition inside the sign-off-validated luminance band (roughly 0x22–0x88 mids with sparse brighter highlights) — the "wider ramp so it reads against #0a0a0a" lesson is already encoded in the script's comments; don't regress it.
- **Per-theme sub-palettes for the 8 levels** (e.g. 2 levels per theme) — same mechanism as the existing per-layer parallax sub-palettes, just parameterized by level theme. This is how "richer visuals" scales without new art packs.
- For inspiration only (free to use, no license burden on color values): curated dark palettes on Lospec. Colors are not copyrightable; no CREDITS entry needed.
- If any runtime-drawn rects/UI use theme colors, mirror the tokens into `src/config.js` so JS and Python read the same hex values (single source: consider having the Python script read a small shared JSON, or just keep a "must match config.js" comment block — the project has used locked-token comments successfully so far).

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **None (zero new runtime deps)** | — | — | **Always.** Every v5.0 runtime capability (audio incl. mute/volume/looping, 8 levels, logo display, palette) is served by the already-vendored `kaplay.mjs` + static assets. Do not add a single import from outside `lib/`. |
| Pillow (existing, build-time) | 10.2.0 installed | Logo rendering (`ImageFont`), palette remap expansion | Already a pipeline dependency; no version change needed. |
| Playwright (existing, dev-machine-only) | via `resolvePlaywright()` shim | Dynamic level audit across 8 levels | Keep the shim; no package.json. |
| Node built-ins | v22.22.2 installed | `scripts/validate-levels.mjs` static analyzer | `import` of pure-data level modules + plain asserts; zero deps. |

## Installation

```bash
# Runtime: nothing to install — vendored-only policy holds.

# New static assets (vendor manually, with license proofs, like all prior CC0 assets):
#   assets/audio/sfx/*.ogg        <- Kenney Interface/UI/Impact/Jingles packs (CC0)
#   assets/audio/music/*.ogg      <- OpenGameArt CC0 calm/ambient collection
#   assets/_font-src/monogram.ttf <- datagoblin monogram (CC0, build-time only)

# Build-time (already satisfied on this machine):
python3 -c "import PIL; print(PIL.__version__)"   # 10.2.0 OK (needs >=9.1)

# New validation gate (no install):
node scripts/validate-levels.mjs                   # to be created; exits non-zero on structural violation
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Kaplay built-in audio (`loadSound`/`loadMusic`/`play`) | Howler.js (vendored) | Never here — it duplicates what the engine already ships (buffer SFX + streaming music + master gain) and adds ~30 KB vendored surface for zero new capability. |
| OGG Vorbis music | MP3 | Only if a Safari/iOS audience appears (pre-18.4 Safari can't decode OGG). MP3's loop gap makes it strictly worse for ambient loops on the actual target browsers. |
| Curated CC0 SFX (Kenney) | jsfxr/bfxr generated retro SFX | If a needed sound can't be found; but generated sfxr bleeps skew harsh/retro — the wrong direction for calm/ADHD-safe audio. |
| Static Node analyzer for reachability | Extending Playwright traversal to prove reachability | Playwright proves *engine* behavior but has a documented traversal blind spot (6/16 encounters) and costs seconds/level; static analysis is exhaustive over geometry and instant. Use Playwright for what only a browser can prove. |
| Baked PNG logo | Kaplay `loadFont` + `text()` | For plain in-UI name occurrences only — never for the styled wordmark. |
| Expanding the Python palette remap | Runtime Kaplay shader tinting | Never — shaders add complexity and per-frame cost for what is a build-time color decision. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `volume(n)` global | **Deprecated in the vendored build** (verified deprecation shim: "volume is deprecated. Use setVolume / getVolume instead.") | `setVolume(n)` / `getVolume()` |
| Music autostart at module load | AudioContext is suspended pre-gesture (this build has **no** gesture unlock hook — verified); music/SFX would be silent or throw policy warnings | Start music + `audioCtx.resume()` in the title screen's first input handler |
| `backgroundAudio: true` in `kaplay()` init | Keeps music playing when she tabs away — anti-goal | Default (`false`): auto-suspend on hide is already built in |
| Music-handle `detune` | No-op in the streaming path (verified: empty setter) | `speed` if pitch-shift is ever needed on music; `detune` works on SFX handles |
| `package.json` + npm install for Playwright | Breaks the zero-npm posture the existing WR-02 shim was written to protect | Existing `resolvePlaywright()` (env `PLAYWRIGHT_MJS_PATH` override) |
| CDN-hosted audio or fonts | Offline/latency/privacy; violates vendored-only constraint | Vendor files with license proofs, as with all prior assets |
| WAV for music | 30–50 MB for a 3-min loop | OGG Vorbis ~96–128 kbps |
| Upgrading Kaplay to 4000-series "for better audio" | Pin policy: 3001-only, upgrade requires full re-test; 3001 audio is sufficient for every v5.0 need (verified) | Stay on vendored 3001.0.19 |

## Stack Patterns by Variant

**If separate music/SFX sliders are wanted (recommended: at least music volume + master mute):**
- Use a small `src/audio.js` wrapper (music-handle `.volume` for music; volume-multiply per `play()` for SFX), settings persisted in the versioned save.
- Because Kaplay 3001 has only ONE master gain node — no bus/group API exists in this build.

**If an authored level fails static validation intentionally (e.g. secret area reachable only via a mechanic):**
- Add an explicit per-level `validation: { allowUnreachable: [...] }` escape hatch in the descriptor rather than loosening the analyzer.
- Because silent global tolerances rot; explicit waivers keep the gate honest (same philosophy as the documented 6/16 dynamic blind spot).

**If per-level music themes are wanted (8 levels):**
- Ship 2–3 ambient tracks max, mapped theme→track in level descriptors' existing optional `theme` slot; crossfade is just two music handles with lerped `.volume` in an `onUpdate`.
- Because 8 unique tracks ≈ 8–24 MB of assets for marginal value; 2–3 tracks keep the repo lean.

## Version Compatibility

| Component | Compatible With | Notes |
|-----------|-----------------|-------|
| Kaplay 3001.0.19 (vendored) | All audio APIs used | `loadSound`, `loadMusic`, `play` opts (`volume/loop/speed/detune/pan/seek/paused`), `setVolume`/`getVolume`, `audioCtx`, handle surfaces — **all verified present in this exact minified file.** |
| OGG Vorbis | Chrome/Edge/Firefox (target platform: Windows laptop) | Full `<audio>` + `decodeAudioData` support. Safari <18.4 cannot decode — accepted non-target. |
| Pillow 10.2.0 (installed) | `ImageFont.truetype`, `Image.Dither.NONE`, `quantize(palette=…)` | All already in use or standard since Pillow 9.x. |
| Node v22.22.2 (installed) | ESM import of `src/levels/*.js` + `src/config.js` in `validate-levels.mjs` | Works because level modules are pure data with no engine globals (existing enforced invariant — keep enforcing it for the 4 new levels). |

## Sources

- `lib/kaplay.mjs` @ 3001.0.19 (sha256 `fb4a4ef2…`) — **direct source inspection** of `loadSound`/`loadMusic`/`play` implementations, AudioPlay + music handle surfaces, `setVolume`/`getVolume`, `volume()` deprecation shim, suspend/resume behavior, absence of gesture unlock — HIGH (ground truth for the pinned build)
- `src/config.js`, `src/levels/level-01.js`, `src/levels/build.js`, `scripts/lib/mechanic-drive.mjs`, `scripts/browser-boot.mjs`, `scripts/build-art-assets.py` — existing integration points and invariants — HIGH (repo)
- [Kenney — Audio assets](https://kenney.nl/assets/category:Audio) incl. [Interface Sounds](https://kenney.nl/assets/interface-sounds), [Impact Sounds](https://kenney.nl/assets/impact-sounds), [Music Jingles](https://kenney.nl/assets/music-jingles), [UI Audio](https://kenney.nl/assets/ui-audio) — CC0, pack contents — MEDIUM (official pages via search)
- [OpenGameArt — CC0 Calm/Relaxing Music collection](https://opengameart.org/content/cc0-calm-relaxing-music), [CC0 Music](https://opengameart.org/content/cc0-music-0) — ambient loop source — MEDIUM
- [caniuse — Ogg Vorbis](https://caniuse.com/ogg-vorbis) + [howler.js issue #1330](https://github.com/goldfire/howler.js/issues/1330) — Safari OGG history (native from 18.4), decodeAudioData gap — MEDIUM
- [monogram by datagoblin](https://datagoblin.itch.io/monogram) (CC0), [Public Pixel by GGBotNet](https://ggbot.itch.io/public-pixel-font) (CC0) — logo font candidates — MEDIUM

---
*Stack research for: Nox Run v5.0 milestone (audio, level validation, logo, palette) on the shipped no-build Kaplay platformer*
*Researched: 2026-07-05*
