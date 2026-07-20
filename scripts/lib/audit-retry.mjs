// scripts/lib/audit-retry.mjs — bounded OR-across-attempts retry wrapper for the
// Phase 21 interactive mechanic audit (Phase 23, Plan 02, VALID-03 groundwork).
//
// This module owns NO traversal logic of its own and NO navigation of its own. It
// composes scripts/lib/mechanic-drive.mjs's three exports (deriveEncounters,
// driveToXClimbing, resolveIfBoxed) UNCHANGED — this file must never import from or
// duplicate logic already living in mechanic-drive.mjs or browser-boot.mjs (both stay
// byte-identical across this plan, per 23-CONTEXT.md's "changes isolated to the
// mechanic-drive audit path" constraint).
//
// Why this exists: 22-FINDINGS.md's Baseline section documented that 3 of the 16
// mechanic encounters are TIMING-SENSITIVE (they flip between triggered/unreached
// across identical-code runs), not fundamentally unreachable — a single audit pass
// cannot distinguish "genuinely unreachable" from "just unlucky this run." Running the
// same level multiple times and OR-ing each encounter's outcome across attempts
// (an encounter counts as reached if ANY attempt reaches it) surfaces that distinction
// directly, per 23-CONTEXT.md's locked design ("3-5 retries... an encounter counts as
// reached if ANY retry reaches it").
//
// Cost guard (23-RESEARCH.md Pitfall 5): naively re-driving the ENTIRE encounter list
// on every attempt would multiply runtime ~5x for no benefit, since most encounters are
// already stably reached on attempt 1. This wrapper skips re-driving (not re-reloading —
// the level itself is stateful/sequential, so a fresh reload is still required every
// attempt) any encounter already recorded as FULLY DONE (triggered AND resolved) from an
// earlier attempt, and exits the attempts loop early the moment every encounter is done.
//
// Phase 24 close-out fix: an encounter that TRIGGERED but whose answer-key resolution
// failed used to be skipped on every subsequent attempt too (the original condition
// only checked `previous?.triggered`, not `previous?.resolved`) — silently discarding
// every later attempt's chance to resolve it, which defeated the OR-across-attempts
// premise for exactly the timing-sensitive class this wrapper exists for. Confirmed
// empirically: the same door@1400 encounter resolved successfully in an isolated
// single-level run but reported resolved:false in a full 4-level run — a real
// run-to-run timing difference, not a deterministic bug, i.e. precisely what a
// resolution retry is for.

import {
  deriveEncounters,
  driveToXPlanned,
  resolveIfBoxed,
  driveAndDetectAlcove,
  driveToMover,
  driveToPatroller,
  driveToSlidingSpike,
} from './mechanic-drive.mjs';
import { CONFIG } from '../../src/config.js';

/**
 * Drive every mechanic encounter in `level.geometry` through up to `maxAttempts`
 * fresh attempts, OR-ing each encounter's `triggered`/`resolved` outcome across
 * attempts so a later attempt's own state can never erase an earlier attempt's
 * success.
 *
 * @param {import("playwright").Page} page - live Playwright page, already navigated
 *   into the level being audited (this wrapper drives movement/input on it but does
 *   not navigate to or away from the level itself).
 * @param {object} level - the level object from src/levels/index.js's getLevel(id);
 *   only level.geometry is read (deriveEncounters(level.geometry)).
 * @param {object} [options]
 * @param {number} [options.maxAttempts=5] - upper bound on retry attempts (23-CONTEXT's
 *   3-5 range; this wrapper defaults to the upper "effort ceiling" bound).
 * @param {() => Promise<void>} [options.reloadLevel] - caller-supplied callback that
 *   re-enters this same level fresh (Escape -> re-navigate -> Enter, in whatever exact
 *   form the caller script's own select-screen navigation uses). This wrapper owns no
 *   navigation of its own — it calls reloadLevel() once per attempt after the first,
 *   before driving any encounters for that attempt.
 * @returns {Promise<Map<string, {triggered: boolean, resolved: boolean|null, attempts: number}>>}
 *   final results Map, keyed by `${tag}@${x}`. A key with `triggered: false` after all
 *   attempts is a genuine, still-unreached exclusion — the caller documents it in
 *   23-FINDINGS.md.
 */
export async function auditLevelWithRetries(page, level, { maxAttempts = 5, reloadLevel } = {}) {
  const results = new Map(); // `${tag}@${x}` -> { triggered, resolved, attempts }
  const encounters = deriveEncounters(level.geometry);

  // Phase 39 follow-up (2026-07-20 harness re-tune): MOTION encounters (secret-alcove/
  // mover/patroller/sliding-spike) each have their own drive+detect helper whose approach
  // IGNORES challenge state — but on attempt 2+ an earlier, already-green door/math-gate
  // is BACK (every attempt is a fresh reload) while the cost guard skips its row, so its
  // blocker stops the approach cold with the challenge panel open, and the motion row
  // reads triggered:false as a pure navigation artifact (observed live: an L8 attempt-2
  // drive to mover@4480 stalled at x=864 against the re-closed door@880). Fix: if a
  // challenge is open after a motion drive that did not fully succeed, clear it with the
  // SAME resolveIfBoxed the challenge rows use (solving a door/gate destroys its blocker
  // for the rest of this attempt) and re-drive. Bounded (a level has at most a handful of
  // blockers between any two encounters), OR-ed so a re-drive can only improve the
  // outcome, and the blocker row's own recorded result is untouched.
  const driveMotionUnblocked = async (drive) => {
    let outcome = await drive();
    for (let unblock = 0; unblock < 3 && !(outcome.triggered && outcome.resolved); unblock++) {
      const open = await page.evaluate(() => get("challenge").length);
      if (open === 0) break;
      await resolveIfBoxed(page);
      const again = await drive();
      outcome = {
        triggered: outcome.triggered || again.triggered,
        resolved: outcome.resolved || again.resolved,
      };
    }
    return outcome;
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      // CR-01 fix (30-REVIEW.md iteration 1) + CR-01 residual fix (30-REVIEW.md
      // iteration 2): this localStorage clear MUST run BEFORE reloadLevel(), not
      // after. reloadLevel() presses Enter, which synchronously calls
      // go("game", { levelId }) -> gameScene(data) (src/scenes/select.js:275,
      // src/scenes/game.js:80-81), and gameScene() constructs this scene's
      // `progress` object via `createProgress(loadSave())` ONE TIME, at that exact
      // instant — createProgress() is a pure factory that snapshots
      // saved.levels[id].secretFound into a closure-local map and never re-reads
      // localStorage afterward (src/progress.js:59-99). src/mechanics/
      // secretAlcove.js's onCollide handler branches on that frozen in-memory
      // snapshot (progress.hasSecretFound(levelId), src/progress.js:164-166) —
      // never on live localStorage. Clearing AFTER reloadLevel() (the iteration-1
      // ordering) meant the new scene's progress snapshot was always taken from the
      // STILL-poisoned pre-clear value, so every even-numbered retry attempt
      // silently forced the alcove's "already found, zero-delta" no-op replay
      // branch regardless of whether the underlying XP-award mechanism was
      // genuinely broken — an artifactual resolved:false, not a real re-test,
      // roughly halving the wrapper's effective retry budget. Clearing BEFORE
      // reloadLevel() ensures the clear lands in localStorage before the Enter
      // press (inside reloadLevel()) triggers the synchronous
      // loadSave()/createProgress() call that snapshots it — this is safe to run
      // from whatever page context is active at the top of this attempt (the
      // previous attempt's game scene, or the select scene after an Escape),
      // since localStorage is a plain same-origin key/value store and this patch
      // never touches any live scene object. Clearing ONLY this level's
      // `secretFound` field (never `cleared`, xp, level, accuracy, or history)
      // restores driveAndDetectAlcove's own documented "every attempt starts
      // unseeded for this fact" assumption for BOTH the before/after localStorage
      // diff the detector reads AND the live scene's actual branch decision.
      if ((level.geometry.secretAlcove ?? []).length > 0) {
        await page.evaluate(
          ({ key, levelId }) => {
            try {
              const blob = JSON.parse(localStorage.getItem(key));
              if (blob?.levels?.[levelId]) {
                delete blob.levels[levelId].secretFound;
                localStorage.setItem(key, JSON.stringify(blob));
              }
            } catch {
              // forgiving — a malformed/missing blob just leaves nothing to clear
            }
          },
          { key: CONFIG.SAVE.KEY, levelId: level.id }
        );
      }

      await reloadLevel();
    }

    for (const encounter of encounters) {
      const key = `${encounter.tag}@${encounter.x}`;
      const previous = results.get(key);

      // Pitfall 5's cost guard skips re-driving an encounter whose outcome is already
      // known-good — but "known-good" means FULLY resolved, not merely triggered. An
      // encounter that triggered but whose answer-key resolution failed is exactly
      // the class this retry wrapper exists for (22-FINDINGS.md's "timing-sensitive"
      // encounters) — skipping it here silently discarded every later attempt's
      // chance to resolve it, so a resolution that failed once could never recover
      // even though the whole point of OR-across-attempts is that it might succeed
      // on attempt 2. The level reload above still happened this attempt regardless.
      if (previous?.triggered && previous.resolved === true) {
        // Phase 39 follow-up (2026-07-20 harness re-tune): a POL-03 ferry mover is not
        // just an encounter — it is TRANSPORT. On level-08 the two ferries are the ONLY
        // way across their real pits (the static stepping stones are gone), and each
        // retry attempt starts from a FRESH reload at spawn. Skipping an already-green
        // mover here therefore strands the player on the near side, and every LATER
        // encounter past the pit reads `triggered:false` on attempt 2+ purely as a
        // navigation artifact (driveToXPlanned cannot fly a 640px pit). So when any
        // later encounter still needs this attempt, RE-RIDE the ferry for transport
        // only: its outcome is deliberately ignored — the recorded green can never be
        // regressed, per this file's OR-across-attempts contract. Solid-floor movers
        // (L1-L7) cost a few extra seconds of riding; correctness is unchanged.
        if (encounter.tag === "mover") {
          const laterUndone = encounters.some((e2) => {
            if (e2.x <= encounter.x) return false;
            const r2 = results.get(`${e2.tag}@${e2.x}`);
            return !(r2?.triggered && r2.resolved === true);
          });
          if (laterUndone) {
            await driveMotionUnblocked(() => driveToMover(page, encounter, level.geometry));
          }
        }
        continue;
      }

      // Phase 30 (MECH-04): secret alcoves use a wholly different detection signal
      // (entity-destroy/XP-delta, never get("challenge").length — challenge-open is
      // contractually always false for alcoves, per secretAlcove.js's own header
      // contract) and their own combined drive+detect helper. Every other tag keeps
      // the existing driveToXPlanned + resolveIfBoxed path byte-unchanged.
      let everTriggered;
      let resolved;
      if (encounter.tag === "secret-alcove") {
        const outcome = await driveMotionUnblocked(() =>
          driveAndDetectAlcove(page, encounter, level.geometry, level.id)
        );
        // Still OR-ed across attempts per this file's existing contract — do not
        // regress a previously-true outcome even if this attempt's own drive somehow
        // fails to redetect it.
        everTriggered = outcome.triggered || (previous?.triggered ?? false);
        resolved = outcome.resolved || (previous?.resolved ?? false);
      } else if (encounter.tag === "mover") {
        // Phase 36 (MOT-02): a moving platform is a MOTION encounter, not a
        // challenge-opener — it has its own ride detector (driveToMover RIDES the
        // platform and proves native stickToPlatform carry). Same OR-across-attempts
        // contract as the alcove branch: a previously-true ride is never regressed by a
        // later attempt's own miss.
        const outcome = await driveMotionUnblocked(() =>
          driveToMover(page, encounter, level.geometry)
        );
        everTriggered = outcome.triggered || (previous?.triggered ?? false);
        resolved = outcome.resolved || (previous?.resolved ?? false);
      } else if (encounter.tag === "patroller") {
        // Phase 36 (MOT-01): a patroller is a forgiving respawn-hazard, not a
        // challenge-opener — driveToPatroller CROSSES the path and asserts contact fired
        // the existing respawn seam (a backward pos snap). Same OR-across-attempts contract.
        const outcome = await driveMotionUnblocked(() =>
          driveToPatroller(page, encounter, level.geometry)
        );
        everTriggered = outcome.triggered || (previous?.triggered ?? false);
        resolved = outcome.resolved || (previous?.resolved ?? false);
      } else if (encounter.tag === "spike") {
        // Phase 39 follow-up (2026-07-20 harness re-tune): a "spike"-tagged encounter is
        // always a SLIDING spike (deriveEncounters only emits geometry.slidingSpikes under
        // this tag) — a respawn-hazard like the patroller, NEVER a challenge-opener. The
        // old fall-through to the default branch below could never read triggered:true
        // (spikes open no challenge) and its sequential-approach break then starved every
        // later L5/L7 encounter in every attempt. driveToSlidingSpike crosses the authored
        // sweep and asserts the same respawn-seam snap driveToPatroller does.
        const outcome = await driveMotionUnblocked(() =>
          driveToSlidingSpike(page, encounter, level.geometry)
        );
        everTriggered = outcome.triggered || (previous?.triggered ?? false);
        resolved = outcome.resolved || (previous?.resolved ?? false);
      } else {
        // Phase 24 close-out: driveToXPlanned (geometry-informed walk + planned
        // takeoffs) replaced driveToXClimbing (blind jump-whenever-grounded). Walking
        // is now the default everywhere, so the first-encounter warmupUntilFirstGap
        // special case is retired as a class — ground-level trigger zones register
        // naturally on every approach, not just the level's first.
        const { triggered } = await driveToXPlanned(page, encounter.x, level.geometry);

        // OR-across-attempts for BOTH fields independently: a previously-triggered
        // encounter stays triggered even if this attempt's own drive somehow doesn't
        // redetect it, and a previously-unresolved encounter only flips to resolved
        // once ANY attempt actually resolves it (never regresses true -> false).
        everTriggered = triggered || (previous?.triggered ?? false);
        resolved = previous?.resolved ?? null;
        if (everTriggered && resolved !== true) {
          ({ resolved } = await resolveIfBoxed(page));
          resolved = resolved || (previous?.resolved ?? false);
        }
      }

      results.set(key, {
        triggered: everTriggered,
        resolved,
        attempts: (previous?.attempts ?? 0) + 1,
      });

      if (
        !everTriggered &&
        encounter.tag !== "secret-alcove" &&
        encounter.tag !== "mover" &&
        encounter.tag !== "patroller" &&
        // Phase 39 follow-up: a sliding spike gets the same exemption as the other
        // motion hazards — it is not a blocking collider (the goal path hops its whole
        // sweep via the shadowing static spike's planned takeoff), so an unproven
        // slider must not abort the pass and starve later encounters; its own row
        // still fails the caller's triggered+resolved gate.
        encounter.tag !== "spike"
      ) {
        // Matches driveToXClimbing's existing sequential-approach semantics (preserved
        // from the retired single-pass caller): an untriggered mechanic blocks progress
        // to later encounters within the SAME attempt/pass, since the player never
        // actually reached the point where a later encounter's approach would begin.
        // Phase 30 (MECH-04) fix: the secret alcove is NEVER a blocking collider (it
        // never opens the shared math-challenge UI and never freezes the player, per
        // secretAlcove.js's own header contract — "this is a walk-through bonus") —
        // an untriggered/unresolved alcove must not prevent the audit from reaching
        // later door/mathGate/enemy encounters in the same attempt.
        // Phase 36 (MOT-01/MOT-02) fix: movers and patrollers get the SAME exemption. A
        // mover the audit failed to mount this attempt, or a patroller it did not reach,
        // is NOT a blocking collider that stops the player's forward progress (the player
        // simply walks under/past it), so an unresolved mover/patroller must not silently
        // abort the pass and starve every LATER encounter — the retry budget still gets
        // its chance, and an un-ridden/un-crossed row still FAILS the caller's
        // triggered+resolved gate (never relaxed — T-36-04).
        break;
      }
    }

    // Early-exit requires FULL resolution, not just triggering — an encounter this
    // wrapper now knows how to keep retrying (the fix above) must actually get those
    // retries; exiting on triggered-only would reintroduce the exact bug just fixed.
    const everyEncounterDone = encounters.every((encounter) => {
      const r = results.get(`${encounter.tag}@${encounter.x}`);
      return r?.triggered && r.resolved === true;
    });
    if (everyEncounterDone) {
      // Early exit — every encounter is fully resolved; do not spend remaining
      // attempts (or call reloadLevel again) proving nothing new.
      break;
    }
  }

  return results;
}
