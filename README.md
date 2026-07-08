# Nox Run — The Platformer

A 2D platformer (built with [Kaplay](https://kaplayjs.com/)) where multiplication is
the gate to progress. Dark/grunge aesthetic, keyboard-controlled, no pink, no timers.

It is a **static site** — plain HTML + ES modules + a vendored game engine + assets.
**There is no JS build step**, no `npm install`, no bundler, no `node_modules`. You edit
files and serve them; that's it. (Docker is only for *packaging the static files* for
hosting — it is not a build step.)

## Project layout

```
src/        index.html (entry shell) + JS modules (main.js, future game code)
lib/        vendored Kaplay engine (kaplay.mjs) — committed, never installed
assets/     sprites / audio (added in phases 8–9)
docker/     Dockerfile + nginx.conf for static hosting (added in plan 07-02)
docs/       DEPLOY.md — Dokploy deployment steps (added in plan 07-02)
archive/    math-lab.html — the v2 single-file quiz, kept as reference for the
            Phase 10 "math brain" port (do not edit; it is verbatim history)
```

## Run locally (development only)

The game **must be served over HTTP** — opening `src/index.html` as a `file://`
local file is blocked by the browser (ES modules and asset fetches fail under the
`file://` opaque origin). `src/index.html` includes a guard that shows a "run via a
web server" message instead of a blank canvas if you open it directly.

From the **repo root**, start the dev server and open the URL:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/src/index.html
```

### Web-root / path parity (dev vs. production)

This is the convention the layout depends on — keep it in mind when serving:

- `src/index.html` loads `main.js` with a **relative** path, and `main.js` imports the
  engine with `import kaplay from "../lib/kaplay.mjs"` — i.e. one directory **up** from
  `src/` into `lib/`.
- **In development**, serve from the **repo root** (`python3 -m http.server 8000`) and
  open `http://localhost:8000/src/index.html`. `lib/` being a sibling of `src/` at the
  repo root is exactly why a repo-root docroot resolves `../lib/kaplay.mjs` correctly —
  `index.html` is served at `/src/index.html` and the engine import resolves up to
  `/lib/kaplay.mjs`. Serving from *inside* `src/` is the broken case: there is no `lib/`
  underneath that docroot, so the request 404s (confirmed empirically).
- **In production** (plan 07-02), the container **flattens `src/` to the nginx web root**
  and copies `lib/` to `/lib/` beside it — so `index.html` sits at `/` and
  `../lib/kaplay.mjs` resolves to `/lib/kaplay.mjs`. This is the **same relationship** as
  serving from the repo root in dev, which is why the relative import is identical in both.

The takeaway: the server must be started from the **repo root**, not from inside `src/`.
This matches the Dockerfile's production layout and `scripts/browser-boot.mjs`'s existing
serving convention.

## Production play path

She just **visits the hosted URL** — no install, no launcher, no local server. The
static files are served by an nginx Docker container deployed via Dokploy (set up in
plan 07-02 / `docs/DEPLOY.md`). Hosting over HTTP also sidesteps the `file://` block
entirely. The `python3 -m http.server` dev server above is for **development only**.

## Kaplay engine pin

- **Version: `3001.0.19`**, vendored locally at **`lib/kaplay.mjs`**.
- **No CDN, no npm** — the engine is a committed file, downloaded once and never
  `npm install`ed at play time. The file's header comment records its source URL,
  download date, and `sha256` for integrity.
- **Code against the Kaplay 3001 API only** (`kaplayjs.com/docs`). Do **not** upgrade the
  vendored file without re-testing — Kaplay (formerly Kaboom) has churned APIs across
  major versions, and online snippets mix versions. Ignore any `kaboom(` snippets.
