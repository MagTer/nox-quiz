// src/scenes/game.js — the platformer scene callback.
//
// This scene OWNS all run state in its closure (CONTEXT-locked anti-leak, RESEARCH
// Pitfall 5 — no module-level `let` for run state). It is seeded via the go() data payload.
//
// Phase 9 replaced the Phase 8 stress-test strip with one hand-authored level:
// the geometry now comes from buildLevel(LEVEL) (level.js), and the player renders
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
import { LEVEL, buildLevel } from "../level.js";
import { createBrain } from "../math/brain.js";
import { openMathGate } from "../ui/mathGate.js";
import { createProgress, loadSave, writeSave } from "../progress.js";
import { mountHud } from "../ui/hud.js";

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

  // Level-clear flag — closure-local (same anti-leak contract). Set by the gate's
  // onClear hook on a correct answer (GATE-03). A simple scene-side "cleared" marker;
  // Phase 11 reads/extends this hook for XP, Phase 12 polishes the celebration.
  let levelCleared = false;

  // --- Progression load + seed (Phase 11, SAVE-01/02/03) ---
  // Load the validated save ONCE on scene entry (guarded — defaults under node/blocked
  // storage; never throws). Construct the progression tracker and the brain from it, ALL
  // closure-local (same anti-leak discipline as coinsCollected: never module-level). The
  // brain is seeded from BOTH saved accuracy AND history so a returning session resumes
  // weak-spot weighting AND mastery drill-reduction (SAVE-03). Run/session state (coins,
  // goalReached, position) is NEVER part of the save — only xp/level/accuracy/history.
  const saved = loadSave();
  const progress = createProgress(saved);
  const brain = createBrain({
    seedAccuracy: saved.accuracy,
    seedHistory: saved.history,
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
  buildLevel(LEVEL);

  // --- Player ---
  // The coyote/buffer/variable-height jump now lives inside makePlayer (Plan 02).
  // The Plan 01 basic grounded jump was removed so there is exactly ONE jump path.
  const player = makePlayer(startX, startY);

  // --- Checkpoints (last-touched marker = respawn point) ---

  // Lightweight near-invisible marker entity; touching it sets the respawn point.
  function addCheckpoint(x, y) {
    return add([rect(8, 48), pos(x, y), area(), opacity(0.001), "checkpoint"]);
  }

  // Place markers from the authored level data: one near the start and one just
  // before each spike (a respawn never costs meaningful progress — ADHD-safe).
  for (const cp of LEVEL.checkpoints) {
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
  // The "coin"/"spike"/"goal" tagged area() entities ALREADY EXIST — buildLevel(LEVEL)
  // (Plan 02, above) created them, including the tightened spike area({shape,offset})
  // hitbox. This plan ONLY attaches handlers via the repo's one collision idiom
  // (player.onCollide("<tag>", ...) — same as the checkpoint promotion above). It does
  // NOT create entities and does NOT touch the spike collider shape.

  // Coins (LEVEL-04): collecting one removes that coin and bumps the closure tally.
  // Count only — no XP (Phase 11), no juice/sfx (Phase 12).
  player.onCollide("coin", (c) => {
    coinsCollected += 1;
    destroy(c);
  });

  // Spikes (LEVEL-05): route into the EXISTING Phase 8 respawn() seam
  // (reposition-in-place, zero momentum, quick flash). A generous checkpoint sits
  // just before each spike (seeded from LEVEL.checkpoints above) so a respawn never
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
        levelCleared = true;

        // Award XP for the cleared table (SAVE-01); addXp returns true on a level-up.
        // The gate carried `table` (q.a) — the gate itself awards NO XP (forgiving).
        const leveledUp = progress.addXp(table);

        // One-way HUD update, then flash on a level-up (SAVE-04).
        hud.refresh();
        if (leveledUp) hud.flashLevelUp();

        // Persist on each clear (SAVE-02): xp/level + the brain's accuracy/history
        // snapshot. Run/session state (coins, goalReached, position) is NEVER serialized.
        // writeSave is guarded (no-op under blocked storage; never throws into the loop).
        writeSave(progress.serialize(brain.snapshot()));
      },
    });
  }
  player.onCollide("goal", onReachGoal);

  // --- Per-frame scene update ---
  onUpdate(() => {
    // Frame-rate-independent camera follow, clamped to level bounds (MOVE-04).
    followCamera(player);

    // Fall-off-world: respawn at the last-touched checkpoint (LEVEL-06).
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
}
