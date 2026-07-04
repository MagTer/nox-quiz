# Phase 21: Real Verification Pass — Mechanics & Sign-off Integrity - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss — proposed approach presented via AskUserQuestion; no response after 60s, so proceeded with the well-grounded recommended plan (directly derived from ROADMAP's own success criteria, not a speculative deviation). If the user disagrees on review, easy to redirect before execution.

<domain>
## Phase Boundary

Give `door.js`, `gates.js`, `enemy.js`, and `mathGate.js` the same real interactive
scrutiny `collect.js` got during the v4.0 post-ship diagnostic (which found a total
soft-lock + 5 other real bugs hiding behind claims of "passed"). These four were
code-verified during Phases 15/16 but never screenshot/interaction-audited. Harden the
automated boot gate so it actually exercises movement and mechanic resolution instead of
just confirming scenes load with zero console errors. Correct the unsupported "human
sign-off" claims left in `v4.0-MILESTONE-AUDIT.md` (Phases 14/15) and the NAV-04
traceability inconsistency flagged (but never corrected) by `14-VERIFICATION.md`.

Out of scope: any Phase 20 art/asset work (already shipped and verified); new gameplay
mechanics; difficulty/level-geometry changes.
</domain>

<live_user_evidence>
## Live User Evidence (gathered during Phase 20's human sign-off, 2026-07-04)

While confirming Phase 20's art, the user played the live game and reported, verbatim:

> "I get a question just after the first coin that is not possible to answer. No ID on
> the options. the boxes are visible in the background but no ID and they are greyed
> out. Next issue, Answer to defeat the guard, gives me answers but no question. There
> are boxes with question marks and exclamation marks that I am not what sure what they
> are."

This is real, human-confirmed evidence of at least 2 broken mechanics (a checkpoint/gate
challenge with unlabeled/unanswerable options, and the defeat-enemy challenge missing its
question text) — exactly the class of defect this phase exists to find. This was
explicitly kept out of Phase 20 (asset-only scope) and carried forward here.

### Root-cause hypothesis (code-level, NOT YET INTERACTIVELY VERIFIED — this phase must verify it for real, not just from reading code)

`src/ui/challenge.js` (the shared overlay `openChallenge()` that `door.js`, `gates.js`,
`enemy.js`, and `mathGate.js` (via a thin wrapper) all call) draws its question-prompt
`text()` (lines ~121-128) and its per-choice answer-box label `text()` (lines ~162-169)
with **no explicit `color()` component** — unlike every other `text()` call anywhere
else in this codebase (`title.js`, `select.js`, `hud.js` all explicitly set `color()`
alongside every `text()`). The answer boxes/panel themselves DO have explicit dark
`color()` (`PANEL_BG`/`BOX_BG`). If Kaplay's unset-color default renders dark/black,
both the question text and the option labels would be invisible against those dark
boxes — which would produce EXACTLY the two symptoms reported: "boxes visible... but no
ID" (labels invisible) and "answers but no question" (prompt text invisible). `collect.js`
doesn't hit this because it renders its own pickups with an explicit
`CONFIG.COLLECT.PICKUP_FG` color (added during the v4.0 post-ship fix) and doesn't use
challenge.js's boxes/labels (`renderChoices: false`). `mathGate.js` is a thin wrapper
around the SAME `openChallenge()` call, so if this hypothesis holds, the end-of-level
gate has the identical bug — meaning Phase 19's "kid-UAT" claim is suspect too, since
STATE.md/the milestone audit record that live kid-UAT was actually deferred/never run.

**This is a hypothesis to verify interactively (real Playwright screenshot of a real
triggered gate), not something to fix blind from code-reading alone** — matching this
phase's own VERIFY-01 requirement.
</live_user_evidence>

<decisions>
## Implementation Decisions

### Area 1: Interactive Verification Methodology
- Real interactive Playwright playtest (real keyboard movement + real answer-key input,
  not teleport-only) across all 4 levels, driving `door.js`/`gates.js`/`enemy.js`/
  `mathGate.js` to actual trigger + resolution, mirroring the rigor of the collect.js
  post-ship diagnostic (which used a from-scratch headless-but-actually-interactive
  session, not scripted state-injection).
- Findings recorded in the same style as STATE.md's collect.js bug list: numbered,
  each with what broke, why, the fix, and the file touched.
- Verify the challenge.js color() hypothesis FIRST (cheap, high-confidence, likely
  explains 2 of the 3 live-reported symptoms) via a real screenshot of a real triggered
  gate — before assuming it's the fix, confirm the visual symptom reproduces, then after
  fixing, confirm the fix visually too.

### Area 2: Scope of "Doors are question marks, monsters are exclamation marks" finding
- This is a separate, real finding (glyph sprites — `?`/`!` boxes — read as unclear to a
  player) from the challenge.js color bug. In scope for this phase's interactive audit
  (VERIFY-01/02 cover "real interactive scrutiny" of these mechanics broadly, not just
  the challenge overlay) but the FIX is Claude's discretion — could be a copy/label
  addition (e.g. a text hint), a recolor, or documenting it as a lower-priority
  known-limitation if fixing it would require new art (out of Phase 20's closed scope) —
  bugs (broken interaction) get fixed; a "the glyph could look nicer" purely-aesthetic
  note does not require new art assets.

### Area 3: Automated Boot Gate Hardening (VERIFY-03)
- `scripts/browser-boot.mjs` currently only confirms scenes load with zero console
  errors (seeds all levels pre-cleared, never actually plays). Harden it to actually
  exercise real movement (keyboard input) and at least one full mechanic resolution
  (trigger + correctly answer a gate) per level — not just teleporting/pre-clearing.
  This directly closes the exact gap that let the v4.0 soft-lock ship as "passed".

### Area 4: Milestone Audit / Traceability Correction (VERIFY-04)
- Correct `v4.0-MILESTONE-AUDIT.md`'s Phase 14 row ("Human browser-boot NAV-01..04
  sign-off recorded; two runtime defects found and fixed during sign-off") — this
  contradicts `14-VERIFICATION.md`'s own record that NAV-04's mandatory
  `checkpoint:human-verify` was PENDING/never executed. Correct Phase 15's row
  similarly if its own VERIFICATION.md shows the same gap. Resolve the NAV-04
  traceability inconsistency (REQUIREMENTS.md checkbox showed `[x]` while its own
  Traceability table showed "In Progress") by annotating the audit with what
  verification actually happened, not by retroactively rewriting history — the goal is
  an honest record, matching this milestone's whole purpose.

### Claude's Discretion
- Exact recording format for interactive-audit findings (as long as it mirrors the
  collect.js precedent's rigor), exact hardened-boot-gate implementation detail, exact
  wording of the audit corrections, and how (if at all) to address the "?"/"!" glyph
  clarity finding are at Claude's discretion.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/ui/challenge.js` — shared overlay (`openChallenge()`) consumed by all 4 target
  mechanics; the likely bug site (missing `color()` on 2 `text()` calls).
- `src/ui/mathGate.js` — thin wrapper around `openChallenge()`; if challenge.js's bug is
  confirmed, this file inherits the same defect with zero changes of its own needed.
- `src/mechanics/collect.js` — the ALREADY-FIXED reference precedent: explicit
  `CONFIG.COLLECT.PICKUP_FG`/`BG`/`BORDER` colors were added here during the v4.0
  post-ship diagnostic; same fix shape likely applies to challenge.js.
- `scripts/browser-boot.mjs` — existing Playwright skeleton (server + MIME + chromium
  launch), currently pre-clears all levels and never plays; the file this phase hardens.
- `scripts/screenshot-phase18.mjs`/`screenshot-phase20.mjs` — reusable
  server/launch/screenshot patterns for the new interactive-audit script.

### Established Patterns
- a727c13 discipline — engine globals only inside function bodies.
- Kaplay text() + explicit color() pairing — used everywhere EXCEPT the 2 suspect
  lines in challenge.js; this phase's fix (if confirmed) restores that consistent
  pattern rather than inventing a new one.
- Anti-leak: global key controllers captured and cancelled on close (challenge.js
  already does this correctly for its 1-4 answer keys).

### Integration Points
- `door.js`/`gates.js`/`enemy.js` each call `openChallenge()` directly with
  `renderChoices: true` (unlike collect.js).
- `src/scenes/game.js` wires all four mechanics into level scenes; the interactive
  playtest script needs to actually collide the player with each mechanic's trigger
  zone, not just seed save state.
- `v4.0-MILESTONE-AUDIT.md` and `.planning/REQUIREMENTS.md`'s traceability table are the
  two documents VERIFY-04 corrects.

</code_context>

<specifics>
## Specific Ideas

- The interactive-audit script should be a new `scripts/`-level Playwright script (name
  at Claude's discretion, e.g. `scripts/audit-phase21-mechanics.mjs`), reusing the
  established server+launch skeleton, that: for each of the 4 levels, drives the player
  via real `page.keyboard.down/up` calls to reach and trigger each mechanic present in
  that level, attempts a real answer-key press (1-4), and screenshots before/during/
  after each encounter.
- Given the challenge.js hypothesis is well-grounded (matches 2 of 3 live symptoms
  precisely, and is a simple, contained, one-file fix), prioritize verifying and fixing
  it early — likely resolves the bulk of the "not possible to answer"/"no question"
  reports in one shot, the way `CONFIG.COLLECT.PICKUP_FG` resolved collect.js's label
  bug.
</specifics>

<deferred>
## Deferred Ideas

- Any new gameplay mechanics, level content, or difficulty changes — out of scope.
- Further art/asset changes beyond what's needed to make a legitimate `?`/`!` glyph
  clarity fix (if any) — Phase 20's asset scope is closed; a full re-art of door/enemy
  sprites (if warranted) would be a future milestone's decision, not this phase's.
</deferred>

---

*Phase: 21-Real Verification Pass — Mechanics & Sign-off Integrity*
*Context gathered: 2026-07-04*
