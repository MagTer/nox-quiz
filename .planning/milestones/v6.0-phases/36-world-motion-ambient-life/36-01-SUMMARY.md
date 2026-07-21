---
phase: 36-world-motion-ambient-life
plan: 01
subsystem: gates/harness
tags: [geometry-freeze, motion-keys, movers, patrollers, option-c]
requires:
  - scripts/check-geometry-frozen.mjs (Phase-35 freeze gate)
  - scripts/lib/reachability.mjs (Phase-30 mover-reachability validator, reads geometry.movers)
provides:
  - "geometry.movers / geometry.patrollers can be authored on any level descriptor without tripping the freeze gate"
affects:
  - all downstream Phase-36 plans that place movers/patrollers (36-02 audit, 36-03 build.js emit)
tech-stack:
  added: []
  patterns:
    - "Explicit exclusion allowlist via rest-destructure ({ movers, patrollers, ...frozen })"
key-files:
  created: []
  modified:
    - scripts/check-geometry-frozen.mjs
decisions:
  - "Option C (exclude motion keys from the freeze snapshot) — NOT Option A (--write the golden) or Option B (top-level movers)"
metrics:
  duration: ~15m
  completed: 2026-07-18
status: complete
---

# Phase 36 Plan 01: World Motion & Ambient Life — Geometry-Freeze Reconciliation Summary

Taught `check-geometry-frozen.mjs` to strip exactly the two Phase-36 motion keys (`movers`, `patrollers`) from its byte-freeze snapshot via a rest-destructure, so downstream plans can author `geometry.movers`/`geometry.patrollers` while every kid-validated static array stays byte-frozen and the Phase-30 mover-reachability validator (which reads `geometry.movers`) is left untouched.

## What Was Built

- **`currentGeometryMap()` exclusion allowlist** (`scripts/check-geometry-frozen.mjs`): replaced `map[id] = JSON.stringify(getLevel(id).geometry)` with `const { movers, patrollers, ...frozen } = getLevel(id).geometry; map[id] = JSON.stringify(frozen);`. A block comment names it an explicit Phase-36 exclusion allowlist and points at 36-RESEARCH §"The geometry-freeze reconciliation" (Option C).
- The same function feeds BOTH the `--write` baseline path and the gate-compare path, so baseline and comparison stay symmetric automatically — no baseline regeneration was needed and `--write` was NOT run.

## RED → GREEN → Guard-Intact Proof

All proofs used a scratch key injected into `src/levels/level-01.js`, reverted after each step via `git checkout -- src/levels/level-01.js` (never committed).

| Step | Setup | Command | Result |
|------|-------|---------|--------|
| Baseline | clean tree | `node scripts/check-geometry-frozen.mjs` | PASS (exit 0) |
| **RED** | scratch `geometry.movers` + **UNEDITED** gate | `node scripts/check-geometry-frozen.mjs` | **HARD-FAIL — `first differing key: "movers"`** (exit 1) |
| **GREEN** | scratch `geometry.movers` + `geometry.patrollers` + **EDITED** gate | `node scripts/check-geometry-frozen.mjs` | **PASS** (exit 0) — motion keys excluded |
| **Guard-intact** | scratch nudge of a static platform coord (`280→281`) + EDITED gate | `node scripts/check-geometry-frozen.mjs` | **HARD-FAIL — `first differing key: "platforms"`** (exit 1) |

The RED and GREEN rows use the same scratch `movers` key: it HARD-FAILs before the edit (naming `movers`) and PASSes after — the byte-freeze guard on static arrays remains intact (a one-pixel static nudge still HARD-FAILs).

## Verification Gate Results

- `node scripts/check-geometry-frozen.mjs` → **PASS** (all 8 levels byte-identical to the frozen baseline, clean tree).
- `node scripts/validate-levels.mjs` → **PASS** (0 HARD-FAIL; validator unchanged, no descriptor authored a mover yet).
- `git diff --stat scripts/lib/reachability.mjs scripts/validate-levels.mjs scripts/fixtures/geometry-frozen-baseline.json` → empty (validator, level validator, and baseline fixture all untouched).
- `grep -n "movers" scripts/lib/reachability.mjs` → mover-reachability loop (line 1116 `for (const [i, m] of (geometry.movers ?? []).entries())`) present and unchanged.

## Deviations from Plan

None — plan executed exactly as written. No fixture change was required (Option C needs no baseline regeneration).

## Threat Mitigations Applied

- **T-36-01 (over-broad exclusion masks static drift):** mitigated — exclusion is EXACTLY `movers`+`patrollers` via rest-destructure; the guard-intact scratch proof shows a static-array nudge still HARD-FAILs naming the static key.
- **T-36-02 (`--write` silently absorbs a motion key):** mitigated — `--write` was NOT run; the exclusion makes it unnecessary. The gate comment records the ban and the reason (Option A rejected: would mask accidental static drift).

## Scope / Files

- Committed CODE ONLY, one file, scoped `git add scripts/check-geometry-frozen.mjs`.
- Pre-existing untracked strays (`.planning/phases/26-*`, `assets/enemy-*.png`) and `.planning/STATE.md` were NOT touched.
- Baseline fixture `scripts/fixtures/geometry-frozen-baseline.json` unchanged (still valid for all static arrays).

## Commits

- `13cb1e6` — feat(36-01): exclude motion keys (movers/patrollers) from geometry-freeze snapshot

## Self-Check: PASSED

- `scripts/check-geometry-frozen.mjs` modified and present (verified).
- Commit `13cb1e6` exists in git log (verified).
- No file deletions in the commit (verified).
