---
phase: 31-asset-bake-style-board-sign-off
verified: 2026-07-11T00:00:00Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 31: Asset Bake & Style-Board Sign-off Verification Report

**Phase Goal:** A style-coherent SNES-fidelity dark pixel-art collection is vendored, license-clean, conformed, and human-approved on a style board before any of it touches game code — the hard blocking gate for every downstream art phase.
**Verified:** 2026-07-11T00:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP Success Criterion) | Status | Evidence |
|---|---|---|---|
| 1 | User reviews a style-board mock screen and gives a genuine, multi-round human sign-off BEFORE any asset is integrated into the game — never rubber-stamped | ✓ VERIFIED | `31-02-SUMMARY.md` documents 5 real review rounds with verbatim quotes: round 2 ("...player position does not align to the floor...") → NOT approved, led to fix `94e6259`; round 3 (Swedish: floor too high in swamp) → NOT approved, fix `168d301`; round 4 ("weird dog is floating...") → NOT approved, fix `9443f7f`; round 5 final: "Looks good. Approved." All 3 intermediate fixes are real commits with measured pixel corrections (`feet_y` 336→290, new `SWAMP_*_FEET_Y` constants, `CASTLE_HOUND_FEET_Y=258`), not taste-only churn. Visually confirmed by opening `.planning/research/v6-scouting/style-board-sheet.png`: same Swamp Hunter character stands in all 4 biome scenes, castle scene shows a hound (not a fire skull), all 4 read as one coherent dark palette with no pink. This matches the project's Phase 26 non-rubber-stamp standard and is a genuine artifact record, not a synthesized approval. |
| 2 | One style-coherent CC0/CC-BY collection (ansimuz Gothicvania anchor, 3–4 biomes) vendored under `assets/` with licenses in `assets/LICENSES/` and credits in `CREDITS.md`, named files only — no CC-BY music or unused pack content leaks in | ✓ VERIFIED | All 18 baked files (4 atlases + 12 parallax layers + 2 sprites) exist on disk and are each listed in one of 5 new `CREDITS.md` rows; cross-check (`test -f` on every File-column path) found zero missing files. 5 matching `assets/LICENSES/gothicvania-{swamp,town,cemetery,church,patreon}.txt` proof files exist, each quoting the live-reconfirmed CC0 declaration. `find assets -iname "*.mp3" -o -iname "*.ogg" -o -iname "*.wav"` returns only pre-existing Kenney/OpenGameArt audio (no `Pascal Belisle`/Gothicvania-pack file); grep of `CREDITS.md` confirms the CC-BY music mention is confined to the explanatory `## Notes` bullet, never an Asset row's License column (all 5 new rows say `CC0`). Raw multi-MB source packs live only in gitignored `assets/_gothicvania-src/` (`.gitignore` line 17), confirmed not present/tracked in the working tree. |
| 3 | An automated pink-hue scan gate exists and passes over all vendored art — no pink asset can land now or in the future; the two known pink/magenta skies are retinted via the live-proven Pillow hue-conform pass | ✓ VERIFIED | Ran `bash scripts/check-pink-gate.sh` live: exits 0, prints `pink-gate checks: PASS`, with one expected `ALLOWLISTED (not a failure)` line for `assets/player-swamphunter.png` (43.3%, justified low-brightness HSV artifact, not visually pink — confirmed by direct visual inspection of the baked sprite sheet). Ran `python3 scripts/lib/pink_scan.py` self-test live: all 3 synthetic cases (opaque salmon-pink→1.0, near-black→0.0, all-transparent→0.0) PASS. Directly re-scanned the two named offenders post-bake: `atlas-town.png` → 0.0000, `far-town.png` → 0.0000, `far-cemetery.png` → 0.0000, `atlas-cemetery.png` → 0.0000 — all well below the 0.08 threshold. `31-03-SUMMARY.md` documents the RED-first proof against the raw pre-retint source crops (~64% Town, ~79% Cemetery) before any retint was applied, satisfying the RED-first/GREEN-after pair. |
| 4 | Baked per-biome atlases follow a written anchor/lip convention (16×32-compatible cap tiles, documented lip offset) so downstream integration can prove sprites don't lie about solid ground | ✓ VERIFIED | `docs/LEVEL-DESIGN.md` Section 9 ("Biome atlas anchor/lip convention (ART-01)") exists, positioned after Section 8, with a per-biome table of *measured* (not projected) lip offsets pixel-scanned from the real baked atlases: Swamp ~4px, Town ~26px, Cemetery flagged as not fitting the model (floating mound, doesn't reach tile bottom — explicit Phase-32 follow-up note), Castle flagged as an inverted bottom-anchored lip (explicit Phase-32 follow-up note). All 4 atlas files independently verified via PIL: `(32, 32)` RGBA, i.e. 2 frames of 16×32 — satisfies the locked 16px tile grid / cap-tile footprint. A collider-vs-sprite warning is present verbatim ("the lip is purely a rendering offset, never a physics offset"). The two irregular biomes are flagged honestly rather than glossed over, which is what lets downstream integration "prove sprites don't lie" rather than assume a uniform convention that doesn't actually hold. |

**Score:** 4/4 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `assets/tiles/atlas-{swamp,town,cemetery,castle}.png` | 4 baked terrain atlases, 16×32-compatible | ✓ VERIFIED | All 4 exist, each `(32,32)` RGBA (2×16×32 frames); visually inspected (scaled 6× preview) — real cropped pixel art, dark-grunge palette, no pink, no corruption. |
| `assets/parallax/{far,mid,near}-{swamp,town,cemetery,castle}.png` | 12 baked parallax layers | ✓ VERIFIED | All 12 exist on disk with plausible byte sizes (631B–6.7KB); listed and cross-checked against `CREDITS.md`. |
| `assets/player-swamphunter.png` | Idle/run/jump/fall sheet, native color, signed-off pick | ✓ VERIFIED | Exists, `(192,32)` RGBA (12 frames); visually inspected — clearly the Swamp Hunter, matches style-board render; `grep` confirms `build_player_swamphunter()` calls no `_remap`/`_remap_luminance` (native color preserved). |
| `assets/enemy-hellhound.png` | Static idle-only sheet, native color | ✓ VERIFIED | Exists, `(384,32)` RGBA (6 idle frames); visually inspected — clear hound silhouette; `grep -c "hell-hound-walk\|hell-hound-run\|hell-hound-jump"` inside `build_enemy_hellhound()` returns 0. |
| `scripts/lib/pink_scan.py` / `scripts/check-pink-gate.sh` | Gate exists, matches `check-*.sh` family conventions | ✓ VERIFIED | Both files exist; wrapper follows `check-progress.sh`'s shape (`set -euo pipefail`, `ROOT=`, `fail()`, trailing PASS echo); ran live, passes. |
| `assets/LICENSES/gothicvania-{swamp,town,cemetery,church,patreon}.txt` | 5 proof files | ✓ VERIFIED | All 5 exist, each follows `ground.txt`'s structure, quotes the live-reconfirmed CC0 text. (Minor: 3 of the 5 files carry a doc-only dimension label typo "32x16" instead of the actual "32x32" — pre-existing, already flagged and consciously left unfixed as Info-tier in `31-REVIEW.md`'s IN-01; does not affect gate behavior or licensing accuracy.) |
| `CREDITS.md` (5 new rows + Notes bullet) | Complete, accurate File columns | ✓ VERIFIED | 5 rows present; every listed file path confirmed to exist on disk; CC-BY/Pascal Belisle mention confined to Notes bullet, never a License-column value. |
| `docs/LEVEL-DESIGN.md` Section 9 | Anchor/lip convention doc | ✓ VERIFIED | Present, real measured numbers, explicit Phase-32 follow-ups for the 2 irregular biomes, collider-vs-sprite warning included. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `scripts/lib/pink_scan.py` directory-walk | `assets/_*-src/` exclusion | path-prefix pruning | ✓ WIRED | `_iter_png_files()` prunes any `_`-prefixed directory (superset of the literal 3-name requirement); confirmed no raw source content is ever scanned/vendored. |
| `scripts/check-pink-gate.sh` | `scripts/lib/pink_scan.py` | shell invocation | ✓ WIRED | Ran live; wrapper correctly propagates pass/fail and prints allowlist hits. |
| `CREDITS.md` rows | real files on disk | File-column paths | ✓ WIRED | Cross-check script found zero `MISSING:` lines across all 18 files. |
| `styleboard.py` swaps | Plan 31-01's extraction dirs | `ROOT` constant repoint | ✓ WIRED | `grep -c "gothic-hero\|fire-skull"` → 0; `grep -c "idle1.png"` → 4; `grep -c "hell-hound-idle"` → 2; regenerated PNGs exist with the correct swaps, visually confirmed. |
| `docs/LEVEL-DESIGN.md` Section 9 numbers | Plan 31-04's real baked crop rects | pixel-scan measurement | ✓ WIRED | Numbers are per-biome, sourced from a real scan of the actual baked atlas frames (not SPIKE-FINDINGS.md's stale estimate), including honest anomaly flags for Cemetery/Castle. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Pink gate passes over live `assets/` tree | `bash scripts/check-pink-gate.sh` | exit 0, `pink-gate checks: PASS`, 1 expected allowlist hit | ✓ PASS |
| `pink_scan.py` self-test (3 synthetic cases) | `python3 scripts/lib/pink_scan.py` | `[selftest] ALL PASS` | ✓ PASS |
| Named pink offenders clean post-bake | `python3 scripts/lib/pink_scan.py assets/{tiles/atlas-town,parallax/far-town,parallax/far-cemetery,tiles/atlas-cemetery}.png` | all `0.0000` | ✓ PASS |
| No src/ regression from this asset-only phase | `check-gate.sh`, `check-safety.sh`, `check-import-safety.sh`, `check-progress.sh` | all PASS | ✓ PASS |
| Atlas/sprite dimensions match documented bake output | `PIL.Image.open(...).size` on all 4 atlases + 2 sprites | matches asserted sizes exactly | ✓ PASS |
| `build-art-assets.py` reproducibility (partial re-run) | `python3 scripts/build-art-assets.py` | pre-Gothicvania sections re-generate byte-plausibly; Gothicvania sections fail with `FileNotFoundError` on the gitignored, ephemeral `assets/_gothicvania-src/` tree (expected — raw packs are not present in this session, by design; already-baked/committed output files are unaffected) | ✓ PASS (expected behavior, not a regression) |

### Probe Execution

No `scripts/*/tests/probe-*.sh` declared or referenced by this phase's PLAN/SUMMARY files — skipped (not applicable).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| ART-01 | 31-01..31-06 | Gothicvania collection vendored, style-board sign-off, pink-gate | ✓ SATISFIED (code) | All 4 truths above verified. `.planning/REQUIREMENTS.md`'s traceability table still shows `ART-01 \| Phase 31 \| Pending` and the checkbox is unchecked — this is a **pending administrative step**, not a code gap: this phase's own `.continue-here.md` explicitly names `update_roadmap` (flipping REQUIREMENTS.md/ROADMAP checkboxes) as the step that runs AFTER `verify_phase_goal` (this verification), consistent with how Phases 29/30 were closed. Flagged for the orchestrator to complete post-verification. |

No orphaned requirements found — `ART-01` is the only requirement mapped to Phase 31 in `REQUIREMENTS.md`, and it is claimed by all 6 plans' frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `assets/LICENSES/gothicvania-{swamp,cemetery,town}.txt` | 1-2 | Dimension label says "32x16" where the shipped atlas is actually 32x32 | ℹ️ Info | Pre-existing, already identified as `31-REVIEW.md`'s IN-01 and consciously left unfixed (doc text only, no functional/gate impact). Carried forward here for completeness, not a new finding. |

No TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER markers found in any file this phase modified (`scripts/build-art-assets.py`, `scripts/lib/pink_scan.py`, `scripts/check-pink-gate.sh`, `docs/LEVEL-DESIGN.md`, `CREDITS.md`, `.planning/research/v6-scouting/styleboard.py`). Code review (`31-REVIEW.md`, iteration 2) is clean: 0 critical, 0 warning, 0 info (both prior-iteration warnings WR-05/WR-06 confirmed fixed and re-verified against current file contents in this session).

### Human Verification Required

None. The phase's one human-in-the-loop checkpoint (style-board sign-off) was already completed genuinely in a prior session, with a verbatim-quoted 5-round record showing 3 real, substantive defects found and fixed before approval — the opposite of a rubber stamp. Per this task's instructions, that record was judged from the artifact evidence (commits, quoted feedback, before/after images) rather than re-asked live, since there is no live human available in this verification pass and the existing record is genuine, specific, and falsifiable (references real pixel-measured bugs, not vague approval language).

### Gaps Summary

No blocking gaps found. One administrative item is open (REQUIREMENTS.md/ROADMAP traceability-table flip from Pending→Complete for ART-01), which is expected to be handled by the orchestrator's `update_roadmap` step immediately following this verification, per this phase's own recorded workflow state.

---

_Verified: 2026-07-11T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
