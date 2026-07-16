#!/usr/bin/env node
// scripts/check-monotony.mjs — the TRANSPORT-MONOTONY gate (docs/LEVEL-DESIGN.md
// §8.5 rule 8, added 2026-07-16 after a real blocker).
//
// WHY THIS EXISTS. The user's full test-play of the first all-8 rebuild flagged whole
// stretches that were just "run on the ground, jump a hole, run, jump a hole, on
// repeat" — flat same-height floor→gap→floor with no varied action. Every such level
// was green (each hop is independently legal) because no gate looked at the BEAT.
// The clearest example: level-04's tail (x≈5860→9520) is six flat FLOOR_Y runs whose
// only "features" are a lone single spike or one enemy per floor — the run/jump/run
// corridor §8.5 rule 8 forbids. This gate makes that pattern machine-visible.
//
// WHAT COUNTS AS "PLAIN TRANSPORT". Floors are all pinned to FLOOR_Y, so every ground
// run is flat. A floor run is PLAIN when the player just runs across it with no
// VERTICAL platforming and no MATH set-piece — specifically, when it carries NEITHER:
//   • a VERTICAL MOVE / FORK the player engages FROM THE GROUND — a platform whose
//     first step is within one jump of the floor (height-above-floor ≤ GROUND_STEP_PX,
//     ~one maxRise) overlapping the floor's x-span or an adjacent gap. A decorative
//     high arch far overhead (level-03 ships y=98 coin ledges 222px up with no step
//     beneath) is NOT a ground vertical move and does not rescue a flat run.
//   • a SET-PIECE — a door / enemy / mathGate / lock on the run (a math/blocking beat).
// A lone spike is deliberately NOT an enricher: §8.5 lists a "hazard-timing SEQUENCE",
// not a single spike, and "run, jump a hole, hop one spike, run" is exactly the flat
// corridor the user rejected. Verticality and route variety are what rule 8 is about
// (it is §8.5 rule 1 — "verticality in EVERY level" — applied to flat stretches).
//
// A run of MORE THAN MAX_PLAIN consecutive plain gap-crossings (plain floor → gap →
// plain floor, with the gap itself un-bridged) is the transport pattern → HARD-FAIL.
//
// Standalone, pure data, node-importable registry only (like validate-levels.mjs):
//   node scripts/check-monotony.mjs            (checks every LEVEL_ORDER entry)
//   node scripts/check-monotony.mjs --verbose  (also prints every floor/gap classification)
//
// Exit 0 = no transport run anywhere; exit 1 = at least one run > MAX_PLAIN (HARD-FAIL).

import { LEVEL_ORDER, getLevel } from "../src/levels/index.js";
import { JUMP_ENVELOPE } from "./lib/jump-envelope.mjs";

const FLOOR_Y = 320; // CONFIG.FLOOR_Y — every floor run's surface (mirrors build.js)

// A run of AT MOST this many consecutive plain gap-crossings is allowed (a short flat
// breather is fine — §8 permits >1000px barrier-free stretches). The FOURTH consecutive
// plain hop with nothing between is the "run, jump a hole, on repeat" pattern.
const MAX_PLAIN = 3;

// A platform is a GROUND vertical-move / fork only if its first step is reachable
// straight off the floor — height-above-floor within one calibrated maxRise (a hair of
// slack added so a 74px first tier of an overlapping climb still counts).
const GROUND_STEP_PX = JUMP_ENVELOPE.maxRise + 4; // ≈ 92px

const overlapsX = (x, w, left, right) => x < right && x + w > left;
const inX = (x, left, right) => x >= left && x <= right;

// A barrier set-piece anywhere in [left,right]?
function hasSetPiece(g, left, right) {
  for (const kind of ["doors", "enemies", "mathGates", "locks"]) {
    if ((g[kind] ?? []).some((e) => inX(e.x, left, right))) return true;
  }
  return false;
}

// A ground-engaged vertical move / fork platform overlapping [left,right]?
function hasGroundStep(g, left, right) {
  return (g.platforms ?? []).some(
    (p) => p.y < FLOOR_Y && FLOOR_Y - p.y <= GROUND_STEP_PX && overlapsX(p.x, p.w, left, right),
  );
}

// Classify each floor run as plain / enriched, and each gap as bridged / bare.
function classify(g) {
  const floors = [...(g.floors ?? [])].sort((a, b) => a.x - b.x);
  const floorInfo = floors.map((f) => {
    const left = f.x;
    const right = f.x + f.w;
    const plain = !hasGroundStep(g, left, right) && !hasSetPiece(g, left, right);
    return { x: f.x, w: f.w, plain };
  });
  const gapInfo = [];
  for (let i = 0; i + 1 < floors.length; i++) {
    const gapL = floors[i].x + floors[i].w;
    const gapR = floors[i + 1].x;
    if (gapR <= gapL) {
      gapInfo.push({ from: i, bridged: true, adjoining: true }); // touching runs — not a hop
      continue;
    }
    // A stepping-stone / bridge platform in the gap makes the hop a vertical/fork move.
    const bridged = hasGroundStep(g, gapL, gapR) || hasSetPiece(g, gapL, gapR);
    gapInfo.push({ from: i, bridged, gapL, gapR });
  }
  return { floorInfo, gapInfo };
}

// Longest run of consecutive plain gap-crossings (plain floor → bare gap → plain floor).
function longestPlainRun(g) {
  const { floorInfo, gapInfo } = classify(g);
  let run = 0;
  let worst = 0;
  let worstStartX = null;
  let runStartX = null;
  for (const gap of gapInfo) {
    const a = floorInfo[gap.from];
    const b = floorInfo[gap.from + 1];
    const plainHop = a.plain && b.plain && !gap.bridged;
    if (plainHop) {
      if (run === 0) runStartX = a.x;
      run += 1;
      if (run > worst) {
        worst = run;
        worstStartX = runStartX;
      }
    } else {
      run = 0;
    }
  }
  return { worst, worstStartX, floorInfo, gapInfo };
}

function main() {
  const verbose = process.argv.includes("--verbose");
  let failures = 0;

  for (const id of LEVEL_ORDER) {
    const g = getLevel(id).geometry;
    const { worst, worstStartX, floorInfo, gapInfo } = longestPlainRun(g);
    if (worst > MAX_PLAIN) {
      console.log(
        `${id} | monotony | HARD-FAIL | run of ${worst} consecutive plain floor→gap→floor crossings (starts near x=${worstStartX}); max allowed ${MAX_PLAIN}`,
      );
      failures += 1;
    } else {
      console.log(`${id} | monotony | PASS | longest plain-transport run = ${worst} (max ${MAX_PLAIN})`);
    }
    if (verbose) {
      floorInfo.forEach((f, i) => {
        console.log(`    floor[${i}] x=${f.x}..${f.x + f.w} ${f.plain ? "PLAIN" : "enriched"}`);
        const gap = gapInfo[i];
        if (gap && !gap.adjoining) console.log(`      gap ${gap.gapL}..${gap.gapR} ${gap.bridged ? "bridged" : "bare"}`);
      });
    }
  }

  if (failures > 0) {
    console.error(`\ncheck-monotony: FAIL — ${failures} level(s) carry a transport-monotony run (see §8.5 rule 8)`);
    process.exit(1);
  }
  console.log("\ncheck-monotony: PASS — no transport-monotony run in any level");
}

main();
