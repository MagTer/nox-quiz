// scripts/fixtures/bad-level-key.js — DELIBERATELY-BAD level descriptor, key/lock
// softlock reachability RED-first fixture (Phase 34.5, KEY-02).
//
// This is NOT shipped game content. It exists ONLY so scripts/validate-levels.mjs's
// new key-lock-reachability check (invoked via `--fixture scripts/fixtures/
// bad-level-key.js`) can be proven RED-FIRST — i.e. proven capable of detecting a
// real key-sealed-behind-its-own-lock softlock BEFORE it is ever pointed at the
// real levels. A check that has never been seen to fail is not a check.
//
// A NEW, dedicated fixture per this project's "a materially different code path
// deserves its own fixture" convention (30-CONTEXT.md). The key-lock model is
// genuinely different code from every other fixture's defect: it partitions the
// reachability graph at an x-band (the lock's apex-tall footprint), not a
// zero-width landing point (secret-alcove/mover), a 32x32 fly-through box (coin),
// or a floor-run-membership check (over-hole).
//
// ONE independently-provable defect, kept isolated so the RED-first proof is
// unambiguous — no other geometry defects:
//
//   geometry.locks[0] = { x: 400, y: 320 - CONFIG.LOCK.H } — an apex-tall lock
//   mid a SINGLE flat floor run. The single-run placement is deliberate: it is
//   exactly the same-floor-run case that scripts/lib/key-lock-check.mjs's
//   floor-node-splitting fix must catch (a two-run fixture would still HARD-FAIL
//   even under a broken, non-splitting model, hiding the bug this fixture exists
//   to guard against — see key-lock-check.mjs's header for the full rationale).
//
//   geometry.keys[0] = { x: 600, y: 288 } — placed to the RIGHT of the lock (on
//   the far/goal side), so the lock-cut BFS from spawn (x:64) cannot reach it
//   without crossing the lock's band — a key sealed behind its own lock, the
//   worst-case softlock KEY-02 forbids.
//
// Everything else is deliberately CLEAN so the single HARD-FAIL row is
// unambiguously attributable to the key-lock check:
//   - biome: "swamp"        (a valid biome — an invalid one would add a biome
//                            HARD-FAIL row and muddy the proof)
//   - floors: one run       (no gaps -> no gap-width rows)
//   - goal on that run      (spawn-goal PASSes)
//   - doors / mathGates / enemies / secretAlcove / coins / movers / platforms:
//     omitted entirely (all `?? []`-guarded -> zero rows, no over-hole barriers)

import { CONFIG } from "../../src/config.js";

export const BAD_LEVEL_KEY = {
  id: "bad-level-key-fixture",
  displayName: "Deliberately Broken Key (validator self-test)",

  biome: "swamp",
  allowedTables: [6, 7, 8, 9],

  geometry: {
    // Single flat floor run — spawn (x:64), goal, lock, and key all sit here.
    floors: [{ x: 0, w: 900 }],

    // Trivially reachable on its own — keeps spawn-goal clean/PASS.
    goal: { x: 850, y: 304 },

    // The one deliberate defect — see header for the softlock rationale.
    locks: [{ x: 400, y: 320 - CONFIG.LOCK.H }],
    keys: [{ x: 600, y: 288 }],

    // Omitted entirely (all `?? []`-guarded elsewhere): platforms, doors,
    // mathGates, enemies, spikes, secretAlcove, coins, movers.
  },

  // --- Forward-looking optional slots (matches getLevel()'s real-level shape) ---
  mechanics: [],
  theme: null,
  parallax: null,
};
