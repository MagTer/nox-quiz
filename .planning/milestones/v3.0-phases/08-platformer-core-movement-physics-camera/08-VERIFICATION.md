---
phase: 08-platformer-core-movement-physics-camera
verified: 2026-06-24T00:00:00Z
status: human_needed
score: 13/13 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: null
human_verification:
  - test: "Throttled / non-60Hz playthrough vs 60Hz baseline (MOVE-05)"
    expected: "Run distance per ~1s hold, full-hold jump height, and camera follow feel are identical at a throttled / non-60Hz refresh as at 60Hz. Jumps not eaten, camera does not speed up, console clean."
    why_human: "Frame-rate independence of feel cannot be observed by grep/syntax checks — it requires running the served game at two refresh rates and comparing perceived motion. This is the intentional end-of-phase human-verify gate (human_verify_mode: end-of-phase); the underlying dt-correctness audit passed in code."
---

# Phase 8: Platformer Core — Movement, Physics, Camera Verification Report

**Phase Goal:** The intrinsically-fun spine works — an avatar she controls runs, jumps with weight, lands solidly, and the camera follows smoothly, all frame-rate independent. The gentle checkpoint-respawn policy is established here so later hazards inherit it.
**Verified:** 2026-06-24
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

The full movement spine exists and is correctly wired in the codebase. Every code-level
must-have across Plans 01 and 02 is VERIFIED against the actual source (not just SUMMARY
claims). The only outstanding item is the MOVE-05 throttled-display comparison, which is an
intentional end-of-phase human-verify gate — all of its automated dt-correctness preconditions
pass in code. Per the decision tree, the presence of a human-verification item makes the
overall status `human_needed`, not `passed`.

### Observable Truths

| #   | Truth                                                                                                          | Status     | Evidence |
| --- | ------------------------------------------------------------------------------------------------------------ | ---------- | -------- |
| 1   | Booting src/ runs the platformer scene (not the Phase 7 "hello" smoke text)                                   | ✓ VERIFIED | `main.js:26-28` registers `scene("game", gameScene)` + `go("game", {startX,startY})`; no `"hello"` remains (grep empty) |
| 2   | A #00ff88 player rect sits on a floor and is pulled down by gravity                                           | ✓ VERIFIED | `player.js:24-32` `rect(24,32)`+`body({maxVelocity})`+`color(0,255,136)`; `game.js:23` `setGravity(CONFIG.GRAVITY)`; merged floor `game.js:35` |
| 3   | Left/right arrows OR A/D run the player both directions                                                       | ✓ VERIFIED | `player.js:43-46` dir from `isKeyDown("left"/"a"/"right"/"d")`, `vel.x = dir * CONFIG.RUN_SPEED` |
| 4   | Player lands solidly on the merged floor and fast-drop ledge — no sink, no tunnel at full speed               | ✓ VERIFIED (code) | merged static floor + `body({maxVelocity: CONFIG.MAX_FALL_SPEED})` anti-tunnel cap (`player.js:28`); tall ledge `game.js:39`. Perceived solidity is in MOVE-05 human check |
| 5   | All tunable numbers live in CONFIG — logic modules contain no inline movement literals                        | ✓ VERIFIED | `config.js` holds all 14 tunables; player.js/camera.js reference only `CONFIG.*` for feel; remaining literals are structural (0/±1/÷1000/÷2) or test-strip layout coords |
| 6   | Tapping jump = short hop; holding jump = tall jump (variable height)                                          | ✓ VERIFIED | `player.js:71-73` `onKeyRelease` cuts `vel.y *= CONFIG.JUMP_CUT` while rising (`vel.y < 0`) |
| 7   | Jumping within ~100ms after leaving a ledge still jumps (coyote)                                              | ✓ VERIFIED | `player.js:49-50` coyote refills to `COYOTE_MS/1000` grounded, bleeds by `dt()`; consume gate `:57` `coyote > 0` |
| 8   | Pressing jump just before landing fires on touchdown (jump buffering)                                         | ✓ VERIFIED | `player.js:65-67` press sets `buffer = BUFFER_MS/1000`; `:53,57` bleeds by `dt()`, consumed when grounded/coyote |
| 9   | Camera follows smoothly with no jitter and never reveals empty space beyond level bounds                      | ✓ VERIFIED (code) | `camera.js:20` `t = 1 - Math.exp(-CONFIG.CAM_RATE*dt())`; `:28-29` clamp to bounds via `width()/2`,`height()/2`; called every frame `game.js:86`. Perceived smoothness in MOVE-05 human check |
| 10  | Falling off the world respawns at last-touched checkpoint, momentum zeroed, quick flash — no game-over/lives | ✓ VERIFIED | `game.js:63-65` `onCollide("checkpoint")` → `lastCheckpoint`; `:72-78` `reset()` repositions + `vel=vec2(0)` + opacity flash; `:89-90` fall-off threshold; NO `go()` in path |
| 11  | The stress strip (merged floor + fast-drop ledge + gaps) exists                                              | ✓ VERIFIED | `game.js:35` 1600-wide merged floor; `:39` tall ledge; `:42-43` two gap platforms — all `isStatic: true` |
| 12  | Run is dt-correct (no double dt-scale); camera uses exp lerp (no raw constant lerp); no hand-rolled gravity   | ✓ VERIFIED | audit greps clean: no `vel.x = …dt()`, no `vel.y +=`, no `lerp(a,b,0.NN)`; camera exp form present |
| 13  | Throttled / non-60Hz feel matches 60Hz (MOVE-05) — human-confirmed                                            | ? UNCERTAIN | dt-correctness preconditions all pass in code (truth 12); perceived equivalence requires a human throttled playthrough — see Human Verification |

**Score:** 12/13 truths verified in code; 1 routed to human verification (MOVE-05 perceived equivalence). The 13th is not FAILED — its code preconditions are all VERIFIED; only the human comparison remains.

### Required Artifacts

| Artifact            | Expected                                                          | Status     | Details |
| ------------------- | ---------------------------------------------------------------- | ---------- | ------- |
| `src/config.js`     | CONFIG with 14 tunables, zero imports                            | ✓ VERIFIED | All 14 keys present; leaf module, no imports; each commented with unit |
| `src/player.js`     | makePlayer + dt-correct run + coyote/buffer/variable-height       | ✓ VERIFIED | Exports makePlayer; imports CONFIG; run + full game-feel layer; single jump path |
| `src/camera.js`     | followCamera — exp lerp + clamp to bounds                        | ✓ VERIFIED | Exports followCamera; `Math.exp(-CONFIG.CAM_RATE*dt())`; clamp via width/height |
| `src/scenes/game.js`| stress strip + checkpoints + in-place reset()/respawn + cam call | ✓ VERIFIED | Exports gameScene; merged floor+ledge+gaps; checkpoints; reset()/respawn; followCamera(player) |
| `src/main.js`       | kaplay init + scene registration + go('game', seed)              | ✓ VERIFIED | Init block kept; registers scene + boots go; no "hello" |

### Key Link Verification

| From               | To                | Via                                                | Status | Details |
| ------------------ | ----------------- | -------------------------------------------------- | ------ | ------- |
| src/main.js        | src/scenes/game.js| imports + scene("game") + go("game", seed)         | WIRED  | `main.js:12,26,28` |
| src/scenes/game.js | src/player.js     | imports + makePlayer(startX, startY)               | WIRED  | `game.js:18,48` |
| src/scenes/game.js | src/camera.js     | imports + followCamera(player) every frame         | WIRED  | `game.js:19,86` |
| src/scenes/game.js | player entity     | onCollide("checkpoint") + in-place respawn         | WIRED  | `game.js:63-65,72-90` |
| src/player.js      | src/config.js     | CONFIG.RUN_SPEED/MAX_FALL_SPEED/COYOTE/BUFFER/CUT  | WIRED  | `player.js:18,46,28,49,66,72` |
| src/camera.js      | src/config.js     | CONFIG.CAM_RATE/CAM_Y_FACTOR/LEVEL_*               | WIRED  | `camera.js:14,20,23,28-29` |

### Behavioral Spot-Checks

| Behavior                       | Command                              | Result | Status |
| ------------------------------ | ------------------------------------ | ------ | ------ |
| All 5 src files syntax-valid   | `node --check` x5                    | all OK | ✓ PASS |
| CONFIG exports all 14 tunables | grep keys in config.js               | 14/14  | ✓ PASS |
| All modules export expected sym| grep export X per file               | 4/4 OK | ✓ PASS |
| dt-correctness (no double-scale)| audit greps                          | clean  | ✓ PASS |
| Referenced commits exist       | `git cat-file -t` x6                 | 6/6 OK | ✓ PASS |
| Runtime feel (run/jump/camera) | requires served browser play         | n/a    | ? SKIP → human (MOVE-05) |

Note: This is a no-build-step browser game using vendored Kaplay 3001.0.19. There is no JS
test runner by project constraint; `node --check` is the project's syntax/build gate. Absence
of automated unit tests is the intended project model and is NOT a gap.

### Requirements Coverage

| Requirement | Source Plan | Description                                          | Status      | Evidence |
| ----------- | ----------- | ---------------------------------------------------- | ----------- | -------- |
| MOVE-01     | 08-01       | Run left/right with arrows + WASD                    | ✓ SATISFIED | player.js:43-46 |
| MOVE-02     | 08-01       | Jump with gravity, lands solidly on platforms        | ✓ SATISFIED | setGravity + body + merged floor + anti-tunnel cap |
| MOVE-03     | 08-02       | Variable height + coyote + jump buffering            | ✓ SATISFIED | player.js:49-73 (perceived feel in MOVE-05 human check) |
| MOVE-04     | 08-02       | Camera follows + clamps to level bounds              | ✓ SATISFIED | camera.js exp lerp + clamp; called in game.js |
| MOVE-05     | 08-03       | Frame-rate independent feel                          | ? NEEDS HUMAN | dt-correctness audit clean in code; throttled playthrough is the end-of-phase human gate |
| LEVEL-06    | 08-02       | Checkpoint respawn, progress preserved, no game-over | ✓ SATISFIED | checkpoints + in-place reset()/respawn, no go(), no lives/UI |

All 6 phase-08 requirement IDs from PLAN frontmatter are accounted for and match REQUIREMENTS.md
(lines 108-113, all marked Complete). No orphaned requirements: REQUIREMENTS.md maps exactly
MOVE-01..05 + LEVEL-06 to Phase 8, and every one appears in a plan's `requirements` field.

### Anti-Patterns Found

None. Scan of all 5 phase files for TODO/FIXME/XXX/TBD/HACK/PLACEHOLDER/"not yet
implemented"/"coming soon" returned no matches. The green placeholder rect and
near-invisible checkpoint markers are CONTEXT-specified intentional designs (real sprites
are an explicit Phase 9 deliverable), not stubs. No unreferenced debt markers.

### Human Verification Required

#### 1. MOVE-05 — Throttled / non-60Hz playthrough matches 60Hz baseline

**Test:** Serve src/ (`cd src && python3 -m http.server 8000`, open http://localhost:8000/).
Baseline at 60Hz: note run distance per ~1s Right-hold, full-hold jump peak height, and camera
follow feel; repeat coyote / buffer / variable-height checks. Then throttle (DevTools →
Rendering → FPS/CPU throttle, or a real 120/144Hz display) and re-run the SAME checks.
**Expected:** Run distance, jump height, and camera feel are identical across refresh rates —
not faster/slower, not floatier/heavier; jumps are not eaten; camera does not speed up; console
clean throughout.
**Why human:** Perceived frame-rate independence of feel cannot be observed by grep/syntax
checks. The underlying dt-correctness audit (no double dt-scale, no raw constant lerp, no
hand-rolled gravity) passes in code (truth 12 / Plan 03 Task 1); this gate confirms the feel
matches at runtime. This is the intentional end-of-phase human-verify item
(human_verify_mode: end-of-phase), correctly classified as human_needed rather than a gap.

While verifying MOVE-05, the human can also confirm the runtime-feel manual checks the plans
deferred (all code preconditions already VERIFIED above): MOVE-01 both-direction run, MOVE-02
solid landing + no seam-stick + no tunneling on the fast drop, MOVE-03 tap/hold/coyote/buffer,
MOVE-04 smooth jitter-free follow + no void at edges, LEVEL-06 respawn at last-touched
checkpoint with no game-over.

### Gaps Summary

No gaps. Every code-level must-have is present, substantive, and wired in the actual codebase
(verified file-by-file, not from SUMMARY claims). The movement spine — dt-correct run, weighted
jump with variable height / coyote / buffer, frame-rate-independent clamped camera, and the
gentle in-place checkpoint-respawn policy (no go(), no lives, no game-over) — is fully
implemented on the merged-floor + fast-drop-ledge + gaps stress strip. The single outstanding
item is the intentional MOVE-05 throttled-display human comparison, which sets the status to
`human_needed`. Once a human confirms the throttled playthrough matches 60Hz, the phase is
complete.

---

_Verified: 2026-06-24_
_Verifier: Claude (gsd-verifier)_
