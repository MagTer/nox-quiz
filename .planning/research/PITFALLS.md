# Pitfalls Research: Gamified Math Practice for ADHD-Adjacent Users

**Domain:** Educational gamification + single-file web app + dark UI + multiple choice math
**Researched:** 2026-06-20
**Confidence:** HIGH (educational research + community patterns + architecture-specific findings)

---

## Critical Pitfalls

### Pitfall 1: Reward Fatigue and Extrinsic Motivation Collapse

**What goes wrong:**
XP/leveling systems feel exciting for 1–3 weeks, then become invisible. Users stop pursuing levels because they've "beaten" the progression curve—each level takes longer, rewards feel arbitrary, and the intrinsic joy of learning erodes as chasing points becomes the only motivator. For ADHD users especially, this manifests as "forgetting why this matters" and abandoning the app despite technically "winning" sessions.

**Why it happens:**
Developers build reward systems assuming engagement = accumulation, but gamification research shows that once the novelty fades, extrinsic rewards can *undermine* intrinsic motivation. XP systems become quotas in users' minds—each missed session triggers guilt rather than joy. For neurodivergent users, external reward systems can feel like pressure, not celebration.

**How to avoid:**
- Build progression with *variable* milestone lengths—don't follow exponential curves. Mix quick wins (5 XP for a right answer) with occasional surprises (bonus XP for streaks).
- Separate "progress tracking" from "reward." Show growth in questions mastered, not just points accumulated.
- Include intentional rest mechanics—no daily streaks, no FOMO-driven notifications. Let users return *because they want to*, not because they feel obligated.
- Test with actual target user (the 12-year-old) at week 1, week 3, and week 6 to detect when reward salience drops.

**Warning signs:**
- Session duration drops after week 2–3 despite app being feature-complete
- User reports "I don't care about leveling up anymore"
- Engagement spike at launch followed by cliff-like decline
- User compares self to previous levels and feels unmotivated

**Phase to address:**
**Phase 2 (Core Gamification Mechanics)** — Reward system design and validation. Lock in sustainable motivation model before shipping. Test with ADHD-profile user during planning phase to detect friction early.

---

### Pitfall 2: Cognitive Overload from Visual Clutter (Dark Theme Misapplication)

**What goes wrong:**
Dark themes can amplify visual stress if not designed carefully. Harsh white-on-black text creates edge vibration (visual blooming), animations trigger overstimulation, and too many visual elements fragment attention. For ADHD brains, this is a *disaster*—the app becomes harder to use, not easier, despite looking "cool."

**Why it happens:**
Developers assume "dark = easier on eyes," but dark theme requires careful contrast management. Pulling from web design defaults (pure #000 + pure #FFF), using too much saturation in accent colors, and adding uncontrolled animations create visual static. The "grunge" aesthetic can easily veer into overwhelming if not paired with strong information hierarchy.

**How to avoid:**
- Use near-black backgrounds (#111, #0A0A0A) paired with soft white text (#E8E8E8, #D4D4D4), not pure blacks/whites. Test contrast ratios (aim for 4.5:1 minimum, 7:1 preferred).
- Limit color palette to 3–4 accent colors. Avoid neon saturation—use muted jewel tones or desaturated brights.
- Minimize animations. No auto-play videos, no aggressive micro-interactions. Only use motion for *intentional* feedback (level-up notification, correct answer flash).
- Provide a light mode toggle (even if not the default). Some users with astigmatism find dark mode harder to read.
- Test with target user in session to identify visual discomfort early (eye strain, difficulty reading options).

**Warning signs:**
- User reports "headaches after using the app" or "it's hard to read"
- Option text is hard to distinguish from background
- Animations cause visible distraction or distress
- Colors appear to "vibrate" or create visual shimmer on screen
- User naturally increases browser zoom to read content

**Phase to address:**
**Phase 1 (MVP Core)** — Dark theme implementation must follow accessibility guidelines from day one. Cannot defer. Test with both bright and dark environments.

---

### Pitfall 3: Option Order Bias Disguised as Learning

**What goes wrong:**
If the correct answer always appears in the same position (e.g., always "B"), users can *game* the system by guessing patterns rather than learning math. This is especially dangerous in multiple-choice because it looks like they're progressing (high success rate) when they're actually memorizing answer *patterns*, not multiplication facts. Randomizing without care creates its own bias (primacy/recency effects).

**Why it happens:**
Quick implementation assumes "shuffle the options and call it done," but this overlooks that different children have different guessing strategies. Some favor first/last options, others click the same position repeatedly. Non-random shuffling creates predictable patterns.

**How to avoid:**
- Randomize answer order on *every* question. No exceptions, no "seeding" with patterns.
- Verify randomization is actually random by logging 50+ sessions and checking for position clustering. If position 1 is correct more than 26% of the time, randomization is broken.
- Avoid using the *same* 4 options repeatedly (e.g., always "correct answer, off-by-one, off-by-five, completely wrong"). Vary distractors—sometimes include answers from different multiplication tables, sometimes adjacent factors.
- Log which answers are chosen and validate that correct answers aren't being predicted by position rather than understanding.
- Include a post-session breakdown showing "You got 8 right, but 2 were lucky guesses based on position"—make the pattern visible to learner.

**Warning signs:**
- Success rate is high but *only* for specific positions (e.g., 80% when correct answer is "C")
- User clicks the same button position repeatedly without reading options
- User's success rate is inconsistent between sessions (suggests position-guessing, not mastery)
- Distractors never get selected (suggests they're obviously wrong, not plausibly wrong)

**Phase to address:**
**Phase 1 (MVP Core)** — Answer randomization must be correct from launch. Easy to verify, high impact on learning validity. Include option-position logging in analytics.

---

### Pitfall 4: Pressure-Induced Failure (Timer Traps & Stress)

**What goes wrong:**
Even a *soft* timer (gentle countdown, no penalty for going over) creates cortisol spike in ADHD and math-anxious users. Stress hormones spike, working memory collapses, and users fail problems they actually know. The app becomes associated with *anxiety*, not joy. They abandon it.

**Why it happens:**
Developers often add timers to "encourage efficiency" or "simulate test conditions," not realizing that pressure mechanics harm the exact population (ADHD, math anxiety) most likely to use an educational app. The goal is intrinsic motivation, not exam prep.

**How to avoid:**
- **No timers. Period.** Not even "soft" countdowns. Not even leaderboards that create social pressure.
- Use fast feedback instead: instant visual confirmation when an answer is selected ("✓ Correct! +10 XP"), then move to next question. Speed emerges naturally from confidence, not pressure.
- Allow users to pause between sessions—no daily streaks, no "come back soon" notifications.
- Session design: offer "Play one round" (5–10 questions) or "Play for 15 minutes" with natural stop points (level-ups, checkpoints). Let them bail without guilt.
- Include difficulty scaling: if a user gets 3 wrong in a row, ease back to simpler tables (5s, 6s) to restore confidence before retrying harder ones.

**Warning signs:**
- User reports feeling "rushed" or "panicked"
- Correct answers drop right after implementing a timer
- User avoids app when mood is low (doesn't feel "ready")
- Session engagement spikes only when specific external trigger (parent asks, reward promised), then crashes

**Phase to address:**
**Phase 1 (MVP Core)** — Timer mechanics decision. This is non-negotiable and must be baked in early. Any pressure feature added later requires rework.

---

### Pitfall 5: localStorage Corruption and Silent Data Loss

**What goes wrong:**
localStorage quota is hit (5MB limit across all data + other apps), data write silently fails with QuotaExceededError, app crashes or loses XP/level progress. User opens app the next day: "I lost all my progress!" Trust evaporates. For a game-like app where progress is the primary reason to return, this is catastrophic.

**Why it happens:**
Single-file apps often store progress without error handling. A single missing try/catch around `localStorage.setItem()` means the app fails silently. Worse, if the app auto-saves on every action and storage is full, it thrashes repeatedly, degrading performance.

**How to avoid:**
- Wrap *every* localStorage operation in try/catch for QuotaExceededError.
- Before writing, check available space: `navigator.storage.estimate()` and bail gracefully if < 100KB free.
- Implement a compression strategy: serialize progress as minimal JSON (only essential XP, level, last-played-date), not verbose logs of every question.
- Add a "storage status" indicator in dev tools / error logging—monitor quota usage across sessions.
- Implement a versioning strategy for localStorage keys (e.g., `mathlab_v1_progress`). When the app updates, old data doesn't break new code.
- Test data persistence across multiple sessions and verify XP/level survive app restart, browser restart, and localStorage quota near-full scenarios.

**Warning signs:**
- XP/level mysteriously reset after a long session
- Browser console shows "QuotaExceededError: DOM Exception 22"
- App performance degrades after playing for 30+ minutes (storage thrashing)
- User can't load progress on a different device (but they shouldn't expect cloud sync anyway—that's out of scope)

**Phase to address:**
**Phase 1 (MVP Core)** — localStorage implementation + error handling. Auditable from day one. Include in testing checklist: "Can we recover from full storage?"

---

### Pitfall 6: Analysis Paralysis and Overfeature Creep

**What goes wrong:**
Early versions add "practice modes" (timed, untimed, drill, game), "difficulty settings" (easy, medium, hard), "topic selection" (6s, 7s, 8s, 9s, mixed), and suddenly a kid faces a menu with 50+ option combinations. Paralysis. They quit rather than choose. Every mode also dilutes focus—you're building 5 apps, not 1.

**Why it happens:**
Developers confuse "flexibility" with "engagement." But for ADHD users, choice can be overwhelming. The MVP should have *one* clear path: open app → get a question → answer → next question. Done.

**How to avoid:**
- Ship MVP with a single mode: "endless practice, mixed tables (6–9 with some easier ones), no settings."
- Remove the practice menu. No toggles for "easy mode" vs. "hard mode." Difficulty should adapt automatically (algorithmic based on recent performance).
- Defer topic selection to future phases. Once core engagement is validated, *then* let users pick which tables to focus on.
- Every new feature added must justify itself: "Does this reduce confusion or increase it?" If the answer is "give users control," push back—control is a feature, not a solution.
- During Phase 1 UAT, measure decision time before each question. If it's > 3 seconds, the UI is offering too many choices.

**Warning signs:**
- Early testers spend more time in menus than playing
- First-time users ask "which mode should I use?"
- Feature requests cluster around "add a setting for X"—that's a sign settings are missing
- Sessions are short—users get overwhelmed and leave

**Phase to address:**
**Phase 1 (MVP Core)** — Scope discipline. Define "one clear path" and stick to it. Resist temptation to add settings. Document every deferred feature in backlog.

---

### Pitfall 7: No Progress Visibility (Silent Failure)

**What goes wrong:**
User gets 7 right, 3 wrong, and closes the app. No summary, no indication of progress or patterns. They have no idea if they're *actually* improving at multiplication. Without visible progress, intrinsic motivation evaporates ("Why should I come back? I don't even know if I'm better.").

**Why it happens:**
Developers focus on game mechanics (XP, levels) but forget the core: learners need *feedback*. A 12-year-old with ADHD needs to see "You've mastered 6×7" or "You're still struggling with 8×9" so they know effort is working.

**How to avoid:**
- After every session, show a summary: "You got 8 right, 2 wrong. Your best: 6×7. Keep working on: 8×9."
- Track mastery per problem: if user gets 7× answered correctly in last 10 attempts, mark it as "confident."
- Show historical progress: "Last week you got 60% on 8s. This week: 85%. Great progress!"
- Include a visual progress bar for each table: "6s: ████████░░ 80% mastered"
- Use this data to *personalize* difficulty: if 9s are struggled with, weight them more heavily in upcoming sessions.
- Make progress *persistent*: the app should remember patterns across sessions, not reset the learning model each time.

**Warning signs:**
- User can't articulate what they're getting better at
- Session summaries are missing or vague
- User's confidence doesn't match actual performance
- Engagement drops after 2–3 sessions (not seeing progress)

**Phase to address:**
**Phase 2 (Core Gamification Mechanics)** — Session feedback and progress tracking. Must include analytics/logging infrastructure in Phase 1, but the UI and reporting come in Phase 2.

---

### Pitfall 8: Dark Theme + Contrast Accessibility Trap

**What goes wrong:**
Accent colors (buttons, correct-answer highlights) are chosen for "cool grunge look" but become unreadable on dark backgrounds. Yellow correct-answer highlight on #111 background is barely visible. User misses feedback cues. Or, pure white text on pure black fatigues eyes and triggers astigmatism blur for 10–15% of users.

**Why it happens:**
Designers don't test contrast ratios or test only on their own display (which may have different gamma/calibration). They rely on intuition ("this looks good") rather than accessibility standards. Astigmatism-related blur isn't obvious until you test with users who have it.

**How to avoid:**
- Use a contrast checker (WebAIM, WAVE, or built-in browser dev tools) to verify 4.5:1 minimum for all text, 3:1 for UI controls.
- Avoid pure #000 and pure #FFF combinations. Use near-black (#0A0A0A, #111) + soft white (#D4D4D4, #E8E8E8).
- Test accent colors on dark backgrounds. Neon greens and yellows often fail contrast. Use muted jewel tones or desaturated brights.
- Provide a light mode toggle (even if undocumented in first release). Test both.
- Test in different lighting: bright sunlight, dim room, evening. Ask testers: "Can you read this comfortably for 20 minutes?"
- Include a "high contrast mode" option for accessibility (bonus, not MVP).

**Warning signs:**
- User adjusts browser zoom just to read text
- Option text blurs when eyes focus on it (astigmatism indicator)
- User complains of eye strain after 10 minutes
- Correct/incorrect feedback color is missed by testers

**Phase to address:**
**Phase 1 (MVP Core)** — Theme implementation. Contrast verification must be part of Definition of Done. Non-negotiable.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| No error handling on localStorage.setItem() | 20 lines of code saved | Data loss, app crash, loss of trust | NEVER—crashes are fatal for a game |
| Hardcoded question pool (same 12 questions) | Questions written once, game "done" | User memorizes answers, stops learning after day 2 | NEVER—kill engagement entirely |
| Auto-save on every keystroke (no debounce) | Simpler code, always in-sync | localStorage thrashing, performance cliff at 500+ sessions | Only if storage footprint < 100KB and tested at scale |
| No session summary / feedback | MVP ships faster | Silent failure, no progress visibility, users quit | Never—progress visibility is core value |
| Light mode forced off (no toggle) | Simpler CSS, "grunge aesthetic preserved" | 10–15% of users with astigmatism can't read text | Never—accessibility is baseline |
| Single difficulty level (only hard tables) | Simpler content creation | User fails repeatedly, demoralizes, abandons | Never—confidence-building is core to engagement |
| No analytics / progress tracking | Fewer database tables | Can't detect when users lose motivation, can't iterate | Only if you're OK being blind to engagement drop |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| localStorage + analytics | Store raw logs, hit quota at 500 sessions | Store only summary stats (XP, level, last-played, mastery per table). Trim old sessions. |
| Dark theme + accessible colors | Use pure #000 + pure #FFF, test on one monitor | Use near-black + soft white, test on multiple displays and in variable lighting |
| Multiple choice + feedback | Show only "correct!" or "wrong" | Show correct answer, explain why, track which distractors were chosen to detect patterns |
| localStorage + version updates | Old data format breaks on app update | Use versioned keys (mathlab_v1, mathlab_v2), migration function when app updates |
| XP system + progress tracking | Track only points, not learning | Separate "XP earned" from "mastery achieved"—user sees both, they're decoupled |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering full DOM on every answer | Jank after 50+ questions, UI stutter | Use event delegation, update only the changed element | After 100+ questions in a session |
| localStorage.setItem() on every keypress | App freezes, storage thrashing, quota errors | Debounce saves (batch updates every 5 seconds), only save on session end + level-up | After 30 minutes of continuous play |
| Question pool loaded in memory uncompressed | App slows as question count grows | Lazy-load questions, compress JSON, stream from storage | If question pool exceeds 1MB (unlikely at 12-year-old scale) |
| No analytics pruning | localStorage grows forever | Delete sessions older than 30 days, archive to localStorage only summary stats | After ~500 sessions (6 months of daily play) |
| CSS recalculation on animation frame | Smooth animations become choppy | Use CSS transforms + will-change, avoid layout-triggering animations | After 3–4 concurrent animations |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing app state unencrypted in localStorage | Sibling/friend cheats by opening dev tools and editing XP directly | Accept this risk—single-device, low-stakes game. If cheating becomes an issue, add a checksum validation (hash last 5 actions to detect edits) |
| Exposing question logic in client-side code | User reads source to predict answers in advance | Questions are stored client-side by design (no server), so this is inherent. Focus on question randomization to defeat pattern-guessing |
| No validation of progress claims | User manually edits localStorage to claim false progress | Single-device, local game—no leaderboard, no external claims. Self-cheating is their own problem. Add sanity checks if needed (XP > threshold alerts) |
| Embedding user data in localStorage without structure | Accidental data corruption, version conflicts | Use versioned storage format (mathlab_v1_progress), validate schema on load, migrate safely on update |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Menu paralysis (too many modes/settings) | User can't decide where to start, leaves app | Single path: open → question → answer → repeat. No toggles in MVP |
| No progress feedback after session | Silent failure, user doesn't know if they improved | Show session summary: questions right/wrong, tables mastered, patterns |
| Harsh white-on-black contrast | Eye strain, astigmatism blur, unreadable text | Use near-black + soft white, test contrast ratios, provide light mode option |
| Aggressive animations/visual clutter | ADHD overstimulation, distraction | Minimize motion, only for intentional feedback (level-up), muted colors |
| Timed pressure (countdown, streak) | Cortisol spike, anxiety, failure for math-anxious users | No timers. Fast feedback instead (instant answer reveal, no penalty for speed) |
| Samey questions (same 4 wrong answers every time) | User memorizes patterns, not math | Vary distractors—sometimes off-by-one, sometimes wrong table entirely, sometimes plausible mistakes |
| No session summary | User can't see progress, motivation drops | Show: correct/wrong count, tables mastered, trend vs. last session |
| Random shuffling not actually random | User guesses by position, not math understanding | Log answer positions, verify randomization in analytics, audit for bias |

---

## "Looks Done But Isn't" Checklist

- [ ] **localStorage persistence:** Verified that XP/level survive app close, browser close, and reload. Tested with storage quota near-full (QuotaExceededError handling tested). Data migration plan exists for app updates.
- [ ] **Answer randomization:** Logged 50+ sessions and verified correct answer appears in each position ≈25% of the time. No position bias detected. Distractors vary (not always same wrong answers).
- [ ] **Progress tracking:** Session summary shown after every session. Mastery per table visible. Historical trend available (last 7 days at minimum).
- [ ] **Contrast accessibility:** All text passes 4.5:1 contrast ratio check. Tested on multiple displays and in variable lighting. No pure black/white used. Light mode toggle exists.
- [ ] **No pressure mechanics:** No timers, no daily streaks, no leaderboards. Soft "come back soon" notifications (if any) are optional and can be disabled. Pressure-related features documented as *explicitly out of scope*.
- [ ] **ADHD-friendly UX:** No auto-play video, no aggressive animations, single clear path to play. Tested with target user—no reports of distraction, overwhelm, or eye strain.
- [ ] **Multiple choice design:** Correct answer doesn't cluster in any position. Distractors are plausibly wrong, not obviously wrong. User can't guess without math knowledge.
- [ ] **Dark theme consistency:** Accent colors readable on dark background. Text soft enough for extended reading. Tested in bright and dim lighting.
- [ ] **Error recovery:** App gracefully handles localStorage write failure (shows user-facing error, doesn't crash). Recovers from corrupted data (validation + fallback).
- [ ] **Question variety:** At least 8 unique distractors per problem type (e.g., 8×7 has 8+ different wrong answers across all times it appears). User can't memorize.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Reward fatigue sets in (engagement cliff) | MEDIUM | Reset progression curve (easier milestones, variable lengths), add new reward type (cosmetics, themes), gather user feedback. Requires Phase 3+ work. |
| localStorage quota exceeded | LOW | Prune old sessions, compress stored data, clear test data. Can be done without code changes (but should add prevention in Phase 1). |
| Answer position bias discovered | LOW | Re-randomize all questions, log new baseline, notify user. Quick fix if randomization logic is isolated. |
| Contrast accessibility failure | LOW-MEDIUM | Adjust color palette, switch to near-black/soft-white, add light mode. If CSS is structured, this is quick. If colors hardcoded, medium effort. |
| Pressure mechanics added and backfire | MEDIUM-HIGH | Remove timers, notifications, leaderboards. Requires UX redesign if deeply integrated. Easier if kept as toggles. |
| Menu paralysis (too many options) | HIGH | Simplify to single path, move toggles to settings page (defer). Requires UX rework if menus are core flow. |
| No progress tracking in shipped MVP | MEDIUM-HIGH | Add analytics infrastructure, session summaries, mastery tracking. Requires storage schema change + UI updates. Cannot be patched on top easily. |
| Dark theme causes eye strain | LOW-MEDIUM | Implement light mode, adjust contrast, use near-black not pure black. If theme system is built cleanly, low cost. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Reward fatigue | Phase 2 (Gamification) | UAT: Test engagement curve across weeks 1–6. Measure session duration drop-off. Interview user about motivation. |
| Cognitive overload (visual clutter) | Phase 1 (MVP) | UAT: User reports no eye strain, headaches, or overstimulation after 20-min session. Contrast audit passes. Light mode works. |
| Option order bias | Phase 1 (MVP) | QA: Log 50+ sessions, audit position distribution. Success rate should be consistent across answer positions within ±5%. |
| Pressure-induced failure | Phase 1 (MVP) | Design: No timers, no countdown, no streaks in scope. UAT: User reports no anxiety. Session success rate matches previous casual practice. |
| localStorage corruption | Phase 1 (MVP) | QA: Test storage quota edge cases, QuotaExceededError handling, data persistence across restarts. Include in smoke tests. |
| Analysis paralysis (feature creep) | Phase 1 (MVP) | UAT: First-time user opens app and can play without menu confusion (< 3 seconds to first question). |
| No progress visibility | Phase 2 (Gamification) | UAT: User can articulate what they improved at. Session summary shown. Mastery per table visible. Trend data available. |
| Dark theme accessibility | Phase 1 (MVP) | Accessibility audit: WCAG 2.1 AA contrast checks pass. Light mode toggle tested. User feedback: readable for 20 minutes. |

---

## Sources

**Educational Gamification & Engagement:**
- [Gamification in Educational Apps to Enhance Learning Experiences - Eastern Peak](https://easternpeak.com/blog/gamification-strategies-in-educational-apps/)
- [7 Gamification Mistakes & How to Avoid Them - Litmos](https://www.litmos.com/blog/articles/gamification-mistakes)
- [Impact of gamification on school engagement: a systematic review - Frontiers](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1466926/full)

**ADHD UX & Neurodivergent Design:**
- [UX Design for ADHD: When Focus Becomes a Challenge - Medium](https://medium.com/design-bootcamp/ux-design-for-adhd-when-focus-becomes-a-challenge-afe160804d94)
- [UI/UX for ADHD: Designing Interfaces That Actually Help Students - Din Studio](https://din-studio.com/ui-ux-for-adhd-designing-interfaces-that-actually-help-students/)
- [App design for people with ADHD - GoTDAH - Medium](https://medium.com/design-bootcamp/gotdah-fundaci%C3%B3n-ingada-b6405cfa8812)

**Math Practice Engagement & Abandonment:**
- [Why Student Engagement in Math Fails (and How to Fix It) - Techie Turtle Teacher](https://techieturtleteacher.com/lack-of-student-engagement-in-math-fix-it/)
- [Daily 20-Minute Math Apps: How to Build Your Child's Confidence - Afficienta Blog](https://blog.afficienta.com/daily-20-minute-math-apps_-how-to-build-your-child%27s-confidence-in-2026/)

**Math Anxiety & Pressure/Time Stress:**
- [Choke or thrive? The relation between salivary cortisol and math performance - Academia](https://academia.edu/24474896/Choke_or_thrive_The_relation_between_salivary_cortisol_and_math_performance_depends_on_individual_differences_in_working_memory_and_math-anxiety)
- [Succeeding in school: Stress boosts performance for confident students - ScienceDaily](https://www.sciencedaily.com/releases/2011/08/110809092045.htm)
- [Endogenous and exogenous time pressure and math anxiety - ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0883035516310977)

**Reward Fatigue & Burnout:**
- [Streaks, Badges, and Burnout: When Learning Apps Feel Like ... - ScreenWise](https://screenwiseapp.com/guides/when-learning-feels-like-work)
- [The Psychology of Gamification And Learning - BadgeOS](https://badgeos.org/the-psychology-of-gamification-and-learning-why-points-badges-motivate-users/)

**Dark Theme & Accessibility:**
- [Dark Mode UI: Best Practices and Common Mistakes to Avoid - Medium](https://medium.com/design-ninjas/dark-mode-ui-best-practices-and-common-mistakes-to-avoid-a96d7e5c9709)
- [10 Common Dark Mode Design Mistakes - Medium](https://medium.com/@dollyborade07/10-common-dark-mode-design-mistakes-ui-designers-should-avoid-e81f08838fbc)
- [Inclusive Dark Mode: Designing Accessible Dark Themes For All Users - Smashing Magazine](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)
- [The Designer's Guide to Dark Mode Accessibility - AccessibilityChecker](https://www.accessibilitychecker.org/blog/dark-mode-accessibility/)

**Multiple Choice Design & Assessment:**
- [Designing Effective Multiple-Choice Questions (MCQs) - XB Software](https://xbsoftware.com/blog/how-to-design-multiple-choice-questions/)
- [The Effects of Different Feedback Types on Learning With Mobile Quiz Apps - Frontiers](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.665144/full)

**Single-File Web Apps & localStorage:**
- [State Management in Single Page Applications (SPAs) - PixelFree Studio](https://blog.pixelfreestudio.com/state-management-in-single-page-applications-spas/)
- [The Single-File App Architecture - DEV Community](https://dev.to/clawgenesis/the-single-file-app-architecture-why-i-stopped-reaching-for-a-backend-15ej)
- [Making Your SPA Remember State with localStorage: 3 Patterns and Their Pitfalls - DEV Community](https://dev.to/linou518/making-your-spa-remember-state-with-localstorage-3-patterns-and-their-pitfalls-30jo)
- [Using localStorage in Modern Applications - RxDB](https://rxdb.info/articles/localstorage.html)

---

*Pitfalls research for: Gamified math practice (single-file web app, ADHD-friendly, dark grunge UX)*
*Researched: 2026-06-20*
*Confidence: HIGH*
