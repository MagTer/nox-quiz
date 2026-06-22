# Pitfalls Research

**Domain:** First-time Kaplay (Kaboom successor) 2D platformer with an end-of-stage math gate, shipped to a 12-year-old (possible ADHD) as an offline multi-file browser app.
**Researched:** 2026-06-22
**Confidence:** HIGH (Kaplay version/CORS/scenes, game-feel, CC0 licensing); MEDIUM (Kaplay collision edge cases — collision module still maturing, less documented).

> Scope note: these are pitfalls specific to *adding a Kaplay platformer to this project and putting it in front of a real kid*. Generic web-app advice is omitted. Phases referenced are the expected v3.0 shape: **P1 Project setup & local serving**, **P2 Platformer core (movement/physics/camera)**, **P3 Level build & CC0 assets**, **P4 Math-gate integration (port the math brain)**, **P5 Polish, ADHD-safety & UAT**.

---

## Critical Pitfalls

### Pitfall 1: Assets silently fail to load over `file://` (CORS)

**What goes wrong:**
The game opens by double-clicking the HTML file, the canvas shows but sprites/tilemap never appear, or `loadSprite()` hangs and the scene never starts. Console shows `CORS request not HTTP` / fetch failures.

**Why it happens:**
Kaplay's `loadSprite`/`loadSound`/`loadSpriteAtlas` use `fetch` under the hood. The `file://` scheme is not http(s), so the browser blocks the request. This is invisible in a single-inlined-file app (v1/v2 had no external assets) and surfaces the moment v3.0 vendors Kaplay + an assets folder.

**How to avoid:**
Require a local static server and bake it into how the project is launched. Ship a one-line launcher (`python -m http.server 8000`, or `npx serve`, or a tiny `.bat`/`.sh`) and document opening `http://localhost:8000`. Make "served, not double-clicked" a first-class instruction for the parent/kid. Consider a startup guard that detects `location.protocol === 'file:'` and shows a friendly "open via the start script" message instead of a blank screen.

**Warning signs:**
Blank/black canvas, sprites missing, `loadSprite` promises never resolve, console CORS/fetch errors, works for the developer (who runs a server) but not on the target Windows laptop (double-clicked).

**Phase to address:** P1 (Project setup & local serving) — establish the serving story and the `file://` guard before any assets exist.

---

### Pitfall 2: Kaboom/Kaplay version churn breaks copy-pasted code

**What goes wrong:**
Tutorials and AI-generated snippets mix Kaboom.js, Kaplay v3001, and v4000 APIs. Code that "should work" throws `undefined is not a function`, or deprecation warnings flood the console (`kaboom()`, `curAnim()`, `Event`).

**Why it happens:**
Kaplay is the maintained fork of abandoned Kaboom.js. `kaboom()` is a deprecated alias for `kaplay()`. v3001 is the Kaboom-compatible stable line (no breaking changes); v4000 adds breaking changes and new APIs. The web is full of mixed-vintage examples, and a first-time user can't tell which version a snippet targets.

**How to avoid:**
Pin one version when vendoring the library file and record it (e.g. `kaplay@3001.x` for maximum compatibility/stability, or commit to v4000 deliberately). Add a one-line comment at the top of the vendored file noting version + source URL. When borrowing code, check it against the docs for the pinned version, not a random blog. Prefer `kaplay()` over `kaboom()` and the non-deprecated names.

**Warning signs:**
`is not a function` errors, deprecation warnings in console, snippets that reference `kaboom(` while you call `kaplay(`, behavior that contradicts the docs you're reading.

**Phase to address:** P1 (pin + vendor the version) and P2 (build against the pinned API).

---

### Pitfall 3: Module-level state leaks across scenes and level retries

**What goes wrong:**
On retry/replay (very common with a kid), score, current-question index, player HP, or "answered correctly" flags carry over from the previous attempt — questions get skipped, the gate is pre-cleared, or the level starts in a corrupted state. The math brain's selection state drifts.

**Why it happens:**
`go(scene)` destroys all game objects but does **not** reset plain JavaScript variables declared at module scope. Code outside scenes only runs once. Objects given `stay()` survive scene switches and can persist unintentionally. A first-time Kaplay dev naturally reaches for a module-level `let score = 0`, which then accumulates across `go()` calls.

**How to avoid:**
Initialize all mutable run state *inside* the scene callback, not at module scope. Pass cross-scene data explicitly via `go(name, data)` (single value or object). Keep the ported math brain's per-session state in an object that the level scene constructs fresh on entry; expose a `reset()` and call it on scene start. Use `stay()` sparingly and only for genuinely global things (e.g. an audio/settings singleton, which v3.0 doesn't need yet). Wrap all game logic inside scene definitions.

**Warning signs:**
Second playthrough behaves differently from the first; gate already "solved"; question counter doesn't reset; HP/score from a prior run appears; behavior changes only after a `go()` round-trip.

**Phase to address:** P4 (Math-gate integration — porting the brain is exactly where this bites) with the scene-state discipline set up in P2.

---

### Pitfall 4: The math gate feels like a punishing quiz popup, not part of the game

**What goes wrong:**
She runs, jumps, has fun — then a stark multiple-choice dialog slams over the screen. It reads as "back to homework." Engagement drops at the exact moment the project's core value ("she opens it because she wants to") should pay off.

**Why it happens:**
The math brain is ported from the v1/v2 quiz, so the path of least resistance is to render the old quiz UI verbatim. The platformer and the quiz end up as two disconnected apps glued together.

**How to avoid:**
Diegetic framing: the gate is a locked door / guardian / goal flag *in the level*, styled in the same dark/grunge pixel art as the world. Keep the avatar on screen. Transition in (don't hard-cut), use the game's font/palette, and frame it as "the door asks a riddle" rather than "Quiz: Question 1 of N". Reuse the math *brain* (weighted 6–9 selection) but build a *new* gate presentation, not the v2 modal.

**Warning signs:**
The gate uses different fonts/colors than the level; it's a full-screen white/system dialog; the avatar disappears; playtester (the kid) audibly groans or disengages when it appears.

**Phase to address:** P4 (gate presentation) and P5 (UAT confirms it doesn't read as homework).

---

### Pitfall 5: Frame-rate-dependent movement (not multiplying by `dt`)

**What goes wrong:**
The game feels right on the dev machine but the avatar moves twice as fast or jumps twice as high on a high-refresh (120/144 Hz) laptop, or crawls on a slow one. Jump arcs and run speed differ per device, making tuning meaningless.

**Why it happens:**
First-time game-loop authors update position with a fixed per-frame delta (`pos.x += speed`) instead of scaling by elapsed time. Kaplay provides `dt()`; if you bypass body() velocity and move objects manually, you must use it.

**How to avoid:**
Prefer Kaplay's `body()` + `vel` (px/sec, already time-based) and `setGravity()` for physics. For any manual movement, multiply by `dt()`. Test on at least one non-60 Hz refresh rate or use browser dev-tools throttling to confirm consistency before tuning feel.

**Warning signs:**
Jump height/run speed changes between monitors; tuning that felt good yesterday feels wrong on another machine; movement tied to a raw `+= constant` in the update loop.

**Phase to address:** P2 (platformer core) — establish dt-correct movement before tuning.

---

## Moderate Pitfalls

### Pitfall 6: Floaty / unresponsive jump (missing coyote time, jump buffer, variable height)

**What goes wrong:**
Jumps feel mushy or "eat" inputs — she presses jump at the ledge edge or a hair before landing and nothing happens. The game feels unfair, which is corrosive for a no-pressure ADHD context.

**Why it happens:**
A naive jump = "only if exactly grounded, fixed impulse, can't modulate." Real platformers fudge physics: **coyote time** (jump allowed for a few frames after leaving a ledge), **jump buffering** (a jump pressed just before landing fires on touchdown), and **variable jump height** (releasing jump early cuts upward velocity). Mario-feel uses asymmetric gravity (lighter going up, heavier coming down), not a pure parabola.

**How to avoid:**
Implement coyote time (~80–120 ms), jump buffering (~100–150 ms), and variable jump height. Use `isGrounded()` from `body()` to gate jumps but allow the coyote window. Tune gravity/jump impulse together; lower gravity = floaty, higher = snappy. Budget explicit tuning time — feel is iterative, not a one-shot constant.

**Warning signs:**
"It didn't jump!" complaints; jumps feel slow to start; can't make a gap that looks makeable; only one jump height regardless of tap vs hold.

**Phase to address:** P2 (core feel), refined in P5 (UAT tuning with the actual kid).

---

### Pitfall 7: Getting stuck on tile seams / tunneling through thin colliders

**What goes wrong:**
The avatar snags on the boundary between two floor tiles while running, or at fast fall speeds passes straight through a thin platform/floor and falls out of the world.

**Why it happens:**
Kaplay's collision module is still maturing (the docs note impulses/forces apply at center of mass, no torque, contact-point work pending). A floor built from many small per-tile colliders creates seams that catch a moving box; thin colliders + high velocity cause tunneling because collision is checked per frame, not swept.

**How to avoid:**
Merge runs of adjacent floor tiles into a single wide collider instead of one collider per tile. Keep platform colliders reasonably thick. Cap fall speed (terminal velocity) so per-frame movement stays smaller than collider thickness. If sticking persists, resolve X then Y movement separately. Build a tiny "stress" test strip (a long flat run + a fast drop) early.

**Warning signs:**
Avatar briefly halts mid-run over a flat floor; "fell through the floor" reports; getting wedged on corners when landing near a tile boundary.

**Phase to address:** P3 (level build / collider layout), with the physics behavior validated in P2.

---

### Pitfall 8: Loss of progress on death — the ADHD anti-pattern

**What goes wrong:**
Death (or a wrong math answer) sends her back to the start of the level or wipes the run, recreating exactly the punishment loop the project explicitly forbids.

**Why it happens:**
Default platformer instinct is "die = restart level." v2.0 already established the safe rule (death = restart floor, XP intact, no shame); v3.0 must carry it forward but it's easy to forget when bolting on hazards.

**How to avoid:**
Use checkpoints / generous respawn near the failure point, never a full restart. Wrong answer must not end the run or drop progress — re-ask or let her try again with no penalty/score loss (PROJECT.md: forgiving flow, no shame). Decide the death/wrong-answer policy as an explicit requirement, not an implementation accident.

**Warning signs:**
Respawn at level start after a fall; wrong answer closes the gate and dumps her back into the level or resets; any "you lost N points" messaging.

**Phase to address:** P2 (respawn policy for platforming) and P4 (wrong-answer policy at the gate); ADHD-safety verified in P5.

---

### Pitfall 9: Over-stimulating effects / too-long level

**What goes wrong:**
Screen shake, particle bursts, flashing, fast chaos, or a sprawling level overwhelm an ADHD player or cause fatigue/abandonment before the gate.

**Why it happens:**
"Juice" tutorials encourage heavy effects; Kaplay makes shake/particles easy. Level scope creeps because building platforms is fun. Neither respects the low-stimulation, single-polished-level goal.

**How to avoid:**
Keep effects subtle and purposeful (small, brief; no strobe/flash). Hold to ONE short, completable level (the milestone goal), sized so a first clear is a few minutes, not a marathon. No countdown timers anywhere (hard constraint). Provide a calm, readable scene over a busy one.

**Warning signs:**
Rapid flashing or constant shake; level takes many minutes with no checkpoint; playtester loses focus or says it's "too much"; any timer UI.

**Phase to address:** P3 (level scope) and P5 (effect intensity + ADHD-safety audit).

---

### Pitfall 10: Controls a kid can't discover

**What goes wrong:**
She doesn't know which keys move/jump, or the keys are awkward (e.g. only WASD when she expects arrows, or jump on an odd key). She stalls before the game even starts.

**Why it happens:**
Devs assume their own muscle memory. No on-screen prompt; controls undocumented in-game.

**How to avoid:**
Support both Arrow keys and WASD; jump on Space *and* Up. Show a short, persistent control hint at level start ("← → move, Space jump"), styled in-world. Confirm controls work on the target Windows laptop keyboard layout.

**Warning signs:**
"How do I move?"; she presses keys that do nothing; hint absent or hidden.

**Phase to address:** P2 (input mapping) and P5 (discoverability in UAT).

---

## Minor Pitfalls

### Pitfall 11: Contrast/readability on the dark grunge theme

**What goes wrong:**
Dark sprites on a dark background blend together; the avatar, hazards, goal, or gate text are hard to see. Math-gate answer options fail contrast and are hard to read.

**Why it happens:**
"Dark grunge, no pink" pushes toward low-contrast palettes. Pixel art on dark tiles can lose silhouette.

**How to avoid:**
Ensure the avatar and interactive elements have a high-contrast silhouette/outline against the background. Use the established neon accent (e.g. neon green/orange from the stack notes) for the goal, gate, and selected answer. Keep gate text at WCAG-AA contrast.

**Warning signs:**
"Where's my guy?"; can't tell platform from background; squinting at answer options.

**Phase to address:** P3 (palette/sprite selection) and P5 (readability check).

---

### Pitfall 12: Camera jitter / avatar not centered nicely

**What goes wrong:**
The camera stutters or snaps as it follows the avatar, causing visual noise (extra problematic for an ADHD player).

**Why it happens:**
Hard-setting camera position to the avatar every frame without smoothing, or fighting between physics update and render order, produces jitter.

**How to avoid:**
Use Kaplay's camera (`setCamPos` / camera follow) with light smoothing (lerp) rather than a hard snap. Update the camera after physics resolves. Keep a small dead-zone so tiny movements don't shake the view.

**Warning signs:**
Visible shaking/stutter when running; camera "vibrates" when standing still.

**Phase to address:** P2 (camera) and P5 (smoothness check).

---

### Pitfall 13: CC0 / asset-license verification mistakes

**What goes wrong:**
A sprite assumed to be CC0 actually isn't, or the Kenney logo gets shipped, creating a licensing problem in a project meant to have zero licensing risk.

**Why it happens:**
The itch.io "CC0" tag is community-applied and not always accurate per pack. Kenney assets are genuinely CC0 1.0 (free, commercial OK, attribution appreciated not required) — but the **Kenney logo is reserved** and not for use. Mixing one non-CC0 sprite into a CC0 set is easy.

**How to avoid:**
Verify each pack's own license page, not just the tag. Prefer Kenney packs (clearly CC0). Keep a `CREDITS`/`LICENSES` file recording each asset's source URL + license. Don't ship vendor logos. When in doubt, drop the asset.

**Warning signs:**
Asset license known only from a tag, not the pack page; a logo/wordmark in the sprite sheet; mixed-source assets with no record of origin.

**Phase to address:** P3 (asset selection + CREDITS file).

---

### Pitfall 14: Sprite atlas / spritesheet misconfiguration

**What goes wrong:**
Animations show the wrong frames, sprites bleed into neighbors, or slicing looks buggy (a known Kaplay sprite-slicing issue exists).

**Why it happens:**
`loadSprite`/`loadSpriteAtlas` frame counts, `sliceX`/`sliceY`, or anim definitions don't match the actual sheet grid; padding/spacing in the source sheet isn't accounted for.

**How to avoid:**
Match `sliceX`/`sliceY` and frame indices exactly to the chosen pack's grid; verify the pack's documented tile size. Test each animation in isolation. Pick a pack with a clean, uniform grid to minimize slicing pain.

**Warning signs:**
Edges of adjacent frames bleed in; animation plays wrong/garbled frames; off-by-one frame indices.

**Phase to address:** P3 (asset integration).

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reuse the v2 quiz modal verbatim as the gate | Fast to wire up | Reads as homework; undermines the whole pivot's value | Never — port the brain, build a new in-world gate |
| Module-level globals for run state | Quick to write | Leaks across `go()`/retries; subtle correctness bugs | Never for mutable run state; OK for true constants |
| One collider per floor tile | Mirrors the tilemap 1:1 | Seam catching, more collision checks | Only for the throwaway prototype strip; merge before P3 done |
| Double-click `file://` for "quick test" | No server needed | Assets break; false "it's broken" panic | Never as the shipped launch path; only for non-asset HTML checks |
| Hard-snap camera to avatar | Trivial | Jitter; visual stress for ADHD player | Acceptable only in earliest P2 spike |
| Skip `dt()` ("works on my machine") | Less code | Device-dependent feel; tuning invalidated | Never |

## Integration Gotchas

Connecting the ported math brain and CC0 assets into Kaplay.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Math brain → Kaplay scene | Keep selector state at module scope; it accumulates across retries | Construct fresh per scene entry; expose `reset()`; pass results via `go()` data |
| Vendored Kaplay | Grab "latest" and mix v3001/v4000/Kaboom snippets | Pin a version, comment source+version, code against that version's docs |
| Assets folder | Reference assets and open via `file://` | Serve over local HTTP; add a `file://` guard message |
| CC0 packs | Trust the itch CC0 tag; ship vendor logo | Verify each pack's license page; keep CREDITS file; never ship logos |
| Quiz UI → game gate | Render system/HTML dialog over the canvas | Render the gate in-world with game font/palette; keep avatar visible |

## Performance Traps

This ships to one Windows laptop browser — scale is tiny, but a single asset mistake can still stall it.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Huge / unoptimized PNGs | Long black screen on load; stutter | Use modestly sized pixel-art sheets; trim unused frames | Even one multi-MB sheet on a slow laptop |
| Loading assets inside the game loop | Hitches mid-play | Load all assets up front (Kaplay load phase) before the scene starts | First time an un-preloaded asset is needed |
| Manual per-frame movement without dt | Speed varies by refresh rate | dt-scale or use body()/vel | Any non-60 Hz display |
| Particle/effect spam | Frame drops, GC churn | Keep effects sparse and short-lived | Sustained emitters on a low-end iGPU |

## Security Mistakes

Local-only, offline, no backend, no PII beyond localStorage — classic web-security surface is minimal.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Assuming an asset is freely usable from a tag | Licensing exposure | Verify each pack's license page; keep CREDITS |
| Shipping a vendor logo/wordmark | Trademark misuse | Exclude logos; Kenney logo is explicitly reserved |
| Loading the vendored library from a CDN | Breaks offline guarantee; supply-chain dependence | Vendor the pinned file locally |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Gate as a stark quiz popup | "Back to homework"; disengagement | In-world door/guardian, game styling, avatar on screen |
| Wrong answer ends run / loses progress | Shame loop; ADHD-hostile | Re-ask, no penalty, no score loss |
| Full restart on death | Punishment loop | Checkpoint/generous respawn, progress kept |
| Undiscoverable controls | Can't start playing | Arrows + WASD, Space+Up jump, on-screen hint |
| Low-contrast dark theme | Can't see avatar/answers | High-contrast silhouettes + neon accents, AA text |
| Over-juiced effects / long level | Overwhelm, fatigue | Subtle effects, one short level, no timers |

## "Looks Done But Isn't" Checklist

- [ ] **Asset loading:** Works when *served*, not just for the developer — verify on the target Windows laptop via the start script, and confirm the `file://` guard message appears if double-clicked.
- [ ] **Scene retries:** Play, fail/win, replay — confirm score, question index, and HP all reset (no module-state leak).
- [ ] **Jump feel:** Coyote time + jump buffering + variable height all present, not just a fixed grounded jump.
- [ ] **Frame independence:** Same speed/jump on a non-60 Hz display (or with dev-tools throttling).
- [ ] **Death/wrong answer:** Neither loses progress; respawn is near, gate re-asks with no penalty.
- [ ] **Math gate styling:** Same font/palette as the world; avatar visible; not a system dialog.
- [ ] **Collision:** Long flat run doesn't snag on seams; fast fall doesn't tunnel through the floor.
- [ ] **Controls:** Arrows AND WASD work; on-screen hint present.
- [ ] **Contrast:** Avatar, goal, gate, and answer options readable on dark bg.
- [ ] **Licensing:** CREDITS file lists every asset's source + verified license; no vendor logos shipped.
- [ ] **No timers:** Nowhere in platforming or gate is there a countdown.
- [ ] **Version:** Vendored Kaplay version pinned and noted; no mixed Kaboom/v3001/v4000 calls.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| `file://` asset failure | LOW | Add launcher + serve over HTTP; add protocol guard message |
| Version-mixed code errors | LOW–MEDIUM | Pin one version; reconcile snippets against that version's docs |
| State leaking across scenes | MEDIUM | Move run state into scene callback; add `reset()`; pass via `go()` data |
| Gate feels like homework | MEDIUM | Re-skin gate in-world; keep avatar; reuse only the brain |
| Floaty/unresponsive jump | MEDIUM | Add coyote/buffer/variable height; iterate gravity+impulse with the kid |
| Seam stick / tunneling | MEDIUM | Merge floor colliders; cap fall speed; thicken platforms |
| Progress lost on death | LOW–MEDIUM | Add checkpoint/respawn; make wrong answer penalty-free re-ask |
| dt-dependent movement | LOW | Switch to body()/vel or multiply manual movement by dt() |
| Wrong CC0 assumption | LOW | Replace asset; verify license page; update CREDITS |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| `file://` CORS asset failure | P1 | Launch via start script on target laptop; assets render; guard message on double-click |
| Kaplay/Kaboom version churn | P1 (pin) / P2 (build) | Vendored file notes version; no deprecation warnings; no `is not a function` |
| State leaks across scenes | P2 (discipline) / P4 (port) | Replay resets score/index/HP |
| Math gate feels like a quiz | P4 / P5 | Gate uses game font/palette, avatar visible; kid doesn't disengage in UAT |
| Frame-rate-dependent movement | P2 | Consistent feel on non-60 Hz / throttled display |
| Floaty/unresponsive jump | P2 / P5 | Coyote+buffer+variable height present; kid can clear gaps |
| Seam stick / tunneling | P2 (physics) / P3 (colliders) | Flat-run + fast-drop stress test passes |
| Progress lost on death | P2 / P4 | Respawn near failure; wrong answer penalty-free |
| Over-stimulation / long level | P3 (scope) / P5 (audit) | One short level; subtle effects; no timers |
| Undiscoverable controls | P2 / P5 | Arrows+WASD work; hint shown |
| Low contrast on dark theme | P3 / P5 | Avatar/goal/gate/answers readable (AA text) |
| Camera jitter | P2 / P5 | Smooth follow, no stutter |
| CC0 license mistakes | P3 | CREDITS file complete; license pages verified; no logos |
| Sprite atlas misconfig | P3 | Each animation plays correct frames, no bleed |

## Sources

- [The relation of KAPLAY with Kaboom — kaplay wiki](https://github.com/kaplayjs/kaplay/wiki/The-relation-of-kaplay-with-Kaboom) — HIGH
- [Migrating to v3001 — KAPLAY guides](https://kaplayjs.com/docs/guides/migration-kaplay/) — HIGH
- [Kaboom.js is now Kaplay — JSLegendDev](https://jslegenddev.substack.com/p/kaboomjs-is-now-kaplay) — MEDIUM
- [KAPLAY loadSprite docs](https://kaplayjs.com/docs/api/ctx/loadSprite/) — HIGH (states a static server is needed for local files)
- [CORS request not HTTP — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors/CORSRequestNotHttp) — HIGH
- [KAPLAY Physics guide](https://kaplayjs.com/docs/guides/physics/) — HIGH (body, setGravity, isStatic, platformEffector, collision events, center-of-mass caveat)
- [KAPLAY Scenes guide](https://kaplayjs.com/docs/guides/scenes/) — HIGH (scene/go/data, stay(), "destroys all objects", code-outside-scenes caveat)
- [bug: Buggy sprite look when slicing #671 — kaplay](https://github.com/kaplayjs/kaplay/issues/671) — MEDIUM (sprite slicing pitfall)
- [Improve Your Game Feel With Coyote Time and Jump Buffering — GMTK/YouTube](https://www.youtube.com/watch?v=97_jvSPoRDo) — HIGH (game-feel consensus)
- [Creating smooth jump mechanics — Vibelf](https://www.vibelf.com/questions/2/smooth-jump-mechanics/) — MEDIUM (gravity/jump tuning ranges)
- [GameMaker Platformer Jumping Tips — Game Developer](https://www.gamedeveloper.com/design/gamemaker-platformer-jumping-tips) — MEDIUM
- [Platformer collision (axis-separated resolution) — LÖVE forums](https://love2d.org/forums/viewtopic.php?t=92438) — MEDIUM
- [Kenney Support / licensing (CC0, logo reserved)](https://kenney.nl/support) — HIGH
- [Pixel Platformer by Kenney — itch.io](https://kenney-assets.itch.io/pixel-platformer) — HIGH
- [Public Domain & Creative Commons — Sheridan Library guide](https://sheridancollege.libguides.com/c.php?g=710771&p=5064493) — MEDIUM
- [ADHD-Friendly Web Design — BOIA](https://www.boia.org/blog/adhd-friendly-web-design-minimizing-distractions) — MEDIUM (low-stimulation/no-timer principles)

---
*Pitfalls research for: first-time Kaplay 2D platformer + math gate for a child (offline, multi-file)*
*Researched: 2026-06-22*
