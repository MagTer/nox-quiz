---
plan: 36-06
status: complete
checkpoint: human-verify
signed_off_by: "user-authorized auto-advance (2026-07-18: 'move on anyway… I'll risk adjusting more levels') + orchestrator visual review; hands-on FEEL sign-off DEFERRED"
date: 2026-07-18
---

# Plan 36-06: Motion Trial Play-test — Checkpoint Summary

**Type:** `checkpoint:human-verify` (SC5 hazard-placement sign-off) — the gate before the remaining-6 motion rollout.

## Decision: ADVANCED (proceed to rollout) — feel sign-off DEFERRED

The user was away from home and explicitly authorized moving on without a hands-on play-test, knowingly
accepting the risk of adjusting more levels later ("I want you to move on anyway so we don't lose too
much time… I'll risk adjusting more levels"). Per the standing "never rubber-stamp" rule, the orchestrator
did NOT blind-approve — it did the strongest non-hands-on verification available.

## Objective no-softlock proof (from 36-05, all green)

- **mover-reachability:** WARN only (never HARD-FAIL) for all 3 trial movers — BOTH ping-pong endpoints reachable walking rightward from spawn (§6a).
- **browser-boot:** PASS — all 8 levels spawn→goal with motion live (level-01 reachedX≈6805, level-06 ≈4286).
- **motion audit:** ALL MECHANICS RESOLVED — both movers ridden, all 3 patrollers crossed.
- geometry byte-frozen; check-safety green (no timers/schedulers); patroller contact = checkpoint-respawn only (no punishment).
- §6b template honored: checkpoint before every mover; missed-mover = WAIT not death; no killing pit under a mover; patrollers as hovering wraiths over walk-lanes with a clear passing window.

## Orchestrator visual review (motion-shots/)

- **level-06 wraith:** upright skeleton patroller — clearly a moving hazard, visually DISTINCT from the quadruped hellhound math-blocker (SC1). ✓
- **movers:** wooden beams read unmistakably as platforms vs. the static tiers. ✓
- **Flag (non-blocking):** in the swamp biome, a bone/amber wraith sits against a busy green+amber background (pre-existing flame parallax), so it is slightly less legible than the cemetery wraith. Tunable per-level if the user's later play finds it unclear.

## Outstanding (deferred, at user's accepted risk)

- The hands-on FEEL judgment (fair vs. annoying, react-time to wraiths, respawn-loop feel, MECH-05 reward feel) is NOT yet done. Rolls up with the Phase 38 kid-UAT (VER-02) and the user's own later play-test. If the feel is wrong, the fix is per-level `movers`/`patrollers` tuning — cheap, add-only, geometry-frozen-safe.

## Outcome

Checkpoint ADVANCED. Plans 36-07 / 36-08 (rollout) and 36-09 (consolidation) unblocked, built to the proven no-softlock trial template.
