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

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Engagement

- **ENG-01**: Session summary shown after a play session (questions answered, XP earned, accuracy)
- **ENG-02**: Audio feedback — reward sounds for correct answers and level-up (optional/mutable)
- **ENG-03**: Novelty rotation — 2–3 alternative question formats to prevent habituation
- **ENG-04**: Cosmetic progression — unlock visual styles/themes at level milestones

### Notifications & Habit

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
