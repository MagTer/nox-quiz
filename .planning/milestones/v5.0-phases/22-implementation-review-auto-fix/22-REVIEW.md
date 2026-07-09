---
phase: 22-implementation-review-auto-fix
reviewed: 2026-07-05T20:00:11Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - scripts/check-gate.sh
  - src/config.js
  - src/mechanics/collect.js
  - src/mechanics/door.js
  - src/mechanics/gates.js
  - src/parallax.js
  - src/ui/challenge.js
findings:
  critical: 0
  warning: 3
  info: 5
  total: 8
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-07-05T20:00:11Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Reviewed the seven files changed during Phase 22 (busy guards, re-entrancy hardening, NaN defaulting, config token lifts, SIGPIPE de-flake) with adversarial tracing of the challenge-seam interplay: concurrent-open scenarios (collect + door/gate/enemy in the same frame), the hide/restore snapshot in `challenge.js`, the `busy`-flag reset invariant in `door.js`/`gates.js`, the parallax coverage math, and the check-gate assertion pipelines under `set -euo pipefail`.

The headline fixes hold up. The `[ "$(... | grep -c ...)" -gt 0 ]` count form genuinely removes the SIGPIPE flake (command-substitution exit status is discarded inside `[` arguments, so a no-match `grep -c` cannot trip `errexit`). The `busy` guards in door/gates are correctly reset only in `onSuccess`, which is provably the challenge's sole close path today. The `instanceTag` scoping plus hide/restore in `challenge.js` survives the nastiest same-frame case I could construct (door handler and correct-pickup handler dispatching in one collision pass): the restore loop writes `hidden = false` to already-destroyed objects, which is a harmless property write in Kaplay. The parallax per-key defaulting and tile-count math both check out (coverage holds for all ratios < 1 across the camera clamp range).

No Critical findings. Three Warnings: a latent, multi-leg unvalidated data contract in `collect.js` whose worst leg is amplified by this phase's own new `active` re-entrancy guard (one malformed zone can permanently lock out every collect zone in a level), and two enforcement gaps in `check-gate.sh` — a false-GREEN vector on the positive assertions (block comments / string literals dodge `strip_comments`) and a bypassable negative timer assertion (`wait(` at column 0 is not matched). All three are latent on current content; they are exactly the "latent until Phase 25 content arrives" class this phase fixed elsewhere, so they belong on the same standard.

## Warnings

### WR-01: collect.js trusts the zone→slots→choices contract with no validation; the new `active` guard turns one malformed zone into a whole-level collect lockout

**File:** `src/mechanics/collect.js:75-93` (also `src/mechanics/collect.js:60`, `src/levels/build.js:269`)
**Issue:** The zone-entry handler assumes every `answer-zone` carries a well-formed `slots` array whose length equals `q.choices.length` (always 4 per `brain.js`) and whose indices all resolve to live pickups. `build.js:269` assigns `zoneObj.slots = z.slots` verbatim with no default and no validation. Three latent failure legs:

1. **Missing `slots`** — a level author omits `slots` on a zone: `zoneObj.slots.length` at line 75 throws `TypeError` inside the collision callback, *after* line 71 has already burned a `brain.nextQuestion()` and line 96 never runs. Every re-touch re-throws.
2. **`slots.length < q.choices.length`, or a slot index with no matching pickup (`if (!slotObj) continue;` at line 78 silently swallows it)** — the shuffled correct answer can land on a slot index that has no live pickup. The zone becomes unwinnable: `active` is set, its only reset is the correct-pickup path (line 125), and the new `if (active) return` re-entrancy guard at line 60 then blocks **every other collect zone in the level forever**. This phase's Finding-5 guard converts a single bad zone from "one broken zone" into "all collect content dead for the session."
3. **`slots.length > q.choices.length`** — extra slots get `slotObj.value = undefined`, `opacity = 1`, and a label rendering the literal string `"undefined"` (line 87: `text(String(slotObj.value))`) — visible garbage badges that are touch-inert.

All legs are unreachable on shipped content (levels 01/03/04 each carry exactly one zone with `slots: [0,1,2,3]` and 4 pickups; level 02 has none), but this is the same latent-contract class Phase 22 itself hardened in `parallax.js` (partial bounds → NaN) and in this very handler (Finding 5). The multi-zone Phase 25 content this guard exists for is precisely where these legs go live.
**Fix:** Validate once at zone entry, before consuming a brain question:
```js
player.onCollide("answer-zone", (zoneObj) => {
  if (cleared.has(zoneObj)) return;
  if (active) return;

  const slots = zoneObj.slots ?? [];
  const q = brain.nextQuestion();
  const shuffledChoices = shuffle([...q.choices]);
  const n = Math.min(slots.length, shuffledChoices.length);

  // Guarantee the correct answer lands on a LIVE pickup: collect the resolvable
  // slot objects first, bail (or clamp) if the answer cannot be placed.
  const slotObjs = [];
  for (let i = 0; i < n; i++) {
    const s = get("answer-pickup-slot").find((s) => s.slotIndex === slots[i]);
    if (s) slotObjs.push(s);
  }
  if (slotObjs.length === 0) return; // malformed zone: never open an unwinnable session
  if (slotObjs.length < shuffledChoices.length) {
    // force the answer into a live slot rather than trusting the shuffle
    const ai = shuffledChoices.indexOf(q.answer);
    if (ai >= slotObjs.length) [shuffledChoices[0], shuffledChoices[ai]] = [shuffledChoices[ai], shuffledChoices[0]];
  }
  // ... assign values/labels over slotObjs only ...
});
```

### WR-02: check-gate.sh strip_comments only strips `//` line comments — block comments and string literals create both false-GREEN and false-FAIL paths through every assertion

**File:** `scripts/check-gate.sh:57` (affects assertions at lines 66-133)
**Issue:** `strip_comments() { sed -E 's://.*$::' "$1"; }` handles only `//` comments, yet the header (lines 19-23) claims comment-stripping "closes this ambiguity" for positive assertions. Two remaining holes:

1. **False GREEN on positives:** a `/* export function openChallenge */` block comment (or a doc-comment mentioning `brain.nextQuestion`, `cancel()`, `fixed(`, or `openChallenge` in the thin-caller checks 9-13) satisfies the positive assertions with zero real code. Since this script *is* the automated test for the seam (no JS test framework), a satisfied-by-prose positive assertion is a silent loss of the contract it encodes.
2. **False GREEN on negatives via strings:** the sed pattern fires on `//` *anywhere* on a line, including inside string literals — a line like `foo("http://example"); setTimeout(cb)` is truncated at `://`, deleting the `setTimeout` before negative assertion 7 ever sees it.

(The inverse — a banned token inside a `/* */` comment causing a false FAIL — is at least fail-safe, but still a flake vector for the "green on HEAD" guarantee.)
**Fix:** Extend the stripper to remove single-line block comments too, and document the multiline limitation; string-literal protection needs a real parser, so at minimum note it:
```bash
# Strips // line comments AND single-line /* ... */ block comments. Multiline block
# comments and // inside string literals are NOT handled (documented limitation).
strip_comments() { sed -E 's:/\*[^*]*\*+([^/*][^*]*\*+)*/::g; s://.*$::' "$1"; }
```
Alternatively, tighten the positive assertions to anchor on code shape (e.g., `^export function openChallenge` after stripping) so prose matches are structurally impossible.

### WR-03: check-gate.sh negative timer assertion misses `wait(`/`loop(` at start of line — the GATE-05 no-timer contract is bypassable

**File:** `scripts/check-gate.sh:94`
**Issue:** The GATE-05 pattern uses `[^a-zA-Z]wait\(` and `[^a-zA-Z]loop\(`, which require a preceding character. A call at column 0 — e.g. a formatted chain like:
```js
wait(2).then(closeChallenge);
```
— begins the line with `wait(`, matches neither alternative, and sails through the no-time-pressure gate. Same gap for `loop(`. The exclusion of `await(` via `[^a-zA-Z]` is intentional and correct, but the anchor case was lost with it. Since this assertion is the *only* automated enforcement of GATE-05 (ADHD-safe, no time pressure — a core product requirement), a bypassable pattern is a real enforcement defect, not a style nit.
**Fix:**
```bash
if [ "$(strip_comments "$TARGET" | grep -Ec 'setTimeout|setInterval|countdown|timer|(^|[^a-zA-Z])wait\(|(^|[^a-zA-Z])loop\(')" -gt 0 ]; then
```

## Info

### IN-01: check-gate.sh header still declares "EXPECTED RED right now" for a file that has existed since Phase 15

**File:** `scripts/check-gate.sh:37-39`
**Issue:** The header block states "EXPECTED RED right now: src/ui/challenge.js does not exist yet (it lands in 15-02), and mathGate.js/door.js are not yet thin openChallenge callers." All of that landed phases ago; the suite is green on HEAD. A future reader debugging a genuine FAIL may dismiss it as the documented "expected red." The file was touched this phase (de-flake block, lines 25-35, was added directly above), so the stale block was in the edit path.
**Fix:** Delete lines 37-39 or rewrite as history: "HISTORICAL: this script was expected-red until 15-02/15-03 landed; it must be green on every commit since."

### IN-02: parallax.js header lists `destroyAll` as a referenced engine global, but it is never used

**File:** `src/parallax.js:7`
**Issue:** The comment "Engine globals (add, sprite, pos, z, width, destroyAll) are referenced ONLY inside function bodies" names `destroyAll`, which appears nowhere in the module (actual globals used: `add`, `sprite`, `pos`, `z`, `width`). Misleading for anyone auditing the a727c13 engine-global discipline.
**Fix:** Drop `destroyAll` from the list.

### IN-03: challenge.js creates a childless, componentless "root/parent" object each session — a no-op

**File:** `src/ui/challenge.js:137`
**Issue:** `add([fixed(), z(9999), "challenge", instanceTag]);` is described as the "Root/parent carrying the cleanup tag," but nothing is ever parented to it and it draws nothing — every overlay object independently carries both tags and is destroyed by `destroyAll(instanceTag)`. The object is pure overhead created and destroyed per session (it does not leak, since it carries `instanceTag`). It also inflates `get("challenge").length` by one per open session, which callers using that count as an "is any challenge open" probe should be aware of.
**Fix:** Delete the line, or actually parent the overlay objects to it so a single `destroy(root)` tears down the session.

### IN-04: challenge.js retains magic layout numbers after the IN-03 CONFIG.GATE lift

**File:** `src/ui/challenge.js:182,184,194,206,230,252,297`
**Issue:** The 22-05 Candidate 3 lift moved BOX_W/BOX_H/BOX_GAP to `CONFIG.GATE`, but the same overlay still hardcodes: label/answer text size `22` (lines 182, 252), vertical offsets `-82`/`-44`/`-60`/`+30` (lines 184, 194, 206, 230), and `shake(6)` (line 297). Inconsistent application of the constant-lift convention the phase itself just enforced — Phase 26 visual retuning will have to hunt these down in-file.
**Fix:** Lift to `CONFIG.GATE` (e.g., `LABEL_SIZE: 22`, `PROMPT_DY: 60`, `LABEL_DY: 82`, `ARITH_DY: 44`, `ROW_DY: 30`, `SHAKE: 6`) in the same byte-identical-values style as the BOX_* lift.

### IN-05: door.js and gates.js are near-verbatim duplicates

**File:** `src/mechanics/door.js:37-84`, `src/mechanics/gates.js:30-76`
**Issue:** `wireDoor` and `wireGates` differ only in the collide tag (`"door"` vs `"math-gate"`), the latch-set name, and comments — the guard logic, freeze/unfreeze sequence, destroy ordering, and `busy` invariant are byte-for-byte the same shape. The WR-03 busy-guard fix this phase had to be applied three times (enemy, door, gates); the next seam fix will too, and a missed copy is exactly how the door/gates/enemy trio drifted before.
**Fix:** Extract a shared `wireBarrier({ player, brain, tag })` in mechanics/ and have `wireDoor`/`wireGates` (and plausibly `wireEnemy`) delegate to it. Low urgency; flagged so the duplication is a recorded decision rather than an accident.

---

_Reviewed: 2026-07-05T20:00:11Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
