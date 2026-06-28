# Pitfalls Research

**Domain:** No-build vendored-Kaplay 3001 browser platformer (Math Lab v4.0 "Content & Challenge") — adding animated sprites, multiple levels + level-select/title scenes, four mid-game math mechanics, per-level unlock persistence, and parallax to an EXISTING, kid-validated single-level slice
**Researched:** 2026-06-28
**Confidence:** HIGH — grounded in this repo's own burned-in lessons (a727c13 blank-screen, self-cleaning effect, asset-path, firewall), the v3.0 RETROSPECTIVE, the verified Kaplay 3001.0.19 vendored API surface (`play`/`stop`/`flipX`/`getCurAnim`/`onAnimEnd`/`animSpeed` confirmed in `lib/kaplay.mjs`), and the existing anti-leak code in `src/scenes/game.js` / `src/fx.js`

> **Framing.** This is a SUBSEQUENT milestone. The risk is NOT "can we build a platformer" — that shipped. The risk is **integration**: new modules re-introducing the exact traps the v3.0 spine already solved (top-level globals, cross-scene state leak, timer-based juice), the four math mechanics quietly drifting away from forgiving/no-timer, and a save-schema change bricking the one returning player who matters. Every pitfall below is mapped to a v4.0 phase so the roadmap bakes in the mitigation.

---

## Critical Pitfalls

### Pitfall 1: The a727c13 top-level-global trap resurfacing in new modules

**What goes wrong:**
A new module (parallax helper, enemy factory, level-registry, animation helper) references a Kaplay global — `vec2`, `rect`, `add`, `setGravity`, `loadSprite`, or even a defensive `typeof Rect`/`typeof add` guard — at **module top level**, or runs a top-level `loadSprite(...)` / `add(...)` call. ES `import` is hoisted and executes before `kaplay({global:true})` installs the globals, so the reference is `undefined` at import time. Result: a thrown ReferenceError (or a silently-`undefined` guard branch) during boot that **blanks the whole game** before any scene runs — and, exactly as in a727c13, automated `node --check` + structural greps still "pass" because they never boot a browser.

**Why it happens:**
New-module authors copy a "module constant" idiom (`const GRAVITY_VEC = vec2(0, 900)` at top level) or add a "fail-loud" guard at module scope, not realizing import order. This milestone adds the MOST new modules of any so far (registry, title scene, level-select scene, 4 mechanic modules, enemy factory, parallax) — maximum surface for the trap to recur.

**How to avoid:**
- Hard rule (already a project constraint): **no Kaplay global usage and no `typeof <global>` guard at module top level.** Globals only inside scene-time function bodies (scene callbacks, factory functions invoked at scene time, `onUpdate` callbacks).
- New modules export **factory functions** (`makeEnemy(...)`, `buildParallax(...)`, `registerLevels()`), never top-level engine objects. The registry must hold **plain data** (level descriptors as POJOs), not pre-built `add()`ed entities or `vec2()` literals — compute `vec2` lazily inside the builder.
- All `loadSprite`/sheet asset registration stays in `main.js` AFTER `kaplay()`, before `go(...)` — same as the existing player/coin loads.
- Extend the negative-grep gate: add a `check-import-safety.sh` that greps every `src/**/*.js` (comment-stripped) for top-level (column-0, outside any function) use of Kaplay global identifiers and fails the build.
- **Mandatory human browser-boot check after EVERY new scene/module lands** — "passed on automation" ≠ "boots in a browser" is the single most expensive lesson from v3.0.

**Warning signs:**
Blank canvas / stuck Kaplay loading screen on boot; a console ReferenceError naming a Kaplay global; a guard that "should never fire" silently taking its fallback branch; CI green but nobody has opened a browser since the last new module.

**Phase to address:**
Foundational — the **scene-system / level-registry phase** (first structural phase) establishes the factory + plain-data convention and the `check-import-safety.sh` grep; every later phase inherits it. Re-verify with a browser boot at the end of each phase.

---

### Pitfall 2: Run/animation/handler state leaking across `go()` and scene restarts

**What goes wrong:**
With multiple scenes (title → level-select → level N → gate → next), state that should reset per-entry survives across `go()`/respawn:
- **Module-level `let`** for run state (coins, enemy list, "key collected", current-level index) persists across scene switches — a returning level shows last run's coin count, a re-entered level remembers a door was already unlocked.
- **Global input handlers** (`onKeyPress`, `onKeyDown`) registered at module scope or never cancelled stack up: enter level 2 then return to level 1 and the jump key fires twice, or a level-select arrow key still moves a destroyed player.
- **Colliders / `onCollide` / `onUpdate`** registered on the old scene fire against destroyed objects after a scene change.
- **In-flight tweens** (the new walk/run flip tween, an enemy hit-flash, a parallax scroll tween) keep calling `scaleTo()`/`opacity` on a destroyed object after `go()`.
- **Animation state** (`play("run")`) left running on a reused sprite shows the wrong clip on re-entry.

**Why it happens:**
Kaplay scene objects are auto-destroyed on `go()`, which lulls authors into thinking *everything* resets — but module-level variables, globally-registered `onKey*` controllers, and tweens whose handles live in module scope are NOT scene-bound. This milestone multiplies scene transitions from "one scene, restart in place" to "many scenes, frequent switching," so a leak that was invisible in v3.0 (only ever one scene) becomes visible.

**How to avoid:**
- **All run/session state lives in the scene-callback closure**, seeded via the `go()` data payload with default guards — exactly the pattern already in `src/scenes/game.js` (`let lastCheckpoint`, `let coinsCollected`, `let goalReached` are closure-local with the explicit "never a module-level `let`" comment). Replicate verbatim for the new mechanics' state (`keysHeld`, `enemiesRemaining`, `checkpointsPassed`).
- **Every globally-registered handler returns a controller; cancel it on `onSceneLeave`.** The repo already does this: `onSceneLeave(() => hideCtrl.cancel())` and `mathGate.js` cancels its key controllers. Apply to every new `onKeyPress`/`onKeyDown` in title/level-select scenes.
- **Tag + `destroyAll` sweep on scene leave** for effect/enemy objects, AND cancel non-tagged tweens whose handle lives on the object — the repo's `onSceneLeave(() => { destroyAll("fx"); if (player.exists() && player._fxScaleTween) player._fxScaleTween.cancel(); })` is the template. New animation/flip tweens must store their handle on the object and be cancelled the same way (single-flight via `obj._tween?.cancel()`).
- Prefer **scene-scoped `onKeyPress` inside the scene callback** over module-level registration so they die with the scene.
- Extend the negative-grep suite: a `check-leak.sh` that fails on module-level `let`/`var` holding run state and on any `onKey*`/`onCollide` whose controller is never cancelled.

**Warning signs:**
Coin/key/checkpoint count starts non-zero on a fresh level entry; input fires N times after visiting N levels; "object does not exist" / NaN errors after a scene switch; a level you already solved is pre-solved on replay; a sprite shows the run animation while standing still right after `go()`.

**Phase to address:**
**Scene-system phase** sets the closure-state + controller-cancel + leave-sweep contract for ALL scenes; the **four-mechanics phase** and **enemy/animation phases** must each re-apply it to their new state and tweens. Verify by entering→leaving→re-entering each scene twice and confirming a clean reset.

---

### Pitfall 3: Sprite-sheet slicing / anim-def mistakes (and using the wrong loader)

**What goes wrong:**
The animated player (idle/run/jump) and animated enemies render wrong: frames bleed (off-by-one `sliceX`/`sliceY` so a frame shows half the next), the anim plays the wrong range, the sheet is sliced row-major when it's laid out column-major, or nothing animates because `play("run")` was never called / the anim name doesn't match the def. A classic here: reaching for **`loadSpriteSheet`, which does NOT exist in Kaplay 3001** — the correct call is `loadSprite(name, path, { sliceX, sliceY, anims: { run: { from, to, loop, speed } } })` (the repo already does this correctly for the coin: `sliceX: CONFIG.COIN_FRAMES, anims: { spin: {...} }`). Multi-row sheets also need `sliceY`, which the single-row coin didn't exercise — so the multi-row player/enemy sheets are NEW, untested territory.

**Why it happens:**
Sheet packing conventions vary across CC0 packs (Kenney vs itch); authors guess frame counts instead of reading the image dimensions; the coin's single-row success creates false confidence about multi-row sheets; old Kaboom/tutorial muscle memory reaches for `loadSpriteSheet`.

**How to avoid:**
- Always derive `sliceX`/`sliceY` from the **actual pixel dimensions** of the chosen sheet (image width ÷ frame width), and put frame counts in `CONFIG` as named constants (no magic numbers — repo convention).
- For multi-row sheets, set BOTH `sliceX` and `sliceY` and define each anim's `from`/`to` as flat frame indices (row-major: index = row*sliceX + col).
- Use `loadSprite` only; add `loadSpriteSheet` to the negative-grep banned-token list so it can never sneak in.
- Keep all anim loads in `main.js` after `kaplay()` (Pitfall 1).
- Sanity-render each new sprite at integer scale with `crisp: true` (already on) so a 1-px slice error is visible.

**Warning signs:**
A sliver of the adjacent frame visible on a sprite edge; animation "stutters" or shows a static frame; console "anim not found"; a `loadSpriteSheet is not a function` error.

**Phase to address:**
**Art / animation phase** (player idle/run/jump first, then enemies). Verify by eyeballing each clip in a browser at the chosen display scale.

---

### Pitfall 4: Animation frame-timing and direction-flipping not frame-rate-independent / state-thrashed

**What goes wrong:**
- Walk/run animation **speed tied to frame rate** instead of a fixed `speed` (fps) on the anim def → animation runs faster/slower on different monitors (the same dt-correctness lesson v3.0 already applied to movement; the audit plan `08-03 MOVE-05 frame-rate independence` shows this team cares about it — but animation speed is a NEW axis).
- **`play()` called every frame** (e.g. inside `onUpdate` whenever moving) restarts the clip each frame so it freezes on frame 0. Must only call `play("run")` on a **state transition** (was-idle→now-moving), guarded by checking `getCurAnim()`.
- **`flipX` thrash**: flipping by raw velocity sign every frame flickers the sprite at velocity≈0; and flipping by input rather than by facing can fight the animation.
- Jump anim never resolves because there's no grounded check / `onAnimEnd` to return to idle/run.

**Why it happens:**
Authors drive animation imperatively from `onUpdate` without an explicit animation state machine; they assume `play()` is idempotent (it isn't — it restarts); they flip on instantaneous velocity instead of a debounced facing direction.

**How to avoid:**
- Use the anim def's `speed` (fps) for timing — **never** advance frames manually with dt math. This makes animation frame-rate-independent the same way the movement spine is.
- Drive animation from an explicit **player animation state** (idle / run / jump / fall), and only call `play(name)` when the target state differs from `getCurAnim()` (confirmed available in 3001). One `play()` per transition, not per frame.
- Flip on **facing direction with a deadzone** (only update facing when |vx| exceeds a small threshold), set `flipX` once on direction change.
- Return jump→idle/run on the grounded transition (`isGrounded()` / land event), not on a timer (no-timer mandate).

**Warning signs:**
Animation visibly faster/slower on a different machine; sprite stuck on frame 0 while moving; flicker/jitter when standing near-still; sprite frozen mid-jump after landing.

**Phase to address:**
**Animation phase** — fold an "animation is frame-rate-independent (uses anim `speed`, not dt)" check into the same MOVE-05-style audit the team already runs for movement. Verify on two refresh rates if possible, else throttle in DevTools.

---

### Pitfall 5: Any of the four math mechanics drifting into PUNISH / TIME / SHAME

**What goes wrong:**
This is the milestone's highest-value-at-risk pitfall. Each of the four mechanics has a "natural" implementation that violates the ADHD-safe / forgiving / no-timer contract that v3.0 fought to establish:
- **Locked doors/keys:** wrong answer "consumes" the key / locks you out / sends you back → punishment. Or a "you have 30s to answer" overlay → timer.
- **Collect-the-answer pickups:** grabbing the WRONG answer-pickup damages/kills/resets → shame + punishment; or pickups despawn on a timer → timer.
- **Multiple checkpoint gates:** a missed gate question **blocks progress permanently** or forces a restart → punishment; gates that re-ask under time pressure → timer.
- **Defeat-enemy-with-answer (👺💀🐉):** wrong answer = the player takes damage / dies / loses XP → the exact death-punishment loop v2.0's "death = restart floor, XP intact" and v3.0's "respawn = checkpoint, never game-over" explicitly outlawed. Also a combat "answer fast" pressure = timer.

**Why it happens:**
Game-design instinct equates "challenge" with "consequence for failure," and combat instinct equates enemies with HP/damage/death. The four mechanics are described in game terms (doors, enemies, combat) that *imply* fail-states. Without an explicit forgiving spec per mechanic, the default implementation punishes.

**How to avoid:**
- Define a **single shared "answer interaction" contract** all four mechanics route through (reuse the `mathGate.js` bridge pattern): wrong answer → **gentle re-ask / re-roll, never** damage, lockout, XP loss, despawn, restart, or game-over. Right answer → progress + reward. There is no losing branch, only a not-yet-winning branch.
- **Enemies are obstacles/puzzles, not HP bars under time pressure.** Wrong answer to an enemy = the enemy stays / you try again (or simply can't pass yet), never the player taking damage. Keep v2's 👺💀🐉 *flavor* but not its damage model.
- **Keys/doors are non-consumable on wrong answers** — a wrong answer just doesn't open it yet; the key/question remains available.
- **Zero countdown UI anywhere** — extend `check-safety.sh`'s no-timer grep (no `setTimeout`/`setInterval`/`wait`/`loop`/`lifespan` and no visible countdown) to cover every new mechanic module.
- Write a **per-mechanic forgiveness assertion** (like v2's SC-N invariants): "no code path on a wrong answer reduces XP, HP, position-progress, or triggers go()/restart." Grep-enforce + human-UAT.

**Warning signs:**
Any HP/damage/lives variable touching a mechanic; any `go()`/respawn/restart triggered by a wrong answer; any countdown text or timed despawn; UAT where the kid says "that's not fair" or stops wanting to play; XP ever decreasing.

**Phase to address:**
**Four-mechanics phase** — make the shared forgiving contract a precondition of the phase, not a polish afterthought. Re-run the ADHD-safety audit (the 6/6-passing `check-safety.sh` model) against EACH mechanic before sign-off, plus kid-UAT specifically probing "what happens when you get one wrong."

---

### Pitfall 6: Gate/overlay z-index and pause-state bugs across the new mechanics

**What goes wrong:**
With math interactions now happening **mid-level** (doors, pickups, checkpoint gates, enemies) instead of only at the end goal, the answer overlay can:
- Render **behind** the level / parallax / HUD (wrong `z`), so the question is partly hidden or unclickable.
- **Not pause the world** — the player keeps running/falling, an enemy keeps moving, or a spike kills the player *while the question modal is open*. (v3.0's gate fired at a standstill goal, so world-pause was never stress-tested.)
- **Leak input** — keyboard drives both the answer UI and the player simultaneously (move while choosing), or the overlay's key controller isn't cancelled on close and lingers into the next gate (ties to Pitfall 2).
- Move with the camera (world-space) instead of being camera-immune screen-space — the HUD already solved this (`SAVE-04` screen-space overlay); the new gate overlays must reuse that, not re-solve it wrongly.

**Why it happens:**
Mid-level gates are a new interaction context. Pausing in Kaplay requires explicitly gating `onUpdate`/physics or using a pause flag the player/enemy update respects; it's easy to open a modal without freezing the sim.

**How to avoid:**
- Reuse `mathGate.js` and the HUD's **screen-space, high-z overlay** approach for all four mechanics; one overlay component, four triggers.
- On gate open, set a **scene pause flag** that the player-update and enemy-update closures check (`if (paused) return;`) so the world freezes; clear it on close. Verify the player can't take spike/enemy damage or fall while a question is up.
- The overlay **owns input while open** — register its key controller on open, cancel on close (mathGate already does this), and have the player-input handler respect the pause flag so movement keys don't double-drive.
- Give overlay layers explicit `z` above world and parallax; verify nothing in the new richer art draws over it.

**Warning signs:**
Question partly hidden behind tiles/parallax; player dies or drifts while answering; pressing arrows moves the player while picking an answer; a second gate inherits the first's still-live key handler; overlay scrolls with the camera.

**Phase to address:**
**Four-mechanics phase** (overlay/pause contract), with the screen-space convention established when the **HUD/scene system** is touched. Verify by opening each mechanic's gate next to a hazard/enemy and confirming a frozen, input-isolated, on-top modal.

---

### Pitfall 7: Persistence migration bricking the returning player (unlock-schema change)

**What goes wrong:**
v3.0 already persists `{ xp, level, accuracy, history }` (loaded once via `loadSave()` with guarded defaults). v4.0 adds **per-level completion/unlock state** to the same save. Mistakes:
- Bumping the save shape **without a migration**, so the kid's existing v3.0 save (with real XP/level/weak-spot history) is either rejected or silently overwritten with defaults — **she loses her progress on first v4.0 launch.** This is the one returning user who matters; v2.0's retro already flagged "migration test must be human-executed with a real prior-version save fixture."
- A **corrupt / partial / old-version** save throwing during parse and crashing boot (instead of falling back to safe defaults).
- Unlock state stored such that a future shape change **re-locks already-cleared levels** (frustration) or **unlocks everything** (loses the progression sense the milestone is for).
- No `version` field / no forward guard, so the next milestone repeats the pain.

**Why it happens:**
Schema changes feel trivial ("just add a `levels` key"); the dev's own browser has a fresh/dev save so they never hit the real-prior-save path; JSON.parse on a malformed blob throws and isn't caught.

**How to avoid:**
- Keep the **versioned save** (v2.0 established "migration-ready versioning"; v3.0 has "versioned localStorage"). Bump the version and write an explicit **migration that ADDS `levelProgress` while preserving `xp/level/accuracy/history`** untouched.
- `loadSave()` must **never throw**: wrap parse in try/catch, validate shape, and on any failure (missing keys, wrong version, corrupt JSON, blocked storage / node / incognito) return **safe defaults that preserve as much as parseable** (at minimum never zero out XP if XP is present and valid).
- New per-level unlock state should **default to "level 1 unlocked, rest locked, none completed"** when absent, and an unreadable `levelProgress` must NOT wipe XP.
- Treat unlock state as **monotonic where sensible**: an already-completed level stays completed across migrations (don't re-lock).
- **Human-executed migration test with a real v3.0 save fixture** (capture the kid's actual localStorage, or a representative one) — code-level verification can't cover this, per the v2.0 lesson. Test: load v3.0 save → launch v4.0 → confirm XP/level/weak-spot intact AND level-1 unlocked.

**Warning signs:**
XP/level resets to 0 on first launch after the schema change; boot crash with a JSON/parse error; an old save makes the app blank; cleared levels show locked again; dev "tested it" but only on a freshly-cleared browser.

**Phase to address:**
**Persistence / progression phase** (the one introducing level-unlock state). Gate sign-off on the human migration test against a real prior save. Add a `check-progress.sh`-style grep ensuring `loadSave` is try/caught and never zeroes XP on the error path.

---

### Pitfall 8: ADHD over-stimulation creep from richer art, parallax, enemies, and difficulty spikes

**What goes wrong:**
The art pass + parallax + enemies + a difficulty curve each risk violating the ADHD-safe mandate that v3.0 audited to 6/6:
- **Parallax / background motion** that's too fast, high-contrast, or strobing becomes a constant peripheral distractor (the opposite of "minimize distraction"); auto-scrolling backgrounds can induce motion discomfort.
- **Enemies + new juice** stacking flashes/shakes → strobe risk; v2.0's retro already warned `levelUpFlash 800ms is borderline` and set a **≤500ms (safer 400ms) cap** on post-event animation — new enemy-hit/clear flashes must obey it.
- **Difficulty curve as a spike**, not a ramp: a level that suddenly jumps platforming AND table difficulty together creates a frustration wall → she stops opening it (kills the core value: "she opens it because she *wants* to").
- **Too many simultaneous animated elements** (animated player + enemies + coins + parallax + fx) raising cognitive load and frame cost on her Windows laptop, causing jank that itself reads as stress.
- Color drift toward bright/pink/cutesy under "real art pass" — explicitly excluded.

**Why it happens:**
"Make it look like a real game" pulls toward AAA juice/motion; difficulty design defaults to step-functions; parallax tutorials favor lively motion. None default to the calm, forgiving, dark-grunge, no-strobe target.

**How to avoid:**
- **Parallax: slow, low-contrast, non-strobing**, tied to camera position (not an autonomous timer/auto-scroll → also satisfies no-timer). Keep layers few and muted within the dark-grunge palette.
- **Keep the ≤400–500ms animation cap** (v2.0 lesson) on every new flash/shake/hit effect; no rapid repeated flashes; reuse v3.0's "non-strobing clear-burst" precedent. Extend `check-safety.sh` to scan new fx durations.
- **Difficulty as a gentle ramp, decoupled axes:** raise platforming and table-difficulty *gradually and not simultaneously*; keep the 6–9-weighted brain unchanged and let *table pool*, not time pressure, carry difficulty. No level should be a hard wall — and every gate stays forgiving (Pitfall 5) so a hard table never blocks, only re-asks.
- **Budget on-screen animated elements**; profile frame rate on a representative low-end target; `requestAnimationFrame`/Kaplay already pauses on tab blur.
- Re-run the **6-item ADHD-safety audit** against the finished art/parallax/enemy set; kid-UAT for "is anything too busy / too hard / annoying."

**Warning signs:**
Eye-catching background motion you notice over the gameplay; any flash >500ms or repeated rapid flashing; the kid bouncing off a specific level; visible jank/frame drops; any bright/pink/cute element creeping in; she stops wanting to open it.

**Phase to address:**
**Art/parallax phase** (motion + palette + flash-cap) and the **difficulty-curve phase** (ramp not spike). Final **polish/UAT phase** re-runs the full ADHD-safety audit + kid sign-off across the assembled milestone — the same consolidated end-to-end kid-UAT that validated v3.0.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Module-level `let` for current-level / unlock state | "Simpler" than threading through `go()` data | Leaks across scenes (Pitfall 2); the exact bug the closure-state pattern exists to prevent | **Never** — closure + `go()` payload is the established contract |
| Hardcoding each level inline instead of a data registry | Ship one more level fast | 3–5 levels become copy-paste forks; level-select can't enumerate them; difficulty tuning hunts magic numbers | Only for a throwaway spike; the registry must land before level #2 |
| Per-mechanic ad-hoc answer overlay (4 copies) | Each mechanic ships independently | 4 z-index/pause/input-leak bugs to fix instead of 1; inconsistent forgiveness | Never — route all four through one shared gate/overlay |
| Adding `levelProgress` to the save without a version bump + migration | One less function to write | Bricks the returning player's real save (Pitfall 7) | Never — versioned migration is already the project standard |
| Driving animation frames manually with dt in `onUpdate` | Feels controllable | Frame-rate-dependent, `play()`-thrash, breaks the MOVE-05-style independence the team values | Never — use anim `speed` + state-transition `play()` |
| Skipping the browser-boot check because greps pass | Faster phase close | Re-runs a727c13: silently un-booted phases (cost v3.0 three phases of fake-passing) | Never for any phase touching a scene/module/asset |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| New asset (sprite sheet / parallax layer) | `assets/...` or `/assets/...` path → **silent 404**, sprite just doesn't draw | Use `../assets/...` web-root convention (repo rule); load in `main.js` after `kaplay()`, before `go()` |
| Sprite sheet loading | Reaching for `loadSpriteSheet` (doesn't exist in Kaplay 3001) | `loadSprite(name, path, { sliceX, sliceY, anims })`; frame counts in CONFIG |
| New scene's input | `onKeyPress` at module scope or never cancelled → stacks across scenes | Register inside scene callback or cancel its controller on `onSceneLeave` |
| Mid-level math overlay | Opens modal without pausing world → player dies/drifts while answering | Scene pause flag respected by player+enemy update; overlay owns input; high `z`; screen-space |
| Save schema | Add `levelProgress`, no migration → returning save lost/crashes | Version bump + additive migration; `loadSave` try/catch never zeroes XP |
| Effect/enemy tweens | Tween handle in module scope or uncancelled → outlives scene, calls methods on destroyed objects | Handle on the object, single-flight `obj._tween?.cancel()`, cancelled on `onSceneLeave` |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Too many simultaneous animated/parallax elements | Frame drops / jank on her Windows laptop, reads as stress | Budget on-screen animated objects; few muted parallax layers; profile on target | When a busy level stacks player+enemies+coins+parallax+fx |
| Uncancelled tweens/handlers accumulating across many scene switches | Gradual slowdown / double-fired logic after several level transitions | `onSceneLeave` cleanup contract (Pitfall 2) | After repeated level-select↔level round-trips in one session |
| Re-loading the same sprites per scene instead of once at boot | Stutter on each scene entry | Load all assets once in `main.js` before `go()` | When asset loads get scattered into scene callbacks |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting localStorage JSON shape blindly | Corrupt/old save crashes boot for the one real user | try/catch + shape-validate in `loadSave`; safe defaults |
| (N/A) Backend/account creep | Out of scope; privacy is a stated constraint | Keep static-hosting-only; nothing leaves her browser |

> Security surface is minimal by design (static files, no backend, no PII, single local user). The real "security" risk is **data loss** (the save), covered by Pitfall 7.

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Wrong answer punishes (damage/lockout/death/XP loss) | Breaks trust; she stops wanting to play | Forgiving re-ask only; no losing branch (Pitfall 5) |
| Difficulty spike (platforming + tables jump together) | Frustration wall; abandons that level | Gentle, decoupled ramp; tables via pool not time |
| Busy/strobing parallax or >500ms flashes | Distraction/over-stimulation for ADHD profile | Slow, muted, non-strobing; ≤400–500ms cap |
| No sense of progression on the world map | Levels feel like a flat list, not advancement | Visible unlock/completion state; locked→unlocked feedback |
| Returning player loses XP/weak-spot history | Feels like starting over; demotivating | Migration preserves XP/level/history (Pitfall 7) |
| Mid-level gate steals input or hides behind art | Can't answer / accidental movement | Screen-space high-z overlay that pauses world + owns input |

## "Looks Done But Isn't" Checklist

- [ ] **New scene/module:** Often missing browser-boot verification — open it in a browser, not just greps (a727c13).
- [ ] **Sprite animation:** Often missing the `play()`-on-transition guard — verify it doesn't freeze on frame 0 while moving, and is frame-rate-independent.
- [ ] **Each of the 4 math mechanics:** Often missing the forgiveness audit — grep + UAT that a WRONG answer never damages/locks/kills/restarts/loses XP and shows no countdown.
- [ ] **Mid-level gate:** Often missing world-pause — open it next to a spike/enemy and confirm the player can't be hurt or move while answering.
- [ ] **Scene transition:** Often missing cleanup — enter→leave→re-enter twice; confirm coins/keys/checkpoints/input/animation all reset.
- [ ] **Save migration:** Often missing the real-prior-save test — load an actual v3.0 save and confirm XP/level/history survive AND level 1 is unlocked.
- [ ] **Parallax/art/flash:** Often missing the strobe/duration check — no flash >500ms, motion slow/muted, palette still dark-grunge / no pink.
- [ ] **Level registry:** Often missing enumeration — level-select actually lists every registered level and reflects unlock state.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| a727c13 top-level global resurfaces | LOW | Move the global use inside the scene/factory function; re-boot in browser; add the use to `check-import-safety.sh` |
| Cross-scene state/handler/tween leak | MEDIUM | Move state to closure + `go()` payload; add `onSceneLeave` cancel/`destroyAll`; re-test enter/leave/re-enter |
| A mechanic punishes/times/shames | LOW–MEDIUM | Reroute through the shared forgiving overlay contract; strip damage/lockout/timer; re-run safety audit + kid-UAT |
| Gate z-index/pause bug | LOW | Use screen-space high-z overlay + scene pause flag; verify next to a hazard |
| Save migration bricks returning player | **HIGH** (data already lost) | Restore from any backup; harden `loadSave` to never zero XP; ship migration; re-test with real fixture — **prevention >> recovery here** |
| Over-stimulation (parallax/flash/spike) | LOW | Slow/mute motion, cap flashes ≤400ms, soften the difficulty ramp; re-run ADHD audit |
| Sprite-sheet slicing wrong | LOW | Recompute `sliceX/sliceY` from pixel dims; fix anim `from/to`; re-eyeball in browser |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Top-level-global trap (a727c13) | Scene-system / level-registry phase (foundational) | Browser boots cleanly after each new module; `check-import-safety.sh` green |
| 2. Cross-scene state/handler/tween leak | Scene-system phase (contract) + every later phase re-applies | Enter→leave→re-enter each scene twice → clean reset; `check-leak.sh` green |
| 3. Sprite-sheet slicing / wrong loader | Art / animation phase | Each clip eyeballed in browser; no `loadSpriteSheet` in tree |
| 4. Anim frame-timing / flip / state thrash | Animation phase | MOVE-05-style independence check on animation; no frame-0 freeze; no flicker |
| 5. Mechanics punish/time/shame | Four-mechanics phase (precondition) | Per-mechanic forgiveness assertion + `check-safety.sh` + kid-UAT "what if wrong" |
| 6. Gate z-index / pause / input | Four-mechanics phase (overlay/pause contract) | Open each gate next to hazard/enemy → frozen, on-top, input-isolated |
| 7. Save migration bricks returning player | Persistence / progression phase | Human test with real v3.0 save → XP/level/history intact + level 1 unlocked |
| 8. Over-stimulation (art/parallax/enemies/spike) | Art/parallax phase + difficulty phase + final polish/UAT | Full 6-item ADHD-safety audit + consolidated kid-UAT across the milestone |

## Sources

- `/home/magnus/dev/nox-quiz/.planning/PROJECT.md` — v4.0 milestone scope, constraints, key decisions (HIGH)
- `/home/magnus/dev/nox-quiz/.planning/RETROSPECTIVE.md` — v2.0/v3.0 burned-in lessons: a727c13 blank-screen, self-cleaning effects, asset/path rule, migration-must-be-human-tested, 500ms flash cap, firewall + negative-grep gates (HIGH)
- `/home/magnus/dev/nox-quiz/src/scenes/game.js` — existing closure-state anti-leak pattern, `onSceneLeave` cancel + `destroyAll("fx")` + tween-cancel template (HIGH)
- `/home/magnus/dev/nox-quiz/src/fx.js` — self-cleaning tween/single-flight no-timer pattern (HIGH)
- `/home/magnus/dev/nox-quiz/src/main.js` — asset-path `../assets/...` rule, `loadSprite{sliceX,anims}` (not `loadSpriteSheet`), post-`kaplay()` load ordering (HIGH)
- `/home/magnus/dev/nox-quiz/lib/kaplay.mjs` (3001.0.19, vendored) — confirmed animation API: `play`, `stop`, `flipX`/`flipY`, `getCurAnim`, `onAnimEnd`, `animSpeed` (HIGH)
- `.planning/phases/08-.../08-03 MOVE-05 frame-rate independence` audit — team's existing dt-correctness discipline, extended here to animation timing (MEDIUM)

---
*Pitfalls research for: no-build vendored-Kaplay browser platformer — v4.0 Content & Challenge integration*
*Researched: 2026-06-28*
