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
// EXPECTED until Wave 1–2 land: the `import` of ../src/levels/index.js throws (the registry
// module does not exist yet), so this exits non-zero — a real harness, not a no-op. It turns
// green once src/progress.js gains the levels-cleared seam (markCleared/isLevelCleared/serialize
// `levels` map), the extended brain (snapshot/seedAccuracy/seedHistory) exists, and the
// src/levels/ registry (LEVEL_ORDER/getLevel/isUnlocked + level-01 verbatim geometry) lands.

import { createProgress } from "../src/progress.js";
import { createBrain } from "../src/math/brain.js";
import { CONFIG } from "../src/config.js";
// Wave-0 registry import — RED until src/levels/index.js lands (Wave 1/2), then GREEN.
// node-relative from the repo root, matching the ../src/... style of the imports above.
import { LEVEL_ORDER, getLevel, isUnlocked } from "../src/levels/index.js";

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

// --- SAVE-06: cleared-map round-trip — markCleared survives serialize → reconstruct ---
{
  const brain = createBrain();
  const p = createProgress();
  check(p.isLevelCleared("level-01") === false,
    `SAVE-06: a fresh progress should report level-01 NOT cleared`);
  p.markCleared("level-01");
  check(p.isLevelCleared("level-01") === true,
    `SAVE-06: markCleared("level-01") should flip isLevelCleared to true`);

  const blob = p.serialize(brain.snapshot());
  const restored = createProgress(blob);
  check(restored.isLevelCleared("level-01") === true,
    `SAVE-06: cleared fact for level-01 should survive serialize → createProgress`);
  check(restored.isLevelCleared("never-cleared-id") === false,
    `SAVE-06: a never-cleared id should round-trip as NOT cleared`);
}

// --- SAVE-06: derived unlock — first level always open; later levels gate on predecessor ---
{
  // Nothing stored: the first level in LEVEL_ORDER is always unlocked.
  const fresh = createProgress();
  check(isUnlocked(LEVEL_ORDER[0], fresh) === true,
    `SAVE-06: LEVEL_ORDER[0] should be unlocked from a fresh (nothing-cleared) progress`);

  // Guard with a length check so a single-level registry does not false-fail. A second level
  // is locked until its predecessor (LEVEL_ORDER[0]) is cleared, then unlocked after.
  if (LEVEL_ORDER.length >= 2) {
    const second = LEVEL_ORDER[1];
    const locked = createProgress();
    check(isUnlocked(second, locked) === false,
      `SAVE-06: ${second} should be LOCKED until its predecessor is cleared`);
    locked.markCleared(LEVEL_ORDER[0]);
    check(isUnlocked(second, locked) === true,
      `SAVE-06: ${second} should UNLOCK once ${LEVEL_ORDER[0]} is cleared (derived, not stored)`);
  }
}

// --- SAVE-05: never-bricks — hostile blobs passed DIRECTLY to createProgress, never throw ---
{
  // 1. A corrupt-shaped levels value (not an object) must be tolerated.
  let threw = false;
  let p;
  try {
    p = createProgress({ version: 2, xp: 5, level: 1, levels: "not-an-object" });
  } catch {
    threw = true;
  }
  check(threw === false,
    `SAVE-05: createProgress with levels:"not-an-object" must NOT throw`);
  check(p && Number.isFinite(p.level) && p.level >= 1,
    `SAVE-05: corrupt-levels blob should still yield a finite, >=1 level`);

  // 2. A junk-id cleared map with a __proto__ key and a non-boolean cleared flag.
  // Build the hostile blob via JSON.parse — NOT an object literal. In a literal, `__proto__`
  // is special syntax that sets the prototype and creates NO own key, so it exercises only the
  // WEAKER case. JSON.parse('{"__proto__":...}') creates a GENUINE own enumerable `__proto__`
  // key — the real prototype-pollution attack vector the seeding/validate loops must withstand.
  threw = false;
  let q;
  try {
    q = createProgress(
      JSON.parse(
        '{"version":2,"levels":{"__proto__":{"cleared":true},"ghost-level":{"cleared":"yes"}}}',
      ),
    );
  } catch {
    threw = true;
  }
  check(threw === false,
    `SAVE-05: createProgress with a __proto__/junk-id levels map must NOT throw`);
  // A non-boolean "cleared" ("yes") must NOT count as cleared (strict === true coercion).
  check(q && q.isLevelCleared("ghost-level") !== true,
    `SAVE-05: a non-boolean cleared flag ("yes") must NOT register as cleared`);
  // Prototype pollution guard: constructing from a __proto__ key must not pollute Object.
  check(({}).cleared === undefined,
    `SAVE-05: constructing from a __proto__ levels key must NOT pollute Object.prototype`);

  // 3. An Infinity level (a {"level":1e400} blob parses level to Infinity) must be sanitized.
  threw = false;
  let r;
  try {
    r = createProgress({ version: 2, level: 1e400 });
  } catch {
    threw = true;
  }
  check(threw === false,
    `SAVE-05: createProgress with level:Infinity must NOT throw`);
  check(r && Number.isFinite(r.level) && r.level >= 1,
    `SAVE-05: an Infinity level must be sanitized to a finite, >=1 value (no bricked progression)`);

  // 4. A wholly foreign blob (none of the expected fields) must fall back to safe defaults.
  threw = false;
  let s;
  try {
    s = createProgress({ totally: "different" });
  } catch {
    threw = true;
  }
  check(threw === false,
    `SAVE-05: createProgress with a foreign blob must NOT throw`);
  check(s && Number.isFinite(s.level) && s.level >= 1 && s.getXp() >= 0,
    `SAVE-05: a foreign blob must yield safe defaults (level>=1, xp>=0)`);
}

// --- LVL-02: registry — ordered, level-01 present, forgiving lookup ---
{
  check(LEVEL_ORDER[0] === "level-01",
    `LVL-02: LEVEL_ORDER[0] should be "level-01", got ${LEVEL_ORDER[0]}`);
  const l1 = getLevel("level-01");
  check(l1 && l1.id === "level-01",
    `LVL-02: getLevel("level-01") should return a descriptor with id "level-01"`);
  const fallback = getLevel("does-not-exist");
  check(fallback && fallback.id === LEVEL_ORDER[0],
    `LVL-02: getLevel(bad id) should fall back to the first level (forgiving)`);
}

// Small recursive deep-equal (no dependency — the no-build canon forbids one).
const deepEqual = (a, b) => {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object") return a === b;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => deepEqual(a[k], b[k]));
};

// --- LVL-02 regression: level-01 geometry === v3.0 src/level.js values, VERBATIM ---
{
  // The EXACT v3.0 geometry lifted from src/level.js (floors 46-50, platforms 54-59,
  // coins 69-80, spikes 83-87, goal 90, checkpoints 101-106). Spike/goal/checkpoint values
  // are reconstructed from CONFIG with the same expressions the source uses, so this is a
  // byte-equivalent comparison (proves the lift is verbatim, not eyeballed).
  const FLOOR_Y = CONFIG.FLOOR_Y; // 320
  const expectedGeometry = {
    floors: [
      { x: 0, w: 560 },
      { x: 720, w: 480 },
      { x: 1360, w: 880 },
    ],
    platforms: [
      { x: 360, y: 240, w: 160, h: 24 },
      { x: 560, y: 192, w: 128, h: 24 },
      { x: 1208, y: 232, w: 152, h: 24 },
      { x: 1640, y: 232, w: 160, h: 24 },
    ],
    coins: [
      { x: 200, y: 264 },
      { x: 392, y: 184 },
      { x: 592, y: 136 },
      { x: 800, y: 264 },
      { x: 960, y: 264 },
      { x: 1240, y: 176 },
      { x: 1440, y: 264 },
      { x: 1680, y: 176 },
      { x: 1900, y: 264 },
      { x: 2080, y: 264 },
    ],
    spikes: [
      { x: 880, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1520, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 2000, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
    ],
    goal: { x: 2160, y: FLOOR_Y - CONFIG.GOAL_SIZE },
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 },
      { x: 800, y: FLOOR_Y - 48 },
      { x: 1440, y: FLOOR_Y - 48 },
      { x: 1920, y: FLOOR_Y - 48 },
    ],
    doors: [
      { x: 1400, y: FLOOR_Y - CONFIG.DOOR.H },
    ],
    mathGates: [
      { x: 600, y: FLOOR_Y - CONFIG.MATH_GATE.H },
      { x: 1300, y: FLOOR_Y - CONFIG.MATH_GATE.H },
    ],
    enemies: [
      { x: 1000, y: FLOOR_Y - CONFIG.ENEMY.H },
    ],
    collectZones: [
      { x: 300, y: FLOOR_Y - CONFIG.COLLECT.ZONE_H, slots: [0, 1, 2, 3] },
    ],
    answerPickupSlots: [
      { x: 270, y: FLOOR_Y - 100 },
      { x: 330, y: FLOOR_Y - 100 },
      { x: 270, y: FLOOR_Y - 40 },
      { x: 330, y: FLOOR_Y - 40 },
    ],
  };

  const actual = getLevel("level-01").geometry;
  check(deepEqual(actual, expectedGeometry),
    `LVL-02 regression: getLevel("level-01").geometry must deep-equal the v3.0 src/level.js geometry verbatim`);
}

// --- LVL-02 regression: level-02 geometry matches authored descriptor ---
{
  const FLOOR_Y = CONFIG.FLOOR_Y;
  const expectedGeometry = {
    floors: [
      { x: 0, w: 520 },
      { x: 700, w: 560 },
      { x: 1420, w: 600 },
      { x: 2180, w: 620 },
    ],
    platforms: [
      { x: 280, y: 240, w: 160, h: 24 },
      { x: 500, y: 192, w: 128, h: 24 },
      { x: 640, y: 232, w: 128, h: 24 },
      { x: 1200, y: 232, w: 128, h: 24 },
      { x: 1360, y: 192, w: 96, h: 24 },
      { x: 2020, y: 232, w: 128, h: 24 },
      { x: 2360, y: 240, w: 128, h: 24 },
    ],
    coins: [
      { x: 160, y: 264 },
      { x: 320, y: 184 },
      { x: 540, y: 136 },
      { x: 760, y: 264 },
      { x: 1040, y: 264 },
      { x: 1260, y: 176 },
      { x: 1560, y: 264 },
      { x: 1900, y: 176 },
      { x: 2280, y: 264 },
      { x: 2600, y: 264 },
    ],
    spikes: [
      { x: 920, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1180, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1760, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 2560, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
    ],
    goal: { x: 2720, y: FLOOR_Y - CONFIG.GOAL_SIZE },
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 },
      { x: 340, y: FLOOR_Y - 48 },
      { x: 840, y: FLOOR_Y - 48 },
      { x: 1020, y: FLOOR_Y - 48 },
      { x: 1120, y: FLOOR_Y - 48 },
      { x: 1460, y: FLOOR_Y - 48 },
      { x: 1680, y: FLOOR_Y - 48 },
      { x: 2480, y: FLOOR_Y - 48 },
    ],
    doors: [
      { x: 1540, y: FLOOR_Y - CONFIG.DOOR.H },
    ],
    mathGates: [
      { x: 420, y: FLOOR_Y - CONFIG.MATH_GATE.H },
      { x: 1100, y: FLOOR_Y - CONFIG.MATH_GATE.H },
    ],
    enemies: [],
    collectZones: [],
    answerPickupSlots: [],
  };

  const actual = getLevel("level-02").geometry;
  check(deepEqual(actual, expectedGeometry),
    `LVL-02 regression: getLevel("level-02").geometry must match the authored descriptor`);
}

// --- LVL-02 regression: level-03 geometry matches authored descriptor ---
{
  const FLOOR_Y = CONFIG.FLOOR_Y;
  const expectedGeometry = {
    floors: [
      { x: 0, w: 480 },
      { x: 640, w: 560 },
      { x: 1320, w: 600 },
      { x: 2040, w: 640 },
      { x: 2840, w: 560 },
    ],
    platforms: [
      { x: 280, y: 240, w: 128, h: 24 },
      { x: 480, y: 184, w: 96, h: 24 },
      { x: 1160, y: 224, w: 112, h: 24 },
      { x: 1520, y: 232, w: 96, h: 24 },
      { x: 1880, y: 184, w: 128, h: 24 },
      { x: 2220, y: 232, w: 96, h: 24 },
      { x: 2640, y: 192, w: 128, h: 24 },
    ],
    coins: [
      { x: 140, y: 264 },
      { x: 300, y: 184 },
      { x: 520, y: 128 },
      { x: 800, y: 264 },
      { x: 1080, y: 264 },
      { x: 1420, y: 176 },
      { x: 1740, y: 264 },
      { x: 1980, y: 128 },
      { x: 2380, y: 264 },
      { x: 2860, y: 264 },
      { x: 3180, y: 264 },
    ],
    spikes: [
      { x: 820, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1040, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1580, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1820, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 3020, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 3260, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
    ],
    goal: { x: 3320, y: FLOOR_Y - CONFIG.GOAL_SIZE },
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 },
      { x: 340, y: FLOOR_Y - 48 },
      { x: 740, y: FLOOR_Y - 48 },
      { x: 960, y: FLOOR_Y - 48 },
      { x: 1500, y: FLOOR_Y - 48 },
      { x: 1740, y: FLOOR_Y - 48 },
      { x: 2300, y: FLOOR_Y - 48 },
      { x: 2920, y: FLOOR_Y - 48 },
      { x: 3160, y: FLOOR_Y - 48 },
    ],
    doors: [],
    mathGates: [
      { x: 420, y: FLOOR_Y - CONFIG.MATH_GATE.H },
    ],
    enemies: [
      { x: 2400, y: FLOOR_Y - CONFIG.ENEMY.H },
    ],
    collectZones: [
      { x: 200, y: FLOOR_Y - CONFIG.COLLECT.ZONE_H, slots: [0, 1, 2, 3] },
    ],
    answerPickupSlots: [
      { x: 170, y: FLOOR_Y - 100 },
      { x: 230, y: FLOOR_Y - 100 },
      { x: 170, y: FLOOR_Y - 40 },
      { x: 230, y: FLOOR_Y - 40 },
    ],
  };

  const actual = getLevel("level-03").geometry;
  check(deepEqual(actual, expectedGeometry),
    `LVL-02 regression: getLevel("level-03").geometry must match the authored descriptor`);
}

// --- LVL-02 regression: level-04 geometry matches authored descriptor ---
{
  const FLOOR_Y = CONFIG.FLOOR_Y;
  const expectedGeometry = {
    floors: [
      { x: 0, w: 440 },
      { x: 600, w: 480 },
      { x: 1240, w: 520 },
      { x: 1960, w: 560 },
      { x: 2680, w: 560 },
      { x: 3400, w: 600 },
    ],
    platforms: [
      { x: 240, y: 232, w: 112, h: 24 },
      { x: 440, y: 168, w: 80, h: 24 },
      { x: 1080, y: 200, w: 112, h: 24 },
      { x: 1400, y: 216, w: 80, h: 24 },
      { x: 1760, y: 176, w: 128, h: 24 },
      { x: 2140, y: 216, w: 80, h: 24 },
      { x: 2520, y: 192, w: 112, h: 24 },
      { x: 2880, y: 224, w: 80, h: 24 },
      { x: 3240, y: 184, w: 112, h: 24 },
    ],
    coins: [
      { x: 120, y: 264 },
      { x: 260, y: 176 },
      { x: 460, y: 112 },
      { x: 760, y: 264 },
      { x: 980, y: 264 },
      { x: 1300, y: 176 },
      { x: 1660, y: 264 },
      { x: 1900, y: 128 },
      { x: 2300, y: 264 },
      { x: 2600, y: 264 },
      { x: 3000, y: 264 },
      { x: 3560, y: 264 },
    ],
    spikes: [
      { x: 820, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1000, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1480, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1700, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 2320, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 2480, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 3880, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
    ],
    goal: { x: 3920, y: FLOOR_Y - CONFIG.GOAL_SIZE },
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 },
      { x: 200, y: FLOOR_Y - 48 },
      { x: 740, y: FLOOR_Y - 48 },
      { x: 860, y: FLOOR_Y - 48 },
      { x: 920, y: FLOOR_Y - 48 },
      { x: 1400, y: FLOOR_Y - 48 },
      { x: 1620, y: FLOOR_Y - 48 },
      { x: 1740, y: FLOOR_Y - 48 },
      { x: 2240, y: FLOOR_Y - 48 },
      { x: 2360, y: FLOOR_Y - 48 },
      { x: 2440, y: FLOOR_Y - 48 },
      { x: 3800, y: FLOOR_Y - 48 },
    ],
    doors: [
      { x: 900, y: FLOOR_Y - CONFIG.DOOR.H },
    ],
    mathGates: [
      { x: 320, y: FLOOR_Y - CONFIG.MATH_GATE.H },
      { x: 1800, y: FLOOR_Y - CONFIG.MATH_GATE.H },
    ],
    enemies: [
      { x: 2400, y: FLOOR_Y - CONFIG.ENEMY.H },
    ],
    collectZones: [
      { x: 160, y: FLOOR_Y - CONFIG.COLLECT.ZONE_H, slots: [0, 1, 2, 3] },
    ],
    answerPickupSlots: [
      { x: 130, y: FLOOR_Y - 100 },
      { x: 190, y: FLOOR_Y - 100 },
      { x: 130, y: FLOOR_Y - 40 },
      { x: 190, y: FLOOR_Y - 40 },
    ],
  };

  const actual = getLevel("level-04").geometry;
  check(deepEqual(actual, expectedGeometry),
    `LVL-02 regression: getLevel("level-04").geometry must match the authored descriptor`);
}

// --- LVL-01/04: full registry length and derived unlock of the second level ---
{
  check(LEVEL_ORDER.length === 4,
    `LVL-01/04: LEVEL_ORDER should have 4 levels, got ${LEVEL_ORDER.length}`);
  check(LEVEL_ORDER[1] === "level-02",
    `LVL-04: LEVEL_ORDER[1] should be "level-02", got ${LEVEL_ORDER[1]}`);
}

// --- SAVE-07: the new shape coexists with the old — serialize ALSO carries a levels object ---
{
  const brain = createBrain();
  const p = createProgress();
  p.addXp(7);
  p.markCleared("level-01");
  const blob = p.serialize(brain.snapshot());
  check(blob.levels && typeof blob.levels === "object",
    `SAVE-07: the serialized blob should ALSO carry a 'levels' object (new shape coexists with xp/level/accuracy/history)`);
  check(blob.levels["level-01"] && blob.levels["level-01"].cleared === true,
    `SAVE-07: the serialized levels map should record level-01 as cleared`);
}

if (failures > 0) {
  console.error(`smoke-progress: FAIL — ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("smoke-progress: PASS");
