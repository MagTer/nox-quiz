// RED-first Playwright touch-coordinate probe (MOB-01, Phase 37, plan 37-01).
//
// Boots the game in a TOUCH-emulated browser context (hasTouch/isMobile), taps
// the visual center of the #game canvas, reads the resulting game-space
// coordinate back through the engine's OWN onTouchStart callback (fed by the
// single letterbox-aware window->content transform `Qe` in lib/kaplay.mjs), and
// asserts the tap maps to game-x ~320 (the internal center of the 640-wide game
// space).
//
// This is a RED-first permanent gate:
//   * Against the CURRENT `transform: scale(1.5)` build the tap reads ~480
//     (the visual-center clientX-rect = 480, mapped 480*640/640 = 480), so the
//     `|x-320|<=2` assertion FAILS and the process exits non-zero — empirically
//     proving the documented mouse/touch coordinate desync (mouse reads the
//     transform-immune `offsetX` = 320; touch reads the transform-affected
//     `clientX - getBoundingClientRect().x` = 480). See 37-RESEARCH.md finding 2.
//   * After the 37-02 letterbox migration (transform removed, `letterbox: true`)
//     the same tap reads ~320 and the probe goes GREEN. It then stays a permanent
//     regression gate in the phase suite.
//
// DELIBERATE DUPLICATION (CLAUDE.md): the static server + resolvePlaywright()
// resolver + ephemeral-port (listen(0)) block below are COPIED verbatim from
// scripts/browser-boot.mjs. Do NOT extract a shared module; fix any bug
// identically by hand in every copy. Do NOT weaken the loopback bind or the
// ROOT-clamped path resolution (T-37-01: path-traversal mitigation).

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
// The probe itself.
// ---------------------------------------------------------------------------

// Touch context MUST be enabled: hasTouch turns on page.touchscreen.tap + real
// touch events; isMobile applies stricter emulation so the viewport meta is
// honored. Fixed 960x540 so the current transform-scaled 640x360 canvas fills
// it exactly (16:9 into 16:9) — the visual center is therefore a clean 480,270
// tap that maps to game-x 480 under the (pre-migration) non-letterbox path.
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

let failed = false;
try {
  await page.goto(`http://localhost:${PORT}/src/index.html`, { waitUntil: "networkidle" });

  // Wait for the engine to boot: `kaplay({ global: true })` exposes onTouchStart /
  // mousePos on window only AFTER init runs (the a727c13 rule) and after the queued
  // sprite loads resolve past Kaplay's loading screen. Gate on the touch global being
  // a real function rather than a fixed sleep.
  await page.waitForFunction(() => typeof window.onTouchStart === "function", null, {
    timeout: 15000,
  });
  await page.waitForTimeout(1000); // let the title scene settle and asset loads finish

  // Inject the read-back listener using the engine's OWN public touch global. The
  // engine delivers `pos` already mapped through the single `Qe` window->content
  // transform, so whatever we read here is exactly the game-space coordinate the rest
  // of the game would see for this tap — no app-side coordinate math.
  await page.evaluate(() => {
    window.__lastTouch = null;
    onTouchStart((pos) => {
      window.__lastTouch = { x: pos.x, y: pos.y };
    });
  });

  // Tap the VISUAL center of the canvas (its on-screen, post-CSS-transform box).
  const box = await page.locator("#game").boundingBox();
  if (!box) throw new Error("could not resolve #game canvas bounding box");
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  await page.touchscreen.tap(centerX, centerY);

  // Let one frame pass so the engine's onOnce("input") pump delivers the touchStart
  // KEvent to our listener before we read it back across the frame boundary.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));

  let p = await page.evaluate(() => window.__lastTouch);

  // A5 fallback (37-RESEARCH.md Assumption A5): if the injected-callback read flakes
  // across the frame boundary (null), fall back to reading mousePos() — touchToMouse
  // (default ON) also writes e.mousePos via the SAME Qe transform on tap, so it is the
  // same game-space coordinate. Enable this only if the primary read proves unstable.
  if (!p) {
    const mp = await page.evaluate(() => (typeof mousePos === "function" ? mousePos() : null));
    if (mp) p = { x: mp.x, y: mp.y };
  }

  if (!p) {
    throw new Error(
      "touch read-back was null — neither onTouchStart nor mousePos() reported a tap position (infrastructure failure, not the desync)"
    );
  }

  console.log(
    `touch center tap -> game-space (${p.x.toFixed(1)}, ${p.y.toFixed(1)}); expected game-x ~320 (canvas center of 640-wide space)`
  );

  // The load-bearing assertion. RED on the transform build (p.x ~480), GREEN after
  // the 37-02 letterbox migration (p.x ~320).
  if (Math.abs(p.x - 320) > 2) {
    console.error(
      `ASSERTION FAILED — touch desync: expected game-x~320, got ${p.x.toFixed(1)} ` +
        `(overshoot by the CSS transform:scale(1.5) factor — the documented mouse/touch coordinate desync)`
    );
    failed = true;
  } else {
    console.log("Touch-coordinate probe: PASS — center tap maps to game-x ~320 (coordinate spaces unified).");
  }

  // Any page/console error during boot is an infrastructure failure, not the desync —
  // surface it so a crash can never masquerade as the RED assertion.
  if (errors.length > 0) {
    console.error("Probe encountered browser errors (infrastructure, not the desync assertion):");
    for (const e of errors) console.error(JSON.stringify(e));
    failed = true;
  }
} catch (e) {
  console.error("Touch-coordinate probe failed (infrastructure error, not the desync assertion):", e.message);
  failed = true;
} finally {
  await context.close();
  await browser.close();
  server.close();
}

process.exit(failed ? 1 : 0);
