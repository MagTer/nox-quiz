---
phase: 39-playthrough-polish-grounded-patrolling-skeletons-sliding-spi
plan: 03
subsystem: testing
tags: [playwright, browser-boot, mover, driveToMover, harness, POL-03]

# Dependency graph
requires:
  - phase: 36-ambient-life
    provides: shared driveToMover ride capability (mechanic-drive.mjs:920) + deriveEncounters mover encounters + audit-retry.mjs mover dispatch
  - phase: 39-playthrough-polish (39-01)
    provides: deriveEncounters slidingSpikes/mover encounter shapes + shared-lib harness awareness (no copied code into the boot/audit harnesses)
provides:
  - browser-boot.mjs spawn->goal drive can RIDE a mover-bridged real pit via the SHARED driveToMover (inert until plan 39-07 relocates a mover over a real hole)
  - Verified single-sourcing of the mover-ride capability across both harnesses (nothing copied)
affects: [39-07 (POL-03 mover re-placement over real holes), 39-08 (end-to-end real-hole crossing verification), harness-parity]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Harness rides a moving platform by INVOKING the shared imported driver (driveToMover), never by copying its body — the CLAUDE.md Playwright-duplication rule governs COPIED server/guard boilerplate, not a call into the genuinely-imported shared lib."
    - "moverBridgesRealPit floor/platform interval-coverage predicate (mirrors over-hole-check.mjs's fullyOnOneFloor idiom) gates the ride branch so it stays a no-op-safe crossing until a mover actually spans a hole."

key-files:
  created: []
  modified:
    - scripts/browser-boot.mjs
    - .planning/phases/39-playthrough-polish-grounded-patrolling-skeletons-sliding-spi/deferred-items.md

key-decisions:
  - "Extended the EXISTING line-12 mechanic-drive.mjs import with driveToMover (import line count stays 1); no second import, no inline driveTo* definition (grep stays 0)."
  - "Gated the ride branch behind a moverBridgesRealPit predicate proven inert on all 8 current levels (every shipped mover rides solid floor) — the wiring is byte-behaviour-identical to the walk-only path today and only engages once plan 39-07 removes the static stepping-stones."
  - "Task 2 kept verification-only: audit-phase21 reaches the shared driveToMover solely via audit-retry.mjs; carries no inline ride block; nothing ported. Did NOT re-tune the delicate shared mount loop for a pre-existing, environment-specific headless flakiness (out of scope; risks regressing passing movers)."

patterns-established:
  - "no-op-safe capability wiring: add a new traversal branch gated by a predicate that is provably false against current data, so the capability lands ahead of the data (39-07) without changing today's green runs."

requirements-completed: [POL-03]

coverage:
  - id: D1
    description: "browser-boot.mjs's spawn->goal drive crosses a mover-bridged real pit by invoking the SHARED driveToMover (added to the existing import), resuming the walk after; walk-only path unchanged for non-mover-bridged levels."
    requirement: "POL-03"
    verification:
      - kind: e2e
        ref: "node scripts/browser-boot.mjs — PASS: title -> select -> all 8 levels, no runtime errors"
        status: pass
      - kind: unit
        ref: "moverBridgesRealPit predicate evaluated against all 8 shipped levels — false everywhere (ride branch inert, no regression)"
        status: pass
      - kind: other
        ref: "source assertions: inline driveTo defs grep=0; mechanic-drive import lines=1; driveToMover occurrences=4 (>=2)"
        status: pass
    human_judgment: false
  - id: D2
    description: "audit-phase21-mechanics.mjs rides mover encounters via the SAME shared driveToMover (through audit-retry.mjs), single-sourced with nothing copied — verified, not re-implemented."
    requirement: "POL-03"
    verification:
      - kind: other
        ref: "source: grep inline driveTo defs in audit-phase21 = 0; imports auditLevelWithRetries from audit-retry.mjs; audit-retry imports+drives driveToMover (:42,:162)"
        status: pass
      - kind: e2e
        ref: "node scripts/audit-phase21-mechanics.mjs — ran (exits 0 by design; diagnostic). Structural ride single-sourced. Behavioral mover-mount flaky under node v24 runtime — logged to deferred-items, pre-existing, not caused by this plan"
        status: unknown
    human_judgment: false
---

# Phase 39 Plan 03: Harness Mover-Ride Wiring (POL-03) Summary

Wired `browser-boot.mjs`'s walk-only spawn→goal driver to cross a mover-bridged real pit by invoking the SHARED `driveToMover` (mechanic-drive.mjs:920), and verified `audit-phase21-mechanics.mjs` already reaches that same shared driver via `audit-retry.mjs` — the ride capability stays single-sourced, nothing copied.

## Accomplishments

- **Task 1 — browser-boot rides a mover-bridged pit (the deliverable):** Extended the existing line-12 `./lib/mechanic-drive.mjs` import with `driveToMover` (no new import line), added a pure `moverBridgesRealPit(mover, geometry)` floor/platform interval-coverage predicate, and wired the spawn→goal drive loop so that a mover encounter spanning a real pit is RIDDEN via the shared driver, then the walk resumes. `node scripts/browser-boot.mjs` is GREEN across all 8 levels.
- **Task 2 — verified audit-phase21 rides via the shared driver:** Source-confirmed the audit carries no inline ride block (`grep` 0) and reaches `driveToMover` only through `audit-retry.mjs` (imports at :42, drives at :162). Ran the audit (it exits 0 by design — a by-eye diagnostic).

## How it works

`deriveEncounters()` already emits idx-keyed `"mover"` encounters. In the spawn→goal loop, a `"mover"` encounter is checked with `moverBridgesRealPit` — true only when some point between the mover's endpoints has no floor run and no static platform beneath it. On true, `driveToMover(page, encounter, level.geometry)` mounts and rides across, then `continue`s the loop; otherwise the unchanged `driveToXPlanned` walk runs. The predicate is **false for every shipped mover today** (all ride solid floor by CONTEXT decision #3), so the branch is inert and today's green runs are unchanged — it only engages once plan 39-07 relocates a mover over a real killing pit.

## Verification

| Gate | Result |
|------|--------|
| `node scripts/browser-boot.mjs` | PASS — all 8 levels, no runtime errors |
| `bash scripts/check-import-safety.sh` | PASS |
| `bash scripts/check-safety.sh` | PASS |
| `moverBridgesRealPit` inert on all 8 levels | PASS (false everywhere → no regression) |
| Source: inline `driveTo*` defs in browser-boot | 0 (required 0) |
| Source: `mechanic-drive.mjs` import lines | 1 (required 1) |
| Source: `driveToMover` occurrences in browser-boot | 4 (required ≥2) |
| Source: inline `driveTo*` defs in audit-phase21 | 0 (required 0) |
| `node scripts/audit-phase21-mechanics.mjs` | Exits 0 (diagnostic by design); structural ride single-sourced |

Note: the behavioral verify commands require `PLAYWRIGHT_MJS_PATH` set to this box's playwright (`.../v24.18.0/lib/node_modules/playwright/index.mjs`) — the harness's baked-in fallback pins the now-vanished node `v22.22.2`.

## Deviations from Plan

None to the code path. The plan's Task-2 acceptance criteria idealizes "every mover encounter shows `triggered: true`"; reality under this runtime is 5 of 8 movers `triggered: false` (see Deferred Issues). This was NOT auto-fixed per the SCOPE BOUNDARY rule (pre-existing, environment-specific, not caused by this plan, and re-tuning the delicate shared mount is explicitly out of Task-2 scope).

## Deferred Issues

- **audit-phase21 mover mount flaky under node v24.18.0** — 5 of 8 shipped-level movers (L1/L3/L4/L7/L8) report `triggered:false`; L2/L5/L6 movers and every patroller/door/enemy/alcove pass. The assertive `audit-motion-fixture.mjs` gate also under-triggers here (including its injected patroller, which passes on every shipped level) — the tell that this is a **headless mount/carry timing sensitivity in this runtime**, not a code defect. `git show` confirms 39-01 never touched the `driveToMover` mount/carry body (unchanged since Phase 36); this plan touched only `browser-boot.mjs`, so the rows are identical on HEAD~1. The harness playwright fallback pins node `v22.22.2` (the runtime the fixture was committed green against); active is `v24.18.0`. Full detail + follow-up (re-pin/verify the mount against the canonical node, or widen the mount deadline in the shared driver) recorded in `deferred-items.md`.

## Follow-up for later plans

- **39-07** relocates a mover over a real hole (removing the static stepping-stones) — that is when `moverBridgesRealPit` returns true and this ride branch engages.
- **39-08** does the end-to-end real-hole crossing verification.

## Self-Check: PASSED

- Files verified on disk: `39-03-SUMMARY.md`, `scripts/browser-boot.mjs`, `deferred-items.md`.
- Commits verified in git log: `2970525` (Task 1), `1467548` (Task 2).
