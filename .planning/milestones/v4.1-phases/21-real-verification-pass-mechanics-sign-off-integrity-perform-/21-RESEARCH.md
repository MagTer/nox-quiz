# Phase 21: Real Verification Pass — Mechanics & Sign-off Integrity - Research

**Researched:** 2026-07-04
**Domain:** Interactive Playwright verification of Kaplay in-world mechanics; documentation/audit-trail integrity correction
**Confidence:** HIGH (all claims below are code-verified against the actual vendored engine and actual level/mechanic source in this repo — no external ecosystem research was needed; this phase is 100% internal-codebase investigation)

## Summary

This phase has two halves: (1) give `door.js`/`gates.js`/`enemy.js`/`mathGate.js` the same
real interactive scrutiny `collect.js` got, and (2) correct the verification-integrity paper
trail (`v4.0-MILESTONE-AUDIT.md`, the archived `v4.0-REQUIREMENTS.md` traceability table).

**The single most important research finding: the CONTEXT.md `color()` hypothesis, read
literally, is FALSIFIED by the vendored Kaplay engine source.** Reading `lib/kaplay.mjs`
directly shows that a Kaplay `text()` object with no `color()` component does **not** default
to invisible/black — it defaults to opaque **white** (`j.WHITE = new Color(255,255,255)`,
consumed via `t.color ?? j.WHITE` in the char-rendering path of `formatText`/`drawFormattedText`).
Every other `text()` call in this codebase (title.js, select.js, hud.js) explicitly sets
`color(...LABEL_FG)` where `LABEL_FG ≈ [0xe8,0xe8,0xe8]` — nearly identical in brightness to
the engine's own default white. So `challenge.js`'s two uncolored `text()` calls (question
prompt, answer-box label) render **white text**, which has strong contrast against the dark
`BOX_BG`/`PANEL_BG` ([30,30,30]/[20,20,20]) rects they sit on. **Adding `color()` there is
good defensive practice (never rely on an undocumented engine default) but it is very unlikely
to be the actual fix for the two live-reported bugs** — the interactive test this phase runs
must be designed to find the REAL root cause, not confirm a hypothesis that code-reading
already contradicts.

Two concrete, code-verified alternative explanations were found instead:

1. **`enemy.js`'s "answers but no question" bug is a confirmed, HIGH-confidence code defect**,
   unrelated to color. `enemy.js` calls `openChallenge({ prompt: "Answer to defeat the guard:", ... })`.
   In `challenge.js`, `const display = prompt ?? \`${q.a} × ${q.b}\`;` — a caller-supplied
   `prompt` **fully replaces** the arithmetic expression display, it does not prefix it. The
   player therefore never sees the actual math problem (e.g. "6 × 7") at the enemy encounter —
   only the literal string "Answer to defeat the guard:" plus four numeric answer boxes with
   zero indication of what problem they answer. This exactly matches the live report. `door.js`
   and `gates.js` never pass `prompt`, so they are unaffected (default `${q.a} × ${q.b}` shows).
2. **The "just after the first coin... no ID... greyed out" bug is very likely the
   collect-the-answer zone (MECH-03) at level-01 `x:300`** (100px after the first coin at
   `x:200`) — not a challenge.js answer-box grid at all (the collect mechanic runs with
   `renderChoices:false`, so no BOX_BG grid exists there). The zone trigger is a fully
   invisible `opacity(0)` rect, which explains the round-1 human report "I get a math
   question... without bumping into anything." The pickup badges already received an
   explicit-color fix in an earlier session (`2baacef`, predating Phase 20), so they are NOT
   the same bug the earlier collect.js diagnostic found — but the shared `challenge.js`
   overlay always renders a full-screen `GATE.DIM_OPACITY` (0.6) black dim layer at `z:9990`
   (`fixed()`, so it draws above the camera-space world including the pickups, which sit at
   implicit `z:0`), and this darkens the already-fixed near-white pickup labels down to a
   mid-grey against a near-black badge — plausibly reading as "greyed out... no ID" even
   though a label technically exists. **This is a hypothesis requiring an interactive
   screenshot of the level-01 collect zone to confirm — do not fix blind.**

**Primary recommendation:** Build one new Playwright script that (a) screenshots the level-01
collect zone (x:300) immediately on trigger to test hypothesis 2, (b) screenshots the enemy
encounter (x:1000) to confirm hypothesis 1 visually, (c) walks and triggers every other
door/gate/enemy in all 4 levels for a full interactive audit, record findings collect.js-style
(numbered, root cause, fix, file), fix confirmed bugs, then harden `browser-boot.mjs` to
replay a subset of this real movement+resolution instead of pre-clearing everything.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Mechanic collision + freeze/resume (door/gates/enemy) | Browser/Client (Kaplay scene, `src/mechanics/*.js`) | — | Pure client-side canvas game; no server exists |
| Challenge overlay render + input (`challenge.js`) | Browser/Client (Kaplay canvas draws) | — | In-world overlay, no DOM/browser-modal path (GATE-01) |
| Interactive verification (new audit script) | Tooling/Build (Node + Playwright, headless Chromium) | Browser/Client (drives the same client code under test) | Verification harness lives outside the shipped app; it drives the real client |
| Automated boot gate (`browser-boot.mjs`) | Tooling/Build | Browser/Client | Same as above — hardening this script changes ONLY the verification tooling, never `src/` |
| Documentation/audit-trail integrity (VERIFY-04) | Process/Docs | — | `v4.0-MILESTONE-AUDIT.md` + archived `v4.0-REQUIREMENTS.md` are pure documentation; no code tier owns them |

No tier-misassignment risk here — this phase does not touch backend/API/CDN tiers (none exist
in this project); the only real risk is conflating "verification tooling" changes with "game
code" changes, which the plan should keep in clearly separate tasks/commits.

## User Constraints (from CONTEXT.md)

<user_constraints>

### Locked Decisions

**Area 1 — Interactive Verification Methodology:** Real interactive Playwright playtest (real
keyboard movement + real answer-key input, not teleport-only) across all 4 levels, driving
`door.js`/`gates.js`/`enemy.js`/`mathGate.js` to actual trigger + resolution, mirroring the
rigor of the collect.js post-ship diagnostic. Findings recorded in the same style as STATE.md's
collect.js bug list: numbered, each with what broke, why, the fix, and the file touched. Verify
the challenge.js color() hypothesis FIRST via a real screenshot of a real triggered gate —
before assuming it's the fix, confirm the visual symptom reproduces, then after fixing, confirm
the fix visually too.

**Area 2 — Scope of "Doors are question marks, monsters are exclamation marks":** A separate,
real finding (glyph sprites read as unclear to a player), in scope for interactive audit but
the FIX is Claude's discretion — could be a copy/label addition, a recolor, or documenting as a
lower-priority known-limitation if fixing requires new art (out of Phase 20's closed scope).
Bugs (broken interaction) get fixed; a purely-aesthetic "could look nicer" note does not
require new art assets.

**Area 3 — Automated Boot Gate Hardening (VERIFY-03):** Harden `scripts/browser-boot.mjs` to
actually exercise real movement (keyboard input) and at least one full mechanic resolution
(trigger + correctly answer a gate) per level — not just teleporting/pre-clearing. This
directly closes the exact gap that let the v4.0 soft-lock ship as "passed."

**Area 4 — Milestone Audit / Traceability Correction (VERIFY-04):** Correct
`v4.0-MILESTONE-AUDIT.md`'s Phase 14 row — contradicts `14-VERIFICATION.md`'s own record that
NAV-04's mandatory `checkpoint:human-verify` was PENDING/never executed. Correct Phase 15's row
similarly IF its own VERIFICATION.md shows the same gap. Resolve the NAV-04 traceability
inconsistency (REQUIREMENTS.md checkbox showed `[x]` while its own Traceability table showed
"In Progress") by annotating the audit with what verification actually happened, not by
retroactively rewriting history — the goal is an honest record.

### Claude's Discretion

Exact recording format for interactive-audit findings (as long as it mirrors the collect.js
precedent's rigor), exact hardened-boot-gate implementation detail, exact wording of the audit
corrections, and how (if at all) to address the "?"/"!" glyph clarity finding.

### Deferred Ideas (OUT OF SCOPE)

Any new gameplay mechanics, level content, or difficulty changes. Further art/asset changes
beyond what's needed to make a legitimate `?`/`!` glyph clarity fix (if any) — a full re-art of
door/enemy sprites (if warranted) is a future milestone's decision, not this phase's.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VERIFY-01 | `door.js`, `gates.js`, `enemy.js`, `mathGate.js` driven interactively (real movement + real answer input) across all 4 levels, findings recorded collect.js-style | Complete mechanic-position map below (all 4 levels); Playwright key-hold patterns; existing `screenshot-phase18/20.mjs` skeleton to reuse |
| VERIFY-02 | Real bugs found are fixed and re-verified | Two concrete code-verified bugs found already (enemy.js prompt-override; collect-zone dim-overlay contrast); a `label` vs `prompt` fix design is proposed below for the enemy bug — but VERIFY-01's interactive test must run FIRST to confirm before fixing (per CONTEXT Area 1) |
| VERIFY-03 | Automated boot check exercises movement + ≥1 full mechanic resolution per level | Current `browser-boot.mjs` fully read below — confirmed it does zero movement/mechanic interaction today; concrete minimal-diff hardening plan below |
| VERIFY-04 | Correct unsupported "human sign-off" claims (Phases 15–18/14) + resolve NAV-04 traceability inconsistency | Exact unsupported quotes extracted from `v4.0-MILESTONE-AUDIT.md`, `14-VERIFICATION.md`, `15-VERIFICATION.md`, and the archived `v4.0-REQUIREMENTS.md` below, with a proposed correction |
</phase_requirements>

## Finding 1 (HIGH confidence, code-verified): The color() hypothesis is FALSIFIED as literally stated

**Verification method:** read the vendored, minified `lib/kaplay.mjs` directly (this is the
pinned Kaplay 3001.0.19 engine actually shipped, not a generic Kaplay assumption).

- The `text()` component factory (`function ya(t,e={})`) builds its draw-time options via
  `Object.assign(je(o), {text, size, font, ...})`, where `je(o)` is
  `{ color: o.color, opacity: o.opacity, anchor: o.anchor, outline: o.outline, ... }` — i.e. if
  the object has no `color()` mixin, `o.color` is `undefined`, and that `undefined` flows
  straight into `formatText()`/`drawFormattedText()`.
- Inside the char-builder for `formatText` (function `Ue`), every rendered glyph gets:
  `color: t.color ?? j.WHITE` — confirmed via direct grep of the minified source
  (`,ch:A,pos:new E(c,b),opacity:t.opacity??1,color:t.color??j.WHITE,scale:v(i),angle:0}`).
- `j.WHITE` is defined as `static WHITE=new t(255,255,255)` (opaque white).

**Conclusion:** an uncolored `text()` in this engine renders solid white, not black/invisible.
`challenge.js`'s two uncolored `text()` calls (question prompt at lines ~121-128, answer-box
label at lines ~162-169) therefore render white text against `BOX_BG [30,30,30]` /
`PANEL_BG [20,20,20]` — good contrast, not invisible. This is corroborated by the fact that
every other `text()` call project-wide (`title.js:45,56`, `hud.js:57,98,128`,
`select.js:78,124,137`) explicitly sets `color(...LABEL_FG)` where `LABEL_FG ≈ [0xe8,0xe8,0xe8]`
— i.e. the project's own established convention colors text to a value **nearly identical in
brightness** to the engine's own uncolored default. Explicit `color()` in this codebase is a
defensive-consistency convention, not evidence that omitting it causes invisibility.

**What this means for planning:** do not plan a task that "fixes challenge.js by adding
color()" as if that alone closes VERIFY-02. Per CONTEXT Area 1's own instruction, the
interactive test must run FIRST. If the screenshot shows the text IS actually white/visible
(the code-level prediction), the real bug is elsewhere and the plan needs a follow-up
investigation task, not a premature "fix." Adding explicit `color()` to challenge.js's two
`text()` calls (and build.js's `?`/`!`/`X` glyphs, which have the exact same omission) is still
worth doing as a defensive-consistency cleanup (matches the project's established
convention) — just do not present it as the confirmed root-cause fix without the interactive
confirmation CONTEXT Area 1 demands.

## Finding 2 (HIGH confidence, code-verified): enemy.js's real bug — prompt fully replaces the arithmetic display

```js
// src/mechanics/enemy.js (current)
openChallenge({
  brain,
  prompt: "Answer to defeat the guard:",   // <-- REPLACES the question, doesn't prefix it
  onSuccess() { ... },
});
```

```js
// src/ui/challenge.js (current)
const q = question ?? brain.nextQuestion();
const display = prompt ?? `${q.a} × ${q.b}`;   // <-- prompt, if present, WINS outright
```

`door.js` and `gates.js` never pass `prompt`, so they correctly show `${q.a} × ${q.b}`. Only
`enemy.js` passes a static override string, which means the player at an enemy encounter never
sees what arithmetic problem the four numbered boxes are answering — confirmed to exactly
match the live report "Answer to defeat the guard, gives me answers but no question."

**Proposed fix shape (do not commit until VERIFY-01's interactive step confirms this is the
actual — or the only — cause):** `challenge.js` does not expose `q` to callers before
`openChallenge()` is invoked (it generates the question internally), so `enemy.js` cannot embed
`q.a`/`q.b` into a caller-built string. The minimal, non-breaking fix is to give `challenge.js`
a second, distinct parameter — e.g. `label` — that PREFIXES the default arithmetic display
instead of replacing it, while leaving the existing `prompt` (full override) untouched for
`collect.js`'s use case (`collect.js` already builds a complete self-contained prompt string
including the arithmetic itself, since it has `q` in scope before calling `openChallenge`):

```js
// challenge.js — proposed
const display = prompt ?? (label ? `${label} ${q.a} × ${q.b}` : `${q.a} × ${q.b}`);
```

```js
// enemy.js — proposed
openChallenge({ brain, label: "Answer to defeat the guard:", onSuccess() { ... } });
```

This is additive (new optional param, default `undefined`) — `door.js`/`gates.js`/`mathGate.js`
are unaffected (never pass `label` or `prompt`), and `collect.js` is unaffected (keeps using
`prompt`, which still fully overrides). Verify this doesn't regress `collect.js` by re-running
the existing headless collect-zone regression coverage plus a real screenshot.

## Finding 3 (MEDIUM confidence, code-derived, NOT yet interactively confirmed): the "no ID... greyed out" report is likely the collect zone's dim-overlay contrast wash-out, not challenge.js's own boxes

Evidence chain:
- Level-01's first mechanic encountered by a player walking right is the collect-the-answer
  zone at `x:300` (only 100px past the first coin at `x:200`; the next gate at `x:600` is
  400px+ further and past a gap-jump) — "just after the first coin" matches the zone, not a
  later gate.
- The zone trigger itself is `opacity(0)` (fully invisible) — matches round-1's separate report
  "I get a math question... without bumping into anything."
- `collect.js` uses `openChallenge({ renderChoices:false, ... })` — there is NO BOX_BG answer
  grid in this mechanic; the "boxes" the player sees must be the pickup badges (`build.js`'s
  `answer-pickup-slot` rects, `CONFIG.COLLECT.PICKUP_BG`/`PICKUP_FG`).
- Those pickup badges already received an explicit-color fix in commit `2baacef` (2026-07-03,
  **before** Phase 20 started at `a54eb4d`) — so by the time of the live Phase 20 report, the
  badge and its label both already have correct, distinct, high-contrast colors
  (`PICKUP_BG:[30,30,30]`, `PICKUP_FG:[0xe8,0xe8,0xe8]`). This means the EARLIER collect.js bug
  (both badge and label defaulting to the same fill) is **not** what's being newly reported.
- However, `openChallenge()` ALWAYS adds a full-screen dim rect
  (`opacity(CONFIG.GATE.DIM_OPACITY)` = 0.6, black, `fixed()`, `z:9990`) regardless of
  `renderChoices`. This dim layer is screen-space/`fixed()` at a very high `z`, so it draws
  ABOVE the camera-space world objects (including the collect zone's world-space pickup
  badges, which carry no explicit `z` and default to `0`). A 60%-opacity black overlay on top
  of a near-white (`0xe8`) label over a near-black (`30,30,30`) badge blends the visible result
  toward mid-grey-on-near-black — measurably lower contrast than the badge alone, and a very
  plausible explanation for "the boxes are visible in the background but no ID and they are
  greyed out."

**This must be confirmed with a real screenshot of the level-01 collect zone triggering** (walk
right from spawn to ~x:310) before deciding on a fix. If confirmed, candidate fixes (Claude's
discretion, do not over-scope): raise `PICKUP_FG` brightness further, or exempt the collect
zone's own overlay call from the dim layer (would require a new `openChallenge` option since
today the dim rect is unconditional), or increase pickup badge contrast independent of the dim
layer. Do not conflate this with Finding 1's already-falsified color() theory.

## Complete Mechanic-Position Map (for the interactive audit script)

All positions in world pixels; `FLOOR_Y = 320`. Player spawns at `(64, 64)`, run speed
`240px/s`, so covering e.g. 300px of flat ground takes roughly 1.25s of held `ArrowRight`
(plus fall-to-floor time from spawn height).

| Level | id | Bounds (L/R) | Collect zone | Math gates | Enemy | Door |
|-------|----|----|----|----|----|----|
| 1 "The First Descent" | `level-01` | 0–2240 | x:300 (after coin x:200) | x:600, x:1300 | x:1000 | x:1400 |
| 2 "The Rusted Climb" | `level-02` | 0–2800 | none | x:420, x:1100 | none | x:1540 |
| 3 "The Hollow" | `level-03` | 0–3400 | x:200 | x:420 | x:2400 | none |
| 4 "The Last Span" | `level-04` | 0–4000 | x:160 | x:320, x:1800 | x:2400 | x:900 |

Every mechanic across all 4 levels appears at least once; `VERIFY-01`'s "all 4 levels" +
"≥1 full mechanic resolution per level" (`VERIFY-03`) requirement is satisfiable by touching
this table's per-level entries. Level-01 alone contains one instance of all four mechanic
types and is the natural target for the deepest single-level audit (it's also where the
live-reported bugs were found).

**Answer-key mapping:** `openChallenge`'s boxes are always presented in `q.choices` order and
bound to keys `1`–`4` (1-indexed, matching the box label `i+1) choice`). A Playwright script
cannot know the correct answer in advance without reading the DOM/canvas state — the practical
approach (matching this project's own prior collect.js diagnostic pattern) is to press `1`,
observe via screenshot/DOM eval whether the challenge closed, and if not, cycle `2`,`3`,`4`
until it does (a correct answer always exists among the 4 choices, and wrong picks are
explicitly non-punishing/re-askable per GATE-04 — safe to brute-force in a test harness).
Alternatively, `page.evaluate()` can reach into the Kaplay scene via `get("answer")` objects'
`idx` tag and the brain's `q.answer`/`q.choices` if the test script is willing to introspect
engine state directly (more surgical, avoids up-to-4x retries per gate).

## Architecture Patterns

### Recommended Interactive Audit Script Structure

```
scripts/audit-phase21-mechanics.mjs   (new; port 8768 — 8765/6/7 already taken by
                                        browser-boot.mjs/screenshot-phase18.mjs/screenshot-phase20.mjs)
├── reuse: createServer + MIME map + chromium.launch skeleton
│   (byte-for-byte lift of screenshot-phase20.mjs's server/launch boilerplate — do not
│   reinvent; only the driving logic below is new)
├── per level in LEVEL_ORDER:
│   ├── seed save (localStorage) so the level is reachable from select
│   ├── navigate title -> select -> Enter into the level
│   ├── hold ArrowRight (page.keyboard.down/waitForTimeout/up) to approach each
│   │   mechanic's x position from the map above, with brief Space/up taps to
│   │   clear any spike/gap in the path (checkpoints make this forgiving — a fall
│   │   just respawns at the last checkpoint, no failure state)
│   ├── on each mechanic touch: screenshot BEFORE input (raw trigger state),
│   │   press "1" (or cycle 1-4 until closed) to answer, screenshot AFTER (resolved state)
│   └── record: mechanic type, level, position, screenshot paths, observed vs expected
└── output: numbered findings list (collect.js-style) with root cause + fix + file per bug
```

### Playwright Interaction Patterns Needed (all already used elsewhere in this repo)

```js
// Hold a directional key for real movement (not a teleport) — pattern from
// screenshot-phase20.mjs lines 98-100, generalized:
await page.keyboard.down("ArrowRight");
await page.waitForTimeout(1250); // ~300px at RUN_SPEED 240px/s
await page.keyboard.up("ArrowRight");

// Jump over a gap/spike mid-hold (tap, don't hold — variable-height jump cuts on release):
await page.keyboard.press("space");

// Answer the challenge (keys "1".."4" map to q.choices[0..3], per challenge.js:183):
await page.keyboard.press("1");
await page.waitForTimeout(200); // let the overlay's tint/shake or close resolve
await page.screenshot({ path: OUT("...") });
```

### Recommended `browser-boot.mjs` Hardening (VERIFY-03) — minimal, targeted diff

**Current behavior (confirmed by full read of `scripts/browser-boot.mjs`):** seeds
`level-01`/`02`/`03` as `cleared:true` in localStorage, then for each of the 4 levels: presses
`ArrowRight` N times to move the select cursor, presses `Enter` to load the level, waits
1500ms, presses `Escape` to return to select. **Zero player movement inside a level. Zero
mechanic interaction.** This is the exact gap STATE.md's post-ship diagnostic identified as
having let the collect.js total soft-lock ship as "passed."

**Minimal hardening (do not turn this into the full interactive-audit script — keep it fast,
since it runs on every phase's automated gate suite):** for at least `level-01` (which contains
one of each mechanic type), after `Enter` loads the level:
1. Hold `ArrowRight` long enough to reach and trigger the collect zone (x:300) — confirm via
   `page.evaluate(() => get("challenge").length > 0)` or a screenshot diff that a challenge
   opened (proves the invisible zone actually fires).
2. Press `1`..`4` until the overlay closes (or introspect `q.answer`/`q.choices` via
   `page.evaluate` for a single correct press) — proves a full mechanic RESOLUTION, not just a
   trigger.
3. Continue holding `ArrowRight` (+ occasional `space`) to reach at least one more mechanic
   (e.g. the math-gate at x:600) and repeat the trigger+resolve check.
4. Keep the existing zero-console-error assertion (`errors.length === 0`) as the pass gate —
   this hardening ADDS movement+resolution assertions, it does not remove the existing check.

This satisfies VERIFY-03's literal wording ("actually exercises movement and at least one full
mechanic resolution per level") with the smallest possible diff to a script that runs on every
future phase's automated suite — reserve the full 4-level/all-mechanics sweep for the new
one-off `audit-phase21-mechanics.mjs` script (VERIFY-01), not for the fast per-commit boot gate.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Static file serving for the audit script | A new server framework/dependency | The exact `createServer`+MIME-map pattern already in `browser-boot.mjs`/`screenshot-phase18.mjs`/`screenshot-phase20.mjs` | Zero new dependencies; proven pattern; keeps port allocation conventions consistent (8765/6/7 taken → use 8768) |
| Determining the correct answer to auto-resolve a challenge in a test | A hand-rolled math re-implementation of `brain.nextQuestion()` | `page.evaluate()` reading the live Kaplay scene's `q.answer`/`q.choices`, OR brute-force 1-4 cycling (safe because wrong answers are explicitly non-punishing) | The brain's question generation is pseudo-random per session; re-deriving it in the test script would drift from the real implementation |

**Key insight:** this phase adds NO new runtime dependencies (no npm installs, no new
libraries) — Playwright is already vendored in the environment and used by 3 existing scripts.
The work here is entirely new *test-driving logic* reusing that existing skeleton.

## Package Legitimacy Audit

Not applicable — this phase installs no new packages. `scripts/audit-phase21-mechanics.mjs`
reuses the same already-vendored Playwright installation (`playwright@1.59.1`, confirmed via
`node -e "require('.../playwright/package.json').version"`) that `browser-boot.mjs`,
`screenshot-phase18.mjs`, and `screenshot-phase20.mjs` already import from the identical
absolute path. No `npm install` occurs anywhere in this project (there is no `package.json` —
Playwright is provided by the surrounding GSD tooling environment, outside this repo's own
dependency graph).

## Common Pitfalls

### Pitfall 1: Confirming a hypothesis instead of testing it
**What goes wrong:** treating CONTEXT.md's color() hypothesis as already-confirmed and
"fixing" challenge.js by adding `color()` calls without ever screenshotting the actual bug.
**Why it happens:** the hypothesis is well-written and plausible-sounding; it's tempting to
skip the interactive step it explicitly asks for.
**How to avoid:** Finding 1 above already falsifies it at the code level (Kaplay's uncolored
default is white, not black) — the interactive screenshot step is not optional busywork, it is
how the REAL bug (Findings 2 and 3) gets found.
**Warning signs:** a plan task that says "fix challenge.js color() bug" with no preceding
"take a screenshot of the reported symptom and confirm it reproduces" step.

### Pitfall 2: Conflating "mechanic works" with "mechanic is clear to a player"
**What goes wrong:** treating the door/enemy `?`/`!` glyph clarity finding as a bug to "fix" by
guessing at new iconography, when the phase's actual mandate (CONTEXT Area 2) marks this
Claude's discretion and explicitly allows a documented known-limitation if a real fix needs new
art (out of Phase 20's closed scope).
**How to avoid:** distinguish BROKEN interaction (unanswerable/invisible — must fix) from
UNCLEAR iconography (works, but a glyph's meaning isn't obvious — discretionary, cheap fixes
like an on-touch label are fine, new sprite art is not in scope).

### Pitfall 3: Hardening `browser-boot.mjs` into the full audit script
**What goes wrong:** merging VERIFY-01's full 4-level/all-mechanic sweep into
`browser-boot.mjs`, making the fast per-commit gate slow (it currently takes seconds; a full
walk-and-resolve of every mechanic in every level would take much longer and run on every
future phase).
**How to avoid:** keep `browser-boot.mjs`'s hardening minimal (one level, movement + one full
resolution — see Architecture Patterns above); put the exhaustive per-mechanic audit in the new
one-off script.

### Pitfall 4: Re-diagnosing the ALREADY-FIXED collect.js bugs
**What goes wrong:** re-investigating collect.js's soft-lock/invisible-pickup/re-entry-stacking
bugs, which STATE.md already documents as fixed (`2baacef`, `f541f88`, predating Phase 20).
**How to avoid:** collect.js itself is explicitly OUT of this phase's four target files
(door.js/gates.js/enemy.js/mathGate.js) — the interactive audit should still WALK THROUGH the
collect zone (since it's the likely site of the "no ID... greyed out" report per Finding 3),
but any fix, if needed, targets `challenge.js`'s shared dim-overlay/contrast behavior, not
collect.js's own already-fixed code.

## Code Examples

### The falsified default (verified directly in `lib/kaplay.mjs`)

```js
// From the vendored engine (minified; reformatted here for readability) —
// the char-builder inside formatText()/drawFormattedText():
{
  ch: A,
  pos: new E(c, b),
  opacity: t.opacity ?? 1,
  color: t.color ?? j.WHITE,   // <-- uncolored text defaults to WHITE, not black
  scale: v(i),
  angle: 0,
}
// j.WHITE:
static WHITE = new t(255, 255, 255);
```

### The confirmed enemy.js bug

```js
// src/mechanics/enemy.js (current, buggy)
openChallenge({
  brain,
  prompt: "Answer to defeat the guard:", // replaces "6 × 7", doesn't prefix it
  onSuccess() { /* ... */ },
});
```

### The project's own established text()+color() convention (for contrast)

```js
// src/scenes/title.js:45-48 — every text() elsewhere pairs an explicit color()
add([
  text("Math Lab", { size: T.TITLE_SIZE }),
  anchor("center"),
  pos(center()),
  color(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]),
]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `browser-boot.mjs` pre-seeds all levels `cleared:true` and never plays | (this phase) hardens it to hold real movement keys and resolve ≥1 mechanic per level | Phase 21 (VERIFY-03) | Closes the exact validation gap that let the v4.0 total soft-lock ship as "passed" |
| Milestone audit claims "human sign-off recorded" without checking the phase's own VERIFICATION.md for contradicting PENDING status | (this phase) audit annotated with what verification actually happened, sourced from each phase's own VERIFICATION.md | Phase 21 (VERIFY-04) | Restores trust in the audit trail; prevents future "passed" claims resting on claims that were never actually true |

**Deprecated/outdated:** none — this is a correctness/process phase, not a technology
migration.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The round-2 "no ID... greyed out" report describes the collect-the-answer zone at level-01 x:300, not a challenge.js answer-box grid elsewhere | Finding 3 | If wrong, the interactive audit's first screenshot (collect zone trigger) simply won't reproduce the symptom, and the audit script's broader per-mechanic sweep (which covers every gate/door/enemy anyway per the mechanic-position map) will still surface the real site — low risk, self-correcting during VERIFY-01's own execution |
| A2 | The `GATE.DIM_OPACITY` full-screen overlay renders ABOVE (z-order) the collect zone's world-space pickup badges, sufficiently washing out their already-fixed contrast | Finding 3 | If the actual z/draw order differs (e.g. Kaplay renders non-fixed world objects in a separate pass always on top regardless of z), this specific mechanism is wrong and the screenshot will show fully-legible pickups — in that case the real cause is something not yet identified and needs fresh investigation during VERIFY-01, not a blind fix |
| A3 | Brute-force cycling keys 1-4 to resolve a challenge in the audit script is safe (no punishment for wrong picks) | Architecture Patterns / mechanic-position map | Low risk — `challenge.js`'s own GATE-04 forgiving design (verified in Finding 1's file read) guarantees no penalty; worst case is a few extra `waitForTimeout` cycles per gate |

**If this table is empty:** N/A — see rows above; all three are testable/self-correcting
within this same phase's VERIFY-01 execution, not blind unverified assumptions carried forward.

## Open Questions

1. **Does the Phase 15 door-mechanic "re-verification needed" note ever get closed?**
   - What we know: `15-04-SUMMARY.md` records a real human-confirmed MECH-01/MECH-02 pass, PLUS
     a real defect found (door jumpable) and iteratively fixed (final fix: tall invisible
     blocker). The summary's own last line reads: "Re-verification needed: confirm the player
     cannot bypass the door at x:1400 from the floor, from the raised platform at x:1640, or
     from any other ledge, and must answer the challenge to progress." `15-VERIFICATION.md`
     then declares full `passed` status citing "real-browser sign-off recorded in project
     STATE.md" — but that exact narrative actually lives in `15-04-SUMMARY.md`, not STATE.md,
     and the "re-verification needed" line is never explicitly closed out anywhere.
   - What's unclear: whether the FINAL door-blocker fix was ever actually re-confirmed live, or
     whether 15-VERIFICATION.md's "PASSED" absorbed an open follow-up note without closing it.
   - Recommendation: this is smaller and lower-confidence than the Phase 14 NAV-04 gap (Phase
     15 DID get a real, substantive human session with a real found-and-fixed bug — this is not
     the same category of "never executed" as Phase 14). Treat as optional/secondary: the
     interactive audit's own door.js pass at level-01 x:1400 (and level-02 x:1540, level-04
     x:900) naturally re-confirms bypass-safety as a side effect of VERIFY-01, closing this
     historical loose end for free without a dedicated task.

2. **Does adding `label` to `challenge.js` need a `check-gate.sh`/structural-gate update?**
   - What we know: `scripts/check-gate.sh` asserts `challenge.js` exports `openChallenge` and
     that door/gates/mathGate call it (per `15-VERIFICATION.md`'s artifact table).
   - What's unclear: whether the gate's assertions are string/signature-specific enough that
     adding a new optional param would need a gate update, or whether it's loose enough
     (existence + call-site greps) to be unaffected.
   - Recommendation: read `scripts/check-gate.sh` during planning/execution (not fully audited
     in this research pass) and re-run it after any `challenge.js` signature change — cheap
     insurance, this file wasn't included in the phase's `files_to_read` list.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All scripts | ✓ | v22.22.2 | — |
| Playwright (chromium) | Interactive audit script, hardened browser-boot | ✓ | 1.59.1 (vendored at the same absolute path 3 existing scripts already import from) | — |
| Python3 (http.server) | Manual/alternate local serving, referenced in prior phases' verification docs | ✓ | `/usr/bin/python3` present | Not needed — this phase's scripts use the same Node `http.createServer` skeleton as existing scripts, not `python3 -m http.server` |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — everything this phase needs is already present
and already used by existing scripts in this repo.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no JS unit-test framework/`package.json` in this project) — validation is a bespoke suite of shell-script structural gates (`check-gate.sh`, `check-import-safety.sh`, `check-safety.sh`, `check-progress.sh`) plus Node smoke scripts (`smoke-progress.mjs`) plus a real-browser Playwright boot (`browser-boot.mjs`) |
| Config file | none — each gate is a standalone `.sh`/`.mjs` script in `scripts/` |
| Quick run command | `bash scripts/check-gate.sh && bash scripts/check-import-safety.sh && bash scripts/check-safety.sh && node scripts/smoke-progress.mjs` |
| Full suite command | Quick run command + `node scripts/browser-boot.mjs` (real browser) + this phase's new `node scripts/audit-phase21-mechanics.mjs` (exhaustive interactive audit, one-off/on-demand rather than per-commit) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VERIFY-01 | Real interactive trigger+resolve of door/gates/enemy/mathGate across all 4 levels | e2e (Playwright, real key input) | `node scripts/audit-phase21-mechanics.mjs` | ❌ Wave 0 — new script |
| VERIFY-02 | Bugs found are fixed and re-verified | e2e (re-run of the same script post-fix) | `node scripts/audit-phase21-mechanics.mjs` | ❌ Wave 0 (same script, re-run) |
| VERIFY-03 | Boot gate exercises real movement + ≥1 mechanic resolution per level | e2e (Playwright) | `node scripts/browser-boot.mjs` | ✅ exists, needs hardening (not a new file) |
| VERIFY-04 | Milestone audit / traceability corrected | manual_procedural (doc edit, no automated test possible) | n/a | n/a — doc-only requirement |

### Sampling Rate
- **Per task commit:** existing quick-run static suite (unchanged, still fast)
- **Per wave merge:** hardened `browser-boot.mjs` (now includes real movement+resolution for
  ≥1 level) + full static suite
- **Phase gate:** `audit-phase21-mechanics.mjs` run once, findings recorded, fixes applied,
  re-run once to confirm; full static suite green; hardened `browser-boot.mjs` green

### Wave 0 Gaps
- [ ] `scripts/audit-phase21-mechanics.mjs` — new interactive audit script (VERIFY-01/02),
      reusing `screenshot-phase20.mjs`'s server/launch skeleton
- [ ] Hardened assertions inside existing `scripts/browser-boot.mjs` (VERIFY-03) — not a new
      file, an edit to an existing one
- [ ] No new fixture/conftest-equivalent needed — this project has no shared test-fixture
      convention beyond the existing save-seed blob pattern already used by all 3 Playwright
      scripts

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No accounts/auth anywhere in this local-only game |
| V3 Session Management | No | No sessions; `localStorage` only, single-origin, no cookies |
| V4 Access Control | No | Single local user, no multi-tenant/roles |
| V5 Input Validation | Marginal | The only "input" this phase touches is Playwright-synthesized keyboard events into the existing Kaplay input handlers (`onKeyPress`/`isKeyDown`) — no new text/markup input surface is introduced. `challenge.js` remains pure-canvas draws (no `innerHTML`/DOM sink), consistent with the existing GATE-01 guard this phase does not touch. |
| V6 Cryptography | No | No crypto in this project |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| A new `label`/`prompt` param accidentally introducing a markup/DOM sink | Tampering | Continue the existing pure-canvas `text()` convention (string concatenation into a `text()` call, never `innerHTML`) — verified this phase's proposed `enemy.js` fix stays within that pattern (`${label} ${q.a} × ${q.b}` is a plain JS template string fed straight into Kaplay's `text()`, never DOM) |
| Verification script leaking a listening HTTP server if it crashes mid-run | Denial of Service (self) | Follow the existing `try/finally { server.close() }` pattern already used by `browser-boot.mjs`/`screenshot-phase18/20.mjs` in the new script |

This phase touches no authentication, no network beyond localhost-only static file serving for
local Playwright tests, and no new external package installs — the security surface is
effectively unchanged from the existing 3 Playwright scripts already in this repo.

## Sources

### Primary (HIGH confidence — direct source read, this session)
- `lib/kaplay.mjs` (vendored Kaplay 3001.0.19, pinned+sha256-recorded per project convention) —
  confirmed the `text()`/`formatText()`/`drawFormattedText()` default-color behavior directly
  by reading the actual shipped engine code, not documentation or training-data assumption.
- `src/ui/challenge.js`, `src/ui/mathGate.js`, `src/mechanics/{door,gates,enemy,collect}.js`,
  `src/levels/build.js`, `src/levels/level-0{1,2,3,4}.js`, `src/levels/index.js`,
  `src/scenes/game.js`, `src/player.js`, `src/config.js` — read in full this session.
- `scripts/browser-boot.mjs`, `scripts/screenshot-phase18.mjs`, `scripts/screenshot-phase20.mjs`
  — read in full this session; confirmed exact current behavior and reusable patterns.
- `.planning/milestones/v4.0-MILESTONE-AUDIT.md`,
  `.planning/milestones/v4.0-phases/14-multi-scene-shell/14-VERIFICATION.md`,
  `.planning/milestones/v4.0-phases/15-challenge-seam-locked-door-mechanic/{15-VERIFICATION.md,15-04-SUMMARY.md,15-04-PLAN.md}`,
  `.planning/milestones/v4.0-REQUIREMENTS.md` — read in full this session; exact unsupported
  claims and the traceability inconsistency quoted verbatim below.
- `.planning/phases/20-real-cc0-art-redo-human-sign-off/{20-VERIFICATION.md,20-03-SUMMARY.md}` —
  read in full this session; source of the exact live user quotes and their timeline relative
  to the already-fixed collect.js commits (`git log` timestamps cross-checked).
- `git log` (commit history + timestamps for `src/mechanics/collect.js`, `src/config.js`,
  `src/ui/challenge.js`, `src/levels/build.js`) — used to establish that the collect.js fixes
  predate Phase 20, ruling out "collect.js's known bug is being re-reported."

### Secondary / Tertiary
None — this phase required no external web research; every claim above is verified directly
against this repository's own source and history.

## VERIFY-04 Reference Material — exact quotes to correct

**Unsupported claim, `v4.0-MILESTONE-AUDIT.md` line 43 (Phase Verification Status table, Phase
14 row):**
> "Human browser-boot NAV-01..04 sign-off recorded; two runtime defects found and fixed during
> sign-off."

**Contradicted by, `14-VERIFICATION.md` (status: `human_needed`, NOT `passed`):**
> Truth #4 (NAV-04): "⚠️ PRESENT_BEHAVIOR_UNVERIFIED ... the phase's own mandatory human
> checkpoint (14-03-PLAN.md Task 2, `checkpoint:human-verify`, `gate="blocking"`) that was
> designed specifically to prove this was never executed. 14-03-SUMMARY.md explicitly records
> it as PENDING."
> "## Human Verification Required ... That checkpoint was never executed (14-03-SUMMARY.md
> explicitly records it 'PENDING — routed to the orchestrator for manual browser testing')."

Note: the "two runtime defects found and fixed during sign-off" half of the audit's claim IS
substantively true (14-VERIFICATION.md documents 2-3 real defects found and fixed) — but they
were found by the **verifier's own static/code-level review**, not by an executed human
browser-boot session. The audit's phrasing conflates "defects were found and fixed this phase"
(true) with "a human browser-boot sign-off happened" (false, per 14-VERIFICATION.md's own
`human_needed` status). VERIFY-04's correction should preserve the true "defects found and
fixed" fact while removing/annotating the false "sign-off recorded" framing.

**Requirements Coverage table, `v4.0-MILESTONE-AUDIT.md` line 61:**
> `| NAV-04 | 14 | SATISFIED | missing | `[x]` Complete | satisfied |`

**The archived traceability inconsistency, currently in `.planning/milestones/v4.0-REQUIREMENTS.md`
(NOT the current `.planning/REQUIREMENTS.md`, which is v4.1's and has no NAV-04 row at all —
planners must edit the archived file):**
- Line 30: `- [x] **NAV-04**: ...` (checkbox marked complete)
- Line 95: `| NAV-04 | Phase 14 | Complete |` (traceability table also now says Complete)

**14-VERIFICATION.md's own original flag (line 115, now stale since the archived file shows
"Complete" not "In Progress" — meaning the checkbox/table mismatch it flagged was since
"resolved" by marking BOTH complete, without the underlying human checkpoint ever running):**
> "Note on REQUIREMENTS.md inconsistency (not a phase-14 code defect, but worth flagging):
> REQUIREMENTS.md's checkbox line for NAV-04 shows `[x]` (checked/complete), while its own
> Traceability table on the same file lists NAV-04 status as 'In Progress'. The Traceability
> table's 'In Progress' is the accurate one given the pending human sign-off found here — the
> checkbox appears to have been set prematurely..."

**What VERIFY-04 must actually do (per CONTEXT Area 4 — annotate, don't retroactively rewrite):**
add an honest annotation to `v4.0-MILESTONE-AUDIT.md`'s Phase 14 row and Requirements Coverage
table clarifying that NAV-04's mandatory human checkpoint was never executed (citing
`14-VERIFICATION.md`'s own `human_needed` status and PENDING checkpoint note) even though the
archived `v4.0-REQUIREMENTS.md` traceability table currently reads "Complete." Do not simply
flip the archived file back to "In Progress" as if no time has passed — the correction is a
documented, dated annotation of what actually happened, consistent with this whole phase's
purpose (honest verification records, not retroactive rewriting).

**Phase 15's secondary, smaller gap (see Open Question 1 above):** `15-VERIFICATION.md` cites
"real-browser sign-off recorded in project STATE.md" — STATE.md contains no such narrative
(confirmed via grep); the real narrative is in `15-04-SUMMARY.md`. This is a citation error, not
a fabricated sign-off (the sign-off itself did happen, per 15-04-SUMMARY.md's substantive
first-person account of a real defect found and fixed) — a much smaller correction than Phase
14's, and optional per CONTEXT Area 4's "IF its own VERIFICATION.md shows the same gap"
qualifier (it doesn't show the *same* gap — Phase 15 has real evidence of a real session; Phase
14 has none).

## Metadata

**Confidence breakdown:**
- Kaplay default-color behavior (Finding 1): HIGH — verified directly against the vendored
  engine's own source code, not documentation or training-data assumption
- enemy.js prompt-override bug (Finding 2): HIGH — verified directly against current
  `enemy.js`/`challenge.js` source; the logic bug is unambiguous
- Collect-zone dim-overlay contrast theory (Finding 3): MEDIUM — grounded in code (z-order,
  opacity math) but explicitly NOT yet interactively confirmed; the phase's own VERIFY-01 step
  must confirm or refute this before any fix is committed
- Mechanic-position map: HIGH — read directly from all 4 level descriptor files
- browser-boot.mjs current behavior + hardening plan: HIGH — read in full, gap is unambiguous
- Milestone audit unsupported claims: HIGH — exact quotes extracted from the source documents

**Research date:** 2026-07-04
**Valid until:** No expiry concern — this is a point-in-time codebase/documentation audit, not
a fast-moving external ecosystem; findings remain valid until the referenced files change.
