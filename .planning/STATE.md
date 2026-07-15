---
gsd_state_version: 1.0
milestone: v6.0
milestone_name: SNES-Fidelity World
current_phase: 35
current_phase_name: Biome Re-dress & Props
status: executing
stopped_at: "Phase 32 (Terrain & Parallax Rendering) complete — autotile terrain + biome parallax + assets manifest, geometry byte-frozen; code review caught and root-caused a real pathfinding bug (levels 03/04) rather than accepting a surface-level fix, verified live. Continuing the autonomous run into Phase 33 — the next checkpoint:human-verify phase (player art sign-off)."
last_updated: "2026-07-15T08:13:39.388Z"
last_activity: 2026-07-15
last_activity_desc: Phase 34.5 complete, transitioned to Phase 35
progress:
  total_phases: 12
  completed_phases: 7
  total_plans: 31
  completed_plans: 31
  percent: 58
---

# Project State: Nox Run (formerly Math Lab)

**Project:** Nox Run — Gamified Math Practice for Kids
**Initialized:** 2026-06-20
**Current Milestone:** v6.0 SNES-Fidelity World (Phases 29–38)

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-11)

**Core Value:** She opens it because she *wants* to, not because she has to.
**Current Focus:** Phase 34.5 — Key & Lock Mechanic — the first non-math gate

**Shipped State (v5.0, 2026-07-09):** Replayable 8-level Kaplay platformer — signed-off logo/title → 2×4 level-select → 8 distinctly-themed dark-grunge levels with a gentle ramp → forgiving no-timer math mechanics + hidden secret alcoves → persisted XP/level/unlock (`noxrun_platformer_v1`) → full ADHD-safe audio layer. All 25 v5.0 requirements satisfied under genuine automated + human sign-off.

**Tech Stack:** Vanilla ES2020 + vendored Kaplay 3001.0.19 (pinned, no upgrade), no build step, nginx Docker static via Dokploy, localStorage only. v6.0 research confirmed **zero new dependencies** — letterbox canvas, touch API, `patrol()`, `stickToPlatform` all exist in the vendored engine; Pillow + Playwright already installed.

## Current Position

Phase: 35 — Biome Re-dress & Props
Plan: Not started
Status: Executing Phase 34.5
Last activity: 2026-07-15 — Phase 34.5 complete, transitioned to Phase 35

Progress: [█████░░░░░] 50%  (6 of 12 phases — 34.5 and 34.6 inserted mid-milestone)

## v6.0 Roadmap Summary

| Phase | Goal | Requirements |
|-------|------|--------------|
| 29. Mechanic Cleanup | Collect removed atomically, pacing rebalanced, alcove discovery cue + positive-only select marker | MECH-01..03, MECH-06 |
| 30. Harness Extensions | Validator/audit learn alcoves + movers RED-first, before any level uses them | MECH-04, MOT-04 |
| 31. Asset Bake & Style-Board Sign-off | Gothicvania biome art vendored + conformed; style-board sign-off hard-gates ALL downstream art; pink-scan gate | ART-01 |
| 32. Terrain & Parallax Rendering | Solid autotiled ground + real multi-layer parallax, geometry byte-frozen, manifest gate | ART-02, ART-03 |
| 33. Player & Entity Animation | Fully animated player + entity art on locked 16×32 collider | ART-04, ART-05 |
| 34. Level Quality Pass ✅ | Coin model + in-engine audit, 07/08 differentiated, AGREED+ENFORCED rulebook (headroom HARD), bidirectional harness | LVL-01..03 |
| **34.5 Key & Lock Mechanic** 🆕 | The first NON-MATH gate. Reverses SEED-001's no-new-mechanics lock. Code, not geometry — must land BEFORE the rebuild. HARD: no softlock | KEY-01/02 |
| **34.6 Level Redesign** 🆕 | REBUILD all 8 levels from scratch, ~2x length. Biome-pair rhythm: odd = calm intro, EVEN (2/4/6/8) = intense + vertical. Descents, optional high routes, VISIBLE doubling-back only | LEN-01/02 |
| 35. Biome Re-dress & Props | All 8 levels dressed in their biomes + visual-only props layer, geometry byte-frozen | ART-06, ART-07 |
| 36. World Motion & Ambient Life | Patrols, moving platforms, ambient animation, alcove torch — dt-based, ADHD-safe | MOT-01..03, MECH-05 |
| 37. Mobile — Responsive Canvas & Touch | RED-first letterbox probe, touch buttons with hold semantics, tappable answers/mute/reset | MOB-01..05 |
| 38. n0x Logo & Closing Verification | n0x mark, live Dokploy playthrough, kid-UAT, MOVE-05, consolidated gate suite | BRAND-01, MOB-06, VER-01..04 |

**Coverage:** 31/31 v6.0 requirements mapped, no orphans, no duplicates. Ordering constraints: cleanup (29) before any re-dress; Phase 31 sign-off hard-gates 32/33/35; validator learns movers (30) a full phase-boundary before any level ships one (36); quality-pass geometry (34) settles before re-dress (35); mobile probe before touch layer; verification last. Parallel tracks: 31 ∥ 29–30, 33 ∥ 32, 37 ∥ (31–36) after 29.

## Performance Metrics

**Velocity (through v5.0):** 28 phases, 107 plans completed across 6 shipped milestones (2026-06-20 → 2026-07-09). Per-plan history archived in `.planning/milestones/`.

**v6.0:** 20 plans completed (Phases 29-34). Phase 34 ran 7 plans (6 executed, 34-05 deliberately skipped).

## Accumulated Context

### Decisions

Full log in PROJECT.md Key Decisions. Binding for v6.0:

- **Sonnet 5 executes this milestone's implementation — phases sized accordingly:** small and single-concern (user decision, 2026-07-09; roadmap resized 8 → 10 phases at user request before approval)
- **SEED-001 (2026-07-07) — PARTIALLY REVERSED 2026-07-15.** Its dark-SNES register (Castlevania IV / Demon's Crest), CC0/CC-BY sourcing, and `.planning/research/v6-scouting/` as verified-fact still stand. **But its "no new play mechanics" clause is REVERSED** — the user explicitly added a key/lock mechanic (Phase 34.5), the game's first non-math gate. See the key-mechanic entry below.
- **Guardrails, AMENDED 2026-07-15:** all gates stay green (EXCEPT the 13 deliberate validator HARD-FAILs on geometry Phase 34.6 deletes — see `34-VERIFICATION.md`); no new runtime deps; no Kaplay upgrade; math brain LOCKED; no timers; no punishment/game-over; no pink (though the user has said not to over-index on the pink gate — "it's ok if there is some pink in there, the design is already approved", 2026-07-14). **The "kid-validated geometry byte-frozen" guardrail is SUSPENDED for Phase 34.6**, which rebuilds every level from scratch at the user's explicit instruction.
- **The CSS `transform: scale(1.5)` trick and touch input are mutually exclusive** (source-verified): mouse reads `offsetX` (transform-immune), touch reads `clientX − rect()` (transform-affected). Phase 37 opens with a RED-first Playwright touch probe; `letterbox: true` is the primary fix candidate, DOM overlay the fallback — the probe decides
- **Check-safety-compliant motion idioms come from `spike-code/` ONLY** — web Kaplay examples use banned `wait()`/`loop()`
- **Player sprite swap must lock the collider explicitly** via `area({ shape: 16×32 })` — a bare swap silently resizes the physics body and invalidates the calibrated jump envelope + kid-validated feel
- **Never rubber-stamp `checkpoint:human-verify` gates** (standing precedent, Phases 25/27/28) — style board (31), player art (33), hazard placement (36), n0x logo (38), kid-UAT (38) all require genuine sign-off
- **v5.0 backlog absorbed:** 999.1 collect-the-answer → MECH-01/02 (Phase 29); 999.2 pink spike sprite → subsumed by ART-01's art replacement + pink-scan gate (Phase 31)
- **Math density locked at exactly 1 door + 1 enemy + the end goal gate per level = 3 challenges** (user's explicit direction 2026-07-12, supersedes the 2026-07-11 "one of each" reading) — implemented across all 8 descriptors: all mid-level checkpoint mathGates removed, levels 02/05/07 gained their missing enemy, 03 its missing door (reusing the removed fly enemy's proven x:3800 footprint), 04 dropped its second door; smoke-progress golden fixtures re-baselined. Binding for Phases 34–38, none may raise or lower the count
- **Biome parallax "black mess" regression found + fixed in two passes, 2026-07-12, at the Phase 33 human-verify checkpoint:**
  1. **Commit `caebfae`:** `_bake_biome_parallax_layer()` in `scripts/build-art-assets.py` was crushing the rich Gothicvania biome background art to near-solid `#0a0a0a` via a `_remap_luminance()` pass borrowed from the flat-Kenney-silhouette ground/tile pipeline — never present in the actually-approved `styleboard.py` reference. Fixed by dropping that remap (retint/tile/anchor/save only, matching `styleboard.py`); all 12 biome parallax PNGs regenerated from re-fetched CC0 sources (`CREDITS.md` documents them as re-fetchable).
  2. **Commit `78b7dd2`:** second human look flagged "odd bits and pieces" — some source layers (e.g. swamp's `mid-layer-02.png`) are discrete RGBA feature art, not seamless textures; tiling them edge-to-edge then flattening straight to RGB baked each repeat's transparent surround in as a hard black void (repeated stamps in black holes, not a continuous scene). Fixed by alpha-compositing onto a solid backing plate (`_dominant_opaque_color()`, auto-sampled per layer) before flattening, mirroring `styleboard.py`'s own alpha-composite-onto-colored-canvas technique.
  3. A subsequent `browser-boot.mjs` FPS-floor failure (levels 2-4, ~40fps vs floor 45) was diagnosed as a load-contention flake, not a regression — confirmed via a Fable 5 subagent consultation (user's explicit request) and a clean isolated re-run (all green, 49-60fps) once no other Playwright/gate processes were running concurrently. Both fixes are Python/build-time-only; zero runtime code changed.
  - Full 9-command gate suite reverified green after both fixes, including `check-pink-gate.sh`. User's explicit instruction (2026-07-11 night): investigate/fix root causes and get back to the Phase 33 checkpoint autonomously without reopening Phase 31/32 planning or asking further questions — only the final human sign-off itself stays a real pause.
  4. **Commit `f6a386e` (2026-07-12, Fable 5 escalation at the user's request):** third human look showed the real root cause was ARCHITECTURAL — the bake bottom-cropped every 179–304px-tall source into a 90–144px strip (showing only the bottom sixth of the approved art) and the runtime floor-anchored those strips in a viewport whose camera climbs 360px (levels 07/08 `bounds.top: -360`), so most of the screen was `#0a0a0a` by construction. Rebuilt to mirror `styleboard.py` scene composition exactly: far = full 640×360 plate (stretch_top sky; swamp keeps its (30,32,30) base), mid/near = native-height RGBA with transparency preserved, single-plate boards bake transparent placeholders, castle drops the two multi-panel preview sheets (the "bits and pieces" + purple clash) for the pack's dedicated interior plate at the board's x=250 crop, and `src/parallax.js` pins layers vertically to the camera (byte-identical placement for levels 01–06, full coverage on 07/08 climbs). Verified: 4-biome + climb-altitude screenshots vs boards, zero console errors, full gate suite green. **Binding steering for Phases 34–38 art work: `.planning/research/ART-PARITY-STEERING.md`** (styleboard.py is the normative spec; art plans must name exact sources/crops/retints; visual tasks require side-by-side board comparisons; gates don't look at pixels — recommend a Phase-35 `check-biome-coverage.mjs`).

- **Phase 34.5 inserted (2026-07-14, user request, mid-Phase-34): REBUILD every level from scratch and double its length.** Lands between Phase 34 and Phase 35 — the only cheap moment, because terrain/parallax are procedural (new geometry dresses itself) but the Phase-35 props layer and Phase-36 motion placement are hand-placed and would be re-run over any later geometry change. **This deliberately SUSPENDS the "append to kid-validated levels, never edit inside" convention** — the user's instruction was explicit ("redo the entire level, not just extending, as the current placements are a bit 'beta'"). **Consequence, accepted knowingly: levels 01–03's kid-validated platforming is discarded and her prior sign-off no longer covers them — Phase 38's kid-UAT (VER-02) becomes a real re-approval of new content and must budget for a rejection.** Math density stays LOCKED at 1 door + 1 enemy + end gate — twice the platforming per math gate is the intent, not a dilution.
- **SEED-001's "no new play mechanics" lock is REVERSED (2026-07-15, explicit user decision).** The user chose to add a **key/lock mechanic** — the game's **first non-math gate**. This is a real change to the project's thesis (*"multiplication is the gate to progress"*): a key blocks her for a reason that is not math. Accepted knowingly, not by accident. It gets its own phase (**34.5**) landing BEFORE the level rebuild (34.6), because a key is CODE (mechanics module + descriptor fields + validator + audit), not geometry — retrofitting it into 8 freshly-rebuilt levels would force a second geometry pass. **The hard constraint: NO SOFTLOCK.** A key she can miss on a route she cannot re-traverse is a dead end, and a dead end in a no-punishment game for a 12-year-old is the worst failure this project can ship — so key-before-lock reachability gets a HARD validator check, like coin-reachability did. **Open question for 34.5's discuss:** does the key-lock ADD a 4th barrier or REPLACE the math door? Math density is currently locked at 3 challenges/level.
- **Level-shape brief agreed (2026-07-15) — altitude is a CORE FEATURE, not an ending.** The organising idea is the **biome-pair rhythm**: biomes are pairs (1–2 swamp, 3–4 town, 5–6 cemetery, 7–8 castle); the **odd** level introduces the biome (calmer), the **even** level (2/4/6/8) is the second visit and goes **intense and vertical**. This makes the difficulty ramp structural. `LEVEL-REVIEW.md` proved the current ramp is fiction — six of eight levels have ZERO overlapping tiers and 07/08 carry the *easiest* gaps. Also agreed: **descents** (levels only ever go up today), **optional high routes** (risk/reward, no punishment), and **backtracking as VISIBLE doubling-back ONLY** — she must always be able to SEE where she's going; no hidden routes, because a 12-year-old with ADHD who loses the thread stops playing. LVL-02 never mandated altitude — it only required 07/08 not be near-duplicates of *each other*.
- **Headroom is a real, unruled defect class (found 2026-07-14 at Phase 34's level-08 checkpoint):** `headroom = rise − thickness − 32`. Every tier of level-07's end climb ships with **9px** of headroom, and level-08's new switchback had 9–14px — the player is 32px tall in a 41–46px slot. `docs/LEVEL-DESIGN.md` quantifies rise, gap and overlap but had **NO headroom rule**, and no gate checked it, which is exactly why it shipped unnoticed. Fix: climb tiers to `h:16` + rises to 72–75 (~27px headroom); a headroom rule goes into LEVEL-DESIGN.md and a headroom check into the validator (Phase 34-06). All 60 platforms in the game use `h:24`.
- **The verification harness is RIGHTWARD-ONLY (found 2026-07-14):** `driveToXPlanned` presses ArrowRight once and holds it, measuring progress as monotonically-increasing x; `planTakeoffs` emits no leftward takeoffs. So a switchback climb reads as a stall and the bot dies. User chose **Option A — fix the harness** (its own plan), because Phase 36's moving platforms and patrols need bidirectional driving anyway: the cost is paid once and reused. Note `audit-coins.mjs` *teleports* the player onto each tier rather than driving from spawn — so until the harness is bidirectional, **nothing automated proves a switchback level is navigable from spawn**.

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
