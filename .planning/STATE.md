---
gsd_state_version: 1.0
milestone: v6.0
milestone_name: SNES-Fidelity World
current_phase: 33
current_phase_name: Player & Entity Animation
status: planning
stopped_at: Phase 32 (Terrain & Parallax Rendering) complete — 5 plans executed across 3 waves (2 parallel worktree pairs + 1 solo), autotile terrain + biome parallax + assets manifest all landed with geometry byte-frozen. Code review found and fixed a genuine critical bug (the new far-end proof check silently never reached the goal), and chasing the real fix surfaced a deeper pre-existing pathfinding bug in scripts/lib/route-planner.mjs affecting levels 03/04, root-caused and fixed with live in-engine verification (3 consecutive full 8-level browser-boot passes). Verification passed 5/5 must-haves. Continuing the autonomous run into Phase 33 — the first checkpoint:human-verify phase since Phase 31 (player art sign-off).
last_updated: "2026-07-11T10:46:58.073Z"
last_activity: 2026-07-11
last_activity_desc: Phase 32 complete, transitioned to Phase 33
progress:
  total_phases: 10
  completed_phases: 4
  total_plans: 16
  completed_plans: 16
  percent: 40
---

# Project State: Nox Run (formerly Math Lab)

**Project:** Nox Run — Gamified Math Practice for Kids
**Initialized:** 2026-06-20
**Current Milestone:** v6.0 SNES-Fidelity World (Phases 29–38)

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-11)

**Core Value:** She opens it because she *wants* to, not because she has to.
**Current Focus:** Phase 33 — Player & Entity Animation

**Shipped State (v5.0, 2026-07-09):** Replayable 8-level Kaplay platformer — signed-off logo/title → 2×4 level-select → 8 distinctly-themed dark-grunge levels with a gentle ramp → forgiving no-timer math mechanics + hidden secret alcoves → persisted XP/level/unlock (`noxrun_platformer_v1`) → full ADHD-safe audio layer. All 25 v5.0 requirements satisfied under genuine automated + human sign-off.

**Tech Stack:** Vanilla ES2020 + vendored Kaplay 3001.0.19 (pinned, no upgrade), no build step, nginx Docker static via Dokploy, localStorage only. v6.0 research confirmed **zero new dependencies** — letterbox canvas, touch API, `patrol()`, `stickToPlatform` all exist in the vendored engine; Pillow + Playwright already installed.

## Current Position

Phase: 33 — Player & Entity Animation
Plan: Not started
Status: Ready to plan Phase 33
Last activity: 2026-07-11 — Phase 32 complete, transitioned to Phase 33

Progress: [████░░░░░░] 40%

## v6.0 Roadmap Summary

| Phase | Goal | Requirements |
|-------|------|--------------|
| 29. Mechanic Cleanup | Collect removed atomically, pacing rebalanced, alcove discovery cue + positive-only select marker | MECH-01..03, MECH-06 |
| 30. Harness Extensions | Validator/audit learn alcoves + movers RED-first, before any level uses them | MECH-04, MOT-04 |
| 31. Asset Bake & Style-Board Sign-off | Gothicvania biome art vendored + conformed; style-board sign-off hard-gates ALL downstream art; pink-scan gate | ART-01 |
| 32. Terrain & Parallax Rendering | Solid autotiled ground + real multi-layer parallax, geometry byte-frozen, manifest gate | ART-02, ART-03 |
| 33. Player & Entity Animation | Fully animated player + entity art on locked 16×32 collider | ART-04, ART-05 |
| 34. Level Quality Pass | 5–8 reachability fixed, 07/08 climbs differentiated, soft-rules review, motion rules written | LVL-01..03 |
| 35. Biome Re-dress & Props | All 8 levels dressed in their biomes + visual-only props layer, geometry byte-frozen | ART-06, ART-07 |
| 36. World Motion & Ambient Life | Patrols, moving platforms, ambient animation, alcove torch — dt-based, ADHD-safe | MOT-01..03, MECH-05 |
| 37. Mobile — Responsive Canvas & Touch | RED-first letterbox probe, touch buttons with hold semantics, tappable answers/mute/reset | MOB-01..05 |
| 38. n0x Logo & Closing Verification | n0x mark, live Dokploy playthrough, kid-UAT, MOVE-05, consolidated gate suite | BRAND-01, MOB-06, VER-01..04 |

**Coverage:** 31/31 v6.0 requirements mapped, no orphans, no duplicates. Ordering constraints: cleanup (29) before any re-dress; Phase 31 sign-off hard-gates 32/33/35; validator learns movers (30) a full phase-boundary before any level ships one (36); quality-pass geometry (34) settles before re-dress (35); mobile probe before touch layer; verification last. Parallel tracks: 31 ∥ 29–30, 33 ∥ 32, 37 ∥ (31–36) after 29.

## Performance Metrics

**Velocity (through v5.0):** 28 phases, 107 plans completed across 6 shipped milestones (2026-06-20 → 2026-07-09). Per-plan history archived in `.planning/milestones/`.

**v6.0:** 16 plans completed (Phases 29-32).

## Accumulated Context

### Decisions

Full log in PROJECT.md Key Decisions. Binding for v6.0:

- **Sonnet 5 executes this milestone's implementation — phases sized accordingly:** small and single-concern (user decision, 2026-07-09; roadmap resized 8 → 10 phases at user request before approval)
- **SEED-001's four locked decisions stand (2026-07-07):** visuals + cosmetic world motion only (no new play mechanics), dark-SNES register (Castlevania IV / Demon's Crest), CC0/CC-BY sourcing, and `.planning/research/v6-scouting/` (ASSET-SCOUTING.md, SPIKE-FINDINGS.md, styleboard.py) consumed as verified fact — not re-researched
- **Guardrails unchanged:** all gates stay green; kid-validated geometry re-dressed not rebuilt (byte-frozen outside sanctioned Phase-34 fixes); no new runtime deps; no Kaplay upgrade; math brain LOCKED; no timers; no pink (new automated pink-scan gate in Phase 31)
- **The CSS `transform: scale(1.5)` trick and touch input are mutually exclusive** (source-verified): mouse reads `offsetX` (transform-immune), touch reads `clientX − rect()` (transform-affected). Phase 37 opens with a RED-first Playwright touch probe; `letterbox: true` is the primary fix candidate, DOM overlay the fallback — the probe decides
- **Check-safety-compliant motion idioms come from `spike-code/` ONLY** — web Kaplay examples use banned `wait()`/`loop()`
- **Player sprite swap must lock the collider explicitly** via `area({ shape: 16×32 })` — a bare swap silently resizes the physics body and invalidates the calibrated jump envelope + kid-validated feel
- **Never rubber-stamp `checkpoint:human-verify` gates** (standing precedent, Phases 25/27/28) — style board (31), player art (33), hazard placement (36), n0x logo (38), kid-UAT (38) all require genuine sign-off
- **v5.0 backlog absorbed:** 999.1 collect-the-answer → MECH-01/02 (Phase 29); 999.2 pink spike sprite → subsumed by ART-01's art replacement + pink-scan gate (Phase 31)
- **Math-gate/enemy/door density stays at one of each per level** (user's explicit live direction, 2026-07-11, during Phase 33 planning) — matches the status quo already; binding for Phases 34–36, none should raise that count
- **Biome parallax "black mess" regression found + fixed in two passes, 2026-07-12, at the Phase 33 human-verify checkpoint:**
  1. **Commit `caebfae`:** `_bake_biome_parallax_layer()` in `scripts/build-art-assets.py` was crushing the rich Gothicvania biome background art to near-solid `#0a0a0a` via a `_remap_luminance()` pass borrowed from the flat-Kenney-silhouette ground/tile pipeline — never present in the actually-approved `styleboard.py` reference. Fixed by dropping that remap (retint/tile/anchor/save only, matching `styleboard.py`); all 12 biome parallax PNGs regenerated from re-fetched CC0 sources (`CREDITS.md` documents them as re-fetchable).
  2. **Commit `78b7dd2`:** second human look flagged "odd bits and pieces" — some source layers (e.g. swamp's `mid-layer-02.png`) are discrete RGBA feature art, not seamless textures; tiling them edge-to-edge then flattening straight to RGB baked each repeat's transparent surround in as a hard black void (repeated stamps in black holes, not a continuous scene). Fixed by alpha-compositing onto a solid backing plate (`_dominant_opaque_color()`, auto-sampled per layer) before flattening, mirroring `styleboard.py`'s own alpha-composite-onto-colored-canvas technique.
  3. A subsequent `browser-boot.mjs` FPS-floor failure (levels 2-4, ~40fps vs floor 45) was diagnosed as a load-contention flake, not a regression — confirmed via a Fable 5 subagent consultation (user's explicit request) and a clean isolated re-run (all green, 49-60fps) once no other Playwright/gate processes were running concurrently. Both fixes are Python/build-time-only; zero runtime code changed.
  - Full 9-command gate suite reverified green after both fixes, including `check-pink-gate.sh`. User's explicit instruction (2026-07-11 night): investigate/fix root causes and get back to the Phase 33 checkpoint autonomously without reopening Phase 31/32 planning or asking further questions — only the final human sign-off itself stays a real pause.
  4. **Commit `f6a386e` (2026-07-12, Fable 5 escalation at the user's request):** third human look showed the real root cause was ARCHITECTURAL — the bake bottom-cropped every 179–304px-tall source into a 90–144px strip (showing only the bottom sixth of the approved art) and the runtime floor-anchored those strips in a viewport whose camera climbs 360px (levels 07/08 `bounds.top: -360`), so most of the screen was `#0a0a0a` by construction. Rebuilt to mirror `styleboard.py` scene composition exactly: far = full 640×360 plate (stretch_top sky; swamp keeps its (30,32,30) base), mid/near = native-height RGBA with transparency preserved, single-plate boards bake transparent placeholders, castle drops the two multi-panel preview sheets (the "bits and pieces" + purple clash) for the pack's dedicated interior plate at the board's x=250 crop, and `src/parallax.js` pins layers vertically to the camera (byte-identical placement for levels 01–06, full coverage on 07/08 climbs). Verified: 4-biome + climb-altitude screenshots vs boards, zero console errors, full gate suite green. **Binding steering for Phases 34–38 art work: `.planning/research/ART-PARITY-STEERING.md`** (styleboard.py is the normative spec; art plans must name exact sources/crops/retints; visual tasks require side-by-side board comparisons; gates don't look at pixels — recommend a Phase-35 `check-biome-coverage.mjs`).

### Cross-Cutting Mitigations (every engine-touching phase)

1. **a727c13 rule** — no Kaplay global at module top level; engine refs inside function bodies only
2. **Anti-leak** — closure-local run state; app-bus controllers cancelled on `onSceneLeave`
3. **No-timer / forgiving / no-game-over** — delayed effects via `tween().onEnd()`; patrols/movers dt-based, telegraphed, zero punishment wiring
4. **Geometry-frozen art diffs** — level geometry arrays byte-identical in re-dress commits; sanctioned fixes land separately in Phase 34, validator-gated
5. **Spike perf cliffs** — chunked `{tiled:true}` fill (≤~40 cols/chunk); never per-tile fill (15fps) or one giant tiled quad (renders nothing, silently)

### Pending Todos

All 5 pre-v6.0 pending todos were absorbed into v6.0 requirements at kickoff (2026-07-09); 2 of 5 formally closed (moved to `.planning/todos/completed/`) on Phases 29-30's completion:

- ✓ alcove discoverability/value → MECH-03/06, closed Phase 29 — the "nothing happens" feedback gap is now a real burst/chime/popup + select-screen marker
- ✓ alcove automated coverage → MECH-04, closed Phase 30 — validator + interactive audit both genuinely detect alcove reachability/discovery now
- unreachable pickups + 07/08 repetition → LVL-01/02 (Phase 34) · LEVEL-DESIGN.md soft-rules review → LVL-03 (Phase 34) · "n0x" logo shortening → BRAND-01 (Phase 38)

### Blockers/Concerns

- **Letterbox vs DOM-overlay touch strategy** — the one open technical decision; Phase 37's opening probe resolves it (letterbox primary, overlay fallback)
- **Real-device facts can't be pre-verified:** touch audio activation (`touchstart` is not activation-triggering) and phone-GPU parallax feel — must be proven on device in Phases 37–38, not assumed
- **[Phase 23, carried] Playwright script duplication convention** — server/guard code copied verbatim across audit scripts; any fix must be applied by hand in every copy (new touch-audit script follows the same convention)

## Deferred Items

All prior deferred items were absorbed into v6.0 requirements: SETUP-02 live Dokploy playthrough → VER-01; SAFE-05 kid-UAT live sign-off → VER-02; MOVE-05 non-60Hz feel check → VER-03.

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none — all absorbed into v6.0 scope)* | | | |

## Session Continuity

Last session: 2026-07-11
Stopped at: Phase 32 (Terrain & Parallax Rendering) complete — autotile terrain + biome parallax + assets manifest, geometry byte-frozen; code review caught and root-caused a real pathfinding bug (levels 03/04) rather than accepting a surface-level fix, verified live. Continuing the autonomous run into Phase 33 — the next checkpoint:human-verify phase (player art sign-off).
Resume file: None

---

**State initialized:** 2026-06-20
**Last updated:** 2026-07-11 (Phase 32 complete — next: `/gsd-plan-phase 33`)
