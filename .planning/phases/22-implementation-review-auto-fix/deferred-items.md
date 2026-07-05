# Phase 22 — Deferred / Out-of-Scope Discoveries

## From Plan 22-02 (2026-07-05)

### Untracked regenerated audit screenshots under the archived Phase 21 path

`scripts/audit-phase21-mechanics.mjs` hardcodes its screenshot output directory to
`.planning/phases/21-real-verification-pass-mechanics-sign-off-integrity-perform-/screenshots/`.
That phase directory was archived to `.planning/milestones/v4.1-phases/` at the v4.1
close, so every audit run this phase (22-01 baseline, 22-02 cluster regression)
recreates the directory and leaves ~32 PNGs untracked at the stale path.

- Out of scope for 22-02 (script harness change; harness work is Phase 23's per
  CONTEXT deferred list — and the audit script is shared state for Plans 22-03..05,
  which will keep regenerating them this phase).
- Suggested resolution (Phase 23, VALID-03 groundwork): point the screenshot dir at
  the CURRENT phase dir or a gitignored `artifacts/` path when the harness is
  upgraded; then delete the stale directory.
- Until then: leave untracked; do NOT commit them (Plan 22-01 made the same call
  implicitly by leaving them out of the baseline commit).

## From Plan 22-05 (2026-07-05) — FIX-02 decision round

### Door/gate/enemy glyph clarity → Phase 26 (visual identity owner)

Escalation Candidate 1 was REJECTED for Phase 22 and explicitly deferred to
Phase 26 (user verdict, 2026-07-05 batched FIX-02 round — see 22-FINDINGS.md
Escalation Candidates, Candidate 1).

- **Evidence that carries forward:** live kid report from v4.1 UAT — "boxes with
  question marks and exclamation marks I'm not sure what they are" (recorded as
  a non-blocking observation in 21-FINDINGS; glyphs are the "X" / "?" / "!"
  labels drawn in `src/levels/build.js` lines ~175/214/251).
- **Why deferred:** any fix (on-touch hint, legend, glyph redesign) changes
  UX/visual identity; the user chose to keep visual-identity work consolidated
  in Phase 26's palette/rebrand pass rather than land a one-off hint mid-review.
- **Action for Phase 26 planning:** pick this up as an input — the glyph-confusion
  evidence is first-party UAT data, not speculation.
