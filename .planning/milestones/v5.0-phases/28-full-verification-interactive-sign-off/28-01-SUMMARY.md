---
phase: 28-full-verification-interactive-sign-off
plan: 01
subsystem: testing
tags: [playwright, kaplay, audio, localstorage, verification, browser-boot]

# Dependency graph
requires:
  - phase: 27-audio-adhd-safe-sound
    provides: CONFIG.AUDIO, ensureMusicPlaying() gesture-gate, mute persistence (noxrun_mute_v1), the existing assertAudioElementCount <=1 ceiling check in browser-boot.mjs
  - phase: 26-grunge-palette-nox-run-rebrand
    provides: the renamed save key (noxrun_platformer_v1, CONFIG.SAVE.KEY), the explicit no-migration decision this plan's save-resume proof targets instead of the stale pre-rebrand clause
  - phase: 25-levels-5-8-difficulty-ramp-select-grid
    provides: the 8-level LEVEL_ORDER registry and 2x4 row-scoped select-grid cursor semantics this plan's Proof B navigation depends on
provides:
  - "scripts/browser-boot.mjs extended with an AudioContext-state gesture-gate proof (assertAudioContextState): suspended before any gesture, running immediately after the title screen's first Space press"
  - "scripts/browser-boot.mjs extended with a standalone runSaveResumeAcrossReloadProof: isolated browser context, partial-unlock save under CONFIG.SAVE.KEY, byte-for-byte pre/post page.reload() localStorage comparison, and a genuine gameplay-reachability check into the resumed-unlock-only level-03 via the same deriveEncounters/driveToXPlanned helpers the primary drive uses"
  - "A recorded, literal-output-captured green run of the full 8-command consolidated gate suite (check-safety.sh, check-import-safety.sh, check-gate.sh, check-progress.sh, check-audio.sh, check-rebrand.sh, validate-levels.mjs, browser-boot.mjs) in one sequential &&-chained pass"
affects: [28-02, 28-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Isolated-browser-context reload proof: a Playwright script that needs to call page.reload() mid-run opens its OWN browser.newContext()/newPage() pair (never the primary drive's), so the reload can never disturb concurrent state elsewhere in the same script run"
    - "AudioContext.state as the gesture-gate signal for Kaplay 3001.0.19, not DOM <audio> element counting -- this vendored engine's music path creates `new Audio()` objects that are never appended to the document (verified: the only appendChild in the whole bundle is the game canvas), and SFX play via raw AudioBufferSourceNode, so document.querySelectorAll('audio') is provably always 0 regardless of playback state in this specific engine build"

key-files:
  created: []
  modified:
    - scripts/browser-boot.mjs

key-decisions:
  - "Deviation (Rule 1 -- wrong query, not a game bug): the plan's literal spec called for asserting document.querySelectorAll('audio').length exactly 0/1 pre/post gesture. A live Playwright probe plus reading the vendored lib/kaplay.mjs source proved this metric is structurally incapable of ever reading 1 in this engine (music never DOM-attaches; SFX never touch <audio> at all), so the check could never have caught a real regression either direction. Replaced with assertAudioContextState, asserting window.audioCtx.state transitions suspended -> running exactly on the title screen's first gesture -- the actual Web Audio API autoplay-gate mechanism this codebase's own 'Audio gesture gate' cross-cutting mitigation (STATE.md) depends on. Empirically verified via a throwaway diagnostic probe before landing the fix."
  - "RESUME_SAVE_BLOB deliberately clears only level-01 and level-02 (not the primary drive's near-full unlock), so level-03 becoming reachable after the reload is proof the derived-unlock state (isUnlocked -> progress.isLevelCleared) was genuinely carried across page.reload(), not a vacuous check against an already-fully-unlocked save"
  - "Verified select.js's row-scoped moveCursor() semantics (selectable = tiles where state !== 'locked', row-wrapped) before writing the 2x-ArrowRight navigation, confirming the cursor lands on tile index 2 (level-03) given the partial-unlock save -- avoided a blind implementation that could have silently navigated to the wrong tile"
  - "Ran the plan's literal &&-chained 8-command verify string (not just 8 separate invocations) as the final proof, so a short-circuiting failure in any gate would have been unambiguous -- matches ROADMAP criterion 2's 'green in one run' requirement exactly, not an approximation of it"

patterns-established:
  - "When a Playwright proof needs page.reload(), give it its own isolated browser context rather than reusing the primary drive's page -- prevents any cross-contamination between the reload proof and the rest of a multi-stage boot script"

requirements-completed: [VALID-03]

coverage:
  - id: D1
    description: "browser-boot.mjs proves, in the same fresh browser context it already boots, that the AudioContext is genuinely suspended before any title-screen gesture and genuinely running immediately after the first Space press (an exact state transition, not a <=1 ceiling)"
    requirement: "VALID-03"
    verification:
      - kind: e2e
        ref: "node scripts/browser-boot.mjs (real headless-Chromium run via Playwright) -- output: 'Browser boot: PASS — title -> select -> all levels loaded with no runtime errors.' with zero audio-gesture error entries"
        status: pass
    human_judgment: false
  - id: D2
    description: "browser-boot.mjs proves a save written under CONFIG.SAVE.KEY (noxrun_platformer_v1) survives a real page.reload() byte-for-byte, AND that the derived-unlock state it encodes is honored after the reload -- level-03 (unlocked ONLY by the resumed save, never cleared this session) is genuinely enterable post-reload and its first mechanic encounter triggers via driveToXPlanned"
    requirement: "VALID-03"
    verification:
      - kind: e2e
        ref: "node scripts/browser-boot.mjs's runSaveResumeAcrossReloadProof (isolated browser context) -- same PASS run as D1, zero save-resume error entries"
        status: pass
    human_judgment: false
  - id: D3
    description: "The full 8-command consolidated gate suite (check-safety.sh, check-import-safety.sh, check-gate.sh, check-progress.sh, check-audio.sh, check-rebrand.sh, validate-levels.mjs, browser-boot.mjs) exits 0 in one sequential &&-chained run"
    requirement: "VALID-03"
    verification:
      - kind: e2e
        ref: "bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-gate.sh && bash scripts/check-progress.sh && bash scripts/check-audio.sh && bash scripts/check-rebrand.sh && node scripts/validate-levels.mjs && node scripts/browser-boot.mjs && echo \"CONSOLIDATED 8-GATE SUITE GREEN\" -- literal final line printed: CONSOLIDATED 8-GATE SUITE GREEN"
        status: pass
    human_judgment: false

duration: ~45min
completed: 2026-07-09
status: complete
---

# Phase 28 Plan 01: Full-Suite Automated Verification Summary

**Extended `scripts/browser-boot.mjs` with an AudioContext-state gesture-gate proof and an isolated-context save-resume-across-reload proof, then ran the complete 8-command gate suite green in one sequential pass — closing VALID-03's automated half.**

## Performance

- **Duration:** ~45 min
- **Started:** ~2026-07-09T05:20:00Z (estimated — no formal start-time capture this session)
- **Completed:** 2026-07-09T06:02:54Z
- **Tasks:** 2
- **Files modified:** 1 (`scripts/browser-boot.mjs`)

## Accomplishments

- Added `assertAudioContextState(page, errors, stopLabel, expectedState)` to `scripts/browser-boot.mjs`, asserting `window.audioCtx.state` is exactly `"suspended"` immediately after page load (before any interaction or storage seed) and exactly `"running"` immediately after the title screen's first Space press — a genuine, non-vacuous proof of the codebase's audio-gesture-gate mitigation, replacing a plan-specified DOM-audio-element-count check that this specific vendored engine (Kaplay 3001.0.19) can never satisfy.
- Added `runSaveResumeAcrossReloadProof(errors)`, a standalone function using its own isolated `browser.newContext()`/`newPage()` pair, that: seeds a deliberately partial-unlock save (`level-01`/`level-02` cleared only) under `CONFIG.SAVE.KEY`'s current literal value, captures the pre-reload `localStorage` string, calls a real `page.reload()`, asserts the post-reload value is byte-for-byte identical, then navigates the select-grid cursor into the resumed-unlock-only `level-03` tile and asserts its first mechanic encounter triggers via the same `deriveEncounters`/`driveToXPlanned` helpers the primary per-level drive already uses.
- Ran the complete 8-command consolidated gate suite (`check-safety.sh`, `check-import-safety.sh`, `check-gate.sh`, `check-progress.sh`, `check-audio.sh`, `check-rebrand.sh`, `validate-levels.mjs`, `browser-boot.mjs`) as the plan's literal `&&`-chained command, capturing every gate's exact `PASS` echo line, with a final `CONSOLIDATED 8-GATE SUITE GREEN` confirming zero failures anywhere in the chain.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add audio-gesture-gate + save-resume-across-reload proofs to browser-boot.mjs** - `b491c38` (feat)
2. **Task 2: Run the full consolidated 8-command gate suite and confirm green** - verification-only task (`<files>(none -- verification only)</files>` per the plan); no code changes to commit — evidence captured below and in this SUMMARY.

**Plan metadata:** (this commit)

## Files Created/Modified

- `scripts/browser-boot.mjs` - Added `assertAudioContextState` (replacing the plan-specified but structurally-unsatisfiable `document.querySelectorAll('audio')`-based exact-count check) and `runSaveResumeAcrossReloadProof`; wired both into the existing primary boot flow's `errors` array without changing the shape of any pre-existing assertion, mechanic-drive loop, or the final PASS/FAIL reporting block.

## Decisions Made

- **AudioContext.state over DOM audio-element counting** (see key-decisions above for the full technical trace) — the single most significant decision this plan made, since following the plan's literal instruction verbatim would have shipped a permanently-unsatisfiable check masquerading as a real gate, violating the project's "checks that don't play the game lie" standard. Root-caused via a live Playwright probe (`window.audioCtx.state`: `"suspended"` pre-gesture, `"running"` post-gesture, `document.querySelectorAll('audio').length`: `0` both times) plus a direct read of the vendored `lib/kaplay.mjs` source confirming the engine's music/SFX playback paths never attach anything to the DOM.
- **RESUME_SAVE_BLOB's deliberate partial unlock** (only `level-01`/`level-02` cleared) rather than reusing the primary drive's near-full `SAVE_BLOB` — makes the save-resume proof meaningful (level-03 reachable ONLY via the resumed derived-unlock state) instead of vacuous (a save that already unlocks everything proves nothing about resume correctness specifically).
- **Isolated browser context for the reload proof** — `runSaveResumeAcrossReloadProof` opens its own `context`/`page`, never touching the primary drive's, so a mid-script `page.reload()` can never disturb the 8-level mechanic-drive loop's in-progress state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced DOM audio-element-count exact checks with AudioContext.state checks**
- **Found during:** Task 1's first real functional run of the newly-written proofs (`node scripts/browser-boot.mjs`)
- **Issue:** The plan's literal `<action>` text specified asserting `document.querySelectorAll('audio').length` is exactly 0 pre-gesture and exactly 1 post-gesture. The first real run failed with `title->select (post-gesture): expected exactly 1 <audio> element(s), found 0`. Investigation (reading `lib/kaplay.mjs`'s minified source for `new Audio(` and `appendChild`, then an isolated live-page diagnostic probe) proved this is not a game bug: Kaplay 3001.0.19's music playback (`ia()`, backing `play()` for a `loadMusic()`-registered asset) constructs a `new Audio(url)` object but never calls `appendChild`/attaches it to `document` (the ONLY `appendChild` anywhere in the vendored bundle is the game's own `<canvas>`); sound effects play via a raw `AudioBufferSourceNode`, which never touches an `<audio>` element at all. `document.querySelectorAll('audio')` is therefore provably always `0` in this game regardless of playback state — the check as specified could never distinguish a working gesture gate from a broken one.
- **Fix:** Replaced `assertAudioElementCountExact` with `assertAudioContextState(page, errors, stopLabel, expectedState)`, asserting `window.audioCtx.state` (a real Kaplay-exposed global, confirmed via the vendored engine's exported k-object list and a live probe) equals `"suspended"` pre-gesture and `"running"` post-gesture — the actual browser-autoplay-policy signal this codebase's documented "Audio gesture gate" mitigation (STATE.md Cross-Cutting Mitigations #4) relies on.
- **Files modified:** `scripts/browser-boot.mjs`
- **Verification:** Re-ran `node scripts/browser-boot.mjs` twice after the fix (once standalone, once as part of the full consolidated 8-gate `&&` chain) — both clean `Browser boot: PASS` with zero errors, including zero audio-gesture and zero save-resume entries. Every other check written in the same task (mute toggle, all 8 levels' mechanic drives, round-trip leak check, `runSaveResumeAcrossReloadProof`) had already passed cleanly on the very first attempt, confirming the failure was isolated to exactly this one flawed assertion.
- **Committed in:** `b491c38` (folded into Task 1's single commit — the fix landed before the task's first commit, so no separate deviation commit exists)

---

**Total deviations:** 1 auto-fixed (1 bug — wrong verification-code query against the actual engine, not a game defect)
**Impact on plan:** The fix was necessary for the proof to be meaningful at all; without it, Task 1 would have shipped a permanently-red (or, had the plan's pre-gesture-only half been used alone, permanently-vacuous) check under VALID-03's banner, undermining the exact verification-integrity standard this phase exists to uphold. No scope creep — the fix stayed entirely within `scripts/browser-boot.mjs`, the plan's sole `files_modified` target.

## Issues Encountered

None beyond the one deviation documented above, which was investigated and resolved within this plan's own execution (no external blocker, no cross-phase impact).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `scripts/browser-boot.mjs` now carries both automated proofs ROADMAP criterion 3 needs (reinterpreted per `28-CONTEXT.md`'s decision to supersede the stale pre-rebrand save-resume clause), plus the pre-existing mute-toggle and per-level mechanic-drive coverage from Phases 25/27.
- The full 8-command gate suite is green in one consolidated run, satisfying ROADMAP criterion 2 ahead of Plan 28-02's human sign-off checkpoint — mirrors Phase 27's 27-06 → 27-07 sequencing (automated gates green before the human reviews a system that's already fully proven).
- Plan 28-02 (the consolidated human sign-off covering levels + themes + logo + audio, per `28-CONTEXT.md`'s decisions) can now proceed against a system with zero known-red automated gates.
- `28-CONTEXT.md`'s explicit stale-clause supersession note (ROADMAP criterion 3's original "a pre-rebrand save still resumes" text) should be carried into Plan 28-03's `VERIFICATION.md` verbatim: superseded because Phase 26 intentionally renamed the save key with no migration path ever built; verified instead was a FRESH save under the CURRENT key (`noxrun_platformer_v1`) persisting and resuming correctly, which is what this plan delivered.

---
*Phase: 28-full-verification-interactive-sign-off*
*Completed: 2026-07-09*
