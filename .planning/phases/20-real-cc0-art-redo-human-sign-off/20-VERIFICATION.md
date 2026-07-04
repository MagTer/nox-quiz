---
phase: 20-real-cc0-art-redo-human-sign-off
status: human_needed
verified: 2026-07-04
human_sign_off: "NOT YET OBTAINED. A real, blocking AskUserQuestion call was made
  during this task's execution (2026-07-04) presenting descriptions of all 5
  screenshots and asking the user to confirm the art. The tool returned 'No
  response after 60s — the user may be away from keyboard.' No human response
  text exists. Per this phase's own PROC-02 requirement, that is NOT sufficient
  for sign-off — status stays human_needed until a literal human response is
  recorded here, replacing this note. Do NOT interpret automated-suite-green or
  this agent's own visual inspection as a substitute for that response; doing so
  would reproduce the exact self-certification pattern this phase exists to fix
  (see 18-VERIFICATION.md's 'Auto-approved in autonomous mode' line, and
  20-RESEARCH.md's Pitfall 7)."
---

# Phase 20: Real CC0 Art Redo & Human Sign-off — Verification

## Automated Evidence (Task 1 — all green)

| Check | Command | Result |
|-------|---------|--------|
| Safety gate | `bash scripts/check-safety.sh` | PASS |
| Import safety | `bash scripts/check-import-safety.sh` | PASS |
| Gate check | `bash scripts/check-gate.sh` | PASS |
| Smoke progress | `node scripts/smoke-progress.mjs` | PASS |
| Browser boot | `node scripts/browser-boot.mjs` | PASS — "title -> select -> all levels loaded with no runtime errors" |

5 real screenshots captured via `scripts/screenshot-phase20.mjs` (port 8767):
`phase20-title.png`, `phase20-select.png`, `phase20-level-anim.png`,
`phase20-parallax-a.png`, `phase20-parallax-b.png`.

## Observable Truths — Phase 20 Success Criteria (from ROADMAP.md)

| # | Success Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Player idle/run/jump animations render as real, distinct pixel-art character, silhouette clearly visible against `#0a0a0a` | Automated: pass. Human: pending. | `phase20-level-anim.png` — light-grey humanoid figure (Kenney "Platformer Characters" Adventurer), clearly visible against the near-black background at actual in-game scale. Agent's own visual inspection (not a substitute for human sign-off) confirms legibility. |
| 2 | Ground/platform tiles show real designed edge/seam frames depicting an actual material transition, tile seamlessly, no visible flat-noise blocks | Automated: pass (dimension asserts). Human: pending. | `phase20-level-anim.png`/`phase20-parallax-a.png` — thin dark ground strip visible; `assets/tiles/ground.png` built from real Kenney "Pixel Platformer" grass/dirt tiles via a luminance-ramp remap (see `20-01-SUMMARY.md`'s documented defect-and-fix). |
| 3 | Parallax layers depict composed scenery with deliberate horizon rhythm, camera-driven only, non-strobing | Automated: pass (dimension asserts, no-timer gate). Human: pending. | `phase20-parallax-a.png` vs `phase20-parallax-b.png` — hill silhouette visibly shifted between the two camera positions; `scripts/build-art-assets.py`'s `build_parallax()` composites real temple/castle/tower/hills elements (see `20-02-SUMMARY.md`). |
| 4 | Title/select screens show real panel framing/texture and clear visual hierarchy, dark-grunge, no pink | Automated: pass (dimension asserts). Human: pending. | `phase20-title.png`/`phase20-select.png` — real composited castle+clouds+hills backdrop (`assets/tiles/title-bg.png`) behind the existing (unchanged, Phase-18-authored) tile hierarchy styling. |
| 5 | Every new/replaced asset has CC0 license proof in CREDITS.md + assets/LICENSES/*.txt | Automated: pass. | `grep -qi CC0 assets/LICENSES/player.txt assets/LICENSES/ground.txt assets/LICENSES/parallax.txt assets/LICENSES/title-bg.txt` all pass; `CREDITS.md` has matching rows for all 6 assets (see `20-01-SUMMARY.md`, `20-02-SUMMARY.md`). |
| 6 | Phase cannot be marked verified until a real human has looked at actual screenshots/live page and given explicit sign-off | **NOT YET SATISFIED** | See `human_sign_off` field above — a real `AskUserQuestion` call was made; no response was received. This criterion is the one this phase exists to enforce, and it is deliberately left unsatisfied rather than faked. |

## Status

**`human_needed`.** 5 of 6 success criteria have full automated evidence plus the
executing agent's own visual inspection (which is informative but explicitly
NOT a substitute for human sign-off per PROC-02). Criterion 6 — the actual
human confirmation — has not yet been obtained. This file must be updated with
a literal, quoted human response before status may change to `passed`.

**To complete sign-off:** re-run `/gsd-verify-work 20` (or otherwise prompt for
a fresh `AskUserQuestion` response) when a human is available to look at the
screenshots in `.planning/phases/20-real-cc0-art-redo-human-sign-off/` and
confirm or flag issues.
