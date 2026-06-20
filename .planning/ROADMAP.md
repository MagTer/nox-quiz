# Roadmap: Math Lab

**Project:** Math Lab - Gamified Math Practice for Kids
**Mode:** mvp
**Created:** 2026-06-20
**Last updated:** 2026-06-20

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
