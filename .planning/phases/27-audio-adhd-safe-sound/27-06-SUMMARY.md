---
phase: 27-audio-adhd-safe-sound
plan: 06
subsystem: testing
tags: [playwright, kaplay, web-audio, browser-boot, regression-gate]

# Dependency graph
requires:
  - phase: 27-audio-adhd-safe-sound (plan 02)
    provides: "src/audio.js — the ONE audio seam: ensureMusicPlaying(), toggleMute(), isMuted(), playSfx(name, vol), wireAudioUI()"
  - phase: 27-audio-adhd-safe-sound (plan 03)
    provides: "vendored SFX/music assets + CONFIG.AUDIO wiring prerequisites for check-audio.sh"
  - phase: 27-audio-adhd-safe-sound (plan 04)
    provides: "per-mechanic SFX call sites"
  - phase: 27-audio-adhd-safe-sound (plan 05)
    provides: "title.js/select.js/game.js call ensureMusicPlaying()/wireAudioUI() at the correct scene call sites"
provides:
  - "scripts/browser-boot.mjs extended with assertAudioElementCount() — asserts document.querySelectorAll('audio').length <= 1 at 4 real scene-transition stops"
  - "scripts/browser-boot.mjs extended with a functional M-key mute-toggle assertion via getVolume()"
  - "A recorded full-suite green run: check-safety.sh + check-import-safety.sh + check-audio.sh + browser-boot.mjs, all PASS in one sequential run"
affects: ["27-07 (phase-closing human sign-off checkpoint consumes this plan's green-suite evidence)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Audio-specific assertions pushed into the script's existing typed `errors` array (`{ type: \"audio\", message }`), mirroring the pre-existing `{ type: \"mechanic\", ... }` shape — one failed audio check does not abort the rest of the drive, consistent with every other check in this script"

key-files:
  created: []
  modified: [scripts/browser-boot.mjs]

key-decisions:
  - "assertAudioElementCount() helper takes (page, errors, stopLabel) as explicit arguments rather than closing over module-level state — keeps it a pure, reusable function callable from any point in the drive after page/errors exist"
  - "The functional mute-toggle assertion runs exactly once, right after the title->select transition (not repeated at every scene) — proves the M key reaches the master gain end-to-end (audio.js's toggleMute -> setVolume) without duplicating the same functional proof at every stop; the audio-count ceiling check, by contrast, IS repeated at all 4 stops since stacking is a state that can only manifest per-transition"

requirements-completed: [AUD-04]

coverage:
  - id: D1
    description: "scripts/browser-boot.mjs extended with an audio-count helper (assertAudioElementCount) called at all 4 real scene-transition stops (title->select, each level entry, escape-back-to-select, final round-trip re-entry into select) — proves at most one <audio> element exists in the live DOM at every stop, converting AUD-04's 'no stacking/leaking across scenes' claim from a code-review assertion into an automated real-browser proof"
    requirement: "AUD-04"
    verification:
      - kind: e2e
        ref: "node scripts/browser-boot.mjs (full drive title->select->8 levels->select->title->select, all 4 audio-count stops asserting <=1 <audio> element)"
        status: pass
    human_judgment: false
  - id: D2
    description: "scripts/browser-boot.mjs extended with a functional M-key mute-toggle assertion: presses M, confirms getVolume() reaches 0 (master gain actually silenced, not just a UI label change); presses M again, confirms getVolume() returns to 1"
    requirement: "AUD-04"
    verification:
      - kind: e2e
        ref: "node scripts/browser-boot.mjs (mute-toggle assertion block after the title->select transition)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Full phase-closing gate suite (check-safety.sh, check-import-safety.sh, check-audio.sh, browser-boot.mjs) confirmed green in one sequential run — first time check-audio.sh has run to green in the phase, since CONFIG.AUDIO and all wiring plans (27-02..05) have now landed"
    requirement: "AUD-04"
    verification:
      - kind: unit
        ref: "bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-audio.sh && node scripts/browser-boot.mjs && echo \"FULL SUITE GREEN\" — all 4 commands exited 0, FULL SUITE GREEN printed"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-07-08
status: complete
---

# Phase 27 Plan 06: Real-Browser Audio Regression Proof + Full Gate Suite Summary

**Extended `scripts/browser-boot.mjs` with an `assertAudioElementCount()` helper run at all 4 real scene-transition stops plus a functional M-key mute-toggle check via `getVolume()`, then ran the complete phase-closing gate suite (`check-safety.sh` + `check-import-safety.sh` + `check-audio.sh` + `browser-boot.mjs`) green in one sequential pass — the first time `check-audio.sh` has gone green in the phase.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-07-08T07:47:53+02:00
- **Completed:** 2026-07-08T07:50:xx+02:00
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- `assertAudioElementCount(page, errors, stopLabel)` helper added to `scripts/browser-boot.mjs`: evaluates `document.querySelectorAll("audio").length` in the live page and pushes a typed `{ type: "audio", message }` entry into the script's existing `errors` array (never throws directly) if the count exceeds 1
- Called at all 4 real scene-transition stops the plan specified: (1) title->select transition, (2) every level entry (inside the per-level loop, using the live `LEVEL_ORDER` — now covers all 8 shipped levels, not just 4), (3) escape-back-to-select inside the loop, (4) the final Phase-18 round-trip re-entry into select
- A functional M-key mute-toggle assertion added right after the title->select transition: presses `m`, confirms `getVolume() === 0`; presses `m` again, confirms `getVolume() === 1` — proves the key press reaches `audio.js`'s `toggleMute() -> setVolume()` end-to-end, not just that a key handler exists
- Ran the full phase-closing gate suite in sequence — `check-safety.sh`, `check-import-safety.sh`, `check-audio.sh`, `node scripts/browser-boot.mjs` — all 4 exited 0 in one pass, printing `FULL SUITE GREEN`; `check-audio.sh` is green for the first time in Phase 27 (all vendored assets, license proofs, CREDITS.md rows, and the distinct `MUTE_STORAGE_KEY` now exist)
- `browser-boot.mjs`'s existing per-level mechanic-drive logic and final PASS/FAIL reporting block were left unchanged in shape — only new error-producing checks were added

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend browser-boot.mjs with audio-count + mute assertions** - `8a5813d` (feat)
2. **Task 2: Run the full phase-closing gate suite and confirm green** - verification-only, no files modified, no commit (per plan's own `files_modified: []` / `(none — verification only)` spec)

**Plan metadata:** (this commit, see below)

## Files Created/Modified

- `scripts/browser-boot.mjs` - Added `assertAudioElementCount()` helper + call sites at 4 scene-transition stops; added a functional M-key mute-toggle assertion via `getVolume()` after the title->select transition

## Decisions Made

- The mute-toggle functional assertion runs exactly once (after title->select), not once per scene — it proves the mute mechanism's end-to-end reach into the master gain (a single functional path), while the audio-count ceiling is genuinely stop-specific (stacking can only be observed per-transition) and so is repeated at every stop, per the plan's own must-haves
- No changes made to the script's existing mechanic-drive logic, server setup, or final PASS/FAIL reporting shape — new checks purely add entries to the pre-existing `errors` array

## Deviations from Plan

None - plan executed exactly as written. Both tasks' acceptance criteria and verify commands passed on the first attempt; no auto-fixes, no blocking issues, no architectural questions needed.

Note: the live level registry now has 8 levels (Phase 25), not the 4 the plan's own historical inline comments reference (e.g. "Visit every level in order" / "all four levels") — `browser-boot.mjs` already derived its level list from the live `LEVEL_ORDER` import before this plan touched it (a WR-02 fix from an earlier phase), so all 4 new audio-count stops automatically cover all 8 levels with zero extra work; this is a pre-existing property of the script, not a change made in this plan.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `scripts/browser-boot.mjs` now provides the one automated, real-browser proof of AUD-04's "no stacking/leaking across scenes" claim, and a functional (not just structural) proof that the M key reaches the actual master gain — both run on every future invocation of this gate, not just once during this phase
- The complete gate suite (`check-safety.sh`, `check-import-safety.sh`, `check-audio.sh`, `browser-boot.mjs`) is confirmed green in one sequential run — this is the phase's own closing regression sweep and the evidence Plan 27-07's human sign-off checkpoint should consume
- Per this plan's own `<verification>` section: this plan's automated pass does NOT substitute for the human sign-off in Plan 27-07 — that checkpoint still owns the real audible/interactive confirmation of AUD-02/AUD-03 that Plan 27-05's SUMMARY explicitly deferred forward
- No blockers for Plan 27-07

## Self-Check: PASSED

- FOUND: scripts/browser-boot.mjs (audio-count helper + mute-toggle assertion confirmed via grep: `querySelectorAll('audio')`, `getVolume()`, `page.keyboard.press("m")`)
- FOUND commit 8a5813d (git log --oneline --all)

---
*Phase: 27-audio-adhd-safe-sound*
*Completed: 2026-07-08*
