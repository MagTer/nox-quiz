---
phase: 07-project-setup-deployment
plan: 02
subsystem: infra
tags: [docker, nginx, static-site, mime, esm, dokploy, deploy]

# Dependency graph
requires:
  - "07-01: static set (src/, lib/kaplay.mjs, assets/) to COPY into the image"
provides:
  - "docker/nginx.conf — nginx server block with the .mjs -> application/javascript MIME fix (both js and mjs re-declared), nosniff, server_tokens off, no autoindex, try_files fallback"
  - "docker/Dockerfile — single-stage nginx:alpine image copying ONLY src/ (flattened to web root) + lib/ + assets/, custom config to conf.d/default.conf"
  - "docs/DEPLOY.md — ordered Dokploy deploy checklist (Dockerfile path, context ., port 80, domain+HTTPS, prod .mjs MIME verify)"
  - "Locally-built container proven by curl: index 200/text/html, lib/kaplay.mjs 200/application/javascript (the SETUP-01 MIME gate)"
affects: [08-platformer-core, 09-level-build-cc0-assets, 10-math-gate-integration]

# Tech tracking
tech-stack:
  added: ["nginx:alpine (static file server, single-stage container)"]
  patterns:
    - "types{} re-declares js alongside mjs because a types block REPLACES (not merges) the inherited mapping for listed extensions — omitting js regresses .js to octet-stream (Pitfall 4)"
    - "src/ flattened to web root so prod URLs (/, /main.js) and the ../lib import resolve identically to dev (cd src && python3 -m http.server)"
    - "Verification hits the container with curl, not Python's dev server, because http.server already maps .mjs and would hide the bug"
    - "Copy only the static set into the image — never .git, archive/, .planning/, or docker/ config (info-disclosure mitigation)"

key-files:
  created:
    - docker/nginx.conf
    - docker/Dockerfile
    - docs/DEPLOY.md
  modified: []

key-decisions:
  - "Custom Dockerfile over Dokploy Static preset — keeps the .mjs MIME fix under our control (the single line of real engineering this phase hinges on)"
  - "Re-declared js in the types{} block alongside mjs to avoid regressing .js to octet-stream; verified via curl on /main.js"
  - "Did not pin nginx:stable-alpine — accepted base-image drift (T-07-05) as low risk for a static site, per the threat register"
  - "Live Dokploy deploy DEFERRED — config + DEPLOY.md satisfy SETUP-02 now; the live deploy is a documented user-triggered follow-up, not a phase blocker"

patterns-established:
  - "Container-not-dev-server verification for MIME-sensitive static serving"
  - "Single-stage nginx:alpine static container with explicit ESM MIME mapping + minimal hardening (nosniff, server_tokens off, no autoindex)"

requirements-completed: [SETUP-01, SETUP-02]

# Metrics
duration: ~2min
completed: 2026-06-22
status: complete
---

# Phase 07 Plan 02: Docker/nginx Static Container + Dokploy Deploy Docs Summary

**Packaged the static game set into a single-stage nginx:alpine container with the critical `.mjs -> application/javascript` MIME fix, proved it locally with curl against the running container (index 200/text/html, kaplay.mjs 200/application/javascript, no octet-stream), and wrote the ordered Dokploy deploy checklist — live deploy deferred to a user-run follow-up.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-22T19:28:10Z
- **Completed:** 2026-06-22T19:29:39Z
- **Tasks:** 3
- **Files modified:** 3 (3 created)

## Accomplishments
- Wrote `docker/nginx.conf`: server block on port 80, root `/usr/share/nginx/html`, `include mime.types` + a `types { application/javascript js mjs; }` block mapping **both** `js` and `mjs` (so `.js` does not regress), `default_type application/octet-stream`, `try_files $uri $uri/ /index.html`, no autoindex, plus `X-Content-Type-Options: nosniff` and `server_tokens off` hardening (SETUP-01, T-07-03/T-07-04).
- Wrote `docker/Dockerfile`: single-stage `nginx:alpine`, copies the custom config to `conf.d/default.conf`, copies **only** `src/` (flattened to web root) + `lib/` + `assets/` — no `.git`, `archive/`, `.planning/`, or `docker/` config reaches the image (T-07-02).
- Built, ran, and curl-verified the container against the **running container** (not the dev server): index `200`/`text/html`, `lib/kaplay.mjs` `200`/`application/javascript` (NOT octet-stream), non-empty `.mjs` body, and confirmed `/main.js` stays `application/javascript` (no `.js` regression). `Server: nginx` had no version banner (server_tokens off). Container stopped and image removed afterward — no leaks.
- Wrote `docs/DEPLOY.md`: ordered Dokploy checklist (new Application → Git `main` → Build Type Dockerfile, path `docker/Dockerfile`, context `.` → no secrets → deploy → Domains tab port 80 + HTTPS/Let's Encrypt → browser smoke test → prod `.mjs` MIME curl), with the custom-Dockerfile rationale and the deferred-deploy note (SETUP-02).

## Task Commits

Each task was committed atomically:

1. **Task 1: nginx.conf (.mjs MIME fix) + nginx:alpine Dockerfile** — `7287be9` (feat)
2. **Task 2: build/run/curl-verify the container locally** — no new files; verification gate against Task 1's committed config (all curl assertions passed)
3. **Task 3: docs/DEPLOY.md Dokploy checklist** — `93549a5` (docs)

**Plan metadata:** _(final docs commit below)_

## Files Created/Modified
- `docker/nginx.conf` - nginx server config; `.mjs -> application/javascript` MIME fix (js + mjs), nosniff, server_tokens off, no autoindex, try_files fallback
- `docker/Dockerfile` - single-stage nginx:alpine; custom config to conf.d/default.conf; copies only src/ (flattened) + lib/ + assets/
- `docs/DEPLOY.md` - ordered Dokploy deploy checklist + local-verification appendix + custom-Dockerfile rationale

## Decisions Made
- **Custom Dockerfile over Static preset:** keeps the `.mjs` MIME mapping under our control — the single line of real engineering this phase hinges on. Documented in DEPLOY.md.
- **Re-declare `js` in the types block:** a `types{}` block replaces (does not merge with) inherited mappings for the listed extensions, so listing only `mjs` would silently regress `.js` to octet-stream (Pitfall 4). Verified by curling `/main.js` → `application/javascript`.
- **Accept base-image drift (T-07-05):** used `nginx:alpine` rather than pinning `nginx:stable-alpine`; acceptable for a static site per the threat register (low risk).
- **Defer live deploy:** the live Dokploy deploy is a documented user-triggered follow-up; the config + DEPLOY.md satisfy SETUP-02 now and the phase does not block on a reachable URL.

## Deviations from Plan

None - plan executed exactly as written.

## Container Verification (the SETUP-01 gate)

Built and run against Docker 29.1.3 in this environment (no sudo required):

| Check | Result |
|-------|--------|
| `docker build -f docker/Dockerfile -t mathlab:phase7 .` | succeeded |
| `curl -sI http://localhost:8080/` | `200 OK`, `Content-Type: text/html` |
| `curl -sI http://localhost:8080/lib/kaplay.mjs` | `200 OK`, `Content-Type: application/javascript` (NOT octet-stream) |
| `.mjs` body first bytes | `/*\n * Kaplay 3001.0.19 — vendored...` (non-empty) |
| `curl -sI http://localhost:8080/main.js` | `200 OK`, `application/javascript` (no `.js` regression) |
| hardening headers | `X-Content-Type-Options: nosniff` present; `Server: nginx` (no version) |
| image contents | `index.html main.js 50x.html assets/ lib/` only — no `.git`/`archive/`/`.planning/`/docker config |
| cleanup | container stopped (no leak); image removed |

## Issues Encountered
None. Docker was available without sudo; the build pulled `nginx:alpine` and all curl assertions passed on the first run.

## Manual Follow-ups (non-blocking)
- **SETUP-03 browser eyeball:** open `http://localhost:8080/` (or the deployed URL) and confirm the Kaplay canvas draws "hello" with a clean DevTools console. The curl gate proves the engine module is served with the correct MIME and a non-empty body; the visual render is a human check.
- **Live Dokploy deploy:** run `docs/DEPLOY.md` once the host is provisioned (~2 days out) to bring the game live at a web URL and verify the prod `.mjs` MIME.

## Known Stubs
None. The deliverables are complete deploy config + docs; the only deferred item is the live deploy itself, which is intentional and documented (SETUP-02 deferred-deploy decision).

## Next Phase Readiness
- **Phase 8 (Platformer Core):** the container reliably serves the ESM game shell with the correct MIME, so iterative game code added to `src/main.js` will be served identically in dev and in the container.
- **SETUP-02 follow-up:** the user runs `docs/DEPLOY.md` when the Dokploy host is live.

## Self-Check: PASSED

All 3 declared files exist on disk; both task commits (`7287be9`, `93549a5`) present in git history (Task 2 wrote no files by design).

---
*Phase: 07-project-setup-deployment*
*Completed: 2026-06-22*
