---
phase: 26-grunge-palette-nox-run-rebrand
plan: 08
subsystem: verification
tags: [playwright, screenshot, parallax, palette, human-verify]

# Dependency graph
requires:
  - phase: 26-05
    provides: "buildLevel() theme-aware ground sprite selection + makeParallaxLayers(bounds, theme) threading + real door/enemy sprite() panels"
  - phase: 26-06
    provides: "All 8 level descriptors carry a distinct theme: \"theme-N\" field + enemy variant fields cycling saw/barnacle/fly"
provides:
  - "scripts/screenshot-phase26.mjs — Playwright capture script (PORT 8770) producing 10 real in-browser screenshots (8 per-level theme shots + door/enemy close-ups on level-01), reusing scripts/lib/mechanic-drive.mjs's proven driveToXPlanned/resolveIfBoxed/deriveEncounters driver instead of a naive timed-hold approach"
  - "scripts/build-art-assets.py _mid_accent_sub() — fixes the mid parallax layer's silent 7/8-theme accent-drop bug found during this plan's own screenshot review"
  - "8 rebaked assets/parallax/mid-theme-{1..8}.png with genuinely distinct dominant fill colors (previously identical grey for themes 1-7)"
  - "Human sign-off closed on all 8 per-level themes + door/enemy sprite art (VIS-03, VIS-04), across two review rounds (pre-fix defect found + post-fix re-verification)"
  - "Backlog item 999.2 (pink spike hazard sprite) captured in ROADMAP.md — a separate, pre-existing, out-of-scope defect found during this plan's pixel-level verification"
affects: [28]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reusing scripts/lib/mechanic-drive.mjs's driveToXPlanned/resolveIfBoxed/deriveEncounters (already proven by browser-boot.mjs) for a NEW screenshot script, rather than a bespoke timed ArrowRight hold — a bare timer cannot account for mandatory gap-jumps or un-jumpable mechanic blockers sitting between spawn and a target sprite"
    - "In-page auto-resolve for collect.js's non-boxed challenge overlay: parse the displayed arithmetic text, find the matching answer-pickup-slot entity by value, reposition the player onto it directly via page.evaluate — a screenshot-cleanliness aid, not a gameplay-proof step (collectZone's real interactive resolution is already covered elsewhere)"
    - "_mid_accent_sub(): replace the top TWO luminance-ranked palette slots with accent-derived shades (a 0.8x-scaled darker tone + the accent itself) instead of one, so an accent-family color always wins _remap_luminance's dominant-pixel bucket regardless of the accent's own exact luma — more robust than _accent_sub's single-slot replacement for narrow-luma-range palettes"

key-files:
  created:
    - scripts/screenshot-phase26.mjs
  modified:
    - scripts/build-art-assets.py
    - assets/parallax/mid-theme-1.png
    - assets/parallax/mid-theme-2.png
    - assets/parallax/mid-theme-3.png
    - assets/parallax/mid-theme-4.png
    - assets/parallax/mid-theme-5.png
    - assets/parallax/mid-theme-6.png
    - assets/parallax/mid-theme-7.png
    - assets/parallax/mid-theme-8.png
    - .gitignore

key-decisions:
  - "PORT 8770, not the plan's stated 8768 — that port was already claimed by scripts/audit-phase21-mechanics.mjs (verified via grep before writing); 8769 is also already claimed by calibrate-jump-envelope.mjs"
  - "Departed from the plan's literal 'hold ArrowRight for ~4.3s / ~1.7s more' navigation prose (Rule 1 fix) — level-01's enemy/door sit behind a mandatory gap-jump and two mandatory math-gate/collect-zone encounters the timed-hold model didn't account for; reused the project's own proven geometry-informed driver instead"
  - "Mid-layer fix scoped EXACTLY to the mid sub-palette per explicit human instruction — far/near/ground/title/door/enemy/logo all keep the original _accent_sub unchanged, confirmed via rebake diff (only the 8 mid-theme-N.png files changed)"
  - "The near parallax layer shares the identical underlying _accent_sub defect (confirmed via the same pixel-luma investigation) but was deliberately left unfixed — out of scope for this checkpoint round per explicit instruction, not silently dropped (see Issues Encountered)"
  - "Pink spike hazard sprite finding (assets/spike.png, pre-existing v4.1 art) captured as ROADMAP.md backlog item 999.2 rather than fixed inline, per explicit human instruction to not expand this plan's scope"

requirements-completed: [VIS-03, VIS-04]

coverage:
  - id: D1
    description: "scripts/screenshot-phase26.mjs exists, runs standalone, and produces exactly 10 real in-browser PNG screenshots (8 per-level theme shots + door/enemy close-ups) with no runtime errors"
    requirement: "VIS-03"
    verification:
      - kind: automated_ui
        ref: "node scripts/screenshot-phase26.mjs && ls .planning/phases/26-grunge-palette-nox-run-rebrand/phase26-*.png | wc -l -> 10"
        status: pass
    human_judgment: false
  - id: D2
    description: "Human sign-off that all 8 per-level themes read as visibly distinct with a calm-to-harsh progression, hazard/reward colors stay legible on every theme, and the door/enemy sprites read as dark-grunge/edgy not bubbly or childish"
    requirement: "VIS-03"
    verification:
      - kind: manual_procedural
        ref: "Task 2 checkpoint, round 1: human + coordinator independently reviewed the pre-fix screenshots and confirmed a real defect (mid parallax layer not tinted for 7/8 themes); round 2: human + coordinator reviewed the post-fix screenshots and approved (level 1/4/6 mountain triangles now show clear distinct green/blue-grey/brown)"
        status: pass
    human_judgment: true
    rationale: "Visual/aesthetic judgment (distinctness, dark-grunge tone, no-pink/no-bubbly compliance) requires human eyes on real screenshots, not automation — this is the entire point of this plan per 26-RESEARCH.md's Pitfall B"
  - id: D3
    description: "Door and enemy sprite art judged against the project's dark-grunge/no-bubbly-or-childish standard in the running game"
    requirement: "VIS-04"
    verification:
      - kind: manual_procedural
        ref: "Task 2 checkpoint — human + coordinator reviewed phase26-door-closeup.png and phase26-enemy-closeup.png directly, confirmed dark-grunge, no pink, not bubbly/childish; also independently spot-checked the spike hazard sprite during this review (found the separate pink-spike defect, captured as backlog 999.2, not blocking)"
        status: pass
    human_judgment: true
    rationale: "Sprite-style judgment against a subjective aesthetic standard requires human eyes"

duration: ~30min (spans a Task 2 blocking human-verify checkpoint pause across two review rounds)
completed: 2026-07-07
status: complete
---

# Phase 26 Plan 08: Screenshot Proof + Human Sign-off for VIS-03/VIS-04 Summary

**Built scripts/screenshot-phase26.mjs (10 real in-browser screenshots proving 8 distinct per-level themes + door/enemy sprite art), found and fixed a genuine mid-parallax-layer theming bug the screenshots themselves surfaced (7 of 8 levels were rendering an identical grey hill despite each having a distinct assigned accent), and closed human sign-off on both the original art and the fix.**

## Performance

- **Duration:** ~30 min (Task 1 build+run, a mid-plan checkpoint-round fix cycle, then Task 2 closure)
- **Started:** 2026-07-07T22:58:00Z (approx, session start)
- **Completed:** 2026-07-07T23:23:00Z (approx)
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify, closed across two rounds)
- **Files modified:** 20 (1 new script, 1 Python pipeline fix, 8 rebaked PNGs, 10 screenshots, .gitignore)

## Accomplishments

- `scripts/screenshot-phase26.mjs` built and proven: captures `phase26-level-01-theme.png` through `phase26-level-08-theme.png`, `phase26-enemy-closeup.png`, and `phase26-door-closeup.png` from the real running game (headless Chromium via Playwright, PORT 8770), not mockups.
- Departed from the plan's literal "hold ArrowRight for ~4.3s then ~1.7s more" navigation prose (Rule 1 fix): level-01's enemy (x:1000) and door (x:1400) sit behind a mandatory gap-jump (560-720) plus two other mandatory challenge encounters (mathGate@150, collectZone@300, mathGate@1360) a bare timed hold cannot reliably clear. Reused `scripts/lib/mechanic-drive.mjs`'s already-proven `driveToXPlanned`/`resolveIfBoxed`/`deriveEncounters` (already consumed by `browser-boot.mjs`) to walk/jump the real geometry, resolve every encounter en route, and stop safely short of the enemy/door triggers for clean, unobstructed close-ups.
- Added an in-page auto-resolve for `collect.js`'s non-boxed challenge banner (its "Collect the answer to N × M" prompt has no key-press resolution path) so its persistent overlay text doesn't linger over later screenshots — parses the displayed arithmetic, finds the matching pickup by value, repositions the player onto it via `page.evaluate`.
- **Found a genuine, pre-existing theming defect during Task 1's own review**, before presenting the checkpoint: the `mid` parallax layer (the closest, most visually dominant hill/skyline silhouette) rendered as identical neutral grey `(102,102,102)` across levels 1-7 — only level 8 (EMBER) showed its assigned accent hue. Confirmed via direct pixel-luma inspection: `_accent_sub()` only overwrites one slot of `ENVIRONMENT_PALETTE_MID`'s 5-entry list, leaving an adjacent slot (luma 102) untouched; 7 of 8 accent hues (luma ~90-99) sort below that untouched slot in `_remap_luminance`'s per-image bucketing, so the mid layer's dominant source pixel (which always normalizes into the top rank) kept picking the unchanged grey instead of the accent for every theme except EMBER (luma 102.2, narrowly above it).
- Flagged this finding transparently at the Task 2 checkpoint rather than silently fixing it (verification-only checkpoint discipline) — human + coordinator independently confirmed the defect was real, scoped the fix to "mid layer only, nothing broader" (a v6.0 seed already exists for a full biome-art overhaul; this milestone is wrapping lean).
- Implemented `_mid_accent_sub()` in `scripts/build-art-assets.py`: replaces the top TWO luminance-ranked slots (not one) with accent-derived shades — a 0.8×-scaled darker body tone plus the accent itself as the highlight — guaranteeing an accent-family color always wins the dominant bucket regardless of the accent's exact luma. Verified via simulation (all 8 accents win) before rebaking.
- Rebaked via `python3 scripts/build-art-assets.py`; confirmed via `git status` that ONLY the 8 `mid-theme-N.png` files changed (far/near/ground/title/door/enemy/logo/player all byte-identical — deterministic pipeline, untouched code paths), matching the explicit "scoped to mid only" instruction.
- Verified the fix: pairwise `cmp` across all 8 rebaked `mid-theme-N.png` shows zero duplicates; `bash scripts/check-safety.sh` PASS; re-ran `screenshot-phase26.mjs` producing all 10 screenshots fresh, visually confirmed in real gameplay (levels 1/4/6/8 spot-checked) that the mid hill now reads as genuinely distinct per level, matching the intended calm-green → blue-grey → rust/brown progression.
- During the second verification pass, directly pixel-scanned `assets/spike.png` (loaded verbatim with no runtime tint) and found it is **not red** — dominant colors are purple/lavender with a dusty pink/rose highlight `(224,150,168)`, zero true-red pixels anywhere in the sprite. This contradicts an earlier assumption that the sprite was checked and confirmed red. Captured as `ROADMAP.md` backlog item 999.2 rather than fixed, per explicit instruction to keep this plan's scope to the mid-layer bug only.
- Human sign-off closed on both rounds: round 1 confirmed the mid-layer defect was real and scoped the fix; round 2 approved the fix and the original 8-theme/door/enemy art together, with the pink-spike finding captured separately (non-blocking).

## Task Commits

Each task was committed atomically:

1. **Task 1: Build scripts/screenshot-phase26.mjs and capture all 10 screenshots** - `e255bb1` (feat)
2. **Checkpoint-round fix: mid parallax layer accent bug** - `5ee6daf` (fix)
3. **Backlog capture: pink spike hazard sprite finding** - `0abbb59` (docs, made by the coordinator between rounds)

**Plan metadata:** (this commit)

## Files Created/Modified
- `scripts/screenshot-phase26.mjs` - new Playwright screenshot capture script (PORT 8770)
- `scripts/build-art-assets.py` - new `_mid_accent_sub()` helper; `THEME_PALETTES`'s `"mid"` key now uses it instead of `_accent_sub`
- `assets/parallax/mid-theme-{1..8}.png` - rebaked with genuinely distinct dominant accent colors
- `.gitignore` - added `__pycache__/` and `*.pyc` (Rule 2 — the Python rebake was leaving an untracked bytecode cache)
- `.planning/phases/26-grunge-palette-nox-run-rebrand/phase26-*.png` (10 files) - the real in-browser screenshot evidence, twice-generated (pre-fix and post-fix)

## Decisions Made
- **PORT 8770** for the new script (not the plan's stated 8768, already claimed by `audit-phase21-mechanics.mjs`) — verified via grep across all `scripts/*.mjs` before writing.
- **Reused `scripts/lib/mechanic-drive.mjs`'s proven driver** instead of a bespoke timed-hold navigation, since the plan's literal prose didn't account for level-01's mandatory gap-jump and multiple mandatory challenge encounters between spawn and the enemy/door.
- **Mid-layer fix scoped exactly to the `mid` sub-palette**, per explicit human instruction — confirmed via rebake diff that nothing else changed. The `near` layer shares the identical underlying bug (confirmed via the same investigation) but was deliberately left unfixed this round, not silently dropped — documented below.
- **Pink spike sprite finding captured to backlog (999.2), not fixed inline** — pre-existing v4.1 asset, explicitly out of scope for this plan per instruction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's literal timed-ArrowRight-hold navigation doesn't account for level-01's mandatory gap-jump and challenge encounters**
- **Found during:** Task 1, first script-writing pass
- **Issue:** The plan's action text specified "hold ArrowRight for roughly 4.3 seconds... bringing the enemy into frame... continue holding for about 1.7 more seconds... bringing the door into frame" — but level-01 has a mandatory gap-jump (560-720px) and two mandatory challenge encounters (mathGate@150, collectZone@300) before the enemy, and a further mathGate@1360 before the door, none of which a bare timed hold can navigate or resolve.
- **Fix:** Reused `scripts/lib/mechanic-drive.mjs`'s `driveToXPlanned`/`resolveIfBoxed`/`deriveEncounters` (already proven by `browser-boot.mjs`) to walk/jump the real geometry, resolving every intervening encounter, then stopping short of the enemy/door triggers for clean art-only close-ups.
- **Files modified:** scripts/screenshot-phase26.mjs
- **Verification:** `node scripts/screenshot-phase26.mjs` produces all 10 clean screenshots (no stray challenge-open state, verified visually)
- **Committed in:** e255bb1 (Task 1 commit)

**2. [Rule 1 - Bug, found via checkpoint review] Mid parallax layer silently dropped the accent for 7 of 8 themes**
- **Found during:** Task 1's own screenshot review, before presenting the checkpoint (later independently confirmed by human + coordinator at the checkpoint)
- **Issue:** `_accent_sub()`'s single-slot replacement left an adjacent, higher-priority palette slot untouched, so `_remap_luminance`'s dominant-pixel bucket kept resolving to the old neutral grey for 7 of 8 accent hues.
- **Fix:** New `_mid_accent_sub()` replaces the top TWO ranked slots with accent-derived shades, scoped to the `mid` sub-palette only, per explicit instruction.
- **Files modified:** scripts/build-art-assets.py, assets/parallax/mid-theme-{1..8}.png
- **Verification:** simulation confirms all 8 accents win the dominant bucket; rebake diff confirms only mid-theme-N.png changed; `bash scripts/check-safety.sh` PASS; re-run screenshots visually confirmed
- **Committed in:** 5ee6daf

---

**Total deviations:** 2 auto-fixed (1 Rule 1 script-navigation bug, 1 Rule 1 content bug found via the plan's own verification purpose)
**Impact on plan:** Both were necessary for the plan's actual goal (real, trustworthy screenshot proof) to be genuinely met — a script that couldn't reach its targets, or screenshots that hid a real defect, would have defeated the plan's entire purpose. No scope creep: the mid-layer fix was explicitly scoped to `mid` only by the human, and two adjacent findings (the `near` layer's identical bug, and the pre-existing pink spike sprite) were surfaced but deliberately NOT fixed, per explicit instruction.

## Issues Encountered

- **`near` parallax layer shares the identical `_accent_sub` defect as `mid`** (confirmed via the same pixel-luma investigation: themes 1-7 render an identical dominant fill, only theme 8 differs) but was explicitly left unfixed this round — the human's instruction was "scoped to the mid layer" only, and this plan's checkpoint discipline is "same defect-check framing, not a broader review." Not silently dropped: documented here and should be considered if `near`'s lack of distinctness is ever raised again (it's a much thinner, closer-to-ground strip, largely occluded by the ground tile in most gameplay framing, which is likely why it wasn't flagged as prominently as `mid`).
- **`assets/spike.png` (pre-existing v4.1 art) is pink/rose-tinted, not red** — found via direct pixel scan during the second verification pass, contradicting an earlier assumption. Captured as `ROADMAP.md` backlog item 999.2 (already committed by the coordinator in `0abbb59`), not fixed — explicitly out of scope for this plan.

## User Setup Required
None — no external service configuration required.

## Human Checkpoint

**Task 2 (blocking human-verify), round 1:** Human + coordinator reviewed the pre-fix screenshots. Confirmed the mid-layer defect (level 1/4/6/8's mountain hill reading as near-identical grey for 7 of 8 themes) was real. Instruction: "fix it now, scoped to the mid layer" — do not open a broader art-quality round (a v6.0 seed already covers a future full biome-art overhaul).

**Task 2, round 2:** Human + coordinator reviewed the post-fix screenshots. Approved — confirmed levels 1/4/6's mountain triangles now show clear, distinct green/blue-grey/brown colors instead of uniform grey. The pink-spike finding was captured to backlog (999.2), explicitly not blocking this plan. Both the original 8-theme/door/enemy review and the mid-layer fix are accepted as closed.

This closes VIS-03 and VIS-04's human-sign-off requirement with real in-browser screenshot evidence, per 26-RESEARCH.md's Pitfall B and the project's "no phase closes on greps/automation alone" standard.

## Next Phase Readiness
- VIS-03 (8 distinct per-level themes) and VIS-04 (real door/enemy sprites) are now both code-complete AND human-verified against real screenshots, with a genuine defect found and fixed along the way rather than rubber-stamped.
- Two follow-up items captured for future work, neither blocking: `near` parallax layer's identical (unfixed) accent-drop bug, and backlog item 999.2 (pink spike sprite).
- No blockers for the remaining Phase 26 plans or Phase 28 (Full Verification & Interactive Sign-off).

---
*Phase: 26-grunge-palette-nox-run-rebrand*
*Completed: 2026-07-07*

## Self-Check: PASSED

`scripts/screenshot-phase26.mjs` and all 10 `phase26-*.png` files found on disk; `scripts/build-art-assets.py` and all 8 `assets/parallax/mid-theme-{1..8}.png` found on disk; all 3 commit hashes (e255bb1, 5ee6daf, 0abbb59) found in git log.
