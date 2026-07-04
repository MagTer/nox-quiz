// Minimal real-browser boot check for GSD verification.
// Serves src/ on a local port, opens the game in a headless browser,
// seeds a save that unlocks all four levels, navigates title -> select -> each
// level, and asserts no uncaught errors.

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join, resolve, sep } from "path";
import { LEVEL_ORDER } from "../src/levels/index.js";

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

    // level-01 only (VERIFY-03): hold real directional input to actually reach and
    // fully resolve at least one boxed mechanic per run, not just "scene loaded, zero
    // console errors." level-01 contains one of every mechanic type.
    if (i === 0) {
      // Hold ArrowRight to reach the collect zone at world x:300 (~236px from the
      // default spawn x:64 at CONFIG.RUN_SPEED 240px/s ~= 983ms; rounded up with margin).
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(1000);
      await page.keyboard.up("ArrowRight");
      const collectTriggered = await page.evaluate(() => get("challenge").length > 0);
      if (!collectTriggered) {
        errors.push({ type: "mechanic", message: "collect zone at x:300 never triggered a challenge on real movement" });
      }

      // Continue on to the math-gate at world x:600 (~300px further along the same
      // floor run, no jump needed). WR-01: 300px / RUN_SPEED(240px/s) = 1250ms exactly —
      // add the same margin the collect-zone hold above already uses (rounded up from its
      // own exact value) so accumulated timing error (keyboard dispatch latency, frame-rate
      // variance, imprecise post-first-hold position) can't leave the player short of x:600.
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(1250 + 150);
      await page.keyboard.up("ArrowRight");

      // Cycle keys 1-4 to fully resolve the math-gate challenge via real key input.
      //
      // CR-01 fix (2nd review pass): an absolute `remaining === 0` check is invalid here —
      // the collect-zone challenge at x:300 is deliberately left open by collect.js
      // (renderChoices:false; movement stays live by design, per src/ui/challenge.js's own
      // comment), so the shared "challenge" tag count can never reach zero again even once
      // the math-gate itself resolves correctly. Capture a baseline BEFORE cycling and
      // check for a decrease instead, exactly mirroring audit-phase21-mechanics.mjs's
      // driveToX/resolveIfBoxed pattern.
      let mathGateResolved = false;
      const initialChallengeCount = await page.evaluate(() => get("challenge").length);
      for (const key of ["1", "2", "3", "4"]) {
        await page.keyboard.press(key);
        await page.waitForTimeout(200);
        const remaining = await page.evaluate(() => get("challenge").length);
        if (remaining < initialChallengeCount) {
          mathGateResolved = true;
          break;
        }
      }
      if (!mathGateResolved) {
        errors.push({ type: "mechanic", message: "math-gate at x:600 never resolved after cycling keys 1-4" });
      }
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
