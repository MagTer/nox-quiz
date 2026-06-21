# Roadmap: Math Lab

**Project:** Math Lab - Gamified Math Practice for Kids
**Mode:** mvp
**Created:** 2026-06-20
**Last updated:** 2026-06-21

## Overview

This roadmap maps 14 v1 requirements into 1 phase that delivers a complete, playable MVP as a single HTML file. The phase prioritizes ADHD-safe mechanics, immediate feedback, and persistent progress to create an engaging experience that doesn't rely on time pressure or social comparison.

**Phases:** 1
**Granularity:** standard
**Coverage:** 14/14 v1 requirements mapped ✓

## Phases

- [x] **Phase 1: MVP Core Loop & ADHD-Safe Mechanics** - Single-file gamified math practice with XP, levels, dark aesthetic, and offline persistence (completed 2026-06-20)

## Phase Details

### Phase 1: MVP Core Loop & ADHD-Safe Mechanics

**Goal:** Deliver a complete, single-file HTML math practice game where users play unlimited questions, earn XP for correct answers, level up with visual celebration, and track progress across sessions without any time pressure.

**Mode:** mvp

**Depends on:** Nothing (first phase)

**Requirements:** CORE-01, CORE-02, CORE-03, CORE-04, QUES-01, QUES-02, QUES-03, PROG-01, PROG-02, PROG-03, UX-01, UX-02, UX-03, UX-04

**Success Criteria** (what must be TRUE):

1. User can play unlimited multiplication questions, each shown one at a time with 4 randomized multiple-choice answer options, and clicking an option shows correct/wrong feedback within 300ms

2. User earns XP for correct answers (base amount for easy tables 1–5, bonus for hard tables 6–9), sees a visible XP progress bar updating, and experiences a celebration animation/effect when leveling up

3. User's XP, level, and per-table accuracy tracking are saved to localStorage and fully restored when the browser is closed and reopened

4. App uses a dark grunge aesthetic (#0a0a0a background range, bold fonts, no pink) with 4.5:1 minimum text contrast (WCAG 2.1 AA) and contains no countdown timers anywhere

5. Questions are weighted so hard multiplication tables (6–9) appear ~70% of the time and easy tables (1–5) appear ~30% of the time, with answer positions randomized to prevent pattern bias

6. App runs as a single, self-contained HTML file that opens in any browser on Windows with zero installation, no server, and no external dependencies

**Plans:** 4/4 plans complete

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Walking Skeleton: HTML structure, CSS base theme, CONFIG + all JS modules, end-to-end game loop (CORE-01, CORE-02, CORE-03, CORE-04, UX-02, UX-04)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — XP persistence: full PersistenceStore implementation, localStorage save/load, XP bar hardening (PROG-01, PROG-02)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Weighted question selection + adaptive accuracy: Fisher-Yates shuffle, EWMA accuracy tracking, 70/30 hard/easy weighting (QUES-01, QUES-02, QUES-03, PROG-03)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-04-PLAN.md — Grunge polish + WCAG verification: SVG feTurbulence grain, full dark theme CSS, contrast checkpoint (UX-01, UX-03)

**UI hint:** yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. MVP Core Loop & ADHD-Safe Mechanics | 4/4 | Complete   | 2026-06-20 |

---

**Coverage Summary:**

✓ All 14 v1 requirements mapped
✓ No orphaned requirements
✓ No requirement duplicates

**Notes:**

- Phase 1 is the complete MVP. All v1 requirements are foundational to a playable game.
- v2 requirements (engagement features, audio, cosmetic progression, habit tracking) are deferred to future release.
- Research confirms critical pitfalls (reward fatigue, localStorage corruption, accessibility, pressure mechanics) are addressable within Phase 1 design constraints.
- Phase 1 is ready for planning via `/gsd-plan-phase 1`.

---

*Roadmap created: 2026-06-20 by GSD roadmapper*
*Status: Draft complete, ready for user review*

---

## v2.0 Dungeon Crawler Phases

**Goal:** Transform the math practice app into a dungeon crawler where multiplication is the combat mechanic. The v1 engine (QuestionSelector, XpCalculator, PlayerState, PersistenceStore, Renderer, InputHandler, App) is wrapped, not replaced. Three new modules (GameFSM / DungeonState, CombatEngine, DungeonRenderer) sit around the existing engine, consuming it without modifying its internals.

**Phases:** 5 (Phase 2 through Phase 6)
**Granularity:** standard
**Coverage:** 27/27 v2.0 requirements mapped ✓

### v2.0 Phase Summary

- [x] **Phase 2: Combat Foundation** - GameFSM, DungeonState, CombatEngine, FloorConfig, and PersistenceStore v2 migration — all logic, no DOM touches (completed 2026-06-21)
- [ ] **Phase 3: Screen Architecture** - All dungeon screen panels in HTML, data-screen CSS visibility system, App mode routing, InputHandler guard
- [ ] **Phase 4: Dungeon Renderer** - DungeonRenderer, emoji enemy sprites, CSS HP bars, combat animations, floor-complete screen visuals
- [ ] **Phase 5: Full Floor Loop + Balance** - End-to-end playable run, loot system, boss floor, death/retry, XP integration, balance tuning
- [ ] **Phase 6: Polish + ADHD Safety Audit** - Flavor text, RPG copy pass, ADHD safety checklist, localStorage migration test with real v1 data

---

## v2.0 Phase Details

### Phase 2: Combat Foundation

**Goal:** All dungeon combat logic exists and is verifiable in the browser console — FSM transitions, HP math, damage resolution, floor table pools, and save migration — before any DOM element is created.

**Depends on:** Phase 1

**Requirements:** DC-02, COMB-01, COMB-03, ENE-01, ENE-02, DIFF-01, DIFF-02, PROG2-01, PROG2-03, TECH2-03

**Success Criteria** (what must be TRUE):

1. Opening the browser console and calling `GameFSM.transition('COMBAT')` from EXPLORE state succeeds; calling an illegal transition (e.g. EXPLORE → DEAD) throws or is rejected — state machine enforces legal transitions
2. `CombatEngine.resolveAnswer(true)` reduces enemy HP by the correct damage value; `CombatEngine.resolveAnswer(false)` reduces player HP by the capped wrong-answer damage; both values are named CONFIG constants
3. Defeating an enemy (reducing its HP to 0 via correct answers) awards XP to the existing v1 PlayerState XP total — the v1 level-up system fires normally
4. FloorConfig returns distinct enemy types (Goblin / Skeleton / Dragon), HP values, and table pools for Floor 1, Floor 2, and Floor 3 — verified by inspecting the config object in the console
5. On first load with a real v1 localStorage save present, PersistenceStore v2 reads the v1 key, migrates XP and per-table accuracy forward, writes to `mathlab_save_v2`, and the player's level and accuracy data are intact — v1 key is left untouched
6. DungeonState (floor, room, player HP, enemy HP, loot inventory) is entirely session-scoped — closing and reopening the tab resets it; nothing from DungeonState appears in `mathlab_save_v2`

**Plans:** 3/3 plans complete

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — CONFIG.DUNGEON constants + GameFSM state machine + FloorConfig enemy definitions

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — CombatEngine (HP math, damage resolution, XP on kill) + DungeonState (session-scoped)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md — PersistenceStore v2 migration: auto-migrate v1 saves to mathlab_save_v2 on load

**Research flag:** None — all patterns are standard vanilla JS / localStorage migration. No research phase required.

---

### Phase 3: Screen Architecture

**Goal:** All dungeon screens exist as HTML panels and the single `renderScreen()` routing function controls which panel is visible — no screen content is built yet, but navigation between any named state works without visual overlap.

**Depends on:** Phase 2

**Requirements:** DC-03, TECH2-01, TECH2-02

**Success Criteria** (what must be TRUE):

1. Calling `App.transition('dungeon-map')`, `App.transition('combat')`, `App.transition('loot')`, `App.transition('floor-summary')`, and `App.transition('dead')` each shows exactly one screen panel and hides all others — verified visually with placeholder content in each panel
2. All screen switching is driven exclusively by the `data-screen` attribute on `<main>` and CSS rules scoped to it — no `innerHTML` replacement, no `display` toggling in JavaScript outside of a single `renderScreen()` function
3. InputHandler rejects answer submissions when `App.mode !== 'dungeon'` — the existing v1 quiz flow does not fire during dungeon combat
4. The app remains a single HTML file with all CSS and JS inline and no external resource requests — file opens directly from disk with no server

**Plans:** 1/2 plans executed

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — HTML data-panel structure + CSS visibility system: wrap quiz in section[data-panel="quiz"], add 5 dungeon placeholder sections, CSS [data-panel] default:none + main[data-screen="X"] show rules

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 03-02-PLAN.md — JS routing: App elevated with mode + transition(), renderScreen(), window.App export, InputHandler mode guard

**Research flag:** None — standard data-screen / CSS visibility pattern. No research phase required.

**UI hint:** yes

---

### Phase 4: Dungeon Renderer

**Goal:** Combat looks and feels like a game — enemy sprites are visible, HP bars drain with animation, floating damage numbers appear after each hit or miss, and the floor-complete screen shows after clearing a floor.

**Depends on:** Phase 3

**Requirements:** COMB-02, COMB-04, COMB-05, ENE-03

**Success Criteria** (what must be TRUE):

1. During combat, player HP bar and enemy HP bar are both visible; after a correct answer the enemy HP bar visually drains (CSS `transition: width`) to its new value within 300ms; after a wrong answer the player HP bar drains within 300ms
2. After each correct answer a floating damage number animates upward from the enemy sprite and fades out within 500ms; after each wrong answer a floating number animates over the player HP bar — no screen flash, no harsh shake effect
3. Combat UI uses RPG copy exclusively — the answer feedback reads "Attack!" or "Critical hit!" for correct answers and "You took a hit!" or equivalent for wrong answers; the word "Correct" and the word "Wrong" do not appear anywhere in the dungeon screens
4. Each enemy type (Goblin, Skeleton, Dragon) displays a distinct emoji sprite at 5–6rem; each enemy has at least 3 flavor text lines shown during combat that rotate so the same line does not appear twice in a row
5. After all enemies on a floor are defeated, the floor-complete screen is shown with the correct floor number, enemy count, and XP earned — before the player advances to the next floor

**Plans:** 3 plans

Plans:
**Wave 1**

- [ ] 04-01-PLAN.md — HTML panel structure (combat layout, floor-summary/loot/dead slots) + CSS (HP bars, @keyframes floatUp, damage number classes)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 04-02-PLAN.md — MODULE 11: DungeonRenderer IIFE module with all 8 public methods, FLAVOR arrays, lastFlavorIndex rotation guard

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 04-03-PLAN.md — CombatInputHandler wired inside DOMContentLoaded: answer loop, resolveAnswer, HP drain, damage numbers, screen transitions on kill/death

**Research flag:** None — standard CSS @keyframes patterns. ADHD animation limits (all under 500ms, no flash/shake) must be enforced during implementation — treat as a hard constraint, not a review item.

**UI hint:** yes

---

### Phase 5: Full Floor Loop + Balance

**Goal:** A player can start a new dungeon run, fight through 5 rooms on each of 3 floors plus a boss floor, collect loot that auto-applies, die and retry from the current floor with no XP loss, and complete the full dungeon — end to end, no dead ends.

**Depends on:** Phase 4

**Requirements:** DC-01, LOOT-01, LOOT-02, LOOT-03, PROG2-02, ADHD-03

**Success Criteria** (what must be TRUE):

1. A complete dungeon run is possible: entrance room → 3 combat rooms → boss room on each floor → 3 normal floors → final boss floor — 20 rooms total, no navigation dead ends, no broken state transitions
2. Loot items (sword, shield, health potion) drop from defeated enemies; each item auto-applies immediately on pickup with no player choice required; the player can hold at most 1 of each type and a second pickup of the same type is ignored or visually skipped
3. Dying in any room restarts the current floor from the entrance room with loot cleared and enemy HP reset — player XP total and level are unchanged; the death screen contains no comparison stats or personal-best information
4. After clearing a floor, the floor summary screen displays enemies defeated, XP earned this floor, and HP remaining — then the next floor loads
5. At a 30% correct-answer rate, the player survives at least 5 wrong answers in a single combat encounter without dying — wrong-answer damage is capped and the cap value is a named CONFIG constant; at 70% correct rate the player finishes with HP above 40% at floor end

**Plans:** TBD (estimate: 3–4 plans)

**Research flag:** BALANCE VALUES ARE LOW CONFIDENCE. Before locking CONFIG, model the loot economy at both 30% and 70% correct-answer rates. Starting values (player HP: 100, wrong-answer damage: 5–10 HP, enemy HP: 8/14/30 by floor) are informed estimates only — expect at least one tuning iteration after first real play sessions. All HP, damage, drop-rate, and XP-reward values MUST be named CONFIG constants; no magic numbers in combat logic.

**UI hint:** yes

---

### Phase 6: Polish + ADHD Safety Audit

**Goal:** The dungeon passes an explicit ADHD safety checklist, all dungeon copy reads as an RPG (not a quiz), and the v1-to-v2 save migration is verified with a real v1 data fixture — the app is ready for the actual user.

**Depends on:** Phase 5

**Requirements:** ADHD-01, ADHD-02, ADHD-04, ADHD-05

**Success Criteria** (what must be TRUE):

1. ADHD safety checklist passes — all five unsafe patterns are confirmed absent: (a) no timer of any form exists in any screen, (b) no XP or level loss occurs on death under any code path, (c) wrong-answer damage cap is verified in-browser with 10 consecutive wrong answers in one fight, (d) all combat animations complete within 500ms measured with DevTools Performance panel, (e) the death screen contains zero comparison stats or personal-best fields
2. All dungeon-mode UI copy is RPG-framed: no occurrence of "correct", "wrong", "answer", or "question" in any dungeon screen text — verified by text search of the HTML file
3. Each of the 3 enemy types has at least 3 flavor text lines and the rotation logic prevents the same line appearing twice in a row — verified by triggering 6 consecutive combat exchanges against the same enemy type
4. The app is loaded with a browser that has a real v1 `mathlab_save` localStorage key present; after load the player's pre-existing XP, level, and per-table accuracy are intact in the new `mathlab_save_v2` key; the v1 key is still present and unmodified

**Plans:** TBD (estimate: 2 plans)

**Research flag:** Flavor text tone is a content decision requiring the target user's input — present candidate lines to her before locking. Implementation is trivial; the content is not.

**UI hint:** yes

---

## v2.0 Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 2. Combat Foundation | 3/3 | Complete    | 2026-06-21 |
| 3. Screen Architecture | 1/2 | In Progress|  |
| 4. Dungeon Renderer | 0/3 | Planned | - |
| 5. Full Floor Loop + Balance | 0/4 | Not started | - |
| 6. Polish + ADHD Safety Audit | 0/2 | Not started | - |

---

**v2.0 Coverage Summary:**

✓ All 27 v2.0 requirements mapped
✓ No orphaned requirements
✓ No requirement duplicates

| Requirement | Phase | Status |
|-------------|-------|--------|
| DC-01 | Phase 5 | Pending |
| DC-02 | Phase 2 | Pending |
| DC-03 | Phase 3 | Pending |
| COMB-01 | Phase 2 | Pending |
| COMB-02 | Phase 4 | Pending |
| COMB-03 | Phase 2 | Pending |
| COMB-04 | Phase 4 | Pending |
| COMB-05 | Phase 4 | Pending |
| ENE-01 | Phase 2 | Pending |
| ENE-02 | Phase 2 | Pending |
| ENE-03 | Phase 4 | Pending |
| DIFF-01 | Phase 2 | Pending |
| DIFF-02 | Phase 2 | Pending |
| PROG2-01 | Phase 2 | Pending |
| PROG2-02 | Phase 5 | Pending |
| PROG2-03 | Phase 2 | Pending |
| LOOT-01 | Phase 5 | Pending |
| LOOT-02 | Phase 5 | Pending |
| LOOT-03 | Phase 5 | Pending |
| ADHD-01 | Phase 6 | Pending |
| ADHD-02 | Phase 6 | Pending |
| ADHD-03 | Phase 5 | Pending |
| ADHD-04 | Phase 6 | Pending |
| ADHD-05 | Phase 6 | Pending |
| TECH2-01 | Phase 3 | Pending |
| TECH2-02 | Phase 3 | Pending |
| TECH2-03 | Phase 2 | Pending |

**Notes:**

- Phase 2 must be complete before any DOM work begins — CombatEngine and GameFSM are testable in the browser console with no HTML changes.
- Phase 3 locks in the `data-screen` / `renderScreen()` pattern; nothing that renders a dungeon screen may be built before this is in place.
- Phase 5 balance values (HP, damage, drop rates) are LOW confidence — all must be named CONFIG constants. Expect a tuning pass after first real play sessions.
- Phase 6 ADHD safety checklist is mandatory, not optional polish. The checklist must produce a pass result before v2.0 is considered shippable.
- v1 modules (QuestionSelector, XpCalculator, PlayerState, PersistenceStore, Renderer, InputHandler, App) must not be replaced — only wrapped or minimally extended.

---

*v2.0 Dungeon Crawler roadmap appended: 2026-06-21*
*Coverage: 27/27 v2.0 requirements mapped*
