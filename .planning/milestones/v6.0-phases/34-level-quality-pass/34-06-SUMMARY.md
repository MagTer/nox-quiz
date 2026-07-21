---
phase: 34-level-quality-pass
plan: 06
subsystem: level-authoring-rules
tags: [level-design, headroom, validator, motion-rules, difficulty-ramp, level-review]
status: complete

# Dependency graph
requires:
  - phase: 34-level-quality-pass
    provides: "34-04's headroom + WYSIWYG-platform findings and the 16px atlas platform frame; 34-01/02's coin box model and in-engine coin gate"
provides:
  - "docs/LEVEL-DESIGN.md — the user-agreed, binding rulebook Phase 34.5 rebuilds all levels against"
  - "a HARD `headroom` check in the validator (>=24px for x-overlapping platform pairs), RED-first-proven on level-07"
  - "docs/LEVEL-REVIEW.md — the measured 8-level review, framed as the 34.5 rebuild brief"
  - "the motion rulebook (LVL-03), written BEFORE Phase 36 authors any mover"
affects: [34.5, 36, 38]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "headroom = lower.y - (upper.y + upper.h) - 32 >= 24px, measured against the ACTUAL authored p.h (never an assumed 16), for any two platforms overlapping in x"
    - "HARD rules get a gate in the same commit as the prose — a rule enforced by nothing is how 9px shipped on every tier of level-07"

key-files:
  created:
    - docs/LEVEL-REVIEW.md
  modified:
    - docs/LEVEL-DESIGN.md
    - scripts/lib/reachability.mjs

decisions:
  - "Headroom gate scoped to platform-vs-platform pairs, exactly as the agreed rule is worded. Platform-over-FLOOR clearance (real, as low as 4px on level-03, and a 96px-wide 9px crawlspace over level-05's spawn floor) is recorded in LEVEL-REVIEW.md as a 34.5 input rather than silently folded into the gate."
  - "The 16px platform-thickness HARD rule is documented but NOT gated in this plan: gating it would turn 7 of 8 levels RED on geometry that Phase 34.5 deletes. Flagged loudly in LEVEL-REVIEW.md as a check 34.5 must add once the rebuilt levels are authored to it."
  - "level-07's 9px headroom deliberately NOT retrofitted (34-04's standing decision, reaffirmed): 34.5 rebuilds it from scratch."

metrics:
  duration: ~40min
  completed: 2026-07-14
---

# Phase 34 Plan 06 — The LEVEL-DESIGN Rulebook (LVL-03) Summary

The agreed rule set is now written down **and gated**. The rules that governed this game's levels were written after those levels were built, and had never once been measured against them — so this plan wrote the rulebook the user signed off on, made its new HARD rule actually fail, and then measured all 8 shipped levels against it.

## What landed

### 1. `docs/LEVEL-DESIGN.md` — rewritten to the agreed rule set

- **HEADROOM (new, HARD):** `headroom = lower.y − (upper.y + upper.h) − 32 ≥ 24px` for any two platforms overlapping in x. With the mandated 16px thickness this reduces to **rise ≥ 72px** for overlapping tiers.
- **Rise bands:** 72–75px with a ceiling above; 60–70px without; **HARD 88.331px** ceiling always (`JUMP_ENVELOPE.maxRise` — never the closed-form 96.57px).
- **The grid trap, documented explicitly:** never snap a climb tier's `y` to the 16px grid. 64px rise → only 16px of headroom; 80px rise → 90% of her measured maximum jump, on every tier. Floors and gaps snap; climb tiers deliberately do not.
- **16px WYSIWYG platform thickness** (visual == collider), **coin HARD rule** with the 48×64 fly-through box vs. the alcove's landing-point model, and the **~70px x-overlap** rule.
- **Section 6b — the motion rulebook (HARD), written before any mover exists:** a checkpoint before every mover; a missed mover means WAIT, never death (no killing pits under movers); patrollers carry ZERO hurt wiring; movers are dt-based and telegraphed (no schedulers — `check-safety.sh` enforces the code side).
- **Section 8 — the agreed difficulty ramp:** L1–2 (120px gaps, 60–70px rises, **no ceilings at all**) / L3–6 (140–160px, ceilings appear) / L7–8 (160px, tight 72–75px ceilinged climbs; 07 stays a monotonic staircase, 08 keeps the switchback).
- **Section 9.1 — the append-only convention is SUSPENDED for 34.5**, with the cost stated plainly: levels 01–03's kid sign-off no longer covers them, so Phase 38's kid-UAT is a real re-approval and not a formality.
- **Section 10 (was section 9) — rewritten against the real code and the real atlases.** The old text described a **two**-frame atlas and measured "lip offsets" against a town cap that was a **roof triangle** and a castle cap that was an **arch peak** — both of which tiled into sawtooths, and both of which have since been re-pointed at real ground tiles. The atlas is now THREE 16×32 frames (**cap | fill | platform**), frame 2 being the cap's own top 16×16 cell over a transparent bottom half. Verified against `_bake_biome_atlas` and each biome's actual `cap_rect`, not against the old prose.

**Mover-caveat wording checked against the code, not copied:** `bestMarginToPoint` (`scripts/lib/reachability.mjs:400`) still has `if (point.x < n.xStart) continue`, so the **static** `mover-reachability` check remains rightward-travel-only. That is a *different* limitation from the browser driver's rightward-only driving (`browser-boot.mjs` / `route-planner.mjs`), which is being fixed in the parallel Phase-34 harness plan. The doc now names both, says they have different owners and different lifetimes, and tells the reader to check the code rather than trust either caveat.

### 2. The HEADROOM HARD check — RED-first, and it went RED exactly where predicted

`findHeadroomViolations()` in `scripts/lib/reachability.mjs`, with rows flowing through `checkLevelReachability` into `validate-levels.mjs` automatically. **HARD-FAIL only, no WARN tier** — a cramped ceiling is an exact geometric fact about a fixed-size player, and a WARN row here would be a row that never fails anything.

It measures the **actual authored `p.h`**, never an assumed 16 — which is what makes level-07 report its real **9px** instead of a flattering 17px.

**The RED-first proof (this is the deliverable, not a side effect):**

```
level-07 | headroom | HARD-FAIL | platforms[1] (x:2860 y:190 h:24) over platforms[0] (x:2650 y:255):
  headroom=9px (< 24px; rise=65px, x-overlap=70px) — a 32px player in a 41px slot
  ... × 5, one per tier of the end climb
```

Level-08's Phase-34 switchback (72–75px rises, 16px tiers, 26–27px headroom) **passes** — so the check discriminates rather than just failing everything.

**Two-way self-test** (`node scripts/lib/reachability.mjs` → `reachability-selftest: PASS`):
- **Case T (RED):** level-07's *real, shipped* coordinates → exactly 1 violation, measured headroom exactly `9`, row is HARD-FAIL, `hardFailCount` increments.
- **Case U (GREEN):** level-08's compliant 75px/16px pair → zero violations, zero rows.
- **Case V (boundary):** headroom exactly `== 24` PASSES (so LEVEL-DESIGN's 72px floor and the gate can never silently drift apart); a pair sharing no x is exempt; an omitted `platforms` array never throws.

### 3. `docs/LEVEL-REVIEW.md` — all 8 levels measured, framed as the 34.5 brief

Every row is measured from the descriptors, not estimated. It opens by saying, unambiguously, that **nothing in it gets patched** — Phase 34.5 rebuilds every level, so the review is the input to that rebuild.

Findings the rebuild has to act on:

1. **level-07: 9px of headroom on all five climb tiers** — a 32px player in a 41px slot, five times, at the climax of the level.
2. **53 of 59 platforms are `h: 24`.** Since 34-04's WYSIWYG ledge, `build.js` draws every platform as a 16px ledge — so those 53 now have **8px of invisible collider** hanging below the visible ledge. The old bug (48px visual over a 16px collider) has an inverse residue.
3. **The difficulty ramp does not exist.** Six of eight levels have **zero** x-overlapping tiers; all the verticality is bolted onto the last two levels' end climbs; and 07/08 have the game's *easiest* gaps (140/120/120 where the ramp says 160).
4. **level-05 walks her through a 96px-wide, 9px-clearance crawlspace over the spawn floor** (platform-over-floor — a class the headroom gate deliberately does not cover; recorded, not hidden).
5. **Levels 05 and 06 are the same level** with a different table pool — LVL-02's "levels must be mechanically different" applies to them as much as to 07/08.
6. Barrier distribution: level-04 puts **both** barriers inside the first 2400px of a 6120px level. Density is LOCKED (1 door + 1 enemy + end gate), so this is a **KEEP-with-reason** — fixed by *distributing*, never by adding a barrier.

It closes with a table of what is gated vs. what is still only prose — and says plainly that the "don't gate it yet" reasoning **expires the moment 34.5 lands**.

## Validator state: RED, deliberately, and correctly

`node scripts/validate-levels.mjs` → **13 HARD-FAILs**:

| Source | Count | Status |
|---|---|---|
| `coin-reachability`, levels 01–03 | 8 | **pre-existing** — the kid-validated-levels coin-move plan was not executed. Confirmed present in the baseline *before* this plan touched anything. |
| `headroom`, level-07 | 5 | **new, and the point** — the RED-first proof the gate is load-bearing |

**Neither was fixed, deliberately.** Level-07 is rebuilt from scratch in Phase 34.5 (34-04's standing decision) and 34.5 re-places every coin. Retrofitting doomed geometry is throwaway work — and weakening a check to make the suite green is the exact failure this phase exists to end.

## Deviations from Plan

The `34-06-PLAN.md` on disk predates the user's agreed rule set; the executing prompt's task list supersedes it and is what was executed.

- **[Scope — superseded] Plan Task 2's "FIX additively / KEEP-with-reason" dispositions were NOT applied as fixes** (e.g. adding a checkpoint to level-04, and therefore re-baselining `smoke-progress.mjs`'s golden fixture). The rebuild decision makes every such fix throwaway. `src/levels/level-04.js` and `scripts/smoke-progress.mjs` are untouched; math density verified unchanged across all 8 levels (`DENSITY-LOCKED`).
- **[Scope — superseded] Plan Task 3's "full suite green in one run" was NOT run as a closing gate.** It cannot be green: the validator is RED by design (above), and `browser-boot.mjs` is known-RED on level-08's switchback pending the parallel harness plan (34-04). Claiming a green suite here would require weakening a check.
- **[Scope — not executed] The two pending todos were not moved to `.planning/todos/completed/`.** The prompt's task list does not include it, and `.planning/todos/` is shared state a parallel executor may also be touching. `docs/LEVEL-REVIEW.md` is the artifact that closes the review todo's substance.
- **[Rule 2 — added] A `## What is gated, and what is only written down` section** in LEVEL-REVIEW.md. The phase's whole lesson is that an unenforced HARD rule is not a rule; shipping a rulebook with two ungated HARD rules (16px thickness, platform-over-floor clearance) without saying so in writing would have repeated it quietly.

## Files touched

- `docs/LEVEL-DESIGN.md` — rewritten (commit `2aef1d3`)
- `scripts/lib/reachability.mjs` — `MIN_HEADROOM_PX`, `findHeadroomViolations()`, the `headroom` rows, self-test cases T/U/V (commit `4fb4370`)
- `docs/LEVEL-REVIEW.md` — created (commit `839eccb`)

**Not touched** (parallel-executor boundary, respected): `scripts/lib/route-planner.mjs`, `scripts/lib/mechanic-drive.mjs`, `scripts/browser-boot.mjs`, `scripts/audit-phase21-mechanics.mjs`. No level descriptor was edited.

## Verification

- `node scripts/lib/reachability.mjs` → `reachability-selftest: PASS` (all cases incl. T/U/V)
- `node scripts/validate-levels.mjs` → 13 HARD-FAILs: 8 pre-existing coin + **5 new headroom on level-07**, all at 9px. Level-08's compliant climb passes the same check.
- Baseline captured before the change: 8 HARD-FAILs, all `coin-reachability` on levels 01–03. The 5 new rows are attributable to the new gate and to nothing else.
- Math density unchanged across all 8 levels: `DENSITY-LOCKED`.
- Section 10's atlas facts verified against `scripts/build-art-assets.py::_bake_biome_atlas` and each biome's real `cap_rect` — not against the old prose, which was wrong about both the frame count and two of the four caps.

## Self-Check: PASSED

- `docs/LEVEL-DESIGN.md` — FOUND
- `docs/LEVEL-REVIEW.md` — FOUND
- `scripts/lib/reachability.mjs` — FOUND (`findHeadroomViolations` exported)
- Commits `2aef1d3`, `4fb4370`, `839eccb` — FOUND in `git log`
