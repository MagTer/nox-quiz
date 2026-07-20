// scripts/calibrate-jump-envelope.mjs — ONE-TIME Playwright probe (VALID-02).
//
// Measures REAL jump physics against the running vendored Kaplay engine: max
// standing-jump rise and max running-jump horizontal reach, sampled at a fine
// (~16ms) per-frame cadence — never the coarse 120ms poll driveToXClimbing uses
// for traversal (that under-samples the apex/landing and would bias the
// measurement — see 23-RESEARCH.md Pitfall 3). This is what upgrades Phase 22's
// flat, no-safety-factor CONFIG-formula heuristic into a real, empirically-backed
// envelope with a documented margin.
//
// This is a MANUALLY-INVOKED, non-routine script (CONTEXT-locked): run it once,
// review its printed trial data, then hand-derive the frozen JUMP_ENVELOPE
// constant into scripts/lib/jump-envelope.mjs's header comment. The routine
// validator (scripts/validate-levels.mjs, built in a later wave) NEVER launches a
// browser — only this script and the interactive audit do. Re-run this probe ONLY
// if CONFIG.RUN_SPEED / GRAVITY / JUMP_FORCE is ever retuned.
//
// Run: node scripts/calibrate-jump-envelope.mjs
//
// Serves src/ on a local loopback-only port (8769 — 8765/8766/8767/8768 are already
// used by browser-boot.mjs/screenshot-phase18.mjs/screenshot-phase20.mjs/
// audit-phase21-mechanics.mjs). Copies browser-boot.mjs's resolvePlaywright() and
// local static server VERBATIM, including its CR-02 path-traversal guard and
// loopback-only bind — see scripts/browser-boot.mjs for the canonical source. Do
// not simplify or rewrite either guard.

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync } from "fs";
import { extname, join, resolve, sep } from "path";
import { CONFIG } from "../src/config.js";

// --- Playwright resolution (copied verbatim from scripts/browser-boot.mjs) ---
const FALLBACK_PLAYWRIGHT_PATH = (() => {
  // gsd-pi's bundled playwright moves whenever gsd-pi is (re)installed under a
  // different nvm node version (the previously pinned v22.22.2 copy vanished on
  // 2026-07-07 after gsd-pi landed under v20.20.0), so search EVERY installed node
  // version, newest first, instead of pinning one path that silently goes stale.
  const base = `${process.env.HOME}/.nvm/versions/node`;
  try {
    for (const v of readdirSync(base).sort().reverse()) {
      // Node-v24 drift fix (2026-07-20): playwright may be installed globally in its own
      // right (npm i -g playwright — the current layout on this box) OR bundled under
      // gsd-pi (the historical layout). Check BOTH per node version, direct install first.
      for (const p of [
        `${base}/${v}/lib/node_modules/playwright/index.mjs`,
        `${base}/${v}/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs`,
      ]) {
        if (existsSync(p)) return p;
      }
    }
  } catch {
    // ~/.nvm missing entirely — fall through to the historical pin below
  }
  return `${base}/v22.22.2/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs`;
})();

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

// --- Local static server (copied verbatim from scripts/browser-boot.mjs) ---
const ROOT = new URL("../", import.meta.url);
const ROOT_ABS = resolve(ROOT.pathname);
const PORT = 8769; // 8765/8766/8767/8768 already used by other scripts (see header comment)

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
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
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

// --- Measurement helpers ---
//
// Fine ~16ms per-frame sampling (roughly one frame at 60fps) — NOT
// driveToXClimbing's 120ms traversal poll cadence, which under-samples the apex
// of a jump arc and would systematically under-measure max rise (RESEARCH
// Pitfall 3). Both measurement functions hold the jump key through the WHOLE
// flight (down() ... up() only after landing) so CONFIG.JUMP_CUT (variable-height
// early-release cut) never truncates the measured arc.

/**
 * Reposition the player to a deterministic, grounded starting point and let it
 * settle for 300ms before the caller starts sampling — avoids first-frame dt()
 * contamination (RESEARCH Pitfall 2: a reposition's very next frame can have an
 * anomalously large dt()).
 */
async function repositionAndSettle(page, startX, floorY) {
  await page.evaluate(
    ({ x, y }) => {
      const p = get("player")[0];
      p.pos.x = x;
      p.pos.y = y;
      p.vel = vec2(0);
    },
    { x: startX, y: floorY - 32 }
  );
  await page.waitForTimeout(300);
}

/**
 * Standing max-jump-rise measurement: hold Space through the full arc, sample
 * {y, grounded} every ~16ms, track the minimum y observed (Kaplay's Y axis
 * increases downward, so "up" is a smaller y). Break once at least 5 iterations
 * have elapsed AND the player is grounded again (landed).
 */
async function measureStandingJump(page, startX, floorY) {
  await repositionAndSettle(page, startX, floorY);

  await page.keyboard.down("Space");
  let minY = floorY - 32;
  try {
    for (let i = 0; i < 120; i++) {
      const s = await page.evaluate(() => {
        const p = get("player")[0];
        return { y: p.pos.y, grounded: p.isGrounded() };
      });
      if (s.y < minY) minY = s.y;
      if (i >= 5 && s.grounded) break;
      await page.waitForTimeout(16);
    }
  } finally {
    await page.keyboard.up("Space");
  }

  return { rise: floorY - 32 - minY };
}

/**
 * Running max-jump-reach measurement: hold ArrowRight + Space together through
 * the full arc, sample {x, grounded} every ~16ms. Record the x at the first
 * grounded true->false transition (liftoff) and the x at the next grounded
 * false->true transition after that (landing); reach is the difference.
 */
async function measureRunningJump(page, startX, floorY) {
  await repositionAndSettle(page, startX, floorY);

  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("Space");

  let liftoffX = null;
  let landingX = null;
  let prevGrounded = true; // reposition settles grounded, per repositionAndSettle
  try {
    for (let i = 0; i < 120; i++) {
      const s = await page.evaluate(() => {
        const p = get("player")[0];
        return { x: p.pos.x, grounded: p.isGrounded() };
      });
      if (liftoffX === null && prevGrounded && !s.grounded) {
        liftoffX = s.x;
      } else if (liftoffX !== null && landingX === null && !prevGrounded && s.grounded) {
        landingX = s.x;
      }
      prevGrounded = s.grounded;
      if (liftoffX !== null && landingX !== null) break;
      await page.waitForTimeout(16);
    }
  } finally {
    await page.keyboard.up("Space");
    await page.keyboard.up("ArrowRight");
  }

  const reach = liftoffX !== null && landingX !== null ? landingX - liftoffX : 0;
  return { reach };
}

function summarize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return { min, mean, max };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
const page = await context.newPage();

let failed = false;
try {
  await page.goto(`http://localhost:${PORT}/src/index.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500); // let Kaplay init and the title scene paint

  // Title -> select. Level-01 is unlocked by default on a fresh save (it is always
  // the first, always-open level per src/levels/index.js's isUnlocked) — no
  // localStorage seeding is needed here, unlike browser-boot.mjs's multi-level sweep.
  await page.keyboard.press("Space");
  await page.waitForTimeout(800);

  // Select -> level-01 (the cursor already sits on tile 0).
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500); // let the level build

  const startX = 50; // well clear of level-01's collect zone at x:300, even after a hop
  const floorY = CONFIG.FLOOR_Y;

  console.log("=== JUMP ENVELOPE CALIBRATION ===");
  console.log(`CONFIG: RUN_SPEED=${CONFIG.RUN_SPEED} GRAVITY=${CONFIG.GRAVITY} JUMP_FORCE=${CONFIG.JUMP_FORCE}`);
  console.log("");

  const standingRises = [];
  console.log("--- standing-jump trials (max rise) ---");
  for (let trial = 1; trial <= 12; trial++) {
    const { rise } = await measureStandingJump(page, startX, floorY);
    standingRises.push(rise);
    console.log(`  trial ${trial}: rise=${rise.toFixed(2)}px`);
  }

  const runningReaches = [];
  console.log("--- running-jump trials (max horizontal reach) ---");
  for (let trial = 1; trial <= 12; trial++) {
    const { reach } = await measureRunningJump(page, startX, floorY);
    runningReaches.push(reach);
    console.log(`  trial ${trial}: reach=${reach.toFixed(2)}px`);
  }

  const standingSummary = summarize(standingRises);
  const runningSummary = summarize(runningReaches);

  console.log("");
  console.log("--- SUMMARY ---");
  console.log(
    `standing rise: min=${standingSummary.min.toFixed(2)} mean=${standingSummary.mean.toFixed(2)} max=${standingSummary.max.toFixed(2)}`
  );
  console.log(
    `running reach: min=${runningSummary.min.toFixed(2)} mean=${runningSummary.mean.toFixed(2)} max=${runningSummary.max.toFixed(2)}`
  );
  console.log(`standing rise trials: [${standingRises.map((v) => v.toFixed(2)).join(", ")}]`);
  console.log(`running reach trials: [${runningReaches.map((v) => v.toFixed(2)).join(", ")}]`);
} catch (e) {
  console.error("Calibration failed:", e.message);
  failed = true;
} finally {
  await context.close();
  await browser.close();
  server.close();
}

process.exit(failed ? 1 : 0);
