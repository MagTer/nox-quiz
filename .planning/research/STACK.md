# Stack Research — v6.0 "SNES-Fidelity World" (milestone-scoped additions)

**Domain:** Browser 2D platformer — mobile touch input, responsive canvas, sourced-art conform pipeline
**Researched:** 2026-07-09
**Confidence:** HIGH (every engine claim below verified against the vendored `lib/kaplay.mjs` 3001.0.19 source, not docs)

> **Scope:** This is the v6.0 delta only. The shipped stack (Kaplay 3001.0.19 vendored, vanilla ES2020, no build step, nginx/Dokploy static hosting, localStorage, Playwright scripts, Pillow bake pipeline) is documented in `.claude/CLAUDE.md` and is NOT restated here. Pre-work in `.planning/research/v6-scouting/` (ASSET-SCOUTING.md, SPIKE-FINDINGS.md) is consumed as fact.
>
> **Headline:** v6.0 needs **zero new runtime dependencies and zero new dev dependencies.** Everything required for touch input, responsive canvas, and palette-conforming sourced art already exists in the vendored engine, the installed Playwright, and the installed Pillow 10.2.0. The work is *configuration and seam code*, not stack additions.

## The One Load-Bearing Discovery (read this first)

**The current CSS `transform: scale(1.5)` display trick — which mouse mapping depends on — silently breaks TOUCH mapping by exactly 1.5×.** Verified in the vendored source, the two input paths use different coordinate bases:

- **Mouse** (`Me.mousemove`): reads `event.offsetX/offsetY` — computed in the element's **untransformed layout box** (640×360) → correct under `transform: scale(1.5)`. This is why the Phase 14 fix worked.
- **Touch** (`Me.touchstart/touchmove/touchend`): reads `touch.clientX − canvas.getBoundingClientRect().x` — `getBoundingClientRect()` returns the **transform-affected visual box** (960×540) → touch positions come out 1.5× too large before the engine's `windowToContent` mapping (minified `Qe`), which divides by the *viewport* size, not the visual size.

So the existing pitfall doc in `src/main.js` ("never scale via width/height") is correct for mouse but incomplete for v6.0: **the transform trick and working touch input are mutually exclusive.** The display-scaling approach must change as part of the mobile work — this is not optional polish, it is the prerequisite.

## Recommended Stack

### Core Technologies (all already vendored/installed — config + seam code only)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Kaplay `letterbox: true` init option | vendored 3001.0.19 | Responsive canvas: engine-owned scaling replacing the CSS `transform: scale(1.5)` hack | Verified in source: with `width/height` set + `letterbox: true`, the canvas gets CSS `width/height: 100%` of its parent; the render framebuffer stays 640×360 (`t.width * pixelDensity * scale`); `gfx.width` stays 640 (`width: t.width ?? drawingBufferWidth…`) so ALL game logic, colliders, and CONFIG numbers are untouched; the viewport letterboxes inside the canvas and the resize handler recomputes it (`jn()`) on every resize/rotation. Crucially, **both** mouse (`Qe(offsetX)`) and touch (`Qe(clientX − rect)`) route through the same viewport math — the mouse/touch asymmetry disappears. Upscale blit is nearest-filtered (default `texFilter ?? "nearest"` verified) → pixels stay crisp without CSS `image-rendering`. |
| Kaplay touch events: `onTouchStart` / `onTouchMove` / `onTouchEnd` | vendored 3001.0.19 | Virtual movement/jump controls (multi-touch: hold left + tap jump) | Verified exported in the vendored build. Handlers receive `(pos, touch)` where `pos` is **already mapped to 640×360 world space** via the viewport transform, and `touch` is the raw DOM `Touch` (its `identifier` enables per-finger press/release tracking for held d-pad zones). The engine iterates `changedTouches`, so simultaneous touches each fire. 3001.0.19's own changelog includes "Fixed all touch events having a bad transform" — the pinned build has the *fixed* touch path. |
| Kaplay `touchToMouse` (default ON) | vendored 3001.0.19 | Tappable answers/tiles/mute for free | Verified in source: first changed touch sets `mousePos` (viewport-mapped) *then* presses the synthetic `"left"` mouse state and fires `mousePress` — so every existing object-scoped `box.onClick()` (challenge answer boxes `challenge.js:259`, select tiles `select.js:174`, mute icon `audio.js:149`, title start `title.js:123`) becomes tap-capable with **zero code changes** once the coordinate base is fixed by the letterbox migration. |
| Kaplay `buttons` API: `pressButton` / `releaseButton` / `isButtonDown` / `onButtonPress` | vendored 3001.0.19 | The touch→gameplay input bridge | Verified: `pressButton(b)` drives the exact same `buttonState` + `buttonPress` event path the keyboard handler uses, so edge and held semantics match keyboard behavior. On-screen controls call `pressButton("left")` on touch-down and `releaseButton("left")` on touch-up/cancel; `player.js` reads become `isKeyDown("left") \|\| isButtonDown("left")`. **Do NOT rebind keyboard keys through `buttons`** — see What NOT to Use (#421). |
| Kaplay `isTouchscreen()` | vendored 3001.0.19 | Show touch UI only on touch devices | Verified: `"ontouchstart" in window \|\| navigator.maxTouchPoints > 0`. Gate the virtual-controls layer on this so the desktop/keyboard experience is pixel-identical to v5.0. |
| Plain CSS/HTML in `src/index.html` | n/a | Mobile viewport + gesture hygiene | Additions: `touch-action: none` + `overscroll-behavior: none` on the canvas (belt-and-braces alongside the engine's `preventDefault()` in touchstart/touchmove); viewport meta gains `maximum-scale=1, user-scalable=no, viewport-fit=cover`; `100dvh`/`100dvw` (not `vh`) for the canvas parent so mobile URL-bar chrome doesn't clip; desktop parent capped at `960×540` (preserving the exact current 1.5× look), mobile parent = full viewport. |

### Development Tools (already installed — new *scripts*, not new deps)

| Tool | Purpose | Notes |
|------|---------|-------|
| Playwright touch emulation | RED-first proof of the letterbox + touch migration | Already-installed Playwright supports `browser.newContext({ hasTouch: true, isMobile: true, viewport })` and `page.touchscreen.tap(x, y)`. A new `scripts/audit-touch-mapping.mjs` (following the deliberate copy-not-share convention) should tap known world positions (an answer box, a select tile, virtual buttons) at ≥2 viewport sizes and assert the hit — this is the migration's regression gate, exactly analogous to how Phase 14's mouse bug was caught. |
| Pillow 10.2.0 (installed, verified) | Palette-conform pass for sourced Gothicvania art | Two operations cover the pipeline shift from *generating* art to *conforming* sourced art: (1) hue rotation for the no-pink skies — **already live-proven** by `v6-scouting/styleboard.py` on the town/cemetery packs; (2) cross-pack palette unification via `Image.quantize(palette=palette_image, dither=Image.Dither.NONE)` — fixed-palette mapping with dithering OFF (Floyd-Steinberg is the default and smears pixel art). Atlas cutting (the 16×32 cap-tile atlas per biome that SPIKE-FINDINGS calls for) is plain `Image.crop`. Pure Pillow, no numpy — matching styleboard.py's deliberate style. |

## Installation

```bash
# Nothing. Zero new runtime dependencies, zero new dev dependencies.
# All v6.0 stack needs are init-option changes, seam modules in src/,
# CSS/meta edits in index.html, and new dev-time scripts using
# already-installed Playwright + Pillow 10.2.0.
```

## Integration Points (where the new seams attach)

| New piece | Attaches to | Shape |
|-----------|-------------|-------|
| `letterbox: true` (+ drop the transform block) | `src/main.js` `kaplay({...})` init + `src/index.html` CSS | Replaces lines 47–50 of main.js and the flex-centering rationale; the main.js/index.html pitfall comments MUST be rewritten (their guidance inverts for touch) |
| Touch controls module (e.g. `src/touch.js`) | Registered once at boot like `src/audio.js`'s mute controller (persists across scenes); virtual buttons drawn as Kaplay `fixed()` objects in 640×360 world space so they scale with the viewport for free | `onTouchStart/Move/End` with per-`touch.identifier` zone tracking → `pressButton()/releaseButton()` on touch-only button names; gated behind `isTouchscreen()`; all tunables (zone rects, opacity) in `src/config.js` |
| Player/scene input reads | `src/player.js` (`isKeyDown` lines 65–66, `onKeyPress(JUMP_KEYS)` line 93), plus keyboard-only surfaces: title reset confirm Y/N, game `escape`-to-exit, select cursor | Additive `\|\| isButtonDown("...")` / `onButtonPress("...")` alongside existing keyboard controllers — keyboard path stays byte-identical (it is kid-validated) |
| Scene-teardown semantics | Same as existing convention | `onTouchStart` etc. registered *inside* a scene are app-level controllers auto-cleared by `go()` (same class as `onKeyPress`, per select.js's documented behavior); boot-level registration persists — choose per the audio.js precedent |
| Palette-conform functions | `scripts/build-art-assets.py` (or a sibling `scripts/conform-art-assets.py`) | Dev-time only; bakes conformed PNGs into `assets/` — runtime never sees Pillow |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `letterbox: true` responsive mode | `kaplay({ scale: 1.5 })` fixed mode (verified in source: buffer 960×540, CSS 960px, `gfx.width` stays 640, mouse+touch both correct) | Only if letterbox misbehaves in the browser-boot probe. It fixes the mouse/touch asymmetry with the smallest diff but is NOT responsive — a 960px canvas overflows every phone. Acceptable as a desktop-only stopgap, not as the v6.0 answer. |
| Kaplay-drawn `fixed()` virtual buttons | DOM overlay buttons (HTML divs + pointer events over the canvas) | If in-canvas multi-touch zone tracking proves fiddly in practice. DOM buttons sidestep coordinate mapping entirely but need their own responsive positioning, fight the engine for gestures, and live outside the `?debug=1` overlay and Playwright world-space assertions. Keep as fallback only. |
| `buttons` API as touch bridge | Closure-state input object injected into `player.js` | Equally valid and dep-free; choose it if upstream #421-style weirdness shows up even in single-source button use during the audit script run. |
| `Image.quantize(palette=…, dither=NONE)` for cross-pack unification | Skip quantization; hue-shift only | If the style-board sign-off says the packs already read as one game (they are one artist), the quantize step may be unnecessary — ASSET-SCOUTING flags "minor palette-conform pass *may* be needed." Decide at style-board sign-off, not before. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Keeping CSS `transform: scale(1.5)` + manually correcting touch coords in `src/` | Requires shadowing the engine's internal mapping in app code — fragile, and the vendored engine is pinned (sha256) so it cannot be patched either | `letterbox: true` — the engine owns one consistent mapping for both input types |
| Migrating keyboard input onto the `buttons` API | Open upstream bug kaplayjs/kaplay#421: a button bound to multiple keyboard keys drops its DOWN state when one of two held keys is released — `left`+`a` / `right`+`d` / triple-bound jump hit exactly this scenario; and the keyboard path is kid-validated | Keyboard reads stay as-is; `buttons` carry **no keyboard bindings** and are pressed only programmatically by the touch layer (single input source per button = bug can't trigger) |
| Touch/gesture libraries (nipplejs, hammer.js, interact.js) | Zero-new-runtime-deps is a hard constraint — and unnecessary: the vendored engine already exposes world-mapped multi-touch events | `onTouchStart/Move/End` + `pressButton/releaseButton` |
| Responsive/CSS frameworks, `screenfull`, fullscreen APIs | The responsive surface is ONE canvas in ONE wrapper; also avoid Kaplay's fullscreen mode — the mousemove handler's fullscreen branch remaps via `window.innerWidth/innerHeight` (verified) while the touch handler has no such branch, reintroducing a mouse/touch asymmetry | Plain CSS (`dvh`, `aspect-ratio`, `max-width`) on the wrapper; letterbox handles the rest |
| Kaplay upgrade (any) | Hard constraint — and moot: 3001.0.19 is the **last** release on the 3001 line (verified against the changelog); the touch-transform fixes 4000 got are alphas of a breaking major | Stay pinned; every claim here is verified against the pinned build |
| numpy / ImageMagick / aseprite / TexturePacker for the art pipeline | styleboard.py already proved pure Pillow handles hue-shift + composition; quantize/crop cover the rest; new tools add setup burden for zero capability | Pillow 10.2.0 (installed) |
| `Image.quantize` with default dithering | Floyd-Steinberg (the default) smears pixel-art edges into noise | `dither=Image.Dither.NONE` explicitly |

## Version Compatibility

| Piece | Compatible With | Notes |
|-------|-----------------|-------|
| Touch events + `letterbox` | vendored Kaplay 3001.0.19 | 3001.0.19's changelog includes "Fixed all touch events having a bad transform" — the pinned build already contains the fixed touch path read in this research. Do not trust generic KAPLAY docs (they track 4000 alphas). |
| `buttons` API | vendored 3001.0.19, **single input source per button only** | #421 (multi-key release bug) is open upstream; the touch-bridge-only usage pattern is immune by construction, but the touch audit script should still assert hold-one-release-other behavior |
| `Image.quantize(palette=, dither=Dither.NONE)` | Pillow 10.2.0 (installed) | Both parameters long-stable in Pillow 10.x |
| Playwright `hasTouch` contexts | installed Playwright (resolved dynamically per existing scripts) | Same resolution chain as `browser-boot.mjs`; no version bump needed |

## Risks / Open Questions for Phase Planning

1. **Letterbox migration is a load-bearing change to a documented pitfall** — the main.js/index.html comments actively teach the *old* rule. The migration phase must (a) rewrite those comments, (b) re-run the full gate suite, and (c) add the touch-mapping Playwright probe as a permanent gate. Treat this like Phase 23's validator: RED-first (prove the probe catches the current transform-mode touch desync *before* migrating).
2. **`pixelDensity` on high-DPI phones**: letterbox mode's resize path multiplies the canvas buffer by `pixelDensity` (default 1). Leaving `pixelDensity` unset keeps everything in CSS-pixel units (verified consistent); do not set it without re-running the probe.
3. **Touch UI + challenge panel focus**: while the challenge panel is open, movement buttons must not leak into the paused player — same discipline as the existing `player.paused` + global-controller notes in player.js. The touch layer needs the same pause-awareness, worth an explicit gate assertion.
4. **MOVE-05 non-60Hz feel check** (already a milestone closer) doubles as the letterbox-mode dt sanity check on a real phone.

## Sources

- `lib/kaplay.mjs` (vendored 3001.0.19, pinned) — touch handlers (`touchstart/touchmove/touchend` → `getBoundingClientRect` + `Qe` viewport mapping), mouse handler (`offsetX/offsetY`, fullscreen-only window remap), `Qe`/windowToContent, viewport/letterbox computation, `gfx.width` init (`t.width ?? …`), fixed-mode `scale` handling (`gscale`), `texFilter ?? "nearest"` default, `buttons` config parse + `pressButton/releaseButton` event path, `isTouchscreen`, public exports of `onTouchStart/Move/End` — **HIGH (primary source, the quality gate for this research)**
- `src/main.js`, `src/index.html`, `src/player.js`, `src/scenes/*.js`, `src/ui/challenge.js`, `src/audio.js` — current input surfaces and scaling approach — HIGH (primary source)
- [KAPLAY CHANGELOG](https://github.com/kaplayjs/kaplay/blob/master/CHANGELOG.md) — 3001.0.19 contains the touch-transform fix; 3001.0.19 is the final 3001.x release — MEDIUM (web, cross-checked against vendored source)
- [kaplayjs/kaplay#421](https://github.com/kaplayjs/kaplay/issues/421) — open multi-key `buttons` release bug — MEDIUM (web)
- [Pillow Image docs](https://pillow.readthedocs.io/en/stable/reference/Image.html) — `quantize(palette=, dither=Dither.NONE)` — MEDIUM (web, cross-checked against installed Pillow 10.2.0)
- `.planning/research/v6-scouting/ASSET-SCOUTING.md`, `SPIKE-FINDINGS.md`, `styleboard.py` — consumed as verified fact per milestone context — HIGH (project pre-work)

---
*Stack research for: Nox Run v6.0 "SNES-Fidelity World" — mobile touch + responsive canvas + art-conform pipeline deltas*
*Researched: 2026-07-09*
