---
gsd_state_version: 1.0
milestone: v4.1
milestone_name: Art Rework
current_phase: 20
current_phase_name: Real CC0 Art Redo & Human Sign-off
status: executing
stopped_at: Post-ship diagnostic + fix pass on v4.0 (all 7 phases were executed by a different AI runtime after this session lost continuity — see below). Found and fixed 5 real bugs via a headless-but-actually-interactive Playwright playtest; all static gates + the shipped `browser-boot.mjs` still pass.
last_updated: "2026-07-03T20:53:35.486Z"
last_activity: 2026-07-03
last_activity_desc: Phase 20 execution started
progress:
  total_phases: 2
  completed_phases: 0
  total_plans: 3
  completed_plans: 0
  percent: 0
---

# Project State: Math Lab

**Project:** Math Lab - Gamified Math Practice for Kids
**Initialized:** 2026-06-20
**Current Milestone:** v4.1 Art Rework (Phase 20)

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-03)

**Core Value:** She opens it because she *wants* to, not because she has to.
**Current Focus:** Phase 20 — Real CC0 Art Redo & Human Sign-off

**Tech Stack (v4.1):** Same as v4.0 — multi-file (no JS build step), HTML + vanilla ES2020 modules + vendored Kaplay 3001.0.19 (pinned, sha256-recorded), static files served by a Docker (nginx) container via Dokploy, versioned localStorage persistence. Zero new runtime dependencies — this milestone only swaps asset *content* (PNGs + license docs), never code architecture.
**Shipped State (v4.0):** Replayable multi-level Kaplay platformer — title → level-select → four hand-built dark-grunge levels → four forgiving in-world math mechanics (locked doors, checkpoint gates, defeat-enemy, collect-the-answer) → persisted XP/leveling + per-level completion. All 22 v4.0 requirements satisfied, but the "art/animation/parallax pass" (Phase 18) shipped procedurally-generated placeholder noise instead of real curated art, and its human sign-off checkpoint was auto-approved without anyone actually looking at it. v4.1 redoes that asset output and closes the process gap.

## Current Position

Phase: 20 (Real CC0 Art Redo & Human Sign-off) — EXECUTING
Plan: 1 of 3
Status: Executing Phase 20
Last activity: 2026-07-03 — Phase 20 execution started

## Deferred Verification

| Phase | State | Resume |
|-------|-------|--------|
| 20 | verification_deferred_human (round 2 pending — round 1 found+fixed a real visibility defect) | `/gsd-verify-work 20` |

## v4.1 Roadmap (Phase 20)

| Phase | Goal | Requirements |
|-------|------|--------------|
| 20. Real CC0 Art Redo & Human Sign-off | Replace Phase 18's procedurally-generated placeholder art (player, tileset, parallax, title/select) with real curated CC0 pixel art, wired through Phase 18's unchanged technical contract, with license proof recorded and a genuine human visual sign-off gating verification | ART-05, ART-06, ART-07, ART-08, PROC-01, PROC-02 |

**Coverage:** 6/6 v4.1 requirements mapped, no orphans, no duplicates.

**Build-order rationale:** Single narrow phase — sourcing/licensing, palette-mapping, integration, and human sign-off are one coherent asset-redo deliverable that doesn't benefit from being split across phase boundaries; it will decompose internally into multiple plans (e.g. source+license the art, wire player+tileset, wire parallax+title/select, run the sign-off gate).

## Cross-Cutting Mitigations (baked into every engine-touching phase)

1. **a727c13 rule** — no Kaplay global (or `typeof <global>` guard) at module top level; engine refs only inside function bodies. Still binding for Phase 20's re-wiring of `src/main.js`/`src/player.js`/`src/parallax.js`.
2. **Mandatory real browser-boot per phase** — greps passing ≠ boots in a browser (the most expensive v3.0 lesson). No phase closes on automation alone — and for Phase 20 specifically, automation alone is explicitly insufficient even for sign-off (PROC-02).
3. **Anti-leak** — closure-local run state (never module-level `let`); cancel every global controller (`onKeyPress`/`onHide`/`onClick`) on `onSceneLeave`; single-flight tween cancel on the object.
4. **No-timer / forgiving / no-game-over** — every math interaction re-asks on wrong with zero penalty/lockout/XP-loss/despawn/restart; enemies never deal contact damage; nothing counts down. Not directly touched by an art-only phase, but must not regress.

## Key Decisions (v4.1)

| Decision | Rationale | Status |
|----------|-----------|--------|
| Reuse Phase 18's technical contract (`18-UI-SPEC.md`) unchanged | Frame layout, animation state machine, z-order, parallax scroll ratios, and color/spacing/typography tokens were never the problem — the asset *source* was (procedurally-drawn placeholder noise) | Locked in |
| Single narrow phase (Phase 20), no gameplay/level/difficulty changes | Requirements explicitly scope this as an asset-and-process redo of Phase 18 only | Locked in |
| Candidate art sources: continue OpenGameArt "6 Color Dungeon 16x16" CC0 family and/or Kenney "Pixel Platformer" CC0 pack with a palette-remap pass | Matches existing spike/goal/coin provenance (zero new license risk to evaluate from scratch); palette-remap keeps the locked dark-grunge palette (`#0a0a0a`/`#00ff88`/`#66ccff`/`#e8e8e8`, no pink) | To be confirmed during sourcing |
| Mandatory human visual sign-off gate before verification (PROC-02) | Phase 18's sign-off was auto-approved on a passing browser-boot check alone, with no one actually looking at the result; this closes that process gap for good | Locked in |
| `scripts/generate-art-assets.py` stays in the repo only as a clearly-labeled dev/prototyping tool, not the shipped pipeline | It is precisely what's being replaced as the source of shipped assets, but remains useful for future placeholder generation during development | Locked in |

## Carried-Forward Decisions (v1/v2/v3/v4.0, still valid)

| Decision | Rationale | Status |
|----------|-----------|--------|
| Multiple-choice answers (no typing) | Reduces friction for ADHD profile; faster flow | Locked in |
| No countdown timer (hard constraint) | Time pressure triggers stress; contradicts ADHD context | Locked in |
| Dark grunge aesthetic, no pink | Cool/edgy, not cute; holds for pixel art too | Locked in |
| 70% hard tables (6–9), 30% easy (1–5) weighting | Targets weakness while building confidence; algorithm unchanged | Locked in |
| WCAG AA contrast minimum on dark theme | Accessibility non-negotiable; prevents visual stress | Locked in |
| Local-only / offline; no backend | Privacy, simplicity, no install | Locked in |
| Wrong answer = forgiving re-ask, no penalty | ADHD-safe; no punishment loop | Locked in |
| Respawn = checkpoint, progress preserved; no lives, no game-over | ADHD-safe | Locked in |
| Vendored Kaplay, no-build multi-file, served over HTTP | Real game look without a build toolchain; sidesteps file:// asset block | Locked in |
| ≤400–500ms flash/animation cap, non-strobing | ADHD over-stimulation guard (v2.0/v3.0 lesson) | Locked in |
| Clean-reset save (new versioned key, NO v3.0 migration) | User chose a clean slate; removes migration complexity and the bricking risk entirely (SAVE-05) | Locked in |
| Unlock state is *derived* from LEVEL_ORDER + `cleared` facts | One source of truth; no desync between stored "unlocked" and reality | Locked in |
| Levels = plain JS data + one parameterized builder + registry | No build step, no Kaplay `addLevel`, no Tiled; preserves merged-floor anti-seam-stick colliders | Locked in |
| One shared `ui/challenge.js` seam for all four mechanics + end gate | Avoids 4 anti-leak/z-index/forgiveness bugs; one firewalled brain consumer; re-point check-gate.sh | Locked in |
| Difficulty via per-level allowed-tables pool only (brain LOCKED) | `math/brain.js` is validated and out of scope; ramp via table scope, never the algorithm | Locked in |
| `loadSprite({sliceX,sliceY,anims})` only — `loadSpriteSheet` does NOT exist in Kaplay 3001 | Correct loader; still binding for Phase 20's re-wiring | Locked in |
| Pin Kaplay at 3001.0.19 | Version-coupled (Rect class, setCamPos); any upgrade is its own scoped task | Locked in |

## Critical Pitfalls to Prevent (v4.1, from research)

1. **New art doesn't match the locked frame layout** — the reused player/tileset/parallax integration points assume specific `sliceX`/`sliceY`/frame-count/pixel dimensions from `18-UI-SPEC.md`; verify the new sheet's dimensions against the spec (or adjust the slice params to match) before wiring — do not assume a same-named PNG drops in cleanly.
2. **Palette-remap breaks silhouette readability** — recoloring existing CC0 art onto the locked palette (`#0a0a0a`/`#00ff88`/`#66ccff`/`#e8e8e8`, no pink) must be re-verified in-browser against the actual level background per ART-05, not eyeballed in an image editor.
3. **License mislabeling** — re-verify CC0 (not CC-BY-SA or other) at each source page before vendoring, exactly as a CC-BY-SA "spinning-coin-0" was caught and rejected in v3.0; record proof in `CREDITS.md` + `assets/LICENSES/*.txt` before considering an asset shipped.
4. **Process gap repeats** — "browser boots with zero console errors" must never again stand in for looking at the art; PROC-02 exists specifically because that substitution is what let Phase 18 ship ungraded.
5. **Scope creep into gameplay** — this is an asset swap only; touching math mechanics, level geometry, or difficulty while in the same files (`src/levels/build.js`, `src/player.js`) is explicitly out of scope and must be avoided.

## Research Flags (v4.1)

No dedicated research phase was run for v4.1 — this is a narrow, single-purpose milestone and context was carried forward from this session's direct investigation of why Phase 18's art shipped as placeholder noise (see Key Decisions above and `PROJECT.md`'s Key Decisions table). Re-verify exact CC0 pack frame dimensions at sourcing time, same as Phase 18's original research flag.

## Deferred Items (from v3.0 close)

Items acknowledged and deferred at v3.0 milestone close on 2026-06-28:

| Category | Item | Status |
|----------|------|--------|
| uat | Phase 08 — MOVE-05 throttled/non-60Hz empirical check | pending (code verified dt-correct; 1 UAT scenario not run) |
| verification | Phase 08 — 08-VERIFICATION human_needed | 13/13 must-haves verified; only the MOVE-05 feel-check outstanding |
| deploy | Phase 07 — SETUP-02 live Dokploy deploy confirmation | container curl-proven locally; live-URL playthrough not yet confirmed |

These are low-risk and independently actionable. See `.planning/milestones/v3.0-MILESTONE-AUDIT.md` for evidence and the one-time action for each.

## Deferred (v2 & beyond v4.0)

- Audio / SFX / calm ambient music (AUDIO-01) — deferred again; silence weakens the "real game" feel, revisit after v4.1.
- More worlds / level packs beyond the initial 3–5 (CONTENT-FUT-01).
- Star/score-based completion texture (CONTENT-FUT-02) — kept out to stay simple and non-punishing.
- Phase 19 SAFE-05: live kid-UAT sign-off for non-strobing/non-over-stimulating art and fun/fair feel — protocol in `.planning/phases/19-polish-consolidated-kid-uat/19-UAT.md`; the v4.1 human sign-off gate (PROC-02) is a related but distinct check (art quality vs. platforming feel) and does not supersede it.

## Quick Tasks Completed

| Date | Slug | Summary |
|------|------|---------|
| 2026-06-28 | make-the-game-window-render-50-bigger-sc | Display-only +50% canvas scale (960×540, crisp pixel upscale); internal 640×360 resolution unchanged so no gameplay numbers moved |

## Session Continuity

**Stopped at:** Post-ship diagnostic + fix pass on v4.0 (all 7 phases were executed by a different AI runtime after this session lost continuity — see below). Found and fixed 5 real bugs via a headless-but-actually-interactive Playwright playtest; all static gates + the shipped `browser-boot.mjs` still pass.

**Resume file:** None

**Last session:** 2026-07-03T18:30:00.000Z

**Context — how this diagnostic pass came about:**

Phases 15–19 were executed by a different AI runtime (user-directed, to save session cost) while this session was between turns. That runtime self-reported the milestone shipped (`v4.0-MILESTONE-AUDIT.md`: status `passed`, 22/22 requirements, "browser boot round-trip passed"). The user then reported "not much is working." Investigation found the audit's browser-boot check (`scripts/browser-boot.mjs`) only verifies scenes LOAD with zero console errors — it seeds all levels as pre-cleared and never actually plays: no movement, no math-gate/mechanic interaction, nothing. This is a real validation gap, not a one-off oversight — it let a **total, permanent soft-lock** ship as "passed."

**Bugs found and fixed this session** (all confirmed via a from-scratch interactive Playwright harness that actually moves the player and answers challenges — not the shipped shallow check):

1. **CRITICAL — collect-the-answer mechanic (MECH-03) was a total soft-lock.** `wireCollect` set `player.paused = true` on zone entry, copying the door/gates/enemy freeze pattern — but Kaplay's collision system skips paused objects entirely (confirmed from the vendored engine source), and collect-the-answer's ONLY resolution path is walking into a pickup. The player froze permanently the instant they touched the zone, with no way to move, collide, or escape (no Escape handler either). Level-01 places this zone at x:300 — immediately after spawn — so this blocked progress at the very start of the very first level. Fixed by removing the pause; this mechanic must keep movement/collision live. (`src/mechanics/collect.js`)
2. **Canvas vertically off-center**, exposing ~90px of dead background and clipping the top of the game world off-screen on every screen. Caused by this session's earlier `transform: scale(1.5)` click-coordinate fix (see 2026-07-02 entry below) combined with `index.html`'s `margin:auto`, which only centers block elements horizontally. Fixed via flex-centering both axes before the transform applies. (`src/index.html`)
3. **Math-gate "?" glyph rendered at NaN,NaN** — `build.js` used the level's `geometry` container object (`g.x`/`g.y`, always undefined) instead of the loop variable (`mg.x`/`mg.y`) for glyph position. The gate's collider was unaffected (correct variable used there), so the mechanic worked, just invisibly. (`src/levels/build.js`)
4. **Collect-the-answer pickups were completely hidden** behind the shared challenge overlay's 420×220 opaque panel, which rendered unconditionally even when `renderChoices:false` (collect.js's only use case — it has no answer boxes for the panel to hold). Confirmed via `toScreen()` that all 4 of level-01's pickups fall inside the panel's footprint at the level's default camera position. Panel now only renders when `renderChoices` is true. (`src/ui/challenge.js`)
5. **Pickup badges + number labels had no `color()` component** — both defaulted to the same engine fill, making every number invisible even once the panel-hiding bug (above) was fixed. Added `CONFIG.COLLECT.PICKUP_BG/BORDER/FG` reusing the existing dark-grunge palette. (`src/config.js`, `src/levels/build.js`, `src/mechanics/collect.js`)
6. **Collect-zone re-entry stacked duplicate collision handlers** — touching the zone, walking away without answering, then walking back in re-fired the outer handler (onCollide fires once per touch-session, not once per object-lifetime), each time registering a NEW never-cancelled pickup handler. Refactored to a single handler + closure-local `active` state, matching the one-handler-many-triggers shape door.js/gates.js/enemy.js already use. (`src/mechanics/collect.js`)

All fixes verified via: full static gate suite (`check-gate.sh`, `check-import-safety.sh`, `check-safety.sh`, `check-progress.sh`, `smoke-progress.mjs`) green; the shipped `browser-boot.mjs` green; a from-scratch interactive gauntlet that actually clears collect-zone → math-gate ×2 → enemy → door → goal end-to-end with zero console errors, twice (once pre-fix confirming failure, once post-fix confirming success); a dedicated collect-zone re-entry regression test; and spot-checks of levels 2–4 (no console errors, math-gate glyph fix confirmed applying to all levels via the shared builder, collect-zone-no-freeze fix confirmed generalizing to levels 3–4).

**Not yet done — recommend before considering v4.0 truly solid:**

- A REAL human playtest (real platforming feel, real jump timing) — this session's teleport-based testing verifies mechanic LOGIC correctness, not platforming feel/difficulty, which is exactly what the deferred kid-UAT (SAFE-05, tracked in `19-UAT.md`) is for.
- Spot-check `src/ui/mathGate.js` (end-of-level gate) and `door.js`/`gates.js`/`enemy.js` visually in a real browser — this session verified their LOGIC clears correctly but did not screenshot-audit each one the way collect.js was audited.
- Consider hardening `scripts/browser-boot.mjs` (or adding a second script) to actually play through mechanics, not just load scenes — the current shallow check is why bug #1 shipped as "passed."

**Prior context (2026-07-02, this session, before the multi-phase gap):**

- v4.0 is a 7-phase, dependency-driven roadmap (Phases 13–19) continuing v3.0's numbering
- 22/22 v4.0 requirements mapped, no orphans, no duplicates
- Pure/low-risk spine (save + registry) front-loaded; refactor (challenge seam, Phase 15) MUST precede the mechanics (Phase 16) that depend on it; content after mechanics; art near-last so logic validates on placeholders; kid-UAT last
- Clean-reset save (SAVE-05) removes migration complexity vs. the original research SUMMARY's additive-migration framing — honor SAVE-05
- Every engine-touching phase ends with a REAL browser boot, not just greps (the a727c13 lesson) — this session's diagnostic pass is a concrete case study in why: the shipped browser-boot.mjs technically ran but never actually exercised gameplay
- Worth flagging: confirm the math-gate/mathGate.js answer-box mouse-click path (same `box.onClick()` + `area()` pattern as the fixed select tiles) actually works now that the canvas-scale bug is fixed — likely silently broken since the 2026-06-28 "+50% display scale" quick task, predating this milestone, never independently re-verified beyond a spot-check

---

**State initialized:** 2026-06-20
**Last updated:** 2026-07-03 (v4.1 roadmap created — Phase 20)

## Historical Decisions (v1/v2/v3)

- [Phase 1]: PersistenceStore stub deferred to Plan 02
- [Phase 1]: QuestionSelector uses naive uniform random in Plan 01; weighted selection by accuracy deferred to Plan 03 as designed
- [Phase 1]: Event delegation on optionsList rather than per-item listeners — cleaner, avoids re-attaching on each question render
- [Phase 1]: PlayerState.fromJSON validates types before assignment — mitigates T-01-01 prototype pollution threat
- [Phase 1]: calculateWeights uses exponent 1.5 for hard tables and 0.8*0.3 for easy — ~76% hard baseline
- [Phase 1]: Fisher-Yates uniform shuffle replaces sort(random) — unbiased answer positions across 4 slots
- [Phase 1]: debugAccuracy() inside DOMContentLoaded, exposed on window for DevTools UAT
- [Phase 1]: SVG feTurbulence grain via CSS data URI
- [Phase 1]: HUD uses rgba(10,10,10,0.92) + backdrop-filter blur(4px)
- [Phase 1]: Question text color is var(--text) #e8e8e8 — accent #00ff88 is decorative only
- [Phase 1]: WCAG 2.1 AA verified: #e8e8e8 on #0a0a0a ~18:1, #888888 on #0a0a0a ~5.4:1 — UX-03 satisfied
- [Phase 2]: TRANSITIONS map uses plain arrays not Set — simpler sufficient for 5 states
- [Phase 2]: FloorConfig returns shallow copies via Object.assign plus spread array — prevents caller mutation (T-02-03)
- [Phase 2]: CONFIG.DUNGEON appended as separate statement after CONFIG literal close
- [Phase 2]: DungeonState.get() uses Object.assign for loot snapshot — caller mutation cannot affect session state
- [Phase 2]: CombatEngine reads all damage/HP/XP from CONFIG.DUNGEON constants — no magic numbers
- [Phase 2]: getState() exposes floorDef.tablePools for Phase 3 QuestionSelector — DIFF-02 bridge
- [Phase 2]: migrate() wrapped in outer+inner try-catch; QuotaExceededError in setItem caught returning null
- [Phase 2]: v1 localStorage key preserved untouched after migration — required for rollback
- [Phase 2]: PersistenceStore.load() migration branch symmetric with normal path
- [Phase 2]: loot snapshot per resolveAnswer call prevents double-reads
- [Phase 2]: effectiveDamageCorrect/effectiveDamageWrong returned on all resolveAnswer paths
- [Phase 2]: DungeonState.init() confirmed ADHD-03 compliant — XP and level never touched on reset
- [Phase 5]: DungeonRunner preserves HP+loot by saving before startCombat() and restoring after
- [Phase 2]: window.CombatInputHandler exported inside DOMContentLoaded for DungeonRunner access
- [Phase 3]: Enter Dungeon button placed inside data-panel='quiz' section for CSS data-screen visibility
- [Phase 7] Vendored folder is lib/ (not vendor/) — passes the phase verification gate
- [Phase 7] file:// guard inline in index.html head, not main.js — top-level import is hoisted and runs before an in-module guard
- [Phase 7] Kaplay 3001.0.19 sha256 fb4a4ef2... recorded in lib/kaplay.mjs header for integrity (T-07-SC)
- [Phase 7]: Custom Dockerfile over Dokploy Static preset — keeps the .mjs MIME fix under our control
- [Phase 7]: nginx types{} re-declares js alongside mjs to avoid regressing .js to octet-stream (verified via curl on /main.js)
- [Phase 7]: Live Dokploy deploy DEFERRED — config + docs/DEPLOY.md satisfy SETUP-02 now; live deploy is a user-triggered follow-up
- [Phase 08]: Plan 02: single jump path — the coyote/buffer/variable-height path in makePlayer is the only jump trigger
- [Phase 08]: Plan 02: respawn is reposition-in-place (never go()); reset() is the named anti-leak contract
- [Phase 08]: Plan 03: MOVE-05 dt-correctness audit clean — no double-scale on vel.x, no hand-rolled gravity; zero code changes
- [Phase 09]: assets sourced from OpenGameArt CC0 (6 Color Dungeon by HorusKDI + Rotating Coin by PuddinThur); rejected spinning-coin-0 (CC-BY-SA)
- [Phase 09]: 09-02: Authored a JS data-list level (LEVEL) + buildLevel() with merged-floor colliders instead of addLevel symbol maps
- [Phase 09]: 09-02: Spike hitbox tightened to 12x8 onto visible points (Pitfall 4), set in level.js
- [Phase 09]: 09-02: buildLevel OWNS creation of tagged coin/spike/goal area() entities
- [Phase 09]: 09-03: Single-point goal seam — one onReachGoal() + one onCollide goal handler, fire-once guarded
- [Phase 09]: 09-03: coinsCollected + goalReached declared in the gameScene closure (anti-leak)
- [Phase 10]: Math brain return shape locked to { a, b, answer, choices }; gate builds its own display string
- [Phase 10]: Math brain exposed as createBrain() factory (fresh closure per game) — anti-leak vs module-level singleton
- [Phase 10]: 10-02: math gate is in-world Kaplay fixed()/z overlay (no DOM); one-way bridge gate->brain; close cancels key controllers + destroy('math-gate')
- [Phase 10]: 10-02: check-gate.sh is the per-commit structural gate (no JS test framework) — 8 fail-fast assertions incl. negative no-DOM/no-timer/no-scenes greps
- [Phase 10]: brain constructed once in the game.js scene closure and injected into the gate via openMathGate — the single scene-to-gate bridge
- [Phase 10]: onClear sets a closure levelCleared flag as a clean Phase-11 XP hook; the gate owns the LEVEL CLEAR banner
- [Phase 11]: 11-01: createProgress() is a PURE factory — never reads localStorage at construction; the seam (loadSave/writeSave/storageAvailable) is defined-not-called at import
- [Phase 11]: 11-01: serialize() persists ONLY {version,xp,level,accuracy,history} — NO migration from the school game's mathlab_save_* key
- [Phase 11]: seedHistory is LOCKED so isMastered() drill-reduction resumes across visits (SAVE-03)
- [Phase 11]: Brain seed validation is explicit per-key range-checked (never spread of untrusted blob — T-01-01)
- [Phase 11]: Persist on correct-clear event AND onHide (visibilitychange); never on a timer (SAFE-01)
- [Phase 11]: HUD one-way contract: src/ui/hud.js reads getLevel()/getXp()/nextThreshold() and never mutates the tracker
- [Phase 12]: SAFE-01 audit (check-safety.sh) strips // comments before every negative grep
- [Phase 12]: Forgiving audit uses punishment-specific tokens only to avoid false-positive on progress.js legitimate level-up surplus carry-over

## Deferred Items (from v2.0 close)

| Category | Item | Status |
|----------|------|--------|
| uat | Phase 01: 01-UAT.md — 11 pending browser UAT scenarios (v1 baseline) | acknowledged |
| verification | Phase 04: 04-VERIFICATION.md — floating damage animation + HP bar drain visual confirmation (human_needed) | acknowledged |

## Performance Metrics

| Phase | Plan | Duration | Notes |
|-------|------|----------|-------|
| Phase 01 P03 | 2 | 2 tasks | 1 files |
| Phase 01 P04 | 1 | 2 tasks | 1 files |
| Phase 02 P01 | 135 | 3 tasks | 1 files |
| Phase 02 P02 | 90 | 2 tasks | 1 files |
| Phase 02 P03 | 180 | - tasks | - files |
| Phase 05 P01 | 83s | 2 tasks | 1 files |
| Phase 05 P02 | 10m | 3 tasks | 1 files |
| Phase 07 P01 | ~2min | 3 tasks | 6 files |
| Phase 07 P02 | ~2min | 3 tasks | 3 files |
| Phase 08 P01 | ~2min | 3 tasks | 4 files |
| Phase 08 P02 | ~4min | 3 tasks | 3 files |
| Phase 08 P03 | ~1min | 1 tasks | 0 files |
| Phase 09 P01 | 25min | 2 tasks | 11 files |
| Phase 09 P02 | 4min | 3 tasks | 5 files |
| Phase 09 P03 | 3min | 2 tasks | 1 files |
| Phase 10 P01 | 12m | 2 tasks | 2 files |
| Phase 10 P02 | 12 | 2 tasks | 2 files |
| Phase 10 P03 | 2min | 2 tasks | 2 files |
| Phase 11 P00 | ~3min | 3 tasks | 3 files |
| Phase 11 P01 | ~2 min | 2 tasks | 1 files |
| Phase 11 P02 | 3min | 3 tasks | 3 files |
| Phase 11 P03 | 20min | 1 tasks | 1 files |
| Phase 12 P00 | 2 min | 2 tasks | 2 files |
| Phase 12 P01 | 12min | 3 tasks | 3 files |
| Phase 12 P02 | 6 min | 3 tasks | 2 files |
| Phase 13 P01 | 6min | 2 tasks | 2 files |
| Phase 13 P02 | 2min | 2 tasks | 2 files |
| Phase 13 P03 | 3min | 3 tasks | 3 files |
| Phase 13 P04 | ~5min | 3 tasks | 3 files |
| Phase 14 P01 | ~3min | 3 tasks | 5 files |
| Phase 14 P03 | 1min | 2 tasks | 1 files |
| Phase 16 P01 | 2 | 2 tasks | 2 files |
| Phase 16 P02 | 11 | 8 tasks | 8 files |
| Phase 16 P03 | 3 | 2 tasks | 1 files |
| Phase 18 P01 | 12 | 3 tasks | 9 files |

## Operator Next Steps

- Review and approve the v4.1 ROADMAP.md (Phase 20)
- Then run `/gsd-plan-phase 20` to begin the milestone

## Decisions

- [Phase ?]: [Phase 13]: 13-01: Save key/version pinned to mathlab_platformer_v2 / VERSION 2; Wave 1 Plan 02 must match or the gate stays red
- [Phase ?]: [Phase 13]: 13-02: v4.0 clean-reset save key mathlab_platformer_v2 / VERSION 2; per-level cleared map stores ONLY cleared facts, unlock derived in registry
- [Phase ?]: Level registry: ordered LEVEL_ORDER + getLevel + derived isUnlocked; v3.0 geometry lifted verbatim into level-01 descriptor; a727c13 Rect guard kept inside buildLevel body
- [Phase ?]: [Phase 14] 14-01: check-import-safety.sh negative grep is ANCHORED to module-top-level forms and SCOPED to title.js/select.js only (game.js/main.js excluded); calibrated RED on scripts/fixtures/bad-scene.js, GREEN on shipped game.js
- [Phase ?]: [Phase 14] 14-01: titleScene + selectScene are pure-canvas closure factories (engine globals body-only, a727c13); select derives unlock via isUnlocked + reads createProgress(loadSave()) fresh every entry — one source of truth, never stores its own unlocked flag
- [Phase 14]: 14-03: static gate suite (import-safety+progress+safety) re-run GREEN; real-browser NAV-01..04 boot recorded PENDING as a blocking human-verify (autonomous:false) — NAV reqs close at runtime sign-off, not on greps
