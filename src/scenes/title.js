// src/scenes/title.js — the Nox Run title scene (Phase 14 NAV-01).
//
// The simplest possible instance of the project's scene-factory template
// (src/scenes/game.js:31): a closure-only factory whose body draws the
// dark-grunge title + a press-to-start prompt and wires dual-input start
// controllers that go("select").
//
// ENGINE-GLOBAL DISCIPLINE (a727c13 — mirror src/ui/hud.js:8-12 / game.js:16-18):
// EVERY Kaplay primitive (add, text, color, pos, anchor, center, fixed, z, go,
// onKeyPress, onClick) is referenced ONLY inside the factory body. They come from
// Kaplay `global: true` and exist only AFTER kaplay() runs — a module-TOP-LEVEL
// reference would throw at import and blank the canvas. Module scope here is limited
// to the CONFIG import and plain color-array literals (which call nothing).
//
// IN-WORLD, NOT THE DOM (CLAUDE.md canon): every visual is a Kaplay canvas object
// (text()) — no markup-string sink, so no injection path. Title.js still reads no
// state directly, but its Reset Progress control (quick-260707-95c) triggers a
// storage-clearing write through the guarded progress.js resetSave() seam.
//
// scenes/ is one directory below src/, so the sibling config import is `../config.js`.

import { CONFIG } from "../config.js"; // title layout constants
import { resetSave } from "../progress.js"; // guarded storage-clearing seam (Reset Progress)
import * as audio from "../audio.js"; // gesture-gated music start + per-scene mute UI (AUD-02/AUD-03)

// Dark-grunge palette per CLAUDE.md (neon-green accent, light-grey foreground, NO pink).
// Colors read from the single source of truth, CONFIG.PALETTE (VIS-01; Phase 26 Plan 01).

/**
 * titleScene — NAV-01. Render the centered "Nox Run" logo + a press-to-start
 * prompt, and wire Enter / Space / full-screen click → go("select").
 *
 * @param {object} [data] go() payload (unused here; kept for the factory contract).
 */
export function titleScene(data) {
  const T = CONFIG.TITLE;

  // AUD-03: mount the mute key + icon fresh on every title-scene entry (mirrors the
  // onKeyPress("r", openResetConfirm) bare-call convention below) — go() clears the
  // app-wide input bus on every scene transition (Phase 22-03 engine-verified finding),
  // so a boot-time-only registration would silently stop firing after the first
  // transition. Also immediately re-applies any persisted mute flag to actual audio
  // output, before the player has even pressed start.
  audio.wireAudioUI();

  // Shared dark-grunge backdrop (Phase 18 ART-04). Added first so it renders
  // behind everything; fixed() + low z() keeps it camera-immune and below UI.
  add([sprite("title-bg"), pos(0, 0), fixed(), z(CONFIG.TITLE_BG_Z), "title"]);

  // Baked "NOX RUN" logo (BRAND-01/BRAND-03; Phase 26 Plan 07) — dark-green
  // fill + neon-green edge, baked via scripts/build-art-assets.py's
  // build_logo() from the CC0 "monogram" font. fixed() + high z() so it
  // floats in screen space (camera-immune), matching the old wordmark's
  // placement. Mounts at opacity 0 and unconditionally reveals via a single
  // non-strobing tween — no key press or click required to start it, and it
  // is NEVER destroyed after the reveal (unlike the transient "Progress
  // reset." banner below, this is a persistent UI element).
  const logo = add([
    sprite("logo-hero"),
    anchor("center"),
    pos(center()),
    opacity(0),
    fixed(),
    z(9000),
    "title",
  ]);
  tween(0, 1, T.LOGO_REVEAL_MS / 1000, (v) => (logo.opacity = v), easings.easeOutQuad);

  // Press-to-start prompt — light-grey foreground, centered just below the wordmark.
  add([
    text("press ENTER / SPACE / click to start", { size: T.PROMPT_SIZE }),
    anchor("center"),
    pos(center().x, center().y + T.PROMPT_DY),
    color(CONFIG.PALETTE.TEXT[0], CONFIG.PALETTE.TEXT[1], CONFIG.PALETTE.TEXT[2]),
    fixed(),
    z(9000),
    "title",
  ]);

  // Dark backing chip behind the reset prompt — bug fix: RESET_FG (0x888888) is
  // byte-identical to title-bg.png's castle/hill art (build-art-assets.py's
  // ENVIRONMENT_PALETTE "strong edge/seam highlight" token), so the text rendered but
  // was perfectly camouflaged wherever it sat over that shape. This chip guarantees
  // contrast regardless of the backdrop; z sits just below the text's own z(9000).
  add([
    rect(T.RESET_CHIP_W, T.RESET_CHIP_H),
    anchor("center"),
    pos(center().x, T.RESET_Y),
    color(CONFIG.PALETTE.SURFACE[0], CONFIG.PALETTE.SURFACE[1], CONFIG.PALETTE.SURFACE[2]),
    opacity(0.85),
    fixed(),
    z(8999),
    "title",
  ]);

  // Muted "press R to reset progress" prompt — deliberately secondary (grey, small) to
  // the bright green start prompt above it, near the bottom edge of the canvas.
  add([
    text("press R to reset progress", { size: T.RESET_SIZE }),
    anchor("center"),
    pos(center().x, T.RESET_Y),
    color(CONFIG.PALETTE.TEXT_DIM[0], CONFIG.PALETTE.TEXT_DIM[1], CONFIG.PALETTE.TEXT_DIM[2]),
    fixed(),
    z(9000),
    "title",
  ]);

  // Dual-input start (she plays on a laptop): Enter, Space, and a full-screen click
  // all advance to the level-select. These are a closure-local, REASSIGNABLE array
  // (not one-shot consts) because the Reset Progress confirm overlay below must be
  // able to cancel/re-arm them for its lifetime — Kaplay's global onClick has no
  // z-order occlusion, so a click on the confirm panel would ALSO fire "start" unless
  // it is disarmed while the overlay is open (see module header + T-260707-01).
  // AUD-02: ensureMusicPlaying() MUST be the literal first statement — browser
  // autoplay policy requires AudioContext.resume() to happen synchronously within the
  // original user-gesture call stack. Do NOT wrap this in .then()/a tween callback/
  // anything deferred; `start` is invoked directly and synchronously by
  // onKeyPress("enter"|"space", start) and onClick(start) below.
  const start = () => {
    audio.ensureMusicPlaying();
    go("select");
  };
  let startCtrls = [onKeyPress("enter", start), onKeyPress("space", start), onClick(start)];

  // --- Reset Progress control (quick-260707-95c) ---
  // Anti-leak: confirmOpen is a closure-local re-entrancy guard, never module-level.
  let confirmOpen = false;
  // Closure-local array of the confirm overlay's own key controllers, cancelled by
  // closeResetConfirm().
  let confirmCtrls = [];

  /**
   * Open the "Reset ALL progress?" confirm overlay. No-op if already open (guards
   * against a second "R" press stacking a duplicate overlay). Disarms the existing
   * start controllers for the overlay's duration so a stray Enter/Space/click cannot
   * navigate away mid-confirm.
   */
  function openResetConfirm() {
    if (confirmOpen) return;
    confirmOpen = true;

    // Disarm start while the overlay is open (see comment above startCtrls).
    startCtrls.forEach((c) => c.cancel());
    startCtrls = [];

    // Full-screen dim layer — mirrors challenge.js's dim-backdrop idiom.
    add([
      rect(width(), height()),
      pos(0, 0),
      color(0, 0, 0),
      opacity(CONFIG.GATE.DIM_OPACITY),
      fixed(),
      z(9990),
      "title",
      "reset-confirm",
    ]);

    // Centered dark-grunge panel.
    add([
      rect(T.CONFIRM_PANEL_W, T.CONFIRM_PANEL_H),
      anchor("center"),
      pos(center()),
      color(CONFIG.PALETTE.SURFACE[0], CONFIG.PALETTE.SURFACE[1], CONFIG.PALETTE.SURFACE[2]),
      outline(2, rgb(CONFIG.PALETTE.BORDER[0], CONFIG.PALETTE.BORDER[1], CONFIG.PALETTE.BORDER[2])),
      fixed(),
      z(9991),
      "title",
      "reset-confirm",
    ]);

    // Heading — danger-red, states the destructive action plainly.
    add([
      text("Reset ALL progress?", { size: T.CONFIRM_TITLE_SIZE }),
      color(CONFIG.PALETTE.DANGER[0], CONFIG.PALETTE.DANGER[1], CONFIG.PALETTE.DANGER[2]),
      anchor("center"),
      pos(center().x, center().y - 40),
      fixed(),
      z(9992),
      "title",
      "reset-confirm",
    ]);

    // Body — what will be lost, and that it can't be undone.
    add([
      text("XP, levels, and unlocked stages will be cleared. This can't be undone.", {
        size: T.CONFIRM_BODY_SIZE,
      }),
      color(CONFIG.PALETTE.TEXT[0], CONFIG.PALETTE.TEXT[1], CONFIG.PALETTE.TEXT[2]),
      anchor("center"),
      pos(center().x, center().y - 8),
      fixed(),
      z(9992),
      "title",
      "reset-confirm",
    ]);

    // Hint — the Y/N/ESC key mapping.
    add([
      text("Y = yes, reset     N / ESC = cancel", { size: T.CONFIRM_HINT_SIZE }),
      color(CONFIG.PALETTE.TEXT[0], CONFIG.PALETTE.TEXT[1], CONFIG.PALETTE.TEXT[2]),
      anchor("center"),
      pos(center().x, center().y + 30),
      fixed(),
      z(9992),
      "title",
      "reset-confirm",
    ]);

    const yesCtrl = onKeyPress("y", confirmReset);
    const noCtrl = onKeyPress("n", closeResetConfirm);
    const escCtrl = onKeyPress("escape", closeResetConfirm);
    confirmCtrls = [yesCtrl, noCtrl, escCtrl];
  }

  /**
   * Tear down the confirm overlay: cancel its key controllers, destroy ONLY the
   * "reset-confirm"-tagged objects (the persistent title/prompt/reset-hint text keep
   * only the "title" tag, so they survive), and re-arm the start controllers so
   * normal navigation works again immediately.
   */
  function closeResetConfirm() {
    confirmCtrls.forEach((c) => c.cancel());
    confirmCtrls = [];
    destroyAll("reset-confirm");
    confirmOpen = false;
    startCtrls = [onKeyPress("enter", start), onKeyPress("space", start), onClick(start)];
  }

  /**
   * Y pressed: actually clear the save, close the overlay, and show a brief
   * self-destroying "Progress reset." confirmation — the IDENTICAL self-clean idiom
   * src/ui/hud.js's flashLevelUp() uses (tween + onEnd(destroy), no timer/scheduler call).
   */
  function confirmReset() {
    resetSave();
    closeResetConfirm();

    const banner = add([
      text("Progress reset.", { size: T.PROMPT_SIZE }),
      anchor("center"),
      pos(center()),
      color(CONFIG.PALETTE.REWARD[0], CONFIG.PALETTE.REWARD[1], CONFIG.PALETTE.REWARD[2]),
      opacity(1),
      fixed(),
      z(9500),
      "title",
    ]);
    tween(1, 0, T.RESET_FLASH_MS / 1000, (v) => (banner.opacity = v), easings.easeOutQuad).onEnd(
      () => destroy(banner),
    );
  }

  onKeyPress("r", openResetConfirm);
}
