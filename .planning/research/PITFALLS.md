# Pitfalls Research

**Domain:** v6.0 "SNES-Fidelity World" — art overhaul + world motion + mechanic removal + mobile touch, added to a shipped, kid-validated, no-build Kaplay platformer
**Researched:** 2026-07-09
**Confidence:** HIGH for codebase/engine-derived pitfalls (verified against the live tree and the vendored `lib/kaplay.mjs` source, plus the v6-scouting spike facts); MEDIUM for mobile-browser behavior (WebSearch cross-checked against the HTML spec text and WebKit posts)

This is not generic gamedev advice. Every pitfall below was checked against this repo: the vendored Kaplay 3001.0.19 source, `src/`, `scripts/`, the v6 pre-work (`.planning/research/v6-scouting/SPIKE-FINDINGS.md`, `ASSET-SCOUTING.md`), and the project's binding rules in `.claude/CLAUDE.md`. Spike findings are treated as verified fact per the milestone decision.

Phase names below refer to the v6.0 functional phases (roadmap not yet numbered): **Mechanic Cleanup**, **Asset Bake (ART-01)**, **Art Integration / Re-dress**, **World Motion**, **Level Quality Pass**, **Mobile**, **Closing Verification**.

## Critical Pitfalls

### Pitfall 1: Touch coordinates are broken under the project's own load-bearing `transform: scale(1.5)` rule

**What goes wrong:**
Touch taps on canvas objects (challenge answer boxes, level-select tiles, the mute icon — every `box.onClick()` and any `onTouchStart` position) land ~1.5× too far from the top-left in world space. Taps only register correctly near the origin; answer boxes become untappable or the wrong answer gets selected. Mouse clicks keep working, so desktop testing shows nothing.

**Why it happens:**
Verified in the vendored `lib/kaplay.mjs`: the mouse path reads `event.offsetX/offsetY`, which the browser computes in the element's **untransformed layout box** — this is exactly why the documented `transform: scale()` display trick (in `src/main.js`) is safe for mouse. But the touch path (`touchstart`/`touchmove`/`touchend`, both `touchToMouse` and `onTouchStart`) computes position as `clientX - canvas.getBoundingClientRect().x` with **no scale compensation** — and `getBoundingClientRect()` returns the **post-transform** (visually scaled) box. The two documented rules — "NEVER scale via width/height" and "add touch controls" — are in direct engine-level tension. There is no configuration where the current scaling approach and canvas touch hit-testing are both correct.

**How to avoid:**
The Mobile phase must resolve the scaling strategy deliberately, not bolt touch on top:
- Option A (likely right): move display scaling into the engine — `kaplay({ letterbox: true, stretch: true })` sizes the canvas layout box for real, and the engine's letterbox branch remaps mouse via scaled `offsetX` while touch's `clientX - rect` math becomes consistent (rect == layout box). This **re-opens the exact Phase 14 mouse-click trap**, so it requires a full regression of `box.onClick()` with BOTH mouse and touch at multiple display sizes before anything else lands on it.
- Option B: keep the canvas untouched for desktop and put ALL touch controls (D-pad, jump, answer buttons 1–4, mute, reset) in a DOM overlay outside the canvas — sidesteps canvas touch mapping entirely, at the cost of duplicating the answer UI.
- Never patch the vendored engine file (pinned, sha256'd, no-upgrade rule).

**Warning signs:**
"Touch works" claims tested only with Playwright mouse emulation; taps that work at browser zoom 100% on desktop but miss on a phone; the mute icon working by keyboard but not by tap.

**Phase to address:** Mobile (a scaling-strategy decision spike FIRST, then the input layer). Closing Verification must include a real-device tap test — desktop emulation cannot catch `getBoundingClientRect` vs `offsetX` divergence unless the transform is actually applied.

---

### Pitfall 2: The static validator false-PASSes (or false-FAILs) levels with moving platforms

**What goes wrong:**
`scripts/lib/reachability.mjs` builds its node graph from `g.floors` + `g.platforms` only and iterates a fixed mechanic list (`doors, mathGates, enemies, collectZones`). A new `movers` descriptor field is silently ignored — the validator stays green while a level actually depends on a platform being at the right extreme (spike-verified: a jump that works at the near extreme HARD-FAILs at the far one). The permanent VALID-01 gate becomes a liar precisely when the milestone's headline motion feature lands. The inverse failure also bites: treating the mover as a static platform at its spawn position validates geometry the player can never rely on.

**Why it happens:**
The validator was empirically calibrated (Phase 23) against a fully static world; nothing in it errors on unknown descriptor fields. "Validator green" is this repo's strongest habit-level trust signal, so nobody re-questions it.

**How to avoid:**
Teach the validator movers BEFORE the first mover ships in a level, and prove it RED-first (the Phase 23 discipline): author a fixture level that is only crossable when the mover is at its far extreme and confirm HARD-FAIL. Adopt the spike's rule — model the mover at BOTH extremes and require reachability at the **worst-case** extreme. An even safer standing policy worth considering: movers are never load-bearing (spawn→goal reachability must hold with all movers deleted); then movers are pure delight, the static graph stays sound, and no soft-lock is possible.

**Warning signs:**
A `movers` field appears in any `level-0N.js` before `validate-levels.mjs` knows the word; a validator diff with no new RED-first fixture; a level where deleting the mover array changes reachability.

**Phase to address:** World Motion — validator extension is Wave 1 of that phase, level integration only after.

---

### Pitfall 3: Removing collect-the-answer breaks the harnesses that actively defend it

**What goes wrong:**
The repo's own gates fight the removal. Verified defenders: `check-gate.sh` check #13 **HARD-FAILs if `src/mechanics/collect.js` is missing** ("must reuse the shared seam"); `scripts/smoke-progress.mjs` embeds per-level golden geometry fixtures including `collectZones` and `answerPickupSlots` lines (this exact class of stale-fixture bug already shipped once — Phase 26 CR-01); `scripts/audit-phase21-mechanics.mjs` has special-cased `answer-zone` triggered-only semantics; `scripts/lib/reachability.mjs` iterates `collectZones`, references `CONFIG.COLLECT.ZONE_W`, and has self-test fixtures using collect. Delete naively and either gates go red and get "fixed" by keeping a dead `collect.js` corpse around, or fixtures get half-updated and a real regression hides behind the noise.

**Why it happens:**
The mechanic is woven into 5 level descriptors (01, 03, 04, 06, 08 — 02/05/07 carry empty `collectZones: []`), `build.js`, `game.js` wiring, `config.js`, AND four independent verification surfaces. Nobody holds the full inventory in their head.

**How to avoid:**
One dedicated removal phase (it's backlog 999.1 promoted, not a side-task of re-dress), executed as: (1) grep inventory of every `collect|answerPickup|answer-zone` reference across `src/` AND `scripts/` committed as the plan's checklist; (2) remove code + descriptor fields + gate-script check #13 + golden fixtures + audit expectations + validator mechanic list **in the same change**; (3) run the full 8-command gate suite, not just the touched gate. Decide explicitly whether `collectZones: []` stays as a tolerated dead field or the schema drops it everywhere (including `scripts/fixtures/bad-level.js`) — half-measures are what rots.

**Warning signs:**
`collect.js` still existing after "removal" to keep check-gate green; a fixture diff smaller than the level diff; `check-progress.sh` (which ends with `smoke-progress.mjs`) failing on geometry that "didn't change."

**Phase to address:** Mechanic Cleanup — and per the locked milestone decision, this lands BEFORE any level re-dress so no content gets dressed that's about to change.

---

### Pitfall 4: New sprites lie about where solid ground is (anchor/size/cap-lip drift)

**What goes wrong:**
Visuals and colliders are already split (the spike's rendering recipe explicitly leaves merged colliders unchanged), so the validator and physics stay perfectly green while the **picture** drifts: the Gothic Hero candidates are ~40–48px tall on the existing 16×32 collider, and Gothicvania terrain caps carry ~20–24px decorative lips above the fill. Wrong anchor or an unaccounted lip makes feet float above ground, sink into it, or the taller sprite clip through low ceilings and door frames — the game *feels* broken while every automated check passes.

**Why it happens:**
Every check in this repo validates geometry, not pixels. A bigger sprite on the same hitbox is exactly the kind of change no existing gate can see. The spike itself already demonstrated the failure class: its first "59fps win" was an invisible fill caught only by screenshot ("checks that don't look at pixels lie").

**How to avoid:**
Fix a written sprite-baseline convention before integration: player sprite anchored `"bot"` at collider bottom-center; terrain atlas cut so the **collider top edge == the visual walkable line** (the bake step must place cap lips *above* that line by a constant, documented offset — the spike already flags that the real atlas wants 16×32 cap tiles). Then prove it with screenshots at known coordinates: player standing on flat floor, on a 1-tile platform, under the lowest ceiling in levels 7–8, at a door. Use `?debug=1` (which draws the real colliders) side-by-side with the dressed render as the standard checkpoint artifact.

**Warning signs:**
Any `area()`/`anchor()` change riding along in an "art-only" commit; player feet not touching the drawn surface in a screenshot; sprite head poking through platforms above.

**Phase to address:** Asset Bake defines the convention (atlas cut + offsets); Art Integration proves it per biome with screenshot checkpoints; the human style-board/sign-off gates catch what automation can't.

---

### Pitfall 5: Regressing the spike's two proven perf/rendering cliffs during real integration

**What goes wrong:**
Two spike-verified failure modes reappear at scale: (a) per-tile sprite fill collapses the frame rate on real level sizes — 5,600 objects ran at **15fps**, and `offscreen({hide})` culling does NOT rescue it (22fps; update overhead dominates, not draw); (b) one giant `tiled: true` quad **silently renders nothing** past the internal vertex-batch ceiling (~400×13 tiles in one object) — the level looks like a void with zero errors and, worse, great FPS. The 8 real levels (up to ~6,200px) are far bigger than the spike scene, and it's easy to "simplify" the chunking away during the port.

**Why it happens:**
The naive per-tile loop is the obvious implementation; the chunked recipe is non-obvious and looks like premature optimization to anyone who didn't read the spike. The giant-quad failure is silent, so a lazy port passes every non-visual check.

**How to avoid:**
Port the spike recipe literally (occupancy set → per-tile cap/edge sprites → interior fill as chunked `{tiled:true}` sprites, **≤ ~40×16 tiles per chunk**). Add a build-time budget assertion in `build.js`'s visual pass (object count per level ~O(width/16); the 6,200px guide is ~400 cap tiles + ~20 fill chunks). Extend `browser-boot.mjs` with a per-level screenshot + non-blank-fill pixel check and an FPS sample — the drive-across-all-levels harness already exists; give it eyes.

**Warning signs:**
Entity counts in the thousands per level; a level that renders "fine" in a 640px viewport but has invisible terrain further right; FPS fine on level 1 but sludgy on level 7.

**Phase to address:** Art Integration (terrain fill wave), with the budget assertion and screenshot checks landing in the same phase as the renderer, not later.

---

### Pitfall 6: `check-safety.sh` violations imported via copied Kaplay snippets — or worked around

**What goes wrong:**
Kaplay's public docs and community examples use `wait()`, `loop()`, and `lifespan()` for exactly the things v6.0 builds (patrols, ambient animation, platform cycles). Copying any of them trips the banned-construct grep (`setTimeout|setInterval|wait\(|loop\(|lifespan\(`). The failure mode isn't the red gate — it's the *response* to it: renaming, wrapping, or hand-rolling a scheduler to sneak past the grep, which violates the actual ADHD-safety mandate the grep protects.

**Why it happens:**
The banned idioms are the ecosystem's default; the repo's compliant idioms (dt-accumulator in `onUpdate`, `tween().onEnd()` self-clean) exist only in this codebase and in `spike-code/main.js`.

**How to avoid:**
The spike already produced check-safety-compliant, port-ready idioms for every motion need: the dt-based sine mover, native `stickToPlatform` carry (write NO carry code — the manual-carry anti-pattern measured 4.2% mounted vs 100%), and the built-in `patrol()` component (dt-based `moveTo` internally, no schedulers; its `endBehavior: "loop"` **string** doesn't match the `loop(` grep — verified against the pattern in `check-safety.sh` line 59). Rule for the phase: motion code is ported from `spike-code/`, never from web docs. Run `check-safety.sh` per commit during World Motion, not at phase close.

**Warning signs:**
Any diff containing `wait(` or `loop(` with parens; a helper named anything like `delay`/`schedule`/`every`; rider-carry code appearing in a platform's `onUpdate`.

**Phase to address:** World Motion (and Art Integration for ambient animation).

---

### Pitfall 7: World motion that is ADHD-unsafe or soft-locking despite green gates

**What goes wrong:**
Moving platforms and patrollers introduce the first *time-varying* world state in the game, and every safety property so far was proven on a static world: a mover can carry a standing player into spikes or off-world; a platform that departs "without you" creates de-facto timing pressure (a countdown by another name); a mover can push the player through geometry or out of camera `bounds`; a patrolling enemy that shares a silhouette with math-blocker enemies teaches her that some enemies are safe to touch and some open a challenge — then one of them surprises her. None of this is countdown-timer pressure by the grep's definition, but all of it violates the no-startle/no-pressure mandate in spirit.

**Why it happens:**
The safety gates check for *constructs* (timers), not *dynamics*. Motion safety is a design property only interactive play can verify.

**How to avoid:**
Write motion design rules into `docs/LEVEL-DESIGN.md` before authoring: movers never traverse over/into hazards; every mover section has a checkpoint before it; a missed mover always means "wait for it to come back," never "fall to death" (put floor or a checkpoint-respawn pit under it, and respawn is already forgiving); cosmetic patrollers get visually distinct sprites from blocker enemies (the scouted bestiary is big enough — hell hound/wolf for patrol, idle-frame statues/ghouls for blockers) and **no hurt-on-collide handler at all** (enforce: cosmetic patrol entities carry no `onCollide` damage wiring — a grep-able invariant worth adding to a gate). Extend the interactive audit to ride every mover full-cycle and cross every patroller.

**Warning signs:**
A mover whose path intersects a spike's collider box; any level where the fastest route requires hitting a platform's window; a kid-UAT note like "the dog scared me."

**Phase to address:** World Motion (rules + enforcement), Level Quality Pass (per-level application), Closing Verification (kid-UAT explicitly asks about the moving things).

---

### Pitfall 8: Pink leaks back in — and CC-BY leaks in with it

**What goes wrong:**
Two known contamination vectors from the scouted packs: the Town dusk sky is salmon-pink and the Cemetery horizon glow is magenta (both flagged in ASSET-SCOUTING.md; both violate the enforced no-pink rule as-is), and the Gothicvania zips **contain CC-BY music by Pascal Belisle** inside otherwise-CC0 art packs. Vendoring a zip wholesale drags attribution-bound audio into `assets/` with no CREDITS entry (a license violation), and skipping the retint ships pink. A subtler version: retinting at *runtime* via Kaplay tint fights the whole point of the milestone (SNES-fidelity source art, replacing the tint-based theming) and interacts badly with the 8-accent palette system.

**Why it happens:**
Pack contents are heterogeneous; the pink is in background layers you might not scrutinize tile-by-tile; "extract the zip into assets/" is the path of least resistance.

**How to avoid:**
The bake pipeline (`scripts/build-art-assets.py` lineage, pure Pillow) is the only door into `assets/`: it copies **named files only** (never zip-globs), applies the hue-shift at bake time (already live-proven — the style board's steel-blue town sky and cold-blue cemetery glow came from this exact pass), and every vendored file lands with an `assets/LICENSES/` entry + `CREDITS.md` line in the same commit. Add an automated pink-hue scan over baked PNGs (flag pixels in the magenta/pink hue window above a saturation floor) as a permanent gate next to `check-contrast.mjs` — the no-pink rule is currently enforced only by human eyes.

**Warning signs:**
Any `.ogg`/`.mp3`/`.wav` appearing in an art-phase diff; an `assets/` commit without a paired LICENSES/CREDITS change; a baked background whose hue histogram peaks in the 300–350° range.

**Phase to address:** Asset Bake (pipeline + pink gate + license inventory); the style-board human sign-off BEFORE integration is already a locked milestone decision — the pitfall is letting integration start "just a little" before the sign-off under schedule pressure. Don't.

---

### Pitfall 9: Mobile touch layer leaks across scenes — the inverse of the input-bus trap

**What goes wrong:**
The repo's established discipline handles Kaplay handlers (`go()` clears the input bus per scene; the audio mute key is re-registered per scene). A DOM-overlay touch layer has the **opposite** lifetime: DOM button listeners survive `go()` forever. A "jump" button holding a closure over a destroyed player object fires into a dead scene — stale-closure errors, double-registered handlers stacking across scene transitions (the exact leak class the anti-leak rule exists for), or a jump button that still "works" on the title screen.

**Why it happens:**
Two event systems with opposite teardown semantics now coexist. Everything the team knows about input lifetime (per-scene re-registration) is exactly wrong for DOM listeners.

**How to avoid:**
One thin adapter module (mirroring `src/audio.js`'s per-scene mount pattern): DOM listeners are registered ONCE and dispatch to a mutable "current scene bindings" table; each scene sets its bindings on entry and clears them via `onSceneLeave` — same discipline, one seam. Never let a scene file `addEventListener` directly. Alternatively (if touch input goes through Kaplay's `onTouchStart` after the scaling fix), the existing per-scene rules apply unchanged — one more reason to prefer engine-side touch where coordinates allow.

**Warning signs:**
`addEventListener` appearing anywhere except the one adapter module; touch buttons responsive on scenes that shouldn't have them; handler counts growing across repeated select↔game transitions.

**Phase to address:** Mobile.

---

### Pitfall 10: Re-dress edits drift into kid-validated geometry (and the bounds trap)

**What goes wrong:**
The re-dress touches every level file's *visual* aspects while the binding rule says geometry is untouchable ("re-dressed, not rebuilt"). With biome theming, prop placement, and the sanctioned Level Quality Pass fixes (unreachable pickups/ledges in 5–8, level-07/08 climb differentiation) all landing near the same arrays, an "innocent" nudge to a platform's x to fit a prop is a geometry edit to a kid-validated level. Related trap, already documented: level-01 derives its camera right edge from geometry but level-02+ carry an explicit `bounds` field used AS-IS — differentiating the level-07/08 end climbs (which may lengthen them) without hand-bumping `bounds.right` clips the camera/parallax at the old edge.

**Why it happens:**
Visual and structural data live in the same descriptor files; the quality pass legitimately edits *some* geometry (levels 5–8 fixes are sanctioned), which blurs the line for the rest.

**How to avoid:**
Separate the sanctioned geometry fixes (Level Quality Pass, its own phase/plans, validator + golden-fixture updates included) from the re-dress (Art Integration, which must produce **byte-identical geometry arrays** — diff-check the `floors/platforms/spikes/checkpoints/goal` fields as a review gate). Any quality-pass geometry change updates `smoke-progress.mjs` golden fixtures deliberately (CR-01 precedent) and re-runs `validate-levels.mjs`. Bounds rule: any level whose rightmost geometry moves gets a paired `bounds.right` diff — make the validator warn when `bounds.right` < rightmost entity extent (cheap check, catches it permanently).

**Warning signs:**
An art-phase diff touching coordinate numbers in geometry arrays; golden fixtures updated in an "art-only" commit; the camera stopping short of a new climb section.

**Phase to address:** Ordering is the prevention — Mechanic Cleanup → Level Quality Pass (geometry, validator-gated) → Art Integration (visuals only, geometry-frozen).

---

### Pitfall 11: The audio gesture gate silently fails on touch — and Phase 28's proof doesn't cover it

**What goes wrong:**
Music never starts on mobile (or starts only after a later keyboard-ish interaction that never comes on a phone). Per the HTML spec, `touchstart` is **not** an activation-triggering input event (the list is keydown, mousedown, pointerdown[mouse], pointerup[non-mouse], touchend) — and verified in the vendored engine, Kaplay fires its synthetic `mousePress`/click path on **touchstart**, additionally deferred to the next frame via `events.onOnce("input", ...)`. So the title screen's "first gesture" handler runs one frame after a non-activating event. In practice the tap's own `pointerdown`/`pointerup` usually establishes transient activation at the UA level so `AudioContext.resume()` succeeds anyway — but that is a browser-behavior assumption, and Phase 28's automated gesture-gate proof (`audioCtx.state` after a synthetic **mouse** click) structurally cannot detect a touch-path failure.

**Why it happens:**
Desktop-proven audio gating + a different event taxonomy on touch + an engine that quietly rebrands touchstart as mouse.

**How to avoid:**
In the Mobile phase, extend the audio proof with Playwright touch emulation (tap → assert `audioCtx.state === "running"`), and treat real-device verification (iOS Safari + Android Chrome) as mandatory in Closing Verification — this is precisely the class of thing the repo's "checks that don't play the game lie" rule exists for. If a real device fails, the fix is a one-time DOM-level `touchend`/`pointerup` unlock listener in the adapter module (a legitimate activation event), not a change to `ensureMusicPlaying()`'s synchronous-call-stack rule.

**Warning signs:**
Music working on the dev laptop and "probably fine" on mobile; any audio-start code moved into a `.then()`/tween callback while debugging (explicitly forbidden by title.js's documented rule).

**Phase to address:** Mobile (automated touch proof), Closing Verification (real-device + kid-UAT).

---

### Pitfall 12: Process regressions under a big milestone — automation-only closes, rubber stamps, and divergent Playwright copies

**What goes wrong:**
v6.0 has more human-judgment gates than any prior milestone (style board, per-biome cohesion, n0x logo, mobile feel, kid-UAT) and more new Playwright surface (touch emulation, mover riding, screenshot checks). The historical failure modes are all documented in this repo: phases closed on greps alone shipped a total soft-lock (v4.0 collect.js); auto_advance rubber-stamped human-verify checkpoints until Phase 25 established the ask-the-user rule; Phase 27's audio needed **5 genuine sign-off rounds** — a one-round art sign-off for 4 biomes × 8 levels would be a red flag in itself. And new browser scripts will copy server/guard boilerplate from `browser-boot.mjs` per the deliberate duplication convention — a bug fixed in one copy and not the others makes the harnesses disagree about reality.

**Why it happens:**
Milestone pressure + an autonomous workflow whose default is to advance.

**How to avoid:**
Already-standing rules, restated as v6.0 phase requirements: every art/logo/mobile phase carries an explicit `checkpoint:human-verify` that auto_advance may NOT approve (memory: never-rubber-stamp); style-board sign-off happens BEFORE integration (locked decision — enforce as a phase dependency, not a hope); every new Playwright script that copies the server/guard block gets listed in the CLAUDE.md duplication note, and any boilerplate bugfix is applied to **every** copy in one commit; no v6.0 phase closes without interactive proof appropriate to its feature (ride the mover, tap the button, look at the pixels).

**Warning signs:**
A checkpoint approved in the same second it was raised; an art phase with zero rejected candidates; two harness scripts reporting different results for the same level.

**Phase to address:** Every phase — but encode it in each phase's plan (checkpoint types + verification lists), not as a vibe.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep `collectZones: []` as a tolerated dead schema field after removal | Smaller diff; fixtures/validator untouched | Schema lies; next contributor re-implements against it; validator loop iterates a ghost | Acceptable ONLY if documented in build.js + validator as intentionally dead — full removal preferred |
| Runtime `tint()` retinting instead of bake-time hue conform | No Pillow pipeline work | Fights the accent-palette system; muddies SNES fidelity; pink source pixels still in the repo | Never for v6.0 — bake-time retint is spike/style-board proven |
| Load all 4 biomes' sprites up-front in main.js (current pattern, scaled up) | No loader changes | Load-time regression on mobile networks; manifest bloat; each wrong path is a silent 404 | Acceptable if baked into few per-biome atlases and load time is measured in browser-boot; per-tile-file loading is not |
| Ship touch with the existing `transform: scale(1.5)` and "compensate later" | Mobile demo works partially | Every canvas tap is wrong by design (Pitfall 1); compensation code outside the engine is a permanent trap | Never — scaling strategy is decided first |
| Extend the audit harness only for movers, skip patrollers ("cosmetic anyway") | Less harness work | No automated proof cosmetic enemies stay non-interactive; a hurt-on-collide regression ships invisible | Never — the no-damage invariant is exactly what needs a gate |
| One combined "art + quality-pass" phase touching geometry and visuals together | Fewer phases | Kid-validated geometry drift hides in art diffs (Pitfall 10) | Never — geometry-frozen re-dress requires the split |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Gothicvania packs → `assets/` | Unzipping wholesale (drags CC-BY music in; no attribution) | Bake pipeline copies named image files only; LICENSES + CREDITS in the same commit |
| Gothicvania terrain → 16px grid | Assuming uniform 16×16 tiles | Spike-verified: sheets are decorative ~32px blocks with 20–24px cap lips; bake must cut a clean modular atlas per biome (likely 16×32 cap tiles) |
| Kaplay `body()` + moving platforms | Writing rider-carry code | Engine carries natively (`stickToPlatform`, on by default); manual carry double-applies → rider slides off in <1s (spike-measured 4.2% vs 100% mounted) |
| Kaplay `patrol()` | Hand-rolling patrol movement with accumulating waypoints or copied doc snippets using `loop()` | Built-in `patrol({ waypoints, speed, endBehavior })` is dt-based and scheduler-free; port from spike-code only |
| Kaplay touch input | Assuming `touchToMouse` makes taps equal clicks under the CSS transform | Touch pos = `clientX − getBoundingClientRect()` (transform-affected); mouse = `offsetX` (transform-immune) — resolve scaling first (Pitfall 1) |
| Kaplay `sliceX` atlases | Using `loadSpriteSheet` (doesn't exist in 3001) or trusting doc snippets with `kaboom(` | `loadSprite(..., { sliceX, sliceY, anims })` per the documented main.js rule; Kaplay 3001 API only |
| New sprite loads | `assets/...` or `/assets/...` paths | `../assets/...` web-root convention — wrong path is a **silent** 404 (documented main.js rule); add a loaded-sprite-count assertion to browser-boot |
| `validate-levels.mjs` + new descriptor fields | Adding `movers`/props fields the validator silently ignores | Validator learns each new structural field RED-first before any level uses it; visual-only fields (props) get an explicit "validator-neutral" note in build.js |
| DOM touch overlay + Kaplay scenes | Registering DOM listeners per scene like Kaplay handlers | One adapter, one registration, per-scene binding table cleared on `onSceneLeave` (Pitfall 9) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Per-tile fill sprites | FPS collapse on long levels; build-time ~300ms | Chunked `{tiled:true}` fill + per-tile caps only (spike recipe) | ~5,600 objects → 15fps (measured); real levels reach this trivially |
| One giant tiled quad | Terrain **silently invisible**, FPS great | Chunk ≤ ~40×16 tiles per object; screenshot/pixel checks in browser-boot | ~400×13 tiles in one object (measured silent failure) |
| `offscreen({hide})` as the fix | FPS still bad after "optimizing" | It's update overhead, not draw — reduce object count instead | Spike-measured: 22fps vs 15 — not a rescue |
| 4-biome sprite manifest growth | Long loading screen, especially mobile | Few baked atlases per biome; measure load time in browser-boot; budget in plan | Dozens of individual PNGs × mobile network latency |
| Parallax layers × biomes on mobile GPUs | Choppy scroll on phones only | Keep layer count per spike/current parallax.js pattern; test on a real device in Closing Verification | Untested territory — headless Chromium was the pessimistic floor for objects, not for mobile GPUs |
| Non-integer responsive scale on mobile | Pixel shimmer/blur on pixel art | Prefer integer-ish scale steps or accept `crisp: true` filtering; judge on-device | Any fractional CSS scale on low-DPI screens |

## Security Mistakes

(For this project "security" = licensing, privacy, and data-loss — there is no backend by constitution.)

| Mistake | Risk | Prevention |
|---------|------|------------|
| Vendoring CC-BY music from the Gothicvania zips without attribution | License violation in a shipped artifact | Bake pipeline copies named art files only; audio stays Phase-27-owned (scouting flag #2) |
| Missing LICENSES/CREDITS for newly vendored art | Attribution debt; unverifiable provenance later | Every `assets/` addition pairs a LICENSES file + CREDITS.md line in the same commit (existing convention) |
| Adding any analytics/telemetry to "measure mobile usage" | Violates the no-data-leaves-her-browser constitution | Out of scope, full stop — mobile verification is done by humans and Playwright |
| Treating iOS Safari localStorage as durable | Her save silently deleted after 7 days of not visiting (Safari ITP caps ALL script-writable storage at 7 days of Safari use without site interaction; home-screen-installed apps get a separate counter) — MEDIUM confidence, WebKit-documented | Can't be fully prevented client-side: keep desktop primary (already decided), consider add-to-home-screen guidance for iPad play, and never "fix" it with a backend |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Removing collect leaves math dead zones in levels 01/03/04/06/08 | Long stretches with no math = the "gate to progress" premise thins out; XP pacing shifts | Rebalance with existing mechanic types only (doors/gates/enemies — no new play mechanics per locked decision); review per-level encounter spacing against LEVEL-DESIGN.md in the same phase |
| Cosmetic patrollers visually identical to math-blocker enemies | Teaches inconsistent enemy semantics; risk of startle | Distinct silhouettes from the scouted bestiary; blockers stay stationary-idle, patrollers move and never interact |
| Mover timing that punishes waiting or missing | De-facto pressure — the thing this game constitutionally avoids | Missed platform = wait for return, never a death; checkpoint before each mover section |
| Touch buttons occluding the 640×360 playfield | She can't see hazards under her thumbs | Place virtual controls in letterbox/margin zones; test with a real kid hand at Closing Verification |
| Player sprite (40–48px) clipping low ceilings after art swap | Reads as broken/glitchy | Style-board phase explicitly verifies clipping on the lowest ceilings (scouting flag: keep 16×32 hitbox, render larger) |
| Biome switch mid-progression reading as a different game | Cohesion loss across 4 packs of different vintages | Style-board sheet at 1.5× judges all four side-by-side BEFORE integration; palette-conform pass if drift shows (scouting flag #3) |
| Mobile page loading into a black canvas with no explanation (current known state) | Dead first impression on the very device the milestone targets | Mobile phase replaces the failure mode, and Closing Verification loads the live Dokploy URL on a real phone |

## "Looks Done But Isn't" Checklist

- [ ] **Terrain fill:** renders *something* at the level start — verify pixels at the FAR END of every level (giant-quad failure is silent and positional)
- [ ] **Collect removal:** game plays fine — verify `check-gate.sh` #13, `smoke-progress.mjs` fixtures, `audit-phase21` answer-zone rows, and `reachability.mjs` mechanic loop were ALL updated (grep `collect\|answerPickup\|answer-zone` across `src/` + `scripts/` returns only intentional survivors)
- [ ] **Moving platforms:** rideable in play — verify the validator HARD-FAILs a fixture level that needs the far extreme (RED-first proof exists)
- [ ] **Touch controls:** work in desktop DevTools emulation — verify on a real phone at the real display scale (emulation with the wrong transform proves nothing; Pitfall 1)
- [ ] **Audio on mobile:** `audioCtx.state` proof passes with synthetic mouse — verify with touch emulation AND a real device (touchstart isn't an activation event)
- [ ] **Art swap:** validator green — verify screenshots show feet on drawn ground on flat floor, 1-tile platform, lowest ceiling, and door (geometry checks can't see anchor drift)
- [ ] **Level quality pass:** levels play through — verify golden geometry fixtures were updated deliberately and `bounds.right` covers any lengthened level
- [ ] **New sprites loaded:** no console errors — verify no silent 404s (wrong-path loads don't throw; count loaded sprites in browser-boot)
- [ ] **Patrol enemies:** move nicely — verify they carry zero hurt/challenge wiring (the "cosmetic" claim needs a check, not an adjective)
- [ ] **Style sign-off:** "looks good" recorded — verify it was a genuine multi-round judgment against the four style-board questions, not a rubber stamp (Phase 27 took 5 rounds; this is bigger)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Touch shipped on broken coordinates | MEDIUM | Freeze mobile claims; decide scaling strategy properly (letterbox spike + mouse/touch regression matrix); re-land input layer on the corrected base |
| Validator false-PASS with movers discovered late | MEDIUM | Revert the level's mover to non-load-bearing placement; land the validator extension RED-first; re-validate all 8 levels |
| Collect removal half-done (dead code / stale fixtures) | LOW | The grep inventory from Pitfall 3 IS the recovery checklist; finish it in one commit; full gate suite |
| Pink or CC-BY content found in `assets/` post-integration | LOW–MEDIUM | Re-run the bake for the offending files with the hue-conform pass; delete unlicensed files; add the automated pink scan so it can't recur |
| Perf cliff found on a real level after integration | LOW | The chunked recipe is a drop-in replacement for the naive fill — re-port from spike-code; add the object-count budget assertion |
| Geometry drift found in a kid-validated level | MEDIUM–HIGH | `git diff` the geometry arrays against the pre-redress commit; revert coordinates; if she already played the drifted version, re-verify with her before deciding to keep or revert |
| iOS save loss reported | LOW (accept) | Explain (it's Safari policy, not a bug); suggest add-to-home-screen for iPad; desktop remains the durable home |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 3. Collect removal breaks harnesses | Mechanic Cleanup (FIRST — before any re-dress) | Full 8-command gate suite green; grep inventory shows zero unintentional survivors |
| 15/UX. Math dead zones after removal | Mechanic Cleanup | Per-level encounter-spacing review vs LEVEL-DESIGN.md; human playthrough of the 5 affected levels |
| 8. Pink / CC-BY leakage | Asset Bake | Automated pink-hue scan on baked PNGs; LICENSES/CREDITS diff paired with every assets commit; no audio files in art diffs |
| 4. Sprite anchor / cap-lip ground lies | Asset Bake (convention) + Art Integration (proof) | Screenshot set: flat floor / 1-tile platform / lowest ceiling / door, cross-checked against `?debug=1` colliders |
| 5. Perf cliff + silent giant quad | Art Integration | Object-count budget assertion in build.js; browser-boot per-level screenshot + FPS sample, including far end of every level |
| 10. Geometry drift + bounds trap | Level Quality Pass (sanctioned geometry) then Art Integration (geometry-frozen) | Geometry arrays byte-identical in art diffs; validator + updated golden fixtures green; bounds-vs-rightmost-entity check |
| 2. Validator blind to movers | World Motion, Wave 1 | RED-first fixture HARD-FAILs; worst-case-extreme rule documented in validator |
| 6. check-safety via copied snippets | World Motion | check-safety.sh per commit; motion code provenance = spike-code only |
| 7. ADHD-unsafe motion / soft-locks | World Motion + Level Quality Pass | LEVEL-DESIGN.md motion rules; interactive audit rides every mover, crosses every patroller; no-hurt invariant on cosmetic entities |
| 1. Touch coords vs transform-scale | Mobile (scaling decision FIRST) | Mouse AND touch hit-test matrix at multiple display sizes; real-device tap test |
| 9. DOM overlay scene leaks | Mobile | Single adapter module; repeated scene-transition handler-count check; no `addEventListener` outside the adapter |
| 11. Audio gesture gate on touch | Mobile + Closing Verification | Playwright touch-emulation `audioCtx.state` proof; real iOS/Android device check |
| iOS storage eviction | Mobile (documentation/UX note) | Expectation set with the user; no backend "fix" |
| 12. Process regressions | Every phase | human-verify checkpoints that auto_advance cannot approve; style-board before integration as a phase dependency; boilerplate fixes applied to every Playwright copy in one commit |

**Ordering consequence for the roadmap** (falls directly out of the pitfalls): Mechanic Cleanup → Asset Bake (with style-board sign-off gate) → Level Quality Pass → Art Integration (geometry-frozen) → World Motion (validator first) → Mobile (scaling decision first) → Closing Verification (live URL + real devices + kid-UAT). Mechanic and geometry decisions before dressing; validator learns each new dynamic before levels use it; mobile last because it rides on the finished visual/motion state.

## Sources

- `/home/magnus/dev/nox-quiz/lib/kaplay.mjs` (vendored engine source, directly inspected: touch pos = `clientX − getBoundingClientRect()`, mouse = `offsetX`; `touchstart` fires the synthetic mousePress path deferred via `events.onOnce("input")`; `touchToMouse`, `onTouchStart`, `patrol`-related internals) — HIGH confidence
- `/home/magnus/dev/nox-quiz/.planning/research/v6-scouting/SPIKE-FINDINGS.md` — spike-verified engine/perf facts (native carry, manual-carry anti-pattern, object-count cliff, giant-quad silent failure, chunking recipe, validator extreme rule) — consumed as fact per milestone decision
- `/home/magnus/dev/nox-quiz/.planning/research/v6-scouting/ASSET-SCOUTING.md` — pink sky/magenta glow flags, CC-BY music inside CC0 zips, non-uniform tile grids, sprite-size vs collider note — consumed as fact
- Live tree verification: `src/main.js` (scale + silent-404 + loadSpriteSheet notes), `src/audio.js` + `src/scenes/title.js` (gesture-gate rule), `src/ui/challenge.js` / `src/scenes/*.js` (onKeyPress/box.onClick inventory), `scripts/check-gate.sh` (#13 collect seam check), `scripts/smoke-progress.mjs` (golden geometry incl. collectZones/answerPickupSlots), `scripts/lib/reachability.mjs` (static node graph, mechanic list, CONFIG.COLLECT.ZONE_W), `scripts/audit-phase21-mechanics.mjs` (answer-zone semantics), `scripts/check-safety.sh` (banned-construct grep), level descriptors 01–08 (collect in 01/03/04/06/08; bounds convention) — HIGH confidence
- [HTML Standard — user activation / activation-triggering input events](https://html.spec.whatwg.org/multipage/interaction.html) and [MDN — User activation](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/User_activation): touchstart is NOT activation-triggering; touchend/pointerdown/pointerup/mousedown/keydown are — MEDIUM confidence (websearch, cross-checked)
- [WebKit — Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/) (Safari 13.1/iOS 13.4 seven-day cap on all script-writable storage incl. localStorage; home-screen apps exempted) — MEDIUM confidence (websearch, cross-checked)
- `.claude/CLAUDE.md` binding rules + `.planning/PROJECT.md` v6.0 decisions and Phase 22–28 outcome records (CR-01 stale-fixture precedent, 5-round audio sign-off, never-rubber-stamp policy)

---
*Pitfalls research for: Nox Run v6.0 "SNES-Fidelity World"*
*Researched: 2026-07-09*
