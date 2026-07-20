#!/usr/bin/env node
// Capture in-engine screenshots of level-08's Phase-34 SWITCHBACK end climb (LVL-02)
// for the blocking human-verify checkpoint (34-04-PLAN Task 3).
//
// Reuses screenshot-phase33-terrain.mjs's static-file-server/MIME/chromium/save-seed
// skeleton verbatim (per this project's established convention of copying Playwright
// script boilerplate by hand rather than extracting a shared module — see CLAUDE.md
// "Playwright script duplication is deliberate"). Fix any bug here in every copy.
//
// PORT 8773 — 8768 (audit-phase21-mechanics), 8769 (calibrate-jump-envelope), 8770
// (screenshot-phase26), 8771 (screenshot-phase33-terrain) and 8772 (audit-coins) are
// all claimed; 8773 is the next free port.
//
// WHY THE PLAYER IS REPOSITIONED RATHER THAN DRIVEN: the switchback requires two
// LEFTWARD hops, and this project's scripted driver (mechanic-drive.mjs's
// driveToXPlanned) holds ArrowRight for the whole drive — it structurally cannot fly a
// leftward leg (see 34-04-SUMMARY.md's "The harness is rightward-only" finding). This
// script therefore uses the same repositionAndSettle idiom audit-coins.mjs uses:
// place the player ON the tier, let the REAL clamped camera (src/camera.js) follow, and
// shoot. That is honest about what it proves — it shows the SHAPE and the camera's
// reach, and it does NOT claim the climb was navigated from spawn.
//
// Loads with ?debug=1 so build.js renders the normally-invisible entities the user
// needs to judge: merged colliders, per-tier checkpoints, and the secret alcove
// (magenta marker). Never hand-edit opacity(0) for playtesting (CLAUDE.md).

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
const PORT = 8773;

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
  version: 3,
  xp: 0,
  level: 1,
  accuracy: {},
  history: {},
  levels: Object.fromEntries(LEVEL_ORDER.slice(0, -1).map((id) => [id, { cleared: true }])),
};

// The three shots the checkpoint asks for. Player pos is TOP-LEFT and the player is
// 16x32, so standing on a tier of top `y` means pos.y = y - 32. Each is nudged a few
// px above its tier so the body settles onto the collider rather than starting inside
// it.
const SHOTS = [
  {
    name: "level-08-climb-1-entry.png",
    // On T1 (2410..2710 @ y250), looking back at floor-3's climb entry and up the
    // rightward leg A toward T2/T3.
    x: 2500,
    y: 250 - 32 - 4,
    caption: "leg A (up-RIGHT): floor-3 -> T1 -> T2 -> T3",
  },
  {
    name: "level-08-climb-2-reversal.png",
    // Out on T3's turn-around runway (2850..3150 @ y115), PAST T4's right edge (2960)
    // — this is the spot the player runs to, turns, and jumps back up-LEFT from.
    x: 3050,
    y: 115 - 32 - 4,
    caption: "REVERSAL 1: stood on T3's runway right of T4's edge — the up-LEFT hop",
  },
  {
    name: "level-08-climb-3-summit.png",
    // On T6, the 380px summit balcony (3160..3540 @ y-90), with the goal at 3460.
    x: 3300,
    y: -90 - 32 - 4,
    caption: "the SUMMIT BALCONY (T6, 380px wide) and the goal at x:3460",
  },
];

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

const OUT_DIR = new URL("../.planning/phases/34-level-quality-pass/", import.meta.url).pathname;
mkdirSync(OUT_DIR, { recursive: true });

const saved = [];
let failed = false;

try {
  // ?debug=1 renders colliders, checkpoints and the secret alcove.
  await page.goto(`http://localhost:${PORT}/src/index.html?debug=1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  await page.evaluate(
    ({ key, blob }) => localStorage.setItem(key, JSON.stringify(blob)),
    { key: SAVE_KEY, blob: SAVE_BLOB }
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // Title -> select.
  await page.keyboard.press("Space");
  await page.waitForTimeout(800);

  // level-08 is index 7 => row 1, col 3 on the 2x4 grid.
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(150);
  for (let j = 0; j < 3; j++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(150);
  }
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1800); // let the game scene build the level

  for (const shot of SHOTS) {
    // repositionAndSettle (audit-coins.mjs's idiom): drop the player onto the tier and
    // let the REAL clamped camera follow (src/camera.js lerps, so give it time).
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
      { x: shot.x, y: shot.y }
    );
    if (!ok) throw new Error(`no player entity when positioning for ${shot.name}`);

    await page.waitForTimeout(1400); // settle onto the collider + let the camera catch up

    const path = join(OUT_DIR, shot.name);
    await page.screenshot({ path });
    saved.push(shot.name);
    console.log(`  ${shot.name} — ${shot.caption}`);
  }

  console.log(`\nClimb screenshots saved (${saved.length}) to ${OUT_DIR}`);
  if (saved.length !== SHOTS.length) {
    console.error(`Expected ${SHOTS.length} screenshots, got ${saved.length}`);
    failed = true;
  }
} catch (e) {
  console.error("screenshot-phase34-climb failed:", e.message);
  failed = true;
} finally {
  await context.close();
  await browser.close();
  server.close();
}

process.exit(failed ? 1 : 0);
