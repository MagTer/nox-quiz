// scripts/lib/key-lock-check.mjs — the STATIC softlock proof for the key/lock
// mechanic (Phase 34.5, KEY-02). Consumed by scripts/validate-levels.mjs, exactly
// the way scripts/lib/over-hole-check.mjs and scripts/lib/reachability.mjs's
// checkLevelReachability already are.
//
// PURE module: no engine globals, no Playwright, no browser (a727c13-safe). Reads
// level.geometry (src/levels/*.js shape) + the frozen calibrated envelope constant
// from ./jump-envelope.mjs.
//
// ============================================================================
// THE SOUNDNESS INVARIANT — read before touching this file.
// ============================================================================
//
// The lock's in-engine collider is APEX-TALL: src/levels/build.js emits it with
// `blockerH = Math.ceil((CONFIG.JUMP_FORCE**2)/(2*CONFIG.GRAVITY)) + 64` (the same
// formula the door/mathGate/enemy blockers use, build.js:273/299/331) — a wall
// that reaches well above the highest point any real jump arc can reach, plus a
// margin. NO jump arc can cross ABOVE it. That is what makes it sound to model a
// lock as an impassable x-band PARTITION of the reachability graph, at ANY
// placement (mid a single floor run, straddling two runs, or under/beside a
// platform) — not merely a special case for "a lock in the middle of one floor
// run." docs/LEVEL-DESIGN.md / Phase 34.6 authors: a lock partitions its floor
// run ONLY BECAUSE the blocker is apex-tall; if a future change ever makes the
// lock's blocker shorter than the apex formula, this whole model becomes unsound
// and must be revisited.
//
// WHY A NAIVE MODEL IS INERT (the bug this file's design was corrected to avoid):
// `reachability.mjs`'s `buildNodes` emits ONE node per floor run spanning its
// FULL width (`{ id:"floor-N", xStart:f.x, xEnd:f.x+f.w, y }`). A lock sitting
// mid-run does NOT split that node. So a plain "drop the edges that cross the
// lock's x-band" implementation, applied to the UNMODIFIED node set, leaves the
// single full-width floor node fully connected to itself — there is no edge
// between "floor-0" and "floor-0" to drop, because it is the SAME node on both
// sides of the lock. A same-floor-run key-behind-lock softlock would silently
// PASS under that model. This file instead PHYSICALLY CUTS every node's own span
// at the lock's band before building the graph (see `clipNodesAtBand` below), so
// a lock genuinely splits the floor run it sits on into two independent halves —
// then, as a belt-and-suspenders safety net, ALSO drops any surviving edge whose
// endpoints land on opposite sides of the band (this catches both the freshly-
// split adjacent pieces reconnecting trivially across the now-tiny band gap, and
// any OTHER node — e.g. a low bridging platform — that might otherwise offer a
// same-side launch point into the far side).
//
// NEVER-BRICK GUARD: `geometry.locks`/`geometry.keys` are `?? []`-guarded, so
// every existing (key-lock-free) level yields zero rows and never throws.

import { fileURLToPath } from "url";

import { CONFIG } from "../../src/config.js";
import { JUMP_ENVELOPE } from "./jump-envelope.mjs";
import {
  buildNodes,
  buildGraph,
  bfsWithPathMargin,
  bestMarginToPoint,
  nodeContaining,
  SPAWN_X,
  WARN_MARGIN_RATIO,
} from "./reachability.mjs";

/**
 * Clip every node's own span against the lock's x-band [bandLo, bandHi),
 * producing a lock-cut node set:
 *
 *   - a node entirely outside the band is passed through UNCHANGED.
 *   - a node that overlaps the band is split into up to two remainder pieces
 *     (its portion left of bandLo, and/or its portion right of bandHi) —
 *     whichever piece(s) have positive width survive, each under a new,
 *     distinct id (`${id}-L` / `${id}-R`).
 *   - a node FULLY EMBEDDED inside the band (no positive-width remainder on
 *     either side) is dropped entirely: no walkable surface exists there once
 *     the lock's apex-tall collider occupies that x-range.
 *
 * This is the fix for the naive-model bug documented in this file's header: a
 * plain "drop crossing edges" pass over the UNMODIFIED buildNodes() output
 * never disconnects a lock sitting mid a single full-width floor run, because
 * there is only one node to begin with. Clipping first guarantees the lock's
 * band always produces a genuine cut, regardless of node kind (floor or
 * platform) or where inside a run the lock sits.
 */
function clipNodesAtBand(nodes, bandLo, bandHi) {
  const cut = [];
  for (const n of nodes) {
    const overlapsBand = n.xStart < bandHi && n.xEnd > bandLo;
    if (!overlapsBand) {
      cut.push(n);
      continue;
    }
    if (n.xStart < bandLo) {
      cut.push({ id: `${n.id}-L`, xStart: n.xStart, xEnd: bandLo, y: n.y });
    }
    if (n.xEnd > bandHi) {
      cut.push({ id: `${n.id}-R`, xStart: bandHi, xEnd: n.xEnd, y: n.y });
    }
    // else: fully embedded in the band — dropped, no remainder survives.
  }
  return cut;
}

/**
 * Build the directed adjacency over the ALREADY-CLIPPED node set, then drop
 * every surviving edge whose endpoints sit on opposite sides of the band. This
 * is required IN ADDITION to clipping: after clipping, a split node's own two
 * halves sit only `bandHi - bandLo` (= CONFIG.LOCK.W, typically 32px) apart —
 * trivially within jump range — so `buildGraph` would otherwise reconnect them
 * directly across the lock's own footprint. Any node surviving clipping is, by
 * construction, entirely on one side of the band or the other (never straddling
 * it — a straddling remainder was either clipped down to one side or dropped
 * outright), so classifying each node's side is unambiguous.
 */
function buildLockCutGraph(cutNodes, bandLo, bandHi, envelope) {
  const graph = buildGraph(cutNodes, envelope);
  const byId = new Map(cutNodes.map((n) => [n.id, n]));
  const sideOf = (n) => (n.xEnd <= bandLo ? "left" : n.xStart >= bandHi ? "right" : "unknown");

  const cutGraph = new Map();
  for (const [fromId, edges] of graph) {
    const fromSide = sideOf(byId.get(fromId));
    cutGraph.set(
      fromId,
      edges.filter((edge) => {
        const toSide = sideOf(byId.get(edge.to));
        return fromSide === toSide || fromSide === "unknown" || toSide === "unknown";
      })
    );
  }
  return cutGraph;
}

/**
 * CR-01 fix: lock-aware wrapper around reachability.mjs's `bestMarginToPoint`.
 *
 * `bestMarginToPoint` was built for the secret-alcove/coin/mover point model —
 * triggers with no solid collider — and its "cross-height gap hop" candidate
 * (case 3) is evaluated per spawn-reachable NODE purely on horizontal
 * jump-envelope reach, with no awareness that a lock's band is a real, solid,
 * apex-tall wall. Reused unmodified against a key point, it can credit a hop
 * whose straight line passes straight through the lock's own collider (see
 * 34.5-REVIEW.md CR-01 for the reproduced false-PASS window).
 *
 * `cutNodes` (this file's `clipNodesAtBand` output) is ALREADY split/dropped at
 * the band, so every surviving node is unambiguously on one side of the band or
 * the other — never straddling it (mirrors `buildLockCutGraph`'s own `sideOf`
 * reasoning). That makes the fix simple and local: before delegating to
 * `bestMarginToPoint`, drop every node that sits on the OPPOSITE side of the
 * band from the key point. A hop from a same-side node can never cross the
 * band (there is nothing on the far side for it to originate from); a hop from
 * an opposite-side node necessarily WOULD cross it, so it must never be
 * credited. `bestMarginToPoint` itself is untouched — it is shared with the
 * alcove/coin/mover checks, which have no lock/band concept at all.
 */
function sideOfBand(x, bandLo, bandHi) {
  if (x <= bandLo) return "left";
  if (x >= bandHi) return "right";
  return "inside"; // point literally inside the lock's own footprint — should not occur for real content
}

function bestMarginToPointExcludingBand(point, nodes, spawnPaths, envelope, bandLo, bandHi) {
  const pointSide = sideOfBand(point.x, bandLo, bandHi);
  const sameSideNodes = nodes.filter((n) => {
    const nodeSide = n.xEnd <= bandLo ? "left" : n.xStart >= bandHi ? "right" : "inside";
    // Permissive on "inside" (should not occur post-clip) — only exclude a node
    // when both sides are unambiguously known AND opposite.
    if (pointSide === "inside" || nodeSide === "inside") return true;
    return nodeSide === pointSide;
  });
  return bestMarginToPoint(point, sameSideNodes, spawnPaths, envelope);
}

/**
 * Per-level softlock proof: for every lock, its matching key must be reachable
 * from spawn WITHOUT crossing the lock's own x-band. Returns
 * `{ rows: [{check, status, descriptor}], hardFailCount }`, mirroring
 * `checkLevelReachability`'s exact contract so `validate-levels.mjs` composes
 * it identically (`failures += kl.hardFailCount`).
 *
 * status ∈ HARD-FAIL | WARN | PASS. HARD-FAIL is the worst-case softlock: the
 * key sits behind its own lock (or has no matching key at all) — an exact,
 * unconditional fact, always increments the failures counter. WARN mirrors the
 * reachability graph's own tightness tier (marginRatio >= WARN_MARGIN_RATIO) —
 * a path exists but its tightest hop is close to the calibrated envelope's max.
 *
 * `?? []`-guarded on both `geometry.locks` and `geometry.keys`: a level with
 * neither field (every level shipped before this phase) returns
 * `{ rows: [], hardFailCount: 0 }` and never throws.
 */
export function checkKeyLockReachability(geometry, envelope = JUMP_ENVELOPE) {
  const rows = [];
  const nodes = buildNodes(geometry);
  const locks = geometry.locks ?? [];
  const keys = geometry.keys ?? [];

  locks.forEach((lock, i) => {
    // Match this lock to its key: same keyId if present, else positional (the
    // i-th lock pairs with the i-th key), falling back to the sole key for the
    // common one-pair-per-level case.
    const key = lock.keyId != null ? keys.find((k) => k.keyId === lock.keyId) : keys[i] ?? keys[0];

    if (!key) {
      // A lock with no matching key at all is an unconditional softlock.
      rows.push({
        check: "key-lock",
        status: "HARD-FAIL",
        descriptor: `lock[${i}] x:${lock.x} has no matching key`,
      });
      return;
    }

    const bandLo = lock.x;
    const bandHi = lock.x + CONFIG.LOCK.W;

    const cutNodes = clipNodesAtBand(nodes, bandLo, bandHi);
    const cutGraph = buildLockCutGraph(cutNodes, bandLo, bandHi, envelope);

    const spawnNode = nodeContaining(cutNodes, SPAWN_X);
    const spawnPaths = spawnNode ? bfsWithPathMargin(cutGraph, spawnNode.id) : new Map();
    // CR-01: bestMarginToPointExcludingBand rejects any candidate hop whose
    // source node sits on the opposite side of THIS lock's band from the key —
    // see the wrapper's own doc comment above for the full rationale.
    const reach = bestMarginToPointExcludingBand(
      { x: key.x, y: key.y },
      cutNodes,
      spawnPaths,
      envelope,
      bandLo,
      bandHi
    );

    if (reach === null) {
      // Key not reachable from spawn WITHOUT crossing the lock — the worst-case
      // softlock this whole check exists to catch.
      rows.push({
        check: "key-lock",
        status: "HARD-FAIL",
        descriptor: `key[${i}] x:${key.x} y:${key.y} NOT reachable before lock x:${lock.x} (softlock)`,
      });
    } else {
      rows.push({
        check: "key-lock",
        status: reach.marginRatio >= WARN_MARGIN_RATIO ? "WARN" : "PASS",
        descriptor:
          `key[${i}] x:${key.x} reachable spawn-side of lock x:${lock.x} ` +
          `(marginRatio=${reach.marginRatio.toFixed(3)})`,
      });
    }
  });

  const hardFailCount = rows.filter((r) => r.status === "HARD-FAIL").length;
  return { rows, hardFailCount };
}

// --- Self-test (runs only when this module is executed directly) ---
// Mirrors scripts/lib/over-hole-check.mjs's check(cond, msg)/failures-counter/
// process.exit(1) idiom — this project's no-framework unit-test layer.
const isMain = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  let failures = 0;
  const check = (cond, msg) => {
    console.assert(cond, msg);
    if (!cond) failures++;
  };

  const lockY = 320 - CONFIG.LOCK.H; // matches the real placement idiom (FLOOR_Y - LOCK.H)

  // Case (a): SAME-floor-run key placed BEHIND its lock (a single floor run,
  // key.x > lock.x) — must HARD-FAIL exactly once. This is precisely the case a
  // non-splitting model silently passes (see this file's header): buildNodes
  // emits ONE full-width node for a single floor run, so without the clip this
  // fixture's spawn and key would read as still-connected.
  {
    const geometry = {
      floors: [{ x: 0, w: 900 }],
      locks: [{ x: 400, y: lockY }],
      keys: [{ x: 600, y: 288 }],
    };
    const result = checkKeyLockReachability(geometry);
    check(
      result.hardFailCount === 1,
      `case (a): expected hardFailCount 1 (same-run key-behind-lock), got ${result.hardFailCount}`
    );
    check(
      result.rows.length === 1 && result.rows[0].status === "HARD-FAIL",
      `case (a): expected exactly one HARD-FAIL row, got ${JSON.stringify(result.rows)}`
    );
  }

  // Case (b): legit reachable — key sits spawn-side of the lock, on the same
  // run. Must PASS or WARN, never HARD-FAIL.
  {
    const geometry = {
      floors: [{ x: 0, w: 900 }],
      locks: [{ x: 400, y: lockY }],
      keys: [{ x: 200, y: 288 }],
    };
    const result = checkKeyLockReachability(geometry);
    check(result.hardFailCount === 0, `case (b): expected hardFailCount 0, got ${result.hardFailCount}`);
    check(
      result.rows.length === 1 && (result.rows[0].status === "PASS" || result.rows[0].status === "WARN"),
      `case (b): expected one PASS/WARN row, got ${JSON.stringify(result.rows)}`
    );
  }

  // Case (c): a low platform BRIDGING near the lock's band (entirely spawn-side
  // of the band, but close enough that a naive model might let it launch a hop
  // straight over the band into the far side) with the key sealed behind the
  // lock — must STILL HARD-FAIL. This is the A2 guard: `buildLockCutGraph`'s
  // opposite-side edge drop must reject the platform-to-far-side hop even
  // though the platform node itself was never split (it never overlapped the
  // band — it merely sits close to it).
  {
    const geometry = {
      floors: [{ x: 0, w: 900 }],
      platforms: [{ x: 350, y: 280, w: 40, h: 16 }], // spans [350,390] — entirely LEFT of [400,432]
      locks: [{ x: 400, y: lockY }],
      keys: [{ x: 600, y: 288 }],
    };
    const result = checkKeyLockReachability(geometry);
    check(
      result.hardFailCount === 1,
      `case (c): expected hardFailCount 1 (platform-over-band guard), got ${result.hardFailCount}`
    );
    check(
      result.rows.length === 1 && result.rows[0].status === "HARD-FAIL",
      `case (c): expected exactly one HARD-FAIL row, got ${JSON.stringify(result.rows)}`
    );
  }

  // Case (d): two key-lock pairs disambiguated by keyId (deliberately listed
  // out of positional order in `keys`, so a naive index-based match would pair
  // the wrong key to the wrong lock). Both keys are legitimately reachable
  // spawn-side of their OWN lock — proves the matching logic, independent of
  // any HARD-FAIL case above.
  {
    const geometry = {
      floors: [{ x: 0, w: 1800 }],
      locks: [
        { x: 400, y: lockY, keyId: "a" },
        { x: 1200, y: lockY, keyId: "b" },
      ],
      keys: [
        { x: 1100, y: 288, keyId: "b" }, // spawn-side of lock "b" (x:1200); listed FIRST despite matching the SECOND lock
        { x: 200, y: 288, keyId: "a" }, // spawn-side of lock "a" (x:400)
      ],
    };
    const result = checkKeyLockReachability(geometry);
    check(
      result.hardFailCount === 0,
      `case (d): expected hardFailCount 0 (both pairs correctly matched+reachable), got ${result.hardFailCount}`
    );
    check(
      result.rows.length === 2 && result.rows.every((r) => r.status === "PASS" || r.status === "WARN"),
      `case (d): expected two PASS/WARN rows, got ${JSON.stringify(result.rows)}`
    );
  }

  // Case (f) [CR-01]: key placed a SHORT jump (~30-90px) past its own lock's
  // band, on the SAME original floor run — this is the exact false-PASS window
  // 34.5-REVIEW.md's CR-01 reproduced (bestMarginToPoint, reused unmodified,
  // credited a "cross-height gap hop" candidate whose straight line passes
  // straight through the lock's own solid apex-tall wall). Must now HARD-FAIL:
  // reaching this key in the real engine requires walking through the lock's
  // collider, which requires the key already being held.
  {
    const geometry = {
      floors: [{ x: 0, w: 900 }],
      locks: [{ x: 400, y: lockY }], // band [400, 432)
      keys: [{ x: 480, y: 288 }], // bandHi(432) + 48px — inside the reviewer's ~10-110px false-PASS window
    };
    const result = checkKeyLockReachability(geometry);
    check(
      result.hardFailCount === 1,
      `case (f): expected hardFailCount 1 (short-jump-past-lock softlock), got ${result.hardFailCount}`
    );
    check(
      result.rows.length === 1 && result.rows[0].status === "HARD-FAIL",
      `case (f): expected exactly one HARD-FAIL row, got ${JSON.stringify(result.rows)}`
    );
  }

  // Case (e): no keys/locks at all (every level shipped before this phase) —
  // must never throw and must return the empty-clean contract.
  {
    let threw = false;
    let result;
    try {
      result = checkKeyLockReachability({ floors: [{ x: 0, w: 900 }] });
    } catch {
      threw = true;
    }
    check(!threw, "case (e): checkKeyLockReachability must never throw on omitted keys/locks");
    check(
      Array.isArray(result?.rows) && result.rows.length === 0 && result.hardFailCount === 0,
      `case (e): expected { rows: [], hardFailCount: 0 }, got ${JSON.stringify(result)}`
    );
  }

  if (failures > 0) {
    console.error(`key-lock-check-selftest: FAIL — ${failures} assertion(s) failed`);
    process.exit(1);
  }
  console.log("key-lock-check-selftest: PASS");
}
