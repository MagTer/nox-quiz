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

// --- HEADROOM (Phase 34, Plan 34-06, LVL-03) ---
//
// The minimum vertical clearance, in px, between the walkable surface of a lower
// platform and the UNDERSIDE of any platform that overlaps it in x. Below this, a
// 32px-tall player reads as wedged into a crawlspace.
//
// WHY THIS CONSTANT EXISTS AT ALL — read before touching it:
// docs/LEVEL-DESIGN.md quantified rise, gap width and x-overlap for four milestones
// and had NO headroom rule. So level-07 shipped its ENTIRE end climb at 9px of
// headroom (65px rise, h:24 platforms, a 32px player -> a 41px slot), and level-08's
// first switchback draft came in at 9-14px. Every gate in this project was green the
// whole time, because no gate looked. A HUMAN found it, at a checkpoint, by looking
// at the screen. This check is the gate that should have existed.
//
// 24px is the agreed floor (user sign-off, Phase 34): with the mandated 16px WYSIWYG
// platform thickness it makes the rule `rise >= 72px` for any overlapping tier pair,
// which is exactly where docs/LEVEL-DESIGN.md section 3.3's 72-75px overlapping-rise
// band comes from. Raising the rise band without re-deriving this number, or lowering
// this number to make a level green, both re-open the defect.
export const MIN_HEADROOM_PX = 24;

// --- Hitbox constants for the COIN model (Phase 34, LVL-01) ---
//
// PROVENANCE — these duplicate values OWNED by src/, and are model constants of
// this script lib exactly as jump-envelope.mjs's calibrated numbers are:
//
//   PLAYER_W/PLAYER_H  <- src/player.js:30
//     `area({ shape: new Rect(vec2(0), 16, 32) })` — the collider is EXPLICITLY
//     locked to 16x32 (the ART-04 lock), deliberately independent of whichever
//     anim frame is playing, so the taller player-swamphunter sheet can never
//     silently resize the physics hitbox.
//
//   COIN_W/COIN_H      <- src/levels/build.js:200
//     `add([sprite("coin"), pos(c.x, c.y), area(), "coin"])` — a BARE area(), so
//     the hitbox is the sprite frame's full extent. coin.png is a 256x32 sheet of
//     CONFIG.COIN_FRAMES (= 8) evenly-gridded frames (src/config.js:130), so one
//     frame — and therefore the coin's AABB — is 32x32.
//
// src/config.js DELIBERATELY carries no COIN_SIZE (its own comment: "coin
// placement is intentionally data-driven via raw {x, y}"), so there is no
// single-source-of-truth constant in src/ to import here. That makes these four
// numbers a genuine duplication, and therefore a real silent-drift risk: if either
// source line ever changes, this model quietly LIES. That risk is mitigated, not
// ignored — Plan 34-02's in-engine witness gate (scripts/audit-coins.mjs) replays
// every witness this model emits against the real running engine, so a collider or
// sprite-size change makes the witnesses stop collecting coins and turns that gate
// RED. The drift detector is a running game, not a grep.
export const PLAYER_W = 16;
export const PLAYER_H = 32;
export const COIN_W = 32;
export const COIN_H = 32;

// Trajectory sampling resolution and horizon for the coin fly-through model below.
// SAMPLE_DT is deliberately finer than a 60fps frame (1/240s) so a narrow
// pass-through window can never be stepped over; T_MAX (2.0s) comfortably exceeds
// the longest physically-meaningful arc in this game (a full-force jump's total
// flight time at GRAVITY 1400 / JUMP_FORCE 520 is ~0.74s, and the deepest fall in
// any shipped level lands well inside 2s). Named constants — no magic numbers in
// logic (CLAUDE.md).
const SAMPLE_DT = 1 / 240;
const T_MAX = 2.0;

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
export function bfsWithPathMargin(graph, startNodeId) {
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
export function bestMarginToPoint(point, nodes, spawnPaths, envelope) {
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

// ===========================================================================
// COIN REACHABILITY (Phase 34, LVL-01) — a coin is NOT an alcove.
// ===========================================================================
//
// `bestMarginToPoint` above models a floating ZERO-WIDTH POINT the player must
// get to and effectively STAND at. That is a LANDING question. A coin is a
// different physical object and asks a different question:
//
//   - It has a 32x32 AABB (see the hitbox constants above), not zero width.
//   - It is collected MID-ARC, in flight — the player only has to PASS THROUGH
//     its box, never land on or next to it.
//
// Probing coins through the alcove/point model (which is how 34-CONTEXT.md's
// 32-coin figure was produced) therefore systematically OVER-REPORTS unreachable
// coins: it demands a landing where the game only demands a fly-through. That 32
// is an upper bound, never a work list. Everything below is the coin-shaped model
// that supersedes it — and it is ADDITIVE: `bestMarginToPoint` is untouched, and
// the alcove and mover checks keep using it.

/**
 * The Minkowski-expanded set of player TOP-LEFT positions at which the player's
 * AABB overlaps the coin's AABB — i.e. the set of positions at which the coin is
 * COLLECTED.
 *
 * Player AABB is [px, px+PLAYER_W] x [py, py+PLAYER_H]; coin AABB is
 * [c.x, c.x+COIN_W] x [c.y, c.y+COIN_H]. They overlap exactly when
 *   px in [c.x - PLAYER_W, c.x + COIN_W]  and  py in [c.y - PLAYER_H, c.y + COIN_H].
 *
 * That is a 48x64 rectangle. THIS TOLERANCE — not a zero-width point — IS the fix
 * for the alcove model's over-reporting: the arc merely has to clip this box at
 * some instant, from any direction, at any speed.
 */
export function coinTargetBox(coin) {
  return {
    x0: coin.x - PLAYER_W,
    x1: coin.x + COIN_W,
    y0: coin.y - PLAYER_H,
    y1: coin.y + COIN_H,
  };
}

// ---------------------------------------------------------------------------
// OBSTRUCTION (Phase 34, Plan 34-02 — the model TIGHTENED by the running engine)
// ---------------------------------------------------------------------------
//
// The coin model shipped in Plan 34-01 with THREE documented limitations, of which
// limitation 1 — "IT MODELS NO OBSTRUCTION" — was the one that could make it
// OVER-credit. Plan 34-02's in-engine witness replay (scripts/audit-coins.mjs) then
// did exactly what it was built to do: it FALSIFIED the model. Nine coins the model
// called reachable were driven, in the real engine, with real key input, and the real
// onCollide("coin") handler never fired. Every one of them was tucked under (or
// embedded inside) an overhanging platform's solid collider — the ceiling-bonk bug
// class docs/LEVEL-DESIGN.md section 3 records as SHIPPED. E.g. level-01's coins[10]
// at (2280, 264) sits beneath platform 2240..2368 @ y250: the rising arc's head hits
// the platform underside and the coin is never touched.
//
// Limitation 1 is therefore now CLOSED, in the only sanctioned direction — the model
// was tightened, not the gate loosened. The two remaining limitations (no cut-jump,
// clamped rise) both UNDER-credit and stay exactly as they were.

// Half a pixel: a player RESTING on a surface (AABB bottom exactly == surface top) is
// touching it, not penetrating it. Overlap must be strict, or every launch would read
// as an instant collision with the ground it is standing on.
const OBSTRUCTION_EPS = 0.5;

// Arc-tracing resolution for the obstruction check. Coarser than SAMPLE_DT (which
// scans for the collection instant) because this only has to notice that a 16x32 body
// entered a solid box: at CONFIG.RUN_SPEED-scale speeds a 1/120s step advances the
// body ~2px horizontally and a few px vertically — far finer than the smallest solid
// in any shipped level (a 24px-tall platform).
const OBSTRUCTION_DT = 1 / 120;

// A single witness search may trace at most this many arcs. Exhausting the budget is
// treated as OBSTRUCTED (the candidate is rejected), never as clear — the model's
// stated invariant is that it must only ever UNDER-credit, so the fail-safe direction
// for "we ran out of budget to prove this arc is clear" is "then it is not a witness."
const MAX_OBSTRUCTION_TRACES = 400;

// Candidate takeoff x positions sampled across the [lo, hi] interval a jump witness
// admits, in preference order (midpoint first — it preserves Plan 34-01's takeoffX for
// every unobstructed witness, so no already-verified witness moves). The endpoints and
// quartiles give an obstructed midpoint a fair chance at a genuinely clear line before
// the candidate is rejected — without this, a coin reachable from one end of a wide
// ledge would be needlessly HARD-FAILed just because the ledge's centre is blocked.
const TAKEOFF_FRACTIONS = [0.5, 0, 1, 0.25, 0.75];

/**
 * Every SOLID collider in a level, in the EXACT geometry src/levels/build.js emits:
 *
 *   floor run  -> rect(run.w, CONFIG.FLOOR_THICKNESS) at (run.x, CONFIG.FLOOR_Y)
 *                 (build.js:170-171 — one merged static collider per run)
 *   platform   -> rect(p.w, p.h) at (p.x, p.y)
 *                 (build.js:188-189 — same merged-collider idiom)
 *
 * Ids MATCH buildNodes' ids (`floor-N` / `platform-N`) so a witness's launchNodeId can
 * be excluded from its own obstruction test — see arcIsClear.
 *
 * Barriers (door / math-gate / enemy blockers) are DELIBERATELY NOT solids here, for
 * the same reason this file's header gives for never modelling them as blocking
 * edges: the math mechanics have no lockout state, so a barrier is always eventually
 * passable and can never make a coin permanently unreachable. Spikes likewise: a spike
 * hit costs a free checkpoint respawn, never a game-over.
 */
export function solidBoxes(geometry) {
  const boxes = [];
  (geometry.floors ?? []).forEach((f, i) =>
    boxes.push({
      id: `floor-${i}`,
      x0: f.x,
      x1: f.x + f.w,
      y0: CONFIG.FLOOR_Y,
      y1: CONFIG.FLOOR_Y + CONFIG.FLOOR_THICKNESS,
    })
  );
  (geometry.platforms ?? []).forEach((p, i) =>
    boxes.push({ id: `platform-${i}`, x0: p.x, x1: p.x + p.w, y0: p.y, y1: p.y + p.h })
  );
  return boxes;
}

/** Strict AABB overlap between the player body at top-left (px, py) and a solid box. */
function bodyHitsSolid(px, py, solids, launchNodeId) {
  for (const b of solids) {
    // The launch node is the surface the player is STANDING ON or DEPARTING FROM. A
    // player never bonks the ledge they just left, and the model's `fall` family
    // (x0 pinned to the departure edge, descending immediately) would otherwise read
    // as an instant self-collision with its own floor on every single fall witness.
    if (b.id === launchNodeId) continue;
    if (
      px + PLAYER_W > b.x0 + OBSTRUCTION_EPS &&
      px < b.x1 - OBSTRUCTION_EPS &&
      py + PLAYER_H > b.y0 + OBSTRUCTION_EPS &&
      py < b.y1 - OBSTRUCTION_EPS
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Does the arc from (x0, surfaceTop) reach the collection instant tHit WITHOUT driving
 * the player's 16x32 body into a solid collider first?
 *
 * This is the whole tightening. The engine does not let a body pass through a static
 * body: an arc that clips a platform underside is REDIRECTED (ceiling bonk), so its
 * modelled position at tHit is fiction and the "collection" it predicts never happens.
 * Any such candidate is not a witness.
 *
 * Both the sampled grid AND the exact tHit are tested, so a collection instant falling
 * between two grid steps can never dodge the check.
 */
function arcIsClear(surfaceTop, x0, dir, jumpForce, tHit, solids, launchNodeId, envelope) {
  const at = (t) => ({
    px: x0 + dir * envelope.runSpeed * t,
    py: surfaceTop + 0.5 * CONFIG.GRAVITY * t ** 2 - jumpForce * t,
  });
  for (let t = 0; t < tHit; t += OBSTRUCTION_DT) {
    const { px, py } = at(t);
    if (bodyHitsSolid(px, py, solids, launchNodeId)) return false;
  }
  const { px, py } = at(tHit);
  return !bodyHitsSolid(px, py, solids, launchNodeId);
}

// Simplest-to-replay-first ordering, so Plan 34-02's in-engine replay is robust:
// a walk witness needs only "hold a direction"; a fall witness needs "hold a
// direction off a known edge"; a jump witness needs "hold a direction + tap jump".
const FAMILY_RANK = { walk: 0, fall: 1, jump: 2 };

// Strict "is a better witness than" comparator: family first (simplest wins), then
// the smallest t (the earliest, least-precision-demanding moment of collection),
// then dir +1 before -1.
function witnessIsBetter(candidate, best) {
  if (best === null) return true;
  if (FAMILY_RANK[candidate.family] !== FAMILY_RANK[best.family]) {
    return FAMILY_RANK[candidate.family] < FAMILY_RANK[best.family];
  }
  if (candidate.t !== best.t) return candidate.t < best.t;
  return candidate.dir > best.dir;
}

/**
 * Best replayable WITNESS for collecting `coin`, or `null` if the coin is
 * unreachable from spawn. Returns
 *   { launchNodeId, launchY, takeoffX, dir, family, t }
 * — enough for Plan 34-02 to REPLAY the collection in the real running engine and
 * falsify this model. A model that emits witnesses is a model that has made itself
 * falsifiable; the whole point of this phase is that a green gate which does not
 * exercise the thing is worthless (.planning/research/ART-PARITY-STEERING.md,
 * facts 7-11).
 *
 * `nodes` is buildNodes' output; `spawnPaths` is the ALREADY-COMPUTED
 * bfsWithPathMargin map (the spawn-reachable set is never re-derived here — a coin
 * launched from a node the player can't even get to is not reachable).
 *
 * For each spawn-reachable node n, the player stands with top-left y
 * `surfaceTop = n.y - PLAYER_H` and can take off from any x in
 * [n.xStart, max(n.xStart, n.xEnd - PLAYER_W)] (the right bound keeps the whole
 * 16px-wide body on the surface). Three physically-motivated families are
 * evaluated:
 *
 *   walk (t=0): the player just stands/walks on n and the coin's box already
 *     contains their standing position. This is the case the alcove model
 *     structurally cannot express — it asks a landing question about a point, and
 *     a floor-height coin is not a point you land on, it is a box you walk through.
 *
 *   jump (t>0): px(t) = x0 + dir*runSpeed*t, py(t) = surfaceTop
 *     + 0.5*GRAVITY*t^2 - JUMP_FORCE*t (Kaplay y grows downward, so a rise is
 *     negative). x0 is FREE within the takeoff range. Both directions evaluated.
 *
 *   fall (t>0): the same, with jump force 0 — but x0 is PINNED to the departure
 *     edge (dir +1 -> x0max, dir -1 -> x0min), because a fall only begins once the
 *     player actually walks OFF that edge. A free x0 here would fabricate a player
 *     falling out of the middle of a solid platform.
 *
 * BOTH DIRECTIONS are evaluated, unlike `bestMarginToPoint`'s rightward-travel-only
 * model. Three reasons: a coin is a collectible a player will happily walk LEFT
 * for (it is not on the critical path, so "forward progress only" is the wrong
 * assumption); the box model makes the second direction nearly free to test; and
 * level-08's Phase-34 switchback climb (Plan 34-04) reverses direction twice, so a
 * rightward-only coin model would fabricate false HARD-FAILs on it.
 *
 * ---------------------------------------------------------------------------
 * THE INVARIANT, STATED ONCE: THIS MODEL MUST ONLY EVER UNDER-CREDIT.
 * If a coin is doubtful, it is unreachable. The cost of under-crediting is a coin
 * needlessly nudged a few px; the cost of over-crediting is a coin she can SEE and
 * never GET. Those costs are not symmetric.
 * ---------------------------------------------------------------------------
 *
 * THREE DELIBERATE, LOAD-BEARING LIMITATIONS — documented, never papered over:
 *
 * 1. [CLOSED by Plan 34-02 — see the OBSTRUCTION section above.] It ORIGINALLY
 *    modelled no obstruction: it did not know that a platform underside can bonk the
 *    rising arc. docs/LEVEL-DESIGN.md section 3 records ceiling-bonk as a real,
 *    SHIPPED bug class, so this was not theoretical — and it was the ONE limitation
 *    that could make the model OVER-credit. scripts/audit-coins.mjs (34-02) replayed
 *    every witness in the real engine and FALSIFIED nine of them, all coins tucked
 *    under overhanging platforms. The model was then TIGHTENED (`arcIsClear`): a
 *    candidate whose arc drives the player's AABB into a platform/floor collider
 *    before it reaches the coin box is no longer a witness. The in-engine gate stays
 *    the arbiter — this model is still only the cheap filter.
 *
 *    Spikes and door/math-gate/enemy blockers remain UNMODELLED, deliberately: neither
 *    can make a coin permanently unreachable (no lockout state, no game-over, free
 *    checkpoint respawn), so treating them as obstructions would under-credit for no
 *    safety gain. See solidBoxes' comment.
 *
 * 2. It omits the variable-height cut-jump family (CONFIG.JUMP_CUT), so it
 *    UNDER-credits rather than over-credits, and every PASS witness stays
 *    replayable with a plain hold-direction + tap-jump input.
 *
 * 3. IT CLAMPS THE RISE TO envelope.maxRise (88.331px — EMPIRICALLY MEASURED)
 *    rather than to the theoretical apex (JUMP_FORCE^2/(2*GRAVITY) = 96.57px —
 *    NEVER ACTUALLY OBSERVED). maxRise is minObservedRise (92.98) * 0.95 from
 *    calibrate-jump-envelope.mjs's real engine trials. The model therefore
 *    under-credits by ~8px of rise BY DESIGN, matching jumpReach()'s own
 *    `dy < -envelope.maxRise` cutoff and every authoring rule in
 *    docs/LEVEL-DESIGN.md.
 *
 *    NOTE THE ASYMMETRY, because it is what makes limitation 3 the dangerous one.
 *    Limitations 1 and 2 are both SAFE in different ways: 2 under-credits (worst
 *    case, a coin gets moved that didn't strictly need moving), and 1, though it
 *    over-credits, is CAUGHT by 34-02's in-engine replay. An UNCLAMPED rise would
 *    be the only way this model over-credits in a way 34-02 STRUCTURALLY CANNOT
 *    CATCH: the real engine has the same theoretical apex, so a scripted, frame-
 *    perfect hold-jump WOULD collect a coin in the 88.3-96.6px dead band and the
 *    in-engine gate would go green — while a real 12-year-old, jumping imperfectly,
 *    would never get it. And a pickup that demands an apex-perfect jump is exactly
 *    the precision pressure this project forbids (no timers, no pressure,
 *    forgiving). Self-test Case Q is the guard on this clamp: an unclamped py(t)
 *    passes it, the clamped one fails it. Do not weaken it.
 */
export function bestWitnessToCoin(coin, nodes, spawnPaths, envelope, solids = []) {
  const box = coinTargetBox(coin);
  let best = null;
  // Trace budget is per-coin, shared across every node/family/direction searched for
  // this coin (see MAX_OBSTRUCTION_TRACES — exhaustion rejects, never accepts).
  let traces = 0;

  const consider = (candidate) => {
    if (witnessIsBetter(candidate, best)) best = candidate;
  };

  for (const n of nodes) {
    if (!spawnPaths.has(n.id)) continue;

    const surfaceTop = n.y - PLAYER_H; // player top-left y while standing on n
    const x0min = n.xStart;
    const x0max = Math.max(n.xStart, n.xEnd - PLAYER_W);

    // --- Family `walk` (t = 0): already touching it while standing/walking. ---
    if (surfaceTop >= box.y0 && surfaceTop <= box.y1) {
      const lo = Math.max(x0min, box.x0);
      const hi = Math.min(x0max, box.x1);
      if (lo <= hi) {
        // Obstruction-checked too (t=0, so this is just the standing body): a coin
        // walled off by an overhanging platform's collider at head height is not
        // walkable, however inviting its x-span looks.
        const walkX = TAKEOFF_FRACTIONS.map((f) => lo + (hi - lo) * f).find(
          (x) => !bodyHitsSolid(x, surfaceTop, solids, n.id)
        );
        if (walkX !== undefined) {
          consider({
            launchNodeId: n.id,
            launchY: n.y,
            takeoffX: walkX,
            dir: 1,
            family: "walk",
            t: 0,
          });
        }
      }
    }

    // FLAG-1 CLAMP (coarse, cheap): the coin's box BOTTOM (box.y1) is the easiest
    // part of it to touch — the least rise the arc must achieve. If even THAT
    // demands more rise than the empirically-calibrated ceiling, no arc from this
    // node reaches the coin at any x. Same cutoff jumpReach() applies at line ~113.
    if (surfaceTop - box.y1 > envelope.maxRise) continue;

    // --- Families `jump` and `fall` (t > 0) ---
    // py(t) is independent of x0, so filter on y FIRST (cheap), then solve x
    // analytically. t ascends, so the FIRST hit within a family is its smallest t.
    for (const family of ["fall", "jump"]) {
      const jumpForce = family === "jump" ? CONFIG.JUMP_FORCE : 0;
      let found = null;

      for (let t = SAMPLE_DT; t <= T_MAX && found === null; t += SAMPLE_DT) {
        const py = surfaceTop + 0.5 * CONFIG.GRAVITY * t ** 2 - jumpForce * t;

        // FLAG-1 CLAMP (per-sample): discard any instant whose arc has risen more
        // than the EMPIRICAL envelope allows. This is what makes the model reject
        // the 88.3-96.6px dead band that the raw quadratic would happily credit.
        if (surfaceTop - py > envelope.maxRise) continue;
        if (py < box.y0 || py > box.y1) continue;

        for (const dir of [1, -1]) {
          const dx = dir * envelope.runSpeed * t;
          const jf = jumpForce;

          // Reject any candidate whose arc bonks a solid before it gets to the coin
          // (34-02's tightening). Budget exhaustion counts as OBSTRUCTED — the model
          // must only ever under-credit. Note the t-loop CONTINUES past a blocked
          // candidate rather than abandoning the family: a rising arc blocked by a
          // ceiling can still be clear later on the DESCENT, and vice versa.
          const clear = (x0) => {
            if (traces >= MAX_OBSTRUCTION_TRACES) return false;
            traces += 1;
            return arcIsClear(surfaceTop, x0, dir, jf, t, solids, n.id, envelope);
          };

          if (family === "fall") {
            // x0 PINNED to the departure edge — a fall starts by walking OFF it.
            const x0 = dir > 0 ? x0max : x0min;
            const px = x0 + dx;
            if (px >= box.x0 && px <= box.x1 && clear(x0)) {
              found = { launchNodeId: n.id, launchY: n.y, takeoffX: x0, dir, family, t };
              break;
            }
          } else {
            // x0 FREE within the takeoff range: the arc clips the box iff the
            // required takeoff interval intersects the available one.
            const lo = Math.max(x0min, box.x0 - dx);
            const hi = Math.min(x0max, box.x1 - dx);
            if (lo <= hi) {
              // Midpoint first (preserves every already-verified 34-01 takeoffX), then
              // the endpoints/quartiles — an obstructed centre line does not condemn a
              // coin that a clear line from the same ledge can still collect.
              const x0 = TAKEOFF_FRACTIONS.map((f) => lo + (hi - lo) * f).find((c) => clear(c));
              if (x0 !== undefined) {
                found = {
                  launchNodeId: n.id,
                  launchY: n.y,
                  takeoffX: x0,
                  dir,
                  family,
                  t,
                };
                break;
              }
            }
          }
        }
      }

      if (found) consider(found);
    }
  }

  return best;
}

/**
 * The witness plan for every coin in a level: the CONTRACT Plan 34-02's in-engine
 * replay (scripts/audit-coins.mjs) imports. Its witness fields
 * (launchNodeId, launchY, takeoffX, dir, family, t) must stay stable.
 *
 * PURE and node-importable — no engine globals, ever (a727c13).
 */
export function planCoinWitnesses(geometry, envelope = JUMP_ENVELOPE) {
  const nodes = buildNodes(geometry);
  const graph = buildGraph(nodes, envelope);
  const spawnNode = nodeContaining(nodes, SPAWN_X);
  const spawnPaths = spawnNode ? bfsWithPathMargin(graph, spawnNode.id) : new Map();
  const solids = solidBoxes(geometry);

  return (geometry.coins ?? []).map((coin, index) => ({
    index,
    coin,
    witness: bestWitnessToCoin(coin, nodes, spawnPaths, envelope, solids),
  }));
}

// ===========================================================================
// HEADROOM (Phase 34, Plan 34-06, LVL-03) — the rule that was only ever prose.
// ===========================================================================

/**
 * Every x-overlapping platform pair whose vertical clearance is below
 * MIN_HEADROOM_PX, as { upper, lower, upperIndex, lowerIndex, rise, overlap, headroom }.
 *
 * THE MEASUREMENT (docs/LEVEL-DESIGN.md section 3.2):
 *
 *   headroom = lower.y - (upper.y + upper.h) - PLAYER_H
 *
 * i.e. the lower platform's walkable surface, minus the upper platform's UNDERSIDE,
 * minus the 32px player. Kaplay's y grows downward, so `upper` is the one with the
 * SMALLER y.
 *
 * `upper.h` is used AS AUTHORED, never assumed to be 16. The 16px WYSIWYG thickness
 * is its own HARD rule (LEVEL-DESIGN section 3.1), and a level that violates it must
 * still be measured honestly here — a 24px-thick platform genuinely eats 8 more px of
 * her head than a 16px one, which is precisely how level-07's 65px rise produces 9px
 * of clearance rather than the 17px an assumed-16 model would have reported. With the
 * mandated 16px thickness the rule reduces to `rise >= 72px`.
 *
 * FLOOR-vs-PLATFORM overlaps are deliberately OUT OF SCOPE, matching the agreed rule's
 * wording ("any two platforms that overlap in x"): a bridging platform's short overlap
 * with the lip of the floor run beside its gap is a different, milder situation than a
 * climb tier forming a continuous ceiling over the tier you walk along. Several shipped
 * levels do have low bridging platforms over a floor lip — they are recorded in
 * docs/LEVEL-REVIEW.md as an input to the Phase 34.5 rebuild rather than silently
 * folded into this gate.
 *
 * PURE: takes geometry, returns data. `?? []`-guarded — an omitted platforms array
 * yields zero violations and never throws.
 */
export function findHeadroomViolations(geometry, minHeadroom = MIN_HEADROOM_PX) {
  const platforms = geometry.platforms ?? [];
  const violations = [];
  for (let i = 0; i < platforms.length; i++) {
    for (let j = 0; j < platforms.length; j++) {
      if (i === j) continue;
      const upper = platforms[i];
      const lower = platforms[j];
      if (!(upper.y < lower.y)) continue; // `upper` must actually be above `lower`
      const overlap =
        Math.min(upper.x + upper.w, lower.x + lower.w) - Math.max(upper.x, lower.x);
      if (overlap <= 0) continue; // no shared x — no ceiling, nothing to clear
      const headroom = lower.y - (upper.y + upper.h) - PLAYER_H;
      if (headroom >= minHeadroom) continue;
      violations.push({
        upper,
        lower,
        upperIndex: i,
        lowerIndex: j,
        rise: lower.y - upper.y,
        overlap,
        headroom,
      });
    }
  }
  return violations;
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

  // --- coin-reachability: the 32x32 fly-through pickups (LVL-01, Phase 34).
  // Reuses the ALREADY-COMPUTED nodes/spawnPaths above — never re-derived.
  // `?? []`-guarded: an omitted geometry.coins produces zero rows, never throws.
  //
  // PASS or HARD-FAIL only — deliberately NO WARN tier. WARN exists to flag a hop
  // tight enough that player imprecision could miss it, but a coin's 48x64
  // pass-through box ALREADY absorbs exactly that imprecision (that is what the box
  // model is for), and the real tightness arbiter is the in-engine witness replay
  // (Plan 34-02), which either collects the coin or does not. A WARN tier here
  // would be a row that never fails anything — precisely the kind of green gate
  // this phase exists to eliminate. HARD-FAIL matches this project's exact-fact
  // convention for any unreachable entity (the same convention
  // secret-alcove-reachability follows).
  //
  // The witness is printed INTO the descriptor on PASS so that the coin-move plans
  // (34-03/04/05) and the in-engine gate (34-02) can both act on it directly.
  // 34-02: the SAME obstruction-aware model the in-engine gate consumes — the static
  // claim and the replayed claim must never diverge.
  const coinSolids = solidBoxes(geometry);
  for (const [i, c] of (geometry.coins ?? []).entries()) {
    const w = bestWitnessToCoin(c, nodes, spawnPaths, envelope, coinSolids);
    if (w === null) {
      rows.push({
        check: "coin-reachability",
        status: "HARD-FAIL",
        descriptor: `coins[${i}] x:${c.x} y:${c.y} unreachable from spawn`,
      });
    } else {
      rows.push({
        check: "coin-reachability",
        status: "PASS",
        descriptor: `coins[${i}] x:${c.x} y:${c.y} reached (family=${w.family} from ${w.launchNodeId} takeoffX=${w.takeoffX.toFixed(1)} dir=${w.dir})`,
      });
    }
  }

  // --- mover-reachability: worst-case-extreme rule (MOT-04). Reuses
  // bestMarginToPoint for both ping-pong endpoints — no duplicated reachability
  // math. A mover is available at EITHER endpoint independently (the player may
  // arrive exactly when it's at its least helpful position), so this reports the
  // WORSE (higher marginRatio, tighter/more likely to fail) of the two endpoint
  // results, per this file's own convention (WARN_MARGIN_RATIO's header comment
  // and every other tiering decision in this function: a HIGHER marginRatio means
  // a tighter, harder-to-land hop closer to the calibrated envelope's max reach);
  // if EITHER endpoint is flatly unreachable, the whole mover HARD-FAILs.
  // `?? []`-guarded: zero real levels carry geometry.movers today (Phase 36
  // places the first one), so this produces zero rows against all 8 shipped
  // levels — nothing to report on an empty array.
  for (const [i, m] of (geometry.movers ?? []).entries()) {
    const r1 = bestMarginToPoint({ x: m.x1, y: m.y1 }, nodes, spawnPaths, envelope);
    const r2 = bestMarginToPoint({ x: m.x2, y: m.y2 }, nodes, spawnPaths, envelope);
    if (r1 === null || r2 === null) {
      const badEndpoint = r1 === null ? `x1:${m.x1} y1:${m.y1}` : `x2:${m.x2} y2:${m.y2}`;
      rows.push({
        check: "mover-reachability",
        status: "HARD-FAIL",
        descriptor: `mover[${i}] endpoint (${badEndpoint}) unreachable from spawn (worst-case-extreme)`,
      });
    } else {
      const worst = Math.max(r1.marginRatio, r2.marginRatio);
      rows.push({
        check: "mover-reachability",
        status: worst >= WARN_MARGIN_RATIO ? "WARN" : "PASS",
        descriptor: `mover[${i}] (${m.x1},${m.y1})<->(${m.x2},${m.y2}) worst-case reached (marginRatio=${worst.toFixed(3)})`,
      });
    }
  }

  // --- headroom: x-overlapping platform pairs must leave the 32px player at least
  // MIN_HEADROOM_PX of clearance (LVL-03, Plan 34-06). HARD-FAIL only — deliberately
  // no WARN tier: a cramped ceiling is an exact geometric fact about a fixed-size
  // player, not a question of player imprecision, and a WARN row here would be a row
  // that never fails anything (exactly the green-gate-that-lies this phase exists to
  // end). One row per violating pair, so a climb that is cramped on five tiers reports
  // five rows and the author can see the shape of it.
  //
  // EXPECTED RED (2026-07-14): level-07 HARD-FAILs this on all five of its end-climb
  // tiers at 9px. That is the RED-first proof the check is load-bearing, not a
  // regression introduced by it. level-07 is deliberately NOT retrofitted — Phase 34.5
  // rebuilds every level from scratch against docs/LEVEL-DESIGN.md, so patching its
  // geometry now would be throwaway work on geometry about to be replaced. Do NOT
  // weaken this check to make the suite green.
  for (const v of findHeadroomViolations(geometry)) {
    rows.push({
      check: "headroom",
      status: "HARD-FAIL",
      descriptor:
        `platforms[${v.upperIndex}] (x:${v.upper.x} y:${v.upper.y} h:${v.upper.h}) over ` +
        `platforms[${v.lowerIndex}] (x:${v.lower.x} y:${v.lower.y}): headroom=${v.headroom}px ` +
        `(< ${MIN_HEADROOM_PX}px; rise=${v.rise}px, x-overlap=${v.overlap}px) — a 32px player in a ` +
        `${v.headroom + PLAYER_H}px slot`,
    });
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

  // --- Task 2 (mover-reachability, worst-case-extreme) behavior cases ---

  // Case K: a mover whose near endpoint sits on the spawn floor at the SAME y
  // (dy=0, trivial walk) and whose far endpoint requires a 150px rise
  // (exceeding maxRise) -> mover-reachability HARD-FAIL (the worst of the two,
  // since the far endpoint is null/unreachable).
  {
    const geometry = {
      floors: [{ x: 0, w: 400 }],
      goal: { x: 350, y: 320 },
      movers: [{ x1: 150, y1: 320, x2: 250, y2: 170 }],
    };
    const { rows } = checkLevelReachability(geometry, testEnvelope);
    const moverRows = rows.filter((r) => r.check === "mover-reachability");
    check(moverRows.length === 1, `expected exactly 1 mover-reachability row, got ${moverRows.length}`);
    check(moverRows[0]?.status === "HARD-FAIL", `expected HARD-FAIL for a mover with an unreachable far endpoint, got ${JSON.stringify(moverRows[0])}`);
  }

  // Case L: a mover whose BOTH endpoints are comfortably within jump range ->
  // mover-reachability PASS or WARN, never HARD-FAIL.
  {
    const geometry = {
      floors: [{ x: 0, w: 560 }],
      platforms: [{ x: 360, y: 240, w: 160, h: 24 }],
      goal: { x: 100, y: 320 },
      movers: [{ x1: 150, y1: 320, x2: 400, y2: 170 }],
    };
    const { rows } = checkLevelReachability(geometry, testEnvelope);
    const moverRows = rows.filter((r) => r.check === "mover-reachability");
    check(moverRows.length === 1, `expected exactly 1 mover-reachability row, got ${moverRows.length}`);
    check(
      moverRows[0]?.status === "PASS" || moverRows[0]?.status === "WARN",
      `expected PASS or WARN for a fully-in-range mover, got ${JSON.stringify(moverRows[0])}`
    );
  }

  // Case M: checkLevelReachability with geometry.movers omitted -> zero
  // mover-reachability rows, never throws.
  {
    const geometry = { floors: [{ x: 0, w: 400 }], goal: { x: 100, y: 320 } };
    let threw = false;
    let result;
    try {
      result = checkLevelReachability(geometry, testEnvelope);
    } catch {
      threw = true;
    }
    check(!threw, "checkLevelReachability must never throw when geometry.movers is omitted");
    const moverRows = result?.rows.filter((r) => r.check === "mover-reachability") ?? [];
    check(moverRows.length === 0, `expected zero mover-reachability rows when omitted, got ${moverRows.length}`);
  }

  // --- Phase 34 (bestWitnessToCoin / coin-reachability) behavior cases ---
  //
  // All four use the same trivial arena: one floor {x:0, w:400} at CONFIG.FLOOR_Y
  // (320), so the player's standing top-left y is 320 - PLAYER_H = 288. Only the
  // coin's y moves between cases — which is exactly the axis the envelope clamp
  // lives on.
  const coinFloor = () => [{ id: "floor-0", xStart: 0, xEnd: 400, y: CONFIG.FLOOR_Y }];
  const coinSpawnPaths = () => {
    const nodes = coinFloor();
    return bfsWithPathMargin(buildGraph(nodes, testEnvelope), "floor-0");
  };

  // Case N (walk witness): a coin at the standard shipped floor-coin height
  // {x:200, y:264} — its box y-range is [232, 296], which CONTAINS the standing
  // top-left y of 288. The player collects it just by walking through it: family
  // `walk`, t = 0. This is the case that proves the coin model does NOT inherit the
  // alcove model's landing question — the alcove model would ask whether the player
  // can come to rest AT (200, 264), which is not a thing the game ever requires.
  {
    const nodes = coinFloor();
    const w = bestWitnessToCoin({ x: 200, y: 264 }, nodes, coinSpawnPaths(), testEnvelope);
    check(w !== null, `expected a non-null witness for a walk-through floor coin, got ${JSON.stringify(w)}`);
    check(w?.family === "walk", `expected family="walk" for a floor-height coin, got ${JSON.stringify(w)}`);
    check(w?.t === 0, `expected t=0 for a walk witness, got ${JSON.stringify(w)}`);
  }

  // Case O (jump witness): a coin at {x:200, y:176} — box y-range [144, 208], whose
  // BOTTOM edge (208) needs a rise of 288-208 = 80px: comfortably inside the
  // calibrated maxRise (88.331). Not walkable, but jumpable.
  {
    const nodes = coinFloor();
    const w = bestWitnessToCoin({ x: 200, y: 176 }, nodes, coinSpawnPaths(), testEnvelope);
    check(w !== null, `expected a non-null witness for an in-envelope airborne coin, got ${JSON.stringify(w)}`);
    check(w?.family === "jump", `expected family="jump" for an airborne coin, got ${JSON.stringify(w)}`);
    check(w?.t > 0, `expected t>0 for a jump witness, got ${JSON.stringify(w)}`);
  }

  // Case P (genuinely unreachable): a coin at {x:200, y:60} — box y-range [28, 124],
  // whose bottom edge needs a rise of 288-124 = 164px, far beyond ANY jump from ANY
  // x. Witness must be null AND checkLevelReachability must emit exactly one
  // coin-reachability row, HARD-FAIL.
  {
    const nodes = coinFloor();
    const w = bestWitnessToCoin({ x: 200, y: 60 }, nodes, coinSpawnPaths(), testEnvelope);
    check(w === null, `expected null for a coin far beyond maxRise, got ${JSON.stringify(w)}`);

    const geometry = {
      floors: [{ x: 0, w: 400 }],
      goal: { x: 350, y: 304 },
      coins: [{ x: 200, y: 60 }],
    };
    const { rows } = checkLevelReachability(geometry, testEnvelope);
    const coinRows = rows.filter((r) => r.check === "coin-reachability");
    check(coinRows.length === 1, `expected exactly 1 coin-reachability row, got ${coinRows.length}`);
    check(coinRows[0]?.status === "HARD-FAIL", `expected HARD-FAIL for an unreachable coin, got ${JSON.stringify(coinRows[0])}`);
  }

  // ==========================================================================
  // Case Q — THE ENVELOPE CLAMP (PLAN-CHECK FIX FLAG-1).
  //
  // THE ONE CASE THAT PINS THE MODEL'S ONLY UNCATCHABLE ERROR DIRECTION.
  //
  // A coin at {x:200, y:160}: box y-range [128, 192]. The EASIEST part of that box
  // to touch is its BOTTOM edge (192), which demands a rise of 288 - 192 = 96px.
  //
  //   theoretical apex = JUMP_FORCE^2/(2*GRAVITY) = 96.57px  -> 96px fits (barely)
  //   calibrated maxRise (EMPIRICAL)              = 88.331px -> 96px does NOT fit
  //
  // So this coin sits squarely in the dead band BETWEEN the empirically-measured
  // ceiling and the never-actually-observed theoretical apex. An UNCLAMPED py(t)
  // model PASSES this coin (its raw parabola dips to py=191.43 at t~0.371s, just
  // inside the box); the CLAMPED model correctly rejects it.
  //
  // This assertion is the only thing standing between the coin model and the one
  // error it can make that Plan 34-02's in-engine replay is STRUCTURALLY UNABLE to
  // catch: the real engine has the same theoretical apex, so a scripted, frame-
  // perfect hold-jump WOULD collect this coin and turn 34-02's gate green — while a
  // real 12-year-old, jumping imperfectly, never would. DO NOT weaken, skip, or
  // re-tier this case.
  //
  // (NOTE, recorded as a deviation in 34-01-SUMMARY.md: the PLAN specified this
  // coin at y:224. That coordinate is arithmetically wrong for its own stated
  // intent — a coin at y:224 has box [192, 256], whose BOTTOM edge needs only a
  // 32px rise, making it trivially reachable and the assertion vacuous. The plan's
  // prose is unambiguous about what it wanted ("a rise of 288 - 192 = 96px",
  // "inside the theoretical apex, OUTSIDE the calibrated envelope"), and y:160 is
  // the coordinate that actually produces box [128, 192] and that 96px rise. The
  // case is implemented at FULL strength, not weakened.)
  // ==========================================================================
  {
    const nodes = coinFloor();
    const deadBandCoin = { x: 200, y: 160 };

    // Guard the guard: assert the fixture really does sit in the dead band, so a
    // future retune of CONFIG/JUMP_ENVELOPE cannot silently make this case vacuous.
    const box = coinTargetBox(deadBandCoin);
    const surfaceTop = CONFIG.FLOOR_Y - PLAYER_H;
    const requiredRise = surfaceTop - box.y1;
    const theoreticalApex = CONFIG.JUMP_FORCE ** 2 / (2 * CONFIG.GRAVITY);
    check(
      requiredRise > testEnvelope.maxRise && requiredRise <= theoreticalApex,
      `Case Q fixture must sit in the dead band (maxRise ${testEnvelope.maxRise} < requiredRise <= apex ${theoreticalApex.toFixed(2)}), got requiredRise=${requiredRise}`
    );

    const w = bestWitnessToCoin(deadBandCoin, nodes, coinSpawnPaths(), testEnvelope);
    check(
      w === null,
      `ENVELOPE CLAMP BROKEN: a coin needing ${requiredRise}px of rise (> the empirical maxRise ${testEnvelope.maxRise}px, <= the never-observed theoretical apex ${theoreticalApex.toFixed(2)}px) MUST be unreachable — the model is over-crediting, the one error 34-02 cannot catch. Got ${JSON.stringify(w)}`
    );

    const geometry = {
      floors: [{ x: 0, w: 400 }],
      goal: { x: 350, y: 304 },
      coins: [deadBandCoin],
    };
    const { rows } = checkLevelReachability(geometry, testEnvelope);
    const coinRows = rows.filter((r) => r.check === "coin-reachability");
    check(coinRows.length === 1, `expected exactly 1 coin-reachability row, got ${coinRows.length}`);
    check(
      coinRows[0]?.status === "HARD-FAIL",
      `expected HARD-FAIL for a dead-band coin, got ${JSON.stringify(coinRows[0])}`
    );
  }

  // ==========================================================================
  // Case S — THE OBSTRUCTION CHECK (Plan 34-02; the model tightened BY the engine).
  //
  // This is the fixture the real engine handed us. It is level-01's actual, shipped
  // geometry around coins[10], reduced to its load-bearing parts:
  //
  //   floor  1360..2240 @ y320   (the launch ledge)
  //   floor  2400..2880 @ y320   (the far side of the gap)
  //   platform 2240..2368 @ y250 h24   (an overhang jutting out over the gap)
  //   coin   (2280, 264)         (tucked UNDER that overhang)
  //
  // The OBSTRUCTION-BLIND model (Plan 34-01) PASSED this coin: its raw parabola from
  // the ledge sails right through the platform's solid box and clips the coin's
  // 48x64 target box on the way. scripts/audit-coins.mjs then drove the real player,
  // with real key input, on that exact witness — and the real onCollide("coin")
  // handler never fired. The player's head hits the platform underside (y274) and the
  // arc is redirected: a CEILING BONK, the shipped bug class in LEVEL-DESIGN.md
  // section 3.
  //
  // So this case pins the fix in BOTH directions, which is the only way to prove the
  // check is load-bearing rather than decorative:
  //   - WITHOUT solids (the old blind model): a witness IS found  -> it over-credited.
  //   - WITH solids    (the tightened model): the witness is null -> HARD-FAIL.
  // Delete the obstruction check and the second assertion fails immediately.
  // ==========================================================================
  {
    const geometry = {
      floors: [
        { x: 0, w: 200 }, // spawn (x:64) sits here
        { x: 1360, w: 880 }, // the launch ledge (reachable via the chain below)
        { x: 2400, w: 480 },
      ],
      platforms: [
        // A stepping chain from spawn out to the launch ledge, so the ledge is
        // genuinely spawn-reachable and the case tests OBSTRUCTION, not connectivity.
        { x: 300, y: 260, w: 160, h: 24 },
        { x: 560, y: 260, w: 160, h: 24 },
        { x: 820, y: 260, w: 160, h: 24 },
        { x: 1080, y: 260, w: 160, h: 24 },
        // The overhang that actually bonks the arc — level-01's real one.
        { x: 2240, y: 250, w: 128, h: 24 },
      ],
      goal: { x: 2800, y: 304 },
      coins: [{ x: 2280, y: 264 }],
    };
    const nodes = buildNodes(geometry);
    const graph = buildGraph(nodes, testEnvelope);
    const spawnPaths = bfsWithPathMargin(graph, nodeContaining(nodes, SPAWN_X).id);
    const coin = geometry.coins[0];

    // Guard the guard: the launch ledge must really be spawn-reachable, or this case
    // would "pass" for the wrong reason (connectivity, not obstruction).
    const ledge = nodes.find((n) => n.xStart === 1360);
    check(
      spawnPaths.has(ledge.id),
      "Case S fixture broken: the launch ledge must be spawn-reachable, or the case tests connectivity instead of obstruction"
    );

    const blind = bestWitnessToCoin(coin, nodes, spawnPaths, testEnvelope); // no solids
    check(
      blind !== null,
      `Case S fixture must be a coin the OBSTRUCTION-BLIND model over-credits (that is the whole point of the case) — got ${JSON.stringify(blind)}`
    );

    const tightened = bestWitnessToCoin(
      coin,
      nodes,
      spawnPaths,
      testEnvelope,
      solidBoxes(geometry)
    );
    check(
      tightened === null,
      `OBSTRUCTION CHECK BROKEN: a coin tucked under a solid platform overhang (level-01's real coins[10]) MUST be unreachable — the real engine refused to collect it on this exact witness (34-02's audit-coins.mjs run). Got ${JSON.stringify(tightened)}`
    );

    const coinRows = checkLevelReachability(geometry, testEnvelope).rows.filter(
      (r) => r.check === "coin-reachability"
    );
    check(coinRows.length === 1, `expected exactly 1 coin-reachability row, got ${coinRows.length}`);
    check(
      coinRows[0]?.status === "HARD-FAIL",
      `expected HARD-FAIL for a ceiling-bonked coin, got ${JSON.stringify(coinRows[0])}`
    );
  }

  // Case R (omitted array): geometry.coins omitted entirely -> zero
  // coin-reachability rows, never throws. (The plan labelled this "Case Q" too;
  // renamed to R so the two are distinguishable.)
  {
    const geometry = { floors: [{ x: 0, w: 400 }], goal: { x: 100, y: 320 } };
    let threw = false;
    let result;
    try {
      result = checkLevelReachability(geometry, testEnvelope);
    } catch {
      threw = true;
    }
    check(!threw, "checkLevelReachability must never throw when geometry.coins is omitted");
    const coinRows = result?.rows.filter((r) => r.check === "coin-reachability") ?? [];
    check(coinRows.length === 0, `expected zero coin-reachability rows when omitted, got ${coinRows.length}`);
  }

  // ==========================================================================
  // Cases T/U/V — HEADROOM (Plan 34-06, LVL-03). PINNED IN BOTH DIRECTIONS.
  //
  // A one-directional test ("the compliant pair passes") would be satisfied by a
  // check that never fires at all — which is exactly the state this rule was in for
  // four milestones: prose in docs/LEVEL-DESIGN.md, enforced by nothing, while
  // level-07 shipped 9px on every tier. So the failing direction is asserted FIRST,
  // against level-07's REAL, SHIPPED coordinates.
  // ==========================================================================

  // Case T (the RED direction — level-07's real geometry): two consecutive tiers of
  // level-07's actual end climb, verbatim from src/levels/level-07.js:
  //   platform (2650, 255, w280, h24)   <- the lower walk
  //   platform (2860, 190, w260, h24)   <- the ceiling above it
  // rise 65px, x-overlap 70px, thickness 24px
  //   headroom = 255 - (190 + 24) - 32 = 9px.
  // A 32px player in a 41px slot. MUST HARD-FAIL.
  {
    const geometry = {
      floors: [{ x: 0, w: 3000 }],
      platforms: [
        { x: 2650, y: 255, w: 280, h: 24 },
        { x: 2860, y: 190, w: 260, h: 24 },
      ],
      goal: { x: 2900, y: 304 },
    };
    const violations = findHeadroomViolations(geometry);
    check(
      violations.length === 1,
      `expected exactly 1 headroom violation for level-07's real 9px tier pair, got ${violations.length}`
    );
    check(
      violations[0]?.headroom === 9,
      `expected the measured headroom to be exactly 9px (level-07's shipped value), got ${JSON.stringify(violations[0])}`
    );

    const { rows, hardFailCount } = checkLevelReachability(geometry, testEnvelope);
    const headroomRows = rows.filter((r) => r.check === "headroom");
    check(headroomRows.length === 1, `expected exactly 1 headroom row, got ${headroomRows.length}`);
    check(
      headroomRows[0]?.status === "HARD-FAIL",
      `HEADROOM CHECK BROKEN: level-07's real 9px tier pair MUST HARD-FAIL. Got ${JSON.stringify(headroomRows[0])}`
    );
    check(hardFailCount >= 1, `a headroom violation must increment hardFailCount, got ${hardFailCount}`);
  }

  // Case U (the GREEN direction — a compliant pair): the same shape rebuilt to the
  // rulebook — 16px WYSIWYG thickness, 75px rise, ~70px x-overlap (level-08's Phase-34
  // switchback numbers):
  //   headroom = 248 - (173 + 16) - 32 = 27px  >= MIN_HEADROOM_PX (24)
  // MUST PASS — a check that fails everything is as useless as one that fails nothing.
  {
    const geometry = {
      floors: [{ x: 0, w: 3000 }],
      platforms: [
        { x: 2410, y: 248, w: 300, h: 16 },
        { x: 2640, y: 173, w: 280, h: 16 },
      ],
      goal: { x: 2900, y: 304 },
    };
    const violations = findHeadroomViolations(geometry);
    check(
      violations.length === 0,
      `expected ZERO headroom violations for a compliant 75px-rise / 16px-thick pair (27px headroom), got ${JSON.stringify(violations)}`
    );
    const headroomRows = checkLevelReachability(geometry, testEnvelope).rows.filter(
      (r) => r.check === "headroom"
    );
    check(
      headroomRows.length === 0,
      `a compliant tier pair must emit ZERO headroom rows, got ${JSON.stringify(headroomRows)}`
    );
  }

  // Case V (the boundary + the non-overlapping exemption + the ?? [] guard):
  //   - a pair at EXACTLY MIN_HEADROOM_PX (rise 72, h16 -> headroom 24) passes: the
  //     rule is >= 24, and the 72px rise floor in LEVEL-DESIGN 3.3 is derived from it.
  //     If this flips, the two documents have silently drifted apart.
  //   - a cramped-looking pair that shares NO x is exempt: no overlap, no ceiling.
  //   - omitted platforms never throws.
  {
    const boundary = {
      floors: [{ x: 0, w: 3000 }],
      platforms: [
        { x: 2400, y: 248, w: 300, h: 16 },
        { x: 2630, y: 176, w: 280, h: 16 }, // rise 72 -> headroom exactly 24
      ],
      goal: { x: 2900, y: 304 },
    };
    check(
      findHeadroomViolations(boundary).length === 0,
      `headroom exactly == MIN_HEADROOM_PX (${MIN_HEADROOM_PX}) must PASS — LEVEL-DESIGN's 72px overlapping-rise floor is derived from this boundary`
    );

    const noOverlap = {
      floors: [{ x: 0, w: 3000 }],
      platforms: [
        { x: 2650, y: 255, w: 200, h: 24 },
        { x: 2900, y: 190, w: 200, h: 24 }, // 9px of "headroom" but ZERO shared x
      ],
      goal: { x: 2900, y: 304 },
    };
    check(
      findHeadroomViolations(noOverlap).length === 0,
      "platforms that share no x form no ceiling and must be exempt from the headroom rule"
    );

    let threw = false;
    try {
      findHeadroomViolations({ floors: [{ x: 0, w: 100 }] });
    } catch {
      threw = true;
    }
    check(!threw, "findHeadroomViolations must never throw on an omitted platforms array");
  }

  if (failures > 0) {
    console.error(`reachability-selftest: FAIL — ${failures} assertion(s) failed`);
    process.exit(1);
  }
  console.log("reachability-selftest: PASS");
}
