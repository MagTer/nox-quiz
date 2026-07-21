# Roadmap: Nox Run (formerly Math Lab)

**Project:** Nox Run — Gamified Math Practice for Kids
**Last updated:** 2026-07-09

## Milestones

- ✅ **v1.0 MVP** — Phase 1 (shipped 2026-06-20) — see v2.0 archive (Phase 1 included)
- ✅ **v2.0 Dungeon Crawler** — Phases 2–6 (shipped 2026-06-22) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 The Platformer** — Phases 7–12 (shipped 2026-06-28) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Content & Challenge** — Phases 13–19 (shipped 2026-07-03) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v4.1 Art Rework** — Phases 20–21 (shipped 2026-07-04) — [archive](milestones/v4.1-ROADMAP.md)
- ✅ **v5.0 Nox Run — Real Levels** — Phases 22–28 (shipped 2026-07-09) — [archive](milestones/v5.0-ROADMAP.md)
- ✅ **v6.0 SNES-Fidelity World** — Phases 29–39 (shipped 2026-07-21) — [archive](milestones/v6.0-ROADMAP.md)

## Phases

**Phase Numbering:**

- Integer phases (29, 30, 31…): Planned milestone work (numbering continues across milestones)
- Decimal phases (29.1, 29.2…): Urgent insertions (marked with INSERTED)

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

<details>
<summary>✅ v5.0 Nox Run — Real Levels (Phases 22–28) — SHIPPED 2026-07-09</summary>

- [x] Phase 22: Implementation Review & Auto-Fix (5/5 plans) — completed 2026-07-05
- [x] Phase 23: Level Validation Harness (5/5 plans) — completed 2026-07-05
- [x] Phase 24: Fix & Lengthen Levels 1–4 (6/6 plans) — completed 2026-07-06
- [x] Phase 25: Levels 5–8, Difficulty Ramp & Select Grid (7/7 plans) — completed 2026-07-07
- [x] Phase 26: Grunge Palette & Nox Run Rebrand (12/12 plans) — completed 2026-07-07
- [x] Phase 27: Audio & ADHD-Safe Sound (7/7 plans) — completed 2026-07-08
- [x] Phase 28: Full Verification & Interactive Sign-off (3/3 plans) — completed 2026-07-09

Rebranded Math Lab → Nox Run; doubled the game to 8 levels (levels 1–4 fixed and lengthened 53–63%, levels 5–8 new) behind a permanent structural validator; rebuilt the visual identity (expanded grunge palette, 8 distinct per-level themes, real CC0 door/enemy sprites, signed-off logo); added a full ADHD-safe audio layer (7 SFX + ambient music + mute); closed with a consolidated automated gate suite and genuine, non-rubber-stamped human sign-off across all 8 levels. All 25 v5.0 requirements satisfied. Full phase details in the [v5.0 archive](milestones/v5.0-ROADMAP.md).

</details>

<details>
<summary>✅ v6.0 SNES-Fidelity World (Phases 29–39) — SHIPPED 2026-07-21 (override close)</summary>

Full detail archived in [milestones/v6.0-ROADMAP.md](milestones/v6.0-ROADMAP.md).

- [x] Phase 29: Mechanic Cleanup (2/2) — 2026-07-09
- [x] Phase 30: Harness Extensions (3/3) — 2026-07-10
- [x] Phase 31: Asset Bake & Style-Board Sign-off (6/6) — 2026-07-10
- [x] Phase 32: Terrain & Parallax Rendering (5/5) — 2026-07-11
- [x] Phase 33: Player & Entity Animation (5/5) — 2026-07-14
- [x] Phase 34: Level Quality Pass (6/7, 34-05 deliberately skipped) — 2026-07-14
- [x] Phase 34.5: Key & Lock Mechanic (3/3) — 2026-07-15
- [x] Phase 34.6: Level Redesign — rebuild + double every level (11/11) — 2026-07-16
- [x] Phase 34.6.1: Re-play Polish — coins/key-framing/wrong-answer feedback (4/4) — 2026-07-17
- [x] Phase 35: Biome Re-dress & Props (8/8) — 2026-07
- [x] Phase 36: World Motion & Ambient Life (10/10) — 2026-07
- [x] Phase 37: Mobile — Responsive Canvas & Touch Controls (7/7) — 2026-07
- [x] Phase 38: n0x Logo & Closing Verification — BRAND-01 delivered (quick task 260719-iuv); VER-02 kid-UAT approved 2026-07-21; VER-01/03 + MOB-05/06 deferred as human/device gates (see STATE.md Deferred Items)
- [x] Phase 39: Playthrough Polish — grounded skeletons, sliding spikes, movers over real holes, solid props, prop cleanup (7/8; 39-08 closed by override) — 2026-07-21

**Closeout:** override close (user chose fast override 2026-07-21) — game shipped, deployed (nox.falle.se), kid-approved. Deferred: VER-01/03, MOB-05/06 (device gates); level-02≈level-08 distinctness → SEED-003 (v7).

</details>

---

*Archives: [v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md) · [v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md) · [v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md) · [v4.1-ROADMAP.md](milestones/v4.1-ROADMAP.md) · [v5.0-ROADMAP.md](milestones/v5.0-ROADMAP.md) · [v6.0-ROADMAP.md](milestones/v6.0-ROADMAP.md)*
*v6.0 shipped 2026-07-21 (override close). Next: `/gsd-new-milestone` for v7.*
