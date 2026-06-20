# Feature Landscape: Math Lab

**Domain:** Gamified educational math practice for kids age 12
**Researched:** 2026-06-20
**Target Context:** 12-year-old girl, possible ADHD, dislikes traditional math but engages with games

---

## Table Stakes

Features users expect. Missing = app feels incomplete or boring. These are baseline expectations set by existing educational games (Prodigy, Khan Academy, DreamBox) and what makes a "game" feel like a game.

| Feature | Why Expected | Complexity | ADHD Consideration | Notes |
|---------|--------------|------------|-------------------|-------|
| **Progress visibility (XP bar + level)** | Every game since 2000s has progression; kids check it constantly. Tangible proof they're improving motivates return. | Low | CRITICAL: ADHD learners need frequent, visible micro-feedback. A 2-3 problem jump showing XP gain satisfies the dopamine hit before attention dips (~7 min). | Must reset/refill visually on level-up; not just "you're 8/10." |
| **Multiple choice answers (4 options)** | Reduces friction when stuck; prevents frustration meltdown. Lower barrier to "trying" when you don't know. | Low | TABLE STAKES for ADHD: typed input requires sustained focus + fine motor control. Multiple choice lets them reason without motor tax. | Prodigy, Khan, DreamBox all use it. Screen reader compatible. |
| **Immediate feedback** | Users need to know instantly if they're right/wrong; delayed feedback breaks engagement and learning. | Low | CRITICAL for ADHD: delays trigger "what did I do wrong?" rumination. Instant = move forward, no spiral. | "Correct!" or "Try again" within 300ms. Visual + audio cues. |
| **No external time pressure (no countdown timer)** | Timers trigger stress responses, esp. for anxious or ADHD learners. Math anxiety + time = working memory collapse. | Low | CRITICAL: Research shows amygdala lights up after ~90s of countdown. Timed tests increase error rates. This is non-negotiable for ADHD-profile kids. | Fast-paced ≠ timed. Let them go at their pace. |
| **Session checkpoints (level milestones)** | Provides natural stopping points; prevents "just one more" fatigue spirals. Psychologically satisfying. | Low | ESSENTIAL for ADHD: Pomodoro-style breaks (20–25 min is a sweet spot) with breaks offered after consistent errors show fatigue. | Offer a break after Level 5, 10, 15 etc. Optional, but encouraged. |
| **Dark aesthetic + grunge design** | Visual preference stated in requirements; aligns with how the target user expects "cool" to look. No bubbly/pastel = no eye-roll. | Medium | ADHD learners report 61–73% preference for dark backgrounds; 14% better retention in 30-min sessions. Reduces eye strain = sustained focus. | Bold fonts, high contrast. Avoid clutter. |
| **Offline persistence (localStorage)** | App saves XP/level locally; no server dependency means it works anywhere, anytime. Returns to the game = reward is waiting. | Low | ADHD learners benefit from "auto-save" as a friction reduction; no manual save steps to forget. | Must survive browser close/reopen. |
| **Visual problem clarity** | Math problem must be obvious at a glance; no mental parsing needed. Font size, spacing, high contrast. | Low | CRITICAL for ADHD: visual clutter = cognitive overload. "What am I being asked?" must be instant. | Follows accessibility best practices; benefits all learners. |

---

## Differentiators

Features that set the product apart. Not expected, but valued. These transform "yet another drill" into "I actually want to play this."

| Feature | Value Proposition | Complexity | ADHD Fit | Implementation Notes |
|---------|-------------------|------------|----------|----------------------|
| **Novelty rotation (mini-quest variety)** | Dopamine dips ~7 min into repetitive tasks. Rotating between 3–4 mini-game formats (e.g., "Pick the answer," "Is it bigger?", "Find the pair") keeps attention fresh without changing the core math. | Medium | DIFFERENTIATOR: ADHD brains are hardwired for novelty-seeking. If every problem is identical, attention collapses by minute 5. Rotation prevents habituation. | Rotate every 3–5 problems. E.g., Q1–3 standard MC, Q4–6 "arrange in order," Q7 "fastest fingers" (no timer, just feel). |
| **Avatar/cosmetic progression system** | As you level up, unlock cosmetics (clothes, colors, weapon skins) for a player character or companion. Zero power (doesn't improve math), but deeply motivating. | Medium | WORKS for ADHD: visual reward loop independent of math performance. Aesthetic achievement = dopamine without cognitive friction. Aligns with "dark grunge" aesthetic. | Start simple: unlock darker color variants, edgy tattoos, weapon glows. Avoid gacha/monetization pressure. |
| **Streak/consistency mechanic** | "You've practiced 5 days straight!" badges. Gamifies habit-building without pressure. | Low | CAUTIOUS: streaks can backfire for ADHD (shame spiral if broken). Frame as "celebrate consistency," not "don't break it." Optional toggle to disable. | Show "You're on a 3-day streak!" non-punitively. Bonus XP for streaks, but no punishment for breaks. |
| **Difficulty self-calibration** | App tracks which times tables you're fastest/slowest on. Adapts without asking; seamlessly mixes easier (6–5) with harder (9×9) to keep you in the "challenge sweet spot." | High | EXCELLENT for ADHD: removes decision fatigue. Spaced repetition of weak areas without the user thinking about it. DreamBox does this well. | Track latency + error rate per problem type. Weight weak areas into next 10 problems. |
| **Visual progress map (optional "world" metaphor)** | Instead of abstract levels, show a visual landscape: "Level 1 = Desert," "Level 5 = Ice Kingdom," etc. Aesthetic journey, not just numbers. | Medium | OPTIONAL: Not table stakes, but appeals to fantasy-loving kids. Can be skipped for MVP but scales the game's "story." | Simple pixel-art or grunge-themed biomes. One-screen map showing "you are here." |
| **Confidence-building mixed practice** | Deliberately sprinkle in 2–3 "easy" problems (times tables 1–5) into every session to guarantee wins early. Psychological: early wins prevent learned helplessness. | Low | KEY for ADHD learners with math anxiety: success early = "I can do this" → willingness to tackle harder problems. Prodigy and DreamBox both do this. | 70% target-difficulty (6–9), 30% confidence (1–5) per session. |
| **Sound design (ambient + reward sounds)** | Gentle background audio (chiptune, lo-fi beats) creates ambiance; satisfying "ding!" on correct answer. Optional toggle for silent mode. | Medium | ADHD-friendly if well-done: audio cues help with attention; reward sounds trigger dopamine. Bad audio = sensory overload. Make it optional. | Keep background music ~60dB. Short, non-jarring win sounds. Reward cascade (coins/sparkles) on streaks. |
| **Customizable session goals ("Play for 15 min" vs "Level up 2 times")** | Let the learner choose what "done" means today. Reduces decision fatigue and respects autonomy. | Low | EMPOWERING for ADHD: gives illusion of control. "I'll do 20 problems today" vs "I'll play till Level 3" = self-determination. | Radio buttons at session start: Time-based (10/15/20 min) or Achievement-based (2/3/5 level-ups). |

---

## Anti-Features

Features to explicitly NOT build. These hurt engagement, especially for ADHD learners.

| Anti-Feature | Why Avoid | What Happens | What to Do Instead |
|--------------|-----------|---------------|--------------------|
| **Countdown timers** | Time pressure triggers amygdala activation (~90s threshold). Math anxiety + timer = working-memory shutdown, increased errors, avoidance. | User quits mid-session. Stress association with math deepens. Learned helplessness. | Fast feedback without time constraint. If speed matters later, introduce it gradually *after* confidence is built, and make it optional. |
| **Leaderboards (public/social)** | Competition is demotivating for ADHD learners who already perceive themselves as "bad at math." Comparison spiral. | User sees they're "last" or "slow" and stops trying. Shame. | Personal progress bars only ("You beat your Level 3 time!"). Optional local friend leaderboards if requested, not default. |
| **Punitive streaks** | "You lost your 10-day streak!" shaming. ADHD learners often struggle with consistency (executive dysfunction); streaks become guilt spirals. | User avoids app after missing one day. Negative association. | Celebrate consistency without punishment for gaps. "Welcome back! You had a 3-day streak." No "failed" states. |
| **Long problem sets without breaks** | Sessions >20–25 min drain ADHD working memory. Error rate skyrockets after 16–20 min. | User makes careless errors. Blames themselves. Frustration peaks. | Offer breaks after 20 min of screen time. Celebrate breaks as part of the game ("Rest time = brain power recovery!"). |
| **Cluttered, colorful, "busy" visual design** | Visual chaos = cognitive overload for ADHD. Competing colors, animations, text density. | User can't focus on the actual problem. Attention fragments. | Dark, clean aesthetic. One problem per screen. High contrast. Minimal animations (fast, purposeful, not decorative). |
| **Forced pink/bubbly/"girly" aesthetic** | Target user explicitly rejects this. Feels patronizing and misses the mark. | User won't open the app. "It's not for me." | Dark grunge aesthetic. Bold fonts. Edgy/cool vibe. No assumptions about gender presentation. |
| **Typo-prone or grammatically awkward copy** | "Your doing great!" or unclear instructions feel sloppy and undermine credibility. | User perceives low quality. Less trust. Less investment. | Clean, error-checked copy. Clear instructions ("Pick the right answer" not "Select which of these is the answer"). |
| **Mandatory accounts / data collection** | Adds friction (password, email), privacy concerns, compliance overhead. Local-only is a feature. | User friction increases. Trust decreases. Setup barrier. | Keep offline, localStorage-only. No login. No tracking beyond local session data. |
| **Ads** | Interrupts flow. Especially toxic for ADHD (task-switching is hard). Creates scarcity/pressure ("limited time!"). | Session interrupted. Cognitive reset needed. Frustration. | Ad-free by design. No monetization pressure. Keep the experience clean. |
| **Tapping/typing speed requirements for motor control** | Fine-motor speed penalties increase frustration for dyspraxia-adjacent or ADHD-spectrum learners. | User feels slow/incompetent. Avoidance. | Multiple choice (large tap targets). No speed-based scoring. Accessibility first. |

---

## Feature Dependencies

```
Core Loop:
  Problem Display → Answer Selection (MC) → Instant Feedback
    ↓
  XP Gain → Progress Bar → Level Up (visual + audio celebration)
    ↓
  localStorage Save (automatic, invisible)

Session Lifecycle:
  Session Start (choose goal: time or levels)
    ↓
  Problem Loop (novelty rotation, mixed difficulty)
    ↓
  Break Checkpoint (after 20 min or 20 problems)
    ↓
  Session End (show XP earned, level progress, streak)
    ↓
  Save to localStorage

Progression:
  Difficulty Self-Calibration feeds into:
    → Next session's problem mix
    → Avatar cosmetic unlocks (independent)
    → Confidence tracking (invisible to user)

Optional (do not block MVP):
  Streak → (optional) avatar cosmetics
  Visual Progress Map → session flow (cosmetic only)
  Sound Design → every feedback loop (can be disabled)
```

---

## MVP Recommendation

**Prioritize these features for launch. Ship with just these and validate learning + engagement with the target user.**

### Must-Have (Blocker if Missing)

1. **Multiple choice answers (4 options)** – Without this, friction skyrockets.
2. **Immediate feedback (correct/try again)** – Core game loop requirement.
3. **XP bar + level system** – Progression is the motivator; without it, it's just a drill.
4. **No countdown timer** – ADHD-critical. A timed version breaks the whole value prop.
5. **Dark aesthetic** – Visual coherence with user expectations. A bright, bubbly version won't be opened.
6. **localStorage persistence** – Sessions must save. No return = no habit.
7. **Mixed difficulty (6–9 + easier tables for confidence)** – Confidence-building is table stakes per PROJECT.md requirements.
8. **Problem clarity (clean display, large fonts, high contrast)** – Accessibility = usability for all, especially ADHD.

### Should-Have (Ship by Phase 2)

9. **Novelty rotation (3–4 mini-quest formats)** – This is the differentiator that prevents "I'm bored by problem 30."
10. **Difficulty self-calibration** – Seamless adaptation keeps users in the challenge zone.
11. **Session checkpoints (break suggestions after 20 min)** – Prevents fatigue spiral; respects ADHD attention patterns.
12. **Audio feedback (reward sounds + optional ambient)** – Dopamine reinforcement without overload.
13. **Cosmetic progression (unlock avatar colors/styles)** – Visual achievement independent of math performance.

### Nice-to-Have (Defer to Phase 3+)

14. **Streak mechanic (celebration, no punishment)** – Habit tracking, but low priority for MVP.
15. **Visual progress map** – Aesthetic journey, but not essential for core gameplay.
16. **Customizable session goals** – Autonomy feature, valuable but not critical for validation.

### Explicitly Do NOT Include in MVP

- Leaderboards (any form)
- Timed challenges
- Punitive mechanics
- Ads or monetization
- Social features / multiplayer
- Signup/login
- Pink or bubbly aesthetic

---

## MVP User Flow (30-Second Play)

```
1. Open app → (localStorage loads XP/level)
2. "Start playing?" → Pick session goal (15 min OR 2 levels)
3. Problem 1 (6×7) → 4 options → tap → "Correct! +10 XP"
4. XP bar fills partway, visual/audio celebration
5. Problem 2 (3×4) → tap → "Try again!" → tap different → "Correct! +10 XP"
6. Continue ~5 problems, then break offer ("Good work. Rest 2 min?")
7. Resume → Problems 6–12 (mix of 6–9 + easy ones)
8. Level up! → "Level 3!" + cosmetic unlock (darker avatar style)
9. Session goal reached → "You earned 120 XP today! Come back tomorrow."
10. Page reloads → localStorage shows "Level 3, 45/100 XP to Level 4"
```

---

## ADHD-Specific UX Principles (Woven Into Every Feature)

These aren't separate features; they're design constraints that affect everything:

1. **Dopamine Reset Cycle**: Novelty every 3–7 min. Feedback every 2–3 seconds. No blank/waiting screens.
2. **Working Memory Protection**: One problem at a time. No multi-step instructions. Visual + verbal clarity.
3. **Executive Function Scaffolding**: Automatic saves (no "forgot to save"). Optional breaks, not forced. Clear session structure ("start → play → end").
4. **Motivation by Progress, Not Pressure**: XP/levels intrinsic; timers/competition extrinsic (stressful).
5. **Confidence-First Approach**: 30% easy problems sprinkled in. Guaranteed early wins. No shame in retrying.
6. **Sensory Respect**: Dark mode (eye strain reduction, 14% better retention). Sound optional. Animations purposeful. No clutter.

---

## Sources

Research confidence: **HIGH** for features 1–8 (table stakes), **MEDIUM** for features 9–13 (differentiators), **MEDIUM** for anti-features. Drawn from:

- [Best Math Apps for Kids: 15 Top Educational Apps (2025)](https://www.jetlearn.com/blog/15-best-math-apps-for-kids-fun-and-engaging)
- [Computer-assisted learning for improving ADHD individuals' executive functions through gamified interventions](https://www.sciencedirect.com/science/article/abs/pii/S1875952119300953)
- [Embedding Gamification in Meaningful EdTech Lessons for Students with ADHD](https://pressbooks.pub/techcurr2023/chapter/embedding-gamification-in-meaningful-edtech-lessons-for-students-with-adhd/)
- [Effectiveness of a gamified educational application on attention and academic performance in children with ADHD](https://www.researchgate.net/publication/398584473_Effectiveness_of_a_gamified_educational_application_on_attention_and_academic_performance_in_children_with_ADHD_an_8-week_randomized_controlled_trial)
- [ADHD & Math: 15 Parent-Approved Strategies](https://www.monstermath.app/blog/adhd-and-math-15-parent-approved-strategies-to-help-your-child-thrive-cmbkre31m000611kbdtsnphce)
- [Supporting comprehension: Multiple-choice over true-false practice tests](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12696125/)
- [Interactive Learning: Online Audience Response Systems and Multiple Choice Questions](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10457716/)
- [Math Anxiety in Autism, ADHD, Dyscalculia - What Works](https://www.monstermath.app/blog/math-anxiety-in-autism-adhd-dyscalculia/)
- [XP and Leveling in Educational Apps](https://trophy.so/blog/when-your-app-needs-xp-system)
- [Dark Mode & Dopamine Colors in Education UI/UX](https://colorwhistle.com/dark-mode-dopamine-education-design/)
- [Dark Mode Usability in Educational Apps](https://lutpub.lut.fi/bitstream/10024/170147/1/mastersthesis_Sandeepani_Rappitigala_Jayasundara_Widanalage_Madushika.pdf)
- [Gamification techniques for ADHD learners](https://dl.acm.org/doi/fullHtml/10.1145/3675888.3676047)
- [Session length and break patterns for ADHD learners](https://queensonlineschool.com/tips-for-studying-with-adhd/)
- [Prodigy, Khan Academy, DreamBox, Kahoot feature comparison](https://www.prodigygame.com/main-en/blog/best-math-apps-for-kids)
- [DreamBox Learning Review 2026](https://kidedtools.com/blog/dreambox-learning-gamified-math-review-2026/)

---

**Next Steps for Roadmap:**

This feature landscape directly informs Phase 1 (MVP core loop) and Phase 2 (differentiators). The ADHD-specific principles should be treated as non-negotiable design constraints, not optional enhancements. Features 1–8 are shipped together; features 9–13 follow immediately in a "polish + engagement" phase.
