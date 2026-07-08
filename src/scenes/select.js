// src/scenes/select.js — the level-select scene (Phase 14 NAV-02).
//
// Composes three proven idioms: the scene-factory shell (src/scenes/game.js:31),
// the in-scene canvas-UI draw (src/ui/hud.js:56), and the dual-input + boxes-array
// recolor pattern (src/ui/mathGate.js:108-159). It reads the level registry +
// progression FRESH on every entry (NAV-04 clean state), renders every LEVEL_ORDER
// level in three visually distinguishable states (locked/unlocked/cleared), and lets
// ONLY unlocked tiles reach go("game", { levelId }) via keyboard cursor or mouse click.
//
// ENGINE-GLOBAL DISCIPLINE (a727c13 — mirror src/ui/hud.js:8-12 / game.js:16-18):
// EVERY Kaplay primitive (add, text, rect, color, outline, rgb, pos, anchor, center,
// fixed, z, go) is referenced ONLY inside the factory body. They exist only AFTER
// kaplay() runs — a module-TOP-LEVEL reference would throw at import and blank the
// canvas. Module scope here is limited to imports only.
//
// IN-WORLD, NOT THE DOM (CLAUDE.md canon): every visual is a Kaplay canvas object
// (text()/rect()) — no markup-string sink, so no injection path. The scene NEVER reads
// browser storage directly: it goes through the guarded loadSave()->createProgress()
// seam (progress.js), which defaults forgivingly and never throws.
//
// ONE SOURCE OF TRUTH (RESEARCH Pitfall 2 / levels/index.js:5-7): unlock is DERIVED
// via isUnlocked(id, progress) — the scene NEVER computes or stores its own "unlocked"
// boolean. Cleared is read via progress.isLevelCleared(id) (strict === true).
//
// ANTI-LEAK: the cursor index is a CLOSURE-LOCAL `let`, never a module-level let. Tiles
// are tagged "select" so go() teardown wipes them. Plain nav controllers (onKeyPress /
// obj-scoped onClick) are auto-cleared by go() in Kaplay 3001 — this scene never persists
// objects across go(), and needs no manual controller cancel (RESEARCH Pattern 6).
//
// scenes/ is one directory below src/, so sibling imports use `../`.

import { CONFIG } from "../config.js";
import { LEVEL_ORDER, isUnlocked } from "../levels/index.js";
import { createProgress, loadSave } from "../progress.js";
import * as audio from "../audio.js"; // per-scene mute UI + belt-and-braces music re-assert (AUD-02/AUD-03)

// Dark-grunge palette per CLAUDE.md (NO pink). Colors read from the single source of
// truth, CONFIG.PALETTE (VIS-01; Phase 26 Plan 01):
// - CONFIG.PALETTE.REWARD: unlocked/cleared tile border + selectable outline
// - CONFIG.PALETTE.SURFACE_UNLOCKED: unlocked/cleared tile fill (dark surface)
// - CONFIG.PALETTE.MUTED: locked tile (dimmed, not selectable)
// - CONFIG.PALETTE.CLEARED: cleared tile border + check glyph (distinct from accent)
// - CONFIG.PALETTE.TEXT: tile number + heading text
// - CONFIG.PALETTE.MUTED_BORDER: IN-01 dim neutral outline for LOCKED tiles — a
//   non-selectable tile must NOT wear the accent-green "selectable" frame, or the
//   locked affordance is muddied for a 12-year-old. Distinct from the grey fill so
//   the edge still reads.
// - CONFIG.PALETTE.CURSOR: IN-02 bright white outline for the ACTIVE keyboard cursor —
//   distinguishes the focused tile by COLOR (not just width), so the cursor position is
//   unmissable on a single-tile row where a width-only change is near-invisible.

/**
 * selectScene — NAV-02. Read registry + progress fresh, render three-state tiles,
 * and route only unlocked tiles to go("game", { levelId }) via dual input.
 *
 * @param {object} [data] go() payload (unused here; kept for the factory contract).
 */
export function selectScene(data) {
  const S = CONFIG.SELECT;

  // AUD-03: re-register the M-key + mute icon fresh for this scene (mirrors the nav-key
  // re-registration pattern below) — go() clears the app-wide input bus on every scene
  // transition. AUD-02 belt-and-braces: ensureMusicPlaying() is a no-op if music is
  // already playing (the normal case, since title.js's start() already started it), and
  // only matters as a defensive fallback if this scene is ever entered directly.
  audio.wireAudioUI();
  audio.ensureMusicPlaying();

  // Shared dark-grunge backdrop (Phase 18 ART-04). Added first so it renders
  // behind tiles and heading; fixed() + low z() keeps it camera-immune.
  add([sprite("title-bg"), pos(0, 0), fixed(), z(CONFIG.TITLE_BG_Z), "select"]);

  // --- Fresh derived read every entry (NAV-04 clean state) ---
  // loadSave() is guarded (defaults under blocked/foreign storage, never throws);
  // createProgress() is a pure factory (no module-level state). Build a tile model
  // mapping LEVEL_ORDER → { id, i, state } where state is derived, never stored.
  const progress = createProgress(loadSave());
  const tiles = LEVEL_ORDER.map((id, i) => {
    const cleared = progress.isLevelCleared(id); // strict === true
    const unlocked = isUnlocked(id, progress); // DERIVED — one source of truth
    const state = cleared ? "cleared" : unlocked ? "unlocked" : "locked";
    return { id, i, state };
  });

  // Baked "NOX RUN" badge logo (BRAND-01/BRAND-03; Phase 26 Plan 07) —
  // small UI-badge size, sits just above the heading text (does not
  // replace it).
  add([
    sprite("logo-badge"),
    anchor("center"),
    pos(center().x, S.ROW_Y - S.TILE_H - 28),
    fixed(),
    z(9000),
    "select",
  ]);

  // Heading.
  add([
    text("Select a Level", { size: S.HEADING_SIZE }),
    anchor("center"),
    pos(center().x, S.ROW_Y - S.TILE_H),
    color(CONFIG.PALETTE.TEXT[0], CONFIG.PALETTE.TEXT[1], CONFIG.PALETTE.TEXT[2]),
    fixed(),
    z(9000),
    "select",
  ]);

  // --- Render one numbered tile per LEVEL_ORDER entry, three distinguishable states ---
  // Keep tile refs (the rect objects) so the keyboard cursor can recolor a highlight.
  // LOCKED = dim grey + lock glyph, NOT selectable (no click handler, skipped by cursor).
  // UNLOCKED = bright accent, selectable. CLEARED = a check/done mark.
  const tileBoxes = []; // parallel to `tiles`; holds the rect entity per tile
  tiles.forEach((t) => {
    const col = t.i % S.COLS;
    const row = Math.floor(t.i / S.COLS);
    const x = S.START_X + col * (S.TILE_W + S.GAP);
    const y = S.ROW_Y + row * (S.TILE_H + S.ROW_GAP);

    const fillColor = t.state === "locked" ? CONFIG.PALETTE.MUTED : CONFIG.PALETTE.SURFACE_UNLOCKED;

    // IN-01: locked tiles get the dim neutral border; unlocked tiles get the accent
    // green border; cleared tiles get the blue border. paintCursor() later overrides
    // ONLY the active selectable tile's outline (color + width) — locked tiles are never touched.
    const borderColor =
      t.state === "locked"
        ? CONFIG.PALETTE.MUTED_BORDER
        : t.state === "cleared"
          ? CONFIG.PALETTE.CLEARED
          : CONFIG.PALETTE.REWARD;

    const box = add([
      rect(S.TILE_W, S.TILE_H),
      area(),
      anchor("center"),
      pos(x, y),
      color(fillColor[0], fillColor[1], fillColor[2]),
      outline(2, rgb(borderColor[0], borderColor[1], borderColor[2])),
      fixed(),
      z(9000),
      "select",
      { idx: t.i, locked: t.state === "locked", restingBorder: borderColor },
    ]);
    tileBoxes.push(box);

    // Tile number label (1-based for the kid).
    add([
      text(String(t.i + 1), { size: S.LABEL_SIZE }),
      anchor("center"),
      pos(x, y),
      color(CONFIG.PALETTE.TEXT[0], CONFIG.PALETTE.TEXT[1], CONFIG.PALETTE.TEXT[2]),
      fixed(),
      z(9001),
      "select",
    ]);

    // State glyph: lock for locked, check for cleared (drawn below the number).
    const glyph = t.state === "locked" ? "X" : t.state === "cleared" ? "v" : "";
    if (glyph) {
      add([
        text(glyph, { size: S.GLYPH_SIZE }),
        anchor("center"),
        pos(x, y + S.TILE_H / 2 - S.GLYPH_SIZE),
        color(CONFIG.PALETTE.TEXT[0], CONFIG.PALETTE.TEXT[1], CONFIG.PALETTE.TEXT[2]),
        fixed(),
        z(9001),
        "select",
      ]);
    }

    // Mouse path: ONLY unlocked/cleared (i.e. unlocked) tiles get a click handler.
    // Locked tiles get NO handler and are never selectable (NAV-02). Object-scoped
    // onClick is auto-cleaned when the tile is destroyed on go() teardown.
    if (t.state !== "locked") {
      box.onClick(() => go("game", { levelId: t.id }));
    }
  });

  // --- Keyboard cursor among UNLOCKED tiles only (locked are skipped) ---
  // The list of selectable indices into `tiles`. CLOSURE-LOCAL (anti-leak: never a
  // module-level let). If nothing is selectable the cursor stays null and Enter no-ops.
  const selectable = tiles
    .filter((t) => t.state !== "locked")
    .map((t) => t.i);
  let cursor = selectable.length > 0 ? 0 : -1; // index INTO `selectable`

  // Recolor the cursor highlight (IN-02): the ACTIVE selectable tile gets a bright WHITE,
  // wider outline; every other tile is restored to its resting border (dim for locked,
  // accent for selectable). Distinguishing the cursor by COLOR — not width alone — keeps it
  // unmissable on a single-tile row. Pure recolor: no new objects (anti-leak), reuses refs.
  function paintCursor() {
    tileBoxes.forEach((box, i) => {
      const isActive = cursor >= 0 && selectable[cursor] === i;
      // Resting border per state (IN-01): locked stays dim, unlocked stays accent,
      // cleared stays blue. Use the border stored at creation so cleared tiles keep
      // their blue border when the cursor moves elsewhere.
      const border = isActive ? CONFIG.PALETTE.CURSOR : box.restingBorder;
      box.outline.width = isActive ? 5 : 2;
      box.outline.color = rgb(border[0], border[1], border[2]);
    });
  }
  paintCursor();

  // Left/Right (moveCursor): row-scoped wrap. Only the subset of `selectable`
  // cursor-indices whose tile falls in the SAME row as the current tile is eligible —
  // wrapping the whole flat `selectable` list (the old single-row behavior) would let
  // Left/Right spill into an adjacent row, which CONTEXT.md's locked semantics forbid.
  function moveCursor(delta) {
    if (selectable.length === 0) return;
    const currentRow = Math.floor(selectable[cursor] / S.COLS);
    const rowCursorIdxs = selectable
      .map((_, ci) => ci)
      .filter((ci) => Math.floor(selectable[ci] / S.COLS) === currentRow);
    const posInRow = rowCursorIdxs.indexOf(cursor);
    const nextPos =
      (posInRow + delta + rowCursorIdxs.length) % rowCursorIdxs.length;
    cursor = rowCursorIdxs[nextPos];
    paintCursor();
  }

  // Up/Down (moveCursorRow): jump between rows WITHOUT wrapping past the top/bottom
  // edge (no-op if the target row has no selectable tile at all). Lands on the same
  // column in the target row if selectable there, else the nearest selectable column.
  function moveCursorRow(delta) {
    if (selectable.length === 0) return;
    const currentRow = Math.floor(selectable[cursor] / S.COLS);
    const currentCol = selectable[cursor] % S.COLS;
    const targetRow = currentRow + delta;

    const targetRowCursorIdxs = selectable
      .map((_, ci) => ci)
      .filter((ci) => Math.floor(selectable[ci] / S.COLS) === targetRow);
    if (targetRowCursorIdxs.length === 0) return; // no cross-edge wrap — no-op

    const sameColCi = targetRowCursorIdxs.find(
      (ci) => selectable[ci] % S.COLS === currentCol,
    );
    if (sameColCi !== undefined) {
      cursor = sameColCi;
    } else {
      // Nearest selectable column in the target row (smallest |col - currentCol|).
      let best = targetRowCursorIdxs[0];
      let bestDist = Math.abs((selectable[best] % S.COLS) - currentCol);
      for (const ci of targetRowCursorIdxs) {
        const dist = Math.abs((selectable[ci] % S.COLS) - currentCol);
        if (dist < bestDist) {
          best = ci;
          bestDist = dist;
        }
      }
      cursor = best;
    }
    paintCursor();
  }

  function playCursor() {
    if (cursor < 0) return; // nothing selectable
    const levelId = tiles[selectable[cursor]].id;
    go("game", { levelId }); // the ONLY cross-scene handoff
  }

  // Dual-input nav controllers, registered INSIDE the body so go() tears them down.
  // Plain app-bus nav controllers are auto-cleared by go() in Kaplay 3001 (Pattern 6).
  onKeyPress("left", () => moveCursor(-1));
  onKeyPress("right", () => moveCursor(+1));
  onKeyPress("up", () => moveCursorRow(-1));
  onKeyPress("down", () => moveCursorRow(+1));
  onKeyPress("enter", () => playCursor());
}
