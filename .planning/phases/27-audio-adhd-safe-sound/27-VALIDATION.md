---
phase: 27
slug: audio-adhd-safe-sound
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-08
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (project convention) — Playwright-driven custom scripts under `scripts/*.mjs` ARE the test suite, plus bash shell-gate scripts (`scripts/check-*.sh`) for static/content assertions. No JS unit-test framework exists or is expected. |
| **Config file** | none — Wave 0 adds the one new gate this phase needs |
| **Quick run command** | `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh` |
| **Full suite command** | `node scripts/browser-boot.mjs` (real-browser boot + drive across levels) + the new audio-specific check(s) added in Wave 0 |
| **Estimated runtime** | ~90 seconds (browser-boot dominates; shell gates are near-instant) |

---

## Sampling Rate

- **After every task commit:** Run `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh` (fast; catches a727c13/no-timer regressions immediately after each `audio.js` edit)
- **After every plan wave:** Run the full `node scripts/browser-boot.mjs` drive + the new audio-specific script(s)
- **Before `/gsd-verify-work`:** Full suite must be green, AND the human sound sign-off (AUD-04) must be recorded — this is a `checkpoint:human-verify` item, not automatable
- **Max feedback latency:** ~90 seconds

---

## Per-Task Verification Map

> Task IDs are not yet assigned (VALIDATION.md is written before the planner runs). This maps by requirement instead; the planner should thread each row into the concrete task(s) that implement it.

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|--------------------|-------------|--------|
| AUD-01 | 7 distinct SFX play at their mechanic seams, CC0 with license proofs | static (asset presence + CREDITS/LICENSES rows) + interactive (audible in-browser) | `bash scripts/check-audio.sh` (proposed, Wave 0) + Playwright drive-through | ❌ W0 | ⬜ pending |
| AUD-02 | Ambient music loops seamlessly, gesture-gated start | interactive (real browser, fresh incognito-equivalent context) | extension to `scripts/browser-boot.mjs` (or focused sibling script) asserting no audio starts before the first simulated click/keypress | ❌ W0 | ⬜ pending |
| AUD-03 | M toggles mute anywhere, persists across reload, doesn't touch progress save | interactive + static (grep for the distinct storage key; negative-grep that it never joins `CONFIG.SAVE.KEY` writes) | new `scripts/check-audio.sh` (mirrors `check-progress.sh`'s shape) | ❌ W0 | ⬜ pending |
| AUD-04 | No music stacking/leaking across scenes; ADHD-safe mix; human sign-off | interactive (multi-scene-transition drive) + human checkpoint | extend `scripts/browser-boot.mjs`'s drive to exercise title→select→game→escape→title, asserting `document.querySelectorAll('audio').length <= 1` at each stop | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/check-audio.sh` — NEW shell gate mirroring `check-progress.sh`'s shape: asserts `assets/sfx/*.ogg` + `assets/music/*.ogg` exist, asserts one `CREDITS.md` row + one `assets/LICENSES/*.txt` proof file per vendored audio asset, asserts the mute storage key literal is distinct from `CONFIG.SAVE.KEY`
- [ ] `scripts/check-import-safety.sh` — EXTEND the existing scoped-file list (Section 1 + Section 2) to include `src/audio.js` — required, not optional, per the a727c13 rule
- [ ] `scripts/browser-boot.mjs` (or a new sibling script, per this project's "copy verbatim, fix by hand in each copy" Playwright convention) — EXTEND to drive a scene-transition loop (title→select→game→select→title) and assert `document.querySelectorAll('audio').length <= 1` at each stop, directly proving AUD-04's "exactly one music handle" claim automatedly
- [ ] A `checkpoint:human-verify` task for the ADHD-safe mix sign-off (music-vs-SFX balance, no startle stingers, wrong-answer tone reads as neutral not punishing) — explicitly NOT automatable; AUD-04 requires it be recorded

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| ADHD-safe mix quality (music clearly below SFX, no buzzers/startle stingers, wrong-answer tone reads as neutral not punishing) | AUD-04 | Subjective audio-quality judgment; no automated proxy for "does this feel calm and non-startling" | Play through a level with sound on: trigger jump, correct answer, wrong answer, door/gate open, pickup, level-clear, and let ambient music loop at least twice. Confirm music sits below SFX in the mix and nothing sounds abrupt or punishing. |
| Fresh-incognito gesture gate | AUD-02 | Confirming *no* audio plays before a gesture requires a human ear (or a scripted assertion — covered by the automated command above) plus a real first-load feel check | Open the game in a fresh incognito window with sound on; confirm silence until the first title-screen press, then confirm music starts immediately after |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
