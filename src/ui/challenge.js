// src/ui/challenge.js — shared in-world challenge component.
//
// This is the mechanic-agnostic overlay that presents a question + answer choices,
// accepts mouse or 1-4 key input, and fires a single success callback. It was extracted
// from src/ui/mathGate.js so multiple mechanics (math gate, locked door, ...) can reuse
// the SAME interactive layer without carrying end-of-level vocabulary into every caller.
//
// ONE-WAY DEPENDENCY (GATE-06): this module imports the brain and the leaf config
// constants only — never the scene layer. The arrow points challenge -> brain, full stop;
// the brain never imports this challenge. Callers construct a brain and hand it in via
// openChallenge({ brain, onSuccess, prompt }); the challenge just consumes it.
//
// ENGINE-GLOBAL DISCIPLINE (mirror src/scenes/game.js 14-17): Kaplay primitives
// (add, text, rect, color, opacity, outline, anchor, pos, fixed, z, area, onKeyPress,
// center, width, height, rgb, destroyAll, shake) come from Kaplay `global: true`. They are
// used as bare globals exactly like game.js does — they are NOT imported. Teardown uses
// destroyAll(tag) (the tag-aware bulk remover); plain destroy() only accepts a GameObj
// and would throw a TypeError if handed the "challenge" string tag.
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
// it nudges the box and keeps the SAME question with the challenge open. Nothing counts
// down; the challenge stays open until a correct answer. There is intentionally no deferred
// scheduler and no elapsed-time fail anywhere in this module (ADHD-safe by construction).
//
// ANTI-LEAK (RESEARCH Pitfall 1): the number-key handlers are GLOBAL controllers that
// outlive their objects, and a challenge may re-open multiple times per scene — so each
// captured controller is cancelled and every "challenge"-tagged object is destroyed on
// close, or handlers would stack across re-opens.

import { createBrain } from "../math/brain.js"; // the ONLY consumer of the brain (one-way)
import { CONFIG } from "../config.js"; // GATE tuning constants (dim opacity, panel size)

// Dark-grunge palette per CLAUDE.md (bg near-black, #333 borders, neon red accent, NO pink).
const PANEL_BG = [20, 20, 20];
const PANEL_BORDER = [0x33, 0x33, 0x33];
const BOX_BG = [30, 30, 30];
const BOX_BORDER = [0x44, 0x44, 0x44];
const ACCENT_RED = [0xff, 0x44, 0x33]; // wrong nudge

/**
 * Open the shared in-world challenge overlay over the (already paused) level.
 *
 * @param {object} args
 * @param {{ nextQuestion: Function, reportResult: Function }} args.brain
 *   The math brain instance supplied by the caller (one-way: challenge consumes it). If no
 *   brain is supplied, a fresh fallback brain is constructed so the overlay is self-standing.
 * @param {(payload: { table: number }) => void} args.onSuccess
 *   Success hook invoked EXACTLY once on a correct answer. Receives `{ table }` — the
 *   table the player just answered correctly (q.a) — so the caller can award XP, remove
 *   a door, etc. The challenge awards NOTHING itself; it only fires the hook and closes
 *   cleanly.
 * @param {string} [args.prompt]
 *   Optional plain-string prompt override. If omitted, the default `${q.a} × ${q.b}`
 *   expression is rendered.
 * @param {{ a: number, b: number, answer: number, choices: number[] }} [args.question]
 *   Optional caller-supplied question object. When provided, it is used instead of calling
 *   `brain.nextQuestion()`, so the overlay prompt can match spawned pickups (MECH-03).
 * @param {boolean} [args.renderChoices=true]
 *   When false, the answer-box grid and 1-4 key handlers are omitted. The caller provides
 *   its own input path (e.g. collect-the-answer pickups). close() remains safe either way.
 */
export function openChallenge({ brain, onSuccess, prompt, question, renderChoices = true } = {}) {
  // Self-standing fallback so the challenge never throws if the caller forgets a brain.
  if (!brain) brain = createBrain();

  // Pull the question ONCE and keep this SAME object for the whole session: a
  // forgiving re-ask reuses it, so a wrong pick re-presents the identical question (GATE-04).
  // Callers may pass their own question (e.g. collect.js) so the overlay matches spawned pickups.
  const q = question ?? brain.nextQuestion();
  const display = prompt ?? `${q.a} × ${q.b}`; // U+00D7 multiplication glyph; fall back to 'x' if tofu.

  // Fire-once latch for onSuccess (a correct pick must fire EXACTLY once — Pitfall 5).
  let cleared = false;

  // --- In-world overlay (GATE-01): fixed() + high z() over the dimmed level ---
  // Root/parent carrying the cleanup tag; mirrors the game.js goal-banner fixed() idiom.
  add([fixed(), z(9999), "challenge"]);

  // Full-screen dim layer — the level stays VISIBLE but darkened behind the panel.
  add([
    rect(width(), height()),
    pos(0, 0),
    color(0, 0, 0),
    opacity(CONFIG.GATE.DIM_OPACITY),
    fixed(),
    z(9990),
    "challenge",
  ]);

  // Centered dark-grunge panel — ONLY when rendering answer boxes. The panel exists to
  // visually hold the 4 answer boxes; when renderChoices is false (collect.js's only use
  // case), the panel has nothing to contain but is a 420x220 OPAQUE rect at screen-center
  // that would otherwise sit directly on top of world content positioned near the player
  // (e.g. collect.js's pickups) — completely hiding it. Found via headless playtest:
  // level-01's collect-zone pickups all fall within the panel's footprint at the level's
  // default camera position, making them entirely invisible to the player. Without the
  // panel, the dim layer above still darkens-but-shows the world per its own comment.
  if (renderChoices) {
    add([
      rect(CONFIG.GATE.PANEL_W, CONFIG.GATE.PANEL_H),
      anchor("center"),
      pos(center()),
      color(PANEL_BG[0], PANEL_BG[1], PANEL_BG[2]),
      outline(2, rgb(PANEL_BORDER[0], PANEL_BORDER[1], PANEL_BORDER[2])),
      fixed(),
      z(9991),
      "challenge",
    ]);
  }

  // Big question expression near the top of the panel (built here — the brain dropped its
  // display field). Pure canvas text(), never a markup sink.
  add([
    text(display),
    anchor("center"),
    pos(center().x, center().y - 60),
    fixed(),
    z(9992),
    "challenge",
  ]);

  // --- Four answer boxes from q.choices, dual-input (mouse-click + keys 1-4) ---
  // Callers can suppress the answer boxes (e.g. collect.js spawns pickups instead).
  // Box refs and captured key controllers are kept empty when suppressed so close() stays safe.
  const boxes = [];
  let keyCtrls = [];

  if (renderChoices) {
    const BOX_W = 84;
    const BOX_H = 44;
    const GAP = 16;
    const totalW = q.choices.length * BOX_W + (q.choices.length - 1) * GAP;
    const startX = center().x - totalW / 2 + BOX_W / 2;
    const rowY = center().y + 30;

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
        "challenge",
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
        "challenge",
      ]);

      // Mouse path: object-scoped, auto-cleaned when the box is destroyed (no leak).
      box.onClick(() => choose(i));

      boxes.push(box);
    });

    // Keyboard path: number keys 1-4 select the matching box. These are GLOBAL controllers
    // that outlive their objects, so each is captured and cancelled on close (anti-leak).
    // WR-03: keys 1-4 are RESERVED for the challenge while it is up — future phases must
    // not rebind them globally (level-select / debug hotkeys) or the bindings would collide
    // while the challenge is up. The cleared/bounds guards in choose() are the safety net if
    // they ever do; cancellation on close() frees the keys the moment the challenge tears down.
    keyCtrls = ["1", "2", "3", "4"].map((k, i) => onKeyPress(k, () => choose(i)));
  }

  /**
   * Single answer-handling path for BOTH input methods.
   * @param {number} i index of the chosen box / choice.
   */
  function choose(i) {
    if (cleared) return; // ignore further input once the challenge has been cleared
    if (i < 0 || i >= q.choices.length) return; // bounds guard (constrained input surface)

    const picked = q.choices[i];
    const correct = picked === q.answer;

    // Push the result to the brain (one-way challenge -> brain). q.a is the table.
    brain.reportResult(q.a, correct);

    const box = boxes[i];

    if (!correct) {
      // WRONG (GATE-04 forgiving): nudge + redden the chosen box, KEEP the same question,
      // leave the challenge open and input live. No run-ending state, no success, no close.
      if (box) box.color = rgb(ACCENT_RED[0], ACCENT_RED[1], ACCENT_RED[2]);
      shake(6);
      return;
    }

    // CORRECT: tear down the interactive overlay and hand off to the caller. The challenge
    // itself carries NO end-of-level vocabulary — any celebration UI is the caller's job.
    cleared = true;

    close(); // cancel key controllers + destroyAll("challenge") interactive objects

    onSuccess?.({ table: q.a }); // carry the cleared table (q.a) so the caller reacts
  }

  /**
   * Clean teardown: cancel every captured global key controller AND destroy every
   * tagged challenge object. BOTH are required — object-scoped click handlers die with their
   * boxes, but the global key controllers do not, so they must be cancelled explicitly.
   */
  function close() {
    keyCtrls.forEach((c) => c.cancel());
    destroyAll("challenge"); // tag-based bulk removal; destroy() only accepts a GameObj
  }

  return { close };
}
