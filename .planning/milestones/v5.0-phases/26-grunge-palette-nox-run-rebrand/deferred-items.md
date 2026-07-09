# Deferred Items — Phase 26 (Grunge Palette & Nox Run Rebrand)

Out-of-scope discoveries logged per the executor's Scope Boundary rule
(only auto-fix issues directly caused by the current task's changes).

## 2026-07-07 — Plan 26-07, Task 2

**Observed:** `bash scripts/check-progress.sh` fails with 3 `smoke-progress.mjs`
assertion failures:
- `LVL-02 regression: getLevel("level-01").geometry must deep-equal the v3.0
  src/level.js geometry verbatim`
- `LVL-02 regression: getLevel("level-03").geometry must match the authored
  descriptor`
- `LVL-02 regression: getLevel("level-04").geometry must match the authored
  descriptor`

**Why out of scope:** Plan 26-07's Task 2 only modifies `src/config.js`,
`src/main.js`, `src/scenes/title.js`, `src/scenes/select.js` — none of which
touch level geometry. These assertions are hardcoded expected-geometry pins
in `scripts/smoke-progress.mjs` compared against the live level descriptors
(`src/levels/level-01.js`, `level-03.js`, `level-04.js`). Not caused by this
plan's changes.

**Not fixed.** Per the Scope Boundary rule, this is logged rather than
auto-fixed. STATE.md's own decision log already records this class of issue
as a known, tracked gap: "[Phase 25-04]: check-progress.sh's final
smoke-progress.mjs invocation was already RED before this plan due to Plan
25-03's LEVEL_ORDER bump to 8 (not yet re-baselined)... deferred to Plan
25-06" — this appears to be a recurrence/continuation of that same
regression-pin staleness class (level descriptors evolving faster than the
hardcoded expected-geometry literals in the smoke test), not a new defect
introduced by this plan.

**Suggested follow-up:** Re-baseline `scripts/smoke-progress.mjs`'s
expected-geometry literals for level-01/03/04 against the current live
descriptors, in a plan that owns `scripts/smoke-progress.mjs` (not this
logo/rebrand plan).

## 2026-07-07 — Plan 26-10, overall verification

**Observed:** `grep -rni "math lab\|mathlab" .` (excluding `.git/`,
`.planning/`, `archive/`) surfaces 2 unallowlisted hits beyond the expected
`src/progress.js` allowlist and `scripts/check-rebrand.sh`'s own matcher
pattern line:
- `.claude/CLAUDE.md:5` — `**Math Lab**` (the `## Project` section heading)
- `.claude/CLAUDE.md:37` — a STACK table row mentioning the historical
  `mathlab_platformer_v2` save-key literal in explanatory prose

**Why out of scope:** `.claude/CLAUDE.md` is a GSD-generated file synced
from `.planning/PROJECT.md` (`<!-- GSD:project-start source:PROJECT.md -->`
marker) and `.planning/codebase/STACK.md`. Its "Math Lab" text is inherited
verbatim from `.planning/PROJECT.md`'s own `## Project` heading, which still
literally reads "**Math Lab**" (STATE.md separately already frames the
project as "Nox Run (formerly Math Lab)", but PROJECT.md's own title prose
has not been updated to match). 26-10's `files_modified` list and
`26-CONTEXT.md`'s named "full sweep scope" (src/, scripts/, docs/, docker/,
README.md, CREDITS.md) explicitly do not include `.claude/CLAUDE.md` or
`.planning/PROJECT.md` — the plan's own `key_links` field states
`check-rebrand.sh` scans exactly that named scope, not `.planning/` or
`.claude/`. Editing `.claude/CLAUDE.md` directly would also be a no-op long
term, since the next GSD project-sync would regenerate it from the
still-unrenamed `PROJECT.md` source. Not caused by any task in this plan.

**Not fixed.** Per the Scope Boundary rule, logged rather than auto-fixed —
fixing the root cause (PROJECT.md's project-identity heading) is a
milestone/PROJECT.md-ownership decision outside a docs/scripts rebrand plan.

**Suggested follow-up:** Decide (likely at the next `/gsd-transition` or
milestone boundary) whether `.planning/PROJECT.md`'s `## Project` heading
and opening paragraph should be renamed "Nox Run" to match STATE.md's
"(formerly Math Lab)" framing; a `/gsd-config` sync would then propagate the
rename into `.claude/CLAUDE.md` automatically.
