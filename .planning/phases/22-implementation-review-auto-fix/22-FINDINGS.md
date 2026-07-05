# Phase 22: Implementation Review & Auto-Fix — Findings (FIX-01 evidence artifact)

**Created:** 2026-07-05 (Plan 22-01, Task 2)
**Format:** 21-FINDINGS.md conventions — numbered findings (what broke / why / fix or disposition / file), CONFIRMED/REFUTED verdicts for hypotheses, screenshot paths for visual claims, dated in-place disposition updates.

## Baseline (pre-fix, unmodified src/)

Baseline commit: 5eedee870d314307a846bae254f61e7d1e0ef5f4

Captured 2026-07-05 by Plan 22-01, Task 2. `git status --porcelain -- src/ lib/` was **empty** at capture time — game code byte-identical to shipped v4.1; the only change this phase before capture is the Task 1 de-flake of `scripts/check-gate.sh` (test infra only, commit `5eedee8`). Later plans extract the anchor via `sed -n 's/^Baseline commit: //p' 22-FINDINGS.md | head -1` and diff `src/` against it for every zero-regression claim.

### Static gates + smoke (verbatim final output lines, all exit 0)

- `bash scripts/check-gate.sh` (post-de-flake; 20/20 consecutive green runs in Task 1 verification):

  ```
  gate checks: PASS
  ```

- `bash scripts/check-import-safety.sh`:

  ```
  import-safety checks: PASS
  ```

- `bash scripts/check-safety.sh`:

  ```
  safety checks: PASS
  ```

- `bash scripts/check-progress.sh` (chains the smoke first):

  ```
  smoke-progress: PASS
  progress checks: PASS
  ```

- `node scripts/smoke-progress.mjs`:

  ```
  smoke-progress: PASS
  ```

### Browser boot (`node scripts/browser-boot.mjs`, port 8765)

Exited 0. Verbatim output (the fallback-path warning line is environmental, not a result line):

```
Browser boot: PASS — title -> select -> all levels loaded with no runtime errors.
```

**Note on expected shape:** the plan expected "per-level OK lines"; the current committed script prints a single aggregate PASS line asserting title → select → all 4 levels loaded with zero uncaught errors (per-level checks are internal — the script exits non-zero listing errors if any level fails). Recorded as observed, not normalized.

### 16-encounter interactive audit (`node scripts/audit-phase21-mechanics.mjs`, port 8768)

Exited 0 (diagnostic — always exits 0). Final line `AUDIT: FAILURES DETECTED` printed, as expected, for exactly the unreached rows below. Canonical baseline table (Run 1, 2026-07-05), sourced directly from this run's own printed JSON `results` array per the 21-FINDINGS "Full Mechanic Sweep" row-provenance convention. `resolved: null` is the collect answer-zone's correct by-design value.

| Level | Mechanic | x | Triggered | Resolved |
|-------|----------|---|-----------|----------|
| level-01 | answer-zone | 300 | true | null (by design) |
| level-01 | math-gate | 600 | true | true |
| level-01 | enemy | 1000 | true | true |
| level-01 | math-gate | 1300 | **true** ⚠ | **true** ⚠ |
| level-01 | door | 1400 | true | true |
| level-02 | math-gate | 420 | true | true |
| level-02 | math-gate | 1100 | false | false (unreached) |
| level-02 | door | 1540 | false | false (unreached) |
| level-03 | answer-zone | 200 | true | null (by design) |
| level-03 | math-gate | 420 | **false** ⚠ | **false (unreached)** ⚠ |
| level-03 | enemy | 2400 | false | false (unreached) |
| level-04 | answer-zone | 160 | true | null (by design) |
| level-04 | math-gate | 320 | true | true |
| level-04 | door | 900 | true | true |
| level-04 | math-gate | 1800 | false | false (unreached) |
| level-04 | enemy | 2400 | false | false (unreached) |

Run 1 totals: 10/16 triggered (7 resolved true, 3 collect answer-zones resolved null by design); 6/16 unreached.

#### ⚠ DEVIATION FROM EXPECTED BASELINE SHAPE — recorded, not normalized

The expected shape (22-RESEARCH.md / 21-FINDINGS Full Mechanic Sweep) predicted exactly these 6 unreached rows: level-01 math-gate x1300, level-02 math-gate x1100, level-02 door x1540, level-03 enemy x2400, level-04 math-gate x1800, level-04 enemy x2400. **Run 1 deviates on two rows** (⚠ above):

- **level-01 math-gate x1300** — expected unreached; Run 1 REACHED and RESOLVED it (reachedX 1282.4).
- **level-03 math-gate x420** — expected reached/resolved; Run 1 did NOT trigger it (reachedX 454.7 — traversal passed the gate's x without a challenge trigger this run).

A supplementary characterization run (Run 2, same session, same commit) confirmed this is **run-to-run traversal nondeterminism**, not a stable shape shift: Run 2 reached level-03 math-gate x420 (matching the expected shape) but missed level-01 math-gate x1300 AND **level-01 door x1400** (7 unreached in Run 2). This is consistent with the documented spike-timing resonance cause (21-FINDINGS Methodology Note; STATE.md audit blind spot).

**Ground truth for later regression diffs in this phase:**

- **Stable core — always unreached in both runs (5 rows):** level-02 math-gate x1100, level-02 door x1540, level-03 enemy x2400, level-04 math-gate x1800, level-04 enemy x2400. These must stay unreached post-fix (improving them is Phase 23 scope).
- **Stable core — always reached in both runs (8 rows):** level-01 answer-zone x300, level-01 math-gate x600, level-01 enemy x1000, level-02 math-gate x420, level-03 answer-zone x200, level-04 answer-zone x160, level-04 math-gate x320, level-04 door x900. These must stay triggered (resolved true, or null-by-design for the answer-zones) post-fix.
- **Timing-sensitive rows (3): level-01 math-gate x1300, level-01 door x1400, level-03 math-gate x420.** Reached-vs-unreached flips on these rows between identical-code runs. Plan 22-05's post-fix regression diff MUST NOT treat a flip on these 3 rows alone as a regression (or as an improvement) — compare against the stable cores above; a timing-sensitive row counts as regressed only if it fails while triggered, or goes unreached across repeated post-fix runs when it was reached in repeated baseline runs.
- The audit-nondeterminism itself is harness behavior (traversal model), not a game defect; harness improvements are Phase 23 scope (VALID-03 groundwork). Noted here as baseline ground truth only.

## Findings

Numbered findings appended by Plans 22-02..22-05 in 21-FINDINGS format: what broke / why (root cause) / fix or disposition / file; CONFIRMED/REFUTED verdicts for hypotheses; visual claims carry a screenshot path; dispositions updated in place with dated lines. Include "reviewed, nothing found" verdicts explicitly — clean must be distinguishable from not-checked.

*(No findings recorded yet.)*

## Per-Entity Verdict Table

Clusters: **A** = challenge seam + mechanics (4 mechanics + challenge.js + mathGate.js), **B** = scenes & shell, **C** = world/engine + data. Allowed final Verdict values (CONTEXT-locked): clean / fixed / escalated / deferred-to-phase-N.

| # | File | Cluster | Verdict | Finding refs | Notes |
|---|------|---------|---------|--------------|-------|
| 1 | src/mechanics/collect.js | A | pending | | |
| 2 | src/mechanics/door.js | A | pending | | |
| 3 | src/mechanics/enemy.js | A | pending | | |
| 4 | src/mechanics/gates.js | A | pending | | |
| 5 | src/ui/challenge.js | A | pending | | |
| 6 | src/ui/mathGate.js | A | pending | | |
| 7 | src/ui/hud.js | B | pending | | |
| 8 | src/scenes/game.js | B | pending | | |
| 9 | src/scenes/select.js | B | pending | | |
| 10 | src/scenes/title.js | B | pending | | |
| 11 | src/main.js | B | pending | | |
| 12 | src/index.html | B | pending | | |
| 13 | src/player.js | C | pending | | |
| 14 | src/camera.js | C | pending | | |
| 15 | src/parallax.js | C | pending | | |
| 16 | src/fx.js | C | pending | | |
| 17 | src/progress.js | C | pending | | |
| 18 | src/config.js | C | pending | | |
| 19 | src/levels/build.js | C | pending | | |
| 20 | src/levels/index.js | C | pending | | |
| 21 | src/levels/level-01.js | C | pending | | |
| 22 | src/levels/level-02.js | C | pending | | |
| 23 | src/levels/level-03.js | C | pending | | |
| 24 | src/levels/level-04.js | C | pending | | |

## Structural Defect Inventory (deferred-to-phase-24)

*(Placeholder — filled by Plan 22-04.)* Inventory ONLY: these entries are Phase 23's validator calibration targets (roadmap-locked sequencing — inventory here, calibrate the validator RED-first in Phase 23, fix in Phase 24). Fixing any of them in this phase would destroy Phase 23's RED-first proof. Candidate rows come from 22-RESEARCH.md's structural interval check (over-hole math-gate placements: exact arithmetic; platform-reachability flags: crude heuristic — label as "candidate").

## Escalation Candidates (FIX-02 batch)

Entry format — each candidate gets a numbered entry with: **Summary**, **Why-escalated** (which CONTEXT escalation criterion it trips), **Recommendation**, and a status line reading `Status: PENDING-DECISION`. After the Plan 22-05 batched decision round, each status line becomes `Decision: APPROVED — <date>` or `Decision: REJECTED — <date>` with rationale. Later plans append candidates 3+ as the review finds them. No escalated change is implemented before its APPROVED line exists.

### Candidate 1: Door/gate/enemy glyph clarity

**Summary:** The "X" / "?" / "!" glyphs on doors, gates, and enemies are not self-evident — live kid report from v4.1 UAT: "boxes with question marks and exclamation marks I'm not sure what they are" (recorded as a non-blocking observation in 21-FINDINGS).
**Why-escalated:** Any fix (on-touch hint text, a legend, glyph redesign) changes UX/visual identity — CONTEXT escalation criterion: "anything changing ... visual identity"; Phase 26 also owns visual-identity work.
**Recommendation:** Present options in the FIX-02 round (minimal on-touch hint using existing config tokens vs defer entirely to Phase 26's rebrand pass).
Status: PENDING-DECISION

### Candidate 2: Challenge same-time-open prevention

**Summary:** Two challenges can still be open concurrently (residual New Finding 4 tech debt, recorded in the v4.1 milestone audit); the shipped hide/restore compromise (commit f58f3fb) fixes the visual overlap but deliberately does not prevent concurrency.
**Why-escalated:** Prevention is a mechanic-semantics change — CONTEXT criterion: "anything changing game feel ... mechanic semantics". The f58f3fb commit message is itself the argument for leave-as-designed: refusing to open a second challenge would strand a frozen player — a soft-lock strictly worse than the visual-overlap bug it closed.
**Recommendation:** Leave as designed (reject prevention); keep the hide/restore compromise. Present for confirmation in the FIX-02 round.
Status: PENDING-DECISION

## Post-Fix Regression

*(Placeholder — filled by Plan 22-05.)* Baseline vs post-fix comparison: verbatim gate suite outputs + row-by-row 16-encounter audit diff against the canonical Run 1 table above, honoring the timing-sensitive-rows rule in the Baseline deviation note. Zero-regression definition: every currently-green assertion stays green; the stable-core reached rows stay triggered/resolved; the stable-core unreached rows stay unreached.
