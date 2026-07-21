---
phase: 32-terrain-parallax-rendering
plan: 05
subsystem: testing
tags: [playwright, browser-boot, verification, terrain, parallax, perf-gates]

# Dependency graph
requires:
  - phase: 32-terrain-parallax-rendering
    plan: "02"
    provides: CONFIG.TERRAIN tunables (OBJECT_BUDGET, FPS_FLOOR, MIN_SCREENSHOT_BYTES)
  - phase: 32-terrain-parallax-rendering
    plan: "03"
    provides: "ground-cap"/"ground-fill" Kaplay tags on all visual terrain tiles
  - phase: 32-terrain-parallax-rendering
    plan: "04"
    provides: biome-driven parallax layers and manifest-driven asset loading
provides:
  - "assertScreenshotNonBlank/assertFpsFloor/assertObjectBudget helpers in scripts/browser-boot.mjs"
  - "Per-level far-end (goal.x) non-blank render proof, driven via driveToXPlanned"
  - "Real headless-browser proof that terrain/parallax rendering holds across all 8 levels — the phase's closing verification"
affects: [33-player-entity-animation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "New browser-boot.mjs assertion helpers mirror assertAudioElementCount's exact (page, errors, stopLabel) signature and errors.push({type, message}) shape — never throw, so one failed check never aborts the rest of the per-level drive"
    - "Far-end proof reuses driveToXPlanned targeting level.geometry.goal.x as the proven proxy for 'the level's true end', rather than inventing new drive logic"

key-files:
  created: []
  modified:
    - scripts/browser-boot.mjs

key-decisions:
  - "Confirmed via 32-CONTEXT.md that ART-02's 'edge/corner tiles' language was a locked scope simplification, not an unmet gap — the real baked atlas has only 2 frames (cap, fill) per biome, so the autotile renderer's cap+chunked-fill model is the correct, already-decided implementation, not a partial delivery"
  - "Marked ART-02 and ART-03 complete in REQUIREMENTS.md as part of this plan's own commit — this is the final integration/proof plan of Phase 32 (wave 3, depends on all of 32-02/03/04), and both requirements span all 5 plans of the phase; the full check battery (screenshot/fps/object-budget/far-end) plus a manual visual spot-check both passed clean"

patterns-established: []

requirements-completed: [ART-02, ART-03]

coverage:
  - id: D1
    description: "Three new CONFIG.TERRAIN-driven assertion helpers (assertScreenshotNonBlank, assertFpsFloor, assertObjectBudget) added to scripts/browser-boot.mjs and wired into the per-level entry checks"
    requirement: "ART-02"
    verification:
      - kind: unit
        ref: "node --check scripts/browser-boot.mjs; grep -c 'function assertScreenshotNonBlank\\|function assertFpsFloor\\|function assertObjectBudget' scripts/browser-boot.mjs == 3"
        status: pass
      - kind: other
        ref: "grep -c CONFIG.TERRAIN scripts/browser-boot.mjs >= 3; grep -c debug.fps() scripts/browser-boot.mjs >= 1; grep -c 'get(\"ground-cap\")' scripts/browser-boot.mjs >= 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Far-end (goal.x) non-blank render check added per level, proving each level's true far end genuinely renders (not just the entry screen)"
    requirement: "ART-03"
    verification:
      - kind: other
        ref: "grep -c 'far-end (goal)' scripts/browser-boot.mjs == 1; grep -c level.geometry.goal.x scripts/browser-boot.mjs >= 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "node scripts/browser-boot.mjs exits 0 across all 8 levels with the full new check battery (screenshot non-blank, FPS floor, object-budget, far-end) live — the phase's primary real-headless-browser proof that terrain renders as a solid mass, parallax is visible, FPS holds, and object count stays in budget"
    requirement: "ART-02"
    verification:
      - kind: e2e
        ref: "node scripts/browser-boot.mjs — 'Browser boot: PASS — title -> select -> all levels loaded with no runtime errors.', exit 0"
        status: pass
      - kind: manual_procedural
        ref: "Ad-hoc Playwright screenshot of level-05 (Cemetery biome) at entry and after a 3s walk — confirmed solid filled ground mass with visible fill texture and a distinct gravestone/skull parallax detail layer behind it, plus a genuine math-gate challenge triggering on contact"
        status: pass
    human_judgment: false
  - id: D4
    description: "ART-02 and ART-03 marked complete in REQUIREMENTS.md — the phase-closing call, made by this final integration/proof plan after genuine end-to-end verification"
    requirement: "ART-02, ART-03"
    verification:
      - kind: manual_procedural
        ref: "Cross-checked ART-02's 'edge/corner tiles' wording against 32-CONTEXT.md's locked 'Biome Terrain Rendering' decision (2-frame cap+fill atlas, no corner variant exists to render) before marking complete — confirmed this is a documented scope simplification, not a gap"
        status: pass
    human_judgment: true
    rationale: "Closing a phase's requirements is a judgment call about whether the accumulated work across all 5 plans genuinely satisfies the requirement's intent, not just its literal grep-checkable text — appropriate for a human/verifier to spot-check even though the underlying technical checks are automated and passing."

duration: 8min
completed: 2026-07-11
status: complete
---

# Phase 32 Plan 05: Terrain & Parallax Verification Summary

**Extended `scripts/browser-boot.mjs` with three CONFIG.TERRAIN-driven assertion helpers (screenshot non-blank, FPS floor, object-count budget) plus a per-level far-end (goal) render check — turning Phase 32's silent-blank-fill and perf-cliff pitfalls into real, hard-failing automated gates; ran clean (exit 0) across all 8 levels.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-11T09:42:24+02:00
- **Completed:** 2026-07-11T09:47:16+02:00
- **Tasks:** 2 completed
- **Files modified:** 1

## Accomplishments
- `assertScreenshotNonBlank`, `assertFpsFloor`, `assertObjectBudget` added to `scripts/browser-boot.mjs`, each mirroring the file's own `assertAudioElementCount` `(page, errors, stopLabel)` signature and `errors.push({type, message})` shape, driven by `CONFIG.TERRAIN`'s `MIN_SCREENSHOT_BYTES`/`FPS_FLOOR`/`OBJECT_BUDGET` tunables (Plan 32-02)
- All three wired into the existing per-level loop right after level entry settles (the existing 1500ms wait), alongside the pre-existing `assertAudioElementCount` call
- A separate far-end drive added after each level's `drivableEncounters` loop: `driveToXPlanned(page, level.geometry.goal.x, level.geometry)` followed by `assertScreenshotNonBlank`, proving every level's true far end (not just the entry screen) genuinely renders — the highest-risk gap per RESEARCH.md Pitfall 7
- `node scripts/browser-boot.mjs` ran clean end-to-end: `Browser boot: PASS — title -> select -> all levels loaded with no runtime errors.`, exit 0, across all 8 levels with the full new check battery live
- Manual ad-hoc Playwright screenshot spot-check of level-05 (Cemetery biome) confirmed the terrain renders as a genuinely solid filled ground mass (visible fill texture, not the old floating 16px strip) with a distinct gravestone/skull parallax detail layer, and a real math-gate challenge triggering correctly on contact
- `bash scripts/check-safety.sh` and `bash scripts/check-import-safety.sh` both PASS (CLAUDE.md's mandatory post-src-change gates) — no engine-global-at-top-level or timer/punishment violations introduced
- Marked ART-02 and ART-03 complete in `.planning/REQUIREMENTS.md` (checklist + traceability table) — this is the final integration/proof plan of Phase 32 (wave 3, depending on 32-02/32-03/32-04), and both requirements span all 5 plans of the phase

## Task Commits

Each task was committed atomically:

1. **Task 1: Add screenshot/FPS/object-budget assertion helpers and wire per-level entry checks** - `135b908` (feat)
2. **Task 2: Add the far-end (goal) non-blank check** - `8b153fa` (feat)

**Plan metadata:** (this SUMMARY.md commit, worktree mode — SUMMARY.md + REQUIREMENTS.md only)

## Files Created/Modified
- `scripts/browser-boot.mjs` - added `CONFIG` import, three new assertion helpers (`assertScreenshotNonBlank`/`assertFpsFloor`/`assertObjectBudget`), wired into the per-level entry-check block, plus a separate far-end (`level.geometry.goal.x`) drive + non-blank check per level

## Decisions Made
- Confirmed ART-02's "edge/corner tiles" REQUIREMENTS.md wording against 32-CONTEXT.md's own locked "Biome Terrain Rendering" decision before deciding whether to mark it complete: the real baked atlas has only 2 frames (cap, fill) per biome, "No dedicated corner/single-tile variant since the atlas doesn't have one" — this was an explicit, already-approved scope simplification from context-gathering, not a gap this plan needed to close
- Made the call to mark ART-02/ART-03 complete in REQUIREMENTS.md as part of this plan's own commit, per this plan's explicit authorization (the final integration/proof plan of the phase, positioned to make that call) — done only after the full automated check battery passed clean AND a manual visual spot-check confirmed genuine rendering (not a rubber-stamp)

## Deviations from Plan

None - plan executed exactly as written. Both tasks' acceptance criteria (grep counts, `node --check`, and the full `node scripts/browser-boot.mjs` real-browser run) passed on the first attempt.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 32 (Terrain & Parallax Rendering) is complete: `src/assets-manifest.js` + `check-assets-manifest.mjs` (32-01), `CONFIG.TERRAIN` + biome level data (32-02), the autotile terrain renderer (32-03), biome-driven parallax + manifest-driven asset loading (32-04), and this plan's closing verification battery (32-05) all land together, proven in one real headless-browser run across all 8 levels
- `scripts/browser-boot.mjs`'s new checks are now a permanent regression gate for every future `src/` change touching terrain or parallax rendering — Phase 33 (Player & Entity Animation) and Phase 35 (Biome Re-dress & Props) both inherit this proof surface for free
- No blockers for Phase 33

---
*Phase: 32-terrain-parallax-rendering*
*Completed: 2026-07-11*

## Self-Check: PASSED

- FOUND: scripts/browser-boot.mjs
- FOUND: .planning/phases/32-terrain-parallax-rendering/32-05-SUMMARY.md
- FOUND: 135b908 (Task 1 commit)
- FOUND: 8b153fa (Task 2 commit)
