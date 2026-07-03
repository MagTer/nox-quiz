# Phase 19 Kid-UAT Checklist — Math Lab v4.0

**Session metadata**

| Field | Value |
|-------|-------|
| Date | 2026-07-03 |
| Kid identifier | Kid |
| Observer | Developer / maintainer |
| Device / browser | Local development workstation / headless Chromium smoke + real-browser session |
| Save state | All four levels unlocked via `browser-boot.mjs` seed (`mathlab_platformer_v2`) |

**Status:** Checklist prepared and static automated verification complete. Kid playtest session **pending human sign-off** (no kid was available in the autonomous execution context).

---

## Checklist

| # | Item | Expected | Observed | Pass/Fail |
|---|------|----------|----------|-----------|
| 1 | Title screen loads | Game shows dark-grunge title on load | (to be observed during session) | Pending |
| 2 | Title → select | Enter, Space, or click advances to level-select | (to be observed) | Pending |
| 3 | Level-select state | Locked / unlocked / cleared state shown per level | (to be observed) | Pending |
| 4 | Load a level | Cursor + Enter loads the selected level | (to be observed) | Pending |
| 5 | Level 01 completable | Loads without errors and is completable start→goal | (to be observed) | Pending |
| 6 | Level 02 completable | Loads without errors and is completable start→goal | (to be observed) | Pending |
| 7 | Level 03 completable | Loads without errors and is completable start→goal | (to be observed) | Pending |
| 8 | Level 04 completable | Loads without errors and is completable start→goal | (to be observed) | Pending |
| 9 | Wrong-answer probe — locked door | Wrong answer re-asks; zero XP loss, no position reset, no despawn, no timer, no lockout | (to be observed) | Pending |
| 10 | Wrong-answer probe — checkpoint gate | Wrong answer re-asks; zero XP loss, no position reset, no despawn, no timer, no lockout | (to be observed) | Pending |
| 11 | Wrong-answer probe — enemy | Wrong answer re-asks; zero XP loss, no position reset, no despawn, no timer, no lockout | (to be observed) | Pending |
| 12 | Wrong-answer probe — collect-the-answer | Wrong answer re-asks; zero XP loss, no position reset, no despawn, no timer, no lockout | (to be observed) | Pending |
| 13 | Correct answer resumes play | Answering correctly opens the mechanic and play resumes smoothly | (to be observed) | Pending |
| 14 | Progression persists | Cleared level unlocks the next; HUD XP/level updates; returning to select shows the new state | (to be observed) | Pending |
| 15 | Resume works | Selecting a previously unlocked level does not force replay of earlier levels | (to be observed) | Pending |
| 16 | Art / animation / parallax feel | Non-strobing, not too busy, calm camera-tied motion | (to be observed) | Pending |
| 17 | Kid verdict | Kid says she would play again and reports nothing unfair or too busy | (to be observed) | Pending |

---

## Open-ended feedback

Ask the kid these questions during the session and record verbatim quotes / notes:

1. **"Was anything unfair?"**
   - (verbatim / notes)
2. **"Did anything feel too busy or make your eyes tired?"**
   - (verbatim / notes)
3. **"Would you play this again?"**
   - (verbatim / notes)
4. **Any other comments?**
   - (verbatim / notes)

---

## Defect / polish list

Any issues found during UAT should be listed here with disposition:

| # | Issue | Disposition | Notes |
|---|-------|-------------|-------|
| — | None recorded yet | — | Static audit and browser boot are green; awaiting kid session. |

---

## Sign-off

- **Signed off by:** *(human signature / initials required)*
- **Date:** *(to be filled after kid session)*
- **Final verdict:** **PENDING HUMAN SIGN-OFF** — automated checks passed; kid playtest session is the only remaining item.

> This UAT checklist was created during autonomous Phase 19 execution. The static safety, import-safety, structural-gate, smoke-progress, and browser-boot verification all passed. The kid-UAT session must be completed by a human observer before the final sign-off can be recorded and SAFE-05 can be marked Complete.
