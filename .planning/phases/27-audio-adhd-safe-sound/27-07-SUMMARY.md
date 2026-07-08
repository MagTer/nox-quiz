---
phase: 27-audio-adhd-safe-sound
plan: 07
subsystem: audio
tags: [human-verify, checkpoint, sound-sign-off, adhd-safe, kenney, cc0]

# Dependency graph
requires:
  - phase: 27-audio-adhd-safe-sound (plan 06)
    provides: "full automated gate suite green — check-safety/check-import-safety/check-audio/check-gate/check-progress + browser-boot.mjs audio-count/mute assertions"
provides:
  - "Recorded human sign-off decision for AUD-04 — APPROVED, after 3 iterative fix rounds (not a first-pass rubber stamp)"
  - "land SFX removed (src/player.js) — onGround-triggered SFX read as erratic/stressful during ordinary walking, not tied to real jumps"
  - "jump SFX re-sourced twice: click_001 (Interface Sounds) -> select_001 (Interface Sounds) -> jump1 (Retro Sounds, final) — the original spectrogram-only pick read as harsh; final pick chosen by ear from Kenney's dedicated 8-bit jump/boing pack"
  - "CONFIG.AUDIO.JUMP_VOLUME added — per-SFX gain override (0.45 then 0.2) after two rounds of \"too loud/intrusive\" feedback on jump specifically"
  - "mute icon is now clickable (src/audio.js wireAudioUI) — previously keyboard-only (M key); mirrors select.js's box.onClick() pattern"
  - "ambient music re-sourced: Calm Loop (OpenGameArt, 19.4s) -> Flowing Rocks (Kenney Music Loops, ~30.8s) — original felt repetitive on loop; longer track located via the Kenney pack 27-RESEARCH.md had originally flagged but 27-01 never actually checked (it checked Music Jingles instead)"
affects: ["Phase 28 (VALID-03 final verification consumes this phase's closed, human-approved audio system)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Candidate audition via SendUserFile: rather than guessing asset picks from spectrogram/waveform/name alone, render 2-5 processed candidates through the exact production ffmpeg pipeline and send them to the human to choose by ear — used twice this plan (jump SFX re-source, ambient re-source), both times overriding an initial guess that read wrong in practice"
    - "Per-SFX gain override: CONFIG.AUDIO.SFX_VOLUME stays the shared default; a specific CONFIG.AUDIO.{NAME}_VOLUME key overrides it at the individual playSfx(name, vol) call site when one SFX needs different gain than the rest of the mix — established via CONFIG.AUDIO.JUMP_VOLUME"

key-files:
  created:
    - assets/_kenney-src/retro-sounds-1/ (jump1.ogg-jump5.ogg + readme.txt, CC0 verified)
    - assets/_kenney-src/music-loops/ (Flowing_Rocks.ogg + readme.txt, CC0 verified)
  modified:
    - src/player.js (land SFX call removed; jump SFX call uses CONFIG.AUDIO.JUMP_VOLUME)
    - src/audio.js (wireAudioUI: icon gained area() + onClick(), toggle logic extracted to handleToggle shared by key + click)
    - src/config.js (CONFIG.AUDIO.JUMP_VOLUME added, tuned 0.45 -> 0.2)
    - assets/sfx/jump.ogg (re-sourced twice, final: Retro Sounds jump1.ogg)
    - assets/music/ambient.ogg (re-sourced: Flowing Rocks)
    - assets/LICENSES/jump.txt, assets/LICENSES/ambient.txt (full re-pick history documented)
    - CREDITS.md (jump + ambient rows updated, Phase 27 note extended)

key-decisions:
  - "Land SFX removed entirely rather than debounced/fixed — 27-CONTEXT.md and 27-RESEARCH.md had already recommended shipping WITHOUT a land sound by default (\"cheaper to add than remove\"); Plan 27-03 included it anyway, and the human sign-off confirmed the original recommendation was right. Visual landing juice (squash/dust) was unaffected — only the sound was the problem."
  - "Jump SFX needed a genuine re-source, not a same-pack swap: the first fix (click_001 -> select_001, still within Kenney's Interface Sounds UI-click pack) was an improvement but still read as \"a short tap,\" not the requested \"faint boing, like a spring.\" Interface Sounds is a UI-click pack by design — no amount of same-pack re-picking would produce a spring/boing character. Sourced a different, purpose-built pack (Kenney Retro Sounds, literal jump1-5.ogg files) instead."
  - "Jump gain needed two rounds of reduction (1.0 implicit default -> 0.45 -> 0.2) — volume and asset-character are separate axes; fixing the sound pick did not by itself fix loudness, and the first gain cut wasn't aggressive enough."
  - "Ambient re-source root-caused a real process gap: 27-RESEARCH.md's Assumption A3 had flagged Kenney's \"Music Loops\" pack as a plausible ambient-loop source, but 27-01's execution checked \"Music Jingles\" instead (a different, much-shorter-stinger pack) and fell through to OpenGameArt without ever trying the pack the research had actually pointed at. This plan located and used the originally-intended pack."
  - "Two of Kenney's older packs (Retro Sounds, Music Loops) are no longer listed on kenney.nl's current asset catalog under any discoverable current slug; both were sourced via gamesounds.xyz, a mirror that redistributes Kenney's own unmodified CC0 files — each pack's own readme.txt was fetched directly and its CC0 declaration quoted in the license proof file, matching this project's existing verification discipline exactly (same standard as every kenney.nl-sourced asset)."

requirements-completed: [AUD-01, AUD-02, AUD-03, AUD-04]

coverage:
  - id: D1
    description: "A human listened to the running game with sound on across 3 iterative fix rounds (land SFX removal, jump SFX re-source x2 + gain tune x2, ambient re-source, clickable mute icon) and gave a final explicit approval (\"great.. audio approved\") — not a vague first-pass \"sounds fine\""
    requirement: "AUD-04"
    verification:
      - kind: manual_procedural
        ref: "in-session human sound review, 2026-07-08 — see this plan's decisions above for the full fix history"
        status: pass
    human_judgment: true
    rationale: "ADHD-safe mix quality (calm, non-startling, correctly-balanced) has no automated proxy — CLAUDE.md's standing rule requires this exact human-in-the-loop check, and this project's own never-rubber-stamp-checkpoints precedent (Phase 25) required surfacing this checkpoint rather than auto-approving it under workflow.auto_advance"
  - id: D2
    description: "Mute icon (SND/MUTE text, top-right HUD corner) is now clickable in addition to the M key — human feedback: \"the SND text in the top right corner is not clickable\""
    requirement: "AUD-03"
    verification:
      - kind: unit
        ref: "bash scripts/check-import-safety.sh (a727c13 compliance unchanged), bash scripts/check-safety.sh"
        status: pass
      - kind: e2e
        ref: "node scripts/browser-boot.mjs (real-browser boot, zero runtime errors after the change)"
        status: pass
    human_judgment: false
---

## Accomplishments

Closed AUD-04's human sound sign-off (the phase's only non-automatable requirement) through an iterative, multi-round real-listen process rather than a single pass-fail check:

1. **Land SFX (removed)** — `player.onGround()`'s land sound read as erratic, stressful "footsteps" during ordinary walking, not tied to actual jumps. Removed outright; visual landing juice (squash/dust) kept. This matches what 27-CONTEXT.md/27-RESEARCH.md had recommended from the start (ship without land SFX by default) — Plan 27-03 included it anyway, and the human check confirmed the original default was correct.

2. **Jump SFX (re-sourced twice, then gain-tuned twice)** — `click_001.ogg` (Kenney Interface Sounds) read as "tapping a nail on a plastic cup." First fix (`select_001.ogg`, same pack) was softer but still "a short tap." Root cause: Interface Sounds is a UI-click pack, not a game-feel pack — no same-pack pick could deliver the requested "faint boing, like a spring." Sourced Kenney's "Retro Sounds" pack instead (dedicated `jump1.ogg`-`jump5.ogg` 8-bit jump sounds, CC0-verified via the pack's own readme), sent all 5 for an ear-pick, and `jump1.ogg` was chosen. Still needed two rounds of gain reduction afterward (`CONFIG.AUDIO.JUMP_VOLUME`: implicit 1.0 default → 0.45 → 0.2) — asset character and loudness are separate problems.

3. **Mute icon (now clickable)** — was keyboard-only (M key); the on-screen "SND"/"MUTE" indicator had no click affordance. Added `area()` to the icon entity and `icon.onClick(handleToggle)`, mirroring `select.js`'s existing `box.onClick()` pattern. Toggle logic deduplicated into one `handleToggle` shared by the key handler and the click handler.

4. **Ambient music (re-sourced)** — the shipped "Calm Loop" track (OpenGameArt, 19.4s) felt repetitive on loop. Traced to a real process gap: 27-RESEARCH.md had flagged Kenney's "Music Loops" pack as a promising ambient-loop source, but Plan 27-01's execution checked "Music Jingles" instead (a different, much-shorter pack of stingers) and fell through to OpenGameArt without ever trying the pack the research actually pointed at. Located the real "Music Loops" pack (via a CC0-permitted mirror, since it's no longer under a discoverable slug on kenney.nl's current site), sent 2 longer candidates (~30s each) for an ear-pick, and "Flowing Rocks" (~30.8s, ~59% longer) was chosen.

Every asset swap went through the same discipline as the original Phase 27 vendoring: license verified directly from the source pack's own readme/license file before use, proof file written to `assets/LICENSES/`, `CREDITS.md` row updated, full re-pick history recorded (not silently overwritten) so a future reader can see what was tried and why it changed.

## Resume-signal record

- Round 1 (land SFX): "Most of the annoying noise is gone. There is one triggered at top of a jump as well.. a short pop of some kind" → routed to jump SFX investigation.
- Round 2 (jump SFX #1): "did a hard refresh, still happens on every jump. More on the way up, than at the apex" / "Just one sound, and it sounds broken.. like someone tapping a nail on a plastic cup" → root-caused to a harsh source pick, re-sourced within the same pack.
- Round 3 (jump SFX #2): "That sounds is to loud and to intrusive.. right direction though" → re-sourced from a purpose-built pack (Retro Sounds), gain added.
- Round 4 (mute + music): "the SND text in the top right corner is not clickable... it could dissable the sounds" + "the background music is fairly good, but it is very short and feels repetitive" → clickable icon added, ambient re-sourced.
- Round 5 (jump gain #2 + music pick): "lower the jump gain even more, and try the longer ambient" → gain lowered 0.45→0.2, "Flowing Rocks" applied.
- **Final: "great.. audio approved"** — explicit approval, AUD-04 closes here.

No step of this checkpoint was auto-approved under `workflow.auto_advance` — every round was a real, specific human response routed to a real fix and re-verified (full gate suite + `browser-boot.mjs` green after every change), matching this project's `never-rubber-stamp-checkpoints` precedent and CLAUDE.md's standing "no phase closes on greps/automation alone" rule.

## Self-Check: PASSED

- Full gate suite (`check-safety.sh`, `check-import-safety.sh`, `check-audio.sh`, `check-gate.sh`, `check-progress.sh`) green after every code/asset change, confirmed a final time after the last fix.
- `node scripts/browser-boot.mjs` — real-browser boot, zero runtime errors, after every change.
- All commits landed atomically per fix round (5 commits total across this checkpoint).
