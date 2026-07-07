// src/scenes/game.js — the platformer scene callback.
//
// This scene OWNS all run state in its closure (CONTEXT-locked anti-leak, RESEARCH
// Pitfall 5 — no module-level `let` for run state). It is seeded via the go() data payload.
//
// Phase 9 replaced the Phase 8 stress-test strip with one hand-authored level:
// the geometry now comes from buildLevel(level) (levels/build.js, loaded by id from the
// levels/index.js registry — Phase 13), and the player renders
// as a CC0 sprite. The Phase 8 spine is preserved verbatim — merged-floor colliders
// (anti seam-stick, Pitfall 2), the body({ maxVelocity }) anti-tunnel cap, the
// reposition-in-place reset()/respawn() (never game-over), the checkpoint
// last-touched promotion, and the clamped camera follow. Coin/spike/goal onCollide
// wiring is Plan 03 — buildLevel only CREATES those tagged entities here.
//
// scenes/ is one directory below src/, so sibling-module imports use `../`.
// Engine globals (add, onUpdate, setGravity, vec2, rect, pos, area, body, opacity,
// onCollide, tween, easings) come from Kaplay `global: true` — only our own modules
// are imported.

import { CONFIG } from "../config.js";
import { makePlayer } from "../player.js";
import { followCamera } from "../camera.js";
import { makeParallaxLayers, updateParallaxLayers } from "../parallax.js";
import { getLevel, LEVEL_ORDER } from "../levels/index.js";
import { buildLevel } from "../levels/build.js";
import { createBrain } from "../math/brain.js";
import { openMathGate } from "../ui/mathGate.js";
import { wireDoor } from "../mechanics/door.js";
import { wireGates } from "../mechanics/gates.js";
import { wireEnemy } from "../mechanics/enemy.js";
import { wireCollect } from "../mechanics/collect.js";
import { wireSecretAlcove } from "../mechanics/secretAlcove.js";
import { createProgress, loadSave, writeSave } from "../progress.js";
import { mountHud } from "../ui/hud.js";
import * as fx from "../fx.js"; // engine-side juice (coin pop + clear burst) — JUICE-02/03

export function gameScene(data) {
  // Engine gravity for this scene (px/s^2). Set once on scene entry.
  setGravity(CONFIG.GRAVITY);

  // ALL run state lives HERE (closure), seeded via the go() data payload with default
  // guards. lastCheckpoint is the respawn point — seeded at the start position and
  // updated to the last-touched checkpoint marker (the policy Phase 9 hazards reuse).
  const startX = data?.startX ?? 64;
  const startY = data?.startY ?? 64;
  let lastCheckpoint = vec2(startX, startY);

  // Coin tally for THIS run — closure-local (anti-leak: never a module-level
  // `let`, which would persist across go()/respawn). Count only; NO XP (Phase 11)
  // and NO juice/sfx (Phase 12) here — those phases attach later.
  let coinsCollected = 0;

  // Goal fire-once guard — closure-local (same anti-leak contract). onCollide fires
  // every overlap frame; this latches so onReachGoal() runs EXACTLY once.
  let goalReached = false;

  // Handle for the clear->select transition tween (see onReachGoal's onClear below).
  // Closure-local, same anti-leak contract as player._fxScaleTween in fx.js: if the
  // player mashes Escape during the celebratory pause, the Escape handler's go("select")
  // fires first and this in-flight tween would otherwise survive scene teardown and call
  // go("select") a SECOND time ~400ms later, resetting the select screen out from under
  // the player. Cancelled in the onSceneLeave sweep below alongside the fx tween.
  let clearTransitionTween = null;

  // --- Progression load + seed (Phase 11, SAVE-01/02/03) ---
  // Load the validated save ONCE on scene entry (guarded — defaults under node/blocked
  // storage; never throws). Construct the progression tracker and the brain from it, ALL
  // closure-local (same anti-leak discipline as coinsCollected: never module-level). The
  // brain is seeded from BOTH saved accuracy AND history so a returning session resumes
  // weak-spot weighting AND mastery drill-reduction (SAVE-03). Run/session state (coins,
  // goalReached, position) is NEVER part of the save — only xp/level/accuracy/history.
  const saved = loadSave();
  const progress = createProgress(saved);

  // Load the level to play by id from the registry (SAVE-06/LVL-02 spine). The go() data
  // payload may carry a levelId (Phase 14's level-select); default to the first level.
  // getLevel is forgiving — an unknown id falls back to LEVEL_ORDER[0], never crashes
  // (T-13-10). This phase adds NO scenes; it only proves the data spine loads/plays/persists.
  const level = getLevel(data?.levelId ?? LEVEL_ORDER[0]);

  // Level bounds for camera follow + parallax tiling. TWO conventions coexist (both
  // shipped): if the descriptor carries an explicit `bounds` field it is used AS-IS
  // (level-02+ — remember to bump bounds.right when extending such a level!); otherwise
  // the right edge is DERIVED from the authored geometry below and left/top/bottom fall
  // back to the CONFIG defaults (level-01).
  const levelRight = Math.max(
    ...level.geometry.floors.map((f) => f.x + f.w),
    ...level.geometry.platforms.map((p) => p.x + p.w),
    level.geometry.goal.x + CONFIG.GOAL_SIZE,
  );
  const bounds = level.bounds ?? {
    left: CONFIG.LEVEL_LEFT,
    right: levelRight,
    top: CONFIG.LEVEL_TOP,
    bottom: CONFIG.LEVEL_BOTTOM,
  };

  // The brain is seeded from saved accuracy/history (SAVE-03) AND given the level's
  // allowedTables pool — the difficulty seam WIRED (not enforced; Phase 16 owns enforcement).
  const brain = createBrain({
    seedAccuracy: saved.accuracy,
    seedHistory: saved.history,
    allowedTables: level.allowedTables,
  });

  // The HUD reads the loaded XP/level and renders a camera-immune screen-space overlay
  // (SAVE-04). One-way: the HUD reads progress, never writes back. Mounted closure-local
  // so it tears down with the scene on replay. refresh() shows loaded progress immediately.
  const hud = mountHud(progress);
  hud.refresh();

  // --- Authored level body ---
  // buildLevel emits the merged-floor + platform colliders, the visual ground
  // tiles, and the tagged coin/spike/goal area() entities. It runs BEFORE the
  // player so the player spawns onto solid ground.
  buildLevel(level);

  // --- Parallax background (Phase 18 ART-03) ---
  // Camera-driven layers below gameplay z-order; created after the level so
  // bounds are known and before the player so the player draws on top.
  const parallaxLayers = makeParallaxLayers(bounds);

  // --- Player ---
  // The coyote/buffer/variable-height jump now lives inside makePlayer (Plan 02).
  // The Plan 01 basic grounded jump was removed so there is exactly ONE jump path.
  const player = makePlayer(startX, startY);

  // --- Checkpoints (last-touched marker = respawn point) ---

  // Lightweight near-invisible marker entity; touching it sets the respawn point.
  // Under ?debug=1 (same flag build.js reads — see its debug-overlay comment) the
  // marker renders faintly so checkpoint placement is inspectable during playtests.
  const DEBUG =
    typeof location !== "undefined" && new URLSearchParams(location.search).has("debug");
  function addCheckpoint(x, y) {
    return add([rect(8, 48), pos(x, y), area(), opacity(DEBUG ? 0.5 : 0.001), "checkpoint"]);
  }

  // Place markers from the authored level data: one near the start and one just
  // before each spike (a respawn never costs meaningful progress — ADHD-safe).
  for (const cp of level.geometry.checkpoints) {
    addCheckpoint(cp.x, cp.y);
  }

  // Touching a checkpoint promotes it to the respawn point.
  player.onCollide("checkpoint", (c) => {
    lastCheckpoint = c.pos.clone();
  });

  // --- Respawn (reposition-in-place; NO go() — progress preserved, ADHD-safe) ---

  // reset() is the named anti-leak contract (CONTEXT line 45 / RESEARCH line 22):
  // reposition the player to the last-touched checkpoint, zero momentum, quick flash.
  // No game-over UI, no lives counter — instant control return.
  function reset() {
    player.pos = lastCheckpoint.clone();
    player.vel = vec2(0); // kill momentum so we cannot re-trigger the fall threshold
    // Quick flash: blink to near-invisible, then tween opacity back to full.
    player.opacity = 0.2;
    tween(0.2, 1, 0.18, (v) => (player.opacity = v), easings.easeOutQuad);
  }

  // respawn() is the fall-off-world caller; it delegates to the reset() contract.
  const respawn = reset;

  // --- Interactable collisions (Plan 03) ---
  // The "coin"/"spike"/"goal" tagged area() entities ALREADY EXIST — buildLevel(level)
  // (Plan 02, above) created them, including the tightened spike area({shape,offset})
  // hitbox. This plan ONLY attaches handlers via the repo's one collision idiom
  // (player.onCollide("<tag>", ...) — same as the checkpoint promotion above). It does
  // NOT create entities and does NOT touch the spike collider shape.

  // Coins (LEVEL-04): collecting one removes that coin and bumps the closure tally.
  // Count only — no XP (Phase 11), no juice/sfx (Phase 12).
  player.onCollide("coin", (c) => {
    coinsCollected += 1;
    fx.pop(c.pos.clone()); // JUICE-02: neon-green pop at the coin's spot (clone: pos is live, c is about to be destroyed); count unaffected, no "+1" text
    destroy(c);
  });

  // Spikes (LEVEL-05): route into the EXISTING Phase 8 respawn() seam
  // (reposition-in-place, zero momentum, quick flash). A generous checkpoint sits
  // just before each spike (seeded from level.geometry.checkpoints above) so a respawn never
  // costs meaningful progress. This is the gentle checkpoint policy — no failure
  // construct of any kind is introduced (CONTEXT-locked, ADHD-safe).
  player.onCollide("spike", () => respawn());

  // Goal (LEVEL-07): the SINGLE-POINT handoff seam. This is the one clean call site
  // Phase 10's math gate attaches to — it replaces the STUB BODY below, nowhere else.
  // There is exactly ONE onReachGoal function and ONE goal-collision wiring (Pitfall 5).
  function onReachGoal() {
    if (goalReached) return; // fire-once: ignore every subsequent overlap frame
    goalReached = true;

    // Freeze the level while the gate is open. Zero velocity BEFORE pausing
    // (consistent with reset()'s `player.vel = vec2(0)`): running into the goal leaves
    // vel.x = +RUN_SPEED, and `paused` freezes body() integration without clearing it —
    // a stale non-zero velocity would cause an immediate lurch if the player is ever
    // unpaused on resume.
    player.vel = vec2(0); // clean stop — no residual momentum to inherit
    player.paused = true; // halts the player's onUpdate (movement) — gentle freeze

    // SINGLE scene-to-gate bridge (GATE-03): hand the closure-local brain to the gate.
    // The gate renders the in-world question over the dimmed/paused level and calls
    // onClear() exactly once on a correct answer (its own fire-once latch, Plan 02).
    openMathGate({
      brain,
      onClear({ table }) {
        // GATE-03: correct -> the level is cleared. The gate already shows its own
        // "LEVEL CLEAR" banner (Plan 02); the scene's side of "cleared" is simply that
        // the player stays frozen. Single level: no go() to a next level.

        // Award XP for the cleared table (SAVE-01); addXp returns true on a level-up.
        // The gate carried `table` (q.a) — the gate itself awards NO XP (forgiving).
        const leveledUp = progress.addXp(table);

        // Mark THIS level cleared (SAVE-06) so the per-level cleared fact persists in the
        // SAME write as the XP below (one atomic save; unlock is derived in the registry,
        // never stored). progress.serialize now includes the levels map (Plan 02).
        progress.markCleared(level.id);

        // One-way HUD update, then flash on a level-up (SAVE-04).
        hud.refresh();
        if (leveledUp) hud.flashLevelUp();

        // JUICE-03: a brief, NON-STROBING celebratory burst LAYERED on the existing clear
        // moment (the gate's "LEVEL CLEAR" banner + the level-up flash above). It enhances,
        // never replaces — the gate banner (mathGate.js) and flashLevelUp() are untouched.
        fx.clearBurst();

        // Persist on each clear (SAVE-02): xp/level + the brain's accuracy/history
        // snapshot. Run/session state (coins, goalReached, position) is NEVER serialized.
        // writeSave is guarded (no-op under blocked storage; never throws into the loop).
        writeSave(progress.serialize(brain.snapshot()));

        // NAV-03: after the persist, RETURN to level-select — no auto-advance into the
        // next level. go() was previously called SYNCHRONOUSLY right here, in the same
        // tick as the gate's "LEVEL CLEAR" banner add() above (mathGate.js) and
        // fx.clearBurst() — the scene tore itself down before the browser ever painted
        // a frame, so the celebration was never actually visible (found during real-browser
        // NAV-04 verification). This does NOT use wait()/setTimeout/loop() (still banned by
        // SAFE-01 / check-safety.sh) — it reuses the SAME tween().onEnd self-clean idiom as
        // fx.js, deferring only the scene transition for CONFIG.FX.BURST_MS (the same
        // non-strobing ≤400-500ms flash-cap duration the burst itself already respects) so
        // the banner + burst get their one on-screen beat. This is a celebratory pause the
        // player already cleared the level to earn, not a punishing wait during play.
        clearTransitionTween = tween(0, 1, CONFIG.FX.BURST_MS / 1000, () => {}, easings.linear);
        clearTransitionTween.onEnd(() => {
          clearTransitionTween = null;
          go("select");
        });
      },
    });
  }
  player.onCollide("goal", onReachGoal);

  // Phase 15 MECH-02 wiring: every "door" entity routes through the shared challenge seam.
  wireDoor({ player, brain });

  // Phase 16 MECH-03/04/05 wiring: collect zone, checkpoint gates, and enemy each use the
  // same shared challenge seam and the same closure-local brain instance.
  wireGates({ player, brain });
  wireEnemy({ player, brain });
  wireCollect({ player, brain });

  // LVL-06: the secret XP alcove is the ONLY mechanic call site wired with `progress`
  // instead of `brain` — it awards a flat XP bonus, never opens a challenge. `hud` is
  // passed so the bonus visibly moves the XP bar (fix: was silently updating progress
  // with no on-screen feedback — found via manual playtest).
  wireSecretAlcove({ player, progress, hud });

  // --- Escape → level-select (NAV-03 agency) ---
  // Lets her bail back to select mid-level with no forced replay of earlier levels.
  // Registered in the scene body (not module top level); go() auto-clears this
  // controller in Kaplay 3001, so no manual cancel is needed. No timer, no persistence.
  onKeyPress("escape", () => go("select"));

  // --- Per-frame scene update ---
  onUpdate(() => {
    // Frame-rate-independent camera follow, clamped to level bounds (MOVE-04).
    // Per-level bounds let longer levels grow beyond CONFIG.LEVEL_RIGHT without a global change.
    followCamera(player, bounds);

    // Parallax layers track the camera X only (Phase 18 ART-03). No timers.
    updateParallaxLayers(parallaxLayers, getCamPos().x, bounds);

    // Fall-off-world: respawn at the last-touched checkpoint (LEVEL-06).
    // NOTE: this deliberately reads the GLOBAL CONFIG.LEVEL_BOTTOM, not the per-level
    // `bounds.bottom` above — correct while every level keeps its play space above
    // y=360 (all 8 shipped levels do). If a future level ever has play area BELOW
    // the standard floor band, switch this to bounds.bottom or it will respawn-loop.
    if (player.pos.y > CONFIG.LEVEL_BOTTOM + CONFIG.FALL_MARGIN) {
      respawn();
    }
  });

  // --- Persist on tab-hide (SAVE-02) ---
  // onHide() wraps the document visibilitychange event. This captures accuracy drift from
  // wrong attempts before the tab closes — the gate clears persist on the correct branch,
  // but a session can hide mid-question after wrong picks have moved the EWMA. writeSave is
  // guarded (try-catch inside). NO timer-based autosave (SAFE-01): save only on the
  // clear event and on hide. Run/session state is never serialized here either.
  //
  // ANTI-LEAK (WR-02): onHide registers on the APP-GLOBAL event bus, not the scene's
  // local handler set, so it is NOT torn down by the scene's tag-destroy cleanup and the
  // returned canceller must be cancelled explicitly — same discipline mathGate.js uses for
  // its global key controllers. Without this, any future scene re-entry (level select,
  // "play again", restart) would stack another permanent listener, each closing over a
  // dead scene's progress/brain, so a later listener could overwrite the live save with a
  // stale snapshot on tab-hide. Cancel it on scene leave so it can never outlive the scene.
  const hideCtrl = onHide(() => writeSave(progress.serialize(brain.snapshot())));
  onSceneLeave(() => hideCtrl.cancel());

  // ANTI-LEAK (JUICE belt-and-braces): every fx.js transient is already tagged "fx" and
  // self-destroys on tween().onEnd(destroy), and tagged scene objects are torn down on
  // replay. This sweeps any effect still mid-tween at the moment the scene leaves so none
  // can ever survive a go()/respawn. No timer — a one-shot teardown on the scene-leave event.
  //
  // WR-03: the player squash/stretch scale tweens (fx.js) are NOT "fx"-tagged objects —
  // they drive the player's own scale via a handle on player._fxScaleTween — so the
  // destroyAll("fx") sweep does not reach them. On any future scene leave (play again /
  // level select) an in-flight scale tween would survive and keep calling scaleTo() on the
  // now-destroyed player. Cancel it here alongside the sweep so no tween outlives the player.
  onSceneLeave(() => {
    destroyAll("parallax");
    destroyAll("fx");
    if (player.exists() && player._fxScaleTween) player._fxScaleTween.cancel();
    if (clearTransitionTween) clearTransitionTween.cancel();
  });
}
