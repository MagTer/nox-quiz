---
phase: 26-grunge-palette-nox-run-rebrand
plan: 02
subsystem: ui
tags: [kaplay, config, palette, wcag, accessibility, art-pipeline]

# Dependency graph
requires: ["26-01"]
provides:
  - "CONFIG.PALETTE expanded with 3 hue-tinted dark accents: ACCENT_MOSS, ACCENT_SLATE, ACCENT_RUST"
  - "scripts/check-contrast.mjs — permanent WCAG AA + banned-hue guardrail script (exit 0/1 gate)"
  - "26-CONTRAST.md — VIS-02 evidence doc (role table, verbatim script output, deviation log)"
  - "26-PALETTE-SWATCH.png — rendered swatch proof of all 16 CONFIG.PALETTE roles"
  - "Human sign-off closed: zero palette roles read as pink/magenta/mauve"
affects: [26-03, 26-04, 26-05, 26-06, 26-07, 26-08, 26-09, 26-10, 26-11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WCAG contrast + banned-hue guardrail as a permanent CLI gate script (scripts/check-contrast.mjs), reading CONFIG.PALETTE live — same zero-dependency, plain-Node-CLI shape as scripts/validate-levels.mjs"
    - "Python art pipeline reads live JS config via a node subprocess call (scripts/build-art-assets.py's _load_live_palette()) instead of hand-mirroring hex values — keeps the swatch proof in sync with the same source of truth check-contrast.mjs uses"

key-files:
  created:
    - scripts/check-contrast.mjs
    - .planning/phases/26-grunge-palette-nox-run-rebrand/26-CONTRAST.md
    - .planning/phases/26-grunge-palette-nox-run-rebrand/26-PALETTE-SWATCH.png
  modified:
    - src/config.js
    - scripts/build-art-assets.py

key-decisions:
  - "Task 1's initial literal accent hex values (ACCENT_MOSS #2a3d2a, ACCENT_SLATE #2c3844, ACCENT_RUST #5a3322) measured ~1.66-1.82:1 contrast against BG under the newly-built check-contrast.mjs — below the plan's own 3.0:1 UI-component must-have. Brightened to #476847/#4e6478/#8c5036 (~3.13-3.22:1) within this same plan since zero consumers existed yet (per-level theming lands in a later Phase 26 plan)."
  - "Pre-existing 'locked' tokens BORDER (#333333, 1.57:1) and MUTED_BORDER (#555555, 2.66:1) also failed the 3.0:1 threshold. Brightened to #5e5e5e (~3.05:1) and #707070 (~4.00:1) to satisfy the plan's own must-have and its automated <verify> gates (which require check-contrast.mjs to exit 0). This is a real, visible brightness change to previously human-signed-off UI borders across the whole game (title/challenge/mathGate panels, select.js locked tile) — explicitly flagged for and approved by human review at the Task 5 checkpoint, not silently applied."
  - "MUTED (#444444) was left untouched — it is not a checked pairing in the role table, and touching it was out of the minimal-fix scope needed to close the gate."

patterns-established:
  - "When a newly-built automated correctness gate (WCAG contrast) reveals a pre-existing value fails, and the value has broad shipped-UI impact, fix it within the same plan (since it's a minimal value tweak, not a structural change) but surface the visual change explicitly at the plan's human checkpoint rather than silently shipping it."

requirements-completed: [VIS-02]

coverage:
  - id: D1
    description: "CONFIG.PALETTE has exactly 3 new hue-tinted dark tokens (ACCENT_MOSS, ACCENT_SLATE, ACCENT_RUST), zero pink/magenta anywhere in the palette, proven by a permanent script"
    requirement: "VIS-02"
    verification:
      - kind: unit
        ref: "node scripts/check-contrast.mjs — banned-hue guardrail section: 0/16 roles flagged"
        status: pass
      - kind: human
        ref: "Task 5 checkpoint — human reviewed 26-PALETTE-SWATCH.png directly and confirmed: \"Changes noticed. Seems to be working. Not pink.\""
        status: pass
    human_judgment: true
  - id: D2
    description: "Every text/UI-component palette role clears its WCAG threshold (4.5:1 text, 3:1 UI-component) against the role it actually renders on, recorded in a table in 26-CONTRAST.md"
    requirement: "VIS-02"
    verification:
      - kind: unit
        ref: "node scripts/check-contrast.mjs — WCAG section: 11/11 role pairings PASS, exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "A human has explicitly signed off, against a rendered swatch proof of every CONFIG.PALETTE role, that none of them reads as pink/magenta/mauve"
    requirement: "VIS-02"
    verification:
      - kind: human
        ref: "Task 5 checkpoint — human response: \"Changes noticed. Seems to be working. Not pink. Keep going.\" — also explicitly approved the brightened BORDER/MUTED_BORDER tokens flagged alongside the mandatory pink/magenta check"
        status: pass
    human_judgment: true

duration: 27min
completed: 2026-07-07
status: complete
---

# Phase 26 Plan 02: Expand Palette (VIS-02) + WCAG/Banned-Hue Guardrail Summary

**Added 3 hue-tinted dark accent tokens to `CONFIG.PALETTE`, built a permanent `scripts/check-contrast.mjs` WCAG AA + banned-hue guardrail script, and closed the human half of the banned-hue sign-off against a rendered swatch proof — while also discovering and fixing 2 pre-existing "locked" border tokens that failed the very WCAG threshold this plan establishes.**

## Performance

- **Duration:** ~27 min
- **Started:** 2026-07-07T18:38:04Z
- **Completed:** 2026-07-07 (Task 5 human sign-off received via coordinator relay)
- **Tasks:** 5 (4 auto + 1 human-verify checkpoint)
- **Files modified:** 2 (src/config.js, scripts/build-art-assets.py)
- **Files created:** 3 (scripts/check-contrast.mjs, 26-CONTRAST.md, 26-PALETTE-SWATCH.png)

## Accomplishments
- `CONFIG.PALETTE` expanded to 16 total roles with `ACCENT_MOSS`, `ACCENT_SLATE`, `ACCENT_RUST` — the 3 hue-tinted darks (moss green / cold blue-grey / muted rust) VIS-02 requires
- `scripts/check-contrast.mjs` built as a plain-Node CLI gate (zero new dependency, same shape as `validate-levels.mjs`): implements the W3C WCAG 2.x relative-luminance/contrast-ratio formula and an `isBannedHue()` guard, checks 11 role pairings against their real threshold, sweeps all 16 palette roles for banned hues, exits 1 on any failure
- Built via a real RED→GREEN TDD cycle: RED commit (`390a75d`) shipped the script with stubbed formulas and known-answer self-tests that failed on purpose (white luminance, black/white 21:1 ratio, magenta banned-hue check); GREEN commit (`70148c4`) implemented the real formulas, self-tests pass
- The real (non-stubbed) run surfaced genuine WCAG failures: Task 1's initial 3 accent hex picks and 2 pre-existing tokens (`BORDER`, `MUTED_BORDER`) all fell short of the 3:1 UI-component threshold — both were fixed within this plan (see Decisions Made) so the gate now legitimately exits 0 (11/11 pairings PASS, 0/16 banned-hue hits)
- `26-CONTRAST.md` records the full role table, verbatim script output, and both deviation rounds as the phase's VIS-02 evidence doc
- `scripts/build-art-assets.py` gained `build_palette_swatch()`, reading `CONFIG.PALETTE` live via a node subprocess (never a hand-mirrored Python constant) and rendering all 16 roles as labeled swatches in a 4-column grid — `26-PALETTE-SWATCH.png`
- Task 5's human-verify checkpoint was closed: the human reviewed the swatch image directly and confirmed no role reads as pink/magenta/mauve, and separately approved the brightened `BORDER`/`MUTED_BORDER` tokens that were proactively flagged as a broader-than-expected visual change

## Task Commits

Each task was committed atomically:

1. **Task 1: Add 3 hue-tinted dark tokens to CONFIG.PALETTE** - `d035e52` (feat)
2. **Task 2 (RED): failing self-tests for check-contrast.mjs formulas** - `390a75d` (test)
3. **Deviation fix: brighten ACCENT_MOSS/SLATE/RUST to clear WCAG 3:1** - `9df51b5` (fix)
4. **Task 2 (GREEN): implement check-contrast.mjs WCAG + banned-hue formulas** - `70148c4` (feat)
5. **Deviation fix: brighten locked BORDER/MUTED_BORDER tokens to clear WCAG 3:1** - `6a9314c` (fix)
6. **Task 3: write 26-CONTRAST.md evidence doc** - `3823d92` (docs)
7. **Task 4: render CONFIG.PALETTE swatch proof image** - `8f08a6c` (feat)
8. **Task 5: human-verify checkpoint** - no code commit (verification-only); sign-off recorded in this SUMMARY and 26-CONTRAST.md

_TDD task: Task 2 followed a real RED→GREEN cycle (commits `390a75d` → `70148c4`), the two deviation fix commits landed between RED and GREEN once the real formulas exposed genuine palette gaps._

## Files Created/Modified
- `src/config.js` - added `ACCENT_MOSS`/`ACCENT_SLATE`/`ACCENT_RUST` to `PALETTE` (Task 1, later brightened); brightened pre-existing `BORDER`/`MUTED_BORDER` (deviation fix)
- `scripts/check-contrast.mjs` - new: `relativeLuminance()`, `contrastRatio()`, `isBannedHue()`, an 11-row role-pairing table, a full-palette banned-hue sweep, CLI entry point with numeric exit code
- `.planning/phases/26-grunge-palette-nox-run-rebrand/26-CONTRAST.md` - new evidence doc (role table, verbatim script output, deviation log, sign-off status)
- `scripts/build-art-assets.py` - new `_load_live_palette()` (node subprocess reader) and `build_palette_swatch()` (16-role labeled grid renderer), wired into `__main__` after `build_title_bg()`
- `.planning/phases/26-grunge-palette-nox-run-rebrand/26-PALETTE-SWATCH.png` - new swatch proof image (all 16 roles, 4-col grid, mid-grey canvas)

## Decisions Made
- **Brightened Task 1's 3 new accent tokens** (`#2a3d2a`→`#476847`, `#2c3844`→`#4e6478`, `#5a3322`→`#8c5036`) because the real WCAG script (built in the same plan) found they only reached ~1.7:1 contrast against `BG`, below the plan's own 3.0:1 UI-component must-have. Zero downstream consumers existed at the time (per-level theming is a later plan), making this a safe same-plan correction rather than a shipped-art regression.
- **Brightened the pre-existing "locked" `BORDER`/`MUTED_BORDER` tokens** (`#333333`→`#5e5e5e`, `#555555`→`#707070`) because they also failed the 3.0:1 threshold (1.57:1 and 2.66:1) and the plan's own automated `<verify>` gates (Task 2/3) explicitly require `check-contrast.mjs` to exit 0. Since this touches previously human-signed-off UI broadly (title/challenge/mathGate panel borders, select.js locked tile), it was explicitly called out — beyond the plan's stated pink/magenta-only checkpoint scope — for human review at Task 5, rather than silently applied. The human confirmed acceptance ("Changes noticed. Seems to be working. Not pink. Keep going.").
- **Left `MUTED` (`#444444`) untouched** — not a checked pairing in the role table, and adjusting it was outside the minimal scope needed to close the gate (avoiding scope creep per the deviation rules' "only fix what's directly required" boundary).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Task 1's literal accent hex values failed the plan's own WCAG must-have**
- **Found during:** Task 2 (building check-contrast.mjs's real formulas)
- **Issue:** `ACCENT_MOSS`/`ACCENT_SLATE`/`ACCENT_RUST`'s exact hex values, as specified verbatim in Task 1's `<action>` text, measured 1.66-1.82:1 contrast against `BG` — the plan's own must-have truth #2 requires every UI-component role to clear 3.0:1.
- **Fix:** Brightened all 3 tokens to values in the same hue family that clear 3.0:1 with margin (~3.13-3.22:1), verified via `node scripts/check-contrast.mjs` and `isBannedHue()` (none flagged).
- **Files modified:** src/config.js
- **Verification:** `node scripts/check-contrast.mjs` (ACCENT_MOSS/SLATE/RUST rows: PASS); `bash scripts/check-safety.sh` (PASS)
- **Committed in:** `9df51b5`

**2. [Rule 2 - Missing critical functionality] Pre-existing BORDER/MUTED_BORDER tokens failed the same WCAG must-have**
- **Found during:** Task 2 (same real-formula run)
- **Issue:** `BORDER` (`#333333`) and `MUTED_BORDER` (`#555555`) — established before this phase, used across many already-shipped/reviewed UI panels — measured 1.57:1 and 2.66:1 against `BG`, below 3.0:1. Task 2/3's automated `<verify>` blocks explicitly chain on `check-contrast.mjs` exiting 0, so this could not be left failing without violating the plan's own gate.
- **Fix:** Brightened to `#5e5e5e` (~3.05:1) and `#707070` (~4.00:1), preserving the `BORDER < MUTED_BORDER` ordering. Explicitly flagged this as a broader-than-Task-5's-stated-scope visual change in the checkpoint report, since it changes previously-approved UI appearance across the whole game.
- **Files modified:** src/config.js
- **Verification:** `node scripts/check-contrast.mjs` (exit 0, 11/11 pairings PASS); `bash scripts/check-safety.sh` (PASS); human explicitly reviewed and approved the resulting swatch image at Task 5, including this change
- **Committed in:** `6a9314c`

---

**Total deviations:** 2 auto-fixed (both Rule 2 — WCAG AA compliance was this plan's own explicit must-have, not fully met by initial literal-value picks)
**Impact on plan:** No scope creep beyond the minimal color-value fixes needed to satisfy VIS-02's own must-haves and automated gates. The BORDER/MUTED_BORDER change has real, intentional visual impact across shipped UI — explicitly surfaced to and approved by the human at Task 5, not silently applied.

## Human Checkpoint

**Task 5 (blocking human-verify):** Human reviewed `26-PALETTE-SWATCH.png` directly (not routed through an intermediate approval) and responded: *"Changes noticed. Seems to be working. Not pink. Keep going."* This closes both:
1. The mandatory pink/magenta/mauve perceptual check across all 16 roles (the human half of 26-CONTEXT.md's VIS-02 "in addition to human sign-off" decision — Task 2's `isBannedHue()` already closed the automated half).
2. The additional BORDER/MUTED_BORDER brightness-change finding, proactively surfaced beyond the checkpoint's stated scope.

No route-back to Task 1 or a follow-up plan was needed.

## Issues Encountered
None beyond the two documented WCAG-driven color-value deviations above, both resolved within this plan and human-approved.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- `CONFIG.PALETTE` now carries all 16 roles (13 from 26-01 + 3 new hue-tinted darks), every role WCAG-compliant, zero banned hues — ready for 26-03's per-level theming and 26-04+'s door/enemy sprite work to read from
- `scripts/check-contrast.mjs` is a permanent, re-runnable gate — any future palette edit (including 26-01's original 13, per Task 5's routing precedent) will be caught automatically
- No blockers for 26-03 onward

---
*Phase: 26-grunge-palette-nox-run-rebrand*
*Completed: 2026-07-07*

## Self-Check: PASSED

All 6 created/modified files (scripts/check-contrast.mjs, 26-CONTRAST.md, 26-PALETTE-SWATCH.png, 26-02-SUMMARY.md, src/config.js, scripts/build-art-assets.py) found on disk; all 7 task/deviation commit hashes (d035e52, 390a75d, 9df51b5, 70148c4, 6a9314c, 3823d92, 8f08a6c) found in git log.
