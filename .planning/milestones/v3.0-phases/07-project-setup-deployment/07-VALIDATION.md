---
phase: 7
slug: project-setup-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-22
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (no JS test runner — this is an infra/packaging phase). Verification is **shell-command assertions** (docker + curl + structural checks). Do NOT add a JS test framework. |
| **Config file** | none |
| **Quick run command** | `curl -sI http://localhost:8080/lib/kaplay.mjs \| grep -i content-type` |
| **Full suite command** | local-container verification block: `docker build -f docker/Dockerfile -t mathlab . && docker run -d --rm -p 8080:80 --name mathlab mathlab && sleep 1 && curl -sI http://localhost:8080/ && curl -sI http://localhost:8080/lib/kaplay.mjs && docker stop mathlab` |
| **Estimated runtime** | ~30 seconds (image build dominated) |

---

## Sampling Rate

- **After every task commit:** Run the single relevant curl/structural assertion for that task.
- **After every plan wave:** Run the full local-container verification block (build → run → curls → stop).
- **Before `/gsd-verify-work`:** Container builds clean; both curls pass MIME/status; browser shows the "hello" canvas; `git mv` done; `docs/DEPLOY.md` present.
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 7-xx | TBD | 0 | SETUP-04 | — | multi-file no-build layout exists | structural | `test -f src/index.html && test -f lib/kaplay.mjs && test -d assets && grep -q "http.server" README.md` | ❌ W0 | ⬜ pending |
| 7-xx | TBD | 0 | SETUP-04b | — | no build artifacts / no npm | structural | `! test -e package.json && ! test -d node_modules && ! test -d dist` | n/a assert | ⬜ pending |
| 7-xx | TBD | 0 | SETUP-03 | — | Kaplay 3001.0.19 vendored, version commented | structural | `test -f lib/kaplay.mjs && head -5 lib/kaplay.mjs \| grep -q "3001.0.19"` | ❌ W0 | ⬜ pending |
| 7-xx | TBD | 1 | SETUP-01 | — | container serves static files, no backend | smoke (curl) | `curl -sI http://localhost:8080/ \| grep -iE "200\|text/html"` | ❌ W0 | ⬜ pending |
| 7-xx | TBD | 1 | SETUP-01b | — | `.mjs` served with JS MIME (the fix) | smoke (curl) | `curl -sI http://localhost:8080/lib/kaplay.mjs \| grep -i "application/javascript\|text/javascript"` | ❌ W0 | ⬜ pending |
| 7-xx | TBD | 1 | SETUP-02 | — | Dokploy deploy config + docs (live deferred) | doc-presence | `test -f docs/DEPLOY.md && grep -qi "dockerfile" docs/DEPLOY.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `docker/Dockerfile` — covers SETUP-01
- [ ] `docker/nginx.conf` (with `.mjs` → `application/javascript` MIME fix) — covers SETUP-01b
- [ ] `lib/kaplay.mjs` (vendored 3001.0.19 + version header) + `src/main.js` + `src/index.html` — covers SETUP-03
- [ ] `README.md` (dev server + version pin note + layout) — covers SETUP-04
- [ ] `docs/DEPLOY.md` (Dokploy deploy checklist) — covers SETUP-02
- [ ] `git mv math-lab.html archive/` — layout cleanup

*No JS test framework needed — infra phase uses shell assertions.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Kaplay canvas renders "hello" with no console errors | SETUP-03 | Needs eyeball on the rendered canvas in a browser | Open `http://localhost:8080/`, confirm the canvas draws "hello" and DevTools console is clean |
| Live Dokploy URL loads and runs | SETUP-02 | Dokploy host not provisioned yet (~2 days out) — live deploy deferred | When host is live, follow `docs/DEPLOY.md`; visit the URL and confirm the canvas loads |

---

## Validation Sign-Off

- [ ] All tasks have automated shell verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
