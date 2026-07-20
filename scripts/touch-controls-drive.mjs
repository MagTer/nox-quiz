// Playwright TOUCH-drive harness for the on-screen virtual buttons (MOB-02, Phase 37-06).
//
// Proves — headlessly, not by assumption — that src/ui/touchControls.js actually moves and
// jumps the player through the src/input.js seam, reusing player.js's LOCKED variable-height
// jump, with true per-identifier multi-touch, AND that the buttons are ABSENT on desktop:
//   1. On a TOUCH context (hasTouch/isMobile → pointer:coarse) the game scene MOUNTS the
//      buttons (get("touchctl").length > 0).
//   2. A tap on the JUMP zone makes the player RISE (min y decreases / it leaves the ground).
//   3. A HELD jump rises HIGHER than a SHORT (quickly-released) jump — variable height comes
//      from the press/release edges through the seam (no timer), NOT a touch-side reimpl.
//   4. Pressing RIGHT moves the player right (pos.x increases); pressing LEFT moves it left.
//   5. MULTI-TOUCH: two distinct-identifier fingers on LEFT and JUMP at once move the player
//      horizontally AND make it rise — proving the Map<identifier,name> per-finger tracking.
//   6. On a DESKTOP context (pointer:fine, no touch) the game scene mounts NO buttons
//      (get("touchctl").length === 0) — desktop byte-identical.
//
// Held + multi-touch need real finger lifecycles, so this uses CDP Input.dispatchTouchEvent
// (touchStart/touchEnd with explicit touchPoints carrying distinct ids) rather than
// page.touchscreen.tap (a single synthetic tap that cannot hold or press two points).
//
// DELIBERATE DUPLICATION (CLAUDE.md): the static server + resolvePlaywright() resolver +
// ephemeral-port (listen(0)) block below are COPIED verbatim from scripts/browser-boot.mjs.
// Do NOT extract a shared module; fix any bug identically by hand in every copy. Do NOT
// weaken the loopback bind or the ROOT-clamped path resolution (T-37-01 path-traversal).

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync } from "fs";
import { extname, join, resolve, sep } from "path";
import { LEVEL_ORDER } from "../src/levels/index.js";
import { CONFIG } from "../src/config.js";

// WR-02: resolve playwright dynamically instead of a hardcoded, machine-specific absolute
// path. Tries (1) normal project-relative resolution, then (2) an explicit override via
// PLAYWRIGHT_MJS_PATH (for CI/other machines), then (3) this machine's known global install
// location as a last-resort fallback so the script keeps working here without requiring a
// package.json/npm install in this zero-dependency, no-build-step project (see CLAUDE.md).
const FALLBACK_PLAYWRIGHT_PATH = (() => {
  // gsd-pi's bundled playwright moves whenever gsd-pi is (re)installed under a different nvm
  // node version, so search EVERY installed node version, newest first, instead of pinning
  // one path that silently goes stale.
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

// Default to an EPHEMERAL port (listen(0) => the OS hands back a guaranteed-free one, read
// back from server.address().port below) so any number of copies can run concurrently.
// BOOT_PORT overrides for the cases that genuinely need a fixed port.
let PORT = Number(process.env.BOOT_PORT ?? 0);

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

// SAVE key + unlock blob — copied from browser-boot.mjs so this harness can reach any level
// (unlock is derived: marking every level but the last "cleared" unlocks all of them).
const SAVE_KEY = "noxrun_platformer_v1";
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
  // CR-02: resolve + clamp to ROOT so `..` segments can't escape the served directory (path
  // traversal). Require an exact match OR a separator immediately after the root.
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
PORT = server.address().port;

// --------------------------------------------------------------------------------------
// Shared drive helpers (parameterized by page/cdp so both the touch and desktop contexts
// reuse them).
// --------------------------------------------------------------------------------------

// Boot the page, seed the unlock save, and drive title -> select -> first level's game scene.
async function driveIntoLevel(page) {
  await page.goto(`http://localhost:${PORT}/src/index.html`, { waitUntil: "networkidle" });
  // Kaplay exposes its globals only AFTER init (a727c13). Gate on a touch global being real.
  await page.waitForFunction(() => typeof window.onTouchStart === "function", null, { timeout: 15000 });
  await page.waitForTimeout(1000); // title scene settle + asset loads

  await page.evaluate(({ key, blob }) => localStorage.setItem(key, JSON.stringify(blob)), {
    key: SAVE_KEY,
    blob: SAVE_BLOB,
  });

  // title -> select (Space), then select -> game (Enter on the first, already-focused tile).
  await page.keyboard.press("Space");
  await page.waitForTimeout(600);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500); // let the game scene build the level + spawn the player
  // Wait until the player entity exists in the scene.
  await page.waitForFunction(() => typeof get === "function" && get("player").length > 0, null, {
    timeout: 10000,
  });
}

// Map a point in 640x360 GAME space to on-screen client coords via the live #game canvas box.
// The coarse-pointer container is 960x540 (== viewport) and 640x360 is 16:9 into 16:9, so
// letterbox scales 1.5x with ZERO bars — the canvas fills the box at (box.x, box.y). Deriving
// from the actual box keeps this correct even if the layout shifts.
async function gameToClient(page, gx, gy) {
  const box = await page.locator("#game").boundingBox();
  if (!box) throw new Error("could not resolve #game canvas bounding box");
  return {
    x: box.x + gx * (box.width / 640),
    y: box.y + gy * (box.height / 360),
  };
}

// Center of a CONFIG.TOUCH button rect (game space).
function btnCenter(rect) {
  return { gx: rect.X + rect.W / 2, gy: rect.Y + rect.H / 2 };
}

// Read the live player's pos/vel/grounded from the scene.
async function readPlayer(page) {
  return await page.evaluate(() => {
    const p = get("player")[0];
    if (!p) return null;
    return { x: p.pos.x, y: p.pos.y, vy: p.vel.y, grounded: p.isGrounded() };
  });
}

// Sample the player's MINIMUM y (highest point reached — up is negative y) over `ms`.
async function sampleMinYOver(page, ms) {
  return await page.evaluate(
    (ms) =>
      new Promise((res) => {
        let minY = Infinity;
        const start = performance.now();
        function tick() {
          const p = get("player")[0];
          if (p) minY = Math.min(minY, p.pos.y);
          if (performance.now() - start < ms) requestAnimationFrame(tick);
          else res(minY);
        }
        requestAnimationFrame(tick);
      }),
    ms
  );
}

async function waitGrounded(page) {
  await page.waitForFunction(
    () => {
      const p = get("player")[0];
      return p && p.isGrounded();
    },
    null,
    { timeout: 6000 }
  );
}

const errors = [];

// --------------------------------------------------------------------------------------
// 1) TOUCH context — the real proof.
// --------------------------------------------------------------------------------------
const browser = await chromium.launch({ headless: true });
let failed = false;
try {
  const touchCtx = await browser.newContext({
    viewport: { width: 960, height: 540 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await touchCtx.newPage();
  page.on("pageerror", (err) => errors.push({ type: "pageerror", message: err.message }));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push({ type: "console.error", text: msg.text() });
  });

  const cdp = await touchCtx.newCDPSession(page);
  // Dispatch a touch event with the given active touch points (each { x, y, id }).
  async function touch(type, points) {
    await cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points });
  }

  await driveIntoLevel(page);

  // (1) Buttons mounted on the coarse-pointer device.
  const ctlCount = await page.evaluate(() => get("touchctl").length);
  if (ctlCount <= 0) {
    errors.push({ type: "mount", message: `expected touch buttons mounted on coarse pointer, get("touchctl")=${ctlCount}` });
  }

  // Precompute on-screen client coordinates for each button center.
  const jc = btnCenter(CONFIG.TOUCH.JUMP);
  const lc = btnCenter(CONFIG.TOUCH.LEFT);
  const rc = btnCenter(CONFIG.TOUCH.RIGHT);
  const jump = await gameToClient(page, jc.gx, jc.gy);
  const left = await gameToClient(page, lc.gx, lc.gy);
  const right = await gameToClient(page, rc.gx, rc.gy);

  // Let the player settle onto the ground.
  await waitGrounded(page);
  const base = await readPlayer(page);

  // (2)+(3) SHORT jump: press, hold ~60ms (long enough for the buffered jump to apply and the
  // player to be rising), then release — the release-edge cut caps the rise. Sample the apex.
  await touch("touchStart", [{ x: jump.x, y: jump.y, id: 1 }]);
  await page.waitForTimeout(60);
  await touch("touchEnd", []); // release while rising -> variable-height cut
  const shortMinY = await sampleMinYOver(page, 700);
  const shortRise = base.y - shortMinY;
  if (shortRise <= 2) {
    errors.push({ type: "jump", message: `tap-jump did not raise the player (rise=${shortRise.toFixed(1)}px)` });
  }

  // Back to the ground before the held jump.
  await waitGrounded(page);
  const base2 = await readPlayer(page);

  // HELD jump: press and HOLD across the entire rise (release only after the apex), so no cut
  // applies — full jump height. Sample the apex WHILE holding, then release.
  await touch("touchStart", [{ x: jump.x, y: jump.y, id: 1 }]);
  const heldMinY = await sampleMinYOver(page, 700);
  await touch("touchEnd", []);
  const heldRise = base2.y - heldMinY;
  if (heldRise <= 2) {
    errors.push({ type: "jump", message: `held-jump did not raise the player (rise=${heldRise.toFixed(1)}px)` });
  }
  // Variable height: the held jump must clear the short (cut) jump by a real margin.
  if (heldRise <= shortRise + 4) {
    errors.push({
      type: "variable-height",
      message: `held-jump rise ${heldRise.toFixed(1)}px not clearly higher than tap-jump rise ${shortRise.toFixed(1)}px — variable-height not proven`,
    });
  }

  // (4) RIGHT moves the player right. Settle first, hold RIGHT, measure dx.
  await waitGrounded(page);
  const preRight = await readPlayer(page);
  await touch("touchStart", [{ x: right.x, y: right.y, id: 2 }]);
  await page.waitForTimeout(500);
  await touch("touchEnd", []);
  await page.waitForTimeout(100);
  const postRight = await readPlayer(page);
  const dxRight = postRight.x - preRight.x;
  if (dxRight <= 4) {
    errors.push({ type: "move", message: `RIGHT button did not move the player right (dx=${dxRight.toFixed(1)}px)` });
  }

  // (5) MULTI-TOUCH: with the player now away from the left wall (it just walked right),
  // press LEFT and JUMP simultaneously with DISTINCT ids and assert it BOTH moves left AND
  // rises — proving the per-identifier Map tracks two fingers at once.
  await waitGrounded(page);
  const preMulti = await readPlayer(page);
  // Two active points in one touchStart -> the engine fires onTouchStart per changed point,
  // registering both identifiers.
  await touch("touchStart", [
    { x: left.x, y: left.y, id: 3 },
    { x: jump.x, y: jump.y, id: 4 },
  ]);
  const multiMinY = await sampleMinYOver(page, 500);
  await touch("touchEnd", []); // release both
  await page.waitForTimeout(100);
  const postMulti = await readPlayer(page);
  const dxMulti = postMulti.x - preMulti.x;
  const riseMulti = preMulti.y - multiMinY;
  if (dxMulti >= -4) {
    errors.push({ type: "multitouch", message: `LEFT+JUMP multi-touch did not move the player left (dx=${dxMulti.toFixed(1)}px)` });
  }
  if (riseMulti <= 2) {
    errors.push({ type: "multitouch", message: `LEFT+JUMP multi-touch did not raise the player (rise=${riseMulti.toFixed(1)}px)` });
  }

  console.log(
    `touch drive: touchctl=${ctlCount}, tap-rise=${shortRise.toFixed(1)}px, held-rise=${heldRise.toFixed(1)}px, ` +
      `right-dx=${dxRight.toFixed(1)}px, multi(dx=${dxMulti.toFixed(1)}px, rise=${riseMulti.toFixed(1)}px)`
  );

  await touchCtx.close();

  // --------------------------------------------------------------------------------------
  // 6) DESKTOP context — pointer:fine, NO touch: the buttons must NOT mount (byte-identical).
  // --------------------------------------------------------------------------------------
  const desktopCtx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const dpage = await desktopCtx.newPage();
  dpage.on("pageerror", (err) => errors.push({ type: "desktop-pageerror", message: err.message }));
  dpage.on("console", (msg) => {
    if (msg.type() === "error") errors.push({ type: "desktop-console.error", text: msg.text() });
  });
  await driveIntoLevel(dpage);
  const desktopCtl = await dpage.evaluate(() => get("touchctl").length);
  if (desktopCtl !== 0) {
    errors.push({ type: "desktop-parity", message: `expected ZERO touch buttons on desktop (pointer:fine), got ${desktopCtl}` });
  }
  console.log(`desktop drive: touchctl=${desktopCtl} (expected 0)`);
  await desktopCtx.close();

  if (errors.length > 0) {
    console.error("Touch-controls drive encountered errors:");
    for (const e of errors) console.error(JSON.stringify(e));
    failed = true;
  } else {
    console.log(
      "Touch-controls drive: PASS — buttons mount on touch, tap/held/right/multi-touch drive the player, " +
        "held-jump clears tap-jump (variable height), and desktop mounts zero buttons."
    );
  }
} catch (e) {
  console.error("Touch-controls drive failed:", e.message);
  failed = true;
} finally {
  await browser.close();
  server.close();
}

process.exit(failed ? 1 : 0);
