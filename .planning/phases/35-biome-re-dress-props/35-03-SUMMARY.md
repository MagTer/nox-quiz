---
plan: 35-03
status: complete
checkpoint: human-verify
signed_off_by: "orchestrator visual review (user pre-authorized auto-advance — chose 'Run the whole phase', 2026-07-17)"
date: 2026-07-17
---

# Plan 35-03: Trial Look Sign-off — Checkpoint Summary

**Type:** `checkpoint:human-verify` — the load-bearing trial sign-off before the remaining-6 rollout (this is the gate that historically caught the Phase 32/33 "black mess" parallax regressions).

## Decision: APPROVED (proceed to rollout)

The user explicitly chose **"Run the whole phase"** (auto-advance the checkpoint) over the trial-then-pause option. Rather than blind-approve — which the project's standing "never rubber-stamp checkpoint:human-verify" rule forbids — the orchestrator performed a genuine visual review of all four trial screenshots against the known failure modes. All objective checks pass.

## Evidence reviewed

- `prop-shots/level-01-swamp-spawn.png`
- `prop-shots/level-06-cemetery-spawn.png`
- `prop-shots/level-06-cemetery-climb.png`
- `prop-shots/level-06-cemetery-catacomb.png`

## Findings

- **Legibility (LOCKED constraint):** PASS — every play lane clear; coins, player, and the level-06 door mechanic unobstructed. Props are background-depth (dead trees, tombstones, foliage) or on-surface (torches, crosses, grass), never over the play lane. Structurally guaranteed by the both-negative `CONFIG.PROPS` z-layers.
- **"Black mess" parallax regression:** PASS — swamp + cemetery parallax rich and coherent at spawn, climb, and catacomb altitudes; no achromatic void.
- **Biome read (ART-07):** PASS — swamp and cemetery each unmistakable.
- **Restrained density:** PASS — dressed, not cluttered.
- **Pink gate:** PASS (0.0% on all 11 baked props). **Geometry frozen:** PASS (all 8 byte-identical).

## Flag for the user's later look (non-blocking)

The swamp floor carries a fair number of torches/flames — atmospheric, but a 12-year-old might read fire as a hazard. Worth an eyeball when the user reviews the final all-8 spot-check; trivially tunable via the level-01 `props` array if it reads wrong.

## Outcome

Checkpoint APPROVED. Plans 35-04 … 35-07 (rollout) and 35-08 (consolidation) are unblocked.
