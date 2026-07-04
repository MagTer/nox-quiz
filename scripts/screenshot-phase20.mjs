#!/usr/bin/env node
// Capture real in-game screenshots for Phase 20's human-verify sign-off (PROC-02).
// Reuses screenshot-phase18.mjs's static-file-server/MIME/chromium skeleton and
// browser-boot.mjs's save-seed trick to jump straight into a level. PORT 8767 —
// distinct from browser-boot.mjs (8765) and screenshot-phase18.mjs (8766) so all
// three scripts stay safe to run independently without colliding.

import { chromium } from "/home/magnus/.nvm/versions/node/v22.22.2/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join } from "path";

const ROOT = new URL("../", import.meta.url);
const PORT = 8767;

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
  levels: {},
};

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

const OUT = (name) =>
  new URL(`../.planning/phases/20-real-cc0-art-redo-human-sign-off/${name}`, import.meta.url).pathname;

const saved = [];

try {
  // 1. Title screen.
  await page.goto(`http://localhost:${PORT}/src/index.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT("phase20-title.png") });
  saved.push("phase20-title.png");

  // 2. Select screen.
  await page.keyboard.press("Space");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: OUT("phase20-select.png") });
  saved.push("phase20-select.png");

  // Seed a save (level-01 is always unlocked by default, but seed anyway to
  // match the project's established save-seed pattern) and reload so the
  // select screen re-reads it, then enter level-01.
  await page.evaluate(
    ({ key, blob }) => localStorage.setItem(key, JSON.stringify(blob)),
    { key: SAVE_KEY, blob: SAVE_BLOB }
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.keyboard.press("Space");
  await page.waitForTimeout(800);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500); // let the level scene build

  // 4. Parallax-offset A — starting camera-X, before moving.
  await page.screenshot({ path: OUT("phase20-parallax-a.png") });
  saved.push("phase20-parallax-a.png");

  // 3. In-level, mid-animation — hold ArrowRight so the player is caught
  // mid-run (not idle) with the ground tileset visible in frame.
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT("phase20-level-anim.png") });
  saved.push("phase20-level-anim.png");

  // 5. Parallax-offset B — hold longer so camera has moved substantially
  // further right, so far/mid/near layers visibly shifted at different rates.
  await page.waitForTimeout(1600);
  await page.screenshot({ path: OUT("phase20-parallax-b.png") });
  saved.push("phase20-parallax-b.png");
  await page.keyboard.up("ArrowRight");

  console.log(`Screenshots saved: ${saved.join(", ")}`);
} finally {
  await context.close();
  await browser.close();
  server.close();
}
