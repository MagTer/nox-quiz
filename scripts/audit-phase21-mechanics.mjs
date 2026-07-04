#!/usr/bin/env node
// Phase 21 (VERIFY-01/02) interactive mechanic audit — drives REAL player movement
// (held ArrowRight + tapped Space over authored gaps) and REAL answer-key input
// (keys 1-4) against door.js/gates.js/enemy.js/mathGate.js/collect.js across all 4
// levels. This is NOT a teleport-only or save-seeded pre-clear check — every mechanic
// is actually approached and actually triggered/resolved via the same input surface a
// real player uses, mirroring the rigor of the v4.0 post-ship collect.js diagnostic.
//
// Reuses scripts/screenshot-phase20.mjs's server/MIME/chromium/try-finally skeleton
// and scripts/browser-boot.mjs's title->select->level navigation + SAVE_KEY/SAVE_BLOB
// pattern verbatim. PORT 8768 (8765/6/7 already taken by browser-boot.mjs/
// screenshot-phase18.mjs/screenshot-phase20.mjs).
//
// This script always exits 0 — it is a diagnostic tool whose console output (the JSON
// results array + the final AUDIT: line) is interpreted by Task 2, not a pass/fail
// commit gate like browser-boot.mjs.

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join, resolve, sep } from "path";
import { getLevel, LEVEL_ORDER } from "../src/levels/index.js";
import { CONFIG } from "../src/config.js";

// WR-02: resolve playwright dynamically instead of a hardcoded, machine-specific absolute
// path. Tries (1) normal project-relative resolution (works once `playwright` is a real
// devDependency), then (2) an explicit override via PLAYWRIGHT_MJS_PATH (for CI/other
// machines), then (3) this machine's known global install location as a last-resort
// fallback so the script keeps working here without requiring a package.json/npm install
// in this zero-dependency, no-build-step project (see CLAUDE.md).
const FALLBACK_PLAYWRIGHT_PATH =
  "/home/magnus/.nvm/versions/node/v22.22.2/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs";

async function resolvePlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return await import(require.resolve("playwright"));
  } catch {
    // not resolvable as a normal project dependency — fall through
  }
  const overridePath = process.env.PLAYWRIGHT_MJS_PATH;
  if (overridePath) return await import(overridePath);
  console.warn(
    `playwright not resolvable as a project dependency; falling back to ${FALLBACK_PLAYWRIGHT_PATH}. ` +
      "Set PLAYWRIGHT_MJS_PATH to override on other machines."
  );
  return await import(FALLBACK_PLAYWRIGHT_PATH);
}

const { chromium } = await resolvePlaywright();

const ROOT = new URL("../", import.meta.url);
const ROOT_ABS = resolve(ROOT.pathname);
const PORT = 8768;

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

const SAVE_KEY = "mathlab_platformer_v2";
// WR-02: derive the unlocked-levels blob from the live LEVEL_ORDER import instead of a
// hardcoded 3-level literal, so it can never silently drift out of sync with the real
// level roster if a level is added or removed (unlock is derived: clearing level-N
// unlocks N+1, so marking every level except the last "cleared" unlocks all of them).
const SAVE_BLOB = {
  version: 2,
  xp: 0,
  level: 1,
  accuracy: {},
  history: {},
  levels: Object.fromEntries(LEVEL_ORDER.slice(0, -1).map((id) => [id, { cleared: true }])),
};

const OUT = (name) =>
  new URL(
    `../.planning/phases/21-real-verification-pass-mechanics-sign-off-integrity-perform-/screenshots/${name}`,
    import.meta.url
  ).pathname;

/**
 * Sort geometry.floors by x ascending; for each adjacent pair, if the next floor
 * starts after the previous one ends, that's a gap. Returns [] if the level has
 * no gaps (contiguous floor runs).
 */
function deriveGapRanges(geometry) {
  const floors = [...(geometry.floors ?? [])].sort((a, b) => a.x - b.x);
  const gaps = [];
  for (let i = 0; i < floors.length - 1; i++) {
    const prev = floors[i];
    const next = floors[i + 1];
    if (next.x > prev.x + prev.w) {
      gaps.push({ start: prev.x + prev.w, end: next.x });
    }
  }
  return gaps;
}

/**
 * WR-04: driveToX's `jumped` Set (keyed by gap.start) permits at most ONE Space press
 * per gap for the entire approach — this currently works only because every authored
 * gap is (assumed to be) narrower than a single jump's full horizontal travel distance,
 * a coincidence of tuning that was previously neither checked nor asserted anywhere. If
 * a level's gap is at or beyond that distance, or RUN_SPEED/JUMP_FORCE/GRAVITY are
 * retuned (all three are explicitly called out elsewhere as Phase-12 targets), driveToX
 * silently starts reporting "mechanic unreachable" for every encounter past that gap,
 * with nothing connecting the failure to this assumption. Surface it loudly, per level,
 * BEFORE any driving happens, so the assumption's violation is immediately attributable
 * instead of surfacing only as a confusing downstream "reachedX far short of targetX"
 * symptom buried in the results.
 *
 * Deliberately NON-FATAL (console.error, not throw): this script's own header states it
 * "always exits 0 — it is a diagnostic tool," and empirically (this task) at least one
 * shipped level's gap already sits right at this boundary — a hard throw here would
 * crash the whole diagnostic run and produce LESS signal than the "mechanic unreachable"
 * message driveToX already logs per-encounter, not more. A future fix for the underlying
 * one-jump-per-gap limitation is tracked as WR-04's "consider supporting multiple jumps
 * per gap"; this check's job is only to make the assumption's violation loud and
 * attributable, not to change driveToX's jump behavior.
 */
function assertGapsAreSingleJumpable(levelId, gapRanges) {
  const jumpHangtimeS = (2 * CONFIG.JUMP_FORCE) / CONFIG.GRAVITY; // full up+down arc, symmetric
  const maxJumpDistance = CONFIG.RUN_SPEED * jumpHangtimeS;
  for (const gap of gapRanges) {
    const width = gap.end - gap.start;
    if (width >= maxJumpDistance) {
      console.error(
        `WR-04 WARNING: ${levelId}: gap [${gap.start}, ${gap.end}) is ${width}px wide — at or ` +
          `beyond the ~${maxJumpDistance.toFixed(1)}px single-jump travel distance current ` +
          `RUN_SPEED(${CONFIG.RUN_SPEED})/JUMP_FORCE(${CONFIG.JUMP_FORCE})/GRAVITY(${CONFIG.GRAVITY}) ` +
          `tuning allows. driveToX's one-Space-press-per-gap model cannot reliably clear this — ` +
          `expect "mechanic unreachable" for encounters past this gap below. Update driveToX to ` +
          `support multiple jumps per gap, or retune the level/physics.`
      );
    }
  }
}

/**
 * Merge every mechanic type present in geometry into one ascending-x-sorted list,
 * each tagged with its Kaplay collision tag and whether challenge.js renders an
 * answer-box grid for it (door/mathGate/enemy: true; collect zone: false).
 */
function deriveEncounters(geometry) {
  const entries = [
    ...(geometry.doors ?? []).map((d) => ({ x: d.x, tag: "door", renderChoices: true })),
    ...(geometry.mathGates ?? []).map((g) => ({ x: g.x, tag: "math-gate", renderChoices: true })),
    ...(geometry.enemies ?? []).map((e) => ({ x: e.x, tag: "enemy", renderChoices: true })),
    ...(geometry.collectZones ?? []).map((c) => ({ x: c.x, tag: "answer-zone", renderChoices: false })),
  ];
  entries.sort((a, b) => a.x - b.x);
  return entries;
}

/**
 * Hold ArrowRight and poll live player.pos.x until targetX is reached (or a
 * challenge already triggered mid-approach). Taps Space just before any gap
 * range on the path (tracking a `jumped` Set so a gap is only tapped once).
 * Always releases ArrowRight before returning, whether by break or the 80-
 * iteration cap. Returns { reachedX, triggered }.
 */
async function driveToX(page, targetX, gapRanges) {
  // Bug fix (Rule 1): a prior encounter's collect-zone challenge (renderChoices:false)
  // is deliberately left OPEN by resolveIfBoxed (movement stays live, per collect.js's
  // design) — so a bare `get("challenge").length > 0` check here would report the very
  // NEXT mechanic as instantly "triggered" from a stale, unrelated challenge that never
  // closed, before the player has moved at all. Capture a baseline count and only treat
  // a challenge as newly triggered when the live count exceeds that baseline.
  const baseline = await page.evaluate(() => get("challenge").length);

  // WR-03: the pre-gap detection window was a bare `24` literal — exactly one sample
  // step's worth of movement at RUN_SPEED(240px/s) * POLL_MS(100ms), with zero margin for
  // waitForTimeout's "at least N ms" semantics or evaluate() round-trip latency. A single
  // slow tick could jump straight past the window and miss the trigger. Derive the window
  // from RUN_SPEED * POLL_MS with an explicit 1.5x margin instead of a bare literal, so it
  // scales with tuning and always covers more than one real sample step.
  const POLL_MS = 100;
  const perTickPx = CONFIG.RUN_SPEED * (POLL_MS / 1000);
  const PRE_GAP_WINDOW = perTickPx * 1.5;

  await page.keyboard.down("ArrowRight");
  const jumped = new Set();
  let x = null;
  let triggered = false;
  let iterations = 0;

  try {
    for (let i = 0; i < 80; i++) {
      iterations = i + 1;
      await page.waitForTimeout(POLL_MS);
      x = await page.evaluate(() => {
        const p = get("player")[0];
        return p ? p.pos.x : null;
      });

      if (x !== null) {
        for (const gap of gapRanges) {
          if (!jumped.has(gap.start) && x >= gap.start - PRE_GAP_WINDOW && x < gap.end) {
            // Playwright's key name is "Space" (capitalized) — matches every other
            // Space press already used in browser-boot.mjs/screenshot-phase20.mjs;
            // the lowercase "space" throws "Unknown key" (Rule 1 fix).
            //
            // Bug fix (Rule 1): a bare press() sends keydown+keyup back-to-back, which
            // src/player.js's onKeyRelease(JUMP_KEYS) reads as an EARLY release while
            // still rising (vel.y < 0) and applies CONFIG.JUMP_CUT (0.45x), truncating
            // the jump to a fraction of its range — nowhere near enough to clear an
            // authored gap. Holding through delay:450ms (> JUMP_FORCE/GRAVITY = 371ms
            // time-to-apex) means release always happens at or past the apex (vel.y >=
            // 0), so the cut never applies and the jump covers its full, intended arc.
            await page.keyboard.press("Space", { delay: 450 });
            jumped.add(gap.start);
          }
        }
      }

      const challengeCount = await page.evaluate(() => get("challenge").length);
      triggered = challengeCount > baseline;

      if ((x !== null && x >= targetX - 16) || triggered) {
        break;
      }
    }

    if (iterations >= 80 && !((x !== null && x >= targetX - 16) || triggered)) {
      console.error(
        `driveToX: 80 iterations elapsed without reaching targetX=${targetX} or triggering a challenge (reachedX=${x}) — genuine "mechanic unreachable" finding, not a script bug.`
      );
    }
  } finally {
    await page.keyboard.up("ArrowRight");
  }

  return { reachedX: x, triggered };
}

/**
 * Resolve an already-triggered challenge if it renders an answer-box grid
 * (renderChoices:true — door/math-gate/enemy). collect.js's zone renders
 * renderChoices:false and has NO key handlers per challenge.js — never press a
 * numeric key for it; movement stays live so the outer loop continues past it.
 */
async function resolveIfBoxed(page, renderChoices) {
  if (!renderChoices) {
    return { resolved: null };
  }

  // Bug fix (Rule 1): if driveToX never actually reached this mechanic (80-iteration
  // cap hit, no challenge ever opened), get("challenge").length is already 0 here. The
  // original cycle pressed 1-4 anyway and read `left === 0` as "resolved" on the very
  // first check — vacuously true, since there was nothing open to resolve in the first
  // place. Guard against that false positive: only attempt resolution if a challenge is
  // actually open; otherwise report resolved:false (nothing to resolve == not resolved).
  const initial = await page.evaluate(() => get("challenge").length);
  if (initial === 0) {
    return { resolved: false };
  }

  // CR-01 fix (2nd review pass): an absolute `left === 0` check is invalid whenever a
  // prior challenge was deliberately left open (collect.js's renderChoices:false zones
  // stay open by design — driveToX's own baseline comment above documents this exact
  // leftover-count hazard). `initial` here already reflects that leftover count, so
  // mirror driveToX's baseline/decrease pattern: this SPECIFIC challenge resolved once
  // the shared tag count drops BELOW `initial`, not only when it hits zero.
  for (const k of ["1", "2", "3", "4"]) {
    await page.keyboard.press(k);
    await page.waitForTimeout(200);
    const left = await page.evaluate(() => get("challenge").length);
    if (left < initial) {
      return { resolved: true };
    }
  }

  return { resolved: false };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let reqPath = decodeURIComponent(url.pathname);
  if (reqPath === "/") reqPath = "/index.html";
  // CR-02: resolve + clamp to ROOT so `..` segments can't escape the served directory
  // (path traversal), and bind to loopback only (not all interfaces) below. A bare
  // `.startsWith(ROOT_ABS)` has no path-separator boundary, so a sibling directory whose
  // name happens to start with ROOT_ABS's own name (e.g. "nox-quiz-evil" next to
  // "nox-quiz") would incorrectly pass. Require an exact match OR a separator immediately
  // after the root.
  const filePath = resolve(join(ROOT.pathname, reqPath));
  if (filePath !== ROOT_ABS && !filePath.startsWith(ROOT_ABS + sep)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    const data = await readFile(filePath);
    const mime = MIME[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  } catch (e) {
    res.writeHead(404);
    res.end("Not found");
  }
});

// WR-04: run the single-jump-per-gap assertion for every level's geometry BEFORE
// launching the browser at all ("at script startup", per the fix) — this is pure data
// derived from level.geometry, no page/browser dependency required.
for (const id of LEVEL_ORDER) {
  assertGapsAreSingleJumpable(id, deriveGapRanges(getLevel(id).geometry));
}

await new Promise((res) => server.listen(PORT, "127.0.0.1", res));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
const page = await context.newPage();

const results = [];

try {
  await page.goto(`http://localhost:${PORT}/src/index.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500); // let Kaplay init and title scene paint

  await page.evaluate(
    ({ key, blob }) => localStorage.setItem(key, JSON.stringify(blob)),
    { key: SAVE_KEY, blob: SAVE_BLOB }
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // Title -> select.
  await page.keyboard.press("Space");
  await page.waitForTimeout(800);

  for (let i = 0; i < LEVEL_ORDER.length; i++) {
    // Move the select cursor to the i-th tile (first tile already focused).
    for (let j = 0; j < i; j++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(150);
    }

    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500); // let the game scene build the level

    const level = getLevel(LEVEL_ORDER[i]);
    const gapRanges = deriveGapRanges(level.geometry);
    const encounters = deriveEncounters(level.geometry);

    for (const encounter of encounters) {
      const { reachedX, triggered } = await driveToX(page, encounter.x, gapRanges);

      await page.screenshot({
        path: OUT(`${level.id}-${encounter.tag}-${encounter.x}-before.png`),
      });

      const { resolved } = await resolveIfBoxed(page, encounter.renderChoices);

      await page.screenshot({
        path: OUT(`${level.id}-${encounter.tag}-${encounter.x}-after.png`),
      });

      results.push({
        level: level.id,
        tag: encounter.tag,
        x: encounter.x,
        reachedX,
        triggered,
        resolved,
      });
    }

    // Back to select for the next level.
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);
  }

  console.log(JSON.stringify(results, null, 2));

  // WR-01: the previous `allGood` computation here was dead (never read) and referenced a
  // non-existent `r.renderChoices` field on the pushed result objects — removed. Pass/fail
  // is driven entirely by `allResolvedOrCollect`/`failing` below, keyed off `r.tag`.
  const allResolvedOrCollect = results.every((r) => {
    if (r.tag === "answer-zone") return r.triggered === true;
    return r.triggered === true && r.resolved === true;
  });

  if (allResolvedOrCollect) {
    console.log("AUDIT: ALL MECHANICS RESOLVED");
  } else {
    const failing = results.filter((r) => {
      if (r.tag === "answer-zone") return r.triggered !== true;
      return r.triggered !== true || r.resolved !== true;
    });
    console.log("AUDIT: FAILURES DETECTED");
    console.log(JSON.stringify(failing, null, 2));
  }
} finally {
  await context.close();
  await browser.close();
  server.close();
}

process.exit(0);
