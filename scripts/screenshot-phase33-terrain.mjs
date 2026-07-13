#!/usr/bin/env node
// Capture in-engine terrain screenshots for the Phase 33 human-verify sign-off, proving
// the biome ground caps tile cleanly after the town/castle saw-pattern fix.
//
// Reuses screenshot-phase26.mjs's static-file-server/MIME/chromium/save-seed skeleton
// verbatim (per this project's established convention of copying Playwright script
// boilerplate by hand rather than extracting a shared module — see CLAUDE.md
// "Playwright script duplication is deliberate").
//
// PORT 8771 — 8768 (audit-phase21-mechanics), 8769 (calibrate-jump-envelope) and 8770
// (screenshot-phase26) are already claimed; 8771 is the next free port.
//
// Why this script exists: ART-PARITY-STEERING.md records that NONE of the 9 automated
// gates look at rendered pixels — a game whose floors are a repeating sawtooth passes
// the entire suite. Any change to assets/, build-art-assets.py or level visuals must
// therefore end with real in-engine screenshots. This is that proof for the terrain
// atlases: one spawn shot per level, covering all 4 biomes (1-2 swamp, 3-4 town,
// 5-6 cemetery, 7-8 castle).

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync, mkdirSync } from "fs";
import { extname, join, resolve, sep } from "path";
import { LEVEL_ORDER } from "../src/levels/index.js";

// WR-02 (ported from browser-boot.mjs): resolve playwright dynamically instead of a
// hardcoded, machine-specific absolute path.
const FALLBACK_PLAYWRIGHT_PATH = (() => {
  const base = `${process.env.HOME}/.nvm/versions/node`;
  try {
    for (const v of readdirSync(base).sort().reverse()) {
      const p = `${base}/${v}/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs`;
      if (existsSync(p)) return p;
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
const PORT = 8771;

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

const OUT_DIR = new URL("../.planning/phases/33-player-entity-animation/terrain-shots/", import.meta.url)
  .pathname;
mkdirSync(OUT_DIR, { recursive: true });
const OUT = (name) => join(OUT_DIR, name);

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

  for (let i = 0; i < LEVEL_ORDER.length; i++) {
    const n = i + 1;
    const levelId = LEVEL_ORDER[i];
    const biome = BIOME_OF_LEVEL[levelId] ?? "unknown";

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

    // Spawn shot: the floor run under the player is already on screen without moving,
    // which is all the terrain cap tiling needs to be judged.
    const name = `level-${String(n).padStart(2, "0")}-${biome}.png`;
    await page.screenshot({ path: OUT(name) });
    saved.push(name);

    if (i < LEVEL_ORDER.length - 1) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(800);
    }
  }

  console.log(`Terrain screenshots saved (${saved.length}) to ${OUT_DIR}:`);
  for (const s of saved) console.log(`  ${s}`);
  if (saved.length !== LEVEL_ORDER.length) {
    console.error(`Expected ${LEVEL_ORDER.length} screenshots, got ${saved.length}`);
    failed = true;
  }
} catch (e) {
  console.error("screenshot-phase33-terrain failed:", e.message);
  failed = true;
} finally {
  await context.close();
  await browser.close();
  server.close();
}

process.exit(failed ? 1 : 0);
