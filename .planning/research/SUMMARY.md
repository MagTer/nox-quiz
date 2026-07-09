# Project Research Summary

**Project:** Nox Run v6.0 "SNES-Fidelity World"
**Domain:** Kid-friendly browser 2D platformer (vendored Kaplay 3001.0.19, no build step) — subsequent-milestone integration into a shipped, kid-validated 8-level game
**Researched:** 2026-07-09
**Confidence:** HIGH overall (engine claims verified against the vendored source; spike/scouting pre-work in `.planning/research/v6-scouting/` consumed as fact; mobile-browser behavior MEDIUM)

## Executive Summary

v6.0 is an integration milestone, not a greenfield build: an SNES-fidelity sourced-art overhaul (4 Gothicvania biomes), cosmetic world motion (moving platforms, patrol enemies, ambient animation), mechanic cleanup (collect-the-answer removal + secret-alcove discovery cue and coverage), the n0x logo treatment, mobile touch controls with a responsive canvas, and the long-open closing verification (live Dokploy playthrough, kid-UAT). The headline stack finding: **zero new dependencies** — everything mobile and art-pipeline needs already exists in the vendored engine, installed Playwright, and installed Pillow. The work is configuration, seam modules, level data, and verification scripts.

The single load-bearing technical fact, verified in the vendored engine source by three independent research passes: **the shipped CSS `transform: scale(1.5)` display trick and working touch input are mutually exclusive.** Kaplay's mouse path reads `offsetX` (transform-immune — why the current trick works), but its touch path reads `clientX − getBoundingClientRect()` (transform-affected) — every canvas tap lands ~1.5× off. The scaling strategy must be replaced as the *prerequisite* of the mobile work. The strongest candidate (STACK.md, source-verified) is Kaplay's `letterbox: true` init option, which makes the engine own one consistent viewport mapping for both input types, keeps all 640×360 game logic untouched, and makes every existing `onClick` tap-capable for free via `touchToMouse`. The mobile phase must open with a Playwright touch-emulation probe (RED-first: prove the current desync, then prove the fix), with a DOM-overlay fallback held in reserve.

The dominant risk class is not engineering but *verification drift*: the repo's own gates actively defend the mechanic being removed (`check-gate.sh` #13 asserts collect.js exists), the static validator is blind to movers (false-green on the milestone's headline feature), no gate can see sprite/anchor drift on unchanged colliders, and two spike-proven rendering cliffs (per-tile fill → 15fps; giant tiled quad → silently invisible terrain) reappear if the chunked recipe isn't ported literally. Mitigation is ordering plus RED-first gate extensions: mechanic cleanup before any re-dress, validator learns movers before any level carries one, geometry frozen during art integration, and genuine human sign-off checkpoints (style board before integration; never rubber-stamped).

## Key Findings

### Recommended Stack

No new runtime or dev dependencies. Full detail in `STACK.md` (which is the v6.0 delta only — the shipped stack lives in `.claude/CLAUDE.md`).

**Core technologies (all already vendored/installed):**
- **Kaplay `letterbox: true`** — responsive canvas replacing the CSS transform hack; engine owns one viewport mapping for mouse AND touch; framebuffer and all game logic stay 640×360; nearest-filtered upscale keeps pixels crisp
- **Kaplay `onTouchStart/Move/End` + `touchToMouse` + `buttons` API** — virtual controls bridge: per-`touch.identifier` zone tracking → `pressButton()/releaseButton()` driving the exact keyboard event path; existing `onClick` surfaces (answers, tiles, mute, start) become tappable with zero code once coordinates are fixed. Keyboard input stays byte-identical (kid-validated) — never rebind keyboard through `buttons` (open upstream bug #421)
- **Pillow 10.2.0 (installed)** — art pipeline shifts from *generating* to *conforming*: hue-rotation for the two pink/magenta skies (already live-proven by `styleboard.py`), `Image.quantize(palette=…, dither=NONE)` for cross-pack unification if the style board demands it, `Image.crop` for per-biome atlas cutting
- **Playwright touch emulation (installed)** — `hasTouch` contexts + `page.touchscreen.tap()` as the mobile regression gate (new audit script per the copy-not-share convention)

**Explicitly avoid:** touch/gesture libraries, keeping the transform + compensating in app code, Kaplay upgrade (3001.0.19 is the final 3001.x release), fullscreen mode (reintroduces mouse/touch asymmetry), default dithering in quantize, `screen.orientation.lock()` reliance (absent on iOS Safari).

### Expected Features

Full detail in `FEATURES.md`. Binding milestone decisions (collect removal, cosmetic-only motion, no new play mechanics, alcove keeps its secrecy) are fixed inputs.

**Must have (v6.0 launch):**
- Collect-the-answer removed + math-pacing rebalanced + gate suite updated atomically — binding order: before any re-dress
- Alcove on-touch burst + chime + "+5 XP" popup (feedback AFTER discovery, never pre-signposted) + automated reachability/trigger coverage — closes the parent-reported "nothing happens" gap and the known audit blind spot
- Ping-pong moving platforms (native `stickToPlatform` carry, dt-based sine easing — the timer-free "waits at endpoints" substitute) + validator support
- Linear patrol enemies (built-in `patrol()`, fixed waypoints, walk cycle, checkpoint-respawn contact, visually distinct from math-blocker enemies)
- Responsive letterbox canvas + portrait "rotate your device" overlay + gesture suppression (`touch-action: none`, viewport meta)
- Touch buttons: discrete left/right + jump with **hold semantics** (variable-height jump reads press duration) and multi-touch; tappable answers/mute/reset; visual + audio pressed-state feedback
- Real-device proof of the audio gesture gate on touch (`touchstart` is NOT an activation-triggering event per spec) + iOS ITP 7-day storage-eviction expectation-setting (no backend fix by constitution — laptop stays the progress home)

**Should have (post kid-UAT, v6.x):**
- Post-discovery ambient change in alcoves (torch lights); secret-found markers on level select (positive-only, save version bump); touch-layout tuning from watching her hands

**Anti-features (do NOT build):** virtual joystick, swipe controls, timed/crumbling platforms (countdown in disguise), chasing/random enemies, stomp-to-kill, secret counters/HUD "0/1" (FOMO framing), 1:1 collect replacement quota, a new 4th math mechanic, backend sync, orientation-lock reliance.

### Architecture Approach

Full detail in `ARCHITECTURE.md` — every claim read from the live tree or vendored engine. v6.0 lands as additive descriptor fields through the existing pure-data → one-builder pipeline; colliders, the math seam, persistence, and the locked brain are untouched.

**Major components:**
1. **NEW `src/levels/autotile.js`** — pure occupancy-set autotiler (node-importable, self-tested); `build.js` consumes it with chunked `{tiled:true}` fill (≤ ~40 columns/chunk — spike-proven perf recipe)
2. **NEW `src/assets-manifest.js`** — pure-data sprite/sound load list enabling a static existence gate (kills the silent-404 class); `main.js` loops it post-init (a727c13-safe)
3. **NEW touch-input seam** (`src/input.js` or `src/touch.js`) — one adapter registered once at boot (audio.js precedent); exact shape (in-canvas `fixed()` buttons per STACK vs DOM overlay per ARCHITECTURE) is decided by the mobile probe — see Gaps
4. **Descriptor schema additions** — `biome` field (swamp/town/cemetery/castle per the locked level mapping; don't overload `theme`), `movers[]`, `patrols[]`, `props[]`; collect keys deleted everywhere
5. **Validator/harness extensions** — mover worst-case-extreme reachability + alcove point-reachability (both RED-first with fixtures); alcove entity-destroy detection in the audit (the challenge-count signal is contractually always false for alcoves)
6. **Player art swap with the collider LOCKED at 16×32** — explicit `area({ shape })`; a bare sprite swap silently resizes the physics body and invalidates the calibrated jump envelope, every validator verdict, and kid-validated feel

Collect removal has a fully-mapped blast radius (ARCHITECTURE §4): module + wiring + builder blocks + CONFIG + 8 level files + 4 verification surfaces, including `check-gate.sh` check 13 which HARD-FAILs on the file's absence — update the gate in the same commit. Simplification dividend: `challenge.js` loses its `renderChoices:false`/`prompt`/`question` params and the hide/restore snapshot (collect was the sole caller) — a reviewed task, since it's the ONE shared seam.

### Critical Pitfalls

Top 5 of 12 (full list + phase mapping in `PITFALLS.md`):

1. **Touch coordinates broken under the project's own transform-scale rule** — resolve the scaling strategy FIRST (probe → letterbox or DOM overlay), never bolt touch onto the transform; real-device tap test mandatory (desktop mouse emulation proves nothing)
2. **Validator false-PASSes levels with movers** — teach `reachability.mjs` the worst-case-extreme rule BEFORE any level ships a mover; prove RED-first with a fixture that HARD-FAILs; consider the standing policy "movers are never load-bearing"
3. **Collect removal breaks the harnesses that defend it** — grep inventory (`collect|answerPickup|answer-zone` across `src/` + `scripts/`) as the plan checklist; remove code + fixtures + gate check 13 + audit expectations in one change; run the full 8-command gate suite
4. **New sprites lie about solid ground** — 40–48px sprites on the 16×32 collider + 20–24px cap lips: fix a written anchor/atlas convention at bake time, prove with screenshots (flat floor / 1-tile platform / lowest ceiling / door) against `?debug=1` colliders — no existing gate can see pixel drift
5. **Spike perf cliffs regress during the real port** — per-tile fill hits 15fps at ~5k objects (`offscreen({hide})` does NOT rescue it); one giant tiled quad renders *nothing, silently*; port the chunked recipe literally + object-count budget assertion + per-level far-end screenshot/FPS checks in browser-boot

Also binding: check-safety-compliant motion idioms come from `spike-code/` ONLY (web Kaplay examples use banned `wait()`/`loop()`); motion design rules (checkpoint before every mover, missed platform = wait not death, patrollers carry zero hurt wiring) go into LEVEL-DESIGN.md before authoring; pink skies + CC-BY music inside the CC0 zips never reach `assets/` (bake pipeline copies named files only; add an automated pink-hue scan); geometry must be byte-identical in art diffs.

## Implications for Roadmap

Both ARCHITECTURE and PITFALLS independently derive nearly the same ordering. Synthesized structure (8 phases):

### Phase 1: Mechanic Cleanup
**Rationale:** Binding order — no content gets dressed that's about to change; zero art dependency; unblocks everything.
**Delivers:** Collect removal (full blast-radius sweep + gate check 13 flipped in the same change), per-level math-pacing rebalance (levels 01/03/04/06/08, existing mechanics only, rhythm over quota, XP-economy re-check), alcove discovery cue (fx burst + reused "pickup" SFX + XP popup, one-shot per run), alcove validator reachability + audit entity-destroy coverage, `challenge.js` simplification (reviewed).
**Avoids:** Pitfalls 3 (harness defenders), math dead zones; closes the alcove blind spot.

### Phase 2: Asset Bake + Style-Board Sign-off
**Rationale:** SEED-001's make-or-break gate; nothing downstream of art may start before human sign-off. Can run in parallel with Phase 1 (disjoint files).
**Delivers:** Vendored Gothicvania art (named files only — no CC-BY music), Pillow hue-conform pass (pink-sky retints), per-biome modular atlases (16×32 cap tiles, documented lip offset + anchor convention), player-candidate choice (clipping check on lowest ceilings), automated pink-hue scan gate, LICENSES/CREDITS in the same commits, **genuine multi-round human sign-off checkpoint**.
**Avoids:** Pitfalls 8 (pink/CC-BY leakage), 4 (convention half), 12 (rubber stamps).

### Phase 3: Validator + Harness Extensions
**Rationale:** The validator must learn movers before any level carries one; pure scripts work, parallel-safe with Phase 2.
**Delivers:** Mover worst-case-extreme reachability + RED-first fixture (HARD-FAIL proof), `bounds.right` vs rightmost-entity warning, manifest-existence gate; wait-and-mount driver primitive deferred unless a level design demands a mover on a mechanic approach path (placement policy is the cheap out).
**Avoids:** Pitfall 2 (validator false-green).

### Phase 4: Terrain + Parallax Rendering (Art Integration, geometry-frozen)
**Rationale:** Needs Phase 2's atlases; geometry untouched so the validator stays trivially green.
**Delivers:** `autotile.js`, chunked fill in `build.js` (spike recipe literal + object-count budget assertion), `biome` field threading, data-driven `assets-manifest.js`, per-biome parallax layer descriptors, per-level screenshot + FPS + far-end non-blank checks in browser-boot. Geometry arrays byte-identical (review gate).
**Avoids:** Pitfalls 5 (perf cliffs / silent quad), 10 (geometry drift), 4 (screenshot proof half).

### Phase 5: Player + Entity Animation
**Rationale:** Needs Phase 2; independent of Phase 4 (can overlap).
**Delivers:** Player sprite swap with explicit 16×32 `area({shape})`, idle/run/jump/fall/land states, real art for gate/door/enemy panels (invisible blockers untouched), feet-on-ground screenshot set vs `?debug=1`.
**Avoids:** Pitfall 4 (collider resize / anchor drift).

### Phase 6: World Motion + Level Quality Pass + Re-dress
**Rationale:** Needs Phases 3 (validator) + 4/5 (art). Sanctioned geometry fixes (levels 5–8 pickups/ledges, 07/08 climb differentiation + hand-bumped `bounds.right`) land as their own plans, separated from visual re-dress.
**Delivers:** Movers (sine + native carry, NO rider code) and patrols (built-in `patrol()`, distinct `"patrol-hazard"` tag, checkpoint respawn, distinct silhouettes) placed in re-dressed/appended sections only, low-stakes-first; props/ambient animation; LEVEL-DESIGN.md motion rules written before authoring; debug-overlay markers; no-hurt invariant gate on cosmetic patrollers; interactive audit rides every mover, crosses every patroller; `check-safety.sh` per commit; theme-asset deletion; human sign-off on hazard placement.
**Avoids:** Pitfalls 6 (banned idioms), 7 (ADHD-unsafe motion), 2, 10.

### Phase 7: Mobile — Responsive Canvas + Touch Layer
**Rationale:** Independent of the art track (can start any time after Phase 1), but lands before closing verification so it's covered. The coordinate probe is task ONE.
**Delivers:** RED-first touch-mapping probe (prove the current transform desync, then prove the fix), `letterbox: true` migration (rewrite the now-inverted main.js/index.html pitfall comments; full gate suite re-run; new `audit-touch-mapping.mjs` as a permanent gate), touch controls module (hold semantics, multi-touch, `isTouchscreen()`-gated, challenge-pause-aware, tunables in CONFIG), tappable answers/mute/reset via `touchToMouse`, press feedback (visual + SFX), portrait overlay + gesture suppression, Playwright touch-emulation audio-unlock proof, ITP expectation docs.
**Avoids:** Pitfalls 1 (coordinates), 9 (scene-lifetime leaks), 11 (audio gate).

### Phase 8: n0x Logo + Closing Verification
**Rationale:** Rides on the finished visual/motion/mobile state; closes debts open since v3.0/v4.0.
**Delivers:** n0x logo under the Phase 26 sign-off standard; consolidated gate suite; live Dokploy URL playthrough; real-device checks (touch mapping, audio unlock, parallax feel, MOVE-05 non-60Hz); kid-UAT live sign-off (explicitly asks about the moving things and touch feel).

### Phase Ordering Rationale

- Mechanic and geometry decisions precede dressing (locked in PROJECT.md; prevents dressing content that's about to change).
- Style-board sign-off is a hard dependency gate for all art integration, not a hope.
- The validator learns every new dynamic (movers, alcove reach) RED-first before any level uses it — "validator green" is this repo's strongest trust signal and must not become a liar.
- Geometry-frozen re-dress is separated from sanctioned quality-pass geometry edits so drift can't hide in art diffs.
- Mobile's scaling decision comes before its input layer (engine-level fact); mobile lands before closing verification, which then covers everything on real devices.
- Touch and world motion share no code — parallel tracks converging only at closing verification.

### Research Flags

Phases likely needing deeper research/spiking during planning:
- **Phase 7 (Mobile):** the letterbox-vs-DOM-overlay decision rests on a MEDIUM-confidence mapping detail — the in-phase probe IS the research; also real-device audio-activation semantics
- **Phase 6 (World Motion):** only if a level design demands a mover on a math-mechanic approach path (wait-and-mount driver work)

Phases with standard patterns (skip research-phase):
- **Phases 1, 3:** pure removal/extension of well-understood project-local code; blast radius already fully inventoried
- **Phases 2, 4, 5:** spike-proven recipes (`SPIKE-FINDINGS.md`) and live-proven Pillow passes (`styleboard.py`) are port-ready
- **Phase 8:** established sign-off + verification conventions

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Every engine claim verified against the vendored `lib/kaplay.mjs` source, not docs; zero new deps |
| Features | MEDIUM–HIGH | Engine facts and the touch trap HIGH (source-verified); mobile-UX guidelines and intrinsic-integration findings MEDIUM (cross-checked web) |
| Architecture | HIGH | Read from the live tree + spike pre-work; one MEDIUM item (exact touch `windowToContent` interaction) flagged for the probe |
| Pitfalls | HIGH | Codebase/engine-derived pitfalls verified in-repo; mobile-browser behavior (activation events, ITP) MEDIUM |

**Overall confidence:** HIGH

### Gaps to Address

- **Letterbox vs DOM-overlay touch strategy (the one cross-file disagreement):** STACK.md recommends `letterbox: true` + in-canvas `fixed()` buttons (source-verified: both input paths share the viewport math); ARCHITECTURE.md leans DOM overlay + viewport-meta candidates and rates the mapping MEDIUM. All sources agree the probe decides. **Resolution: Phase 7 opens with the Playwright touch probe; letterbox is the primary candidate, DOM overlay the fallback.** If in-canvas buttons win, the scene-lifetime concern (Pitfall 9) dissolves; if DOM wins, the single-adapter pattern is mandatory.
- **Palette-quantize necessity:** decide at style-board sign-off (Phase 2), not before — the packs are one artist and may already cohere.
- **Real-device audio unlock + parallax/dt feel on phone GPUs:** platform ceilings, not bugs — verify on device in Phases 7–8; no in-scope engineering fix for iOS ITP storage eviction (expectation-setting only).
- **Per-biome parallax layer counts/ratios:** implementation detail settled when assets are cut (Phase 2/4).
- **`resolveIfBoxed`/`warmupUntilFirstGap` residue post-collect:** review in Phase 1 whether the audit still needs them (their rationale dies with collect).

## Sources

### Primary (HIGH confidence)
- `lib/kaplay.mjs` (vendored 3001.0.19, pinned) — touch/mouse coordinate paths, letterbox/viewport math, `touchToMouse`, `buttons` API, `patrol()`, `stickToPlatform`, `isTouchscreen`, texFilter defaults
- Live tree reads (2026-07-09) — `src/` modules, level descriptors 01–08, `scripts/` gates and harness libs, `check-gate.sh` #13, `check-safety.sh` grep
- `.planning/research/v6-scouting/SPIKE-FINDINGS.md` + `ASSET-SCOUTING.md` + `styleboard.py` — consumed as verified fact per milestone directive (perf cliffs, native carry, validator extreme rule, licenses, pink flags)
- `.planning/PROJECT.md` v6.0 scope + locked decisions, SEED-001/002, pending alcove todo, `.claude/CLAUDE.md` binding rules

### Secondary (MEDIUM confidence)
- KAPLAY changelog + kaplayjs/kaplay#421 — 3001.0.19 finality, touch-transform fix, buttons multi-key bug (cross-checked against vendored source)
- HTML spec / MDN user-activation — `touchstart` not activation-triggering; WebKit ITP — 7-day script-writable-storage cap
- Mobile-controls / touch-target / orientation / canvas-scaling / telegraphing / intrinsic-integration web sources (each cross-checked ≥2 sources; full list in FEATURES.md)
- Pillow docs — `quantize(palette=, dither=NONE)` (cross-checked against installed 10.2.0)

### Tertiary (LOW confidence)
- None — all findings were verified against primary sources or cross-checked.

---
*Research completed: 2026-07-09*
*Ready for roadmap: yes*
