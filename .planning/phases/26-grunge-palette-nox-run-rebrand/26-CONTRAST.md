# Phase 26 Plan 02: WCAG Contrast + Banned-Hue Evidence (VIS-02)

**This document is the VIS-02 sign-off evidence artifact** referenced by 26-VALIDATION.md. It records the full `CONFIG.PALETTE` role table, the real (not hand-written) output of `scripts/check-contrast.mjs`, and the banned-hue guardrail result.

## 1. CONFIG.PALETTE role table (16 roles)

| Role | Hex | RGB |
|------|-----|-----|
| BG | `#0a0a0a` | 10, 10, 10 |
| SURFACE | `#141414` | 20, 20, 20 |
| SURFACE_ALT | `#1e1e1e` | 30, 30, 30 |
| SURFACE_UNLOCKED | `#111111` | 17, 17, 17 |
| BORDER | `#5e5e5e` | 94, 94, 94 |
| MUTED | `#444444` | 68, 68, 68 |
| MUTED_BORDER | `#707070` | 112, 112, 112 |
| TEXT | `#e8e8e8` | 232, 232, 232 |
| TEXT_DIM | `#888888` | 136, 136, 136 |
| DANGER | `#ff4433` | 255, 68, 51 |
| REWARD | `#00ff88` | 0, 255, 136 |
| CLEARED | `#66ccff` | 102, 204, 255 |
| CURSOR | `#ffffff` | 255, 255, 255 |
| ACCENT_MOSS | `#476847` | 71, 104, 71 |
| ACCENT_SLATE | `#4e6478` | 78, 100, 120 |
| ACCENT_RUST | `#8c5036` | 140, 80, 54 |

BORDER, MUTED_BORDER, ACCENT_MOSS, ACCENT_SLATE, and ACCENT_RUST were adjusted from their initial values during this plan's execution — see Section 3 ("Deviations from initial values").

## 2. `scripts/check-contrast.mjs` real output (verbatim)

Run via `node scripts/check-contrast.mjs` against the final `CONFIG.PALETTE` in `src/config.js` (commit `6a9314c`):

```
=== WCAG contrast ratios ===
role | pairing | ratio | threshold | pass/fail
TEXT | TEXT-on-SURFACE | 15.04 | 4.5 | PASS
TEXT | TEXT-on-BG | 16.16 | 4.5 | PASS
TEXT_DIM | TEXT_DIM-on-BG | 5.58 | 4.5 | PASS
REWARD | REWARD-on-BG | 14.76 | 4.5 | PASS
DANGER | DANGER-on-BG | 5.78 | 4.5 | PASS
CLEARED | CLEARED-on-SURFACE_UNLOCKED | 10.47 | 3 | PASS
MUTED_BORDER | MUTED_BORDER-on-BG | 4.00 | 3 | PASS
BORDER | BORDER-on-BG | 3.05 | 3 | PASS
ACCENT_MOSS | ACCENT_MOSS-on-BG | 3.15 | 3 | PASS
ACCENT_SLATE | ACCENT_SLATE-on-BG | 3.22 | 3 | PASS
ACCENT_RUST | ACCENT_RUST-on-BG | 3.13 | 3 | PASS

=== Banned-hue guardrail (magenta/pink/mauve) ===
role | hex | banned?
BG | #0a0a0a | ok
SURFACE | #141414 | ok
SURFACE_ALT | #1e1e1e | ok
SURFACE_UNLOCKED | #111111 | ok
BORDER | #5e5e5e | ok
MUTED | #444444 | ok
MUTED_BORDER | #707070 | ok
TEXT | #e8e8e8 | ok
TEXT_DIM | #888888 | ok
DANGER | #ff4433 | ok
REWARD | #00ff88 | ok
CLEARED | #66ccff | ok
CURSOR | #ffffff | ok
ACCENT_MOSS | #476847 | ok
ACCENT_SLATE | #4e6478 | ok
ACCENT_RUST | #8c5036 | ok
banned-hue guardrail: 0 flagged

contrast checks: PASS
exit:0
```

## 3. Banned-hue guardrail result

**0 of 16 `CONFIG.PALETTE` roles flagged** by `isBannedHue()` (both `(r - g) > 20` AND `(b - g) > 20`). This is the automated half of 26-CONTEXT.md's VIS-02 decision ("Add an explicit, checked banned-hue guardrail against magenta/pink... in addition to human sign-off"). The human half is closed by this plan's Task 5 checkpoint against the rendered swatch proof (`26-PALETTE-SWATCH.png`).

## 4. Deviations from initial values (auto-fixed during this plan)

Both deviations are documented in full in `26-02-SUMMARY.md`. Summary for evidence purposes:

1. **ACCENT_MOSS / ACCENT_SLATE / ACCENT_RUST** — Task 1's initial literal hex picks (`#2a3d2a` / `#2c3844` / `#5a3322`) measured ~1.66–1.82:1 against BG, below the 3.0:1 threshold. Brightened to the values in the table above (~3.13–3.22:1). Zero downstream consumers existed at the time of the fix (per-level theming is a later Phase 26 plan), so this was a safe same-plan correction.
2. **BORDER / MUTED_BORDER** — pre-existing tokens (established before this phase, used broadly across already-shipped/reviewed UI panels) initially measured 1.57:1 / 2.66:1 against BG, below the 3.0:1 threshold. Brightened from `#333333` / `#555555` to `#5e5e5e` / `#707070` (~3.05:1 / ~4.00:1). **This is a real, visible brightness change to previously human-signed-off UI borders across the whole game** (title/challenge/mathGate panel borders, select.js locked-tile border) — flagged explicitly for human review at this plan's Task 5 checkpoint, in addition to the mandatory pink/magenta sign-off.

## 5. VIS-02 sign-off status

- Automated WCAG threshold check: **PASS** (11/11 role pairings clear their threshold).
- Automated banned-hue guardrail: **PASS** (0/16 roles flagged).
- Human sign-off (Task 5 checkpoint, against `26-PALETTE-SWATCH.png`): **pending** — required before VIS-02 is considered fully closed per 26-CONTEXT.md's "in addition to human sign-off" instruction.
