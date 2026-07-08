---
phase: 27-audio-adhd-safe-sound
plan: 01
subsystem: audio-assets
tags: [audio, cc0-sourcing, license-proof, kenney, opengameart, ffmpeg]
dependency-graph:
  requires: []
  provides:
    - assets/sfx/jump.ogg
    - assets/sfx/land.ogg
    - assets/sfx/correct.ogg
    - assets/sfx/wrong.ogg
    - assets/sfx/door.ogg
    - assets/sfx/clear.ogg
    - assets/sfx/pickup.ogg
    - assets/music/ambient.ogg
    - assets/LICENSES/jump.txt
    - assets/LICENSES/land.txt
    - assets/LICENSES/correct.txt
    - assets/LICENSES/wrong.txt
    - assets/LICENSES/door-sfx.txt
    - assets/LICENSES/clear.txt
    - assets/LICENSES/pickup.txt
    - assets/LICENSES/ambient.txt
    - scripts/check-audio.sh
  affects:
    - CREDITS.md
tech-stack:
  added: []
  patterns:
    - "ffmpeg loudnorm (I=-16:TP=-1.5:LRA=11, SFX / I=-20:TP=-1.5:LRA=11, music) + libvorbis encode, mirroring the existing Pillow-bake art pipeline discipline"
    - "spectrogram/waveform visual inspection (ffmpeg showspectrumpic/showwavespic) as a due-diligence substitute for by-ear audition when selecting a hard-requirement 'not a buzzer' candidate"
key-files:
  created:
    - assets/sfx/jump.ogg
    - assets/sfx/land.ogg
    - assets/sfx/correct.ogg
    - assets/sfx/wrong.ogg
    - assets/sfx/door.ogg
    - assets/sfx/clear.ogg
    - assets/sfx/pickup.ogg
    - assets/music/ambient.ogg
    - assets/LICENSES/jump.txt
    - assets/LICENSES/land.txt
    - assets/LICENSES/correct.txt
    - assets/LICENSES/wrong.txt
    - assets/LICENSES/door-sfx.txt
    - assets/LICENSES/clear.txt
    - assets/LICENSES/pickup.txt
    - assets/LICENSES/ambient.txt
    - scripts/check-audio.sh
    - assets/_kenney-src/interface-sounds/ (100-file raw pack)
    - assets/_kenney-src/impact-sounds/ (130-file raw pack)
    - assets/_opengameart-src/calm-loop/ (raw source track)
  modified:
    - CREDITS.md
decisions:
  - "wrong.ogg = Interface Sounds' back_001.ogg, chosen over the pack's error_* family after direct spectrogram + waveform review (not by-ear alone) — error_* candidates showed sustained full-spectrum tonal envelopes, back_001 showed a short rapidly-decaying tick train reading as soft/neutral, per the plan's hard buzzer-rejection requirement"
  - "Ambient music = OpenGameArt.org 'Calm Loop' (wipics), NOT Kenney's Music Jingles pack — jingles confirmed too short (1.76s max across all 85 files) exactly as 27-RESEARCH.md's Assumption A3 anticipated; fell through to the documented OpenGameArt fallback path"
metrics:
  duration: 35min
  completed: 2026-07-08
status: complete
---

# Phase 27 Plan 01: Source & License-Prove Audio Assets Summary

Vendored, license-proved, and gated 7 CC0 SFX + 1 CC0 ambient music loop from Kenney.nl and OpenGameArt.org for Nox Run's first-ever audio implementation, plus a new `scripts/check-audio.sh` Wave 0 gate (partially red by design until Plan 27-02 lands CONFIG.AUDIO).

## What Was Built

**SFX (7 files, all from Kenney's "Interface Sounds" and "Impact Sounds" CC0 packs):**

| Role | File | Source track | Character |
|------|------|---------------|-----------|
| Jump | `assets/sfx/jump.ogg` | Interface Sounds / `click_001.ogg` | Short (0.10s) soft click |
| Land | `assets/sfx/land.ogg` | Impact Sounds / `footstep_grass_001.ogg` | Soft footstep thud (0.67s) — included, judged not to add unwanted noise density |
| Correct | `assets/sfx/correct.ogg` | Interface Sounds / `confirmation_002.ogg` | Ascending stepped chime, bright but soft |
| Wrong | `assets/sfx/wrong.ogg` | Interface Sounds / `back_001.ogg` | Short (0.06s) decaying tick train — soft/neutral, verified NOT a buzzer |
| Door/gate | `assets/sfx/door.ogg` | Interface Sounds / `open_001.ogg` | Clean single upward sweep |
| Level-clear | `assets/sfx/clear.ogg` | Interface Sounds / `maximize_002.ogg` | Smooth rising harmonic swell, calm not fanfare |
| Pickup | `assets/sfx/pickup.ogg` | Interface Sounds / `pluck_001.ogg` | Plucked decaying pop |

**Ambient music (1 file):** `assets/music/ambient.ogg` — 19.4s "Calm Loop" by wipics (OpenGameArt.org), CC0, steady rhythmic synth+percussion bed. Kenney's "Music Jingles" pack was tried first and rejected (longest of its 85 files measures 1.76s — far too short for a persistent loop), so the project fell through to the plan's documented OpenGameArt fallback path.

**License proofs:** one `assets/LICENSES/<name>.txt` per asset (8 total), each mirroring `door.txt`'s exact shape — source URL, quoted CC0 declaration read directly from the pack's own License.txt or the OpenGameArt content page's License(s) field, verification date, ffmpeg processing note. The door-unlock SFX proof is named `door-sfx.txt` (not `door.txt`) to avoid colliding with the pre-existing visual door sprite proof — confirmed byte-unchanged via `git diff`.

**`scripts/check-audio.sh`:** new Wave 0 gate mirroring `check-progress.sh`'s shape (existence checks, CREDITS mentions, a mute-key-distinct-from-save-key assertion). Steps 1-3 pass now; step 4 (the `noxrun_mute_v1` mute storage key literal) is intentionally red until Plan 27-02 lands `CONFIG.AUDIO` — this is the documented "real gate, expected red until a later wave" pattern already used elsewhere in this project.

## Selection Methodology (Claude's Discretion candidates)

Since exact file picks within each Kenney pack were explicitly left to implementation-time judgment (27-CONTEXT.md), and the wrong-answer sound carries a hard non-buzzer requirement, candidates were vetted with `ffmpeg showspectrumpic`/`showwavespic` renders (viewed as images) rather than picked from naming conventions alone. The wrong-answer candidate pool (`error_001`-`005`, `back_001`-`003`, `close_001`) was compared this way; `back_001.ogg`'s short, rapidly-decaying percussive tick train was visually distinguishable from the `error_*` family's sustained full-spectrum tonal envelopes, which read closer to a "denial buzz" than a neutral tick.

## Deviations from Plan

None — plan executed as written. Both Wave-0-Gaps candidate paths named in 27-RESEARCH.md played out exactly as anticipated: the Kenney Music Jingles pack was genuinely too short (confirmed, not assumed), and the OpenGameArt fallback supplied a fitting CC0 track on the first search.

## Self-Check: PASSED

- All 7 `assets/sfx/*.ogg` + `assets/music/ambient.ogg` confirmed present and valid Ogg Vorbis via `file`.
- All 8 `assets/LICENSES/*.txt` proof files confirmed present; `assets/LICENSES/door.txt` confirmed byte-unchanged via `git diff --name-only`.
- `scripts/check-audio.sh` confirmed syntactically valid (`bash -n`) and confirmed to correctly PASS assertions 1-3 and FAIL assertion 4 (expected, pending Plan 27-02).
- All 3 task commits confirmed present in `git log`: `5b9d88e` (SFX), `9d8d013` (ambient music), `988f7c6` (license proofs + CREDITS + gate).
