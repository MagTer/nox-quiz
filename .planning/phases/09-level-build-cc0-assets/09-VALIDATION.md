---
phase: 9
slug: level-build-cc0-assets
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-24
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — static single-page Kaplay game, no JS build/test harness (per CLAUDE.md zero-dependency constraint) |
| **Config file** | none |
| **Quick run command** | `node --check` on changed `.mjs`/`.js` files (syntax gate) + manual browser load |
| **Full suite command** | Serve over HTTP (`python3 -m http.server` or Docker) and load the level scene in a browser |
| **Estimated runtime** | ~10 seconds (syntax) + manual playtest |

---

## Sampling Rate

- **After every task commit:** `node --check` changed JS modules; confirm no console errors on level scene load
- **After every plan wave:** Load the full level in a browser, traverse start→goal
- **Before `/gsd-verify-work`:** Level loads with no console errors; player can reach goal
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 9-01-01 | 01 | 1 | LEVEL-08 | — | N/A | manual | license proof present in `assets/LICENSES/` | ❌ W0 | ⬜ pending |
| 9-02-01 | 02 | 1 | LEVEL-01, LEVEL-02 | — | N/A | manual | level renders + traversable in browser | ❌ W0 | ⬜ pending |
| 9-03-01 | 03 | 2 | LEVEL-03, LEVEL-04, LEVEL-05 | — | N/A | manual | coins collect, hazard respawns, goal fires hook | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No automated test framework — project is a zero-dependency static game (CLAUDE.md). Validation is `node --check` syntax gating plus manual browser playtest.

*Existing infrastructure (none) is intentional per project constraints; manual verification covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Level traversal start→goal | LEVEL-01 | Requires rendered collision + input in a browser | Serve over HTTP, load level scene, run+jump from spawn to goal flag |
| Dark/grunge pixel render, readable silhouettes, no pink | LEVEL-02 | Visual judgment | Load scene; confirm CC0 pack renders dark, sprites readable against bg |
| Coin collection | LEVEL-03 | Visual/interactive | Touch each coin; confirm it disappears and counter increments |
| Hazard → gentle checkpoint respawn (never game-over) | LEVEL-04 | Behavioral | Touch hazard; confirm respawn at checkpoint, no game-over screen |
| Goal → math-gate hook fires | LEVEL-05 | Behavioral seam | Reach goal; confirm `onReachGoal`/handoff event fires (logged/stubbed) |
| Asset licenses documented, no vendor logos | LEVEL-08 | Documentation/visual audit | Inspect `CREDITS` + `assets/LICENSES/`; every asset has CC0 source + proof |

*Phase 9 is content/asset-wiring on top of Phase 8 systems; behaviors are validated by manual browser playtest by design.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
