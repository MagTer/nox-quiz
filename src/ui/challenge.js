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
const LABEL_FG = [0xe8, 0xe8, 0xe8]; // question-prompt + answer-box text (#e8e8e8, ~18:1) —
// matches src/scenes/select.js's own LABEL_FG exactly (21-RESEARCH.md Finding 1 convention;
// Finding 1 was REFUTED as the live bug's cause — uncolored text() already defaults to opaque
// white — but explicit color() is still applied here as defensive codebase-convention cleanup)

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
 *   Optional plain-string prompt override. If present, it REPLACES the default
 *   `${q.a} × ${q.b}` expression entirely (wins outright over `label`).
 * @param {string} [args.label]
 *   Optional plain-string label rendered on its OWN line ABOVE the default `${q.a} × ${q.b}`
 *   expression (e.g. "Answer to defeat the guard:" over "6 × 7"), so the caller can add
 *   mechanic-specific framing without hiding the arithmetic the answer boxes are actually
 *   answering (21-04 fix for the enemy.js prompt-override bug — 21-FINDINGS.md Finding 2).
 *   Rendered as two stacked lines (not one concatenated line) so longer labels never
 *   overflow the canvas width. Ignored when `prompt` is also supplied.
 * @param {{ a: number, b: number, answer: number, choices: number[] }} [args.question]
 *   Optional caller-supplied question object. When provided, it is used instead of calling
 *   `brain.nextQuestion()`, so the overlay prompt can match spawned pickups (MECH-03).
 * @param {boolean} [args.renderChoices=true]
 *   When false, the answer-box grid and 1-4 key handlers are omitted. The caller provides
 *   its own input path (e.g. collect-the-answer pickups). close() remains safe either way.
 */
export function openChallenge({ brain, onSuccess, prompt, label, question, renderChoices = true } = {}) {
  // Self-standing fallback so the challenge never throws if the caller forgets a brain.
  if (!brain) brain = createBrain();

  // Pull the question ONCE and keep this SAME object for the whole session: a
  // forgiving re-ask reuses it, so a wrong pick re-presents the identical question (GATE-04).
  // Callers may pass their own question (e.g. collect.js) so the overlay matches spawned pickups.
  const q = question ?? brain.nextQuestion();
  // `prompt`, when present, REPLACES the arithmetic display entirely (unchanged behavior —
  // collect.js's existing caller relies on this) and is rendered as a SINGLE line.
  // `label`, when present (and `prompt` is absent), is rendered on its OWN line ABOVE a
  // second line holding the bare arithmetic expression (21-FINDINGS.md Finding 2 fix) — a
  // single concatenated line was tried first but overflowed the 640px internal canvas width
  // for the enemy encounter's longer label (found via manual visual verification this task;
  // Rule 1 auto-fix, since a cut-off-at-both-edges prompt is exactly the legibility bug this
  // phase exists to catch). Otherwise fall back to the bare arithmetic expression alone.
  const arithmetic = `${q.a} × ${q.b}`; // U+00D7 multiplication glyph; fall back to 'x' if tofu.
  const display = prompt ?? arithmetic;

  // Fire-once latch for onSuccess (a correct pick must fire EXACTLY once — Pitfall 5).
  let cleared = false;

  // 21-06 fix — New Finding 4's VISUAL-overlap half (the state-corruption half was already
  // closed above via instanceTag scoping). Snapshot every already-open earlier challenge's
  // objects BEFORE this instance creates any of its own — at this point in openChallenge(),
  // none of THIS instance's own add([...]) calls have run yet, so get("challenge") returns
  // exactly (and only) whichever OTHER, earlier-opened instance's objects are still live (at
  // most one, per this file's own interfaces note: door/gates/enemy all freeze the player via
  // player.paused = true before calling openChallenge(), so a frozen player cannot physically
  // trigger a THIRD mechanic — max concurrent-open depth is always exactly 2). Hide (not
  // destroy) them for the duration: this keeps an older, non-freezing challenge (e.g.
  // collect.js's zone) fully alive and independently resolvable underneath, with only its
  // rendering suppressed while the newer overlay is on top. Deliberately NOT a "refuse to open
  // a second challenge" guard — that would strand a frozen player with no overlay to answer,
  // a soft-lock strictly worse than the visual-overlap bug this closes.
  const priorChallengeObjs = get("challenge");
  if (priorChallengeObjs.length > 0) {
    for (const o of priorChallengeObjs) o.hidden = true;
  }

  // CR-01 fix (2nd review pass): every object below carries BOTH the generic "challenge"
  // tag (kept so external callers/diagnostics like get("challenge").length can still detect
  // "is ANY challenge open" across instances) AND a per-invocation instanceTag. close()
  // destroys ONLY instanceTag-tagged objects, so a second, concurrently-open challenge
  // (e.g. collect.js's renderChoices:false session left open by design while the player
  // walks into a door/gate/enemy) can no longer have its overlay destroyed as collateral
  // damage when a DIFFERENT challenge instance resolves and tears itself down. This closes
  // the state-corruption half of CR-01/21-FINDINGS.md "New Finding 4" (destroyAll("challenge")
  // wiping out an unrelated, still-open session). The visual-overlap half of that finding
  // (two challenges' overlays rendering on screen at the same time) is a separate, larger
  // same-time-open-guard change across the shared seam — still out of scope here, see
  // 21-FINDINGS.md's own disposition (Rule 4 architectural sign-off, dedicated future plan).
  const instanceTag = `challenge-${Math.random().toString(36).slice(2)}`;

  // --- In-world overlay (GATE-01): fixed() + high z() over the dimmed level ---
  // Root/parent carrying the cleanup tag; mirrors the game.js goal-banner fixed() idiom.
  add([fixed(), z(9999), "challenge", instanceTag]);

  // Full-screen dim layer — the level stays VISIBLE but darkened behind the panel.
  add([
    rect(width(), height()),
    pos(0, 0),
    color(0, 0, 0),
    opacity(CONFIG.GATE.DIM_OPACITY),
    fixed(),
    z(9990),
    "challenge",
    instanceTag,
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
      instanceTag,
    ]);
  }

  // Big question expression near the top of the panel (built here — the brain dropped its
  // display field). Pure canvas text(), never a markup sink.
  //
  // `label` (no `prompt`): TWO stacked lines — a smaller label line above the full-size
  // arithmetic line below it — so a longer caller-supplied label (e.g. enemy.js's "Answer
  // to defeat the guard:") never overflows the canvas the way a single concatenated line
  // did (found + fixed this task via manual visual verification).
  if (!prompt && label) {
    add([
      text(label, { size: 22 }),
      anchor("center"),
      pos(center().x, center().y - 82),
      color(LABEL_FG[0], LABEL_FG[1], LABEL_FG[2]),
      fixed(),
      z(9992),
      "challenge",
      instanceTag,
    ]);
    add([
      text(arithmetic),
      anchor("center"),
      pos(center().x, center().y - 44),
      color(LABEL_FG[0], LABEL_FG[1], LABEL_FG[2]),
      fixed(),
      z(9992),
      "challenge",
      instanceTag,
    ]);
  } else {
    add([
      text(display),
      anchor("center"),
      pos(center().x, center().y - 60),
      color(LABEL_FG[0], LABEL_FG[1], LABEL_FG[2]),
      fixed(),
      z(9992),
      "challenge",
      instanceTag,
    ]);
  }

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
        instanceTag,
        "answer",
        { idx: i },
      ]);

      // Label: the index (1-4) plus the choice value, so the key mapping is legible.
      add([
        text(i + 1 + ") " + choice, { size: 22 }),
        anchor("center"),
        pos(bx, rowY),
        color(LABEL_FG[0], LABEL_FG[1], LABEL_FG[2]),
        fixed(),
        z(9993),
        "challenge",
        instanceTag,
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

    close(); // cancel key controllers + destroyAll(instanceTag) this session's objects

    onSuccess?.({ table: q.a }); // carry the cleared table (q.a) so the caller reacts
  }

  /**
   * Clean teardown: cancel every captured global key controller AND destroy every
   * tagged challenge object. BOTH are required — object-scoped click handlers die with their
   * boxes, but the global key controllers do not, so they must be cancelled explicitly.
   *
   * CR-01 fix: scoped to THIS instance's instanceTag, not the generic "challenge" tag, so
   * closing this challenge cannot destroy a different, still-open challenge's overlay
   * (e.g. a collect-zone session deliberately left open while the player reaches a second
   * mechanic). destroyAll("challenge") would have swept every open instance's objects.
   */
  function close() {
    keyCtrls.forEach((c) => c.cancel());
    destroyAll(instanceTag); // tag-based bulk removal scoped to THIS session only

    // 21-06 fix: restore visibility of whatever THIS instance hid on open (the
    // priorChallengeObjs snapshot captured once, closure-local, above). Runs AFTER the
    // destroyAll teardown so this instance's own objects are already gone; if the restored
    // objects belong to a still-unresolved earlier challenge (e.g. collect.js's zone), that
    // challenge's overlay reappears exactly as it was, still fully resolvable.
    for (const o of priorChallengeObjs) o.hidden = false;
  }

  return { close };
}
