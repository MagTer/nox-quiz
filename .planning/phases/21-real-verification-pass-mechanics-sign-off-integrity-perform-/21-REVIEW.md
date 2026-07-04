---
phase: 21-real-verification-pass-mechanics-sign-off-integrity-perform-
reviewed: 2026-07-04T14:38:14Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - scripts/audit-phase21-mechanics.mjs
  - scripts/browser-boot.mjs
  - src/levels/build.js
  - src/mechanics/enemy.js
  - src/ui/challenge.js
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-07-04T14:38:14Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Narrative Findings (AI reviewer)

### Summary

Reviewed the two headless-Playwright verification scripts (`scripts/audit-phase21-mechanics.mjs`,
`scripts/browser-boot.mjs`) and the three gameplay source modules they exercise
(`src/levels/build.js`, `src/mechanics/enemy.js`, `src/ui/challenge.js`).

The most significant finding is a real correctness bug in the shared challenge overlay
(`src/ui/challenge.js`): every `openChallenge()` instance tears itself down with
`destroyAll("challenge")`, a single global tag shared by ALL open challenge instances. The
codebase's own design (confirmed in three places across the reviewed files) deliberately
leaves a collect-zone challenge open while the player keeps moving toward the next mechanic.
If that next mechanic (door/math-gate/enemy) opens its own challenge and the player resolves
it, that instance's `close()` destroys every "challenge"-tagged object in the scene —
including the still-pending, unrelated collect-zone overlay. This is a directly reachable
bug given the documented level-01 layout (one of every mechanic type, visited in x-order).

The two verification scripts also both run a local static file server with unsanitized path
handling (directory traversal) and no explicit bind address (defaults to all interfaces),
and both hardcode an absolute, machine-specific path to a Playwright install for their only
import.

### Critical Issues

### CR-01: Shared "challenge" tag lets one resolved challenge destroy a different, still-open challenge

**File:** `src/ui/challenge.js:272-275` (also see corroborating design comments at `src/ui/challenge.js:89-91,118-125` and `scripts/audit-phase21-mechanics.mjs:101-106`)
**Issue:**
Every call to `openChallenge()` creates its overlay objects tagged only `"challenge"`
(the root marker, dim layer, panel, text, boxes — see lines 105, 108-116, 127-136, 147-174,
194-206) and tears down with the tag-wide bulk remover:

```js
function close() {
  keyCtrls.forEach((c) => c.cancel());
  destroyAll("challenge"); // tag-based bulk removal; destroy() only accepts a GameObj
}
```

There is no per-instance tag/id, so `destroyAll("challenge")` removes objects belonging to
*every* currently-open challenge, not just the one being closed.

The codebase's own comments confirm concurrent challenges are an expected, designed-for
scenario: `collect.js`'s zone challenge is opened with `renderChoices:false` and is
*deliberately* left open while the player keeps moving (`scripts/audit-phase21-mechanics.mjs:101-106`:
"a prior encounter's collect-zone challenge ... is deliberately left OPEN ... movement stays
live, per collect.js's design"). `src/ui/challenge.js:89-91` and `:118-125` further confirm
`collect.js` is a caller of this exact `openChallenge()` function and shares its tag
namespace.

Given level-01 is documented to contain "one of every mechanic type" visited in ascending-x
order (`scripts/audit-phase21-mechanics.mjs` header comment), the reachable sequence is:
1. Player enters the collect-zone → `openChallenge({ renderChoices:false, ... })` opens
   (dim layer + prompt text tagged `"challenge"`), and is left open by design.
2. Player continues moving (movement stays live per the collect design) and reaches the next
   mechanic (e.g. a math-gate or enemy) → a *second* `openChallenge()` call adds its own
   panel/boxes/text, all also tagged `"challenge"`.
3. Player answers the second challenge correctly → `choose()` → `close()` →
   `destroyAll("challenge")` — this wipes out the first (still-unresolved) collect-zone
   overlay's dim layer and prompt text as collateral damage, even though the player never
   answered/collected it.

Result: the collect-zone's dim overlay and question prompt vanish without ever being
resolved through its own logic path, the world silently un-dims, and the player loses the
visual reminder of what they were collecting for — while the collect-zone's own state
(zone/slots, tagged separately in `src/levels/build.js:226-251`) is left dangling with no
overlay to signal it's still active.
**Fix:** Give each `openChallenge()` invocation its own unique cleanup tag, and only destroy
that instance's objects:

```js
export function openChallenge({ brain, onSuccess, prompt, label, question, renderChoices = true } = {}) {
  const instanceTag = `challenge-${Math.random().toString(36).slice(2)}`;
  // tag every add([...]) call below with instanceTag in addition to "challenge"
  // e.g. add([fixed(), z(9999), "challenge", instanceTag]);
  ...
  function close() {
    keyCtrls.forEach((c) => c.cancel());
    destroyAll(instanceTag); // only this instance's objects
  }
  ...
}
```
`"challenge"` can remain as a generic marker tag for any code that needs to detect "is any
challenge open" (e.g. `get("challenge").length`), but teardown must be scoped per-instance.

---

### CR-02: Path traversal + all-interfaces bind in local verification servers

**File:** `scripts/audit-phase21-mechanics.mjs:198-214`, `scripts/browser-boot.mjs:42-58`
**Issue:** Both scripts implement an identical static file server:

```js
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let path = decodeURIComponent(url.pathname);
  if (path === "/") path = "/index.html";
  const filePath = join(ROOT.pathname, path);
  try {
    const data = await readFile(filePath);
    ...
```
`path.join(ROOT, userSuppliedPath)` does not clamp traversal: a request for
`/../../../../etc/passwd` resolves outside `ROOT` (Node's `join` normalizes `..` segments
but does not prevent escaping the base directory), so any file readable by the process user
can be read back over HTTP. Additionally, `server.listen(PORT, res)` passes the resolve
callback as the second positional argument, not a hostname, so Node defaults to binding all
interfaces (`0.0.0.0`) — meaning any device on the LAN can reach this server (and exploit the
traversal) for the duration of the script's run.
**Fix:**
```js
import { resolve } from "path";
const ROOT_ABS = resolve(ROOT.pathname);

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let reqPath = decodeURIComponent(url.pathname);
  if (reqPath === "/") reqPath = "/index.html";
  const filePath = resolve(join(ROOT.pathname, reqPath));
  if (!filePath.startsWith(ROOT_ABS)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  ...
});

await new Promise((res) => server.listen(PORT, "127.0.0.1", res));
```

## Warnings

### WR-01: Dead code with a broken field reference in the audit summary logic

**File:** `scripts/audit-phase21-mechanics.mjs:281-283`
**Issue:**
```js
const allGood = results.every(
  (r) => r.triggered === true && (r.renderChoices === false || r.resolved !== false)
);
```
`allGood` is computed but never read anywhere afterward (the script actually reports via
`allResolvedOrCollect`/`failing` on lines 284-298). Worse, the expression itself is broken:
result objects pushed at lines 264-271 only carry `{ level, tag, x, reachedX, triggered,
resolved }` — there is no `renderChoices` field on them, so `r.renderChoices === false` is
always `false` and this branch of the `||` never fires. This is leftover/incomplete
refactor debris that could mislead a future maintainer into thinking it drives the pass/fail
outcome.
**Fix:** Delete the unused `allGood` computation, or if a second summary metric is actually
wanted, key it off `r.tag === "answer-zone"` (as `allResolvedOrCollect` correctly does) rather
than a non-existent field.

### WR-02: Hardcoded, machine-specific absolute path to Playwright

**File:** `scripts/audit-phase21-mechanics.mjs:18`, `scripts/browser-boot.mjs:6`
**Issue:**
```js
import { chromium } from "/home/magnus/.nvm/versions/node/v22.22.2/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs";
```
This hardcodes one specific user's home directory, one specific `nvm` Node version, and one
specific globally-installed package's location. Both scripts will fail immediately (module
not found) on any other machine, in CI, after an `nvm` version bump, or if the global package
is reinstalled/relocated.
**Fix:** Add `playwright` as a real project dependency and import it normally
(`import { chromium } from "playwright";`), or resolve it dynamically via
`createRequire(import.meta.url).resolve("playwright")` with a documented fallback.

### WR-03: No guard against re-entrant/duplicate challenge opens in `wireEnemy`

**File:** `src/mechanics/enemy.js:34-58`
**Issue:**
```js
player.onCollide("enemy", (enemyObj) => {
  if (defeated.has(enemyObj)) return; // belt-and-braces: ignore an already-defeated enemy
  player.vel = vec2(0);
  player.paused = true;
  openChallenge({ ... });
});
```
The only guard is against an enemy that has *already been defeated* (`defeated` Set). There
is no guard against `onCollide` firing again for the *same, not-yet-defeated* enemy while a
challenge for it is already open (the very existence of a "belt-and-braces" guard for the
post-defeat case implies the author expects this collision handler can re-fire while still
overlapping). Nor is there a guard against a second, different enemy's collision opening a
second concurrent challenge while the first is still unresolved. Given CR-01, concurrent
`openChallenge()` calls are actively harmful (they clobber each other's UI on close), so this
gap compounds that bug.
**Fix:** Track a local busy flag and skip re-entry while a challenge for this wiring is open:
```js
let busy = false;
player.onCollide("enemy", (enemyObj) => {
  if (defeated.has(enemyObj) || busy) return;
  busy = true;
  player.vel = vec2(0);
  player.paused = true;
  openChallenge({
    ...,
    onSuccess() {
      defeated.add(enemyObj);
      busy = false;
      ...
    },
  });
});
```

### WR-04: Door blocker height is an undocumented magic number, not derived from jump physics

**File:** `src/levels/build.js:147`
**Issue:**
```js
const blockerH = 160; // tall enough to cover the player's max jump arc above the door
```
This value is asserted by comment to be tied to the player's maximum jump height, but it is
a bare literal, not derived from `CONFIG` (contrast with `scripts/audit-phase21-mechanics.mjs:135`,
which *does* compute its hold-time from `CONFIG.JUMP_FORCE`/`CONFIG.GRAVITY`). If jump
physics tuning (`CONFIG.JUMP_FORCE`, `CONFIG.GRAVITY`) changes in a future phase, this
constant will silently stop covering the jump arc, allowing the player to jump over a locked
door and bypass the mechanic entirely, with no test or type system to catch the drift.
**Fix:** Compute it from config, or at minimum promote it to a named `CONFIG.DOOR.BLOCKER_H`
constant with a comment cross-referencing the physics constants it must stay larger than:
```js
const blockerH = Math.ceil((CONFIG.JUMP_FORCE ** 2) / (2 * CONFIG.GRAVITY)) + 20; // apex height + margin
```

## Info

### IN-01: Brittle hardcoded timing assumptions in `browser-boot.mjs`'s mechanic checks

**File:** `scripts/browser-boot.mjs:102-135`
**Issue:** The level-01 mechanic checks hold `ArrowRight` for fixed durations derived from a
comment-only calculation ("~236px from spawn at RUN_SPEED 240px/s ~= 983ms; rounded up with
margin") rather than polling the live player position. If `CONFIG.RUN_SPEED` or the level-01
geometry coordinates change, this test will silently start failing (or worse, silently pass
for the wrong reason) without any code-level connection to the values it assumes.
`scripts/audit-phase21-mechanics.mjs`'s `driveToX` (added later in this same phase) already
solves this correctly by polling `player.pos.x` live.
**Fix:** Port `driveToX`'s polling approach into `browser-boot.mjs`, or have it read the same
level geometry (`getLevel`) to derive target x-coordinates instead of hardcoded ms waits.

### IN-02: Visual floor/platform tiling can overflow past the collider bounds for non-multiple-of-tile widths

**File:** `src/levels/build.js:93-95, 110-112`
**Issue:**
```js
for (let tx = run.x; tx < run.x + run.w; tx += T) {
  add([sprite("ground", { frame: pickTopFrame(tx, run.x, run.w) }), pos(tx, FLOOR_Y)]);
}
```
If `run.w` (or a platform's `p.w`) is not an exact multiple of `CONFIG.TILE_SIZE`, the last
visual tile is placed starting at an x still `< run.x + run.w`, but its full `T`-wide sprite
extends past the collider's actual right edge — a visual overhang beyond the physical solid
region. This only manifests if a level descriptor's authored width isn't tile-aligned, but
there's no assertion guarding that invariant here.
**Fix:** Add a dev-time assertion (e.g. `if (run.w % T !== 0) console.warn(...)`) in
`buildLevel`, or document the tile-alignment requirement directly on the level descriptor
schema.

---

_Reviewed: 2026-07-04T14:38:14Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
