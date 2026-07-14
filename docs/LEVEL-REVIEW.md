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
