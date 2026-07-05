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

### Finding 1: challenge.js close() dead-object write hazard — **REFUTED as a defect** (behavioral, tier 3)

**File:** `src/ui/challenge.js` (close() restore loop, lines ~316–326)
**Hypothesis (22-RESEARCH ⚠):** close() un-hides the `priorChallengeObjs` snapshot taken at open; if a hidden prior object is destroyed in the interim, the `o.hidden = false` write hits a dead object — potential crash / bug-pattern #11 class.
**Verdict: REFUTED.** Two-part evidence, throwaway Playwright script (scratchpad `evidence-22-02-challenge-close.mjs`, port 8770, CR-02 server skeleton copied verbatim; 2026-07-05):

1. **The write is benign even when forced.** Stacked two challenges on level-01 (collect zone x300 open, then math-gate x600 on top — prior 3 objects correctly hidden: page-evaluated `{total:15, hidden:3}` while stacked, screenshot `22-02-A1-stacked.png`). Then destroyed ONE hidden prior object via page handle (the exact interim-destruction the hypothesis fears), resolved the outer gate with keys 1-4: **zero uncaught page errors**; the two surviving prior objects restored un-hidden (`{total:2, hidden:0, allExist:true}`, screenshot `22-02-A2-restored.png`). Root cause of benignity (engine source, `lib/kaplay.mjs` make()): `hidden` is a plain data property on the GameObj; `destroy()` only detaches the object from the scene tree — a later `o.hidden = false` on the orphan is a no-op property write, not a method call into freed engine state. No liveness guard needed; adding one would be speculative hardening against a non-defect.
2. **The interim-destruction is not reachable by gameplay today.** The only prior challenge that can exist under a stacked one is collect.js's zone session (door/gates/enemy all freeze the player, so max stack depth is 2 — challenge.js's own interfaces note). While the outer challenge has the player frozen, the collect session cannot resolve (paused player is skipped in Kaplay's collision pass in both roles — see Finding 4 source extract), so its objects cannot be destroyed mid-stack. The scene-exit path (Escape → go("select")) destroys ALL scene objects without ever calling close() — verified behaviorally: challenge-tagged count is 0 in the select scene with zero uncaught errors (screenshot `22-02-B-select.png`).

**Disposition:** no fix. Invariant recorded: close()'s restore loop is safe both because the write is benign and because gameplay cannot destroy a hidden prior object while a stacked challenge is open.

**Empirical side-note (feeds Escalation Candidate 2):** run 1 of the evidence script proved the two-challenge stack is NOT reachable by pure rightward movement on level-01 — the player walks through the pickup cluster (x270–330) en route to the gate and auto-resolves the collect session before reaching x600 (observed: gate opened with `total:12` = the gate's own object count, prior objects already gone, zero errors). The stack needed a teleport-adjacent hop (21-04 precedent) past the pickups to reproduce at all. Concurrency is real but even harder to hit in practice than the tech-debt entry assumed.

### Finding 2: mathGate.js gate-cleared banner teardown on scene exit — **CONFIRMED SAFE** (source tier)

**File:** `src/ui/mathGate.js` (banner add), `src/scenes/game.js` (teardown)
**Hypothesis:** the "LEVEL CLEAR" banner objects (tagged `gate-cleared`, deliberately NOT `challenge`-tagged so they survive close()) rely on the imminent go("select") for teardown; an Escape during the celebration window could leak them or double-fire the transition.
**Verdict: CONFIRMED SAFE — unconditional semantics, source read sufficient (Finding 2 precedent, 21-FINDINGS):**
- Banner objects are plain scene children (bare `add([...])` in mathGate.js onSuccess) — destroyed by ANY scene leave, whether the deferred tween's own go("select") or a player Escape.
- The deferred transition (`clearTransitionTween`, game.js:240–244) is cancelled in the second onSceneLeave sweep (game.js:311) — an Escape during the CONFIG.FX.BURST_MS celebration window cancels the in-flight tween, so a dead scene can never fire a second go("select") (the exact bug-pattern #6 class this sweep was built for).
**Disposition:** clean, no fix.

### Finding 3: enemy.js WR-03 busy guard + 21-04 two-line label fix — **both present at HEAD** (source + baseline audit row)

**File:** `src/mechanics/enemy.js`
**Verified at HEAD (source read this session):** the WR-03 closure-local `busy` re-entrancy guard is present (lines 34–40: declared next to `defeated`, checked at handler entry, set before mutation) and reset ONLY in onSuccess (line 54). The 21-04 fix is present: `label: "Answer to defeat the guard:"` (line 49) prefixes the arithmetic on its own line rather than replacing it.
**Behavioral confirmation:** the Plan 22-01 baseline audit row for level-01 enemy x1000 shows triggered:true / resolved:true (stable-core always-reached row).
**Invariant note for future close paths:** `busy` is reset ONLY in onSuccess — currently correct because a correct answer is the challenge's sole close path (challenge.js keeps the overlay open on wrong answers; there is no cancel/timeout path by ADHD-safe design). If any future phase adds another close path (e.g. an escape-from-challenge affordance), door/gates/enemy `busy` flags must gain a matching reset or the mechanic soft-locks into permanent ignore. Recorded here so the invariant is findable.
**Disposition:** clean, no fix.

### Finding 4: door.js/gates.js missing WR-03 busy guard — same-frame double-fire IS possible at engine level — **CONFIRMED** (source tier; resolves 22-RESEARCH Open Question 1)

**Files:** `src/mechanics/door.js`, `src/mechanics/gates.js`
**Hypothesis (22-RESEARCH ⚠ / Open Question 1):** both files rely on `player.paused = true` alone (no `busy` guard, unlike enemy.js post-WR-03); is a second barrier collision possible in the same frame before `paused` takes effect?
**Verdict: CONFIRMED — the double-fire is reachable at engine-semantics level.** Direct read of the vendored engine's collision pass (`lib/kaplay.mjs`, function `yn()` — minified, extracted this session):

```js
// pair loop inside the single incremental grid traversal (de-minified names in []):
if(Q.c("area")&&!Q.paused){            // [traversed object's paused: checked ONCE, before its pair loop]
  ...
  for(let Ie of zt){                   // [grid-resident partners]
    if(Ie.paused||!Ie.exists()||wn.has(Ie.id))continue;  // [partner's paused: re-checked per pair]
    ...
    ve.trigger("collideUpdate",Ie,Je); // [dispatches SYNCHRONOUSLY — area comp fires "collide" inline:
    Ie.trigger("collideUpdate",ve,Cn); //  e[o.id]||this.trigger("collide",o,s) — so onCollide handlers
  }                                    //  run mid-pass, per pair, same frame]
```

Three facts combine into the defect window:
1. onCollide handlers run **synchronously per pair inside the pass** (area component translates collideUpdate → "collide" inline; verified in the same source).
2. The traversed object's own `paused` flag is checked **once** before its pair loop; only the **partner's** flag (`Ie.paused`) is re-checked per pair.
3. game.js adds the player (line 123) **after** buildLevel's barrier entities (line 113), so the player is the **later-traversed** object — the player is `ve`/Q, the barriers are the grid-resident `Ie`s. When the first barrier pair's handler sets `player.paused = true` mid-loop, the loop does NOT re-consult `ve.paused` — a second overlapping barrier pair still dispatches in the same frame, stacking a second openChallenge over a frozen player.
   (Setting `GameObj.paused` also does not pause `on()`-registered handlers: the paused propagation list `s` in make() contains only the app-level input forwarders — onKeyPress et al. — not `on("collide")` controllers.)

**Why it has never fired:** no two barriers in the shipped 4 levels sit within player-width of each other, so no frame ever contains two simultaneous barrier pairs. Latent, exactly like WR-03's original enemy case — and content doubles in Phases 24–25.
**Fix (auto-fix, re-entrancy/leak class per CONTEXT):** copy the enemy.js WR-03 guard shape verbatim into both files — closure-local `busy` flag, checked at handler entry, set before the `player.paused` mutation, reset only in onSuccess, comment citing WR-03 / commit 5d168dc and this finding. Zero-behavior-change on current levels (the guard can never trip today) — proven by the Task 3 audit row diff.
**Disposition (2026-07-05):** FIXED — commit `c9953a4` (`fix(22-02): add WR-03 busy re-entrancy guard to door.js and gates.js`).

### Finding 5: collect.js multi-zone active-slot corruption — **CONFIRMED (latent)** — zero-behavior-change hardening landed (source tier)

**File:** `src/mechanics/collect.js`
**Hypothesis (22-RESEARCH ⚠):** the single `active` slot is overwritten when a second answer-zone is entered while the first is open; the pickup guard checks only `!active || slotObj.value === undefined`, not that the touched pickup belongs to the active zone; an overwritten slot's labelObj reference leaks stacked labels on re-trigger.
**Verdict: CONFIRMED from source (unconditional semantics — all three legs):**
1. **Slot overwrite:** the zone handler's early-return guard (line 51) is `active && active.zoneObj === zoneObj` — a DIFFERENT zone falls through and `active = {…}` (line 94) silently overwrites the first zone's session: its challenge handle and `q` are orphaned (the first zone's overlay is left open forever with no reference able to close it).
2. **Cross-zone pickup resolution:** the pickup handler (line 100) accepts ANY pickup with a defined `value` — zone A's pickups resolve against zone B's question; `cleared.add(zoneObj)` then marks the WRONG zone cleared while destroyPickups() tears down only zone B's pickups.
3. **Label leak:** re-entering the orphaned first zone after its slot was overwritten re-runs the spawn loop; `slotObj.labelObj = add([...])` overwrites the reference to the still-live first label — the old label object leaks on screen and is never destroyed (destroyPickups only destroys the CURRENT labelObj reference).
**Unreachable today:** L1/L3/L4 have exactly one answer-zone each, L2 has zero (`src/levels/*.js`, read-only verified) — no second zone exists to trigger any leg. Latent until Phase 25's multi-zone content.
**Fix (auto-fix, handler-scoping/leak class per CONTEXT; f541f88 single-handler rule + a727c13 closure-local rule preserved):**
- Zone-entry re-entrancy guard: while a slot is active, entry into a DIFFERENT zone returns early (same idiom class as WR-03 — every other mechanic ignores new triggers while its challenge is open; this makes collect.js consistent rather than changing any reachable behavior).
- Pickup-ownership guard: the pickup handler additionally requires `zoneObj.slots.includes(slotObj.slotIndex)` — the touched pickup must belong to the active zone.
- Still exactly ONE top-level onCollide per event; no new module-level state; no new exports.
**Zero-behavior-change proof:** with at most one zone per level, `active` is only ever set from that zone, so the new zone guard can never trip; every spawned pickup belongs to the only active zone, so the ownership guard can never trip. Behaviorally inert on all 4 shipped levels — confirmed by the Task 3 audit row diff (collect rows stay triggered:true / resolved:null-by-design).
**Disposition (2026-07-05):** FIXED — commit `51d2653` (`fix(22-02): collect.js multi-zone active-slot corruption hardening`).

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
**Evidence added 2026-07-05 (Plan 22-02, Finding 1):** the behavioral probe confirmed both that the hide/restore compromise works exactly as designed (prior objects hidden while stacked — `{total:15, hidden:3}` — and restored un-hidden after the outer challenge resolves, zero uncaught errors) AND that the stack is not even reachable by natural rightward movement on level-01 (the player auto-resolves the collect session by walking through its pickups before reaching the gate; reproducing the stack required a teleport-adjacent hop past the pickup cluster). The f58f3fb commit-message reasoning stands: refusing a second open would strand a frozen player — a soft-lock strictly worse than a visual-overlap bug that is already fixed and hard to even reach.
Status: PENDING-DECISION

### Candidate 3: challenge.js answer-box layout magic numbers (BOX_W 84, BOX_H 44, GAP 16)

**Summary:** The answer-box grid's layout constants are inline literals in `src/ui/challenge.js` (~lines 221–223), unlike the sibling `CONFIG.GATE.*` tokens (PANEL_W/PANEL_H/DIM_OPACITY) that the same function already consumes — flagged IN-03 in 21-REVIEW, never fixed.
**Why-escalated:** Extraction creates NEW config tokens; the CONTEXT polish rule permits auto-fix polish "ONLY with existing config tokens." 22-RESEARCH Open Question 2 notes the rule's intent targets new visual *systems* and the extraction is cheap and zero-behavior-change — but by the locked "when genuinely ambiguous, escalate" rule this goes to the FIX-02 round, not auto-fix.
**Recommendation:** Approve the extraction (three `CONFIG.GATE.BOX_W/BOX_H/BOX_GAP` tokens, values byte-identical, `844cd08` convention-citing comment style) — zero behavior change, closes IN-03, and Phase 25's difficulty/content work touches this UI anyway. Implement only after an APPROVED line exists (Plan 22-05 batch).
Status: PENDING-DECISION

## Post-Fix Regression

*(Placeholder — filled by Plan 22-05.)* Baseline vs post-fix comparison: verbatim gate suite outputs + row-by-row 16-encounter audit diff against the canonical Run 1 table above, honoring the timing-sensitive-rows rule in the Baseline deviation note. Zero-regression definition: every currently-green assertion stays green; the stable-core reached rows stay triggered/resolved; the stable-core unreached rows stay unreached.
