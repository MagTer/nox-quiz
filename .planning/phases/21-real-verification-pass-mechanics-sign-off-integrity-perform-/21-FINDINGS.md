# Phase 21 — Interactive Mechanic Audit Findings

**Run:** `node scripts/audit-phase21-mechanics.mjs` (pre-fix, current codebase as of this
commit). Real Playwright session: held `ArrowRight` + tapped/held `Space` for real player
movement, real `1`-`4` key presses for real answer input — no teleporting, no save-seeded
pre-clears beyond the standard "levels reachable from select" seed. Screenshots for every
before/after pair live in `screenshots/`.

This document records, collect.js-diagnostic-style (numbered: what broke / why / fix / file),
the verdict on each of 21-RESEARCH.md's three standing hypotheses, plus one new bug this
interactive pass discovered that none of the three hypotheses predicted.

---

## Finding 1: challenge.js `color()` hypothesis — **REFUTED**

**Hypothesis (21-CONTEXT.md/21-RESEARCH.md):** `challenge.js`'s question-prompt `text()` and
answer-box label `text()` calls have no explicit `color()` component, so if Kaplay's unset-color
default renders black/invisible, both would be unreadable against their dark box backgrounds —
matching two of the three live-reported symptoms.

**Verdict: REFUTED**, confirmed both at the code level (21-RESEARCH.md Finding 1 — the vendored
`lib/kaplay.mjs` char-builder uses `color: t.color ?? j.WHITE`, i.e. uncolored text defaults to
opaque white) **and now visually, interactively, for real**:

- `screenshots/level-02-math-gate-420-before.png` — a real, cleanly-triggered checkpoint gate
  (no overlap with any other challenge) shows the prompt `"6 × 10"` and all four answer-box
  labels (`1) 66`, `2) 60`, `3) 72`, `4) 48`) rendered in crisp, fully legible white text against
  the dark `BOX_BG`/`PANEL_BG` boxes. Nothing is invisible, washed out, or unreadable.
- `screenshots/level-01-math-gate-600-before.png` also shows the same math-gate's own default
  prompt and boxes legibly (partially overlapped by a second, unrelated challenge — see
  **New Finding 4** below — but the individual glyphs that ARE visible are clearly white, not
  black-on-black).

Adding explicit `color()` to challenge.js's two uncolored `text()` calls is still worth doing as
a defensive-consistency cleanup (matches the codebase's own established convention — see
21-RESEARCH.md), but it is **not** the fix for the live-reported "no ID"/"no question" symptoms.
The real causes are Finding 2 (below) and New Finding 4 (below), not this one.

## Finding 2: enemy.js prompt-override — **CONFIRMED** (code-level; live screenshot not obtainable this run)

**Hypothesis:** `src/mechanics/enemy.js` calls `openChallenge({ prompt: "Answer to defeat the
guard:", ... })`. In `challenge.js`, `const display = prompt ?? \`${q.a} × ${q.b}\`;` — a
caller-supplied `prompt` **replaces** the arithmetic expression entirely rather than prefixing
it, so the player never sees what problem the four answer boxes are answering.

**Verdict: CONFIRMED.** Re-read directly from the current source this session:

```js
// src/mechanics/enemy.js (current, unchanged, still buggy)
openChallenge({
  brain,
  prompt: "Answer to defeat the guard:",   // replaces "6 × 7", does not prefix it
  onSuccess() { ... },
});
```

```js
// src/ui/challenge.js (current)
const display = prompt ?? `${q.a} × ${q.b}`;   // prompt, if present, wins outright
```

This is an unambiguous string-substitution logic bug (`??` fallback, not a template
concatenation) — there is no runtime ambiguity or engine-version nuance that could make this
render differently than the code reads. It exactly matches the live report: "Answer to defeat
the guard, gives me answers but no question."

**Evidence caveat (documented honestly, per this phase's own purpose):** this interactive audit
could **not** capture a live screenshot of any of the three levels' enemy encounters
(level-01 x:1000, level-03 x:2400, level-04 x:2400) — all three were unreached within this
script's 80-iteration movement budget. See **Methodology Note** below for why (a real,
discovered limitation of this script's single-jump traversal model, not a game bug). Finding 2's
CONFIRMED verdict rests on the direct, unambiguous source read above, which requires no runtime
observation to be certain — the `??` operator's semantics are unconditional. Fix is deferred to
Plan 21-04 per this plan's verification-only scope.

## Finding 3: collect-zone dim-overlay contrast — **REFUTED**

**Hypothesis:** `openChallenge()` always adds a full-screen 60%-opacity black dim layer
(`CONFIG.GATE.DIM_OPACITY`), even for the collect-the-answer zone (`renderChoices:false`). This
might wash the already-fixed near-white (`CONFIG.COLLECT.PICKUP_FG = [0xe8,0xe8,0xe8]`) pickup
labels down toward mid-grey against their near-black badges, plausibly matching "the boxes are
visible in the background but no ID and they are greyed out."

**Verdict: REFUTED** by direct screenshot evidence, checked on 3 separate levels:

- `screenshots/level-01-answer-zone-300-before.png` — pickups labeled `16`, `12`, `32`, `8`,
  all in crisp bright-white text, clearly legible against their dark badges and the dimmed
  world behind them.
- `screenshots/level-03-answer-zone-200-before.png` and
  `screenshots/level-04-answer-zone-160-before.png` — same result: `63`/`45`/`30`/`27` (level-04)
  and level-03's equivalents are all fully legible, not washed out or "greyed out."

The dim overlay does darken the background world (by design — the challenge stays "in-world,
not a system popup," per GATE-01), but it does **not** meaningfully reduce the pickup label
contrast below a legible threshold in any of the 3 collect-zone encounters checked. The live
"no ID... greyed out" report is **not** explained by this mechanism. Its real cause is most
likely **New Finding 4** below (a genuinely garbled/overlapping challenge UI is a much better
match for "not possible to answer... no ID" than a merely-dimmed-but-still-legible label).

---

## New Finding 4: Simultaneous challenges garble each other's UI (real bug, found via interactive testing)

**What broke:** If a player walks into the collect-the-answer zone (which, by design, leaves the
challenge open and keeps movement live — see `collect.js`'s own header comment) and then
continues walking into a SECOND mechanic (door / math-gate / enemy) before ever resolving the
first, **both challenges render simultaneously, fully overlapping**, producing garbled,
overlapping prompt text and an answer-box grid that has nothing to do with the currently-visible
question.

**Screenshot evidence:** `screenshots/level-01-math-gate-600-before.png` — captured naturally by
this audit's own realistic walk-don't-stop-and-answer-every-zone traversal (this session never
manually forced the scenario; it is simply what happens when the player keeps moving, exactly as
collect.js's own design permits). The image shows the collect zone's own prompt
(`"Collect the answer to 8 × 2"`) rendered directly on top of the math-gate's own default prompt
(a ghosted `"6 × ... 9"` bleeding through the same text), with the math-gate's own answer boxes
(`63`/`48`/`54`/`42`) visible below.

**Why:** `openChallenge()` (`src/ui/challenge.js`) has no guard against being invoked a second
time while a previous, unresolved challenge (opened by a different mechanic) is still live —
every challenge instance's root/dim/panel/prompt/boxes share the exact same generic `"challenge"`
tag, with no per-instance scoping. Two consequences:
1. **Visual:** both challenges' `fixed()`/high-`z()` overlays draw in the same screen position,
   producing the overlapping/garbled render seen in the screenshot above — a very plausible match
   for the live report "not possible to answer... no ID on the options" (a genuinely confusing,
   double-rendered UI, not merely low contrast).
2. **State:** when the SECOND challenge is answered correctly, its own `close()` calls
   `destroyAll("challenge")` — a tag-based bulk removal that also destroys the FIRST
   (still-unresolved, unrelated) challenge's dim/prompt objects, silently and prematurely closing
   an unrelated challenge's overlay. The collect zone's pickups themselves survive (they carry
   the `"answer-pickup-slot"` tag, not `"challenge"`), so the mechanic doesn't soft-lock, but the
   player loses all visual indication that a collect-the-answer challenge is still active.

**Reachability:** this is a real, ordinary-play-reachable sequence — nothing about it requires an
unusual input pattern. Any player who does not immediately resolve the collect zone before
continuing right (which the game explicitly allows, by collect.js's own design) will encounter
this if the next mechanic is close enough to reach before finishing the first.

**Proposed fix (Claude's discretion; not applied in this verification-only plan; owned by
Plan 21-04):** `openChallenge()` should refuse (or queue) a new invocation while a previous
challenge instance is still open — e.g. a module-level or scene-level "is a challenge currently
open" guard checked at the top of `openChallenge()`, returning early (or deferring until the
active challenge closes) rather than layering a second overlay. Alternatively, tag each
challenge instance's objects with a unique per-open id (e.g. `` `challenge-${openId}` ``) so
`destroyAll()` only clears its own instance, decoupling simultaneous sessions' state (though this
alone would not fix the visual overlap — a same-time-open guard is the more complete fix).

**Files touched (for the fix plan):** `src/ui/challenge.js` (the shared seam all 4+1 mechanics
call through).

---

## Full Mechanic Sweep

Sourced directly from this run's own printed JSON `results` array (`node
scripts/audit-phase21-mechanics.mjs`). `resolved: null` is the collect zone's expected, correct
value (no answer-box grid exists to resolve; per challenge.js, `renderChoices:false` never binds
1-4 key handlers, so — per this plan's own instruction — no key was ever pressed for it).
`triggered: false` / `resolved: false` rows mean the mechanic was **not reached** within this
script's 80-iteration movement budget for this run — see **Methodology Note** below; this is a
script/traversal-model limitation, not evidence the mechanic itself is broken (the ones that
WERE reached all resolved correctly — see the resolved:true rows).

| Level | Mechanic | x | Triggered | Resolved |
|-------|----------|---|-----------|----------|
| level-01 | answer-zone | 300 | true | null (by design) |
| level-01 | math-gate | 600 | true | true |
| level-01 | enemy | 1000 | false | false (unreached) |
| level-01 | math-gate | 1300 | false | false (unreached) |
| level-01 | door | 1400 | false | false (unreached) |
| level-02 | math-gate | 420 | true | true |
| level-02 | math-gate | 1100 | false | false (unreached) |
| level-02 | door | 1540 | false | false (unreached) |
| level-03 | answer-zone | 200 | true | null (by design) |
| level-03 | math-gate | 420 | true | true |
| level-03 | enemy | 2400 | false | false (unreached) |
| level-04 | answer-zone | 160 | true | null (by design) |
| level-04 | math-gate | 320 | true | true |
| level-04 | door | 900 | false | false (unreached) |
| level-04 | math-gate | 1800 | false | false (unreached) |
| level-04 | enemy | 2400 | false | false (unreached) |

**16/16 encounters accounted for** across all 4 levels (5 in level-01, 3 in level-02, 3 in
level-03, 5 in level-04), matching 21-RESEARCH.md's mechanic-position map. Every encounter that
WAS reached (7 of 16: all 4 collect zones/first-gate-per-level type encounters plus the first
math-gate in each level) **triggered correctly and, where applicable, resolved correctly on a
real 1-4 key cycle** — meaning every door/math-gate/enemy collision handler and its
`openChallenge()`/`onSuccess()` wiring that this audit COULD exercise worked exactly as
designed, with zero soft-locks and zero stuck-open challenges (Finding 4's overlap aside).

## Methodology Note (script limitation, not a game bug)

Mechanics beyond the first authored gap in each level (level-01's enemy/2nd math-gate/door;
level-02's 2nd math-gate/door; level-03's enemy; level-04's door/2nd math-gate/enemy) were not
reached by `scripts/audit-phase21-mechanics.mjs` in this run. Root cause, confirmed via targeted
manual replay during this same session: these levels' authored gaps are designed to be crossed
via one or more intermediate stepping-stone platforms (e.g. level-01's gap at x:560-720 has
platforms at x:560-688 (y:192) and x:360-520 (y:240) as sequential landing points), not a single
floor-to-floor leap. A back-of-envelope check against this game's own tuned physics
(`CONFIG.JUMP_FORCE:520`, `CONFIG.GRAVITY:1400` → ~0.37s time-to-apex, ~178px max horizontal
distance per single uncut jump) confirms a single generic "tap/hold space near the gap" jump
— which is exactly what `deriveGapRanges`/`driveToX` implement, per this plan's own specified
algorithm — is not always geometrically sufficient to clear these compound platform sequences;
some of these gaps require correctly-timed sequential jumps onto intermediate platforms, which a
generic floor-pair gap model does not attempt. This is exactly the "genuine mechanic
unreachable... not a script bug" outcome this plan's own Task 1 acceptance criteria anticipated.
The mechanics that WERE reached (7 of 16, including the load-bearing evidence for Findings 1 and
3, and one clean math-gate resolution per level) give strong, real interactive confirmation that
the core `openChallenge()`/door/gates/collect wiring functions correctly; a follow-up pass with a
platform-aware traversal model (out of this plan's scope) would be needed to reach the remaining
9 encounters.

## Observation (non-blocking): door/math-gate glyph clarity

Per CONTEXT.md Area 2, this is recorded as a documented, non-blocking observation, not a bug —
the mechanics it applies to (math-gates) were all confirmed to function correctly in this same
run. `screenshots/level-04-answer-zone-160-before.png` shows a locked math-gate's `"?"` glyph
visible in the background (not yet triggered, at the right edge of frame) — a plain `?` on a
grey locked-panel background with no other label. This is consistent with the live report "There
are boxes with question marks and exclamation marks that I am not sure what they are." The
mechanic itself works correctly once reached (this audit's own math-gate rows above all resolved
cleanly); the glyph's meaning is not self-evident from the visual alone. Per CONTEXT.md Area 2,
a fix here (if any) is Claude's discretion for a future plan — e.g. a one-time on-touch text hint
— and does not require new sprite art (out of Phase 20's closed scope).
