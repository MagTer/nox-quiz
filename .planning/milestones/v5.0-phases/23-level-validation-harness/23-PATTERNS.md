# Phase 23: Level Validation Harness - Pattern Map

**Mapped:** 2026-07-05
**Files analyzed:** 6
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `scripts/lib/over-hole-check.mjs` | utility (pure-data checker) | transform (interval arithmetic) | `22-RESEARCH.md`'s promoted `interval-check-22-04.mjs` source (Pattern 4) | exact — verbatim promotion target |
| `scripts/lib/reachability.mjs` | utility (pure-data graph model) | transform (BFS/graph) | `scripts/lib/mechanic-drive.mjs` (physics-constant derivation comment + traversal model) | role-match (new algorithm, same physics-constants provenance) |
| `scripts/validate-levels.mjs` | config/CLI orchestrator (test-harness role) | batch (iterate all levels, aggregate report) | `scripts/smoke-progress.mjs` | exact — same no-framework `check()`/`process.exit(1)` idiom, same standalone `node scripts/*.mjs` invocation |
| `scripts/calibrate-jump-envelope.mjs` | utility / one-time CLI probe | request-response (Playwright drives real engine, samples state) | `scripts/browser-boot.mjs` (launch/serve skeleton) + `scripts/lib/mechanic-drive.mjs` (`page.evaluate` sampling technique) | role-match (launch/serve exact; sampling loop is new but same technique) |
| `scripts/fixtures/bad-level.js` | test fixture (pure-data) | file I/O (static descriptor consumed by validator) | `scripts/fixtures/bad-scene.js` | role-match (same "deliberately-bad fixture proves RED" convention; different domain — data descriptor vs. JS module trap) |
| retry-wrapper module (e.g. `scripts/lib/audit-retry.mjs`) | utility (wraps existing traversal) | event-driven / batch (bounded retry loop over encounters) | `scripts/audit-phase21-mechanics.mjs` (current single-pass caller) + `scripts/lib/mechanic-drive.mjs` (unmodified exports it wraps) | exact — direct composition of existing exports, no new traversal logic |

## Pattern Assignments

### `scripts/lib/over-hole-check.mjs` (utility, transform)

**Analog:** Phase 22's scratchpad `interval-check-22-04.mjs`, preserved verbatim in `22-RESEARCH.md` (Pattern 4 / Code Examples) and already proven correct against the 3 known over-hole defects.

**Imports pattern:**
```js
import { CONFIG } from "../../src/config.js";
```

**Core pattern** (promote verbatim, change `console.log` → structured return):
```js
const BARRIER_WIDTH = {
  doors: CONFIG.DOOR.W,
  mathGates: CONFIG.MATH_GATE.W,
  enemies: CONFIG.ENEMY.W,
};

export function findOverHoleBarriers(geometry) {
  const runs = geometry.floors.map((f) => [f.x, f.x + f.w]);
  const onFloor = (x) => runs.some(([a, b]) => x >= a && x <= b);
  const rows = [];
  for (const kind of ["doors", "mathGates", "enemies"]) {
    for (const e of geometry[kind] ?? []) {
      const w = BARRIER_WIDTH[kind];
      if (!onFloor(e.x) || !onFloor(e.x + w)) {
        rows.push({ kind, x: e.x, w, footprint: [e.x, e.x + w] });
      }
    }
  }
  return rows; // [] means clean — HARD-FAIL only if length > 0
}
```

**Error handling / forgiving pattern:** follow the project's "never brick" convention seen in `src/levels/index.js`'s `getLevel` fallback and `?? []` guards throughout `scripts/browser-boot.mjs` (e.g. `geometry.doors ?? []` in `deriveEncounters`, `mechanic-drive.mjs` lines 30-33) — malformed/missing geometry arrays must degrade to empty, never throw.

**Config constants to reference** (`src/config.js`, confirmed values):
```js
DOOR: { W: <see CONFIG.DOOR.W> },       // barrier width for over-hole footprint
MATH_GATE: { W: <see CONFIG.MATH_GATE.W> },
ENEMY: { W: <see CONFIG.ENEMY.W> },
FLOOR_Y: 320,
```
(Exact widths already used identically in `smoke-progress.mjs`'s expected-geometry blocks, e.g. `CONFIG.MATH_GATE.H`/`CONFIG.DOOR.H` for y, confirming these config paths are correct and stable.)

---

### `scripts/lib/reachability.mjs` (utility, transform/BFS)

**Analog:** `scripts/lib/mechanic-drive.mjs` — no direct BFS analog exists in this repo, but this file supplies (a) the physics-constants-derivation comment style to mirror, and (b) the project's convention of a heavily-commented, single-purpose exported-function module with no engine globals at module top level (a727c13-conformant, same as `src/levels/index.js`).

**Physics-constants header-comment convention to mirror** (`scripts/lib/mechanic-drive.mjs` lines 15-19):
```js
// Physics this design is derived from (src/config.js, unchanged by this plan):
// RUN_SPEED 240 px/s, GRAVITY 1400 px/s^2, JUMP_FORCE 520 px/s. Time-to-apex
// JUMP_FORCE/GRAVITY ~= 0.371s; max single-jump rise JUMP_FORCE^2/(2*GRAVITY) ~= 96.6px;
// max single-jump horizontal travel at RUN_SPEED ~= 178px.
```
`reachability.mjs`'s own header should follow this exact style but explicitly flag that the numbers it actually USES come from the calibrated constant (`calibrate-jump-envelope.mjs`'s frozen output), not this closed-form comment — see RESEARCH Pitfall 1.

**Module shape convention** (pure-data export, no engine globals — mirrors `src/levels/index.js` lines 1-13 module-header discipline):
```js
// scripts/lib/reachability.mjs — Δy-aware jump-edge model + BFS reachability.
// PURE module: no engine globals, no Playwright, no browser. Reads level.geometry
// (src/levels/*.js shape) + the frozen calibrated envelope constant. a727c13-safe.
```

**Core BFS/graph pattern:** use RESEARCH.md's own "Reachability graph construction skeleton" and "Pattern 1: Δy-aware jump-edge reachability" code blocks verbatim as the starting implementation (already vetted against `src/config.js` constants and this repo's Y-axis-down convention) — no better in-repo analog exists since this is new algorithmic territory; RESEARCH.md is the authoritative source here, not a codebase file.

**Forgiving/never-brick convention:** same `?? []` optional-array guard pattern as `deriveEncounters` (`mechanic-drive.mjs` lines 30-33) for `geometry.platforms ?? []`, `geometry.floors ?? []`.

---

### `scripts/validate-levels.mjs` (CLI orchestrator, batch)

**Analog:** `scripts/smoke-progress.mjs` — the canonical no-framework assertion idiom for this project.

**Imports pattern** (`smoke-progress.mjs` lines 23-28):
```js
import { CONFIG } from "../src/config.js";
import { LEVEL_ORDER, getLevel, isUnlocked } from "../src/levels/index.js";
import { findOverHoleBarriers } from "./lib/over-hole-check.mjs";
import { checkReachability } from "./lib/reachability.mjs"; // name per implementer's discretion
```

**Core assertion idiom** (`smoke-progress.mjs` lines 30-35, 600-605) — this IS the pattern to reproduce for HARD-FAIL/WARN aggregation:
```js
let failures = 0;
const check = (cond, msg) => {
  console.assert(cond, msg);
  if (!cond) failures++;
};

// ... one check() block per level per check-type ...

if (failures > 0) {
  console.error(`validate-levels: FAIL — ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("validate-levels: PASS");
```
Adapt to also print the CONTEXT-required "per-level stdout report (level id / check name / PASS-FAIL / offending descriptor)" table format — this is new (no exact analog for tabular reporting in this repo) but should still route failures through the same `check()`/`failures` counter/`process.exit(1)` convention so it matches the project's one true test-harness idiom.

**Iterate every registered level pattern** — mirrors `browser-boot.mjs`'s `for (let i = 0; i < levels.length; i++)` loop (lines 134 onward) driven by `LEVEL_ORDER`/`getLevel`:
```js
for (const id of LEVEL_ORDER) {
  const level = getLevel(id);
  const overHoleRows = findOverHoleBarriers(level.geometry);
  // ... reachability check, gap-width check, mechanic-reachability check ...
}
```

**Standalone invocation convention:** `node scripts/validate-levels.mjs`, no npm/build step — matches the file-header comment convention both `smoke-progress.mjs` (lines 1-21) and `browser-boot.mjs` (lines 1-4) use to document exactly what the script does and how to run it. Reuse that same top-of-file documentation block style.

---

### `scripts/calibrate-jump-envelope.mjs` (one-time Playwright probe)

**Analog:** `scripts/browser-boot.mjs` for the launch/serve skeleton; `scripts/lib/mechanic-drive.mjs` for the `page.evaluate` state-sampling technique.

**Playwright resolution pattern to copy verbatim** (`browser-boot.mjs` lines 6-38):
```js
import { createRequire } from "module";
const FALLBACK_PLAYWRIGHT_PATH =
  "/home/magnus/.nvm/versions/node/v22.22.2/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs";

async function resolvePlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return await import(require.resolve("playwright"));
  } catch {}
  const overridePath = process.env.PLAYWRIGHT_MJS_PATH;
  if (overridePath) return await import(overridePath);
  console.warn(`playwright not resolvable as a project dependency; falling back to ${FALLBACK_PLAYWRIGHT_PATH}. Set PLAYWRIGHT_MJS_PATH to override on other machines.`);
  return await import(FALLBACK_PLAYWRIGHT_PATH);
}
const { chromium } = await resolvePlaywright();
```

**Local static server + CR-02 path-traversal guard — MUST copy verbatim, not simplify** (`browser-boot.mjs` lines 40-100):
```js
const ROOT = new URL("../", import.meta.url);
const ROOT_ABS = resolve(ROOT.pathname);
const PORT = 8765; // choose a different port if run concurrently with browser-boot.mjs

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let reqPath = decodeURIComponent(url.pathname);
  if (reqPath === "/") reqPath = "/index.html";
  // CR-02: resolve + clamp to ROOT so `..` segments can't escape the served directory;
  // require an exact match OR a separator immediately after the root (not a bare
  // startsWith, which a sibling dir name could defeat).
  const filePath = resolve(join(ROOT.pathname, reqPath));
  if (filePath !== ROOT_ABS && !filePath.startsWith(ROOT_ABS + sep)) {
    res.writeHead(403); res.end("Forbidden"); return;
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch { res.writeHead(404); res.end("Not found"); }
});
await new Promise((res) => server.listen(PORT, "127.0.0.1", res)); // loopback-only bind
```

**Launch + context pattern** (`browser-boot.mjs` lines 102-104):
```js
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
const page = await context.newPage();
```

**Direct-state `page.evaluate` sampling pattern to reuse (NOT `driveToXClimbing`'s 120ms poll — see RESEARCH Pitfall 3)** (`mechanic-drive.mjs` lines 174-178 shows the exact idiom to replicate at finer granularity):
```js
const state = await page.evaluate(() => {
  const p = get("player")[0];
  return p ? { x: p.pos.x, y: p.pos.y, grounded: p.isGrounded() } : { x: null, y: null, grounded: false };
});
```

**Reposition-for-determinism pattern (new, per RESEARCH's calibration-probe skeleton — no exact in-repo analog, but consistent with `mechanic-drive.mjs`'s reliance on live `page.evaluate` reads rather than precomputed tables):**
```js
await page.evaluate(({ x, y }) => {
  const p = get("player")[0];
  p.pos.x = x; p.pos.y = y; p.vel = vec2(0);
}, { x: startX, y: floorY - 32 });
await page.waitForTimeout(300); // let reposition settle (Pitfall 2 — first-frame dt() contamination)
```

**Cleanup/exit pattern** (`browser-boot.mjs` lines 213-222):
```js
} catch (e) {
  console.error("Calibration failed:", e.message);
  failed = true;
} finally {
  await context.close();
  await browser.close();
  server.close();
}
process.exit(failed ? 1 : 0);
```

**Frozen-constant documentation convention to mirror** (`src/config.js` line 16 tuning-comment style):
```js
JUMP_FORCE: 520, // px/s — upward impulse; ~3-tile (~96px) jump at GRAVITY 1400 (tuned on strip)
```
The calibration script's output constant must cite raw sampled trial data in its comment the same way, not just restate a formula (RESEARCH Pitfall 1 — this is the auditable proof the measurement was actually empirical).

---

### `scripts/fixtures/bad-level.js` (test fixture, pure-data)

**Analog:** `scripts/fixtures/bad-scene.js` — same "deliberately-bad fixture proves the checker fires RED" convention, adapted from a JS-module-trap domain to a level-geometry-descriptor domain.

**Header-comment convention to mirror** (`bad-scene.js` lines 1-11):
```js
// scripts/fixtures/bad-level.js — DELIBERATELY-BAD level descriptor, level-validator
// calibration fixture.
//
// This is NOT shipped game content. It exists ONLY so validate-levels.mjs's own
// self-test can be proven to go RED independent of whatever levels 1-4 currently
// contain: (a) a mathGate placed squarely over a gap with no stepping-stone
// (over-hole HARD-FAIL), and (b) an isolated platform with a Δy/run combination that
// exceeds even the theoretical closed-form envelope, so it is UNCONDITIONALLY
// unreachable regardless of the exact calibrated numbers (reachability HARD-FAIL).
//
// A shipped-good level (src/levels/level-01.js etc.) must stay GREEN against both
// checks; this fixture is the other half of that calibration: it must go RED.
```

**Shape convention:** mirror the exact geometry object shape asserted in `smoke-progress.mjs`'s `expectedGeometry` blocks (lines 289-344) — `{ floors, platforms, doors, mathGates, enemies, collectZones, ... }` — so `validate-levels.mjs` can consume this fixture through the identical code path as a real `getLevel(id).geometry`.

**Self-test wiring convention** — mirror `check-import-safety.sh`'s calibration self-test invocation style (lines 110-118): assert the fixture file exists, then assert the checker's output specifically names the deliberately-injected defect (not just "non-zero exit") — same "prove the trap regex/check still fires, not just happens to pass" discipline.

---

### Retry-wrapper module (interactive audit upgrade)

**Analog:** `scripts/audit-phase21-mechanics.mjs` (current single-pass caller, to be upgraded/superseded) composing UNCHANGED `scripts/lib/mechanic-drive.mjs` exports.

**Imports pattern — reuse existing exports verbatim, per CONTEXT's "changes isolated to the audit path" constraint:**
```js
import { deriveEncounters, driveToXClimbing, resolveIfBoxed } from "./lib/mechanic-drive.mjs";
```

**Retry/OR-across-attempts pattern (RESEARCH's own synthesized skeleton, grounded in the unmodified exports above and in `browser-boot.mjs`'s per-encounter driving loop lines 168-190):**
```js
export async function auditLevelWithRetries(page, level, { maxAttempts = 5 } = {}) {
  const results = new Map(); // `${tag}@${x}` -> { triggered, resolved, attempts }
  const encounters = deriveEncounters(level.geometry);
  const firstFloorEnd = level.geometry.floors?.[0]
    ? level.geometry.floors[0].x + level.geometry.floors[0].w : 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // caller reloads/navigates to a fresh instance of `level` here before each attempt
    for (const enc of encounters) {
      const key = `${enc.tag}@${enc.x}`;
      if (results.get(key)?.triggered) continue; // already proven reachable — save time
      const opts = enc.x < firstFloorEnd ? { warmupUntilFirstGap: true } : {};
      const { triggered } = await driveToXClimbing(page, enc.x, opts);
      let resolved = results.get(key)?.resolved ?? null;
      if (triggered && enc.renderChoices) ({ resolved } = await resolveIfBoxed(page, true));
      results.set(key, {
        triggered: triggered || (results.get(key)?.triggered ?? false),
        resolved,
        attempts: (results.get(key)?.attempts ?? 0) + 1,
      });
      if (!triggered) break; // matches existing sequential-approach semantics
    }
    if (encounters.every((e) => results.get(`${e.tag}@${e.x}`)?.triggered)) break; // early exit
  }
  return results; // still-false rows → documented exclusions in 23-FINDINGS.md
}
```

**Encounter-driving/warmup-option pattern to preserve unchanged** (`browser-boot.mjs` lines 165-190, identical logic already used per-level) — the `warmupUntilFirstGap` opt-in for the first floor run's encounters must carry over unmodified into the retry wrapper's per-attempt loop.

**Constraint reminder:** `browser-boot.mjs` itself stays untouched (CONTEXT-locked) — the retry wrapper must be a new module or an in-place upgrade of `scripts/audit-phase21-mechanics.mjs` only, never edit `browser-boot.mjs`.

---

## Shared Patterns

### No-framework assertion / exit-code idiom
**Source:** `scripts/smoke-progress.mjs` lines 30-35, 600-605
**Apply to:** `validate-levels.mjs` (all checks), and any self-test entry point for `bad-level.js`
```js
let failures = 0;
const check = (cond, msg) => {
  console.assert(cond, msg);
  if (!cond) failures++;
};
// ...
if (failures > 0) {
  console.error(`<script>: FAIL — ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("<script>: PASS");
```

### Playwright resolution + local static server + CR-02 path-traversal guard
**Source:** `scripts/browser-boot.mjs` lines 6-100
**Apply to:** `calibrate-jump-envelope.mjs` and any retry-wrapper caller that needs its own fresh page/server (must copy the guard verbatim per RESEARCH's Security Domain section — do not simplify the traversal-escape check or the loopback-only bind).

### `?? []` never-brick optional-array guard
**Source:** `scripts/lib/mechanic-drive.mjs` lines 30-33 (`deriveEncounters`); `src/levels/index.js` `getLevel` fallback
**Apply to:** `reachability.mjs`, `over-hole-check.mjs` — every optional geometry array (`platforms`, `doors`, `mathGates`, `enemies`, `collectZones`) must default to `[]`, and a malformed/missing `floors` array must degrade to a FAIL row, never an uncaught exception (per RESEARCH's Security Domain "never brick" convention, echoing `SAVE-05`/`T-13-07`).

### Tuning-comment / empirical-provenance convention for frozen constants
**Source:** `src/config.js` line 16 (`JUMP_FORCE: 520, // ... (tuned on strip)`)
**Apply to:** the calibrated jump-envelope constant written by `calibrate-jump-envelope.mjs` and consumed by `reachability.mjs` — must cite actual sampled trial data + derived margin in its comment, not restate the closed-form formula (RESEARCH Pitfall 1 is the explicit warning sign to avoid).

### `LEVEL_ORDER` / `getLevel` iteration
**Source:** `scripts/browser-boot.mjs` lines 10, 133-134; `scripts/smoke-progress.mjs` lines 28, 258-268
**Apply to:** `validate-levels.mjs`'s per-level loop and the retry-wrapper's caller script — always iterate the live registry import, never a hardcoded level-count literal (explicitly called out in `browser-boot.mjs`'s own WR-02 comments as a drift-safety measure).

## No Analog Found

None — every file in scope has at least a role-match analog already in this repository; the BFS/Δy-aware jump-edge algorithm itself is genuinely new code (no in-repo graph-reachability precedent), but RESEARCH.md's Architecture Patterns section supplies a vetted, project-constants-grounded reference implementation to use in its place.

## Metadata

**Analog search scope:** `scripts/`, `scripts/lib/`, `scripts/fixtures/`, `src/levels/`, `src/config.js`
**Files scanned:** `scripts/smoke-progress.mjs`, `scripts/browser-boot.mjs`, `scripts/lib/mechanic-drive.mjs`, `scripts/audit-phase21-mechanics.mjs`, `scripts/fixtures/bad-scene.js`, `src/levels/index.js`, `src/config.js`, `scripts/check-import-safety.sh`
**Pattern extraction date:** 2026-07-05
