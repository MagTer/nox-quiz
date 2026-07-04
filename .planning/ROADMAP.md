# Roadmap: Math Lab

**Project:** Math Lab - Gamified Math Practice for Kids
**Last updated:** 2026-07-04

## Milestones

- ✅ **v1.0 MVP** — Phase 1 (shipped 2026-06-20) — see v2.0 archive (Phase 1 included)
- ✅ **v2.0 Dungeon Crawler** — Phases 2–6 (shipped 2026-06-22) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 The Platformer** — Phases 7–12 (shipped 2026-06-28) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Content & Challenge** — Phases 13–19 (shipped 2026-07-03) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v4.1 Art Rework** — Phases 20–21 (shipped 2026-07-04) — [archive](milestones/v4.1-ROADMAP.md)

## Phases

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

Replaced Phase 18's procedurally-generated placeholder art (player, tileset, parallax, title/select) with real curated CC0 pixel art under a genuine two-round human visual sign-off, then closed the verification-integrity gap that let it (and other pre-v4.1 gameplay claims) ship unsubstantiated: `door.js`/`gates.js`/`enemy.js`/`mathGate.js` got the same real interactive audit `collect.js` got post-ship, the automated boot gate now genuinely exercises movement + mechanic resolution on all 4 levels, and the milestone-audit record's unsupported sign-off claims were corrected. Found and fixed 5 additional real bugs along the way (an invisible-background art bug, enemy.js's arithmetic-display bug, a simultaneous-challenge state-corruption + visual-overlap bug, a jump-over exploit on math-gates/enemies, and a path-traversal/bind-all-interfaces issue in local test tooling). Phase 21's first verification pass scored 1/4 must-haves; a gap-closure cycle (plans 21-05/06/07) closed all three gaps and re-verification scored 4/4. All 10 v4.1 requirements satisfied. Full phase details in the [v4.1 archive](milestones/v4.1-ROADMAP.md).

</details>

## Progress

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

---

*Archives: [v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md) · [v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md) · [v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md) · [v4.1-ROADMAP.md](milestones/v4.1-ROADMAP.md)*
*Next milestone (v5.0) not yet started — run `/gsd-new-milestone` to begin questioning → research → requirements → roadmap.*
