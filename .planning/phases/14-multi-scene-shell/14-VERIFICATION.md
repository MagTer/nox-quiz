---
phase: 14-multi-scene-shell
verified: 2026-07-02T17:52:03Z
status: human_needed
score: 4/4 must-haves code-verified (1 present-but-behavior-unverified)
behavior_unverified: 1
overrides_applied: 0
human_verification:
  - test: "Serve the game over HTTP (`cd src && python3 -m http.server 8000`, open http://localhost:8000/ — note: src/ is the web root, matching the Dockerfile's `COPY src/ /usr/share/nginx/html/` convention; the 14-03-PLAN's 'serve from the repo root' phrasing is imprecise). Confirm the dark-grunge 'Math Lab' title renders on load with NO console errors, then press Enter, reload+Space, reload+click — all three advance to select."
    expected: "Title renders (no pink, NO 'ReferenceError: add/rgb/vec2 is not defined' a727c13 signature in DevTools console); all three start inputs (Enter/Space/click) advance to select."
    why_human: "Rendering, click/keyboard event dispatch, and console-error absence are runtime browser behaviors; static grep/`node --check` can prove the code is present and wired but cannot prove the page actually paints or that no exception fires at runtime."
  - test: "On select, confirm level-01 renders UNLOCKED (bright/selectable) and pick it both via mouse click and via arrow+Enter. Play to the goal, answer the math gate correctly, confirm you RETURN to select (not auto-advanced) with level-01 now showing a CLEARED mark. Mid-level, press Escape and confirm it also returns to select with no forced replay."
    expected: "Both input paths select and play level-01; clearing persists and returns to select with a visible CLEARED mark; Escape bails mid-level to select."
    why_human: "End-to-end input-to-scene-transition behavior and visual mark rendering cannot be proven by grep alone — the code paths exist and are wired (verified statically below) but the actual runtime transition and visual state have not been observed."
  - test: "NAV-04 leak check (load-bearing): for EACH of title, select, and a level, enter -> leave -> re-enter TWICE. After each round-trip confirm a single keypress fires its action exactly once (no double-advance/double-select), the select cursor does not remember a stale position, no ghost colliders/tweens/effects linger, the canvas never blanks, and the DevTools console shows no errors. Optionally confirm the DevTools event-listener count does not grow across round-trips. Confirm `bash scripts/check-import-safety.sh` is still green at boot time."
    expected: "No leaked handlers/colliders/tweens/effects across repeated re-entry; no double-fired input; no console errors; import-safety gate green."
    why_human: "This is a cancellation/cleanup/ordering invariant (state must NOT leak across go() scene transitions) — the exact class of truth static analysis cannot see. `src/scenes/game.js` and `src/scenes/select.js` show the correct code-level pattern (closure-local state, onSceneLeave cancel of the one persistent onHide controller, app-bus controllers relying on Kaplay 3001's own go() teardown) but no test or browser session has exercised repeated re-entry to confirm the invariant actually holds at runtime. This is exactly the mandatory real-browser checkpoint the phase's own Plan 03 designed (`autonomous:false`, `checkpoint:human-verify`, gate=\"blocking\") and its own 14-03-SUMMARY.md records as still PENDING — it was never run."
---

# Phase 14: Multi-Scene Shell Verification Report

**Phase Goal:** She boots into a dark-grunge title, moves to a level-select that shows locked/unlocked/cleared state, and plays any unlocked level — all via in-game screens with clean state on every entry. This phase establishes the factory + closure-state + controller-cancel + import-safety contracts every later engine-touching phase inherits.
**Verified:** 2026-07-02T17:52:03Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | NAV-01: dark-grunge title renders "Math Lab" + press-to-start prompt; Enter/Space/click all advance to select | ✓ VERIFIED (code) | `src/scenes/title.js:40-68` draws centered `text("Math Lab")` + prompt via `fixed()`/`anchor("center")`; registers `onKeyPress("enter", start)`, `onKeyPress("space", start)`, `onClick(start)` all calling `go("select")`, all inside the factory body. `node --check` passes; no DOM/storage sink. Actual rendering/paint not yet observed in a browser (see Human Verification #1). |
| 2 | NAV-02: select lists every LEVEL_ORDER level in three distinguishable states (locked/unlocked/cleared), only unlocked tiles reach `go("game",{levelId})` via mouse + keyboard | ✓ VERIFIED (code) | `src/scenes/select.js:56-190` reads `createProgress(loadSave())` fresh every entry (line 63), derives state per tile via `isUnlocked`/`isLevelCleared` (lines 65-68), renders 3 visually distinct fill/outline/glyph combos (LOCKED_GREY+dim border+"X", ACCENT_GREEN+accent border, CLEARED_BLUE+"v"), gates `box.onClick` behind `t.state !== "locked"` (line 144), and drives arrow+Enter cursor only over `selectable` (locked-excluded) indices (lines 152-189). `levels/index.js:isUnlocked` derives unlock purely from cleared facts (no stored boolean). |
| 3 | NAV-03: clearing a level persists (markCleared + writeSave) then returns to select (no auto-advance, no timer); Escape returns to select from mid-level | ✓ VERIFIED (code) | `src/scenes/game.js:180,194,201` — `progress.markCleared(level.id)` then `writeSave(...)` then `go("select")` as the final line of `onClear`, with no `wait()`/`loop()`/`setTimeout` (confirmed by `check-safety.sh` PASS). `onKeyPress("escape", () => go("select"))` at line 211, registered in-body. |
| 4 | NAV-04: navigation happens via in-game Kaplay scenes only (no browser dialogs), with clean state on every entry — no leaked input handlers, colliders, or effects across screen changes | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Code-level evidence is strong: no `stay()` anywhere in the three scenes; run state (`cursor` in select.js, coin/goal/checkpoint state in game.js) is closure-local, never module-level `let`; the one persistent app-bus controller game.js holds a handle to (`hideCtrl = onHide(...)`) is explicitly cancelled via `onSceneLeave(() => hideCtrl.cancel())` (game.js:238-239); plain nav `onKeyPress`/`onClick` rely on Kaplay 3001's own go()-teardown auto-clear (documented project pattern, not independently proven here). `scripts/check-import-safety.sh` passes and its Section 2 a727c13 negative-grep is now self-calibrating (WR-01/02/03 fixes landed — see below) so it is a real, non-trivial gate. **However** this truth is a cancellation/cleanup/ordering invariant across repeated scene re-entry — exactly the class presence+wiring checks cannot see — and the phase's own mandatory human checkpoint (14-03-PLAN.md Task 2, `checkpoint:human-verify`, `gate="blocking"`) that was designed specifically to prove this was never executed. 14-03-SUMMARY.md explicitly records it as PENDING. |

**Score:** 3/4 truths code-verified, 1 present-but-behavior-unverified (routes to human verification below; not counted as verified).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/check-import-safety.sh` | a727c13 module-top-level negative-grep gate, calibrated red/green | ✓ VERIFIED | Exists, executable-by-`bash`, contains `strip_comments`, ends with `import-safety checks: PASS`. Runs and exits 0 (`bash scripts/check-import-safety.sh` → PASS). Section 1b self-calibration (WR-03 fix) now asserts the trap fires on `scripts/fixtures/bad-scene.js` and stays silent on `src/scenes/game.js` on EVERY run, not just a one-off manual check. |
| `scripts/fixtures/bad-scene.js` | calibration fixture proving the gate can go RED | ✓ VERIFIED | Contains both trap forms: `const banner = add([...])` (column-0 assigned engine call) and a bare `go("select");` statement (WR-01 form). Both are now actively exercised by the gate's own Section 1b (not just documentation, per WR-03 fix). |
| `src/scenes/title.js` | titleScene factory — NAV-01 | ✓ VERIFIED | Exports `titleScene(data)`, ≥30 lines, engine globals body-only, no DOM/storage sink, renders "Math Lab" + prompt, dual-input → `go("select")`. |
| `src/scenes/select.js` | selectScene factory — NAV-02 | ✓ VERIFIED | Exports `selectScene(data)`, ≥50 lines, reads `createProgress(loadSave())` fresh, 3-state tiles, dual-input pick gated to unlocked only, no DOM/storage sink, no `stay(`. |
| `src/config.js` (CONFIG.TITLE + CONFIG.SELECT) | layout constants, no magic numbers in scene logic | ✓ VERIFIED | Both blocks present (lines ~130s-165); `TITLE`/`SELECT` keys confirmed via grep; IN-03 fix appended a documented overflow-risk flag for level 2+ (info-level, not a defect — single level today, nothing overflows). |
| `src/main.js` | boot generalization — register title/select/game, `go("title")` | ✓ VERIFIED | Imports `titleScene`/`selectScene`; registers all three scenes before any `go()`; boots `go("title")`; old `go("game", { startX...` boot removed; all 5 `loadSprite` calls and the +50% canvas display-scale block untouched. |
| `src/scenes/game.js` | clear→select return + Escape→select (NAV-03) | ✓ VERIFIED | `go("select"` appears exactly twice (onClear final line + Escape controller); `markCleared`/`writeSave`/`data?.levelId` all intact; no `stay(`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/scenes/select.js` | `src/levels/index.js` | imports `LEVEL_ORDER` + `isUnlocked`; derives unlock per tile, never stores it | ✓ WIRED | `import { LEVEL_ORDER, isUnlocked } from "../levels/index.js"` (line 33); `isUnlocked(id, progress)` called per tile (line 66); no write of an "unlocked" field anywhere in select.js or into the save. |
| `src/scenes/select.js` | `src/progress.js` | `loadSave()->createProgress()` fresh on entry; reads `isLevelCleared` per id | ✓ WIRED | Line 63: `const progress = createProgress(loadSave());` runs at the top of the factory body (fresh every entry, not cached at module scope). `progress.isLevelCleared(id)` called per tile (line 65). |
| `scripts/check-import-safety.sh` | `src/scenes/title.js` / `select.js` | `node --check` + scoped top-level-engine negative grep | ✓ WIRED | Section 0 runs `node --check` on both; Section 2 runs the scoped `TOPLEVEL_TRAP` negative grep on both, comment-stripped, anchored to column-0 forms only. |
| `src/main.js` | `src/scenes/title.js` | imports `titleScene`, registers `scene("title", titleScene)`, boots `go("title")` | ✓ WIRED | Confirmed at main.js:13,72,76. |
| `src/main.js` | `src/scenes/select.js` | imports `selectScene`, registers `scene("select", selectScene)` | ✓ WIRED | Confirmed at main.js:14,73. |
| `src/scenes/game.js` | `src/scenes/select.js` | `onClear` and `onKeyPress("escape")` both `go("select")` | ✓ WIRED | Confirmed at game.js:201,211 — exactly 2 occurrences of `go("select"`. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full static gate suite green | `bash scripts/check-import-safety.sh && bash scripts/check-progress.sh && bash scripts/check-safety.sh` | `import-safety checks: PASS`, `progress checks: PASS`, `safety checks: PASS` (all exit 0) | ✓ PASS |
| Syntax validity of every phase-14 module | `node --check` on title.js, select.js, main.js, game.js, config.js | All pass | ✓ PASS |
| Real browser boot (page load, console errors, click/keyboard dispatch, re-entry leak check) | headless-chrome dump / screenshot attempted from this verifier | Headless Chrome hung/timed out in this sandboxed environment (no usable DOM/screenshot capture obtained) | ? SKIP — routed to human verification (this is also the phase's own designed mandatory checkpoint, not a shortcut this verifier is bypassing) |

Note on serve path: 14-03-PLAN.md's how-to-verify says "serve over HTTP from the repo root" and open `http://localhost:8000/`, but `index.html` lives at `src/index.html`, and the Dockerfile comment states the equivalent dev command is `cd src && python3 -m http.server` (src/ is flattened to the web root in both dev and prod). This verifier confirms `cd src && python3 -m http.server 8792` correctly serves `index.html` and `main.js` (HTTP 200). This is a minor documentation imprecision in the plan, not a code defect — flagged for whoever runs the human verification so they don't get a blank page serving from the true repo root.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| NAV-01 | 14-01, 14-02, 14-03 | Dark-grunge title screen shown on load, start/continue into game | ✓ SATISFIED (code); runtime render unconfirmed | title.js + main.js boot wiring verified above |
| NAV-02 | 14-01, 14-03 | Level-select lists locked/unlocked/cleared, picks any unlocked level | ✓ SATISFIED (code); runtime unconfirmed | select.js three-state tiles + dual-input pick verified above |
| NAV-03 | 14-02, 14-03 | Clearing unlocks next; resume from any unlocked level, no forced replay | ✓ SATISFIED (code); runtime unconfirmed | game.js clear→select + derived unlock in select.js verified above |
| NAV-04 | 14-01, 14-02, 14-03 | In-game screens (no browser dialogs), clean state on every entry, no leaks | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Static a727c13 gate green + closure/cancel code patterns verified; the load-bearing re-entry leak proof (the phase's own mandatory `checkpoint:human-verify`) was never executed — 14-03-SUMMARY.md records it PENDING |

No orphaned requirements: all four NAV-01..04 IDs from REQUIREMENTS.md are claimed by at least one of the three plans, and every plan's `requirements:` frontmatter maps back to REQUIREMENTS.md's Phase-14 row.

**Note on REQUIREMENTS.md inconsistency (not a phase-14 code defect, but worth flagging):** REQUIREMENTS.md's checkbox line for NAV-04 shows `[x]` (checked/complete), while its own Traceability table on the same file lists NAV-04 status as "In Progress". The Traceability table's "In Progress" is the accurate one given the pending human sign-off found here — the checkbox appears to have been set prematurely (likely mirroring ROADMAP.md's `[x] Phase 14: Multi-Scene Shell ... (completed 2026-06-29)` and the Progress table's "Complete" row, both of which were marked before the mandatory browser boot ran).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/config.js` | 138, 148 | "placeholder-but-tunable" comment re: Phase-18 art | ℹ️ Info | Explicitly scoped/deferred to Phase 18 per ROADMAP.md and CLAUDE.md; not a Phase 14 defect. No TBD/FIXME/XXX/HACK markers found in any Phase-14 file. |

No debt markers (TBD/FIXME/XXX), no empty stub returns, no hardcoded-empty data flowing to render found in any of the 7 files this phase touched.

### Code Review Follow-Through (14-REVIEW.md)

All 3 warnings and the actionable info item from the phase's own code review are confirmed fixed in the current codebase:
- **WR-01** (bare top-level engine-call statements uncaught) — fixed: `TOPLEVEL_TRAP` form (b) now matches column-0 bare calls (`check-import-safety.sh:66-67`).
- **WR-02** (trap vocabulary too narrow) — fixed: `ENGINE_GLOBALS` now covers the full engine surface (`go|center|color|pos|anchor|fixed|outline|area|body|setGravity|destroy|tween|scene|loadSprite|...`) rather than the original 10-symbol list.
- **WR-03** (fixture never actually executed by the gate) — fixed: Section 1b now runs the two-sided calibration self-test on every invocation (fires on `bad-scene.js`, stays silent on `game.js`), failing loudly if the regex ever breaks.
- **IN-01** (locked tiles wear the same accent-green outline as selectable ones) — fixed: `LOCKED_BORDER` (dim grey) now used for locked tiles, `SELECTABLE_BORDER` (accent) for unlocked/cleared.
- **IN-02** (cursor highlight is width-only) — fixed: `CURSOR_BORDER` (bright white) now recolors the active tile, not just widens its outline.
- **IN-03** (no row-wrap for level 2+) — addressed as documented, non-blocking flag in `config.js` (not a code fix; correctly deferred since only one level exists today and LVL-01 levels ship in Phase 17).
- **IN-04** (unused `data` param) — explicitly not a bug per the review; no change needed, none made.

## Human Verification Required

The phase's own Plan 03 (`14-03-PLAN.md`) designed a mandatory, blocking, `autonomous:false` human-verify checkpoint for exactly this reason — greps proving code is present and wired is not proof the shell boots and navigates cleanly in a real browser. That checkpoint was never executed (14-03-SUMMARY.md explicitly records it "PENDING — routed to the orchestrator for manual browser testing"). All static/code-level evidence in this report supports the claims, but the following must still be confirmed live:

### 1. NAV-01 — Title renders and dual-input start works

**Test:** Serve `src/` over HTTP (`cd src && python3 -m http.server 8000`, then open `http://localhost:8000/`). Confirm the dark-grunge "Math Lab" title + press-to-start prompt renders on load with no pink and no console errors. Press Enter → confirm it advances to select. Reload, press Space → select. Reload, click anywhere → select.
**Expected:** Title paints correctly; all three inputs advance to select; DevTools console shows no errors (especially no a727c13-signature `ReferenceError`).
**Why human:** Rendering and input-dispatch are runtime behaviors static analysis cannot observe.

### 2. NAV-02/NAV-03 — Select states, pick paths, clear/resume, Escape

**Test:** Confirm level-01 shows UNLOCKED (bright/selectable). Pick it via mouse click, play it, and via arrow+Enter on a return visit. Clear the level (answer the math gate correctly) and confirm you return to select with a CLEARED mark on level-01, no auto-advance. Mid-level, press Escape and confirm it also returns to select.
**Expected:** Both pick paths work; clearing persists and returns without auto-advancing; Escape bails cleanly; no forced replay.
**Why human:** End-to-end scene-transition and visual-state behavior; the code paths are statically verified but not runtime-observed.

### 3. NAV-04 — Enter→leave→re-enter ×2 leak check (load-bearing)

**Test:** For each of title, select, and a level: enter → leave → re-enter TWICE. After each round-trip confirm a single keypress fires its action exactly once, the select cursor doesn't remember a stale position, no ghost colliders/tweens/effects linger, the canvas never blanks, and DevTools shows no console errors. Confirm `bash scripts/check-import-safety.sh` stays green throughout.
**Expected:** No leaked handlers/colliders/tweens/effects across repeated re-entry.
**Why human:** This is precisely the class of cancellation/cleanup/ordering invariant that presence-and-wiring checks cannot see — code shows the right pattern (closure-local state, one explicit `onSceneLeave` cancel, reliance on Kaplay 3001's own go()-teardown for plain nav controllers) but no test or session has exercised the repeated-transition path this invariant depends on.

## Gaps Summary

No code-level gaps. All artifacts exist, are substantive (not stubs), are correctly wired, and the code review's actionable findings (WR-01/02/03, IN-01/02) are confirmed fixed in the shipped code. The phase is blocked from `passed` status only by its own designed, never-executed mandatory human browser-boot checkpoint (NAV-04's runtime leak-check + the general "it actually boots and navigates" proof for NAV-01..03). This is the expected state per the task framing: mark human_needed, not failed. ROADMAP.md/STATE.md/REQUIREMENTS.md currently show Phase 14 as "Complete", which is premature relative to the phase's own success criterion #4 ("verified by a real browser boot") and its own Plan 03 blocking-checkpoint design — recommend routing the pending checkpoint to a human before treating Phase 14 as closed.

---

_Verified: 2026-07-02T17:52:03Z_
_Verifier: Claude (gsd-verifier)_
