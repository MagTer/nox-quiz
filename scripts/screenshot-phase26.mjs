#!/usr/bin/env node
// Capture real in-game screenshots for Phase 26's human-verify sign-off (VIS-03, VIS-04).
// Reuses screenshot-phase20.mjs's static-file-server/MIME/chromium skeleton and
// browser-boot.mjs's save-seed + row/col select-grid navigation technique (per this
// project's established convention of copying Playwright script boilerplate by hand
// rather than extracting a shared module — see docs/CLAUDE.md "Playwright script
// duplication is deliberate").
//
// PORT 8770 — deliberately NOT the plan's originally-specified 8768: that port is
// already claimed by scripts/audit-phase21-mechanics.mjs (verified via `grep -rn
// "PORT = " scripts/*.mjs` before writing this file), so 8768 would silently collide
// if both scripts ever ran concurrently. 8769 is also already claimed by
// calibrate-jump-envelope.mjs. 8770 is the next free port (Rule 1 — plan bug fix).
//
// Unlike screenshot-phase20.mjs (pure fixed-timer camera pans on a flat opening run),
// level-01's enemy (x:1000) and door (x:1400) sit BEHIND a mandatory gap-jump (560-720)
// and the enemy's own tall, un-jumpable invisible blocker forces a challenge to open
// before the door can ever be reached — a bare "hold ArrowRight for N seconds" timer
// cannot reliably reach either sprite without dying in the gap or getting stuck behind
// the enemy's answer panel. So this script imports the already-proven, project-shared
// scripts/lib/mechanic-drive.mjs driver (driveToXPlanned/resolveIfBoxed — already
// consumed by browser-boot.mjs) instead of reinventing timed-hold navigation:
// driveToXPlanned walks+jumps using the same geometry-informed route planner the
// structural validator itself uses, and stops safely short of a target x without
// necessarily touching any mechanic trigger along the way (Rule 1 fix vs. the plan's
// literal "hold ArrowRight for ~4.3s / ~1.7s more" prose, which does not account for
// the mandatory gap jump between spawn and the enemy).

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync } from "fs";
import { extname, join, resolve, sep } from "path";
import { LEVEL_ORDER, getLevel } from "../src/levels/index.js";
import { driveToXPlanned, resolveIfBoxed, deriveEncounters } from "./lib/mechanic-drive.mjs";

// WR-02 (ported from browser-boot.mjs): resolve playwright dynamically instead of a
// hardcoded, machine-specific absolute path.
const FALLBACK_PLAYWRIGHT_PATH = (() => {
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
const PORT = 8770;

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

const SAVE_KEY = "mathlab_platformer_v2";
// Derive the unlocked-levels blob from the live LEVEL_ORDER import (browser-boot.mjs's
// own WR-02 idiom) so this script can never silently drift if a level is added/removed.
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
  // CR-02 (ported): resolve + clamp to ROOT so `..` segments can't escape the served
  // directory; loopback-only bind below.
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

const OUT = (name) =>
  new URL(`../.planning/phases/26-grunge-palette-nox-run-rebrand/${name}`, import.meta.url).pathname;

const saved = [];
let failed = false;

try {
  await page.goto(`http://localhost:${PORT}/src/index.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500); // let Kaplay init and title scene paint

  // Seed a save that unlocks all 8 levels (derived unlock: clearing level-N unlocks N+1).
  await page.evaluate(
    ({ key, blob }) => localStorage.setItem(key, JSON.stringify(blob)),
    { key: SAVE_KEY, blob: SAVE_BLOB }
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // Title -> select.
  await page.keyboard.press("Space");
  await page.waitForTimeout(800);

  for (let i = 0; i < LEVEL_ORDER.length; i++) {
    const n = i + 1; // 1-based level number for filenames
    const levelId = LEVEL_ORDER[i];

    // Select screen's cursor resets to the first selectable tile on every fresh entry
    // (src/scenes/select.js rebuilds `cursor = 0` on each selectScene() call) — so this
    // row/col walk always starts from (0,0), matching browser-boot.mjs's own assumption.
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

    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500); // let the game scene build the level

    // 1. Per-level theme screenshot — taken at spawn (no movement needed): the
    // theme-tinted ground/parallax is already visible without walking anywhere.
    await page.screenshot({ path: OUT(`phase26-level-${String(n).padStart(2, "0")}-theme.png`) });
    saved.push(`phase26-level-${String(n).padStart(2, "0")}-theme.png`);

    if (levelId === "level-01") {
      const level = getLevel(levelId);
      const encounters = deriveEncounters(level.geometry); // ascending-x sorted: mathGate@150,
      // collectZone@300, enemy@1000, mathGate@1360, door@1400, mathGate@3120
      const enemyEnc = encounters.find((e) => e.tag === "enemy");
      const doorEnc = encounters.find((e) => e.tag === "door");

      // collect.js's answer-zone challenge (renderChoices:false) is deliberately left
      // OPEN by resolveIfBoxed — its resolution path is walking into the correct
      // numeric pickup, not a key press. Left unresolved, its prompt banner ("Collect
      // the answer to N × M") stays rendered at the top of every subsequent screenshot
      // (found via an initial run of this script — Rule 1 fix). Since the pickup's
      // correct value isn't exposed as a flag, parse it from the SAME arithmetic text
      // the prompt itself displays (q.a × q.b, computed once, matches challenge.js's
      // own `${q.a} × ${q.b}` display exactly), find the matching "answer-pickup-slot"
      // entity, and reposition the player onto it directly — Kaplay's per-frame
      // collision pass then fires the normal onCollide("answer-pickup-slot", ...)
      // path next tick, exactly as a real walk-in would, just without the intermediate
      // jump/walk motion (purely a screenshot-cleanliness aid, not a gameplay-proof
      // step — collectZone's real interactive resolution is already covered by
      // scripts/audit-phase21-mechanics.mjs and browser-boot.mjs elsewhere).
      async function autoResolveCollectZone() {
        const slot = await page.evaluate(() => {
          const promptObj = get("challenge").find((o) => typeof o.text === "string" && /Collect the answer to/.test(o.text));
          if (!promptObj) return null;
          const m = promptObj.text.match(/(\d+)\s*×\s*(\d+)/);
          if (!m) return null;
          const answer = parseInt(m[1], 10) * parseInt(m[2], 10);
          const s = get("answer-pickup-slot").find((sl) => sl.value === answer);
          return s ? { x: s.pos.x, y: s.pos.y } : null;
        });
        if (!slot) return false;
        await page.evaluate(({ x, y }) => {
          const p = get("player")[0];
          if (p) {
            p.pos.x = x + 8;
            p.pos.y = y + 8;
            p.vel = vec2(0, 0);
          }
        }, slot);
        await page.waitForTimeout(300);
        return true;
      }

      // Walk through + resolve every encounter STRICTLY before `beforeX`, in order —
      // e.g. level-01's opening mathGate@150 and collectZone@300 both sit BEFORE the
      // enemy at x:1000 and would otherwise open a challenge (and freeze the player,
      // for the boxed mathGate) long before the enemy is ever reached (Rule 1 fix: a
      // naive single driveToXPlanned(page, enemyX-100, ...) call stops at the FIRST
      // challenge it meets, which is this mathGate, not the enemy).
      async function passEncountersBefore(beforeX) {
        for (const enc of encounters) {
          if (enc.x >= beforeX) break;
          const { triggered } = await driveToXPlanned(page, enc.x, level.geometry);
          if (!triggered) continue;
          if (enc.renderChoices) {
            await resolveIfBoxed(page, true);
          } else {
            await autoResolveCollectZone();
          }
        }
      }

      // 2. Enemy close-up: clear everything before it, then walk to just short of its
      // tall invisible blocker (a deliberate apex-derived collider that cannot be
      // jumped over — see build.js) so the sprite is visible in-frame WITHOUT opening
      // the challenge overlay (which would dim/cover it) — a clean art-only shot.
      await passEncountersBefore(enemyEnc.x);
      await driveToXPlanned(page, enemyEnc.x - 100, level.geometry);
      await page.waitForTimeout(400);
      await page.screenshot({ path: OUT("phase26-enemy-closeup.png") });
      saved.push("phase26-enemy-closeup.png");

      // 3. Resolve the enemy encounter itself (mandatory — its blocker cannot be
      // bypassed), then resolve anything else before the door (level-01's mathGate at
      // x:1360, positioned right before the door). The natural stopping point after
      // that resolution sits close enough to the door (x:1400) for a clean close-up
      // without touching the door's own blocker.
      {
        const { triggered } = await driveToXPlanned(page, enemyEnc.x, level.geometry);
        if (triggered) await resolveIfBoxed(page, true);
      }
      await passEncountersBefore(doorEnc.x);
      await page.waitForTimeout(400);
      await page.screenshot({ path: OUT("phase26-door-closeup.png") });
      saved.push("phase26-door-closeup.png");
    }

    // Return to select for the next level.
    if (i < LEVEL_ORDER.length - 1) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(800);
    }
  }

  console.log(`Screenshots saved (${saved.length}): ${saved.join(", ")}`);
  if (saved.length !== 10) {
    console.error(`Expected 10 screenshots, got ${saved.length}`);
    failed = true;
  }
} catch (e) {
  console.error("screenshot-phase26 failed:", e.message);
  failed = true;
} finally {
  await context.close();
  await browser.close();
  server.close();
}

process.exit(failed ? 1 : 0);
