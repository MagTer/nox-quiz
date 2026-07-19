---
phase: 36-world-motion-ambient-life
plan: 09
subsystem: phase-consolidation-gate
tags: [consolidation, verification, gate-suite, no-softlock, geometry-frozen, audit, MOT-01, MOT-02, MOT-03, MECH-05, blocked]
requires:
  - phase: 36-05
    provides: "motion trial on level-01 + level-06 (the no-softlock template)"
  - phase: 36-07
    provides: "motion rollout to levels 02/03/04 (+ level-04's geometry.movers/patrollers)"
  - phase: 36-08
    provides: "motion rollout to levels 05/07/08 — all 8 levels now carry motion"
provides:
  - ".planning/phases/36-world-motion-ambient-life/36-VERIFICATION.md — the recorded full-suite consolidation matrix (10/11 gates green, 1 red routed), audit ride/cross evidence, no-softlock proof, documented headless mover-mount limitation, deferred FEEL sign-off"
affects: [36-07]
tech-stack:
  added: []
  patterns:
    - "Consolidation-gate honesty: check-geometry-frozen PASS (byte-identical) is the tell that a check-progress golden-fixture failure is HARNESS staleness (the fixture's naive full-geometry deepEqual didn't mirror the freeze-exclusion of movers/patrollers), not real geometry drift — the two gates disagree precisely because only one excludes the motion keys."
key-files:
  created:
    - .planning/phases/36-world-motion-ambient-life/36-VERIFICATION.md
  modified: []
decisions:
  - "Did NOT fix the one red gate (check-progress). This closeout's mandate is run + record + route, not edit code; the plan's guardrail forbids closing on a red gate and forbids papering it over (threat T-36-21). Routed to 36-07 / the smoke-progress harness owner."
  - "Phase status recorded BLOCKED (not passed): with motion live, 10/11 gates are green incl. both load-bearing safety gates (geometry-frozen byte-identical + browser-boot no-softlock ×8), but check-progress is genuinely red on a stale golden fixture. Requirements MOT-01/02/03 + MECH-05 are functionally delivered; the phase closes green once the harness fixture is synced."
  - "Audit accepted per the phase's documented criteria: all 12 patrollers CROSS reliably (att=1); 5/8 movers RIDE; the 3 misses (L04/L07/L08) are the SAME movers 36-07/36-08 already documented as the ~80%/run headless mover-mount flakiness — reachability-green, WAIT-not-death, real-player-mountable."
metrics:
  duration: ~30m (full 11-gate suite + long browser-boot + long interactive audit + record)
  tasks: 1
  files: 1
  completed: 2026-07-19
status: complete
---

# Phase 36 Plan 09: World Motion & Ambient Life — Consolidation Gate Summary

Ran the ENTIRE CLAUDE.md verification gate suite plus the interactive mechanic audit with
motion LIVE on all 8 levels, and recorded the results in `36-VERIFICATION.md`. This is the
phase-closeout proof: no new features, no motion authored, no level descriptor edited — a
run + record + route gate. **Outcome: 10 of 11 gates green, ONE genuinely red (`check-progress`),
routed for a harness fix.** The two load-bearing safety gates pass (check-geometry-frozen
byte-identical on all 8, browser-boot no-softlock on all 8), no scheduler/punishment was
introduced, and the interactive audit crosses all 12 patrollers (att=1) and rides 5/8 movers
(the 3 misses being the documented headless-driver flakiness). The four requirements
(MOT-01/02/03 + MECH-05) are functionally delivered; the phase is BLOCKED from a green close
only by a stale golden fixture in `smoke-progress.mjs`.

## What ran (the full suite, motion live on all 8 levels)

| Gate | Result |
|------|--------|
| `bash scripts/check-gate.sh` | PASS |
| `bash scripts/check-safety.sh` | PASS — no scheduler/punishment with motion live |
| `bash scripts/check-import-safety.sh` | PASS — a727c13 clean |
| `bash scripts/check-progress.sh` | **FAIL (routed)** — stale smoke-progress golden fixture (see Blockers) |
| `node scripts/validate-levels.mjs` | PASS — 0 HARD-FAIL; mover-reachability WARN (green) ×8 |
| `node scripts/check-assets-manifest.mjs` | PASS — 61 assets on disk |
| `bash scripts/check-terrain-atlas.sh` | PASS — all 4 biome atlases |
| `node scripts/check-geometry-frozen.mjs` | PASS — all 8 byte-identical to the post-34.6 baseline |
| `bash scripts/check-pink-gate.sh` | PASS — no new pink; sole allowlist entry is documented |
| `node scripts/browser-boot.mjs` | PASS — all 8 boot + drive with motion live, no-softlock |
| `node scripts/audit-phase21-mechanics.mjs` | PASS w/ documented limitation — 12/12 patrollers cross att=1; 5/8 movers ride; L04/L07/L08 movers = known headless flakiness |

## No-softlock + geometry-frozen (the load-bearing safety)

- **check-geometry-frozen: PASS** — all 8 levels' static geometry byte-identical; every bit of
  motion is add-only via the freeze-excluded `geometry.movers`/`geometry.patrollers` keys + props.
- **browser-boot: PASS** — title → select → all 8 levels drive their encounter chains (movers/
  patrollers as waypoints) with motion live and no runtime errors. Combined with mover-reachability
  WARN (green) ×8, no level strands the player.

## Interactive audit — ride/cross (read from output, not exit code)

- **Patrollers: 12/12 CROSS reliably (att=1)** — L01@1770; L02@900,@4560; L03@1780; L04@460,@3200;
  L05@1150; L06@1900,@2470; L07@450; L08@960,@3560. The required reliable/green cross is met.
- **Movers: 5/8 RIDE (att=1)** — L01@3420, L02@7040, L03@7240, L05@4980, L06@3900.
- **Movers not headless-mounted (att=5): L04@4500, L07@4490, L08@6560** — the SAME movers 36-07/08
  documented as the ~80%/run headless mover-mount flakiness; reachability-green, WAIT-not-death,
  real-player-mountable. NOT a game defect. Best-effort mover RIDE per the prior plans' limitation.
- All doors/enemies/secret-alcoves triggered+resolved att=1 (MECH-05 alcoves confirmed on all 8).

## Requirements (functionally delivered)

- **MOT-01 (patrollers):** DELIVERED — 12 patrollers ×8 levels, all cross att=1, no-softlock.
- **MOT-02 (moving platforms):** DELIVERED — 8 movers ×8 levels, reachability-green, no-softlock;
  headless-ride 5/8 (3 documented driver limitation, real-player-mountable).
- **MOT-03 (ambient animations):** DELIVERED — light-source flicker via sprite-name selector.
- **MECH-05 (persistent alcove torch):** DELIVERED — alcove-light auto-link within LINK_DIST on all 8.

## Deviations from Plan

**No code authored or edited.** The plan is a run + record + route gate. The plan's happy-path
assumed a fully-green suite; reality surfaced one red gate, handled per the plan's own guardrail
("do NOT paper over it — route it back to the owning placement plan (07/08) or the harness/infra
plan; the phase does not close on a red gate"):

**1. [Guardrail — red gate routed, NOT fixed] check-progress fails on a stale golden fixture.**
- **Found during:** Task 1 (running check-progress.sh).
- **Issue:** `smoke-progress.mjs`'s LVL-02-regression assertion does a naive full `deepEqual` of
  `getLevel("level-04").geometry` against a golden fixture written before motion. level-04's
  geometry now legitimately carries the freeze-excluded `movers` (1) + `patrollers` (2) that plan
  36-07 authored; the fixture does not mirror the freeze-exclusion that check-geometry-frozen
  already applies, so the deepEqual fails. check-geometry-frozen PASS (byte-identical) proves the
  static geometry did NOT drift — this is harness staleness, not a game defect.
- **Action:** Did NOT fix (mandate is run + record + route; editing code here would violate the
  closeout's scope and threat T-36-21). Recorded in 36-VERIFICATION.md and routed to 36-07 / the
  smoke-progress harness owner.

## Blockers

**check-progress (smoke-progress.mjs) is genuinely RED — phase cannot close green until fixed.**
- **Fix:** exclude `movers`/`patrollers` from the smoke-progress LVL-02 golden `deepEqual` (mirror
  check-geometry-frozen's exclusion), OR re-baseline the fixture to include the motion keys.
- **Owner:** 36-07 (introduced level-04's geometry motion keys) / harness owner of
  `scripts/smoke-progress.mjs`.
- **Scope:** harness-only; the GAME is correct (static geometry byte-frozen, no-softlock green).

## Known Stubs
None. No code authored; the verification record is real recorded gate output.

## Threat Flags
None. Running gates + recording results adds no network endpoint, auth path, file access, or trust
boundary. Register mitigations held: T-36-20 (ran the FULL list, read audit output per level,
recorded every result), T-36-21 (the one red gate was NOT papered over — recorded + routed, phase
NOT closed green), T-36-SC (zero new deps).

## Self-Check: PASSED
- 36-VERIFICATION.md exists on disk with the full 11-gate matrix + audit ride/cross evidence.
- No code files created/modified (run + record + route only); no commits from this plan.
- Gate results recorded verbatim from live runs: 10 green, 1 red (check-progress) routed; browser-boot
  no-softlock ×8; audit 12/12 patrollers cross att=1, 5/8 movers ride, 3 documented headless misses.
