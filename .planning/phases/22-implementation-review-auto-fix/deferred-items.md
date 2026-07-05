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
