# Phase 22: Implementation Review & Auto-Fix - Pattern Map

**Mapped:** 2026-07-05
**Files analyzed:** 26 (24 runtime src/ files + 1 gate script + 1 new evidence artifact)
**Analogs found:** 26 / 26 (this is a review-and-fix phase — every "modified" file's best analog is a prior fix commit or an archived Phase 21 artifact)

## Nature of This Phase

Unlike a greenfield phase, the pattern question here is not "what does a controller look like"
but "**what does a good finding, a good atomic fix commit, and a good regression proof look like
in this repo**." The analogs are therefore:

1. `.planning/milestones/v4.1-phases/21-.../21-FINDINGS.md` — the template for the ONE new file (22-FINDINGS.md)
2. Four archived v4.1 fix commits — the templates for every auto-fix commit
3. `.planning/milestones/v4.1-phases/21-.../deferred-items.md` — the template for deferred/escalated dispositions AND the exact check-gate.sh fix

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.planning/phases/22-implementation-review-auto-fix/22-FINDINGS.md` (NEW) | evidence artifact (markdown) | append/update-in-place | `.planning/milestones/v4.1-phases/21-real-verification-pass-mechanics-sign-off-integrity-perform-/21-FINDINGS.md` | exact |
| `scripts/check-gate.sh` (Wave 0 fix) | test/gate script | batch (grep assertions) | its own diagnosis in `deferred-items.md` (fix spelled out verbatim) | exact |
| `src/mechanics/door.js`, `src/mechanics/gates.js` (busy-guard candidates) | mechanic wiring | event-driven (onCollide → challenge) | `src/mechanics/enemy.js` + commit `5d168dc` (WR-03 busy guard) | exact — same role, same data flow, sibling file |
| `src/mechanics/collect.js` (multi-zone hardening candidate) | mechanic wiring | event-driven | commits `2baacef` (pause-removal) + `f541f88` (handler-stacking fix) — its OWN fix history | exact |
| `src/ui/challenge.js` (residual coupling / magic-number review) | shared UI seam | request-response (open → answer → close) | commits `eab06ed` (instanceTag) + `f58f3fb` (hide/restore) | exact |
| `src/mechanics/enemy.js` (verify-only) | mechanic wiring | event-driven | commits `844cd08`/`bee0221` (21-04 label fix) — verify still present | exact |
| `src/ui/mathGate.js`, `src/ui/hud.js` | UI wiring | event-driven / one-way display | challenge.js callers + check-gate.sh thin-caller assertions | role-match |
| `src/scenes/game.js`, `title.js`, `select.js` | scene | event-driven + lifecycle | game.js's own onSceneLeave sweep pattern (lines 295, 307) | exact (self-referential) |
| `src/player.js`, `src/camera.js`, `src/parallax.js`, `src/fx.js` | engine glue | per-frame update | game.js tween-cancel sweep + camera per-key `??` defaulting | role-match |
| `src/config.js`, `src/progress.js`, `src/main.js`, `src/index.html` | config / persistence / boot | CRUD (localStorage) / boot | check-progress.sh + progress.js firewall header | role-match |
| `src/levels/*.js`, `src/levels/build.js` | pure data / builder | transform | RESEARCH.md interval-check snippet (inventory ONLY — no geometry edits) | exact |
| Throwaway evidence scripts (scratchpad, uncommitted) | dev tooling | request-response (Playwright) | 21-06 precedent + `scripts/lib/mechanic-drive.mjs` helpers | exact |

## Pattern Assignments

### 1. `22-FINDINGS.md` (evidence artifact) — copy 21-FINDINGS.md structure

**Analog:** `.planning/milestones/v4.1-phases/21-real-verification-pass-mechanics-sign-off-integrity-perform-/21-FINDINGS.md`

**Finding entry pattern** (21-FINDINGS.md, Findings 1–2): numbered finding, hypothesis stated, verdict in bold caps, evidence with screenshot paths or unambiguous source excerpts, honest caveats, dated in-place disposition updates:

```markdown
## Finding 2: enemy.js prompt-override — **CONFIRMED** (code-level; live screenshot not obtainable this run)

**Hypothesis:** ...
**Verdict: CONFIRMED.** Re-read directly from the current source this session:
```js
const display = prompt ?? `${q.a} × ${q.b}`;   // prompt, if present, wins outright
```
**Evidence caveat (documented honestly, per this phase's own purpose):** this interactive audit
could **not** capture a live screenshot of ... Finding 2's CONFIRMED verdict rests on the
direct, unambiguous source read above.

**2026-07-04 update (Plan 21-05, Task 2) — evidence gap CLOSED:** ...
```

**Verdict-language rules copied from the analog:** CONFIRMED / REFUTED for hypotheses; unconditional-semantics bugs may rest on source reads alone (`??` precedent); anything visual requires a screenshot path; unreached rows blamed on the script, never silently on the game.

**Baseline table pattern** (21-FINDINGS.md "Full Mechanic Sweep", line ~332): copy the exact column shape and the row-provenance note ("Sourced directly from this run's own printed JSON `results` array"):

```markdown
| Level | Mechanic | x | Triggered | Resolved |
|-------|----------|---|-----------|----------|
| level-01 | answer-zone | 300 | true | null (by design) |
| level-01 | math-gate | 600 | true | true |
| level-01 | math-gate | 1300 | false | false (unreached) |
```

**New sections 22-FINDINGS.md adds on top of the analog** (CONTEXT-required, no prior analog exists):
- Per-entity verdict table: all 24 files × verdict ∈ {clean, fixed, escalated, deferred-to-phase-N} — include "reviewed, nothing found" rows explicitly
- Structural defect inventory table (RESEARCH.md already contains the candidate rows; disposition column fixed at `deferred-to-phase-24`, heuristic flags labeled "candidate")
- Baseline vs post-fix regression table (gate outputs verbatim + the 16-row audit diff)

**Drift-control pattern:** one plan owns the file's skeleton; later plans append numbered findings and update dispositions in place with dated lines (Phase 21 style, per RESEARCH Pitfall 5).

---

### 2. `scripts/check-gate.sh` (Wave 0 de-flake) — copy the fix from deferred-items.md

**Analog:** `.planning/milestones/v4.1-phases/21-.../deferred-items.md` ("From Plan 21-07 (Task 2)") — the diagnosis AND fix are already written:

```bash
# Racy form (current, ~30% flake under set -euo pipefail):
strip_comments "$TARGET" | grep -q 'pattern'
# Fix — reads to EOF, no early-exit SIGPIPE to the upstream sed:
[ "$(strip_comments "$TARGET" | grep -c 'pattern')" -gt 0 ]
# (deferred-items.md also sanctions: grep -c 'pattern' > /dev/null)
```

**Commit style analog:** `32348f5 docs(21-07): log pre-existing check-gate.sh flakiness found during Task 2` — the fix commit should reference this diagnosis. Verify the fix by running the gate ~10× in a loop (the flake reproduced 1-in-6 on a clean tree).

---

### 3. `src/mechanics/door.js` / `src/mechanics/gates.js` (busy-guard, if confirmed) — copy commit `5d168dc` verbatim

**Analog:** `src/mechanics/enemy.js` lines 33–54 (the WR-03 guard, still present in HEAD):

```js
// WR-03: guard against onCollide re-firing for the SAME not-yet-defeated enemy (or a
// DIFFERENT enemy) while a challenge for this wiring is already open. Closure-local
// (never module-level) for the same GC-with-the-scene reason as `defeated` above.
let busy = false;

player.onCollide("enemy", (enemyObj) => {
  if (defeated.has(enemyObj) || busy) return; // belt-and-braces + re-entrancy guard
  busy = true;
  ...
  onSuccess() {
    defeated.add(enemyObj);
    busy = false;
```

**Pattern rules embedded in the analog:** guard is closure-local (a727c13 rule — never module-level), set before any state mutation, reset ONLY in `onSuccess` (the sole close path — note in findings if any other close path exists in door/gates), comment cites the finding ID and the GC rationale. If the review concludes the guard is unneeded (paused-player collision-skip covers it), the analog disposition is a documented "why unneeded" comment instead — either outcome must be recorded per the checklist.

---

### 4. `src/mechanics/collect.js` (multi-zone hardening candidate) — copy its own fix-commit style

**Analog commits (best examples of atomic fix commits in this repo):**

**`2baacef` — the pause-removal fix.** Commit-message pattern: symptom, root cause with engine-semantics citation, per-file numbered explanation:

```
fix: collect-the-answer soft-lock + invisible pickup numbers

Two more critical bugs found via headless playtest of the full level-01
mechanic gauntlet (collect-zone, math-gate x2, enemy, door, goal):

1. src/mechanics/collect.js set player.paused = true on zone entry,
   copying the freeze pattern from door.js/gates.js/enemy.js. But
   collect-the-answer's ONLY resolution path is walking into the correct
   pickup — and Kaplay's collision spatial-hash explicitly skips paused
   objects as both self and partner (confirmed via direct engine-source
   inspection during Phase 15 research), so a paused player can neither...
```

**`f541f88` — the handler-stacking fix.** Pattern for the multi-zone `active`-slot class: single top-level handler + guard-on-state, never handler-inside-handler ("Kaplay's onCollide fires once per touch-SESSION... confirmed from the vendored engine source"). If the multi-zone fix is done, it follows this shape: keep ONE `onCollide` registration, extend the guard from `!active || slotObj.value === undefined` to also check slot-belongs-to-active-zone. If deferred instead, disposition line `deferred-to-phase-25` in the verdict table (planner's call per CONTEXT).

---

### 5. `src/ui/challenge.js` (review the residual coupling; do NOT "finish" it) — analogs `eab06ed` + `f58f3fb`

**Analog A — `eab06ed` (per-instance tag, state half):** current source line 133:

```js
const instanceTag = `challenge-${Math.random().toString(36).slice(2)}`;
```

**Analog B — `f58f3fb` (hide/restore, visual half):** current source lines 116–118 and 316–325:

```js
const priorChallengeObjs = get("challenge");
if (priorChallengeObjs.length > 0) {
  for (const o of priorChallengeObjs) o.hidden = true;
}
...
function close() {
  keyCtrls.forEach((c) => c.cancel());
  destroyAll(instanceTag); // tag-based bulk removal scoped to THIS session only
  for (const o of priorChallengeObjs) o.hidden = false;
}
```

**Key pattern from the f58f3fb commit message (copy this reasoning style into 22-FINDINGS):** the fix deliberately does NOT refuse a second open ("that would strand a frozen player... a soft-lock strictly worse than the visual-overlap bug this closes"). Same-time-open *prevention* is escalation item 2 — the analog's own commit message is the argument for "leave as designed."

**⚠ Review target from RESEARCH:** `close()` writes `.hidden = false` to snapshot objects that could theoretically be destroyed in the interim — verify on the Escape→`go("select")` path. If real, the fix pattern is a liveness check (`o.exists()` guard), same defect class as checklist #11.

**Magic numbers (BOX_W 84, BOX_H 44, GAP 16):** extraction creates NEW config tokens → escalation item 4, not auto-fix. If approved, analog is `844cd08`'s `LABEL_FG` move (constant lifted with a convention-citing comment) and `CONFIG.GATE.*` naming in `src/config.js`.

---

### 6. Small polish / color-consistency fixes — analog `844cd08` + `bee0221`

**Analog:** `844cd08 fix(21-04): enemy.js arithmetic-display bug + defensive color() consistency` — the template for "existing-token-only" polish:

```js
// src/levels/build.js (as fixed in 844cd08)
const LABEL_FG = [0xe8, 0xe8, 0xe8];  // matches select.js convention; plain data literal, safe at top level
...
text("X", { size: CONFIG.DOOR.GLYPH_SIZE }),
anchor("center"),
pos(d.x + CONFIG.DOOR.W / 2, d.y + CONFIG.DOOR.H / 2),
color(LABEL_FG[0], LABEL_FG[1], LABEL_FG[2]),
```

Note the commit-message discipline: it distinguishes the real fix (label vs prompt) from the defensive cleanup (Finding 1 was REFUTED but the convention is applied anyway) and states what was deliberately left unchanged and why ("collect.js left unchanged: Finding 3... REFUTED, so no dim param... applied per this plan's conditional gating").

---

### 7. Throwaway behavioral-evidence scripts — analog: 21-06 precedent + mechanic-drive.mjs

**Analog:** 21-FINDINGS.md Plan 21-06 evidence pattern (uncommitted scratchpad Playwright script, page-handle state inspection):

```js
const open = await page.evaluate(() => get("challenge").length);
const hidden = await page.evaluate(() => get("challenge").filter(o => o.hidden).length);
// assert counts before/after resolving, screenshot both states
```

**Rules:** reuse `deriveEncounters` / `driveToXClimbing` / `resolveIfBoxed` from `scripts/lib/mechanic-drive.mjs` (never re-derive traversal); copy the server skeleton from `scripts/browser-boot.mjs` WITHOUT weakening the CR-02 hardening (loopback bind + path-separator-boundary clamp, commit `bf1e2b9`); ports 8765/8768 taken by committed scripts, 8766/8767 by screenshot scripts — pick others.

## Shared Patterns

### Atomic fix commit format
**Source:** commits `5d168dc`, `2baacef`, `844cd08`, `f58f3fb`, `eab06ed`
**Apply to:** every fix in this phase.
- Subject: `fix(22-NN): <specific behavior>` (plan-scoped) or `fix: <symptom>` — one fix per commit, docs commits separate (`docs(22-NN): ...`)
- Body: symptom → root cause (with engine-semantics or finding-ID citation) → what the fix does → what it deliberately does NOT do and why
- In-code comments cite the finding ID and the rule they satisfy (e.g. "WR-03:", "21-06 fix —", "a727c13 rule")

### Closure-local state, never module-level
**Source:** `src/mechanics/enemy.js` lines 31–37 (`defeated` Set + `busy` flag comments)
**Apply to:** any new state introduced by a fix — closure-local inside the wire function so it GCs with the scene; no Kaplay globals at module top level (check-import-safety.sh enforces).

### Global-controller cancel on scene leave
**Source:** `src/scenes/game.js` lines 295 and 307 (two `onSceneLeave` registrations: `hideCtrl.cancel()` + the tween/controller sweep)
**Apply to:** any fix adding a controller or tween — either self-clean via `tween().onEnd(destroy)` (fx.js pattern) or add to the game.js sweep. Review task: confirm both existing sweeps fire and cover everything.

### Per-fix regression cadence
**Source:** RESEARCH.md Validation Architecture (Phase 21's standard)
**Apply to:** every commit. Per fix: `node --check` on touched files + 4 static gates (~5s). Per cluster: + `node scripts/browser-boot.mjs`. Phase end: + `node scripts/audit-phase21-mechanics.mjs` diffed row-by-row vs the recorded baseline (audit always exits 0; compare rows, not exit code; the same 6 unreached rows must stay unreached).

### No-timer / forgiving envelope
**Source:** `scripts/check-safety.sh` (bans setTimeout/setInterval/wait/loop and punishment constructs in src/)
**Apply to:** all fixes — timing needs use the `tween().onEnd` self-clean idiom (fx.js).

## No Analog Found

None. Every surface in this phase has either its own fix history, a sibling with the exact pattern, or an archived Phase 21 artifact as template. The only genuinely new structures are the three extra tables in 22-FINDINGS.md (per-entity verdict, structural inventory, baseline-vs-post-fix), whose column shapes are specified in CONTEXT.md/RESEARCH.md directly.

## Metadata

**Analog search scope:** `src/` (all 24 runtime files' line-level state confirmed at HEAD), `scripts/`, git history (v4.1 fix-commit series), `.planning/milestones/v4.1-phases/21-*/` archive
**Key commits extracted:** eab06ed, f58f3fb, 5d168dc, 844cd08, 2baacef, f541f88, 32348f5, bf1e2b9
**Pattern extraction date:** 2026-07-05
