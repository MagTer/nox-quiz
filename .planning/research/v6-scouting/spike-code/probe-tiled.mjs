// Minimal probe: does sprite({tiled:true,width,height}) render, and how?
import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync } from "fs";
import { extname, join, resolve, sep, dirname } from "path";
import { fileURLToPath } from "url";

const FALLBACK = (() => {
  const base = `${process.env.HOME}/.nvm/versions/node`;
  try {
    for (const v of readdirSync(base).sort().reverse()) {
      const p = `${base}/${v}/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs`;
      if (existsSync(p)) return p;
    }
  } catch {}
  return null;
})();
async function pw() {
  const require = createRequire(import.meta.url);
  try { return await import(require.resolve("playwright")); } catch {}
  if (process.env.PLAYWRIGHT_MJS_PATH) return await import(process.env.PLAYWRIGHT_MJS_PATH);
  return await import(FALLBACK);
}
const { chromium } = await pw();
const ROOT_ABS = resolve(dirname(fileURLToPath(import.meta.url)));
const PORT = 8771;
const MIME = { ".html": "text/html", ".js": "application/javascript", ".mjs": "application/javascript", ".png": "image/png" };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, `http://x`).pathname);
  if (p === "/") p = "/index.html";
  const fp = resolve(join(ROOT_ABS, p));
  if (fp !== ROOT_ABS && !fp.startsWith(ROOT_ABS + sep)) { res.writeHead(403); return res.end(); }
  try { res.writeHead(200, { "Content-Type": MIME[extname(fp)] || "application/octet-stream" }); res.end(await readFile(fp)); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
await page.goto(`http://127.0.0.1:${PORT}/?scene=autotile`);
await page.waitForFunction(() => window.__spike?.ready);
const info = await page.evaluate(() => {
  for (const o of get("demo")) destroy(o);
  const variants = [
    ["A-fill-tiled", sprite("fill", { tiled: true, width: 128, height: 96 }), pos(20, 40)],
    ["B-fill-plain", sprite("fill"), pos(180, 40)],
    ["C-atlas-f4-tiled", sprite("atlas", { frame: 4, tiled: true, width: 128, height: 96 }), pos(260, 40)],
    ["D-atlas-f4", sprite("atlas", { frame: 4 }), pos(420, 40)],
  ];
  const made = [];
  for (const [name, sp, ps] of variants) {
    try {
      const o = add([sp, ps]);
      made.push({ name, w: o.width, h: o.height });
    } catch (e) {
      made.push({ name, error: String(e) });
    }
  }
  return made;
});
await page.waitForTimeout(600);
await page.screenshot({ path: join(ROOT_ABS, "out", "probe-tiled.png") });
console.log(JSON.stringify({ info, errs }, null, 2));
await browser.close();
server.close();
