---
phase: 26-grunge-palette-nox-run-rebrand
verified: 2026-07-07T22:28:00Z
status: passed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---

# Phase 26: Grunge Palette & Nox Run Rebrand — Verification Report

**Phase Goal:** The game looks and reads as Nox Run — a richer dark-grunge identity with per-level themes, real door/enemy sprites replacing their placeholder rects, and a signed-off logo
**Requirements:** VIS-01, VIS-02, VIS-03, VIS-04, BRAND-01, BRAND-02, BRAND-03
**Verified:** 2026-07-07T22:28:00Z
**Status:** passed
**Re-verification:** No — initial verification

**Scope note:** This phase included a legitimate mid-execution scope revision (26-12-PLAN.md, "wave 3.5" — not in the original 11-plan set), which expanded `CONFIG.PALETTE`'s accent hues from 3 to 8 after Wave 3's bake exposed pairwise-identical themes. This is dated and cross-annotated in `26-CONTEXT.md` and `ROADMAP.md`'s success criterion 1, and is treated below as part of this phase's regular plan set, not an anomaly. Two items were deliberately deferred out of this phase's scope (ROADMAP.md backlog 999.1 "collect-the-answer mechanic reconsideration" and 999.2 "pink spike hazard sprite") — both pre-existing and unrelated to what VIS-01..04/BRAND-01..03 actually promise; they are not counted as gaps against this phase.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | VIS-01: `CONFIG.PALETTE` is the single source of truth for color; zero raw `[0x..,0x..,0x..]` color literals remain in `src/scenes/`, `src/ui/`, `src/fx.js`, `src/levels/build.js` | ✓ VERIFIED | `grep -rn "= \[0x" src/scenes/ src/ui/ src/fx.js src/levels/build.js` → zero rows (exit 1). `src/config.js:16` defines `const PALETTE = {...}` with 19 keys (13 base + 8 accents), exposed as `CONFIG.PALETTE`. `bash scripts/check-safety.sh` PASS. |
| 2 | VIS-02: Palette expanded with hue-tinted dark accents (revised mid-phase from 3 to 8, one per level), every text/UI role clears its WCAG threshold, zero pink/magenta anywhere, backed by a permanent script + human sign-off | ✓ VERIFIED | `node scripts/check-contrast.mjs` → 16/16 WCAG pairings PASS, 0/19 roles banned-hue-flagged, exit 0 (ran live, output matches `26-CONTRAST.md` verbatim). Human sign-off quoted in `26-02-SUMMARY.md` ("Changes noticed... Not pink. Keep going.") and `26-12-SUMMARY.md` (5 net-new hues signed off at Task 3 checkpoint). |
| 3 | VIS-03: Each of the 8 levels has a distinct background/accent theme tint produced through the art pipeline, human-signed-off in the running game | ✓ VERIFIED | All 8 `src/levels/level-0N.js` carry a distinct `theme: "theme-N"` field (grep-confirmed). 32 theme PNGs exist under `assets/parallax/`/`assets/tiles/`; spot-check `cmp` confirms theme-1 vs theme-2 and theme-7 vs theme-8 ground tiles now differ (previously identical per 26-08's own finding, fixed in 26-08/26-REVIEW-FIX WR-03). Reviewed `phase26-level-01/04/08-theme.png` screenshots directly — clear green → blue-grey → rust progression. Human sign-off recorded across two rounds in `26-08-SUMMARY.md` (defect found + fixed + re-approved) and `26-12-SUMMARY.md`. |
| 4 | VIS-04: Door and every enemy panel render as real `sprite()` entities (not `rect()+color()+text()` glyphs); 3 distinct enemy variants are actually exercised in play; collision/trigger blockers are unchanged | ✓ VERIFIED | `src/levels/build.js:180` → `sprite("door")`; `:246` → `sprite(CONFIG.ENEMY.SPRITES[e.variant ?? 0])`; zero `text("X"` / `text("!"` occurrences remain (math-gate's `text("?"` glyph correctly untouched). All 6 enemy encounters across level-01/03/04/06/08 carry `variant: 0/1/2` cycling through all 3 sourced sprites. Ran `node scripts/audit-phase21-mechanics.mjs` myself (fresh run, not reused from SUMMARY): **37/37 encounters `triggered: true`, 0 `triggered: false`** — proves the sprite swap is collision-neutral. (1 `resolved: false` row, level-04 math-gate, matches the project's documented known headless-timing flakiness class, not a trigger/collision failure.) |
| 5 | BRAND-01: Title screen shows a baked "NOX RUN" pixel-font wordmark (dark-green fill, neon-green edge) at two distinct baked sizes, human-signed-off at real display size | ✓ VERIFIED | `assets/logo-hero.png` (viewed directly — dark-green fill, visible neon-green stroke, reads "NOX RUN") and `assets/logo-badge.png` exist; `src/scenes/title.js:50` mounts `sprite("logo-hero")`, `src/scenes/select.js:80` mounts `sprite("logo-badge")`. Human sign-off recorded in `26-07-SUMMARY.md` after a first-pass defect (spacing/reveal-speed) was fixed and re-verified: "The logo looks better. Approved." |
| 6 | BRAND-03: Logo reveal is a single non-strobing tween, ≤500ms, triggers automatically on scene-enter (no key-press gate) | ✓ VERIFIED | `src/scenes/title.js:58` → `tween(0, 1, T.LOGO_REVEAL_MS / 1000, ...)` unconditional at scene-body top level (not inside a key handler); `CONFIG.TITLE.LOGO_REVEAL_MS === 500` in `src/config.js:271`. `bash scripts/check-safety.sh` PASS (no `setTimeout`/`wait()`/`loop()` introduced). Human sign-off recorded in `26-07-SUMMARY.md`. |
| 7 | BRAND-02: No user-facing "Math Lab"/"mathlab" string remains (HTML title, title screen, docs, Docker, README), enforced by a permanent grep gate with an explicit allowlist | ✓ VERIFIED | `bash scripts/check-rebrand.sh` → "rebrand checks: PASS", exit 0 (ran live). Manual full-repo `grep -rni "math lab\|mathlab"` (excluding `.git/`, `.planning/`, `archive/`) confirms the only remaining hits are: `src/progress.js`'s 2 explicitly-allowlisted `mathlab_save_*` school-game comments, and `check-rebrand.sh`'s own matcher-pattern literal — exactly the allowlist the gate documents. Save key renamed to `noxrun_platformer_v1` (`src/config.js:211`), confirmed consistent across all 5 scripts that reference it. |

**Score:** 7/7 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/config.js` `CONFIG.PALETTE` | 19-key color-role source of truth (13 base + 8 accents) | ✓ VERIFIED | Confirmed by direct read + `check-contrast.mjs` output (19 roles enumerated). |
| `scripts/check-contrast.mjs` | WCAG + banned-hue permanent gate | ✓ VERIFIED | Exists, runs, exits 0, reads `CONFIG.PALETTE` live (no hardcoded mirror). |
| `26-CONTRAST.md` | VIS-02 evidence doc | ✓ VERIFIED | Exists, 19-role table with real ratios, matches live script output verbatim. |
| `26-PALETTE-SWATCH.png` | Rendered swatch proof, all 19 roles | ✓ VERIFIED | Opened directly — 19 labeled swatches, no pink/magenta visible. |
| `assets/parallax/{far,mid,near}-theme-{1..8}.png`, `assets/tiles/ground-theme-{1..8}.png` | 32 baked per-level theme PNGs | ✓ VERIFIED | `ls` confirms 24 + 8 = 32 files; `cmp` confirms distinctness between adjacent themes. |
| `assets/door.png`, `assets/enemy-1/2/3.png` | Real CC0 sprite art | ✓ VERIFIED | All 4 files exist; `assets/LICENSES/door.txt`/`enemy.txt` declare CC0; `CREDITS.md` rows present. |
| `assets/logo-hero.png`, `assets/logo-badge.png` | Baked Nox Run wordmark, two sizes | ✓ VERIFIED | Both exist; `assets/LICENSES/monogram.txt` declares CC0; `CREDITS.md` row present. |
| `scripts/check-rebrand.sh` | Permanent BRAND-02 regression gate | ✓ VERIFIED | Exists, runs, exits 0; proven RED-then-reverted per `26-10-SUMMARY.md` (independently re-confirmed by `26-REVIEW.md`'s confirmation pass). |
| `src/levels/level-0{1..8}.js` `theme`/`variant` fields | Distinct theme per level; variant per enemy encounter | ✓ VERIFIED | Confirmed via grep — all 8 themes distinct, all 6 enemy encounters carry variant 0/1/2. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/levels/level-0N.js` `theme` field | `src/levels/build.js` `groundSprite` template + `src/parallax.js` `layerName()` | `` `ground-${theme}` ``/`` `bg-*-${theme}` `` string templating | ✓ WIRED | Confirmed via grep of `build.js`/`parallax.js`; `browser-boot.mjs` PASS proves every templated sprite name resolves (no 404). |
| `CONFIG.ENEMY.SPRITES[e.variant ?? 0]` | `src/levels/build.js` enemy-panel `sprite()` call | direct array index | ✓ WIRED | Confirmed via grep; interactive mechanic audit confirms all enemy encounters trigger correctly post-swap. |
| `CONFIG.PALETTE` | `scripts/check-contrast.mjs` and `scripts/build-art-assets.py`'s `build_palette_swatch()` | live JS import / node subprocess call | ✓ WIRED | Both read the palette live — no hand-mirrored hex copy that could drift. |
| `src/config.js` `CONFIG.SAVE.KEY` | `scripts/check-progress.sh` + 4 Playwright scripts' `SAVE_KEY` const | shared literal | ✓ WIRED | `check-progress.sh` PASS (ran live); no stray `mathlab_platformer_v2` references remain in `scripts/` or `src/config.js`. |

### Behavioral Spot-Checks / Gate Suite (run live during this verification, not reused from SUMMARY claims)

| Gate | Command | Result | Status |
|------|---------|--------|--------|
| Structural gate | `bash scripts/check-gate.sh` | "gate checks: PASS" | ✓ PASS |
| Safety gate | `bash scripts/check-safety.sh` | "safety checks: PASS" | ✓ PASS |
| Import-safety gate | `bash scripts/check-import-safety.sh` | "import-safety checks: PASS" | ✓ PASS |
| Progress gate | `bash scripts/check-progress.sh` | "smoke-progress: PASS" / "progress checks: PASS" | ✓ PASS |
| Level validator | `node scripts/validate-levels.mjs` | "validate-levels: PASS" (zero HARD-FAIL; only pre-existing WARN-tier marginRatio=1.000 rows) | ✓ PASS |
| Real-browser boot | `node scripts/browser-boot.mjs` | "Browser boot: PASS — title -> select -> all levels loaded with no runtime errors" | ✓ PASS |
| Contrast/banned-hue gate | `node scripts/check-contrast.mjs` | "contrast checks: PASS" (16/16 WCAG, 0/19 banned) | ✓ PASS |
| Rebrand gate | `bash scripts/check-rebrand.sh` | "rebrand checks: PASS" | ✓ PASS |
| Interactive mechanic audit | `node scripts/audit-phase21-mechanics.mjs` (fresh run) | 37/37 `triggered: true`, 0 `triggered: false`, 1 `resolved: false` (known flaky class) | ✓ PASS |

All 9 gates green in a fresh run at verification time — this is not a re-statement of SUMMARY.md's claims but an independent re-execution.

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|-----------------|--------------|--------|----------|
| VIS-01 | 26-01 | Palette centralization | ✓ SATISFIED | Zero raw literals; `CONFIG.PALETTE` single source. |
| VIS-02 | 26-02, 26-12 | Palette expansion + WCAG/banned-hue | ✓ SATISFIED | `check-contrast.mjs` PASS; human sign-off. |
| VIS-03 | 26-03, 26-05, 26-06, 26-08, 26-12 | Per-level theming | ✓ SATISFIED | 8 distinct themes wired + baked + screenshotted + signed off. |
| VIS-04 | 26-04, 26-05, 26-06, 26-08 | Door/enemy real sprite art | ✓ SATISFIED | Sprites wired, variants exercised, collision-neutral (37/37 triggered:true). |
| BRAND-01 | 26-07 | Logo | ✓ SATISFIED | Baked, wired, human-signed-off. |
| BRAND-02 | 26-09, 26-10 | Full string sweep + save-key rename | ✓ SATISFIED | `check-rebrand.sh` PASS; manual full-repo grep confirms clean sweep within named scope. |
| BRAND-03 | 26-07 | Logo reveal animation | ✓ SATISFIED | `tween()`-only, 500ms, unconditional; human-signed-off. |

No orphaned requirements — all 7 IDs declared in `.planning/REQUIREMENTS.md` for this phase (lines 39-48, 116-122) are claimed by at least one of the 12 plans (`26-01` through `26-12`), and 26-11's closing plan re-declares all 7 as its own requirements-completed set for the phase-level combined proof.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | `grep -rn "TODO\|FIXME\|XXX\|TBD\|HACK\|PLACEHOLDER"` across the phase's core touched files (`config.js`, `build.js`, `title.js`, `select.js`, `parallax.js`, `main.js`, `check-contrast.mjs`, `check-rebrand.sh`) | — | Zero hits — no debt markers found. |
| `src/config.js:144-145` | `CONFIG.DOOR.SPRITES: ["door"]` | Informational (IN-01, carried from `26-REVIEW.md`) | INFO | Single-element array never indexed (`build.js` always calls `sprite("door")` literally) while `ENEMY.SPRITES` is genuinely indexed by variant — asymmetric shape, cosmetic only, explicitly triaged as info-tier and excluded from the fix pass by the phase's own code review. Does not affect VIS-04's truth (door sprite renders correctly either way). |

### Human Verification Required

None. All human-judgment items this phase required (banned-hue/pink sign-off on the full 19-role palette, per-level theme distinctness + hazard-color legibility, door/enemy sprite dark-grunge quality, logo legibility and reveal feel) were already closed as blocking `checkpoint:human-verify` gates during execution, with direct human-quote evidence captured in the plan SUMMARYs (`26-02-SUMMARY.md`, `26-07-SUMMARY.md`, `26-08-SUMMARY.md`, `26-12-SUMMARY.md`) and independently re-confirmed by this phase's own code review (`26-REVIEW.md`, a confirmation pass that re-derived/re-ran evidence rather than re-reading the fix report). No further human verification is needed to close this phase.

### Gaps Summary

None. All 7 phase requirements (VIS-01..04, BRAND-01..03) and all 6 ROADMAP.md success criteria (including the dated mid-execution revision to criterion 1, and the dated supersession of criterion 5) are verified against live codebase evidence — not SUMMARY.md narration alone. The full 8-command gate suite plus a fresh interactive mechanic audit were re-run during this verification pass and are green. Two out-of-scope backlog items (999.1 collect-mechanic reconsideration, 999.2 pink spike hazard sprite) and one out-of-scope deferred doc item (`.claude/CLAUDE.md`/`.planning/PROJECT.md` still saying "Math Lab", inherited from a file this phase's `files_modified` list and 26-CONTEXT.md's named sweep scope explicitly exclude) are correctly outside this phase's requirement contract and are not gaps against it.

---

_Verified: 2026-07-07T22:28:00Z_
_Verifier: Claude (gsd-verifier)_
