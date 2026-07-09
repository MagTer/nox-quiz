---
phase: 27-audio-adhd-safe-sound
plan: 05
subsystem: audio
tags: [kaplay, web-audio, scenes, mute-ui, autoplay-gesture-gate]

# Dependency graph
requires:
  - phase: 27-audio-adhd-safe-sound (plan 01)
    provides: "assets/music/ambient.ogg + assets/sfx/*.ogg (vendored, license-proved)"
  - phase: 27-audio-adhd-safe-sound (plan 02)
    provides: "src/audio.js — the ONE audio seam: ensureMusicPlaying(), toggleMute(), isMuted(), playSfx(name, vol), wireAudioUI()"
provides:
  - "title.js: audio.ensureMusicPlaying() as start()'s literal first statement, audio.wireAudioUI() mounted in the scene body"
  - "select.js: audio.wireAudioUI() + belt-and-braces audio.ensureMusicPlaying() near the top of selectScene()"
  - "game.js: audio.wireAudioUI() + belt-and-braces audio.ensureMusicPlaying() near the top of gameScene()"
affects: [27-06, 27-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-scene fresh re-registration of app-bus controllers (wireAudioUI()'s M-key) mirrors the project's existing escape (game.js)/nav-key (select.js) re-registration convention — go() clears the entire app-wide input bus on every scene transition"
    - "Synchronous-gesture-call-stack discipline: ensureMusicPlaying() is the literal first statement of title.js's start(), never deferred via .then()/tween-callback, to satisfy browser autoplay policy"

key-files:
  created: []
  modified: [src/scenes/title.js, src/scenes/select.js, src/scenes/game.js]

key-decisions:
  - "start's arrow function body was converted from a single expression (`() => go(\"select\")`) to a two-statement block (`ensureMusicPlaying(); go(\"select\");`) rather than any deferred/async form — the whole synchronous call chain back to the onKeyPress/onClick event must be preserved for AudioContext.resume() to succeed under browser autoplay policy"
  - "wireAudioUI() placement mirrors each scene's existing 'bare call near the top of the factory body' idiom exactly (title.js: alongside the T constant destructure; select.js/game.js: right after their first per-scene setup statement) — no new architectural pattern introduced"

requirements-completed: [AUD-02, AUD-03]

coverage:
  - id: D1
    description: "title.js's start() calls audio.ensureMusicPlaying() as its literal first synchronous statement, before go(\"select\"); audio.wireAudioUI() mounted once in the scene body"
    requirement: "AUD-02"
    verification:
      - kind: unit
        ref: "node --check src/scenes/title.js && grep ensureMusicPlaying/wireAudioUI && bash scripts/check-import-safety.sh (27-05-PLAN.md Task 1 verify command)"
        status: pass
    human_judgment: false
  - id: D2
    description: "select.js and game.js both call audio.wireAudioUI() fresh in their own scene body (re-registering the M-key + mute icon on every entry, since go() clears the app-wide input bus) and both belt-and-braces re-assert audio.ensureMusicPlaying()"
    requirement: "AUD-03"
    verification:
      - kind: unit
        ref: "node --check src/scenes/select.js src/scenes/game.js && grep wireAudioUI/ensureMusicPlaying in both && bash scripts/check-import-safety.sh (select.js) / bash scripts/check-safety.sh (game.js) (27-05-PLAN.md Task 2/3 verify commands)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Full project verification gate suite remains green after this plan's wiring lands (check-safety.sh, check-import-safety.sh, check-gate.sh, check-progress.sh, check-audio.sh)"
    requirement: "AUD-02, AUD-03"
    verification:
      - kind: unit
        ref: "bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-gate.sh && bash scripts/check-progress.sh && bash scripts/check-audio.sh — all PASS"
        status: pass
    human_judgment: false
  - id: D4
    description: "Interactive/audible proof of AUD-02 (music starts only after first title-screen gesture, never before) and AUD-03 (M toggles mute anywhere, persists across scenes) in a real browser"
    requirement: "AUD-02, AUD-03"
    verification:
      - kind: manual_procedural
        ref: "No browser-driven audio proof exists yet for this plan — 27-06/27-07 (or the phase's closing verification plan) own the real-browser interactive audio confirmation per this project's binding 'checks that don't play the game lie' standard"
        status: unknown
    human_judgment: true
    rationale: "This plan is code-wiring only (three scene-body call sites). All static/syntactic verification (node --check, the 5 shell gates) is green, but an actual browser session hearing the music start on gesture and confirming the M key mutes/unmutes across title→select→game is out of this plan's own <verification> scope (which only specifies node --check + shell gates + grep) — deferred to whichever later 27-0X plan owns the phase's interactive/human sign-off."

duration: ~1min
completed: 2026-07-08
status: complete
---

# Phase 27 Plan 05: Wire Gesture-Gated Music Start + Mute UI Summary

**Wired `src/audio.js`'s public API into all three scenes: `title.js`'s existing dual-input start handler now calls `ensureMusicPlaying()` as its literal first synchronous statement before `go("select")`, and all three scenes (title/select/game) call `wireAudioUI()` fresh in their own scene body so the M-key mute toggle and its icon survive every `go()` scene transition.**

## Performance

- **Duration:** ~1 min (task commits span 07:42:22Z → 07:42:54Z)
- **Started:** 2026-07-08T07:42:22+02:00
- **Completed:** 2026-07-08T07:42:54+02:00
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- `src/scenes/title.js`: `start` converted from a single-expression arrow (`() => go("select")`) to a two-statement block whose first line is `audio.ensureMusicPlaying()`, preserving the synchronous call chain back to the `onKeyPress("enter"|"space", start)`/`onClick(start)` event handlers required by browser autoplay policy; `audio.wireAudioUI()` mounted once in the scene body (alongside the `T` constant destructure) so the mute icon/M-key are live from the very first boot, before the player has pressed start
- `src/scenes/select.js`: `audio.wireAudioUI()` + belt-and-braces `audio.ensureMusicPlaying()` added near the top of `selectScene()`, mirroring the scene's own existing per-entry nav-key re-registration pattern
- `src/scenes/game.js`: `audio.wireAudioUI()` + belt-and-braces `audio.ensureMusicPlaying()` added near the top of `gameScene()`, right after `setGravity(CONFIG.GRAVITY)` and before any run-state declarations — runs on every level entry/re-entry, not just once
- Full verification suite (`check-safety.sh`, `check-import-safety.sh`, `check-gate.sh`, `check-progress.sh`, `check-audio.sh`) confirmed green after all 3 tasks

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire music start + mute UI in title.js** - `620bde3` (feat)
2. **Task 2: Wire mute UI in select.js** - `f8d0346` (feat)
3. **Task 3: Wire mute UI in game.js** - `7ad940b` (feat)

## Files Created/Modified

- `src/scenes/title.js` - `import * as audio from "../audio.js"`; `start`'s body now calls `audio.ensureMusicPlaying()` before `go("select")`; `audio.wireAudioUI()` called once in the scene body
- `src/scenes/select.js` - `import * as audio from "../audio.js"`; `audio.wireAudioUI()` + `audio.ensureMusicPlaying()` called near the top of `selectScene()`
- `src/scenes/game.js` - `import * as audio from "../audio.js"`; `audio.wireAudioUI()` + `audio.ensureMusicPlaying()` called near the top of `gameScene()`

## Decisions Made

- `start`'s body was converted from a single-expression arrow to a two-statement block rather than any deferred form (`.then()`, tween callback) — per 27-RESEARCH.md's Anti-Patterns section, the whole call chain back to the original click/keypress event must stay synchronous for `AudioContext.resume()` to succeed under browser autoplay policy; this ordering is load-bearing and was followed exactly as the plan specified
- `wireAudioUI()`'s call-site placement in each scene mirrors that scene's own existing "bare call near the top of the factory body" convention (title.js's `onKeyPress("r", openResetConfirm)`, select.js's nav-key registrations, game.js's `onKeyPress("escape", ...)`) — no new architectural pattern was introduced, this plan is pure wiring

## Deviations from Plan

None — plan executed exactly as written. All 3 tasks' acceptance criteria and verify commands passed on the first attempt; no auto-fixes, no blocking issues, no architectural questions needed.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All three scenes now call `audio.ensureMusicPlaying()` and `audio.wireAudioUI()` at the correct call sites per the plan's must-haves; the audio system is fully wired end-to-end at the code level
- Outstanding (not this plan's scope, per its own `<verification>` section which specifies only `node --check` + shell gates + grep): a real-browser interactive/audible confirmation that music actually starts on the first title-screen gesture (not before) and that M toggles mute correctly across all three scenes with the icon updating in place — this is deferred to a later plan in this phase (27-06/27-07) or the phase's closing verification step, consistent with this project's "checks that don't play the game lie" standard (no phase closes on greps/automation alone)
- No blockers for subsequent plans in this phase

## Self-Check: PASSED

- FOUND: src/scenes/title.js (audio import, ensureMusicPlaying, wireAudioUI all confirmed via grep)
- FOUND: src/scenes/select.js (audio import, wireAudioUI, ensureMusicPlaying all confirmed via grep)
- FOUND: src/scenes/game.js (audio import, wireAudioUI, ensureMusicPlaying all confirmed via grep)
- FOUND commit 620bde3 (git log --oneline)
- FOUND commit f8d0346 (git log --oneline)
- FOUND commit 7ad940b (git log --oneline)

---
*Phase: 27-audio-adhd-safe-sound*
*Completed: 2026-07-08*
