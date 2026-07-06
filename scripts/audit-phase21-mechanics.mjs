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
// Phase 23 (VALID-03 groundwork) upgrade: each level is now driven through
// scripts/lib/audit-retry.mjs's auditLevelWithRetries (maxAttempts: 5) instead of a
// single pass — an encounter counts as reached if ANY attempt reaches it, per
// 23-CONTEXT.md's "3-5 retries, OR-across-attempts" design. This script's own
// select-screen navigation (Escape -> re-position cursor -> Enter) is the
// `reloadLevel` callback the wrapper calls before each retry attempt.
// scripts/lib/mechanic-drive.mjs and scripts/browser-boot.mjs remain byte-identical —
// the retry upgrade is isolated to this caller script + the new wrapper module only.
//
// This script always exits 0 — it is a diagnostic tool whose console output (the JSON
// results array + the final AUDIT: line) is interpreted by Task 2, not a pass/fail
// commit gate like browser-boot.mjs.

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join, resolve, sep } from "path";
import { getLevel, LEVEL_ORDER } from "../src/levels/index.js";
import { auditLevelWithRetries } from "./lib/audit-retry.mjs";

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

await new Promise((res) => server.listen(PORT, "127.0.0.1", res));

const browser = await chromium.launch({ headless: true });

const results = [];

// Phase 24 (24-06): per-level context recycling — a fresh browser context/page for
// each of the 4 levels, while the single `browser` process stays alive across levels.
// Session-state hygiene only: bounds each level's browser-session lifetime instead of
// letting one context accumulate state across the whole (Phase-24-lengthened) run.
//
// HISTORY / CORRECTED DIAGNOSIS: this recycling was first added chasing an uncaught
// `browserContext.close: Target page, context or browser has been closed` exception,
// then attributed to headless-Chromium/WebGL degradation. That attribution was WRONG.
// The real cause chain (see scripts/lib/route-planner.mjs's header): the old blind
// bunny-hopping driver got deterministically stuck on marginal jumps, the retry
// wrapper multiplied the wasted wall-clock past the caller's `timeout` budget, and
// timeout's SIGTERM fired Playwright's own graceful-shutdown handler (which closes
// the browser), making whatever Playwright call was in flight reject with the
// misleading "has been closed" error. Fixing the driver (geometry-informed planned
// takeoffs) removed the stall; the recycling is kept as cheap hygiene.
// Scope: isolated to this caller script's own session-management code — does not
// change `scripts/lib/mechanic-drive.mjs`, `scripts/lib/audit-retry.mjs`, or
// `scripts/browser-boot.mjs` (auditLevelWithRetries only ever touches `page`, never
// `context`, so this is a pure session-lifecycle change with zero effect on
// triggered/resolved semantics).
async function newLevelPage() {
  const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await context.newPage();

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

  return { context, page };
}

try {
  for (let i = 0; i < LEVEL_ORDER.length; i++) {
    const { context, page } = await newLevelPage();

    try {
      // Move the select cursor to the i-th tile (first tile already focused after a
      // fresh title -> select entry).
      for (let j = 0; j < i; j++) {
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(150);
      }

      await page.keyboard.press("Enter");
      await page.waitForTimeout(1500); // let the game scene build the level

      const level = getLevel(LEVEL_ORDER[i]);

      // Phase 23: reloadLevel is the retry wrapper's own navigation callback — it
      // performs exactly the same re-entry the block above already does for the FIRST
      // entry into this level (Escape back to select, reposition the cursor on tile i,
      // Enter, settle), so each retry attempt starts from a genuinely fresh level
      // instance rather than the player's end-of-attempt state. Unchanged by the
      // Phase 24 context-recycling fix — reloadLevel still operates within the SAME
      // per-level page across that level's own retry attempts; only the OUTER loop
      // (across levels) now gets a fresh context/page.
      async function reloadLevel() {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(800);
        for (let j = 0; j < i; j++) {
          await page.keyboard.press("ArrowRight");
          await page.waitForTimeout(150);
        }
        await page.keyboard.press("Enter");
        await page.waitForTimeout(1500);
      }

      const levelResults = await auditLevelWithRetries(page, level, {
        maxAttempts: 5,
        reloadLevel,
      });

      // Convert the wrapper's `${tag}@${x}` -> {triggered, resolved, attempts} Map into
      // the same flat results array shape this script already builds and prints.
      // `reachedX` is not tracked by the wrapper (only triggered/resolved feed the
      // pass/fail logic below), so it is recorded as null. `attempts` is carried through
      // as an extra field (beyond the pass/fail-relevant triggered/resolved/tag) so the
      // 23-FINDINGS.md retry-harness table can cite this run's own printed JSON directly.
      for (const [key, outcome] of levelResults) {
        const atIdx = key.lastIndexOf("@");
        results.push({
          level: level.id,
          tag: key.slice(0, atIdx),
          x: Number(key.slice(atIdx + 1)),
          reachedX: null,
          triggered: outcome.triggered,
          resolved: outcome.resolved,
          attempts: outcome.attempts,
        });
      }
    } finally {
      // Recycle this level's context before moving to the next level (or exiting the
      // loop) — this is the load-bearing part of the fix, bounding each level's
      // browser-session lifetime instead of letting it grow unbounded across all 4.
      await context.close();
    }
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
  // Per-level `context` instances are already closed by the inner try/finally above;
  // only the single long-lived `browser` process and the static file server remain.
  await browser.close();
  server.close();
}

process.exit(0);
