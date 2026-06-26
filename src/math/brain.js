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
// DROPPED (Phase 11 / never — firewall keeps these out): the experience/leveling
// math, the save/load persistence layer, the HP/encounter/consumable subsystem, and
// the game state machine. None of those concerns appear in this module, and the
// firewall greps confirm their identifier tokens are absent here.

import { CONFIG } from "../config.js"; // leaf constants only — CONFIG.BRAIN namespace

/**
 * Construct a fresh, independent math brain for one game session.
 *
 * @returns {{
 *   nextQuestion: () => { a: number, b: number, answer: number, choices: number[] },
 *   reportResult: (table: number, isCorrect: boolean) => void
 * }}
 *   nextQuestion() yields a 6–9-biased question: `a`=table (1..9), `b`=multiplicand
 *   (1..10), `answer`=a*b, and `choices` is a 4-element shuffled array containing the
 *   answer plus 3 distinct plausible distractors. reportResult() updates this brain's
 *   in-memory EWMA accuracy weighting (in-memory only this phase; persistence is Phase 11).
 */
export function createBrain() {
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
  const calculateWeights = (allowedTables) => {
    const weights = {};
    const allowed = allowedTables ? new Set(allowedTables) : null;

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
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (const [table, w] of Object.entries(weights)) {
      roll -= w;
      if (roll <= 0) return parseInt(table, 10);
    }
    // Fallback (floating point rounding edge): return first hard table.
    return CONFIG.BRAIN.HARD_TABLES[0];
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
    // closure accuracy/history. allowedTables is left undefined so all 9 tables are
    // in play, biased to 6–9 per GATE-02. Return shape: { a, b, answer, choices }
    // (a=table, b=multiplicand, choices=already-shuffled options including the answer).
    // The archive's `question:` display string is intentionally dropped — the gate
    // (Plan 02) builds its own display string from a/b.
    nextQuestion() {
      const weights = calculateWeights(undefined);
      const table = weightedRandom(weights);
      const multiplicand = Math.floor(Math.random() * 10) + 1;
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
  };
}
