---
phase: 39-playthrough-polish-grounded-patrolling-skeletons-sliding-spi
plan: 07
subsystem: levels
tags: [level-08, movers, ferry, patrollers, props, reachability, route-planner, browser-boot, POL-01, POL-03, POL-05]

# Dependency graph
requires:
  - phase: 39-playthrough-polish (39-01)
    provides: gate + harness awareness of movers/sliding-spikes; reachability.mjs touched for POL-02/04
  - phase: 39-playthrough-polish (39-03)
    provides: browser-boot spawn->goal drive can RIDE a mover-bridged pit via shared driveToMover (moverBridgesRealPit predicate — inert until this plan makes it TRUE)
  - phase: 39-playthrough-polish (39-06)
    provides: patrol() born-finished fix in build.js — grounded L8 skeletons now actually walk
provides:
  - L8's two REAL pits (moat 1880..2520, chasm 4480..5000) spanned by FLOOR-LEVEL FERRIES with the static stepping-stones REMOVED (barbican + drawbridge)
  - grounded L8 skeleton patrollers (feet on FLOOR_Y, wide sweeps, off the coins)
  - L8 face-columns repositioned off the two gaps + the spawn
  - validate-levels reachability graph now RIDES a floor-level ferry (buildGraph mover-bridge edge) so a stepping-stone-free pit still validates
  - browser-boot + route-planner ride a pit-bridging ferry end-to-end (driveToMover DISMOUNT phase + planTakeoffs mover threading)
affects: [39-08 (frozen-baseline --write re-baseline + end-to-end human playthrough)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Floor-level pit ferry: a mover at FLOOR_Y whose two rest endpoints sit flush on the near/far floor edges — the player walks on at one rest, is carried natively, walks off onto the far floor. Replaces static stepping-stones over a real pit."
    - "Surface-flush mover-bridge edge: buildGraph adds a bidirectional ride edge between the two floor/platform nodes a mover ferries between ONLY when BOTH endpoints are surface-flush (|dy|<4, x in span) — provably inert for raised movers that ride solid floor."
    - "driveToMover DISMOUNT: after carry, ride to the ferry's far rest and step minimally onto the far floor's near edge (preserve post-pit run-up), so the caller's next walk starts on solid ground past the pit."
    - "planTakeoffs threads movers so a spawn->target route EXISTS across a ferry-only pit and the DOWNSTREAM legs/hazard marks get emitted (the crossing itself is still driven by driveToMover)."

key-files:
  created: []
  modified:
    - src/levels/level-08.js
    - scripts/lib/reachability.mjs
    - scripts/lib/route-planner.mjs
    - scripts/lib/mechanic-drive.mjs

key-decisions:
  - "Used FLOOR-LEVEL ferries (y:320, endpoints flush on floor edges) rather than raised ferries: only the surface-flush case lets mover-reachability's trivial-walk branch validate BOTH endpoints (a raised far endpoint over the pit is not rightward-jump-reachable from any static ledge, so it would HARD-FAIL) and lets buildGraph add the ride bridge edge."
  - "Teaching validate-levels' + route-planner's reachability graph to ride a floor-level mover was REQUIRED (not optional) to satisfy the plan's own two acceptance criteria simultaneously (remove stepping-stones AND validate-levels 0 HARD-FAIL). CONTEXT POL-03 explicitly pre-authorized 'teach any reachability check in validate-levels.mjs to ride a moving platform'. Scoped it to the minimal surface-flush case so all 8 shipped levels are byte-unaffected."
  - "Widened the ferries to w:180 + period:6: the walk-only driver mounts by a rightward hop whose arc lands ~140px past the board point; a w<=120 deck was overshot (the moat mounted only by lucky mid-transit timing, the chasm never mounted in 12s). A wide, slow deck is reliably boardable AND more forgiving (the no-true-softlock mandate favours forgiving)."
  - "Left check-geometry-frozen RED (removed barbican/drawbridge platforms + their coins/checkpoints). Per the sequencing rule the --write re-baseline is plan 39-08's own task; this plan does NOT re-baseline."

patterns-established:
  - "Two-half harness teach for a ferry-only pit: validate-levels rides it via the buildGraph surface-flush bridge edge; the walk-only browser-boot rides it via driveToMover (mount->carry->DISMOUNT) with planTakeoffs supplying the downstream route/marks. Both single-sourced through reachability.mjs's buildGraph."

requirements-completed: [POL-01, POL-03, POL-05]

coverage:
  - id: D1
    description: "L8's two moving platforms span the real pits (moat 1880..2520, chasm 4480..5000) with the static stepping-stones removed; a missed hop falls to a reachable checkpoint (no true softlock)."
    requirement: "POL-03"
    verification:
      - kind: automated
        ref: "node scripts/validate-levels.mjs — PASS (0 HARD-FAIL; gap 1880..2520 + gap 4480..5000 now PASS via the ride bridge edge; both ferries mover-reachability WARN, both endpoints reached)"
        status: pass
      - kind: e2e
        ref: "node scripts/browser-boot.mjs — PASS across all 8 levels; L8 rides both ferries spawn->goal (diag: moat mounted+dismounted to F3@2592, chasm mounted+carried+dismounted to F6@5085), no softlock"
        status: pass
    human_judgment: false
  - id: D2
    description: "L8 skeletons walk grounded (feet on FLOOR_Y) with wide sweeps off the coins; contact respawns."
    requirement: "POL-01"
    verification:
      - kind: automated
        ref: "source: both L8 patrollers now y:268 (was y:214), sweeps 160px, speed 80, rest points off coins 760/1040/3300/3660; validate-levels PASS; browser-boot hops them (all 8 levels PASS)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The three L8 face-columns read as intentional — repositioned off the F3/F4 + F7/F8 gaps and off the spawn."
    requirement: "POL-05"
    verification:
      - kind: automated
        ref: "source: columns moved x:40->160 (F0), x:3160->3320 (solid F4), x:6380->6500 (solid F8); scan confirms each base rests on a solid floor run, none over a gap/spawn"
        status: pass
    human_judgment: true
    rationale: "'reads as intentional wall dressing' is a visual-composition judgment; the geometric off-gap/off-spawn fact is automated, but the aesthetic call is the VER-02 kid-UAT / 39-08 human playthrough's."

# Metrics
duration: 82min
completed: 2026-07-20
status: complete
---

# Phase 39 Plan 07: L8 Movers Over the Real Pits Summary

**Relocated Level 8's two moving platforms into floor-level ferries spanning the real moat and drawbridge chasm, removed the static stepping-stones, grounded the skeletons and repositioned the face-columns — and taught both the validate-levels reachability graph and the walk-only browser-boot driver to ride a ferry-only pit end-to-end.**

## Performance

- **Duration:** ~82 min
- **Started:** 2026-07-19T22:44Z
- **Completed:** 2026-07-20T00:06Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- **POL-03 (the big lift):** removed the BARBICAN moat-bridge (BA/BB/BC/BD) and the DRAWBRIDGE-CHASM stones (SS1/SS2) — plus their orphaned coins + checkpoints — and spanned each pit with a wide, slow FLOOR-LEVEL FERRY whose rest endpoints sit flush on the near/far floor edges. A missed ride falls to the checkpoint before the pit (@1820 moat / @4440 chasm), both on solid re-approachable floor — no true softlock.
- **POL-01:** grounded both L8 skeleton patrollers (y:214 → y:268, feet on FLOOR_Y), widened the sweeps to 160px at speed 80, and shifted the rest endpoints off the floor coins. The 39-06 patrol() fix means they now actually walk.
- **POL-05:** repositioned all three `prop-castle-column` props off the F3/F4 (3080..3240) + F7/F8 (6280..6440) gaps and off the spawn, each base resting on a solid floor run.
- **Harness teach (required, see Deviations):** taught the reachability graph (`buildGraph`) to add a bidirectional ride edge for a surface-flush ferry, so validate-levels validates the far side of a stepping-stone-free pit; taught `driveToMover` a DISMOUNT phase and `planTakeoffs` to thread movers, so browser-boot rides both ferries spawn→goal.

## Cross-level stepping-stone scan (WARNING-1 guard)

Scanned all 8 levels for a static platform bridging a real floor gap. Every level uses platforms over floor voids — but on L1–L7 those are the levels' established **vertical-climb spines** (arches / switchback spires / staircases that lead up to towers, keys, goals; kid-validated geometry the "never edit inside" rule protects), NOT discrete floor-pits flagged for ferrying. **Only Level 8's moat (1880..2520) and drawbridge chasm (4480..5000) are the discrete floor-interrupting pits that CONTEXT POL-03 + decision #3 scope for the mover-ferry treatment**, and no other level was scoped by the phase for mover-over-pit relocation (L1–L7 movers deliberately ride solid floor and were addressed for POL-01/04/05 only in 39-04/05/06). No silent under-delivery — the coordinator was NOT flagged, and 39-08's re-baseline diff scope stays **L8-only**.

## Deviations from Plan

The plan's `files_modified` listed only `src/levels/level-08.js`, but removing the barbican/drawbridge made the entire far side of L8 statically unreachable — `validate-levels` cascaded **30 HARD-FAILs** because its reachability graph does not ride movers, and browser-boot could not cross the ferry-only pit. Both are the *validate-levels/harness* half of POL-03 that CONTEXT explicitly pre-authorized ("teach any reachability check in validate-levels.mjs to ride a moving platform") but which no prior plan delivered (39-03 taught only browser-boot's runtime ride branch, inertly). These were **blocking issues (Rule 3)**, resolved with the minimal, provably-inert-for-shipped-levels changes below:

1. **[Rule 3 - Blocking] `scripts/lib/reachability.mjs`** — `buildGraph` gains an optional `movers` param that adds a bidirectional ride edge between the two nodes a mover ferries between, ONLY when both endpoints are surface-flush. Threaded through `checkLevelReachability` + `planCoinWitnesses`. Self-test Case N added. Inert for all 8 shipped (raised) movers. Commit `9788e02`.
2. **[Rule 3 - Blocking] `scripts/lib/route-planner.mjs`** — `planTakeoffs` threads `geometry.movers` into its `buildGraph` call so a spawn→target route exists across a ferry-only pit and the downstream legs/spike-hop marks are emitted. Commit `248d6f2`.
3. **[Rule 3 - Blocking] `scripts/lib/mechanic-drive.mjs`** — `driveToMover` gains a DISMOUNT phase (ride to far rest, step onto the far floor's near edge). Without it the rider parked mid-pit and the next walk fell in (8-death loop). Commit `248d6f2`.

Geometry-tuning deviation (within `level-08.js`, EXEMPT movers): the ferries were widened to **w:180 + period:6** after browser-boot showed a w:120 deck was overshot by the driver's hop-mount (the chasm never mounted in 12 s). A wide, slow deck is reliably boardable and more forgiving.

## check-geometry-frozen: INTENTIONALLY RED

Removing the barbican/drawbridge `platforms` (and their `coins`/`checkpoints`) drifts L8's frozen geometry from the baseline **by design**. `node scripts/check-geometry-frozen.mjs` HARD-FAILs on level-08 (`first differing key: "platforms"`). **Do NOT re-baseline in this plan** — the deliberate `node scripts/check-geometry-frozen.mjs --write` acknowledgment is **plan 39-08's own task**, after all frozen edits settle. Every other gate is green.

## Verification

| Gate | Result |
|------|--------|
| `node scripts/validate-levels.mjs` | PASS — 0 HARD-FAIL; moat + chasm gaps PASS via the ride bridge edge; both ferries mover-reachability WARN (endpoints reached) |
| `node scripts/browser-boot.mjs` | PASS — all 8 levels; L8 rides both ferries spawn→goal, no softlock |
| `node scripts/lib/reachability.mjs` (self-test) | PASS (incl. new Case N: unbridged pit HARD-FAILs, floor ferry bridges, raised ferry adds no edge) |
| `node scripts/lib/route-planner.mjs` (self-test) | PASS |
| `bash scripts/check-gate.sh` | PASS |
| `bash scripts/check-safety.sh` | PASS |
| `bash scripts/check-import-safety.sh` | PASS |
| `bash scripts/check-progress.sh` | PASS |
| `node scripts/check-assets-manifest.mjs` | PASS |
| `node scripts/check-geometry-frozen.mjs` | **RED (INTENDED)** — level-08 platforms drifted; 39-08 re-baselines |

Note: browser-boot's earlier level-01 failures were confirmed a pre-existing headless flake (L1 passed in intermediate runs and in the final clean run; my changes are inert for L1's browser-boot path, which has no pit-bridging mover). The final run was all-green.

## Known Stubs

None. All removed coins/checkpoints were intentional (they sat on the removed stepping-stones); no placeholder/empty data introduced.

## Follow-up for later plans

- **39-08** owns the `check-geometry-frozen.mjs --write` re-baseline (diff scope: **L8-only**, per the cross-level scan) and the end-to-end human/kid playthrough (VER-02) confirming the ferries feel right and the column repositioning reads as intentional.

## Self-Check: PASSED

- Files verified on disk: `39-07-SUMMARY.md`, `src/levels/level-08.js`, `scripts/lib/reachability.mjs`, `scripts/lib/route-planner.mjs`, `scripts/lib/mechanic-drive.mjs`.
- Commits verified in git log: `70b2b07` (T1 skeletons+columns), `9788e02` (reachability ride edge), `248d6f2` (browser-boot ride enablement), `34341ab` (L8 frozen geometry).
