#!/usr/bin/env node
// scripts/audit-motion-fixture.mjs — the ASSERTIVE RED->GREEN motion-audit proof for
// Phase 36 (36-02).
//
// Unlike scripts/audit-phase21-mechanics.mjs (a diagnostic that ALWAYS exits 0 and is
// read by eye), this runner is a REAL GATE: it drives the scripts/fixtures/
// motion-audit-fixture.mjs mover+patroller through auditLevelWithRetries (the SAME real
// dispatch the shipped-level audit uses) and EXITS NON-ZERO unless the fixture's mover is
// RIDDEN (carried) and its patroller is CROSSED (contact fired the respawn seam). Its exit
// code is never swallowed.
//
// Why a fixture host rather than a new scene: build.js does not emit movers/patrollers yet
// (those land in plan 36-03), so this runner enters the real level-01 scene (real player,
// real physics, real floor) and INJECTS the fixture's motion entities into that live scene
// via page.evaluate — a moving platform (native body({isStatic:true}) + a dt raised-cosine
// oscillation; the player's own body(stickToPlatform) carries the rider, per 36-RESEARCH.md
// §Standard Stack — never hand-carried) and a ping-pong patroller wired through a
// reposition-in-place respawn seam that mirrors game.js's own reset() /
// onCollide("spike", () => respawn()). The fixture geometry (its flat floor) is what
// deriveEncounters()/driveToXPlanned see, so the audit rides/crosses exactly these entities.
//
// The Playwright server/guard/boot skeleton is COPIED from audit-phase21-mechanics.mjs by
// hand (the duplication across these scripts is DELIBERATE per CLAUDE.md — fix bugs in each
// copy independently; do NOT extract a shared module).

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync } from "fs";
import { extname, join, resolve, sep } from "path";
import { auditLevelWithRetries } from "./lib/audit-retry.mjs";
import { MOTION_AUDIT_FIXTURE } from "./fixtures/motion-audit-fixture.mjs";

// --- playwright resolution (copied verbatim from audit-phase21-mechanics.mjs) ---
const FALLBACK_PLAYWRIGHT_PATH = (() => {
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

let PORT = Number(process.env.AUDIT_PORT ?? 0);

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
// The fixture rides the FIRST level's scene (level-01 is always unlocked at index 0), so a
// bare fresh save is enough — no need to derive the full unlocked roster.
const SAVE_BLOB = { version: 3, xp: 0, level: 1, accuracy: {}, history: {}, levels: {} };

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let reqPath = decodeURIComponent(url.pathname);
  if (reqPath === "/") reqPath = "/index.html";
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
PORT = server.address().port;

const browser = await chromium.launch({ headless: true });

// Inject the fixture's motion entities into the LIVE game scene. Engine globals
// (add/rect/pos/area/body/color/vec2/dt/get) come from Kaplay global:true. The mover is a
// solid static body oscillating via a dt raised-cosine (0->1->0, eases at both ends); the
// player's native stickToPlatform carries the rider (NO rider code). The patroller
// ping-pongs and, on contact, fires a reposition-in-place respawn to a captured checkpoint
// — the exact forgiving hazard class game.js uses for spikes.
async function injectFixture(page) {
  await page.evaluate((fix) => {
    const g = fix.geometry;
    const player = get("player")[0];
    // Capture a far-left checkpoint for the respawn seam (mirrors game.js reset()).
    const cp =
      player && player.pos ? player.pos.clone() : vec2(64, 288);

    for (const m of g.movers ?? []) {
      const w = m.w ?? 100;
      const mv = add([
        rect(w, 14),
        pos(m.x1, m.y1),
        area(),
        body({ isStatic: true }), // solid; stickToPlatform on the RIDER does the carry
        color(120, 120, 140),
        "mover",
      ]);
      const period = 6; // s — slow enough to mount, long enough to prove carry
      let t = 0;
      mv.onUpdate(() => {
        t += dt();
        const phase = (1 - Math.cos((2 * Math.PI / period) * t)) / 2; // 0->1->0
        mv.pos.x = m.x1 + (m.x2 - m.x1) * phase;
        mv.pos.y = m.y1 + (m.y2 - m.y1) * phase;
        // NO rider code — body() stickToPlatform carries the player natively.
      });
    }

    for (const p of g.patrollers ?? []) {
      const foe = add([
        rect(20, 32),
        pos(p.x1, p.y1),
        area(),
        color(160, 60, 60),
        "patroller",
      ]);
      const period = 2.4; // s — a visible ping-pong walk
      let t = 0;
      foe.onUpdate(() => {
        t += dt();
        const phase = (1 - Math.cos((2 * Math.PI / period) * t)) / 2;
        foe.pos.x = p.x1 + (p.x2 - p.x1) * phase;
        foe.pos.y = p.y1 + (p.y2 - p.y1) * phase;
      });
    }

    if (player) {
      // The forgiving respawn-hazard wiring (zero punishment): reposition-in-place, kill
      // momentum. Identical semantics to game.js's onCollide("spike", () => respawn()).
      player.onCollide("patroller", () => {
        player.pos = cp.clone();
        player.vel = vec2(0, 0);
      });
    }
  }, MOTION_AUDIT_FIXTURE);
}

// Enter level-01 fresh (title -> select -> first tile -> Enter), then inject the fixture.
async function enterAndInject(page) {
  await page.goto(`http://localhost:${PORT}/src/index.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.evaluate(
    ({ key, blob }) => localStorage.setItem(key, JSON.stringify(blob)),
    { key: SAVE_KEY, blob: SAVE_BLOB }
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.keyboard.press("Space"); // title -> select
  await page.waitForTimeout(800);
  await page.keyboard.press("Enter"); // first tile = level-01
  await page.waitForTimeout(1500); // let the game scene build
  await injectFixture(page);
  await page.waitForTimeout(300);
}

const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
const page = await context.newPage();

let results;
try {
  await enterAndInject(page);

  const level = { id: MOTION_AUDIT_FIXTURE.id, geometry: MOTION_AUDIT_FIXTURE.geometry };

  // reloadLevel re-enters level-01 and RE-INJECTS the fixture entities (a fresh scene
  // destroyed the previous injection), so each retry attempt rides a genuinely fresh
  // mover/patroller.
  async function reloadLevel() {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);
    await page.keyboard.press("Enter"); // back into level-01 (first tile still focused)
    await page.waitForTimeout(1500);
    await injectFixture(page);
    await page.waitForTimeout(300);
  }

  results = await auditLevelWithRetries(page, level, { maxAttempts: 3, reloadLevel });
} finally {
  await context.close();
  await browser.close();
  server.close();
}

// Flatten the `${tag}@${x}` -> {triggered, resolved, attempts} Map for reporting.
const rows = [];
for (const [key, outcome] of results) {
  const atIdx = key.lastIndexOf("@");
  rows.push({
    tag: key.slice(0, atIdx),
    x: Number(key.slice(atIdx + 1)),
    triggered: outcome.triggered,
    resolved: outcome.resolved,
    attempts: outcome.attempts,
  });
}
console.log(JSON.stringify(rows, null, 2));

const moverRows = rows.filter((r) => r.tag === "mover");
const patrollerRows = rows.filter((r) => r.tag === "patroller");

const moverRidden =
  moverRows.length > 0 && moverRows.every((r) => r.triggered === true && r.resolved === true);
const patrollerCrossed =
  patrollerRows.length > 0 &&
  patrollerRows.every((r) => r.triggered === true && r.resolved === true);

if (moverRidden && patrollerCrossed) {
  console.log("MOTION-FIXTURE: RIDDEN + CROSSED (GREEN)");
  process.exit(0);
} else {
  console.log("MOTION-FIXTURE: FAILED");
  if (!moverRidden) console.log(`  mover not ridden: ${JSON.stringify(moverRows)}`);
  if (!patrollerCrossed) console.log(`  patroller not crossed: ${JSON.stringify(patrollerRows)}`);
  process.exit(1);
}
