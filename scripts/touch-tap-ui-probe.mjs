// Playwright TOUCH-tap UI proof (MOB-03, Phase 37, plan 37-05).
//
// The headless PROOF — not an assumption — that the tappable-UI requirement holds on a
// touch device through the SAME unified coordinate mapping the letterbox migration (37-02)
// established: a finger tap enters as a DOM touchstart, the engine maps it through the one
// `Qe` window->content transform, and `touchToMouse` (default ON) synthesizes a left-mouse
// press so any `box.onClick` target fires on tap. This script drives real
// page.touchscreen.tap() gestures in a COARSE-pointer context and asserts:
//
//   (A) TITLE reset (the gap 37-05 Task 2 closed — reset was keyboard-only, no tap target):
//       - tapping the "press R to reset progress" prompt ARMS the confirm overlay
//       - tapping the No/cancel button CLOSES the overlay AND does NOT navigate away
//         (proving the global onClick(start) race guard held — start no-ops while the
//          reset prompt is hovered / while the overlay's startCtrls are disarmed)
//       - re-arming and tapping the Yes button RESOLVES the reset (resetSave() ran —
//         the seeded save blob is removed from localStorage)
//   (B) A math ANSWER box tap resolves the shared challenge (existing area()+onClick seam)
//   (C) A MUTE icon tap toggles mute (getVolume() flips 0<->1), mirroring browser-boot's
//       mute assertion but by TAP, not key.
//
// The audio gesture-gate's REAL-DEVICE proof is DEFERRED by design (Playwright synthetic
// taps grant user-activation unconditionally, so a headless pass cannot prove the
// iOS-specific touchstart-is-not-activation case) — that is 37-05 Task 1 / Phase 38.
//
// DELIBERATE DUPLICATION (CLAUDE.md): the static server + resolvePlaywright() resolver +
// ephemeral-port (listen(0)) block below are COPIED verbatim from scripts/browser-boot.mjs
// and scripts/touch-coordinate-probe.mjs. Do NOT extract a shared module; fix any bug
// identically by hand in every copy. Do NOT weaken the loopback bind or the ROOT-clamped
// path resolution (T-37-01: path-traversal mitigation).

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync } from "fs";
import { extname, join, resolve, sep } from "path";
import { LEVEL_ORDER, getLevel } from "../src/levels/index.js";
import { deriveEncounters, driveToXPlanned } from "./lib/mechanic-drive.mjs";
import { CONFIG } from "../src/config.js";

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

// Plan 34-07: this used to be a hard-coded `const PORT = 8765`, which made the script
// un-runnable more than once at a time — two parallel worktree executors (or a stale
// server from a killed run) collide with EADDRINUSE and the whole boot check dies
// before it proves anything. Hit for real during Phase 34.
//
// Default to an EPHEMERAL port (listen(0) => the OS hands back a guaranteed-free one,
// read back from server.address().port below) so any number of copies can run
// concurrently. BOOT_PORT overrides for the cases that genuinely need a fixed port
// (attaching a debugger, an external tool pointing at a known URL).
//
// `let`, not `const`: the real port is only known after listen() resolves. Every read
// of PORT (the request handler's URL base, page.goto) happens after that, so it is
// always the bound port by then.
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

const SAVE_KEY = "noxrun_platformer_v1";
// Derive the unlocked-levels blob from the live LEVEL_ORDER import (unlock is derived:
// clearing level-N unlocks N+1, so marking every level except the last "cleared" unlocks
// all of them) — matches browser-boot.mjs's own SAVE_BLOB verbatim.
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
// Read back the port the OS actually bound (the whole point of listen(0)) before any
// consumer of PORT runs.
PORT = server.address().port;

// ---------------------------------------------------------------------------
// Touch context — a COARSE-pointer emulation (verified: hasTouch+isMobile reports
// matchMedia('(pointer: coarse)').matches === true), so the 37-05 reset widgets mount.
// Landscape 960x540 fits the 640x360 letterboxed game at a clean 1.5x with no pillar/bar
// (16:9 into 16:9), so game->screen is a pure scale with a 0,0 offset.
// ---------------------------------------------------------------------------
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 960, height: 540 },
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();

const errors = [];
page.on("pageerror", (err) => errors.push({ type: "pageerror", message: err.message }));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push({ type: "console.error", text: msg.text() });
});

// Every wrong answer tween-gates the panel inert for CONFIG.GATE.WRONG_SETTLE_MS (750ms);
// mirror mechanic-drive's own 950ms coupling (> settle + tween-end + frame jitter) so a
// tap on the NEXT box after a wrong one is never silently swallowed.
const SETTLE_WAIT = CONFIG.GATE.WRONG_SETTLE_MS + 200;

let failed = false;
try {
  await page.goto(`http://localhost:${PORT}/src/index.html`, { waitUntil: "networkidle" });
  // Gate on the engine being live (a727c13 — globals exist only after kaplay() runs).
  await page.waitForFunction(() => typeof window.width === "function" && typeof window.get === "function", null, {
    timeout: 15000,
  });
  await page.waitForTimeout(1200); // let the title scene settle + asset loads finish

  // Sanity: the whole probe is meaningless if the context is NOT coarse (the reset widgets
  // never mount). Fail loud rather than silently "pass" a no-op.
  const isCoarse = await page.evaluate(() => window.matchMedia("(pointer: coarse)").matches);
  if (!isCoarse) {
    throw new Error("touch context did not report pointer:coarse — the coarse-gated reset widgets never mount (infra failure)");
  }

  // Game->screen coordinate mapping, derived from the live #game canvas box + the engine's
  // own reported internal dimensions (never hardcoded), so a tap at game (gx,gy) lands on
  // the on-screen pixel the engine will map straight back through the same Qe transform.
  const boxRect = await page.locator("#game").boundingBox();
  if (!boxRect) throw new Error("could not resolve #game canvas bounding box");
  const dims = await page.evaluate(() => ({ w: width(), h: height() }));
  const sx = (gx) => boxRect.x + gx * (boxRect.width / dims.w);
  const sy = (gy) => boxRect.y + gy * (boxRect.height / dims.h);
  const tapGame = async (gx, gy) => {
    await page.touchscreen.tap(sx(gx), sy(gy));
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
  };

  const gw = dims.w;
  const gh = dims.h;

  // -----------------------------------------------------------------------
  // (A) TITLE reset — arm via tap, cancel-does-not-navigate, confirm-via-tap.
  // -----------------------------------------------------------------------
  // Seed a save so the Yes-path has something real to clear.
  await page.evaluate(({ key, blob }) => localStorage.setItem(key, JSON.stringify(blob)), {
    key: SAVE_KEY,
    blob: SAVE_BLOB,
  });

  // Tap the reset prompt (centered at gx=gw/2, gy=CONFIG.TITLE.RESET_Y) → arms the confirm.
  await tapGame(gw / 2, CONFIG.TITLE.RESET_Y);
  await page.waitForTimeout(250);
  let armed = await page.evaluate(() => get("reset-confirm").length);
  let onTitle = await page.evaluate(() => get("title").length > 0);
  if (armed === 0) {
    errors.push({ type: "reset-arm", message: `tap on reset prompt did NOT arm the confirm overlay (get("reset-confirm").length === 0)` });
  }
  if (!onTitle) {
    errors.push({ type: "reset-arm", message: "tap on reset prompt navigated away from title (start race guard failed to no-op)" });
  }

  // Tap the No/cancel button (right button: gx = gw/2 + CONFIRM_BTN_DX, gy = gh/2 + CONFIRM_BTN_DY)
  // → overlay closes AND we must still be on title (no navigation), AND the save must survive.
  await tapGame(gw / 2 + CONFIG.TITLE.CONFIRM_BTN_DX, gh / 2 + CONFIG.TITLE.CONFIRM_BTN_DY);
  await page.waitForTimeout(250);
  const closedAfterNo = await page.evaluate(() => get("reset-confirm").length === 0);
  const stillTitleAfterNo = await page.evaluate(() => get("title").length > 0);
  const saveSurvivedNo = await page.evaluate((key) => localStorage.getItem(key) !== null, SAVE_KEY);
  if (!closedAfterNo) {
    errors.push({ type: "reset-cancel", message: "tap on No/cancel did NOT close the confirm overlay" });
  }
  if (!stillTitleAfterNo) {
    errors.push({ type: "reset-cancel", message: "tap on No/cancel navigated away from title (should only cancel)" });
  }
  if (!saveSurvivedNo) {
    errors.push({ type: "reset-cancel", message: "tap on No/cancel cleared the save (cancel must be non-destructive)" });
  }

  // Re-arm, then tap the Yes button (left button: gx = gw/2 - CONFIRM_BTN_DX) → resetSave()
  // runs (localStorage.removeItem), so the seeded blob is now absent.
  await tapGame(gw / 2, CONFIG.TITLE.RESET_Y);
  await page.waitForTimeout(250);
  const reArmed = await page.evaluate(() => get("reset-confirm").length > 0);
  if (!reArmed) {
    errors.push({ type: "reset-arm", message: "second tap on reset prompt did NOT re-arm the confirm overlay" });
  }
  await tapGame(gw / 2 - CONFIG.TITLE.CONFIRM_BTN_DX, gh / 2 + CONFIG.TITLE.CONFIRM_BTN_DY);
  await page.waitForTimeout(300);
  const saveClearedAfterYes = await page.evaluate((key) => localStorage.getItem(key) === null, SAVE_KEY);
  const closedAfterYes = await page.evaluate(() => get("reset-confirm").length === 0);
  if (!saveClearedAfterYes) {
    errors.push({ type: "reset-confirm", message: "tap on Yes did NOT clear the save (resetSave() never ran)" });
  }
  if (!closedAfterYes) {
    errors.push({ type: "reset-confirm", message: "tap on Yes did NOT close the confirm overlay" });
  }

  // -----------------------------------------------------------------------
  // Re-seed the unlock blob and navigate title -> select (keyboard nav; the tap-proofs
  // are for reset/answer/mute, not navigation).
  // -----------------------------------------------------------------------
  await page.evaluate(({ key, blob }) => localStorage.setItem(key, JSON.stringify(blob)), {
    key: SAVE_KEY,
    blob: SAVE_BLOB,
  });
  await page.keyboard.press("Space");
  await page.waitForTimeout(800);

  // -----------------------------------------------------------------------
  // (C) MUTE — tap the mute icon on the SELECT scene (no global onClick(start) here, so a
  // tap can't hijack navigation the way it would on title). getVolume() must flip 0<->1.
  // -----------------------------------------------------------------------
  // Find the icon's live rect from the engine (topleft-anchored text with area()); fall
  // back to a small inset from its CONFIG position if the "*" query is unavailable.
  const iconRect = await page.evaluate(() => {
    try {
      const all = typeof get === "function" ? get("*") : [];
      const icon = all.find((o) => o && (o.text === "SND" || o.text === "MUTE"));
      if (icon) return { x: icon.pos.x, y: icon.pos.y, w: icon.width ?? 0, h: icon.height ?? 0 };
    } catch {
      // get("*") unsupported — fall through to the CONFIG-based fallback below
    }
    return null;
  });
  const iconCx = iconRect && iconRect.w > 0 ? iconRect.x + iconRect.w / 2 : CONFIG.AUDIO.ICON_X + 8;
  const iconCy = iconRect && iconRect.h > 0 ? iconRect.y + iconRect.h / 2 : CONFIG.AUDIO.ICON_Y + 7;

  const volBefore = await page.evaluate(() => getVolume());
  await tapGame(iconCx, iconCy);
  await page.waitForTimeout(250);
  const volAfterMute = await page.evaluate(() => getVolume());
  if (volAfterMute !== 0) {
    errors.push({ type: "mute", message: `tap on mute icon did NOT mute: expected getVolume() === 0, got ${volAfterMute} (was ${volBefore})` });
  }
  // Tap again to restore, proving the toggle both ways (and leaving audio state clean).
  await tapGame(iconCx, iconCy);
  await page.waitForTimeout(250);
  const volAfterUnmute = await page.evaluate(() => getVolume());
  if (volAfterUnmute !== 1) {
    errors.push({ type: "mute", message: `second tap on mute icon did NOT unmute: expected getVolume() === 1, got ${volAfterUnmute}` });
  }

  // -----------------------------------------------------------------------
  // (B) ANSWER box — enter level-01, drive to the first BOXED challenge (answer boxes
  // present), then tap boxes until it resolves.
  // -----------------------------------------------------------------------
  await page.keyboard.press("Enter"); // level-01 (tile 0, always unlocked)
  await page.waitForTimeout(1500); // let the game scene build the level

  const level = getLevel(LEVEL_ORDER[0]);
  const drivableEncounters = deriveEncounters(level.geometry).filter((e) => e.tag !== "secret-alcove");
  let boxedResolved = false;
  let reachedBoxed = false;
  for (const encounter of drivableEncounters) {
    const { triggered } = await driveToXPlanned(page, encounter.x, level.geometry);
    if (!triggered) continue;
    // A boxed challenge renders four "answer"-tagged boxes; a collect-zone challenge
    // (renderChoices:false) opens a "challenge" with NO answer boxes — key on answer count.
    const answerCount = await page.evaluate(() => get("answer").length);
    if (answerCount < 4) continue; // not a boxed challenge (e.g. collect zone) — keep driving
    reachedBoxed = true;

    // Read the four boxes' game-space centers (fixed() -> pos is screen-space game coords).
    const boxes = await page.evaluate(() =>
      get("answer").map((b) => ({ x: b.pos.x, y: b.pos.y }))
    );
    // Tap each box in turn; a wrong tap keeps the SAME question open (forgiving) with a
    // ~settle window, a correct tap resolves and destroys the answer boxes.
    for (const b of boxes) {
      await tapGame(b.x, b.y);
      await page.waitForTimeout(SETTLE_WAIT);
      const remaining = await page.evaluate(() => get("answer").length);
      if (remaining === 0) {
        boxedResolved = true;
        break;
      }
    }
    break;
  }
  if (!reachedBoxed) {
    errors.push({ type: "answer", message: "never reached a boxed math challenge in level-01 to tap-test" });
  } else if (!boxedResolved) {
    errors.push({ type: "answer", message: "tapping all four answer boxes never resolved the math challenge (answer boxes still present)" });
  }

  // -----------------------------------------------------------------------
  if (errors.length > 0) {
    console.error("Touch-tap UI probe encountered errors:");
    for (const e of errors) console.error(JSON.stringify(e));
    failed = true;
  } else {
    console.log(
      "Touch-tap UI probe: PASS — tap arms + cancels (no-nav) + confirms the reset (MOB-03), " +
        "tap toggles mute both ways, and a tap resolves a math answer box."
    );
  }
} catch (e) {
  console.error("Touch-tap UI probe failed (infrastructure error):", e.message);
  failed = true;
} finally {
  await context.close();
  await browser.close();
  server.close();
}

process.exit(failed ? 1 : 0);
