# Project Research Summary

**Project:** Math Lab — v3.0 "The Platformer"
**Domain:** No-build, offline, multi-file browser 2D platformer (Kaplay) with an end-of-stage math gate, for a 12-year-old (possible ADHD)
**Researched:** 2026-06-22
**Confidence:** HIGH

## Executive Summary

v3.0 pivots Math Lab from a quiz app into a real 2D platformer built on **Kaplay 3001.0.19** (the maintained successor to Kaboom.js), with the proven v1/v2 "math brain" (weighted 6–9 multiple-choice selection) **ported verbatim** and wired in as an end-of-stage gate. The expert pattern here is well-established: Kaplay owns the game loop, physics (`body()`/`setGravity()`), sprites, and input; plain ES modules wire the level and bridge to the math brain; CC0 pixel art (Kenney) supplies the dark/grunge visuals. The engine ships as a single vendored file with zero runtime dependencies, preserving the offline guarantee — but the "double-click the HTML file" experience does **not** survive the pivot: ES-module loading and sprite `fetch()` are both blocked over `file://`, so a one-line local static server (`python3 -m http.server`) becomes the mandatory, first-class launch path.

The recommended architecture draws a hard firewall: `src/math/` (the ported selector + accuracy/mastery state) imports nothing from Kaplay and stays a pure, testable module; a single `ui/mathGate.js` bridge is the *only* file that touches both worlds. The math gate itself uses a **paused-overlay-within-one-scene** pattern (`world.paused = true` on a parent container) rather than a separate scene — keeping the frozen level visible behind the question avoids the jarring scene-cut/re-spawn that would break the "I'm still in my game" feeling for the target user. Persistence/XP is deliberately deferred to a stubbed seam (`persistence/store.js`) that later costs ~3–5 lines to wire, not a restructure.

The dominant risks are not performance (scale is one laptop) but **feel and framing**. The math gate must read as a diegetic in-world door/guardian in the game's own palette — never a system quiz popup ("back to homework"), which would defeat the entire pivot. Movement must feel like Mario (coyote time, jump buffering, variable jump height — none free in Kaplay, all hand-coded) and must be `dt()`-correct or it breaks on non-60 Hz displays. Failure must never punish: gentle checkpoint respawn, wrong answers re-ask with zero penalty, no lives, no timers anywhere. Module-level state leaking across `go()`/retries is a classic Kaplay trap that would silently pre-clear the gate on replay. These are all known, documented, and avoidable with discipline established early.

## Key Findings

### Recommended Stack

Vanilla ES modules + a single vendored Kaplay file, served over a trivial local HTTP server. No bundler, no framework, no CDN in the shipped game. Engine choice, art source (CC0), and the ported math brain are already decided; STACK.md documents *how to execute them well* — exact versions, vendoring approach, and asset-loading APIs. Confidence is HIGH: versions were verified directly against the npm registry and jsDelivr file listing.

**Core technologies:**
- **Kaplay 3001.0.19** (pinned, vendored `kaplay.mjs`): scenes, `body()`/gravity physics, AABB collision, input, game loop — zero runtime deps, MIT, drops into a no-build offline project. (Avoid v4000-alpha; avoid the dead `kaboom` package.)
- **Vanilla JS (ES2020+ modules)**: game wiring + the ported `QuestionSelector` — ports in unchanged, clean multi-file split without a bundler.
- **HTML5 + CSS3**: `index.html` host page mounting the canvas; dark/grunge chrome around it.
- **`python3 -m http.server`** (or `npx serve`): REQUIRED for local play — browsers block ES modules and sprite fetch over `file://`. This is the canonical run command.
- **Kenney CC0 pixel-art packs** (asset data, not a dep): default to kenney.nl for uniform CC0 + consistent grid sizes; recolor freely to the dark palette.

### Expected Features

Scope is deliberately tight: **ONE polished level + the end-of-stage math gate.** The bar is "reads as a real game, not a tech demo" measured against her school's Mario-style math platformer.

**Must have (table stakes — P1):**
- Run + jump with gravity/weight, tuned for a satisfying arc
- Variable jump height, coyote time (~80–120ms), jump buffering (~100–150ms) — the difference between "Mario" and "stiff"; all hand-coded on top of Kaplay
- Solid platforms, ground, gaps; camera follow clamped to level bounds
- Visible goal → triggers math gate; clean physics pause for the gate
- Math gate: paused, in-world framed, 4-choice (ported brain, 6–9 weighted), **no timer**, forgiving on wrong, celebratory on clear
- Gentle checkpoint respawn (no lives, no XP loss); dark/grunge pixel art, no pink

**Should have (competitive differentiators — P2):**
- In-world gate framing (guardian/door/rune that "unlocks") — the key differentiator vs a popup
- Coins (collect + pop), one simple hazard/enemy → gentle respawn
- Jump/land juice (squash, dust), celebratory level-clear moment

**Defer (next milestones — P3+):**
- Audio (SFX/music — flagged as the biggest "real game" gap once the loop feels good)
- Double jump; second/third level + level select
- XP/leveling/persistence migration from v2
- Richer math mechanics (locked doors, collect-the-answer, defeat-the-enemy)

**Anti-features (explicitly excluded):** lives/game-over, any countdown timer, score/grade/accuracy shaming, instant-death pits, fail-out on wrong answer, leaderboards, pixel-perfect precision platforming. These encode the punishment loop the ADHD/no-pressure mandate forbids.

### Architecture Approach

A NEW Kaplay game shell wraps the PORTED, framework-agnostic math brain, joined by a single bridge file. The math module never imports Kaplay; `ui/mathGate.js` is the one auditable integration point. The end-of-stage gate uses a paused overlay (parent-container `world.paused = true`) so the level stays visible behind the question — no scene teardown, no re-spawn, no context loss. Persistence exists from day one as a no-op stub so wiring it later is "fill in the file."

**Major components:**
1. `main.js` + `assets.js` (NEW) — `kaplay()` init, centralized asset loading, scene registration
2. `scenes/game.js` + `entities/*` + `levels/level1.js` (NEW) — the one playable level via string tile-map, player/platform/goal as Kaplay ECS component factories
3. `ui/mathGate.js` (NEW glue) — the ONLY bridge; paused overlay, calls `selectNext`, records `updateAccuracy`, resumes/advances with deferred `wait(0,...)` unpause
4. `math/{config,playerState,questionSelector}.js` (PORTED verbatim) — pure ES modules; minimal port = selector + CONFIG + accuracy/mastery half of PlayerState
5. `persistence/store.js` (DEFERRED stub) — no-op seam; later ~3–5 lines to wire

### Critical Pitfalls

1. **`file://` CORS asset failure** — sprites silently never load when double-clicked. Mandate a local server; add a `location.protocol === 'file:'` guard with a friendly message. Establish this in P1 before any assets exist.
2. **Kaplay/Kaboom version churn** — mixed-vintage snippets throw `is not a function`. Pin 3001.0.19, comment source+version atop the vendored file, code against that version's docs only.
3. **Module-level state leaks across `go()`/retries** — score/question-index/gate-cleared flags carry over, pre-clearing the gate on replay. Initialize all run state *inside* scene callbacks; pass data via `go(name, data)`; expose `reset()`.
4. **Math gate reads as a punishing quiz popup** — the path of least resistance (reuse the v2 modal) defeats the pivot. Build a NEW in-world gate in the game's font/palette, avatar visible; reuse only the brain.
5. **Frame-rate-dependent movement** — `pos.x += speed` runs 2× fast on a 120Hz laptop. Use `body()`/`vel` (time-based) or multiply manual movement by `dt()`; verify on a throttled/non-60Hz display.

(Moderate/minor: floaty jump feel, tile-seam stick/tunneling, progress loss on death, over-stimulation, undiscoverable controls, dark-theme contrast, camera jitter, CC0 license verification, sprite-atlas misconfig.)

## Implications for Roadmap

The four research files converge on an explicit, dependency-driven 5-phase shape (ARCHITECTURE.md's build order and PITFALLS.md's phase mapping agree on it). Recommended structure:

### Phase 1: Project Setup & Local Serving
**Rationale:** Riskiest infra step; unblocks everything. The `file://` and version-pinning pitfalls bite before any game code exists.
**Delivers:** `index.html` + vendored `lib/kaplay.mjs` (pinned 3001.0.19, version-commented) + `main.js` booting an empty `scene("game")` that draws "hello", confirmed running via `python3 -m http.server`. A `file://` protocol guard message.
**Avoids:** Pitfall 1 (`file://` CORS), Pitfall 2 (version churn).

### Phase 2: Platformer Core (Movement / Physics / Camera)
**Rationale:** The intrinsically-fun spine everything decorates; establishes dt-correct movement and scene-state discipline before tuning.
**Delivers:** Player `body()`+`area()`, gravity, run/jump (Arrows AND WASD, Space+Up), variable jump height + coyote time + jump buffering, smoothed camera follow, gentle-respawn policy.
**Uses:** Kaplay `body()`/`setGravity()`/`isGrounded()`/`setCamPos`.
**Implements:** `entities/player.js` component factory.
**Avoids:** Pitfall 5 (dt), Pitfall 6 (floaty jump), Pitfall 12 (camera jitter), state-leak discipline groundwork.

### Phase 3: Level Build & CC0 Assets
**Rationale:** Depends on core movement; validates asset/atlas handling and collider layout.
**Delivers:** `assets.js` centralized loads, CC0 pack chosen + recolored dark (no pink), `levels/level1.js` string tile-map via `addLevel()`, one polished completable level with goal, coins, one hazard, checkpoints; CREDITS/LICENSES file.
**Uses:** `loadSpriteAtlas`, Kenney CC0 packs.
**Avoids:** Pitfall 7 (merge floor colliders, cap fall speed), Pitfall 9 (one short level, subtle effects), Pitfall 11 (contrast), Pitfall 13 (CC0 verification), Pitfall 14 (atlas config).

### Phase 4: Math-Gate Integration (Port the Brain)
**Rationale:** The milestone's keystone. Joins the ported brain (which can be ported in parallel with P2–P3, zero game dependency) to the level via the single bridge.
**Delivers:** `math/*` ported verbatim as pure modules; `ui/mathGate.js` paused-overlay gate — goal collision → `world.paused = true` → in-world question (4 choices, no timer) → `updateAccuracy` → deferred unpause; forgiving wrong-answer re-ask; persistence seam stub confirmed as one-liners.
**Implements:** the math firewall + bridge; deferred persistence seam.
**Avoids:** Pitfall 3 (state leaks), Pitfall 4 (quiz-popup framing), Anti-pattern of modifying the tuned algorithm.

### Phase 5: Polish, ADHD-Safety & UAT
**Rationale:** Last; depends on all. Feel and framing are validated only with the actual kid.
**Delivers:** dark/grunge styling pass, jump-feel tuning with the kid, control-hint discoverability, no-timer/forgiving-loop audit, the "Looks Done But Isn't" checklist run on the target Windows laptop.
**Avoids:** confirms Pitfalls 4, 6, 8, 9, 10, 11, 12 are actually resolved in front of the user.

### Phase Ordering Rationale
- **Infra-first:** the offline/server/version risks are cheapest to fix before code exists and would otherwise produce false "it's broken" panic on the target machine.
- **Movement before level before gate:** collision is the spine — gaps, coins, hazards, and goal are all `area()` interactions atop `body()` movement; the gate depends on a working goal + a clean pause.
- **Math port parallelizable:** P4's port (step 5 in ARCHITECTURE.md) has zero dependency on the shell and can run alongside P2–P3; P4's bridge is the join point.
- **Feel/safety last and with the kid:** the ADHD-friendliness and game-feel levers are iterative and only verifiable in UAT.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Coyote time / jump buffering / variable jump height are NOT built into Kaplay `body()` — implementation patterns are decades-stable but engine-specific wiring should be spiked. Collision edge cases (seams/tunneling) are MEDIUM-confidence (Kaplay collision module still maturing) — worth a small stress-test plan.
- **Phase 4:** The paused-overlay pause-ordering gotcha (`wait(0,...)` deferred unpause) and the exact minimal port surface of PlayerState warrant a focused read of the actual `math-lab.html` source during planning.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1:** Vendoring + static server is fully documented in STACK.md.
- **Phase 3:** Asset loading + string tile-map levels are HIGH-confidence official-doc territory.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified directly against npm registry + jsDelivr file listing + official kaplayjs.com docs. |
| Features | HIGH (platformer) / MEDIUM (ADHD framing) | Platformer conventions decades-stable and cross-verified; ADHD-friendly specifics are established principles but individual response varies — verify in UAT. |
| Architecture | HIGH | Pattern grounded in official Kaplay scene/pause docs + direct read of the v1/v2 math brain source. |
| Pitfalls | HIGH / MEDIUM | HIGH on version/CORS/scenes/game-feel/licensing; MEDIUM on Kaplay collision edge cases (less-documented, maturing module). |

**Overall confidence:** HIGH

### Gaps to Address
- **Game feel is iterative, not specified:** exact gravity/jump-impulse/coyote/buffer values must be tuned with the actual kid in P5 — budget explicit tuning time; treat ranges from research as starting points only.
- **ADHD response is individual:** the no-timer/forgiving/low-stimulation principles are sound but must be confirmed via UAT (P5), not assumed.
- **Kaplay collision robustness (MEDIUM):** build a long-flat-run + fast-drop stress strip early (P2/P3) to surface seam-stick/tunneling before the real level is built.
- **Minimal port surface:** confirm exactly which PlayerState methods `selectNext` depends on by re-reading `math-lab.html` during P4 planning (research says selector + CONFIG + accuracy/mastery half + keep `toJSON/fromJSON`).
- **Audio deferred but flagged:** silence noticeably weakens the "real game" feel; revisit immediately after the loop validates.

## Sources

### Primary (HIGH confidence)
- npm registry `registry.npmjs.org/kaplay` + jsDelivr `data.jsdelivr.com/.../kaplay@3001.0.19` — verified `latest`=3001.0.19, real dist files (`kaplay.js`/`.mjs`/`.cjs`, no `.min.js`), MIT.
- kaplayjs.com docs — install (global/ESM/npm; local server needed), physics (`body`/`setGravity`/`isStatic`/`isGrounded`), scenes (`go`/`stay`/"destroys all objects"), pausing (`obj.paused`, deferred-unpause `wait(0,...)`), `loadSprite`/`loadSpriteAtlas`/`addLevel`.
- `math-lab.html` (this repo) — QuestionSelector / PlayerState / CONFIG / PersistenceStore source of truth for the port.
- `.planning/PROJECT.md` v3.0 — scope, ADHD/no-pressure mandate, deferred roadmap, out-of-scope.
- kenney.nl/support + Pixel Platformer — CC0 1.0, 18×18 tiles, packed sheet, logo reserved.
- MDN — `file://` CORS errors; W3C/MDN form + CSS references.

### Secondary (MEDIUM confidence)
- GMTK "Coyote Time and Jump Buffering" + GameMaker/Godot/Roblox community resources — game-feel consensus (treated HIGH for decades-stable mechanics).
- JSLegendDev "Kaboom is now Kaplay" / "Kaplay in 5 Minutes" — ECS + version-relation overview.
- BOIA ADHD-Friendly Web Design — low-stimulation / no-timer principles.

### Tertiary (LOW confidence)
- Kaplay GitHub issue #671 (sprite-slicing bug) — single-source caveat for atlas config; validate during P3.
- itch.io CC0 tags — community-applied, must be verified per-pack against the pack's own license page.

---
*Research completed: 2026-06-22*
*Ready for roadmap: yes*
