# Requirements: Math Lab

**Defined:** 2026-06-20
**Core Value:** She opens it because she *wants* to, not because she has to.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Game Loop

- [x] **CORE-01**: User is shown one multiplication question at a time with 4 multiple-choice answer options
- [x] **CORE-02**: User receives instant visual feedback (correct / wrong) within 300ms of selecting an answer
- [x] **CORE-03**: User earns XP for each correct answer; hard tables (6–9) award bonus XP
- [x] **CORE-04**: User sees a level-up celebration (animation/fanfare) when crossing a level threshold

### Question Selection

- [x] **QUES-01**: Questions are weighted: 6–9 multiplication tables appear ~70% of the time
- [x] **QUES-02**: 1–5 multiplication tables appear ~30% of the time as confidence-builders
- [x] **QUES-03**: Answer options are randomized each question (never in the same position)

### Progression & Persistence

- [x] **PROG-01**: User's XP and level are saved to localStorage and restored on next visit
- [x] **PROG-02**: A visible XP bar always shows how far the user is to the next level
- [x] **PROG-03**: Per-table accuracy is tracked and saved; tables she gets wrong more often are drilled more

### UX & Design

- [ ] **UX-01**: App uses a dark grunge aesthetic — dark background (#0a0a0a range), bold fonts, no pink
- [x] **UX-02**: No countdown timer exists anywhere in the app (hard constraint)
- [ ] **UX-03**: Text and UI elements meet WCAG 2.1 AA contrast on the dark theme
- [x] **UX-04**: App is a single HTML file that runs locally in any browser on Windows with no install

## v2.0 Requirements

Requirements for the Dungeon Crawler milestone. Continues phase numbering from Phase 1.

### Dungeon Structure

- [x] **DC-01**: Dungeon has 5 rooms per floor (entrance → 3 combat rooms → boss room), 3 floors + boss floor
- [x] **DC-02**: Game phase FSM controls transitions: EXPLORE → COMBAT → LOOT → TRANSITION → DEAD
- [ ] **DC-03**: Separate screens exist for: dungeon map, combat, loot drop, floor summary, death/retry

### Combat

- [x] **COMB-01**: Turn-based math combat — correct answer attacks enemy, wrong answer deals damage to player
- [ ] **COMB-02**: HP bars (CSS transition-animated) for both player and current enemy
- [x] **COMB-03**: Defeating an enemy requires 3–7 correct answers (not a 1-shot; Goblin=3, Skeleton=5, Dragon=7 based on HP/damage constants)
- [ ] **COMB-04**: Visual combat feedback: floating damage numbers, HP bar drain animation after each hit
- [ ] **COMB-05**: All combat copy is RPG-themed ("Attack!" not "Correct!", "You took a hit!" not "Wrong")

### Enemies

- [x] **ENE-01**: 3 enemy types with distinct emoji sprites: 👺 Goblin (Floor 1), 💀 Skeleton (Floor 2), 🐉 Dragon (Floor 3 + boss)
- [x] **ENE-02**: Enemy HP and XP reward scale with floor number
- [ ] **ENE-03**: Each enemy type has 3+ flavor text lines shown during combat to prevent repetition

### Table Difficulty

- [x] **DIFF-01**: Each floor gates a specific multiplication table pool (Floor 1: ×2×3×5, Floor 2: ×4×6×7, Floor 3: ×7×8×9)
- [x] **DIFF-02**: Within each floor's pool, v1 EWMA accuracy weighting applies — harder-for-her tables appear more often

### Progression

- [x] **PROG2-01**: XP is awarded on enemy defeat and feeds the existing v1 XP/level system
- [x] **PROG2-02**: Floor summary screen shown after each floor cleared (enemies defeated, XP earned, HP remaining)
- [x] **PROG2-03**: PersistenceStore upgraded to v2 schema; v1 XP and per-table accuracy data preserved on migration

### Loot

- [x] **LOOT-01**: 3 loot item types: sword (attack boost), shield (damage reduction), health potion (HP restore)
- [x] **LOOT-02**: Player holds max 1 of each type; items auto-apply on pickup — no inventory choice required
- [x] **LOOT-03**: Loot resets on floor death/retry — the floor starts fresh each attempt

### ADHD Safety

- [ ] **ADHD-01**: No timers in any form — no turn timer, no session clock, no countdown anywhere
- [ ] **ADHD-02**: Death = restart current floor only; XP and level never decrease
- [x] **ADHD-03**: Wrong-answer damage is capped so the player survives at least 5 wrong answers per fight
- [ ] **ADHD-04**: All combat animations complete in ≤500ms; no screen flash or harsh shake effects
- [ ] **ADHD-05**: Death screen shows no comparison stats (no "best run", no "questions answered")

### Tech Constraints

- [x] **TECH2-01**: Single HTML file constraint preserved — all CSS and JS inline, no external dependencies
- [x] **TECH2-02**: `data-screen` attribute on `<main>` drives all screen switching via CSS (no innerHTML thrash)
- [x] **TECH2-03**: DungeonState is session-scoped only — HP, room position, and loot are never written to localStorage

## Deferred Features

Features scoped out of v2.0 but tracked for future milestones.

### v2.1 Candidates

- **ENG-01**: Enemy flavor text taunts upgrade — voiced/animated (v2.0 ships static text)
- **LOOT-04**: Loot persists across floor retries within a run
- **PROG2-04**: HP recovery on floor clear
- **ENE-04**: Enemy HP scaling with player level

### v3.0 Candidates

- **ENG-02**: Audio feedback — reward sounds for correct answers and level-up (optional/mutable)
- **ENG-03**: Novelty rotation — 2–3 alternative question formats to prevent habituation
- **ENG-04**: Cosmetic progression — unlock visual styles/themes at level milestones
- **HAB-01**: Optional daily reminder / streak (non-punitive — no "you lost your streak" messaging)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Countdown / time-pressure timer | ADHD context — triggers cortisol and destroys working memory |
| Leaderboards or social comparison | Shame spiral risk; this is solo practice |
| Online / server component | Fully local — no server, no account, no data leaves the device |
| Pink or "girly" visual design | Explicitly rejected by target user |
| Typed input answers | Multiple choice chosen to reduce friction and frustration |
| Mobile-only UI | Windows laptop browser is the target device |
| Video or complex media | Single HTML file — keep it lean |

## Traceability

Updated during roadmap creation. Maps every v1 requirement to its phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Complete |
| CORE-02 | Phase 1 | Complete |
| CORE-03 | Phase 1 | Complete |
| CORE-04 | Phase 1 | Complete |
| QUES-01 | Phase 1 | Complete |
| QUES-02 | Phase 1 | Complete |
| QUES-03 | Phase 1 | Complete |
| PROG-01 | Phase 1 | Complete |
| PROG-02 | Phase 1 | Complete |
| PROG-03 | Phase 1 | Complete |
| UX-01 | Phase 1 | Pending |
| UX-02 | Phase 1 | Complete |
| UX-03 | Phase 1 | Pending |
| UX-04 | Phase 1 | Complete |

**Coverage:**

- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---

*Requirements defined: 2026-06-20*
*Traceability updated: 2026-06-20 during roadmap creation*
