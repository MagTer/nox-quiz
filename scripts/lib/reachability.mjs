// scripts/lib/reachability.mjs — Δy-aware jump-edge model + BFS reachability
// (VALID-01, Wave 2). Consumed by scripts/validate-levels.mjs (Wave 3) as the
// spawn->goal / gap-width / mechanic-reachability arbiter.
//
// PURE module: no engine globals, no Playwright, no browser (a727c13-safe). Reads
// level.geometry (src/levels/*.js shape) + the frozen calibrated envelope constant
// from ./jump-envelope.mjs (Wave 1, Plan 23-01) — NEVER a locally re-derived
// closed-form cutoff (CONFIG.JUMP_FORCE**2/(2*CONFIG.GRAVITY)). This replaces Phase
// 22's flat, no-safety-factor, single-hop heuristic (22-FINDINGS.md's "no safety
// factor" flaw, rise<=96.6px/run<=178.3px, Δy-blind) with a real chain-of-hops model.
//
// Physics this design is derived from (src/config.js, unchanged by this plan):
// RUN_SPEED 240 px/s, GRAVITY 1400 px/s^2, JUMP_FORCE 520 px/s. The underlying
// projectile-motion algebra below (time-of-flight quadratic) is still real physics
// read straight from CONFIG — that part is correct and untouched. Only the maxRise
// CUTOFF and the runSpeed multiplier used AS the reach budget come from the
// empirically-calibrated JUMP_ENVELOPE constant (scripts/lib/jump-envelope.mjs),
// never from a locally re-derived closed-form ceiling — see jump-envelope.mjs's own
// header comment for the full calibration provenance (12 standing + 12 running
// trials sampled against the real running engine on 2026-07-05).
//
// DESIGN NOTE — barriers are never blocking nodes/edges: this graph never models a
// door/mathGate/enemy as a lockout obstacle, because this game's math mechanics have
// no lockout state (wrong answers just re-ask, per challenge.js's close()-only-on-
// success semantics) and are always eventually passable once the player physically
// reaches their floor run. The ONLY thing that can make a barrier truly unreachable
// is its footprint floating over a hole (scripts/lib/over-hole-check.mjs's separate,
// exact-interval-arithmetic job) or its floor run being outside the BFS-reachable
// component from spawn (Task 2's "mechanic-reachability" check).

import { fileURLToPath } from "url";

import { CONFIG } from "../../src/config.js";
import { JUMP_ENVELOPE } from './jump-envelope.mjs';

// A hop using more than 90% of the calibrated envelope's max reach is WARN-tier —
// technically reachable per the BFS graph, but tight enough that player imprecision
// could miss it. Named/commented per 23-RESEARCH.md's Open Question 2 so Phase 24
// can find and retune it without re-deriving the whole model.
export const WARN_MARGIN_RATIO = 0.9;

// Player spawn is always x:64 — src/scenes/game.js's `data?.startX ?? 64` default,
// never overridden by any go("game", ...) call site (select.js only ever passes
// { levelId }). Safe as a fixed constant rather than a per-level parameter.
export const SPAWN_X = 64;

/**
 * One node per floor run and per platform: { id, xStart, xEnd, y }.
 * `?? []`-guarded per this project's never-brick convention — an omitted
 * `platforms` array never throws.
 */
export function buildNodes(geometry) {
  const nodes = [];
  (geometry.floors ?? []).forEach((f, i) =>
    nodes.push({ id: `floor-${i}`, xStart: f.x, xEnd: f.x + f.w, y: CONFIG.FLOOR_Y })
  );
  (geometry.platforms ?? []).forEach((p, i) =>
    nodes.push({ id: `platform-${i}`, xStart: p.x, xEnd: p.x + p.w, y: p.y })
  );
  return nodes;
}

/**
 * Find the first node whose [xStart, xEnd] span contains `x`. When `y` is supplied,
 * additionally requires |y - node.y| < 8, disambiguating an overlapping floor/
 * platform pair at the same x.
 */
export function nodeContaining(nodes, x, y) {
  return nodes.find(
    (n) => x >= n.xStart && x <= n.xEnd && (y === undefined || Math.abs(y - n.y) < 8)
  );
}

// Solve 0.5*gravity*t^2 - jumpForce*t - dy = 0 for t, returning only positive roots
// as { t, reach } candidates. Shared by the jump-force branch and the "step off the
// ledge" (jumpForce=0) branch of jumpReach below.
function rootsAndReaches(dy, jumpForce, gravity, runSpeed) {
  const disc = jumpForce ** 2 + 2 * gravity * dy;
  if (disc < 0) return [];
  const sqrtDisc = Math.sqrt(disc);
  const roots = [(jumpForce - sqrtDisc) / gravity, (jumpForce + sqrtDisc) / gravity].filter(
    (t) => t > 0
  );
  return roots.map((t) => ({ t, reach: runSpeed * t }));
}

/**
 * Candidate horizontal reaches for a jump/fall across height difference `dy`
 * (toNode.y - fromNode.y; Kaplay's Y axis increases downward, so dy > 0 means
 * landing lower/easier, dy < 0 means landing higher/harder).
 *
 * Returns [] if `dy < -envelope.maxRise` (the empirically-calibrated cutoff — the
 * arc physically cannot rise this high, full stop, regardless of horizontal
 * distance). Otherwise returns every positive-root candidate from BOTH the real
 * jump-force quadratic AND the jumpForce=0 "step off the ledge, no jump needed"
 * quadratic (Pattern 1's "Falling-only edges" note) unioned into one array, so a
 * pure walk-off-the-edge drop is covered by this same function without branching on
 * the sign of dy.
 */
export function jumpReach(dy, envelope) {
  if (dy < -envelope.maxRise) return [];
  const jumpCandidates = rootsAndReaches(dy, CONFIG.JUMP_FORCE, CONFIG.GRAVITY, envelope.runSpeed);
  if (jumpCandidates.length === 0) {
    // disc < 0 on the jump-force branch — shouldn't happen given the maxRise guard
    // above (maxRise is always < the theoretical JUMP_FORCE**2/(2*GRAVITY) ceiling),
    // but honor the documented contract: no real root on this branch means no edge.
    const discCheck = CONFIG.JUMP_FORCE ** 2 + 2 * CONFIG.GRAVITY * dy;
    if (discCheck < 0) return [];
  }
  const fallCandidates = rootsAndReaches(dy, 0, CONFIG.GRAVITY, envelope.runSpeed);
  return [...jumpCandidates, ...fallCandidates];
}

/**
 * Test whether a jump/fall from `fromNode` can land on `toNode`, given the
 * calibrated `envelope`. Returns `{ marginRatio }` for the BEST (lowest-margin)
 * matching candidate, or `null` if no candidate's reach falls inside toNode's span.
 *
 * marginRatio = reach / theoreticalMaxReach, where theoreticalMaxReach is the
 * reach the player would get using the FULL calibrated envelope at this exact Δy
 * (the larger of the two real jump-force roots) — this is the ratio Task 2's
 * checkLevelReachability uses for HARD-FAIL/WARN/PASS tiering.
 */
export function canReach(fromNode, toNode, envelope) {
  const dy = toNode.y - fromNode.y;
  const candidates = jumpReach(dy, envelope);
  if (candidates.length === 0) return null;

  // Direction of travel: measure the target span's reach distance relative to
  // fromNode's near edge, handling both the "toNode is to the right" and "toNode
  // is to the left" cases. Overlapping spans (e.g. a platform directly above/below
  // a floor run) need zero horizontal travel.
  let spanMin;
  let spanMax;
  if (toNode.xStart >= fromNode.xEnd) {
    spanMin = toNode.xStart - fromNode.xEnd;
    spanMax = toNode.xEnd - fromNode.xEnd;
  } else if (toNode.xEnd <= fromNode.xStart) {
    spanMin = fromNode.xStart - toNode.xEnd;
    spanMax = fromNode.xStart - toNode.xStart;
  } else {
    spanMin = 0;
    spanMax = 0;
  }

  // theoreticalMaxTAtThisDy: the larger of the two real jump-force roots at this
  // Δy — the reach the player would get if they used the FULL calibrated envelope
  // (used only as the marginRatio denominator, never as a cutoff itself).
  const disc = CONFIG.JUMP_FORCE ** 2 + 2 * CONFIG.GRAVITY * dy;
  const sqrtDisc = disc >= 0 ? Math.sqrt(disc) : 0;
  const theoreticalMaxT = Math.max(
    (CONFIG.JUMP_FORCE - sqrtDisc) / CONFIG.GRAVITY,
    (CONFIG.JUMP_FORCE + sqrtDisc) / CONFIG.GRAVITY,
    0
  );
  const theoreticalMaxReach = envelope.runSpeed * theoreticalMaxT;

  let best = null;
  for (const { reach } of candidates) {
    if (reach >= spanMin && reach <= spanMax) {
      const marginRatio = theoreticalMaxReach > 0 ? reach / theoreticalMaxReach : 0;
      if (best === null || marginRatio < best.marginRatio) {
        best = { marginRatio };
      }
    }
  }
  return best;
}

/**
 * Build the full directed adjacency: Map<nodeId, Array<{ to, marginRatio }>>,
 * testing canReach between every ordered pair of distinct nodes (both directions —
 * the player can jump either way).
 */
export function buildGraph(nodes, envelope) {
  const graph = new Map();
  for (const n of nodes) graph.set(n.id, []);
  for (const from of nodes) {
    for (const to of nodes) {
      if (from.id === to.id) continue;
      const result = canReach(from, to, envelope);
      if (result) {
        graph.get(from.id).push({ to: to.id, marginRatio: result.marginRatio });
      }
    }
  }
  return graph;
}

/**
 * Standard unweighted BFS over `graph`, returning the Set of node ids reachable
 * from `startNodeId` (pure connectivity — every edge is boolean-feasible, no
 * weights). Supports multi-hop chains: spawn -> intermediate platform -> goal, not
 * just single-hop adjacency.
 */
export function bfsReachableSet(graph, startNodeId) {
  const visited = new Set();
  if (!graph.has(startNodeId)) return visited;
  visited.add(startNodeId);
  const queue = [startNodeId];
  while (queue.length > 0) {
    const cur = queue.shift();
    for (const edge of graph.get(cur) ?? []) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  return visited;
}

// --- Self-test (runs only when this module is executed directly) ---
// Mirrors scripts/smoke-progress.mjs's check(cond, msg)/failures-counter/
// process.exit(1) idiom — this project's no-framework unit-test layer. Uses small
// synthetic node/geometry fixtures constructed inline; never imports a real level.
const isMain = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  let failures = 0;
  const check = (cond, msg) => {
    console.assert(cond, msg);
    if (!cond) failures++;
  };

  const testEnvelope = { maxRise: 88.331, runSpeed: 218.043 };

  // Case 1: same-y (Δy=0) floor nodes 150px apart — canReach returns non-null.
  {
    const a = { id: "floor-0", xStart: 0, xEnd: 100, y: 320 };
    const b = { id: "floor-1", xStart: 250, xEnd: 500, y: 320 };
    const result = canReach(a, b, testEnvelope);
    check(result !== null, `expected non-null feasibility for a 150px flat gap, got ${JSON.stringify(result)}`);
  }

  // Case 2: same-y floor nodes 500px apart — canReach returns null.
  {
    const a = { id: "floor-0", xStart: 0, xEnd: 100, y: 320 };
    const b = { id: "floor-1", xStart: 600, xEnd: 900, y: 320 };
    const result = canReach(a, b, testEnvelope);
    check(result === null, `expected null for a 500px flat gap (exceeds envelope), got ${JSON.stringify(result)}`);
  }

  // Case 3: a platform requiring more rise than envelope.maxRise — jumpReach
  // returns [] for that Δy, canReach returns null regardless of horizontal
  // distance (even directly overlapping, reach=0 needed).
  {
    const dy = -(testEnvelope.maxRise + 50); // well beyond maxRise
    const reach = jumpReach(dy, testEnvelope);
    check(Array.isArray(reach) && reach.length === 0, `expected [] for dy beyond maxRise, got ${JSON.stringify(reach)}`);

    const from = { id: "floor-0", xStart: 0, xEnd: 100, y: 320 };
    const to = { id: "platform-0", xStart: 40, xEnd: 60, y: 320 + dy }; // overlapping x, too high
    const result = canReach(from, to, testEnvelope);
    check(result === null, `expected null for an over-maxRise platform even with overlapping x, got ${JSON.stringify(result)}`);
  }

  // Case 4: multi-hop 3-node chain (floor A -> intermediate platform -> floor B)
  // where the direct A->B gap alone exceeds the envelope but each individual hop
  // is within it — bfsReachableSet from A must include B (chain-of-hops, not
  // single-hop-only).
  {
    const floorA = { id: "floor-A", xStart: 0, xEnd: 100, y: 320 };
    const platform = { id: "platform-mid", xStart: 200, xEnd: 260, y: 260 };
    const floorB = { id: "floor-B", xStart: 440, xEnd: 600, y: 320 };
    const nodes = [floorA, platform, floorB];

    // Direct A->B alone would exceed the envelope (440px run, far past ~218px/frame
    // budget) — confirm the direct single-hop test fails on its own.
    const direct = canReach(floorA, floorB, testEnvelope);
    check(direct === null, `expected the direct A->B single hop to exceed the envelope, got ${JSON.stringify(direct)}`);

    const graph = buildGraph(nodes, testEnvelope);
    const reachable = bfsReachableSet(graph, floorA.id);
    check(
      reachable.has(floorB.id),
      `expected multi-hop chain A->platform->B to make floor-B reachable from floor-A, reachable set was ${JSON.stringify([...reachable])}`
    );
  }

  // Additional Task 1 acceptance check: an omitted platforms array never throws.
  {
    let threw = false;
    let nodes;
    try {
      nodes = buildNodes({ floors: [{ x: 0, w: 100 }] });
    } catch {
      threw = true;
    }
    check(!threw, "buildNodes must never throw on an omitted platforms array");
    check(Array.isArray(nodes) && nodes.length === 1, `expected 1 node for a single floor with no platforms, got ${JSON.stringify(nodes)}`);
  }

  if (failures > 0) {
    console.error(`reachability-selftest: FAIL — ${failures} assertion(s) failed`);
    process.exit(1);
  }
  console.log("reachability-selftest: PASS");
}
