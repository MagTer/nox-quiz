# Project Research Summary

**Project:** Math Lab
**Domain:** Kid's educational 2D platformer (vendored Kaplay 3001, no build step, ADHD-safe)
**Researched:** 2026-06-28
**Confidence:** HIGH

## Executive Summary

v4.0 "Content & Challenge" grows the shipped single-level slice into a real, replayable game: 3–5 hand-built levels + a title/level-select shell, math woven *through* each level via four mechanics, a difficulty curve, an art/animation pass, and per-level persistence. The standout research result is **convergence**: four independent researchers (stack, features, architecture, pitfalls) all landed on the same shape — almost nothing here needs new technology, and the four "new" math mechanics are really one mechanic wearing four skins.

The recommended approach is therefore **reuse-first**: every v4.0 capability (animated sprites, multiple scenes, parallax) is native to the already-vendored Kaplay 3001.0.19; the only true additions are static CC0 art files and new plain-JS data modules. Levels stay as parameterized JS data feeding the validated `buildLevel` (NOT Kaplay `addLevel`, which would undo the merged-floor anti-seam-stick colliders, and NOT Tiled, which needs an external editor/parser). The four math mechanics get one shared `ui/challenge.js` extracted from today's `ui/mathGate.js` (a no-behavior-change refactor), differing only in their `onSolved` world-mutation.

The two load-bearing risks are both already-burned lessons: the **a727c13 import-time trap** (this milestone adds the most new modules ever — each a fresh chance to blank the game by touching a Kaplay global at module top level) and **save-migration bricking the one returning player** (today's `progress.js` *wipes* on a version bump by design; v4.0 must replace that with an additive migration preserving XP/level/accuracy/history). Both are prevented with established repo patterns (factory functions, function-body-only globals, an import-safety grep, a human-tested migration against a real v3.0 save) plus a mandatory per-phase browser boot.

## Key Findings

### Recommended Stack

Zero new runtime dependencies. Everything ships inside `lib/kaplay.mjs` @ 3001.0.19. "Stack" work is art-vendoring (CC0 sourcing + provenance via the established LICENSES/CREDITS workflow) plus code that consumes already-present engine APIs. Detail in [STACK.md](STACK.md).

**Core technologies (all native, verified against the vendored bundle + kaplayjs.com):**
- `loadSprite(name, src, { sliceX, sliceY, anims })` + `.play()/animSpeed/onAnimEnd/flipX` — animated player (idle/run/jump). `loadSpriteSheet` does NOT exist in 3001 (old Kaboom name) — `loadSprite({sliceX,…})` is correct and already used in `main.js`.
- `scene(name, fn)` / `go(name, data)` / `onSceneLeave` — title + level-select + per-level scenes; the level payload rides the exact `go()` data seam v3.0 already uses for `startX/startY`.
- `setLayers` / camera (`getCamPos`/`setCamPos`) — parallax/layered background.
- Plain JS data modules + parameterized `buildLevel` — multi-level authoring with no build step.

**Do NOT add:** bundler, sprite-packer build tool, Tiled, or any external runtime lib. **Pin held at 3001.0.19** — do not upgrade during v4.0 (the `Rect`-class guard and `setCamPos`-not-`camPos` calls are version-coupled).

### Expected Features

Detail in [FEATURES.md](FEATURES.md).

**Must have (table stakes):**
- 3–5 traversable levels selectable from a level-select screen with locked/unlocked + completion marks + resume
- Math woven mid-level (not only at the goal), always forgiving + no-timer
- Per-level completion persisted; returning resumes unlocks and XP/level

**Should have (differentiators):**
- Four math-mechanic skins (door/keys, defeat-enemy, multiple gates, collect-the-answer) over one shared challenge
- A gentle difficulty curve (easy table pools early → 6–9 deeper; longer/precise platforming later)
- Animated player, real tileset, parallax background, title screen

**Anti-features (deliberately NOT built — load-bearing for this user):**
- No timers/countdowns, no lives/game-over, no wrong-answer penalty, no contact-damage enemies, no losable stars/streaks, no leaderboards, no pink.

### Architecture Approach

Reuse the single-scene spine; add scenes and data, not new mechanisms. Detail in [ARCHITECTURE.md](ARCHITECTURE.md).

**Major components:**
1. **Save migration (additive v1→v2)** in `progress.js` — preserve xp/level/accuracy/history, add a `levels:{}` cleared-map; *derive* unlocked from `LEVEL_ORDER`. Pure module, no a727c13 risk.
2. **Level registry + data format** — `levels/index.js` (`LEVEL_ORDER`), `levels/level-0N.js` (plain data), `levels/build.js` (parameterized builder extending `level.js`). Pure.
3. **Multi-scene shell** — `scenes/title.js`, `scenes/select.js`; `game.js` parametrized by `levelId` via `go(name,data)`. Engine-touching → cancel controllers on `onSceneLeave`.
4. **Shared challenge seam** — extract `ui/challenge.js` from `mathGate.js`; `mathGate.js` becomes a one-line caller; re-point `check-gate.sh`. No-behavior-change refactor that MUST precede the mechanics.
5. **Four mechanics** as level-data fields the builder emits, each a forgiving `onSolved` world-mutation. Door first (proves seam); defeat-enemy is the same impl with art; multiple-gates generalizes the `goalReached` latch; collect-the-answer renders `q.choices` in world-space.
6. **Difficulty** — per-level `allowedTables` pool passed into `createBrain(...)`; never touch the LOCKED weighting. Platforming knobs in level data.
7. **Art/animation + parallax** — presentation, deferrable to near-last so the game validates on placeholders; keep all Kaplay refs in function bodies (a727c13).

`math/brain.js` stays LOCKED and untouched.

### Critical Pitfalls

Top items from [PITFALLS.md](PITFALLS.md):

1. **a727c13 recurrence (#1 risk)** — most new modules ever; each can blank the game via a top-level Kaplay global. Prevent with factory functions, function-body-only globals, a `check-import-safety.sh` grep, and a mandatory per-phase browser boot.
2. **Multi-scene state/controller/tween leaks** — invisible in v3.0's single scene; with title→select→level→gate transitions they surface as double-input, pre-solved levels, calls on destroyed objects. Cancel controllers on `onSceneLeave`; factory closures, not module-level `let`.
3. **Math mechanics drifting into punishment** — every "natural" default (keys consumed on wrong, wrong pickup damages, enemy deals damage) violates the mandate. Route all four through ONE shared forgiving (re-ask only, no timer, no losing branch) contract; grep- + UAT-enforced per mechanic.
4. **Save migration bricking the returning player** — additive, versioned migration; human-test against a real v3.0 save fixture.
5. **Over-stimulation creep** from richer art + parallax + enemies + difficulty — keep the ≤400–500ms flash cap, slow/muted camera-tied (non-timer) parallax, gentle difficulty ramp via table pools only.

## Implications for Roadmap

Suggested phase structure (the convergent build-order spine):

### Phase 1: Save migration + level registry/data format
**Rationale:** The two highest-leverage, lowest-risk, *pure* (no a727c13) pieces; the spine everything else consumes.
**Delivers:** additive v1→v2 save migration (XP/level/history preserved + `levels:{}` map) and the level-registry + parameterized builder.
**Avoids:** save-bricking pitfall; sets the data shape before any scene work.

### Phase 2: Multi-scene shell (title + level-select) + game.js parametrized by levelId
**Rationale:** Establishes the factory + closure-state + controller-cancel + import-safety contracts everything inherits once there are multiple scenes.
**Delivers:** title screen, level-select (locked/unlocked/complete/resume), `go("game",{levelId})`.
**Avoids:** multi-scene leak pitfalls; first place the a727c13 trap can resurface.

### Phase 3: Shared challenge-seam extraction + the door mechanic (P1)
**Rationale:** A no-behavior-change refactor that MUST precede the other mechanics; door proves the seam end-to-end.
**Delivers:** `ui/challenge.js` (with `mathGate.js` as a caller), `check-gate.sh` re-pointed, one mid-level locked-door gate.

### Phase 4: Remaining three mechanics + difficulty curve
**Rationale:** Once the seam is proven, defeat-enemy (same impl + art), multiple-gates (per-gate latch), and collect-the-answer (world-space choices) are additive; difficulty via per-level `allowedTables`.
**Delivers:** all four mechanics usable as level-data fields; easy-pool early levels → 6–9 deeper.

### Phase 5: Build out the 3–5 levels
**Rationale:** With mechanics + builder ready, author the actual content on the validated movement/collider spine.
**Delivers:** 3–5 polished, completable levels with a difficulty ramp, wired into the registry/select.

### Phase 6: Art/animation + parallax pass
**Rationale:** Presentation deferred to near-last so gameplay validates on placeholders first; pure-ish but engine-touching (a727c13 discipline).
**Delivers:** animated player (idle/run/jump), real tileset, parallax background, title art.

### Phase 7: Polish + consolidated kid-UAT
**Rationale:** Re-run the full ADHD-safety audit across all new mechanics + art; feel/contrast validated only with the kid.
**Delivers:** extended `check-safety.sh`/`check-import-safety.sh` green, kid sign-off.

### Phase Ordering Rationale
- Pure/low-risk spine (migration, registry) first; refactor (challenge seam) before the features that depend on it; content after mechanics; art near-last so logic validates on placeholders; UAT last (feel is user-validated).
- Each phase ends with a real browser boot, not just greps (the a727c13 lesson).

### Research Flags
- **Art/animation phase:** exact `sliceX/sliceY/anims` frame layout unknown until the CC0 pack is picked — resolve at sourcing time; per-asset license must be re-verified at download (a CC-BY-SA coin was caught mislabeled in v3.0).
- **Save-migration phase:** capture or hand-construct a representative real v3.0 localStorage save fixture for the human test.
- Standard patterns (lighter research): level-data authoring, multi-scene navigation — both extend verified v3.0 seams.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All APIs verified against the vendored 3001.0.19 bundle + kaplayjs.com; zero new deps |
| Features | HIGH | Mechanics map to one proven gate; anti-features grounded in explicit constraints |
| Architecture | HIGH | Extends verified v3.0 seams (`go()` data, mathGate, progress versioning) |
| Pitfalls | HIGH (MEDIUM for over-stimulation) | From this repo's burned-in lessons; ADHD response varies — verify in kid-UAT |

**Overall confidence:** HIGH

### Gaps to Address
- Exact sprite-sheet frame layouts: resolve when the art pack is chosen early in the art phase.
- Real v3.0 save fixture for migration testing: capture from the live game or hand-construct.
- Star/completion third criterion: must be non-punishing (recommend all-coins, never "no respawns") — decide in requirements.

## Sources

### Primary (HIGH confidence)
- Vendored `lib/kaplay.mjs` @ 3001.0.19 — animation/scene/layer/camera API verified directly
- kaplayjs.com — loadSprite, SpriteComp, addLevel, setLayers docs

### Secondary (MEDIUM confidence)
- OpenGameArt CC0 listings — animated character, parallax backgrounds, enemies (licenses re-verify per asset)
- Game UI Database / level-select design references; ADHD-friendly math-game guidance (Monster Math, ADDitude)

---
*Research completed: 2026-06-28*
*Ready for roadmap: yes*
