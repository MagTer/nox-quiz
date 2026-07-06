# Roadmap: Nox Run (formerly Math Lab)

**Project:** Nox Run — Gamified Math Practice for Kids
**Last updated:** 2026-07-05

## Milestones

- ✅ **v1.0 MVP** — Phase 1 (shipped 2026-06-20) — see v2.0 archive (Phase 1 included)
- ✅ **v2.0 Dungeon Crawler** — Phases 2–6 (shipped 2026-06-22) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 The Platformer** — Phases 7–12 (shipped 2026-06-28) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Content & Challenge** — Phases 13–19 (shipped 2026-07-03) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v4.1 Art Rework** — Phases 20–21 (shipped 2026-07-04) — [archive](milestones/v4.1-ROADMAP.md)
- 🚧 **v5.0 Nox Run — Real Levels** — Phases 22–28 (in progress)

## Phases

**Phase Numbering:**

- Integer phases (22, 23, 24…): Planned milestone work (numbering continues across milestones)
- Decimal phases (22.1, 22.2…): Urgent insertions (marked with INSERTED)

<details>
<summary>✅ v1.0 MVP (Phase 1) — SHIPPED 2026-06-20</summary>

- [x] Phase 1: MVP Core Loop & ADHD-Safe Mechanics (4/4 plans) — completed 2026-06-20

Single-file gamified math practice: XP, levels, 70/30 hard/easy weighting, Fisher-Yates shuffle, EWMA accuracy tracking, SVG grain texture, WCAG AA verified.

</details>

<details>
<summary>✅ v2.0 Dungeon Crawler (Phases 2–6) — SHIPPED 2026-06-22</summary>

- [x] Phase 2: Combat Foundation (3/3 plans) — completed 2026-06-21
- [x] Phase 3: Screen Architecture (2/2 plans) — completed 2026-06-21
- [x] Phase 4: Dungeon Renderer (3/3 plans) — completed 2026-06-21
- [x] Phase 5: Full Floor Loop + Balance (2/2 plans) — completed 2026-06-21
- [x] Phase 6: Polish + ADHD Safety Audit (2/2 plans) — completed 2026-06-22

Dungeon crawler layer: GameFSM, CombatEngine, DungeonRenderer, DungeonRunner, 4 floors, 3 enemy types, loot system, ADHD audit passed. All 27 v2.0 requirements satisfied.

</details>

<details>
<summary>✅ v3.0 The Platformer (Phases 7–12) — SHIPPED 2026-06-28</summary>

- [x] Phase 7: Project Setup & Deployment (2/2 plans) — completed 2026-06-22
- [x] Phase 8: Platformer Core / Movement / Physics / Camera (3/3 plans) — completed 2026-06-24
- [x] Phase 9: Level Build & CC0 Assets (3/3 plans) — completed 2026-06-25
- [x] Phase 10: Math-Gate Integration / Port the Brain (3/3 plans) — completed 2026-06-26
- [x] Phase 11: Progression & Persistence (4/4 plans) — completed 2026-06-27
- [x] Phase 12: Polish, ADHD-Safety & UAT (3/3 plans) — completed 2026-06-28

Real 2D Kaplay platformer (vendored, no-build, served over HTTP): one polished dark-grunge level → in-world forgiving 6–9-weighted math gate → XP/leveling on the v1/v2 curve → versioned localStorage persist+resume, with ADHD-safe juice and discoverable controls. All 33 v3.0 requirements satisfied (32 verified + kid-UAT; 2 low-risk manual checks deferred — see STATE.md Deferred Items). Full phase details in the [v3.0 archive](milestones/v3.0-ROADMAP.md).

</details>

<details>
<summary>✅ v4.0 Content & Challenge (Phases 13–19) — SHIPPED 2026-07-03</summary>

- [x] Phase 13: Fresh Save Format + Level Registry/Data (4/4 plans) — completed 2026-06-29
- [x] Phase 14: Multi-Scene Shell (3/3 plans) — completed 2026-07-02
- [x] Phase 15: Challenge Seam + Locked-Door Mechanic (4/4 plans) — completed 2026-07-02
- [x] Phase 16: Remaining Mechanics + Difficulty Curve (3/3 plans) — completed 2026-07-03
- [x] Phase 17: Build the Levels (4/4 plans) — completed 2026-07-03
- [x] Phase 18: Art, Animation & Parallax (4/4 plans) — completed 2026-07-03
- [x] Phase 19: Polish & Consolidated Kid-UAT (4/4 plans) — completed 2026-07-03

Grew the single-level v3.0 slice into a replayable multi-level game: four hand-built dark-grunge levels, a title screen, a level-select map, and four forgiving in-world math mechanics (locked doors, checkpoint gates, defeat-enemy, collect-the-answer) woven throughout. Table and platforming difficulty ramp gently; art/animation/parallax pass. All 22 v4.0 requirements satisfied (21 verified + automated browser boot; SAFE-05 kid-UAT live sign-off deferred and tracked in `19-UAT.md`). Full phase details in the [v4.0 archive](milestones/v4.0-ROADMAP.md).

</details>

<details>
<summary>✅ v4.1 Art Rework (Phases 20–21) — SHIPPED 2026-07-04</summary>

- [x] Phase 20: Real CC0 Art Redo & Human Sign-off (3/3 plans) — completed 2026-07-04
- [x] Phase 21: Real Verification Pass — Mechanics & Sign-off Integrity (7/7 plans) — completed 2026-07-04

Replaced Phase 18's procedurally-generated placeholder art (player, tileset, parallax, title/select) with real curated CC0 pixel art under a genuine two-round human visual sign-off, then closed the verification-integrity gap that let it (and other pre-v4.1 gameplay claims) ship unsubstantiated: `door.js`/`gates.js`/`enemy.js`/`mathGate.js` got the same real interactive audit `collect.js` got post-ship, the automated boot gate now genuinely exercises movement + mechanic resolution on all 4 levels, and the milestone-audit record's unsupported sign-off claims were corrected. Found and fixed 5 additional real bugs along the way. All 10 v4.1 requirements satisfied. Full phase details in the [v4.1 archive](milestones/v4.1-ROADMAP.md).

</details>

### 🚧 v5.0 Nox Run — Real Levels (Phases 22–28) — IN PROGRESS

**Milestone Goal:** Take the working game from "functioning" to "next-level experience" — rebrand it as **Nox Run**, double and lengthen the level content with guaranteed-playable structure, enrich the grunge visuals, and add ADHD-safe audio.

- [x] **Phase 22: Implementation Review & Auto-Fix** - Review every game entity, fix bugs and obvious UX issues autonomously, escalate bigger design changes for approval (completed 2026-07-05)
- [x] **Phase 23: Level Validation Harness** - Static level validator calibrated against real engine physics + upgraded interactive audit, proven against the known live bugs before being trusted (completed 2026-07-05)
- [ ] **Phase 24: Fix & Lengthen Levels 1–4** - Fix the known structural defects and lengthen the four kid-validated levels with scaled checkpoint density, gated by the new validator
- [ ] **Phase 25: Levels 5–8, Difficulty Ramp & Select Grid** - Four new pure-data levels with verticality and secret alcoves, gentle 8-level ramp, 2×4 select grid, tables 1 and ×10 dropped
- [ ] **Phase 26: Grunge Palette & Nox Run Rebrand** - Centralized then expanded grunge palette with per-level themes, Nox Run logo and full string sweep with the save key untouched
- [ ] **Phase 27: Audio & ADHD-Safe Sound** - Core SFX set, calm gesture-gated ambient music, persisted M-key mute, designed ADHD-safe mix
- [ ] **Phase 28: Full Verification & Interactive Sign-off** - Interactive audit start→goal on all 8 levels, all automated gates green in one run, human sign-off on levels/art/audio

**Build-order rationale (from research):** review first (clean base before content doubles) → validator before any level authoring (structural correctness becomes free on every edit) → lengthen the existing 4 (authoring conventions established on known ground) → author 5–8 with the full ramp → palette before the logo (logo designed against final tokens) → rebrand isolated (save key stated as a non-goal with a resume check) → audio last (SFX hooks land on the final mechanics set) → closing verification pass (v4.0's lesson: checks that don't play the game lie).

## Phase Details

### Phase 22: Implementation Review & Auto-Fix

**Goal**: The shipped game runs on a clean, reviewed base — entity bugs and UX rough edges fixed before the content doubles on top of them
**Depends on**: Nothing (first phase of v5.0; builds on shipped v4.1)
**Requirements**: FIX-01, FIX-02
**Success Criteria** (what must be TRUE):

  1. Every game entity and surface (player, monsters, doors, gates, collect zones, math gate, scenes, HUD) has been reviewed, with found bugs and obvious UX issues fixed autonomously
  2. The existing 4 levels still pass the full interactive audit and static gate suite after the fixes — zero regressions
  3. Bigger design changes surfaced by the review are presented to the user as explicit approve/reject decisions — none are implemented silently
  4. Known structural level defects (doors over floor holes, unreachable areas) are inventoried but deliberately left in place as Phase 23's validator calibration targets

**Plans:** 5/5 plans complete

Plans:
**Wave 1**

- [x] 22-01-PLAN.md — De-flake check-gate.sh + 22-FINDINGS.md skeleton + full-suite pre-fix baseline

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 22-02-PLAN.md — Cluster A review: challenge seam + 4 mechanics (busy-guard, collect multi-zone, close() hazard) with behavioral evidence

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 22-03-PLAN.md — Cluster B review: scenes & shell (game.js lifecycle sweeps, title/select/hud, boot shell) with boot screenshots

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 22-04-PLAN.md — Cluster C review: engine glue + config/progress/builder + structural defect INVENTORY (deferred-to-phase-24)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 22-05-PLAN.md — FIX-02 batched approve/reject round + approved implementations + final full-suite zero-regression proof

### Phase 23: Level Validation Harness

**Goal**: Structural level mistakes can't ship silently — every level edit is machine-gated from here on, before any new level is authored
**Depends on**: Phase 22
**Requirements**: VALID-01, VALID-02
**Success Criteria** (what must be TRUE):

  1. `node scripts/validate-levels.mjs` checks spawn→goal reachability, gap widths vs the jump envelope, door-over-hole placement, and mechanic reachability on every registered level, exiting non-zero on any failure
  2. The validator's jump envelope comes from a one-time empirical measurement against the running engine (not closed-form theory), with a recorded safety margin
  3. Run against the untouched levels 1–4, the validator flags both known live bugs (door-over-hole, unreachable areas) — proven RED before it is trusted as a gate
  4. The interactive mechanic-drive harness reaches encounters previously excluded on levels 1–4, shrinking the 6/16 blind spot, with every remaining exclusion individually documented (VALID-03 groundwork; that requirement closes across all 8 levels in Phase 28)

**Plans:** 5/5 plans complete

Plans:
**Wave 1**

- [x] 23-01-PLAN.md — Jump envelope calibration probe + frozen JUMP_ENVELOPE constant (VALID-02)
- [x] 23-02-PLAN.md — Interactive audit retry-wrapper (VALID-03 groundwork) + FINDINGS retry-harness evidence
- [x] 23-03-PLAN.md — Over-hole check module (promoted) + bad-level.js self-test fixture (VALID-01)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 23-04-PLAN.md — Δy-aware reachability module: jump-edge model + BFS (VALID-01)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 23-05-PLAN.md — validate-levels.mjs orchestrator + RED-first proof (VALID-01, VALID-02)

### Phase 24: Fix & Lengthen Levels 1–4

**Goal**: The four kid-validated levels are structurally sound and noticeably longer, with checkpoints that keep death forgiving at the new lengths
**Depends on**: Phase 23
**Requirements**: VALID-04, LVL-01
**Success Criteria** (what must be TRUE):

  1. All known structural defects in levels 1–4 (doors over floor holes, unreachable areas) are fixed, and the static validator passes green on all four
  2. Each of levels 1–4 extends past its v4.1 length with new sections appended after — never edited inside — the kid-validated geometry
  3. Checkpoint density scales with the new lengths, so a respawn never sends her back more than one section
  4. The upgraded interactive audit drives each lengthened level start→goal with mechanic encounters resolved, and level-01's geometry-pinning smoke fixture is consciously re-baselined (not deleted)

**Plans**: TBD

### Phase 25: Levels 5–8, Difficulty Ramp & Select Grid

**Goal**: The game doubles to eight levels with a coherent gentle ramp, late-game verticality, hidden rewards, and a select screen that scales — with tables 1 and ×10 gone from the math
**Depends on**: Phase 24
**Requirements**: LVL-02, LVL-03, LVL-04, LVL-05, LVL-06, MATH-01, MATH-02
**Success Criteria** (what must be TRUE):

  1. Levels 5–8 exist as pure-data descriptors through the existing registry/builder, and each plays start→goal green on both the static validator and the interactive audit
  2. Difficulty ramps gently across all 8 levels — platforming and per-level table pools ([2,3,4,5] → [6,7,8,9]) — including one mixed-review level, and no level's question pool contains table 1
  3. ×10 questions never appear: the second-factor roll is 1–9, and the `src/math/` diff shows exactly that one authorized literal change and nothing else (brain stays LOCKED)
  4. Level select shows all 8 levels in a 2×4 grid with locked/unlocked/cleared semantics preserved, and an existing pre-v5.0 save resumes with levels 5–8 locked by default
  5. Levels 5–8 include verticality segments, and every level hides one optional secret XP alcove — finding it rewards XP, missing it costs nothing

**Plans**: TBD
**UI hint**: yes

### Phase 26: Grunge Palette & Nox Run Rebrand

**Goal**: The game looks and reads as Nox Run — a richer dark-grunge identity with per-level themes and a signed-off logo — while her save survives untouched
**Depends on**: Phase 25 (per-level themes need all 8 levels; internally, palette work precedes the logo so the wordmark is designed against final tokens)
**Requirements**: VIS-01, VIS-02, VIS-03, BRAND-01, BRAND-02, BRAND-03
**Success Criteria** (what must be TRUE):

  1. Every duplicated color literal lives in `CONFIG.PALETTE` before expansion, and the expanded palette adds hue-tinted darks (moss green, blue-grey, rust) with WCAG AA contrast recorded per role and zero pink anywhere
  2. Each of the 8 levels has a distinct background/accent theme tint produced through the art pipeline, human-signed-off in the running game
  3. The title screen shows the Nox Run dark-green/black pixel wordmark (CC0 font, Pillow-baked PNG) with a light/neon separation element, revealed in a ≤500ms non-strobing animation and human-signed-off at real sizes
  4. No user-facing "Math Lab" string remains (HTML title, title screen, docs, Docker, README) — enforced by a grep sweep with an explicit allowlist for the save key and school-game comments
  5. A pre-rebrand save resumes with XP/level/completion intact — the `mathlab_platformer_v2` localStorage key provably untouched

**Plans**: TBD
**UI hint**: yes

### Phase 27: Audio & ADHD-Safe Sound

**Goal**: The game sounds alive — calm ambient music and satisfying SFX she can mute, with a mix designed to never startle
**Depends on**: Phase 25 (SFX hooks land on the final mechanics/level set); runs after Phase 26 in milestone order
**Requirements**: AUD-01, AUD-02, AUD-03, AUD-04
**Success Criteria** (what must be TRUE):

  1. Jump, land, pickup, correct answer, soft-neutral wrong, door/gate, and level-clear each play a distinct CC0 sound (license proofs vendored), identical across all mechanics via the shared challenge-resolution seams
  2. Calm ambient music loops seamlessly (OGG) and starts only after her first press on the title screen — audible in a fresh incognito session, never before a gesture
  3. Pressing M toggles mute anywhere, the setting persists across reloads in its own localStorage key, and the progress save is untouched
  4. Dying twice or exiting to level select never stacks or leaks music — exactly one music handle exists at all times (idempotent music manager)
  5. The mix is ADHD-safe by design — music clearly below SFX, no buzzers or startle stingers — with human sound sign-off recorded

**Plans**: TBD

### Phase 28: Full Verification & Interactive Sign-off

**Goal**: Every v5.0 claim is backed by interactive proof — all eight levels provably completable with all mechanics reachable, on the finished art and sound
**Depends on**: Phases 22–27 (everything)
**Requirements**: VALID-03
**Success Criteria** (what must be TRUE):

  1. The interactive audit drives start→goal with mechanic encounters on all 8 levels; every encounter is either genuinely driven or individually excepted with a documented technical reason, improving on v4.1's 6/16 blind spot
  2. The full automated gate suite is green in one run: browser-boot across all 8 levels, `validate-levels.mjs`, and `check-safety.sh`
  3. A fresh-incognito playthrough confirms audio starts on first gesture, and a pre-rebrand save still resumes on the rebranded build
  4. Human interactive sign-off is recorded for levels, per-level themes, logo, and audio in the running game — no claim closes on automation alone

**Plans**: TBD

## Progress

**Execution Order:** Phases execute in numeric order: 22 → 23 → 24 → 25 → 26 → 27 → 28

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. MVP Core Loop & ADHD-Safe Mechanics | v1.0 | 4/4 | ✅ Complete | 2026-06-20 |
| 2. Combat Foundation | v2.0 | 3/3 | ✅ Complete | 2026-06-21 |
| 3. Screen Architecture | v2.0 | 2/2 | ✅ Complete | 2026-06-21 |
| 4. Dungeon Renderer | v2.0 | 3/3 | ✅ Complete | 2026-06-21 |
| 5. Full Floor Loop + Balance | v2.0 | 2/2 | ✅ Complete | 2026-06-21 |
| 6. Polish + ADHD Safety Audit | v2.0 | 2/2 | ✅ Complete | 2026-06-22 |
| 7. Project Setup & Deployment | v3.0 | 2/2 | ✅ Complete | 2026-06-22 |
| 8. Platformer Core | v3.0 | 3/3 | ✅ Complete | 2026-06-24 |
| 9. Level Build & CC0 Assets | v3.0 | 3/3 | ✅ Complete | 2026-06-25 |
| 10. Math-Gate Integration | v3.0 | 3/3 | ✅ Complete | 2026-06-26 |
| 11. Progression & Persistence | v3.0 | 4/4 | ✅ Complete | 2026-06-27 |
| 12. Polish, ADHD-Safety & UAT | v3.0 | 3/3 | ✅ Complete | 2026-06-28 |
| 13. Fresh Save Format + Level Registry/Data | v4.0 | 4/4 | ✅ Complete | 2026-06-29 |
| 14. Multi-Scene Shell | v4.0 | 3/3 | ✅ Complete | 2026-07-02 |
| 15. Challenge Seam + Locked-Door Mechanic | v4.0 | 4/4 | ✅ Complete | 2026-07-02 |
| 16. Remaining Mechanics + Difficulty Curve | v4.0 | 3/3 | ✅ Complete | 2026-07-03 |
| 17. Build the Levels | v4.0 | 4/4 | ✅ Complete | 2026-07-03 |
| 18. Art, Animation & Parallax | v4.0 | 4/4 | ✅ Complete | 2026-07-03 |
| 19. Polish & Consolidated Kid-UAT | v4.0 | 4/4 | ✅ Complete | 2026-07-03 |
| 20. Real CC0 Art Redo & Human Sign-off | v4.1 | 3/3 | ✅ Complete | 2026-07-04 |
| 21. Real Verification Pass — Mechanics & Sign-off Integrity | v4.1 | 7/7 | ✅ Complete | 2026-07-04 |
| 22. Implementation Review & Auto-Fix | v5.0 | 5/5 | Complete    | 2026-07-05 |
| 23. Level Validation Harness | v5.0 | 5/5 | Complete    | 2026-07-05 |
| 24. Fix & Lengthen Levels 1–4 | v5.0 | 0/TBD | Not started | - |
| 25. Levels 5–8, Difficulty Ramp & Select Grid | v5.0 | 0/TBD | Not started | - |
| 26. Grunge Palette & Nox Run Rebrand | v5.0 | 0/TBD | Not started | - |
| 27. Audio & ADHD-Safe Sound | v5.0 | 0/TBD | Not started | - |
| 28. Full Verification & Interactive Sign-off | v5.0 | 0/TBD | Not started | - |

---

*Archives: [v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md) · [v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md) · [v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md) · [v4.1-ROADMAP.md](milestones/v4.1-ROADMAP.md)*
*v5.0 roadmap created 2026-07-05 — next: `/gsd-plan-phase 22`*
