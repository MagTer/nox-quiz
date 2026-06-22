# Phase 1: MVP Core Loop & ADHD-Safe Mechanics - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a complete, single-file HTML math practice game where users play unlimited multiplication questions, earn XP for correct answers, level up with visual celebration, and track progress across sessions without any time pressure. All 14 v1 requirements (CORE-01 through UX-04) are delivered in this phase.

</domain>

<decisions>
## Implementation Decisions

### Visual Identity
- Primary accent color: neon green `#00ff88` — high contrast on dark, grunge-classic
- Grunge texture: subtle SVG `feTurbulence` grain overlay at ~5% opacity — zero file weight, pure CSS/SVG
- XP bar style: segmented bar (block fills per XP unit) — chunky and satisfying
- Level-up celebration: full-screen brief flash + large "LEVEL UP" text (0.8s) — unmissable

### XP & Level Progression Numbers
- XP for correct easy table (1–5): **10 XP**
- XP for correct hard table (6–9): **20 XP** (2× easy = meaningful bonus)
- XP threshold for Level 1→2: **200 XP** (achievable in a single session)
- Level scaling multiplier: **1.3× per level** (gradual ramp, not frustrating)

### Question Flow & Feedback UX
- After answering: auto-advance after **1 second** feedback delay — keeps momentum without pressure
- Wrong answer feedback: flash selection red + reveal correct answer in green — informative, not punishing
- Running stats: always-visible header showing current level + XP bar — persistent motivation
- Per-table accuracy: tracked internally for weighting only; **not displayed to user** (cleaner UI)

### Wrong Answer & Difficulty Strategy
- Distractor generation: nearby multiples of same multiplier (±1 and ±2 tables) — harder to eliminate by proximity, more instructive
- Question pool range: multiplicand **1–10** (standard school range)
- Struggling table boost trigger: when accuracy for a table drops **below 60%** → increase weight by 1.5×
- Mastery threshold (reduce drilling): **80% accuracy over last 10 questions** for that table

### Claude's Discretion
- Specific font choices within "bold/grunge" direction
- Exact animation easing curves for XP bar fill and level-up flash
- Internal state variable naming and module organization within single-file constraint
- Exact SVG feTurbulence parameters for grain texture (tune to look right)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. Single HTML file will contain all code.

### Established Patterns
- None yet established. Follow CLAUDE.md architectural decisions:
  - `requestAnimationFrame` game loop (fixed-timestep update/render)
  - Closure-based state management (PlayerState, QuestionSelector, Renderer)
  - `localStorage` with `try/catch` for error handling and quota protection
  - `visibilitychange` event for reliable save on tab switch/close

### Integration Points
- Single file: all HTML structure, embedded `<style>`, embedded `<script>`
- No external requests, no CDN, no build step
- `localStorage` key: `mathlab_save_v1` (versioned for future migration)

</code_context>

<specifics>
## Specific Ideas

- Target user is 12 years old, under investigation for ADHD — no time pressure anywhere, fast feedback is the substitute
- "Cool, a little edgy" tone — not cute, not childish, not pink
- Dark background #0a0a0a range; primary text #e8e8e8; all text must meet WCAG 2.1 AA (4.5:1 contrast)
- The app should feel like a game she *chooses* to open, not a homework assignment
- Windows laptop browser target — desktop layout, not mobile-first

</specifics>

<deferred>
## Deferred Ideas

- Audio feedback / reward sounds (v2 — ENG-02)
- Session summary screen after play sessions (v2 — ENG-01)
- Novelty rotation / alternative question formats (v2 — ENG-03)
- Cosmetic progression / unlock visual themes at level milestones (v2 — ENG-04)
- Streak mechanics (v2)
- High-contrast mode toggle (v2)
- Difficulty mode selector (v2 — auto-adaptation handles this in v1)

</deferred>
