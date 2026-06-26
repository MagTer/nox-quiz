#!/usr/bin/env node
// scripts/smoke-progress.mjs — headless node smoke of the PURE progression + brain math.
//
// The project has NO JS test framework (no-build / no-dep canon). This plain ES module IS
// the automated unit layer for the node-testable seams: the XP/level curve, the serialize
// round-trip, the history (mastery) round-trip, and the statistical weak-spot-resume check.
//
// It imports the REAL modules directly (../src/progress.js, ../src/math/brain.js) — both are
// engine-agnostic and node-safe by the firewall. node has no browser storage API, so this
// harness NEVER touches storage: it calls createProgress(fixture) directly (RESEARCH Pitfall 1)
// and
// only exercises the pure math / seed paths. The browser-only persistence seam is verified by
// the structural greps in check-progress.sh, not here.
//
// Run from the repo root:  node scripts/smoke-progress.mjs
//
// EXPECTED until Wave 1–2 land: the `import` of ../src/progress.js throws (module does not
// exist yet), so this exits non-zero — a real harness, not a no-op. It turns green once
// src/progress.js (createProgress/serialize) and the extended brain (snapshot/seedAccuracy/
// seedHistory) exist.

import { createProgress } from "../src/progress.js";
import { createBrain } from "../src/math/brain.js";
import { CONFIG } from "../src/config.js";

let failures = 0;
// console.assert does not increment exit codes; track failures ourselves.
const check = (cond, msg) => {
  console.assert(cond, msg);
  if (!cond) failures++;
};

// --- SAVE-01: level thresholds = round(BASE_XP * LEVEL_MULT^(L-1)) ---
{
  const p = createProgress();
  check(p.threshold(1) === 200, `threshold(1) should be 200, got ${p.threshold(1)}`);
  // round(200 * 1.3) = round(260) = 260
  check(p.threshold(2) === 260, `threshold(2) should be 260, got ${p.threshold(2)}`);
}

// --- SAVE-01: calculateXp via addXp — HARD=20, EASY=10, level-up surplus carries over ---
{
  const p = createProgress();
  const before = p.xp;
  const hardLeveled = p.addXp(7); // table 7 → +20, 20 < 200 so no level-up
  check(p.xp === before + 20, `addXp(7) should add 20 XP, xp now ${p.xp}`);
  check(hardLeveled === false, `addXp(7) should return false (20 < 200), got ${hardLeveled}`);

  const easyBefore = p.xp;
  p.addXp(3); // table 3 → +10
  check(p.xp === easyBefore + 10, `addXp(3) should add 10 XP, xp now ${p.xp}`);
}

// --- SAVE-01: drive XP across a threshold, assert level-up + surplus carry-over (NOT reset to 0) ---
{
  const p = createProgress();
  // threshold(1) = 200; each hard answer = 20. 10 hard answers = exactly 200 → crosses on the 10th.
  let crossedOn = -1;
  for (let i = 1; i <= 10; i++) {
    const leveled = p.addXp(7);
    if (leveled && crossedOn === -1) crossedOn = i;
  }
  check(crossedOn === 10, `level-up should occur exactly on the 10th hard answer (200 XP), got ${crossedOn}`);
  check(p.level === 2, `level should be 2 after crossing threshold(1), got ${p.level}`);
  // Surplus: 10*20 = 200, threshold 200 → surplus 0 carried (NOT a magic reset; the curve is exact here).
  check(p.xp === 0, `surplus after an exact crossing should be 0, got ${p.xp}`);

  // Now prove carry-over with an overshoot: fresh progress, overshoot the threshold by 20.
  const q = createProgress();
  for (let i = 0; i < 11; i++) q.addXp(7); // 11*20 = 220 → crosses 200, surplus 20
  check(q.level === 2, `overshoot: level should be 2, got ${q.level}`);
  check(q.xp === 20, `overshoot surplus should carry over to 20 (NOT 0), got ${q.xp}`);
}

// --- SAVE-02: serialize round-trip — xp/level/accuracy survive + a version field is present ---
{
  const brain = createBrain();
  const p = createProgress();
  p.addXp(7);
  p.addXp(3);
  brain.reportResult(7, true);
  brain.reportResult(7, false);
  brain.reportResult(8, true);

  const blob = p.serialize(brain.snapshot());
  check(blob.version === CONFIG.SAVE.VERSION, `serialized blob.version should equal CONFIG.SAVE.VERSION (${CONFIG.SAVE.VERSION}), got ${blob.version}`);

  const restored = createProgress(blob);
  check(restored.xp === p.xp, `restored xp should match (${p.xp}), got ${restored.xp}`);
  check(restored.level === p.level, `restored level should match (${p.level}), got ${restored.level}`);

  // Accuracy keys round-trip (JSON stringifies numeric keys to strings — tolerate both).
  const snap = brain.snapshot();
  check(snap.accuracy && (snap.accuracy[7] !== undefined || snap.accuracy["7"] !== undefined),
    `brain.snapshot().accuracy should carry table 7`);
  const reBrain = createBrain({ seedAccuracy: snap.accuracy });
  const reSnap = reBrain.snapshot();
  const a7 = snap.accuracy[7] ?? snap.accuracy["7"];
  const r7 = reSnap.accuracy[7] ?? reSnap.accuracy["7"];
  check(Math.abs(a7 - r7) < 1e-9, `seeded accuracy for table 7 should round-trip (${a7} vs ${r7})`);
}

// --- SAVE-02/03: history (mastery) round-trip — per-table boolean window survives reseed ---
{
  const brain = createBrain();
  // Drive table 7 to a full mastery window of correct answers.
  for (let i = 0; i < CONFIG.BRAIN.MASTERY_WINDOW; i++) brain.reportResult(7, true);

  const snap = brain.snapshot();
  const origHistory = snap.history[7] ?? snap.history["7"];
  check(Array.isArray(origHistory), `brain.snapshot().history should carry a boolean array for table 7`);
  check(origHistory.length === CONFIG.BRAIN.MASTERY_WINDOW,
    `history window for table 7 should be clamped to MASTERY_WINDOW (${CONFIG.BRAIN.MASTERY_WINDOW}), got ${origHistory.length}`);

  // Reconstruct a NEW brain from the saved history blob — history (not just accuracy) must resume.
  const reBrain = createBrain({ seedHistory: snap.history });
  const reSnap = reBrain.snapshot();
  const reHistory = reSnap.history[7] ?? reSnap.history["7"];
  check(Array.isArray(reHistory) && reHistory.length === origHistory.length,
    `reseeded history length should match (${origHistory.length}), got ${reHistory && reHistory.length}`);
  const sameValues = Array.isArray(reHistory) &&
    reHistory.length === origHistory.length &&
    reHistory.every((v, i) => Boolean(v) === Boolean(origHistory[i]));
  check(sameValues, `reseeded history booleans for table 7 should match the saved window (mastery resumes)`);
}

// --- SAVE-03: statistical — a seeded low-accuracy table is over-selected vs. a fresh brain ---
{
  const DRAWS = 2500;
  const countSevens = (brain) => {
    let n = 0;
    for (let i = 0; i < DRAWS; i++) {
      if (brain.nextQuestion().a === 7) n++;
    }
    return n / DRAWS;
  };

  // Seed table 7 very low (0.05) → the selector should drill it hard.
  const seeded = createBrain({ seedAccuracy: { 7: 0.05 } });
  const fresh = createBrain();
  const seededShare = countSevens(seeded);
  const freshShare = countSevens(fresh);

  // Materially higher — at least ~1.5x the fresh baseline (RESEARCH Pitfall 2 guard).
  check(seededShare > freshShare * 1.5,
    `seeded table-7 share (${seededShare.toFixed(3)}) should be >1.5x fresh baseline (${freshShare.toFixed(3)})`);
}

if (failures > 0) {
  console.error(`smoke-progress: FAIL — ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("smoke-progress: PASS");
