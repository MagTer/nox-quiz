// Minimal real-browser boot check for GSD verification.
// Serves src/ on a local port, opens the game in a headless browser,
// seeds a save that unlocks all four levels, navigates title -> select -> each
// level, and asserts no uncaught errors.

import { chromium } from "/home/magnus/.nvm/versions/node/v22.22.2/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join } from "path";

const ROOT = new URL("../", import.meta.url);
const PORT = 8765;

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

const errors = [];
page.on("pageerror", (err) => errors.push({ type: "pageerror", message: err.message, stack: err.stack?.split("\n")?.[0] }));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push({ type: "console.error", text: msg.text() });
});
page.on("response", (resp) => {
  if (resp.status() >= 400) {
    errors.push({ type: "http", status: resp.status(), url: resp.url() });
  }
});

let failed = false;
try {
  await page.goto(`http://localhost:${PORT}/src/index.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500); // let Kaplay init and title scene paint

  // Seed a save that unlocks all four levels (derived unlock: clearing level-N unlocks N+1).
  await page.evaluate(({ key, blob }) => {
    localStorage.setItem(key, JSON.stringify(blob));
  }, { key: SAVE_KEY, blob: SAVE_BLOB });

  // Title scene -> select scene.
  await page.keyboard.press("Space");
  await page.waitForTimeout(800);

  // Visit every level in order: cursor starts at the first unlocked tile.
  const levels = ["level-01", "level-02", "level-03", "level-04"];
  for (let i = 0; i < levels.length; i++) {
    // Move the cursor right to the i-th selectable tile (first tile is already focused).
    for (let j = 0; j < i; j++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(150);
    }

    // Enter loads the selected level.
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500); // let game scene build the level

    // Return to select so the next level can be chosen.
    if (i < levels.length - 1) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(800);
    }
  }

  // Phase 18 round-trip leak check: return to title, then re-enter select to
  // confirm enter -> leave -> re-enter produces no leaked handlers or errors.
  await page.evaluate(() => go("title"));
  await page.waitForTimeout(800);
  await page.keyboard.press("Space");
  await page.waitForTimeout(800);

  if (errors.length > 0) {
    console.error("Browser boot encountered errors:");
    for (const e of errors) console.error(JSON.stringify(e));
    failed = true;
  } else {
    console.log("Browser boot: PASS — title -> select -> all levels loaded with no runtime errors.");
  }
} catch (e) {
  console.error("Browser boot failed:", e.message);
  failed = true;
} finally {
  await context.close();
  await browser.close();
  server.close();
}

process.exit(failed ? 1 : 0);
