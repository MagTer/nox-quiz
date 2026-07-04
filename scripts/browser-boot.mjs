// Minimal real-browser boot check for GSD verification.
// Serves src/ on a local port, opens the game in a headless browser,
// seeds a save that unlocks all four levels, navigates title -> select -> each
// level, and asserts no uncaught errors.

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join, resolve, sep } from "path";
import { LEVEL_ORDER, getLevel } from "../src/levels/index.js";
import { deriveEncounters, driveToXClimbing, resolveIfBoxed } from "./lib/mechanic-drive.mjs";

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
// WR-02: derive the unlocked-levels blob from the live LEVEL_ORDER import instead of a
// hardcoded 3-level literal, matching audit-phase21-mechanics.mjs's own fixed version —
// so this script can never silently drift out of sync (and silently skip visiting a new
// level) if a level is added or removed (unlock is derived: clearing level-N unlocks
// N+1, so marking every level except the last "cleared" unlocks all of them).
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
  // WR-02: derive from the live LEVEL_ORDER import instead of a hardcoded 4-level literal.
  const levels = LEVEL_ORDER;
  for (let i = 0; i < levels.length; i++) {
    // Move the cursor right to the i-th selectable tile (first tile is already focused).
    for (let j = 0; j < i; j++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(150);
    }

    // Enter loads the selected level.
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500); // let game scene build the level

    // VERIFY-03 (all 4 levels, generalized from the retired level-01-only special case):
    // hold real directional input to actually reach and fully resolve at least one
    // boxed mechanic per level, not just "scene loaded, zero console errors." This gate
    // deliberately stops at each level's FIRST resolvable mechanic (not an exhaustive
    // sweep of every encounter) to keep the fast per-commit boot check proportionate —
    // the exhaustive full-level sweep across every encounter lives in
    // scripts/audit-phase21-mechanics.mjs (Plan 21-01/21-05), not here.
    const level = getLevel(LEVEL_ORDER[i]);
    const encounters = deriveEncounters(level.geometry);
    for (let e = 0; e < encounters.length; e++) {
      const encounter = encounters[e];
      // Rule 1 fix (mirrors scripts/audit-phase21-mechanics.mjs's own usage): only the
      // level's FIRST encounter needs warmupUntilFirstGap — driveToXClimbing's own doc
      // explains why constant-jump-when-grounded otherwise sails over a ground-level
      // trigger (e.g. a collect zone) on the initial hazard-free stretch from spawn.
      const driveOpts = e === 0 ? { warmupUntilFirstGap: true } : {};
      const { triggered } = await driveToXClimbing(page, encounter.x, driveOpts);
      if (!triggered) {
        errors.push({
          type: "mechanic",
          message: `${level.id}: encounter ${encounter.tag} at x:${encounter.x} never triggered on real movement`,
        });
        break;
      }
      if (!encounter.renderChoices) {
        // Collect zone: no answer-box grid to resolve; keep walking to the next encounter.
        continue;
      }
      const { resolved } = await resolveIfBoxed(page, true);
      if (!resolved) {
        errors.push({
          type: "mechanic",
          message: `${level.id}: encounter ${encounter.tag} at x:${encounter.x} never resolved after cycling keys 1-4`,
        });
      }
      break;
    }

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
