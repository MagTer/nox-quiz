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

// Spike-before-mount conflict fix (discovered empirically: level-04's spike@1000 sitting
// only 12px before platform@1080's natural mount takeoff x:1012, AND level-03's
// spike@3260 sitting 72px before platform@3400's natural mount takeoff x:3332 — both
// deterministically unreachable before this fix). mechanic-drive.mjs's driveToXPlanned
// holds a spike-clearing hop for its own spikeJumpHoldMs (150ms, well short of the
// ~371ms time-to-apex, so CONFIG.JUMP_CUT truncates it) — but JUMP_CUT only zeroes 55%
// of the upward velocity AT the moment of release, not all of it, so even this "short"
// hop still carries real height and range: measured empirically (real in-engine arc
// probe, matching this file's own AIR_SPEED calibration note above) at ~70-120px of
// horizontal travel depending on exact timing, comparable to a meaningful FRACTION of
// this file's own MAX_FLAT_RANGE same-height full-hold range (~156px) — nowhere near
// negligible. A "mount" takeoff (unlike "gap") only fires while grounded
// (driveToXPlanned), so any spike whose own standalone hop's flight carries the player
// PAST a nearby mount's narrow FIRE_WINDOW (16px) while still airborne means that mount
// can NEVER fire — the player sails over the platform and falls into the gap on every
// attempt, deterministically (not a timing flake). Rather than pin the trigger radius to
// a fragile re-derivation of driveToXPlanned's own hold-duration physics (a second
// module's constant this file doesn't import), reuse MAX_FLAT_RANGE as a conservative
// upper bound on how far ANY single hop (short spike hop or full mount hop alike) can
// possibly travel — a spike within that distance of a mount's natural takeoff is always
// a plausible conflict. Fix: fold the spike's clearance into the SAME jump — move the
// takeoff earlier, to just before the spike (SPIKE_MERGE_LEAD px of lead, small because
// a full-duration jump gains height fast: ~24px of rise after just 10px of travel,
// comfortably above the 8px spike hitbox), clamped to never go earlier than what the
// rise can still physically reach (maxReachForRise). See computeMountTakeoffX below.
const SPIKE_MOUNT_CONFLICT_RANGE = MAX_FLAT_RANGE;

// SPIKE_MERGE_LEAD's value is EMPIRICAL, not derived from this file's own reach
// formulas — a real in-engine sweep (25+ live-browser trials against level-04's
// spike@1000 -> platform@1080 hop, rise 70) found this file's closed-form
// maxReachForRise() measurably UNDERESTIMATES the real reachable range (predicted
// ~119px; a launch 140px back from the platform's leading edge landed on it reliably,
// 3/3, while 100px back was flaky and 160px back consistently undershot into the gap
// — the true usable range sits well above the formula's own ceiling). Two DISTINCT,
// independently confirmed failure modes bound the safe window from either side:
//   - Too CLOSE to the platform (a small lead, e.g. 8px — tried and falsified): the
//     mount's fire window opens at/after the spike's actual hitbox contact point
//     (CONFIG.SPIKE_HITBOX_W(12) is centered in the 16px tile, and the player is 16px
//     wide, so real contact starts at playerX >= spike.x + 2 - 16 = spike.x - 14,
//     regardless of jump state) — the player dies on the spike before any jump can
//     matter. A separate "corner-clip" mode was also observed near this same close
//     boundary (spike.x-20 lead): the arc crosses the leading edge too low/too late,
//     catching only the platform's front corner and sliding off — flaky rather than
//     deterministic, but still an unreliable zone.
//   - Too FAR from the platform (e.g. spike.x-80 or more): the arc's horizontal range
//     simply runs out before reaching the platform's leading edge at all, landing back
//     on the SAME floor short of the gap (harmless) or undershooting into the gap
//     between them (a fall death) — the classic "reach" failure this file's
//     formula tries (and, per the above, under-shoots) to model.
// 50px (matching this file's own already-proven SPIKE_OFFSET, the exact lead a
// standalone spike hop already uses successfully everywhere else in this game) sits
// solidly inside the empirically-confirmed 140px-of-total-travel-still-reliable
// window and gives generous (~36px) vertical clearance over the spike well before
// reaching it — see computeMountTakeoffX below for how the reach ceiling itself
// still gates whether Strategy 1 is even attempted (RISE_REACH_SAFETY_FACTOR).
const SPIKE_MERGE_LEAD = SPIKE_OFFSET;

// This file's maxReachForRise() (below) undershoots the real in-engine reach ceiling
// — see SPIKE_MERGE_LEAD's header comment for the calibration trial (rise 70: formula
// says ~119px, reliable in practice up to ~140px). Applied as a multiplier on top of
// the raw formula so Strategy 1's feasibility gate (computeMountTakeoffX) stops
// rejecting merges the real engine can actually complete, while still correctly
// rejecting the much-larger reach level-03's spike@3260 -> platform@3400 hop would
// need (Strategy 2 handles that case instead — see its own comment below).
const RISE_REACH_SAFETY_FACTOR = 1.2;

// Strategy 2's wide fire-window (computeMountTakeoffX, the "neither Strategy 1 nor a
// single predicted x is reliable" fallback): where a spike's OWN standalone hop
// (untouched, unmerged — see Strategy 2's own comment) actually lands, empirically.
// Real in-engine trials landed a spikeJumpHoldMs-held hop anywhere from ~135px to
// ~152px past its own takeoff (level-04's spike@3880: takeoff 3836.9 -> landed
// grounded 3972.1, a 135.2px travel; level-03's spike@3260: takeoff 3213.2 -> landed
// grounded ~3360, a ~147px travel). SPIKE_HOP_MIN_LANDING/MAX_LANDING bound a window
// around that observed range with real margin on both sides — narrower than this and
// a landing on the shorter end of the observed spread falls outside the window
// (confirmed empirically: a reach-ceiling-derived window centered near the PLATFORM
// instead of near this observed landing spread missed level-04's actual 3972.1
// landing entirely, since the window's own far edge sat at 3898.9). REACH_EDGE_BUFFER
// keeps the window's far end from creeping up against the platform's own leading
// edge (the same close-in corner-clip/collision risk SPIKE_MERGE_LEAD's own header
// comment documents for Strategy 1).
const SPIKE_HOP_MIN_LANDING = 90;
const SPIKE_HOP_MAX_LANDING = 200;
const REACH_EDGE_BUFFER = 20;

// Two takeoffs closer than this are merged (a single jump covers both); kept by
// priority: mount > gap > spike, then smaller x.
const DEDUPE_PX = 34;
const PRIORITY = { mount: 0, gap: 1, spike: 2 };

// ---------------------------------------------------------------------------
// BIDIRECTIONAL ROUTES (Phase 34, Plan 34-07)
// ---------------------------------------------------------------------------
//
// Until this plan, EVERY takeoff this planner emitted assumed rightward travel
// (`to.xStart - offset`, `from.xEnd + GAP_COYOTE_MARK`), and the driver that
// consumes them held ArrowRight for the whole drive. That was fine while every
// shipped level was a monotonic left-to-right march — and it silently became
// WRONG the moment Plan 34-04 gave level-08 a SWITCHBACK climb that reverses
// direction twice (T3 -> T4 is a hop up-LEFT).
//
// The reachability GRAPH was never the problem: reachability.mjs's `canReach`
// explicitly handles the `toNode.xEnd <= fromNode.xStart` (leftward) case, and
// `buildGraph` tests every ordered node pair BOTH ways. `bottleneckPath` duly
// FINDS the switchback path through all 10 of level-08's nodes. The graph knew
// the path existed; only the takeoff model — and the driver — could not follow it.
// (`edgeCost` still penalises leftward edges heavily, which is correct: a leftward
// hop is a genuinely harder, more deliberate move, so it should lose to a rightward
// route whenever one exists. It is a PREFERENCE, never a prohibition — the cost is
// 2, not Infinity, so a switchback whose only path is leftward is still chosen.)
//
// Plans 34-01/34-02 had already made the COIN model bidirectional for exactly this
// level (see reachability.mjs's `bestWitnessToCoin`: "level-08's Phase-34 switchback
// climb reverses direction twice, so a rightward-only coin model would fabricate
// false HARD-FAILs on it"). Nobody extended the same reasoning to the ROUTE. This
// does.
//
// The route is now a chain of LEGS, each carrying its own direction. A takeoff's
// position mirrors about the target's near edge for a leftward hop, and every
// takeoff records the `dir` the driver must be HOLDING when it fires plus the `leg`
// it belongs to (spike hops carry `leg: null` — they are opportunistic hazard
// clearance, not route structure).

/**
 * Travel direction for one hop: +1 rightward, -1 leftward.
 *
 * Disjoint spans are unambiguous. OVERLAPPING spans — which is EVERY consecutive
 * pair in a switchback climb, since docs/LEVEL-DESIGN.md's ~70px-overlap rule
 * forces consecutive tiers to overlap in x — are resolved by span midpoint: the
 * player travels toward whichever side the target tier extends to. Verified against
 * level-08's real geometry: T3(2850..3150) -> T4(2610..2960) gives -1 (the up-LEFT
 * reversal), T4 -> T5(2890..3230) gives +1 (the up-RIGHT reversal back).
 */
function hopDir(from, to) {
  if (to.xStart >= from.xEnd) return 1;
  if (to.xEnd <= from.xStart) return -1;
  const fromMid = (from.xStart + from.xEnd) / 2;
  const toMid = (to.xStart + to.xEnd) / 2;
  return toMid >= fromMid ? 1 : -1;
}

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

// Longest-reach candidate for rise `dy` (toNode.y - fromNode.y, negative = rising),
// using this file's own measured AIR_SPEED constant — mirrors canReach's
// theoreticalMaxReach derivation but with AIR_SPEED (not reachability.mjs's
// envelope.runSpeed), since this is a concrete arc-placement decision (same job as
// MOUNT_OFFSET/GAP_COYOTE_MARK above), not the graph's feasibility-cost model.
function maxReachForRise(dy) {
  const disc = CONFIG.JUMP_FORCE ** 2 + 2 * CONFIG.GRAVITY * dy;
  if (disc < 0) return 0;
  const t = (CONFIG.JUMP_FORCE + Math.sqrt(disc)) / CONFIG.GRAVITY;
  return AIR_SPEED * t;
}

// Compute a "mount" takeoff for rising onto `to` from `from`, folding in the
// spike-before-mount conflict fix (SPIKE_MOUNT_CONFLICT_RANGE's header comment above): if a
// spike sits close enough before the natural takeoff that ANY hop clearing it would
// carry the player past this takeoff's fire window while still airborne, move the
// takeoff earlier — before the spike — clamped so it never retreats past what the rise
// can still physically reach. `absorbedSpikes` (a Set, or undefined) is written to
// with the spike's `x` when merged, so the caller can suppress that spike's own
// separate takeoff. Shared by both pushHopTakeoffs call sites that build a "mount"
// takeoff (the plain rising-hop branch and the obstructed-flat-edge fallback) so the
// fix applies identically wherever a mount takeoff is computed.
//
// Returns { x, fireWindow }: fireWindow is undefined for the normal (unconflicted or
// Strategy-1-merged) case — mechanic-drive.mjs's driver falls back to its own
// per-kind FIRE_WINDOW.mount default (16px) exactly as before this fix. Strategy 2
// (below) sets a real, much wider fireWindow instead of pinning a single predicted x.
// `dir` (Plan 34-07) is the hop's travel direction (hopDir). For dir === +1 every
// line below is byte-identical to the pre-34-07 rightward-only version. For dir === -1
// the mount mark MIRRORS about the target's FAR (right) edge — the player must cross
// `to.xEnd` while rising, travelling leftward, so the launch mark sits `offset` px to
// the RIGHT of it, out on the launch surface's runway. Worked against level-08's real
// REVERSAL 1 (T3 y:99 -> T4 y:24, rise 75 -> MOUNT_OFFSET_LOW): the mark lands at
// 2960 + 68 = 3028 on T3, the arc crosses T4's right edge ~20px above its surface and
// lands at ~2913 — 47px inside T4, right where the level's own T4 checkpoint (x:2920)
// was authored to catch it. That is precisely the maneuver level-08's descriptor
// documents: "run right past T4's edge on T3's runway, turn around, jump back up-left."
//
// The spike-conflict merge (Strategies 1 and 2 below) is deliberately gated to dir > 0:
// its whole walk-order model ("a spike whose own takeoff fires BEFORE this mount's")
// assumes rightward travel, and no spike in this game sits on a climb tier — spikes are
// floor hazards on the rightward main run. Leaving it unreachable for leftward hops
// keeps every existing rightward behavior bit-for-bit intact instead of generalising a
// model that has no leftward case to serve.
function computeMountTakeoffX(from, to, rise, spikes, absorbedSpikes, dir = 1) {
  const offset = rise >= 76 ? MOUNT_OFFSET_HIGH : MOUNT_OFFSET_LOW;
  let x = dir > 0 ? to.xStart - offset : to.xEnd + offset;
  x = Math.min(x, from.xEnd - 4); // never past the takeoff surface's own lip
  x = Math.max(x, from.xStart + 4);
  let fireWindow;

  if (dir < 0) return { x, fireWindow };

  // Closest spike whose OWN standalone-hop takeoff (spike.x - SPIKE_OFFSET, the
  // actual position the player launches from, per the spike-emission loop in
  // planTakeoffs below) fires BEFORE this mount's natural takeoff x, if any — the
  // one whose hop is most likely to overshoot this mount's fire window. Comparing
  // takeoff positions (not raw spike x) matters: a spike whose RAW position sits
  // AFTER the mount's natural x can still have a takeoff position that sits BEFORE
  // it (discovered empirically: level-04's spike@1700, whose takeoff at 1700-52=1648
  // fires 44px before platform@1760's natural mount takeoff at x:1692, even though
  // the raw spike position 1700 is itself past 1692) — the spike still fires first
  // in walk order and can still strand this mount exactly like the raw-position case
  // above. Earlier spikes on the same walk-up, whose OWN takeoff lands safely well
  // before this point, are unaffected.
  const blocking = (spikes ?? [])
    .filter((s) => {
      const stakeoff = s.x - SPIKE_OFFSET;
      return stakeoff > from.xStart && stakeoff < x;
    })
    // Sort by takeoff position descending: (b.x - OFFSET) - (a.x - OFFSET) reduces to
    // b.x - a.x since SPIKE_OFFSET is the same constant for every spike.
    .sort((a, b) => b.x - a.x)[0];
  const blockingTakeoffX = blocking ? blocking.x - SPIKE_OFFSET : null;
  if (blocking && x - blockingTakeoffX < SPIKE_MOUNT_CONFLICT_RANGE) {
    const maxReach = maxReachForRise(to.y - from.y);
    // RISE_REACH_SAFETY_FACTOR's header comment: the raw formula underestimates the
    // real in-engine reach ceiling, so gate Strategy 1's feasibility against a
    // corrected (looser) bound instead of the raw one.
    const minLaunchXGate = to.xStart - maxReach * RISE_REACH_SAFETY_FACTOR;

    // Strategy 1 (preferred, verified in-engine against level-04's spike@1000 ->
    // platform@1080): fold the spike's clearance into the SAME jump, launching
    // before the spike (SPIKE_MERGE_LEAD px of lead — see its own header comment)
    // — only attempted when the rise is still reachable from that far back per the
    // corrected gate.
    const mergedX = Math.max(blocking.x - SPIKE_MERGE_LEAD, from.xStart + 4);
    if (mergedX <= blocking.x - 4 && mergedX >= minLaunchXGate) {
      x = mergedX;
      absorbedSpikes?.add(blocking.x);
    } else {
      // Strategy 2 (fallback, verified in-engine against level-03's spike@3260 ->
      // platform@3400 AND level-04's spike@3880 -> platform@4000, both cases where
      // Strategy 1's launch position is physically too far back to reach the rise):
      // leave the spike's own standalone takeoff untouched (it clears the spike on
      // its own, exactly as it already does for every OTHER spike in this game) and
      // give THIS mount a WIDE fire window instead of a single predicted x.
      //
      // Two earlier versions of this fallback were tried and EMPIRICALLY FALSIFIED:
      // (1) predicting the spike hop's exact landing x (its own takeoff position +
      // this file's MAX_FLAT_RANGE ceiling) and pinning the mount there as a normal,
      // narrow-window takeoff — against level-04's spike@3880 case, floor-5 ends
      // exactly at platform@4000's own start (a zero-gap "touching" pair, common in
      // this game), so the predicted x clamped hard against from.xEnd left only ~4px
      // of fire window before the platform's edge, an unreliable corner-clip launch
      // (confirmed to fail 8/8 real death-retries). (2) a fire window derived from
      // maxReachForRise's own reach ceiling (i.e., positioned relative to the
      // PLATFORM's leading edge) — also falsified: the spike hop's REAL landing spot
      // (see SPIKE_HOP_MIN_LANDING/MAX_LANDING's own header comment) sat past that
      // window's far edge entirely (level-04: window ended at 3898.9, real landing
      // 3972.1), so the mount takeoff never matched a grounded frame inside it and
      // the player walked straight off the platform's edge unjumped.
      //
      // Fix: position the window relative to WHERE THE SPIKE HOP ITSELF ACTUALLY
      // LANDS (SPIKE_HOP_MIN_LANDING..MAX_LANDING past its own takeoff), not relative
      // to the platform — the takeoff fires the instant the player is genuinely
      // grounded anywhere in that observed landing spread, whichever exact x that
      // turns out to be, rather than betting on either a single predicted point or a
      // window anchored to the wrong end of the hop.
      const lo = Math.max(blockingTakeoffX + SPIKE_HOP_MIN_LANDING, from.xStart + 4);
      const hi = Math.min(
        blockingTakeoffX + SPIKE_HOP_MAX_LANDING,
        from.xEnd - 4,
        to.xStart - REACH_EDGE_BUFFER
      );
      if (hi > lo) {
        x = lo;
        fireWindow = hi - lo;
      } else if (process.env.DEBUG_ROUTE) {
        console.error(`computeMountTakeoffX: NEITHER strategy worked for blocking spike x=${blocking.x} vs natural mount x=${x} (from ${from.xStart}-${from.xEnd}@${from.y} to ${to.xStart}-${to.xEnd}@${to.y})`);
      }
      // else: no physically reachable window clears the spike AND still reaches the
      // platform via either strategy — fall back to the original (unmerged) x;
      // best-effort, unchanged from pre-fix behavior for this pathological sub-case.
    }
  }
  return { x, fireWindow };
}

/**
 * Expand one hop of the bottleneck path into the EFFECTIVE NODE CHAIN the driver
 * will actually walk — i.e. the real sequence of surfaces the player's feet touch,
 * recursing through an avoiding-the-obstruction sub-path when the direct hop is
 * physically blocked by another node's footprint (see this file's header). `depth`
 * bounds recursion — level graphs are small (<20 nodes), so this only ever recurses
 * a couple of levels deep for a genuine multi-platform chain.
 *
 * Plan 34-07 split this out of the old `pushHopTakeoffs`, which fused "find the real
 * chain" and "emit takeoffs for it" into one recursive pass. Separating them is what
 * lets each adjacent pair of the chain become a LEG with its own travel direction —
 * the obstruction sub-paths land in the chain too, so their legs get directions and
 * takeoffs exactly like any other. Takeoff emission is now `emitLegTakeoff` below,
 * whose per-branch logic is otherwise carried over unchanged.
 */
function expandHop(from, to, nodes, graph, envelope, chain, depth = 0) {
  const rise = Math.max(0, from.y - to.y);

  if (rise > 12) {
    chain.push(to); // a real rising mount — never obstructed by a third node's footprint
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
          expandHop(subPath[j], subPath[j + 1], nodes, graph, envelope, chain, depth + 1);
        }
        return;
      }
    }
    // No real alternate chain found (or recursion budget exhausted) — best-effort
    // fallback: step onto the nearest obstacle, then continue to `to`. Descending off
    // the obstacle's far edge needs no takeoff of its own (natural gravity walk-off);
    // emitLegTakeoff's own flat/descending branch reaches exactly that conclusion for
    // the obstacle -> to leg, since the two always overlap or touch in this case
    // (level-01's gap-2 platform ends exactly where floor-2 begins; level-07's gap-1
    // platform overlaps its far floor) — so this reproduces the pre-34-07 takeoff set.
    chain.push(obstacle);
    chain.push(to);
    return;
  }

  chain.push(to);
}

/**
 * Emit the takeoff (if any) for ONE leg of the effective chain, in the leg's own
 * travel direction. Every branch below is the pre-34-07 logic with its rightward
 * assumptions replaced by `dir`-relative ones; for dir === +1 the emitted x values
 * are unchanged.
 */
function emitLegTakeoff(leg, takeoffs, spikes, absorbedSpikes) {
  const { from, to, dir, index } = leg;
  const rise = Math.max(0, from.y - to.y);

  if (rise > 12) {
    // Mount: cross the target's NEAR edge (near in the direction of travel) while
    // rising, near apex for high rises.
    const { x, fireWindow } = computeMountTakeoffX(from, to, rise, spikes, absorbedSpikes, dir);
    takeoffs.push({
      x,
      kind: "mount",
      fromY: from.y,
      dir,
      leg: index,
      ...(fireWindow !== undefined && { fireWindow }),
    });
    return;
  }

  // Flat/descending. `spanMin` is the open-air distance AHEAD of the launch surface
  // in the direction of travel; <= 4 means the surfaces overlap or touch, so the
  // player just walks off onto the lower one — no takeoff at all.
  const spanMin = dir > 0 ? to.xStart - from.xEnd : from.xStart - to.xEnd;
  if (spanMin <= 4) return;

  // A DESCENDING gap (to.y > from.y) may already be crossable by pure momentum —
  // walking off the ledge with no jump press at all, landing sooner and more
  // predictably than an active jump would. Skipping the press here when it isn't
  // needed matters: an unnecessary jump's longer, higher arc can sail clean over a
  // ground-level trigger (a checkpoint's 8px-wide marker) sitting just past the
  // landing spot — confirmed empirically on level-03's platform-1 -> floor-1 drop,
  // where an unconditional jump press landed AT/PAST the x:740 checkpoint, causing
  // every subsequent death on that approach to respawn all the way back at x:340
  // instead of x:740.
  const dy = to.y - from.y;
  const fallT = dy > 0 ? Math.sqrt((2 * dy) / CONFIG.GRAVITY) : 0;
  const fallReach = AIR_SPEED * fallT;
  if (fallReach >= spanMin) return; // pure fall momentum already clears it — walk off

  // Plan 25-07 fix: a perfectly flat gap (dy === 0) with comfortable range margin
  // fires EARLY, while still solidly grounded, instead of gambling on the fragile
  // coyote window — see this file's header (MAX_FLAT_RANGE / EARLY_LEAD_MARGIN).
  // Descending gaps (dy > 0) keep the proven coyote mark unchanged; their arc
  // geometry differs and was never the failing case.
  const flatMargin = MAX_FLAT_RANGE - spanMin;
  let x;
  if (dy === 0 && flatMargin >= EARLY_LEAD_MARGIN) {
    x =
      dir > 0
        ? Math.max(from.xStart + 4, from.xEnd - EARLY_LEAD_PX)
        : Math.min(from.xEnd - 4, from.xStart + EARLY_LEAD_PX);
  } else {
    // The coyote mark sits GAP_COYOTE_MARK px PAST the lip — past in the direction
    // of travel, so it mirrors for a leftward hop.
    x = dir > 0 ? from.xEnd + GAP_COYOTE_MARK : from.xStart - GAP_COYOTE_MARK;
  }
  takeoffs.push({ x, kind: "gap", fromY: from.y, dir, leg: index });
}

/**
 * Plan the directional route for driving from spawn to `targetX`.
 *
 * Returns { takeoffs, path, legs, targetNode }.
 *
 * `takeoffs` is ascending-x sorted:
 *   { x, kind: "mount"|"gap"|"spike", fromY, dir, leg, fireWindow? }
 * `fromY` is the y (surface top) of the surface this takeoff launches FROM. The
 * driver only fires a takeoff when the player's feet are at that height — so a
 * MISSED mount earlier in the chain can never cascade into firing later takeoffs
 * that were planned for a different surface (e.g. a lip jump planned from a raised
 * platform must not fire from the floor beneath it), and a spike hop must never
 * interrupt a platform-chain traversal happening overhead.
 * `dir` (Plan 34-07) is the direction the driver must be HOLDING when it fires: a
 * takeoff mark is a position AND a heading, and firing a leftward mount while walking
 * right just launches the player off the tier.
 * `leg` is the index into `legs` this takeoff belongs to, or `null` for a spike hop
 * (opportunistic hazard clearance, not route structure — so the driver never plans a
 * turn-around for one).
 *
 * `legs` (Plan 34-07) is the EFFECTIVE node chain as ordered hops:
 *   { index, from, to, dir }
 * This is the route's spine. The driver derives which leg it is on from the player's
 * LIVE position each tick (which surface the feet are on), never from a stored cursor
 * — so a death/respawn anywhere along the route self-heals, exactly as the old
 * position-matched takeoff model did.
 *
 * Still position-based and stateless: the driver re-matches takeoffs against the live
 * player x every tick, so a death/respawn behind a takeoff re-executes it.
 */
export function planTakeoffs(geometry, targetX, envelope = JUMP_ENVELOPE, targetY = undefined) {
  const nodes = buildNodes(geometry);
  // POL-03 (Phase 39): thread movers so a pit that is now bridged ONLY by a floor-level ferry
  // (its static stepping-stones removed) still yields a spawn→target PATH. Without the ride
  // bridge edge, bottleneckPath returns null for any target past such a pit, planTakeoffs emits
  // ZERO takeoffs, and driveToXPlanned then has no spike-hop marks for the hazards beyond the
  // pit (the driver walked straight into level-08's F3 spike@2800 and stalled). The mover
  // crossing itself is driven separately by driveToMover; this only lets the planner emit the
  // DOWNSTREAM legs/hazard marks. Inert for shipped raised movers (not surface-flush → no edge).
  const graph = buildGraph(nodes, envelope, geometry.movers ?? []);
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
  if (!startNode || !targetNode) return { takeoffs: [], path: null, legs: [], targetNode: null };

  const path = bottleneckPath(nodes, graph, startNode.id, targetNode.id, envelope);
  if (!path) return { takeoffs: [], path: null, legs: [], targetNode: null };

  // The EFFECTIVE chain: every surface the player's feet will actually touch, including
  // the stepping stones an obstructed flat hop has to be re-routed through.
  const chain = [path[0]];
  for (let i = 0; i < path.length - 1; i++) {
    expandHop(path[i], path[i + 1], nodes, graph, envelope, chain, 0);
  }

  const legs = chain.slice(0, -1).map((from, index) => ({
    index,
    from,
    to: chain[index + 1],
    dir: hopDir(from, chain[index + 1]),
  }));

  const takeoffs = [];
  // Spike-before-mount conflict fix (SPIKE_MOUNT_CONFLICT_RANGE's header comment): spikes
  // whose clearance gets folded into a nearby mount's own takeoff (computeMountTakeoffX)
  // are recorded here by their geometry `x`, so the standalone spike-hop loop below
  // does not ALSO emit a separate (now-redundant, and conflict-prone) takeoff for them.
  const absorbedSpikes = new Set();

  for (const leg of legs) {
    emitLegTakeoff(leg, takeoffs, geometry.spikes, absorbedSpikes);
  }

  // Spike hops for every spike on a chain FLOOR node before the target. fromY pins
  // them to floor level so a platform-chain pass overhead never triggers them, and
  // `leg: null` marks them as opportunistic (the driver never backs up to retry one —
  // a missed spike is a cheap checkpoint respawn, not a route failure).
  const chainFloorIds = new Set(chain.filter((n) => n.id.startsWith("floor-")).map((n) => n.id));
  for (const spike of geometry.spikes ?? []) {
    if (spike.x >= targetX - 8) continue;
    if (absorbedSpikes.has(spike.x)) continue;
    const node = nodeContaining(
      nodes.filter((n) => n.id.startsWith("floor-")),
      spike.x
    );
    if (node && chainFloorIds.has(node.id)) {
      takeoffs.push({ x: spike.x - SPIKE_OFFSET, kind: "spike", fromY: CONFIG.FLOOR_Y, dir: 1, leg: null });
    }
  }

  // Sort, then dedupe near-coincident takeoffs by priority (mount > gap > spike).
  // A takeoff carrying its own `fireWindow` (Strategy 2's wide-window mount, above)
  // is EXEMPT from this merge: it was deliberately placed close to the spike it
  // still needs to clear on the way there — that spike's own standalone takeoff
  // must keep firing separately (Strategy 2 explicitly does NOT absorb it), or the
  // player walks straight into the spike with nothing to jump it. Discovered
  // empirically: level-04's spike@3880 sat only ~29px from its Strategy-2 mount
  // (well inside the normal 34px DEDUPE_PX), so the unmodified merge step silently
  // dropped the spike's own takeoff, turning a fixed conflict into a guaranteed
  // spike death instead.
  //
  // Plan 34-07 additionally requires SAME-SURFACE + SAME-DIRECTION for a merge. A
  // folded switchback route puts takeoffs from DIFFERENT tiers close together in raw
  // x — level-08's T2->T3 mount (x:2782, launched from y:173) sits only 40px from its
  // T4->T5 mount (x:2822, launched from y:24), two tiers and three hops apart. Merging
  // on bare x-proximity across surfaces would silently delete a load-bearing takeoff
  // and strand the climb. The pre-34-07 intent — "one jump covers both of these
  // near-coincident marks" — is only ever true for two marks the player passes on the
  // SAME surface travelling the SAME way, which is exactly what this now requires (and
  // is what every pre-34-07 merge actually was, since every route was monotonic).
  takeoffs.sort((a, b) => a.x - b.x || PRIORITY[a.kind] - PRIORITY[b.kind]);
  const deduped = [];
  for (const t of takeoffs) {
    const last = deduped[deduped.length - 1];
    if (
      last &&
      t.x - last.x < DEDUPE_PX &&
      t.dir === last.dir &&
      t.fromY === last.fromY &&
      t.fireWindow === undefined &&
      last.fireWindow === undefined
    ) {
      if (PRIORITY[t.kind] < PRIORITY[last.kind]) deduped[deduped.length - 1] = t;
      continue;
    }
    deduped.push(t);
  }

  // Suppress SAME-NODE jumps landing us on/past the target trigger (sailing over a
  // 32px-wide gate mid-arc records a false "unreached"). Cross-gap/mount takeoffs are
  // never suppressed (they're mandatory to get there at all); spike hops are never
  // suppressed (walking into a spike is a guaranteed respawn loop).
  //
  // Plan 34-07: the node lookup now passes `t.fromY`, so it resolves to the surface the
  // takeoff actually LAUNCHES FROM rather than to whichever node happens to be first in
  // buildNodes' order (floors are always pushed before platforms). Under a folded
  // switchback, one x can sit inside several tiers' spans at once — level-08's T2->T3
  // mount at x:2782 falls inside BOTH T2 (2640..2920, its real launch surface) and T4
  // (2610..2960, three hops later) — so the bare x-only lookup was resolving that
  // takeoff's node by declaration-order luck. It happened to pick T2 and survive; a
  // reordered descriptor would have suppressed a load-bearing mount and stranded the
  // climb, silently. `fromY` makes it a fact instead of a coincidence. For every
  // pre-34-07 (monotonic, floor-launched) takeoff this resolves to the same node the
  // x-only lookup already returned.
  const filtered = deduped.filter((t) => {
    if (t.kind === "spike") return true;
    if (t.x <= targetX - 130) return true;
    const tNode = nodeContaining(nodes, t.x, t.fromY);
    return !(tNode && tNode.id === targetNode.id);
  });

  return { takeoffs: filtered, path, legs, targetNode };
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

  // Plan 34-07 — THE SWITCHBACK. A trimmed copy of level-08's real capstone climb:
  // floor 1800..2360, then T1 (2410..2710 @248), T2 (2640..2920 @173), T3 (2850..3150
  // @99), then the REVERSAL — T4 (2610..2960 @24) sits UP AND TO THE LEFT of T3 — then
  // T5 (2890..3230 @-50) reverses back up-right. This is the exact shape the old
  // rightward-only planner could not express: it emitted a "mount" whose mark clamped to
  // T3's own left edge and pointed the jump away from T4 entirely.
  {
    const switchback = {
      floors: [{ x: 0, w: 2360 }],
      platforms: [
        { x: 2410, y: 248, w: 300, h: 16 }, // T1
        { x: 2640, y: 173, w: 280, h: 16 }, // T2
        { x: 2850, y: 99, w: 300, h: 16 }, // T3
        { x: 2610, y: 24, w: 350, h: 16 }, // T4 — up-LEFT of T3 (REVERSAL 1)
        { x: 2890, y: -50, w: 340, h: 16 }, // T5 — up-RIGHT of T4 (REVERSAL 2)
      ],
      spikes: [],
    };
    // Target the summit tier (T5) by its own y, so nodeContaining can't resolve the
    // target to a lower tier whose span also covers this x.
    const { takeoffs: sb, legs: sbLegs } = planTakeoffs(switchback, 3100, JUMP_ENVELOPE, -50);

    check(sbLegs.length === 5, `expected 5 switchback legs (floor->T1..T4->T5), got ${sbLegs.length}`);
    check(
      sbLegs.map((l) => l.dir).join(",") === "1,1,1,-1,1",
      `expected leg directions 1,1,1,-1,1 (two reversals), got ${sbLegs.map((l) => l.dir).join(",")}`
    );

    // THE ASSERTION THIS WHOLE PLAN EXISTS FOR: a real, leftward takeoff for T3 -> T4.
    const leftward = sb.filter((t) => t.dir === -1);
    check(
      leftward.length === 1 && leftward[0].kind === "mount",
      `expected exactly one leftward "mount" takeoff (the T3->T4 reversal), got ${JSON.stringify(leftward)}`
    );
    // It must launch FROM T3 (fromY 99) and sit to the RIGHT of T4's far edge (2960) —
    // out on T3's turn-around runway, so the player runs past T4, turns, and jumps back
    // up-left onto it. A mark at/left of 2960 would be launching from underneath the
    // target and could never cross its edge while rising.
    check(
      leftward[0].fromY === 99 && leftward[0].x > 2960 && leftward[0].x <= 3150,
      `leftward mount must launch from T3 (fromY 99) on the runway right of T4's far edge, got ${JSON.stringify(leftward[0])}`
    );
    // Every takeoff must carry the direction the driver has to be HOLDING to fire it,
    // and route takeoffs must name the leg they belong to.
    check(
      sb.every((t) => (t.dir === 1 || t.dir === -1) && (t.leg === null || typeof t.leg === "number")),
      "every takeoff must carry a dir and a leg (null for spike hops)"
    );
    // Each of the 5 legs is a real hop (rise > 12), so each must have its own takeoff —
    // none may be silently swallowed by the near-coincident-x dedupe, which is exactly
    // the trap a folded route sets (T2->T3's mark and T4->T5's mark land ~40px apart in
    // raw x while being three hops and two tiers apart).
    check(
      [0, 1, 2, 3, 4].every((i) => sb.some((t) => t.leg === i)),
      `every switchback leg needs its own takeoff, got legs ${JSON.stringify(sb.map((t) => t.leg))}`
    );
  }

  // Spike hops stay opportunistic (leg: null) and rightward — regression guard on the
  // first synthetic level above.
  check(
    spikeHop && spikeHop.leg === null && spikeHop.dir === 1,
    `spike hops must be dir:1 / leg:null (opportunistic, never route structure), got ${JSON.stringify(spikeHop)}`
  );

  if (failures > 0) {
    console.error(`route-planner-selftest: FAIL — ${failures} assertion(s) failed`);
    process.exit(1);
  }
  console.log("route-planner-selftest: PASS");
}
