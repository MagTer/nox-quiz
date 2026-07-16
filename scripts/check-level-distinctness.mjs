#!/usr/bin/env node
// scripts/check-level-distinctness.mjs — the STRUCTURAL-DISTINCTNESS gate
// (docs/LEVEL-DESIGN.md §8.5 rule 7, added 2026-07-16 after a real blocker).
//
// WHY THIS EXISTS. The first all-8 Phase-34.6 rebuild produced CLONES: even levels
// 02/04/06 shipped byte-identical platform y-sequences
// (254,246,172,98,98,24,-50,-124,-198,-272), and odd 01/03/05 were near-identical
// arch variations — because each level was authored to "match level-02" as a
// template. Every automated gate was green (each clone is independently legal and
// completable) and only a human full test-play caught it. This gate makes that
// failure mode machine-visible: no two levels may share a platform-layout signature.
//
// WHAT IT MEASURES. For every ordered pair of levels it computes two independent
// similarity signals and HARD-FAILs if EITHER crosses its threshold:
//
//   A) ySeqSim  — normalized longest-common-subsequence of the two levels' ORDERED
//                 platform y-sequences (each y rounded to ROUND px so the deliberate
//                 off-grid climb jitter of §3.4 does not read as a difference). This
//                 is the direct clone signal: a shared climb profile. Byte-identical
//                 spires score ~1.0.
//   B) shapeSim — the geometric-mean of (multiset-overlap of rounded platform y's)
//                 and (LCS ratio of the floor/gap-width rhythm). This catches a
//                 "re-skin": the same set of tier heights and the same ground rhythm
//                 reshuffled. A genuinely distinct DIRECTION + MACRO-SHAPE (§8.5.7)
//                 scores low on at least one of the two factors.
//
// This is DELIBERATELY standalone (like validate-levels.mjs) — pure data, no browser,
// node-importable registry only. Run from the repo root:
//   node scripts/check-level-distinctness.mjs            (checks every LEVEL_ORDER pair)
//   node scripts/check-level-distinctness.mjs --matrix   (also prints the full pairwise matrix)
//
// Exit 0 = every pair distinct; exit 1 = at least one pair too similar (HARD-FAIL).

import { LEVEL_ORDER, getLevel } from "../src/levels/index.js";

// --- Thresholds (calibrated 2026-07-16). A pair HARD-FAILs if it crosses EITHER. ---
// Both sit well ABOVE the highest score any genuinely-distinct pair in the redone set
// produces, and well BELOW the score the original clones produced (ySeqSim ~1.0 on the
// identical spires). See the header rationale — this gate was built RED-first against
// the cloned levels, so these numbers are the boundary between "re-skin" and "distinct".
const YSEQ_FAIL = 0.72; // ordered climb-profile LCS ratio: a shared climb = a clone
const SHAPE_FAIL = 0.80; // reshuffled same-heights-and-rhythm re-skin

const ROUND = 6; // px bucket for platform y (absorbs §3.4 off-grid jitter, keeps macro shape)
const GAP_ROUND = 40; // px bucket for the floor/gap rhythm tokens

const round = (v, step) => Math.round(v / step) * step;

// Longest-common-subsequence length of two token arrays (order-preserving, gaps ok).
function lcsLen(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0 || n === 0) return 0;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

// Overlap coefficient of two multisets (|A ∩ B| / min(|A|,|B|)), counting multiplicity.
function multisetOverlap(a, b) {
  if (a.length === 0 || b.length === 0) return 0;
  const count = new Map();
  for (const v of a) count.set(v, (count.get(v) ?? 0) + 1);
  let inter = 0;
  for (const v of b) {
    const c = count.get(v) ?? 0;
    if (c > 0) {
      inter += 1;
      count.set(v, c - 1);
    }
  }
  return inter / Math.min(a.length, b.length);
}

// The per-level layout signature the two similarity signals are computed from.
function signature(level) {
  const g = level.geometry;
  const platforms = g.platforms ?? [];
  // ORDERED platform y-sequence (authored climb order) — the clone signal.
  const ySeq = platforms.map((p) => round(p.y, ROUND));
  // SORTED rounded y multiset — the "same tier heights" re-skin signal.
  const ySorted = [...ySeq].sort((x, y) => x - y);
  // Floor/gap rhythm: the alternating (floor width, gap width) token stream across
  // the sorted floor runs — the "same ground cadence" re-skin signal (also the
  // dimension the transport-monotony gate lives in).
  const floors = [...(g.floors ?? [])].sort((a, b) => a.x - b.x);
  const rhythm = [];
  for (let i = 0; i < floors.length; i++) {
    rhythm.push("w" + round(floors[i].w, GAP_ROUND));
    if (i + 1 < floors.length) {
      const gap = floors[i + 1].x - (floors[i].x + floors[i].w);
      rhythm.push("g" + round(gap, GAP_ROUND));
    }
  }
  return { id: level.id, ySeq, ySorted, rhythm };
}

function pairScores(a, b) {
  const yLcs = lcsLen(a.ySeq, b.ySeq);
  const ySeqSim = yLcs / Math.min(a.ySeq.length, b.ySeq.length || 1);
  const msOverlap = multisetOverlap(a.ySorted, b.ySorted);
  const rLcs = lcsLen(a.rhythm, b.rhythm);
  const rhythmSim = rLcs / Math.min(a.rhythm.length || 1, b.rhythm.length || 1);
  const shapeSim = Math.sqrt(msOverlap * rhythmSim); // geometric mean — both must be high to trip
  return { ySeqSim, msOverlap, rhythmSim, shapeSim };
}

function main() {
  const showMatrix = process.argv.includes("--matrix");
  const sigs = LEVEL_ORDER.map((id) => signature(getLevel(id)));

  let failures = 0;
  const rows = [];
  for (let i = 0; i < sigs.length; i++) {
    for (let j = i + 1; j < sigs.length; j++) {
      const s = pairScores(sigs[i], sigs[j]);
      const yFail = s.ySeqSim >= YSEQ_FAIL;
      const shapeFail = s.shapeSim >= SHAPE_FAIL;
      const fail = yFail || shapeFail;
      rows.push({ a: sigs[i].id, b: sigs[j].id, ...s, fail, yFail, shapeFail });
      if (fail) {
        const reasons = [];
        if (yFail) reasons.push(`climb-profile ySeqSim=${s.ySeqSim.toFixed(2)} >= ${YSEQ_FAIL}`);
        if (shapeFail)
          reasons.push(
            `re-skin shapeSim=${s.shapeSim.toFixed(2)} >= ${SHAPE_FAIL} (yOverlap=${s.msOverlap.toFixed(2)}, rhythm=${s.rhythmSim.toFixed(2)})`,
          );
        console.log(`${sigs[i].id} ≈ ${sigs[j].id} | HARD-FAIL | ${reasons.join("; ")}`);
        failures += 1;
      }
    }
  }

  if (showMatrix) {
    console.log("\n--- pairwise similarity (ySeqSim / shapeSim) ---");
    for (const r of rows) {
      console.log(
        `${r.a} vs ${r.b}: ySeq=${r.ySeqSim.toFixed(2)} shape=${r.shapeSim.toFixed(2)} ` +
          `(yOverlap=${r.msOverlap.toFixed(2)} rhythm=${r.rhythmSim.toFixed(2)})${r.fail ? "  <-- FAIL" : ""}`,
      );
    }
  }

  if (failures > 0) {
    console.error(
      `\ncheck-level-distinctness: FAIL — ${failures} pair(s) share a layout signature (see §8.5 rule 7)`,
    );
    process.exit(1);
  }
  console.log(`check-level-distinctness: PASS — all ${sigs.length} levels structurally distinct`);
}

main();
