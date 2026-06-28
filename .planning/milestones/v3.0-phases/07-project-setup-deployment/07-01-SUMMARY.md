---
phase: 07-project-setup-deployment
plan: 01
subsystem: infra
tags: [kaplay, esm, static-site, vanilla-js, vendoring]

# Dependency graph
requires: []
provides:
  - "Clean no-build multi-file layout (src/ + lib/ + assets/) with no package.json, node_modules, or dist"
  - "Vendored Kaplay 3001.0.19 ESM at lib/kaplay.mjs with integrity/version header (no CDN, no npm)"
  - "Game shell: src/index.html (canvas + module script + inline file:// guard) and src/main.js (kaplay init + smoke scene)"
  - "README.md documenting layout, dev server (python3 -m http.server), and the Kaplay pin"
  - "archive/math-lab.html — v2 single-file quiz preserved verbatim for the Phase 10 math-brain port"
affects: [08-platformer-core, 09-level-build-cc0-assets, 10-math-gate-integration, 07-02-docker-deploy]

# Tech tracking
tech-stack:
  added: ["Kaplay 3001.0.19 (vendored ESM, lib/kaplay.mjs)"]
  patterns:
    - "Vendored engine as committed file (never npm install at play time); header records source URL + sha256 + pin policy"
    - "Inline non-module file:// guard in index.html head (runs before the hoisted module import)"
    - "Relative ESM import (../lib/kaplay.mjs) so dev (serve src/) and container (flatten src/ to web root) resolve identically"
    - "No JS build step — native <script type=module>, no bundler/transpile"

key-files:
  created:
    - lib/kaplay.mjs
    - src/index.html
    - src/main.js
    - assets/.gitkeep
    - README.md
  modified:
    - archive/math-lab.html  # moved from repo root via git mv (history preserved)

key-decisions:
  - "Folder is lib/ (not vendor/) — reconciles the CONTEXT.md/ROADMAP discrepancy and passes the phase verification gate"
  - "file:// guard placed inline in index.html head (not in main.js) because a top-level static import is hoisted and would run before an in-module guard"
  - "Engine vendored from unpkg (primary source); sha256 fb4a4ef2... recorded in the header for integrity (T-07-SC mitigation)"
  - "Web-root parity: serve so index.html is the root and lib/ is its sibling — dev (cd src) and container (flatten src/) produce identical relative paths"

patterns-established:
  - "Vendored-library integrity header: name + exact version + source URL + download date + sha256 + pin policy"
  - "HTTP-only serving with a file:// guard fallback message instead of a silent blank canvas"

requirements-completed: [SETUP-03, SETUP-04]

# Metrics
duration: ~2min
completed: 2026-06-22
status: complete
---

# Phase 07 Plan 01: Project Setup & Deployment (Layout + Kaplay Vendoring) Summary

**Clean no-build multi-file layout (src/lib/assets) with Kaplay 3001.0.19 vendored locally (sha256-pinned, no CDN/npm), a smoke-test game shell that draws "hello", an inline file:// guard, and a developer README — v2 quiz archived verbatim.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-22T19:23:53Z
- **Completed:** 2026-06-22T19:25:43Z
- **Tasks:** 3
- **Files modified:** 6 (5 created, 1 moved)

## Accomplishments
- Vendored Kaplay 3001.0.19 (~188 KB ESM) to `lib/kaplay.mjs` with an integrity header (source URL, download date, sha256 `fb4a4ef2...`, pin policy) — zero runtime CDN/npm footprint (SETUP-03).
- Established the clean multi-file layout `src/` + `lib/` + `assets/` with no build step, no `package.json`, no `node_modules`, no `dist` (SETUP-04).
- Built the game shell: `src/index.html` (canvas#game + module script + inline `file://` guard) and `src/main.js` (kaplay init + `scene('game')` drawing "hello"), proving the vendored engine boots.
- Wrote `README.md` documenting the layout, the `python3 -m http.server` dev command, the explicit dev/prod web-root path-parity convention, and the Kaplay pin.
- Archived `math-lab.html` to `archive/math-lab.html` verbatim via `git mv` (history preserved) — repo root is now clean.

## Task Commits

Each task was committed atomically:

1. **Task 1: Archive v2 and vendor Kaplay 3001.0.19** - `a9a7363` (feat)
2. **Task 2: Create the game shell (index.html + main.js with file:// guard and smoke-test scene)** - `463c9b2` (feat)
3. **Task 3: Write README with layout map, dev server, and pin note** - `46e5276` (docs)

**Plan metadata:** _(final docs commit below)_

## Files Created/Modified
- `lib/kaplay.mjs` - Vendored Kaplay 3001.0.19 ESM build with integrity/version header comment
- `src/index.html` - Entry shell: canvas#game, `<script type="module" src="main.js">`, inline `file://` guard in head
- `src/main.js` - `import kaplay from "../lib/kaplay.mjs"`, init 640x360 #0a0a0a, `scene('game')` draws "hello" in #00ff88, `go('game')`
- `assets/.gitkeep` - Placeholder so the assets folder is tracked (sprites/audio land here in phases 8–9)
- `README.md` - Layout map, dev server instructions, web-root parity convention, Kaplay pin note
- `archive/math-lab.html` - v2 single-file quiz, moved verbatim (Phase 10 math-brain reference)

## Decisions Made
- **lib/ over vendor/:** the plan locks `lib/` as the vendored-engine folder, reconciling the CONTEXT.md/ROADMAP folder-name discrepancy and satisfying the verification gate.
- **Guard placement:** the `file://` guard is an inline non-module script in `index.html`'s head rather than in `main.js`, because a top-level static `import` is hoisted and would run before an in-module guard (per RESEARCH Pattern 3 caveat).
- **Integrity pin:** recorded the computed `sha256` (`fb4a4ef2392e9bf95601f01ddfcf2b0bc27b46636201747dfa1c560e0ec2dac5`) in the header rather than relying on the npm tarball shasum, since the single-file digest differs from the tarball's (mitigates T-07-SC).
- **Web-root parity:** documented the convention that `index.html` is the served root with `lib/` as its sibling, so the `../lib/kaplay.mjs` import resolves identically in dev (`cd src`) and in the container (flatten `src/` to web root, plan 07-02).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. Kaplay downloaded successfully from the primary source (unpkg) on the first attempt; the fallback chain (jsdelivr / npm tarball) was not needed. `node --check src/main.js` confirmed the shell module is syntactically valid.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `scene('game')` draws only `text("hello")` | `src/main.js` | Intentional, plan-specified smoke test proving the vendored engine initializes. Phase 8 (Platformer Core) replaces it with real run/jump/platform game code. Documented in PLAN task 2 `<done>`. |

`assets/.gitkeep` is an empty placeholder by design (folder tracking); sprites/audio are added in phases 8–9.

## User Setup Required
None - no external service configuration required in this plan. (Live Dokploy deployment is set up later from `docs/DEPLOY.md`, added in plan 07-02.)

## Next Phase Readiness
- **Ready for plan 07-02:** the static set (`src/`, `lib/`, `assets/`) exists and is structured for the Dockerfile to `COPY` (flatten `src/` to web root, `lib/` and `assets/` beside it). 07-02 adds `docker/Dockerfile`, `docker/nginx.conf` (with the `.mjs` MIME fix), and `docs/DEPLOY.md`.
- **Ready for Phase 8:** the game shell boots the vendored engine; Phase 8 replaces the smoke-test scene with the platformer.
- **Not yet verified in a browser/container:** the "canvas renders 'hello' with a clean console" check is deferred to plan 07-02's container `curl` verification and a browser pass (per PLAN verification note). Structural gates and `node --check` all pass.

## Self-Check: PASSED

All 7 declared files exist on disk; all 3 task commits (`a9a7363`, `463c9b2`, `46e5276`) present in git history.

---
*Phase: 07-project-setup-deployment*
*Completed: 2026-06-22*
