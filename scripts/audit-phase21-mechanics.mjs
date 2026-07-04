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

import { chromium } from "/home/magnus/.nvm/versions/node/v22.22.2/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join } from "path";
import { getLevel, LEVEL_ORDER } from "../src/levels/index.js";

const ROOT = new URL("../", import.meta.url);
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
const SAVE_BLOB = {
  version: 2,
  xp: 0,
  level: 1,
  accuracy: {},
  history: {},
  levels: {
    "level-01": { cleared: true },
    "level-02": { cleared: true },
    "level-03": { cleared: true },
  },
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

  await page.keyboard.down("ArrowRight");
  const jumped = new Set();
  let x = null;
  let triggered = false;
  let iterations = 0;

  try {
    for (let i = 0; i < 80; i++) {
      iterations = i + 1;
      await page.waitForTimeout(100);
      x = await page.evaluate(() => {
        const p = get("player")[0];
        return p ? p.pos.x : null;
      });

      if (x !== null) {
        for (const gap of gapRanges) {
          if (!jumped.has(gap.start) && x >= gap.start - 24 && x < gap.end) {
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

  for (const k of ["1", "2", "3", "4"]) {
    await page.keyboard.press(k);
    await page.waitForTimeout(200);
    const left = await page.evaluate(() => get("challenge").length);
    if (left === 0) {
      return { resolved: true };
    }
  }

  return { resolved: false };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let path = decodeURIComponent(url.pathname);
  if (path === "/") path = "/index.html";
  const filePath = join(ROOT.pathname, path);
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

await new Promise((res) => server.listen(PORT, res));

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

  const allGood = results.every(
    (r) => r.triggered === true && (r.renderChoices === false || r.resolved !== false)
  );
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
