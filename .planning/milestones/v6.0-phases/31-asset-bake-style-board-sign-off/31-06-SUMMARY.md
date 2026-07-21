---
phase: 31-asset-bake-style-board-sign-off
plan: 06
subsystem: assets
tags: [gothicvania, opengameart, cc0, licensing, pink-gate, art-01, phase-closeout]

# Dependency graph
requires:
  - phase: 31-asset-bake-style-board-sign-off (Plan 31-01)
    provides: "Live-reconfirmed CC0/license quotes per pack, quoted verbatim into the 5 new LICENSES proof files"
  - phase: 31-asset-bake-style-board-sign-off (Plan 31-04)
    provides: "4 biome terrain atlases + 12 parallax layers, credited/proofed in this plan"
  - phase: 31-asset-bake-style-board-sign-off (Plan 31-05)
    provides: "player-swamphunter.png + enemy-hellhound.png, credited/proofed in this plan"
provides:
  - "5 new CREDITS.md rows covering every Gothicvania-sourced file vendored this phase"
  - "5 new assets/LICENSES/gothicvania-{swamp,town,cemetery,church,patreon}.txt proof files"
  - "Final documented GREEN pass of bash scripts/check-pink-gate.sh over the complete post-phase assets/ tree — the definitive proof half of this phase's RED-first (Plan 31-03) / GREEN-after (this plan) Nyquist validation pair"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-count acceptance criteria (grep CREDITS.md rows against `test -f` on the real filesystem) as the control for CREDITS-completeness, since no automated CREDITS-completeness gate exists in this project"

key-files:
  created:
    - "assets/LICENSES/gothicvania-swamp.txt"
    - "assets/LICENSES/gothicvania-town.txt"
    - "assets/LICENSES/gothicvania-cemetery.txt"
    - "assets/LICENSES/gothicvania-church.txt"
    - "assets/LICENSES/gothicvania-patreon.txt"
  modified:
    - "CREDITS.md"

key-decisions:
  - "File-column lists for all 5 new CREDITS.md rows matched the plan's own projection exactly — cross-checked against `ls assets/tiles/ assets/parallax/` and the actual filenames on disk from Plans 31-04/31-05, no adjustment needed"
  - "Cemetery's terrain atlas was documented as NOT retinted (a genuine visual-judgment crop choice from Plan 31-04, avoiding a tombstone-shadow HSV artifact) rather than glossing over it as if a retint had been applied"

patterns-established: []

requirements-completed: [ART-01]

coverage:
  - id: D1
    description: "Every file vendored under assets/ this phase (4 atlases, 12 parallax layers, player-swamphunter.png, enemy-hellhound.png) has a matching CREDITS.md row and a matching assets/LICENSES/<pack>.txt proof file, verified by cross-count against the real filesystem"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "grep -c 'gothicvania|ansimuz' CREDITS.md -> 7 (>=5 required); for f in <all File-column paths>; do test -f \"$f\"; done -> zero MISSING lines; ls assets/LICENSES/gothicvania-*.txt | wc -l -> 5"
        status: pass
    human_judgment: false
  - id: D2
    description: "bash scripts/check-pink-gate.sh passes cleanly over the FULL final assets/ tree (every file from every plan in this phase included) — the definitive GREEN regression proof"
    requirement: "ART-01"
    verification:
      - kind: integration
        ref: "bash scripts/check-pink-gate.sh -> pink-gate checks: PASS, exit 0 (one ALLOWLISTED, not-a-failure hit reported for assets/player-swamphunter.png at 43.3%)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No CC-BY content (the Pascal Belisle music bundled in 3 of the 5 packs) appears anywhere under assets/ or in any CREDITS.md Asset-row License column — only the CC0 art is vendored"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "grep -n 'CC-BY|Pascal Belisle' CREDITS.md -> both hits confined to the explanatory Notes bullet, none in an Asset row's License column; find assets -iname '*.mp3' -o -iname '*.ogg' -> only pre-existing Kenney-sourced files under assets/music/ and assets/sfx/, no new Gothicvania-pack music"
        status: pass
    human_judgment: false
  - id: D4
    description: "The two named pink offenders (Town roof/sky, Cemetery horizon glow) confirmed genuinely retinted clean in the final baked outputs; Cemetery's terrain atlas confirmed clean-as-is (shadow-tone false positive, not genuine pink); the pink_scan.py allowlist remains exactly 1 entry"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "python3 scripts/lib/pink_scan.py assets/tiles/atlas-town.png -> 0.0000; assets/parallax/far-town.png -> 0.0000; assets/parallax/far-cemetery.png -> 0.0000; assets/tiles/atlas-cemetery.png -> 0.0000; ALLOWLIST dict in scripts/lib/pink_scan.py contains exactly 1 key (assets/player-swamphunter.png)"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-07-10
status: complete
---

# Phase 31 Plan 06: CREDITS/LICENSES Sign-off & Final Pink-Gate Regression Summary

**Added 5 new CREDITS.md rows + 5 matching `assets/LICENSES/gothicvania-*.txt` proof files for every Gothicvania-sourced asset vendored this phase, then closed the phase with a final documented GREEN pass of `bash scripts/check-pink-gate.sh` over the complete post-phase `assets/` tree.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-10T~17:58Z (approx)
- **Completed:** 2026-07-10T18:18:30Z
- **Tasks:** 2/2
- **Files modified:** 1 modified (`CREDITS.md`), 5 created (`assets/LICENSES/gothicvania-*.txt`)

## Accomplishments

- Added 5 new rows to `CREDITS.md`'s `## Assets` table (Swamp, Town, Patreon Collection, Cemetery, Church), author `ansimuz (Luis Zuno)`, License `CC0`, grouped by source pack per the existing multi-file-per-row convention (e.g. the pre-existing `enemy-1.png, enemy-2.png, enemy-3.png` row)
- Cross-checked every File-column path in the 5 new rows against the real filesystem (`test -f`) — all paths matched Plan 31-04/31-05's actual output exactly, no projection-vs-reality drift found
- Added a new `## Notes` bullet documenting: the Gothicvania pack family as the first fully style-coherent single-artist collection in this project (superseding the mixed-source approach of Phases 18/20/26); the explicit non-vendoring of the CC-BY Pascal Belisle music bundled in the packs; and the gitignored, re-fetchable `assets/_gothicvania-src/` scratch directory convention
- Wrote 5 new `assets/LICENSES/gothicvania-{swamp,town,cemetery,church,patreon}.txt` proof files following `ground.txt`'s exact structure (Asset / Source pack / Author / Source URL / Tiles-frames used / License / quoted declaration / CC0 full-text link / Processing note / Verification / Vendor-logo line), quoting Plan 31-01's live-reconfirmed exact license text: *"Public domain and free to use on whatever you want, personal or commercial. Credit is not required but appreciated."*
- Each proof file's Processing note accurately documents what was actually done to that pack's assets: Swamp/Church/Patreon Collection needed no retint (measured 0% or near-0% dominant pink pre-bake); Town's roof/sky and Cemetery's horizon-glow/mountains were retinted via `hue_shift_band()`; Cemetery's terrain atlas was deliberately cropped to avoid a tombstone-shadow HSV artifact rather than retinted
- Ran the final full-tree `bash scripts/check-pink-gate.sh` over the complete, final `assets/` tree (every file from every plan in this phase) — exits 0, prints `pink-gate checks: PASS`, with one expected `ALLOWLISTED (not a failure)` line for `assets/player-swamphunter.png` (43.3%)
- Re-ran `python3 scripts/lib/pink_scan.py` directly against `assets/tiles/atlas-town.png`, `assets/parallax/far-town.png`, `assets/parallax/far-cemetery.png` — all three measure `0.0000` (well below the 0.08 threshold), confirming the two named pink offenders are genuinely retinted clean in the shipped output
- Also re-checked `assets/tiles/atlas-cemetery.png` (not retinted, per Plan 31-04's deliberate crop-choice path) — measures `0.0000`, confirming its recorded clean-as-is finding still holds
- Confirmed the `ALLOWLIST` dict in `scripts/lib/pink_scan.py` contains exactly 1 entry (`assets/player-swamphunter.png`) — no second entry was needed, so no new justification was required

## Task Commits

1. **Task 1: CREDITS.md rows + LICENSES proof files for all 5 Gothicvania packs** - `9569207` (docs)
2. **Task 2: Final full-tree pink-gate regression proof** - no commit (plan explicitly declares `<files>(none created/modified)</files>` — verification-only, run against the already-committed final `assets/` tree from Plans 31-01 through 31-05; `git status --short` confirmed clean before and after)

**Plan metadata:** this SUMMARY commit (docs, made per worktree convention — orchestrator/wave-merge owns STATE.md/ROADMAP.md updates)

## Files Created/Modified

- `CREDITS.md` - 5 new Asset rows + 1 new Notes bullet documenting the Gothicvania pack family
- `assets/LICENSES/gothicvania-swamp.txt` - proof file: terrain atlas, 3-layer parallax, player sprite
- `assets/LICENSES/gothicvania-town.txt` - proof file: terrain atlas + dusk-sky parallax (both retinted)
- `assets/LICENSES/gothicvania-cemetery.txt` - proof file: terrain atlas (not retinted, deliberate crop choice) + 3-layer parallax (far/mid retinted)
- `assets/LICENSES/gothicvania-church.txt` - proof file: castle biome's near parallax layer
- `assets/LICENSES/gothicvania-patreon.txt` - proof file: night-town + castle parallax layers, hell hound enemy sprite

## Decisions Made

- No File-column adjustments were needed for any of the 5 rows — Plan 31-04/31-05's actual baked output matched this plan's own projection exactly (verified via `ls assets/tiles/ assets/parallax/` and `test -f` on every listed path)
- Documented Cemetery's terrain atlas honestly as "not retinted, a deliberate crop-choice avoiding a shadow-tone HSV artifact" rather than glossing over it as if the same retint pipeline had been applied — matches this plan's threat-model requirement (T-31-13) that CREDITS/LICENSES documentation accurately describe what actually happened, not a template restatement

## Deviations from Plan

None - plan executed exactly as written. Both tasks' acceptance criteria and verification commands passed on first run with no auto-fixes needed. No re-fetch of `assets/_gothicvania-src/` was required for this plan (unlike Plans 31-03/31-04/31-05) since this plan's work is entirely against already-baked, already-committed `assets/` output plus documentation text — no raw source pack access was needed.

## Issues Encountered

None.

## Known Stubs

None. All 5 new LICENSES proof files describe real, already-baked, already-vendored assets — no placeholders.

## Threat Flags

None — this plan's `<threat_model>` anticipated its two threats (T-31-13 CREDITS/LICENSES completeness repudiation, T-31-14 CC-BY music misattribution tampering), both mitigated as designed: cross-count acceptance criteria confirmed every File-column path exists on disk, and the CC-BY grep confirmed no music leaked in and no CC-BY mention appears outside the explanatory Notes bullet. No new network endpoints, auth paths, or trust-boundary changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

This is the final plan in Phase 31 (`asset-bake-style-board-sign-off`). All 6 plans are now complete:
- Plan 31-01: Gothicvania asset fetch + license re-verification
- Plan 31-02: Style board regeneration + 5-round human sign-off
- Plan 31-03: Pink-hue scan gate + RED-first proof
- Plan 31-04: Biome terrain atlas + parallax baking
- Plan 31-05: Player + enemy sprite bake + anchor/lip convention doc
- Plan 31-06 (this plan): CREDITS/LICENSES sign-off + final pink-gate regression proof

The phase's ART-01 requirement is fully closed: every vendored Gothicvania asset is credited and license-proofed, cross-checked against the real filesystem; the automated no-pink gate exists, was proven RED-first against real pre-retint content, and now passes GREEN over the complete final `assets/` tree; no CC-BY content leaked into the vendored art. No blockers for Phase 32.

---
*Phase: 31-asset-bake-style-board-sign-off*
*Completed: 2026-07-10*

## Self-Check: PASSED

All 5 new `assets/LICENSES/gothicvania-*.txt` proof files and this SUMMARY.md confirmed present on disk; task commit `9569207` confirmed present in git log. `bash scripts/check-pink-gate.sh` re-run clean immediately before this check.
