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
 * Find the node whose [xStart, xEnd] span contains `x`. When only one node's span
 * contains `x`, that node is returned regardless of `y` (the common case). When
 * `y` is supplied AND more than one node's span contains `x` (an overlapping
 * floor/platform pair at the same x), the candidate whose `y` is numerically
 * CLOSEST to the supplied `y` is returned, disambiguating the pair.
 *
 * WR-02: this compares against the closest candidate rather than requiring an
 * exact `|y - node.y| < 8` match, because real level geometry places entities
 * (goal/mathGate/door/enemy) using their own sprite-anchor y (e.g.
 * `FLOOR_Y - CONFIG.GOAL_SIZE`), which is offset from a floor/platform node's y
 * by the sprite's height — not equal to it. "Closest" still reliably picks the
 * intended node because the vertical separation between two genuinely distinct
 * overlapping nodes (bounded below by the jump envelope's maxRise, ~88px in the
 * calibrated constant) is always far larger than any single sprite's height
 * offset (<=32px for every barrier kind in this game).
 */
export function nodeContaining(nodes, x, y) {
  const candidates = nodes.filter((n) => x >= n.xStart && x <= n.xEnd);
  if (candidates.length <= 1 || y === undefined) return candidates[0];
  return candidates.reduce((best, n) => (Math.abs(n.y - y) < Math.abs(best.y - y) ? n : best));
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
  // is to the left" cases. Overlapping spans (e.g. a platform positioned directly
  // above/within a floor run's x-range — a common, intentional level-design
  // pattern such as level-02's opening staircase) need spanMin = 0 (the player can
  // take off from directly beneath/within toNode, requiring zero horizontal
  // travel) through spanMax = the actual overlap width (the player can also take
  // off from the OTHER end of the shared x-range and travel the full overlap
  // before landing) — NOT spanMax = 0. Any real jump/fall candidate's `reach` is
  // strictly > 0 (roots are filtered by `t > 0` in rootsAndReaches), so pinning
  // spanMax to 0 here would require an impossible exact-zero reach and make every
  // overlapping-span pair permanently unreachable regardless of Δy — this was a
  // confirmed bug (fixed in a follow-up to Plan 23-04) that produced false
  // spawn-goal/gap-width HARD-FAILs on level-02's real, shipped, already-
  // interactively-audited-completable opening staircase.
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
    spanMax = Math.min(fromNode.xEnd, toNode.xEnd) - Math.max(fromNode.xStart, toNode.xStart);
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

  // WR-01 (known, documented limitation — see 23-FINDINGS.md and 23-REVIEW.md):
  // for any hop where dy >= 0 (landing at the same height or lower), rootsAndReaches
  // yields exactly ONE positive-root candidate, and that candidate's `reach` is, by
  // construction, the same value used as `theoreticalMaxReach` above (the larger of
  // the same two roots). So whenever a flat/downward hop is feasible at all,
  // marginRatio evaluates to exactly 1.0 — there is no way for such a hop to ever
  // land below WARN_MARGIN_RATIO and be reported PASS; it is either WARN or has no
  // edge at all. This makes the WARN tier non-discriminating for the common
  // flat/downward case (every flat/downward WARN row across all 4 shipped levels
  // prints marginRatio=1.000) — it cannot distinguish "this gap is trivially easy"
  // from "this gap is nearly the calibrated max." Only dy < 0 (rising) hops, which
  // can yield two distinct positive roots, produce a marginRatio meaningfully below
  // 1.0. Fixing this properly requires computing a real tightness ratio from the
  // *required* distance (spanMin/spanMax) against the reachable range instead of
  // this fixed single-candidate reach — deferred as a larger algorithmic change,
  // not fixed here.
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

/**
 * BFS from `startNodeId` that additionally records, for the first-discovered path
 * to each node, the MAX marginRatio seen along that path (the worst hop on the
 * way) — a straightforward way to answer "is there a path, and how tight is its
 * tightest hop" without solving a full shortest-path optimization (this is a pure
 * connectivity question per 23-RESEARCH.md Pattern 2, not a weighted-shortest-path
 * one). Returns Map<nodeId, maxMarginRatioAlongFirstFoundPath>; startNodeId maps
 * to 0 (no hop needed to reach itself).
 */
function bfsWithPathMargin(graph, startNodeId) {
  const visited = new Map();
  if (!graph.has(startNodeId)) return visited;
  visited.set(startNodeId, 0);
  const queue = [startNodeId];
  while (queue.length > 0) {
    const cur = queue.shift();
    const curMax = visited.get(cur);
    for (const edge of graph.get(cur) ?? []) {
      if (!visited.has(edge.to)) {
        visited.set(edge.to, Math.max(curMax, edge.marginRatio));
        queue.push(edge.to);
      }
    }
  }
  return visited;
}

// Barrier footprint widths, mirroring over-hole-check.mjs's convention — used only
// to make mechanic-reachability descriptors name the offending entity's full
// footprint (per CONTEXT's "offending descriptor" output-format decision), not for
// any reachability arithmetic.
const BARRIER_WIDTH = {
  doors: CONFIG.DOOR.W,
  mathGates: CONFIG.MATH_GATE.W,
  enemies: CONFIG.ENEMY.W,
};

/**
 * Best (lowest) marginRatio for reaching a floating, zero-width `point` (not a
 * footprint-based node) from any node already known reachable from spawn.
 * Consumed by the secret-alcove-reachability (Task 1) and mover-reachability
 * (Task 2) checks below — a point has zero width, unlike doors/mathGates/
 * enemies which anchor to a floor-run footprint, so this needs its own
 * point-vs-jump-reach model rather than reusing `canReach`: calling
 * `canReach(fromNode, {xStart:point.x, xEnd:point.x, y:point.y}, envelope)`
 * pins the overlapping-span branch's `spanMax` to `min(fromEnd,point.x) -
 * max(fromStart,point.x)` = 0 whenever the point sits inside fromNode's own
 * x-span (the common alcove-above-its-own-launch-platform case), requiring an
 * impossible exact-zero reach and reporting every such point unreachable
 * regardless of Δy — see Task 1's rationale, verified by hand against
 * level-01's real, shipped alcove.
 *
 * `point` is `{x, y}`. `nodes` is the full node list (buildNodes output).
 * `spawnPaths` is bfsWithPathMargin's Map<nodeId, maxMarginRatioAlongFirstFoundPath>
 * — the already-computed spawn-reachable set; never re-derived here.
 *
 * For every node already in `spawnPaths`, up to three candidate types are
 * evaluated:
 *
 * (1) Same-surface (trivial-walk): the point sits directly on the node's own
 * surface (`y` within 4px, `x` within the node's span) — no jump needed;
 * candidate marginRatio is just the path-so-far cost to that node.
 *
 * (2) In-footprint hop (a "hop up/down from where I'm already standing"): the
 * point's x falls within this node's own [xStart, xEnd] span but at a
 * different height. `jumpReach(dy, envelope)` returning any candidate at all
 * means the rise/fall is within the calibrated envelope — reusing `jumpReach`
 * (unmodified) purely as the maxRise/maxFall FEASIBILITY gate here, not as an
 * exact horizontal-reach-matching constraint: unlike a footprint-to-footprint
 * landing (where the player must precisely LAND on the target, so the fixed
 * running-jump horizontal-travel model in `jumpReach`'s candidates is exactly
 * right), touching a floating trigger point above/within a surface the player
 * is already standing on is a "hop up and touch it," not a precision landing —
 * real players do not need to time a full-speed running jump to launch from an
 * EXACT x offset from the point. A HARD requirement that some candidate's
 * fixed running-jump reach land the takeoff position exactly within the node's
 * own span was tried first and empirically falsifies real, shipped, human-
 * verified content: level-03's and level-04's alcoves sit only ~30px right of
 * their launch platform's own left edge, but the shortest real running-jump
 * candidate at their ~70px rise needs ~38.5px of horizontal travel — narrower
 * than the platform allows even though the alcove is trivially reachable in
 * actual play (a near-vertical "hop up," not a running jump). marginRatio uses
 * the LOWEST candidate reach's ratio to `theoreticalMaxReach` (still a
 * meaningful WARN-tier tightness signal), combined with the path-so-far cost.
 *
 * (3) Cross-height gap hop (point beyond this node's own far edge, a genuine
 * horizontal gap ahead of the node): this IS a precision-landing scenario (the
 * player must clear real horizontal distance to arrive at the point), so this
 * reuses the same fixed running-jump reach-matching model as (2)'s originally-
 * tried strict form: only candidate reaches whose implied take-off position
 * `point.x - reach` falls within `[n.xStart, n.xEnd]` count.
 */
function bestMarginToPoint(point, nodes, spawnPaths, envelope) {
  let best = null;

  for (const n of nodes) {
    if (!spawnPaths.has(n.id)) continue;
    const pathSoFar = spawnPaths.get(n.id);

    // (1) Same-surface (trivial-walk) candidate — no jump needed at all.
    if (point.x >= n.xStart && point.x <= n.xEnd && Math.abs(point.y - n.y) < 4) {
      if (best === null || pathSoFar < best.marginRatio) best = { marginRatio: pathSoFar };
      continue;
    }

    // Rightward-travel-only model: a point strictly behind this node's near
    // edge is out of scope for a hop launched from this node.
    if (point.x < n.xStart) continue;

    const dy = point.y - n.y;
    const candidates = jumpReach(dy, envelope);
    if (candidates.length === 0) continue;

    // theoreticalMaxReach: identical derivation to canReach's own inlined
    // larger-root quadratic solve at this exact dy — used only as the
    // marginRatio denominator, never as a cutoff.
    const disc = CONFIG.JUMP_FORCE ** 2 + 2 * CONFIG.GRAVITY * dy;
    const sqrtDisc = disc >= 0 ? Math.sqrt(disc) : 0;
    const theoreticalMaxT = Math.max(
      (CONFIG.JUMP_FORCE - sqrtDisc) / CONFIG.GRAVITY,
      (CONFIG.JUMP_FORCE + sqrtDisc) / CONFIG.GRAVITY,
      0
    );
    const theoreticalMaxReach = envelope.runSpeed * theoreticalMaxT;

    let hopMargin = null;
    if (point.x <= n.xEnd) {
      // (2) In-footprint hop — the rise/fall being within jumpReach's feasible
      // range is sufficient; take the lowest (tightest, most WARN-informative)
      // candidate ratio.
      for (const { reach } of candidates) {
        const marginRatio = theoreticalMaxReach > 0 ? reach / theoreticalMaxReach : 0;
        if (hopMargin === null || marginRatio < hopMargin) hopMargin = marginRatio;
      }
    } else {
      // (3) Cross-height gap hop — precision-landing: the implied take-off
      // position must fall within this node's own footprint.
      for (const { reach } of candidates) {
        const x0 = point.x - reach;
        if (x0 >= n.xStart && x0 <= n.xEnd) {
          const marginRatio = theoreticalMaxReach > 0 ? reach / theoreticalMaxReach : 0;
          if (hopMargin === null || marginRatio < hopMargin) hopMargin = marginRatio;
        }
      }
    }
    if (hopMargin === null) continue;

    const combined = Math.max(pathSoFar, hopMargin);
    if (best === null || combined < best.marginRatio) best = { marginRatio: combined };
  }

  return best;
}

/**
 * Compose buildNodes/buildGraph/bfsReachableSet into the three ROADMAP-named
 * checks: spawn-goal, gap-width, mechanic-reachability. Returns
 * { rows: [{check, status, descriptor}], hardFailCount }.
 *
 * HARD-FAIL: exact graph-connectivity fact (no path exists) or a barrier/goal not
 * on any floor run. WARN: a path exists but its tightest hop used
 * >= WARN_MARGIN_RATIO of the calibrated envelope. PASS: otherwise. WARN rows
 * never increment hardFailCount.
 */
export function checkLevelReachability(geometry, envelope = JUMP_ENVELOPE) {
  const nodes = buildNodes(geometry);
  const graph = buildGraph(nodes, envelope);
  const rows = [];

  const floorNodes = nodes.filter((n) => n.id.startsWith("floor-"));
  const spawnNode = nodeContaining(nodes, SPAWN_X);
  const spawnPaths = spawnNode ? bfsWithPathMargin(graph, spawnNode.id) : new Map();

  // --- spawn-goal ---
  const goalX = geometry.goal?.x;
  // WR-02: pass geometry.goal.y through so nodeContaining can disambiguate an
  // overlapping floor/platform pair at the same x (its own documented purpose for
  // the y parameter) — e.g. a goal placed on an elevated platform that overlaps a
  // floor run's x-range. Omitting y previously "worked" only by accident, because
  // buildNodes always pushes floor nodes before platform nodes.
  const goalNode = goalX !== undefined ? nodeContaining(nodes, goalX, geometry.goal.y) : undefined;
  if (!goalNode || !spawnPaths.has(goalNode.id)) {
    rows.push({
      check: "spawn-goal",
      status: "HARD-FAIL",
      descriptor: `goal x:${goalX ?? "undefined"} unreachable from spawn`,
    });
  } else {
    const margin = spawnPaths.get(goalNode.id);
    rows.push({
      check: "spawn-goal",
      status: margin >= WARN_MARGIN_RATIO ? "WARN" : "PASS",
      descriptor: `goal x:${goalX} reached via ${goalNode.id} (marginRatio=${margin.toFixed(3)})`,
    });
  }

  // --- gap-width: every pair of x-adjacent floor runs ---
  const sortedFloors = [...floorNodes].sort((a, b) => a.xStart - b.xStart);
  for (let i = 0; i < sortedFloors.length - 1; i++) {
    const a = sortedFloors[i];
    const b = sortedFloors[i + 1];
    const pathsFromA = bfsWithPathMargin(graph, a.id);
    const pathsFromB = bfsWithPathMargin(graph, b.id);
    const candidates = [pathsFromA.get(b.id), pathsFromB.get(a.id)].filter(
      (m) => m !== undefined
    );
    if (candidates.length === 0) {
      rows.push({
        check: "gap-width",
        status: "HARD-FAIL",
        descriptor: `gap ${a.xEnd}..${b.xStart} between ${a.id} and ${b.id} unreachable`,
      });
    } else {
      const best = Math.min(...candidates);
      rows.push({
        check: "gap-width",
        status: best >= WARN_MARGIN_RATIO ? "WARN" : "PASS",
        descriptor: `gap ${a.xEnd}..${b.xStart} between ${a.id} and ${b.id} (marginRatio=${best.toFixed(3)})`,
      });
    }
  }

  // --- mechanic-reachability: doors / mathGates / enemies ---
  for (const kind of ["doors", "mathGates", "enemies"]) {
    for (const e of geometry[kind] ?? []) {
      const w = BARRIER_WIDTH[kind];
      // CR-03: require BOTH the barrier's near edge (e.x) AND its far edge
      // (e.x + w) to land on the SAME floor node, mirroring CR-01's fix in
      // over-hole-check.mjs. Checking only e.x let a barrier whose footprint
      // extends past the end of its floor run into an adjacent gap report PASS
      // here even when over-hole-check.mjs's own coverage for that kind was
      // missing or masked — this is deliberate defense-in-depth, not redundant
      // with over-hole-check.mjs, since the two modules can be run/consumed
      // independently.
      const node = nodeContaining(floorNodes, e.x);
      const endNode = nodeContaining(floorNodes, e.x + w);
      if (!node || !endNode || node.id !== endNode.id) {
        rows.push({
          check: "mechanic-reachability",
          status: "HARD-FAIL",
          descriptor: `${kind} x:${e.x}..${e.x + w} not fully supported by any single floor run`,
        });
        continue;
      }
      const reachable = spawnPaths.has(node.id);
      rows.push({
        check: "mechanic-reachability",
        status: reachable ? "PASS" : "HARD-FAIL",
        descriptor: reachable
          ? `${kind} x:${e.x}..${e.x + w} on ${node.id} reachable from spawn`
          : `${kind} x:${e.x}..${e.x + w} on ${node.id} not reachable from spawn`,
      });
    }
  }

  // --- secret-alcove-reachability: floating, zero-width bonus points (MECH-04
  // static half). HARD-FAIL for an unreachable alcove — matches this project's
  // exact-fact HARD-FAIL convention for any unreachable entity (30-CONTEXT.md
  // locked decision), not the WARN tier (WARN never fails, which would defeat
  // the RED-first proof requirement). `?? []`-guarded: an omitted
  // geometry.secretAlcove produces zero rows, never throws.
  for (const [i, a] of (geometry.secretAlcove ?? []).entries()) {
    const result = bestMarginToPoint({ x: a.x, y: a.y }, nodes, spawnPaths, envelope);
    if (result === null) {
      rows.push({
        check: "secret-alcove-reachability",
        status: "HARD-FAIL",
        descriptor: `secretAlcove[${i}] x:${a.x} y:${a.y} unreachable from spawn`,
      });
    } else {
      rows.push({
        check: "secret-alcove-reachability",
        status: result.marginRatio >= WARN_MARGIN_RATIO ? "WARN" : "PASS",
        descriptor: `secretAlcove[${i}] x:${a.x} y:${a.y} reached (marginRatio=${result.marginRatio.toFixed(3)})`,
      });
    }
  }

  const hardFailCount = rows.filter((r) => r.status === "HARD-FAIL").length;
  return { rows, hardFailCount };
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

  // --- Task 1 behavior cases ---

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
  // returns [] for that Δy (no candidate reach at all, at any distance), so
  // canReach returns null regardless of horizontal distance, even when the x
  // spans overlap — this case never reaches the overlap-span arithmetic at all
  // (jumpReach's maxRise guard short-circuits first), so it's independent of
  // Case 3b below.
  {
    const dy = -(testEnvelope.maxRise + 50); // well beyond maxRise
    const reach = jumpReach(dy, testEnvelope);
    check(Array.isArray(reach) && reach.length === 0, `expected [] for dy beyond maxRise, got ${JSON.stringify(reach)}`);

    const from = { id: "floor-0", xStart: 0, xEnd: 100, y: 320 };
    const to = { id: "platform-0", xStart: 40, xEnd: 60, y: 320 + dy }; // overlapping x, too high
    const result = canReach(from, to, testEnvelope);
    check(result === null, `expected null for an over-maxRise platform even with overlapping x, got ${JSON.stringify(result)}`);
  }

  // Case 3b (regression — fixed in a follow-up to Plan 23-04): two nodes with
  // OVERLAPPING x-spans and a real, small, well-within-envelope dy — a floor run
  // 0..520 at y:320 and a platform 280..440 at y:240 (dy=-80, comfortably within
  // testEnvelope.maxRise=88.331) — mirrors level-02's real opening-staircase
  // geometry (floor-0 -> platform-0). Before the fix, the overlap branch pinned
  // spanMax to 0, requiring an impossible exact-zero reach, so this ALWAYS
  // returned null regardless of dy — this is the regression case that was
  // previously completely untested (no prior case here constructs two nodes whose
  // x-spans actually overlap AND have a reachable dy). Must return non-null.
  {
    const floor0 = { id: "floor-0", xStart: 0, xEnd: 520, y: 320 };
    const platform0 = { id: "platform-0", xStart: 280, xEnd: 440, y: 240 };
    const result = canReach(floor0, platform0, testEnvelope);
    check(
      result !== null,
      `expected non-null feasibility for an overlapping-x-span platform with dy=-80 (well within maxRise), got ${JSON.stringify(result)}`
    );
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

  // --- Task 2 behavior cases ---

  // Case A: no path at all from spawn to goal -> spawn-goal HARD-FAIL, hardFailCount >= 1.
  {
    const geometry = {
      floors: [
        { x: 0, w: 100 }, // spawn (x:64) sits here
        { x: 900, w: 100 }, // isolated — far beyond any hop from floor-0
      ],
      goal: { x: 950, y: 320 },
    };
    const { rows, hardFailCount } = checkLevelReachability(geometry, testEnvelope);
    const spawnGoalRow = rows.find((r) => r.check === "spawn-goal");
    check(spawnGoalRow?.status === "HARD-FAIL", `expected spawn-goal HARD-FAIL for an unreachable goal, got ${JSON.stringify(spawnGoalRow)}`);
    check(hardFailCount >= 1, `expected hardFailCount >= 1, got ${hardFailCount}`);
  }

  // Case B: spawn CAN reach goal but only via a hop whose marginRatio >= WARN_MARGIN_RATIO
  // -> spawn-goal WARN, does NOT increment hardFailCount.
  {
    // A same-y gap sized so the only candidate reach sits just under the envelope's
    // full flat-Δy reach, giving marginRatio close to (but below) 1 and >= 0.9.
    const flatT = 2 * CONFIG.JUMP_FORCE / CONFIG.GRAVITY;
    const maxFlatReach = testEnvelope.runSpeed * flatT;
    const tightGapWidth = Math.floor(maxFlatReach * 0.95); // >=90% of full envelope reach
    const geometry = {
      floors: [
        { x: 0, w: 100 }, // spawn sits here
        { x: 100 + tightGapWidth, w: 200 },
      ],
      goal: { x: 100 + tightGapWidth + 50, y: 320 },
    };
    const { rows, hardFailCount: hfBefore } = checkLevelReachability(geometry, testEnvelope);
    const spawnGoalRow = rows.find((r) => r.check === "spawn-goal");
    check(spawnGoalRow?.status === "WARN", `expected spawn-goal WARN for a tight-margin hop, got ${JSON.stringify(spawnGoalRow)}`);
    const hardFailFromSpawnGoal = spawnGoalRow?.status === "HARD-FAIL" ? 1 : 0;
    check(hardFailFromSpawnGoal === 0, "a WARN spawn-goal row must never count toward hardFailCount");
    check(hfBefore === 0, `expected hardFailCount === 0 for an otherwise-clean tight-but-passable level, got ${hfBefore}`);
  }

  // Case C: a mathGate whose x is not contained by any floor-run node's span ->
  // mechanic-reachability HARD-FAIL.
  {
    const geometry = {
      floors: [{ x: 0, w: 200 }],
      mathGates: [{ x: 500, y: 256 }], // 500 is nowhere near the single 0..200 floor run
      goal: { x: 150, y: 320 },
    };
    const { rows } = checkLevelReachability(geometry, testEnvelope);
    const gateRow = rows.find((r) => r.check === "mechanic-reachability");
    check(gateRow?.status === "HARD-FAIL", `expected mechanic-reachability HARD-FAIL for a mathGate off any floor run, got ${JSON.stringify(gateRow)}`);
  }

  // Case D: a fully-connected, well-supported synthetic level -> rows span exactly
  // the three check names, hardFailCount === 0.
  {
    const geometry = {
      floors: [
        { x: 0, w: 200 }, // spawn sits here
        { x: 300, w: 200 }, // 100px gap, well within the envelope
      ],
      mathGates: [{ x: 350, y: 256 }],
      goal: { x: 450, y: 320 },
    };
    const { rows, hardFailCount } = checkLevelReachability(geometry, testEnvelope);
    const checkNames = new Set(rows.map((r) => r.check));
    check(
      checkNames.size === 3 &&
        checkNames.has("spawn-goal") &&
        checkNames.has("gap-width") &&
        checkNames.has("mechanic-reachability"),
      `expected exactly the 3 check names, got ${JSON.stringify([...checkNames])}`
    );
    check(hardFailCount === 0, `expected hardFailCount === 0 for a fully-connected well-supported level, got ${hardFailCount}`);
    check(
      rows.every((r) => typeof r.descriptor === "string" && r.descriptor.length > 0),
      "every row must carry a non-empty descriptor string"
    );
  }

  // Additional Task 2 acceptance check: mechanic-reachability loop is ?? []-guarded
  // — an omitted doors/mathGates/enemies array produces zero rows, no throw.
  {
    const geometry = { floors: [{ x: 0, w: 200 }], goal: { x: 100, y: 320 } };
    let threw = false;
    let result;
    try {
      result = checkLevelReachability(geometry, testEnvelope);
    } catch {
      threw = true;
    }
    check(!threw, "checkLevelReachability must never throw when doors/mathGates/enemies are all omitted");
    const mechRows = result?.rows.filter((r) => r.check === "mechanic-reachability") ?? [];
    check(mechRows.length === 0, `expected zero mechanic-reachability rows when all barrier arrays are omitted, got ${mechRows.length}`);
  }

  // --- Task 1 (bestMarginToPoint / secret-alcove-reachability) behavior cases ---

  // Case E: bestMarginToPoint against a level-01-shaped node set (floor-0 +
  // platform-0 at {xStart:360, xEnd:520, y:240}, mirroring the real, shipped
  // level-01 alcove {x:400, y:170}) -> non-null.
  {
    const floor0 = { id: "floor-0", xStart: 0, xEnd: 560, y: 320 };
    const platform0 = { id: "platform-0", xStart: 360, xEnd: 520, y: 240 };
    const nodes = [floor0, platform0];
    const graph = buildGraph(nodes, testEnvelope);
    const spawnPaths = bfsWithPathMargin(graph, "floor-0");
    const result = bestMarginToPoint({ x: 400, y: 170 }, nodes, spawnPaths, testEnvelope);
    check(result !== null, `expected non-null for the level-01-shaped alcove point, got ${JSON.stringify(result)}`);
  }

  // Case F: bestMarginToPoint against a point requiring a 200px rise (exceeding
  // testEnvelope.maxRise=88.331) -> null (jumpReach's maxRise guard short-circuits).
  {
    const floor0 = { id: "floor-0", xStart: 0, xEnd: 400, y: 320 };
    const nodes = [floor0];
    const graph = buildGraph(nodes, testEnvelope);
    const spawnPaths = bfsWithPathMargin(graph, "floor-0");
    const result = bestMarginToPoint({ x: 150, y: 120 }, nodes, spawnPaths, testEnvelope);
    check(result === null, `expected null for a point requiring a 200px rise beyond maxRise, got ${JSON.stringify(result)}`);
  }

  // Case G: bestMarginToPoint against a point on the SAME floor at the SAME y
  // as spawn -> non-null via the same-surface (trivial-walk) branch, marginRatio
  // equal to that floor node's own spawnPaths margin (0 for the spawn floor).
  {
    const floor0 = { id: "floor-0", xStart: 0, xEnd: 400, y: 320 };
    const nodes = [floor0];
    const graph = buildGraph(nodes, testEnvelope);
    const spawnPaths = bfsWithPathMargin(graph, "floor-0");
    const result = bestMarginToPoint({ x: 150, y: 320 }, nodes, spawnPaths, testEnvelope);
    check(result !== null, `expected non-null for a same-floor same-y point, got ${JSON.stringify(result)}`);
    check(result?.marginRatio === 0, `expected marginRatio===0 (spawn floor's own path-so-far cost), got ${JSON.stringify(result)}`);
  }

  // Case H: checkLevelReachability with a secretAlcove entry comfortably inside
  // jump range -> exactly one secret-alcove-reachability row, status PASS or
  // WARN, never HARD-FAIL.
  {
    const geometry = {
      floors: [{ x: 0, w: 560 }],
      platforms: [{ x: 360, y: 240, w: 160, h: 24 }],
      goal: { x: 100, y: 320 },
      secretAlcove: [{ x: 400, y: 170 }],
    };
    const { rows } = checkLevelReachability(geometry, testEnvelope);
    const alcoveRows = rows.filter((r) => r.check === "secret-alcove-reachability");
    check(alcoveRows.length === 1, `expected exactly 1 secret-alcove-reachability row, got ${alcoveRows.length}`);
    check(
      alcoveRows[0]?.status === "PASS" || alcoveRows[0]?.status === "WARN",
      `expected PASS or WARN for an in-range alcove, got ${JSON.stringify(alcoveRows[0])}`
    );
  }

  // Case I: checkLevelReachability with a secretAlcove entry requiring an
  // impossible rise -> exactly one row, status HARD-FAIL.
  {
    const geometry = {
      floors: [{ x: 0, w: 400 }],
      goal: { x: 100, y: 320 },
      secretAlcove: [{ x: 150, y: 120 }],
    };
    const { rows } = checkLevelReachability(geometry, testEnvelope);
    const alcoveRows = rows.filter((r) => r.check === "secret-alcove-reachability");
    check(alcoveRows.length === 1, `expected exactly 1 secret-alcove-reachability row, got ${alcoveRows.length}`);
    check(alcoveRows[0]?.status === "HARD-FAIL", `expected HARD-FAIL for an unreachable alcove, got ${JSON.stringify(alcoveRows[0])}`);
  }

  // Case J: checkLevelReachability with geometry.secretAlcove omitted -> zero
  // secret-alcove-reachability rows, never throws.
  {
    const geometry = { floors: [{ x: 0, w: 400 }], goal: { x: 100, y: 320 } };
    let threw = false;
    let result;
    try {
      result = checkLevelReachability(geometry, testEnvelope);
    } catch {
      threw = true;
    }
    check(!threw, "checkLevelReachability must never throw when geometry.secretAlcove is omitted");
    const alcoveRows = result?.rows.filter((r) => r.check === "secret-alcove-reachability") ?? [];
    check(alcoveRows.length === 0, `expected zero secret-alcove-reachability rows when omitted, got ${alcoveRows.length}`);
  }

  if (failures > 0) {
    console.error(`reachability-selftest: FAIL — ${failures} assertion(s) failed`);
    process.exit(1);
  }
  console.log("reachability-selftest: PASS");
}
