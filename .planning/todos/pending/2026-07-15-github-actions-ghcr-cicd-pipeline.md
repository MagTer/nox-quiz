---
created: 2026-07-15T00:00:00.000Z
title: GitHub Actions CI/CD — build & push container image to GHCR
area: deploy
files:
  - docker/Dockerfile (existing nginx static image — the artifact to build)
  - docker/nginx.conf
  - docs/DEPLOY.md (existing Dokploy deploy notes)
  - .github/workflows/ (does NOT exist yet — the pipeline to add)
---

## Problem

User asked (2026-07-15, mid-Phase-34.5) whether there is a planned activity for packaging
the game as a container image pushed to GHCR via GitHub CI/CD. There is NOT.

Current state of packaging/deployment:
- **Local debugging:** a plain web server (`python3 -m http.server 8000` from repo root),
  as documented in CLAUDE.md.
- **Container packaging EXISTS:** `docker/Dockerfile` + `docker/nginx.conf` build an nginx
  static image; `docs/DEPLOY.md` documents deploying it via **Dokploy**.
- **NO GitHub Actions:** there is no `.github/workflows/` directory, no `ghcr.io` reference
  anywhere in the repo, and no build-push-to-GHCR pipeline.
- **NOT in the v6.0 roadmap:** the only deployment-related roadmap item is Phase 38's VER-01
  ("live Dokploy playthrough" — a manual verification that the Dokploy-served URL works),
  not an automated CI/CD image build/publish.

So the desired end state — "container image pushed to GHCR via GitHub CI/CD" — is a real gap
relative to how the project ships today (Dokploy, presumably building from source or a manual
image). This todo captures it for later planning.

## Solution

TBD — plan later. Likely a small `.github/workflows/*.yml` adding a build-and-push job:
- Trigger on push to `main` (and/or tags).
- `docker/build-push-action` building `docker/Dockerfile`, tagging
  `ghcr.io/<owner>/<repo>:<sha>` (+ `latest` / semver).
- `permissions: packages: write` + login to GHCR with `GITHUB_TOKEN`.
- Decide the Dokploy handoff: does Dokploy pull the GHCR image (change Dokploy to deploy the
  published image instead of building from source), or does GHCR publishing run alongside the
  existing Dokploy flow? Clarify with the user before scoping.
- Keep it consistent with the no-build-step / static-hosting constraint: this is packaging +
  registry publishing, still NOT a JS build step (per CLAUDE.md's Docker guidance).

Needs a clarification pass with the user on the Dokploy-vs-GHCR relationship before it becomes
a phase.
