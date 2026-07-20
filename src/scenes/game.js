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
import { openMathGate, renderLevelClearBanner } from "../ui/mathGate.js";
import { wireDoor } from "../mechanics/door.js";
import { wireGates } from "../mechanics/gates.js";
import { wireEnemy } from "../mechanics/enemy.js";
import { wireSecretAlcove } from "../mechanics/secretAlcove.js";
import { wireKey } from "../mechanics/key.js";
import { createProgress, loadSave, writeSave } from "../progress.js";
import { mountHud } from "../ui/hud.js";
import { mountTouchControls } from "../ui/touchControls.js"; // MOB-02: on-screen virtual buttons (coarse-pointer only; desktop no-op)
import * as input from "../input.js"; // the ONE input seam (37-03) — reset() on scene leave clears held-state + jump callbacks (anti-leak)
import * as fx from "../fx.js"; // engine-side juice (coin pop + clear burst) — JUICE-02/03
import * as audio from "../audio.js"; // per-scene mute UI + belt-and-braces music re-assert (AUD-02/AUD-03)

export function gameScene(data) {
  // Engine gravity for this scene (px/s^2). Set once on scene entry.
  setGravity(CONFIG.GRAVITY);

  // AUD-03: re-register the M-key + mute icon fresh for this scene — the game scene is
  // entered/re-entered on every level play (and every respawn-via-select-and-back-in), so
  // this must run on every gameScene() call, not once. go() clears the app-wide input bus
  // on every scene transition. AUD-02 belt-and-braces: ensureMusicPlaying() is a no-op if
  // music is already playing (the normal case).
  audio.wireAudioUI();
  audio.ensureMusicPlaying();

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

  // Key-held run-state (KEY-01; Phase 34.5) — closure-local (same anti-leak
  // contract: never module-level). WR-01: tracked as a Set of held keyIds (not
  // a single boolean) so a future multi-lock level's distinct key-lock pairs
  // are correctly gated by identity — picking up one key no longer opens every
  // lock. Keys/locks with no keyId (today's single-pair level-02 case) share
  // KEY_DEFAULT_ID, so that case behaves EXACTLY as before: any key opens the
  // one lock. Flipped by wireKey's onPickup callback and read by its hasKey()
  // callback to decide whether a lock opens or shows a hint. Survives
  // respawn() automatically (reposition-in-place, no go()) and is NEVER
  // serialized — resets only on a full scene re-entry, which is correct (a new
  // run starts without any key).
  const KEY_DEFAULT_ID = "__default__";
  const heldKeyIds = new Set();

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

  // WR-01 (Phase 34.6): arm the end math-gate SKIP only on a genuine math-skip level —
  // one that places a key AND has no lock. Phase 34.5's physical LOCK half of wireKey is
  // still live and shares the SAME heldKeyIds set, so a future level authored with BOTH a
  // key and a lock would otherwise silently skip its end math gate just from collecting the
  // lock's key (defeating the lock as a mid-level barrier on an otherwise math-required
  // level). Gating the skip on this closure-local flag (never a module-level `let`) keeps
  // today's keys-no-locks math-skip levels (02/04/06/08) skipping, while a hypothetical
  // key+lock level correctly still requires its end math. Computed once at wire time.
  const endSkipArmed =
    (level.geometry.keys?.length ?? 0) > 0 && (level.geometry.locks?.length ?? 0) === 0;

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

  // --- MECH-05: persistent alcove-linked ambient light (Phase 36) ---
  // buildLevel tagged the light-source prop nearest a secret alcove "alcove-light" and
  // started it DIM (its dt-sine flicker rides a per-light `litLevel` baseline). lightAmbient()
  // BRIGHTENS every such light — a tween that raises litLevel DIM -> 1 and LEAVES it there
  // (self-completing like fx.js one-shots; NO reverse, NO scheduler). Positive-only: nothing
  // is ever dimmed or removed. Engine refs (get, tween, easings) live INSIDE this scene body
  // (a727c13). A level with no light near its alcove no-ops (get returns []). The brighten is
  // driven ONLY here — via onDiscover (a genuinely new secret) OR the derived entry call below.
  function lightAmbient() {
    for (const light of get("alcove-light")) {
      // Single-flight (fx.js idiom): cancel any in-flight brighten so an entry-tween and a
      // later discovery can't double-drive the same light. The handle lives ON the object
      // (no module-level state — anti-leak); the tween always ends at 1, so an interrupted
      // brighten still resolves fully lit.
      if (light._alcoveTween) light._alcoveTween.cancel();
      light._alcoveTween = tween(
        light.litLevel ?? 1,
        1,
        CONFIG.AMBIENT.ALCOVE_MS / 1000,
        (v) => {
          light.litLevel = v;
        },
        easings.easeOutQuad,
      );
      light._alcoveTween.onEnd(() => {
        light._alcoveTween = null;
      });
    }
  }

  // Lit-on-entry is DERIVED from the existing persisted fact (progress.hasSecretFound) — NOT a
  // new stored flag (mirrors the derived-unlock convention). A level whose secret was found in
  // a prior run renders its linked light ALREADY lit on re-entry. On a fresh (never-found)
  // level this is skipped, so the light stays DIM until onDiscover fires during play.
  if (progress.hasSecretFound(level.id)) lightAmbient();

  // --- Parallax background (Phase 18 ART-03; biome-driven since Phase 32 Plan 04) ---
  // Camera-driven layers below gameplay z-order; created after the level so
  // bounds are known and before the player so the player draws on top.
  const parallaxLayers = makeParallaxLayers(bounds, level.biome);

  // --- Player ---
  // The coyote/buffer/variable-height jump now lives inside makePlayer (Plan 02).
  // The Plan 01 basic grounded jump was removed so there is exactly ONE jump path.
  const player = makePlayer(startX, startY);

  // --- MOB-02: on-screen touch controls (Phase 37-06) ---
  // Mount the virtual left/right/jump buttons that feed the SAME input.js seam player.js
  // reads (setLeftHeld/setRightHeld + fireJumpPress/fireJumpRelease) — so touch reuses the
  // LOCKED coyote/buffer/variable-height jump, never a parallel path. The module SELF-GATES
  // on matchMedia("(pointer: coarse)"), so on desktop (fine pointer) this is a harmless no-op
  // that draws nothing → browser-boot stays byte-identical. Challenge-pause-aware: the getter
  // below hands the module the SAME freeze the keyboard respects (player.paused halts the
  // player's onUpdate while the math gate is open), so the buttons never set held-state while
  // the run is frozen. Mounted AFTER makePlayer so the getter can read the live player.
  const touchControls = mountTouchControls(() => player.paused);

  // --- Checkpoints (last-touched marker = respawn point) ---

  // Lightweight near-invisible marker entity; touching it sets the respawn point.
  // Under ?debug=1 (same flag build.js reads — see its debug-overlay comment) the
  // marker renders faintly so checkpoint placement is inspectable during playtests.
  const DEBUG =
    typeof location !== "undefined" && new URLSearchParams(location.search).has("debug");

  // --- Debug coordinate readout (?debug=1 ONLY; quick 2026-07-20 play-test request:
  // "it would be good to see coordinates to describe the location of issues") ---
  // A fixed() screen-space line showing the player's world x,y and the world coordinate
  // under the mouse cursor — hover a problem spot and read its coords straight off the
  // screen. toWorld(mousePos()) maps through the camera transform, and Kaplay's own
  // offsetX/offsetY mouse mapping already accounts for the 1.5x CSS display scale (the
  // main.js transform:scale rule), so the numbers are true world-space. Updated via
  // `onUpdate` only (SAFE-01, no scheduler); display-only (no area()/body(), never added
  // outside ?debug=1) so gameplay and the audit harness are untouched. All layout numbers
  // live in CONFIG.DEBUG_READOUT (binding rule: no magic numbers here).
  if (DEBUG) {
    const readout = add([
      text("", { size: CONFIG.DEBUG_READOUT.SIZE }),
      pos(CONFIG.DEBUG_READOUT.X, CONFIG.DEBUG_READOUT.Y),
      fixed(), // screen-space — never scrolls with the camera
      z(CONFIG.DEBUG_READOUT.Z),
      color(CONFIG.PALETTE.TEXT[0], CONFIG.PALETTE.TEXT[1], CONFIG.PALETTE.TEXT[2]),
    ]);
    readout.onUpdate(() => {
      const mw = toWorld(mousePos());
      readout.text =
        `player ${Math.round(player.pos.x)},${Math.round(player.pos.y)}` +
        `  mouse ${Math.round(mw.x)},${Math.round(mw.y)}`;
    });
  }

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

  // Patrollers (MOT-01; Phase 36): the gentle respawn-hazard class — touching a
  // moving "patroller" (built distinctly from the "enemy" math-blocker in build.js)
  // routes into the EXACT same respawn() seam as spikes above. Reposition-in-place,
  // zero momentum, quick flash — ZERO hurt/score/game-over/HP/timer (CONTEXT-locked,
  // ADHD-safe). Movers need NO wire here: the engine's body() stickToPlatform carries
  // the rider automatically.
  player.onCollide("patroller", () => respawn());

  // clearLevel(): the SINGLE shared level-clear body (Phase 34.6, extracted from the
  // former onClear inline block — Pitfall 5: XP path divergence). BOTH end-gate paths
  // call this, and only this, for markCleared/hud/burst/save/transition so they can
  // never drift apart:
  //   - math path (openMathGate's onClear): called with { table } — the answered
  //     question's operand (q.a) — and awards the existing table-banded XP.
  //   - key path (onReachGoal's heldKeyIds branch, below): called with {} (no table)
  //     — there is no answered question, so it awards a flat "full credit, no penalty"
  //     amount via the explicit-amount API (CONFIG.PROGRESS.XP_KEY_SKIP), never a
  //     fabricated table number routed through addXp.
  // The cleared-fact mark + save write live ONLY here — unlock derivation and
  // persistence cannot silently fire on one path and not the other.
  function clearLevel({ table } = {}) {
    // GATE-03: correct (math path) or key-skip (key path) -> the level is cleared. The
    // scene's side of "cleared" is simply that the player stays frozen. Single level: no
    // go() to a next level.

    // WR-02: render the "LEVEL CLEAR" banner + clear sfx from the ONE shared helper here,
    // so it fires EXACTLY ONCE per clear on BOTH paths (math via openMathGate's onSuccess
    // -> onClear, key via onReachGoal's endSkip branch -> clearLevel). Folding it into the
    // shared body was the last un-shared piece of the clear moment: neither caller renders
    // its own banner anymore, so the two presentations can never drift.
    renderLevelClearBanner();

    // Award XP: the math path passes the answered table (SAVE-01, addXp bands
    // XP_EASY/XP_HARD); the key path passes no table, so it awards the flat
    // full-credit amount via addBonusXp — the explicit-amount API that exists
    // specifically so this never needs a fabricated table. Either branch returns
    // true on a level-up.
    const leveledUp =
      table !== undefined ? progress.addXp(table) : progress.addBonusXp(CONFIG.PROGRESS.XP_KEY_SKIP);

    // Mark THIS level cleared (SAVE-06) so the per-level cleared fact persists in the
    // SAME write as the XP above (one atomic save; unlock is derived in the registry,
    // never stored). progress.serialize now includes the levels map (Plan 02).
    progress.markCleared(level.id);

    // One-way HUD update, then flash on a level-up (SAVE-04).
    hud.refresh();
    if (leveledUp) hud.flashLevelUp();

    // JUICE-03: a brief, NON-STROBING celebratory burst LAYERED on the existing clear
    // moment (the caller's "LEVEL CLEAR" banner + the level-up flash above). It enhances,
    // never replaces — the banner and flashLevelUp() are untouched.
    fx.clearBurst();

    // Persist on each clear (SAVE-02): xp/level + the brain's accuracy/history
    // snapshot. Run/session state (coins, goalReached, position) is NEVER serialized.
    // writeSave is guarded (no-op under blocked storage; never throws into the loop).
    writeSave(progress.serialize(brain.snapshot()));

    // NAV-03: after the persist, RETURN to level-select — no auto-advance into the
    // next level. go() was previously called SYNCHRONOUSLY right here, in the same
    // tick as the caller's "LEVEL CLEAR" banner add() and fx.clearBurst() — the scene
    // tore itself down before the browser ever painted a frame, so the celebration was
    // never actually visible (found during real-browser NAV-04 verification). This does
    // NOT use wait()/setTimeout/loop() (still banned by SAFE-01 / check-safety.sh) — it
    // reuses the SAME tween().onEnd self-clean idiom as fx.js, deferring only the scene
    // transition for CONFIG.FX.BURST_MS (the same non-strobing ≤400-500ms flash-cap
    // duration the burst itself already respects) so the banner + burst get their one
    // on-screen beat. This is a celebratory pause the player already cleared the level
    // to earn, not a punishing wait during play.
    clearTransitionTween = tween(0, 1, CONFIG.FX.BURST_MS / 1000, () => {}, easings.linear);
    clearTransitionTween.onEnd(() => {
      clearTransitionTween = null;
      go("select");
    });
  }

  // Goal (LEVEL-07): the SINGLE-POINT handoff seam. This is the one clean call site
  // Phase 10's math gate attaches to — it replaces the STUB BODY below, nowhere else.
  // There is exactly ONE onReachGoal function and ONE goal-collision wiring (Pitfall 5).
  function onReachGoal() {
    if (goalReached) return; // fire-once: ignore every subsequent overlap frame
    goalReached = true;

    // MOT-03: a small one-shot "unlock" POP on the goal flag at the reach moment — a single
    // self-cleaning easeOutQuad scale tween that grows to UNLOCK_SCALE then settles back to 1
    // via a sin arc (peak at midpoint), then .onEnd restores neutral. tween().onEnd ONLY —
    // never a scheduler (SAFE-01). Purely cosmetic (goalReached latches it to fire once); the
    // "goal"-tagged collider is untouched. The flag has no scale() comp by default, so add one
    // with use() before tweening (engine refs inside the scene body — a727c13).
    for (const flag of get("goalflag")) {
      flag.use(scale(1));
      tween(
        0,
        1,
        CONFIG.AMBIENT.UNLOCK_MS / 1000,
        (v) => {
          const s = 1 + (CONFIG.AMBIENT.UNLOCK_SCALE - 1) * Math.sin(v * Math.PI);
          flag.scaleTo(s, s);
        },
        easings.easeOutQuad,
      ).onEnd(() => {
        if (flag.exists()) flag.scaleTo(1, 1);
      });
    }

    // Freeze the level while the gate is open. Zero velocity BEFORE pausing
    // (consistent with reset()'s `player.vel = vec2(0)`): running into the goal leaves
    // vel.x = +RUN_SPEED, and `paused` freezes body() integration without clearing it —
    // a stale non-zero velocity would cause an immediate lurch if the player is ever
    // unpaused on resume.
    player.vel = vec2(0); // clean stop — no residual momentum to inherit
    player.paused = true; // halts the player's onUpdate (movement) — gentle freeze

    // KEY-02/LEN-02 (Phase 34.6): a held math-skip key clears the level directly,
    // WITHOUT opening the end math challenge — "full credit, no penalty" per
    // 34.6-CONTEXT.md. Odd/keyless levels place no keys, so heldKeyIds stays empty
    // and this branch always falls through to the unchanged math path below. WR-01:
    // the skip is armed ONLY on a math-skip level (endSkipArmed = key AND no lock),
    // so collecting a mid-level lock's key never skips a lock-bearing level's end math.
    if (endSkipArmed && heldKeyIds.size > 0) {
      // The math path never runs here — the shared clearLevel() (below) renders the
      // "LEVEL CLEAR" banner + clear sfx via renderLevelClearBanner() EXACTLY as the math
      // path does (WR-02), so the celebration + "gate-cleared" marker appear identically
      // on the key-skip path with no duplicated banner code here.
      clearLevel({}); // no table -> full-XP key-skip path (CONFIG.PROGRESS.XP_KEY_SKIP)
      return;
    }

    // SINGLE scene-to-gate bridge (GATE-03): hand the closure-local brain to the gate.
    // The gate renders the in-world question over the dimmed/paused level and calls
    // onClear() exactly once on a correct answer (its own fire-once latch, Plan 02),
    // carrying { table } (q.a) into the shared clearLevel() above.
    openMathGate({ brain, onClear: clearLevel });
  }
  player.onCollide("goal", onReachGoal);

  // Phase 15 MECH-02 wiring: every "door" entity routes through the shared challenge seam.
  wireDoor({ player, brain });

  // Phase 16 MECH-04/05 wiring: checkpoint gates and enemy each use the same shared
  // challenge seam and the same closure-local brain instance.
  wireGates({ player, brain });
  wireEnemy({ player, brain });

  // LVL-06: the secret XP alcove is the ONLY mechanic call site wired with `progress`
  // instead of `brain` — it awards a flat XP bonus, never opens a challenge. `hud` is
  // passed so the bonus visibly moves the XP bar (fix: was silently updating progress
  // with no on-screen feedback — found via manual playtest). `save` mirrors the
  // goal-clear persist pattern below (writeSave(progress.serialize(brain.snapshot())))
  // so a secret found and then Escaped away from (NAV-03, which does not itself save)
  // is not silently lost (CR-02).
  wireSecretAlcove({
    player,
    progress,
    hud,
    levelId: level.id,
    save: () => writeSave(progress.serialize(brain.snapshot())),
    // MECH-05: discovering the secret permanently brightens the linked dark light for the
    // rest of the run (positive-only). Fired once, only on a genuinely new secret.
    onDiscover: () => lightAmbient(),
  });

  // KEY-01 (Phase 34.5): the key/lock mechanic — the game's FIRST non-math gate.
  // onPickup adds the touched key's id (or the shared default) to the
  // closure-local heldKeyIds run-state (above); hasKey checks membership for the
  // SPECIFIC id a collided lock carries, so a future multi-lock level's pairs
  // stay independently gated (WR-01). heldKeyIds is threaded as callbacks (not
  // passed by value) so the lock always reads the LIVE set. This is a NON-math
  // spatial gate — it never opens the shared challenge seam, so the math density
  // (3 challenges/level) is unchanged. Inert on every level with no keys/locks
  // (build.js emits nothing there).
  wireKey({
    player,
    hud,
    onPickup: (keyId) => { heldKeyIds.add(keyId ?? KEY_DEFAULT_ID); },
    hasKey: (keyId) => heldKeyIds.has(keyId ?? KEY_DEFAULT_ID),
  });

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
    // MOB-02 anti-leak (T-37-06): tear down the touch buttons + their onTouchStart/onTouchEnd
    // controllers (destroy() cancels them + destroyAll("touchctl")), then reset the input seam
    // so no virtual held-state or jump callback survives go()/respawn into a re-entered scene.
    // On desktop touchControls.destroy() is the no-op handle's empty body (nothing was mounted).
    touchControls.destroy();
    input.reset();
    if (player.exists() && player._fxScaleTween) player._fxScaleTween.cancel();
    if (clearTransitionTween) clearTransitionTween.cancel();
    // MECH-05: cancel any in-flight alcove-light brighten so a tween can't keep writing
    // litLevel on a prop being torn down (same discipline as the player scale tween above).
    for (const light of get("alcove-light")) {
      if (light.exists() && light._alcoveTween) light._alcoveTween.cancel();
    }
  });
}
