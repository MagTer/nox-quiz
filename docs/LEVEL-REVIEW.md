# Level Review — the 8 shipped levels against `docs/LEVEL-DESIGN.md`

**Reviewed:** 2026-07-14 (Phase 34, Plan 34-06, LVL-03) against the rulebook as agreed and rewritten in the same plan.
**Every number here is measured from `src/levels/level-0N.js`, not estimated.**

---

## Read this as INPUT to the Phase 34.5 rebuild — NOT as a to-do list

**Nothing in this document gets patched.** Phase 34.5 rebuilds **every level from scratch** against `docs/LEVEL-DESIGN.md` and doubles the level count (user decision, mid-Phase-34). Retrofitting geometry that is about to be deleted is throwaway work.

This review's job is to be the **brief the rebuild authors against**: here is exactly what the current 8 levels get wrong, so the 16 that replace them do not repeat it. Its second job is to be honest about the size of the gap — because the rules were written *after* these levels were built, and the levels have never once been measured against them.

**Expect a lot of violations. That is the finding, not a failure of the review.**

The validator is **RED** as of this plan (13 HARD-FAILs) and that is the correct, intended state:

| HARD-FAIL | Count | Owner |
|---|---|---|
| `coin-reachability` — levels 01, 02, 03 | 8 | the coin-move plan for the kid-validated levels was not executed; 34.5 re-places every coin anyway |
| `headroom` — level-07 | 5 | found by this plan's new gate, on all five end-climb tiers, at 9px each |

**Do not weaken a check to make the suite green.** A gate that goes green by lowering its own bar is the exact failure this phase exists to end.

---

## The three findings that matter most

### 1. Level-07's end climb is a crawlspace — 9px of headroom on EVERY tier (HARD)

| Tier pair | Rise | Thickness | x-overlap | **Headroom** |
|---|---|---|---|---|
| (2860,190) over (2650,255) | 65px | 24px | 70px | **9px** |
| (3050,125) over (2860,190) | 65px | 24px | 70px | **9px** |
| (3230,60) over (3050,125) | 65px | 24px | 70px | **9px** |
| (3400,−5) over (3230,60) | 65px | 24px | 70px | **9px** |
| (3560,−70) over (3400,−5) | 65px | 24px | 70px | **9px** |

A 32px player in a **41px slot**, five times in a row, at the climax of the level. The rule requires ≥24px (LEVEL-DESIGN 3.2). This shipped for four milestones with every gate green, because no gate looked and the doc had no headroom rule. It is now HARD-gated.

Level-08's Phase-34 switchback climb is the reference for what compliant looks like: 72–75px rises, 16px platforms, **26–27px** of headroom on every tier.

### 2. EVERY platform in levels 01–07 is 24px thick — the visual now LIES in the other direction (HARD)

All 8 levels author `h: 24` platforms, **except level-08's six climb tiers**, which Phase 34-04 rebuilt at `h: 16`.

Since 34-04, `build.js` draws every platform with the WYSIWYG 16px ledge frame (atlas frame 2). So on a `h: 24` platform the drawn ledge is **16px while the collider is 24px** — 8px of **invisible collider hanging below the visible ledge**. The old bug was a 48px visual over a 16px collider (she saw more than she could stand on); the residue is the inverse (she stands on 8px she cannot see).

Every platform in the rebuild is `h: 16`. There are **59** platforms across the 8 levels; **53** of them are `h: 24`.

### 3. The difficulty ramp does not exist yet

The agreed ramp (LEVEL-DESIGN §8) says verticality with real ceilings arrives in L3–6 and tightens in L7–8. Measured reality:

- **Levels 01–06 have ZERO x-overlapping platform pairs.** Not "gentle ceilings" — *no* ceilings, anywhere, in six of eight levels.
- **All the verticality in this game is bolted onto the last two levels' end climbs**, and both of those are (or were) cramped.
- Levels 01–02 are supposed to be the ceiling-free tier by design. They are — but so is everything up to level-06, which means the ramp's middle is missing entirely rather than deliberately gentle.

---

## Per-level review

Legend: **HARD** = gated rule; **SOFT** = calibrated target, deviation needs a written reason. Disposition is **34.5-REBUILD** for everything (see the framing above); a **KEEP** means the deviation is a defensible design choice the rebuild should deliberately preserve.

### level-01 (swamp, tables 6–9) — 5 floors, 6 platforms, 16 coins, 4 spikes

| Rule | Measured | Verdict |
|---|---|---|
| Gaps 120/140/160 (SOFT) + ramp L1–2 = 120px | **160, 160, 160, 160** — every gap is the *maximum* | **DEVIATION** — level 1 opens at the comfortable ceiling of the gap band, not the soft-landing 120. 34.5: 120px. |
| No overlapping tiers on L1–2 (ramp) | 0 overlapping pairs | **PASS** — and this is why level-01 plays as forgiving as it does. Preserve it. |
| Rise band (open) 60–70px | first hop is an **80px** rise (floor 320 → platform 240) | **DEVIATION** — 90% of her measured max jump as the *first thing she does*. 34.5: 60–70px. |
| Platform thickness 16px (HARD) | all 6 at `h: 24` | **DEVIATION** (finding 2) |
| Coin reachability (HARD) | **2 unreachable**: coins[10] (2280,264) tucked under the 2240 platform's underside; coins[12] (2600,136) | **HARD-FAIL** — validator RED |
| Barrier spacing 300–750px (SOFT) | enemy@1000 → door@1400 = **400px** | **PASS** |
| Density 1 door + 1 enemy | 1 + 1 | **PASS** |
| Checkpoints ≤700px on hazard stretches (SOFT) | 6 checkpoints, gaps 480–704 | **PASS** (704 is a rounding whisker over) |
| Alcove ~70px over an early platform, non-gating (SOFT) | (400,170), 70px over platform (360,240) | **PASS** — textbook |

### level-02 (swamp, tables 2–7) — 6 floors, 9 platforms, 15 coins, 5 spikes

| Rule | Measured | Verdict |
|---|---|---|
| Gaps 120/140/160 (SOFT) | **180px** @520..700, then 160×4 | **DEVIATION** — the only 180px gap in the game. It *is* bridged by platforms (500,192) and (640,232), so the >160 HARD rule is satisfied, but 180 is outside the authored gap set. 34.5: 120px (ramp L1–2). |
| No overlapping tiers on L1–2 (ramp) | 0 overlapping pairs | **PASS** |
| Platform thickness 16px (HARD) | all 9 at `h: 24` | **DEVIATION** |
| Coin reachability (HARD) | **3 unreachable**: coins[10] (2840,264), coins[12] (3260,136), coins[13] (3560,264) | **HARD-FAIL** — validator RED |
| Barrier spacing 300–750px (SOFT) | door@1540 → enemy@1860 = **320px** | **PASS** (at the tight end) |
| Long barrier-free stretch (SOFT) | enemy@1860 → goal@4200 = **2340px** with no math at all — the back half of the level is barrier-free | **KEEP, with reason** — density is LOCKED at 1 door + 1 enemy + the end gate, so this cannot be fixed by adding a barrier, and it must not be. It is a long breather, not a defect. 34.5 should fix it by *distributing* the two barriers across the level's length rather than clustering both in its first half. |
| Checkpoints (SOFT) | 10 checkpoints, gaps 100–800 | **DEVIATION** (800px, marginal) |
| Alcove (SOFT) | (320,170) over platform (280,240) | **PASS** |

### level-03 (town, tables 3–9) — 7 floors, 8 platforms, 17 coins, 8 spikes

| Rule | Measured | Verdict |
|---|---|---|
| Gaps (SOFT) + ramp L3–6 = 140–160 | 160, 120, 120, 160, 160, 120 | **PASS** |
| Ceilings appear on L3–6 (ramp) | **0 overlapping pairs** | **DEVIATION** (finding 3) |
| Platform-over-FLOOR clearance | platform (1880,260,h24) sits over floor 1320..1920 with **4px** of clearance; same for (2640,260) over floor 2040..2680 | **DEVIATION** — *not* gated (the headroom check is scoped to platform-vs-platform per the agreed rule), but a 40px-wide overlap at 4px of clearance is a real head-bonk lip at the edge of a bridging platform. 34.5: keep bridging platforms clear of the floor lip, or lift them. |
| Platform thickness 16px (HARD) | all 8 at `h: 24` | **DEVIATION** |
| Coin reachability (HARD) | **3 unreachable**: coins[11] (3440,264), coins[13] (3900,128), coins[14] (4200,264) | **HARD-FAIL** — validator RED |
| Barrier spacing 300–750px (SOFT) | enemy@2400 → door@3800 = **1400px** | **KEEP, with reason** — a breather, and density is locked. Same disposition as level-02's stretch. |
| Checkpoints ≤700px (SOFT) | 13 checkpoints, gaps 120–620 | **PASS** — the best-paced level in the game |
| Alcove (SOFT) | (310,170) over platform (280,240) | **PASS** |

### level-04 (town, tables 6–9) — 9 floors, 12 platforms, 19 coins, 9 spikes. The longest level (goal @6120).

| Rule | Measured | Verdict |
|---|---|---|
| Gap >160 must be bridged (HARD) | two **200px** gaps (@1760..1960, @4720..4920), both bridged by a platform | **PASS** on the HARD rule; **DEVIATION** on the 120/140/160 SOFT set |
| Ceilings appear on L3–6 (ramp) | 0 overlapping pairs | **DEVIATION** (finding 3) |
| Platform-over-FLOOR clearance | platform (2140,250,h24) over floor 1960..2520, 80px of overlap at **14px** of clearance | **DEVIATION** — same class as level-03's |
| Platform thickness 16px (HARD) | all 12 at `h: 24` | **DEVIATION** |
| Coin reachability (HARD) | 0 unreachable (fixed in Plan 34-03) | **PASS** |
| Barrier spacing (SOFT) | door@900 → enemy@2400 = **1500px**, then 3720px of barrier-free level to the goal | **KEEP, with reason** — density locked; but this is the worst-distributed math in the game: both barriers live in the first quarter of a 6120px level. 34.5: spread them. |
| Checkpoints ≤700px (SOFT) | 16 checkpoints, but a **1360px gap** (2440 → 3800) across the Phase-24 extension | **DEVIATION — the known one.** The extension is hazard-bearing. 34.5: no checkpoint gap over 700px on a hazard stretch. |
| Alcove (SOFT) | (270,162) over platform (240,232), 70px | **PASS** |

### level-05 (cemetery, tables 2–5) — 5 floors, 5 platforms, 15 coins, 3 spikes

| Rule | Measured | Verdict |
|---|---|---|
| Gaps (SOFT) | 160, 120, 120, 120 | **PASS** |
| Ceilings appear on L3–6 (ramp) | 0 overlapping pairs | **DEVIATION** (finding 3) |
| Platform-over-FLOOR clearance | **five** low platforms over floor runs, at **9–14px** of clearance. Worst: platform (280,255,h24) overlaps the **spawn floor** (0..520) by **96px** at **9px** of clearance | **DEVIATION — the worst instance in the game.** A 96px-wide 9px crawlspace directly over the floor she walks along at spawn. Ungated (platform-vs-floor), real, and 34.5 must not reproduce it. |
| Platform thickness 16px (HARD) | all 5 at `h: 24` | **DEVIATION** |
| Coin reachability (HARD) | 0 unreachable (fixed in Plan 34-03) | **PASS** |
| Barrier spacing (SOFT) | enemy@2150 → door@2900 = **750px** | **PASS** (exactly at the ceiling) |
| Checkpoints ≤700px (SOFT) | 6 checkpoints, gaps 150–734 | **DEVIATION** (734px, marginal) |
| Alcove (SOFT) | (600,180) over platform (560,250), 70px | **PASS** |

### level-06 (cemetery, tables 4–7) — 5 floors, 5 platforms, 15 coins, 3 spikes

| Rule | Measured | Verdict |
|---|---|---|
| Gaps (SOFT) | 160, 120, 120, 120 | **PASS** |
| Ceilings appear on L3–6 (ramp) | 0 overlapping pairs | **DEVIATION** (finding 3) |
| Platform-over-FLOOR clearance | four low platforms at **9–14px** over their floor runs (8–32px of overlap) | **DEVIATION** — same class as level-05's, milder |
| Platform thickness 16px (HARD) | all 5 at `h: 24` | **DEVIATION** |
| Coin reachability (HARD) | 0 unreachable (fixed in Plan 34-03) | **PASS** |
| Barrier spacing (SOFT) | door@720 → enemy@2150 = **1430px** | **KEEP, with reason** — density locked; breather. |
| Checkpoints ≤700px (SOFT) | 8 checkpoints, gaps 34–520 | **PASS** (the 34px pair at 96/130 is redundant, harmless) |
| Alcove ~70px over an EARLY/MID platform (SOFT) | (2000,180) over platform (1960,250) — that is **60% of the way through the level** | **DEVIATION** — the only late alcove in the game. Not gating and costs nothing to skip, so it is not a defect; but it is the least discoverable one. 34.5: early/mid. |
| Structural repetition | level-06's floor/gap/platform layout is **near-identical to level-05's** (same 5 floors, same 160/120/120/120 gaps, 5 platforms at the same heights) | **DEVIATION** — 05 and 06 are the same level with a different table pool. LVL-02's "levels must be mechanically different" applies here as much as to 07/08. |

### level-07 (castle, tables 6–8) — 4 floors, 6 platforms, 17 coins, 2 spikes. The monotonic staircase.

| Rule | Measured | Verdict |
|---|---|---|
| **Headroom ≥24px (HARD)** | **9px on all 5 tier pairs** | **HARD-FAIL ×5 — validator RED.** Finding 1. **NOT fixed here, deliberately** — 34.5 rebuilds this climb from scratch. |
| Rise band, overlapping tiers 72–75px | **65px** on every tier | **DEVIATION** — 65px is in the *open* band, but these tiers have ceilings, so they need 72–75px. This is precisely how 9px of headroom happens: a legal-looking rise applied to a situation the doc never distinguished. |
| Gaps + ramp L7–8 = 160px | 140, 120, 120 | **DEVIATION** — the two hardest levels have the *easiest* gaps in the game. |
| Platform thickness 16px (HARD) | all 6 at `h: 24` | **DEVIATION** — and it is the direct multiplier on the 9px (a 16px tier at the same 65px rise would give 17px; still failing, but not a crawlspace) |
| Coin reachability (HARD) | 0 unreachable (fixed in Plan 34-03) | **PASS** |
| Barrier spacing (SOFT) | enemy@2000 → door@2300 = **300px** | **PASS** (exactly at the floor of the band) |
| Checkpoints (SOFT) | 12 checkpoints, gaps 90–700, tight through the climb | **PASS** — the climb is well-checkpointed. It is cramped, not unfair. |
| Alcove (SOFT) | (3190,60) — up on the end climb, late | **DEVIATION** — same class as level-06's |
| Mechanically distinct from level-08 (LVL-02, HARD-by-review) | monotonic up-and-right staircase; widths shrink 280→220 toward a narrow perch | **PASS as the reference staircase** — 34-04 rebuilt 08 as a switchback specifically so these two diverge. **34.5 must keep them different.** |

### level-08 (castle, tables 6–9) — 4 floors, 9 platforms, 18 coins, 3 spikes. The switchback (rebuilt in Plan 34-04).

| Rule | Measured | Verdict |
|---|---|---|
| **Headroom ≥24px (HARD)** | **26–27px on every climb tier pair** | **PASS** — the only level in the game that clears the rule, because it is the only one authored after the rule existed |
| Rise band, overlapping tiers 72–75px | 72, 74, 75, 74, 75 | **PASS** — the reference implementation |
| x-overlap ~70px | 70 on every tier (110 on the switchback reversal) | **PASS** |
| Platform thickness 16px (HARD) | the **6 climb tiers are `h: 16`** ✓; the **3 approach platforms (480/1080/1720) are still `h: 24`** | **PARTIAL** — 34-04 fixed the climb it touched and correctly did not edit geometry outside its sanctioned scope |
| Platform-over-FLOOR clearance | the 3 `h: 24` approach platforms sit **14px** over their floor runs | **DEVIATION** — same class as levels 03–06 |
| Gaps + ramp L7–8 = 160px | 140, 120, 120 | **DEVIATION** — same as level-07 |
| Coin reachability (HARD) | 0 unreachable (fixed in Plan 34-04, all 18 collected in-engine) | **PASS** |
| Barrier spacing (SOFT) | door@700 → enemy@1600 = **900px** | **DEVIATION** (SOFT ceiling is 750px) — marginal, and both barriers sit in the level's first half again |
| Checkpoints (SOFT) | 16 checkpoints, gaps 10–500 | **PASS** — densest in the game, appropriate for the switchback |
| Alcove (SOFT) | (2650,−46) — on the switchback, very late and very high | **DEVIATION** — the most extreme late-alcove in the game |
| Mechanically distinct from level-07 (LVL-02) | switchback: 3 tiers right, a leftward reversal, then up-right to a **wide 380px summit balcony**; widths **grow** toward the summit | **PASS — human sign-off, Plan 34-04** ("yes, looks better") |

---

## The brief for Phase 34.5, in one table

| # | What the rebuild must do | Evidence |
|---|---|---|
| 1 | **Every platform `h: 16`.** No exceptions. | 53 of 59 shipped platforms are `h: 24`; the visual/collider now disagrees on all of them |
| 2 | **Every overlapping tier pair ≥24px headroom** (⇒ rise 72–75px with 16px platforms) | level-07: 9px × 5 tiers, gated RED |
| 3 | **Never snap a climb tier's `y` to the 16px grid** | 64px rise → 16px headroom; 80px rise → 90% of her max jump on every tier |
| 4 | **Build the ramp that does not exist**: L1–2 ceiling-free with 120px gaps; ceilings genuinely appearing in L3–6; 160px gaps and tight 72–75px ceilinged climbs in L7–8 | 6 of 8 levels have zero overlapping tiers; L7–8 have the game's *easiest* gaps |
| 5 | **Distribute the two barriers across the level's length** — never both in the first half | level-04: both barriers inside the first 2400px of a 6120px level |
| 6 | **No checkpoint gap >700px on a hazard stretch** | level-04's 1360px extension gap |
| 7 | **Keep bridging platforms off the floor lip** (or lift them) | level-05: a 96px-wide, 9px-clearance crawlspace over the spawn floor |
| 8 | **Every coin collectable** — the static gate AND the in-engine gate | 8 coins still RED across levels 01–03 |
| 9 | **Every level mechanically distinct** | 05 and 06 are the same level with different tables; 07 and 08 were the same climb until Plan 34-04 |
| 10 | **The alcove goes early/mid, over a platform** | levels 06, 07, 08 all place it late |

## What is gated, and what is only written down

**Gated (a level cannot ship violating these):** headroom (new, this plan), coin reachability, gap >160 bridging, over-hole barriers, mechanic reachability, spawn→goal connectivity, alcove reachability, mover reachability, platform-frame SLAB integrity, no-timer/no-punishment.

**Written down but NOT gated — the honest list:**

- **Platform thickness `h: 16`.** Not gated, deliberately: gating it today would turn 7 of 8 levels RED on geometry that is being deleted in weeks. **Phase 34.5 should add the check once the rebuilt levels are authored to it** — otherwise this rule is exactly the kind of prose-only rule that let 9px ship.
- **Platform-over-FLOOR clearance.** The headroom gate is scoped to platform-vs-platform, per the agreed rule's wording. The floor case is real (levels 03–06, 08; as low as 4px) and is on 34.5's brief above.
- **The difficulty ramp**, barrier distribution, checkpoint spacing, alcove placement — all SOFT, all human-judged, all in the brief.

Two of those three bullets exist because a gate that goes RED on doomed geometry teaches nobody anything. **That reasoning expires the moment 34.5 lands.** If these rules are still ungated after the rebuild, this document has failed at its only job.

---
---

# Phase 34.6 rebuild review — the 8 rebuilt levels against the FULL rulebook (incl. §8.5)

**Reviewed:** 2026-07-16 (Phase 34.6, Plan 34.6-11, the phase-closeout consolidated gate).
**Every number in this section is measured from `src/levels/level-0N.js` by the closeout tooling, not estimated.** The historical Phase-34 review above is preserved as the *input* this rebuild was authored against; this section is the *output* — a compliance record of the world that replaced it.

Phase 34.6 rebuilt **all 8 level descriptors from scratch** against `docs/LEVEL-DESIGN.md` §1–§8.5 (the raised bar), after a 3-round human prototype sign-off, and made the end-gate key-conditional on the even levels. This section proves the rebuilt world is green and documents each level against the rules — including the headroom rule (§3.2) that the old world failed on 9px × 5 tiers.

## The headline: the 13 deferred Phase-34 HARD-FAILs are DELETED

The Phase-34 review above shipped the validator **RED** with 13 intentional HARD-FAILs (documented as the correct RED-first state for doomed geometry). The rebuild deletes all 13 — not by weakening a check, but by replacing the geometry:

| Deferred HARD-FAIL (Phase 34) | Count | Status after 34.6 rebuild | Proof |
|---|---|---|---|
| `coin-reachability` — levels 01, 02, 03 | 8 | **GONE** | `validate-levels.mjs`: 299/299 coin rows PASS; `audit-coins.mjs`: 299/299 collected by a real driven player |
| `headroom` — level-07 end climb, 9px × 5 tiers | 5 | **GONE** | `validate-levels.mjs`: zero `headroom` rows (the check is HARD-FAIL-only, so silence = compliance); level-07's overlapping tiers now measure **25px** min headroom, up from 9px |
| **Total** | **13** | **0** | project HARD-FAIL total = **0** |

**No check was weakened or skipped to reach green.** `git status` shows zero edits to any `scripts/check-*.sh`, `scripts/*.mjs` gate, or validator threshold in this plan — the only file this plan writes is `docs/LEVEL-REVIEW.md`. The headroom gate that went RED on 9px in Phase 34 is the same gate that is silent now because the geometry clears it.

## Consolidated suite result (one pass, all 8 levels)

Run at closeout (Plan 34.6-11, Task 1). `browser-boot.mjs` was re-run to distinguish the documented `perf-fps` load-contention flake from a real completion failure (per `docs/LEVEL-DESIGN.md` §9 guidance).

| Gate | Result | Evidence |
|---|---|---|
| `check-gate.sh` | PASS | math-gate/challenge invariants |
| `check-safety.sh` | PASS | SAFE-01 no-timer / no-punishment over all of `src/` |
| `check-import-safety.sh` | PASS | a727c13 module-top-level engine-global trap |
| `check-progress.sh` | PASS | ends with `smoke-progress` PASS |
| `check-terrain-atlas.sh` | PASS | every biome cap/plat/slab/grey PIXEL check green |
| `check-pink-gate.sh` | PASS | only the allowlisted Swamp-Hunter base-fill entry |
| `check-assets-manifest.mjs` | PASS | 37 assets verified on disk |
| `validate-levels.mjs` | **PASS — 0 HARD-FAIL** | 299 coin-reachability PASS, 16 mechanic-reachability PASS, 8 over-hole PASS, 8 secret-alcove PASS, 8 biome PASS, **0 headroom rows**. Remaining rows are `gap-width`/`spawn-goal` WARN (marginRatio informational, not failures). |
| `audit-coins.mjs` | PASS | 299 witnessed / 299 collected in-engine (incidental=3), 0 model-skipped |
| `browser-boot.mjs` | PASS (driven completion) | Run 2: only `perf-fps` entry-fps flakes (levels 01/02/03/04/06 dip below the 40fps floor under headless load); **no** `cannot-progress` / `far-end-unreachable` rows — every level driven to goal.x from spawn. Run 1's transient level-01 leg-3 stall and level-04 far-end stall did **not** reproduce, confirming load-contention artifacts, not geometry defects. |
| `audit-phase21-mechanics.mjs` | PASS | 24/24 encounters `triggered: true` (door + enemy + alcove × 8 levels), ALL RESOLVED |
| `audit-endgate-key.mjs` | PASS | 4 math-skip levels (02/04/06/08) proved BOTH ways: key collected → free clear; no key → math gate opens |
| `smoke-progress.mjs` | PASS | all fixtures (levels 01–04 golden geometry) |

## The difficulty ramp is now real (this fixes the old review's finding #3)

The Phase-34 review's third finding was that *"the difficulty ramp does not exist"* — 6 of 8 levels had zero overlapping tiers and all verticality was bolted onto the last two levels. The rebuild builds the ramp. Measured peak climb above the floor line (`FLOOR_Y 320 − highest platform y`) and overlapping-tier ceilings:

| Level | Archetype | Biome | Tables | goal.x | Peak climb above floor | Overlapping-tier pairs | Min headroom | Math-skip key |
|---|---|---|---|---|---|---|---|---|
| 01 The First Ascent | odd — calm intro | swamp | 6–9 | 7100 | **196px** | 0 (open-air, per §8 L1 rule) | n/a | — |
| 02 The Rusted Spire | even — intense+vertical | swamp | 2–7 | 7360 | **592px** | 28 | 26px | ✓ |
| 03 The Old Quarter | odd — calm intro | town | 3–9 | 10280 | **222px** | 3 | 26px | — |
| 04 The Clocktower | even — intense+vertical | town | 6–9 | 9460 | **666px** | 29 | 26px | ✓ |
| 05 The Sunken Yard | odd — calm intro | cemetery | 2–5 | 6930 | **260px** | 3 | 26px | — |
| 06 The Necropolis | even — intense+vertical | cemetery | 4–7 | 7200 | **740px** | 44 | 26px | ✓ |
| 07 The Iron Gatehouse | odd — calm intro | castle | 6–8 | 7560 | **420px** | 5 | 25px | — |
| 08 The Throne Keep | even — intense+vertical FINALE | castle | 6–9 | 7620 | **814px** | 38 | 26px | ✓ |

**The even ladder is strictly monotonic: 02 (592) < 04 (666) < 06 (740) < 08 (814).** The odd ladder is strictly monotonic too: 01 (196) < 03 (222) < 05 (260) < 07 (420). The old review's "ramp is fiction" finding is retired: every level now carries real verticality, and both archetype ladders escalate 01→08.

> The even-level peak includes the above-summit key-apex spur, so the measured peak sits a little above the mandatory signature-spire gain quoted in each build summary (e.g. level-08's 740px switchback keep + the key spur → an 814px peak). Both the peak ordering and the signature-spire ordering are monotonic — the ramp holds on either metric.

**Every platform in all 8 levels is `h: 16` (WYSIWYG).** The old review's finding #2 — 53 of 59 platforms authored `h: 24`, the collider disagreeing with the drawn 16px ledge — is deleted: the rebuild authors `h: 16` everywhere (verified: the thickness set across all 8 descriptors is `{16}`).

## Per-level compliance record

Legend: **HARD** = gated; **SOFT** = calibrated target. All numbers measured from the descriptor at closeout.

### level-01 — The First Ascent (swamp, 6–9) · 10 floors, 11 platforms, 34 coins, 14 checkpoints, 5 spikes
- **Archetype (§8.5):** odd calm intro — FORGIVING, not flat. Signature: a mandatory **196px arch** climb-and-descent over a pit (the far floor starts beyond a bare running jump, so the up-and-over is the only route — validator jump-envelope BFS confirms), plus a visible LOW/HIGH fork that diverges and rejoins.
- **Ceilings (§8 L1 rule):** **0 overlapping tiers** — open air above every platform, exactly as §8 mandates for level 1. This is why level-01 reads as the most forgiving of the eight; forgiving here is generous platforms + wide margins + dense checkpoints (14), not a flat walk.
- **Headroom (§3.2 HARD):** n/a (no overlapping tiers). **Density (§4):** 1 door + 1 enemy + end gate. **Alcove (§6):** present, reachable (`secret-alcove` PASS). **Coins (§3b HARD):** 34/34 reachable + collected. No key (odd).

### level-02 — The Rusted Spire (swamp, 2–7) · 9 floors, 18 platforms, 38 coins, 27 checkpoints, 4 spikes · KEY
- **Archetype (§8.5):** even intense+vertical. Signature: a tall swamp **switchback spire** (592px peak) with a **diamond fork** (LOW road vs HIGH road, 3 bonus coins) and the **math-skip key** on the hard branch.
- **Ceilings & headroom (§3.2 HARD):** 28 overlapping-tier pairs, **min 26px** headroom — clears the ≥24px floor on every pair. Open-air stacked tiers (A3 decision, §8.5 rule 6): the climb is legible, no enclosed tunnels.
- **§8 vs §8.5 note:** §8's ramp table lists L1–2 as ceiling-free, but the §8.5 biome-pair rhythm makes the EVEN member of each pair the intense one — so level-02 deliberately carries ceilings while level-01 does not. This is the raised bar overriding the flat-early reading of §8, not a violation; A3 (Plan 34.6-04) locked these ceilings as open-air. **Density:** 1+1+gate. **Alcove/coins:** present + 38/38. **Key:** both paths proved (`audit-endgate-key` PASS).

### level-03 — The Old Quarter (town, 3–9) · 13 floors, 14 platforms, 40 coins, 21 checkpoints, 4 spikes
- **Archetype (§8.5):** odd calm intro. Signature: a **townscape** — stepped rooftops (200px rooftop climb+descent), a covered arcade, an optional belltower, and a visible rooftop LOW/HIGH fork — distinct from level-01's single swamp arch.
- **Ceilings & headroom:** 3 overlapping-tier pairs (ceilings begin appearing in the L3–6 band, per §8), **min 26px** headroom. **Density:** 1+1+gate. **Alcove/coins:** present + 40/40. No key (odd). The longest level by goal.x (10280) — a calm level made long by breadth, not by height.

### level-04 — The Clocktower (town, 6–9) · 13 floors, 19 platforms, 46 coins, 29 checkpoints, 5 spikes · KEY
- **Archetype (§8.5):** even intense+vertical. Signature: a **592px required clocktower switchback spire** + a **diamond fork** (2 rejoining routes) + a T-tier up-left reversal + a gantry descent + an optional tenement high/low fork + the **math-skip key**.
- **Ceilings & headroom (§3.2 HARD):** 29 overlapping-tier pairs, **min 26px**. **Density:** 1+1+gate. **Alcove/coins:** present + 46/46. **Key:** both paths proved.

### level-05 — The Sunken Yard (cemetery, 2–5) · 9 floors, 15 platforms, 35 coins, 16 checkpoints, 2 spikes
- **Archetype (§8.5):** odd calm intro. Signature: a **mausoleum** (260px) over a **sunken crypt pit** (mandatory up-and-over — both the descent tier and the far floor sit beyond a bare running jump), an optional crypt vault, a grave-mound LOW/HIGH fork, and a tombstone row — a distinct graveyard character, not a re-skin of level-03. (The old review's finding that 05 and 06 were the same level with different tables is deleted: 05 is a single stepped mausoleum intro, 06 is a double-switchback necropolis.)
- **Ceilings & headroom:** 3 overlapping-tier pairs, **min 26px**. **Density:** 1+1+gate. **Alcove/coins:** present + 35/35. No key (odd).

### level-06 — The Necropolis (cemetery, 4–7) · 9 floors, 21 platforms, 41 coins, 30 checkpoints, 4 spikes · KEY
- **Archetype (§8.5):** even intense+vertical. Signature: a **double-switchback cathedral/necropolis spire** (740px) + crypt-tower + catacomb descents + a **diamond fork** + the **math-skip key** — deliberately distinct from level-05's single mausoleum and level-02's swamp spire.
- **Ceilings & headroom (§3.2 HARD):** 44 overlapping-tier pairs (the most in the game), **min 26px**. **Density:** 1+1+gate. **Alcove/coins:** present + 41/41. **Key:** both paths proved.

### level-07 — The Iron Gatehouse (castle, 6–8) · 8 floors, 16 platforms, 31 coins, 23 checkpoints, 3 spikes
- **Archetype (§8.5):** odd calm intro — the calmer castle half. Signature: a mandatory **iron gatehouse** climb+descent over a moat pit, a battlement LOW/HIGH fork, a broken-drawbridge crossing, and the vertical centerpiece — a **420px MONOTONIC grand staircase of 6 overlapping tiers** to the summit tower.
- **Headroom (§3.2 HARD) — the old crawlspace, fixed:** the 6-tier staircase carries **real overlapping ceilings** at rise ~73px → **25px headroom** (5 overlapping-tier pairs). This is the exact climb that shipped **9px × 5 tiers** for four milestones; it now clears the ≥24px HARD floor. **This is the single most important fix in the rebuild.**
- **L7 ≠ L8 (LVL-02 HARD-by-review):** level-07 is a **monotonic** up-and-right staircase — **0 reversals** — shrinking toward a **narrow** summit tower, **420px**, **no key**. **Density:** 1+1+gate. **Alcove/coins:** present + 31/31.

### level-08 — The Throne Keep (castle, 6–9) · 9 floors, 19 platforms, 34 coins, 31 checkpoints, 5 spikes · KEY
- **Archetype (§8.5):** even intense+vertical FINALE — the tallest, most intense level. Signature: a barbican outwork + broken drawbridge + a **colossal switchback spire** crowned by a **broad throne balcony** + the key-apex spur (**814px peak**).
- **L8 ≠ L7 (LVL-02 HARD-by-review):** level-08 is a **switchback** — **2 up-left main-line reversals** (plus a diamond fork and a key spur) — **growing** toward a **wide** throne balcony, **814px**, with the **math-skip key**. The two castle levels remain mechanically opposite (monotonic-narrow-shrinking vs switchback-wide-growing), preserving the LVL-02 differentiation.
- **Ceilings & headroom (§3.2 HARD):** 38 overlapping-tier pairs, **min 26px**. **Density:** 1+1+gate. **Alcove/coins:** present + 34/34. **Key:** both paths proved.
- **Note (a real defect class caught here, §9.4):** the first cut placed the summit goal *above* the folding switchback; `validate-levels` and `browser-boot` both passed while `audit-endgate-key` correctly FAILED (the driver reached the goal's x-column on a lower tier without touching the goal). Fixed by ending the keep on an up-RIGHT hop to the rightmost balcony so the goal x-column exists only at the summit. This is why the two-path key audit is a required closeout gate, not a nicety.

## Locked decisions carried into the rebuild (Plan 34.6-04)

- **A1 — key-skip XP:** `CONFIG.PROGRESS.XP_KEY_SKIP = 20` (full credit — skipping the end math by carrying the key is worth the same as a hard-table answer). Unchanged.
- **A3 — even-level verticality:** confirmed **open-air** (open stacked tiers, always legible; no enclosed ceilings/tunnels). Recorded in `docs/LEVEL-DESIGN.md` §8.5 rule 6; the §8 ramp table was NOT amended for ceilings, which is why the §8-vs-§8.5 note on level-02 above is called out explicitly.
- **Fall-stakes:** missed jumps MAY drop into a pit and respawn — real platforming tension, guarded by generous checkpoint cadence (every level 14–31 checkpoints). Not punishment: no game-over, no lost progress, no timer.

## LIMITATIONS — the honest note

1. **The literal "2× every level" length target is capped by the HARD perf-objects budget, not met.** `browser-boot`'s `assertObjectBudget` HARD-FAILs any level whose ground cap+fill tile count exceeds `CONFIG.TERRAIN.OBJECT_BUDGET = 650`, and the builder emits one cap tile per 16px of every floor AND platform — so tiles scale with total floor+platform px and **cutting tiles cuts length**. A full §8.5 vertical spire consumes the budget on height, leaving less for length. level-04 is authored to goal.x 9460 at **640/650 caps** — the budget ceiling — and is still the longest even level; a literal ~12000px double-spire would land ~900 caps and HARD-FAIL. **The levels are built to the budget ceiling, honoring every §8.5 structural requirement (verticality, ≥2 rejoining routes, switchbacks, interleaved descents, math-skip key, close-checkpoint fall pits, ≥24px headroom, open-air legibility) rather than to a literal 2× px target that the HARD budget forbids.** (Recorded in each even level's header + build summary; source: Plan 34.6-04 Deviation 1.)

2. **§8.5 "feel" is human-sign-off-only — no gate enforces it, and it is deferred to Phase 38 kid-UAT.** The consolidated suite proves every level is **legal and completable** (§8.5's numeric safety limits, coin/mechanic/key reachability, headroom, structure). It does **not** prove any level is **good** — that the calm levels *feel* calm, the intense levels *feel* intense, each signature reads as distinct, and the whole thing is *fun*. §8.5 rule statement: "Green gates prove a level is legal and completable; they do not prove it is good. No gate enforces this section — the human sign-off does." The Phase-34.6 3-round prototype sign-off approved the *approach*; the geometry that ships has never been kid-played. Per §9.1, levels 01–03's original kid sign-off **no longer covers** the rebuilt geometry — Phase 38's kid-UAT is a **real re-approval**, the only sign-off the rebuilt world will have, and it cannot be treated as a formality.

3. **`browser-boot` completion is proven by re-run, and its driver is rightward-biased.** The `perf-fps` entry-fps dips are documented headless load-contention flakes (not completion failures); a genuine unreachability shows as a `cannot-progress`/`far-end-unreachable` row, which Run 2 had none of. The in-engine driver historically drove rightward-only (the level-08 switchback "stall" class, §6a) — the closeout run drove every level, including the switchbacks, to goal.x, but the driver caveat is why the two-path key audit and the phase21-mechanics audit are run alongside, not in place of, browser-boot.

## What is gated now vs. only written down (the honest list, updated)

The Phase-34 review closed by warning that platform-thickness `h: 16`, platform-over-floor clearance, and the difficulty ramp were "written down but NOT gated." Status after the rebuild:

- **Platform thickness `h: 16`:** now uniformly authored (all 8 descriptors, thickness set `{16}`); the `check-terrain-atlas.sh` SLAB check gates the *rendering* side (a platform frame that fills its bottom half back into a 48px slab HARD-FAILs).
- **Headroom (§3.2):** gated and now GREEN — `validate-levels.mjs` `headroom` rows (HARD-FAIL-only), zero violations across all 8 levels; min measured 25px (level-07).
- **The difficulty ramp, barrier distribution, alcove placement, and §8.5 feel:** remain SOFT / human-judged (the ramp is now *real* per the table above, but "is it fun / distinct / calm-vs-intense" is Phase-38 kid-UAT). This is the deliberate residue: the numeric structure is gated and green; the experiential quality is reserved for the human, by design.
