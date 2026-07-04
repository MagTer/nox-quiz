// scripts/lib/mechanic-drive.mjs — shared, platform-aware traversal module for the
// Phase 21 interactive mechanic audit (Plan 21-05).
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

/**
 * Merge every mechanic type present in geometry into one ascending-x-sorted list,
 * each tagged with its Kaplay collision tag and whether challenge.js renders an
 * answer-box grid for it (door/mathGate/enemy: true; collect zone: false).
 *
 * Moved VERBATIM from the retired scripts/audit-phase21-mechanics.mjs implementation.
 */
export function deriveEncounters(geometry) {
  const entries = [
    ...(geometry.doors ?? []).map((d) => ({ x: d.x, tag: "door", renderChoices: true })),
    ...(geometry.mathGates ?? []).map((g) => ({ x: g.x, tag: "math-gate", renderChoices: true })),
    ...(geometry.enemies ?? []).map((e) => ({ x: e.x, tag: "enemy", renderChoices: true })),
    ...(geometry.collectZones ?? []).map((c) => ({ x: c.x, tag: "answer-zone", renderChoices: false })),
  ];
  entries.sort((a, b) => a.x - b.x);
  return entries;
}

/**
 * Resolve an already-triggered challenge if it renders an answer-box grid
 * (renderChoices:true — door/math-gate/enemy). collect.js's zone renders
 * renderChoices:false and has NO key handlers per challenge.js — never press a
 * numeric key for it; movement stays live so the outer loop continues past it.
 *
 * Moved VERBATIM from the retired scripts/audit-phase21-mechanics.mjs implementation
 * (including the CR-01-derived "decrease from baseline, not absolute-zero" comparison
 * — a still-open collect-zone challenge left over from an earlier, unresolved encounter
 * must never cause a false "already resolved" reading for a DIFFERENT challenge
 * instance).
 */
export async function resolveIfBoxed(page, renderChoices) {
  if (!renderChoices) {
    return { resolved: null };
  }

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
  // prior challenge was deliberately left open (collect.js's renderChoices:false zones
  // stay open by design). `initial` here already reflects that leftover count, so this
  // SPECIFIC challenge resolves once the shared tag count drops BELOW `initial`, not
  // only when it hits zero.
  for (const k of ["1", "2", "3", "4"]) {
    await page.keyboard.press(k);
    await page.waitForTimeout(200);
    const left = await page.evaluate(() => get("challenge").length);
    if (left < initial) {
      return { resolved: true };
    }
  }

  return { resolved: false };
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
