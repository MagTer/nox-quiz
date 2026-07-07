// src/scenes/title.js — the Math Lab title scene (Phase 14 NAV-01).
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

// Dark-grunge palette per CLAUDE.md (neon-green accent, light-grey foreground, NO pink).
// Plain data literals — safe at module scope because they call no engine global (a727c13).
// Reused verbatim from src/ui/hud.js:36-37 so the title reads as the same world.
const ACCENT_GREEN = [0x00, 0xff, 0x88]; // "Math Lab" wordmark
const HINT_FG = [0xe8, 0xe8, 0xe8]; // press-to-start prompt (#e8e8e8 — ~18:1 on #0a0a0a)

// Reset Progress control palette (quick-260707-95c).
const RESET_FG = [0x88, 0x88, 0x88]; // muted grey — visually secondary to the start prompt
const DANGER_RED = [0xff, 0x44, 0x33]; // same muted-red as challenge.js ACCENT_RED / CONFIG.ENEMY.COLOR
const PANEL_BG = [20, 20, 20]; // byte-identical to challenge.js's PANEL_BG
const PANEL_BORDER = [0x33, 0x33, 0x33]; // byte-identical to challenge.js's PANEL_BORDER

/**
 * titleScene — NAV-01. Render the centered "Math Lab" wordmark + a press-to-start
 * prompt, and wire Enter / Space / full-screen click → go("select").
 *
 * @param {object} [data] go() payload (unused here; kept for the factory contract).
 */
export function titleScene(data) {
  const T = CONFIG.TITLE;

  // Shared dark-grunge backdrop (Phase 18 ART-04). Added first so it renders
  // behind everything; fixed() + low z() keeps it camera-immune and below UI.
  add([sprite("title-bg"), pos(0, 0), fixed(), z(CONFIG.TITLE_BG_Z), "title"]);

  // Centered "Math Lab" wordmark — neon-green accent, fixed() + high z() so it floats
  // in screen space (camera-immune). Minimal dark-grunge styling; real art is Phase 18.
  add([
    text("Math Lab", { size: T.TITLE_SIZE }),
    anchor("center"),
    pos(center()),
    color(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]),
    fixed(),
    z(9000),
    "title",
  ]);

  // Press-to-start prompt — light-grey foreground, centered just below the wordmark.
  add([
    text("press ENTER / SPACE / click to start", { size: T.PROMPT_SIZE }),
    anchor("center"),
    pos(center().x, center().y + T.PROMPT_DY),
    color(HINT_FG[0], HINT_FG[1], HINT_FG[2]),
    fixed(),
    z(9000),
    "title",
  ]);

  // Muted "press R to reset progress" prompt — deliberately secondary (grey, small) to
  // the bright green start prompt above it, near the bottom edge of the canvas.
  add([
    text("press R to reset progress", { size: T.RESET_SIZE }),
    anchor("center"),
    pos(center().x, T.RESET_Y),
    color(RESET_FG[0], RESET_FG[1], RESET_FG[2]),
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
  const start = () => go("select");
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
      color(PANEL_BG[0], PANEL_BG[1], PANEL_BG[2]),
      outline(2, rgb(PANEL_BORDER[0], PANEL_BORDER[1], PANEL_BORDER[2])),
      fixed(),
      z(9991),
      "title",
      "reset-confirm",
    ]);

    // Heading — danger-red, states the destructive action plainly.
    add([
      text("Reset ALL progress?", { size: T.CONFIRM_TITLE_SIZE }),
      color(DANGER_RED[0], DANGER_RED[1], DANGER_RED[2]),
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
      color(HINT_FG[0], HINT_FG[1], HINT_FG[2]),
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
      color(HINT_FG[0], HINT_FG[1], HINT_FG[2]),
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
      color(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]),
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
