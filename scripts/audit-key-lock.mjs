#!/usr/bin/env node
// scripts/audit-key-lock.mjs — Phase 34.5 (KEY-01/KEY-02) IN-ENGINE KEY/LOCK WITNESS.
//
// WHAT THIS GATE PROVES, EXACTLY:
//
//   A real, driven player in the real running engine walks to level-02's key,
//   picks it up (the ONLY place in the whole codebase that destroys a "key" tag is
//   src/mechanics/key.js's pickup handler, wired in src/scenes/game.js — so "the
//   key is gone from get('key')" IS the in-engine pickup signal), then walks to
//   level-02's lock and opens it WITH the key held (the ONLY place that destroys a
//   "lock" tag is that same module's key-held collide branch — so "the lock is
//   gone from get('lock')" IS the in-engine open signal, and it can only have
//   fired because the key was genuinely held by that point).
//
//   The static model (scripts/lib/key-lock-check.mjs, composed into
//   validate-levels.mjs) proves the key is REACHABLE spawn-side of the lock. It
//   does NOT prove a real player actually walks over the key's trigger box on a
//   natural approach — a jump arc that clears a gap can sail clean over a
//   ground-level trigger placed inside its landing zone (exactly the bug this
//   plan's Task 1 found and fixed by hand: the RESEARCH-suggested x:760 sat inside
//   the arc that clears the 520..700 gap and was never actually touched by
//   node scripts/browser-boot.mjs's driven player). This milestone has repeatedly
//   shipped bugs past a green static model (sawtooth floor, grey ground,
//   ceiling-bonk coins — see audit-coins.mjs's own header) — a static PASS/WARN
//   alone is not proof (34.5-CONTEXT.md success criterion 3). This script is that
//   proof, driving the ACTUAL geometry read live from getLevel("level-02"), never
//   a hardcoded x/y pair, so it can never silently drift from the real descriptor.
//
// This is a MANUALLY-INVOKED gate (like audit-coins.mjs and
// audit-phase21-mechanics.mjs) — it launches a browser, so it is NEVER wired into
// check-gate.sh. It IS a pass/fail gate: exit 1 unless BOTH the key and the lock
// are confirmed gone in-engine.
//
// Run: node scripts/audit-key-lock.mjs
//
// Serves the repo root on a local loopback-only port (8774 — 8765/8766/8767/8768/
// 8769/8770/8771/8772/8773 are already used by browser-boot.mjs /
// screenshot-phase18.mjs / screenshot-phase20.mjs / audit-phase21-mechanics.mjs /
// calibrate-jump-envelope.mjs / screenshot-phase26.mjs /
// screenshot-phase33-terrain.mjs / audit-coins.mjs / screenshot-phase34-climb.mjs).
// Copies audit-coins.mjs's resolvePlaywright() and local static server VERBATIM,
// including its CR-02 path-traversal guard and loopback-only bind, and its
// SAVE_KEY/SAVE_BLOB seeding + title->select->level navigation. The Playwright
// duplication in this repo is DELIBERATE (CLAUDE.md): do not extract a shared
// module, do not simplify either guard — fix bugs by hand in each copy.

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync } from "fs";
import { extname, join, resolve, sep } from "path";
import { getLevel, LEVEL_ORDER } from "../src/levels/index.js";
import { deriveEncounters, driveToXPlanned, resolveIfBoxed } from "./lib/mechanic-drive.mjs";

// --- Playwright resolution (copied verbatim from scripts/audit-coins.mjs) ---
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

// --- Local static server (copied verbatim from scripts/audit-coins.mjs) ---
const ROOT = new URL("../", import.meta.url);
const ROOT_ABS = resolve(ROOT.pathname);
const PORT = 8774; // 8765..8773 already used by other scripts (see header comment)

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
// Derive the unlocked-levels blob from the live LEVEL_ORDER import instead of a
// hardcoded literal, so it can never silently drift out of sync with the real level
// roster (unlock is derived: clearing level-N unlocks N+1, so marking every level
// except the last "cleared" unlocks all of them).
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

const browser = await chromium.launch({ headless: true });

let failed = false;
const results = [];

try {
  const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await context.newPage();
  page.on("pageerror", (err) => {
    results.push({ type: "pageerror", message: err.message });
    failed = true;
  });

  try {
    await page.goto(`http://localhost:${PORT}/src/index.html`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500); // let Kaplay init and title scene paint

    await page.evaluate(
      ({ key, blob }) => localStorage.setItem(key, JSON.stringify(blob)),
      { key: SAVE_KEY, blob: SAVE_BLOB }
    );
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    // Title -> select.
    await page.keyboard.press("Space");
    await page.waitForTimeout(800);

    // Select level-02 (index 1 in the 2x4 grid: row 0, col 1 — one ArrowRight from
    // the always-focused first tile).
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(150);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500); // let the game scene build the level

    const level = getLevel("level-02");
    const geometry = level.geometry;
    const key = geometry.keys?.[0];
    const lock = geometry.locks?.[0];

    if (!key || !lock) {
      console.error(
        `audit-key-lock: level-02's geometry has no keys/locks (key=${JSON.stringify(key)}, ` +
          `lock=${JSON.stringify(lock)}) — nothing to drive.`
      );
      failed = true;
    } else {
      // Sanity: the key/lock entities must exist in the live scene before we drive
      // (a build.js emission bug would otherwise silently make this audit vacuous).
      const beforeKeyCount = await page.evaluate(() => get("key").length);
      const beforeLockCount = await page.evaluate(() => get("lock").length);
      if (beforeKeyCount === 0 || beforeLockCount === 0) {
        console.error(
          `audit-key-lock: level-02 entered with key=${beforeKeyCount} lock=${beforeLockCount} ` +
            "live entities — expected 1 of each before any drive."
        );
        failed = true;
      }

      // 1) Drive to the key. Its destroy() is ONLY called by wireKey's pickup
      // handler (src/mechanics/key.js), so its absence afterward IS the in-engine
      // pickup signal.
      await driveToXPlanned(page, key.x, geometry, { targetY: key.y });
      const keyGone = (await page.evaluate(() => get("key").length)) === 0;

      // 2) Resolve every door/enemy/math-gate encounter that sits BETWEEN the key
      // and the lock on level-02's path (the door at x:1540 and the enemy at
      // x:1860 — CONTEXT's fixed level-02 placement puts both before the lock at
      // x:3960). driveToXPlanned's own `triggered` flag is a GENERIC "did ANY
      // challenge open" signal (baseline-relative get("challenge").length), not a
      // "did I reach my target x" signal — Rule-1 finding, reproduced directly:
      // driving straight from the key to the lock stalls the instant the door's
      // challenge opens (reachedX landed at the door's x, `triggered:true`, well
      // short of the lock), because driveToXPlanned has no way to know this
      // particular challenge isn't the one the caller cares about. Mirrors
      // browser-boot.mjs's own "resolve every remaining encounter on the path
      // first" loop (its own CR-01 fix, same root cause) before driving onward.
      const inBetween = deriveEncounters(geometry)
        .filter((e) => e.tag !== "secret-alcove" && e.x > key.x && e.x < lock.x)
        .sort((a, b) => a.x - b.x);
      for (const encounter of inBetween) {
        const { triggered: hit } = await driveToXPlanned(page, encounter.x, geometry);
        if (hit) await resolveIfBoxed(page);
      }

      // 3) Drive to the lock. NO targetY here (unlike the key above): lock.y is
      // the TOP of the apex-tall blocker (build.js's door/gate/enemy blocker
      // formula), not a walkable surface — passing it as a target platform y would
      // send planTakeoffs hunting for a node that doesn't exist. The lock is a
      // FLOOR-level barrier the player simply walks into horizontally, exactly
      // like a door/enemy encounter (deriveEncounters never threads targetY for
      // those either). With the key held, wireKey's lock-open branch destroys the
      // blocker (and its panel) BEFORE the next frame — so its absence afterward
      // proves the player opened it WITH the key, not that it was simply never
      // emitted.
      await driveToXPlanned(page, lock.x, geometry);
      const lockGone = (await page.evaluate(() => get("lock").length)) === 0;

      const triggered = keyGone && lockGone;
      results.push({
        level: level.id,
        key: { x: key.x, y: key.y, collected: keyGone },
        lock: { x: lock.x, y: lock.y, opened: lockGone },
        triggered,
      });

      if (!triggered) {
        console.error(
          `audit-key-lock: OFFENDER level-02 — key.collected=${keyGone} lock.opened=${lockGone} ` +
            "(expected both true: a real driven player must pick up the key THEN open the lock)."
        );
        failed = true;
      }
    }
  } finally {
    await context.close();
  }
} catch (e) {
  console.error("audit-key-lock failed:", e.message);
  failed = true;
} finally {
  await browser.close();
  server.close();
}

console.log(JSON.stringify(results, null, 2));

if (failed) {
  console.log("AUDIT-KEY-LOCK: FAIL");
  process.exit(1);
}

console.log("AUDIT-KEY-LOCK: KEY COLLECTED, LOCK OPENED — SC3 in-engine proof holds.");
process.exit(0);
