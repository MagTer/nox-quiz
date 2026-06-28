# Phase 7: Project Setup & Deployment - Research

**Researched:** 2026-06-22
**Domain:** Static-site packaging (Docker/nginx) + ESM library vendoring (Kaplay) + Dokploy deploy config
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
**Project Structure & Layout**
- Top-level layout: `src/` (index.html + JS modules), `assets/` (sprites/audio), vendored kaplay folder, `docker/` (Dockerfile + nginx.conf), `docs/`.
- nginx web root points at the served static set rooted on `src/` with the vendored library and `assets/` referenced/copied under it — no `dist/`, no build step.
- JS module style: native ES modules (`<script type="module">`), no bundler.
- The v2 `math-lab.html` is **moved to `archive/`** (out of repo root) — preserved untouched as the reference source for the Phase 10 math-brain port.

**Kaplay Vendoring & Dev Server**
- Vendor Kaplay 3001.0.19 as `kaplay.mjs` (ESM), with a header comment recording source URL + exact version.
- Dev server: `python3 -m http.server 8000` documented in README, run from the web root. Development only.
- Add a small `file://` protocol guard that shows a "run via local server / visit the URL" message if the page is opened as a local file.
- Pin enforcement via version + source comments in the vendored file and README; no lockfile (no npm).

**Docker / nginx Packaging & Deploy Scope**
- Docker base image: `nginx:alpine`; copy static files to `/usr/share/nginx/html`; custom `nginx.conf` ensuring correct MIME type for `.mjs` (`application/javascript`) so ES modules load.
- **Phase 7 verifies locally**: build the image and `curl` the running container to confirm it serves `index.html` and a `.mjs` with the correct `Content-Type`.
- **Live Dokploy deploy is DEFERRED** — Dokploy host not live yet (~2 days). This phase prepares the deploy config and writes Dokploy deploy docs; the actual live deploy is triggered by the user later.
- Placeholder content: a minimal "Math Lab — loading" index plus a tiny Kaplay canvas smoke test confirming the vendored library initializes from the served files.

### Claude's Discretion
- Exact nginx.conf directives, Dockerfile layering, and README wording are at Claude's discretion within the decisions above.

### Deferred Ideas (OUT OF SCOPE)
- Live Dokploy deployment to the production URL — deferred until the Dokploy host is provisioned (~2 days). User triggers it using the docs/config produced this phase.
- Audio assets — deferred per milestone scope.

### ⚠️ Layout discrepancy resolved (folder name for vendored lib)
CONTEXT.md says the vendored Kaplay lives in `vendor/kaplay/` and modules in `src/js/`. The **ROADMAP success criterion 4** (the verification gate) says the layout is `HTML + src/ JS modules + lib/ + assets/`. Per the phase orchestrator's explicit instruction, **defer to `lib/`** so the phase passes its own verification criteria. This research therefore standardizes on:
- Vendored Kaplay → `lib/kaplay.mjs`
- ES modules → `src/` (e.g. `src/main.js`)
- Import path → `import kaplay from "../lib/kaplay.mjs"` (relative to `src/`)

The planner should use `lib/` and note the CONTEXT.md `vendor/` mention as superseded.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SETUP-01 | Game packaged as static files served by Docker (nginx) — no backend/DB/server logic | `nginx:alpine` Dockerfile copying static files to `/usr/share/nginx/html`; verified locally via `docker build` + `docker run` + `curl` (see Code Examples). No app server needed. |
| SETUP-02 | Deploys via Dokploy, reachable at a web URL (no install/launcher/local files) | Dokploy consumes the same Dockerfile (Dockerfile path + context `.` + domain on port 80). Live deploy DEFERRED; phase produces `docs/DEPLOY.md` checklist (see Architecture Patterns + Dokploy section). |
| SETUP-03 | Kaplay pinned 3001.0.19 vendored locally — no CDN, no npm | Verified: `kaplay@3001.0.19` ships `dist/kaplay.mjs` (default export). Download from unpkg/jsdelivr/npm tarball, commit to `lib/kaplay.mjs` with source+version header. ESM `import kaplay from "../lib/kaplay.mjs"`. |
| SETUP-04 | Clean multi-file layout (HTML + JS modules + assets), no JS build step; local dev server documented | Native ES modules via `<script type="module">`; `src/`, `lib/`, `assets/`. `python3 -m http.server 8000` (python3 3.12.3 confirmed available) documented in README for dev only. `file://` guard prevents accidental local-file opens. |
</phase_requirements>

## Summary

Phase 7 is pure infrastructure: turn an empty repo into a static-file project that (a) loads a locally-vendored Kaplay 3001.0.19 ESM build and renders a `scene("game")` "hello" canvas, (b) is served by an `nginx:alpine` Docker container with the one non-obvious config the whole phase hinges on — an explicit `.mjs → application/javascript` MIME mapping — and (c) ships a Dokploy deploy config plus a docs checklist the user runs once the host is live. Every piece was verified this session against live registries and docs; confidence is HIGH across the board.

There are exactly **two landmines**, both already identified in STATE.md and both fully neutralizable here. **(1) nginx does not map `.mjs`.** Confirmed against the current upstream `nginx/conf/mime.types`: it contains `application/javascript js;` and *no* `mjs` entry, so a `.mjs` is served as `application/octet-stream`, which browsers reject under strict module MIME checking ("Failed to load module script"). A `types { application/javascript mjs; }` block in `nginx.conf` fixes it. **(2) Kaplay version churn.** Pin `3001.0.19` exactly: vendor the file, comment the source URL + version at the top, and code only against the 3001 API. Avoiding npm/CDN at runtime makes the pin immutable.

The `file://` asset-loading block (the third historical pitfall) is structurally solved by hosting over HTTP; the JS protocol guard is the belt-and-suspenders for accidental double-clicks. Because the Dokploy host is ~2 days out, the live deploy is deferred to a user-run checklist — Phase 7's *verifiable* deliverable is a locally-built container that `curl` proves serves `index.html` (200, `text/html`) and `kaplay.mjs` (200, `application/javascript`).

**Primary recommendation:** Lay out `src/` + `lib/` + `assets/` + `docker/` + `docs/`, vendor `lib/kaplay.mjs` from `https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs` with a header comment, write an `nginx.conf` whose root is the static set and which adds the `.mjs` MIME type, build/run/`curl`-verify the container locally, add the `file://` guard, write `docs/DEPLOY.md` for Dokploy, and `git mv math-lab.html archive/`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Serving HTML/JS/assets | CDN / Static (nginx) | — | No dynamic content; pure file serving. |
| `.mjs` MIME correctness | CDN / Static (nginx config) | — | Module loading is a server-header concern, not client code. |
| Kaplay engine init + canvas | Browser / Client | — | Runs entirely client-side from the vendored `.mjs`. |
| `file://` protocol guard | Browser / Client | — | Client-side feature detection (`location.protocol`). |
| Container build/packaging | Build (Dockerfile) | — | Single-stage copy; no compilation/bundling. |
| Reachable URL / TLS / routing | Platform (Dokploy) | CDN / Static | Dokploy assigns domain + proxies to container port 80. |
| Dev-time serving | Browser / Client (dev only) | — | `python3 -m http.server` over HTTP to dodge `file://`. |

## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Kaplay | `3001.0.19` (pinned) | 2D game engine (canvas, scenes, physics later) | `[VERIFIED: npm registry]` Project-locked decision; ships ESM `dist/kaplay.mjs` with a default export. |
| nginx (alpine) | `nginx:alpine` (resolves to current stable, e.g. 1.31.x-alpine) | Static file server in the container | `[VERIFIED: docker hub]` De-facto standard for static hosting; tiny image; Dokploy-friendly. |
| Native ES Modules | ES2020+ | `<script type="module">` loading, no bundler | `[CITED: ./.claude/CLAUDE.md]` Project no-build constraint; supported all modern browsers. |
| python3 http.server | 3.12.3 (local) | Dev-only static server over HTTP | `[VERIFIED: local]` Zero-install (ships with Python); documented in CLAUDE.md. |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Docker | 29.1.3 (local) | Build + run the image to verify locally | `[VERIFIED: local]` Required for the SETUP-01 local verification gate. |
| curl | present | Assert HTTP status + `Content-Type` on `index.html` and `.mjs` | `[VERIFIED: local]` The objective verification of the MIME fix. |
| Dokploy | host (deferred) | Production deploy from the Dockerfile | When the host is provisioned (~2 days); config prepared now. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `lib/kaplay.mjs` (vendored) | CDN `<script src="unpkg…">` | CDN breaks offline + the no-CDN locked decision; rejected. |
| `nginx:alpine` | `nginx:stable-alpine` | Pin `nginx:stable-alpine` if you want a frozen nginx line; either works, MIME fix identical. |
| `python3 -m http.server` (dev) | `npx serve`, `php -S`, VS Code Live Server | python3 is already installed (3.12.3) and needs no npm; matches CLAUDE.md. |
| nginx container | Dokploy "Static" build type (Nixpacks/Heroku-static) | Custom Dockerfile gives explicit control of the `.mjs` MIME fix; the Static preset's MIME behavior is not under our control — **use the Dockerfile**. |

**Installation (vendoring — done once, committed):**
```bash
# Download the exact pinned ESM build into lib/ (no npm install, no lockfile)
mkdir -p lib
curl -fSL "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs" -o lib/kaplay.mjs
# Then prepend a header comment (see Code Examples) recording source URL + version.
```
**Canonical download sources (all verified 200 this session):**
- unpkg: `https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs` (serves `text/javascript`)
- jsdelivr: `https://cdn.jsdelivr.net/npm/kaplay@3001.0.19/dist/kaplay.mjs` (serves `application/javascript`)
- npm tarball: `https://registry.npmjs.org/kaplay/-/kaplay-3001.0.19.tgz` → extract `package/dist/kaplay.mjs`

**Version verification (run this session):**
```
npm view kaplay@3001.0.19 module   → ./dist/kaplay.mjs
npm view kaplay@3001.0.19 exports  → import → ./dist/kaplay.mjs (default), require → ./dist/kaplay.cjs
file size: 188,534 bytes (minified ESM)
export footer: export{a as _k, hw as default, ic as kaplay}
```
So **both** `import kaplay from "../lib/kaplay.mjs"` (default) and `import { kaplay } from "../lib/kaplay.mjs"` (named) work. Use the default import to match the locked decision and Kaplay docs.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| kaplay@3001.0.19 | npm | published 2025-06-15 | ~8,475/wk | github.com/kaplayjs/kaplay | OK | Approved (vendored, not npm-installed) |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

Notes: `package-legitimacy check` returned `OK` (exists, official repo, `deprecated:false`, `postinstall:null`). Even so, the runtime install vector is zero — Kaplay is **vendored as a committed file**, never `npm install`ed at play time, which eliminates supply-chain risk after the one-time download. Confirm the committed file's SHA against the npm dist shasum if desired (`npm view kaplay@3001.0.19 dist.shasum` = `39506c6872813c443a3b2963f44d37a9e9d3a3a2` for the *tarball*, not the single file — to pin the single file, record the `content-digest` from unpkg or compute your own `sha256sum lib/kaplay.mjs` and note it in the header comment).

## Architecture Patterns

### System Architecture Diagram

```
                          ┌──────────────────────────────────────────────┐
   DEV (local only)       │  python3 -m http.server 8000  (run in repo)   │
   double-click .html ──X │  http://localhost:8000/src/index.html         │
   (file:// → guard       │        │ serves over HTTP (no file:// block)   │
    shows message)        └────────┼───────────────────────────────────────┘
                                   │
                                   ▼
   PROD (deferred)   browser ──▶ Dokploy domain (TLS) ──▶ proxy :80 ──▶ nginx container
                                                                          │
                          ┌───────────────────────────────────────────────┘
                          ▼
              ┌─────────────────────────────────────────────┐
              │  nginx:alpine  (root: /usr/share/nginx/html) │
              │   ├─ index.html        → text/html           │
              │   ├─ src/main.js        → application/js      │
              │   ├─ lib/kaplay.mjs     → application/js  ◀── types{} fix REQUIRED
              │   └─ assets/*           → image/* etc.        │
              └─────────────────────────────────────────────┘
                          │
                          ▼  index.html loads <script type="module" src="src/main.js">
              ┌─────────────────────────────────────────────┐
              │  Browser: main.js                            │
              │   1. file:// guard (location.protocol check) │
              │   2. import kaplay from "../lib/kaplay.mjs"  │
              │   3. kaplay({ canvas })                       │
              │   4. scene("game", () => add([text("hello")])│
              │   5. go("game")  → canvas renders "hello"     │
              └─────────────────────────────────────────────┘
```

### Recommended Project Structure
```
.
├── src/
│   ├── index.html        # entry shell; <script type="module" src="main.js">
│   └── main.js           # file:// guard + import kaplay + smoke-test scene
├── lib/
│   └── kaplay.mjs        # vendored 3001.0.19 (header comment: source URL + version + sha)
├── assets/
│   └── .gitkeep          # sprites/audio land here in phases 8–9
├── docker/
│   ├── Dockerfile        # nginx:alpine, copies static set to web root
│   └── nginx.conf        # .mjs MIME fix + SPA-safe root
├── docs/
│   └── DEPLOY.md         # Dokploy deploy checklist (user runs when host is live)
├── archive/
│   └── math-lab.html     # moved verbatim from repo root (v2 reference for Phase 10)
└── README.md             # dev server instructions + pin note + layout map
```
**Web-root question (resolve in plan):** index.html is under `src/`. Two clean options — the planner should pick one and keep paths consistent:
- **Option A (recommended): repo root is the web root.** `COPY src lib assets index? …` — keep `index.html` at `src/index.html` and set nginx to serve the repo root, so the served URL is `/src/index.html`. Simpler `docker run -v $(pwd):...` dev parity, but the URL has `/src/`.
- **Option B (cleaner URL): flatten on copy.** Dockerfile copies `src/* → /usr/share/nginx/html/`, `lib/ → /usr/share/nginx/html/lib/`, `assets/ → /usr/share/nginx/html/assets/`, so the public URL is `/` and import path stays `lib/kaplay.mjs` from index. This matches "she just visits the URL" best. **Recommended for prod parity.** Ensure the dev server is run such that the same relative paths resolve (run `python3 -m http.server` from inside `src/`'s parent layout, or document the `/src/` URL for dev). Document whichever you pick in README so dev and prod paths match.

### Pattern 1: nginx `.mjs` MIME fix (THE critical pattern)
**What:** Add a `types` block that maps `.mjs` to a JavaScript MIME type.
**When to use:** Always, for any nginx serving ES modules with the `.mjs` extension.
**Example:**
```nginx
# docker/nginx.conf  — [CITED: semisignal.com/serving-mjs-files-with-nginx, MDN Server-side MIME]
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Inherit nginx's default mime.types, then OVERRIDE/extend for .mjs.
    # Default mime.types has `application/javascript js;` but NO mjs entry,
    # so .mjs would be served as application/octet-stream and rejected by the
    # browser's strict module MIME check. This block fixes it.
    include /etc/nginx/mime.types;
    types {
        application/javascript js mjs;
    }
    default_type application/octet-stream;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
Notes:
- A `types {}` block **replaces** the inherited mapping for the extensions it lists, so re-declare `js` alongside `mjs` (as above) to avoid dropping `.js`. Re-including the full set then a targeted override is the safest pattern.
- `text/javascript` is equally valid per the HTML spec (the WHATWG-blessed value); `application/javascript` is what nginx upstream uses. Either passes the module MIME check.

### Pattern 2: ESM import of vendored Kaplay + smoke-test scene
**What:** Load the vendored engine and prove it initializes by drawing "hello".
**When to use:** The Phase 7 placeholder; replaced by real game code in Phase 8+.
**Example:**
```javascript
// src/main.js — [CITED: kaplayjs.com/docs/guides/starting + guides/scenes]
import kaplay from "../lib/kaplay.mjs";

// kaplay() injects scene/add/text/go globally by default (global: true).
const k = kaplay({
  width: 640,
  height: 360,
  background: "#0a0a0a",        // project dark-grunge bg
  canvas: document.querySelector("#game"),
});

scene("game", () => {
  add([
    text("hello", { size: 48 }),
    pos(320, 180),
    anchor("center"),
    color(0, 255, 136),         // project accent #00ff88
  ]);
});

go("game");
```
Verified API facts (this session): `kaplay@3001` `kaplay()` returns a context **and** by default exposes `scene`, `add`, `text`, `pos`, `go`, etc. globally. `import kaplay from "…kaplay.mjs"` resolves to the default export.

### Pattern 3: `file://` protocol guard
**What:** Detect a local-file open and show a clear instruction instead of a silent blank canvas.
**When to use:** Top of `main.js`, before importing/initializing Kaplay.
**Example:**
```javascript
// src/main.js (place BEFORE the kaplay import side-effects matter / or at top of module)
if (location.protocol === "file:") {
  document.body.innerHTML =
    '<div style="color:#e8e8e8;background:#0a0a0a;font:16px/1.5 system-ui;' +
    'padding:2rem;max-width:42rem;margin:auto">' +
    '<h1 style="color:#00ff88">Run via a web server</h1>' +
    '<p>This page must be served over HTTP, not opened as a local file.</p>' +
    '<p>For development, run <code>python3 -m http.server 8000</code> in the project ' +
    'folder, then open <code>http://localhost:8000/</code>.</p>' +
    '<p>Or just visit the hosted URL.</p></div>';
  throw new Error("file:// protocol — refusing to load (see on-screen message).");
}
```
Caveat: a static `import` at the top of the module is hoisted and runs before this `if` if both are in the same module. To guarantee the guard wins, put the guard in `index.html` inline `<script>` (non-module) that gates whether `main.js` is loaded, **or** make the kaplay import dynamic: `const { default: kaplay } = await import("../lib/kaplay.mjs");` after the guard. **Recommended:** inline guard in `index.html` head; cleanest and runs first.

### Pattern 4: single-stage static Dockerfile
**What:** Copy the static set into the nginx web root with the custom config.
**Example:**
```dockerfile
# docker/Dockerfile — [VERIFIED: docker hub nginx:alpine] no build step, single stage
FROM nginx:alpine

# Replace the default site config with ours (the .mjs MIME fix lives here).
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static set. (Option B: flatten src to web root for clean URLs.)
COPY src/   /usr/share/nginx/html/
COPY lib/   /usr/share/nginx/html/lib/
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 80
# nginx:alpine's default CMD already runs nginx in the foreground.
```
Build context must be the **repo root** (so `COPY src/ …` resolves), with `-f docker/Dockerfile`. Tell Dokploy: Dockerfile path `docker/Dockerfile`, context `.`.

### Anti-Patterns to Avoid
- **Relying on nginx defaults for `.mjs`** — silently breaks module loading in prod even though it "worked" on `python3 http.server` (Python's server *does* map `.mjs`). This divergence is exactly why local verification must hit the **container**, not just the dev server.
- **Using the Dokploy "Static" preset instead of the Dockerfile** — you lose control of the `.mjs` MIME mapping. Use the custom Dockerfile.
- **`.js` extension for modules to dodge the MIME issue** — works, but the locked decision and Kaplay's own dist use `.mjs`; fix the server instead of renaming.
- **Top-level static `import` before the `file://` guard in the same module** — the import is hoisted; the guard never blocks it. Gate in HTML or use dynamic import.
- **Pinning Kaplay loosely (`^3001` / `latest` / CDN)** — reintroduces the version-churn pitfall. Vendor the exact file.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Static file serving | A Node/Python app server | `nginx:alpine` static container | No backend needed (SETUP-01); nginx is battle-tested. |
| Correct content types | Per-file header logic | nginx `mime.types` + one `types{}` override | nginx already maps everything except `.mjs`. |
| TLS / domain / routing | Custom reverse proxy | Dokploy domain assignment | Platform handles certs + proxy to :80. |
| 2D game engine | Hand-rolled canvas loop | Vendored Kaplay 3001.0.19 | Locked decision; physics/scenes come free in later phases. |
| Dev HTTP server | Custom server script | `python3 -m http.server` | Already installed; zero deps. |

**Key insight:** The entire phase is "wire standard tools correctly," not "write code." The single line of real engineering is the `.mjs` MIME mapping.

## Runtime State Inventory

> This phase is partly a refactor/move (relocating `math-lab.html`), so the inventory applies to that move.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Phase 7 ships placeholder only; no localStorage keys written yet. v2's localStorage key belongs to the old `math-lab.html`; moving the file to `archive/` does not touch browser storage (different origin/use, and it's reference-only). | None |
| Live service config | Dokploy app config does not exist yet (host not provisioned). Created later from `docs/DEPLOY.md`. | None now; user creates the Dokploy app later |
| OS-registered state | None — no scheduled tasks, services, or daemons. Dev server is run manually. | None |
| Secrets / env vars | None — static site, no secrets, no env vars, no `.env`. Dokploy needs none for this phase. | None |
| Build artifacts | None — no build step, no `dist/`, no `node_modules` (Kaplay is vendored, not installed). The only "artifact" is the committed `lib/kaplay.mjs`. | None |

**The move operation (verified):** `git ls-files` shows `math-lab.html` is the only tracked non-planning file. Use `git mv math-lab.html archive/math-lab.html` so history is preserved and the file is relocated verbatim (no edits). After the move, the repo root has no loose HTML — clean slate for the new layout.

## Common Pitfalls

### Pitfall 1: nginx serves `.mjs` as `application/octet-stream`
**What goes wrong:** ES module fails to load in the browser with "Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of application/octet-stream." Blank canvas, no game.
**Why it happens:** nginx's bundled `mime.types` (verified against current upstream this session) maps `application/javascript js;` but has **no `mjs` entry**; unknown extensions fall back to `default_type` (octet-stream). Browsers enforce strict MIME on module scripts.
**How to avoid:** The `types { application/javascript js mjs; }` block in `nginx.conf` (Pattern 1).
**Warning signs:** Works on `python3 -m http.server` (Python maps `.mjs`) but breaks in the container — *verify against the container with curl, not just the dev server.*

### Pitfall 2: Kaplay/Kaboom version churn
**What goes wrong:** Code written against a different Kaplay/Kaboom version uses renamed/removed APIs; upgrading silently breaks scenes.
**Why it happens:** Kaplay (formerly Kaboom) has churned APIs across majors; docs online mix versions.
**How to avoid:** Vendor `3001.0.19` exactly, header-comment the source URL + version, code only against 3001 docs (`kaplayjs.com/docs`), never `npm install` at play time.
**Warning signs:** Any doc/snippet using `kaboom(` instead of `kaplay(`, or function names not present in 3001.

### Pitfall 3: `file://` silent asset/module failure
**What goes wrong:** Double-clicking the HTML opens `file://…`; ES module imports and asset fetches are blocked by CORS/origin rules; blank screen, cryptic console errors.
**Why it happens:** `file://` has a null/opaque origin; module loading and `fetch` are restricted.
**How to avoid:** Host over HTTP (prod) / `python3 -m http.server` (dev). The protocol guard (Pattern 3) shows a clear message on accidental local opens.
**Warning signs:** URL bar shows `file://`; console shows CORS or "Cross origin requests are only supported for HTTP."

### Pitfall 4: `types {}` block drops the `.js` mapping
**What goes wrong:** Adding a `types { application/javascript mjs; }` block *without* re-declaring `js` can shadow the inherited `js` mapping in that scope, so `.js` files get `octet-stream`.
**Why it happens:** A `types` directive defines a complete map at its level; it doesn't merge field-by-field with the include in all nginx versions/scopes.
**How to avoid:** Declare both: `types { application/javascript js mjs; }` (Pattern 1 already does this).
**Warning signs:** `src/main.js` itself fails the module MIME check after the "fix."

### Pitfall 5: Build context / Dockerfile path mismatch
**What goes wrong:** `COPY src/ …` fails ("not found") because the build context is `docker/` instead of repo root.
**How to avoid:** Build with `docker build -f docker/Dockerfile -t mathlab .` (context `.` = repo root). Tell Dokploy: Dockerfile path `docker/Dockerfile`, context `.`.

## Code Examples

### Local container verification (the SETUP-01 gate)
```bash
# From repo root. Verified tooling: Docker 29.1.3, curl present.
docker build -f docker/Dockerfile -t mathlab:phase7 .
docker run -d --rm -p 8080:80 --name mathlab mathlab:phase7

# 1) index.html → expect 200 + text/html
curl -sI http://localhost:8080/ | grep -iE "HTTP/|content-type"

# 2) the .mjs → expect 200 + application/javascript (THE assertion)
curl -sI http://localhost:8080/lib/kaplay.mjs | grep -iE "HTTP/|content-type"

# 3) confirm body actually serves (first bytes of the engine)
curl -s http://localhost:8080/lib/kaplay.mjs | head -c 60; echo

docker stop mathlab
```
Pass criteria: line 1 shows `200` + `text/html`; line 2 shows `200` + `application/javascript` (or `text/javascript`). If line 2 shows `application/octet-stream`, the MIME fix is missing.

### Vendored file header comment (paste at top of lib/kaplay.mjs)
```javascript
/*
 * Kaplay 3001.0.19 — vendored, do not edit.
 * Source: https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs
 * Downloaded: 2026-06-22
 * sha256: <output of: sha256sum lib/kaplay.mjs>
 * Pin policy: code against Kaplay 3001 API only. Do NOT upgrade without re-testing.
 */
```

### Minimal index.html shell
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Math Lab — loading</title>
  <style>html,body{margin:0;background:#0a0a0a}canvas{display:block;margin:auto}</style>
  <!-- file:// guard runs first (non-module inline script) -->
  <script>
    if (location.protocol === "file:") {
      document.write('<div style="color:#e8e8e8;font:16px system-ui;padding:2rem">'
        + 'Run via a web server: <code>python3 -m http.server 8000</code> then open '
        + 'http://localhost:8000/ — or visit the hosted URL.</div>');
      // stop the module from loading
      window.stop && window.stop();
    }
  </script>
</head>
<body>
  <canvas id="game"></canvas>
  <script type="module" src="main.js"></script>
</body>
</html>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Kaboom.js | Kaplay (renamed) | 2024 rename | Use `kaplay()` + `kaplayjs.com` docs; ignore `kaboom(` snippets. |
| CDN `<script>` global Kaboom | Vendored ESM `.mjs` default export | 3001 ESM dist | `import kaplay from "./kaplay.mjs"`; offline, pinned. |
| Bundler (Webpack/Vite) for modules | Native `<script type="module">` | Browser ESM mature since ~2018 | No build step needed (CLAUDE.md constraint). |

**Deprecated/outdated:**
- `kaboom(` global init — replaced by `kaplay(`.
- Loose CDN pinning — replaced by vendored exact-version file.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Dokploy: custom Dockerfile (path `docker/Dockerfile`, context `.`, domain on port 80) is the right path vs. the Static preset. | Dokploy + Stack | LOW — verified Dokploy supports Dockerfile apps + port-80 domain binding; the *exact UI field labels* may differ by Dokploy version. Docs checklist is user-run, so the user verifies against the live UI. |
| A2 | `python3 -m http.server` maps `.mjs` correctly (so dev "just works" while the container needs the fix). | Pitfall 1 | LOW — Python 3.12 `http.server` includes `.mjs` in its types map; even if not, dev still loads via `text/plain`-tolerant paths in some browsers. The container verification (not the dev server) is the real gate. |
| A3 | A `types{}` block can shadow inherited `js` mapping unless `js` is re-declared. | Pitfall 4 | LOW — defensive; Pattern 1 already re-declares `js`, so the risk is pre-mitigated regardless. |

**If this table is empty:** (not empty — 3 LOW-risk assumptions, all pre-mitigated or user-verified later.)

## Open Questions

1. **Web-root layout: keep `/src/` in the URL, or flatten?**
   - What we know: index.html sits under `src/`; clean URLs want it at `/`.
   - What's unclear: dev/prod path parity if flattened.
   - Recommendation: **Option B (flatten on Docker COPY)** for clean prod URLs; document the dev-server invocation so relative paths match. Decide in the plan; keep import paths (`lib/kaplay.mjs`) consistent.
2. **Dokploy live deploy — deferred.**
   - What we know: host not provisioned (~2 days); Dokploy consumes the Dockerfile.
   - What's unclear: final domain, exact Dokploy version/UI labels.
   - Recommendation: ship `docs/DEPLOY.md` checklist (below) the user runs when the host is up. Do **not** block the phase on a live deploy.

### `docs/DEPLOY.md` checklist (content to produce this phase)
1. In Dokploy, create a new **Application** in the project.
2. Source: connect the Git repo (branch `main`).
3. Build Type: **Dockerfile**. Dockerfile Path: `docker/Dockerfile`. Docker Context Path: `.`.
4. (No build args, no secrets needed — static site.)
5. Deploy to build the image.
6. Domains tab → add the domain → **container port `80`** → enable HTTPS/Let's Encrypt.
7. Open the assigned URL; confirm the Kaplay "hello" canvas renders.
8. Verify `.mjs` MIME in prod: `curl -sI https://<domain>/lib/kaplay.mjs | grep -i content-type` → expect `application/javascript` (or `text/javascript`).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | SETUP-01 local verification | ✓ | 29.1.3 | — |
| curl | MIME/status assertion | ✓ | present | `wget -S` / browser devtools Network tab |
| python3 | SETUP-04 dev server | ✓ | 3.12.3 | `npx serve`, `php -S` |
| Kaplay 3001.0.19 `.mjs` | SETUP-03 | ✓ (downloadable) | 3001.0.19 | jsdelivr / npm tarball mirrors (all verified 200) |
| `nginx:alpine` image | SETUP-01 | ✓ (Docker Hub) | current stable-alpine | `nginx:stable-alpine` pinned |
| Dokploy host | SETUP-02 live deploy | ✗ (deferred ~2 days) | — | DEFERRED — config + docs checklist produced now; user deploys later |

**Missing dependencies with no fallback:** none blocking — Dokploy host is intentionally deferred per locked decision.
**Missing dependencies with fallback:** Dokploy host (deferred; `docs/DEPLOY.md` is the bridge).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no JS test runner; this is infra). Verification is **shell-command assertions** (docker + curl) — appropriate for a packaging phase. |
| Config file | none — see Wave 0 |
| Quick run command | `curl -sI http://localhost:8080/lib/kaplay.mjs \| grep -i content-type` |
| Full suite command | the local-container verification block (build → run → 3 curls → stop) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SETUP-01 | Container serves static files, no backend | smoke (curl) | `docker build -f docker/Dockerfile -t mathlab . && docker run -d --rm -p 8080:80 mathlab && curl -sI http://localhost:8080/ \| grep -iE "200\|text/html"` | ❌ Wave 0 (Dockerfile + nginx.conf) |
| SETUP-01b | `.mjs` served with JS MIME (the fix) | smoke (curl) | `curl -sI http://localhost:8080/lib/kaplay.mjs \| grep -i "application/javascript\|text/javascript"` | ❌ Wave 0 |
| SETUP-03 | Kaplay loads locally + scene draws "hello" | manual (browser) | Open `http://localhost:8080/`, confirm canvas shows "hello" (no console errors) | ❌ Wave 0 (lib/kaplay.mjs + src/main.js) — manual: needs eyeball on canvas |
| SETUP-04 | Multi-file layout + dev server documented | structural (shell) | `test -f src/index.html && test -f lib/kaplay.mjs && test -d assets && grep -q "http.server" README.md` | ❌ Wave 0 |
| SETUP-04b | No build step / no npm artifacts | structural | `! test -e package.json && ! test -d node_modules && ! test -d dist` | n/a (assert) |
| SETUP-02 | Dokploy deploy config + docs (live deferred) | doc-presence | `test -f docs/DEPLOY.md && grep -qi "dockerfile path" docs/DEPLOY.md` | ❌ Wave 0 (docs/DEPLOY.md) |

### Sampling Rate
- **Per task commit:** the single relevant curl/structural assertion for that task.
- **Per wave merge:** full local-container verification block (build → run → curls → stop).
- **Phase gate:** container builds clean, both curls pass MIME/status, browser shows "hello" canvas, `git mv` done, `docs/DEPLOY.md` present — before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `docker/Dockerfile` — covers SETUP-01
- [ ] `docker/nginx.conf` (with `.mjs` MIME fix) — covers SETUP-01b
- [ ] `lib/kaplay.mjs` (vendored + header) + `src/main.js` + `src/index.html` — covers SETUP-03
- [ ] `README.md` (dev server + pin note + layout) — covers SETUP-04
- [ ] `docs/DEPLOY.md` (Dokploy checklist) — covers SETUP-02
- [ ] `git mv math-lab.html archive/` — layout cleanup
- [ ] No JS test framework needed — infra phase uses shell assertions; do not add one.

## Security Domain

> `security_enforcement: true`, ASVS level 1.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth — public static site, no accounts (per Out of Scope). |
| V3 Session Management | no | No sessions/server state. |
| V4 Access Control | no | All content is public-by-design. |
| V5 Input Validation | no (this phase) | No user input in Phase 7 (placeholder). localStorage validation handled in Phase 11. |
| V6 Cryptography | no | No secrets; TLS termination is Dokploy's (Let's Encrypt). |
| V14 Config | yes | Container hardening: pin base image, no unnecessary ports (only 80), no secrets in image, vendored file integrity (sha in header). |

### Known Threat Patterns for static nginx + vendored ESM
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tampered vendored library (supply chain) | Tampering | Vendor exact version; record sha256 in header; verify against npm dist integrity once. |
| MIME confusion / sniffing | Spoofing/Tampering | `default_type application/octet-stream` + explicit JS MIME; add `X-Content-Type-Options: nosniff` (optional hardening). |
| Serving unintended files | Info disclosure | Copy only `src/ lib/ assets/` into the image; no `.git`, no source maps, no `archive/`. |
| Missing TLS | Info disclosure | Dokploy domain with HTTPS/Let's Encrypt (DEPLOY.md step 6). |

Optional hardening for `nginx.conf` (low effort, recommend including): `add_header X-Content-Type-Options "nosniff" always;` and `server_tokens off;`.

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view kaplay@3001.0.19 module/exports/dist`) — confirmed ESM `dist/kaplay.mjs`, default export, integrity. (this session)
- unpkg / jsdelivr HEAD requests — confirmed `kaplay.mjs` 200 + content-type at the pinned version. (this session)
- `github.com/nginx/nginx/blob/master/conf/mime.types` — confirmed `application/javascript js;`, **no `mjs`**. (this session)
- Docker Hub `library/nginx` tags + local `docker --version` (29.1.3). (this session)
- [KAPLAY Guides — Starting](https://kaplayjs.com/docs/guides/starting/) — `kaplay()` global init via ESM. (CITED)
- [KAPLAY Guides — Scenes](https://kaplayjs.com/docs/guides/scenes/) — `scene()`/`go()`/`add(text())`. (CITED)
- [Dokploy — Build Type docs](https://docs.dokploy.com/docs/core/applications/build-type) — Dockerfile path/context/port-80 domain. (CITED)

### Secondary (MEDIUM confidence)
- [Serving .mjs files with nginx — semisignal](https://semisignal.com/serving-mjs-files-with-nginx/) — `types{}` mjs override.
- [MDN — Configuring server MIME types](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Configuring_server_MIME_types) — strict module MIME rationale.
- [nginx trac #1407 — application/javascript vs text/javascript](https://trac.nginx.org/nginx/ticket/1407) — both MIME values acceptable.

### Tertiary (LOW confidence)
- General KAPLAY blog/wiki examples (corroborated against official docs above).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package/tool/version verified against live registries + local environment this session.
- Architecture (nginx static + Dockerfile + Dokploy): HIGH — `.mjs` MIME issue and fix confirmed against current upstream nginx + multiple sources; Dokploy Dockerfile flow confirmed from official docs.
- Pitfalls: HIGH — the two critical pitfalls (`.mjs` MIME, version churn) are directly verified, not assumed.

**Research date:** 2026-06-22
**Valid until:** 2026-07-22 (stable infra; Kaplay pin is immutable by design — only Dokploy UI labels may drift)
