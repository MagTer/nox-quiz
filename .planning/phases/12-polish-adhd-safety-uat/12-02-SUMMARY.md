---
phase: 12-polish-adhd-safety-uat
plan: 02
subsystem: ui-polish-safety
status: complete
tags: [hud, controls-hint, adhd-safety, uat, contrast, kaplay]
requires:
  - "CONFIG.HINT (12-00)"
  - "mountHud factory (11)"
  - "scripts/check-safety.sh (12-00)"
provides:
  - "Persistent always-visible corner controls hint (SAFE-02)"
  - "Kid-UAT sign-off checklist 12-UAT.md (SAFE-03 + feel)"
  - "Full ADHD-safety audit green end-to-end"
affects:
  - "src/ui/hud.js"
tech-stack:
  added: []
  patterns:
    - "fixed() + z() + 'hud'-tagged canvas text() overlay (reused HUD badge idiom)"
    - "static-literal canvas text — no DOM sink, no injection path"
key-files:
  created:
    - ".planning/phases/12-polish-adhd-safety-uat/12-UAT.md"
  modified:
    - "src/ui/hud.js"
decisions:
  - "Mounted the persistent hint inside the mountHud factory (shares HUD replay-teardown) rather than the scene, matching the plan's files_modified and the badge idiom."
  - "Hint copy kept as '← → move · SPACE jump' (arrow glyphs); documented LEFT/RIGHT tofu fallback in-code, preserving the 'SPACE jump' audit substring."
  - "SAFE-03 contrast pass: no code changes needed — palette already CLAUDE.md-compliant (HUD neon-green #00ff88, gate text default-white on #141414 panel, new hint #e8e8e8 ~18:1 on #0a0a0a). Verified by reading every color() call across src/ui/."
metrics:
  duration: "~6 min"
  completed: "2026-06-28"
  tasks: 3
  files: 2
---

# Phase 12 Plan 02: Persistent Controls Hint + Kid-UAT Checklist Summary

Mounted an always-visible bottom-left controls hint ("← → move · SPACE jump") as a replay-safe `fixed()` Kaplay `text()` overlay inside the `mountHud` factory, and authored the kid-UAT sign-off checklist (12-UAT.md) — turning the last red positive in `scripts/check-safety.sh` green so the whole-game ADHD-safety audit now passes end-to-end.

## What was built

- **SAFE-02 — persistent controls hint** (`src/ui/hud.js`): one extra `add([...])` inside the `mountHud` factory closure — `text("← → move · SPACE jump", { size: CONFIG.HINT.SIZE })`, `pos(CONFIG.HINT.X, CONFIG.HINT.Y)` (bottom-left, X:16/Y:330, clear of the top-left badge/bar), `color(0xe8,0xe8,0xe8)`, `fixed()`, `z(9000)`, tag `"hud"`. Always visible (no tween/scheduler — persistent, never timed away). Static literal, pure canvas, no DOM sink. Tagged `"hud"` so it tears down on scene replay (anti-leak); no module-level singleton.
- **SAFE-03 — contrast / over-stimulation pass** (manual audit): reviewed every `color()` call across `src/ui/`. Palette is already CLAUDE.md-compliant and high-contrast on the #0a0a0a stage — HUD/badge/fill neon-green `#00ff88`, gate question/answer text default-white on the `#141414`/`#1e1e1e` panel, level-up + clear flashes neon-green, new hint `#e8e8e8` (~18:1). All juice magnitudes in `CONFIG.FX` are subtle/brief/one-fade (easeOutQuad, non-strobing). **No readability code changes were required.**
- **12-UAT.md** — the kid sign-off checklist (`status: testing`): 7 items (JUICE-01/02/03, SAFE-01 no-time-pressure+forgiving, SAFE-02 hint visible/readable, SAFE-03 contrast+not-over-stimulating, overall feel/framing), each with a one-line how-to-test, the HTTP-serve launch path, and a user-with-kid sign-off line.

## Kid-UAT items (for the orchestrator's human-check)

These are perceptual/non-automatable and must be confirmed WITH THE KID on the Windows laptop (serve `python3 -m http.server 8000`, open `http://localhost:8000/`):

1. **JUICE-01** — jump/land squash + dust is subtle, not over-stimulating; jumps land fair.
2. **JUICE-02** — coin collect gives a quick pop+fade, not jarring.
3. **JUICE-03** — level-clear burst (on LEVEL CLEAR + level-up flash) is brief, NON-strobing.
4. **SAFE-01** — nothing time-pressures; wrong answers never punish (forgiving). (Also auto-confirmed by check-safety.sh.)
5. **SAFE-02** — the corner hint "← → move · SPACE jump" is visible/readable; arrow glyphs render (else LEFT/RIGHT fallback).
6. **SAFE-03** — text/sprites/HUD read clearly on #0a0a0a; effects calm; kid not overwhelmed.
7. **Overall feel** — "reads like a real game"; she enjoys it; controls obvious; nothing stressful.

## Verification

- `bash scripts/check-safety.sh` → **safety checks: PASS** (no-timer + forgiving across src/, SAFE-02 "SPACE jump" positive green, fx.js onEnd positive green).
- `bash scripts/check-progress.sh` → **progress checks: PASS** (Phase 11 one-way HUD contract + firewall intact — the static hint added no write-back).
- `node scripts/smoke-progress.mjs` → **smoke-progress: PASS**.
- `node --check` clean on all five touched modules (fx.js, player.js, scenes/game.js, ui/hud.js, config.js).

## Deviations from Plan

None — plan executed as written. Task 3 was the explicit per-phase merge gate and required no code change beyond Task 1 (no empty commit created; its green state is captured in the Task 1 commit and re-verified). SAFE-03 required no code adjustments because the existing palette already meets the contrast mandate (documented above).

## Known Stubs

None.

## Commits

- `e97b17a` feat(12-02): mount persistent corner controls hint (SAFE-02)
- `b5f2c92` docs(12-02): author kid-UAT sign-off checklist (SAFE-03 + feel)

## Self-Check: PASSED

All created/modified files exist on disk (src/ui/hud.js, 12-UAT.md, 12-02-SUMMARY.md) and both task commits (e97b17a, b5f2c92) are present in git history.
