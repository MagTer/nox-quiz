---
phase: 36-world-motion-ambient-life
plan: 02
subsystem: interactive-audit-harness
status: complete
tags: [audit, motion, mover, patroller, playwright, red-green]
requires:
  - "scripts/lib/mechanic-drive.mjs deriveEncounters() + driveToXPlanned/driveAndDetectAlcove precedent"
  - "scripts/lib/audit-retry.mjs auditLevelWithRetries per-encounter dispatch"
  - "Kaplay native body({stickToPlatform}) rider carry (36-01 geometry-freeze reconciliation)"
provides:
  - "deriveEncounters() emits mover + patroller encounters (idx-addressed)"
  - "driveToMover ride-detector + driveToPatroller cross-detector (exported)"
  - "auditLevelWithRetries mover/patroller dispatch + non-blocking-break exemption"
  - "scripts/audit-motion-fixture.mjs assertive RED->GREEN motion gate"
affects:
  - "scripts/lib/mechanic-drive.mjs"
  - "scripts/lib/audit-retry.mjs"
  - "scripts/audit-phase21-mechanics.mjs"
  - "scripts/fixtures/motion-audit-fixture.mjs"
  - "scripts/audit-motion-fixture.mjs"
tech-stack:
  added: []
  patterns:
    - "driveAndDetectAlcove precedent: a NEW encounter kind = its own exported drive+detect signal, tag-selected in audit-retry.mjs"
    - "native stickToPlatform carry proven by pos-delta equality with all input released (never hand-carried)"
    - "respawn-hazard cross proven by a large backward pos snap (reuse the reset() seam)"
    - "copy-not-extract Playwright server/boot skeleton"
key-files:
  created:
    - "scripts/fixtures/motion-audit-fixture.mjs"
    - "scripts/audit-motion-fixture.mjs"
  modified:
    - "scripts/lib/mechanic-drive.mjs"
    - "scripts/lib/audit-retry.mjs"
    - "scripts/audit-phase21-mechanics.mjs"
decisions:
  - "Fixture hosts in the live level-01 scene and INJECTS its motion entities via page.evaluate (build.js does not emit movers/patrollers until 36-03), so the ride/cross detectors are proven against real engine primitives now"
  - "driveToMover/driveToPatroller take (page, encounter, geometry) — consistent with the alcove precedent; geometry threads to driveToXPlanned for the approach"
  - "ride signal = pos-delta equality for N grounded platform-moving frames; cross signal = >120px backward pos snap"
metrics:
  duration: "~35m"
  completed: "2026-07-18"
  tasks: 2
  files: 5
  commits: 2
---

# Phase 36 Plan 02: Motion Audit (Ride Every Mover, Cross Every Patroller) Summary

Extended the interactive mechanic audit so it RIDES every moving platform and CROSSES every patroller through the same triggered/resolved gate as door/math-gate/enemy/alcove, dispatched from the REAL per-encounter site (`auditLevelWithRetries` in `scripts/lib/audit-retry.mjs`), and proved it RED-first against an assertive fixture runner whose exit code fails on a missed ride/cross.

## What was built

**Task 1 (commit `14a4881`)**
- `deriveEncounters(geometry)` now emits a `mover` encounter per `geometry.movers` entry and a `patroller` encounter per `geometry.patrollers` entry, each carrying `x`/`y`/`idx` (start endpoint = drive target; `idx` addresses the i-th entity so multiple motion entities never collide on a shared `${tag}@${x}` key). Every pre-existing encounter kind is byte-unchanged.
- `driveToMover(page, encounter, geometry)` — exported. Reuses `driveToXPlanned` for the geometry-informed approach, runs a bounded rightward-hop mount loop onto the platform, then (with ALL input released) proves native `stickToPlatform` carry: the player's per-frame pos delta must EQUAL the mover's for N=6 grounded, platform-moving frames. `triggered` = stood on it; `resolved` = it carried her.
- `driveToPatroller(page, encounter, geometry)` — exported. Drives into the patroller path and asserts contact fired the EXISTING respawn seam via a >120px backward pos snap (deliberately NOT `driveToXPlanned`'s respawn-retry loop, which would absorb the very snap being observed). `triggered` = reached it; `resolved` = respawn fired.
- `scripts/fixtures/motion-audit-fixture.mjs` — minimal node-importable descriptor: one reachable low+wide horizontal mover + one crossable ping-pong patroller behind a checkpoint on flat ground.

**Task 2 (commit `872f047`)**
- `auditLevelWithRetries` imports `driveToMover`/`driveToPatroller` and dispatches `tag==="mover"`/`tag==="patroller"` between the alcove branch and the challenge-resolve else, OR-ed across attempts exactly like the alcove branch.
- The non-blocking-break guard now exempts `mover` + `patroller` alongside `secret-alcove` — an un-mounted mover / unreached patroller no longer silently aborts the pass and starves later encounters.
- `everyEncounterDone` early-exit and the caller `allResolved` gate are UNCHANGED — an un-ridden/un-crossed row still fails triggered+resolved (gate never relaxed).
- `scripts/audit-phase21-mechanics.mjs` — corrected the stale "every encounter is door/math-gate/enemy" comment; gate untouched.
- `scripts/audit-motion-fixture.mjs` — assertive runner that drives the fixture through `auditLevelWithRetries` and EXITS NON-ZERO unless the mover is ridden AND the patroller crossed (exit code never swallowed).

## RED -> GREEN proof

- **RED** (`node scripts/audit-motion-fixture.mjs` before the audit-retry.mjs dispatch existed): **exit 1**. The mover fell to the challenge-resolve else-branch (`triggered:false, resolved:null`), and with no break-exemption the untriggered mover aborted the pass — the patroller was never attempted (`patroller` rows: `[]`). The gap the plan predicts.
- **GREEN** (after the dispatch + break-exemption): **exit 0**. `mover@200 {triggered:true, resolved:true}` and `patroller@410 {triggered:true, resolved:true}`, both on attempt 1 → `MOTION-FIXTURE: RIDDEN + CROSSED (GREEN)`.

## No-regression

`node scripts/audit-phase21-mechanics.mjs` (all 8 shipped levels): **`AUDIT: ALL MECHANICS RESOLVED`** — 24 encounters, every door/math-gate/enemy/alcove still triggered+resolved. Zero mover/patroller rows on shipped levels (none placed until later plans).

## Verification gates

| Gate | Result |
|------|--------|
| `bash scripts/check-safety.sh` | PASS |
| `bash scripts/check-import-safety.sh` | PASS |
| Task 1 deriveEncounters + fixture import verify | PASS (mover+patroller emitted, detectors exported, fixture importable) |
| `node scripts/audit-motion-fixture.mjs` (RED, pre-dispatch) | exit 1 (gap reported) |
| `node scripts/audit-motion-fixture.mjs` (GREEN, post-dispatch) | exit 0 (ridden + crossed) |
| `node scripts/audit-phase21-mechanics.mjs` (no-regression) | ALL MECHANICS RESOLVED (exit 0) |
| `node -e import audit-retry.mjs` | OK (no syntax error) |

Playwright resolved via `PLAYWRIGHT_MJS_PATH=/home/magnus/.nvm/versions/node/v24.18.0/lib/node_modules/playwright/index.mjs`.

## Deviations from Plan

None — plan executed as written. The plan's "inject the fixture into the level registry via page.evaluate, or serve it as a scratch level — whichever the boot pattern allows" was resolved to: enter the real level-01 scene and inject the fixture's motion entities into that live scene (the registry is static and consumed at boot; injection is the boot pattern that works). This is within the plan's stated latitude and keeps the proof against real engine primitives (native `stickToPlatform` carry + a real reposition-in-place respawn seam).

## Threat mitigations applied

- **T-36-03** (false green): ride signal is pos-delta equality with all input released; cross signal is the backward respawn snap; RED-first shows the gap before wiring. Both are unfalsifiable by a non-riding/non-crossing pass.
- **T-36-04** (weakened gate): the break-exemption does NOT touch `everyEncounterDone` or the caller `allResolved` gate — every row still requires triggered+resolved.

## Known Stubs

None. `scripts/audit-motion-fixture.mjs` is a real gate (asserts + non-zero exit), not a diagnostic.

## Self-Check: PASSED

- Files: all 5 present (2 created, 3 modified).
- Commits: `14a4881`, `872f047` both in history.
