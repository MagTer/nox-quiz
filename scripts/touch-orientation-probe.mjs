// Playwright orientation-overlay probe (MOB-04, Phase 37, plan 37-04).
//
// Machine-asserts the pure-CSS portrait "rotate your device" overlay swap that
// index.html declares via `@media (pointer: coarse) and (orientation: portrait)`.
// This is a REAL rendered-state assertion (getComputedStyle), not a grep — a grep
// only proves the rule string exists, never that the browser actually applies it.
//
// Two coarse-pointer (hasTouch/isMobile) contexts exercise both sides of the query:
//   * PORTRAIT  540x960 → the media query matches: #rotate must be displayed
//     (display !== 'none') and #stage hidden (display === 'none').
//   * LANDSCAPE 960x540 → the media query does NOT match: #rotate hidden
//     (display === 'none') and #stage displayed.
// Any mismatch is pushed into `errors` and the process exits non-zero
// (browser-boot's pattern). Desktop (pointer:fine) parity is proven separately by
// scripts/browser-boot.mjs — there the overlay can never match and never shows.
//
// DELIBERATE DUPLICATION (CLAUDE.md): the static server + resolvePlaywright()
// resolver + ephemeral-port (listen(0)) block below are COPIED verbatim from
// scripts/browser-boot.mjs / scripts/touch-coordinate-probe.mjs. Do NOT extract a
// shared module; fix any bug identically by hand in every copy. Do NOT weaken the
// loopback bind or the ROOT-clamped path resolution (T-37-01: path-traversal).

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync } from "fs";
import { extname, join, resolve, sep } from "path";

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

// Ephemeral port (listen(0) => OS hands back a guaranteed-free one) so any number of
// copies can run concurrently. BOOT_PORT overrides for a fixed port when needed.
// `let`, not `const`: the real port is only known after listen() resolves.
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

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let reqPath = decodeURIComponent(url.pathname);
  if (reqPath === "/") reqPath = "/index.html";
  // CR-02: resolve + clamp to ROOT so `..` segments can't escape the served directory
  // (path traversal), and bind to loopback only (not all interfaces) below. Require an
  // exact match OR a separator immediately after the root so a sibling directory whose
  // name merely starts with ROOT_ABS's own name can't pass.
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
// The probe itself.
// ---------------------------------------------------------------------------

const errors = [];

// Read the *rendered* display value of #rotate and #stage in a fresh coarse-pointer
// context at the given viewport. We do NOT need the engine to boot — the overlay swap
// is pure CSS, resolved at first layout — but we DO wait for DOMContentLoaded so the
// elements and <style> exist. getComputedStyle reflects the applied media query.
async function readOverlayState(browser, viewport, label) {
  // hasTouch + isMobile => the emulated device advertises a COARSE pointer, which is
  // what `@media (pointer: coarse)` keys on. The viewport's width/height ratio drives
  // `@media (orientation: portrait|landscape)`.
  const context = await browser.newContext({
    viewport,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  page.on("pageerror", (err) =>
    errors.push({ ctx: label, type: "pageerror", message: err.message })
  );
  try {
    await page.goto(`http://localhost:${PORT}/src/index.html`, {
      waitUntil: "domcontentloaded",
    });
    // Give the layout a frame so the media query is applied before we read.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
    const state = await page.evaluate(() => {
      const disp = (sel) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).display : "__missing__";
      };
      return { rotate: disp("#rotate"), stage: disp("#stage") };
    });
    return state;
  } finally {
    await context.close();
  }
}

let failed = false;
const browser = await chromium.launch({ headless: true });
try {
  // --- PORTRAIT (coarse): overlay shown, game hidden -----------------------
  const portrait = await readOverlayState(
    browser,
    { width: 540, height: 960 },
    "portrait"
  );
  console.log(
    `PORTRAIT  540x960 coarse -> #rotate.display="${portrait.rotate}", #stage.display="${portrait.stage}" (expect #rotate!=none, #stage=none)`
  );
  if (portrait.rotate === "none" || portrait.rotate === "__missing__") {
    console.error(
      `ASSERTION FAILED — portrait: #rotate should be displayed but was "${portrait.rotate}"`
    );
    failed = true;
  }
  if (portrait.stage !== "none") {
    console.error(
      `ASSERTION FAILED — portrait: #stage should be hidden (none) but was "${portrait.stage}"`
    );
    failed = true;
  }

  // --- LANDSCAPE (coarse): game shown, overlay hidden ----------------------
  const landscape = await readOverlayState(
    browser,
    { width: 960, height: 540 },
    "landscape"
  );
  console.log(
    `LANDSCAPE 960x540 coarse -> #rotate.display="${landscape.rotate}", #stage.display="${landscape.stage}" (expect #rotate=none, #stage!=none)`
  );
  if (landscape.rotate !== "none") {
    console.error(
      `ASSERTION FAILED — landscape: #rotate should be hidden (none) but was "${landscape.rotate}"`
    );
    failed = true;
  }
  if (landscape.stage === "none" || landscape.stage === "__missing__") {
    console.error(
      `ASSERTION FAILED — landscape: #stage should be displayed but was "${landscape.stage}"`
    );
    failed = true;
  }

  if (errors.length > 0) {
    console.error("Probe encountered browser errors (infrastructure, not the overlay assertion):");
    for (const e of errors) console.error(JSON.stringify(e));
    failed = true;
  }

  if (!failed) {
    console.log(
      "Orientation-overlay probe: PASS — portrait shows #rotate (game hidden); landscape shows the game (#rotate hidden)."
    );
  }
} catch (e) {
  console.error("Orientation-overlay probe failed (infrastructure error, not the overlay assertion):", e.message);
  failed = true;
} finally {
  await browser.close();
  server.close();
}

process.exit(failed ? 1 : 0);
