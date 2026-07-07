# Phase 26 Plan 02: WCAG Contrast + Banned-Hue Evidence (VIS-02)

**This document is the VIS-02 sign-off evidence artifact** referenced by 26-VALIDATION.md. It records the full `CONFIG.PALETTE` role table, the real (not hand-written) output of `scripts/check-contrast.mjs`, and the banned-hue guardrail result.

**Updated by Plan 26-12** (mid-execution revision, 2026-07-07): 5 new accent hues (ACCENT_FERN, ACCENT_TEAL, ACCENT_STEEL, ACCENT_CLAY, ACCENT_EMBER) added, expanding the accent set from 3 to 8 (one dedicated accent per level). The original 3 accents (MOSS/SLATE/RUST) and all other roles are byte-unchanged from 26-02's values, reused as-is.

## 1. CONFIG.PALETTE role table (19 roles)

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
| ACCENT_FERN | `#4a7058` | 74, 112, 88 |
| ACCENT_TEAL | `#457070` | 69, 112, 112 |
| ACCENT_SLATE | `#4e6478` | 78, 100, 120 |
| ACCENT_STEEL | `#525e82` | 82, 94, 130 |
| ACCENT_CLAY | `#705a48` | 112, 90, 72 |
| ACCENT_RUST | `#8c5036` | 140, 80, 54 |
| ACCENT_EMBER | `#a8502c` | 168, 80, 44 |

BORDER, MUTED_BORDER, ACCENT_MOSS, ACCENT_SLATE, and ACCENT_RUST were adjusted from their initial values during Plan 26-02's execution — see Section 3 ("Deviations from initial values"). ACCENT_STEEL was adjusted from its initial Plan 26-12 pick (`#4a5668`, ~2.66:1) to `#525e82` (~3.09:1) — see Section 3a.

## 2. `scripts/check-contrast.mjs` real output (verbatim)

Run via `node scripts/check-contrast.mjs` against the final `CONFIG.PALETTE` in `src/config.js` (Plan 26-12, post-8-accent-expansion):

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
ACCENT_FERN | ACCENT_FERN-on-BG | 3.54 | 3 | PASS
ACCENT_TEAL | ACCENT_TEAL-on-BG | 3.59 | 3 | PASS
ACCENT_SLATE | ACCENT_SLATE-on-BG | 3.22 | 3 | PASS
ACCENT_STEEL | ACCENT_STEEL-on-BG | 3.09 | 3 | PASS
ACCENT_CLAY | ACCENT_CLAY-on-BG | 3.06 | 3 | PASS
ACCENT_RUST | ACCENT_RUST-on-BG | 3.13 | 3 | PASS
ACCENT_EMBER | ACCENT_EMBER-on-BG | 3.63 | 3 | PASS

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
ACCENT_FERN | #4a7058 | ok
ACCENT_TEAL | #457070 | ok
ACCENT_SLATE | #4e6478 | ok
ACCENT_STEEL | #525e82 | ok
ACCENT_CLAY | #705a48 | ok
ACCENT_RUST | #8c5036 | ok
ACCENT_EMBER | #a8502c | ok
banned-hue guardrail: 0 flagged

contrast checks: PASS
exit:0
```

## 3. Banned-hue guardrail result

**0 of 19 `CONFIG.PALETTE` roles flagged** by `isBannedHue()` (both `(r - g) > 20` AND `(b - g) > 20`). This is the automated half of 26-CONTEXT.md's VIS-02 decision ("Add an explicit, checked banned-hue guardrail against magenta/pink... in addition to human sign-off"). The human half was closed for the original 16 roles by Plan 26-02's Task 5 checkpoint; Plan 26-12's Task 3 checkpoint closes the human half for the 5 net-new accent hues only (ACCENT_FERN/TEAL/STEEL/CLAY/EMBER) against the regenerated swatch proof (`26-PALETTE-SWATCH.png`).

## 3a. ACCENT_STEEL deviation (Plan 26-12)

Plan 26-12's Task 1 initial literal pick for ACCENT_STEEL (`#4a5668`) measured ~2.66:1 against BG, below the 3.0:1 threshold. Brightened to `#525e82` (~3.09:1), keeping the intended "cooler/darker blue-grey than slate" character (more blue-dominant, R−B gap wider than ACCENT_SLATE's). Zero downstream consumers existed until Task 4 (theme reassignment), so this was a safe same-plan correction, matching the pattern 26-02 used for the original 3 accents.

## 4. Deviations from initial values (auto-fixed during plan execution)

All deviations are documented in full in `26-02-SUMMARY.md` and `26-12-SUMMARY.md`. Summary for evidence purposes:

1. **ACCENT_MOSS / ACCENT_SLATE / ACCENT_RUST** (Plan 26-02) — Task 1's initial literal hex picks (`#2a3d2a` / `#2c3844` / `#5a3322`) measured ~1.66–1.82:1 against BG, below the 3.0:1 threshold. Brightened to the values in the table above (~3.13–3.22:1). Zero downstream consumers existed at the time of the fix (per-level theming was a later Phase 26 plan), so this was a safe same-plan correction.
2. **BORDER / MUTED_BORDER** (Plan 26-02) — pre-existing tokens (established before this phase, used broadly across already-shipped/reviewed UI panels) initially measured 1.57:1 / 2.66:1 against BG, below the 3.0:1 threshold. Brightened from `#333333` / `#555555` to `#5e5e5e` / `#707070` (~3.05:1 / ~4.00:1). **This is a real, visible brightness change to previously human-signed-off UI borders across the whole game** (title/challenge/mathGate panel borders, select.js locked-tile border) — flagged explicitly for human review at Plan 26-02's Task 5 checkpoint, in addition to the mandatory pink/magenta sign-off.
3. **ACCENT_STEEL** (Plan 26-12) — see Section 3a above.

## 5. VIS-02 sign-off status

- Automated WCAG threshold check: **PASS** (16/16 role pairings clear their threshold, up from 11/11 — 5 new accent rows added by Plan 26-12).
- Automated banned-hue guardrail: **PASS** (0/19 roles flagged, up from 0/16).
- Human sign-off, original 16 roles (Plan 26-02 Task 5, against the pre-26-12 swatch): **closed** — "Changes noticed. Seems to be working. Not pink. Keep going."
- Human sign-off, 5 net-new accent hues (Plan 26-12 Task 3, against the regenerated `26-PALETTE-SWATCH.png`): recorded once Task 3 closes.
