// Playwright driver for the v6.0 spikes. Server/resolution skeleton copied from
// scripts/browser-boot.mjs per project convention (loopback bind + traversal guard).
import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync, mkdirSync } from "fs";
import { extname, join, resolve, sep, dirname } from "path";
import { fileURLToPath } from "url";

const FALLBACK_PLAYWRIGHT_PATH = (() => {
  const base = `${process.env.HOME}/.nvm/versions/node`;
  try {
    for (const v of readdirSync(base).sort().reverse()) {
      const p = `${base}/${v}/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs`;
      if (existsSync(p)) return p;
    }
  } catch {}
  return `${base}/v22.22.2/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs`;
})();

async function resolvePlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return await import(require.resolve("playwright"));
  } catch {}
  if (process.env.PLAYWRIGHT_MJS_PATH) return await import(process.env.PLAYWRIGHT_MJS_PATH);
  return await import(FALLBACK_PLAYWRIGHT_PATH);
}

const { chromium } = await resolvePlaywright();

const ROOT_ABS = resolve(dirname(fileURLToPath(import.meta.url)));
const PORT = 8770;
const OUT = join(ROOT_ABS, "out");
mkdirSync(OUT, { recursive: true });

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".png": "image/png",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let reqPath = decodeURIComponent(url.pathname);
  if (reqPath === "/") reqPath = "/index.html";
  const filePath = resolve(join(ROOT_ABS, reqPath));
  if (filePath !== ROOT_ABS && !filePath.startsWith(ROOT_ABS + sep)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

const findings = {};

function analyze(samples, flag, relKeys) {
  const on = samples.filter((s) => s[flag]);
  if (on.length === 0) return { frames: samples.length, onFrames: 0 };
  const rel = on.map((s) => s[relKeys[0]] - s[relKeys[1]]);
  return {
    frames: samples.length,
    onFrames: on.length,
    onFraction: +(on.length / samples.length).toFixed(3),
    relDriftPx: +(Math.max(...rel) - Math.min(...rel)).toFixed(2),
  };
}

// ---------- platform scene ----------
await page.goto(`http://127.0.0.1:${PORT}/?scene=platform`);
await page.waitForFunction(() => window.__spike?.ready, { timeout: 15000 });
await page.waitForTimeout(1500); // land on platH

// Phase 1: NATIVE engine carry (stickToPlatform default), horizontal, long ride —
// checks the drift is bounded oscillation, not cumulative slide-off.
await page.evaluate(() => window.__spike.mount("h"));
await page.waitForTimeout(500);
await page.evaluate(() => window.__spike.clearSamples());
await page.waitForTimeout(12000); // 4 full periods
let s = await page.evaluate(() => window.__spike.samples);
findings.horizontalNativeCarry = analyze(s, "onH", ["px", "hx"]);
{
  // cumulative-vs-bounded: compare drift of first vs last third of the ride
  const on = s.filter((x) => x.onH).map((x) => x.px - x.hx);
  const third = Math.floor(on.length / 3);
  const span = (a) => Math.max(...a) - Math.min(...a);
  if (third > 10) {
    findings.horizontalNativeCarry.firstThirdDriftPx = +span(on.slice(0, third)).toFixed(2);
    findings.horizontalNativeCarry.lastThirdDriftPx = +span(on.slice(-third)).toFixed(2);
  }
}

// Phase 2: manual delta-carry ON TOP of native (the anti-pattern) — documents why
// build code must NOT hand-carry the rider.
await page.evaluate(() => {
  window.__spike.setCarry(true);
  window.__spike.mount("h");
});
await page.waitForTimeout(500);
await page.evaluate(() => window.__spike.clearSamples());
await page.waitForTimeout(4500);
s = await page.evaluate(() => window.__spike.samples);
findings.horizontalDoubleCarryAntiPattern = analyze(s, "onH", ["px", "hx"]);

// Phase 3: native carry, vertical platform, full cycles
await page.evaluate(() => {
  window.__spike.setCarry(false);
  window.__spike.mount("v");
});
await page.waitForTimeout(1000);
await page.evaluate(() => window.__spike.clearSamples());
await page.waitForTimeout(6000);
s = await page.evaluate(() => window.__spike.samples);
findings.verticalNativeCarry = analyze(s, "onV", ["py", "vy"]);
const vys = s.filter((x) => x.onV).map((x) => x.vy);
findings.verticalNativeCarry.platYSpanPx = vys.length
  ? +(Math.max(...vys) - Math.min(...vys)).toFixed(1)
  : 0;

// Phase 4: jump off + land somewhere solid again
await page.evaluate(() => window.__spike.mount("h"));
await page.waitForTimeout(800);
await page.evaluate(() => {
  window.__spike.clearSamples();
  window.__spike.jump();
});
await page.waitForTimeout(2500);
s = await page.evaluate(() => window.__spike.samples);
const wentAirborne = s.some((x) => !x.grounded);
const landedBack = s.slice(-30).every((x) => x.grounded);
const last = s[s.length - 1];
findings.jumpOffLandBack = {
  wentAirborne,
  landedBack,
  finalPos: last ? { x: +last.px.toFixed(1), y: +last.py.toFixed(1), grounded: last.grounded } : null,
};
await page.screenshot({ path: join(OUT, "platform-scene.png") });

// ---------- autotile scene ----------
await page.goto(`http://127.0.0.1:${PORT}/?scene=autotile`);
await page.waitForFunction(() => window.__spike?.ready, { timeout: 15000 });
await page.waitForTimeout(800);
findings.autotileDemoTiles = await page.evaluate(() => window.__spike.demoCount);
await page.screenshot({ path: join(OUT, "autotile-demo.png") });

for (const [cols, rows, culled] of [[80, 14, false], [400, 14, false], [400, 14, true]]) {
  const r = await page.evaluate(
    ([c, rw, cu]) => window.__spike.stress(c, rw, cu),
    [cols, rows, culled],
  );
  await page.waitForTimeout(3000);
  r.fpsAfter3s = await page.evaluate(() => window.__spike.fps());
  findings[`stress_${cols}x${rows}${culled ? "_offscreenCulled" : ""}`] = r;
}
// tiled-fill idiom: same covered area as the 400x14 stress, tiny object count
const rt = await page.evaluate(() => window.__spike.stressTiled(400, 14));
await page.waitForTimeout(3000);
rt.fpsAfter3s = await page.evaluate(() => window.__spike.fps());
findings.stressTiled_400x14 = rt;
await page.screenshot({ path: join(OUT, "autotile-tiled.png") });

findings.pageErrors = errors;
console.log(JSON.stringify(findings, null, 2));

await browser.close();
server.close();
