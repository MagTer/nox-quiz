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

import { deriveEncounters, driveToXPlanned, resolveIfBoxed, driveAndDetectAlcove } from './mechanic-drive.mjs';

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

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
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
        const outcome = await driveAndDetectAlcove(page, encounter, level.geometry);
        // Still OR-ed across attempts per this file's existing contract — do not
        // regress a previously-true outcome even if this attempt's own drive somehow
        // fails to redetect it.
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

      if (!everTriggered && encounter.tag !== "secret-alcove") {
        // Matches driveToXClimbing's existing sequential-approach semantics (preserved
        // from the retired single-pass caller): an untriggered mechanic blocks progress
        // to later encounters within the SAME attempt/pass, since the player never
        // actually reached the point where a later encounter's approach would begin.
        // Phase 30 (MECH-04) fix: the secret alcove is NEVER a blocking collider (it
        // never opens the shared math-challenge UI and never freezes the player, per
        // secretAlcove.js's own header contract — "this is a walk-through bonus") —
        // an untriggered/unresolved alcove must not prevent the audit from reaching
        // later door/mathGate/enemy encounters in the same attempt.
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
