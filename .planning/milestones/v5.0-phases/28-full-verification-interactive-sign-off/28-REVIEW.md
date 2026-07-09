---
phase: 28-full-verification-interactive-sign-off
reviewed: 2026-07-09T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - scripts/browser-boot.mjs
findings:
  critical: 0
  warning: 0
  info: 3
  total: 3
status: issues_found
---

# Phase 28: Code Review Report (Re-review after fixes)

**Reviewed:** 2026-07-09
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found (info-level only — no blockers or warnings remain)

## Summary

Re-reviewed `scripts/browser-boot.mjs` against commits 767aa47 (CR-01), 4cb95d7 (WR-01), and f15faea (WR-02), which claim to fix the 3 in-scope findings from the prior review. All three fixes were verified in place, are correctly implemented, and introduce no functional regressions:

- **CR-01 (fixed, verified):** The isolated `runSaveResumeAcrossReloadProof` context's `page` now has the same three listeners (`pageerror`, `console` error, HTTP 4xx/5xx `response`) as the primary drive, registered at lines 166-174, correctly placed *before* `page.goto()` (line 175) so no early error window is missed. Entries are tagged `save-resume-pageerror` / `save-resume-console.error` / `save-resume-http`, distinguishable from the primary drive's untagged equivalents in the shared `errors` array. This closes the original gap where a genuine runtime crash in the isolated context would go completely undetected.
- **WR-01 (fixed, verified):** `encounters.length === 0` is now checked (lines 242-255) before `encounters[0].x` is accessed, pushing a specific `save-resume`-tagged message instead of allowing an opaque `TypeError` to bubble to the generic catch.
- **WR-02 (fixed, verified):** `context` is now declared with `let` above the `try` (line 158) and assigned inside it (line 160), so a throw from `browser.newContext()` or `context.newPage()` is now converted into a `save-resume`-tagged `errors` entry via this function's own `catch`, rather than propagating uncaught to the outer script-level catch. The `finally` correctly guards `context.close()` with `if (context)` for the case where `newContext()` itself threw before assignment.

`node --check scripts/browser-boot.mjs` confirms the file is syntactically valid, and `git show --stat` for all three commits confirms only `scripts/browser-boot.mjs` was touched, matching the fix report's claims.

No new Critical or Warning issues were introduced by these fixes. Two new **Info**-level observations surfaced during this pass (both side effects of the fix sequence itself, not of any single fix in isolation), and the prior IN-01 (duplicated localStorage-seeding lambda) remains present, unfixed by design (out of default fix scope) — carried forward per instructions, not re-flagged as a regression.

## Critical Issues

None.

## Warnings

None.

## Info

### IN-01: Duplicated localStorage-seeding lambda (carried forward, unfixed by design)

**File:** `scripts/browser-boot.mjs:193-195` and `scripts/browser-boot.mjs:325-327`
**Issue:** Still present, unchanged from the prior review — the `page.evaluate(({ key, blob }) => { localStorage.setItem(key, JSON.stringify(blob)); }, { key, blob })` seeding call is written out identically twice in this file (once for `RESUME_SAVE_BLOB` in the isolated proof, once for `SAVE_BLOB` in the primary flow). This was explicitly out of scope for the current fix round (info-level items are not auto-fixed by default) — listed here for continuity, not as a new regression.
**Fix:** Factor into a small local helper, e.g. `async function seedSave(page, blob) { await page.evaluate(({ key, blob }) => localStorage.setItem(key, JSON.stringify(blob)), { key: SAVE_KEY, blob }); }`, and call it from both sites.

### IN-02: Stale line-number reference in CR-01's own fix comment

**File:** `scripts/browser-boot.mjs:162-165`
**Issue:** The comment introduced by the CR-01 fix reads:
```js
// CR-01: wire the same error listeners the primary drive's page uses (lines
// 269-278) so a genuine runtime crash inside this isolated context -- e.g. an
// uncaught exception while Kaplay builds level-03 from the resumed save, or a
// 404/500 asset load -- is actually caught instead of silently producing PASS.
```
"lines 269-278" was accurate at the moment commit 767aa47 landed, but the subsequent WR-02 fix (f15faea) inserted additional lines earlier in the same function (`let context;`, the `try` wrapper, etc.), shifting every line below it. The primary drive's actual listener registration now lives at lines 302-310 (verified via `grep -n 'page.on("pageerror"\|page.on("console"\|page.on("response"'`). Line 269 in the current file is unrelated code inside the static file server's request handler (`const url = new URL(req.url, ...)`), so a maintainer following this reference today lands in the wrong place entirely.
**Fix:** Either remove the specific line numbers (describe the target structurally, e.g. "the primary drive's `page.on(...)` block below, near the main `try`") or update to the current line range (302-310) and accept that this reference will need re-checking on any future edit that shifts line counts.

### IN-03: New duplication introduced by the CR-01 fix — identical 3-listener wiring block now exists twice

**File:** `scripts/browser-boot.mjs:166-174` (isolated context, new) and `scripts/browser-boot.mjs:302-310` (primary drive, pre-existing)
**Issue:** Before the CR-01 fix, the isolated context had no error listeners at all (that was the bug). The fix correctly added them, but did so by copy-pasting the primary drive's three `page.on("pageerror"/"console"/"response", ...)` registrations rather than extracting a shared helper — the only difference between the two blocks is the `errors` entry's `type` string prefix (`save-resume-*` vs bare). This is the same class of same-file duplication the pre-existing IN-01 already calls out (per that finding's own reasoning, CLAUDE.md's "Playwright script duplication is deliberate" convention applies to copies *across* separate scripts like `browser-boot.mjs`/`audit-phase21-mechanics.mjs`/`calibrate-jump-envelope.mjs`, not to two call sites inside the same file). Low severity — the logic is simple and unlikely to drift silently — but worth flagging since the fix round created a second instance of the exact pattern IN-01 already identified as undesirable.
**Fix:** Factor into a shared helper, e.g.:
```js
function wireErrorListeners(page, errors, prefix = "") {
  page.on("pageerror", (err) =>
    errors.push({ type: `${prefix}pageerror`, message: err.message, stack: err.stack?.split("\n")?.[0] })
  );
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push({ type: `${prefix}console.error`, text: msg.text() });
  });
  page.on("response", (resp) => {
    if (resp.status() >= 400) errors.push({ type: `${prefix}http`, status: resp.status(), url: resp.url() });
  });
}
```
and call `wireErrorListeners(page, errors)` for the primary drive and `wireErrorListeners(page, errors, "save-resume-")` for the isolated context.

---

_Reviewed: 2026-07-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
</content>
