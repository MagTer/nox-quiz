---
phase: 28-full-verification-interactive-sign-off
reviewed: 2026-07-09T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - scripts/browser-boot.mjs
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 28: Code Review Report

**Reviewed:** 2026-07-09
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed `scripts/browser-boot.mjs` as extended by Plan 28-01 with two new proofs: `assertAudioContextState` (an AudioContext-state gesture-gate check, correctly substituted for the plan's originally-specified but structurally-unsatisfiable DOM `<audio>`-element-count check — verified against the vendored `lib/kaplay.mjs`, which exposes `audioCtx: C.ctx` on the global k-object, so this is a genuine, non-vacuous signal, not a repeat of the bug this deviation fixed) and `runSaveResumeAcrossReloadProof` (an isolated-browser-context save-persistence + resumed-unlock reachability proof).

The gesture-gate proof and the row-scoped level-select cursor math (2× ArrowRight landing on tile index 2 / level-03, given the RESUME_SAVE_BLOB's level-01/02-cleared prefix — independently traced against `src/scenes/select.js`'s `moveCursor()`) both check out correctly. The byte-for-byte pre/post-reload localStorage comparison is also sound: `onHide`'s `writeSave()` is wired only inside `game.js` (never `select.js`), and the proof never enters the game scene before calling `page.reload()`, so there is no risk of an in-flight save-on-hide rewrite corrupting the "byte-for-byte" comparison — a real, correctly-reasoned design choice, not an accident.

The one significant gap: `runSaveResumeAcrossReloadProof`'s isolated Playwright context never wires up the `pageerror` / `console.error` / HTTP-4xx-5xx listeners the primary context uses to catch real regressions (lines 269-278). This means a genuine runtime crash inside that isolated context — e.g. an uncaught exception while Kaplay builds level-03 from the resumed save — would go completely undetected, and the script would still print `Browser boot: PASS`. Given this file's own stated purpose ("asserts no runtime errors") and the project's "checks that don't play the game lie" standard, this is a real gap in what the proof actually verifies, not a hypothetical nitpick.

## Critical Issues

### CR-01: Isolated save-resume proof context has no error listeners — a real crash would silently report PASS

**File:** `scripts/browser-boot.mjs:151-234` (function `runSaveResumeAcrossReloadProof`)
**Issue:** The primary drive's `page` (created at line 267) is wired with three listeners that are this script's actual "no runtime errors" enforcement mechanism:
```js
page.on("pageerror", (err) => errors.push({ type: "pageerror", message: err.message, stack: err.stack?.split("\n")?.[0] }));
page.on("console", (msg) => { if (msg.type() === "error") errors.push({ type: "console.error", text: msg.text() }); });
page.on("response", (resp) => { if (resp.status() >= 400) errors.push({ type: "http", status: resp.status(), url: resp.url() }); });
```
`runSaveResumeAcrossReloadProof` opens its own isolated `context`/`page` pair (lines 152-153) — correctly, per the plan's isolation requirement — but never attaches equivalent listeners to that `page`. The function's only failure signals are (a) the explicit `preReloadValue !== postReloadValue` check, (b) the explicit `!triggered` check after `driveToXPlanned`, and (c) whatever the surrounding `try/catch` happens to catch as a thrown JS exception. A page-level uncaught exception (`pageerror`), a console error, or a 404/500 on any asset load during this isolated navigation (e.g. Kaplay throwing while building level-03 from the RESUME_SAVE_BLOB's partial-unlock state, or a level-03 asset failing to load in this fresh context) produces NONE of those three signals and is silently dropped — the function returns normally, `errors` gains no entry, and `Browser boot: PASS` still prints. This directly undermines VALID-03's claim that the save-resume path is proven "into playable gameplay" with no runtime errors — the isolated context is structurally blind to the one class of failure (uncaught JS exceptions / broken asset loads) the rest of this script exists to catch.
**Fix:** Wire the same three listeners on the isolated `page` immediately after it is created, and check/report them (e.g. inside the `finally`, or right before returning) the same way the primary flow does:
```js
async function runSaveResumeAcrossReloadProof(errors) {
  const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await context.newPage();
  page.on("pageerror", (err) =>
    errors.push({ type: "save-resume-pageerror", message: err.message, stack: err.stack?.split("\n")?.[0] })
  );
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push({ type: "save-resume-console.error", text: msg.text() });
  });
  page.on("response", (resp) => {
    if (resp.status() >= 400) errors.push({ type: "save-resume-http", status: resp.status(), url: resp.url() });
  });
  try {
    ...
```

## Warnings

### WR-01: Unguarded `encounters[0]` access assumes level-03 always has a mechanic

**File:** `scripts/browser-boot.mjs:217-219`
**Issue:**
```js
const level = getLevel("level-03");
const encounters = deriveEncounters(level.geometry);
const { triggered } = await driveToXPlanned(page, encounters[0].x, level.geometry);
```
`deriveEncounters` returns `[]` if `level-03`'s geometry has no doors/mathGates/enemies/collectZones. If that level is ever restructured to have zero mechanics (or `"level-03"` is mistyped), `encounters[0]` is `undefined` and `.x` throws a `TypeError` that is caught by the surrounding generic `catch (e)` at line 226 and reported only as `runSaveResumeAcrossReloadProof failed: Cannot read properties of undefined (reading 'x')` — an opaque failure that gives no hint the real problem is "level-03 has no mechanics to drive to," making a future regression here harder to diagnose than it needs to be.
**Fix:** Guard the empty case with a clear, specific error message:
```js
const encounters = deriveEncounters(level.geometry);
if (encounters.length === 0) {
  errors.push({ type: "save-resume", message: "level-03 has no encounters to drive to — cannot prove resumed-unlock reachability" });
} else {
  const { triggered } = await driveToXPlanned(page, encounters[0].x, level.geometry);
  if (!triggered) { ... }
}
```

### WR-02: `browser.newContext()` / `context.newPage()` calls sit outside the function's own guard pattern

**File:** `scripts/browser-boot.mjs:152-153`
**Issue:**
```js
async function runSaveResumeAcrossReloadProof(errors) {
  const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await context.newPage();
  try {
    ...
  } catch (e) {
    errors.push({ type: "save-resume", message: `runSaveResumeAcrossReloadProof failed: ${e.message}` });
  } finally {
    await context.close();
  }
}
```
Both context-creation calls run before the `try` block, so if either throws (e.g. resource exhaustion under a loaded CI runner), the exception propagates uncaught out of this function entirely — it is not converted into an `errors` entry via this function's own catch, and the just-opened `context` (if `newContext()` succeeded but `newPage()` failed) is never explicitly closed by this function's own `finally`. In practice the outer script's final `browser.close()` (line 433) still tears down any dangling contexts, so this isn't a persistent leak across process lifetime — but it does mean this specific failure mode bypasses the function's own non-throwing "always push into `errors`" contract and instead crashes the whole script via the outer catch at line 428, producing a less specific `Browser boot failed: <message>` instead of a `save-resume`-tagged entry.
**Fix:** Move `newContext`/`newPage` inside the `try`, e.g.:
```js
async function runSaveResumeAcrossReloadProof(errors) {
  let context;
  try {
    context = await browser.newContext({ viewport: { width: 960, height: 540 } });
    const page = await context.newPage();
    ...
  } catch (e) {
    errors.push({ type: "save-resume", message: `runSaveResumeAcrossReloadProof failed: ${e.message}` });
  } finally {
    if (context) await context.close();
  }
}
```

## Info

### IN-01: Duplicated localStorage-seeding lambda

**File:** `scripts/browser-boot.mjs:173-175` and `scripts/browser-boot.mjs:293-295`
**Issue:** The `page.evaluate(({ key, blob }) => { localStorage.setItem(key, JSON.stringify(blob)); }, { key, blob })` seeding call is written out identically twice in the same file (once for `SAVE_BLOB` in the primary flow, once for `RESUME_SAVE_BLOB` in the new proof). CLAUDE.md's documented duplication-is-deliberate convention applies to copies of this pattern ACROSS separate Playwright scripts (`browser-boot.mjs` / `audit-phase21-mechanics.mjs` / `calibrate-jump-envelope.mjs`), not to two call sites inside the same file.
**Fix:** Factor into a small local helper, e.g. `async function seedSave(page, blob) { await page.evaluate(({ key, blob }) => localStorage.setItem(key, JSON.stringify(blob)), { key: SAVE_KEY, blob }); }`, and call it from both sites.

---

_Reviewed: 2026-07-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
</content>
