#!/usr/bin/env node
// Capture in-engine PROPS screenshots for the Phase 35 human-verify sign-off (the
// 2-level trial → sign-off → remaining-6 rollout), proving each level's dressed
// biome look reads clearly and — CRITICALLY — that no prop obscures the play lane,
// a route, a coin, or a mechanic (the legibility-first / §8.5 CONTEXT constraint).
//
// Cloned VERBATIM from scripts/screenshot-phase33-terrain.mjs's static-file-server/
// MIME/chromium/save-seed/nav skeleton (per this project's established convention of
// copying Playwright script boilerplate BY HAND rather than extracting a shared
// module — see CLAUDE.md "Playwright script duplication is deliberate"). Only the
// OUT_DIR, filenames, per-level shot list, and the added climb-altitude capture
// differ from the phase-33 terrain shooter.
//
// PORT 8777 — the next free port after the 8765-8776 range already claimed across
// the audit/screenshot/calibrate scripts.
//
// Why this script exists: ART-PARITY-STEERING.md records that NONE of the automated
// gates look at rendered pixels — a game whose props cover a route passes the whole
// suite. Any props/level-visual change must therefore end with real in-engine
// screenshots; this is that proof. Spawn shot per level (all 4 biomes: 1-2 swamp,
// 3-4 town, 5-6 cemetery, 7-8 castle), PLUS a climb-altitude shot for every level
// whose geometry is VERTICAL — keyed on `getLevel(id).bounds.top < 0` (the actual
// levels 02/04/06/08), NEVER on level even-ness (level-07 is odd AND horizontal:
// bounds.top 0 → spawn shot only). Keying on geometry can never disagree with the
// descriptor.
//
// Usage:
//   node scripts/screenshot-phase35-props.mjs                 (all 8 levels)
//   node scripts/screenshot-phase35-props.mjs level-01 level-06  (just the trial pair)

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
const PORT = 8777;

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

// Optional CLI arg list: which level ids to shoot (default: all 8). Filters against
// LEVEL_ORDER so a typo can't silently ask for a non-existent level.
const REQUESTED = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const TARGET_LEVELS = REQUESTED.length
  ? LEVEL_ORDER.filter((id) => REQUESTED.includes(id))
  : LEVEL_ORDER.slice();
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

const OUT_DIR = new URL("../.planning/phases/35-biome-re-dress-props/prop-shots/", import.meta.url)
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

  for (const levelId of TARGET_LEVELS) {
    const i = LEVEL_ORDER.indexOf(levelId);
    const n = i + 1;
    const biome = BIOME_OF_LEVEL[levelId] ?? "unknown";
    const nn = String(n).padStart(2, "0");

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

    // Spawn shot: the floor run under the player is already on screen without moving.
    const spawnName = `level-${nn}-${biome}-spawn.png`;
    await page.screenshot({ path: OUT(spawnName) });
    saved.push(spawnName);

    // Climb-altitude shot — ONLY for VERTICAL levels, keyed on GEOMETRY
    // (bounds.top < 0), never on level parity. level-01 has no `bounds` field
    // (derives its edges from geometry) → bounds?.top is undefined → falsy → spawn
    // shot only, exactly like every horizontal level (bounds.top 0, incl. odd
    // level-07). Resolves to the actual vertical levels 02/04/06/08.
    const bounds = getLevel(levelId).bounds;
    if (bounds && bounds.top < 0) {
      // repositionAndSettle idiom (screenshot-phase34-climb.mjs / audit-coins.mjs):
      // lift the REAL player toward bounds.top and let the clamped camera (src/camera.js
      // lerps) ease up to the top band. Pin across the settle window so gravity doesn't
      // drag the player — and thus the follow camera — back down before the shot.
      const targetX = Math.round((bounds.left + bounds.right) / 2);
      const targetY = bounds.top + 48; // just below the top clamp edge
      let positioned = true;
      for (let k = 0; k < 16; k++) {
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
          { x: targetX, y: targetY }
        );
        if (!ok) {
          positioned = false;
          break;
        }
        await page.waitForTimeout(100); // ~1.6s total: enough for the camera lerp to reach the top
      }
      if (!positioned) throw new Error(`no player entity when positioning climb shot for ${levelId}`);

      const climbName = `level-${nn}-${biome}-climb.png`;
      await page.screenshot({ path: OUT(climbName) });
      saved.push(climbName);
    }

    if (levelId !== TARGET_LEVELS[TARGET_LEVELS.length - 1]) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(800);
    }
  }

  console.log(`Props screenshots saved (${saved.length}) to ${OUT_DIR}:`);
  for (const s of saved) console.log(`  ${s}`);
} catch (e) {
  console.error("screenshot-phase35-props failed:", e.message);
  failed = true;
} finally {
  await context.close();
  await browser.close();
  server.close();
}

process.exit(failed ? 1 : 0);
