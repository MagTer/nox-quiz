---
phase: 25-levels-5-8-difficulty-ramp-select-grid
verified: 2026-07-07T16:22:04Z
status: human_needed
score: 7/9 must-haves verified
behavior_unverified: 2
overrides_applied: 0
gaps: []
behavior_unverified_items:
  - truth: "A human has walked to each of the 8 levels' secret alcove and confirmed it awards +5 XP exactly once, never freezes the player or opens a challenge, and skipping it costs nothing."
    test: "Serve the game over HTTP, enter each of levels 1-8, navigate to the level's geometry.secretAlcove {x,y} coordinate (optionally with ?debug=1 for a visible marker, re-confirming in a normal tab), and touch it."
    expected: "HUD XP increments by exactly 5 on first touch; player is never frozen and no challenge UI opens; a second touch does nothing further; completing the level without touching the alcove still clears it normally."
    why_human: "scripts/lib/mechanic-drive.mjs's deriveEncounters() (shared by browser-boot.mjs and audit-phase21-mechanics.mjs) and scripts/validate-levels.mjs's reachability model both intentionally exclude secretAlcove as a checked kind (25-REVIEW.md WR-01/WR-06, confirmed still true and tracked as a pending todo) — no automated harness in this repo can currently observe alcove reachability or trigger behavior. Only level-01's alcove was walked by a human (25-FINDINGS.md section d); levels 02-08 rest on code-level review of identical build.js/secretAlcove.js wiring plus per-level coordinate inspection, not runtime proof."
  - truth: "A human has confirmed the 2x4 select grid's Up/Down/Left/Right navigation matches the locked wrap semantics (row-scoped Left/Right, non-wrapping row-jump Up/Down), and locked/unlocked/cleared tile states render correctly across all 8 tiles."
    test: "Serve the game over HTTP, unlock all 8 tiles via the documented localStorage seed, and manually exercise Left/Right (confirm row-scoped wrap, no spill into the other row) and Up/Down (confirm no-op past the top/bottom row edge, same-or-nearest-column landing) across the live 2x4 grid; visually confirm locked/unlocked/cleared tile coloring."
    why_human: "This is a rendering-and-feel claim (does the grid actually look and navigate right on screen) that static code review and a headless Playwright script cannot fully substitute for. browser-boot.mjs's row/col nav loop (Math.floor(i/4) ArrowDown presses + i%4 ArrowRight presses) does prove the underlying key-press sequence reaches all 8 levels in a live browser, including at least one real ArrowDown press for levels 5-8 (row=1) — but it never exercises Left/Right row-wrap-at-edge, Up from row 1 back to row 0, or eyeballs tile-state coloring. The human explicitly deferred this check when closing the 25-07 Task 2 checkpoint (25-FINDINGS.md section d)."
---

# Phase 25: Levels 5-8, Difficulty Ramp & Select Grid Verification Report

**Phase Goal:** The game doubles to eight levels with a coherent gentle ramp, late-game verticality, hidden rewards, and a select screen that scales — with tables 1 and ×10 gone from the math
**Verified:** 2026-07-07T16:22:04Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Levels 5-8 exist as pure-data descriptors through the registry/builder, reachable via `LEVEL_ORDER`/`getLevel()`, static-validator green | ✓ VERIFIED | `src/levels/index.js` — `LEVEL_ORDER.length === 8`, order `level-01..level-08`; `node scripts/validate-levels.mjs` re-run independently: `validate-levels: PASS`, zero `HARD-FAIL` rows across all 8 levels (WARN-tier rows only, the project's established "green" definition) |
| 2 | Levels 5-8 play start→goal green on the interactive audit, zero `triggered:false` encounters | ✓ VERIFIED | Independently re-ran `node scripts/audit-phase21-mechanics.mjs` (not just trusted FINDINGS.md's claim) — raw JSON output captured: 36/36 encounters `triggered:true`, 0 `triggered:false`, across all 8 levels (level-05: 3, level-06: 4, level-07: 2, level-08: 5 new encounters). Matches 25-FINDINGS.md (b)'s claimed counts exactly. |
| 3 | Difficulty ramps gently across all 8 levels (table pools `[2,3,4,5]→[6,7,8,9]`), including a mixed-review level, and no level's pool contains table 1 | ✓ VERIFIED | Read all 8 `allowedTables` literals directly: level-05 `[2,3,4,5]`, level-06 `[4,5,6,7]`, level-07 `[6,7,8]`, level-08 `[6,7,8,9]` (exact CONTEXT-locked literals); level-03 (pre-existing) is `[3,4,5,6,7,8,9]`, the mixed-review level; `grep -n "allowedTables:.*\b1\b"` across all 8 level files returns zero matches — table 1 appears nowhere |
| 4 | ×10 questions never appear (second-factor roll is 1-9); `src/math/brain.js` diff is exactly the one authorized literal | ✓ VERIFIED | `src/math/brain.js:247` reads `Math.floor(Math.random() * 9) + 1`; `git diff 5eedee8 -- src/math/brain.js` shows exactly 3 changed lines total — 1 executable (the roll) + 2 comment/docstring lines (WR-04 fix) — no other logic differs from the pre-v5.0 baseline; `scripts/check-progress.sh` carries permanent positive+negative grep assertions (#14/#15) for both MATH-01/MATH-02, confirmed present and passing |
| 5 | Level select renders all 8 levels in a 2×4 grid, preserving locked/unlocked/cleared semantics; a pre-v5.0 save resumes with levels 5-8 locked by default | ✓ VERIFIED | `src/config.js`: `CONFIG.SELECT.COLS===4`, `ROW_GAP===16`; `src/scenes/select.js` computes `col=t.i % S.COLS`/`row=Math.floor(t.i / S.COLS)`, `moveCursor` row-scopes Left/Right wrap, `moveCursorRow` implements non-wrapping Up/Down with same-or-nearest-column landing (read in full, logic correct); `scripts/smoke-progress.mjs`'s permanent pre-v5.0-save-resume assertion (`isUnlocked("level-05",...)===true`, `isUnlocked("level-06",...)===false` against a levels-1-4-only-cleared save) passes; `node scripts/browser-boot.mjs` (independently re-run) confirms real ArrowDown/ArrowRight key sequences reach all 8 levels in a live headless browser, exiting `Browser boot: PASS`. (Live-eyeball rendering/feel confirmation is truth #9 below — kept separate since it's a distinct, deferred human claim.) |
| 6 | Levels 5-8 include verticality segments (level-07/08) | ✓ VERIFIED | `level-07.js`: `bounds:{left:0,right:3780,top:-360,bottom:360}`; `level-08.js`: `bounds:{left:0,right:3540,top:-360,bottom:360}` — both complete 4-field objects, `top<=-300`; `validate-levels.mjs`'s `spawn-goal` rows for both show WARN (not HARD-FAIL) reaching the goal via ascending platform tiers |
| 7 | Every level (1-8) hides one optional secret XP alcove; the award mechanism is implemented correctly (flat +5 XP, fire-once, never freezes/opens a challenge, HUD-visible) | ✓ VERIFIED | All 8 level files each carry exactly 1 `secretAlcove` entry (grep-confirmed); `src/mechanics/secretAlcove.js` read in full — fire-once `Set` latch, no `openChallenge`/`player.paused`, calls `progress.addBonusXp` + `hud.refresh()`/`flashLevelUp()`; unit-level behavior independently re-run and confirmed: `createProgress().addBonusXp(5)` → xp=5, level=1, returns false; `createProgress({xp:198,level:1}).addBonusXp(5)` → xp=3, level=2, returns true (surplus carry-over, matches `addXp`); `build.js`'s `secretAlcove ?? []` loop confirmed wired, `game.js` wires `wireSecretAlcove({player, progress, hud})` |
| 8 | A human has walked to each of the 8 levels' secret alcove and confirmed the reward/no-freeze/no-punishment behavior live | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Only level-01's alcove was human-walked (HUD +5 XP confirmed, no freeze observed) — see 25-FINDINGS.md (d). Levels 02-08 rest on code-level review only; `scripts/lib/mechanic-drive.mjs`'s `deriveEncounters()` and `validate-levels.mjs`'s reachability model both intentionally exclude `secretAlcove` (confirmed still true by reading `mechanic-drive.mjs`), so no automated harness can substitute. Tracked honestly as a pending todo, not concealed. |
| 9 | A human has confirmed the live 2×4 select grid's actual Up/Down/Left/Right navigation feel and locked/unlocked/cleared tile rendering | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Explicitly deferred by human decision when closing the 25-07 Task 2 checkpoint (25-FINDINGS.md section d) — the human verified level-01's alcove only and elected not to continue to the grid-feel checklist. Code logic is correct (see truth #5) and `browser-boot.mjs` proves the underlying key sequence reaches every level live, but nobody eyeballed row-wrap-at-edge behavior or tile-state coloring on screen. |

**Score:** 7/9 truths verified (2 present + wired, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/mechanics/secretAlcove.js` | fire-once XP-bonus mechanic, no freeze/challenge | ✓ VERIFIED | Exists, exports `wireSecretAlcove`, contract confirmed by direct read |
| `src/progress.js` (`addBonusXp`) | flat XP award with identical carry-over semantics as `addXp` | ✓ VERIFIED | `awardAndCarry(delta)` shared helper (post-WR-05 dedup); behavior re-run and confirmed |
| `src/config.js` (`CONFIG.PROGRESS.XP_ALCOVE`, `CONFIG.SELECT.COLS`/`ROW_GAP`) | new constants | ✓ VERIFIED | `XP_ALCOVE:5`, `COLS:4`, `ROW_GAP:16` all present |
| `src/levels/level-05.js`..`level-08.js` | pure-data descriptors | ✓ VERIFIED | All 4 exist, single `../config.js` import, correct `allowedTables`, 1 `secretAlcove` each |
| `src/levels/index.js` | 8-level registry | ✓ VERIFIED | `LEVEL_ORDER` length 8, correct order, `isUnlocked`/`getLevel` unchanged |
| `.planning/phases/25-levels-5-8-difficulty-ramp-select-grid/25-FINDINGS.md` | full-suite evidence + human sign-off notes | ✓ VERIFIED | Exists, sections (a)-(d) present, honestly documents the scope-limited sign-off |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `geometry.secretAlcove` (per level) | `secretAlcove.js`'s `wireSecretAlcove` | `build.js`'s `secretAlcove ?? []` loop → tagged `"secret-alcove"` entity → `player.onCollide` | ✓ WIRED | Confirmed by direct read of `build.js:307` and `game.js:32` import + call site |
| `secretAlcove.js`'s `progress.addBonusXp` | HUD | `hud.refresh()`/`hud.flashLevelUp()` | ✓ WIRED | Confirmed present in `secretAlcove.js` (this was a real bug found and fixed during 25-07's human walkthrough — XP was silently applied but not rendered until the fix; now wired) |
| `level-05..08.js` | `LEVEL_ORDER`/`getLevel`/`isUnlocked` | `index.js`'s `LEVELS` array append | ✓ WIRED | Confirmed — zero changes needed to derivation logic |
| `browser-boot.mjs`/`audit-phase21-mechanics.mjs`'s nav loop | `select.js`'s row-wrapped cursor | shared 4-column assumption (`Math.floor(i/4)`/`i%4` in scripts vs `CONFIG.SELECT.COLS` in select.js) | ✓ WIRED | Both sides independently hardcode/derive 4 columns consistently; confirmed via a real headless run reaching all 8 levels (`browser-boot.mjs` → `Browser boot: PASS`) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `addBonusXp` no-level-up + surplus-carry-over semantics | `node -e` one-liner (Plan 25-01's exact verify command) | `PASS 5 1 false 3 2 true` | ✓ PASS |
| Static level validator, all 8 levels | `node scripts/validate-levels.mjs` | `validate-levels: PASS`, zero HARD-FAIL | ✓ PASS |
| Real browser boot across all 8 levels | `node scripts/browser-boot.mjs` | `Browser boot: PASS — title -> select -> all levels loaded with no runtime errors.` | ✓ PASS |
| Interactive mechanic audit, all 8 levels | `node scripts/audit-phase21-mechanics.mjs` | 36/36 `triggered:true`, 0 `triggered:false` (independently re-run, not trusted from FINDINGS.md) | ✓ PASS |
| MATH-01/MATH-02 permanent regression grep gates | `bash scripts/check-progress.sh` | `smoke-progress: PASS` / `progress checks: PASS` | ✓ PASS |
| `check-gate.sh`/`check-safety.sh`/`check-import-safety.sh` | `bash scripts/check-*.sh` | all print PASS | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| LVL-02 | 25-03, 25-06 | 4 new levels (5-8) as pure-data descriptors through the registry | ✓ SATISFIED | Truth 1, artifacts table |
| LVL-03 | 25-03, 25-04 | Gentle difficulty ramp across all 8 levels, incl. mixed-review level | ✓ SATISFIED | Truth 3 |
| LVL-04 | 25-02, 25-05, 25-06 | Level select scales to 2×4 grid, locked/unlocked/cleared preserved, pre-v5.0 resume | ✓ SATISFIED (code+automated); live rendering/feel — ? NEEDS HUMAN | Truth 5 (code+automated); Truth 9 (deferred) |
| LVL-05 | 25-03 | Verticality segments in levels 5-8 | ✓ SATISFIED | Truth 6 |
| LVL-06 | 25-01, 25-03, 25-04, 25-06 | One secret XP alcove per level, reward on find, no punishment on miss | ✓ SATISFIED (mechanism); ? NEEDS HUMAN (7/8 levels' live reachability unverified) | Truth 7 (mechanism); Truth 8 (deferred) |
| MATH-01 | 25-04 | Table 1 removed from all per-level pools | ✓ SATISFIED | Truth 3 |
| MATH-02 | 25-04 | ×10 eliminated, one authorized literal change to LOCKED brain | ✓ SATISFIED | Truth 4 |

No orphaned requirements — all 7 IDs assigned to this phase (LVL-02, LVL-03, LVL-04, LVL-05, LVL-06, MATH-01, MATH-02) appear in at least one plan's `requirements:` frontmatter.

### Anti-Patterns Found

None. Scanned every file touched by this phase's plans (per SUMMARY key-files sections) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`/"coming soon"/"not yet implemented" — zero matches anywhere.

### Code Review Findings (25-REVIEW.md / 25-REVIEW-FIX.md)

6 warnings found, 4 fixed (WR-02 config magic number, WR-03 stale comment, WR-04 stale brain.js docstring, WR-05 progress.js DRY violation) — all re-verified present in the current tree. 2 deliberately left unfixed with documented rationale, not silently dropped:

- **WR-01** (secretAlcove has zero automated reachability/trigger coverage in either verification harness) — confirmed still true by reading `scripts/lib/mechanic-drive.mjs`'s `deriveEncounters()` (only enumerates `doors`/`mathGates`/`enemies`/`collectZones`). Tracked in `.planning/todos/pending/2026-07-07-add-automated-coverage-for-secretalcove-mechanic.md`.
- **WR-06** (secretAlcove placements rest on code review only) — same root cause as WR-01, same pending todo.

This is the direct root cause of Behavior-Unverified Truth #8 above — the gap is real, but honestly disclosed and tracked, not concealed.

### Human Verification Required

1. **Secret alcove walkthrough — levels 02 through 08** (level-01 already confirmed)
   **Test:** Serve the game over HTTP (`python3 -m http.server 8000` from repo root, `?debug=1` optional to see the invisible markers, re-confirm in a normal tab), enter each level, navigate to its `geometry.secretAlcove` coordinate, and touch it.
   **Expected:** HUD XP increments by exactly 5 on first touch; player never freezes; no challenge UI opens; a second touch does nothing further; the level still clears normally if the alcove is skipped.
   **Why human:** `secretAlcove` is intentionally excluded from both `mechanic-drive.mjs`'s `deriveEncounters()` and `validate-levels.mjs`'s reachability model (confirmed by direct code read) — no automated harness can currently substitute.

2. **2×4 select-grid navigation feel + tile-state rendering**
   **Test:** Unlock all 8 tiles via the documented localStorage seed, then exercise Left/Right (row-scoped wrap) and Up/Down (non-wrapping row-jump, same-or-nearest-column landing) live in a browser; visually confirm locked (grey)/unlocked (green)/cleared (blue) tile coloring across all 8 tiles.
   **Expected:** Matches CONTEXT.md's locked wrap semantics exactly; tile states are visually distinguishable.
   **Why human:** This is a rendering/feel claim that code review and headless scripted key-presses (which never exercise edge-wrap or eyeball colors) cannot fully substitute for. Explicitly deferred by the human when closing the Phase 25 checkpoint.

### Gaps Summary

No blocking gaps. All roadmap Success Criteria and PLAN-declared must-haves that can be verified through code, unit tests, or automated harnesses are VERIFIED — independently re-run, not taken on SUMMARY.md's word (the interactive audit and browser-boot were re-executed fresh during this verification and reproduced the claimed 36/36 `triggered:true` result and the full-8-level boot).

Two items remain behavior-unverified by design of this repo's own tooling (not a defect introduced by this phase): the secret-alcove mechanic's live reachability/reward behavior for 7 of 8 levels, and the select-grid's live navigation feel/tile-state rendering. Both are the exact two things Plan 25-07 itself flagged as "the two things automation deliberately cannot check," and both were closed via an explicit, human-authorized reduced-scope approval (documented in `25-FINDINGS.md` section (d) and `25-07-SUMMARY.md`'s `D4`/`human_judgment: true` coverage entry) — not a concealed failure. The underlying code-level implementation for all 8 alcoves is byte-consistent with the one alcove that WAS human-verified (same `build.js`/`secretAlcove.js` wiring path, only the per-level `{x,y}` coordinate differs), and the automated audit's 36/36 `triggered:true` result independently proves every level (including all 8 alcove-bearing levels) is fully traversable start-to-goal — but "traversable" is not the same claim as "the alcove itself is findable and rewards correctly," which is exactly what remains unverified.

Both gaps are already tracked as pending todos (`2026-07-07-add-automated-coverage-for-secretalcove-mechanic.md`, `2026-07-07-reconsider-secret-alcove-mechanic-discoverability-and-value.md`) rather than silently dropped, and Phase 26 does not depend on either being closed first.

**Separately noted (not a phase-goal gap, a documentation-currency issue):** `.planning/STATE.md` still reads `status: executing` / "BLOCKED on Task 2 human-verify checkpoint" as of its last edit (commit `1114407`), even though Task 2 was closed in commit `87857b3` and the code review + review-fix + todo-capture commits landed afterward. `.planning/ROADMAP.md`'s Phase 25 plan checklist also still shows `25-07-PLAN.md` unchecked and "Plans: 6/7 plans executed." This is stale planning metadata, not a code defect — recommend syncing STATE.md/ROADMAP.md to reflect Phase 25's actual completed-with-human_needed status before proceeding to Phase 26.

---

_Verified: 2026-07-07T16:22:04Z_
_Verifier: Claude (gsd-verifier)_
