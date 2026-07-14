#!/usr/bin/env node
// scripts/audit-coins.mjs — Phase 34 (LVL-01) IN-ENGINE COIN WITNESS REPLAY GATE.
//
// WHAT THIS GATE PROVES, EXACTLY:
//
//   POSITIVELY: every coin that scripts/lib/reachability.mjs's static model calls
//   REACHABLE is actually COLLECTED by a real, driven player in the real running
//   engine. For each such coin the model emits a WITNESS
//   ({launchNodeId, launchY, takeoffX, dir, family, t}); this script places the real
//   player entity on that witness's launch surface, drives the REAL input surface
//   (ArrowLeft / ArrowRight / Space) and waits for the REAL 32x32 coin area() to fire
//   the REAL `player.onCollide("coin", ...)` handler in src/scenes/game.js. That
//   handler is the ONLY place in the entire codebase that calls destroy(c) on a coin,
//   so "the coin is gone from get('coin')" IS the in-engine collection signal — it
//   cannot be produced any other way.
//
//   IT PROVES NOTHING ABOUT COINS THE MODEL HARD-FAILS. Absence of a successful drive
//   is not proof of unreachability (this script does not search the space of all
//   possible player inputs — it replays ONE witness). Coins with `witness === null`
//   are SKIPPED and reported as model: "HARD-FAIL". Proving unreachability stays the
//   static model's job; this gate exists to FALSIFY the model's positive claims.
//
// WHY IT EXISTS: the static model is deliberately OBSTRUCTION-BLIND (limitation 1 in
// reachability.mjs's header) — it does not know a platform underside can bonk a rising
// arc (docs/LEVEL-DESIGN.md section 3 records ceiling-bonk as a real, SHIPPED bug
// class). That blindness is a licence to OVER-credit. This is the thing that catches
// it. A coin the model PASSes but the engine refuses to collect is a RED whose only
// sanctioned fixes are: TIGHTEN THE MODEL, or MOVE THE COIN. Never loosen the gate.
//
// This is a MANUALLY-INVOKED gate (like calibrate-jump-envelope.mjs and
// audit-phase21-mechanics.mjs) — it launches a browser, so it is NEVER wired into
// check-gate.sh. Unlike audit-phase21-mechanics.mjs (a diagnostic that always exits 0),
// this IS a pass/fail gate: exit 1 if any witnessed coin was not collected in-engine.
//
// Run: node scripts/audit-coins.mjs
//
// Serves the repo root on a local loopback-only port (8772 — 8765/8766/8767/8768/8769/
// 8770/8771 are already used by browser-boot.mjs / screenshot-phase18.mjs /
// screenshot-phase20.mjs / audit-phase21-mechanics.mjs / calibrate-jump-envelope.mjs /
// screenshot-phase26.mjs / screenshot-phase33-terrain.mjs). Copies browser-boot.mjs's
// resolvePlaywright() and local static server VERBATIM, including its CR-02
// path-traversal guard and loopback-only bind, and audit-phase21-mechanics.mjs's
// SAVE_KEY/SAVE_BLOB seeding + title->select->level navigation + per-level context
// recycling. The Playwright duplication in this repo is DELIBERATE (CLAUDE.md): do not
// extract a shared module, do not simplify either guard — fix bugs by hand in each copy.

import { createRequire } from "module";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { existsSync, readdirSync } from "fs";
import { extname, join, resolve, sep } from "path";
import { getLevel, LEVEL_ORDER } from "../src/levels/index.js";
import { buildNodes, planCoinWitnesses, PLAYER_H, PLAYER_W } from "./lib/reachability.mjs";

// --- Playwright resolution (copied verbatim from scripts/browser-boot.mjs) ---
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

// --- Local static server (copied verbatim from scripts/browser-boot.mjs) ---
const ROOT = new URL("../", import.meta.url);
const ROOT_ABS = resolve(ROOT.pathname);
const PORT = 8772; // 8765..8771 already used by other scripts (see header comment)

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

// --- Replay tuning (named — no magic numbers in logic, CLAUDE.md) ---
const SETTLE_MS = 300; // repositionAndSettle's dt()-contamination guard (RESEARCH Pitfall 2)
const SAMPLE_MS = 16; // ~one frame at 60fps — the fine cadence, never a coarse traversal poll
const DRIVE_MS = { walk: 900, fall: 1300, jump: 1300 };
// TAKEOFF SWEEP. The static model budgets horizontal travel at the SHAVED envelope
// speed (218.043 px/s) while the engine actually runs at CONFIG.RUN_SPEED (240 px/s),
// so the real arc's pass-through point sits slightly further along than the model's.
// Retrying the SAME witness across a few takeoff offsets absorbs exactly that
// difference. It invents no new reachability claim: every attempt still launches from
// the witness's OWN spawn-reachable launch surface, using only real key input. This
// list is CAPPED at 5 — widening it to rescue a failing coin is forbidden (34-02 plan,
// threat T-34-05): a coin that needs a sixth offset is a coin the model over-credited.
const TAKEOFF_OFFSETS = [0, 12, -12, 24, -24];
const COIN_MATCH_EPS = 1; // px — coin entity pos vs descriptor {x,y}

const browser = await chromium.launch({ headless: true });

const results = [];

// Per-level browser-context recycling (audit-phase21-mechanics.mjs's convention):
// a fresh context/page per level, one long-lived browser process.
async function newLevelPage() {
  const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await context.newPage();

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

  return { context, page };
}

/**
 * ISOLATE THE ONE QUESTION THIS GATE EXISTS TO ANSWER.
 *
 * Destroys exactly five tag families, ONCE, right after level entry:
 *   "door", "math-gate", "enemy"  — the TALL INVISIBLE BLOCKERS (build.js emits an
 *       apex-height solid collider per barrier). reachability.mjs's own header
 *       establishes why these are never reachability obstacles: this game's math
 *       mechanics have NO LOCKOUT STATE (a wrong answer just re-asks — challenge.js
 *       closes only on success), so every barrier is always eventually passable once
 *       the player reaches its floor run. They cannot make a coin permanently
 *       unreachable; they can only derail a 1.3s scripted burst.
 *   "spike"  — jumpable, and a spike hit costs only a free checkpoint respawn. There
 *       is no game-over anywhere in this game (src/scenes/game.js's reset()). A spike
 *       cannot make a coin permanently unreachable either; it can only teleport the
 *       driven player mid-burst.
 *   "goal"   — a level-END TRIGGER, not an obstacle. Touching it opens the math gate
 *       and freezes the player (player.paused = true), which would end the run.
 *
 * NOTHING removed here can make a coin PERMANENTLY unreachable, and the set is CLOSED:
 * widening it to rescue a failing coin is forbidden (34-02 plan, threat T-34-04). The
 * mechanics themselves are already exercised, end to end, by
 * scripts/audit-phase21-mechanics.mjs — re-testing them here would only obscure the
 * single question at issue: does the coin's geometric witness actually collect the
 * coin under real engine physics?
 */
async function clearNonCoinObstacles(page) {
  return await page.evaluate(() => {
    const TAGS = ["door", "math-gate", "enemy", "spike", "goal"];
    let removed = 0;
    for (const tag of TAGS) {
      for (const e of get(tag)) {
        destroy(e);
        removed += 1;
      }
    }
    return removed;
  });
}

/** Is the coin at {x, y} still present in the live scene? */
async function coinPresent(page, coin) {
  return await page.evaluate(
    ({ x, y, eps }) =>
      get("coin").some((c) => Math.abs(c.pos.x - x) <= eps && Math.abs(c.pos.y - y) <= eps),
    { x: coin.x, y: coin.y, eps: COIN_MATCH_EPS }
  );
}

/**
 * Place the real player entity on the witness's launch surface and let it settle —
 * calibrate-jump-envelope.mjs's repositionAndSettle idiom verbatim (teleport via
 * get("player")[0], zero velocity, 300ms settle to avoid first-frame dt()
 * contamination, RESEARCH Pitfall 2). launchY is the SURFACE y; the player's top-left
 * sits PLAYER_H above it — exactly the `surfaceTop = n.y - PLAYER_H` the model used.
 */
async function repositionAndSettle(page, x, launchY) {
  await page.evaluate(
    ({ px, py }) => {
      const p = get("player")[0];
      p.pos.x = px;
      p.pos.y = py;
      p.vel = vec2(0);
    },
    { px: x, py: launchY - PLAYER_H }
  );
  await page.waitForTimeout(SETTLE_MS);
}

/**
 * ONE replay attempt: drive the witness from `takeoffX` and report whether the REAL
 * onCollide("coin") handler destroyed this specific coin.
 *
 * Keys are HELD, never tapped — releasing Space while rising triggers CONFIG.JUMP_CUT
 * (variable-height jump) and truncates the arc, which is exactly the mistake
 * calibrate-jump-envelope.mjs documents. Always released in a finally.
 */
async function attemptWitness(page, coin, witness, takeoffX) {
  await repositionAndSettle(page, takeoffX, witness.launchY);

  const dirKey = witness.dir > 0 ? "ArrowRight" : "ArrowLeft";
  const keys = witness.family === "jump" ? [dirKey, "Space"] : [dirKey];
  const budgetMs = DRIVE_MS[witness.family];

  for (const k of keys) await page.keyboard.down(k);
  try {
    for (let elapsed = 0; elapsed <= budgetMs; elapsed += SAMPLE_MS) {
      if (!(await coinPresent(page, coin))) return true; // the real handler fired
      await page.waitForTimeout(SAMPLE_MS);
    }
  } finally {
    for (const k of keys) await page.keyboard.up(k);
  }
  // one last look after the keys are released (the final frame may still land it)
  return !(await coinPresent(page, coin));
}

let failed = false;

try {
  for (let i = 0; i < LEVEL_ORDER.length; i++) {
    const { context, page } = await newLevelPage();

    try {
      // Move the select cursor to the i-th tile (first tile already focused after a
      // fresh title -> select entry). The select screen is a fixed 4-column grid (2x4):
      // compute row/col and press ArrowDown row times then ArrowRight col times, rather
      // than assuming a single flat row of tiles (25-RESEARCH.md Pitfall 1).
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

      const level = getLevel(LEVEL_ORDER[i]);
      const removed = await clearNonCoinObstacles(page);

      const nodes = buildNodes(level.geometry);
      const plan = planCoinWitnesses(level.geometry);

      for (const { index, coin, witness } of plan) {
        if (witness === null) {
          // The model calls this coin unreachable. This gate does NOT attempt to prove
          // a negative — skipped, reported, and left to the static model's HARD-FAIL.
          results.push({
            level: level.id,
            coin: index,
            x: coin.x,
            y: coin.y,
            model: "HARD-FAIL",
            family: null,
            dir: null,
            collected: null,
            via: "skipped",
            offsetUsed: null,
          });
          continue;
        }

        const base = {
          level: level.id,
          coin: index,
          x: coin.x,
          y: coin.y,
          model: "PASS",
          family: witness.family,
          dir: witness.dir,
        };

        // Already gone: an earlier coin's drive swept through it. Still a genuine
        // in-engine collection by a real driven player — which is exactly the claim
        // under test — so it counts, and is labelled honestly as incidental.
        if (!(await coinPresent(page, coin))) {
          results.push({ ...base, collected: true, via: "incidental", offsetUsed: null });
          continue;
        }

        const node = nodes.find((n) => n.id === witness.launchNodeId);
        const x0min = node ? node.xStart : witness.takeoffX;
        const x0max = node ? Math.max(node.xStart, node.xEnd - PLAYER_W) : witness.takeoffX;

        let collected = false;
        let offsetUsed = null;
        for (const off of TAKEOFF_OFFSETS) {
          // Clamp to the launch node — an offset may never move the takeoff off the
          // witness's own spawn-reachable surface.
          const takeoffX = Math.min(x0max, Math.max(x0min, witness.takeoffX + off));
          if (await attemptWitness(page, coin, witness, takeoffX)) {
            collected = true;
            offsetUsed = off;
            break;
          }
        }

        if (!collected) failed = true;
        results.push({ ...base, collected, via: collected ? "driven" : "none", offsetUsed });
      }

      const lvlRows = results.filter((r) => r.level === level.id);
      console.log(
        `[${level.id}] coins=${lvlRows.length} obstacles-cleared=${removed} ` +
          `driven=${lvlRows.filter((r) => r.via === "driven").length} ` +
          `incidental=${lvlRows.filter((r) => r.via === "incidental").length} ` +
          `skipped=${lvlRows.filter((r) => r.via === "skipped").length} ` +
          `NOT-COLLECTED=${lvlRows.filter((r) => r.via === "none").length}`
      );
    } finally {
      await context.close();
    }
  }
} catch (e) {
  console.error("audit-coins failed:", e.message);
  failed = true;
} finally {
  await browser.close();
  server.close();
}

console.log(JSON.stringify(results, null, 2));

const witnessed = results.filter((r) => r.model === "PASS");
const collected = witnessed.filter((r) => r.collected);
const incidental = witnessed.filter((r) => r.via === "incidental");
const skipped = results.filter((r) => r.model === "HARD-FAIL");
const offenders = witnessed.filter((r) => !r.collected);

console.log("");
console.log(
  `coins=${results.length} witnessed=${witnessed.length} collected=${collected.length} ` +
    `(incidental=${incidental.length}) model-HARD-FAIL-skipped=${skipped.length}`
);

if (offenders.length > 0 || failed) {
  for (const o of offenders) {
    console.log(
      `  OFFENDER ${o.level} coins[${o.coin}] x:${o.x} y:${o.y} — model PASS ` +
        `(family=${o.family} dir=${o.dir}) but the real engine did NOT collect it.`
    );
  }
  console.log(
    "The model OVER-CREDITED these coins (obstruction blindness — see LEVEL-DESIGN.md " +
      "section 3). Fix by TIGHTENING scripts/lib/reachability.mjs or MOVING the coin. " +
      "Never by loosening this gate."
  );
  console.log("AUDIT-COINS: FAIL");
  process.exit(1);
}

console.log("AUDIT-COINS: ALL WITNESSED COINS COLLECTED");
process.exit(0);
