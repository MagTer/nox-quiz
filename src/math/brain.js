// src/math/brain.js — the pure, engine-agnostic math brain.
//
// Single responsibility: the validated, tuned weighted question selector (biased
// toward the 6–9 tables) plus the in-memory EWMA accuracy/struggle weighting.
// Ported VERBATIM from archive/math-lab.html — the EWMA slice of PlayerState
// (663-711) and the entire QuestionSelector (911-1030). The selection math is
// locked: the (1-acc)^1.5 / ^0.8 exponents, the 0.3 factors, and the 1.5 struggle
// boost are already validated and MUST NOT be re-tuned (REQUIREMENTS Out of Scope).
//
// FIREWALL (GATE-06): this module imports NOTHING from the game engine — only
// ./config.js's leaf constants (CONFIG.BRAIN.*). It is headlessly importable and
// runnable in plain node. This file lives in src/math/, one dir below src/, so the
// sibling config import is `../config.js` (NOT `./`).
//
// ANTI-LEAK: the brain is exposed as a createBrain() FACTORY, NOT the archive's
// module-level IIFE singleton. Each call returns a fresh closure with its OWN
// accuracy/history state, so adaptation from a prior playthrough cannot bleed into
// a new game (RESEARCH Pitfall 2 / CONTEXT "state must not leak across replays").
// There is intentionally no module-level mutable `let accuracy`/`let history`.
//
// PERSISTENCE (Phase 11): browser storage is STILL OUT of the brain — it reads NO save API
// and imports NO engine. The loader (src/progress.js + the scene) owns the save: on entry
// it injects validated saved values via createBrain({ seedAccuracy, seedHistory }), and on
// each clear/tab-hide it serializes the brain's state via snapshot(). snapshot() is the
// single ONE-WAY export the loader persists; the brain never reaches back into the store.
//
// DROPPED (firewall keeps these out): the experience/leveling math, the browser-storage
// persistence layer itself, the HP/encounter/consumable subsystem, and the game state
// machine. None of those concerns appear in this module, and the firewall greps confirm
// their identifier tokens are absent here.

import { CONFIG } from "../config.js"; // leaf constants only — CONFIG.BRAIN namespace

/**
 * Construct a fresh, independent math brain for one game session.
 *
 * The brain is PURE: it reads NO storage. Saved per-table accuracy/history are INJECTED by
 * the loader via the optional seed object so a returning session resumes both the weak-spot
 * weighting (seedAccuracy → SAVE-03) AND the mastery drill-reduction (seedHistory → isMastered
 * resumes). With no args (or `{}`) the brain starts fresh — the gate's fallback caller relies
 * on this. Seeds are validated with the archive's fromJSON rules; garbage is silently ignored.
 *
 * @param {object} [seed]
 * @param {Object<number, number>} [seed.seedAccuracy]
 *   Per-table EWMA accuracy to resume; only keys 1..9 with numeric values in 0..1 are applied.
 * @param {Object<number, boolean[]>} [seed.seedHistory]
 *   Per-table answer history (booleans) to resume; non-arrays/non-booleans are filtered and
 *   each window is clamped to the last MASTERY_WINDOW entries.
 * @returns {{
 *   nextQuestion: () => { a: number, b: number, answer: number, choices: number[] },
 *   reportResult: (table: number, isCorrect: boolean) => void,
 *   snapshot: () => { accuracy: Object<number, number>, history: Object<number, boolean[]> }
 * }}
 *   nextQuestion() yields a 6–9-biased question: `a`=table (1..9), `b`=multiplicand
 *   (1..10), `answer`=a*b, and `choices` is a 4-element shuffled array containing the
 *   answer plus 3 distinct plausible distractors. reportResult() updates this brain's
 *   in-memory EWMA accuracy weighting. snapshot() returns shallow copies of accuracy/history
 *   for the loader to persist (one-way export — the brain never reads storage).
 */
export function createBrain({ seedAccuracy, seedHistory, allowedTables } = {}) {
  // --- allowedTables sanitation (defensive seam, mirrors the seedAccuracy/seedHistory guards).
  // allowedTables is the documented Phase 16 difficulty seam: today it comes from a trusted level
  // descriptor, but a typo'd or future data-driven value must NOT silently generate out-of-range
  // questions (e.g. `100 × 7`). Filter to in-range integer tables (1..9); an empty/invalid pool
  // falls back to the default (all-9) behaviour by leaving `allowedSet` null. Computed ONCE here so
  // calculateWeights/weightedRandom share the same validated pool (no per-call rebuild). This is
  // input validation only — the LOCKED weighting formulas / CONFIG.BRAIN values are untouched.
  const validTables = Array.isArray(allowedTables)
    ? allowedTables.filter((t) => Number.isInteger(t) && t >= 1 && t <= 9)
    : [];
  const allowedSet = validTables.length ? new Set(validTables) : null;

  // Per-game closure state — fresh per createBrain() call (anti-leak contract).
  // EWMA per table; hard tables start lower → higher initial selection weight (archive 667-668).
  const accuracy = {
    1: 0.5,
    2: 0.5,
    3: 0.5,
    4: 0.5,
    5: 0.5,
    6: 0.4,
    7: 0.4,
    8: 0.4,
    9: 0.4,
  };
  // Sliding window: last N answers per table for the mastery check (archive 670).
  const history = {}; // { table: [true, false, ...] }

  // --- Seed injection (Phase 11): the loader injects validated saved state so a returning
  // session resumes weak-spot weighting (accuracy) AND mastery drill-reduction (history).
  // The brain reads NO storage — these are plain objects already loaded by src/progress.js.
  // Validation mirrors the archive's fromJSON (math-lab.html 726-743): explicit per-key,
  // range-checked copy — NEVER Object.assign/spread of the untrusted blob (T-01-01).
  if (seedAccuracy && typeof seedAccuracy === "object") {
    for (const [key, value] of Object.entries(seedAccuracy)) {
      const t = parseInt(key, 10);
      if (t >= 1 && t <= 9 && typeof value === "number" && value >= 0 && value <= 1) {
        accuracy[t] = value;
      }
    }
  }
  if (seedHistory && typeof seedHistory === "object") {
    for (const [key, value] of Object.entries(seedHistory)) {
      const t = parseInt(key, 10);
      if (t >= 1 && t <= 9 && Array.isArray(value)) {
        history[t] = value
          .filter((x) => typeof x === "boolean")
          .slice(-CONFIG.BRAIN.MASTERY_WINDOW);
      }
    }
  }

  // Fisher-Yates uniform shuffle — not sort(random) which is biased (archive 915-921).
  // In-place, returns shuffled array.
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Closure accuracy reader (archive 702-704).
  const getAccuracy = (table) =>
    accuracy[table] !== undefined ? accuracy[table] : 0.5;

  // Mastery: 80%+ correct over the last MASTERY_WINDOW answers for this table (archive 707-711).
  const isMastered = (table) => {
    const h = history[table] || [];
    if (h.length < CONFIG.BRAIN.MASTERY_WINDOW) return false;
    return (
      h.filter(Boolean).length / h.length >= CONFIG.BRAIN.MASTERY_THRESHOLD
    );
  };

  // Build weight map for all 9 tables driven by this brain's accuracy (archive 927-956).
  // Hard tables: base weight (1 - acc)^1.5, boosted if struggling, reduced if mastered.
  // Easy tables: base weight (1 - acc)^0.8 * 0.3 so they average ~30% total selection.
  // Edge case: if total weight rounds to zero (all mastered), reset to equal weights.
  const calculateWeights = () => {
    const weights = {};
    const allowed = allowedSet; // validated pool computed once in the factory (null = all 9)

    CONFIG.BRAIN.HARD_TABLES.forEach((table) => {
      if (allowed && !allowed.has(table)) return;
      const acc = getAccuracy(table);
      let w = Math.pow(1 - acc, 1.5);
      if (acc < CONFIG.BRAIN.STRUGGLE_THRESHOLD) w *= CONFIG.BRAIN.STRUGGLE_BOOST;
      if (isMastered(table)) w *= 0.3;
      weights[table] = w;
    });

    CONFIG.BRAIN.EASY_TABLES.forEach((table) => {
      if (allowed && !allowed.has(table)) return;
      const acc = getAccuracy(table);
      let w = Math.pow(1 - acc, 0.8) * 0.3;
      if (isMastered(table)) w *= 0.3;
      weights[table] = w;
    });

    // Guard: if all weights are ~zero (all tables mastered or pool empty), reset to equal.
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    if (total < 1e-9) {
      const fallbackTables = allowed
        ? [...allowed]
        : [...CONFIG.BRAIN.HARD_TABLES, ...CONFIG.BRAIN.EASY_TABLES];
      fallbackTables.forEach((t) => {
        weights[t] = 1.0;
      });
    }

    return weights;
  };

  // Weighted random table selection from weights map (archive 960-969).
  // Rolls a random number in [0, total) and walks the weights.
  const weightedRandom = (weights) => {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = Math.random() * total;
    for (const [table, w] of entries) {
      roll -= w;
      if (roll <= 0) return parseInt(table, 10);
    }
    // Fallback (floating-point rounding edge): return the FIRST table present in the weight
    // map. The map is already restricted to the validated allowed pool by calculateWeights, so
    // this respects the difficulty seam — never leaks a disallowed table (e.g. hard table 6 when
    // a pool excludes it). The CONFIG default is a last resort only if the map is somehow empty.
    return entries.length ? parseInt(entries[0][0], 10) : CONFIG.BRAIN.HARD_TABLES[0];
  };

  // Distractor generation: ±1/±2 multiplicand on same table (archive 975-1009).
  // Adds one wrong-table distractor (from a different hard table) for variety.
  // Deduplicates: all candidates filtered v !== answer && v > 0.
  // Returns exactly 3 distractors — pads if necessary, never returns duplicates.
  const generateDistractors = (answer, table, multiplicand) => {
    const pool = new Set();

    // Primary candidates: ±1 and ±2 multiplicand on the same table.
    [-2, -1, 1, 2].forEach((d) => {
      const v = table * (multiplicand + d);
      if (v > 0 && v !== answer) pool.add(v);
    });

    // One wrong-table distractor (pick first hard table that isn't current).
    const wrongTable =
      CONFIG.BRAIN.HARD_TABLES.find((t) => t !== table) ||
      CONFIG.BRAIN.EASY_TABLES[0];
    const wrongVal = wrongTable * multiplicand;
    if (wrongVal > 0 && wrongVal !== answer) pool.add(wrongVal);

    // Extend if still under 3: try ±3 offsets on same table.
    if (pool.size < 3) {
      [-3, 3].forEach((d) => {
        const v = table * (multiplicand + d);
        if (v > 0 && v !== answer) pool.add(v);
      });
    }

    // Fisher-Yates shuffle the pool, pick first 3.
    const poolArr = shuffle([...pool]);
    const chosen = poolArr.slice(0, 3);

    // Last-resort pad (should be unreachable for multiplicand 1–10 range).
    while (chosen.length < 3) {
      let pad = answer + chosen.length + 1;
      while (pad === answer || chosen.includes(pad)) pad++;
      chosen.push(pad);
    }

    return chosen;
  };

  return {
    // Full weighted selection (archive selectNext 1014-1028), reading this brain's
    // closure accuracy/history. When createBrain was given a per-level `allowedTables`
    // pool it now flows through here so selection is restricted to that pool; when it is
    // undefined the call is byte-identical to before — all 9 tables in play, biased to
    // 6–9 per GATE-02 (Phase 13 wiring only; the weighting formulas are LOCKED and the
    // pool is NOT yet enforced as a difficulty gate — that lands in Phase 16). Return
    // shape: { a, b, answer, choices } (a=table, b=multiplicand, choices=already-shuffled
    // options including the answer). The archive's `question:` display string is
    // intentionally dropped — the gate (Plan 02) builds its own display string from a/b.
    nextQuestion() {
      const weights = calculateWeights();
      const table = weightedRandom(weights);
      const multiplicand = Math.floor(Math.random() * 9) + 1;
      const answer = table * multiplicand;
      const distractors = generateDistractors(answer, table, multiplicand);
      const choices = shuffle([answer, ...distractors]);
      return { a: table, b: multiplicand, answer, choices };
    },

    // EWMA: recent answers weighted more (archive updateAccuracy 690-700).
    // Mutates this brain's closure accuracy/history only.
    reportResult(table, isCorrect) {
      const prev = accuracy[table] !== undefined ? accuracy[table] : 0.5;
      accuracy[table] =
        prev * (1 - CONFIG.BRAIN.ACCURACY_ALPHA) +
        (isCorrect ? 1 : 0) * CONFIG.BRAIN.ACCURACY_ALPHA;
      // Update sliding window for the mastery check.
      if (!history[table]) history[table] = [];
      history[table].push(isCorrect);
      if (history[table].length > CONFIG.BRAIN.MASTERY_WINDOW) {
        history[table].shift();
      }
    },

    // One-way persistence export (Phase 11): return shallow copies of this brain's
    // accuracy/history so the loader (src/progress.js serialize) can write them to the
    // save. Copies, not the live references — mutating the returned object must NOT touch
    // the brain's internal state (firewall stays one-way; the brain reads NO storage).
    snapshot() {
      const historyCopy = {};
      for (const [table, h] of Object.entries(history)) {
        historyCopy[table] = h.slice();
      }
      return {
        accuracy: { ...accuracy },
        history: historyCopy,
      };
    },
  };
}
