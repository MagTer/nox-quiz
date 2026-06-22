# Phase 7: Project Setup & Deployment - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Package the new multi-file game project as static files served by a Docker (nginx) container, with a clean no-JS-build multi-file layout and Kaplay 3001.0.19 vendored locally. Verify the packaging works by building and serving the container locally; prepare Dokploy deployment configuration and docs for the live deploy once the host is available. This front-loads the riskiest infra (packaging, hosting, Kaplay version churn, `file://` asset-loading block) before any game code exists.

Delivers: SETUP-01 (static files via Docker/nginx, no backend), SETUP-02 (Dokploy deploy config + reachable-URL path — live deploy deferred until host is up), SETUP-03 (Kaplay 3001.0.19 vendored locally, no CDN/npm), SETUP-04 (clean multi-file layout, no build step, documented local dev server).

</domain>

<decisions>
## Implementation Decisions

### Project Structure & Layout
- Top-level layout: `src/` (index.html + `js/` ES modules), `assets/` (sprites/audio), `vendor/` (kaplay), `docker/` (Dockerfile + nginx.conf), `docs/`.
- nginx web root points at the served static set rooted on `src/` with `vendor/` and `assets/` referenced/copied under it — no `dist/`, no build step.
- JS module style: native ES modules (`<script type="module">`), no bundler.
- The v2 `math-lab.html` is **moved to `archive/`** (out of repo root) — preserved untouched as the reference source for the Phase 10 math-brain port.

### Kaplay Vendoring & Dev Server
- Vendor Kaplay 3001.0.19 as `kaplay.mjs` (ESM) into `vendor/kaplay/`, with a header comment recording source URL + exact version.
- Dev server: `python3 -m http.server 8000` documented in README, run from the web root. Development only — she plays via the hosted URL.
- Add a small `file://` protocol guard that shows a "run via local server / visit the URL" message if the page is opened as a local file (prevents silent sprite/module load failure).
- Pin enforcement via version + source comments in the vendored file and README; no lockfile (no npm).

### Docker / nginx Packaging & Deploy Scope
- Docker base image: `nginx:alpine`; copy static files to `/usr/share/nginx/html`; custom `nginx.conf` ensuring correct MIME type for `.mjs` (`application/javascript`) so ES modules load.
- **Phase 7 verifies locally**: build the image and `curl` the running container to confirm it serves `index.html` and a `.mjs` with the correct `Content-Type`.
- **Live Dokploy deploy is DEFERRED** — the Dokploy host is not live yet (expected up in a couple of days). This phase prepares the deploy config and writes Dokploy deploy docs; the actual live deploy is triggered by the user once the host is available.
- Placeholder content to exercise the pipeline: a minimal "Math Lab — loading" index plus a tiny Kaplay canvas smoke test confirming the vendored library initializes from the served files.

### Claude's Discretion
- Exact nginx.conf directives, Dockerfile layering, and README wording are at Claude's discretion within the decisions above.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `math-lab.html` (v2.0, 1,976 LOC, currently at repo root → to be moved to `archive/`) — contains the tuned math brain (weighted 6–9 question selection, PlayerState, QuestionSelector, CONFIG). Reference only this phase; ported in Phase 10.

### Established Patterns
- v1/v2 used localStorage with versioned migration and try-catch around `setItem` (QuotaExceededError handling) — pattern to carry forward in Phase 11.
- Dark grunge palette already defined (bg `#0a0a0a`, text `#e8e8e8`, accent `#00ff88`); WCAG AA verified.

### Integration Points
- The served `src/index.html` is the new game shell entry point; subsequent phases (8–12) build into `src/js/` and `assets/`.
- `docker/` config is the deployment surface Dokploy consumes once live.

</code_context>

<specifics>
## Specific Ideas

- Dokploy host is not yet provisioned (ETA ~2 days from 2026-06-22). Treat the live deploy as a follow-up the user triggers; everything else (Dockerfile, nginx.conf, local container verification, deploy docs) is in scope now.
- The `file://` CORS asset-loading block is a known critical pitfall — hosting over HTTP is the mitigation; the protocol guard is the safety net for accidental local-file opens.
- Kaplay/Kaboom version churn is a known critical pitfall — pin 3001.0.19 exactly and code against that version's docs only.

</specifics>

<deferred>
## Deferred Ideas

- Live Dokploy deployment to the production URL — deferred until the Dokploy host is provisioned (~2 days). User triggers it using the docs/config produced this phase.
- Audio assets — deferred per milestone scope.

</deferred>
