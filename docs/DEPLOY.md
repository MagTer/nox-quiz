# Deploying Nox Run

Nox Run ships as **static files served by an nginx container**: no backend, no
database, no server-side logic. It runs on the home-server production cluster and is
public at **`https://nox.ternstrom.net/`** (public by home-server's ADR-010; an edge rate
limit and a GET/HEAD-only route stand in front of it).

*Rewritten 2026-10-24.* This file was a Dokploy checklist; Dokploy was retired on
2026-10-02 and the game has been on the cluster since before that. Its history is
`git log docs/DEPLOY.md`.

## The path

1. **Push to `main`.** `.github/workflows/publish-image.yml` builds `docker/Dockerfile`
   and publishes `ghcr.io/magter/nox-quiz` with an immutable `sha-<sha>` tag (and
   semver tags for a `v*` tag). Nothing deploys from this repo.
2. **Pin it in home-server.** The image digest in `clusters/base/nox/deployment.yaml`
   is bumped there; Flux applies it, the lab cluster before production. home-server's
   `docs/runbooks/new-app.md` and `updates.md` are the procedure.
3. **Verify the production `.mjs` MIME** (the one thing that historically breaks):

   ```bash
   curl -sI https://nox.ternstrom.net/lib/kaplay.mjs | grep -i content-type
   ```

   Expect `application/javascript` (or `text/javascript`), **never**
   `application/octet-stream`; octet-stream means the custom nginx config did not
   take effect.

## Why a custom Dockerfile (not the Static preset)

nginx's bundled `mime.types` does **not** map `.mjs`. Served under a generic
static handler, `lib/kaplay.mjs` falls through to `application/octet-stream` and
the browser refuses to execute it ("Failed to load module script"). Our
`docker/nginx.conf` adds an explicit `types { application/javascript js mjs; }`
mapping (re-declaring `js` so it does not regress). Keeping the Dockerfile under
our control is what guarantees this fix is applied in production.

## Local verification (already passing)

Before any remote deploy, the container is proven locally — Python's
`http.server` already maps `.mjs` and would *hide* a misconfiguration, so we hit
the **container** with curl:

```bash
docker build -f docker/Dockerfile -t noxrun:local .
docker run -d --rm -p 8080:80 --name noxrun noxrun:local
sleep 1.5
curl -sI http://localhost:8080/                 # 200, text/html
curl -sI http://localhost:8080/lib/kaplay.mjs   # 200, application/javascript
docker stop noxrun
```
