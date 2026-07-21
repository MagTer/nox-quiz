---
phase: 37-mobile-responsive-canvas-touch-controls
verified: 2026-07-19
status: passed
requirements: [MOB-01, MOB-02, MOB-03, MOB-04, MOB-05]
deferred_to_phase_38: [MOB-05-device-audio-proof, MOB-06, ITP-eviction-note, A1-pixel-parity]
---

# Phase 37 — Verification Record

> Consolidation + record for the Mobile — Responsive Canvas & Touch Controls phase.
> This project has NO JS test framework — the shell/Playwright gates ARE the suite (CLAUDE.md).
> Nothing here closes on greps alone: every MOB requirement below maps to a real gate/probe that
> ran green in this consolidated pass, and the on-device gates that CANNOT be proven headlessly are
> explicitly named as DEFERRED to Phase 38.

---

## Result: PASSED

The full consolidated gate suite — the existing CLAUDE.md gates PLUS the four NEW permanent touch
gates — is green. The mobile layer (letterbox migration, input seam, touch controls, portrait
overlay, tappable UI, audio gesture-gate) landed **without regressing the kid-validated desktop
build**: `browser-boot.mjs` (desktop parity) and `check-geometry-frozen.mjs` (all 8 levels
byte-identical) both green. No source changes were made in this closeout plan.

---

## Consolidated Gate Matrix (one pass, 2026-07-19)

| Gate | Kind | Result | Evidence |
|------|------|--------|----------|
| `bash scripts/check-safety.sh` | static (SAFE-01 no-timer/forgiving) | **PASS** | `safety checks: PASS` |
| `bash scripts/check-import-safety.sh` | static (a727c13 module-top-level trap) | **PASS** | `import-safety checks: PASS` |
| `bash scripts/check-progress.sh` | static + smoke (save/XP invariants) | **PASS** | `smoke-progress: PASS` / `progress checks: PASS` |
| `bash scripts/check-gate.sh` | static (math-gate/challenge invariants) | **PASS** | `gate checks: PASS` |
| `node scripts/validate-levels.mjs` | static level validator | **PASS** | zero HARD-FAIL (WARN-only marginRatio rows) |
| `node scripts/check-assets-manifest.mjs` | manifest existence gate | **PASS** | `61 assets verified on disk` |
| `node scripts/check-geometry-frozen.mjs` | frozen-geometry gate | **PASS** | `all 8 levels' geometry byte-identical to the frozen baseline` |
| `node scripts/browser-boot.mjs` | **DESKTOP PARITY** (keyboard drive + mouse audits + audio gesture-gate + all 8 levels) | **PASS** | `title -> select -> all levels loaded with no runtime errors` (see flake note below) |
| `node scripts/touch-coordinate-probe.mjs` | touch-emu integration (MOB-01) | **PASS** | center tap → game-space `(320.0, 180.0)`; expected ~320 |
| `node scripts/touch-orientation-probe.mjs` | touch-emu integration (MOB-04) | **PASS** | portrait 540×960: `#rotate=flex #stage=none`; landscape 960×540: `#rotate=none #stage=block` |
| `node scripts/touch-tap-ui-probe.mjs` | touch-emu integration (MOB-03) | **PASS** | tap arms+cancels(no-nav)+confirms reset; tap toggles mute both ways; tap resolves a math answer |
| `node scripts/touch-controls-drive.mjs` | CDP touch-drive (MOB-02) | **PASS** | touchctl=6; tap-rise=60.4px; held-rise=94.1px > tap (variable height); right-dx=134.4px; multi(dx=−129.6px, rise=94.1px); desktop touchctl=0 |

### browser-boot flake note (honest report)

The FIRST `browser-boot.mjs` run reported a single non-functional perf flake at level-02 entry:
`level-02: level entry: fps 29 < floor 40`. This is the documented transient headless-timing /
marginal-fps flakiness (CLAUDE.md: "occasional door-trigger nondeterminism / marginal fps") — a
render-perf sample floor, not a parity or functional regression. Per the phase's flake protocol,
the gate was re-run SOLO once and PASSED clean (exit 0):
`Browser boot: PASS — title -> select -> all levels loaded with no runtime errors.` A single
non-reproducible perf sample is not a real failure; the desktop path (level-select tile clicks,
mute-icon click, challenge answer `box.onClick`, keyboard drive across all 8 levels, AudioContext
gesture-gate) is intact.

---

## Desktop byte-identical proof (the load-bearing regression guard)

The kid-validated desktop/keyboard build was NOT allowed to regress while the mobile layer landed.
Two independent gates prove this:

- **`check-geometry-frozen.mjs` → PASS** — all 8 levels' geometry is **byte-identical to the frozen
  baseline**. The letterbox migration and touch layer added zero level-data drift.
- **`browser-boot.mjs` (desktop pointer:fine context) → PASS** — the non-touch 960×540 context
  (device-class `@media (pointer: fine)` → `#stage 960×540` → zero-bar 1.5× letterbox) exercises
  the full desktop path: level-select tile clicks, mute-icon click, challenge answer clicks
  (`box.onClick`), keyboard drive across every level, and the AudioContext gesture-gate — all green.
  The Phase-14 `offsetX`/`onClick` desync trap did **not** resurface under `letterbox: true`.
- Touch-only widgets are all coarse-pointer gated (`matchMedia('(pointer: coarse)')`), so on a
  fine-pointer desktop **zero** virtual buttons mount (`touch-controls-drive.mjs` desktop context:
  `touchctl=0`) and no touch-only reset/confirm UI is registered — desktop stays additive-free.

"Byte-identical" here means **behavioral + geometry parity** (proven above). Literal pixel-for-pixel
parity of the letterbox render vs. the old CSS-transform render is **Assumption A1**, deferred to a
Phase-38 UAT visual spot-check (see Deferred).

---

## The four NEW permanent touch gates

All four dup browser-boot's hardened loopback/ROOT-clamped static server + `resolvePlaywright()` per
the deliberate-duplication convention (no shared module), zero new dependencies. They are now
permanent members of the gate suite:

1. **`scripts/touch-coordinate-probe.mjs`** (MOB-01) — RED-first coordinate-desync gate. Boots the
   game in a hasTouch/isMobile context, taps the visual center of `#game`, reads the game-space
   coordinate back through the engine's own `onTouchStart` (single `Qe` transform), and asserts ~320.
2. **`scripts/touch-orientation-probe.mjs`** (MOB-04) — machine-asserts the portrait/landscape overlay
   swap via `getComputedStyle(#rotate/#stage).display` in a coarse-pointer context (not a grep).
3. **`scripts/touch-tap-ui-probe.mjs`** (MOB-03) — drives real `page.touchscreen.tap()` gestures:
   tap resolves a math answer, tap toggles mute both ways, tap arms + cancels (no-nav) + confirms the
   title reset.
4. **`scripts/touch-controls-drive.mjs`** (MOB-02) — CDP `Input.dispatchTouchEvent` with distinct
   touch ids: tap-jump rises, held-jump rises higher (variable height), left/right move,
   left+jump multi-touch; desktop context mounts zero buttons.

### RED→GREEN history (the empirical proof MOB-01 SC1 required)

The coordinate probe was authored RED-first (37-01) BEFORE the fix and its RED→GREEN transition is
the empirical proof of the coordinate-desync fix:

| Build | Center-tap → game-space | game-x | Verdict |
|-------|-------------------------|--------|---------|
| `transform: scale(1.5)` (pre-37-02) | `(480.0, 270.0)` | **~480** | **RED** — off by exactly the 1.5× display factor |
| `letterbox: true` (37-02 onward) | `(320.0, 180.0)` | **~320** | **GREEN** — mouse+touch unified through one `Qe` transform |

The 480→320 flip is exactly the removed `scale(1.5)` factor. The probe stays permanent, so any future
reintroduction of a display-scale desync re-trips it.

---

## Per-Requirement Evidence (MOB-01..MOB-05 DELIVERED)

| Req | Delivered? | Proving gate(s) | Evidence |
|-----|-----------|-----------------|----------|
| **MOB-01** — Responsive canvas (letterbox replaces CSS transform; RED-first probe; desktop look + mouse behavior preserved; stale comments rewritten) | **✅ DELIVERED** | `touch-coordinate-probe.mjs` (RED ~480 → GREEN ~320) + `browser-boot.mjs` (desktop mouse audits) + `check-geometry-frozen.mjs` | Probe GREEN 320.0; desktop tile/mute/answer clicks green; geometry byte-identical; `main.js`/`index.html` transform hack deleted, `#stage` device-class container added, stale offsetX/offsetY comments rewritten (37-02). |
| **MOB-02** — Touch controls (left/right + hold-jump variable-height, per-identifier multi-touch, ≥64px hit zones, touch-only, challenge-pause-aware, CONFIG tunables) | **✅ DELIVERED** | `touch-controls-drive.mjs` + `check-safety.sh` + `check-import-safety.sh` + `browser-boot.mjs` | touchctl=6 mounts on touch / 0 on desktop; held-rise 94.1px > tap-rise 60.4px (variable height via the ONE `input.js` seam, LOCKED coyote/buffer physics reused); left+jump multi-touch drives move+rise; CONFIG.TOUCH rects all ≥64px; a727c13-clean, zero timers; desktop parity green. |
| **MOB-03** — Math answers, mute, reset tappable on touch (via unified mapping) | **✅ DELIVERED** | `touch-tap-ui-probe.mjs` + `browser-boot.mjs` (keyboard parity) | tap resolves a math answer box (touchToMouse + unified `Qe`); tap toggles mute both ways (getVolume 0↔1); tap arms/cancels(no-nav)/confirms the title reset (coarse-pointer `area()+onClick`; keyboard `r`/`y`/`n`/`escape` flow byte-identical). |
| **MOB-04** — Portrait "rotate your device" overlay + gesture suppression (`touch-action: none`, viewport meta; no `screen.orientation.lock()`) | **✅ DELIVERED** | `touch-orientation-probe.mjs` + `browser-boot.mjs` (desktop unaffected) | portrait coarse → `#rotate=flex`, `#stage=none`; landscape → reversed (machine-asserted via getComputedStyle, not grepped); `#game { touch-action: none }` + scale-pinned viewport meta present; zero `screen.orientation.lock()`; desktop pointer:fine never shows the overlay. |
| **MOB-05** — Audio gesture-gate CODE (unlock wired to an activation event, never touchstart; iOS ITP eviction documented) | **✅ DELIVERED (code)** | `browser-boot.mjs` (`assertAudioContextState` suspended→running post-gesture; ≤1 audio element) | `wireAudioUI()` registers a global first-gesture unlock (`onClick → ensureMusicPlaying`) that fires on any click/pointerup through touchToMouse — explicitly NOT `touchstart` (iOS user-activation rule), idempotent, harmless on desktop. iOS activation reasoning + the ~7-day ITP localStorage-eviction expectation are documented in-code. **Real-device audio-activation PROOF is DEFERRED** (see below). |

---

## DEFERRED to Phase 38 (out of this phase's buildable scope)

These items require a real device and cannot be proven headlessly. They roll to Phase 38, whose
ROADMAP requirements already own them (MOB-06 is a Phase-38 requirement; the device audio proof and
UAT belong to Phase 38's VER-01..04 live-playthrough + kid sign-off):

- **MOB-05 real-device audio-activation PROOF** — Playwright synthetic taps grant user-activation
  *unconditionally*, so the headless AudioContext gate passes even where a real iPhone (where
  `touchstart` is NOT an activation-triggering event) could fail (Assumption A3). The *code* wiring
  (click/pointerup, never touchstart) is done and the headless suspended→running gate is green; the
  on-device confirmation that audio genuinely starts after the FIRST real touch must be verified on a
  physical iOS device.
- **MOB-06 kid touch-layout tuning** — button size/placement adjustments driven by watching the kid's
  actual hands on her device (Assumption A2 device predicate). Ergonomics require observed play.
- **iOS ITP ~7-day localStorage eviction** — DOCUMENTED as an expectation only; no backend fix, the
  laptop stays the progress home (A4). No code path depends on it (guarded seams default forgivingly).
- **Desktop pixel-parity spot-check (Assumption A1)** — behavioral + geometry parity is proven above;
  the letterbox render path differs from the old CSS transform, so a human visual spot-check that
  pixels/legibility are acceptable is a Phase-38 UAT item. The letterbox-only-on-touch device-branch
  fallback is documented if pixels visibly differ (avoid unless forced).

---

## Validation Sign-Off

- [x] RED-first coordinate probe recorded RED (~480) then GREEN (~320)
- [x] All four permanent touch gates green (coordinate, orientation, tap-ui, controls-drive)
- [x] browser-boot desktop parity green (mouse audits + keyboard drive + audio gesture-gate) — solo re-run clean after one documented perf-fps flake
- [x] check-safety + check-import-safety + check-progress + check-gate + validate-levels green
- [x] check-assets-manifest + check-geometry-frozen green (desktop byte-identical / 8 levels frozen)
- [x] MOB-01..MOB-05 DELIVERED with per-requirement gate evidence
- [x] MOB-05 device audio proof + MOB-06 kid tuning + ITP note + A1 pixel spot-check explicitly recorded as deferred to Phase 38

**Approval:** PASSED (automated consolidated suite green; no source changes in closeout). On-device
MOB-05 audio proof, MOB-06 tuning, and A1 pixel spot-check carry to Phase 38.
