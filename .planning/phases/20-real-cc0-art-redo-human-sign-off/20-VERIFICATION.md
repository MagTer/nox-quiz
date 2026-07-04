---
phase: 20-real-cc0-art-redo-human-sign-off
status: human_needed
verified: 2026-07-04
human_sign_off: "ROUND 1 (2026-07-04): a real, blocking AskUserQuestion call
  was made presenting descriptions of all 5 screenshots. Response: 'Has real
  issues.' Follow-up asked what was wrong; literal human response: 'Background
  is all black. ledges are invisible/also black. Something else is invisible
  as i get q math question without bumping into anything. Doors are question
  marks, monsters are exclamation marks in a red box.' The background/ledge
  invisibility was a REAL bug: ground.png/parallax/title-bg were quantized to
  luminance 10-42 (out of 255) against a #0a0a0a (luminance 10) stage
  background — essentially imperceptible, confirmed by comparing against this
  project's own known-good spike.png/goal.png (luminance up to 245). Fixed by
  widening ENVIRONMENT_PALETTE to a 10-136 range (still dark-grunge, no pink,
  no new hues — reuses the locked #333333/#444444 border tokens plus
  #666666/#888888), rebuilt all four affected assets, re-screenshotted,
  full automated suite re-confirmed green. (Doors-as-'?'/monsters-as-'!' are
  OUT OF SCOPE for this phase — those are door.js/enemy.js placeholder
  glyphs from Phases 15/16, not ART-05..08 assets; carried forward as a real
  observation for Phase 21's mechanics audit, not fixed here.)
  ROUND 2 (2026-07-04): re-presented the fixed screenshots via a second
  blocking AskUserQuestion call. No response after 60s — the user may be away
  from keyboard. NOT YET RE-CONFIRMED. Per PROC-02, status stays human_needed
  until a literal round-2 human response is recorded here. Do NOT interpret
  automated-suite-green or this agent's own visual inspection as a substitute
  for that response — see 20-RESEARCH.md's Pitfall 7 and the round-1 outcome
  above, which is direct proof that this agent's own visual judgment already
  missed a real, human-confirmed defect once in this same phase."
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
| 1 | Player idle/run/jump animations render as real, distinct pixel-art character, silhouette clearly visible against `#0a0a0a` | Automated: pass. Human: **confirmed clearly visible in round 1** (not flagged as an issue). Round-2 re-confirmation: pending. | `phase20-level-anim.png` — light-grey humanoid figure (Kenney "Platformer Characters" Adventurer), clearly visible against the near-black background. |
| 2 | Ground/platform tiles show real designed edge/seam frames depicting an actual material transition, tile seamlessly, no visible flat-noise blocks | Automated: pass. **Human round 1 found a real defect** ("ledges are invisible/also black") — FIXED (ENVIRONMENT_PALETTE widened 10-42 → 10-136). Round-2 re-confirmation: pending. | Pre-fix vs post-fix `phase20-level-anim.png` — ground/platforms now render as solid, clearly-visible grey material with edges, not near-invisible near-black. |
| 3 | Parallax layers depict composed scenery with deliberate horizon rhythm, camera-driven only, non-strobing | Automated: pass. **Human round 1 found a real defect** ("background is all black") — FIXED (same palette widening applied to far/mid/near). Round-2 re-confirmation: pending. | Post-fix `phase20-parallax-a.png` vs `phase20-parallax-b.png` — hill/structure silhouette now clearly visible and shifted between camera positions. |
| 4 | Title/select screens show real panel framing/texture and clear visual hierarchy, dark-grunge, no pink | Automated: pass. Human round 1: implicitly covered by the same "all black" complaint — FIXED (title-bg palette widened too). Round-2 re-confirmation: pending. | Post-fix `phase20-title.png`/`phase20-select.png` — castle+clouds+trees silhouette now clearly visible, no pink. |
| 5 | Every new/replaced asset has CC0 license proof in CREDITS.md + assets/LICENSES/*.txt | Automated: pass. | `grep -qi CC0 assets/LICENSES/player.txt assets/LICENSES/ground.txt assets/LICENSES/parallax.txt assets/LICENSES/title-bg.txt` all pass; `CREDITS.md` has matching rows for all 6 assets (see `20-01-SUMMARY.md`, `20-02-SUMMARY.md`). |
| 6 | Phase cannot be marked verified until a real human has looked at actual screenshots/live page and given explicit sign-off | **PARTIALLY EXERCISED, NOT YET SATISFIED** | Round 1 genuinely worked as designed — a real human caught a real defect (validating PROC-02's whole premise). Round 2 (re-confirmation of the fix) has not yet received a response. This criterion remains open until a literal round-2 response is recorded. |

## Status

**`human_needed`.** Round 1 of human sign-off happened for real and caught a
genuine defect (ground/parallax/title-bg were quantized to a luminance range
effectively invisible against the stage background) that neither the
automated suite nor this agent's own visual inspection of a magnified preview
had caught. The defect is fixed and re-verified automatically, but the
**round-2 re-confirmation from a human has not yet been obtained** — status
stays `human_needed` until that literal response is recorded here, replacing
this note. This is not a formality: round 1 is direct proof in this same
phase that automated-green + agent-eyeballing is not equivalent to a real
human looking at the actual result.

**To complete sign-off:** re-run `/gsd-verify-work 20` (or otherwise prompt for
a fresh `AskUserQuestion` response) when a human is available to look at the
current screenshots in `.planning/phases/20-real-cc0-art-redo-human-sign-off/`
and confirm the fix, or flag further issues.
