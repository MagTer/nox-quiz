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
// attempt) any encounter already recorded as triggered:true from an earlier attempt, and
// exits the attempts loop early the moment every encounter has been triggered at least
// once, so it never calls reloadLevel for attempts it doesn't need.

import { deriveEncounters, driveToXPlanned, resolveIfBoxed } from './mechanic-drive.mjs';

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

      if (previous?.triggered) {
        // Already proven reachable in an earlier attempt — Pitfall 5's cost guard:
        // never re-drive an encounter whose outcome is already known-good. The level
        // reload above still happened this attempt; only the per-encounter re-drive is
        // skipped.
        continue;
      }

      // Phase 24 close-out: driveToXPlanned (geometry-informed walk + planned
      // takeoffs) replaced driveToXClimbing (blind jump-whenever-grounded). Walking
      // is now the default everywhere, so the first-encounter warmupUntilFirstGap
      // special case is retired as a class — ground-level trigger zones register
      // naturally on every approach, not just the level's first.
      const { triggered } = await driveToXPlanned(page, encounter.x, level.geometry);

      let resolved = previous?.resolved ?? null;
      if (triggered && encounter.renderChoices) {
        ({ resolved } = await resolveIfBoxed(page, true));
      }

      results.set(key, {
        triggered: triggered || (previous?.triggered ?? false),
        resolved: resolved ?? previous?.resolved ?? null,
        attempts: (previous?.attempts ?? 0) + 1,
      });

      if (!triggered) {
        // Matches driveToXClimbing's existing sequential-approach semantics (preserved
        // from the retired single-pass caller): an untriggered mechanic blocks progress
        // to later encounters within the SAME attempt/pass, since the player never
        // actually reached the point where a later encounter's approach would begin.
        break;
      }
    }

    const everyEncounterTriggered = encounters.every(
      (encounter) => results.get(`${encounter.tag}@${encounter.x}`)?.triggered
    );
    if (everyEncounterTriggered) {
      // Early exit — every encounter has been reached at least once; do not spend
      // remaining attempts (or call reloadLevel again) proving nothing new.
      break;
    }
  }

  return results;
}
