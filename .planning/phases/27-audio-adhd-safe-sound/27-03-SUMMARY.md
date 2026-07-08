---
phase: 27-audio-adhd-safe-sound
plan: 03
subsystem: audio
tags: [kaplay, web-audio, sfx-wiring, audio-seam]

# Dependency graph
requires:
  - phase: 27-audio-adhd-safe-sound (plan 01)
    provides: "7 CC0 SFX + 1 ambient music .ogg files under assets/sfx/ and assets/music/"
  - phase: 27-audio-adhd-safe-sound (plan 02)
    provides: "src/audio.js — the ONE audio seam: ensureMusicPlaying(), toggleMute(), isMuted(), playSfx(name, vol), wireAudioUI()"
provides:
  - "src/main.js: all 8 audio assets registered via loadSound()/loadMusic() before any go() call"
  - "src/player.js: audio.playSfx(\"jump\") on press, audio.playSfx(\"land\") on player.onGround()"
  - "src/ui/challenge.js: audio.playSfx(\"correct\")/audio.playSfx(\"wrong\") at the ONE shared choose() seam every mechanic (door/gates/mathGate/collect) routes through"
affects: [27-04, 27-05, "any future plan wiring mechanic-specific SFX layered on top of this seam"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "loadSound()/loadMusic() registered alongside loadSprite() in main.js, same '../assets/...' path convention, same before-any-go() ordering discipline"
    - "SFX calls placed at existing game-feel hook points (onKeyPress press edge, onGround callback) rather than deferred to physics resolution, matching CONTEXT.md's immediate-feedback decision"

key-files:
  created: []
  modified: [src/main.js, src/player.js, src/ui/challenge.js]

key-decisions:
  - "audio.playSfx(\"jump\") is called on KEY PRESS (inside onKeyPress, after the player.paused guard), not inside onUpdate's physics jump — immediate feedback on press, matching plan/CONTEXT.md intent, and never fires while the run is frozen (e.g. mid-challenge)"
  - "audio.playSfx(\"correct\")/audio.playSfx(\"wrong\") live exclusively inside src/ui/challenge.js's choose() function — confirmed via grep that this is the ONLY call site for either SFX anywhere under src/, so door.js/gates.js/mathGate.js/collect.js all get correct/wrong audio for free without any per-mechanic duplication"

requirements-completed: [AUD-01, AUD-02]

coverage:
  - id: D1
    description: "main.js registers exactly 7 loadSound() calls (jump/land/correct/wrong/door/clear/pickup) and 1 loadMusic() call (ambient), all before the scene() registration block and go(\"title\")"
    requirement: "AUD-02"
    verification:
      - kind: unit
        ref: "node --check src/main.js && grep -q loadSound(\"<name>\") for all 7 names && grep -q loadMusic(\"ambient\") (27-03-PLAN.md Task 1 verify command)"
        status: pass
    human_judgment: false
  - id: D2
    description: "player.js plays 'jump' on the JUMP_KEYS press handler (after the paused guard) and 'land' inside the existing onGround() juice callback"
    requirement: "AUD-01"
    verification:
      - kind: unit
        ref: "node --check src/player.js && grep -q 'import * as audio' && grep -q playSfx(\"jump\") && grep -q playSfx(\"land\") (27-03-PLAN.md Task 2 verify command); bash scripts/check-safety.sh && bash scripts/check-import-safety.sh both pass"
        status: pass
    human_judgment: false
  - id: D3
    description: "challenge.js's choose() plays 'wrong' on every incorrect pick (before the box-recolor line) and 'correct' after cleared=true/before close() — the single shared resolution point for every mechanic that opens a challenge"
    requirement: "AUD-01"
    verification:
      - kind: unit
        ref: "node --check src/ui/challenge.js && grep confirms exactly 1 file under src/ contains playSfx(\"correct\") and exactly 1 file contains playSfx(\"wrong\") (27-03-PLAN.md Task 3 verify command)"
        status: pass
    human_judgment: true
    rationale: "Automated checks confirm the call sites exist at the right place in the code and that no mechanic file duplicates the seam. Whether the SFX are actually audible, correctly distinct, and non-startling in the running browser (the ADHD-safe 'wrong is never a buzzer' requirement) is not exercised by this plan's own <verification> section — that interactive proof is explicitly out of scope here and belongs to a later wiring/verification plan once ensureMusicPlaying()/wireAudioUI() are also mounted into scenes (27-04/27-05)."

duration: 43s
completed: 2026-07-08
status: complete
---

# Phase 27 Plan 03: Wire Boot-Time Audio Registration + Jump/Land/Correct/Wrong SFX Summary

**Registered all 7 SFX + the ambient music track in `main.js`'s boot sequence, then wired `player.js`'s jump/land feel and `challenge.js`'s single shared correct/wrong resolution seam — the two highest-traffic, highest-confidence SFX call sites in the game, with correct/wrong covering every mechanic (door/gates/mathGate/collect) for free via the one shared `choose()` function.**

## Performance

- **Duration:** ~43s (task commits span 2026-07-08T07:41:34+02:00 -> 07:42:17+02:00)
- **Started:** 2026-07-08T07:41:34+02:00
- **Completed:** 2026-07-08T07:42:17+02:00
- **Tasks:** 3
- **Files modified:** 3 (main.js, player.js, challenge.js — no new files)

## Accomplishments

- `src/main.js`: added `loadSound("jump"|"land"|"correct"|"wrong"|"door"|"clear"|"pickup", "../assets/sfx/....ogg")` (7 calls) and `loadMusic("ambient", "../assets/music/ambient.ogg")` (1 call), placed after the door/enemy sprite loads and before the scene registration block — mirrors the existing `loadSprite()` path convention and before-any-`go()` ordering exactly
- `src/player.js`: imported `audio.js` as a sibling module (alongside the existing `fx.js` import); `audio.playSfx("jump")` fires on the `JUMP_KEYS` press handler immediately after the existing `player.paused` guard (so a jump press mid-challenge never plays a phantom jump sound); `audio.playSfx("land")` fires inside the existing `player.onGround()` juice callback alongside `fx.squash`/`fx.dust`
- `src/ui/challenge.js`: imported `audio.js`; `audio.playSfx("wrong")` fires as the first statement inside the `if (!correct)` branch of `choose(i)`, before the box recolor; `audio.playSfx("correct")` fires after `cleared = true` and before `close()`. Confirmed via `grep -rl` that these are the ONLY call sites for either SFX name anywhere under `src/` — no mechanic file (door.js/gates.js/mathGate.js/collect.js) duplicates this seam, since all of them resolve through `openChallenge()` -> `choose()`
- Full regression suite still green after all 3 tasks: `node --check` on all 3 modified files, `bash scripts/check-safety.sh`, `bash scripts/check-import-safety.sh`

## Task Commits

Each task was committed atomically:

1. **Task 1: Register all audio assets in main.js** - `69b8322` (feat)
2. **Task 2: Wire jump + land SFX in player.js** - `47f9e8a` (feat)
3. **Task 3: Wire correct/wrong SFX at the shared challenge seam** - `c867f12` (feat)

**Plan metadata:** (this commit, see below)

## Files Created/Modified

- `src/main.js` - Added 7 `loadSound()` calls + 1 `loadMusic()` call, registered before any `go()` call
- `src/player.js` - Added `audio.js` import; `audio.playSfx("jump")` in the press handler (after the paused guard); `audio.playSfx("land")` in the existing `onGround()` callback
- `src/ui/challenge.js` - Added `audio.js` import; `audio.playSfx("wrong")` in the incorrect-answer branch; `audio.playSfx("correct")` after the success latch is set, before teardown

## Decisions Made

- `jump` SFX plays on key PRESS (inside `onKeyPress`, after the `player.paused` guard), not deferred to the actual physics jump consumed inside `onUpdate` — matches the plan's explicit "immediate feedback" instruction and CONTEXT.md's decision, and correctly never fires while the run is frozen mid-challenge since the same guard that skips buffering the jump also skips the SFX
- `correct`/`wrong` SFX live exclusively in `challenge.js`'s `choose()` — verified this is the single seam, so Plan 27-04's mechanic-specific "unlock"/"celebrate" sounds (layered separately in each mechanic's own `onSuccess` callback) will never produce a duplicate correct/wrong call

## Deviations from Plan

None - plan executed exactly as written. All 3 tasks' acceptance criteria and verify commands passed on the first attempt; no auto-fixes, no blocking issues, no architectural questions needed.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `main.js` now registers all 8 audio assets at boot; `player.js` and `challenge.js` are the first two live consumers of `src/audio.js`'s `playSfx()` API, proving the seam works end-to-end at the code level
- No blockers. Per this plan's own `<verification>` section, the full interactive/audible proof (does "wrong" actually sound soft/neutral in a running browser, does music/SFX audibly play without stacking) is explicitly deferred — that belongs to Plan 27-04 (mechanic-specific SFX: door/clear/pickup) and 27-05 (per-scene `ensureMusicPlaying()`/`wireAudioUI()` mounting + the gesture-gated music start), after which a full interactive proof becomes possible
- Concern carried forward (not a blocker): AUD-02's "ambient track registered, not yet played" half is now literally true (this plan only calls `loadMusic`, never `ensureMusicPlaying`) — Plan 27-05 is where the gesture-gated `ensureMusicPlaying()` call site is added

## Self-Check: PASSED

- FOUND: src/main.js contains all 7 loadSound() calls + loadMusic("ambient") (grep confirmed)
- FOUND: src/player.js imports audio.js, calls playSfx("jump") and playSfx("land") (grep confirmed)
- FOUND: src/ui/challenge.js imports audio.js, calls playSfx("wrong") and playSfx("correct"); confirmed single-file seam via grep -rl count
- FOUND commit 69b8322 (git log --oneline --all)
- FOUND commit 47f9e8a (git log --oneline --all)
- FOUND commit c867f12 (git log --oneline --all)
- bash scripts/check-safety.sh: PASS
- bash scripts/check-import-safety.sh: PASS

---
*Phase: 27-audio-adhd-safe-sound*
*Completed: 2026-07-08*
