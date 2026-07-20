#!/usr/bin/env node
// Capture in-engine MOTION screenshots for the Phase 36 human-verify sign-off (the
// harness-first -> 2-level trial -> sign-off -> remaining-6 rollout). This is the
// telegraph/motion EVIDENCE PACKET the hazard-placement checkpoint (36-06) reviews:
// it proves each trial level's moving platforms and patrollers are placed where their
// paths READ — a mover caught MID-TRAVEL (visibly between its two ping-pong endpoints,
// not parked), and the patroller on its walk path — so a human can judge whether the
// far end is visible from the ledge you commit from (LEVEL-DESIGN §6b rule 4, telegraph).
//
// Cloned VERBATIM from scripts/screenshot-phase35-props.mjs's static-file-server/MIME/
// chromium/save-seed/title->select->game-nav skeleton (per this project's established
// convention of copying Playwright script boilerplate BY HAND rather than extracting a
// shared module — see CLAUDE.md "Playwright script duplication is deliberate"). Only the
// OUT_DIR, the default target list (the trial pair 01+06), the port, and the per-level
// shot list (spawn + mover-mid-travel + patroller, replacing phase-35's climb-altitude
// shot) differ from the phase-35 props shooter.
//
// PORT 8778 — the next free port after phase-35's 8777 in the 8765-8777 range already
// claimed across the audit/screenshot/calibrate scripts.
//
// Why this script exists: ART-PARITY-STEERING.md records that NONE of the automated
// gates look at rendered pixels, and a mover/patroller placement that passes every
// gate can still read as an unfair timing gamble on screen. Any motion-placement change
// must therefore end with real in-engine screenshots; this is that proof.
//
// Usage:
//   node scripts/screenshot-phase36-motion.mjs                 (the trial pair 01 + 06)
//   node scripts/screenshot-phase36-motion.mjs level-01        (just one)
//   node scripts/screenshot-phase36-motion.mjs level-01 level-06 level-03

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync, mkdirSync } from "fs";
import { extname, join, resolve, sep } from "path";
import { LEVEL_ORDER, getLevel } from "../src/levels/index.js";

// WR-02 (ported from browser-boot.mjs): resolve playwright dynamically instead of a
// hardcoded, machine-specific absolute path.
const FALLBACK_PLAYWRIGHT_PATH = (() => {
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

const ROOT = new URL("../", import.meta.url);
const ROOT_ABS = resolve(ROOT.pathname);
const PORT = 8778;

const BIOME_OF_LEVEL = {
  "level-01": "swamp",
  "level-02": "swamp",
  "level-03": "town",
  "level-04": "town",
  "level-05": "cemetery",
  "level-06": "cemetery",
  "level-07": "castle",
  "level-08": "castle",
};

// Optional CLI arg list: which level ids to shoot. DEFAULT = the trial pair (01 + 06),
// the two levels 36-05 authors motion on. Filters against LEVEL_ORDER so a typo can't
// silently ask for a non-existent level.
const REQUESTED = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const DEFAULT_TARGETS = ["level-01", "level-06"];
const TARGET_LEVELS = REQUESTED.length
  ? LEVEL_ORDER.filter((id) => REQUESTED.includes(id))
  : LEVEL_ORDER.filter((id) => DEFAULT_TARGETS.includes(id));
if (REQUESTED.length && TARGET_LEVELS.length !== REQUESTED.length) {
  const unknown = REQUESTED.filter((id) => !LEVEL_ORDER.includes(id));
  console.error(`Unknown level id(s): ${unknown.join(", ")} — valid: ${LEVEL_ORDER.join(", ")}`);
  process.exit(1);
}

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

const SAVE_KEY = "noxrun_platformer_v1";
// Derive the unlocked-levels blob from the live LEVEL_ORDER import (browser-boot.mjs's
// own WR-02 idiom) so this script can never silently drift if a level is added/removed.
const SAVE_BLOB = {
  version: 3,
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
  // CR-02 (ported): resolve + clamp to ROOT so `..` segments can't escape the served
  // directory; loopback-only bind below.
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
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

await new Promise((res) => server.listen(PORT, "127.0.0.1", res));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
const page = await context.newPage();

const OUT_DIR = new URL(
  "../.planning/phases/36-world-motion-ambient-life/motion-shots/",
  import.meta.url
).pathname;
mkdirSync(OUT_DIR, { recursive: true });
const OUT = (name) => join(OUT_DIR, name);

// Reposition the REAL player to (targetX, surfaceY) and pin it there across a short
// settle window so the clamped follow camera (src/camera.js lerps) eases onto that x
// before the shot — the repositionAndSettle idiom from screenshot-phase35-props.mjs's
// climb capture, reused here to frame an off-spawn mover/patroller. Gravity keeps the
// player grounded once placed, so a light re-pin (vel zeroed) is enough.
async function frameX(targetX, surfaceY) {
  for (let k = 0; k < 12; k++) {
    const ok = await page.evaluate(
      ({ x, y }) => {
        const p = get("player")[0];
        if (!p) return false;
        p.pos.x = x;
        p.pos.y = y;
        if (p.vel) {
          p.vel.x = 0;
          p.vel.y = 0;
        }
        return true;
      },
      { x: targetX, y: surfaceY }
    );
    if (!ok) return false;
    await page.waitForTimeout(100); // ~1.2s total: enough for the camera lerp to arrive
  }
  return true;
}

const saved = [];
let failed = false;

try {
  await page.goto(`http://localhost:${PORT}/src/index.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500); // let Kaplay init and title scene paint

  // Seed a save that unlocks all 8 levels (derived unlock: clearing level-N unlocks N+1).
  await page.evaluate(
    ({ key, blob }) => localStorage.setItem(key, JSON.stringify(blob)),
    { key: SAVE_KEY, blob: SAVE_BLOB }
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // Title -> select.
  await page.keyboard.press("Space");
  await page.waitForTimeout(800);

  for (const levelId of TARGET_LEVELS) {
    const i = LEVEL_ORDER.indexOf(levelId);
    const n = i + 1;
    const biome = BIOME_OF_LEVEL[levelId] ?? "unknown";
    const nn = String(n).padStart(2, "0");
    const geometry = getLevel(levelId).geometry;

    // Select screen's cursor resets to the first selectable tile on every fresh entry
    // (src/scenes/select.js rebuilds `cursor = 0` on each selectScene() call).
    const row = Math.floor(i / 4);
    const col = i % 4;
    for (let j = 0; j < row; j++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(150);
    }
    for (let j = 0; j < col; j++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(150);
    }

    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500); // let the game scene build the level

    // (1) Spawn shot — the level opening, unmoved.
    const spawnName = `level-${nn}-${biome}-spawn.png`;
    await page.screenshot({ path: OUT(spawnName) });
    saved.push(spawnName);

    // (2) Mover MID-TRAVEL shot — frame the first mover, then wait until it is visibly
    // BETWEEN its endpoints (raised-cosine sweeps the middle band twice per period, so a
    // few seconds of polling always catches it) and shoot. Proves the platform is placed
    // where its travel reads, not merely parked at an endpoint.
    const movers = geometry.movers ?? [];
    if (movers.length > 0) {
      const m0 = movers[0];
      // Frame the floor just below the mover (mover y is ~70px above its floor).
      const midX = Math.round((m0.x1 + m0.x2) / 2);
      const framed = await frameX(midX, m0.y1 + 70);
      if (!framed) throw new Error(`no player entity when framing mover for ${levelId}`);

      // Poll the LIVE mover position until it is in the middle band of its x-travel
      // (>25% of the span from EITHER endpoint) — i.e. demonstrably mid-travel.
      const loX = Math.min(m0.x1, m0.x2);
      const hiX = Math.max(m0.x1, m0.x2);
      const band = (hiX - loX) * 0.25;
      let midTravel = false;
      const deadline = Date.now() + 6000;
      while (!midTravel && Date.now() < deadline) {
        await page.waitForTimeout(80);
        midTravel = await page.evaluate(
          ({ lo, hi, b }) => {
            const m = get("mover")[0];
            if (!m) return false;
            return m.pos.x > lo + b && m.pos.x < hi - b;
          },
          { lo: loX, hi: hiX, b: band }
        );
      }
      if (!midTravel) {
        console.warn(`  (${levelId}: mover never sampled mid-band — shooting anyway)`);
      }
      const motionName = `level-${nn}-${biome}-motion.png`;
      await page.screenshot({ path: OUT(motionName) });
      saved.push(motionName);
    }

    // (3) Patroller shot — frame the first patroller on its walk path so the human can
    // judge the sweep is slow + telegraphed and leaves a passing window.
    const patrollers = geometry.patrollers ?? [];
    if (patrollers.length > 0) {
      const p0 = patrollers[0];
      const midX = Math.round((p0.x1 + p0.x2) / 2);
      // p0.y1 is the patroller's top-left (feet at y1 + 52); frame the floor there.
      const framed = await frameX(midX, p0.y1 + 52 - 32);
      if (!framed) throw new Error(`no player entity when framing patroller for ${levelId}`);
      await page.waitForTimeout(400); // let the walk cycle advance a couple of frames
      const patrolName = `level-${nn}-${biome}-patroller.png`;
      await page.screenshot({ path: OUT(patrolName) });
      saved.push(patrolName);
    }

    if (levelId !== TARGET_LEVELS[TARGET_LEVELS.length - 1]) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(800);
    }
  }

  console.log(`Motion screenshots saved (${saved.length}) to ${OUT_DIR}:`);
  for (const s of saved) console.log(`  ${s}`);
} catch (e) {
  console.error("screenshot-phase36-motion failed:", e.message);
  failed = true;
} finally {
  await context.close();
  await browser.close();
  server.close();
}

process.exit(failed ? 1 : 0);
