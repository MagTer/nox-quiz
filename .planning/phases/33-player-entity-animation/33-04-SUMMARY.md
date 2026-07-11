---
phase: 33-player-entity-animation
plan: 04
subsystem: level-build-visual-emission
tags: [kaplay, sprite-anim, math-gate, enemy, collision-neutral]

# Dependency graph
requires:
  - phase: 33-player-entity-animation
    provides: "Plan 33-01's baked assets/math-gate.png (native Gothicvania color) and Plan 33-02's loadSprite(\"math-gate\")/loadSprite(\"enemy-hellhound\", {anims:{idle}}) registrations + CONFIG.ENEMY.SPRITES/FRAME_W/IDLE_SPEED tunables"
provides:
  - "src/levels/build.js math-gate panel emission: sprite(\"math-gate\") replacing rect()+color()+outline(), glyph unchanged on top"
  - "src/levels/build.js enemy panel emission: modulo-safe CONFIG.ENEMY.SPRITES index, FRAME_W-centering x-offset, panel.play(\"idle\")"
  - "Proof (audit-phase21-mechanics.mjs + browser-boot.mjs, both exit 0) that the visual-only swap is collision-neutral across all 8 levels"
affects: [33-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "panel.play(\"idle\") mirrors the existing coin.play(\"spin\") call-site precedent (line ~201) for wiring a looping anim onto a freshly-added sprite entity"

key-files:
  created: []
  modified:
    - src/levels/build.js

key-decisions:
  - "Kept insertion order of blocker->panel->glyph unchanged in the math-gate loop (no reordering) so the new opaque sprite art doesn't visually cover the glyph — matters more now than with the old flat box since the new sprite has real opaque pixels across most of its area"

patterns-established: []

requirements-completed: []  # ART-05 spans all 5 plans in this phase; orchestrator marks it complete only after Phase 33's verifier confirms full delivery (per parallel_execution note in this plan's dispatch)

coverage:
  - id: D1
    description: "Math-gate mechanic panel renders as real sprite art (sprite(\"math-gate\")) instead of the flat-color rect+outline placeholder, with the \"?\" glyph still legible on top"
    requirement: "ART-05"
    verification:
      - kind: unit
        ref: "grep -c 'sprite(\"math-gate\")' src/levels/build.js == 1; grep -c LOCKED_GREY src/levels/build.js == 0"
        status: pass
      - kind: e2e
        ref: "node scripts/audit-phase21-mechanics.mjs (all math-gate encounters across 8 levels: triggered=true, resolved=true)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Enemy mechanic panel plays a real looping idle anim (enemy-hellhound), centered over its unchanged 32px-wide invisible blocker via a FRAME_W-derived x-offset, with a modulo-safe variant index guarding against undefined-sprite crashes"
    requirement: "ART-05"
    verification:
      - kind: unit
        ref: "grep -c 'panel.play(\"idle\")' src/levels/build.js == 1; grep -c '% CONFIG.ENEMY.SPRITES.length' src/levels/build.js == 1; grep -c CONFIG.ENEMY.FRAME_W src/levels/build.js == 1"
        status: pass
      - kind: e2e
        ref: "node scripts/audit-phase21-mechanics.mjs (all enemy encounters across levels 03/06/08, including variant:1/2 descriptors: triggered=true, resolved=true, zero sprite(undefined) crash)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every invisible blocker collider (rect()+area()+body({isStatic:true})) for doors/math-gates/enemies is byte-unchanged from its pre-phase state — visual-only swap, geometry frozen"
    requirement: "ART-05"
    verification:
      - kind: other
        ref: "git diff src/levels/build.js — confirmed diff hunks touch only the panel add() call bodies, zero lines inside any of the three body({isStatic:true}) blocker blocks"
        status: pass
    human_judgment: false
  - id: D4
    description: "Full interactive mechanic audit still triggers every door/math-gate/enemy encounter across all 8 levels post-swap, and rendering stays non-blank/in-budget"
    requirement: "ART-05"
    verification:
      - kind: e2e
        ref: "node scripts/audit-phase21-mechanics.mjs"
        status: pass
      - kind: automated_ui
        ref: "node scripts/browser-boot.mjs"
        status: pass
    human_judgment: false
  - id: D5
    description: "Visual quality of the new math-gate/enemy-idle art reads correctly against each level's biome register (dark, non-flat, no-pink) — subjective judgment beyond automated pink-gate/collision proof"
    verification: []
    human_judgment: true
    rationale: "Automated checks (pink-gate at bake time in 33-01, collision-neutrality here) prove the assets are technically clean and the swap is safe, but whether the art actually reads well in-game is a visual-quality call reserved for this phase's overall human sign-off (ART-04/ART-05 checkpoint), not this plan alone."

duration: ~12min
completed: 2026-07-11
status: complete
---

# Phase 33 Plan 04: Math-Gate + Enemy Visual Swap Summary

**Swapped the math-gate's flat-color placeholder panel for `sprite("math-gate")` and wired the enemy panel to `panel.play("idle")` on the Hell hound sprite with a modulo-safe variant index and FRAME_W-centering offset — proven collision-neutral by a full re-run of the 8-level interactive mechanic audit (all encounters `triggered: true`, `resolved: true`) and browser-boot (all levels non-blank, in-budget).**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-11T13:28:00Z (approx)
- **Completed:** 2026-07-11T13:40:01Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- `src/levels/build.js`'s math-gate loop now emits `add([sprite("math-gate"), pos(mg.x, mg.y), "math-gate-panel"])` in place of the old `rect()+color(...LOCKED_GREY)+outline(...LOCKED_BORDER)` placeholder; the `"?"` glyph `add()` call and its insertion order relative to the panel are unchanged, so the glyph still renders on top of the new opaque sprite art.
- `src/levels/build.js`'s enemy loop now resolves the panel sprite via `CONFIG.ENEMY.SPRITES[(e.variant ?? 0) % CONFIG.ENEMY.SPRITES.length]` (safe against level descriptors still carrying `variant: 1`/`variant: 2` now that `CONFIG.ENEMY.SPRITES` is single-entry), offsets the panel's x-position by `-(CONFIG.ENEMY.FRAME_W - CONFIG.ENEMY.W) / 2` to center the wider 64px Hell hound frame over the unchanged 32px invisible blocker, and calls `panel.play("idle")` immediately after `add()` — mirroring the existing `coin.play("spin")` precedent.
- All three invisible blocker `add([rect(...), pos(...), opacity(HIDDEN), area(), body({isStatic:true}), tag])` calls (doors, math-gates, enemies) remain byte-unchanged, confirmed by a scoped `git diff` that shows edits landing only inside the panel-emission call bodies.
- `node scripts/audit-phase21-mechanics.mjs` re-run against the fully-merged tree (33-01's baked PNGs + 33-02's sprite registrations + this plan's build.js swap) exits 0 with `AUDIT: ALL MECHANICS RESOLVED` — every door/math-gate/enemy/secret-alcove encounter across all 8 levels reports `triggered: true, resolved: true`, including the enemy encounters on levels 03/06/08 whose descriptors carry `variant: 1`/`2` (proving the modulo guard works against real level data, not just the grep).
- `node scripts/browser-boot.mjs` exits 0 (`Browser boot: PASS — title -> select -> all levels loaded with no runtime errors`), confirming non-blank rendering and no object-budget/FPS regression from the wider Hell hound panel.
- `node scripts/check-assets-manifest.mjs` and `node scripts/validate-levels.mjs` both stay green (zero HARD-FAIL) after the swap.
- `bash scripts/check-gate.sh`, `bash scripts/check-safety.sh`, `bash scripts/check-import-safety.sh` all PASS — no math-gate/no-timer/a727c13 regressions introduced.

## Task Commits

Each task was committed atomically:

1. **Task 1: Swap the math-gate panel to real sprite art; wire the enemy panel's real idle anim** - `dfbe9a9` (feat)
2. **Task 2: Full interactive mechanic re-audit — prove the swap is collision-neutral** - no commit (verification-only task, no files modified per plan's own `<files>` spec)

## Files Created/Modified
- `src/levels/build.js` - math-gate panel emission swapped to `sprite("math-gate")`; enemy panel emission gains a modulo-safe `CONFIG.ENEMY.SPRITES` index, a `CONFIG.ENEMY.FRAME_W`-derived centering x-offset, and `panel.play("idle")`

## Decisions Made
- Preserved the exact insertion order (blocker -> panel -> glyph) in the math-gate loop rather than reordering anything — the new sprite has real opaque pixels across most of its footprint (unlike the old flat box), so keeping the glyph's `add()` call immediately after the panel's matters more now for correct z-order (Kaplay's default z-order is insertion order).
- No changes made to `src/mechanics/gates.js` or `src/mechanics/enemy.js` — confirmed via read-first that both only read `panelObj`/`glyphObj` off the blocker object and the `"math-gate"`/`"enemy"` tags, with zero sprite-name coupling, exactly as the plan predicted.

## Deviations from Plan

None - plan executed exactly as written. All acceptance-criteria greps, the scoped `git diff` check, and both verification commands (`audit-phase21-mechanics.mjs`, `browser-boot.mjs`) passed on the first attempt.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All five "flat-color panel" visuals the roadmap named directly (door, math-gate, enemy) are now real sprite art with proven collision-neutrality across all 8 levels.
- The remaining open item for ART-04/ART-05 full completion is the phase-level `checkpoint:human-verify` visual sign-off, owned by a later plan in this phase (per this phase's parallel_execution note — orchestrator marks ART-05 complete only after the phase verifier confirms full delivery).
- No blockers for Plan 33-05 or the phase's final verification pass.

---
*Phase: 33-player-entity-animation*
*Completed: 2026-07-11*
