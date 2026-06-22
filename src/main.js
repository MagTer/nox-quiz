// src/main.js — Math Lab v3.0 game shell (Phase 7 smoke test)
//
// Imports the vendored Kaplay engine (relative to src/, so the same path
// resolves under the dev server and inside the nginx container) and proves
// it initializes by drawing "hello". Phase 8 replaces this placeholder scene
// with real platformer code.
//
// Note: the file:// protocol guard lives as an inline non-module script in
// index.html (it must run BEFORE this module's hoisted import). Do not rely
// on a guard here — a top-level import is hoisted and would run first.

import kaplay from "../lib/kaplay.mjs";

// kaplay() returns a context and, with global: true (the default), also
// exposes scene/add/text/pos/anchor/color/go on the global scope.
const k = kaplay({
  width: 640,
  height: 360,
  background: "#0a0a0a",            // project dark-grunge background
  canvas: document.querySelector("#game"),
});

// Smoke-test scene: confirms the vendored engine boots and renders.
scene("game", () => {
  add([
    text("hello", { size: 48 }),
    pos(320, 180),
    anchor("center"),
    color(0, 255, 136),             // project accent #00ff88
  ]);
});

go("game");
