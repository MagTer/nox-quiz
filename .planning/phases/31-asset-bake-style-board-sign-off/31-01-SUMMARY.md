---
phase: 31-asset-bake-style-board-sign-off
plan: 01
subsystem: assets
tags: [gothicvania, opengameart, cc0, licensing, pillow, art-pipeline]

# Dependency graph
requires: []
provides:
  - "assets/_gothicvania-src/ populated with all 5 extracted Gothicvania (ansimuz) OGA packs"
  - "Live 2026-07-10 re-verified CC0/public-domain status for all 5 packs, with the 3-pack CC-BY-music carve-out re-confirmed"
  - ".gitignore stanza excluding assets/_gothicvania-src/ (multi-MB re-fetchable raw archives never enter git history)"
affects: [31-02, 31-03, 31-04, 31-05, 31-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gitignored `_gothicvania-src/` scratch convention (mirrors but deliberately diverges from the committed `_kenney-src/`/`_opengameart-src/` pattern due to pack size)"
    - "zip-slip + zipfile.is_zipfile() integrity gate before any unzip -d extraction of third-party archives"

key-files:
  created:
    - "assets/_gothicvania-src/gothicvania_swamp_files/Gothicvania Swamp files/** (gitignored)"
    - "assets/_gothicvania-src/gothicvania-town-files/GothicVania-town-files/** (gitignored)"
    - "assets/_gothicvania-src/gothicvania-cemetery-files_1/gothicvania-cemetery-files/** (gitignored)"
    - "assets/_gothicvania-src/gothicvania-church-files/gothicvania church files/** (gitignored)"
    - "assets/_gothicvania-src/gothicvaniapatreoncollection/ gothicvania patreon collection/** (gitignored, note leading space in folder name)"
  modified:
    - ".gitignore"

key-decisions:
  - "Extraction directory names match styleboard.py's existing hardcoded load() path literals exactly (gothicvania_swamp_files, gothicvania-town-files, gothicvania-cemetery-files_1, gothicvania-church-files, gothicvaniapatreoncollection) so Plan 31-02 resolves without FileNotFoundError"
  - "Church pack's outer directory name (not referenced by any existing script) kept consistent with the other 4 for readability, per plan guidance"

patterns-established:
  - "Third-party raw art pack downloads live under a gitignored `_gothicvania-src/` scratch dir, distinct from the committed `_kenney-src/`/`_opengameart-src/` convention, because of size — only baked/cropped PNGs get vendored into assets/ proper"

requirements-completed: [ART-01]

coverage:
  - id: D1
    description: "All 5 Gothicvania OGA zip packs downloaded, integrity/zip-slip verified, and extracted into the exact directory names styleboard.py expects"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "find assets/_gothicvania-src -mindepth 1 -maxdepth 1 -type d | wc -l -> 5; find assets/_gothicvania-src -iname background.png | wc -l -> 4; git check-ignore -q assets/_gothicvania-src/gothicvania_swamp_files -> exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Live re-verification (this session, 2026-07-10) that all 5 packs' bundled public-license.txt still declare CC0/public-domain by Luis Zuno (ansimuz), with the 3-pack (Swamp/Town/Cemetery) CC-BY music carve-out re-confirmed"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "grep -rlc 'Public domain and free to use' assets/_gothicvania-src --include=public-license.txt | wc -l -> 5; grep -rl 'Music License' assets/_gothicvania-src --include=public-license.txt -> exactly Swamp/Town/Cemetery"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-07-10
status: complete
---

# Phase 31 Plan 01: Gothicvania Asset Fetch & License Re-verification Summary

**Re-fetched and integrity-verified all 5 Gothicvania (ansimuz) CC0 OGA packs into a gitignored scratch dir, live-reconfirming public-domain status and the 3-pack CC-BY-music carve-out, unblocking Plan 31-02's style-board regeneration.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-10T11:33:00Z (approx)
- **Completed:** 2026-07-10T11:48:06Z
- **Tasks:** 2/2
- **Files modified:** 1 (`.gitignore`) + 5 extracted pack trees (gitignored, not tracked)

## Accomplishments
- All 5 Gothicvania OGA zip URLs re-fetched successfully (HTTP 200, byte sizes matching ASSET-SCOUTING.md's table: swamp 436KB, town 9.08MB, cemetery 3.60MB, church 733KB, patreon collection 4.00MB)
- Every zip verified as a genuine archive (`zipfile.is_zipfile()`) and scanned for path-traversal (`../`) entries before extraction — zero traversal entries found in any of the 5
- Extracted into the exact 5 directory names `styleboard.py`'s existing hardcoded `load()` calls already expect, confirmed by inspecting each zip's actual internal top-level folder name before extraction (including the literal leading space on the Patreon Collection pack's inner folder, `" gothicvania patreon collection"`)
- Live re-read of all 5 packs' bundled `public-license.txt` files this session: all confirm "Public domain and free to use on whatever you want, personal or commercial" by Luis Zuno (@ansimuz); exactly 3 (Swamp, Town, Cemetery) carry a separate "Music License" section crediting Pascal Belisle's music as CC-BY (confirmed NOT CC0) — Church's license only mentions "Demo Music" credit (no "Music License" header), Patreon Collection's has no music mention at all — matching ASSET-SCOUTING.md's prior finding exactly, with zero new surprises
- Confirmed no `.mp3`/`.ogg`/`.wav` from these packs has leaked into any non-`_gothicvania-src` path under `assets/`
- `.gitignore` updated with a new stanza; `git check-ignore` confirms the whole `assets/_gothicvania-src/` tree is genuinely ignored (not merely un-added)

## Task Commits

1. **Task 1: Gitignore + fetch/extract with integrity and zip-slip checks** - `6d7d3a8` (chore)
2. **Task 2: Live CC0 license re-verification per pack** - no commit (read-only verification task; plan's own `<files>` spec is "none created/modified")

**Plan metadata:** (this SUMMARY commit, made by orchestrator/wave-merge per worktree convention)

## Files Created/Modified
- `.gitignore` - added `assets/_gothicvania-src/` exclusion stanza with rationale comment
- `assets/_gothicvania-src/gothicvania_swamp_files/**` - extracted Swamp pack (gitignored)
- `assets/_gothicvania-src/gothicvania-town-files/**` - extracted Town pack (gitignored)
- `assets/_gothicvania-src/gothicvania-cemetery-files_1/**` - extracted Cemetery pack (gitignored)
- `assets/_gothicvania-src/gothicvania-church-files/**` - extracted Church pack (gitignored)
- `assets/_gothicvania-src/gothicvaniapatreoncollection/**` - extracted Patreon Collection pack (gitignored)

## Decisions Made
None beyond the plan's own — directory names, zip-slip check technique, and license re-verification approach all followed the plan exactly as written.

## License Findings (for Plan 31-06 to quote verbatim)

All 5 packs, artwork by Luis Zuno (@ansimuz), same core sentence in each `public-license.txt`:

> "Public domain and free to use on whatever you want, personal or commercial. Credit is not required but appreciated."

Music carve-out (bundled music CC-BY, NOT CC0 — never vendor):

- **Swamp, Town, Cemetery** (3 packs) — dedicated "Music License" section: "You are free to use the music in your projects as long as you give appropriate credit." (Music by Pascal Belisle)
- **Church** — no "Music License" header, only an "Additional credits / Demo Music by Pascal Belisle" line (weaker but still non-CC0 attribution; no music to vendor regardless)
- **Patreon Collection** — no music mention at all

## Deviations from Plan

None - plan executed exactly as written. Both tasks' acceptance criteria and verification commands passed on first run with no auto-fixes needed.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
`assets/_gothicvania-src/` is fully populated with all 5 packs at the exact paths `styleboard.py` (Plan 31-02) already expects, and CC0 status is freshly re-confirmed this session. Plan 31-02 (style-board regeneration with Swamp Hunter player + Hell hound castle enemy) can proceed without any FileNotFoundError risk. No blockers.

---
*Phase: 31-asset-bake-style-board-sign-off*
*Completed: 2026-07-10*
