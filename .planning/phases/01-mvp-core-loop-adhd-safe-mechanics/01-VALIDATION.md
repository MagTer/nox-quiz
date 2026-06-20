---
phase: 1
slug: mvp-core-loop-adhd-safe-mechanics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser testing + DevTools console scripts (no test runner — single HTML file, zero dependencies) |
| **Config file** | none |
| **Quick run command** | Open `math-lab.html` in browser, play 5 questions |
| **Full suite command** | Open `math-lab.html`, run console validation scripts, play 50+ questions |
| **Estimated runtime** | ~5 minutes (manual) |

---

## Sampling Rate

- **After every task commit:** Open HTML file in browser and visually verify the task's acceptance criteria
- **After every plan wave:** Run full browser + DevTools validation suite
- **Before `/gsd-verify-work`:** Full suite must pass all manual checks
- **Max feedback latency:** 5 minutes (open file, interact, observe)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | CORE-01 | N/A | manual | open HTML, click answer option | ✅ | ⬜ pending |
| 01-01-02 | 01 | 1 | CORE-02 | N/A | manual | click option, observe <300ms feedback | ✅ | ⬜ pending |
| 01-01-03 | 01 | 1 | CORE-03 | N/A | manual | verify XP increments on correct answer | ✅ | ⬜ pending |
| 01-01-04 | 01 | 1 | CORE-04 | N/A | manual | reach level threshold, observe celebration | ✅ | ⬜ pending |
| 01-01-05 | 01 | 1 | QUES-01/02 | N/A | console | run 50-question distribution script in DevTools | ✅ | ⬜ pending |
| 01-01-06 | 01 | 1 | QUES-03 | N/A | console | verify answer position distribution ≈25% per slot | ✅ | ⬜ pending |
| 01-01-07 | 01 | 1 | PROG-01 | N/A | manual | close + reopen browser, verify XP/level persisted | ✅ | ⬜ pending |
| 01-01-08 | 01 | 1 | PROG-02 | N/A | visual | observe XP bar updating after each correct answer | ✅ | ⬜ pending |
| 01-01-09 | 01 | 1 | PROG-03 | N/A | console | inspect localStorage, verify per-table accuracy tracking | ✅ | ⬜ pending |
| 01-01-10 | 01 | 1 | UX-01 | N/A | visual | dark background, no pink, bold fonts visible | ✅ | ⬜ pending |
| 01-01-11 | 01 | 1 | UX-02 | No timer in DOM | DOM audit | DevTools search for `<timer>` / `countdown` / `setInterval` timer display | ✅ | ⬜ pending |
| 01-01-12 | 01 | 1 | UX-03 | N/A | tool | WebAIM contrast checker on all text elements | ✅ | ⬜ pending |
| 01-01-13 | 01 | 1 | UX-04 | N/A | manual | open math-lab.html directly in browser (no server) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `math-lab.html` — single deliverable file exists and opens in browser
- [ ] Browser console shows no JavaScript errors on load

*All test infrastructure is manual (browser + DevTools). No framework to install.*

---

## DevTools Console Validation Scripts

These scripts are pasted into the browser DevTools console during validation:

**Distribution check (QUES-01/02):**
```javascript
// Run 50 questions and log table distribution
const counts = {}; for(let i=0; i<50; i++) { const q = window.getNextQuestion?.(); if(q) counts[q.table] = (counts[q.table]||0)+1; } console.table(counts);
// Expected: 6-9 tables ~35 each, 1-5 tables ~15 each (70/30 split over 50 questions)
```

**Answer position check (QUES-03):**
```javascript
// Check that correct answer appears at each position roughly equally
// Play 50 questions and log correct answer positions
```

**localStorage inspection (PROG-01/03):**
```javascript
console.log(JSON.parse(localStorage.getItem('mathlab_save_v1')));
// Should show: {level, xp, tableAccuracy: {6:[], 7:[], ...}}
```

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Feedback appears within 300ms of click | CORE-02 | Perception is subjective; DevTools Performance tab can measure | Click answer, observe immediate color change/text |
| Level-up celebration is visible and satisfying | CORE-04 | Subjective UX quality; requires human judgment | Reach level threshold, observe 0.8s flash animation |
| Dark grunge aesthetic looks correct | UX-01 | Visual quality check; no automated aesthetic tests | Open file, confirm dark bg, green accents, no pink |
| No timer exists anywhere | UX-02 | DOM audit for timer UI elements | DevTools Elements search, confirm no countdown/timer nodes |
| WCAG AA contrast on all text | UX-03 | Color measurement requires external tool | Use WebAIM contrast checker on #e8e8e8 on #0a0a0a |
| File opens without server | UX-04 | File:// protocol behavior | Double-click math-lab.html in File Explorer |
| XP bar is motivating / level number visible | PROG-02 | Subjective engagement check | Play 3-5 questions, confirm header always shows level/XP |

---

## Validation Sign-Off

- [ ] All tasks have visual/console verification steps
- [ ] Distribution check script validates QUES-01/02/03
- [ ] localStorage save/restore verified (PROG-01)
- [ ] No timer found in DOM (UX-02 — hard constraint)
- [ ] WCAG AA contrast verified with external tool (UX-03)
- [ ] File opens from file:// protocol (UX-04)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
