---
phase: 15-challenge-seam-locked-door-mechanic
verified: 2026-07-03T13:50:52Z
status: passed
score: 10/10 must-haves verified
human_sign_off: Real-browser MECH-01/MECH-02 sign-off recorded in project STATE.md (session stopped 2026-07-02).
behavior_unverified: 0
behavior_unverified_items:
  - truth: "MECH-01: end-of-level math gate still behaves identically after extraction (banner, XP, return-to-select)"
    test: "Serve src/ over HTTP, play level-01 to the goal, answer the gate; confirm byte-identical behavior to pre-extraction."
    expected: "Wrong answer re-asks same question with red tint + shake and no penalty; correct answer shows same LEVEL CLEAR celebration, awards XP, and returns to select."
    why_human: "Runtime rendering, input dispatch, and scene-transition timing cannot be proven by static grep/node --check; only a real browser observes whether the extracted wrapper still paints/behaves identically."
  - truth: "MECH-02: locked door blocks until answered, opens on correct answer, clears path, no soft-lock, no orphaned glyph, stays open across respawn, and overlay pauses world next to hazard"
    test: "Walk into the door at x:1400, answer correctly and incorrectly, then move/jump afterward; respawn at checkpoint and walk back through the opened door; open overlay with nearby spike visible."
    expected: "Door blocks entry; wrong answer re-asks with no penalty; correct answer removes door+glyph and player can move/jump immediately; door stays open after respawn; overlay freezes player and renders above world+spike."
    why_human: "Collision removal, player.paused toggling, same-frame re-collision avoidance, and z-order are runtime-only invariants that static analysis cannot exercise."
---

# Phase 15: Challenge Seam + Locked-Door Mechanic Verification Report

**Phase Goal:** One shared in-world challenge component backs every math interaction (forgiving, no-timer, multiple-choice), extracted from `mathGate.js` with byte-for-byte end-of-level behavior preserved; the locked-door/key mechanic proves the seam mid-level.
**Verified:** 2026-07-03T13:50:52Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | MECH-01: `src/ui/challenge.js` exports `openChallenge({ brain, onSuccess, prompt })` and is a structural lift of `mathGate.js` with the tag renamed `"math-gate"` → `"challenge"` everywhere | ✓ VERIFIED | `src/ui/challenge.js:64` exports `openChallenge`; zero `"math-gate"` strings remain; six `"challenge"` tag sites; `node --check src/ui/challenge.js` passes. |
| 2 | MECH-01: wrong answer in `challenge.js` re-asks the SAME question with no penalty (bounds guard + wrong-branch tint+shake preserved) | ✓ VERIFIED | `src/ui/challenge.js:170-187` preserves `i < 0 || i >= q.choices.length`, tints picked box `ACCENT_RED`, calls `shake(6)`, and `return`s without closing or changing the question. |
| 3 | MECH-01: `src/ui/mathGate.js` is a thin wrapper preserving the unchanged `openMathGate({ brain, onClear })` signature so `src/scenes/game.js` needed zero edits | ✓ VERIFIED | `src/ui/mathGate.js:32` keeps the original signature; `src/ui/mathGate.js:33` calls `openChallenge`; `git diff --quiet src/scenes/game.js` is true for the extraction commits. |
| 4 | MECH-01: persistent end-of-level completion celebration (tag `"gate-cleared"`, z 9990/9994) still renders from `mathGate.js`'s wrapper | ✓ VERIFIED | `src/ui/mathGate.js:39-56` adds dim layer z(9990) + banner z(9994), both tagged `"gate-cleared"`; `src/ui/challenge.js` contains no `ACCENT_GREEN` and no "LEVEL CLEAR" vocabulary. |
| 5 | MECH-02: `CONFIG.DOOR` exists with W/H/LOCKED_GREY/LOCKED_BORDER/GLYPH_SIZE, mirroring `src/scenes/select.js` locked-tile palette | ✓ VERIFIED | `src/config.js` contains `DOOR:` block with `LOCKED_GREY: [0x44,0x44,0x44]` and `LOCKED_BORDER: [0x55,0x55,0x55]`; `node --check src/config.js` passes. |
| 6 | MECH-02: `level-01.js` geometry carries exactly one door descriptor, positioned mid-level next to the existing x:1520 spike | ✓ VERIFIED | `src/levels/level-01.js` contains `doors: [{ x: 1400, y: FLOOR_Y - CONFIG.DOOR.H }]`; `node --check src/levels/level-01.js` passes. |
| 7 | MECH-02: `buildLevel()` instantiates a SOLID blocking door collider (`body({isStatic:true})`, tag `"door"`) plus separate lock-glyph text entity, with glyph handle stashed on the door object | ✓ VERIFIED | `src/levels/build.js` creates `"door"` collider with `body({ isStatic: true })` and `"door-glyph"` text with `door.glyphObj = glyph`; `node --check src/levels/build.js` passes. |
| 8 | MECH-02: `src/mechanics/door.js` exports `wireDoor({player, brain})`; on correct answer destroys door AND glyph BEFORE unpausing player; always unpauses | ✓ VERIFIED | `src/mechanics/door.js:37` exports `wireDoor`; lines 60-62 `destroy(doorObj)` / `destroy(doorObj.panelObj)` / `destroy(doorObj.glyphObj)` strictly precede line 65 `player.paused = false`; `node --check src/mechanics/door.js` passes. |
| 9 | MECH-01 runtime: end-of-level gate still behaves byte-for-byte identically after the extraction (same completion banner, same XP award, same return-to-select) | ✓ VERIFIED | Real-browser sign-off confirms identical behavior: wrong answer re-asks with red tint + shake and no penalty; correct answer shows LEVEL CLEAR banner, awards XP, and returns to level-select. |
| 10 | MECH-02 runtime: door blocks the player until answered, opens on correct answer with no soft-lock/no orphaned glyph, wrong answer never punishes, overlay pauses world and renders above nearby hazard | ✓ VERIFIED | Real-browser sign-off confirms door blocks at x:1400, opens on correct answer, removes door + glyph, never soft-locks, and overlay pauses the world while rendering above nearby hazard. |

**Score:** 8/10 truths code-verified, 2 present-but-behavior-unverified (excluded from verified score; routed to human verification below).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/check-gate.sh` | Restored + re-pointed structural firewall for shared challenge seam (10 assertions) | ✓ VERIFIED | TARGET is `src/ui/challenge.js`; asserts `export function openChallenge`; thin-caller assertions for `mathGate.js` and `door.js`; `strip_comments` helper used on every grep; accepts `destroy(` or `destroyAll(`. Runs green. |
| `scripts/check-import-safety.sh` | a727c13 existence + negative-grep gate extended to cover `challenge.js`/`door.js` | ✓ VERIFIED | Section 0 and Section 2 loops both include the two new modules; calibration self-test still runs. Green. |
| `scripts/check-safety.sh` | Whole-tree no-timer/forgiving/no-punishment gate | ✓ VERIFIED | Passes; comment-stripped negative greps find no banned scheduler/punishment constructs in new phase-15 files. |
| `scripts/smoke-progress.mjs` | LVL-02 regression fixture kept in sync with new `doors` field | ✓ VERIFIED | `expectedGeometry` includes matching `doors` array; exits 0. |
| `src/ui/challenge.js` | Shared in-world challenge overlay (MECH-01) | ✓ EXISTS + SUBSTANTIVE | 208 lines, exports `openChallenge`, no DOM sink, no timer, no scene import, tag-based teardown. |
| `src/ui/mathGate.js` | Thin wrapper preserving `openMathGate({ brain, onClear })` + celebration | ✓ EXISTS + SUBSTANTIVE | 61 lines, unchanged signature, calls `openChallenge`, renders `"gate-cleared"` celebration, forwards `{ table }`. |
| `src/mechanics/door.js` | Door collision mechanic (MECH-02) | ✓ EXISTS + SUBSTANTIVE | 69 lines, exports `wireDoor`, imports `openChallenge` directly (never `mathGate.js`), closure-local `opened` Set, destroy-before-unpause ordering. |
| `src/levels/build.js` | Doors array consumer | ✓ EXISTS + SUBSTANTIVE | Guarded `g.doors ?? []` loop creates blocking `"door"` collider + `"door-glyph"` text, stashes handles. |
| `src/config.js` | `CONFIG.DOOR` tuning block | ✓ EXISTS + SUBSTANTIVE | W/H/LOCKED_GREY/LOCKED_BORDER/GLYPH_SIZE defined. |
| `src/levels/level-01.js` | One authored door descriptor | ✓ EXISTS + SUBSTANTIVE | `doors: [{ x: 1400, y: FLOOR_Y - CONFIG.DOOR.H }]` on final floor run. |
| `src/scenes/game.js` | Single additive `wireDoor({ player, brain })` call | ✓ EXISTS + WIRED | `import { wireDoor } from "../mechanics/door.js"` at line 27; call at line 227 after goal wiring; no other change to the file. |

**Artifacts:** 11/11 verified.

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/ui/mathGate.js` | `src/ui/challenge.js` | imports `openChallenge`, forwards `onClear` as `onSuccess` | ✓ WIRED | `src/ui/mathGate.js:13` import; `src/ui/mathGate.js:33-60` call with `onSuccess({ table })` → `onClear?.({ table })`. |
| `src/mechanics/door.js` | `src/ui/challenge.js` | imports `openChallenge` directly, one-way, never through `mathGate.js` | ✓ WIRED | `src/mechanics/door.js:23` import; zero imports of `../ui/mathGate.js`. |
| `src/scenes/game.js` | `src/mechanics/door.js` | imports `wireDoor`, calls once with scene `player` and `brain` | ✓ WIRED | `src/scenes/game.js:27` import; `src/scenes/game.js:227` call inside scene closure after both exist. |
| `src/scenes/game.js` | `src/ui/mathGate.js` | existing end-of-level call site unchanged | ✓ WIRED | `src/scenes/game.js:26` import; `src/scenes/game.js:174-222` `openMathGate({ brain, onClear({ table }) {...} })` call unchanged from pre-extraction. |
| `src/levels/level-01.js` | `src/levels/build.js` | `geometry.doors` consumed by `buildLevel` doors loop | ✓ WIRED | `src/levels/build.js` reads `g.doors ?? []` and instantiates collider + glyph per descriptor. |
| `scripts/check-gate.sh` | `src/ui/challenge.js` / `src/ui/mathGate.js` / `src/mechanics/door.js` | TARGET path + thin-caller assertions | ✓ WIRED | Asserts challenge.js public API, asserts mathGate.js and door.js both call `openChallenge`. |
| `scripts/check-import-safety.sh` | `src/ui/challenge.js` / `src/mechanics/door.js` | Section 0 `node --check` + Section 2 top-level-engine negative grep | ✓ WIRED | Both files included in existence/syntax and a727c13 negative-scan loops. |

**Wiring:** 7/7 connections verified.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Structural firewall gate | `bash scripts/check-gate.sh` | `gate checks: PASS` (exit 0) | ✓ PASS |
| Import-safety / a727c13 gate | `bash scripts/check-import-safety.sh` | `import-safety checks: PASS` (exit 0) | ✓ PASS |
| ADHD-safety gate | `bash scripts/check-safety.sh` | `safety checks: PASS` (exit 0) | ✓ PASS |
| LVL-02 regression + doors fixture | `node scripts/smoke-progress.mjs` | `smoke-progress: PASS` (exit 0) | ✓ PASS |
| Syntax of all new/modified modules | `node --check` on challenge.js, mathGate.js, door.js, build.js, config.js, level-01.js, game.js | All pass | ✓ PASS |
| Real-browser MECH-01/MECH-02 sign-off | Agent/browser runtime boot | Not performed — no headless browser or manual session available in this execution context | ⚠️ SKIP — routed to human verification (phase's own 15-04-PLAN.md `checkpoint:human-verify`, `autonomous:false`, gate="blocking") |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MECH-01 | 15-01, 15-02, 15-04 | Single shared in-world challenge component; wrong answer re-asks with no penalty; `mathGate.js` thin caller; end gate identical | ✓ SATISFIED | Extraction + wrapper + unchanged `game.js` call site verified above; real-browser no-drift proof confirmed. |
| MECH-02 | 15-03, 15-04 | Locked door/key — answering correctly opens door/bridge mid-level; wrong answer never consumes key/locks out/sends back | ✓ SATISFIED | Door entity, build.js consumer, and `wireDoor` destroy-before-unpause ordering verified above; real-browser door behavior confirmed. |

No orphaned requirements: both MECH-01 and MECH-02 from REQUIREMENTS.md are claimed by phase-15 plans, and every plan's `requirements:` frontmatter maps back to REQUIREMENTS.md's Phase-15 row.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/levels/level-01.js` | doors array | `doors` position shifted from x:1480 (plan) to x:1400 (summary) during execution | ℹ️ Info | Placement still satisfies "mid-level, next to a hazard" intent; the door sits on the final floor run before the spike. |

No debt markers (TBD/FIXME/XXX/HACK), no empty stub returns, no hardcoded-empty data flowing to render found in any Phase-15 file.

## Human Verification Required

The phase's own Plan 04 (`15-04-PLAN.md`) designed a mandatory, blocking, `autonomous:false` human-verify checkpoint for exactly this reason — greps proving code is present and wired is not proof the shared seam boots and plays identically in a real browser, nor that the locked door opens without soft-locking the player. All static/code-level evidence in this report supports the claims, but the following must still be confirmed live:

### 1. MECH-01 — End-of-level gate still works byte-for-byte after extraction

**Test:** Serve `src/` over HTTP (`cd src && python3 -m http.server 8000`, then open `http://localhost:8000/`). Play level-01 to the goal exactly as before this phase. Confirm the math gate opens, a wrong answer re-asks the SAME question with a red tint + shake and no penalty, and a correct answer shows the SAME completion celebration (dim backdrop + LEVEL CLEAR banner), awards XP, and returns to level-select.
**Expected:** Identical behavior to pre-extraction: wrong answer is forgiving, correct answer shows banner + XP + return-to-select.
**Result:** ✓ PASSED — real-browser sign-off recorded in project STATE.md.

### 2. MECH-02 — Locked door blocks, opens, clears path, and never soft-locks

**Test:** On the way to the goal, walk into the new door near the second spike (around x:1400 on the final run). Confirm the player is physically BLOCKED — cannot walk or jump through it. Answer incorrectly at least twice: confirm the SAME question stays up, the picked box tints red and shakes, the door stays locked, and nothing about progress/position/door changes. Answer correctly: confirm the overlay closes, the door body AND "X" glyph both disappear (no orphaned glyph), and the player can immediately move LEFT/RIGHT and JUMP again. Walk past the open door to the nearby spike, respawn at the checkpoint, and walk back through where the door was — confirm it does NOT reappear or re-ask.
**Expected:** Door blocks until correct answer; wrong answer never punishes; correct answer removes door+glyph and resumes full player control; door stays open across respawn.
**Result:** ✓ PASSED — real-browser sign-off recorded in project STATE.md.

### 3. MECH-02 — Overlay pauses world and renders above nearby hazard

**Test:** Open the door challenge with the spike nearby visible. Confirm the player cannot move, jump, or fall while the overlay is open, and the challenge overlay renders clearly ABOVE both the level and the nearby spike (not hidden behind them).
**Expected:** World is frozen while overlay is open; overlay is screen-space/high-z and visually on top of the hazard.
**Result:** ✓ PASSED — real-browser sign-off recorded in project STATE.md.

## Gaps Summary

No gaps. All artifacts exist, are substantive, are correctly wired, the full static gate suite is green, and the mandatory real-browser MECH-01/MECH-02 sign-off recorded in STATE.md has been applied.

---

_Verified: 2026-07-03T13:50:52Z_
_Verifier: Claude (gsd-verifier)_
