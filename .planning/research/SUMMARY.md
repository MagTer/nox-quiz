# Project Research Summary

**Project:** Math Lab (Gamified Math Practice for Kids)
**Domain:** Single-file, offline-first, gamified educational web app targeting ADHD-adjacent learners
**Researched:** 2026-06-20
**Confidence:** HIGH

## Executive Summary

Math Lab is a lightweight, single-file vanilla JavaScript web application designed as a gamified math practice tool for a 12-year-old with possible ADHD who dislikes traditional math but engages with games. The research consensus strongly recommends a **zero-dependency, offline-first architecture** using vanilla ES2020+ JavaScript with CSS3 styling and localStorage persistence—no frameworks, no build steps, no external dependencies. This choice is not a constraint but a *strength*: the app ships as a single HTML file, loads instantly, works offline, and avoids the cognitive overhead of framework tooling.

The core experience centers on fast feedback loops (questions → immediate validation → XP/progress feedback) designed specifically for ADHD learners. Research shows that without visible progress and without external pressure (timers, leaderboards, streaks), ADHD users engage intrinsically with achievement systems. The critical success factor is not features—it's sustainable motivation. A beautifully designed XP system that feels rewarding in week 1 can collapse by week 3 if the reward structure becomes invisible or the user feels pressure rather than joy.

The biggest risks are well-understood from the research and preventable: localStorage quota failures, visual accessibility failures under the grunge aesthetic, silent loss of progress visibility, and reward fatigue. All of these must be locked in during Phase 1 implementation, not deferred. The roadmap should be structured to prioritize these non-negotiable mechanics early, then layer engagement features on top.

## Key Findings

### Recommended Stack

**Single-file vanilla JavaScript approach with no external dependencies.** The research firmly establishes that for a self-contained, offline-first tool, any framework (React, Vue, Svelte) adds unnecessary overhead and breaks the portability requirement. The stack is intentionally minimal:

**Core technologies:**
- **Vanilla ES2020+ JavaScript** — All game logic, state management, event handling. No transpilation needed. Mature browser support (Chrome 85+, Firefox 78+, Safari 14+, Edge 85+). Framework overhead (30–50 KB for React/Vue) is wasted on a linear game loop.
- **HTML5 semantic forms** — Radio buttons with `<fieldset>` + `<legend>` + `<label>` provide accessible multiple-choice without ARIA overhead. Native keyboard navigation, screen reader friendly.
- **CSS3 (2023+)** — Pure CSS gradients for grunge textures, CSS custom properties for dark mode, CSS animations for transitions. No image assets, no external resources. Responsive by design.
- **localStorage API** — Native browser storage, 5–10 MB per origin, synchronous writes safe in beforeunload, error handling for quota exceeded. Good enough for game state under 100 KB.
- **requestAnimationFrame** — Game loop backbone. Synced to 60 FPS, pauses when tab loses focus (power efficient), standard since 2012.

**Key decisions:**
- No dependencies, no CDN calls. Everything inlined in a single HTML file.
- CSS-only animations preferred over JavaScript for performance (hardware accelerated).
- localStorage with version-based migration for future schema updates.
- Confidence: **HIGH** — this pattern is proven across 2025 web dev community; single-file apps are an established pattern.

### Expected Features

**Must-have (Table Stakes — blockers if missing):**
1. **Multiple-choice answers (4 options)** — Reduces friction; large tap targets; keyboard accessible.
2. **Immediate feedback** — Visual + audio confirmation within 300 ms.
3. **XP bar + level system** — Tangible progress metric that resets visually on level-up.
4. **No countdown timer** — Critical ADHD requirement. Timers trigger cortisol spikes and working-memory collapse.
5. **Dark aesthetic + grunge design** — Visual preference stated in requirements; aligns with target user.
6. **localStorage persistence** — Sessions auto-save; user can close and return without friction.
7. **Mixed difficulty (6–9 tables + easier 1–5 confidence-builders)** — 70% target-difficulty, 30% confidence.
8. **Clear problem display** — High contrast, large fonts, no visual clutter.

**Should-have (Differentiators — Phase 2):**
- **Novelty rotation** (3–4 mini-game formats) — Prevents habituation and engagement cliff.
- **Difficulty self-calibration** — Seamless adaptation tracks weak tables and weights them.
- **Session checkpoints** (break suggestions after 20 min) — Respects ADHD attention span.
- **Audio feedback** (reward sounds + optional ambient) — Dopamine reinforcement without overload.
- **Cosmetic progression** (avatar colors, styles) — Visual achievement independent of math performance.

### Architecture Approach

**Single HTML file with modular closure-based JavaScript components.** The architecture centers on a fixed-timestep game loop that separates update logic (game state) from render logic (DOM updates). State is held in a closure-based `PlayerState` object; input flows through an `InputHandler`; rendering is delegated to a `Renderer` component; persistence is abstracted behind a `PersistenceStore` interface.

**Major components and responsibilities:**
1. **Game Loop** — Coordinates frame timing, accumulates delta time, calls update() then render()
2. **Input Handler** — Captures user interactions; delegates to state updates
3. **State Manager (PlayerState)** — Holds game state: XP, level, accuracy by table, session count
4. **Question Selector** — Implements weighted question selection based on accuracy history
5. **XP/Level Calculator** — Exponential progression curve; computes rewards; detects level-ups
6. **Persistence Manager** — Wraps localStorage with error handling, versioning, migration
7. **Renderer** — Updates DOM to reflect current state; caches references

### Critical Pitfalls (Prevention Required)

1. **Reward Fatigue (week 3 engagement cliff)** — XP systems feel exciting for 1–3 weeks, then collapse. *Prevention:* Mix variable milestone lengths, separate progress tracking from reward, include intentional rest mechanics, test with target user at week 1/3/6.

2. **Cognitive Overload from Visual Clutter** — Dark themes can amplify visual stress if not designed carefully. *Prevention:* Use near-black (#0A0A0A) + soft white (#E8E8E8), limit animations, provide light mode toggle, test contrast (4.5:1 minimum).

3. **Answer Position Bias** — Correct answer clustering allows pattern guessing rather than learning. *Prevention:* Randomize order every question, log 50+ sessions to verify position ≈25% each, vary distractors.

4. **Pressure-Induced Failure** — Even soft timers create cortisol spikes in ADHD users. *Prevention:* No timers, period. Fast feedback instead. No streaks or comparison mechanics.

5. **localStorage Corruption and Data Loss** — Quota exceeded causes silent write failures. *Prevention:* Wrap every operation in try/catch for QuotaExceededError, check available space, version storage keys, test recovery.

6. **No Progress Visibility** — Users can't see improvement without session summaries. *Prevention:* Show session summary after every session, track mastery per problem, show historical progress.

7. **Dark Theme Accessibility Trap** — Accent colors become unreadable on dark backgrounds. 10–15% with astigmatism struggle. *Prevention:* Verify contrast ratios, use near-black + soft white, provide light mode toggle.

8. **Analysis Paralysis from Feature Creep** — Too many modes/settings create menu paralysis. *Prevention:* MVP ships single mode, no toggles, difficulty adapts automatically, defer topic selection.

## Implications for Roadmap

Based on research, three-phase structure recommended:

### Phase 1: MVP Core Loop + ADHD-Safe Mechanics

**Rationale:** Foundation phase. Must establish game loop, state management, and prevent catastrophic pitfalls before shipping. These decisions are hard to change later.

**Delivers:**
- Single-file HTML game with vanilla JS game loop
- Multiple-choice question → immediate feedback → XP gain → next question flow
- XP/level system with visual feedback (bar, celebration animation)
- Dark grunge aesthetic with accessible contrast ratios (4.5:1 minimum, light mode toggle)
- localStorage persistence with error handling and versioning
- Mixed difficulty (70% hard tables 6–9, 30% easy 1–5) with no timers or pressure
- Session summary showing progress and mastery tracking per table
- Answer randomization verified (no position bias)

**Addresses:** All 8 must-haves from FEATURES.md. Prevents all 8 critical pitfalls from PITFALLS.md.

**Research flags:** None—well-documented patterns. Standard across game dev community (HIGH confidence).

---

### Phase 2: Engagement & Gamification Polish

**Rationale:** After MVP validation (1–2 weeks with target user), add features that prevent reward fatigue and increase novelty. Depends on Phase 1 foundation.

**Delivers:**
- Novelty rotation (3–4 mini-game formats; same math, different presentation every 3–5 problems)
- Difficulty self-calibration (weighted question selection based on accuracy per table; 60–70% weak tables, 30–40% confidence builders)
- Session checkpoints (break suggestions after 20 min screen time; optional, encouraged)
- Cosmetic progression system (unlock avatar colors, weapon styles, grunge-themed cosmetics)
- Enhanced audio feedback (optional ambient music + reward sounds; fully toggleable)
- Session summary expanded (mastery tracking, historical progress graphs, trend vs. last session)

**Addresses:** Differentiators (features 9–13 from FEATURES.md). Prevents reward fatigue through variable rewards and cosmetic unlocks.

**Research flags:**
- **Reward curve tuning:** Exponential curve needs Phase 1 data. Plan 2–3 iteration cycles based on engagement metrics.
- **Novelty format design:** 3–4 distinct question formats need wireframes + target user testing during Phase 2 planning.

---

### Phase 3: Optional Enhancements (Conditional)

**Rationale:** Only pursued if Phase 1–2 engagement metrics justify continued development.

**Potential deliverables:**
- Streak mechanic (celebration-focused, no punishment for gaps)
- Visual progress map (pixel-art or grunge-themed "world" showing "you are here")
- Customizable session goals (time-based: 10/15/20 min; achievement-based: 2/3/5 level-ups)
- High-contrast mode (accessibility toggle)

**Explicitly deferred (out of scope):**
- Leaderboards, public/private, competitive modes
- Timed challenges, pressure mechanics
- Signup/login, user accounts, data collection
- Ads, monetization, paywalls
- Social features, multiplayer

### Phase Ordering Rationale

1. **Phase 1 must ship first** because:
   - Pitfall prevention (timers, localStorage, contrast, progress visibility) must be locked in by design, not retrofitted.
   - ADHD-safe mechanics are prerequisite to measuring real engagement. Can't test reward fatigue if users are anxious.
   - Architectural decisions (closure modules, game loop, persistence versioning) are set here; changing later requires rework.

2. **Phase 2 follows immediately** because:
   - Reward fatigue risk is highest after MVP validation (1–2 weeks). Must add novelty and cosmetics early to prevent week-3 cliff.
   - Difficulty self-calibration requires data from Phase 1. Once data exists, algorithm can be added cleanly.
   - Session checkpoints and progress tracking leverage Phase 1's infrastructure; minimal rework.

3. **Phase 3 is optional and dependent** because:
   - MVP is complete and valuable without these features.
   - Only pursued if engagement metrics justify continued development.
   - Implementation is independent; no architectural changes needed.

### Research Flags for Planning

**Phases needing deeper research during planning:**
- **Phase 2 (Novelty formats):** Design of 3–4 mini-game formats needs domain-specific iteration. Suggest wireframes + testing mental model with target user during Phase 2 planning.
- **Phase 2 (Reward curve):** XP multiplier, level thresholds, cosmetic unlock timing need tuning based on Phase 1 engagement data. Plan for 2–3 iteration cycles.
- **Phase 3 (Cloud save):** If multi-device sync becomes a requirement, research IndexedDB vs. cloud backend (Firebase, AWS). Currently out of scope.

**Phases with standard patterns (skip research-phase during planning):**
- **Phase 1 (Game loop, localStorage, dark theme):** All patterns well-documented and proven. Standard patterns from game dev community. No additional research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Consensus across 2025 web dev community. Single-file vanilla JS is proven pattern. Researched with official MDN docs and community projects. |
| **Features** | HIGH | Must-haves informed by ADHD research and competitive analysis (Prodigy, Khan, DreamBox). Differentiators grounded in gamification science and neurodivergent UX research. Anti-features backed by educational app literature. |
| **Architecture** | HIGH | Closure modules, game loop, weighted question selection, and persistence strategies are standard across modern game dev. Code examples provided are production-tested patterns. No novel approaches; well-established best practices. |
| **Pitfalls** | HIGH | All 8 pitfalls are well-sourced from peer-reviewed research, domain-specific literature, and technical security/reliability sources. Reward fatigue, visual accessibility, pressure-induced failure backed by educational research. Storage corruption is proven technical risk. Prevention strategies are actionable and testable. |

**Overall confidence: HIGH**

All four research streams (Stack, Features, Architecture, Pitfalls) converge on same architecture and feature set. No contradictions or major uncertainties. Research quality is strong across all domains.

### Gaps to Address During Planning

1. **Target user validation:** Research assumes 12-year-old with possible ADHD based on PROJECT.md. Phase 1 UAT must validate actual user's response to no-timer mechanics, dark aesthetic, and reward structure. If real user rejects assumptions, roadmap may need revision.

2. **Reward curve tuning:** Exponential XP curve provided in ARCHITECTURE.md (BASE_XP = 100, LEVEL_MULTIPLIER = 1.2) is starting point. Phase 1 playtesting will reveal if levels feel too fast (boring by day 2) or too slow (grind fatigue). Plan 2–3 iterations during Phase 2.

3. **Difficulty self-calibration threshold:** When should a table be considered "mastered"? (Current proposal: 7/10 correct in recent history). This threshold affects question weighting heavily. Phase 1 data will inform optimal threshold.

4. **Question pool size:** How many unique distractors per problem type are needed to prevent memorization? (Current proposal: 8+ per table). Needs validation during Phase 1 content creation. Include in UAT checklist.

5. **Cloud integration future path:** If multi-device sync becomes a requirement later (Phase 3+), research needed on IndexedDB vs. cloud backends (Firebase, AWS). Currently out of scope but flag for potential future research phase.

## Sources

**Primary Sources (HIGH Confidence):**
- STACK.md: MDN documentation (localStorage, requestAnimationFrame, HTML5 forms, CSS gradients), GitHub single-file-apps projects
- FEATURES.md: Peer-reviewed ADHD gamification research, competitive analysis (Prodigy/Khan/DreamBox), educational UX studies
- ARCHITECTURE.md: Game Programming Patterns (official reference), performant JS game loops, module design patterns, spaced repetition algorithms
- PITFALLS.md: Systematic review of gamification effectiveness, cortisol/math performance research, dark mode accessibility guidelines, multiple-choice assessment design

**All research files cite HIGH-confidence sources:**
- Official W3C documentation (HTML/CSS/JavaScript standards)
- MDN Web Docs (API reference and best practices)
- Peer-reviewed educational research (ADHD, gamification, math anxiety)
- Technical security and reliability sources
- Game development community consensus (published patterns)

---

*Research synthesis completed: 2026-06-20*
*Confidence: HIGH across all areas*
*Ready for roadmap planning: YES*
