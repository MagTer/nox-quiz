---
quick_id: 260708-pud
slug: fix-dev-serving-instructions-in-claude-m
subsystem: docs
tags: [documentation, dev-server, python-http-server, kaplay]

key-files:
  created: []
  modified:
    - .claude/CLAUDE.md
    - .planning/codebase/STACK.md
    - README.md

key-decisions:
  - "Corrected all three current, forward-facing docs identically (CLAUDE.md, its GSD generation source STACK.md, and README.md) rather than only the surface-visible CLAUDE.md, so a future docs regeneration from STACK.md cannot silently reintroduce the broken instruction"
  - "docs/DEPLOY.md checked and confirmed to need no change — it only documents the Docker build/run/curl deploy-verification flow, not dev serving"

requirements-completed: []

coverage:
  - id: D1
    description: "Corrected dev-serving instructions in .claude/CLAUDE.md, .planning/codebase/STACK.md, and README.md to serve from the repo root and browse to /src/index.html, eliminating the 404-on-lib/kaplay.mjs instruction"
    verification:
      - kind: other
        ref: "grep verify (broken 'cd src && python3 -m http.server' absent, corrected 'localhost:8000/src/index.html' present, in all 3 target docs; docs/DEPLOY.md confirmed never had the broken instruction)"
        status: pass
      - kind: integration
        ref: "live python3 -m http.server spun up from repo root exactly as corrected docs instruct; curl http://localhost:PORT/src/index.html and /lib/kaplay.mjs both returned HTTP 200"
        status: pass
    human_judgment: false

duration: ~5min
completed: 2026-07-08
status: complete
---

# Quick Task 260708-pud: Fix dev-serving instructions Summary

**Corrected `.claude/CLAUDE.md`, `.planning/codebase/STACK.md`, and `README.md` to serve the dev HTTP server from the repo root (not `src/`) and browse to `/src/index.html`, fixing a standing 404-on-`lib/kaplay.mjs` documentation defect present since Phase 7/v3.0.**

## Performance

- **Duration:** ~5min
- **Tasks:** 1 completed
- **Files modified:** 3

## Accomplishments

- `.claude/CLAUDE.md`'s Technology Stack table Serving row now instructs running `python3 -m http.server 8000` from the repo root and browsing to `http://localhost:8000/src/index.html`, explicitly noting `lib/` is a sibling of `src/` (not nested inside it) so a server rooted at `src/` 404s on `lib/kaplay.mjs`.
- `.planning/codebase/STACK.md` (the GSD generation source for the block above) carries the identical corrected text, so a future docs regeneration cannot silently reintroduce the bug.
- `README.md`'s "Run locally" fenced bash block and intro sentence now instruct starting the server from the repo root; the "Web-root / path parity" subsection's previously-incorrect claim (that serving from inside `src/` makes `../lib/kaplay.mjs` "resolve to the sibling `lib/` directory") is corrected to state plainly that serving from inside `src/` is the broken 404 case, and serving from the repo root while opening `/src/index.html` is the only correct dev convention — matching production and `scripts/browser-boot.mjs`.
- `docs/DEPLOY.md` confirmed (via grep) to contain no instance of the broken instruction — no change needed there.
- Fix proven live: spun up `python3 -m http.server` from the repo root exactly per the corrected docs and curled both `src/index.html` and `lib/kaplay.mjs` — both returned HTTP 200.

## Task Commits

1. **Task 1: Correct the dev-serving instructions in CLAUDE.md, its generation source, and README.md** - `210af9a` (docs)

**Plan metadata:** commit deferred to orchestrator (per constraints, docs artifacts committed separately)

## Files Created/Modified

- `.claude/CLAUDE.md` - Serving row of the Technology Stack table corrected to repo-root serving + `/src/index.html` URL
- `.planning/codebase/STACK.md` - Identical correction to the GSD generation source, kept in sync with CLAUDE.md
- `README.md` - "Run locally" bash block and intro sentence corrected to repo-root serving; "Web-root / path parity" subsection's incorrect reasoning rewritten to state the true resolution behavior and the corrected takeaway

## Decisions Made

- Corrected all three current, forward-facing docs identically (not just the surface-visible `CLAUDE.md`) since `STACK.md` is the GSD generation source that a future regeneration reads from — leaving it stale would make the fix fragile.
- Left `docker/Dockerfile`, `src/main.js`, `docs/DEPLOY.md` (already checked clean), and all historical/archived planning artifacts (`.planning/milestones/**`, closed phase docs, `STATE.md`'s session log) untouched, per the plan's explicit scope boundary — these are either already correct or point-in-time records that should not be rewritten after the fact.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

This was a standalone documentation fix with no dependency on or blocking effect on Phase 27 (Audio & ADHD-Safe Sound), which remains paused awaiting human sound sign-off (27-07) per `.planning/STATE.md`. No further action needed for this quick task.

---
*Quick task: 260708-pud*
*Completed: 2026-07-08*

## Self-Check: PASSED

- FOUND: .claude/CLAUDE.md
- FOUND: .planning/codebase/STACK.md
- FOUND: README.md
- FOUND: .planning/quick/260708-pud-fix-dev-serving-instructions-in-claude-m/260708-pud-SUMMARY.md
- FOUND commit: 210af9a
