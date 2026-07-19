// scripts/lib/mechanic-drive.mjs — shared, platform-aware traversal module for the
// Phase 21 interactive mechanic audit (Plan 21-05; driveToXPlanned added in the
// Phase 24 close-out fix).
//
// This module owns NO Playwright launch/server code of its own — it only operates on
// a `page` object handed in by a caller script (scripts/audit-phase21-mechanics.mjs
// today; a later plan's scripts/browser-boot.mjs is expected to import it too).
//
// Replaces the retired driveToX/deriveGapRanges/assertGapsAreSingleJumpable model
// (single Space press per detected floor-run gap, no concept of intermediate
// stepping-stone platforms) with driveToXClimbing: a general "jump whenever grounded,
// hold right the whole approach" traversal that reproduces how a real player mashing
// the jump key would climb ANY sequence of platforms within the game's own tuned jump
// envelope — without needing to precompute which gaps are compound vs. simple.
//
// Physics this design is derived from (src/config.js, unchanged by this plan):
// RUN_SPEED 240 px/s, GRAVITY 1400 px/s^2, JUMP_FORCE 520 px/s. Time-to-apex
// JUMP_FORCE/GRAVITY ~= 0.371s; max single-jump rise JUMP_FORCE^2/(2*GRAVITY) ~= 96.6px;
// max single-jump horizontal travel at RUN_SPEED ~= 178px. Every authored compound gap
// in this game is crossable as a CHAIN of individual hops each within this envelope.
// (Phase 24 measured correction: EFFECTIVE airborne horizontal speed is ~210 px/s,
// so real full-jump travel is ~156px — see route-planner.mjs.)

import { planTakeoffs } from "./route-planner.mjs";
import { CONFIG } from "../../src/config.js";
// WR-04 fix (30-REVIEW.md): predictAward used to be a hand-duplicated,
// unexported reimplementation of src/progress.js's private awardAndCarry
// threshold/carry-over math (drift risk if progress.js's curve or carry-over
// shape ever changed without a matching edit here). progress.js now exports a
// pure, standalone predictAward as its own single source of truth (its
// internal createProgress().awardAndCarry calls this SAME function), so this
// module imports the real logic instead of re-deriving it.
import { predictAward } from "../../src/progress.js";

/**
 * Merge every mechanic type present in geometry into one ascending-x-sorted list,
 * each tagged with its Kaplay collision tag. Every entry challenge.js renders an
 * answer-box grid for (door/mathGate/enemy — the only mechanics left after Phase 29
 * removed collect.js's answer-zone mechanic).
 *
 * Moved VERBATIM from the retired scripts/audit-phase21-mechanics.mjs implementation.
 */
export function deriveEncounters(geometry) {
  const entries = [
    ...(geometry.doors ?? []).map((d) => ({ x: d.x, tag: "door" })),
    ...(geometry.mathGates ?? []).map((g) => ({ x: g.x, tag: "math-gate" })),
    ...(geometry.enemies ?? []).map((e) => ({ x: e.x, tag: "enemy" })),
    // Phase 30 (MECH-04): secret alcoves are a non-blocking walk-through bonus, never a
    // challenge-opening mechanic — see driveAndDetectAlcove below for their distinct
    // entity-destroy/XP-delta detection signal (never get("challenge").length).
    ...(geometry.secretAlcove ?? []).map((a) => ({ x: a.x, y: a.y, tag: "secret-alcove" })),
    // Phase 36 (MOT-01/MOT-02): movers and patrollers are MOTION encounters, not
    // challenge-opening mechanics. Each carries its own drive+detect signal (driveToMover
    // rides the platform; driveToPatroller crosses the path and asserts the respawn seam
    // fired) dispatched by tag in audit-retry.mjs's auditLevelWithRetries — mirroring the
    // driveAndDetectAlcove precedent. The START endpoint (x1,y1) is the drive target so
    // the audit approaches each entity along its forward path; `idx` addresses the i-th
    // entity so multiple movers/patrollers never collide on a shared `${tag}@${x}` key.
    ...(geometry.movers ?? []).map((m, i) => ({ x: m.x1, y: m.y1, tag: "mover", idx: i })),
    ...(geometry.patrollers ?? []).map((p, i) => ({ x: p.x1, y: p.y1, tag: "patroller", idx: i })),
    // Phase 39 (POL-02): a sliding spike is a MOTION variant of the static spike — same
    // "spike" tag, same game.js "spike"→respawn seam, hopped by the SAME opportunistic
    // spike-hop fire path inside driveToXPlanned (FIRE_WINDOW.spike / spikeJumpHoldMs).
    // Emitted idx-keyed at its START endpoint (x1) so the audit approaches it along its
    // forward path and multiple sliding spikes never collide on a shared `${tag}@${x}`
    // key. Inert until a level authors geometry.slidingSpikes (39-04+); mirrors the
    // movers/patrollers motion-encounter shape above.
    ...(geometry.slidingSpikes ?? []).map((s, i) => ({ x: s.x1, y: s.y1, tag: "spike", idx: i })),
  ];
  entries.sort((a, b) => a.x - b.x);
  return entries;
}

/**
 * Resolve an already-triggered challenge by cycling answer keys 1-4 until the shared
 * challenge count drops. Every encounter deriveEncounters() produces (door/math-gate/
 * enemy) renders an answer-box grid, so this is unconditional.
 *
 * Moved VERBATIM from the retired scripts/audit-phase21-mechanics.mjs implementation
 * (including the CR-01-derived "decrease from baseline, not absolute-zero" comparison
 * — a still-open challenge left over from an earlier, unresolved encounter must never
 * cause a false "already resolved" reading for a DIFFERENT challenge instance).
 */
export async function resolveIfBoxed(page) {
  // Bug fix (Rule 1, carried forward): if the challenge was never actually reached,
  // get("challenge").length is already 0 here. Cycling 1-4 anyway and reading
  // `left === 0` as "resolved" on the very first check would be vacuously true, since
  // there was nothing open to resolve in the first place. Guard against that false
  // positive: only attempt resolution if a challenge is actually open; otherwise report
  // resolved:false (nothing to resolve == not resolved).
  const initial = await page.evaluate(() => get("challenge").length);
  if (initial === 0) {
    return { resolved: false };
  }

  // CR-01 fix (carried forward): an absolute `left === 0` check is invalid whenever a
  // prior challenge is still open when this one is checked. `initial` here already
  // reflects that leftover count, so this SPECIFIC challenge resolves once the shared
  // tag count drops BELOW `initial`, not only when it hits zero.
  // D-01 settle-awareness (34.6.1 gap fix): a WRONG pick now tween-gates the panel
  // inert for CONFIG.GATE.WRONG_SETTLE_MS (750ms as of 2026-07-17) — the anti-mash
  // feature. An inter-press wait shorter than that window races it, so every other key
  // press (2 and 4) gets silently swallowed and a correct answer on those boxes never
  // registers — the drive then stalls forever at the door blocker ("no route progress"
  // at door x, ~16px short). 950ms > 750ms settle + tween-end callback + frame jitter,
  // so every press is guaranteed to land on a live panel. COUPLED to WRONG_SETTLE_MS:
  // if that constant rises again, raise this too (keep it > the settle).
  for (const k of ["1", "2", "3", "4"]) {
    await page.keyboard.press(k);
    await page.waitForTimeout(950);
    const left = await page.evaluate(() => get("challenge").length);
    if (left < initial) {
      return { resolved: true };
    }
  }

  // Settle re-check (Phase 24 close-out): a correct final-key press can close the
  // challenge a beat AFTER that key's own 200ms post-press check (close animation /
  // next-frame teardown), producing a false "resolved:false" for a challenge that
  // did in fact resolve — observed empirically as door@1400 reporting resolved:false
  // while the drive demonstrably continued PAST the door to later encounters.
  await page.waitForTimeout(600);
  const settled = await page.evaluate(() => get("challenge").length);
  return { resolved: settled < initial };
}

/**
 * Hold ArrowRight and, every poll tick, read the LIVE player position and grounded
 * state via page.evaluate() — never a precomputed gap-range table. Press Space
 * (held past the ~371ms time-to-apex so CONFIG.JUMP_CUT never truncates the arc, per
 * the already-proven Plan 21-01 anti-JUMP_CUT fix) whenever grounded; otherwise wait
 * one poll tick without pressing anything, so the loop stays responsive to becoming
 * grounded again rather than needlessly re-queuing mid-air. This generalizes to
 * compound multi-platform gaps without any per-level special-casing — a real player
 * holding right and mashing jump would climb the same sequences this way.
 *
 * A stall guard compares the current x against the x from `stuckTicks` iterations ago;
 * if the net change is below `stuckDeltaPx`, this is logged as a genuine "cannot
 * progress further" finding (not a script bug) and the loop breaks early.
 *
 * `opts.warmupUntilFirstGap` (default false, opt-in — Rule-1 fix, Plan 21-05 Task 2):
 * when true, suppresses jumping until the first genuine ground-to-air transition (a
 * real gap), so ground-level trigger zones on the initial gap-free stretch register
 * normally instead of being sailed over by needless early jumps; the caller passes
 * this only for each level's first encounter (this game's collect zones are always
 * that first encounter, always preceded by a long hazard-free run from spawn). See the
 * inline comment at its destructuring default for the full empirical rationale.
 *
 * Always releases ArrowRight in a `finally`, whether by normal exit, stall break, or
 * exhausting `maxIterations`. Returns { reachedX, triggered } — the same shape the
 * retired driveToX returned, so callers barely change.
 */
export async function driveToXClimbing(page, targetX, opts = {}) {
  const {
    pollMs = 120,
    maxIterations = 250,
    jumpHoldMs = 450,
    stuckTicks = 25,
    stuckDeltaPx = 2,
    // Rule-1 fix (Plan 21-05 Task 2, found via actually running this script for the
    // first time against all 4 levels — mirroring Plan 21-01's own precedent of
    // iterative empirical fixes): pressing Space on EVERY grounded tick from the very
    // start of an approach over-jumps past ground-level trigger zones placed on solid,
    // gap-free ground well before any real edge — e.g. level-01's collect zone at
    // x:300 was sailed over mid-arc by two needless jumps fired from spawn before the
    // player ever walked there, a genuine regression against the retired single-jump
    // model (which never jumped at all until a real gap was detected).
    //
    // Two general (not per-level-tuned) alternatives were tried and empirically
    // REJECTED because they widened the blast radius past the one collect-zone case:
    // (1) a PURE reactive model (jump only on isGrounded() true->false, for the whole
    // approach) fixed the over-jump but then ran the player straight into floor-level
    // hazards (spikes) the original constant-jump model had been incidentally hopping
    // over, causing repeated death/respawn loops and, once, an uncaught exception that
    // crashed the whole audit before finishing all 4 levels; (2) applying that same
    // reactive "warmup" at the START OF EVERY encounter (not just the level's first)
    // reintroduced the identical hazard-collision risk at each subsequent encounter's
    // resume point too (often already mid-hazard-field, unlike a fresh spawn) —
    // observed empirically to regress MORE encounters than it fixed, twice.
    //
    // Final fix: `warmupUntilFirstGap` is OPT-IN (default false = original, fully
    // proven Task-1 behavior, unchanged). The caller (scripts/audit-phase21-mechanics.mjs)
    // passes `true` ONLY for the very first encounter of each level — the one case
    // this game's own level design guarantees starts on a long, hazard-free, gap-free
    // stretch of solid ground right off spawn (every collectZone in this game is its
    // level's lowest-x encounter). When true: stay in reactive "jump only on the
    // true->false transition" mode until the FIRST genuine ground-to-air transition
    // fires (a real gap), then permanently revert to the original always-jump-when-
    // grounded model for the remainder of this approach — the same model already
    // proven to bunny-hop over hazards and chain compound gap crossings for every
    // encounter beyond the first.
    warmupUntilFirstGap = false,
  } = opts;

  // Bug fix (carried forward from the retired driveToX): a prior encounter's
  // collect-zone challenge (renderChoices:false) is deliberately left OPEN by
  // resolveIfBoxed (movement stays live, per collect.js's design) — so a bare
  // `get("challenge").length > 0` check would report the very NEXT mechanic as
  // instantly "triggered" from a stale, unrelated challenge that never closed, before
  // the player has moved at all. Capture a baseline and only treat a challenge as
  // newly triggered when the live count exceeds that baseline.
  const baseline = await page.evaluate(() => get("challenge").length);

  await page.keyboard.down("ArrowRight");

  let x = null;
  let triggered = false;
  let stalled = false;
  let exhausted = true; // set false below whenever the loop exits via break
  const xHistory = []; // recent x samples, for the stuckTicks stall guard

  let warmedUp = !warmupUntilFirstGap; // if warmup isn't requested, start "warmed up"
  let prevGrounded = true; // assume the approach starts grounded (the typical case)

  try {
    for (let i = 0; i < maxIterations; i++) {
      const state = await page.evaluate(() => {
        const p = get("player")[0];
        return p ? { x: p.pos.x, grounded: p.isGrounded() } : { x: null, grounded: false };
      });
      x = state.x;

      if (!warmedUp) {
        if (!state.grounded && prevGrounded) {
          // First genuine ground-to-air transition — a real gap. Jump reactively to
          // catch the coyote/buffer window, then permanently exit warmup: everything
          // from here on reverts to the original always-jump-when-grounded model.
          await page.keyboard.press("Space", { delay: jumpHoldMs });
          warmedUp = true;
        } else {
          // Still on solid, gap-free ground (or already airborne from the reactive jump
          // just above, on a previous iteration) — no need to jump; let ground-level
          // triggers register normally.
          await page.waitForTimeout(pollMs);
        }
      } else if (state.grounded) {
        // Original Task-1 model: press Space whenever grounded. Held past ~371ms
        // time-to-apex (JUMP_FORCE/GRAVITY): release always happens at or past the
        // apex (vel.y >= 0), so CONFIG.JUMP_CUT never applies — the same already-
        // proven fix as the retired driveToX's gap-tap press. A press while airborne
        // is harmless (src/player.js's buffer/coyote logic just queues it), so
        // pressing whenever grounded is a safe, general substitute for a precomputed
        // gap model — its incidental constant-hopping is also what clears floor-level
        // hazards (spikes) a purely reactive model would otherwise run straight into.
        await page.keyboard.press("Space", { delay: jumpHoldMs });
      } else {
        // Not grounded — wait one poll tick instead of needlessly re-queuing while
        // still rising/falling; keeps the loop responsive to becoming grounded again.
        await page.waitForTimeout(pollMs);
      }
      prevGrounded = state.grounded;

      triggered = (await page.evaluate(() => get("challenge").length)) > baseline;

      if (triggered || (x !== null && x >= targetX - 16)) {
        exhausted = false;
        break;
      }

      // Stall guard: compare against the sample from stuckTicks iterations ago.
      xHistory.push(x);
      if (xHistory.length > stuckTicks) {
        const past = xHistory[xHistory.length - 1 - stuckTicks];
        if (past !== null && x !== null && Math.abs(x - past) < stuckDeltaPx) {
          console.error(
            `driveToXClimbing: stalled — net movement <${stuckDeltaPx}px over the last ` +
              `${stuckTicks} iterations while approaching targetX=${targetX} (last x=${x}) — ` +
              "genuine \"cannot progress further\" finding, not a script bug."
          );
          stalled = true;
          exhausted = false;
          break;
        }
      }
    }

    if (exhausted && !stalled) {
      console.error(
        `driveToXClimbing: ${maxIterations} iterations elapsed without reaching ` +
          `targetX=${targetX} or triggering a challenge (reachedX=${x}) — genuine ` +
          '"mechanic unreachable" finding, not a script bug.'
      );
    }
  } finally {
    await page.keyboard.up("ArrowRight");
  }

  return { reachedX: x, triggered };
}

// DEPRECATION NOTE (Phase 24 close-out): driveToXClimbing above is retained for
// reference but is no longer the audit's driver. Its "press Space on every grounded
// tick" model had three systemic, empirically-confirmed failure modes against the
// Phase-24-lengthened levels — it bunny-hops OVER ground-level checkpoint markers
// (so a later fall-death respawns at the level START, an infinite loop), its fixed
// cadence makes marginal jumps fail DETERMINISTICALLY (defeating audit-retry.mjs's
// OR-across-attempts premise), and its unbounded per-encounter iteration budget
// pushed audit wall-clock past any sane `timeout` (whose SIGTERM then surfaced as a
// misleading Playwright "browser has been closed" rejection, previously misread as
// hardware/browser instability). See route-planner.mjs's header for the full write-up.

/**
 * Geometry-informed replacement for driveToXClimbing (Phase 24 close-out): WALK by
 * default — so ground-level triggers (checkpoints, gates, doors, enemies) all
 * register naturally — and jump ONLY at takeoff points planned by route-planner.mjs
 * from the same level.geometry the structural validator models.
 *
 * ===========================================================================
 * PLAN 34-07: THIS DRIVER IS NOW BIDIRECTIONAL.
 * ===========================================================================
 *
 * Until this plan it pressed ArrowRight ONCE, HELD it for the entire drive, and
 * measured progress as a monotonically-increasing `maxX`. Both halves of that were
 * load-bearing assumptions that a level-08 could not satisfy: Plan 34-04 gave the
 * capstone a SWITCHBACK climb that reverses direction TWICE, so a leftward leg read
 * as a stall, and the bot walked off the tier and died (8 deaths, stalling at
 * x~2878, `browser-boot.mjs` RED on level-08 and the alcove there `triggered: false`).
 *
 * Nothing about the geometry was wrong and nothing about the reachability graph was
 * wrong — reachability.mjs has ALWAYS modelled leftward hops (`canReach` handles
 * `toNode.xEnd <= fromNode.xStart`; `buildGraph` tests every ordered pair both ways),
 * and Plans 34-01/34-02 had already made the COIN model bidirectional citing this very
 * switchback. The graph knew the path existed. Only the DRIVER could not follow it.
 *
 * The three changes, all of which fall out of one idea — A ROUTE IS A SEQUENCE OF
 * LEGS, EACH WITH ITS OWN DIRECTION:
 *
 *   1. HELD DIRECTION is per-leg, not per-drive. The current leg is DERIVED from live
 *      player state every grounded tick (which surface the feet are on), never from a
 *      stored cursor — so a death/respawn anywhere on the route self-heals for free,
 *      exactly as the old position-matched `consumed` reset did. While airborne the
 *      last direction is HELD (a jump arc needs sustained input to keep its velocity).
 *
 *   2. TAKEOFF FIRING is direction-relative: `along = t.dir * (x - t.x)`, fire when
 *      `0 <= along <= fireWindow`. For a rightward takeoff this is byte-identical to
 *      the old `x >= t.x && x <= t.x + window`. A takeoff mark is a position AND a
 *      heading — firing a leftward mount while walking right just launches the player
 *      off the tier.
 *
 *   3. PROGRESS IS NON-MONOTONIC. "Progress" now means ADVANCED ALONG THE ROUTE
 *      (leg index, then `dir * x` within the leg), never "x got bigger". Death
 *      detection likewise stops being directional: it is a position WARP (a >200px
 *      jump between consecutive ~55ms samples — no walk or arc can do that; only a
 *      respawn can), so a leftward leg's perfectly legitimate ~13px/tick backward walk
 *      can never be misread as a respawn.
 *
 * THE APPROACH/BACKUP PHASE is the one genuinely new behavior, and it is what actually
 * flies both of level-08's reversals. If the current leg's takeoff is pending and the
 * player has OVERSHOT its mark (`along > fireWindow`), hold `-dir` to walk back onto
 * the mark, then turn and fire. That single rule produces, with no level-specific code:
 *   - REVERSAL 1 (T3 -> T4, up-LEFT): land at T3's left end, walk RIGHT past T4's far
 *     edge out onto T3's runway, turn around, jump back up-left onto T4.
 *   - REVERSAL 2 (T4 -> T5, up-RIGHT): land at T4's RIGHT end (~2913), walk LEFT to
 *     ~2802 for run-up, then sprint right and jump.
 * Which is, word for word, the maneuver level-08's own descriptor documents. Backup
 * engages ONLY for route takeoffs (never spike hops — a missed spike is a cheap
 * checkpoint respawn, not a route failure) and is clamped to the launch surface's own
 * span, so backing up can never walk the player into the gap behind them.
 *
 * ARRIVAL (once standing on the target node) walks toward `targetX` from EITHER side,
 * which is what finally makes level-08's secret alcove reachable: it sits at x:2650,
 * to the LEFT of where the T3->T4 arc lands the player (~2913). The old driver, holding
 * ArrowRight, was structurally incapable of ever touching it. This subsumes the old
 * "well past the target, back-walk to re-contact the trigger" special case — collision
 * triggers fire on contact from either direction, and the arrival walk simply closes
 * whatever signed distance remains.
 *
 * Gap-kind takeoffs still fire even when not grounded: walking a few px off the lip
 * before the press lands is COVERED by the engine's own coyote time (CONFIG.COYOTE_MS)
 * and actually maximizes the arc's range — the measured full-jump range (~156px + 16px
 * player width) clears this game's 160px gaps only from the lip itself.
 *
 * Returns { reachedX, triggered } — the SAME shape, and the same contract, as before.
 * Every caller (browser-boot.mjs, audit-retry.mjs, screenshot-phase26.mjs, and
 * driveAndDetectAlcove below) is unchanged.
 */
export async function driveToXPlanned(page, targetX, geometry, opts = {}) {
  const {
    pollMs = 55, // steady-walk poll
    nearPollMs = 20, // tightened poll when a takeoff is within lookahead
    lookaheadPx = 150,
    jumpHoldMs = 450, // held past ~371ms time-to-apex so JUMP_CUT never truncates
    // Plan 25-07 fix: a spike hop only needs to clear an 8px-tall hitbox — the
    // header's own SPIKE_OFFSET note already says the arc clears it "anywhere from
    // ~7px to ~150px past takeoff," i.e. even a short, JUMP_CUT-shortened hop is
    // comfortably enough height. Firing the SAME near-max-range hold used for
    // mount/gap takeoffs wastes ~150-180px of horizontal travel a spike never
    // needed, and that unused range can sail clean over the NEXT takeoff's fire
    // window while still airborne — confirmed empirically (level-03's two
    // consecutive spikes at x:820/1040 and again x:3020/3260 sit only ~140-220px
    // apart, well inside the full-hold arc's ~156px range). A short hold (JUMP_CUT
    // applied while still rising) still clears any spike with margin but lands far
    // sooner, leaving room for whatever takeoff comes next.
    spikeJumpHoldMs = 150,
    maxMs = 90_000, // hard wall-clock budget per encounter approach
    stallMs = 15_000, // no NEW route progress for this long => stalled
    maxDeaths = 8,
    // A respawn is the ONLY thing that can move the player >200px between two
    // consecutive samples: at CONFIG.RUN_SPEED (240px/s) a 55ms tick advances ~13px,
    // and even a terminal-velocity fall covers well under 100px in that time. Replaces
    // the old `maxX - x > 250` backward-only signature, which a leftward leg trips
    // just by walking.
    warpPx = 200,
    // How far PAST a missed takeoff mark (against the direction of travel) to back up
    // before turning around and re-approaching it — enough run-up that the turn lands
    // the player back on the mark at full RUN_SPEED, not still accelerating out of it.
    backupClearPx = 20,
    // Per-leg takeoff attempt cap. A hop that has been genuinely flown 8 times without
    // ever landing is a real "cannot fly this hop" finding, not a timing flake.
    maxLegFires = 8,
    // Bound on arrival-walk direction reversals, so a trigger that never fires can
    // never become an infinite ping-pong across targetX.
    maxArrivalTurns = 6,
    // POL-04 (Phase 39) reactive stall-recovery for a JUMP-OVER SOLID PROP. A solid
    // top-level prop (body({isStatic:true})) is invisible to the route planner
    // (planTakeoffs models only geometry floors/platforms), so the walk-only driver
    // physically stalls against it. If PHYSICAL x fails to advance this long while
    // grounded, driving forward, with no planned takeoff pending, try ONE
    // envelope-bounded hop (jumpHoldMs = the full ~88px jump arc) to clear it.
    propStallMs = 700,
    // Cooldown between recovery hops so a genuinely-unclearable wall still trips the hard
    // stall guard (stallMs) as a real "cannot progress" finding, not an infinite jump.
    propJumpCooldownMs = 1200,
  } = opts;

  // Per-kind fire windows (px past the takeoff mark, IN THE DIRECTION OF TRAVEL).
  // Mounts are tightest: a late fire crosses the platform's leading edge too low and
  // bonks its side — the arc math (route-planner.mjs's offsets) tolerates ~16px of
  // lateness for high rises. Gap marks sit 2px past the lip and the whole window must
  // stay inside the engine's coyote grace (~21px at run speed), so the fire always
  // lands the forward-shifted arc (see route-planner.mjs's corner-clip note). Spike
  // hops just need the spike mid-arc — plenty of slack.
  const FIRE_WINDOW = { mount: 16, gap: 18, spike: 26 };

  // Feet-height tolerance for matching a takeoff's launch surface (player is 16x32,
  // pos.y is the top-left corner, so feet = pos.y + 32).
  const FROM_Y_TOL = 30;
  const PLAYER_H = 32;

  // Arrival tolerance: how close to targetX counts as "there". Kept comfortably above
  // the ~5px/tick the arrival walk moves at nearPollMs so it converges instead of
  // oscillating, and well inside every trigger's own >=32px footprint.
  const ARRIVE_TOL = 10;

  // Phase 30 (MECH-04): opts.targetY (default undefined) threads through to
  // planTakeoffs' own optional 4th param — a no-op for every existing caller that
  // never sets it, and the mechanism driveAndDetectAlcove below relies on to correctly
  // target a platform node instead of an overlapping floor node.
  const { takeoffs, legs, targetNode } = planTakeoffs(geometry, targetX, undefined, opts.targetY);
  const baseline = await page.evaluate(() => get("challenge").length);

  // --- Held-direction management (replaces the single keyboard.down("ArrowRight")) ---
  // `held` is -1 / 0 / +1. Kaplay reads isKeyDown() every frame (src/player.js), so a
  // key swap takes effect on the very next frame — there is no acceleration ramp to
  // wait out, which is what makes the turn-around maneuvers crisp.
  const DIR_KEY = { "-1": "ArrowLeft", 1: "ArrowRight" };
  let held = 0;
  const hold = async (d) => {
    if (d === held) return;
    if (held !== 0) await page.keyboard.up(DIR_KEY[held]);
    held = d;
    if (held !== 0) await page.keyboard.down(DIR_KEY[held]);
  };

  // Is the player standing on this node? The x slack absorbs the player's own 16px
  // width at a surface's edges; the feet-height check is what disambiguates a platform
  // from the floor it overlaps (every tier in this game is >=65px above the last, far
  // outside FROM_Y_TOL).
  const onNode = (n, x, feetY) =>
    n && x >= n.xStart - 12 && x <= n.xEnd + 12 && Math.abs(feetY - n.y) <= FROM_Y_TOL;

  // The leg the player is CURRENTLY on, derived from live state — never a stored
  // cursor. Returns legs.length ("arrived") when standing on the target node, or null
  // when the answer is unknown (airborne, or knocked somewhere off-route) in which case
  // the caller keeps the last known leg.
  const deriveLeg = (x, feetY) => {
    for (let k = 0; k < legs.length; k++) {
      if (onNode(legs[k].from, x, feetY)) return k;
    }
    if (onNode(targetNode, x, feetY)) return legs.length;
    return null;
  };

  let x = null;
  let y = null;
  let triggered = false;
  const consumed = new Set();
  const legFires = new Map(); // leg index -> takeoff attempts (cumulative, never cleared)
  let legIndex = 0;
  let backingUp = false;
  let deaths = 0;
  let arrivalTurns = 0;
  let prev = null; // last sample, for the warp/respawn detector
  let bestLeg = -1; // the leg `bestAlong` is measured on
  let bestAlong = -Infinity; // furthest ALONG-THE-ROUTE progress seen on that leg
  let lastProgressAt = Date.now();
  // POL-04 solid-prop wall detector: last PHYSICAL x while grounded + driving forward,
  // and when it last advanced. A normal walk keeps advancing x so this never fires; only
  // a body({isStatic:true}) solid prop the route planner can't see stalls it.
  let physX = null;
  let physHeld = 0;
  let physAdvanceAt = Date.now();
  let lastPropJumpAt = 0;
  const deadline = Date.now() + maxMs;

  try {
    while (Date.now() < deadline) {
      const s = await page.evaluate(() => {
        const p = get("player")[0];
        return p
          ? { x: p.pos.x, y: p.pos.y, grounded: p.isGrounded(), ch: get("challenge").length }
          : null;
      });
      if (!s) break;
      x = s.x;
      y = s.y;
      triggered = s.ch > baseline;
      if (triggered) break;

      // --- Respawn: a position WARP, direction-agnostic (see warpPx above). ---
      if (prev && Math.hypot(x - prev.x, y - prev.y) > warpPx) {
        deaths++;
        if (process.env.AUDIT_DEBUG) {
          console.error(
            `driveToXPlanned: death #${deaths} (warped to x=${x.toFixed(0)} y=${y.toFixed(0)}) ` +
              `on leg ${legIndex}/${legs.length}, approaching targetX=${targetX}`
          );
        }
        // Re-arm every takeoff so the re-walk out of the checkpoint re-executes each one
        // it passes. `legFires` is deliberately NOT cleared: it is the cumulative
        // "how many times have we genuinely tried to fly this hop" budget, and resetting
        // it on death would let an unflyable hop retry forever.
        consumed.clear();
        backingUp = false;
        bestLeg = -1;
        bestAlong = -Infinity;
        lastProgressAt = Date.now();
        prev = { x, y };
        if (deaths >= maxDeaths) {
          console.error(
            `driveToXPlanned: ${deaths} deaths while approaching targetX=${targetX} ` +
              `(reachedX=${x}) — genuine "cannot survive the route" finding.`
          );
          break;
        }
        await page.waitForTimeout(pollMs);
        continue;
      }
      prev = { x, y };

      const feetY = y + PLAYER_H;
      const derived = s.grounded ? deriveLeg(x, feetY) : null;
      if (derived !== null && derived !== legIndex) {
        // Landed on a different surface — the route cursor moves with the player (this
        // is what makes a respawn onto ANY checkpoint, on any tier, self-heal: the leg
        // is re-derived from where the feet actually are, so the driver simply resumes
        // the hop that surface owes).
        legIndex = derived;
        backingUp = false;
      }

      // --- ARRIVED (legIndex === legs.length): standing on the target node. Close the
      // remaining signed distance to targetX from whichever side we landed on. This is
      // the half that makes level-08's alcove (x:2650, LEFT of the T3->T4 landing at
      // ~2913) reachable at all, and it subsumes the old rightward-only "well past the
      // target, back-walk to re-contact it" special case.
      //
      // NOTE this only computes the DIRECTION and the progress metric. It must NOT
      // short-circuit the tick: the spike fire loop below still has to run on the
      // arrival stretch. An earlier cut of this rewrite `continue`d straight from here,
      // and level-01's spike@880 — which sits between checkpoint@800 and the enemy@1000
      // this drive is targeting — then never got hopped: the player walked into it,
      // respawned 80px back at the checkpoint (a warp far too small to read as a death),
      // walked into it again, and bounced there until the stall guard fired. The old
      // driver had ONE loop that always ran the fire loop; keep that property. ---
      const arrived = legIndex >= legs.length;
      const leg = arrived ? null : legs[legIndex];
      let want;
      let pending = null;

      if (arrived) {
        const delta = targetX - x;
        if (Math.abs(delta) <= ARRIVE_TOL) break;
        want = delta > 0 ? 1 : -1;
        if (held !== 0 && want !== held && s.grounded) {
          arrivalTurns++;
          if (arrivalTurns > maxArrivalTurns) {
            console.error(
              `driveToXPlanned: arrival walk reversed ${arrivalTurns}x around targetX=${targetX} ` +
                `(x=${x}) without triggering — giving up.`
            );
            break;
          }
        }
      } else {
        const legTakeoffIdx = takeoffs.findIndex((t) => t.leg === legIndex);

        if (legTakeoffIdx >= 0 && (legFires.get(legIndex) ?? 0) >= maxLegFires) {
          console.error(
            `driveToXPlanned: leg ${legIndex} (${leg.from.id} -> ${leg.to.id}, dir ${leg.dir}) ` +
              `never landed after ${maxLegFires} takeoff attempts while approaching ` +
              `targetX=${targetX} (x=${x}) — genuine "cannot fly this hop" finding.`
          );
          break;
        }

        // Re-arm this leg's takeoff if we fired it but are back on the launch surface —
        // the jump failed and we landed where we started. Without this the player would
        // simply walk on off the edge and have to die to get another attempt; with it, a
        // marginal hop just gets retried (bounded by maxLegFires above).
        if (
          legTakeoffIdx >= 0 &&
          consumed.has(legTakeoffIdx) &&
          s.grounded &&
          onNode(leg.from, x, feetY)
        ) {
          consumed.delete(legTakeoffIdx);
          backingUp = false;
        }

        pending =
          legTakeoffIdx >= 0 && !consumed.has(legTakeoffIdx) ? takeoffs[legTakeoffIdx] : null;

        // --- Direction for this tick: the leg's, unless we have to back up to a takeoff
        // mark we have already walked past. ---
        want = leg.dir;
        if (pending) {
          const along = pending.dir * (x - pending.x);
          const win = pending.fireWindow ?? FIRE_WINDOW[pending.kind];
          if (!backingUp && along > win && s.grounded) backingUp = true;
          if (backingUp) {
            const backDir = -pending.dir;
            // Far enough back to have real run-up again — turn and go for it.
            if (along <= -backupClearPx) backingUp = false;
            else {
              // Never back up off the launch surface's own far edge (that is a gap, and
              // walking into it is a guaranteed death). If we run out of runway, turn
              // and take the best shot available from here.
              const edge = backDir > 0 ? leg.from.xEnd - 8 : leg.from.xStart + 8;
              if ((backDir > 0 && x >= edge) || (backDir < 0 && x <= edge)) backingUp = false;
            }
          }
          want = backingUp ? -pending.dir : pending.dir;
        }
      }
      await hold(want);

      // --- Fire any takeoff whose window we are inside, travelling its way. ---
      let fired = false;
      for (let i = 0; i < takeoffs.length; i++) {
        const t = takeoffs[i];
        if (consumed.has(i)) continue;
        // Route takeoffs belong to exactly one leg and may only fire on it. Spike hops
        // (leg === null) stay opportunistic and can fire on any leg, exactly as before.
        if (t.leg !== null && t.leg !== legIndex) continue;
        // A takeoff mark is a position AND a heading: firing a leftward mount while
        // walking right just launches the player off the tier.
        if (t.dir !== held) continue;
        // Phase 32 far-end-check fix (route-planner.mjs's spike-before-mount conflict
        // fix): a takeoff may carry its own `fireWindow` override (wider than the
        // per-kind default) for cases where the PRECEDING hop's exact landing spot
        // varies run-to-run (a short-held spike hop's real landing distance isn't
        // perfectly predictable) — the takeoff still only fires once genuinely grounded
        // there (the checks below), a wide window just means it doesn't miss whichever
        // spot that turns out to be. Every other takeoff never sets this, so
        // `?? FIRE_WINDOW[t.kind]` reproduces the exact per-kind default.
        const along = t.dir * (x - t.x);
        if (along < 0 || along > (t.fireWindow ?? FIRE_WINDOW[t.kind])) continue;
        if (Math.abs(feetY - t.fromY) > FROM_Y_TOL) continue; // wrong surface — skip
        if (!s.grounded && t.kind !== "gap") continue; // gap fires airborne too (coyote)
        consumed.add(i);
        if (t.leg !== null) legFires.set(t.leg, (legFires.get(t.leg) ?? 0) + 1);
        lastProgressAt = Date.now(); // flying the hop IS progress, even if it fails
        await page.keyboard.press("Space", {
          delay: t.kind === "spike" ? spikeJumpHoldMs : jumpHoldMs,
        });
        fired = true;
        break;
      }
      if (fired) continue;

      // --- Route progress: advanced ALONG the route, never "x got bigger". For a
      // leftward leg `dir * x` rises as x falls, so a legitimate leftward walk reads as
      // progress instead of as a stall — the exact inversion that made the old driver
      // give up on level-08. On the arrival stretch, CLOSING the signed distance to
      // targetX is the progress (which is likewise direction-free). Backing up
      // deliberately does not count as progress, but a takeoff fire (above) and a leg
      // change both refresh the timer, so the back-up/turn/jump cycle can never trip the
      // stall guard on its own. ---
      if (bestLeg !== legIndex) {
        bestLeg = legIndex;
        bestAlong = -Infinity;
        lastProgressAt = Date.now();
      }
      const along = arrived ? -Math.abs(targetX - x) : leg.dir * x;
      if (along > bestAlong + 1) {
        bestAlong = along;
        lastProgressAt = Date.now();
      }
      if (Date.now() - lastProgressAt > stallMs) {
        console.error(
          `driveToXPlanned: no route progress for ${stallMs}ms ` +
            (arrived
              ? `on the arrival walk to targetX=${targetX}`
              : `on leg ${legIndex}/${legs.length} (${leg.from.id} -> ${leg.to.id}, dir ${leg.dir}) ` +
                `while approaching targetX=${targetX}`) +
            ` (x=${x}) — genuine "cannot progress" finding.`
        );
        break;
      }

      // --- POL-04 reactive stall-recovery: jump a jump-over SOLID PROP. ---
      // A solid top-level prop (body({isStatic:true})) is invisible to planTakeoffs
      // (which models only geometry floors/platforms), so no takeoff is planned for it and
      // the walk-only driver's PHYSICAL x simply stops advancing while grounded and driving
      // forward — with no pending planned takeoff and no challenge open (a challenge would
      // have broken this loop above). One envelope-bounded hop (jumpHoldMs, the full jump
      // arc) clears such a prop and the walk resumes; the cooldown keeps an unclearable
      // wall falling through to the hard stall guard above as a real finding. Inert on
      // prop-free levels: a normal walk keeps advancing x, so physAdvanceAt refreshes and
      // this branch never fires. Lives in this SHARED lib so browser-boot.mjs AND
      // audit-phase21-mechanics.mjs inherit it via their existing import (no copied code).
      if (s.grounded && held !== 0 && !pending && !backingUp) {
        if (physX === null || held !== physHeld || held * (x - physX) > 2) {
          physX = x;
          physHeld = held;
          physAdvanceAt = Date.now();
        } else if (
          Date.now() - physAdvanceAt > propStallMs &&
          Date.now() - lastPropJumpAt > propJumpCooldownMs
        ) {
          lastPropJumpAt = Date.now();
          physAdvanceAt = Date.now();
          await page.keyboard.press("Space", { delay: jumpHoldMs });
        }
      } else {
        physX = null; // airborne / turning / near a planned takeoff — restart the wall timer
      }

      const nearTakeoff = pending !== null && Math.abs(x - pending.x) < lookaheadPx;
      await page.waitForTimeout(nearTakeoff || arrived ? nearPollMs : pollMs);
    }
  } finally {
    // Release BOTH arrows unconditionally — a latched key would poison the caller's own
    // subsequent input (driveAndDetectAlcove's nudge, resolveIfBoxed's answer keys).
    await page.keyboard.up("ArrowLeft");
    await page.keyboard.up("ArrowRight");
    held = 0;
  }

  return { reachedX: x, triggered };
}

/**
 * Phase 30 (MECH-04): drive to and detect a secret-alcove encounter using the
 * entity-destroy/XP-delta signal — NEVER get("challenge").length, which is
 * contractually always false for alcoves (src/mechanics/secretAlcove.js never opens a
 * challenge, by design; see that file's own header contract).
 *
 * Reuses driveToXPlanned (the already-proven planned-navigation system that handles
 * gap-crossing/platform-mounting reliably across all 8 levels for every other
 * mechanic) rather than inventing new movement code — its own returned `triggered` is
 * ignored (it is challenge-based and meaningless here). `encounter.y` is threaded
 * through as `opts.targetY` so planTakeoffs correctly targets the platform node the
 * alcove floats above, not an overlapping floor node beneath it.
 *
 * driveToXPlanned's own arrival x is approximate, not exact — its jump arcs commonly
 * over- or under-shoot a small point target like an alcove (unlike a ~32px-wide floor
 * trigger it can walk directly into), and its "well past the target" back-walk
 * recovery is tuned for re-CONTACTING a wide collider, not for standing precisely
 * beneath a separate elevated point above the landing surface. So after arrival, a
 * short bounded horizontal nudge (grounded-only, capped at nudgeMaxMs) walks the
 * player onto the alcove's own x-span (encounter.x .. encounter.x + CONFIG.ALCOVE_SIZE,
 * with the tolerance the player's own 16px width provides) before the vertical hop —
 * this never leaves the already-reached platform/floor (it only nudges left/right
 * while grounded) and is a strict refinement of driveToXPlanned's own arrival, not new
 * navigation.
 *
 * After that nudge, if the player is grounded, presses one deliberate "check for a
 * secret" hop (Space held past the ~371ms apex per this file's own jumpHoldMs=450
 * convention) and settles 600ms (mirroring resolveIfBoxed's own settle-recheck
 * precedent) before reading the after-state.
 *
 * `levelId` (30-REVIEW.md CR-01 fix) is used ONLY to read the pre-touch persisted
 * `secretFound` fact for THIS level, purely as a defensive sanity signal (see
 * `alreadyFoundBefore` below) — the actual anti-residue fix lives in the caller,
 * audit-retry.mjs, which clears this level's persisted `secretFound` fact once per
 * fresh attempt so `alreadyFoundBefore` is expected to always read `false` here under
 * normal operation.
 *
 * @returns {Promise<{triggered: boolean, resolved: boolean}>}
 *   triggered = the alcove entity was destroyed (afterCount < beforeCount) — the only
 *   externally-observable proxy for "the player's bounding box overlapped the trigger
 *   volume," since secretAlcove.js destroys the object in the SAME handler that
 *   detects the touch.
 *   resolved = triggered AND (the XP/level state after the touch matches the
 *   level-up-aware predicted post-award state for a genuine CONFIG.PROGRESS.XP_ALCOVE
 *   award — mirroring progress.js's own awardAndCarry threshold/carry-over math so a
 *   correct award that happens to cross a level-up boundary is still recognized
 *   (30-REVIEW.md WR-02) — OR the touch legitimately re-found an alcove that was
 *   ALREADY marked found before this specific attempt began, per secretAlcove.js's
 *   own CR-01 anti-farming guard; `alreadyFoundBefore` gates this second branch so a
 *   genuine reward-verification failure can never be misread as a legitimate
 *   re-touch, per 30-REVIEW.md CR-01).
 */
export async function driveAndDetectAlcove(page, encounter, geometry, levelId) {
  const beforeCount = await page.evaluate(() => get("secret-alcove").length);
  const beforeBlob = await page.evaluate((key) => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  }, CONFIG.SAVE.KEY);
  const alreadyFoundBefore = beforeBlob?.levels?.[levelId]?.secretFound === true;

  await driveToXPlanned(page, encounter.x, geometry, { targetY: encounter.y });

  // Bounded horizontal nudge onto the alcove's own x-span (see header note above) —
  // grounded-only, small per-tick presses, capped wall-clock budget.
  const nudgeMaxMs = 3000;
  const nudgeDeadline = Date.now() + nudgeMaxMs;
  const nudgeLeft = encounter.x - 8; // a few px of slack past the alcove's own left edge
  const nudgeRight = encounter.x + CONFIG.ALCOVE_SIZE;
  while (Date.now() < nudgeDeadline) {
    const st = await page.evaluate(() => {
      const p = get("player")[0];
      return p ? { x: p.pos.x, grounded: p.isGrounded() } : null;
    });
    if (!st || !st.grounded) break; // never nudge while airborne
    if (st.x < nudgeLeft) {
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(70);
      await page.keyboard.up("ArrowRight");
    } else if (st.x > nudgeRight) {
      await page.keyboard.down("ArrowLeft");
      await page.waitForTimeout(70);
      await page.keyboard.up("ArrowLeft");
    } else {
      break; // already overlapping the alcove's x-span
    }
  }

  const s = await page.evaluate(() => {
    const p = get("player")[0];
    return p ? { grounded: p.isGrounded() } : { grounded: false };
  });
  if (s.grounded) {
    await page.keyboard.press("Space", { delay: 450 });
    await page.waitForTimeout(600);
  }

  const afterCount = await page.evaluate(() => get("secret-alcove").length);
  const afterBlob = await page.evaluate((key) => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  }, CONFIG.SAVE.KEY);

  const triggered = afterCount < beforeCount;
  const delta = (afterBlob?.xp ?? 0) - (beforeBlob?.xp ?? 0);

  // WR-02 fix: a bare `delta === CONFIG.PROGRESS.XP_ALCOVE` equality silently breaks
  // the moment the award straddles a level-up boundary — progress.js's shared
  // awardAndCarry helper carries the surplus over (xp -= threshold(level), not
  // xp = 0), possibly looping multiple levels in one award, so the RAW delta stops
  // matching XP_ALCOVE exactly the moment a level-up happens to land on this touch.
  // WR-04 fix (30-REVIEW.md): the threshold/carry-over math previously hand-
  // duplicated here now comes from progress.js's own exported `predictAward` (the
  // module's single source of truth, also used internally by createProgress()'s
  // awardAndCarry) — so a genuinely correct award is still recognized even when it
  // crosses a level-up, AND this oracle can never silently drift from progress.js's
  // real XP curve.
  const predicted = predictAward(beforeBlob, CONFIG.PROGRESS.XP_ALCOVE);
  const freshAwardCorrect =
    afterBlob?.xp === predicted.xp && afterBlob?.level === predicted.level;

  // CR-01 fix: `delta === 0` alone is NOT sufficient evidence of a legitimate
  // "already found before this attempt" re-touch — secretAlcove.js persists
  // secretFound unconditionally on first touch regardless of whether the XP award
  // was actually correct, so without gating on `alreadyFoundBefore` (the pre-touch
  // state read above, before this attempt drove anywhere), a genuine reward-
  // verification failure on a fresh alcove could be misread as a legitimate
  // zero-delta re-touch. audit-retry.mjs additionally clears this level's
  // persisted secretFound fact once per fresh attempt, so under normal operation
  // `alreadyFoundBefore` only reads true within a single attempt that touches more
  // than one alcove for the same level (the documented "only the first one touched
  // pays out" content case) — never as residue surviving a retry's reload.
  const resolved = triggered && (freshAwardCorrect || (delta === 0 && alreadyFoundBefore));

  return { triggered, resolved };
}

/**
 * Phase 36 (MOT-02): drive-and-detect for a MOVING PLATFORM (tag "mover"). Follows the
 * driveAndDetectAlcove precedent — a standalone export SELECTED by tag in
 * auditLevelWithRetries (audit-retry.mjs), NOT dispatched from deriveEncounters — and
 * reuses driveToXPlanned for the geometry-informed APPROACH rather than inventing new
 * navigation.
 *
 * The ride signal (36-RESEARCH.md Open Question 2, RESOLVED): "the player's pos tracked
 * the platform entity's pos for N consecutive grounded frames." Kaplay's native
 * `body({ stickToPlatform })` moveBy(delta)s the rider every frame the platform it stands
 * on moves (36-RESEARCH.md §Standard Stack — the carry is engine-side, never hand-rolled),
 * so a genuinely-carried player's per-frame position delta EQUALS the platform's, whereas
 * a player merely standing on the static floor shows ~0 delta while the platform moves.
 * Sampling that equality with ALL input released is the unfalsifiable proof the platform
 * actually carried her — a false green cannot survive it (T-36-03).
 *
 * @param {import("playwright").Page} page - live page, already in the level.
 * @param {{x:number,y:number,idx?:number}} encounter - the mover encounter (idx = which mover).
 * @param {object} geometry - level.geometry, threaded to driveToXPlanned for the approach.
 * @returns {Promise<{triggered: boolean, resolved: boolean}>}
 *   triggered = the player reached and stood ON the mover (grounded, feet on its top,
 *   horizontally over its span). resolved = triggered AND the platform CARRIED her (her
 *   pos tracked the mover's for NEED consecutive grounded, platform-moving frames).
 */
export async function driveToMover(page, encounter, geometry) {
  const idx = encounter.idx ?? 0;

  // APPROACH: walk to a staging point just LEFT of the mover's start endpoint, on the
  // floor beneath it, using the already-proven planned navigation (reused, not re-invented).
  const stageX = Math.max(0, encounter.x - 40);
  await driveToXPlanned(page, stageX, geometry, { targetY: encounter.y });

  const moverExists = await page.evaluate((i) => !!get("mover")[i], idx);
  if (!moverExists) return { triggered: false, resolved: false };

  // Standing-on-the-mover test: grounded, feet within 8px of the platform top, and the
  // player's horizontal center within the platform's live x-span (player is 16x32; pos.y
  // is the top-left corner, so feet = pos.y + 32, center x = pos.x + 8).
  const isOnMover = () =>
    page.evaluate((i) => {
      const p = get("player")[0];
      const m = get("mover")[i];
      if (!p || !m) return false;
      const feet = p.pos.y + 32;
      const cx = p.pos.x + 8;
      const onTop = Math.abs(feet - m.pos.y) <= 8;
      const overSpan = cx >= m.pos.x - 10 && cx <= m.pos.x + (m.width ?? 0) + 10;
      return p.isGrounded() && onTop && overSpan;
    }, idx);

  // MOUNT: bounded rightward hops onto the platform top (low + wide, so a rightward jump
  // from just-left arcs onto it; retries absorb the platform's own motion). A missed hop
  // simply lands the player back on the floor to try again — never a death (LEVEL-DESIGN
  // §6b: a missed mover is WAIT-not-death).
  let mounted = await isOnMover();
  const mountDeadline = Date.now() + 12_000;
  while (!mounted && Date.now() < mountDeadline) {
    await page.keyboard.down("ArrowRight");
    await page.keyboard.press("Space", { delay: 450 });
    await page.waitForTimeout(420);
    await page.keyboard.up("ArrowRight");
    await page.waitForTimeout(320);
    mounted = await isOnMover();
    if (mounted) break;
    // If we overshot to the RIGHT of the platform, nudge back left before the next hop.
    const st = await page.evaluate((i) => {
      const p = get("player")[0];
      const m = get("mover")[i];
      return p && m
        ? { px: p.pos.x, mx: m.pos.x, mw: m.width ?? 0, g: p.isGrounded() }
        : null;
    }, idx);
    if (st && st.g && st.px + 8 > st.mx + st.mw) {
      await page.keyboard.down("ArrowLeft");
      await page.waitForTimeout(180);
      await page.keyboard.up("ArrowLeft");
      await page.waitForTimeout(150);
    }
  }

  if (!mounted) return { triggered: false, resolved: false };

  // CARRY WINDOW: release ALL input and prove the platform carries her. Each grounded,
  // platform-moving frame where her delta matches the mover's delta counts toward NEED;
  // NEED consecutive such frames = carried. A slow raised-cosine endpoint (mover delta ~0)
  // is simply not counted (skipped, never reset) — only a clear grounded-and-moving MISS
  // resets the streak.
  await page.keyboard.up("ArrowRight");
  await page.keyboard.up("ArrowLeft");
  const NEED = 6;
  let carried = 0;
  let prev = await page.evaluate((i) => {
    const p = get("player")[0];
    const m = get("mover")[i];
    return p && m ? { px: p.pos.x, py: p.pos.y, mx: m.pos.x, my: m.pos.y } : null;
  }, idx);
  const sampleDeadline = Date.now() + 3000;
  while (carried < NEED && Date.now() < sampleDeadline) {
    await page.waitForTimeout(60);
    const cur = await page.evaluate((i) => {
      const p = get("player")[0];
      const m = get("mover")[i];
      if (!p || !m) return null;
      return { px: p.pos.x, py: p.pos.y, mx: m.pos.x, my: m.pos.y, g: p.isGrounded() };
    }, idx);
    if (!cur || !prev) {
      prev = cur;
      continue;
    }
    const pdx = cur.px - prev.px;
    const pdy = cur.py - prev.py;
    const mdx = cur.mx - prev.mx;
    const mdy = cur.my - prev.my;
    const moving = Math.abs(mdx) > 0.3 || Math.abs(mdy) > 0.3;
    const tracks = Math.abs(pdx - mdx) < 2.5 && Math.abs(pdy - mdy) < 2.5;
    if (cur.g && moving && tracks) carried += 1;
    else if (cur.g && moving && !tracks) carried = 0;
    prev = cur;
  }

  return { triggered: true, resolved: carried >= NEED };
}

/**
 * Phase 36 (MOT-01): drive-and-detect for a PATROLLER (tag "patroller"). Follows the
 * driveAndDetectAlcove precedent (standalone export, tag-selected in audit-retry.mjs).
 *
 * The cross signal (36-RESEARCH.md Open Question 2, RESOLVED): "contact fired the EXISTING
 * respawn seam — the player's pos snapped backward to lastCheckpoint." A patroller is a
 * forgiving respawn-hazard (identical class to spikes: game.js wires
 * player.onCollide("patroller", () => respawn()), reposition-in-place, zero punishment),
 * so the only thing that yanks the player a large distance BACKWARD on contact is the
 * respawn. Detecting that backward snap is the unfalsifiable proof the patroller path was
 * actually crossed AND that contact routed through the respawn seam (T-36-03) — this
 * deliberately does NOT use driveToXPlanned's own respawn-retry loop, which would silently
 * absorb the very snap this detector must observe.
 *
 * @param {import("playwright").Page} page - live page, already in the level.
 * @param {{x:number,y:number,idx?:number}} encounter - the patroller encounter (idx = which one).
 * @returns {Promise<{triggered: boolean, resolved: boolean}>}
 *   triggered = the player reached the patroller's live x-span. resolved = contact fired
 *   the respawn seam (a large backward position snap was observed).
 */
export async function driveToPatroller(page, encounter, geometry) {
  const idx = encounter.idx ?? 0;

  // Pre-cross baseline: the player's current x. The cross signal is a large BACKWARD snap
  // from here (or from the running previous sample) when the respawn seam fires.
  const startX = await page.evaluate(() => {
    const p = get("player")[0];
    return p ? p.pos.x : null;
  });
  if (startX === null) return { triggered: false, resolved: false };

  // A respawn moves the player far more than any single walk/jump tick could: at
  // RUN_SPEED (240px/s) a 50ms poll advances ~12px, so a >120px BACKWARD jump between two
  // consecutive samples is unambiguously the reposition-in-place respawn, never locomotion.
  const SNAP = 120;

  await page.keyboard.up("ArrowLeft");
  await page.keyboard.down("ArrowRight");
  let triggered = false;
  let resolved = false;
  let prevX = startX;
  const deadline = Date.now() + 22_000;
  try {
    while (Date.now() < deadline) {
      await page.waitForTimeout(50);
      const s = await page.evaluate((i) => {
        const p = get("player")[0];
        const foe = get("patroller")[i];
        return {
          px: p ? p.pos.x : null,
          g: p ? p.isGrounded() : false,
          fx: foe ? foe.pos.x : null,
          fw: foe ? foe.width ?? 0 : 0,
        };
      }, idx);
      if (s.px === null) break;

      // Reached the patroller? (player horizontal center within the foe's live x-span + slack)
      if (s.fx !== null) {
        const cx = s.px + 8;
        if (cx >= s.fx - 20 && cx <= s.fx + s.fw + 20) triggered = true;
      }

      // Respawn detector: a large BACKWARD snap = the onCollide("patroller") reset fired.
      if (s.px < prevX - SNAP || s.px < startX - SNAP) {
        triggered = true; // the only thing that snaps her back here is patroller contact
        resolved = true;
        break;
      }
      prevX = s.px;
    }
  } finally {
    await page.keyboard.up("ArrowRight");
  }

  return { triggered, resolved };
}
