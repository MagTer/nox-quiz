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

  // MOB-03: coarse-pointer feature-detect (37-RESEARCH.md Pitfall 5 — NOT UA-sniffing,
  // NOT isTouchscreen() which false-positives on touch-capable laptops). `coarse` is true
  // only when the device's PRIMARY pointer is coarse (a finger). Every touch-only widget
  // added below is gated on it, so a desktop (pointer:fine) registers NOTHING new and this
  // scene stays byte-identical to the pre-Phase-37 keyboard-only flow (browser-boot proves
  // it). window.matchMedia is a browser global read inside the factory body (a727c13 —
  // never a Kaplay engine global at module top level). Guard the reference so a non-browser
  // import (node validators) never throws on a missing matchMedia.
  const coarse =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;

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
  //
  // MOB-03: on a coarse pointer this text object ALSO becomes a tap target — an area()
  // hitbox + onClick(openResetConfirm) is attached below so a tap arms the confirm exactly
  // like the "r" key does (the onKeyPress("r", openResetConfirm) at the bottom is UNCHANGED
  // and still fires on keyboard). On desktop (pointer:fine) `coarse` is false, so the
  // component list is byte-identical to before and no onClick is wired. Captured into a
  // closure-local so start()'s race guard can read resetPrompt.isHovering() (see start).
  const resetPromptComps = [
    text("press R to reset progress", { size: T.RESET_SIZE }),
    anchor("center"),
    pos(center().x, T.RESET_Y),
    color(CONFIG.PALETTE.TEXT_DIM[0], CONFIG.PALETTE.TEXT_DIM[1], CONFIG.PALETTE.TEXT_DIM[2]),
    fixed(),
    z(9000),
    "title",
  ];
  if (coarse) resetPromptComps.push(area()); // clickable hitbox — text() alone has none
  const resetPrompt = add(resetPromptComps);
  // openResetConfirm is a hoisted function declaration below — safe to reference here.
  if (coarse) resetPrompt.onClick(openResetConfirm);

  // Dual-input start (she plays on a laptop): Enter, Space, and a full-screen click all
  // advance to the level-select. The Enter/Space controllers live in a closure-local,
  // REASSIGNABLE array (not one-shot consts) because the Reset Progress confirm overlay
  // below cancels/re-arms them for its lifetime. The full-screen onClick(start) is instead
  // registered ONCE and persistently (never in startCtrls) — Kaplay's global onClick has no
  // z-order occlusion, so a click on the confirm panel would ALSO fire "start"; rather than
  // cancel/re-arm it (which re-registers a handler mid-click and re-fires start — the
  // touch-tap-ui-probe navigate bug, see start's guard (1)), start no-ops via its own
  // `if (confirmOpen) return` guard while the overlay is open (see module header + T-260707-01).
  // AUD-02: ensureMusicPlaying() MUST be the literal first statement — browser
  // autoplay policy requires AudioContext.resume() to happen synchronously within the
  // original user-gesture call stack. Do NOT wrap this in .then()/a tween callback/
  // anything deferred; `start` is invoked directly and synchronously by
  // onKeyPress("enter"|"space", start) and onClick(start) below.
  const start = () => {
    // MOB-03 race guards (both deterministic, order-independent). The global onClick(start)
    // registered below has NO z-order occlusion, so it fires on ANY tap/click — including one
    // that also hits a reset widget. Two guards make that harmless without relying on Kaplay's
    // handler dispatch order:
    //   (1) confirmOpen: while the reset confirm overlay is up, NEVER navigate. This is the
    //       load-bearing guard for the touch Yes/No buttons — those call close/confirm from
    //       INSIDE a mousePress dispatch, and the persistent onClick(start) below is registered
    //       BEFORE the buttons exist, so it always runs FIRST in that dispatch while confirmOpen
    //       is still true → it no-ops before the button handler flips confirmOpen. (Kaplay's
    //       KEvent.trigger iterates handlers head->tail in registration order — verified in
    //       lib/kaplay.mjs.) This is why onClick(start) is registered ONCE and NEVER re-armed:
    //       re-registering it inside a button's click handler would append a NEW handler that
    //       fires in the SAME dispatch, after confirmOpen was cleared — the exact navigate bug
    //       the touch-tap-ui-probe caught.
    //   (2) coarse + resetPrompt.isHovering(): belt-and-braces for the ARM tap — a tap ON the
    //       reset prompt sets mousePos over it (touchToMouse), so if start somehow ran before
    //       resetPrompt.onClick armed the overlay, it still no-ops. Coarse-gated + short-
    //       circuited so on desktop (no area() on resetPrompt) isHovering() is never called and
    //       the behavior is byte-identical.
    // AUD-02: ensureMusicPlaying() still runs synchronously within this gesture's call stack
    // once the guards pass (a cheap synchronous `if` never breaks the user-activation stack).
    if (confirmOpen) return;
    if (coarse && resetPrompt.isHovering()) return;
    audio.ensureMusicPlaying();
    go("select");
  };
  // onClick(start) is PERSISTENT — registered exactly once and NEVER cancelled/re-armed (see
  // guard (1) above for why re-registration is the bug). Only the Enter/Space KEY controllers
  // live in the reassignable startCtrls array that openResetConfirm cancels + closeResetConfirm
  // re-arms; those are keyboard handlers, never re-registered mid-click, so the keyboard reset
  // flow is byte-for-byte identical to before.
  onClick(start);
  let startCtrls = [onKeyPress("enter", start), onKeyPress("space", start)];

  // --- Reset Progress control (quick-260707-95c) ---
  // Anti-leak: confirmOpen is a closure-local re-entrancy guard, never module-level.
  let confirmOpen = false;
  // Closure-local array of the confirm overlay's own key controllers, cancelled by
  // closeResetConfirm().
  let confirmCtrls = [];

  /**
   * Open the "Reset ALL progress?" confirm overlay. No-op if already open (guards
   * against a second "R" press stacking a duplicate overlay). Disarms the Enter/Space
   * start KEY controllers for the overlay's duration; the persistent onClick(start) is
   * left registered and instead no-ops via its own `if (confirmOpen) return` guard, so a
   * stray Enter/Space/click cannot navigate away mid-confirm.
   */
  function openResetConfirm() {
    if (confirmOpen) return;
    confirmOpen = true;

    // Disarm the Enter/Space start keys while the overlay is open (see comment above
    // startCtrls). onClick(start) is NOT in this array — it stays persistent and is gated
    // by the confirmOpen guard inside start (re-arming it mid-click is the navigate bug).
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

    // MOB-03: on a coarse pointer, mount two tappable Yes/No buttons below the hint line
    // (the keyboard hint + Y/N/ESC handlers above are UNCHANGED). Each is a dark-grunge
    // rect (CONFIG.PALETTE, sized from CONFIG.TITLE.CONFIRM_BTN_*) carrying an area()+onClick
    // and a centered label, both tagged "reset-confirm" so closeResetConfirm's existing
    // destroyAll("reset-confirm") tears them down with the rest of the overlay — no extra
    // teardown. The onClick handlers reuse the SAME confirmReset / closeResetConfirm
    // functions the keys call. While the overlay is open startCtrls is already []
    // (openResetConfirm cancelled it above), so a Yes/No tap can never leak into start().
    // Desktop never enters this branch, so the overlay is byte-identical there.
    if (coarse) {
      const btnY = center().y + T.CONFIRM_BTN_DY;
      const mkButton = (dx, labelText, accent, onTap) => {
        const bx = center().x + dx;
        add([
          rect(T.CONFIRM_BTN_W, T.CONFIRM_BTN_H),
          area(),
          anchor("center"),
          pos(bx, btnY),
          color(CONFIG.PALETTE.SURFACE_ALT[0], CONFIG.PALETTE.SURFACE_ALT[1], CONFIG.PALETTE.SURFACE_ALT[2]),
          outline(2, rgb(accent[0], accent[1], accent[2])),
          fixed(),
          z(9992),
          "title",
          "reset-confirm",
        ]).onClick(onTap);
        add([
          text(labelText, { size: T.CONFIRM_BTN_SIZE }),
          anchor("center"),
          pos(bx, btnY),
          color(CONFIG.PALETTE.TEXT[0], CONFIG.PALETTE.TEXT[1], CONFIG.PALETTE.TEXT[2]),
          fixed(),
          z(9993),
          "title",
          "reset-confirm",
        ]);
      };
      // Yes = destructive → DANGER accent; No = safe cancel → BORDER accent.
      mkButton(-T.CONFIRM_BTN_DX, "YES", CONFIG.PALETTE.DANGER, confirmReset);
      mkButton(T.CONFIRM_BTN_DX, "NO", CONFIG.PALETTE.BORDER, closeResetConfirm);
    }
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
    // Re-arm ONLY the Enter/Space start keys. onClick(start) is persistent (never cancelled),
    // so it is NOT re-registered here — re-registering it inside this click-invoked path is the
    // exact same-dispatch navigate bug guard (1) in start documents.
    startCtrls = [onKeyPress("enter", start), onKeyPress("space", start)];
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
