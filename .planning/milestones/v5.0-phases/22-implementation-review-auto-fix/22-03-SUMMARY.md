---
phase: 22-implementation-review-auto-fix
plan: 03
subsystem: scenes-shell
tags: [review, lifecycle, kaplay, scene-teardown, boot-shell, hud]
requires: [22-01, 22-02]
provides:
  - "Cluster B (game.js, title.js, select.js, hud.js, main.js, index.html) reviewed — 6 verdict rows final, all clean"
  - "game.js full controller/tween inventory: 14 handle classes, every one mapped to a named cancel path, zero uncovered"
  - "Engine-source canon refinement: vendored Kaplay 3001.0.19 go() DOES clear the app bus (app.events.clear() + cr() re-init) — manual cancels are belt-and-braces"
  - "IN-03 select-row overflow recorded and deferred-to-phase-25 (LVL-04 owns the 2×4 grid)"
  - "Transform-is-load-bearing rationale recorded for main.js scale(1.5) — never replace with width/height"
affects: [22-04, 22-05, 25-select-grid]
tech-stack:
  added: []
  patterns:
    - "Engine-source extraction tier for lifecycle claims: go() teardown sequence quoted verbatim from lib/kaplay.mjs to prove sweep coverage"
    - "Throwaway Playwright evidence script with page-evaluated live geometry (21-06 precedent) for on-canvas layout claims"
key-files:
  created:
    - .planning/phases/22-implementation-review-auto-fix/22-03-SUMMARY.md
  modified:
    - .planning/phases/22-implementation-review-auto-fix/22-FINDINGS.md
key-decisions:
  - "Bug-pattern #5 canon refined, not silently rewritten: go() in this vendored build wipes app-bus controllers (onHide/onKeyPress) and kills root-bound tweens (root.clearEvents) — the manual hideCtrl/tween cancels are kept as belt-and-braces per the no-speculative-refactor rule"
  - "IN-03 deferred (not fixed): 4-tile row is fully on-canvas (rightmost edge 528 < 640, live-evaluated); the 5+-tile overflow is Phase 25 LVL-04 scope"
  - "No fix commits landed: all 6 Cluster B files reviewed clean — the six files are byte-identical to baseline 5eedee8"
metrics:
  duration: ~18min
  completed: 2026-07-05
status: complete
---

# Phase 22 Plan 03: Cluster B — Scenes & Shell Review Summary

**One-liner:** All six Cluster B files (three scenes, HUD, boot shell) reviewed clean with engine-source-proven lifecycle coverage — zero fix commits, IN-03 deferred to Phase 25, transform landmine documented untouched.

## What Was Done

### Task 1: game.js lifecycle sweeps + title.js input seam (commit 466fdd9)

- **Finding 6 (game.js): CONFIRMED COMPLETE.** Built the full inventory of every controller/tween created in the scene body — 14 handle classes — and mapped each to a named cancel path (sweep 1 / sweep 2 / engine teardown / object-attached / self-limiting). Zero uncovered. Extracted the vendored engine's `go()` teardown verbatim to prove both `onSceneLeave` registrations fire (game.events bus, triggered before any clearing, scene objects still alive so sweep 2's `player.exists()` guard holds). Also verified: goal fire-once latch, respawn seam duplicates nothing, checkpoint promotion clones position, NAV-03 tween-deferred transition unregressed.
- **Canon refinement recorded:** in this build, `go()` wipes the app bus (`app.events.clear()`) and kills in-flight global tweens (`root.clearEvents()`), then `cr()` re-registers engine internals — so app-bus controllers ARE auto-cleared, contra bug-pattern #5's wording. Manual cancels kept as defense-in-depth.
- **Finding 7 (title.js): CONFIRMED CLEAN.** Start controllers are scene-body app-bus registrations wiped at `go("select")`; three independent layers prevent the Space press edge from ever reaching game-scene jump buffering.

### Task 2: select.js, hud.js, boot shell + cluster regression (commit e83c7de)

- **Finding 8 (select.js): CLEAN at 4 tiles; IN-03 deferred-to-phase-25.** Live page-evaluated tile geometry (throwaway script, port 8771): rightmost edge 528 < 640. Mixed-state save behaviorally proved the locked/unlocked/cleared derivation (`locked: [false,false,true,true]` from level-01-cleared save). No layout diff in this plan.
- **Finding 9 (hud.js): CLEAN.** One-way contract verified by source + check-progress.sh assertion 8 oracle; flash tween triple-covered on scene exit (child removal + root.clearEvents + benign orphan write).
- **Finding 10 (main.js/index.html): UNREGRESSED.** Byte-identical to baseline `5eedee8`. Recorded the load-bearing rationale: `transform: scale(1.5)` preserves Kaplay's offsetX/offsetY hit-testing assumption; width/height styling silently breaks position-based onClick (documented Phase 14 bug). file:// guard verified pre-module by construction.
- **Cluster B regression: PASS** — 4 static gates green, `browser-boot.mjs` exit 0, three boot-path screenshots captured this run (`22-03-B1-title.png`, `22-03-B2-select.png`, `22-03-B3-level-hud.png`, scratchpad).

## Deviations from Plan

None - plan executed exactly as written. The plan allowed "0 or more" fix commits; the review found nothing to fix (all six files clean), so zero `fix(22-03)` commits exist — the conditional sweep-addition artifact was not needed.

## Verification Evidence

- Task 1 gate chain + `grep -c 'src/scenes/game.js' >= 2` in findings: `GAME-TITLE-OK`
- Task 2 chain: browser-boot exit 0 + check-progress PASS + `Cluster B regression: PASS` count == 1 + `| pending |` count == 12: `CLUSTER-B-OK`
- Per-Entity Verdict Table: 12 of 24 rows now final (Clusters A + B), 12 pending (Cluster C, Plan 22-04)

## Known Stubs

None — no stubs introduced; no src/ files were modified in this plan.

## Threat Flags

None — no new network endpoints, auth paths, or trust-boundary changes. The only server run was the throwaway evidence script reusing the CR-02-hardened loopback-bound skeleton verbatim (T-22-02 accepted disposition).

## Notes for Later Plans

- FIX-01 remains unchecked in REQUIREMENTS.md (matching 22-01/22-02 convention) — it completes when the verdict table is full (22-04) and the FIX-02 round closes (22-05).
- Plan 22-04 (Cluster C) can cite Finding 6's engine extract for any player.js/fx.js tween-lifecycle claims instead of re-deriving `go()` semantics.

## Self-Check: PASSED

- FOUND: .planning/phases/22-implementation-review-auto-fix/22-03-SUMMARY.md
- FOUND: commit 466fdd9 (docs(22-03): Findings 6-7)
- FOUND: commit e83c7de (docs(22-03): Findings 8-10 + Cluster B regression PASS)
- VERIFIED: `Cluster B regression: PASS` appears exactly once in 22-FINDINGS.md
- VERIFIED: 12 verdict rows pending (24 − Clusters A+B)
- VERIFIED: `git diff 5eedee8..HEAD -- src/scenes/ src/ui/hud.js src/main.js src/index.html` empty
