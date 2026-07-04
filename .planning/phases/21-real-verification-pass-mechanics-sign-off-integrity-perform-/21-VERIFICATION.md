---
phase: 21-real-verification-pass-mechanics-sign-off-integrity-perform-
verified: 2026-07-04T18:30:00Z
status: gaps_found
score: 1/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "door.js, gates.js, enemy.js, and mathGate.js have each been driven interactively (real player movement + real answer input, not teleport-only) across all 4 levels, with findings recorded the way the post-ship diagnostic recorded collect.js's 5 bugs."
    status: failed
    reason: >
      door.js and enemy.js were NEVER successfully driven with real player movement in ANY of the 4
      levels, at any point in this phase. An independent, fresh re-run of
      scripts/audit-phase21-mechanics.mjs performed during this verification (not just re-reading
      21-FINDINGS.md's claims) confirms triggered:false / resolved:false for all 3 door encounters
      (level-01 x:1400, level-02 x:1540, level-04 x:900) and all 3 enemy encounters (level-01 x:1000,
      level-03 x:2400, level-04 x:2400). Only 7 of 16 total mechanic encounters were ever actually
      driven across the entire phase (4 "first math-gate per level" + 3 collect-zones). Door.js has
      ZERO interactive evidence anywhere in the phase's artifacts (every door screenshot shows the
      player still stuck near the level's own spawn/collect-zone, never near a door). Enemy.js's only
      supporting visual evidence is a single, uncommitted, throwaway Playwright script (not part of
      the shipped repo, not reproducible) that teleported the player next to ONE of its three
      placements (level-01) before walking the final short distance — i.e. even the one enemy
      "confirmation" is not fully "real player movement... not teleport-only" as the criterion
      requires, and levels 03/04's enemy encounters have no interactive evidence at all. This is a
      direct, confirmed miss of the phase's own core stated purpose (giving these four mechanics the
      same real interactive scrutiny collect.js got).
    artifacts:
      - path: "scripts/audit-phase21-mechanics.mjs"
        issue: "driveToX's single-jump-per-gap traversal model cannot cross several authored gaps that require sequential stepping-stone-platform jumps (documented honestly as a known limitation in 21-FINDINGS.md's own Methodology Note), so it never reaches door.js or enemy.js in any level, in any run performed across the whole phase (including my own independent re-run)."
    missing:
      - "A platform-aware (multi-jump) traversal model in driveToX/deriveGapRanges, or a save-seeded mid-level spawn approach, so door.js and enemy.js are each genuinely, reproducibly driven with real movement + real answer input in at least one level per the roadmap's literal 'across all 4 levels' wording."
      - "If a full platform-aware traversal model is out of scope, at minimum a committed (not throwaway/scratchpad) script that reaches door.js at least once via real movement (not teleport) to close the phase's stated goal for that mechanic."
  - truth: "Any real bugs found in mechanic #1 are fixed and re-verified, the same way the 6 post-ship bugs were."
    status: partial
    reason: >
      Two real bugs were found by the Plan 21-01 interactive audit: enemy.js's prompt-override
      (Finding 2) and a newly-discovered simultaneous/overlapping-challenge bug (New Finding 4).
      Finding 2 was FIXED and re-verified (confirmed directly in current source:
      src/mechanics/enemy.js passes label instead of prompt; src/ui/challenge.js renders it as its
      own stacked line). New Finding 4 was only HALF fixed: the state-corruption half (a resolved
      challenge's destroyAll() wiping out a different, still-open challenge) is fixed via
      per-instance instanceTag scoping (confirmed in src/ui/challenge.js lines 103-131, 298-301).
      The VISUAL-OVERLAP half (two challenge overlays rendering on top of each other — the closer
      match for the live-reported "not possible to answer... no ID on the options" symptom) remains
      explicitly, admittedly UNFIXED, per challenge.js's own inline comment ("still out of scope
      here... future plan"). Separately, two additional real bugs found later by 21-REVIEW.md
      (CR-01 broken resolution detection, CR-02 jump-over exploit) WERE fixed and confirmed present
      in current source.
    artifacts:
      - path: "src/ui/challenge.js"
        issue: "openChallenge() still has no same-time-open guard; a second mechanic's challenge can still render its overlay simultaneously on top of a still-open prior challenge's overlay (New Finding 4's visual half, left open by design)."
    missing:
      - "A same-time-open guard (or equivalent) in openChallenge() so two mechanics' overlays can never visually overlap, closing New Finding 4's visual half — or, if intentionally deferred as an architectural change, an explicit human-accepted override recorded in this VERIFICATION.md's frontmatter."
  - truth: "The automated boot check actually exercises movement and at least one full mechanic resolution per level (not just \"scene loaded, zero console errors\")."
    status: partial
    reason: >
      scripts/browser-boot.mjs exercises real movement + full mechanic resolution ONLY for level-01
      (confirmed via source read and an independent live re-run performed during this verification:
      exit 0, "Browser boot: PASS"). Levels 2, 3, and 4 still receive only the pre-existing "scene
      loaded, zero console errors" treatment (Enter -> wait 1500ms -> Escape; no directional input,
      no challenge-resolution check) — literally the same gap the phase goal states must close, just
      not closed for 3 of the 4 levels. This is a documented, deliberate scope reduction (Plan 21-02,
      justified as keeping the fast per-commit gate minimal per 21-RESEARCH.md's Pitfall 3), but it
      does not match the roadmap Success Criterion's literal "per level" wording.
    artifacts:
      - path: "scripts/browser-boot.mjs"
        issue: "the i===0 (level-01-only) branch gating the movement+resolution assertions (lines 147-190) is never applied for i=1,2,3 (levels 2-4)."
    missing:
      - "Movement + mechanic-resolution assertions for level-02, level-03, and level-04 in scripts/browser-boot.mjs, OR an explicit human-accepted override recording that the level-01-only scope is intentionally sufficient (since Plan 21-01's exhaustive one-off script already exists for full 4-level coverage, and this is meant only as a fast per-commit smoke gate)."
human_verification: []
---

# Phase 21: Real Verification Pass — Mechanics & Sign-off Integrity Verification Report

**Phase Goal:** Give `door.js`, `gates.js`, `enemy.js`, and `mathGate.js` the same real interactive
scrutiny `collect.js` got during the post-ship diagnostic pass (which found 5 real bugs, including a
total soft-lock, hiding behind claims of "passed") — these four were code-verified but never
screenshot/interaction-audited across all 4 levels. Harden the automated boot gate so it actually
exercises movement and mechanic resolution instead of just confirming scenes load with zero console
errors, and correct the unsupported "human sign-off" claims left in `v4.0-MILESTONE-AUDIT.md` and the
REQUIREMENTS.md traceability table so the project record stops asserting verification that never
happened.

**Verified:** 2026-07-04T18:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `door.js`, `gates.js`, `enemy.js`, `mathGate.js` each driven interactively across all 4 levels | ✗ FAILED | Independent re-run of `scripts/audit-phase21-mechanics.mjs` (performed live during this verification, not trusting 21-FINDINGS.md's claims alone): door.js triggered:false/resolved:false in all 3 of its encounters; enemy.js triggered:false/resolved:false in all 3 of its encounters. Only 7/16 encounters (4 first-math-gates + 3 collect-zones) were ever actually driven. |
| 2 | Any real bugs found in mechanic #1 are fixed and re-verified | ✗ PARTIAL (treated as failed — see gaps) | Finding 2 (enemy.js) fixed and confirmed in source. New Finding 4's visual-overlap half explicitly left unfixed per `src/ui/challenge.js`'s own inline comment. CR-01/CR-02 (found later by code review) fixed and confirmed in source. |
| 3 | Automated boot check exercises movement + ≥1 full mechanic resolution per level | ✗ PARTIAL (treated as failed — see gaps) | Live re-run of `scripts/browser-boot.mjs` confirms real movement + math-gate resolution for level-01 only (exit 0, PASS). Levels 2-4 unchanged: scene-load-only, no movement/resolution check. |
| 4 | `v4.0-MILESTONE-AUDIT.md` unsupported sign-off claims corrected/annotated; NAV-04 traceability resolved | ✓ VERIFIED | Direct file read confirms Phase 14 row and NAV-04 Requirements Coverage row in `v4.0-MILESTONE-AUDIT.md` carry dated, additive `[Corrected 2026-07-04, Phase 21 audit]` annotations citing `14-VERIFICATION.md`'s `human_needed` status; archived `v4.0-REQUIREMENTS.md`'s NAV-04 traceability row carries a matching dated annotation appended after (not replacing) "Complete". Phase 15 row gained a smaller citation-correction note (STATE.md → 15-04-SUMMARY.md) without a status change, since its sign-off genuinely occurred. |

**Score:** 1/4 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/audit-phase21-mechanics.mjs` | Reusable interactive audit driving real movement + answer input across all 4 levels for door/gates/enemy/mathGate/collect | ⚠️ HOLLOW (partial coverage) | Exists, substantive, wired (imports `getLevel`/`LEVEL_ORDER` from `src/levels/index.js`). Actually reaches and resolves only 7/16 encounters; door.js and enemy.js are structurally unreachable by its single-jump traversal model in every level they appear in. |
| `.planning/phases/21-.../21-FINDINGS.md` | collect.js-diagnostic-style findings (numbered, screenshot-backed) | ✓ VERIFIED | Exists, records Finding 1/2/3 verdicts + New Finding 4 + Post-Fix Verification, all cross-checked against real screenshots and current source this session. Honestly discloses the 9/16-unreached limitation (not hidden), which is exactly why the underlying Truth 1 gap is visible and traceable. |
| `.planning/phases/21-.../screenshots/` | Before/after PNG per mechanic encounter, all 4 levels | ✓ VERIFIED (33 files) | Confirmed present; spot-checked `level-01-door-1400-before.png` (shows player still near spawn/collect-zone, never near the door — consistent with the "never reached" finding, not a fabricated success) and `level-01-enemy-1000-manual-verify.png` (confirms the label+arithmetic two-line fix renders legibly). |
| `scripts/browser-boot.mjs` | Hardened boot gate, real movement + mechanic resolution per level | ⚠️ PARTIAL | Exists, substantive, wired. Confirmed via live re-run (exit 0) that level-01's collect-zone + math-gate assertions are genuine and pass. Levels 2-4 have no equivalent assertions. |
| `.planning/milestones/v4.0-MILESTONE-AUDIT.md` (annotated) | Phase 14 row + NAV-04 row corrected | ✓ VERIFIED | Confirmed via direct read (see Truth 4 evidence above). |
| `.planning/milestones/v4.0-REQUIREMENTS.md` (annotated) | NAV-04 traceability row annotated | ✓ VERIFIED | Confirmed via direct read. |
| `src/mechanics/enemy.js` (fixed) | Uses `label` instead of `prompt` | ✓ VERIFIED | Confirmed in current source (line 49: `label: "Answer to defeat the guard:"`). |
| `src/ui/challenge.js` (additive `label` + defensive `color()`) | Two-line label/arithmetic layout, `LABEL_FG` on all text() calls | ✓ VERIFIED | Confirmed in current source (lines 47, 81, 162-194). |
| `src/levels/build.js` (defensive `color()` + CR-02 anti-jump-over blockers) | Door/math-gate/enemy glyphs colored; math-gate/enemy get tall invisible blockers | ✓ VERIFIED | Confirmed in current source: `LABEL_FG` applied to all 3 glyph `text()` calls; math-gate and enemy each get an apex-derived `blockerH` collider mirroring the door's pattern (lines 184-227), with `panelObj`/`glyphObj` correctly wired for cleanup in `gates.js`/`enemy.js`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `scripts/audit-phase21-mechanics.mjs` | `src/levels/index.js` | `import { getLevel, LEVEL_ORDER }` | ✓ WIRED | Confirmed via grep — mechanic positions/gaps derived programmatically, not hand-copied. |
| `scripts/browser-boot.mjs` | `src/levels/index.js` | `import { LEVEL_ORDER }` (WR-02 fix) | ✓ WIRED | Confirmed via grep — `SAVE_BLOB.levels` and the level-visiting loop both derive from `LEVEL_ORDER`. |
| `src/mechanics/enemy.js` | `src/ui/challenge.js` | `openChallenge({ label })` | ✓ WIRED | Confirmed: `label` prefixes rather than replaces the arithmetic display; `door.js`/`gates.js`/`mathGate.js` (never pass `label`/`prompt`) and `collect.js` (keeps `prompt`) are unaffected, per source read. |
| `21-FINDINGS.md` Finding 1/2/3 | `screenshots/*.png` | cited filenames | ✓ WIRED | Confirmed the cited screenshots exist and show what the findings claim (spot-checked 3 of them directly this session). |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Boot gate passes with hardened level-01 assertions | `node scripts/browser-boot.mjs` | `Browser boot: PASS — title -> select -> all levels loaded with no runtime errors.` (exit 0) | ✓ PASS |
| Full interactive mechanic audit, current codebase | `node scripts/audit-phase21-mechanics.mjs` | `AUDIT: FAILURES DETECTED` (exit 0 — diagnostic-only, non-blocking); JSON confirms door.js/enemy.js triggered:false in all 3 encounters each; math-gate resolved:true in 4/7; collect-zone triggered:true in 3/3 | ✓ PASS (script itself runs correctly; results independently confirm the Truth 1 gap) |
| Static gate suite regression check | `check-gate.sh && check-import-safety.sh && check-safety.sh && smoke-progress.mjs` | All 4 print PASS | ✓ PASS |
| Anti-jump-over blockers present for math-gate/enemy | `grep` of `src/levels/build.js` | `blockerH` construction present for door/math-gate/enemy, apex-derived | ✓ PASS |
| Debt-marker scan on all phase-touched files | `grep -nE "TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER"` | No matches in `challenge.js`, `enemy.js`, `build.js`, `gates.js`, `door.js`, `browser-boot.mjs`, `audit-phase21-mechanics.mjs` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| VERIFY-01 | 21-01 | door/gates/enemy/mathGate driven interactively across all 4 levels, findings recorded | ✗ BLOCKED | door.js and enemy.js never successfully driven in any level (see Truth 1 gap) |
| VERIFY-02 | 21-04 | Real bugs found are fixed and re-verified | ✗ BLOCKED (partial) | New Finding 4's visual-overlap half left unfixed (see Truth 2 gap) |
| VERIFY-03 | 21-02 | Boot check exercises movement + mechanic resolution per level | ✗ BLOCKED (partial) | Only level-01 hardened; levels 2-4 unchanged (see Truth 3 gap) |
| VERIFY-04 | 21-03 | Unsupported sign-off claims corrected; NAV-04 traceability resolved | ✓ SATISFIED | Confirmed via direct file read, additive/dated, matches SAFE-05 precedent |

No orphaned requirements — all 4 IDs in `.planning/REQUIREMENTS.md`'s Phase 21 mapping are claimed by exactly one plan each (21-01 through 21-04), matching the phase's 4 plans.

### Anti-Patterns Found

None. Debt-marker scan (`TBD`/`FIXME`/`XXX`) and warning-marker scan (`TODO`/`HACK`/`PLACEHOLDER`) across all files modified in this phase returned zero matches. No stub returns, no hardcoded-empty-data patterns beyond legitimate test/init state.

## Gaps Summary

This phase's own stated premise is that prior "passed" claims can hide real bugs and unfinished
verification — exactly what the pre-phase collect.js diagnostic and Phase 14's human sign-off claim
demonstrated. On independent re-verification (re-running the phase's own scripts live, not just
reading its documentation), the phase's central deliverable — genuinely driving `door.js` and
`enemy.js` interactively across all 4 levels — did not happen. Both mechanics remain, in the current
codebase, un-interaction-audited by real player movement in every level they appear in; the shared
audit script's single-jump traversal model simply cannot reach them, and this is honestly disclosed
in 21-FINDINGS.md's own "Methodology Note" rather than hidden — but an honestly-disclosed gap is
still a gap relative to Success Criterion #1's plain wording ("have each been driven interactively...
across all 4 levels"). The one supplementary confirmation that does exist for enemy.js (a single,
uncommitted, teleport-assisted screenshot for one of its three placements) does not satisfy "not
teleport-only" for the movement leg, and provides zero coverage for level-03/04's enemy encounters.

A second, smaller gap follows from the first: New Finding 4 (simultaneous/overlapping challenges) —
a real, ordinary-play-reachable bug discovered by this phase's own audit — was only half-fixed. The
state-corruption half is closed; the visual-overlap half (arguably the better match for the original
live-reported symptom) remains open, deferred without a recorded override.

A third, narrower gap: the hardened automated boot gate (VERIFY-03) closes the exact "seeds every
level pre-cleared, never plays" failure mode, but only for level-01. Levels 2-4 retain the prior
"scene loaded, zero console errors" behavior the phase goal explicitly set out to eliminate.

VERIFY-04 (the sign-off/traceability correction) is fully, genuinely achieved — confirmed by direct
file inspection, additive and dated, not a rewrite.

**This looks intentional for gaps 2 and 3** — both are documented, reasoned scope choices (New
Finding 4's visual-overlap fix is a larger architectural change; the boot gate's level-01-only scope
keeps the per-commit gate fast). To accept either deviation without further plans, add to this
VERIFICATION.md's frontmatter:

```yaml
overrides:
  - must_have: "Any real bugs found in mechanic #1 are fixed and re-verified"
    reason: "New Finding 4's visual-overlap half is a larger architectural change (same-time-open guard across openChallenge()); accepted as a tracked follow-up rather than blocking this phase."
    accepted_by: "<name>"
    accepted_at: "<ISO timestamp>"
  - must_have: "The automated boot check actually exercises movement and at least one full mechanic resolution per level"
    reason: "Level-01-only scope keeps the fast per-commit gate minimal per 21-RESEARCH.md Pitfall 3; Plan 21-01's exhaustive one-off script already covers all 4 levels for full-sweep diagnostics."
    accepted_by: "<name>"
    accepted_at: "<ISO timestamp>"
```

Gap 1 (door.js/enemy.js never interactively driven) is the phase's core, stated purpose and should
not be waved through by override — it needs either a platform-aware traversal-model fix or a
committed, non-teleport script that actually reaches these two mechanics in at least one level.

---

_Verified: 2026-07-04T18:30:00Z_
_Verifier: Claude (gsd-verifier)_
