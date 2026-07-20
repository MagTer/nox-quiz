#!/usr/bin/env node
// Capture real in-game screenshots for Phase 20's human-verify sign-off (PROC-02).
// Reuses screenshot-phase18.mjs's static-file-server/MIME/chromium skeleton and
// browser-boot.mjs's save-seed trick to jump straight into a level. PORT 8767 —
// distinct from browser-boot.mjs (8765) and screenshot-phase18.mjs (8766) so all
// three scripts stay safe to run independently without colliding.

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync } from "fs";
import { extname, join, resolve, sep } from "path";

// WR-02 (ported from browser-boot.mjs): resolve playwright dynamically instead of a
// hardcoded, machine-specific absolute path. Tries (1) normal project-relative
// resolution, then (2) PLAYWRIGHT_MJS_PATH env override, then (3) this machine's
// known global install location as a last-resort fallback.
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

const ROOT = new URL("../", import.meta.url);
const ROOT_ABS = resolve(ROOT.pathname);
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

const SAVE_KEY = "noxrun_platformer_v1";
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
  // WR-02 (ported from screenshot-phase26.mjs/browser-boot.mjs): resolve + clamp to
  // ROOT so `..` segments can't escape the served directory; loopback-only bind below.
  const filePath = resolve(join(ROOT.pathname, path));
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
