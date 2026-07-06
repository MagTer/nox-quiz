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
 *   isLevelCleared: (id: string) => boolean,
 *   markCleared: (id: string) => void,
 *   serialize: (brainSnapshot?: { accuracy?: object, history?: object }) =>
 *     { version: number, xp: number, level: number, accuracy: object, history: object, levels: object }
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
  // `level` gets the SAME finite+sane guard as `xp` above: a corrupt save like
  // {"version":1,"level":1e400} parses level to Infinity, and Infinity >= 1 +
  // Math.floor(Infinity) === Infinity would slip through a bare >= 1 check and
  // permanently brick progression (the addXp while-loop's xp >= threshold(Infinity)
  // is never true). Number.isFinite rejects Infinity/NaN; >= 1 keeps it sane; the
  // floor preserves the archive's "level a number, floored" tolerance.
  let level =
    saved &&
    typeof saved.level === "number" &&
    Number.isFinite(saved.level) &&
    saved.level >= 1
      ? Math.floor(saved.level)
      : 1;

  // Per-game closure-local cleared FACTS (SAVE-06). Seeded from saved.levels with the SAME
  // strict `rec.cleared === true` coercion validate() uses, so a non-boolean flag seeds NOT-
  // cleared. We read own keys via Object.keys (never the prototype) and write plain own keys
  // here, so a __proto__/junk id in the blob can never pollute Object.prototype. This map owns
  // ONLY the cleared facts — derived unlock (isUnlocked) lives in the registry (Plan 03), which
  // owns LEVEL_ORDER; progress.js imports no registry/engine (firewall).
  const cleared = {};
  if (saved && saved.levels && typeof saved.levels === "object") {
    for (const id of Object.keys(saved.levels)) {
      const rec = saved.levels[id];
      if (rec != null && rec.cleared === true) cleared[id] = true;
    }
  }

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

    // Per-level cleared FACTS (SAVE-06). isLevelCleared reads the closure map with strict
    // `=== true`; markCleared records a level as cleared. These own facts only — derived unlock
    // (isUnlocked) lives in the registry (Plan 03); do NOT import LEVEL_ORDER or the engine here.
    isLevelCleared(id) {
      return cleared[id] === true;
    },
    markCleared(id) {
      cleared[id] = true;
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

    // Award a FLAT, non-table-scaled XP amount (LVL-06's secret-alcove bonus). This
    // exists because calculateXp(table) can only ever yield XP_EASY/XP_HARD (10/20) —
    // there is no `table` value that produces an arbitrary flat amount like the
    // alcove's 5, so a genuine sibling method is required rather than a call-site
    // reuse or a fabricated table hack. Reuses the IDENTICAL carry-over while-loop
    // body as addXp (xp -= threshold, level += 1, never reset to 0) — seeded from a
    // raw `amount` instead of a table lookup.
    addBonusXp(amount) {
      xp += amount;
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
      // Build the persistable per-level map from the closure cleared FACTS: ONLY { cleared: true }
      // entries, never an `unlocked` flag (one source of truth — unlock is derived in the registry).
      const levels = {};
      for (const id of Object.keys(cleared)) levels[id] = { cleared: true };
      return {
        version: CONFIG.SAVE.VERSION,
        xp,
        level,
        accuracy: brainSnapshot?.accuracy ?? {},
        history: brainSnapshot?.history ?? {},
        levels,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Guarded localStorage seam (Task 2)
//
// localStorage lives ONLY here — never at module top level and never inside
// createProgress (that is what keeps createProgress pure / node-importable).
// All three functions are DEFINED, not called, at import time, so importing
// this module under node (no localStorage) touches no storage API.
//
// NO migration: this layer reads/writes ONLY CONFIG.SAVE.KEY (the v2 clean-reset key) —
// CONFIG.SAVE.KEY is the single source of truth, never a hardcoded literal here.
// The school game's mathlab_save_v1/v2 keys are NEVER touched (CONTEXT lines 35-36).
// ---------------------------------------------------------------------------

// The fresh-save shape — what createProgress and createBrain seed from when there is
// no (or a rejected) save. Returned by loadSave() on every failure mode below.
function defaults() {
  return { xp: 0, level: 1, accuracy: {}, history: {}, levels: {} };
}

// Explicit-field validation of an untrusted parsed blob (archive fromJSON 718-743).
// SECURITY: copies ONLY named, range-checked keys — NEVER Object.assign(target, data)
// or {...data} (prototype-pollution mitigation T-01-01). JSON coerces numeric object
// keys to strings, so accuracy/history keys are parseInt'd back. accuracy clamped to
// table 1..9 + value 0..1; history filtered to booleans and clamped to the mastery window.
function validate(data) {
  const out = defaults();
  if (!data || typeof data !== "object") return out;

  out.xp =
    typeof data.xp === "number" && isFinite(data.xp) && data.xp >= 0
      ? data.xp
      : 0;
  // Same finite+sane guard as createProgress: reject Infinity/NaN (a corrupt
  // {"level":1e400} parses to Infinity, which would otherwise pass >= 1 and brick
  // progression). Number.isFinite closes the freeze; >= 1 + floor keep it sane.
  out.level =
    typeof data.level === "number" && Number.isFinite(data.level) && data.level >= 1
      ? Math.floor(data.level)
      : 1;

  if (data.accuracy && typeof data.accuracy === "object") {
    Object.entries(data.accuracy).forEach(([k, v]) => {
      const table = parseInt(k, 10);
      if (table >= 1 && table <= 9 && typeof v === "number" && v >= 0 && v <= 1) {
        out.accuracy[table] = v;
      }
    });
  }

  if (data.history && typeof data.history === "object") {
    Object.entries(data.history).forEach(([k, v]) => {
      const table = parseInt(k, 10);
      if (table >= 1 && table <= 9 && Array.isArray(v)) {
        out.history[table] = v
          .filter((x) => typeof x === "boolean")
          .slice(-CONFIG.BRAIN.MASTERY_WINDOW);
      }
    });
  }

  // Per-level cleared map (SAVE-06). Mirrors the named-key, range-checked accuracy idiom
  // above: copy ONLY into the fresh `out.levels` (from defaults()), never spread/Object.assign
  // the untrusted blob (prototype-pollution mitigation T-13-03 / T-01-01). Each cleared flag is
  // STRICTLY coerced with `=== true` — a "yes"/1/non-boolean validates to NOT-cleared. Unknown
  // / junk ids (including __proto__) are tolerated and written as plain own keys on `out.levels`;
  // a junk id can never unlock a real level because unlock is derived from LEVEL_ORDER in the
  // registry, never from this map. We store ONLY `cleared`, never `unlocked`.
  if (data.levels && typeof data.levels === "object") {
    Object.entries(data.levels).forEach(([id, rec]) => {
      out.levels[id] = { cleared: rec != null && rec.cleared === true };
    });
  }

  return out;
}

// Storage probe — node has no localStorage, and accessing it can THROW in sandboxed
// iframes / disabled-cookie modes, so the access itself is wrapped in try-catch
// (RESEARCH Pattern 2, failure mode 1). Returns a boolean; never throws.
function storageAvailable() {
  try {
    return typeof localStorage !== "undefined" && localStorage !== null;
  } catch {
    return false;
  }
}

/**
 * Load and validate the platformer save. Forgiving by mandate: every failure mode
 * (no storage, missing key, corrupt JSON, version mismatch, throwing getItem) returns
 * defaults() and NEVER throws into the caller. NO migration — a version mismatch is a
 * fresh start, the old blob is ignored.
 *
 * @returns {{ xp: number, level: number, accuracy: object, history: object, levels: object }}
 */
export function loadSave() {
  if (!storageAvailable()) return defaults();
  try {
    const raw = localStorage.getItem(CONFIG.SAVE.KEY);
    if (raw === null) return defaults();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.warn("[MathLab] Save data corrupt — using defaults");
      return defaults();
    }

    if (!data || data.version !== CONFIG.SAVE.VERSION) {
      console.warn("[MathLab] Save version mismatch — using defaults");
      return defaults(); // NO migration from the school game's save
    }

    return validate(data);
  } catch (e) {
    console.warn("[MathLab] Load failed:", e);
    return defaults();
  }
}

/**
 * Persist a serialized blob (from createProgress().serialize()). Forgiving: a missing/
 * blocked storage is a silent no-op, and a full quota or any other setItem failure is
 * caught + warned, NEVER rethrown — the game loop must not crash on a failed save
 * (archive 888-901, RESEARCH Pattern 2 failure mode 3).
 *
 * @param {object} blob - the { version, xp, level, accuracy, history, levels } save object.
 */
export function writeSave(blob) {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(CONFIG.SAVE.KEY, JSON.stringify(blob));
  } catch (e) {
    if (e?.name === "QuotaExceededError") {
      console.warn("[MathLab] localStorage full — progress may not save");
    } else {
      console.warn("[MathLab] Save failed:", e);
    }
  }
}
