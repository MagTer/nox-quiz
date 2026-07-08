# Codebase Stack — Nox Run (formerly Math Lab)

## Shipped Stack (v5.0-era, verified against the live tree 2026-07-07)

- **This is the CURRENT-STATE stack doc** — `.planning/research/STACK.md` is per-milestone research (v5.0: audio/validation/logo/palette additions only) and must NOT be read as the full stack.

| Piece | What | Notes |
|-------|------|-------|
| Engine | Kaplay 3001.0.19, vendored at `lib/kaplay.mjs` | Pinned (sha256 in header); `kaplay({ global: true })` — engine globals exist only AFTER init (a727c13 rule). Code against Kaplay 3001 API only; ignore `kaboom(` snippets. Never upgrade without re-testing. |
| Language | Vanilla ES2020 modules under `src/` | No TypeScript, no JSX, no framework, no npm, no build step, no node_modules. |
| Serving | MUST be over HTTP — `file://` is blocked (guard in `src/index.html`) | Dev: run `python3 -m http.server 8000` from the **repo root** (not `src/` — `lib/` is a sibling of `src/`, not nested inside it, so a server rooted at `src/` 404s on `lib/kaplay.mjs`), then browse to `http://localhost:8000/src/index.html`. Matches `scripts/browser-boot.mjs`'s serving convention and the Dockerfile's flattened production layout. Production: nginx Docker static container via Dokploy (`docker/`, `docs/DEPLOY.md`) — packaging, not a build. |
| Canvas | Internal 640×360, displayed 1.5× via CSS `transform: scale(1.5)` | NEVER scale via width/height — desyncs Kaplay's offsetX/offsetY mouse mapping and silently breaks `box.onClick()` (documented in `src/main.js`). |
| Persistence | localStorage key `mathlab_platformer_v2`, version 2 (pre-Phase-26 value) | **Superseded 2026-07-07:** earlier milestones treated this key as brand-independent and never-touch; Phase 26's CONTEXT.md records the user's explicit, confirmed decision to rename/change the save key as part of the Nox Run rebrand, intentionally resetting pre-rebrand player progress (no migration). All access still goes through guarded `src/progress.js` seams (never throw, forgiving defaults) — only the key literal's stability guarantee changed. |
| Assets | Curated CC0 pixel art under `assets/` | Licenses in `assets/LICENSES/`, credits in `CREDITS.md`; some baked by `scripts/build-art-assets.py` (Pillow). |
| Test harness | Playwright driven from `scripts/*.mjs` | Resolved dynamically (project dep → `PLAYWRIGHT_MJS_PATH` env → nvm-wide gsd-pi search). No JS test framework — the shell gates + browser scripts ARE the suite. |

## Verification gates (run after any `src/` or level change)

- `bash scripts/check-gate.sh` — math-gate/challenge invariants
- `bash scripts/check-safety.sh` — SAFE-01 no-timer + forgiving mandate (whole `src/`)
- `bash scripts/check-import-safety.sh` — a727c13 module-top-level engine-global trap
- `bash scripts/check-progress.sh` — progress/save invariants (ends with `smoke-progress.mjs`)
- `node scripts/validate-levels.mjs` — static level validator, REQUIRED for any level edit (green = zero HARD-FAIL)
- `node scripts/browser-boot.mjs` — real-browser boot + drive across all levels
- `node scripts/audit-phase21-mechanics.mjs` — interactive mechanic audit (`triggered: true` required for every encounter; `resolved: false` rows are known headless-timing flakiness)

## Debug overlay

- Serve with `?debug=1` (e.g. `http://localhost:8000/?debug=1`) to render normally-invisible entities: merged colliders, tall door/gate/enemy blockers, answer zones, pickup slots, checkpoints, secret alcoves (magenta markers).
- Display-only; never hand-edit `opacity(0)` in production code for playtesting.
