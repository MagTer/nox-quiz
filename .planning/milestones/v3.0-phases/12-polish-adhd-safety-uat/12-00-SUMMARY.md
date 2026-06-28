---
phase: 12-polish-adhd-safety-uat
plan: 00
subsystem: adhd-safety-audit
tags: [safety, audit, config, no-timer, forgiving, tooling]
requires: []
provides:
  - "scripts/check-safety.sh — SAFE-01 no-timer + forgiving whole-src audit gate"
  - "CONFIG.FX — juice tuning namespace (squash/stretch/dust/pop/burst)"
  - "CONFIG.HINT — persistent controls-hint position namespace"
affects:
  - "12-01 (juice) reads CONFIG.FX; its <automated> verification can invoke check-safety.sh"
  - "12-02 (hint) reads CONFIG.HINT; turns the SAFE-02 positive check green"
tech-stack:
  added: []
  patterns:
    - "comment-strip pre-pass (sed 's://.*$::') before every negative grep — whole-src audit that matches code, not prose"
    - "paren-aware no-timer matching ([^a-zA-Z]wait\\( / [^a-zA-Z]loop\\() so object properties (loop:) are not flagged"
    - "punishment-specific forgiving tokens only — never a broad xp-decrement, to spare the legitimate level-up carry-over"
key-files:
  created:
    - "scripts/check-safety.sh"
  modified:
    - "src/config.js"
decisions:
  - "Positive SAFE-02 hint check scans a comment-stripped view of src/ code, so a mere prose mention of the hint copy (e.g. the config.js doc comment) does NOT falsely satisfy the gate — only the actually-mounted hint string counts. This keeps it a real gate (red until Plan 02), not a no-op."
  - "fx.js onEnd self-clean check is guarded behind `[ -f src/fx.js ]` and skipped until Plan 01 creates the module — avoids a spurious hard-fail under set -euo pipefail."
metrics:
  duration: "~2 min"
  completed: 2026-06-28
  tasks: 2
  files: 2
status: complete
---

# Phase 12 Plan 00: Wave 0 — SAFE-01 Audit Gate + CONFIG.FX/HINT Summary

Stood up the one repeatable SAFE-01 ADHD-safety audit (`scripts/check-safety.sh`) and the `CONFIG.FX` / `CONFIG.HINT` tuning namespaces BEFORE any juice or hint code exists, so later waves reference a real audit and real config keys instead of magic numbers.

## What Was Built

**Task 1 — CONFIG.FX + CONFIG.HINT (`6cb06bf`)**
Appended two namespaces to `src/config.js`, mirroring the existing `HUD:`/`GATE:` nested-object-with-unit-comments style:
- `FX`: subtle/brief squash (1.15/0.85, 140ms), stretch (0.9/1.1, 120ms), dust (4 particles, 3px, 16px rise, 300ms), pop (1.5×, 220ms), and burst (400ms) values. A header comment notes every magnitude is deliberately subtle, brief, and non-strobing, and that `BURST_MS` (400) stays ≤ `HUD.FLASH_MS` (450) so the level-clear burst never out-stimulates the level-up flash (SAFE-03).
- `HINT`: `X:16, Y:330, SIZE:12` — bottom-left, deliberately clear of the top-left HUD badge/bar (`HUD.X:16/Y:16`).
- `config.js` still imports nothing (leaf module); no existing field touched (git diff is additions only).

**Task 2 — `scripts/check-safety.sh` (`79bd9b3`)**
A fail-fast (`set -euo pipefail`) whole-`src/` audit mirroring `scripts/check-progress.sh`:
- `ROOT="$(git rev-parse --show-toplevel)"` so it runs from any cwd; a `fail()` that prints `safety checks: FAIL — …` and exits 1.
- `strip_comments()` sed pre-pass run before EVERY negative scan.
- (0) `node --check` syntax gate per src module.
- (1) NEGATIVE no-timer (SAFE-01): paren-aware scan banning the scheduler/countdown call forms across all of src/.
- (2) NEGATIVE forgiving: punishment-specific tokens only (`gameOver|game_over|loseLife|lives--|subtractXp|deductXp|xpLoss|penaliz`).
- (3) POSITIVE SAFE-02 hint check (comment-stripped) — red until Plan 02.
- (4) POSITIVE fx.js `onEnd` self-clean — skipped until Plan 01 creates `src/fx.js`.
- Ends with `echo "safety checks: PASS"`. Banned literals live ONLY inside grep PATTERN strings, never as prose.

## Verification Performed

- `node --check src/config.js` clean; runtime import confirms `CONFIG.FX`/`CONFIG.HINT` have all required numeric keys.
- `bash -n scripts/check-safety.sh` parses; `grep -c strip_comments` = 4 (definition + uses); `git rev-parse --show-toplevel` present.
- Negative scans run CLEAN over the current tree (no-timer + forgiving) while a naive non-stripped grep was shown to false-positive on `hud.js` and `game.js` — proving the comment-strip is load-bearing.
- `src/progress.js:120` carry-over (`xp -= threshold(level);`) confirmed NOT matched by the forgiving pattern (exit 1).
- No banned token literal appears in any `#` prose comment line of the script.
- Running `bash scripts/check-safety.sh` against the current tree fails ONLY on the SAFE-02 positive hint check (exit 1) — the exact, spec'd, expected-until-Plan-02 gate behavior.

## Deviations from Plan

**1. [Rule 1 — Bug] SAFE-02 positive hint check made comment-aware**
- **Found during:** Task 2 verification.
- **Issue:** The RESEARCH/plan reference for check (3) used a raw `grep -Rq 'SPACE jump' "$ROOT/src"` that does NOT strip comments. Because Task 1's `CONFIG.HINT` comment documents the hint copy (`"… · SPACE jump …"`), the raw grep matched that prose and the gate printed `PASS` — a false green that would let the audit pass without the hint actually being mounted, contradicting the plan's "real gate, not a no-op" requirement.
- **Fix:** Replaced check (3) with a per-file loop that greps the comment-stripped view, so only the actually-mounted hint string in code satisfies the gate. The audit now correctly goes red until Plan 02.
- **Files modified:** `scripts/check-safety.sh`
- **Commit:** `79bd9b3`

**2. [Rule 2 — Correctness] Removed banned-token literals from a prose comment**
- **Found during:** Task 2 acceptance check ("banned literals only inside grep patterns, never prose").
- **Issue:** A header comment line spelled out scheduler literals as prose.
- **Fix:** Reworded the comment to reference "the call forms" / "the PATTERN below" without naming the literals.
- **Files modified:** `scripts/check-safety.sh`
- **Commit:** `79bd9b3`

(Both deviations were folded into the single Task 2 commit before it was made.)

## Known Stubs

None. The positive SAFE-02 / fx.js checks are intentional, plan-specified gates (red/skipped until Plans 01–02 land), documented inline with "expected until …" notes — not stubs.

## Self-Check: PASSED
- FOUND: src/config.js (CONFIG.FX + CONFIG.HINT)
- FOUND: scripts/check-safety.sh (executable, strip_comments present)
- FOUND commit: 6cb06bf (Task 1)
- FOUND commit: 79bd9b3 (Task 2)
