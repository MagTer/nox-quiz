// src/progress.js — the pure progression module: XP/level math + a guarded save seam.
//
// Single responsibility: own the validated v1/v2 XP-per-table amounts and the
// level-threshold curve, plus serialize/deserialize and the localStorage persistence
// seam. Ported VERBATIM from archive/math-lab.html — XpCalculator (648-657), the
// PlayerState XP/level closure (663-687), the explicit-field validation (713-743), and
// the PersistenceStore load/save (844-903). The XP amounts (10/20) and the curve
// (round(BASE_XP * MULT^(L-1))) are the validated values and MUST NOT be re-tuned.
//
// FIREWALL (firewall #2): this module imports NOTHING from the game engine — only
// ./config.js's leaf constants (CONFIG.PROGRESS.* / CONFIG.SAVE.* / CONFIG.BRAIN.*).
// It is headlessly importable and runnable in plain node, which has NO localStorage.
// This file lives at src/ (NOT src/math/), so the sibling config import is `./config.js`
// (ONE dot), unlike brain.js's `../config.js`.
//
// PURE-FACTORY / ANTI-LEAK: createProgress() is a FACTORY returning a fresh closure with
// its OWN xp/level — NOT the archive's module-level IIFE singleton. Crucially it is PURE:
// it takes a `saved` object and NEVER reads localStorage at construction, so the node
// smoke can exercise the XP/level math with no browser (RESEARCH Pitfall 1). There is
// intentionally no module-level mutable `let xp`/`let level`.
//
// SAVE SEAM: localStorage lives ONLY behind the guarded storageAvailable()/loadSave()/
// writeSave() functions (Task 2) — never at module top level and never in createProgress.
// Those functions are defined-not-called at import time, so importing this module under
// node touches no storage API and cannot throw.
//
// DROPPED (firewall keeps these out / out of scope): any Kaplay/engine import, the school
// game's v1→v2 migration (CONTEXT: NO migration; mathlab_save_* is NEVER read/written),
// and any run/session state (coins, goalReached) in serialize — only xp/level/accuracy/
// history persist.

import { CONFIG } from "./config.js"; // leaf constants — CONFIG.PROGRESS / SAVE / BRAIN

/**
 * Construct a fresh, independent progression tracker for one game session.
 *
 * PURE: never reads localStorage. `saved` is an already-loaded plain object (e.g. from
 * loadSave()) or undefined; its fields are validated and copied explicitly (no spread of
 * the untrusted blob — prototype-pollution mitigation).
 *
 * @param {{ xp?: number, level?: number }} [saved] - validated seed (xp >= 0, level >= 1).
 * @returns {{
 *   xp: number, level: number,
 *   getXp: () => number, getLevel: () => number,
 *   threshold: (lvl: number) => number,
 *   nextThreshold: () => number,
 *   addXp: (table: number) => boolean,
 *   serialize: (brainSnapshot?: { accuracy?: object, history?: object }) => object
 * }}
 *   addXp(table) returns true exactly when a level-up occurred. The `xp`/`level`
 *   properties are live getters mirroring getXp()/getLevel() (the headless smoke reads
 *   both forms).
 */
export function createProgress(saved) {
  // Per-game closure state — seeded from `saved` with the same guards as the archive's
  // fromJSON (723-725): xp must be a non-negative number else 0; level a number >= 1,
  // floored, else 1. Garbage / missing fields fall back to the defaults silently.
  let xp =
    saved && typeof saved.xp === "number" && isFinite(saved.xp) && saved.xp >= 0
      ? saved.xp
      : 0;
  let level =
    saved && typeof saved.level === "number" && saved.level >= 1
      ? Math.floor(saved.level)
      : 1;

  // Level-up threshold curve — VERBATIM from archive 651 (read CONFIG.PROGRESS.* here,
  // not the archive's bare CONFIG.*). threshold(1) = round(200 * 1.3^0) = 200;
  // threshold(2) = round(200 * 1.3^1) = round(260) = 260.
  const threshold = (lvl) =>
    Math.round(
      CONFIG.PROGRESS.BASE_XP * Math.pow(CONFIG.PROGRESS.LEVEL_MULT, lvl - 1),
    );

  // Per-table XP amount — VERBATIM from archive 653. Hard tables (6–9) award XP_HARD (20),
  // everything else XP_EASY (10).
  const calculateXp = (table) =>
    CONFIG.PROGRESS.HARD_TABLES.includes(table)
      ? CONFIG.PROGRESS.XP_HARD
      : CONFIG.PROGRESS.XP_EASY;

  return {
    // Live getters — mirror getXp()/getLevel() so the headless smoke can read p.xp/p.level
    // directly as well as via the explicit getters used in the plan's behaviour spec.
    get xp() {
      return xp;
    },
    get level() {
      return level;
    },

    getXp() {
      return xp;
    },
    getLevel() {
      return level;
    },

    threshold,
    nextThreshold: () => threshold(level),

    // Award XP for answering `table` correctly and detect a level-up with surplus
    // carry-over (archive 678-687). The while-loop (RESEARCH Pattern 1) is the defensive
    // form of the archive's single `if`: it carries surplus across multiple levels in one
    // award. `xp -= threshold` (NOT xp = 0) is deliberate — resetting to 0 feels punishing
    // (archive 682 comment). Returns whether a level-up happened.
    addXp(table) {
      xp += calculateXp(table);
      let leveledUp = false;
      while (xp >= threshold(level)) {
        xp -= threshold(level); // carry surplus over, never reset to 0
        level += 1;
        leveledUp = true;
      }
      return leveledUp;
    },

    // Build the persistable blob (archive toJSON 713-716 shape + version). Persists ONLY
    // xp/level/accuracy/history — NEVER run/session state (no coins/goalReached). The
    // brain's accuracy/history come from brain.snapshot(); a missing snapshot defaults
    // them to empty objects so serialize() never throws on a null brain.
    serialize(brainSnapshot) {
      return {
        version: CONFIG.SAVE.VERSION,
        xp,
        level,
        accuracy: brainSnapshot?.accuracy ?? {},
        history: brainSnapshot?.history ?? {},
      };
    },
  };
}
