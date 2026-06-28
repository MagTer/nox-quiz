---
phase: 12-polish-adhd-safety-uat
fixed_at: 2026-06-28T00:00:00Z
review_path: .planning/phases/12-polish-adhd-safety-uat/12-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 5
skipped: 1
status: partial
---

# Phase 12: Code Review Fix Report

**Fixed at:** 2026-06-28
**Source review:** .planning/phases/12-polish-adhd-safety-uat/12-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (WR-01, WR-02, WR-03, IN-01, IN-02, IN-03)
- Fixed: 5
- Skipped: 1 (IN-01 — review states "No fix required")

All edits validated with `node --check` per file. After all fixes, all three
gates are green:
- `bash scripts/check-safety.sh` → `safety checks: PASS`
- `bash scripts/check-progress.sh` → `progress checks: PASS`
- `node scripts/smoke-progress.mjs` → `smoke-progress: PASS`

Hard constraints verified intact:
- `src/fx.js` top level still touches NO Kaplay global — only `import { CONFIG }`
  and the plain `ACCENT_GREEN` array literal (confirmed via comment-stripped scan).
- No timer/scheduler tokens introduced (`setTimeout`/`setInterval`/`wait(`/`loop(`/
  `lifespan(`); effects still self-clean via `tween().onEnd(destroy)`.
- SAFE-02 persistent "SPACE jump" hint still present.
- Jump feel, firewalls, fire-once goal latch, single goal handler, respawn, and
  dark-grunge/no-pink palette untouched.

## Fixed Issues

### WR-01: level-clear burst rendered beneath the gate's opaque dim — invisible

**Files modified:** `src/config.js`, `src/fx.js`
**Commit:** 65ba170
**Applied fix:** `clearBurst()` mounted at `z(9400)`, below the gate-cleared
persistent dim at `z(9990)` (`GATE.DIM_OPACITY` 0.6), so the burst was occluded.
Added `CONFIG.FX.BURST_Z = 9993` and used `z(F.BURST_Z)` in `clearBurst()`. 9993
is the only slot above the 9990 dim and below the `LEVEL CLEAR` banner (z 9994),
so the burst now reads as a celebratory accent over the cleared level without
covering the banner text. Verified by z-ordering: 9990 (dim) < 9993 (burst) <
9994 (banner). Requires human verification of the visual feel during a clear.

### WR-02: concurrent un-cancelled player scale tweens fight → jitter

**Files modified:** `src/fx.js`
**Commit:** 056623f
**Applied fix:** Made the player squash/stretch animation single-flight. Capture
the tween controller on `obj._fxScaleTween` (no module-level state — anti-leak),
`.cancel()` any in-flight one before snapping to the new pose and starting the
replacement. The replacement tween always ends at (1,1), so an interrupted
settle still resolves to neutral. The handle is nulled on `onEnd` so a later
call never cancels a finished tween. This removes the per-frame last-writer-wins
fight that undercut the SAFE-03 non-strobing mandate. Requires human
verification of the rapid jump→land feel.

### WR-03: orphan scale tweens not cancelled on scene leave

**Files modified:** `src/scenes/game.js`
**Commit:** 8eddc4f
**Applied fix:** The squash/stretch tweens drive `player._fxScaleTween` (not an
`"fx"`-tagged object), so `destroyAll("fx")` on scene leave never reached them.
Merged the cancellation into the existing scene-leave fx sweep:
`onSceneLeave(() => { destroyAll("fx"); if (player.exists() && player._fxScaleTween) player._fxScaleTween.cancel(); })`.
Guarded by `player.exists()`. No tween can now outlive the player after a future
go()/replay.

### IN-02: coin pop footprint coupled to DUST_SIZE

**Files modified:** `src/config.js`, `src/fx.js`
**Commit:** 7f89ee2
**Applied fix:** Replaced `rect(F.DUST_SIZE * 3, ...)` in `pop()` with a dedicated
`CONFIG.FX.POP_SIZE = 9` (numerically identical to the old 3×3). Dust and pop
now tune independently.

### IN-03: clearBurst magic numbers (80, grow 4)

**Files modified:** `src/config.js`, `src/fx.js`
**Commit:** a4f2783
**Applied fix:** Promoted the hard-coded `rect(80, 80)` and grow factor to
`CONFIG.FX.BURST_SIZE = 80` and `CONFIG.FX.BURST_GROW = 4`. The scale formula is
now `1 + (F.BURST_GROW - 1) * v` (behaviour identical: still 1 → 4). Brings the
last FX magnitudes under the module's no-magic-numbers discipline.

## Skipped Issues

### IN-01: even `DUST_COUNT` produces a fractional `half`

**File:** `src/fx.js:90-96`
**Reason:** skipped — the review itself concludes "No bug today" and "No fix
required." The current `DUST_COUNT = 4` yields a symmetric spread; the float
`half` is intentional. No code change applied to avoid touching working,
correctly-symmetric dust math for a non-defect. (The review suggested only an
optional one-line clarifying comment; left as-is to keep the change set scoped
to real defects per the task constraints.)

---

_Fixed: 2026-06-28_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
