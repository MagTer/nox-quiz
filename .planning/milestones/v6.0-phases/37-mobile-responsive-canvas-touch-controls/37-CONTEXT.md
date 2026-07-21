# Phase 37: Mobile — Responsive Canvas & Touch Controls - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning
**Mode:** Claude's discretion (user away from home; authorized "build it" 2026-07-19, with the on-device gates explicitly deferred to when the user has a real device)

<domain>
## Phase Boundary

She can play on a phone or tablet — responsive canvas, touch movement/jump, tappable answers — while
the kid-validated keyboard/desktop experience stays BYTE-IDENTICAL. Requirements: MOB-01..MOB-05
(MOB-06 = on-device kid tuning, deferred to Phase 38 / the user's device).

IN SCOPE (buildable now, no device): the letterbox canvas migration (MOB-01) opened by a RED-first
Playwright touch-coordinate probe (prove the current CSS-transform desync → prove the letterbox fix →
keep the probe as a permanent gate); on-screen touch controls (MOB-02 — discrete left/right + jump
virtual buttons, hold semantics for variable-height jump, multi-touch per-identifier tracking, ≥64px
effective hit zones, visible ONLY on touch devices, challenge-pause-aware, tunables in CONFIG);
tappable math answers + mute + reset via the unified coordinate mapping (MOB-03); portrait
"rotate your device" overlay + browser-gesture suppression (MOB-04, touch-action:none + viewport meta,
NO screen.orientation.lock() reliance); the audio-gesture-gate WIRING (MOB-05 code — unlock audio on
the first real touch gesture, using the correct activation-triggering event, not touchstart).

OUT OF SCOPE / DEFERRED to on-device (needs the user's real phone/tablet — cannot be proven headless):
MOB-05's real-device audio-activation PROOF (touchstart is not activation-triggering — must be VERIFIED
on device); MOB-06 kid touch-layout tuning (button size/placement adjusted from watching her hands) →
rolls into Phase 38. iOS ITP 7-day storage eviction is DOCUMENTED as expectation (no backend fix —
the laptop stays the progress home). Also OUT: any change to game logic, math brain, motion, or the
kid-validated desktop feel — desktop must stay byte-identical.
</domain>

<decisions>
## Implementation Decisions

### Canvas migration — LETTERBOX (probe-decided, primary candidate)
- Replace the CSS `transform: scale(1.5)` display hack with Kaplay's `letterbox: true` + a `scale`/
  responsive canvas so the internal 640×360 maps to the viewport with correct, transform-free
  coordinate math. Source-verified rationale (STATE): mouse reads `offsetX` (transform-immune), touch
  reads `clientX − rect()` (transform-affected) — the two are mutually exclusive under the CSS scale
  trick. The RED-first probe proves the desync first, then proves letterbox fixes it. If the probe
  shows letterbox does NOT cleanly fix coordinate mapping, the DOM-overlay fallback is the alternative
  — the probe decides, not assumption.
- **Desktop look + ALL mouse behavior preserved** (box.onClick etc. must stay working — the documented
  offsetX/offsetY trap). Stale pitfall comments in main.js/index.html get rewritten to match reality.

### Touch controls — thumb-zone virtual buttons (Claude's discretion)
- Discrete **left / right** buttons bottom-LEFT (thumb zone) and a **jump** button bottom-RIGHT; ≥64px
  effective hit zones (oversized for a 12-year-old's thumbs); dark-grunge, semi-transparent, unobtrusive.
- **Hold semantics**: jump variable-height works by press DURATION (mirrors the keyboard buffer/coyote/
  variable-height jump — press-hold = higher). Multi-touch tracked per `Touch.identifier` so left+jump
  simultaneously works. Buttons visible ONLY on touch-capable devices (feature-detect, not UA-sniff);
  hidden on desktop so the kid-validated desktop UI is untouched. Challenge-pause-aware (movement
  buttons inert while a math panel is open, like the keyboard).
- All sizing/placement/opacity tunables live in CONFIG (a later on-device MOB-06 pass tunes them from
  watching her hands).

### Tappable UI (MOB-03)
- Math answer boxes, the mute toggle, and reset become tappable on touch devices through the SAME
  unified coordinate mapping the letterbox migration establishes (one seam, not per-widget hacks).

### Orientation + gestures (MOB-04)
- Portrait → a "rotate your device" overlay (landscape is the play orientation). `touch-action: none`
  on the canvas + a proper viewport meta so pinch-zoom / scroll / double-tap-zoom never fight the game.
  NO `screen.orientation.lock()` reliance (unsupported/permission-gated on iOS Safari).

### Audio gesture gate (MOB-05 — code now, device-proof deferred)
- Wire audio unlock to the first real user GESTURE using an activation-triggering event (pointerup/
  click/touchend as appropriate — NOT touchstart, which iOS does not treat as activation). The actual
  proof that audio starts on her device is DEFERRED to the on-device gate.

### Claude's Discretion
- Exact button glyphs/art, overlay copy, probe assertions, and the feature-detect predicate — at
  Claude's discretion within the above; confirmed at the on-device MOB-06 tuning (Phase 38).
</decisions>

<specifics>
## Specific Ideas

- **RED-first discipline** (MOB-01 SC1): the Playwright touch-coordinate probe MUST first FAIL against
  the current CSS-transform build (proving the desync), then PASS after the letterbox migration, and
  stay as a permanent gate — mirrors the project's other RED-first harness work (Phase 30 movers).
- Serve over HTTP (file:// blocked). The probe/gates resolve Playwright dynamically like browser-boot.
- Desktop parity is a HARD gate: the existing browser-boot + all mouse-driven audits must stay green
  (box.onClick, select-grid clicks, mute icon) — the migration must not regress the offsetX mapping.
- Playwright can EMULATE touch (hasTouch/isMobile, touchscreen.tap, dispatchTouchEvent) to drive the
  touch layer headlessly — but real-device audio activation + real-thumb ergonomics cannot be emulated
  (that's the deferred on-device gate).
</specifics>

<canonical_refs>
## Canonical References

- STATE.md decision: "CSS transform:scale(1.5) and touch input are mutually exclusive (source-verified)
  … letterbox:true primary, DOM overlay fallback — the probe decides."
- src/main.js (kaplay init + the 1.5× display scale + the offsetX/offsetY mouse-mapping comments to rewrite).
- src/index.html (viewport meta, file:// guard, canvas centering).
- src/player.js (coyote/buffer/variable-height jump — touch jump must reuse this, not a parallel impl).
- src/ui/challenge.js + src/ui/hud.js + src/scenes/* (the answer boxes / mute / reset click seams MOB-03 makes tappable).
- scripts/browser-boot.mjs (dynamic Playwright resolution + the desktop parity gate to keep green).
</canonical_refs>
