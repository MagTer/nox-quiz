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

// Plan 25-07 fix: the coyote-timed fire above is fragile against Playwright's own
// read-then-act round-trip latency, which can itself approach CONFIG.COYOTE_MS's
// ~100ms window — confirmed empirically (level-03's gap-2, whose would-be stepping
// platform sits at a 96px rise just past the calibrated maxRise, so no mount route
// exists and this gap MUST cross via the direct flat jump): firing while STILL
// GROUNDED a few px before the lip works reliably (matching the much wider timing
// tolerance already proven for spike hops, which fire while comfortably grounded)
// whenever the gap has enough range margin below the ~156px full-flat-jump ceiling
// that undershooting is not a risk — this project's own documented corner-clip
// pitfall (the comment above) only applies to gaps NEAR that ceiling (e.g. the
// 160px case), not comfortably-smaller ones (e.g. this game's typical ~120-140px
// gaps). Only gaps within EARLY_LEAD_MARGIN of the ceiling keep the tight coyote
// mark, since early-firing them risks exactly the corner-clip this project already
// found and fixed once.
const MAX_FLAT_RANGE = AIR_SPEED * ((2 * CONFIG.JUMP_FORCE) / CONFIG.GRAVITY); // ~156px
const EARLY_LEAD_MARGIN = 30; // px of slack below MAX_FLAT_RANGE required to fire early
const EARLY_LEAD_PX = 15; // how far before the lip to fire when margin allows it

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

// Plan 25-07 fix: reachability.mjs's graph treats every (from, to) node pair as an
// independent boolean feasibility fact — it has no concept of a THIRD node's solid
// footprint physically blocking a "shortcut" edge between two others. That is exactly
// correct for the validator's pure connectivity question (VALID-01 only needs to know
// a path EXISTS), but wrong for THIS driver, which actually EXECUTES the jump: every
// takeoff this driver fires is a held-Space press for jumpHoldMs (450ms, well past
// apex), producing the SAME near-maximum-height arc every time — there is no partial-
// height jump input here. So a flat (same-height) hop between two floor nodes, when an
// elevated platform's x-span sits inside that gap at a rise the arc's ascent phase
// reaches, is landed ON (or bonked into) instead of sailed over, even though
// reachability.mjs correctly reports the direct edge as graph-feasible in isolation.
// Discovered empirically (Plan 25-07's full 8-level audit run): level-01's gap-2
// (1200..1360, platform 1208..1360 at y:232) and level-07's gap-1 (460..600, platform
// 500..612 at y:255) both pair a short, directly-jumpable gap with a bridging
// stepping-stone platform occupying the same airspace — the bottleneck-cost path
// picked the cheaper direct edge, and the arc collided with the platform mid-flight,
// carrying the player OVER the ground-level checkpoint just past the gap (checkpoints
// are only 48px tall, well below an elevated platform's underside) and into the next
// hazard with no checkpoint touched — a full-restart death loop, not a resolvable
// timing flake.
//
// Fix is scoped to TAKEOFF GENERATION only (never the graph/path used for
// reachability, which stays exactly reachability.mjs's own proven fact) — a first
// attempt that instead removed the obstructed edge from the graph broke pathfinding
// outright, because reachability.mjs's overlapping-span model has its own separate,
// already-documented limitation (STATE.md's marginRatio WARN-tier precision gap) that
// leaves some platform->floor "step down onto the wider floor below" edges missing
// entirely; blindly excluding the direct edge left no path at all. Instead, when the
// PATH bottleneckPath already chose contains a flat hop whose real flight corridor is
// obstructed, insert a "mount" takeoff onto that obstacle (using the exact same
// mount-offset math as a real path-included platform) — descending off the far edge
// afterward needs no extra takeoff, it is the same natural gravity walk-off already
// used for every other "descending onto an overlapping/touching lower surface" case
// below. This never touches reachability.mjs, buildGraph, or bottleneckPath — the
// chosen path and its overall feasibility are untouched; only how the flat leg of that
// path gets DRIVEN changes.
const FLAT_EDGE_RISE_TOLERANCE = 12; // matches the mount-vs-gap rise threshold used below

/**
 * Find the platform node (if any) whose solid footprint physically sits inside the
 * open-air gap between `from` and `to`, at a rise the jump envelope's arc actually
 * reaches — i.e. a real mid-flight obstruction for a flat/near-flat hop, not a node
 * merely nearby. Returns the LOWEST-rise candidate (the easiest/most-reachable one,
 * matching the author's evident stepping-stone intent) or `null` if none obstructs.
 */
function findObstructingPlatform(from, to, nodes, envelope) {
  const gapStart = Math.min(from.xEnd, to.xEnd);
  const gapEnd = Math.max(from.xStart, to.xStart);
  if (gapStart >= gapEnd) return null; // overlapping/touching spans — no open-air gap to obstruct
  let best = null;
  for (const obstacle of nodes) {
    if (obstacle === from || obstacle === to) continue;
    if (obstacle.xEnd <= gapStart || obstacle.xStart >= gapEnd) continue; // no x overlap with the gap
    const rise = from.y - obstacle.y;
    // A real obstruction: elevated enough to be a genuine platform (not floor-level
    // noise) yet within the arc's reachable rise (jumpReach's own maxRise ceiling) —
    // exactly the height band a held-jump's ascent phase will actually pass through.
    if (rise > FLAT_EDGE_RISE_TOLERANCE && rise <= envelope.maxRise) {
      if (!best || rise < from.y - best.y) best = obstacle;
    }
  }
  return best;
}

/**
 * Re-run bottleneckPath between `fromId` and `toId` with the direct edge between
 * them (both directions) excluded — used to find a REAL alternate route (e.g. a
 * two-platform stepping-stone chain) when the direct edge is physically obstructed.
 * A single ad hoc mount onto the nearest obstacle (the fallback below) only handles
 * a ONE-obstacle case; some gaps (e.g. level-02's gap-2) need two chained platforms,
 * each requiring its own takeoff — this finds that real chain instead of guessing.
 */
function pathAvoidingDirectEdge(nodes, graph, fromId, toId, envelope) {
  const filtered = new Map();
  for (const [id, edges] of graph) {
    filtered.set(
      id,
      edges.filter((e) => !((id === fromId && e.to === toId) || (id === toId && e.to === fromId)))
    );
  }
  return bottleneckPath(nodes, filtered, fromId, toId, envelope);
}

/**
 * Compute and push the takeoff(s) needed for one leg of the planned path (from ->
 * to), recursing through a real avoiding-the-obstruction sub-path when the direct
 * hop is physically blocked by another node's footprint (see this file's header).
 * `depth` bounds recursion — level graphs are small (<20 nodes), so this only ever
 * recurses a couple of levels deep for a genuine multi-platform chain.
 */
function pushHopTakeoffs(from, to, nodes, graph, envelope, takeoffs, depth = 0) {
  const rise = Math.max(0, from.y - to.y);

  if (rise > 12) {
    // Mount: cross the leading edge while rising, near apex for high rises.
    const offset = rise >= 76 ? MOUNT_OFFSET_HIGH : MOUNT_OFFSET_LOW;
    let x = to.xStart - offset;
    x = Math.min(x, from.xEnd - 4); // never past the takeoff surface's own lip
    x = Math.max(x, from.xStart + 4);
    takeoffs.push({ x, kind: "mount", fromY: from.y });
    return;
  }

  // Plan 25-07 fix: bottleneckPath found this hop directly feasible (flat/near-flat,
  // rise <= 12), but a solid platform's footprint may still sit physically inside the
  // gap at a rise the arc's ascent phase reaches — reachability.mjs's graph has no
  // concept of a third node obstructing an edge between two others (see this file's
  // header). Route THROUGH the real alternate chain instead of attempting a direct
  // flight that would collide with it.
  const obstacle = findObstructingPlatform(from, to, nodes, envelope);
  if (obstacle) {
    if (depth < 4) {
      const subPath = pathAvoidingDirectEdge(nodes, graph, from.id, to.id, envelope);
      if (subPath && subPath.length > 2) {
        for (let j = 0; j < subPath.length - 1; j++) {
          pushHopTakeoffs(subPath[j], subPath[j + 1], nodes, graph, envelope, takeoffs, depth + 1);
        }
        return;
      }
    }
    // No real alternate chain found (or recursion budget exhausted) — best-effort
    // fallback: mount onto the nearest obstacle; descending off its far edge needs
    // no separate takeoff (natural gravity walk-off, same as the plain case below).
    const obsRise = from.y - obstacle.y;
    const offset = obsRise >= 76 ? MOUNT_OFFSET_HIGH : MOUNT_OFFSET_LOW;
    let x = obstacle.xStart - offset;
    x = Math.min(x, from.xEnd - 4);
    x = Math.max(x, from.xStart + 4);
    takeoffs.push({ x, kind: "mount", fromY: from.y });
    return;
  }

  if (to.xStart > from.xEnd + 4) {
    // Flat/descending across a real gap. A DESCENDING gap (to.y > from.y) may
    // already be crossable by pure momentum — walking off the ledge with no jump
    // press at all, landing sooner and more predictably than an active jump would.
    // Skipping the press here when it isn't needed matters: an unnecessary jump's
    // longer, higher arc can sail clean over a ground-level trigger (a checkpoint's
    // 8px-wide marker) sitting just past the landing spot — confirmed empirically
    // on level-03's platform-1 -> floor-1 drop, where an unconditional jump press
    // landed AT/PAST the x:740 checkpoint, causing every subsequent death on that
    // approach to respawn all the way back at x:340 instead of x:740.
    const dy = to.y - from.y;
    const spanMin = to.xStart - from.xEnd;
    const fallT = dy > 0 ? Math.sqrt((2 * dy) / CONFIG.GRAVITY) : 0;
    const fallReach = AIR_SPEED * fallT;
    if (fallReach < spanMin) {
      // Plan 25-07 fix: a perfectly flat gap (dy === 0) with comfortable range
      // margin fires EARLY, while still solidly grounded, instead of gambling on
      // the fragile coyote window — see this file's header (MAX_FLAT_RANGE /
      // EARLY_LEAD_MARGIN). Descending gaps (dy > 0) keep the proven coyote mark
      // unchanged; their arc geometry differs and was never the failing case.
      const flatMargin = MAX_FLAT_RANGE - spanMin;
      if (dy === 0 && flatMargin >= EARLY_LEAD_MARGIN) {
        const x = Math.max(from.xStart + 4, from.xEnd - EARLY_LEAD_PX);
        takeoffs.push({ x, kind: "gap", fromY: from.y });
      } else {
        takeoffs.push({ x: from.xEnd + GAP_COYOTE_MARK, kind: "gap", fromY: from.y });
      }
    }
    // else: pure fall momentum already clears the gap — no takeoff needed, walk off.
  }
  // else: descending onto an overlapping/touching lower surface — just walk off.
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
export function planTakeoffs(geometry, targetX, envelope = JUMP_ENVELOPE, targetY = undefined) {
  const nodes = buildNodes(geometry);
  const graph = buildGraph(nodes, envelope);
  const startNode = nodeContaining(nodes, SPAWN_X);
  // Phase 30 (MECH-04) fix: thread an optional targetY through to nodeContaining so an
  // x that falls within BOTH a floor's span AND an overlapping platform's span (e.g. a
  // secret alcove floating above a stepping-stone platform) disambiguates to the
  // intended node instead of always resolving to the floor (buildNodes always pushes
  // floor nodes before platform nodes). Every pre-existing 2-arg/3-arg call site passes
  // no targetY, so nodeContaining(nodes, targetX, undefined) === nodeContaining(nodes,
  // targetX) — byte-identical behavior, proven by this file's own self-test staying
  // green.
  const targetNode = nodeContaining(nodes, targetX, targetY);
  if (!startNode || !targetNode) return { takeoffs: [], path: null };

  const path = bottleneckPath(nodes, graph, startNode.id, targetNode.id, envelope);
  if (!path) return { takeoffs: [], path: null };

  const takeoffs = [];

  for (let i = 0; i < path.length - 1; i++) {
    pushHopTakeoffs(path[i], path[i + 1], nodes, graph, envelope, takeoffs);
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

  // Phase 30 (MECH-04) — targetY disambiguation for an alcove-shaped target: level-01's
  // real geometry (floor 0..560 y:320, platform 360..520 y:240; alcove at x:400, y:170).
  // With no targetY, nodeContaining resolves to the floor (buildNodes pushes floors
  // first) — a pure walk with zero takeoffs, since the target x is already inside the
  // floor's own span. With targetY:170 supplied, |240-170|=70 < |320-170|=150, so the
  // platform node wins, and reaching it requires a real "mount" takeoff (non-empty).
  {
    const alcoveGeometry = {
      floors: [{ x: 0, w: 560 }],
      platforms: [{ x: 360, y: 240, w: 160, h: 24 }],
      spikes: [],
    };
    const { takeoffs: noTargetY } = planTakeoffs(alcoveGeometry, 400);
    check(
      noTargetY.length === 0,
      `expected zero takeoffs when targetY is omitted (resolves to the floor, already walkable), got ${JSON.stringify(noTargetY)}`
    );
    const { takeoffs: withTargetY } = planTakeoffs(alcoveGeometry, 400, JUMP_ENVELOPE, 170);
    check(
      withTargetY.length > 0 && withTargetY.some((t) => t.kind === "mount"),
      `expected a non-empty "mount" takeoff when targetY:170 disambiguates to the platform node, got ${JSON.stringify(withTargetY)}`
    );
  }

  if (failures > 0) {
    console.error(`route-planner-selftest: FAIL — ${failures} assertion(s) failed`);
    process.exit(1);
  }
  console.log("route-planner-selftest: PASS");
}
