---
phase: 22-implementation-review-auto-fix
plan: 02
subsystem: mechanics
tags: [review, auto-fix, kaplay, re-entrancy, collision, challenge-seam]
requires: [22-01]
provides:
  - "Cluster A (challenge seam + 4 math mechanics) reviewed with tiered evidence — 6 verdict rows final"
  - "WR-03 busy re-entrancy guard in door.js and gates.js (engine-proven same-frame double-fire window closed)"
  - "collect.js multi-zone hardening: zone-entry re-entrancy guard + pickup-ownership guard (Phase 25 groundwork)"
  - "Escalation Candidate 3 (answer-box magic numbers) + Candidate 2 evidence enrichment for the FIX-02 round"
affects: [22-05, 25-multi-zone-levels]
tech-stack:
  added: []
  patterns:
    - "WR-03 closure-local busy guard generalized from enemy.js to door.js/gates.js with engine-semantics rationale"
    - "Teleport-adjacent Playwright evidence (21-04 precedent) for scenarios unreachable by natural movement"
key-files:
  created: []
  modified:
    - src/mechanics/door.js
    - src/mechanics/gates.js
    - src/mechanics/collect.js
    - .planning/phases/22-implementation-review-auto-fix/22-FINDINGS.md
key-decisions:
  - "Door/gates busy-guard asymmetry resolved by ADDING the guard (not a why-unneeded comment): engine source proves the same-frame double-fire window is real — the collision pass re-checks only the partner's paused flag per pair, and the player is traversed after buildLevel's barriers"
  - "collect.js multi-zone corruption fixed as zero-behavior-change hardening (not escalated): both new guards are provably inert on single-zone levels, confirmed by the audit row diff"
  - "challenge.js close() dead-object hazard REFUTED, no liveness guard added: .hidden is a plain data property (benign write on destroyed objects) and gameplay cannot destroy a hidden prior object mid-stack"
  - "Answer-box constants extraction escalated (Candidate 3, PENDING-DECISION) — creates new config tokens, outside the existing-tokens-only polish rule"
metrics:
  duration: ~25 min
  completed: 2026-07-05
status: complete
---

# Phase 22 Plan 02: Cluster A — Challenge Seam & Math Mechanics Review Summary

**One-liner:** Engine-source-proven WR-03 busy guards landed in door.js/gates.js and multi-zone corruption guards in collect.js — all provably zero-behavior-change on shipped levels — while the challenge.js close() hazard was behaviorally REFUTED and design-feel items escalated to the FIX-02 round.

## What Was Done

### Task 1: Challenge seam trio review (challenge.js, mathGate.js, enemy.js)

- **Finding 1 (challenge.js close() dead-object hazard): REFUTED** with tier-3 behavioral evidence. A throwaway Playwright script (scratchpad `evidence-22-02-challenge-close.mjs`, port 8770, CR-02 server skeleton copied verbatim) stacked two challenges on level-01, destroyed a hidden prior object mid-stack (the exact feared scenario), and resolved the outer gate: **zero uncaught page errors**, survivors restored un-hidden (`{total:2, hidden:0}`). Root cause of benignity: `hidden` is a plain data property on the GameObj — `destroy()` only detaches from the scene tree. Scene-exit path also verified: 0 challenge objects in select, no errors. Screenshots: `22-02-A1-stacked.png`, `22-02-A2-restored.png`, `22-02-B-select.png` (scratchpad).
- **Finding 2 (mathGate.js banner teardown): CONFIRMED SAFE** at source tier — banner objects are scene children; game.js:311 cancels the in-flight `clearTransitionTween` on scene leave.
- **Finding 3 (enemy.js): clean** — WR-03 guard and 21-04 two-line label fix both present at HEAD; busy-reset-only-in-onSuccess invariant recorded for future close paths.
- **Escalation Candidate 3 appended** (BOX_W/BOX_H/GAP magic numbers, IN-03) with Status: PENDING-DECISION; **Candidate 2 enriched** with the new evidence that the two-challenge stack is not even reachable by natural rightward movement on level-01 (pickups auto-resolve en route).

### Task 2: door/gates busy-guard asymmetry + collect.js multi-zone corruption

- **Finding 4 (CONFIRMED, source tier — resolves 22-RESEARCH Open Question 1):** direct read of the vendored engine's collision pass (`yn()` in lib/kaplay.mjs) proved the same-frame double-fire window is real: pairs dispatch synchronously in one incremental grid traversal; the traversed object's own `paused` flag is checked ONCE before its pair loop while only the partner's flag is re-checked per pair; game.js adds the player AFTER buildLevel's barriers, making the player the later-traversed object. Setting `player.paused` mid-loop therefore cannot stop a second overlapping barrier pair. **Fix:** enemy.js's WR-03 guard shape copied verbatim into both files (closure-local, set before mutation, reset only in onSuccess) — commit `c9953a4`.
- **Finding 5 (CONFIRMED latent, source tier):** collect.js's single `active` slot is overwritten by a second zone (guard only early-returned for the SAME zone); pickup handler lacked slot-to-zone ownership; labelObj leaks on re-trigger. **Fix:** zone-entry re-entrancy guard (`if (active) return`) + pickup-ownership guard (`active.zoneObj.slots.includes(slotObj.slotIndex)`), single onCollide per event preserved (f541f88), all state closure-local (a727c13) — commit `51d2653`. Provably inert on shipped levels (L1/L3/L4 one zone each, L2 zero).

### Task 3: Cluster A regression + verdict rows

- browser-boot exit 0 on post-fix HEAD; fresh 16-row audit table recorded with row-by-row diff vs the 22-01 baseline honoring the stable-core rule: 5 always-unreached rows unchanged, 8 always-reached rows byte-identical Triggered/Resolved; the single differing row (level-03 math-gate x420, true/true in both post-fix runs) is a documented timing-sensitive row within its known flip envelope. `Cluster A regression: PASS` recorded.
- `scripts/lib/mechanic-drive.mjs` NOT extended — no script assumption broke (listed in the plan's files_modified only conditionally).
- Verdict table: collect **fixed**, door **fixed**, enemy **clean**, gates **fixed**, challenge **escalated** (Candidates 2/3), mathGate **clean** — 18 rows remain pending for Plans 22-03/22-04.

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| `03c4f52` | docs | Findings 1–3 + Escalation Candidate 3 + Candidate 2 enrichment |
| `c9953a4` | fix | WR-03 busy re-entrancy guard in door.js + gates.js |
| `51d2653` | fix | collect.js multi-zone active-slot corruption hardening |
| `030cbe5` | docs | Findings 4–5 with fix commit SHAs |
| `48b499c` | docs | Cluster A regression PASS + 6 final verdict rows |

## Deviations from Plan

### Auto-fixed Issues

None requiring deviation rules — all fixes were the plan's own anticipated conditional artifacts.

### Plan-expectation deviations (documented, no rule invoked)

**1. The plan's stacking scenario (a) is unreachable by pure movement.** The plan's evidence recipe ("enter the answer-zone at x300, then trigger the math-gate at x600") auto-resolves the collect challenge en route — the player walks through the pickup cluster (x270–330) and touches the correct pickup. Reproduced the stack with a teleport-adjacent hop past the pickups (21-04 precedent, sanctioned by 22-PATTERNS section 7). Recorded as evidence in Finding 1 and as enrichment on Candidate 2 (concurrency even harder to reach than the tech-debt entry assumed).

**2. Task 3's "same 6 unreached rows" expectation superseded by the Baseline stable-core rule.** The 22-01 baseline itself documented 3 timing-sensitive rows; the post-fix diff was evaluated against the 5-row/8-row stable cores as the findings artifact (and the executor prompt) direct. Outcome was clean either way except one timing-sensitive row flipping toward reached — explained, not celebrated.

### Out-of-scope discoveries

- Untracked audit screenshots regenerating under the archived Phase 21 path — logged to `deferred-items.md` (harness path fix is Phase 23 scope).

## Known Stubs

None. Both fix commits are complete, live code paths (deliberately inert on current single-zone/spaced-barrier content by design, activated by Phase 24–25 content).

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes. T-22-02 (throwaway server) mitigated by verbatim CR-02 skeleton copy on port 8770; T-22-03 mitigated (check-gate.sh DOM-sink assertion green after every commit); T-22-06 mitigated (guards follow the WR-03 reset-in-onSuccess shape; audit row diff proves no soft-lock).

## Verification Evidence

- All 4 static gates green after every commit (5 commits × 4 gates).
- `node --check` on every touched src file per fix.
- browser-boot exit 0 post-fix; 16-encounter audit diffed row-by-row (two consecutive post-fix runs, identical unreached sets).
- Task verify commands: `TRIO-REVIEW-OK`, `MECHANICS-OK`, `CLUSTER-A-OK` all printed.
- `git status --porcelain -- src/levels lib` empty throughout (no geometry/engine edits).

## Next Plan Readiness

- Plans 22-03 (Cluster B) and 22-04 (Cluster C) can run against the same baseline; 18 verdict rows pending.
- Plan 22-05 inherits 3 PENDING-DECISION escalation candidates (glyph clarity, same-time-open, answer-box constants) for the batched FIX-02 round, plus the collect.js/door/gates fixes already regression-proven at this cluster boundary.

## Self-Check: PASSED

All 3 modified src files present at HEAD; all 5 commits (`03c4f52`, `c9953a4`, `51d2653`, `030cbe5`, `48b499c`) verified in git log; FINDINGS, SUMMARY, and deferred-items files exist on disk.
