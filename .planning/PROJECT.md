# Math Lab

## What This Is

A standalone local web app (single HTML file) for a 12-year-old girl to practice multiplication tables through a dungeon crawler game. She fights enemies by solving multiplication problems — correct answers attack, wrong answers let the enemy hit back. Dark grunge aesthetic, no pink, no timers, no pressure.

## Current Milestone: v2.0 Dungeon Crawler

**Goal:** Transform the math practice app into a dungeon crawler where multiplication is the combat mechanic — she fights enemies to go deeper, she doesn't just answer questions.

**Target features:**
- Room-by-room dungeon exploration (5–6 rooms per floor, 3 floors + boss)
- Combat: correct answer attacks enemy, wrong answer = take damage (HP system)
- 3 enemy types: Goblin (easy tables), Skeleton (medium), Dragon boss (hard, multi-hit)
- Loot drops: sword upgrade, shield, health potions
- Progressive floor difficulty: ×2×3×5 → ×4×6×7 → ×7×8×9 → boss
- No permadeath: die = restart the floor
- Session-scoped runs (~5–10 min); adaptive accuracy tracking from v1 carries over

## Core Value

She opens it because she *wants* to, not because she has to.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Multiplication practice focused on 6–9 tables, mixed with easier ones
- [ ] Multiple choice answers (4 options) — no typing frustration
- [ ] XP and level system that persists between sessions (localStorage)
- [ ] Endless play with level-up checkpoints breaking it up
- [ ] Dark grunge aesthetic — dark backgrounds, bold fonts, no pink
- [ ] No stress-inducing countdown timers — fast feedback, forgiving flow
- [ ] Runs as a standalone local HTML file on Windows (no server, no install)

### Out of Scope

- Online/server component — keep it local-only
- Pink or "girly" visual design — explicitly excluded
- Timed pressure mechanics — ADHD context, stress must be avoided
- Mobile-only UI — Windows laptop is the target device

## Context

- **Target user**: 12-year-old girl, under investigation for ADHD
- **Tone**: Cool, a little edgy, rewarding without being cutesy
- **Input**: Multiple choice (4 options per question) reduces friction when stuck
- **Focus**: 6–9 times tables are the weak spot, but mixing in 1–5 keeps it fun and builds confidence
- **Persistence**: localStorage saves XP and level between sessions — motivating to return
- **Platform**: Single HTML file, runs in any browser on Windows laptop — fully portable

## Constraints

- **Tech stack**: Single HTML file with embedded CSS and JS — zero dependencies, no build step
- **Deployment**: Local file open in browser — no server, no install required
- **Design**: Grunge/dark aesthetic; explicitly no pink, no bubbly or childish elements

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multiple choice over typed input | Reduces frustration for ADHD profile; faster flow | — Pending |
| localStorage for persistence | No backend; works offline; simple and reliable | — Pending |
| Single HTML file | Portable, runs on Windows without setup | — Pending |
| No countdown timer | Pressure is the enemy; fast feedback without stress | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-20 — v2.0 Dungeon Crawler milestone started*
