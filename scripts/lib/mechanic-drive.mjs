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
  for (const k of ["1", "2", "3", "4"]) {
    await page.keyboard.press(k);
    await page.waitForTimeout(200);
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
 * Takeoff matching is positional and stateless-per-window: each takeoff fires once
 * per approach (a `consumed` set), and a detected death (a large backward x warp —
 * the respawn signature) clears the set so the re-walk re-executes every takeoff it
 * passes. Gap-kind takeoffs fire even when not grounded: walking a few px off the
 * lip before the press lands is COVERED by the engine's own coyote time
 * (CONFIG.COYOTE_MS) and actually maximizes the arc's range — the measured full-jump
 * range (~156px + 16px player width) clears this game's 160px gaps only from the
 * lip itself.
 *
 * If the target x is reached without the challenge count rising (e.g. an arc carried
 * the player past a 32px-wide trigger), a short ArrowLeft back-walk re-approaches the
 * trigger from the far side before giving up — collision triggers fire on contact
 * from either direction.
 *
 * Returns { reachedX, triggered } — same shape as driveToXClimbing.
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
    stallMs = 15_000, // no NEW forward progress for this long => stalled
    maxDeaths = 8,
  } = opts;

  // Per-kind fire windows (px past the takeoff mark). Mounts are tightest: a late
  // fire crosses the platform's leading edge too low and bonks its side — the arc
  // math (route-planner.mjs's offsets) tolerates ~16px of lateness for high rises.
  // Gap marks sit 2px past the lip and the whole window must stay inside the
  // engine's coyote grace (~21px at run speed), so the fire always lands the
  // forward-shifted arc (see route-planner.mjs's corner-clip note). Spike hops just
  // need the spike mid-arc — plenty of slack.
  const FIRE_WINDOW = { mount: 16, gap: 18, spike: 26 };

  // Feet-height tolerance for matching a takeoff's launch surface (player is 16x32,
  // pos.y is the top-left corner, so feet = pos.y + 32).
  const FROM_Y_TOL = 30;

  // Phase 30 (MECH-04): opts.targetY (default undefined) threads through to
  // planTakeoffs' own optional 4th param — a no-op for every existing caller that
  // never sets it, and the mechanism driveAndDetectAlcove below relies on to correctly
  // target a platform node instead of an overlapping floor node.
  const { takeoffs } = planTakeoffs(geometry, targetX, undefined, opts.targetY);
  const baseline = await page.evaluate(() => get("challenge").length);

  await page.keyboard.down("ArrowRight");

  let x = null;
  let triggered = false;
  const consumed = new Set();
  let maxX = -Infinity;
  let deaths = 0;
  let lastProgressAt = Date.now();
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
      triggered = s.ch > baseline;
      if (triggered) break;

      if (x >= targetX + 8) {
        // WELL past the target x (inside/beyond the trigger's own footprint — every
        // trigger kind is >= 32px wide) without the challenge count rising: the last
        // arc may have sailed clean over the trigger. Back-walk briefly to
        // re-contact it from the far side — but NEVER below the target's own
        // surface's left edge (the previous crossing's gap is right there; walking
        // back into it is a guaranteed death — observed empirically). Note the
        // earlier `x >= targetX - 16` break of the old driver stopped at exact
        // first-contact WITHOUT overlap (a 0px touch does not collide), reporting
        // false "unreached"; +8 guarantees real overlap before giving up.
        await page.keyboard.up("ArrowRight");
        await page.keyboard.down("ArrowLeft");
        // Phase 30 (MECH-04) fix: floors are listed before platforms, and a plain
        // `.find()` always returns the FIRST x-span match — for a targetX whose x
        // sits inside BOTH an overlapping floor's span AND a platform's span (e.g. a
        // secret alcove floating above a stepping-stone platform, level-01's real
        // case), this always picked the floor even when the player just landed on
        // the platform, so backLimit anchored to the floor's own (much lower) left
        // edge — the back-walk then retreated the player clean off the platform's
        // left edge and back down to the floor below, missing the elevated target
        // entirely. Disambiguate by the player's CURRENT feet height (s.y + 32,
        // captured this same loop iteration, before the overshoot check) — mirrors
        // this same function's own FROM_Y_TOL surface-matching convention used for
        // takeoff firing, and nodeContaining's targetY-closest-match convention.
        const feetY = s.y + 32;
        const surfaces = [
          ...(geometry.floors ?? []).map((f) => ({ x0: f.x, x1: f.x + f.w, y: CONFIG.FLOOR_Y })),
          ...(geometry.platforms ?? []).map((p) => ({ x0: p.x, x1: p.x + p.w, y: p.y })),
        ];
        const targetSurface = surfaces
          .filter((sf) => targetX >= sf.x0 && targetX <= sf.x1)
          .sort((a, b) => Math.abs(a.y - feetY) - Math.abs(b.y - feetY))[0];
        const backLimit = Math.max(targetX - 40, (targetSurface?.x0 ?? targetX - 40) + 8);
        for (let j = 0; j < 14; j++) {
          await page.waitForTimeout(110);
          const st = await page.evaluate(() => {
            const p = get("player")[0];
            return p ? { x: p.pos.x, ch: get("challenge").length } : null;
          });
          if (!st) break;
          if (st.ch > baseline) {
            triggered = true;
            break;
          }
          if (st.x <= backLimit) break;
        }
        await page.keyboard.up("ArrowLeft");
        await page.keyboard.down("ArrowRight"); // finally-block symmetry
        break;
      }

      if (x > maxX + 1) {
        maxX = x;
        lastProgressAt = Date.now();
      } else if (maxX - x > 250) {
        // Respawn signature: a large instantaneous backward warp. Reset takeoff
        // consumption so the re-walk re-executes every takeoff on the way back out.
        deaths++;
        if (process.env.AUDIT_DEBUG) {
          console.error(`driveToXPlanned: death #${deaths} at maxX=${maxX.toFixed(0)} (respawned to x=${x.toFixed(0)}), approaching targetX=${targetX}`);
        }
        consumed.clear();
        maxX = x;
        if (deaths >= maxDeaths) {
          console.error(
            `driveToXPlanned: ${deaths} deaths while approaching targetX=${targetX} ` +
              `(reachedX=${x}) — genuine "cannot survive the route" finding.`
          );
          break;
        }
        // A respawn checkpoint can sit PAST the takeoff the player just missed
        // (e.g. it missed a platform mount, walked forward on the floor, touched a
        // checkpoint, then died in the next gap) — walking right from the respawn
        // would skip the route's only way up, deterministically dying forever.
        // Retreat to just before the nearest takeoff behind the respawn point,
        // clamped to the current surface's left edge so the retreat itself never
        // walks off into a gap.
        const behind = [...takeoffs].reverse().find((t) => t.x < x - 10);
        if (behind) {
          const feetY = s.y + 32;
          const surfaces = [
            ...(geometry.floors ?? []).map((f) => ({ x0: f.x, x1: f.x + f.w, y: CONFIG.FLOOR_Y })),
            ...(geometry.platforms ?? []).map((p) => ({ x0: p.x, x1: p.x + p.w, y: p.y })),
          ];
          const surface = surfaces
            .filter((sf) => x >= sf.x0 && x <= sf.x1)
            .sort((a, b) => Math.abs(a.y - feetY) - Math.abs(b.y - feetY))[0];
          const retreatTo = Math.max(behind.x - 24, (surface?.x0 ?? x) + 8);
          if (retreatTo < x - 10) {
            await page.keyboard.up("ArrowRight");
            await page.keyboard.down("ArrowLeft");
            const retreatDeadline = Date.now() + 4000;
            while (Date.now() < retreatDeadline) {
              const rx = await page.evaluate(() => get("player")[0]?.pos.x ?? null);
              if (rx === null || rx <= retreatTo) break;
              await page.waitForTimeout(40);
            }
            await page.keyboard.up("ArrowLeft");
            await page.keyboard.down("ArrowRight");
            maxX = -Infinity; // deliberate backward move — re-arm the death detector
            lastProgressAt = Date.now();
            continue;
          }
        }
      }

      if (Date.now() - lastProgressAt > stallMs) {
        console.error(
          `driveToXPlanned: no forward progress for ${stallMs}ms while approaching ` +
            `targetX=${targetX} (maxX=${maxX}, x=${x}) — genuine "cannot progress" finding.`
        );
        break;
      }

      let fired = false;
      for (let i = 0; i < takeoffs.length; i++) {
        const t = takeoffs[i];
        if (consumed.has(i)) continue;
        // Phase 32 far-end-check fix (route-planner.mjs's spike-before-mount conflict
        // fix): a takeoff may carry its own `fireWindow` override (wider than the
        // per-kind default) for cases where the PRECEDING hop's exact landing spot
        // varies run-to-run (a short-held spike hop's real landing distance isn't
        // perfectly predictable) — the takeoff still only fires once genuinely
        // grounded there (the checks below), a wide window just means it doesn't
        // miss whichever spot that turns out to be. Every pre-existing takeoff
        // (mount/gap/spike from pushHopTakeoffs' plain branches) never sets this,
        // so `?? FIRE_WINDOW[t.kind]` reproduces the exact prior per-kind default.
        if (x < t.x || x > t.x + (t.fireWindow ?? FIRE_WINDOW[t.kind])) continue;
        if (Math.abs(s.y + 32 - t.fromY) > FROM_Y_TOL) continue; // wrong surface — skip
        if (!s.grounded && t.kind !== "gap") continue; // gap fires airborne too (coyote)
        consumed.add(i);
        await page.keyboard.press("Space", { delay: t.kind === "spike" ? spikeJumpHoldMs : jumpHoldMs });
        fired = true;
        break;
      }
      if (fired) continue;

      const nearTakeoff = takeoffs.some(
        (t, i) => !consumed.has(i) && t.x - x > -30 && t.x - x < lookaheadPx
      );
      await page.waitForTimeout(nearTakeoff ? nearPollMs : pollMs);
    }
  } finally {
    await page.keyboard.up("ArrowRight");
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
