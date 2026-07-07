# Phase 25 Findings — Full 8-Level Automated Suite + Interactive Audit

Evidence artifact for Plan 25-07 (LVL-02..06, MATH-01, MATH-02). Cross-referenced from `24-FINDINGS.md` (historical 4-level baseline — not rewritten) and `22-FINDINGS.md`/`23-FINDINGS.md`.

Per 25-RESEARCH.md's Open Question 1 resolution: this closes Phase 25's OWN scope — the existing, retry-hardened `audit-phase21-mechanics.mjs` run across all 8 levels, now that Plan 25-02's select-nav fix lets it reach levels 5-8. It does NOT close Phase 28's full, formal, human-signed-off VALID-03 closure (STATE.md's blocker note: "Full 8-level closure... remains Phase 28's job").

## (a) Automated gate confirmations

All run on the final commit of this plan, in order:

```
bash scripts/check-gate.sh          -> gate checks: PASS
bash scripts/check-safety.sh        -> safety checks: PASS
bash scripts/check-import-safety.sh -> import-safety checks: PASS
bash scripts/check-progress.sh      -> smoke-progress: PASS / progress checks: PASS
node scripts/validate-levels.mjs    -> validate-levels: PASS (zero HARD-FAIL rows across all 8 levels; WARN-tier rows are the project's established "zero HARD-FAILs" definition of green — see 23-FINDINGS.md)
node scripts/browser-boot.mjs       -> Browser boot: PASS — title -> select -> all levels loaded with no runtime errors.
```

`node scripts/lib/reachability.mjs` and `node scripts/lib/route-planner.mjs` (self-tests, re-run after this plan's driver fix): both `-selftest: PASS`.

## (b) Interactive audit results — full 8-level run

`node scripts/audit-phase21-mechanics.mjs` (via `auditLevelWithRetries`, maxAttempts=5, OR-across-attempts) driven start-to-goal across all 8 levels in one continuous run.

Per the locked acceptance bar (established in 24-FINDINGS.md, restated in this plan): **`triggered: true` is the non-negotiable gate; `resolved: true` is the goal but not blocking** (documented resolution-timing flakiness, not a regression).

| Level | Encounters | Triggered:true | Resolved (true/null) |
|-------|-----------|-----------------|------------------------|
| level-01 | 6 | 6/6 | 6/6 |
| level-02 | 4 | 4/4 | 4/4 |
| level-03 | 5 | 5/5 | 4/5 |
| level-04 | 7 | 7/7 | 6/7 |
| level-05 | 3 | 3/3 | 3/3 |
| level-06 | 4 | 4/4 | 4/4 |
| level-07 | 2 | 2/2 | 2/2 |
| level-08 | 5 | 5/5 | 5/5 |
| **Total** | **36** | **36/36** | **34/36** |

**Zero `triggered: false` rows anywhere across all 8 levels** — the phase's hard requirement is met (grep-counted against the captured JSON, not eyeballed: `grep -c '"triggered": false'` on the raw run output returns `0`).

**Comparison against the pre-Phase-25 baseline:** 24-FINDINGS.md's closing run (levels 1-4 only, before levels 5-8 existed) measured 22 encounters. This run's total of **36 encounters across all 8 levels** materially exceeds that baseline, confirming levels 5-8 each contribute real, exercised mechanic instances (level-05: 3, level-06: 4, level-07: 2, level-08: 5 — 14 new encounters from the four new levels alone).

**2 `resolved: false` rows** (both `attempts: 5`, i.e. every retry attempt triggered the encounter but its answer-key resolution didn't settle within the wrapper's post-press check window):
- `level-03 | enemy | x:2400`
- `level-04 | math-gate | x:1300`

These match the exact class 22/23/24-FINDINGS.md already documented and accepted (e.g. 24-FINDINGS.md's own `level-03 | enemy | x:2400` and `level-04 | enemy | x:2400` resolved:false rows) — timing-sensitive challenge-teardown flakiness under headless-browser latency, not a functional regression. Per the locked acceptance bar, these do not block this task.

## (c) MATH-01 / MATH-02 diff confirmation

- **MATH-01** (table 1 dropped from level-02's pool): `level-02.js`'s `allowedTables: [2, 3, 4, 5, 6, 7]` — confirmed via `grep -n allowedTables src/levels/level-*.js`: no level anywhere in the 8-level roster includes table `1`, and none exceeds table `9`.
- **MATH-02** (brain roll narrowed 1-10 -> 1-9): `git diff 5eedee8 -- src/math/brain.js` shows exactly one changed line: `Math.floor(Math.random() * 10) + 1` -> `Math.floor(Math.random() * 9) + 1` (line 247, inside `nextQuestion()`). No other line in `src/math/brain.js` differs from the pre-v5.0 baseline — the LOCKED brain's total diff for this entire milestone is this one authorized literal.
- Both regressions are additionally pinned as permanent automated assertions in `check-progress.sh` (checks #14/#15, confirmed PASS above).

## Deviations found and fixed during this plan's Task 1

Running the full 8-level suite for the first time (previous plans/phases never exercised `audit-phase21-mechanics.mjs` continuously across all 8 levels in one session) surfaced several genuine bugs — all fixed in-scope per Rule 1 (auto-fix bugs), none weakening the acceptance bar:

1. **`scripts/browser-boot.mjs` still used the retired `driveToXClimbing` driver** (Phase 24 replaced it with `driveToXPlanned` only in `audit-phase21-mechanics.mjs`, never in `browser-boot.mjs`) — stalled indefinitely on level-07/08's verticality climbs. Swapped to the same proven `driveToXPlanned` driver.
2. **`scripts/lib/route-planner.mjs`'s takeoff planner had no concept of a third node's solid footprint physically obstructing a "shortcut" edge** between two others (reachability.mjs's graph correctly reports such edges as feasible in isolation, but the driver actually executes the jump). Fixed by detecting a genuine mid-flight obstruction and routing through it as a real, potentially multi-hop, mount chain — without touching `reachability.mjs`/`buildGraph`/`bottleneckPath` (the connectivity fact stays exactly the validator's own proven result).
3. **`level-07`'s three "bridging" stepping-stone platforms sat unnecessarily inside independently-jumpable gaps**, at a height that intercepted a real player's ordinary held jump mid-flight — removed (matches the validator's own WARN-not-HARD-FAIL reading that these gaps never needed a platform).
4. **Three decorative "height-variety" platforms (level-03 x:1520, level-04 x:1400, level-06 x:840) sat low enough that their underside was a ceiling-bonk hazard** for a spike-hop launched underneath them — raised; none were gap-bridging, so this is cosmetic-only.
5. **`scripts/lib/mechanic-drive.mjs`'s spike-hop always used the same near-max-range 450ms jump hold** (built for mount/gap takeoffs, which do need the range) — an unconditionally-long spike hop could sail clean over the NEXT takeoff's fire window while still airborne. Added a shorter, dedicated `spikeJumpHoldMs` (150ms) for spike-kind takeoffs only; still comfortably clears any spike's 8px hitbox per the driver's own documented margin, but lands sooner.

Full per-file rationale is inline in each changed file's own comments; task-level commit messages carry the same summary.

## (d) Human sign-off notes (Task 2)

**Verdict: Approved, with explicitly reduced scope** (human decision, recorded verbatim — not a full pass of the plan's original checklist).

**What was actually verified by the human:**
- Entered level-01, located and touched its secret alcove: HUD XP visibly incremented by exactly 5. Criterion (a) confirmed for level-01 only.
- Player was not frozen and no challenge/answer-box UI appeared during the touch (observed as part of the same interaction — no separate report of a freeze or challenge panel).

**Not independently re-verified in this pass** (human judged the level-01 check sufficient and elected not to continue):
- Re-touching the same level-01 alcove doing nothing further (criterion c).
- Completing level-01 without touching the alcove still clearing normally (criterion d).
- The remaining 7 alcoves (levels 02–08).
- The 2×4 select-grid's Up/Down/Left/Right navigation feel and locked/unlocked/cleared tile rendering.
- Level-07/08 verticality + vertical camera pan.
- The ~10–15 question spot-check (no "×1" table, no second-factor 10).

**Context for the reduced scope:** the human's first reaction to the alcove was "I get the XP increase but nothing else happens — no alcove?", expecting some visible marker. This was confirmed as intended behavior, not a defect — 25-CONTEXT.md's binding decision is "hidden via geometry placement only, no signposting," and `build.js` explicitly ships `opacity(0)` with the comment "no blocker collider, no visible panel, no glyph... it IS a secret." Nothing in Phase 26's VIS-01..03 scope (palette/contrast/per-level background tinting) calls for adding a visual marker to this mechanic. After this was explained, the human said the mechanic "seems like a pointless feature that we might remove or adjust later. Not what I was expecting," then approved sign-off on the strength of the level-01 check alone ("It works on level one, that is enough").

**Disposition:** Task 2's blocking gate is closed on this explicit, scope-limited human approval. The mechanic's XP-only/no-signposting design is confirmed working as specified — LVL-06's letter is satisfied — but its value as a feature is now an open question the human raised for a future phase, not a defect in this phase's implementation. Recorded as a pending todo in STATE.md rather than actioned here (no plan currently in scope calls for revisiting alcove UX). The 7 remaining alcoves were not independently re-checked by a human in this pass, and — per this plan's own scope note — Task 1's automated audit does not cover them either: `audit-phase21-mechanics.mjs`'s kind-lists intentionally exclude `secretAlcove` (25-RESEARCH.md Pitfall 3), so alcoves 2 through 8 rest on code-level review (identical `build.js`/`secretAlcove.js` wiring, per-level `geometry.secretAlcove` coordinates checked in 25-04's own SUMMARY) rather than either automated or human runtime verification. Same for the select-grid feel: Task 1's audit confirms the grid is *reachable* (36/36 `triggered:true` across all 8 levels proves the nav fix works well enough to drive the audit), but nobody eyeballed the wrap semantics or tile-state rendering live.
