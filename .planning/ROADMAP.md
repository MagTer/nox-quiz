# Roadmap: Math Lab

**Project:** Math Lab - Gamified Math Practice for Kids
**Last updated:** 2026-06-29

## Milestones

- ✅ **v1.0 MVP** — Phase 1 (shipped 2026-06-20) — see v2.0 archive (Phase 1 included)
- ✅ **v2.0 Dungeon Crawler** — Phases 2–6 (shipped 2026-06-22) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 The Platformer** — Phases 7–12 (shipped 2026-06-28) — [archive](milestones/v3.0-ROADMAP.md)
- 🔨 **v4.0 Content & Challenge** — Phases 13–19 (active, opened 2026-06-28)

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

### v4.0 Content & Challenge (Phases 13–19) — ACTIVE

Grow the working single-level slice into a real, replayable game: 3–5 hand-built levels behind a title/level-select shell, math woven *through* each level via four forgiving mechanics over one shared challenge seam, a gentle difficulty curve, an art/animation + parallax pass, and a fresh per-level save format. Built on the shipped v3.0 spine (movement/camera/respawn, `ui/mathGate.js`, `math/brain.js` [LOCKED], `progress.js`, `level.js`, `fx.js`) — reuse, don't rebuild. Zero new runtime dependencies; everything is native to vendored Kaplay 3001.0.19 (no build step, no Tiled, no Kaplay `addLevel`).

**Build-order spine (dependency-respecting):** pure save+registry first → multi-scene shell → challenge-seam refactor (must precede mechanics) → remaining mechanics + difficulty → author the levels → art near-last (so logic validates on placeholders) → consolidated kid-UAT last.

**Cross-cutting mitigations baked into every engine-touching phase:**

- **a727c13 rule** — no Kaplay global (or `typeof <global>` guard) at module top level; every new module keeps engine refs *inside* function bodies. Add `scripts/check-import-safety.sh` (column-0, comment-stripped grep) in Phase 14 and run it each phase after.
- **Mandatory real browser-boot per phase** — greps passing ≠ boots in a browser (the single most expensive v3.0 lesson). No phase closes on automation alone.
- **Anti-leak** — closure-local run state (never a module-level `let`); cancel every global controller (`onKeyPress`/`onHide`/`onClick`) on `onSceneLeave`; single-flight tween cancel on the object.
- **No-timer / forgiving / no-game-over** — every math interaction re-asks on wrong with zero penalty/lockout/XP-loss/despawn/restart; enemies never deal contact damage; nothing counts down.

- [x] **Phase 13: Fresh Save Format + Level Registry/Data** - Clean-reset versioned save + per-level persistence and the pure level registry/builder spine (completed 2026-06-29)
- [x] **Phase 14: Multi-Scene Shell** - Title + level-select + game.js parametrized by levelId, establishing the factory/closure/controller-cancel/import-safety contracts (completed 2026-07-02, incl. mandatory real-browser NAV-01..04 checkpoint)
- [x] **Phase 15: Challenge Seam + Locked-Door Mechanic** - No-behavior-change extraction of the shared forgiving challenge component; the door/key mechanic proves the seam (completed 2026-07-02)
- [ ] **Phase 16: Remaining Mechanics + Difficulty Curve** - Defeat-enemy, multiple gates, collect-the-answer, plus the per-level allowed-tables ramp
- [ ] **Phase 17: Build the Levels** - 3–5 hand-built, completable levels with a platforming difficulty ramp on the ready builder + mechanics
- [ ] **Phase 18: Art, Animation & Parallax** - Animated player, real dark-grunge tileset, camera-tied parallax, styled title/select screens
- [ ] **Phase 19: Polish & Consolidated Kid-UAT** - Extend the ADHD-safety + import-safety audits across all new mechanics/art; kid sign-off

## Phase Details

### Phase 13: Fresh Save Format + Level Registry/Data

**Goal**: A fresh, versioned, clean-reset save format (per-level completion/unlock + XP/level/practice-history) and a pure level registry + parameterized builder are in place — the data spine every later phase consumes, with zero engine (a727c13) risk.
**Depends on**: Nothing (first v4.0 phase; extends shipped `progress.js` and `level.js`)
**Requirements**: SAVE-05, SAVE-06, SAVE-07, LVL-02
**Success Criteria** (what must be TRUE):

  1. The game writes and reads a fresh, versioned save under a new key; a missing, stale, or foreign/corrupt save loads safe defaults and never bricks boot (SAVE-05) — existing v3.0 data is deliberately NOT migrated.
  2. Per-level `cleared` state persists in localStorage and survives a reload; `unlocked` is *derived* from `LEVEL_ORDER` (first level unlocked; a level unlocks when the previous one is cleared) rather than stored as a second source of truth (SAVE-06).
  3. XP / level and per-table practice history persist within the fresh save and seed the (unchanged) brain so question selection stays adapted to her weak spots across visits (SAVE-07).
  4. Levels are plain JS data objects consumed by a single parameterized builder and registered in an ordered registry — the v3.0 level lifts in verbatim as level-01, with no build step, no Kaplay `addLevel`, no Tiled (LVL-02).

**Plans**: 4/4 plans complete
**Wave 1**

- [x] 13-01-PLAN.md — Wave 0: extend smoke + structural gate for the new save shape, registry, and import-safety
- [x] 13-02-PLAN.md — Wave 1: fresh versioned save key + per-level cleared map + helpers (SAVE-05/06/07)
- [x] 13-03-PLAN.md — Wave 1: level registry + parameterized builder + verbatim level-01 + derived unlock (LVL-02/SAVE-06)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 13-04-PLAN.md — Wave 2: rewire game.js to the registry, thread allowedTables, persist cleared, delete level.js, mandatory browser boot

### Phase 14: Multi-Scene Shell

**Goal**: She boots into a dark-grunge title, moves to a level-select that shows locked/unlocked/cleared state, and plays any unlocked level — all via in-game screens with clean state on every entry. This phase establishes the factory + closure-state + controller-cancel + import-safety contracts every later engine-touching phase inherits.
**Depends on**: Phase 13 (registry + save the select screen reads)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):

  1. On load a dark-grunge title screen appears, from which she can start/continue into the game (NAV-01).
  2. A level-select screen lists every registered level with locked / unlocked / cleared marks and lets her pick any unlocked level to play (NAV-02).
  3. Clearing a level unlocks the next; she can return to level-select and resume from any unlocked level with no forced replay of earlier levels (NAV-03).
  4. Navigation between title, select, and a level happens via Kaplay scenes (no browser dialogs); entering→leaving→re-entering any screen twice leaves no leaked input handlers, colliders, tweens, or effects (NAV-04) — verified by a real browser boot, with `scripts/check-import-safety.sh` green.

**Plans**: 3/3 plans complete
**UI hint**: yes

**Wave 1**

- [x] 14-01-PLAN.md — Wave 0 import-safety gate (a727c13) + title scene (NAV-01) + select scene (NAV-02) + CONFIG layout

**Wave 2** *(blocked on Wave 1)*

- [x] 14-02-PLAN.md — main.js boot → go("title"); game.js clear→select + Escape→select (NAV-03); full static gate green

**Wave 3** *(blocked on Wave 2)*

- [x] 14-03-PLAN.md — mandatory real browser boot: full nav flow + NAV-04 enter→leave→re-enter-twice leak check (blocking human-verify)

### Phase 15: Challenge Seam + Locked-Door Mechanic

**Goal**: One shared in-world challenge component backs every math interaction (forgiving, no-timer, multiple-choice), extracted from `mathGate.js` with byte-for-byte end-of-level behavior preserved; the locked-door/key mechanic proves the seam mid-level.
**Depends on**: Phase 14 (game scene + mechanics wiring surface)
**Requirements**: MECH-01, MECH-02
**Success Criteria** (what must be TRUE):

  1. A single shared `ui/challenge.js` backs every math interaction; a wrong answer re-asks with no penalty and no progress lost, and `mathGate.js` becomes a thin caller so the existing end-of-level gate behaves identically (MECH-01).
  2. Answering correctly at a mid-level locked door/bridge opens it and clears the path to the next section; a wrong answer never consumes the key, locks her out, or sends her back (MECH-02).
  3. The mid-level overlay pauses the world (player can't move, fall, or be hurt while answering), owns input, and renders screen-space above world and parallax — confirmed by opening it next to a hazard.
  4. The structural firewall (`check-gate.sh`) is re-pointed at `challenge.js` so the one-way ui→brain firewall and no-DOM/no-timer/no-scenes invariants hold for all callers; a real browser boot confirms the end gate still works.

**Plans**: 4 plans
**UI hint**: yes

**Wave 1**

- [x] 15-01-PLAN.md — Wave 0 tooling: restore + re-point `check-gate.sh` at `challenge.js`; extend `check-import-safety.sh` for `challenge.js`/`door.js`
- [x] 15-02-PLAN.md — Extract `ui/challenge.js` from `mathGate.js`; rewrite `mathGate.js` as a thin wrapper (MECH-01)

**Wave 2** *(blocked on 15-02)*

- [x] 15-03-PLAN.md — Locked-door entity + mechanic: `CONFIG.DOOR`, level-01 door placement, `build.js` consumer, `mechanics/door.js` (MECH-02)

**Wave 3** *(blocked on 15-01 + 15-03)*

- [x] 15-04-PLAN.md — Wire `wireDoor` into `game.js`; full static suite green; mandatory real-browser boot (MECH-01/MECH-02 sign-off)

### Phase 16: Remaining Mechanics + Difficulty Curve

**Goal**: All four math mechanics are usable as level-data fields over the one shared challenge seam, and table difficulty ramps across levels via a per-level allowed-tables pool passed into the unchanged brain.
**Depends on**: Phase 15 (the proven challenge seam)
**Requirements**: MECH-03, MECH-04, MECH-05, LVL-03
**Success Criteria** (what must be TRUE):

  1. Defeat-enemy: answering correctly removes a blocking enemy (👺💀🐉 reuse); the enemy never deals contact damage and never ends the run (MECH-05).
  2. Multiple checkpoint gates: several in-level math gates (not only at the goal) each track independently within the level (MECH-04).
  3. Collect-the-answer: the correct numeric answer is one of several in-world pickups; collecting the right one clears the challenge and collecting a wrong one never punishes (MECH-03).
  4. Table difficulty ramps across levels — early levels draw from easier pools (e.g. 1–5), later levels restrict toward 6–9 — via a per-level allowed-tables pool fed to the (unchanged, LOCKED) weighted brain (LVL-03).
  5. Each mechanic passes a per-mechanic forgiveness check: no wrong-answer code path reduces XP/HP/position-progress, despawns, restarts, or shows a countdown (`check-safety.sh` green per mechanic).

**Plans**: TBD

### Phase 17: Build the Levels

**Goal**: The game has 3–5 distinct, hand-built, completable levels wired into the registry/select, each traversable start→goal on the existing movement/collider spine, with a gentle platforming difficulty ramp.
**Depends on**: Phase 16 (all mechanics available as data fields) and Phase 13 (builder/registry)
**Requirements**: LVL-01, LVL-04
**Success Criteria** (what must be TRUE):

  1. There are 3–5 distinct, hand-built levels, each completable start→goal on the existing movement/collider spine, each enumerated and selectable from level-select (LVL-01).
  2. Platforming difficulty ramps across levels — length, gap precision, and hazard density increase gradually through level data — without any single level being a frustration wall (LVL-04).
  3. Platforming and table difficulty ramp on *decoupled* axes (no level spikes both at once), keeping the curve gentle for the ADHD profile.
  4. A full playthrough — title → select → each unlocked level → clear → next unlocks → resume — works end-to-end in a real browser.

**Plans**: TBD

### Phase 18: Art, Animation & Parallax

**Goal**: The game looks like a real game — an animated player, a real dark-grunge tileset, a calm parallax background, and styled title/select screens — layered onto the already-working logic, with every Kaplay reference kept inside function bodies (a727c13).
**Depends on**: Phase 17 (levels exist to skin) and Phase 14 (title/select to style)
**Requirements**: ART-01, ART-02, ART-03, ART-04
**Success Criteria** (what must be TRUE):

  1. The player is an animated sprite with idle / run / jump states that faces its movement direction; animation is frame-rate-independent (anim `speed`, not dt) and never freezes on frame 0 while moving (ART-01).
  2. Levels render with a real dark-grunge tileset (not single-color placeholders), with readable silhouettes against the background (ART-02).
  3. A layered / parallax background gives depth — calm, camera-tied (not timer-driven), non-strobing (ART-03).
  4. The title and level-select screens are styled to the dark-grunge aesthetic with no pink (ART-04).
  5. Every new sprite/parallax module keeps all engine calls inside function bodies; `loadSprite` (not `loadSpriteSheet`) loads from `../assets/...` in `main.js` after `kaplay()`; the game boots cleanly in a real browser with `check-import-safety.sh` green.

**Plans**: TBD
**UI hint**: yes

### Phase 19: Polish & Consolidated Kid-UAT

**Goal**: The full assembled milestone is audited ADHD-safe across all new mechanics, levels, enemies, and art, and is signed off by the kid in a consolidated end-to-end playtest.
**Depends on**: Phase 18 (the finished art/parallax/enemy set to audit)
**Requirements**: SAFE-04, SAFE-05
**Success Criteria** (what must be TRUE):

  1. The no-timer / forgiving / no-game-over mandate holds across ALL new mechanics, levels, and enemies — audited green via the extended `check-safety.sh` and an import-safety grep — nothing counts down, punishes a wrong answer, or ends the run (SAFE-04).
  2. New art, parallax, and effects stay non-strobing and not over-stimulating (motion/flash within the established ≤400–500ms caps, dark-grunge / no pink), confirmed in kid-UAT (SAFE-05).
  3. The kid plays title → multiple levels → varied math gates → progression/resume end-to-end and signs off that it's fun and nothing feels unfair or too busy.

**Plans**: TBD

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
| 13. Fresh Save Format + Level Registry/Data | v4.0 | 4/4 | Complete    | 2026-06-29 |
| 14. Multi-Scene Shell | v4.0 | 3/3 | Complete    | 2026-07-02 |
| 15. Challenge Seam + Locked-Door Mechanic | v4.0 | 4/4 | ✅ Complete | 2026-07-02 |
| 16. Remaining Mechanics + Difficulty Curve | v4.0 | 0/? | Not started | - |
| 17. Build the Levels | v4.0 | 0/? | Not started | - |
| 18. Art, Animation & Parallax | v4.0 | 0/? | Not started | - |
| 19. Polish & Consolidated Kid-UAT | v4.0 | 0/? | Not started | - |

---

*Archives: [v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md) · [v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md)*
