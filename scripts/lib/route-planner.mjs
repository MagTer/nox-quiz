// scripts/lib/route-planner.mjs — geometry-informed jump planning for the Phase 21
// interactive mechanic audit (Phase 24 close-out fix).
//
// WHY THIS EXISTS (root cause of the Phase 24 audit failures): the previous driver
// model (mechanic-drive.mjs's driveToXClimbing) pressed Space on EVERY grounded tick.
// That blind bunny-hopping had three systemic failure modes, all confirmed empirically
// against the Phase-24-lengthened levels:
//   1. It flies OVER ground-level checkpoint markers (rect(8,48) at FLOOR_Y-48), so a
//      later fall-death respawns the player at the level START instead of the last
//      checkpoint, converting one missed jump into an infinite start-to-gap loop.
//   2. Its fixed poll/hold cadence launches jumps from effectively the same x positions
//      every run, so marginal jumps (level-01's gap-2 platform needs ~88px of rise
//      against the calibrated ~88.3px envelope ceiling) fail DETERMINISTICALLY — the
//      retry wrapper's OR-across-attempts premise (failures are stochastic) never
//      applies, and 5 attempts just quintuple the wasted time.
//   3. A stuck encounter burns maxIterations × 5 attempts of wall-clock, pushing the
//      whole audit past any sane `timeout`, whose SIGTERM then surfaces as a misleading
//      "Target page, context or browser has been closed" Playwright rejection (Playwright
//      closes the browser from its own SIGTERM handler) — previously misread as a
//      hardware/GPU/browser-stability problem.
//
// THE FIX: walk by default, jump only at PLANNED takeoff points derived from the same
// level.geometry the structural validator (scripts/lib/reachability.mjs) already
// models. Walking keeps the player at floor level, so checkpoints/collect-zones/gates
// trigger naturally (this also retires the warmupUntilFirstGap special case as a
// class); planned takeoffs make every jump launch from a position chosen for maximum
// margin instead of by cadence luck. Route selection reuses reachability.mjs's
// feasibility graph (buildNodes/buildGraph — NEVER re-derived here) and picks the
// minimax-bottleneck path: the path whose TIGHTEST hop is loosest, so a razor-thin
// direct gap jump loses to a comfortable platform chain when one exists.
//
// PURE module: no Playwright, no engine globals — consumed by mechanic-drive.mjs's
// driveToXPlanned, testable standalone via its self-test (run this file directly).

import { fileURLToPath } from "url";

import { CONFIG } from "../../src/config.js";
import { JUMP_ENVELOPE } from "./jump-envelope.mjs";
import { buildNodes, buildGraph, nodeContaining, SPAWN_X } from "./reachability.mjs";

// MEASURED in-engine physics (arc probe, 2026-07-06, in-page 8ms sampling of a full
// held-ArrowRight jump on the real running game): flight time 743.5ms (matches the
// theoretical 2·JUMP_FORCE/GRAVITY exactly), max rise 91.7px (vs 96.6 theoretical —
// frame quantization), and — the load-bearing number — effective AIRBORNE horizontal
// speed ≈ 210 px/s, NOT CONFIG.RUN_SPEED's 240. Full-jump horizontal range is
// therefore ~156px: a 160px flat gap is crossable ONLY from the last few px before
// the lip (player width 16px provides the landing overlap), extended forward by
// CONFIG.COYOTE_MS (100ms ≈ 21px of grace past the lip). These constants drive
// takeoff placement; feasibility still comes exclusively from reachability.mjs.
const AIR_SPEED = 210;
const APEX_DIST = Math.round(AIR_SPEED * (CONFIG.JUMP_FORCE / CONFIG.GRAVITY)); // ≈78px

// Mount offsets place the platform's leading edge near the arc's apex (high rises
// need every px of the measured 91.7 max rise) or slightly earlier for gentle rises
// (crossing sooner lands deeper inside the platform's span). Crossing while
// DESCENDING is what the old driver was observed to do — feet a few px below the
// platform top at the leading edge, clipping into the gap beneath. The offsets
// account for the driver's fire window (it may fire up to ~16-20px AFTER the mark):
// even the latest fire must still cross the edge with positive clearance, and even
// the earliest fire must land within the platform's span (80px-wide platforms with
// 70px rises land 51-71px past the edge with these values).
const MOUNT_OFFSET_HIGH = APEX_DIST; // rise >= 76px: cross AT apex on the earliest fire
const MOUNT_OFFSET_LOW = 68; // gentler rises: cross rising, land mid-span

// Gap (flat/descending) takeoff mark sits 2px PAST the lip — the jump deliberately
// fires in the engine's coyote window (CONFIG.COYOTE_MS = 100ms ≈ 21px of grace
// after walking off the lip). Empirically this is the ONLY reliable way to clear a
// 160px gap with the measured 156px arc: firing while still grounded a few px
// before the lip makes the arc's descending tail reach the far floor's corner with
// ~0px of vertical clearance (feet at floor-top height exactly at the far edge —
// observed corner-clipping into the gap deterministically), while a coyote fire
// 2-18px past the lip shifts the whole arc forward, crossing the far corner ~35px
// above it and landing well inside the far floor's span.
const GAP_COYOTE_MARK = 2;

// Spike hops launch this many px before the spike; the arc clears the 16px spike tile
// (8px tall hitbox) anywhere from ~7px to ~150px past takeoff, so 52px of lead puts
// the spike comfortably mid-arc.
const SPIKE_OFFSET = 52;

// Two takeoffs closer than this are merged (a single jump covers both); kept by
// priority: mount > gap > spike, then smaller x.
const DEDUPE_PX = 34;
const PRIORITY = { mount: 0, gap: 1, spike: 2 };

/**
 * Tightness cost (0..1+) for a feasibility edge, used ONLY for route choice —
 * feasibility itself always comes from reachability.mjs's canReach-built graph.
 * riseTight: how much of the calibrated max rise this hop consumes.
 * horizTight: required horizontal clearance vs the max reach available at this Δy.
 * Leftward edges get a heavy penalty: the audit driver only ever travels right.
 */
function edgeCost(from, to, envelope) {
  const dy = to.y - from.y;
  const rise = Math.max(0, -dy);
  const riseTight = rise / envelope.maxRise;

  let spanMin;
  if (to.xStart >= from.xEnd) spanMin = to.xStart - from.xEnd;
  else if (to.xEnd <= from.xStart) return 2; // leftward — deprioritize hard
  else spanMin = 0;

  let horizTight = 0;
  if (spanMin > 0) {
    const disc = CONFIG.JUMP_FORCE ** 2 + 2 * CONFIG.GRAVITY * dy;
    const t = disc >= 0 ? (CONFIG.JUMP_FORCE + Math.sqrt(disc)) / CONFIG.GRAVITY : 0;
    const maxReach = envelope.runSpeed * t;
    horizTight = maxReach > 0 ? spanMin / maxReach : 1;
  }

  return Math.max(riseTight, horizTight);
}

/**
 * Minimax-bottleneck path from startId to goalId over `graph` (adjacency from
 * reachability.mjs's buildGraph): among all paths, pick one minimizing the MAXIMUM
 * edge cost along it (ties broken by fewer hops). Small graphs (<20 nodes), so a
 * simple O(V·E) relaxation loop is plenty. Returns an ordered array of node objects
 * (start..goal inclusive), or null if unreachable.
 */
function bottleneckPath(nodes, graph, startId, goalId, envelope) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const best = new Map(); // id -> { cost, hops, prev }
  best.set(startId, { cost: 0, hops: 0, prev: null });

  let changed = true;
  while (changed) {
    changed = false;
    for (const [fromId, edges] of graph) {
      const cur = best.get(fromId);
      if (!cur) continue;
      for (const { to } of edges) {
        const c = Math.max(cur.cost, edgeCost(byId.get(fromId), byId.get(to), envelope));
        const prev = best.get(to);
        if (!prev || c < prev.cost - 1e-9 || (Math.abs(c - prev.cost) < 1e-9 && cur.hops + 1 < prev.hops)) {
          best.set(to, { cost: c, hops: cur.hops + 1, prev: fromId });
          changed = true;
        }
      }
    }
  }

  if (!best.has(goalId)) return null;
  const path = [];
  for (let id = goalId; id !== null; id = best.get(id).prev) path.push(byId.get(id));
  return path.reverse();
}

/**
 * Plan the ordered takeoff list for driving from spawn to `targetX`.
 *
 * Returns { takeoffs, path } where takeoffs is ascending-x sorted:
 *   { x, kind: "mount"|"gap"|"spike", fromY }
 * `fromY` is the y (surface top) of the surface this takeoff launches FROM. The
 * driver only fires a takeoff when the player's feet are at that height — so a
 * MISSED mount earlier in the chain can never cascade into firing later takeoffs
 * that were planned for a different surface (e.g. a lip jump planned from a raised
 * platform must not fire from the floor beneath it), and a spike hop must never
 * interrupt a platform-chain traversal happening overhead.
 *
 * Position-based and stateless: the driver re-matches takeoffs against the live player
 * x every tick, so a death/respawn behind a takeoff self-heals (the player walks back
 * into the same window and re-executes it).
 */
export function planTakeoffs(geometry, targetX, envelope = JUMP_ENVELOPE) {
  const nodes = buildNodes(geometry);
  const graph = buildGraph(nodes, envelope);
  const startNode = nodeContaining(nodes, SPAWN_X);
  const targetNode = nodeContaining(nodes, targetX); // floors listed first — mechanics are floor-mounted
  if (!startNode || !targetNode) return { takeoffs: [], path: null };

  const path = bottleneckPath(nodes, graph, startNode.id, targetNode.id, envelope);
  if (!path) return { takeoffs: [], path: null };

  const takeoffs = [];

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const rise = Math.max(0, from.y - to.y);

    if (rise > 12) {
      // Mount: cross the leading edge while rising, near apex for high rises.
      const offset = rise >= 76 ? MOUNT_OFFSET_HIGH : MOUNT_OFFSET_LOW;
      let x = to.xStart - offset;
      x = Math.min(x, from.xEnd - 4); // never past the takeoff surface's own lip
      x = Math.max(x, from.xStart + 4);
      takeoffs.push({ x, kind: "mount", fromY: from.y });
    } else if (to.xStart > from.xEnd + 4) {
      // Flat/descending across a real gap: coyote jump just past the lip.
      takeoffs.push({ x: from.xEnd + GAP_COYOTE_MARK, kind: "gap", fromY: from.y });
    }
    // else: descending onto an overlapping/touching lower surface — just walk off.
  }

  // Spike hops for every spike on a path FLOOR node before the target. fromY pins
  // them to floor level so a platform-chain pass overhead never triggers them.
  const pathFloorIds = new Set(path.filter((n) => n.id.startsWith("floor-")).map((n) => n.id));
  for (const spike of geometry.spikes ?? []) {
    if (spike.x >= targetX - 8) continue;
    const node = nodeContaining(
      nodes.filter((n) => n.id.startsWith("floor-")),
      spike.x
    );
    if (node && pathFloorIds.has(node.id)) {
      takeoffs.push({ x: spike.x - SPIKE_OFFSET, kind: "spike", fromY: CONFIG.FLOOR_Y });
    }
  }

  // Sort, then dedupe near-coincident takeoffs by priority (mount > gap > spike).
  takeoffs.sort((a, b) => a.x - b.x || PRIORITY[a.kind] - PRIORITY[b.kind]);
  const deduped = [];
  for (const t of takeoffs) {
    const last = deduped[deduped.length - 1];
    if (last && t.x - last.x < DEDUPE_PX) {
      if (PRIORITY[t.kind] < PRIORITY[last.kind]) deduped[deduped.length - 1] = t;
      continue;
    }
    deduped.push(t);
  }

  // Suppress SAME-NODE jumps landing us on/past the target trigger (sailing over a
  // 32px-wide gate mid-arc records a false "unreached"). Cross-gap/mount takeoffs are
  // never suppressed (they're mandatory to get there at all); spike hops are never
  // suppressed (walking into a spike is a guaranteed respawn loop).
  const filtered = deduped.filter((t) => {
    if (t.kind === "spike") return true;
    if (t.x <= targetX - 130) return true;
    const tNode = nodeContaining(nodes, t.x);
    return !(tNode && tNode.id === targetNode.id);
  });

  return { takeoffs: filtered, path };
}

// --- Self-test (runs only when executed directly) — smoke-progress.mjs idiom ---
const isMain = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  let failures = 0;
  const check = (cond, msg) => {
    console.assert(cond, msg);
    if (!cond) failures++;
  };

  // Synthetic level mirroring level-01's opening: floor 0..560, platform chain over
  // the 560..720 gap (p1 360..520 y240 rise 80, p2 560..688 y192), floor 720..1200,
  // spike at 880, target at 1000.
  const geometry = {
    floors: [
      { x: 0, w: 560 },
      { x: 720, w: 480 },
    ],
    platforms: [
      { x: 360, y: 240, w: 160, h: 24 },
      { x: 560, y: 192, w: 128, h: 24 },
    ],
    spikes: [{ x: 880, y: 304 }],
  };

  const { takeoffs, path } = planTakeoffs(geometry, 1000);
  check(path !== null, "expected a path from spawn to targetX=1000");
  check(takeoffs.length >= 2, `expected at least 2 takeoffs (chain + spike hop), got ${JSON.stringify(takeoffs)}`);
  check(
    takeoffs.every((t, i) => i === 0 || t.x >= takeoffs[i - 1].x),
    "takeoffs must be ascending-x sorted"
  );
  const spikeHop = takeoffs.find((t) => t.kind === "spike");
  check(spikeHop && spikeHop.x === 880 - 52 && spikeHop.fromY === 320, `expected a floor-level spike hop at 828, got ${JSON.stringify(spikeHop)}`);
  check(takeoffs.every((t) => typeof t.fromY === "number"), "every takeoff must carry its launch surface's fromY");

  // A target on the first floor with no gaps/spikes before it → zero takeoffs (pure walk).
  const { takeoffs: walkOnly } = planTakeoffs({ floors: [{ x: 0, w: 560 }], platforms: [], spikes: [] }, 300);
  check(walkOnly.length === 0, `expected zero takeoffs for a flat walk, got ${JSON.stringify(walkOnly)}`);

  // Unreachable target (isolated far floor) → null path, empty takeoffs.
  const { takeoffs: none, path: noPath } = planTakeoffs(
    { floors: [{ x: 0, w: 100 }, { x: 2000, w: 100 }], platforms: [], spikes: [] },
    2050
  );
  check(noPath === null && none.length === 0, "expected null path for an unreachable target");

  if (failures > 0) {
    console.error(`route-planner-selftest: FAIL — ${failures} assertion(s) failed`);
    process.exit(1);
  }
  console.log("route-planner-selftest: PASS");
}
