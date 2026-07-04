# Phase 21: Real Verification Pass — Pattern Map

**Mapped:** 2026-07-04
**Files analyzed:** 6 (2 new, 4 modified/corrected)
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/audit-phase21-mechanics.mjs` (new) | test/tooling script | event-driven (Playwright keyboard-drive + screenshot) | `scripts/screenshot-phase20.mjs` | exact |
| `scripts/browser-boot.mjs` (harden, existing) | test/tooling script | event-driven (Playwright boot smoke) | itself (existing file, extend in place) | exact (self) |
| `src/mechanics/enemy.js` (fix) | mechanic/controller (collision handler) | request-response (collision -> challenge -> callback) | `src/mechanics/door.js` | exact |
| `src/ui/challenge.js` (possible additive `label` param; defensive `color()`) | service/component (shared UI overlay) | request-response | itself (existing file, extend in place) | exact (self) |
| `v4.0-MILESTONE-AUDIT.md` (doc correction) | config/doc | transform (text edit) | itself (existing file) | exact (self) |
| `.planning/milestones/v4.0-REQUIREMENTS.md` (annotate, do not rewrite) | config/doc | transform (text edit) | itself (existing file) | exact (self) |

## Pattern Assignments

### `scripts/audit-phase21-mechanics.mjs` (new, tooling/e2e)

**Analog:** `scripts/screenshot-phase20.mjs` (115 lines), reusing `scripts/browser-boot.mjs`'s save-seed trick.

**Imports pattern** (screenshot-phase20.mjs lines 1-11):
```js
import { chromium } from "/home/magnus/.nvm/versions/node/v22.22.2/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join } from "path";
```
Use the exact same absolute Playwright path — all 3 existing scripts import from this identical path; do not add a new dependency or relative import.

**Port allocation convention:** 8765 (browser-boot.mjs), 8766 (screenshot-phase18.mjs), 8767 (screenshot-phase20.mjs) are taken. Use **8768** for the new script (per RESEARCH.md's own recommendation).

**Server/MIME skeleton** (screenshot-phase20.mjs lines 13-52, byte-for-byte reusable):
```js
const ROOT = new URL("../", import.meta.url);
const PORT = 8768; // new — 8765/6/7 already taken
const MIME = { ".html": "text/html", ".js": "application/javascript", ".mjs": "application/javascript",
  ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml", ".json": "application/json" };

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let path = decodeURIComponent(url.pathname);
  if (path === "/") path = "/index.html";
  const filePath = join(ROOT.pathname, path);
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
await new Promise((res) => server.listen(PORT, res));
```

**Save-seed pattern** (browser-boot.mjs lines 28-40, screenshot-phase20.mjs lines 28-36):
```js
const SAVE_KEY = "mathlab_platformer_v2";
const SAVE_BLOB = {
  version: 2, xp: 0, level: 1, accuracy: {}, history: {},
  levels: { "level-01": { cleared: true }, "level-02": { cleared: true }, "level-03": { cleared: true } },
};
// ... later, after page.goto:
await page.evaluate(({ key, blob }) => localStorage.setItem(key, JSON.stringify(blob)),
  { key: SAVE_KEY, blob: SAVE_BLOB });
```

**Navigation pattern (title -> select -> level)** (browser-boot.mjs lines 85-100; screenshot-phase20.mjs lines 73-90):
```js
await page.keyboard.press("Space");           // title -> select
await page.waitForTimeout(800);
for (let j = 0; j < i; j++) {                 // move cursor to i-th level tile
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(150);
}
await page.keyboard.press("Enter");           // load selected level
await page.waitForTimeout(1500);              // let game scene build
```

**Real movement (hold, not teleport)** (screenshot-phase20.mjs lines 96-108, the ONLY existing example of a held key in this repo):
```js
await page.keyboard.down("ArrowRight");
await page.waitForTimeout(400);
await page.screenshot({ path: OUT("...") });
await page.waitForTimeout(1600);
await page.screenshot({ path: OUT("...") });
await page.keyboard.up("ArrowRight");
```
Adapt timing using the mechanic-position map from RESEARCH.md (RUN_SPEED 240px/s ⇒ ~1250ms per 300px). Use `page.keyboard.press("space")` (tap, not hold) for gap/spike jumps per the RESEARCH pattern.

**Answer-key resolution (new — no existing analog, use RESEARCH.md's own recommended approach):** brute-force cycle keys `"1".."4"` with a short `waitForTimeout` and re-check via `page.evaluate(() => get("challenge").length > 0)` (whether the challenge tag still has live objects) between presses — safe because `challenge.js`'s GATE-04 forgiving design (verified in `src/ui/challenge.js` lines 190-208, `choose()`) never punishes a wrong pick.

**Output path pattern** (screenshot-phase20.mjs lines 60-61, adapt directory to Phase 21):
```js
const OUT = (name) =>
  new URL(`../.planning/phases/21-real-verification-pass-mechanics-sign-off-integrity-perform-/${name}`, import.meta.url).pathname;
```

**Cleanup pattern (try/finally)** (screenshot-phase20.mjs lines 65, 111-115; browser-boot.mjs lines 75-130):
```js
try {
  // ... drive + screenshot
} finally {
  await context.close();
  await browser.close();
  server.close();
}
```

**Findings recording format (collect.js-style, per STATE.md precedent — not a code file, but the OUTPUT format the script's console/report should mirror):** numbered list, each entry: what broke, why (root cause), the fix, and the file touched. Mirror `src/mechanics/collect.js`'s own inline comments (lines 43-46, 56-59, 74-76) as the tone/rigor model — each documents a REAL diagnosed defect with root cause and fix location, not a vague note.

---

### `scripts/browser-boot.mjs` (harden in place, existing file)

**Analog:** itself — this is a targeted, minimal-diff edit, not a rewrite.

**Current gap (lines 89-107):** loops through all 4 levels but only presses `ArrowRight`/`Enter`/`Escape` to navigate the LEVEL SELECT cursor — zero in-level player movement, zero mechanic interaction. `page.waitForTimeout(1500)` after `Enter` is the entire "verification" of a loaded level today.

**Minimal hardening insertion point:** immediately after the existing `await page.keyboard.press("Enter"); await page.waitForTimeout(1500);` (line 99-100), for `i === 0` (level-01, which contains one of every mechanic type per RESEARCH.md's position map) insert:
```js
// VERIFY-03: prove the level is actually playable, not just loaded.
await page.keyboard.down("ArrowRight");
await page.waitForTimeout(1250); // ~300px — reach the collect zone at x:300
await page.keyboard.up("ArrowRight");
const collectOpened = await page.evaluate(() => get("challenge").length > 0);
if (!collectOpened) errors.push({ type: "mechanic", message: "collect zone at x:300 never triggered a challenge" });
// resolve it (renderChoices:false — no boxes/keys apply to collect.js; walk into a pickup instead,
// OR for a boxed mechanic like the math gate at x:600, cycle keys 1-4):
// ... continue holding ArrowRight to x:600, then:
for (const k of ["1", "2", "3", "4"]) {
  await page.keyboard.press(k);
  await page.waitForTimeout(200);
  if ((await page.evaluate(() => get("challenge").length)) === 0) break;
}
```
Keep the existing `errors.length === 0` pass-gate assertion (line 116) unchanged — this ADDS assertions, does not replace the console-error check.

**Error-collection pattern already established, reuse as-is** (lines 64-73):
```js
const errors = [];
page.on("pageerror", (err) => errors.push({ type: "pageerror", message: err.message, stack: err.stack?.split("\n")?.[0] }));
page.on("console", (msg) => { if (msg.type() === "error") errors.push({ type: "console.error", text: msg.text() }); });
page.on("response", (resp) => { if (resp.status() >= 400) errors.push({ type: "http", status: resp.status(), url: resp.url() }); });
```

---

### `src/mechanics/enemy.js` (fix — confirmed bug, VERIFY-02)

**Analog:** `src/mechanics/door.js` (69 lines) — the closest sibling mechanic wired the same way onto `challenge.js`.

**Current buggy call** (enemy.js lines 41-55):
```js
openChallenge({
  brain,
  prompt: "Answer to defeat the guard:",   // REPLACES q.a × q.b entirely — the bug
  onSuccess() {
    defeated.add(enemyObj);
    fx.clearBurst();
    destroy(enemyObj);
    if (enemyObj.glyphObj) destroy(enemyObj.glyphObj);
    player.paused = false;
  },
});
```

**Door.js's correct sibling pattern (never passes `prompt`, so the default `${q.a} × ${q.b}` shows)** (door.js lines 49-67):
```js
openChallenge({
  brain,
  onSuccess() {
    opened.add(doorObj);
    fx.clearBurst();
    destroy(doorObj);
    if (doorObj.panelObj) destroy(doorObj.panelObj);
    if (doorObj.glyphObj) destroy(doorObj.glyphObj);
    player.paused = false;
  },
});
```

**Proposed fix (per RESEARCH.md Finding 2 — additive `label` param on `challenge.js`, then use it here):**
```js
// enemy.js — proposed
openChallenge({ brain, label: "Answer to defeat the guard:", onSuccess() { /* unchanged */ } });
```
```js
// challenge.js line 78 — proposed
const display = prompt ?? (label ? `${label} ${q.a} × ${q.b}` : `${q.a} × ${q.b}`);
```
Do NOT commit this fix until the new audit script (VERIFY-01) interactively confirms the symptom reproduces first, per CONTEXT Area 1 / RESEARCH Pitfall 1.

**Collision-freeze/latch pattern to preserve exactly (shared by door.js, enemy.js, gates.js):**
```js
const defeated = new Set();               // closure-local fire-once latch, never module-level
player.onCollide("enemy", (enemyObj) => {
  if (defeated.has(enemyObj)) return;
  player.vel = vec2(0);
  player.paused = true;
  openChallenge({ /* ... */ });
});
```

---

### `src/ui/challenge.js` (additive `label` param + defensive `color()`, VERIFY-02)

**Analog:** itself — additive, backward-compatible signature change; also mirror the established `text()+color()` convention used everywhere else in the codebase.

**Current signature** (challenge.js line 70, 78):
```js
export function openChallenge({ brain, onSuccess, prompt, question, renderChoices = true } = {}) {
  // ...
  const display = prompt ?? `${q.a} × ${q.b}`;
```

**Established `text()+color()` convention this file should adopt (defensive-consistency, per Finding 1 — NOT the root-cause fix)** — used everywhere else in the codebase, e.g. `src/mechanics/collect.js` lines 77-83:
```js
slotObj.labelObj = add([
  text(String(slotObj.value), { size: CONFIG.COLLECT.PICKUP_SIZE }),
  anchor("center"),
  pos(...),
  color(...CONFIG.COLLECT.PICKUP_FG),   // <-- explicit color(), the pattern to copy
  "answer-pickup-label",
]);
```
Apply the same explicit `color()` to challenge.js's two currently-uncolored `text()` calls (question prompt ~line 121-128, answer-box label ~line 162-169) — add `color(...LABEL_FG)` matching `title.js`/`hud.js`/`select.js`'s established `LABEL_FG ≈ [0xe8,0xe8,0xe8]` convention. This is cleanup, not the confirmed root-cause fix (Finding 1 falsifies the invisibility hypothesis).

**Anti-leak / teardown pattern already correct, preserve exactly if signature changes** (challenge.js lines 219-227):
```js
function close() {
  keyCtrls.forEach((c) => c.cancel());
  destroyAll("challenge");
}
```

---

### `v4.0-MILESTONE-AUDIT.md` (VERIFY-04 correction — annotate, don't rewrite)

**Analog:** itself — targeted text edit to two locations.

**Exact text to correct** (line 43, Phase Verification Status table, Phase 14 row):
```
| 14 | Multi-Scene Shell | passed | NAV-01, NAV-02, NAV-03, NAV-04 | Human browser-boot NAV-01..04 sign-off recorded; two runtime defects found and fixed during sign-off. |
```
Replace the "sign-off recorded" framing with an honest annotation (per CONTEXT Area 4: annotate, do not retroactively rewrite) — keep the true "two defects found and fixed" fact, remove/qualify the false "human browser-boot sign-off recorded" claim, citing `14-VERIFICATION.md`'s own `human_needed` status and the PENDING `checkpoint:human-verify`.

**Exact text to correct** (line 61, Requirements Coverage table, NAV-04 row):
```
| NAV-04 | 14 | SATISFIED | missing | `[x]` Complete | satisfied |
```
Annotate as partial/unverified-checkpoint rather than flip to "In Progress" — mirror the SAFE-05 row's own precedent already in this same table (line 75) which handles a similar "protocol complete, live step deferred" case:
```
| SAFE-05 | 19 | SATISFIED (protocol) | listed (18-04) | `[ ]` Pending kid-UAT | partial (live sign-off deferred) |
```
Use this exact row-shape as the template for the NAV-04 correction (same document, same table, same annotation convention already established one page below it).

**Phase 15 row (line 44):** check `15-VERIFICATION.md` for the same gap per CONTEXT Area 4's conditional — RESEARCH.md's Open Question 1 finds this is a smaller citation error (cites STATE.md instead of `15-04-SUMMARY.md`), not the same "never executed" gap as Phase 14 — optional/secondary correction only.

---

## Shared Patterns

### Playwright script skeleton (server + MIME + chromium launch + try/finally)
**Source:** `scripts/screenshot-phase20.mjs` (full file, 115 lines), `scripts/browser-boot.mjs` (full file, 132 lines)
**Apply to:** `scripts/audit-phase21-mechanics.mjs` (new)
```js
const server = createServer(/* MIME-lookup handler, see full excerpt above */);
await new Promise((res) => server.listen(PORT, res));
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
const page = await context.newPage();
try { /* drive + screenshot */ } finally { await context.close(); await browser.close(); server.close(); }
```

### Collision-mechanic wiring (freeze -> openChallenge -> onSuccess -> unfreeze)
**Source:** `src/mechanics/door.js` (lines 37-69), `src/mechanics/enemy.js` (lines 29-57), `src/mechanics/gates.js` (57 lines, same shape)
**Apply to:** any future edits to enemy.js / gates.js / door.js
```js
const latch = new Set(); // closure-local fire-once, keyed by touched object
player.onCollide("<tag>", (obj) => {
  if (latch.has(obj)) return;
  player.vel = vec2(0);
  player.paused = true;
  openChallenge({ brain, onSuccess() { latch.add(obj); /* destroy colliders */ player.paused = false; } });
});
```

### One-way dependency discipline (GATE-06)
**Source:** header comments in `door.js`, `enemy.js`, `collect.js` (all identical wording)
**Apply to:** any new mechanic file — mechanics import `../ui/challenge.js` directly, never `../ui/mathGate.js`.

### Engine-global discipline (a727c13)
**Source:** header comments across all mechanics files and `challenge.js` lines 13-18
**Apply to:** any new/edited file using Kaplay globals (`vec2`, `destroy`, `get`, `add`, `text`, etc.) — reference only inside exported function bodies, never at module top-level, since these globals don't exist until `kaplay({ global: true })` runs.

## No Analog Found

None — all 6 files/edits have a strong existing analog in this codebase (either a sibling file of the same role, or the file itself for in-place hardening/correction).

## Metadata

**Analog search scope:** `scripts/`, `src/ui/`, `src/mechanics/`, `.planning/milestones/`
**Files scanned:** `scripts/browser-boot.mjs`, `scripts/screenshot-phase20.mjs`, `src/ui/challenge.js`, `src/ui/mathGate.js` (referenced, not excerpted — thin wrapper, no independent pattern), `src/mechanics/{door,gates,enemy,collect}.js`, `.planning/milestones/v4.0-MILESTONE-AUDIT.md`
**Pattern extraction date:** 2026-07-04
