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
// (text()) — no markup-string sink, so no injection path. The title screen reads no
// persisted state, so it touches no browser storage either.
//
// scenes/ is one directory below src/, so the sibling config import is `../config.js`.

import { CONFIG } from "../config.js"; // title layout constants — the only import

// Dark-grunge palette per CLAUDE.md (neon-green accent, light-grey foreground, NO pink).
// Plain data literals — safe at module scope because they call no engine global (a727c13).
// Reused verbatim from src/ui/hud.js:36-37 so the title reads as the same world.
const ACCENT_GREEN = [0x00, 0xff, 0x88]; // "Math Lab" wordmark
const HINT_FG = [0xe8, 0xe8, 0xe8]; // press-to-start prompt (#e8e8e8 — ~18:1 on #0a0a0a)

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

  // Dual-input start (she plays on a laptop): Enter, Space, and a full-screen click
  // all advance to the level-select. Registered INSIDE the body so go() tears them
  // down; these plain navigation controllers are auto-cleared by the app bus on go()
  // in Kaplay 3001 — no manual cancel required (RESEARCH Pattern 6).
  const start = () => go("select");
  onKeyPress("enter", start);
  onKeyPress("space", start);
  onClick(start);
}
