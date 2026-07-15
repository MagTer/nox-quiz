#!/usr/bin/env node
// scripts/audit-endgate-key.mjs — Phase 34.6 (KEY-02/LEN-02) IN-ENGINE TWO-PATH
// KEY-CONDITIONAL END-GATE WITNESS.
//
// WHAT THIS GATE PROVES, EXACTLY:
//
// 34.6 changed the key mechanic's semantics from 34.5's physical lock (key opens a
// solid barrier; the end math gate is ALWAYS required) to a math-SKIP token: an
// OPTIONAL collectible on a harder high route, with NO geometry.locks. Holding it
// clears the level directly with full XP and the end math challenge never opens;
// missing it means answering the end math as normal (game.js's onReachGoal
// heldKeyIds branch, Phase 34.6 Plan 01). scripts/audit-key-lock.mjs is written for
// the RETIRED 34.5 physical-lock flow (drive to key, then drive to a lock) and no
// longer applies here — level-02 (and every future math-skip level) carries no
// `locks` at all, so that script has nothing left to drive there.
//
// This script is the two-path proof the static model cannot provide (milestone
// precedent: sawtooth floor, grey ground, ceiling-bonk coins, 9px headroom all
// shipped past a green static model):
//
//   PATH A (key collected -> free clear): a real, driven player detours onto the
//   high route, collects the key (get("key").length drops to 0 -- the ONLY place
//   that destroys a "key" tag is src/mechanics/key.js's pickup handler), then
//   reaches the goal WITHOUT the end math challenge ever opening
//   (get("challenge").length never rises above its pre-goal baseline) AND the
//   "gate-cleared" marker appears (the same tag BOTH the math path's
//   mathGate.js onSuccess and the key path's game.js banner render -- see
//   src/scenes/game.js's heldKeyIds branch).
//
//   PATH B (key skipped -> math required): a fresh drive that never detours onto
//   the high route reaches the goal and the end math challenge DOES open
//   (get("challenge").length rises above baseline -- driveToXPlanned's own
//   baseline-relative `triggered` signal).
//
// Every target level is discovered LIVE from the registry (getLevel/LEVEL_ORDER) --
// never a hardcoded level id -- by the same predicate the math-skip design defines:
// `geometry.keys?.length > 0 && !(geometry.locks?.length)`. At this plan's time
// only level-02 qualifies; the script auto-covers level-04/06/08 once THEY are
// rebuilt with the same math-skip shape, with zero code changes here.
//
// This is a MANUALLY-INVOKED gate (like audit-coins.mjs and audit-key-lock.mjs) --
// it launches a browser, so it is NEVER wired into check-gate.sh. It IS a pass/fail
// gate: exit 1 unless BOTH paths hold for EVERY math-skip level.
//
// Run: node scripts/audit-endgate-key.mjs
//
// Serves the repo root on a local loopback-only port 8775 (8774 is taken by
// audit-key-lock.mjs; see that script's header for the full list of ports already
// used by other one-shot audit/screenshot scripts in this repo). Copies
// audit-key-lock.mjs's resolvePlaywright() and local static server VERBATIM,
// including its CR-02 path-traversal guard and loopback-only bind, and its
// SAVE_KEY/SAVE_BLOB seeding. Navigation differs deliberately: rather than
// keyboard-driving the select-screen grid (which requires knowing each target
// level's tile position), this script calls the SAME `go("game", { levelId })`
// Kaplay global browser-boot.mjs already calls directly via page.evaluate() (see
// its own `await page.evaluate(() => go("title"))` round-trip check) -- this is
// what makes level discovery dynamic instead of hardcoded to one grid position.
//
// The Playwright duplication in this repo is DELIBERATE (CLAUDE.md): do not
// extract a shared module, do not simplify either guard -- fix bugs by hand in
// each copy.

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync } from "fs";
import { extname, join, resolve, sep } from "path";
import { getLevel, LEVEL_ORDER } from "../src/levels/index.js";
import { deriveEncounters, driveToXPlanned } from "./lib/mechanic-drive.mjs";

// --- Playwright resolution (copied verbatim from scripts/audit-key-lock.mjs) ---
const FALLBACK_PLAYWRIGHT_PATH = (() => {
  // gsd-pi's bundled playwright moves whenever gsd-pi is (re)installed under a
  // different nvm node version, so search EVERY installed node version, newest
  // first, instead of pinning one path that silently goes stale.
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

// --- Local static server (copied verbatim from scripts/audit-key-lock.mjs) ---
const ROOT = new URL("../", import.meta.url);
const ROOT_ABS = resolve(ROOT.pathname);
const PORT = 8775; // 8774 taken by audit-key-lock.mjs — see its header for the full port map

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
// except the last "cleared" unlocks all of them). Not strictly needed once this
// script drives via go("game", {levelId}) directly (bypassing the select-screen
// unlock gate entirely), but kept for parity with audit-key-lock.mjs's seeding and
// as a defensive baseline in case any future level read touches progress state.
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

// Discover every math-skip level LIVE from the registry: geometry.keys with at
// least one entry AND no geometry.locks. Never a hardcoded id — a future rebuilt
// level-04/06/08 with the same shape is picked up automatically.
const targetLevels = LEVEL_ORDER.filter((id) => {
  const g = getLevel(id).geometry;
  const keys = g.keys ?? [];
  const locks = g.locks ?? [];
  return keys.length > 0 && locks.length === 0;
});

if (targetLevels.length === 0) {
  console.error("audit-endgate-key: no math-skip levels found (geometry.keys with no geometry.locks) — nothing to audit.");
  failed = true;
}

// Resolve every non-alcove encounter (door/enemy) strictly between `fromX` (exclusive)
// and `toX` (exclusive), in ascending x order — mirrors audit-key-lock.mjs's own
// "resolve every remaining encounter on the path first" idiom (its own CR-01 fix,
// same root cause: driveToXPlanned stops the instant ANY challenge opens, so a
// mid-route door/enemy must be cleared before continuing toward a further target).
async function resolveEncountersBetween(page, geometry, fromX, toX) {
  const encounters = deriveEncounters(geometry)
    .filter((e) => e.tag !== "secret-alcove" && e.x > fromX && e.x < toX)
    .sort((a, b) => a.x - b.x);
  for (const encounter of encounters) {
    const { triggered } = await driveToXPlanned(page, encounter.x, geometry);
    if (triggered) {
      // Resolve by cycling answer keys 1-4 until the shared challenge count drops
      // (mirrors resolveIfBoxed's own CR-01-derived "decrease from baseline" logic,
      // inlined here since this helper only needs the resolve, not its return shape).
      const baseline = await page.evaluate(() => get("challenge").length);
      for (const k of ["1", "2", "3", "4"]) {
        await page.keyboard.press(k);
        await page.waitForTimeout(200);
        const left = await page.evaluate(() => get("challenge").length);
        if (left < baseline) break;
      }
      await page.waitForTimeout(400); // settle re-check, same convention as resolveIfBoxed
    }
  }
}

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

    // Title -> select (the normal boot path). From here on, every level entry uses
    // go("game", { levelId }) directly via page.evaluate() — the exact same Kaplay
    // global browser-boot.mjs already calls (its own go("title") round-trip check) —
    // so this script needs no knowledge of any level's select-grid tile position.
    await page.keyboard.press("Space");
    await page.waitForTimeout(800);

    for (const levelId of targetLevels) {
      const level = getLevel(levelId);
      const geometry = level.geometry;
      const key = geometry.keys[0];

      // --- PATH B (fresh scene, no key detour): the end math challenge REQUIRED ---
      await page.evaluate((id) => go("game", { levelId: id }), levelId);
      await page.waitForTimeout(1500); // let the game scene build the level

      const pathBKeyCount = await page.evaluate(() => get("key").length);
      if (pathBKeyCount === 0) {
        results.push({ level: levelId, path: "B", error: `entered with 0 live key entities — expected 1` });
        failed = true;
        continue;
      }

      // Resolve every door/enemy strictly before the goal, then drive straight to
      // the goal WITHOUT ever detouring to the key's {x,y} — the key stays uncollected.
      await resolveEncountersBetween(page, geometry, -Infinity, geometry.goal.x);
      const { reachedX: reachedXB, triggered: goalTriggeredB } = await driveToXPlanned(
        page,
        geometry.goal.x,
        geometry,
        // A short stallMs (default 15000): on this path the math challenge opening
        // IS the break condition (`triggered`), so this override is a no-op here —
        // kept identical to the Path A call below for consistency.
        { stallMs: 3000 }
      );
      const arrivedB = Math.abs(reachedXB - geometry.goal.x) <= 32;
      const pathBHolds = arrivedB && goalTriggeredB; // the end math challenge opened

      results.push({
        level: levelId,
        path: "B",
        keySkipped: true,
        arrived: arrivedB,
        reachedX: reachedXB,
        challengeOpened: goalTriggeredB,
        holds: pathBHolds,
      });
      if (!pathBHolds) {
        console.error(
          `audit-endgate-key: OFFENDER ${levelId} Path B — arrived=${arrivedB} reachedX=${reachedXB} ` +
            `challengeOpened=${goalTriggeredB} (expected both true: skipping the key must still require the end math).`
        );
        failed = true;
      }

      // --- PATH A (fresh scene, key detour): the level clears FREE, no math ---
      await page.evaluate((id) => go("game", { levelId: id }), levelId);
      await page.waitForTimeout(1500); // let the game scene rebuild fresh (heldKeyIds resets on scene re-entry)

      const pathAKeyCountBefore = await page.evaluate(() => get("key").length);
      if (pathAKeyCountBefore === 0) {
        results.push({ level: levelId, path: "A", error: `entered with 0 live key entities — expected 1` });
        failed = true;
        continue;
      }

      // Resolve everything strictly BEFORE the key (e.g. level-02's door@940 and
      // enemy@3600, both physical blockers a drive toward key.x would otherwise
      // stall against — mirrors audit-key-lock.mjs's identical "resolve in-between
      // encounters" step for its key->lock drive).
      await resolveEncountersBetween(page, geometry, -Infinity, key.x);

      // Drive to the key itself. targetY disambiguates the elevated high-route
      // platform node from an overlapping floor node below it (Phase 30 MECH-04
      // mechanism; mirrors audit-key-lock.mjs line 215's identical call shape).
      await driveToXPlanned(page, key.x, geometry, { targetY: key.y });
      const keyGone = (await page.evaluate(() => get("key").length)) === 0;

      // Resolve anything strictly between the key and the goal (none exist in
      // level-02's authored shape, but this stays general for future math-skip
      // levels whose key sits before a later door/enemy).
      await resolveEncountersBetween(page, geometry, key.x, geometry.goal.x);

      // Baseline sanity: every encounter up to the goal has now been resolved, so
      // no challenge should still be open going into the final drive.
      const preGoalChallengeCount = await page.evaluate(() => get("challenge").length);

      // On the key path, onReachGoal sets `player.paused = true` the instant it
      // fires (game.js: player.vel/player.paused, BEFORE the heldKeyIds branch),
      // freezing the player's position dead. driveToXPlanned's "arrived" progress
      // metric (closing distance to targetX) then stops advancing entirely — a
      // frozen position with the default 15000ms stallMs wastes a full 15s waiting
      // out a stall that is actually a SUCCESS signal, not a failure. A short
      // stallMs makes the call return promptly once the freeze is detected as "no
      // progress", without changing Path B's behavior above (which always exits
      // via `triggered`, never the stall guard).
      const { reachedX: reachedXA, triggered: goalTriggeredA } = await driveToXPlanned(
        page,
        geometry.goal.x,
        geometry,
        { stallMs: 3000 }
      );
      const arrivedA = Math.abs(reachedXA - geometry.goal.x) <= 32;

      // The clear marker: BOTH the math path (mathGate.js onSuccess) and the key
      // path (game.js's heldKeyIds banner, byte-mirrored from mathGate.js) tag
      // their "LEVEL CLEAR" banner "gate-cleared" (src/scenes/game.js onReachGoal).
      // But CONFIG.PROGRESS.FX.BURST_MS is only 400ms, and this audit's own settle
      // wait plus driveToXPlanned's stall detection above already cost well over
      // that — by the time control returns here the scene has near-certainly
      // ALREADY transitioned to "select" (clearLevel()'s tween.onEnd -> go("select")),
      // which tears down every "gate-cleared" tagged object along with the rest of
      // the game scene. So the marker check accepts EITHER signal: the banner
      // caught in the act (a race that can still win on a slow machine) OR the
      // select scene's own tagged entities now being live — both are proof the
      // shared clearLevel() path actually ran to completion (markCleared +
      // writeSave + the transition), which is the thing this path exists to prove.
      await page.waitForTimeout(300);
      const bannerCaught = (await page.evaluate(() => get("gate-cleared").length)) > 0;
      const onSelectScene = (await page.evaluate(() => get("select").length)) > 0;
      const clearMarkerPresent = bannerCaught || onSelectScene;

      const pathAHolds = keyGone && preGoalChallengeCount === 0 && !goalTriggeredA && clearMarkerPresent;

      results.push({
        level: levelId,
        path: "A",
        keyCollected: keyGone,
        arrived: arrivedA,
        reachedX: reachedXA,
        challengeOpened: goalTriggeredA,
        clearMarkerPresent,
        bannerCaught,
        onSelectScene,
        holds: pathAHolds,
      });
      if (!pathAHolds) {
        console.error(
          `audit-endgate-key: OFFENDER ${levelId} Path A — keyCollected=${keyGone} arrived=${arrivedA} ` +
            `reachedX=${reachedXA} challengeOpened=${goalTriggeredA} clearMarker=${clearMarkerPresent} ` +
            "(expected key collected, NO challenge opened, and the clear marker present — either the banner or a completed transition to select)."
        );
        failed = true;
      }
    }
  } finally {
    await context.close();
  }
} catch (e) {
  console.error("audit-endgate-key failed:", e.message);
  failed = true;
} finally {
  await browser.close();
  server.close();
}

console.log(JSON.stringify(results, null, 2));

if (failed) {
  console.log("AUDIT-ENDGATE-KEY: FAIL");
  process.exit(1);
}

console.log(
  `AUDIT-ENDGATE-KEY: PASS — ${targetLevels.length} math-skip level(s) proved both ways ` +
    "(key collected -> free clear, no key -> math required)."
);
process.exit(0);
