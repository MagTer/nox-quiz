// src/ui/mathGate.js — the SINGLE one-way bridge between the Kaplay scene and the
// pure math brain. This is the in-world gate the kid actually sees and touches.
//
// ONE-WAY DEPENDENCY (GATE-06): this module imports the brain and the leaf config
// constants only — never the scene layer. The arrow points gate -> brain, full stop;
// the brain never imports this gate. The scene (Plan 03) constructs a brain and hands
// it in via openMathGate({ brain, onClear }); the gate just consumes it.
//
// ENGINE-GLOBAL DISCIPLINE (mirror src/scenes/game.js 14-17): Kaplay primitives
// (add, text, rect, color, opacity, outline, anchor, pos, fixed, z, area, onKeyPress,
// center, width, height, rgb, destroyAll, shake) come from Kaplay `global: true`. They are
// used as bare globals exactly like game.js does — they are NOT imported. Teardown uses
// destroyAll(tag) (the tag-aware bulk remover); plain destroy() only accepts a GameObj
// and would throw a TypeError if handed the "math-gate" string tag.
//
// src/ui/ is one directory below src/, so sibling-module imports use `../`.
//
// IN-WORLD, NOT A SYSTEM POPUP (GATE-01): every visual is a Kaplay canvas object
// (text()/rect()), rendered fixed() + high z() so it reads as part of the game over the
// dimmed-but-visible level. There is deliberately no markup string sink and no browser
// modal API — the question/answers are pure canvas draws, so there is no injection path
// (continues the game.js goal-banner T-09-07 guard).
//
// FORGIVING + NO TIME PRESSURE (GATE-04 / GATE-05): a wrong pick never ends the run —
// it nudges the box and keeps the SAME question with the gate open. Nothing counts down;
// the gate stays open until a correct answer. There is intentionally no deferred
// scheduler and no elapsed-time fail anywhere in this module (ADHD-safe by construction).
//
// ANTI-LEAK (RESEARCH Pitfall 1): the number-key handlers are GLOBAL controllers that
// outlive their objects, and the gate re-opens at every goal — so each captured
// controller is cancelled and every "math-gate"-tagged object is destroyed on close, or
// handlers would stack across re-opens.

import { createBrain } from "../math/brain.js"; // the ONLY consumer of the brain (one-way)
import { CONFIG } from "../config.js"; // GATE tuning constants (dim opacity, panel size)

// Dark-grunge palette per CLAUDE.md (bg near-black, #333 borders, neon accents, NO pink).
const PANEL_BG = [20, 20, 20];
const PANEL_BORDER = [0x33, 0x33, 0x33];
const BOX_BG = [30, 30, 30];
const BOX_BORDER = [0x44, 0x44, 0x44];
const ACCENT_GREEN = [0x00, 0xff, 0x88]; // correct flash
const ACCENT_RED = [0xff, 0x44, 0x33]; // wrong nudge

/**
 * Open the in-world math gate over the (already paused) level.
 *
 * @param {object} args
 * @param {{ nextQuestion: Function, reportResult: Function }} args.brain
 *   The math brain instance supplied by the scene (one-way: gate consumes it). If no
 *   brain is supplied, a fresh fallback brain is constructed so the gate is self-standing.
 * @param {() => void} args.onClear
 *   Level-clear hook invoked EXACTLY once on a correct answer. The scene decides what
 *   "clear" means; this gate only fires the hook and closes cleanly.
 */
export function openMathGate({ brain, onClear } = {}) {
  // Self-standing fallback so the gate never throws if the scene forgets to pass a brain.
  if (!brain) brain = createBrain();

  // Pull the question ONCE and keep this SAME object for the whole gate session: a
  // forgiving re-ask reuses it, so a wrong pick re-presents the identical question (GATE-04).
  const q = brain.nextQuestion();
  const display = `${q.a} × ${q.b}`; // U+00D7 multiplication glyph; fall back to 'x' if tofu.

  // Fire-once latch for onClear (a correct pick must clear EXACTLY once — Pitfall 5).
  let cleared = false;

  // --- In-world overlay (GATE-01): fixed() + high z() over the dimmed level ---
  // Root/parent carrying the cleanup tag; mirrors the game.js goal-banner fixed() idiom.
  add([fixed(), z(9999), "math-gate"]);

  // Full-screen dim layer — the level stays VISIBLE but darkened behind the panel.
  add([
    rect(width(), height()),
    pos(0, 0),
    color(0, 0, 0),
    opacity(CONFIG.GATE.DIM_OPACITY),
    fixed(),
    z(9990),
    "math-gate",
  ]);

  // Centered dark-grunge panel.
  add([
    rect(CONFIG.GATE.PANEL_W, CONFIG.GATE.PANEL_H),
    anchor("center"),
    pos(center()),
    color(PANEL_BG[0], PANEL_BG[1], PANEL_BG[2]),
    outline(2, rgb(PANEL_BORDER[0], PANEL_BORDER[1], PANEL_BORDER[2])),
    fixed(),
    z(9991),
    "math-gate",
  ]);

  // Big question expression near the top of the panel (built here — the brain dropped its
  // display field). Pure canvas text(), never a markup sink.
  add([
    text(display),
    anchor("center"),
    pos(center().x, center().y - 60),
    fixed(),
    z(9992),
    "math-gate",
  ]);

  // --- Four answer boxes from q.choices, dual-input (mouse-click + keys 1-4) ---
  const BOX_W = 84;
  const BOX_H = 44;
  const GAP = 16;
  const totalW = q.choices.length * BOX_W + (q.choices.length - 1) * GAP;
  const startX = center().x - totalW / 2 + BOX_W / 2;
  const rowY = center().y + 30;

  // Keep box refs so the wrong/correct branches can recolor / shake the chosen one.
  const boxes = [];

  q.choices.forEach((choice, i) => {
    const bx = startX + i * (BOX_W + GAP);

    const box = add([
      rect(BOX_W, BOX_H),
      area(),
      anchor("center"),
      pos(bx, rowY),
      color(BOX_BG[0], BOX_BG[1], BOX_BG[2]),
      outline(2, rgb(BOX_BORDER[0], BOX_BORDER[1], BOX_BORDER[2])),
      fixed(),
      z(9992),
      "math-gate",
      "answer",
      { idx: i },
    ]);

    // Label: the index (1-4) plus the choice value, so the key mapping is legible.
    add([
      text(i + 1 + ") " + choice, { size: 22 }),
      anchor("center"),
      pos(bx, rowY),
      fixed(),
      z(9993),
      "math-gate",
    ]);

    // Mouse path: object-scoped, auto-cleaned when the box is destroyed (no leak).
    box.onClick(() => choose(i));

    boxes.push(box);
  });

  // Keyboard path: number keys 1-4 select the matching box. These are GLOBAL controllers
  // that outlive their objects, so each is captured and cancelled on close (anti-leak).
  // WR-03: keys 1-4 are RESERVED for the gate while it is open — future phases must not
  // rebind them globally (level-select / debug hotkeys) or the bindings would collide
  // while the gate is up. The cleared/bounds guards in choose() are the safety net if
  // they ever do; cancellation on close() frees the keys the moment the gate tears down.
  const keyCtrls = ["1", "2", "3", "4"].map((k, i) => onKeyPress(k, () => choose(i)));

  /**
   * Single answer-handling path for BOTH input methods.
   * @param {number} i index of the chosen box / choice.
   */
  function choose(i) {
    if (cleared) return; // ignore further input once the level has been cleared
    if (i < 0 || i >= q.choices.length) return; // bounds guard (constrained input surface)

    const picked = q.choices[i];
    const correct = picked === q.answer;

    // Push the result to the brain (one-way gate -> brain). q.a is the table.
    brain.reportResult(q.a, correct);

    const box = boxes[i];

    if (!correct) {
      // WRONG (GATE-04 forgiving): nudge + redden the chosen box, KEEP the same question,
      // leave the gate open and input live. No run-ending state, no clear, no close.
      if (box) box.color = rgb(ACCENT_RED[0], ACCENT_RED[1], ACCENT_RED[2]);
      shake(6);
      return;
    }

    // CORRECT (GATE-03): tear down the interactive gate, then render a PERSISTENT
    // cleared-state celebration (neon-green panel + "LEVEL CLEAR") and fire onClear once.
    //
    // GATE-05 forbids any deferred scheduler in this file, so we cannot postpone teardown
    // to give a same-frame add()+destroy() celebration a beat to render (WR-01). Instead the
    // celebration is the TERMINAL cleared state: there is no next level this phase, so the
    // banner simply stays on screen. It is tagged "gate-cleared" — a DIFFERENT tag from
    // "math-gate" — so close()'s destroyAll("math-gate") wipes the interactive overlay
    // (dim layer, panel, question, answer boxes, key controllers) but LEAVES the
    // celebration standing. No scheduler involved.
    cleared = true;

    close(); // cancel key controllers + destroyAll("math-gate") interactive objects

    // Persistent neon-green clear panel behind the banner (re-asserts the dim backdrop
    // so the cleared level reads as "done", not blank). Tagged "gate-cleared" (survives).
    add([
      rect(width(), height()),
      pos(0, 0),
      color(0, 0, 0),
      opacity(CONFIG.GATE.DIM_OPACITY),
      fixed(),
      z(9990),
      "gate-cleared",
    ]);
    add([
      text("LEVEL CLEAR", { size: 30 }),
      anchor("center"),
      pos(center().x, center().y),
      color(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]),
      fixed(),
      z(9994),
      "gate-cleared",
    ]);

    onClear?.();
  }

  /**
   * Clean teardown: cancel every captured global key controller AND destroy every
   * tagged gate object. BOTH are required — object-scoped click handlers die with their
   * boxes, but the global key controllers do not, so they must be cancelled explicitly.
   */
  function close() {
    keyCtrls.forEach((c) => c.cancel());
    destroyAll("math-gate"); // tag-based bulk removal; destroy() only accepts a GameObj
  }
}
