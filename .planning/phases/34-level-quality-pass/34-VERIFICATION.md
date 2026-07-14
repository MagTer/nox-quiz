---
phase: 34
phase_name: Level Quality Pass
status: passed
verified: 2026-07-15
score: 3/4 must-haves met; SC4 deliberately deferred to Phase 34.6
---

# Phase 34: Level Quality Pass — Verification

**Verdict: PASSED**, with SC4 knowingly deferred (not silently missed).

## Success criteria, goal-backward

### SC1 — Every pickup reachable, validator-gated, in its own commits
**MET, and it went far deeper than the roadmap assumed.**

The roadmap scoped this to "levels 5–8". The truth, measured: unreachable coins existed in **all 8 levels**. The count then moved twice, in both directions, because each layer of checking falsified the one before it:

| Source | Count | Why it was wrong |
|---|---|---|
| Alcove point-model probe | 32 | Over-reported — treated a coin as a point you must LAND on |
| Static coin model (34-01) | 5 | Under-reported — blind to platforms bonking the jump arc |
| **Real engine (34-02)** | **13** | The actual answer, proven by a driven player |

The in-engine audit **falsified the static model**: 9 coins it had cleared, the real engine refused to collect — every one a ceiling-bonk (level-06's was *inside* a platform's collider box). The model was **tightened** (`solidBoxes()` + `arcIsClear()`), never the gate loosened. Final: **119 witnesses replayed, 119 confirmed** by a real driven player.

Coins in levels 04–08 are fixed and in-engine-proven. Levels 01–03's 8 coins are deliberately unfixed — see SC4.

### SC2 — Level-07 and level-08 climbs differentiated
**MET.** Level-08 rebuilt as a switchback (two direction reversals, widths *growing* to a 380px summit); level-07 remains a monotonic staircase narrowing to a 220px perch. Both properties are **hard-asserted**, not merely described: the automated check fails if the leftward-rising tier pair disappears or if geometry exceeds `bounds.right`. Human-approved verbatim: *"yes, looks better"*.

### SC3 — 8-level review + motion rules written BEFORE any motion authoring
**MET.** `docs/LEVEL-DESIGN.md` rewritten with the user-agreed rule set; `docs/LEVEL-REVIEW.md` documents all 8 levels. Motion rules (checkpoint before every mover; missed platform = WAIT not death; patrollers carry zero hurt wiring) are written and land structurally before Phase 36.

### SC4 — Structural validator green, zero HARD-FAILs
**NOT MET — DELIBERATELY DEFERRED TO PHASE 34.6.**

13 HARD-FAILs remain. **Every one is on geometry that Phase 34.6 deletes:**
- **8 × `coin-reachability`** (levels 01–03) — plan 34-05 skipped by explicit user decision, because those levels are being rebuilt from scratch.
- **5 × `headroom`** (level-07's 9px tiers) — this is the **RED-first proof that the new headroom gate works**. Level-07 was deliberately not retrofitted; it is being rebuilt.

Retrofitting either would be work on levels that will not exist. This is a knowing scope trade, made by the user, recorded rather than papered over.

## Gate state

| Gate | Result |
|---|---|
| check-gate / check-safety / check-import-safety / check-progress | PASS |
| check-terrain-atlas (pixel gate) | PASS |
| check-assets-manifest | PASS |
| **browser-boot — all 8 levels incl. the switchback** | **PASS** |
| audit-phase21-mechanics | **24/24 ALL MECHANICS RESOLVED** |
| audit-coins (in-engine) | PASS |
| validate-levels | **RED (13) — by design, see SC4** |

*Note on browser-boot:* it failed on level-04 in one run. This was **reproduced and then refuted** — the pre-34-07 driver stalls identically, and it passes on a quiet machine. It is the documented load-contention flake, not a regression and not a content bug.

## What this phase actually delivered (and why it outlives its own success criteria)

The durable outputs — the ones Phase 34.6's rebuild depends on:

1. **A coin model that has been falsified in a real engine and tightened** — not merely written.
2. **A bidirectional harness.** The driver could only ever press ArrowRight and treated progress as monotonically-increasing x, so a switchback read as a stall. Fixed. **Rebuilt levels can now be PROVEN completable from spawn** — they could not before.
3. **An agreed, ENFORCED rulebook.** Headroom is now a HARD validator check.
4. **A terrain pixel gate** and **WYSIWYG 16px platforms** (visual finally equals collider).

## The lesson this phase exists to record

**A check that does not exercise the real thing will lie to you.** In this phase alone, a fully green suite concealed: a sawtoothed floor, grey-static ground, 32 unreachable coins, 9px headroom on every tier of level-07, and platforms drawing a 48px slab over a 16px collider.

Every one was invisible to automation and obvious to a human looking at the screen. The human rejected the sign-off **twice**, and was right both times.

The harness fix carried the same lesson from a third direction: its first cut silently broke levels 01–04 **while the level it was fixing looked green**. Only a full 8-level baseline caught it.
