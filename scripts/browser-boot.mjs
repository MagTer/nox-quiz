// Minimal real-browser boot check for GSD verification.
// Serves src/ on a local port, opens the game in a headless browser,
// seeds a save that unlocks all four levels, navigates title -> select -> each
// level, and asserts no uncaught errors.

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync } from "fs";
import { extname, join, resolve, sep } from "path";
import { LEVEL_ORDER, getLevel } from "../src/levels/index.js";
import { deriveEncounters, driveToXPlanned, resolveIfBoxed } from "./lib/mechanic-drive.mjs";

// WR-02: resolve playwright dynamically instead of a hardcoded, machine-specific absolute
// path. Tries (1) normal project-relative resolution (works once `playwright` is a real
// devDependency), then (2) an explicit override via PLAYWRIGHT_MJS_PATH (for CI/other
// machines), then (3) this machine's known global install location as a last-resort
// fallback so the script keeps working here without requiring a package.json/npm install
// in this zero-dependency, no-build-step project (see CLAUDE.md).
const FALLBACK_PLAYWRIGHT_PATH = (() => {
  // gsd-pi's bundled playwright moves whenever gsd-pi is (re)installed under a
  // different nvm node version (the previously pinned v22.22.2 copy vanished on
  // 2026-07-07 after gsd-pi landed under v20.20.0), so search EVERY installed node
  // version, newest first, instead of pinning one path that silently goes stale.
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

const SAVE_KEY = "noxrun_platformer_v1";
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

// AUD-04: audio-element-count ceiling. Evaluates document.querySelectorAll('audio').length
// in the live page and pushes a typed entry into the existing `errors` array (mirroring this
// script's own { type, message } shape already used for mechanic-drive failures below) if more
// than one <audio> element exists at a scene-transition stop — proving the ensureMusicPlaying()
// idempotency guard (Plan 27-02) actually holds under real browser conditions, not just code
// review. Pushing into `errors` (rather than throwing) means one failed check does not abort
// the rest of the drive.
async function assertAudioElementCount(page, errors, stopLabel) {
  const count = await page.evaluate(() => document.querySelectorAll("audio").length);
  if (count > 1) {
    errors.push({
      type: "audio",
      message: `${stopLabel}: expected at most 1 <audio> element, found ${count}`,
    });
  }
}

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
  await assertAudioElementCount(page, errors, "title->select");

  // AUD-04 functional mute-toggle proof: the M key must actually reach the master gain
  // (audio.js's toggleMute -> setVolume), not just flip a UI label. Press M once and confirm
  // getVolume() reaches 0; press M again and confirm it returns to 1.
  await page.keyboard.press("m");
  await page.waitForTimeout(200);
  const mutedVolume = await page.evaluate(() => getVolume());
  if (mutedVolume !== 0) {
    errors.push({
      type: "audio",
      message: `mute toggle: expected getVolume() === 0 after pressing M, got ${mutedVolume}`,
    });
  }
  await page.keyboard.press("m");
  await page.waitForTimeout(200);
  const unmutedVolume = await page.evaluate(() => getVolume());
  if (unmutedVolume !== 1) {
    errors.push({
      type: "audio",
      message: `mute toggle: expected getVolume() === 1 after pressing M again, got ${unmutedVolume}`,
    });
  }

  // Visit every level in order: cursor starts at the first unlocked tile.
  // WR-02: derive from the live LEVEL_ORDER import instead of a hardcoded 4-level literal.
  const levels = LEVEL_ORDER;
  for (let i = 0; i < levels.length; i++) {
    // Move the cursor to the i-th selectable tile (first tile is already focused).
    // The select screen is a fixed 4-column grid: compute a row/col position and press
    // ArrowDown row times then ArrowRight col times, instead of assuming a single flat
    // row of tiles (25-RESEARCH.md Pitfall 1) -- for i in 0..3 (levels 1-4), row is
    // always 0, so this is byte-identical to the old ArrowRight-times-i loop.
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

    // Enter loads the selected level.
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500); // let game scene build the level
    await assertAudioElementCount(page, errors, `${LEVEL_ORDER[i]}: level entry`);

    // VERIFY-03 (all 4 levels, generalized from the retired level-01-only special case):
    // hold real directional input to actually reach and fully resolve at least one
    // boxed mechanic per level, not just "scene loaded, zero console errors." This gate
    // deliberately stops at each level's FIRST resolvable mechanic (not an exhaustive
    // sweep of every encounter) to keep the fast per-commit boot check proportionate —
    // the exhaustive full-level sweep across every encounter lives in
    // scripts/audit-phase21-mechanics.mjs (Plan 21-01/21-05), not here.
    const level = getLevel(LEVEL_ORDER[i]);
    const encounters = deriveEncounters(level.geometry);
    // Plan 25-07 fix (Rule 1 — bug): the old driveToXClimbing ("jump whenever
    // grounded, from spawn") is the exact retired driver Phase 24's close-out
    // documented as bunny-hopping over ground-level checkpoints and failing
    // marginal jumps deterministically (see mechanic-drive.mjs's DEPRECATION
    // NOTE) — it stalled indefinitely against level-07/08's verticality climbs,
    // which the Phase-24 fix (driveToXPlanned: walk by default, jump only at
    // planned takeoffs from the same geometry the structural validator uses)
    // already solves. Swapping to the same proven driver audit-retry.mjs already
    // uses retires the old driver's warmupUntilFirstGap special case as a class
    // (driveToXPlanned walks by default, so ground-level triggers register
    // naturally on every approach, not just the level's first — see
    // audit-retry.mjs's own comment at its driveToXPlanned call site).
    for (const encounter of encounters) {
      const { triggered } = await driveToXPlanned(page, encounter.x, level.geometry);
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
      await assertAudioElementCount(page, errors, `${LEVEL_ORDER[i]}: back to select`);
    }
  }

  // Phase 18 round-trip leak check: return to title, then re-enter select to
  // confirm enter -> leave -> re-enter produces no leaked handlers or errors.
  await page.evaluate(() => go("title"));
  await page.waitForTimeout(800);
  await page.keyboard.press("Space");
  await page.waitForTimeout(800);
  await assertAudioElementCount(page, errors, "round-trip: title->select re-entry");

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
