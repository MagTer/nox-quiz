# Deploying Nox Run to a web URL (Dokploy)

Nox Run ships as **static files served by an nginx container** — no backend, no
database, no server-side logic. This document is the deploy checklist you run
**once the Dokploy host is provisioned**.

> **Status: live deploy is DEFERRED.** Plan 07-02 delivers the deploy *config*
> (`docker/Dockerfile`, `docker/nginx.conf`) and *this checklist*, which together
> satisfy **SETUP-02 now**. Bringing the game live at a public URL is a
> **user-triggered follow-up** — it is *not* a phase blocker. Run the steps below
> when the host is ready (~2 days out).

The image and its `.mjs` MIME behaviour are already proven locally by curl
against the running container (see "Local verification" at the bottom), so the
only unknowns at deploy time are Dokploy-side (domain + TLS).

---

## Prerequisites

- A running Dokploy instance you can log into.
- This repository reachable by Dokploy over Git (branch `main`).
- A DNS record you can point at the Dokploy host (for the custom domain + HTTPS step).

## Deploy checklist

1. **Create the Application.** In Dokploy, open your project and create a **new
   Application**.
2. **Source.** Connect this **Git repository** and select branch **`main`**.
3. **Build.** Set:
   - **Build Type:** `Dockerfile`
   - **Dockerfile Path:** `docker/Dockerfile`
   - **Docker Context Path:** `.` (the repo root — the `COPY src/ lib/ assets/`
     paths in the Dockerfile resolve relative to the repo root, so the context
     must be `.`, not `docker/`).
4. **Build args / secrets.** None. This is a static site — leave build args and
   environment secrets empty.
5. **Deploy.** Trigger the deploy so Dokploy builds the image and starts the
   container.
6. **Domain + HTTPS.** Open the **Domains** tab → **add your domain** → set the
   **container port to `80`** → **enable HTTPS / Let's Encrypt**. Dokploy
   terminates TLS and proxies to container port 80.
7. **Smoke test in a browser.** Open the assigned URL and confirm the Kaplay
   canvas renders "hello" with a clean DevTools console (no module-load errors).
8. **Verify the production `.mjs` MIME** (the one thing that historically breaks
   in prod):

   ```bash
   curl -sI https://<your-domain>/lib/kaplay.mjs | grep -i content-type
   ```

   Expect `application/javascript` (or `text/javascript`) — **never**
   `application/octet-stream`. If you see octet-stream, the custom nginx config
   did not take effect (confirm Build Type is `Dockerfile`, not a Static preset).

> **Note on UI labels.** Exact Dokploy field names may differ between versions
> (Assumption A1). Match by meaning: *Build Type → Dockerfile*, *Dockerfile path*,
> *context path*, *domain → container port 80 → HTTPS*. Verify against the live UI.

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
