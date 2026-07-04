---
phase: 20-real-cc0-art-redo-human-sign-off
status: passed
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
  blocking AskUserQuestion call. First attempt: no response after 60s. The
  human then returned unprompted with live-gameplay feedback: 'I get a
  question just after the first coin that is not possible to answer. No ID
  on the options. the boxes are visible in the background but no ID and they
  are greyed out. Next issue, Answer to defeat the guard, gives me answers
  but no question. There are boxes with question marks and exclamation marks
  that I am not what sure what they are. The background is however now
  visible, so it is a good step in the right direction.' This confirms the
  round-1 fix worked (background/ledges now visible) but surfaces THREE
  NEW real gameplay-mechanics bugs — unanswerable/unlabeled math-gate
  options, a defeat-enemy gate showing answers with no question text, and
  unclear door('?')/enemy('!') glyphs. These are door.js/gates.js/enemy.js/
  mathGate.js LOGIC bugs from Phases 15/16, entirely outside this phase's
  ART-05..08/PROC-01/02 scope (asset content + license process only) — NOT
  fixed here, explicitly carried forward to Phase 21 ('Real Verification
  Pass — Mechanics & Sign-off Integrity'), whose whole mandate is giving
  these exact four files real interactive scrutiny. To close THIS phase's
  actual scope cleanly, asked a final scoped confirmation: 'Just to close
  out Phase 20's specific scope (player sprite, ground tiles, parallax
  background, title/select screens) ... are those 4 art areas good?' Literal
  human response: 'Yes, the art itself is good now.' This is the real,
  recorded, non-fabricated human sign-off PROC-02 requires. status flips to
  passed in this same edit."
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
| 1 | Player idle/run/jump animations render as real, distinct pixel-art character, silhouette clearly visible against `#0a0a0a` | **PASS — human-confirmed** | Never flagged as an issue across both rounds; explicitly included in "the art itself is good now." |
| 2 | Ground/platform tiles show real designed edge/seam frames depicting an actual material transition, tile seamlessly, no visible flat-noise blocks | **PASS — human-confirmed after a real fix** | Round 1 found a real defect ("ledges are invisible/also black"); fixed (ENVIRONMENT_PALETTE widened 10-42 → 10-136); round 2 explicitly confirmed "background is however now visible." |
| 3 | Parallax layers depict composed scenery with deliberate horizon rhythm, camera-driven only, non-strobing | **PASS — human-confirmed after a real fix** | Same round-1 defect/fix/round-2 confirmation as #2 — parallax uses the same palette family. |
| 4 | Title/select screens show real panel framing/texture and clear visual hierarchy, dark-grunge, no pink | **PASS — human-confirmed** | Covered by the scoped round-2 confirmation ("the art itself is good now" explicitly listed title/select among the 4 confirmed areas). |
| 5 | Every new/replaced asset has CC0 license proof in CREDITS.md + assets/LICENSES/*.txt | **PASS — automated** | `grep -qi CC0 assets/LICENSES/player.txt assets/LICENSES/ground.txt assets/LICENSES/parallax.txt assets/LICENSES/title-bg.txt` all pass; `CREDITS.md` has matching rows for all 6 assets. |
| 6 | Phase cannot be marked verified until a real human has looked at actual screenshots/live page and given explicit sign-off | **PASS — satisfied for real** | Two full rounds of genuine, blocking `AskUserQuestion` interaction; round 1 caught and drove the fix of a real defect; round 2's literal, scoped response was "Yes, the art itself is good now." |

## Status

**`passed`.** Both rounds of human sign-off happened for real, not on paper.
Round 1 caught a genuine defect (ground/parallax/title-bg quantized to a
luminance range effectively invisible against the stage background) that
neither the automated suite nor this agent's own visual inspection had
caught — direct, in-phase proof of why PROC-02 exists. The defect was fixed
and re-verified. Round 2 surfaced real gameplay-mechanics bugs (unanswerable/
unlabeled math-gate options, a defeat-enemy gate with no question text,
unclear door/enemy glyphs) that are explicitly out of this phase's
asset-only scope — not fixed here, carried forward verbatim to Phase 21
("Real Verification Pass — Mechanics & Sign-off Integrity"), whose mandate
is exactly those four files. A final scoped question isolated Phase 20's own
4 art areas, and the human's literal response was "Yes, the art itself is
good now." All 6 ROADMAP success criteria are satisfied.

## Carried Forward to Phase 21 (out of this phase's scope, not fixed here)

- Immediately-after-first-coin math question has answer-option boxes with
  no visible ID/number, greyed out.
- "Defeat the guard" enemy gate shows answer options but no question text.
- Door and enemy sprites render as generic `?`/`!` glyph boxes with unclear
  meaning to a player.

These are real, human-reported defects in `door.js`/`gates.js`/`enemy.js`/
`mathGate.js` — exactly the four files Phase 21 already names as needing
"the same real interactive scrutiny `collect.js` got."
