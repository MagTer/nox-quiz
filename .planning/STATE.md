---
gsd_state_version: 1.0
milestone: v4.0
milestone_name: Content & Challenge
current_phase: 16
status: executing
stopped_at: Phase 15 verification passed — real-browser MECH-01/MECH-02 sign-off complete. Ready to begin Phase 16.
last_updated: "2026-07-02T21:20:00.000Z"
last_activity: 2026-07-02
last_activity_desc: Phase 15 verified passed; beginning Phase 16
progress:
  total_phases: 7
  completed_phases: 3
  total_plans: 11
  completed_plans: 11
  percent: 43
current_phase_name: Remaining Mechanics + Difficulty Curve
---

# Project State: Math Lab

**Project:** Math Lab - Gamified Math Practice for Kids
**Initialized:** 2026-06-20
**Current Milestone:** v4.0 Content & Challenge (Phases 13–19)

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-28)

**Core Value:** She opens it because she *wants* to, not because she has to.
**Current Focus:** Phase 15 — Challenge Seam + Locked-Door Mechanic

**Tech Stack (v4.0):** Multi-file (no JS build step) — HTML + vanilla ES2020 modules + vendored Kaplay 3001.0.19 (pinned, sha256-recorded) + CC0 pixel-art assets. Static files served by a Docker (nginx) container, deployed via Dokploy, reachable at a web URL. Persistence via versioned localStorage. Zero new runtime dependencies for v4.0 — every capability is native to the vendored Kaplay bundle.
**Shipped State (v3.0):** Real 2D Kaplay platformer — one polished dark-grunge level → forgiving 6–9 math gate → persisted XP/leveling. Kid-validated "all good." The v1/v2 quiz is archived. v4.0 grows this single-level slice into a replayable multi-level game.

## Current Position

Phase: 16 — NOT STARTED
Plan: 0 of TBD
Status: Phase 15 verified passed; Phase 16 (Remaining Mechanics + Difficulty Curve) ready to begin
Last activity: 2026-07-02 — Phase 15 verified passed; beginning Phase 16

## Deferred Verification

| Phase | State | Resume |
|-------|-------|--------|
| (none) | — | — |

## v4.0 Roadmap (Phases 13–19)

| Phase | Goal | Requirements |
|-------|------|--------------|
| 13. Fresh Save Format + Level Registry/Data | Clean-reset versioned save (per-level completion/unlock + XP/level/history) + pure level registry/parameterized builder — the data spine; zero a727c13 risk | SAVE-05, SAVE-06, SAVE-07, LVL-02 |
| 14. Multi-Scene Shell | Title + level-select (locked/unlocked/cleared/resume) + game.js parametrized by levelId; establishes factory/closure-state/controller-cancel/import-safety contracts | NAV-01..04 |
| 15. Challenge Seam + Locked-Door Mechanic | No-behavior-change extraction of `ui/challenge.js` from mathGate.js + the locked-door/key mechanic that proves the seam | MECH-01, MECH-02 |
| 16. Remaining Mechanics + Difficulty Curve | Defeat-enemy, multiple gates, collect-the-answer; per-level allowed-tables difficulty ramp into the unchanged brain | MECH-03, MECH-04, MECH-05, LVL-03 |
| 17. Build the Levels | 3–5 hand-built, completable levels with a gentle platforming difficulty ramp, wired into registry/select | LVL-01, LVL-04 |
| 18. Art, Animation & Parallax | Animated player (idle/run/jump + facing), real dark-grunge tileset, camera-tied parallax, styled title/select | ART-01..04 |
| 19. Polish & Consolidated Kid-UAT | Extend ADHD-safety + import-safety audits across all new mechanics/art; kid sign-off | SAFE-04, SAFE-05 |

**Coverage:** 22/22 v4.0 requirements mapped, no orphans, no duplicates.

**Build-order rationale:** Pure save+registry spine first (no a727c13 risk); multi-scene shell second (first place the import-time trap and cross-scene leaks resurface); challenge-seam refactor third — MUST precede the mechanics that depend on it; remaining mechanics + difficulty fourth; author levels fifth (mechanics + builder ready); art near-last so logic validates on placeholders; consolidated kid-UAT last (feel is user-validated).

## Cross-Cutting Mitigations (baked into every engine-touching phase)

1. **a727c13 rule** — no Kaplay global (or `typeof <global>` guard) at module top level; engine refs only inside function bodies. Add `scripts/check-import-safety.sh` (Phase 14) and run each phase after.
2. **Mandatory real browser-boot per phase** — greps passing ≠ boots in a browser (the most expensive v3.0 lesson). No phase closes on automation alone.
3. **Anti-leak** — closure-local run state (never module-level `let`); cancel every global controller (`onKeyPress`/`onHide`/`onClick`) on `onSceneLeave`; single-flight tween cancel on the object.
4. **No-timer / forgiving / no-game-over** — every math interaction re-asks on wrong with zero penalty/lockout/XP-loss/despawn/restart; enemies never deal contact damage; nothing counts down. `check-safety.sh` re-run per mechanic.

## Key Decisions (v4.0)

| Decision | Rationale | Status |
|----------|-----------|--------|
| Clean-reset save (new versioned key, NO v3.0 migration) | User chose a clean slate; removes migration complexity and the bricking risk entirely (SAVE-05) | Locked in |
| Unlock state is *derived* from LEVEL_ORDER + `cleared` facts | One source of truth; no desync between stored "unlocked" and reality | Locked in |
| Levels = plain JS data + one parameterized builder + registry | No build step, no Kaplay `addLevel`, no Tiled; preserves merged-floor anti-seam-stick colliders | Locked in |
| One shared `ui/challenge.js` seam for all four mechanics + end gate | Avoids 4 anti-leak/z-index/forgiveness bugs; one firewalled brain consumer; re-point check-gate.sh | Locked in |
| Challenge-seam refactor before mechanics | It's a no-behavior-change refactor the mechanics depend on; order is non-negotiable | Locked in |
| Difficulty via per-level allowed-tables pool only (brain LOCKED) | `math/brain.js` is validated and out of scope; ramp via table scope, never the algorithm | Locked in |
| Art/animation deferred near-last (Phase 18) | Logic validates on placeholders; a727c13-sensitive parallax lands once the scene graph is stable | Locked in |
| `loadSprite({sliceX,sliceY,anims})` only — `loadSpriteSheet` does NOT exist in Kaplay 3001 | Correct loader; add `loadSpriteSheet` to banned-token grep | Locked in |
| Pin Kaplay at 3001.0.19 | Version-coupled (Rect class, setCamPos); any upgrade is its own scoped task | Locked in |

## Carried-Forward Decisions (v1/v2/v3, still valid)

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

## Critical Pitfalls to Prevent (v4.0, from research)

1. **a727c13 top-level-global trap resurfacing** (Phase 14 onward — most new modules ever) — factory functions, function-body-only globals, `check-import-safety.sh`, mandatory browser boot.
2. **Cross-scene state/handler/tween leak** (Phase 14 contract; re-applied in 15/16/18) — closure state + `go()` payload; cancel controllers on `onSceneLeave`; enter→leave→re-enter test.
3. **Sprite-sheet slicing / wrong loader** (Phase 18) — derive sliceX/sliceY from pixel dims; `loadSprite` only; eyeball each clip.
4. **Animation frame-timing / flip / state thrash** (Phase 18) — anim `speed` not dt; `play()` on state transition only (guard with `getCurAnim()`); flip with deadzone.
5. **Math mechanics drifting into punish/time/shame** (Phases 15–16) — one shared forgiving contract; per-mechanic forgiveness assertion + kid-UAT "what if wrong".
6. **Gate z-index / pause / input bugs mid-level** (Phases 15–16) — screen-space high-z overlay; scene pause flag respected by player+enemy update; overlay owns input; verify next to a hazard.
7. **(Mitigated by clean-reset save)** Save-migration bricking — SAVE-05 removes migration; still: `loadSave` try/catch never bricks boot, stale/foreign save → safe defaults (Phase 13).
8. **ADHD over-stimulation creep** from art/parallax/enemies/difficulty (Phases 16/18/19) — slow muted camera-tied parallax, ≤400–500ms flash cap, gentle decoupled difficulty ramp, full audit + kid-UAT.

## Research Flags (v4.0)

- **Phase 18 (Art):** exact `sliceX/sliceY/anims` frame layout unknown until the CC0 pack is picked — resolve at sourcing time; re-verify each asset's license at download (a CC-BY-SA coin was caught mislabeled in v3.0).
- **Phase 13 (Save):** clean-reset removes the v3.0-fixture migration test, but still capture/hand-construct a stale-and-foreign save to prove it never bricks boot.
- Standard patterns (lighter research): level-data authoring + multi-scene navigation both extend verified v3.0 seams (`go()` data, mathGate bridge, progress versioning).

## Deferred Items (from v3.0 close)

Items acknowledged and deferred at v3.0 milestone close on 2026-06-28:

| Category | Item | Status |
|----------|------|--------|
| uat | Phase 08 — MOVE-05 throttled/non-60Hz empirical check | pending (code verified dt-correct; 1 UAT scenario not run) |
| verification | Phase 08 — 08-VERIFICATION human_needed | 13/13 must-haves verified; only the MOVE-05 feel-check outstanding |
| deploy | Phase 07 — SETUP-02 live Dokploy deploy confirmation | container curl-proven locally; live-URL playthrough not yet confirmed |

These are low-risk and independently actionable. See `.planning/milestones/v3.0-MILESTONE-AUDIT.md` for evidence and the one-time action for each.

## Deferred (v2 & beyond v4.0)

- Audio / SFX / calm ambient music (AUDIO-01) — deferred again; silence weakens the "real game" feel, revisit after v4.0.
- More worlds / level packs beyond the initial 3–5 (CONTENT-FUT-01).
- Star/score-based completion texture (CONTENT-FUT-02) — kept out to stay simple and non-punishing.

## Quick Tasks Completed

| Date | Slug | Summary |
|------|------|---------|
| 2026-06-28 | make-the-game-window-render-50-bigger-sc | Display-only +50% canvas scale (960×540, crisp pixel upscale); internal 640×360 resolution unchanged so no gameplay numbers moved |

## Session Continuity

**Stopped at:** Phase 14 (Multi-Scene Shell) fully complete — real-browser NAV-01..04 checkpoint passed live with the user. Two real defects were found and fixed during that session (not visible to static analysis): select-tile clicks missing the `area()` component (commit bb6bb58), and a canvas-scale CSS override desyncing Kaplay's mouse coordinates from the 640x360 world space, breaking all position-based clicks including the v3.0 math-gate answer boxes (commit 5e34933) — fixed via CSS `transform` instead of `width`/`height`. A third UX finding (the LEVEL CLEAR celebration never painted before the synchronous scene transition) was also fixed (commit 25653f6). Ready to begin Phase 15.

**Resume file:** None

**Last session:** 2026-07-02T18:35:00.000Z

**Next steps:**

1. Continue `/gsd-autonomous` (or `/gsd-autonomous --from 15`) into Phase 15 (Challenge Seam + Locked-Door Mechanic) → 16 (remaining mechanics + difficulty) → 17 (build levels) → 18 (art/parallax) → 19 (kid-UAT).
2. Worth flagging when Phase 15/16 touch `ui/mathGate.js`: confirm the math-gate answer-box mouse-click path (same `box.onClick()` + `area()` pattern as the fixed select tiles) actually works now that the canvas-scale bug is fixed — it was likely silently broken since the 2026-06-28 "+50% display scale" quick task, predating this milestone, and was never independently re-verified beyond this session's spot-check.

**Context for next session:**

- v4.0 is a 7-phase, dependency-driven roadmap (Phases 13–19) continuing v3.0's numbering
- 22/22 v4.0 requirements mapped, no orphans, no duplicates
- Pure/low-risk spine (save + registry) front-loaded; refactor (challenge seam, Phase 15) MUST precede the mechanics (Phase 16) that depend on it; content after mechanics; art near-last so logic validates on placeholders; kid-UAT last
- Clean-reset save (SAVE-05) removes migration complexity vs. the original research SUMMARY's additive-migration framing — honor SAVE-05
- Every engine-touching phase ends with a REAL browser boot, not just greps (the a727c13 lesson)

---

**State initialized:** 2026-06-20
**Last updated:** 2026-06-29 (v4.0 roadmap created — Phases 13–19)

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

## Operator Next Steps

- Review and approve the v4.0 ROADMAP.md (Phases 13–19)
- Then run `/gsd-plan-phase 13` to begin the milestone

## Decisions

- [Phase ?]: [Phase 13]: 13-01: Save key/version pinned to mathlab_platformer_v2 / VERSION 2; Wave 1 Plan 02 must match or the gate stays red
- [Phase ?]: [Phase 13]: 13-02: v4.0 clean-reset save key mathlab_platformer_v2 / VERSION 2; per-level cleared map stores ONLY cleared facts, unlock derived in registry
- [Phase ?]: Level registry: ordered LEVEL_ORDER + getLevel + derived isUnlocked; v3.0 geometry lifted verbatim into level-01 descriptor; a727c13 Rect guard kept inside buildLevel body
- [Phase ?]: [Phase 14] 14-01: check-import-safety.sh negative grep is ANCHORED to module-top-level forms and SCOPED to title.js/select.js only (game.js/main.js excluded); calibrated RED on scripts/fixtures/bad-scene.js, GREEN on shipped game.js
- [Phase ?]: [Phase 14] 14-01: titleScene + selectScene are pure-canvas closure factories (engine globals body-only, a727c13); select derives unlock via isUnlocked + reads createProgress(loadSave()) fresh every entry — one source of truth, never stores its own unlocked flag
- [Phase 14]: 14-03: static gate suite (import-safety+progress+safety) re-run GREEN; real-browser NAV-01..04 boot recorded PENDING as a blocking human-verify (autonomous:false) — NAV reqs close at runtime sign-off, not on greps
