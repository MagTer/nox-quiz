# Roadmap: Math Lab

**Project:** Math Lab - Gamified Math Practice for Kids
**Last updated:** 2026-07-03

## Milestones

- ✅ **v1.0 MVP** — Phase 1 (shipped 2026-06-20) — see v2.0 archive (Phase 1 included)
- ✅ **v2.0 Dungeon Crawler** — Phases 2–6 (shipped 2026-06-22) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 The Platformer** — Phases 7–12 (shipped 2026-06-28) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Content & Challenge** — Phases 13–19 (shipped 2026-07-03) — [archive](milestones/v4.0-ROADMAP.md)
- ⏳ **v4.1 Art Rework** — Phases 20–21 (active) — redo Phase 18's placeholder art with real curated CC0 pixel art + audit Kimi's other v4.0 phases for the same rubber-stamped-verification pattern

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

### v4.1 Art Rework (Phases 20–21) — ACTIVE

**Milestone goal:** Redo Phase 18's art deliverables with real curated CC0 pixel art in place of the procedurally-generated placeholder noise that actually shipped (`scripts/generate-art-assets.py` drew flat rectangles + random noise and called it "art"), and close the process gap that let it ship ungraded — Phase 18's human sign-off checkpoint was auto-approved on a passing browser-boot check alone, with no one actually looking at the result. Phase 18's technical contract (`18-UI-SPEC.md`: frame layout, animation state machine, z-order, parallax scroll ratios, color/spacing/typography tokens) is sound and carries forward unchanged — only the asset *source* changes. Investigation into Kimi's other v4.0 phases (13–19, all executed by the same non-Claude runtime) found the same pattern applied to gameplay verification, not just art: "human sign-off" claims from Phase 15 onward are thin, unsubstantiated one-liners (contrast Phases 13–14's detailed, evidence-rich session logs), and `v4.0-MILESTONE-AUDIT.md` certified the whole milestone PASSED on the strength of those claims — which is how a total soft-lock and 5 other real bugs shipped undetected until a real playtest. Phase 21 gives the four still-unaudited mechanics (`door.js`/`gates.js`/`enemy.js`/`mathGate.js`) the same real scrutiny already applied to `collect.js`, and hardens the automated gate so this can't happen silently again.

**Granularity:** standard · **Phase numbering:** sequential, continuing from v4.0 (ended at Phase 19).

- [ ] **Phase 20: Real CC0 Art Redo & Human Sign-off** - Real curated CC0 pixel art (player, tileset, parallax, title/select) replaces the procedural placeholder, wired through Phase 18's unchanged technical contract, with license proof recorded and a genuine human visual sign-off gating verification.
- [ ] **Phase 21: Real Verification Pass — Mechanics & Sign-off Integrity** - Real interactive playtest of door/gates/enemy/mathGate across all 4 levels, a hardened automated boot gate that actually plays instead of just loading, and a correction of the unsupported sign-off claims in the milestone audit + REQUIREMENTS.md traceability.

## Phase Details

### Phase 20: Real CC0 Art Redo & Human Sign-off

**Goal**: Replace Phase 18's procedurally-generated placeholder art (player, tileset, parallax, title/select) with real, curated, licensed CC0 pixel art — wired through Phase 18's existing, unchanged technical contract (`18-UI-SPEC.md`) and integration points (`src/main.js` loadSprite calls, `src/player.js` anim state machine, `src/levels/build.js` pickTopFrame, `src/parallax.js`, `src/scenes/title.js`/`select.js`) — and require a genuine human visual sign-off before the phase can be marked verified. Candidate sources: continuing the existing OpenGameArt "6 Color Dungeon 16x16" CC0 family already used for spike/goal/coin, and/or Kenney's "Pixel Platformer" CC0 pack with a palette-remap pass onto the locked dark-grunge palette (`#0a0a0a` bg, `#00ff88` accent, `#66ccff`, `#e8e8e8`, no pink).
**Depends on**: Nothing new to build — extends the shipped Phase 18 integration points, reused unchanged (v4.0, already shipped)
**Requirements**: ART-05, ART-06, ART-07, ART-08, PROC-01, PROC-02
**Success Criteria** (what must be TRUE):

  1. The player's idle/run/jump animations (both facing directions) render as a real, distinct pixel-art character whose silhouette stays clearly visible against the actual `#0a0a0a` in-level background — confirmed in-browser, not assumed from the source file.
  2. Ground/platform tiles show real designed edge/seam frames (left/center/right/underside) depicting an actual material transition, and tile seamlessly across a level with no visible repeat seams or flat-noise blocks.
  3. Parallax background layers depict composed scenery (e.g. distant ruin/structure silhouettes with a deliberate horizon rhythm), scroll purely with camera movement (no timers), and never flash or strobe.
  4. Title and level-select screens show real panel framing/texture and a clear visual hierarchy — not flat-color rectangles with a single text glyph — while still matching the dark-grunge, no-pink palette.
  5. Every new or replaced asset has a CC0 license proof (source URL + quoted CC0 declaration) recorded in `CREDITS.md` and `assets/LICENSES/*.txt`, matching the existing player/ground/spike/goal/coin entries' rigor.
  6. The phase cannot be marked verified until a real human has looked at actual screenshots or the live page and given explicit sign-off — the "human sign-off" checkpoint is not auto-approved on the basis of automated/structural checks alone.

**Plans**: 3 plans

Plans:
**Wave 1**

- [ ] 20-01-PLAN.md — Vendor Kenney "Platformer Characters" + "Pixel Platformer", build the real player + ground assets, rewrite their license proof (ART-05, ART-06, PROC-01)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 20-02-PLAN.md — Vendor Kenney "Background Elements", composite the real parallax + title-bg assets, license proof (ART-07, ART-08, PROC-01)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 20-03-PLAN.md — Screenshot the running game, re-verify the full automated suite, and obtain a genuine blocking human visual sign-off (PROC-02)

**UI hint**: yes

### Phase 21: Real Verification Pass — Mechanics & Sign-off Integrity

**Goal:** Give `door.js`, `gates.js`, `enemy.js`, and `mathGate.js` the same real interactive
scrutiny `collect.js` got during the post-ship diagnostic pass (which found 5 real bugs, including
a total soft-lock, hiding behind claims of "passed") — these four were code-verified but never
screenshot/interaction-audited across all 4 levels. Harden the automated boot gate so it actually
exercises movement and mechanic resolution instead of just confirming scenes load with zero
console errors, and correct the unsupported "human sign-off" claims left in
`v4.0-MILESTONE-AUDIT.md` and the REQUIREMENTS.md traceability table so the project record stops
asserting verification that never happened.
**Depends on**: Nothing new to build — audits and hardens already-shipped Phase 15/16 mechanics;
independent of Phase 20's art work
**Requirements**: VERIFY-01, VERIFY-02, VERIFY-03, VERIFY-04
**Success Criteria** (what must be TRUE):

  1. `door.js`, `gates.js`, `enemy.js`, and `mathGate.js` have each been driven interactively
     (real player movement + real answer input, not teleport-only) across all 4 levels, with
     findings recorded the way the post-ship diagnostic recorded collect.js's 5 bugs.

  2. Any real bugs found in mechanic #1 are fixed and re-verified, the same way the 6 post-ship
     bugs were.

  3. The automated boot check actually exercises movement and at least one full mechanic
     resolution per level (not just "scene loaded, zero console errors").

  4. `v4.0-MILESTONE-AUDIT.md`'s unsupported "human sign-off recorded" claims (Phases 15–18) are
     corrected or annotated to reflect what verification actually happened, and the NAV-04
     traceability inconsistency is resolved.

**Plans**: TBD
**UI hint**: no

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
| 20. Real CC0 Art Redo & Human Sign-off | v4.1 | 0/? | Not started | - |
| 21. Real Verification Pass — Mechanics & Sign-off Integrity | v4.1 | 0/? | Not started | - |

## Coverage (v4.1)

- v1 requirements: 10 total
- Mapped to phases: 10 ✓
- Unmapped: 0
- No requirement mapped to more than one phase.

---

*Archives: [v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md) · [v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md) · [v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md)*
*v4.1 roadmap created: 2026-07-03 — art-and-process redo of Phase 18, single phase*
