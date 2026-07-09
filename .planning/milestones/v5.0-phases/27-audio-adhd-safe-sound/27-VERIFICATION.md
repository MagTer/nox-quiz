---
phase: 27-audio-adhd-safe-sound
verified: 2026-07-08T23:30:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 27: Audio & ADHD-Safe Sound Verification Report

**Phase Goal:** The game sounds alive — calm ambient music and satisfying SFX she can mute, with a mix designed to never startle.
**Verified:** 2026-07-08T23:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Jump, land[^1], pickup, correct, soft-neutral wrong, door/gate, level-clear each play a distinct CC0 sound, license-proven, wired at shared seams | ✓ VERIFIED | `assets/sfx/{jump,land,correct,wrong,door,clear,pickup}.ogg` all exist, valid Ogg Vorbis, each <0.7s (measured: jump 0.44s, land 0.67s, correct 0.54s, wrong 0.06s, door 0.15s, clear 0.26s, pickup 0.10s). 8 license proofs (`assets/LICENSES/{jump,land,correct,wrong,door-sfx,clear,pickup,ambient}.txt`) each quote a real CC0 declaration from the source pack's own readme, with source URL + verification date. `grep -rn 'playSfx('` confirms exactly one call site each for `"correct"`/`"wrong"` (in `src/ui/challenge.js`'s shared `choose()`), and one each for `"door"` (door.js + gates.js, reused deliberately), `"clear"` (mathGate.js), `"pickup"` (collect.js), `"jump"` (player.js). `door.txt` (pre-existing visual sprite proof) confirmed untouched since Phase 26 via `git log`. |
| 2 | Ambient music loops seamlessly (OGG), starts only after first title-screen press, never before | ✓ VERIFIED | `assets/music/ambient.ogg` exists, valid Ogg Vorbis, 30.8s ("Flowing Rocks", Kenney Music Loops, CC0-proven). `src/scenes/title.js`'s `start()` calls `audio.ensureMusicPlaying()` as its literal first statement (line 120), synchronously before `go("select")` (line 121) — code-inspected, preserves the browser-autoplay-policy-required synchronous gesture call stack. `src/audio.js`'s `ensureMusicPlaying()` uses `loadMusic`/`play` (streaming path), never called at module load or boot (`src/main.js` only calls `loadMusic()`, which only prefetches). |
| 3 | M toggles mute anywhere, persists across reloads in its own localStorage key, progress save untouched | ✓ VERIFIED | `CONFIG.AUDIO.MUTE_STORAGE_KEY = "noxrun_mute_v1"`, confirmed distinct from `CONFIG.SAVE.KEY = "noxrun_platformer_v1"` (both by direct read and by `scripts/check-audio.sh`'s positive+negative grep assertions, which passed). `src/audio.js`'s `loadMuteFlag()`/`writeMuteFlag()` mirror `progress.js`'s guarded try/catch/never-throw seam and never touch `CONFIG.SAVE.KEY`. `wireAudioUI()` is called fresh in all 3 scene bodies (title/select/game — grep-confirmed) and calls `applyMuteState()` first, re-syncing the real master gain to the persisted flag on every mount (this is what makes "persists across reload" actually true, not just UI-labeled). `node scripts/browser-boot.mjs` (re-run this session) functionally proves the M key reaches the real master gain: presses M, asserts `getVolume() === 0`; presses M again, asserts `getVolume() === 1` — both passed with zero errors. Mute icon is discoverable (visible text "SND"/"MUTE" in a HUD corner) and clickable (added at 27-07 human sign-off, `icon.onClick(handleToggle)`), not key-only. |
| 4 | Dying twice or exiting to select never stacks/leaks music — exactly one music handle at all times | ✓ VERIFIED | `src/audio.js`'s `ensureMusicPlaying()` has a module-level idempotency guard (`if (musicHandle) return;`) — code-inspected, correctly placed before the `play()` call. `node scripts/browser-boot.mjs` (re-run this session) drives title→select→8 levels→select→title→select and asserts `document.querySelectorAll('audio').length <= 1` at 4 real scene-transition stops via `assertAudioElementCount()` — ran with zero errors, printed `Browser boot: PASS`. This is genuine real-browser behavioral evidence for a stacking/leak invariant, not presence-only. |
| 5 | Mix is ADHD-safe by design — music clearly below SFX, no buzzers/startle stingers — human sound sign-off recorded | ✓ VERIFIED | `27-07-SUMMARY.md` records a real, multi-round (5 rounds) iterative human listening review, not a rubber stamp: land SFX removed (erratic/stressful during walking), jump SFX re-sourced twice (harsh click → still "a short tap" → purpose-built retro "boing" from a different pack) plus gain-tuned twice (1.0 implicit → 0.45 → 0.2 via new `CONFIG.AUDIO.JUMP_VOLUME`), ambient music re-sourced (19.4s felt repetitive → 30.8s "Flowing Rocks"), mute icon made clickable. Each round's exact human quote is recorded verbatim in the SUMMARY's "Resume-signal record" section, culminating in an explicit, specific final response: **"great.. audio approved."** Per this project's `never-rubber-stamp-checkpoints` precedent and CLAUDE.md's "no phase closes on greps/automation alone" standard, this is real evidence, and per this verification's own task instructions this human sign-off — already conducted this session — is not re-requested. |

**Score:** 5/5 truths verified (0 present-but-behavior-unverified)

[^1]: SC1's roadmap text still names "land" as a played SFX. During the phase-closing human sign-off (27-07), the land SFX was deliberately REMOVED — `player.onGround()`'s callback no longer calls `audio.playSfx("land")` (confirmed via `grep`; only `fx.squash`/`fx.dust` remain). This is a documented, human-requested, intentional scope change recorded in `27-07-SUMMARY.md`'s decisions (it triggered erratically during ordinary walking and read as stressful — an ADHD-safety violation, the opposite of a gap). `assets/sfx/land.ogg` and its license proof still exist (vendored, unused) — not a stub, a deliberately shelved asset. Not counted as a failure per this verification's explicit instructions.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/audio.js` | `ensureMusicPlaying`, `toggleMute`, `isMuted`, `playSfx`, `wireAudioUI` exports; a727c13-clean | ✓ VERIFIED | All 5 functions exported, code-read in full. Every Kaplay engine primitive (`play`, `setVolume`, `add`, `text`, `color`, `area`, `fixed`, `z`, `onKeyPress`) is referenced only inside function bodies. Module-level `musicHandle`/`muted` are plain data, not engine calls — the documented sanctioned exception. |
| `CONFIG.AUDIO` block (`src/config.js`) | MUSIC_VOLUME, SFX_VOLUME, MUTE_KEY, MUTE_STORAGE_KEY, ICON_SIZE, ICON_X, ICON_Y | ✓ VERIFIED | All 7 fields present, plus a later-added `JUMP_VOLUME` (27-07 per-SFX gain override). `MUTE_STORAGE_KEY` distinct from `SAVE.KEY`. |
| `assets/sfx/*.ogg` (7 files) + `assets/music/ambient.ogg` | Valid CC0 OGG Vorbis | ✓ VERIFIED | All 8 files present, confirmed valid Ogg Vorbis via `file`, durations sane (SFX <0.7s, music 30.8s). |
| `assets/LICENSES/*.txt` (8 proofs) + CREDITS.md rows | CC0 declaration quoted, source URL, verification date | ✓ VERIFIED | All 8 present, quality-inspected (jump.txt, ambient.txt read in full — both show real quoted CC0 text from the source pack's own readme + full re-pick history). CREDITS.md has a matching row for every asset filename. |
| `scripts/check-audio.sh` | Structural gate: asset existence, proof existence, CREDITS mentions, mute-key-distinct-from-save-key | ✓ VERIFIED | Read in full — 4 real assertion classes, ran green (`bash scripts/check-audio.sh` → `audio checks: PASS`). |
| `scripts/check-import-safety.sh` extended | `src/audio.js` scoped in both file-existence and negative a727c13 scan; `loadMusic`/`setVolume`/`getVolume` added to `ENGINE_GLOBALS` | ✓ VERIFIED | Confirmed via grep at lines 65/89/132. Ran green. |
| `scripts/browser-boot.mjs` extended | Audio-element-count ceiling at 4 scene-transition stops + functional M-key `getVolume()` proof | ✓ VERIFIED | Read the relevant sections — real `assertAudioElementCount()` helper wired into the script's `errors` array (drives PASS/FAIL), called at 4 real stops; functional mute-toggle check presses M twice and asserts `getVolume()` 0 then 1. Ran this session: `Browser boot: PASS`, zero errors. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/scenes/title.js`'s `start()` | `src/audio.js`'s `ensureMusicPlaying()` | Literal first synchronous statement, before `go("select")` | ✓ WIRED | Code-read at title.js:119-122. |
| All 3 scenes (title/select/game) | `src/audio.js`'s `wireAudioUI()` | Fresh call in every scene body | ✓ WIRED | grep-confirmed in all 3 files; re-registration matches the project's existing per-scene app-bus pattern (escape/nav keys). |
| `src/ui/challenge.js`'s `choose()` | `audio.playSfx("correct"/"wrong")` | The ONE shared resolution seam every mechanic (door/gates/mathGate/collect) routes through | ✓ WIRED | grep confirms exactly 1 file contains each call site — no per-mechanic duplication. |
| `audio.js`'s `toggleMute()`/`applyMuteState()` | `setVolume()` master gain | Single call silences/restores music AND every SFX | ✓ WIRED | Code-read; functionally proven in real browser via `browser-boot.mjs`'s `getVolume()` assertions (0 → 1). |
| `main.js` boot | `loadSound`/`loadMusic` (8 calls) | Before any `go()` call | ✓ WIRED | grep-confirmed all 8 registrations present at main.js:125-132. |

### Behavioral Spot-Checks / Probe Execution

| Check | Command | Result | Status |
|-------|---------|--------|--------|
| Full static safety gate | `bash scripts/check-safety.sh` | `safety checks: PASS` | ✓ PASS |
| a727c13 import-safety gate (audio.js scoped) | `bash scripts/check-import-safety.sh` | `import-safety checks: PASS` | ✓ PASS |
| Audio asset/license/config-key structural gate | `bash scripts/check-audio.sh` | `audio checks: PASS` | ✓ PASS |
| Math-gate/challenge invariants | `bash scripts/check-gate.sh` | `gate checks: PASS` | ✓ PASS |
| Real-browser boot + audio-count (4 stops) + functional mute-toggle (`getVolume()`) | `node scripts/browser-boot.mjs` | `Browser boot: PASS — title -> select -> all levels loaded with no runtime errors.` (zero errors, including 0 audio-count violations and 0 mute-toggle failures) | ✓ PASS |

All 5 commands were re-run live by this verification session (not taken from SUMMARY.md claims) and confirmed green.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUD-01 | 27-01, 27-03, 27-04 | Core SFX set, CC0, wired at shared seams | ✓ SATISFIED | 7 SFX assets + license proofs + all mechanic call sites verified (land SFX intentionally unwired, see footnote 1). |
| AUD-02 | 27-01, 27-02, 27-03, 27-05 | Calm ambient music loop, gesture-gated start | ✓ SATISFIED | ambient.ogg exists, ensureMusicPlaying() synchronous-first-statement confirmed. |
| AUD-03 | 27-02, 27-05, 27-06, 27-07 | M-key mute toggle, own localStorage key, save untouched | ✓ SATISFIED | Own key confirmed distinct; functional getVolume() proof passed; clickable icon added at sign-off. |
| AUD-04 | 27-02, 27-06, 27-07 | ADHD-safe mix, idempotent music manager, human sign-off | ✓ SATISFIED | Idempotency guard + real-browser audio-count proof; genuine multi-round human sign-off with explicit final approval. |

**Note (informational, not a gap):** `.planning/REQUIREMENTS.md`'s AUD-01..04 rows still show unchecked boxes and "Pending" status in its coverage table. Based on this project's pattern (Phase 26's rows read "Complete" only after its own closure), this is bookkeeping typically updated as part of phase-close, not evidence of an implementation gap — the codebase itself fully satisfies all 4 requirements as verified above.

### Anti-Patterns Found

None. Scanned all 15 files touched by this phase (`src/audio.js`, `src/config.js`, `src/main.js`, `src/player.js`, `src/ui/challenge.js`, `src/mechanics/door.js`, `src/mechanics/gates.js`, `src/ui/mathGate.js`, `src/mechanics/collect.js`, `src/scenes/{title,select,game}.js`, `scripts/check-audio.sh`, `scripts/check-import-safety.sh`, `scripts/browser-boot.mjs`) for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` — zero matches.

### Human Verification Required

None. AUD-04's human sound sign-off (the phase's one non-automatable requirement) was already conducted this session as part of Plan 27-07's `checkpoint:human-verify` task, with a real, specific, iterative review (5 rounds, not a rubber stamp) culminating in an explicit final "audio approved" response — recorded verbatim in `27-07-SUMMARY.md`. Per this verification's task instructions, this does not need to be re-requested.

### Gaps Summary

No gaps found. All 5 ROADMAP.md success criteria are verified against the live codebase (not SUMMARY.md claims alone) via direct code reading, live re-execution of all 5 gate scripts (all green this session), and the genuine, already-recorded human sign-off for the mix-quality requirement.

---

_Verified: 2026-07-08T23:30:00Z_
_Verifier: Claude (gsd-verifier)_
