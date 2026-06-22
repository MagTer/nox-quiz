# Math Lab

## What This Is

A standalone local web app (single HTML file) for a 12-year-old girl to practice multiplication tables through a dungeon crawler game. She fights Goblins, Skeletons, and Dragons by solving multiplication problems — correct answers attack, wrong answers let the enemy hit back. Dark grunge aesthetic, no pink, no timers, no pressure. Ships as a single `.html` file that opens directly in any browser.

## Core Value

She opens it because she *wants* to, not because she has to.

## Requirements

### Validated

- ✓ Multiplication practice focused on 6–9 tables, mixed with easier ones — v1.0, v2.0
- ✓ Multiple choice answers (4 options) — no typing frustration — v1.0
- ✓ XP and level system that persists between sessions (localStorage) — v1.0, upgraded v2.0
- ✓ Endless play with level-up checkpoints breaking it up — v1.0
- ✓ Dark grunge aesthetic — dark backgrounds, bold fonts, no pink — v1.0
- ✓ No stress-inducing countdown timers — fast feedback, forgiving flow — v1.0, ADHD-safe verified v2.0
- ✓ Runs as a standalone local HTML file on Windows (no server, no install) — v1.0, v2.0
- ✓ Dungeon crawler combat layer: enemies, HP bars, loot, floor progression — v2.0
- ✓ Floor-gated question pools (DIFF-01) + EWMA adaptive weighting in combat (DIFF-02) — v2.0

### Active

*(No active requirements pending — start of v3.0 scope definition)*

### Out of Scope

- Online/server component — keep it local-only
- Pink or "girly" visual design — explicitly excluded
- Timed pressure mechanics — ADHD context, stress must be avoided
- Mobile-only UI — Windows laptop is the target device
- Leaderboards or social comparison — shame spiral risk; solo practice only
- Typed input answers — multiple choice chosen to reduce friction

## Context

- **Target user**: 12-year-old girl, under investigation for ADHD
- **Tone**: Cool, a little edgy, rewarding without being cutesy
- **Input**: Multiple choice (4 options per question) reduces friction when stuck
- **Focus**: 6–9 times tables are the weak spot, but mixing in 1–5 keeps it fun
- **Platform**: Single HTML file, runs in any browser on Windows laptop — fully portable
- **Current state (v2.0)**: 1,976 LOC single HTML file. Dungeon crawler fully playable — 4 floors, 3 enemy types (👺💀🐉), loot system, floor-gated question pools, ADHD audit passed. Tech stack: vanilla ES2020+, CSS3, localStorage, zero dependencies.
- **Known tech debt**: levelUpFlash animation is 800ms (ADHD-04 cap is 500ms); DC-01 room count spec mismatch (6 rooms implemented, 5 spec'd); SC-4 v1→v2 localStorage migration not browser-tested with real v1 save.
- **User feedback**: Not yet collected post-v2.0 — first real play sessions pending.

## Constraints

- **Tech stack**: Single HTML file with embedded CSS and JS — zero dependencies, no build step
- **Deployment**: Local file open in browser — no server, no install required
- **Design**: Grunge/dark aesthetic; explicitly no pink, no bubbly or childish elements

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multiple choice over typed input | Reduces frustration for ADHD profile; faster flow | ✓ Good — retained v2.0 |
| localStorage for persistence | No backend; works offline; simple and reliable | ✓ Good — v2 migrated cleanly |
| Single HTML file | Portable, runs on Windows without setup | ✓ Good — retained through dungeon layer |
| No countdown timer | Pressure is the enemy; fast feedback without stress | ✓ Good — ADHD audit passed |
| Wrap v1 engine, don't replace | CombatEngine/GameFSM wrap QuestionSelector/PlayerState | ✓ Good — zero v1 regressions |
| Session-scoped DungeonState | HP/room/loot not persisted; run resets on tab close | ✓ Good — clean retry semantics |
| Floor-gated table pools | Each floor limits to its multiplication tier | ✓ Good — meaningful difficulty progression |
| Death = restart floor, XP intact | ADHD-safe; no punishment loop | ✓ Good — ADHD-02 passes |
| Loot auto-applies on pickup | No inventory choice = less cognitive load | ✓ Good — LOOT-02 passes |
| 4 floors (3 + boss) | Extended run without permadeath complexity | — Pending user feedback |

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
*Last updated: 2026-06-22 after v2.0 milestone — Dungeon Crawler Phases*
