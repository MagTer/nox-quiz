---
phase: 27-audio-adhd-safe-sound
plan: 02
subsystem: audio
tags: [kaplay, web-audio, localStorage, audio-seam]

# Dependency graph
requires:
  - phase: 27-audio-adhd-safe-sound (plan 01, if any earlier audio-asset plan exists)
    provides: n/a — this plan has no depends_on (wave 1, standalone)
provides:
  - "src/audio.js — the ONE audio seam: ensureMusicPlaying(), toggleMute(), isMuted(), playSfx(name, vol), wireAudioUI()"
  - "CONFIG.AUDIO tunables block in src/config.js"
  - "scripts/check-import-safety.sh extended to scope + police src/audio.js"
affects: [27-03, 27-04, 27-05, "any future plan wiring SFX/music at a mechanic seam"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-level singleton state as the ONE sanctioned exception to closure-local run state (musicHandle/muted), mirroring game.js's onHide precedent"
    - "Guarded localStorage seam (storageAvailable/try-catch/never-throw) mirrored verbatim from src/progress.js, using its own key"
    - "Single master-gain mute (setVolume) instead of per-instance SFX/music tracking"

key-files:
  created: [src/audio.js]
  modified: [src/config.js, scripts/check-import-safety.sh]

key-decisions:
  - "musicHandle.volume set as a property assignment AFTER play() returns, not inside the options object — the music-path internal helper only reads loop/paused from opts (27-RESEARCH.md Pitfall 1)"
  - "applyMuteState() added as an internal helper and called first inside wireAudioUI() so a page reload with a persisted muted=true flag actually silences audio, not just labels the icon MUTE"
  - "wireAudioUI()'s mute icon carries no scene-teardown tag — Kaplay's go() auto-destroys the entire prior scene's object tree, so an explicit tag is unnecessary for this fixed()-overlay object (confirmed: no destroyAll('hud') call exists anywhere in the codebase)"

patterns-established:
  - "Any future Kaplay engine primitive audio.js gains must be added to check-import-safety.sh's ENGINE_GLOBALS alternation, or the a727c13 negative-scan trap silently stops policing it"

requirements-completed: [AUD-02, AUD-03, AUD-04]

coverage:
  - id: D1
    description: "CONFIG.AUDIO tunables block added to src/config.js with all 7 required fields (MUSIC_VOLUME, SFX_VOLUME, MUTE_KEY, MUTE_STORAGE_KEY, ICON_SIZE, ICON_X, ICON_Y); MUTE_STORAGE_KEY distinct from CONFIG.SAVE.KEY"
    requirement: "AUD-03"
    verification:
      - kind: unit
        ref: "node --check src/config.js && grep MUTE_STORAGE_KEY/MUTE_KEY (27-02-PLAN.md Task 1 verify command)"
        status: pass
    human_judgment: false
  - id: D2
    description: "src/audio.js created: ensureMusicPlaying() (idempotent music singleton), toggleMute()/isMuted() (single master-gain mute + own guarded localStorage seam), playSfx(name, vol), wireAudioUI() (per-scene mute-state sync + M-key + icon)"
    requirement: "AUD-02"
    verification:
      - kind: unit
        ref: "node --check src/audio.js && grep -q 'export function ensureMusicPlaying/toggleMute/isMuted/playSfx/wireAudioUI' (27-02-PLAN.md Task 2 verify command)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Mute state actually mutes both music and SFX simultaneously on mount (not just at toggle time) — applyMuteState() called as wireAudioUI()'s first statement, re-applying the persisted flag to the real master gain every scene mount"
    requirement: "AUD-03"
    verification:
      - kind: manual_procedural
        ref: "Code inspection: wireAudioUI() calls applyMuteState() before add()/onKeyPress(); no automated browser test exists yet for this plan (wiring plans 27-03..05 add the call sites; a fresh multi-scene interactive proof is out of this plan's scope per its own <verification> section)"
        status: unknown
    human_judgment: true
    rationale: "This plan builds the audio.js seam in isolation — no scene yet calls wireAudioUI() or ensureMusicPlaying() (that's 27-03/27-04/27-05's job). The mute-persistence-across-reload behavior and no-stacking-music behavior are real product requirements (AUD-03/AUD-04) but can only be interactively proven once a scene actually wires this module in; this plan's own <verification> section explicitly defers the full green suite to after Wave 2's wiring plans land."
  - id: D4
    description: "scripts/check-import-safety.sh extended to scope and police src/audio.js (Section 0 existence/syntax loop, Section 2 negative a727c13 scan) and ENGINE_GLOBALS vocabulary extended with loadMusic/setVolume/getVolume"
    requirement: "AUD-04"
    verification:
      - kind: unit
        ref: "bash scripts/check-import-safety.sh (full gate run, including the two-sided RED/GREEN calibration self-test)"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-07-08
status: complete
---

# Phase 27 Plan 02: Audio Seam Foundation Summary

**Built `src/audio.js` — Kaplay's `loadSound`/`loadMusic`/`play`/`setVolume` audio API wrapped in an idempotent music singleton, a single master-gain mute toggle with its own guarded localStorage seam, and a per-scene mute-UI mount helper — plus the `CONFIG.AUDIO` tunables block and an extended a727c13 import-safety gate that now polices it.**

## Performance

- **Duration:** ~2 min (task commits span 07:29:09Z → 07:30:46Z)
- **Started:** 2026-07-08T07:29:09+02:00
- **Completed:** 2026-07-08T07:30:46+02:00
- **Tasks:** 3
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- `CONFIG.AUDIO` block added to `src/config.js` with all 7 required tunables; `MUTE_STORAGE_KEY` ("noxrun_mute_v1") confirmed distinct from `CONFIG.SAVE.KEY` ("noxrun_platformer_v1")
- `src/audio.js` created as the ONE audio seam every future wiring plan will import: `ensureMusicPlaying()` (module-level idempotency guard prevents music-stacking), `toggleMute()`/`isMuted()` (single `setVolume()` master-gain call silences/restores both music and SFX), `playSfx(name, vol)`, `wireAudioUI()` (per-scene mount: re-syncs actual audio output to the persisted mute flag via a new `applyMuteState()` helper, registers the `M` key, mounts/refreshes a mute-state icon)
- `scripts/check-import-safety.sh` extended: `src/audio.js` added to both the existence/syntax loop and the negative a727c13 scan loop; `ENGINE_GLOBALS` vocabulary extended with `loadMusic`, `setVolume`, `getVolume` so a future top-level regression using those primitives cannot silently pass
- Full `bash scripts/check-import-safety.sh` gate (including its two-sided RED/GREEN calibration self-test) passes green after all 3 tasks

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CONFIG.AUDIO to src/config.js** - `2fe901a` (feat)
2. **Task 2: Create src/audio.js — the one audio seam** - `3dfe8f4` (feat)
3. **Task 3: Extend scripts/check-import-safety.sh to scope src/audio.js** - `fb00486` (chore)

**Plan metadata:** (this commit, see below)

## Files Created/Modified
- `src/config.js` - Added `CONFIG.AUDIO` block (MUSIC_VOLUME, SFX_VOLUME, MUTE_KEY, MUTE_STORAGE_KEY, ICON_SIZE, ICON_X, ICON_Y)
- `src/audio.js` (new) - The one audio seam: guarded mute-flag storage seam, idempotent music singleton, single master-gain mute, playSfx, wireAudioUI
- `scripts/check-import-safety.sh` - Extended Section 0/Section 2 file lists + ENGINE_GLOBALS vocabulary to scope and police src/audio.js

## Decisions Made
- `musicHandle.volume` is set as a property assignment on the handle `play()` returns, AFTER creation — never inside the `play()` options object, per 27-RESEARCH.md Pitfall 1 (the music-path internal helper only reads `loop`/`paused` from its options object; a `volume` key there is silently ignored)
- Added an internal `applyMuteState()` helper (not explicitly in 27-PATTERNS.md's snippet, but required by the plan's own must-haves) called as the first statement inside `wireAudioUI()`, so a page reload with a previously-persisted `muted=true` flag actually silences the master gain, not just labels the icon "MUTE" — without this, only `toggleMute()` would ever call `setVolume()`, leaving a freshly-loaded page's actual audio output unmuted despite a persisted mute flag
- The mute icon mounted by `wireAudioUI()` carries no explicit scene-teardown tag — confirmed via `grep -n destroyAll` across `src/scenes/*.js` that no `destroyAll("hud")`-style sweep exists anywhere in the codebase; Kaplay's `go()` already destroys the entire prior scene's object tree automatically (game.js's own comment: "tagged scene objects are torn down on replay" refers to same-scene respawn cleanup, not scene-transition), so an untagged `fixed()` overlay object is still torn down correctly on every scene change

## Deviations from Plan

None - plan executed exactly as written. All 3 tasks' acceptance criteria and verify commands passed on the first attempt; no auto-fixes, no blocking issues, no architectural questions needed.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. No assets are loaded/played by this plan (no `loadSound`/`loadMusic` call sites exist yet in `main.js` — that is Wave 2's job per 27-RESEARCH.md's Architecture Patterns diagram).

## Next Phase Readiness

- `src/audio.js`'s public API (`ensureMusicPlaying`, `toggleMute`, `isMuted`, `playSfx`, `wireAudioUI`) is stable and ready for import by Plan 27-03 (SFX/music asset sourcing + `main.js` loads), 27-04, and 27-05 (per-mechanic SFX call sites and per-scene `wireAudioUI()`/`ensureMusicPlaying()` wiring)
- No blockers. Per this plan's own `<verification>` section, `bash scripts/check-import-safety.sh` is expected to be (and is) green in isolation; the full suite (`check-safety.sh`, `browser-boot.mjs`, an actual audible/interactive proof of AUD-02/AUD-03/AUD-04) is meaningfully green only once Wave 2's wiring plans exist and asset files are vendored — this is expected, not a gap in this plan
- Concern carried forward (not a blocker): the human sound sign-off checkpoint (AUD-04) and the multi-scene "no music stacking" interactive proof both remain outstanding until a later plan in this phase wires `ensureMusicPlaying()`/`wireAudioUI()` into an actual scene and vendors the `ambient`/SFX asset names this module's `play()` calls reference by string literal

## Self-Check: PASSED

- FOUND: src/audio.js
- FOUND: CONFIG.AUDIO block in src/config.js (grep confirmed)
- FOUND: scripts/check-import-safety.sh extended (grep confirmed: src/audio.js, loadMusic, setVolume, getVolume all present)
- FOUND commit 2fe901a (git log --oneline --all)
- FOUND commit 3dfe8f4 (git log --oneline --all)
- FOUND commit fb00486 (git log --oneline --all)

---
*Phase: 27-audio-adhd-safe-sound*
*Completed: 2026-07-08*
