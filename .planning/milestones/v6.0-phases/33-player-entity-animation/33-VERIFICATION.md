---
phase: 33-player-entity-animation
verified: 2026-07-14T11:20:00Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
warnings:
  - id: W-1
    concern: "SC2's named durable evidence artifact (4 feet-on-ground `?debug=1` collider screenshots — flat floor, 1-tile platform, lowest ceiling, door) was never committed. The check WAS performed live by the human (33-05-PLAN task step 4 presented exactly those 4 spots), but left no artifact. The underlying truth is independently proven by git-diff (see Truth 2 evidence), which is stronger evidence than a screenshot — so this is an evidence-durability gap, not a goal gap."
    recommendation: "Either capture the 4 shots retroactively into 33-player-entity-animation/, or record an explicit waiver noting the diff-proof supersedes them."
  - id: W-2
    concern: "Cross-phase: 2 of the 3 defects the human rejection surfaced (27bbeb4 terrain sawtooth, f7bfc73 grey-static terrain) are Phase-32 / ART-02 surface area, not Phase 33's. Phase 32 was closed with all 9 gates green while shipping sawtoothed, grey-static ground. This does NOT undermine Phase 33's goal (see Orthogonality Assessment), but it means Phase 32's VERIFICATION is a stale false-pass."
    recommendation: "Re-open/annotate Phase 32's verification record, and treat 33-05-SUMMARY's warning as binding for Phase 35: do not assume the art pipeline is sound because gates are green. Build the recommended check-biome-coverage.mjs pixel gate."
deferred:
  - truth: "Unreachable coins reported at the Phase 33 human-verify checkpoint"
    addressed_in: "Phase 34"
    evidence: "Roadmap Phase 34 (Level Quality Pass) — 'Levels 5-8 reachability fixed'; requirement LVL-01. Correctly not fixed ad hoc in Phase 33."
---

# Phase 33: Player & Entity Animation — Verification Report

**Phase Goal:** The avatar and every mechanic entity look alive at SNES fidelity while physics stay byte-identical to the kid-validated feel
**Requirements:** ART-04, ART-05
**Verified:** 2026-07-14
**Status:** passed (4/4, with 2 warnings — neither blocking)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Player fully animated — distinct idle, run (4+ frames), jump, fall, land — under a NEW human sign-off superseding the v4.1 lock | VERIFIED | `src/main.js:65-77` registers all 5 named anims. `run: {from:2,to:7}` = **6 frames** (≥4 required). `src/player.js:135-149` emits all 5 targets. Sign-off genuine (see Human Sign-off Integrity below). Caveat noted. |
| 2 | Jump feel unchanged: collider stays exactly 16×32 via explicit `area({shape})` | VERIFIED | `src/player.js:30`: `area({ shape: new Rect(vec2(0), 16, 32) })`. **Byte-identical proof:** old `assets/player.png` was 80×32 = 5 frames × **16×32**, so the old bare `area()` derived exactly 16×32. New explicit shape = 16×32. Zero movement-physics tunable changed (config diff touches only anim fps + Phase-32 terrain/parallax). |
| 3 | Doors, checkpoint gates, enemy blockers, math gate show real animated art — invisible blocker colliders untouched | VERIFIED | `build.js:246` door sprite, `:270` `sprite("math-gate")` (replacing `rect+color+outline`), `:308-313` hellhound panel + `play("idle")`. **Blockers proven byte-unchanged by git diff** — the `rect()+area()+body({isStatic:true})` hunks are absent from the diff entirely. |
| 4 | Full interactive mechanic audit still triggers every encounter across all 8 levels — collision-neutral, proven not assumed | VERIFIED | **Re-run by verifier, not trusted from SUMMARY:** `node scripts/audit-phase21-mechanics.mjs` → exit 0. `"triggered": true` × **24**, `"triggered": false` × **0**, `"resolved": true` × **24**, `"resolved": false` × **0**, across **8** distinct levels. |

**Score: 4/4 truths verified.**

### The Load-Bearing Physics-Invariance Proof (Truth 2 + 3)

The phase's central claim is "physics byte-identical." I verified this by diffing against the pre-Phase-33 baseline (`af4183e`, the commit before the first Phase-33 code commit), not by reading SUMMARYs.

**`src/player.js` diff — entire physics surface:**
```
-    area(), // collider matches the 16x32 sprite footprint
+    area({ shape: new Rect(vec2(0), 16, 32) }), // collider explicitly locked to 16x32 (ART-04)
```
That is the *only* physics-touching line changed. `body({ maxVelocity: CONFIG.MAX_FALL_SPEED })`, `JUMP_FORCE`, `JUMP_CUT`, `COYOTE_MS`, `BUFFER_MS`, `GRAVITY`, `RUN_SPEED` — all untouched. Everything else added is the closure-local `wasFalling`/`landHold` anim-state pair, which never writes to `vel` or `pos`.

**Is the new collider *equal* to the old one?** Yes, and this is the non-obvious part the SUMMARY does not spell out. The old sprite `assets/player.png` was **80×32 with `sliceX: 5`** → a 16×32 frame. Kaplay's bare `area()` derives the collider from the frame footprint, so the old collider was already exactly 16×32. The new sheet `player-swamphunter.png` is **192×32 with `sliceX: 12`** → also 16×32 per frame. So the collider is byte-identical both before *and* after the lock. The explicit `Rect` is a genuine future-proofing guarantee (it makes the hitbox independent of any later, visually taller sheet) rather than a corrective — the physics never had a chance to drift. That is the strongest possible outcome for "byte-identical feel."

**`src/levels/build.js` diff — blocker colliders:** the diff contains *only* the two cosmetic panel `add()` calls (math-gate `rect+color+outline` → `sprite`, enemy panel offset + `play("idle")`). The tall invisible blockers for door, math-gate, and enemy — the `rect(W, blockerH) + area() + body({isStatic:true})` entities that actually do the physics — do not appear in the diff at all. **Blocker colliders are literally byte-unchanged**, exactly as claimed.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `assets/player-swamphunter.png` | 12-frame 16×32 sheet | VERIFIED | 192×32 RGBA = 12 × 16×32 |
| `assets/enemy-hellhound.png` | 6-frame idle sheet | VERIFIED | 384×32 RGBA = 6 × 64×32; matches `ENEMY.FRAME_W: 64` |
| `assets/door.png` | rebaked native color, 32×64 | VERIFIED | 32×64 RGBA; CREDITS.md attributes castle-interior crop |
| `assets/math-gate.png` | new, 32×64 | VERIFIED | 32×64 RGBA; CREDITS.md attributes Gothicvania Church crop |
| `src/player.js` | 16×32 lock + 5-state machine | VERIFIED | Lines 30, 65-66, 114-155 |
| `src/main.js` | 5 anims + hellhound + math-gate loads | VERIFIED | Lines 65-77, 117-124 |
| `src/config.js` | fall/land + enemy tunables | VERIFIED | Lines 85-92, 187-193 |
| `src/levels/build.js` | real math-gate/enemy emission | VERIFIED | Lines 246, 270, 308-313 |
| `src/assets-manifest.js` | mirrors every loadSprite path | VERIFIED | Rows 48/49/52/54; enemy-1/2/3 rows removed |
| `assets/enemy-{1,2,3}.png` | RETIRED | VERIFIED | Absent from disk; only `enemy-hellhound.png` remains |

### Key Link Verification

| From | To | Via | Status |
|------|-----|-----|--------|
| `player.js` `play(target)` | `main.js` anims map | Names idle/run/jump/fall/land match exactly — no orphan target | WIRED |
| `build.js` `sprite("math-gate")` | `main.js` `loadSprite("math-gate")` | Key match; PNG on disk | WIRED |
| `build.js` `CONFIG.ENEMY.SPRITES[…]` | `main.js` `loadSprite("enemy-hellhound")` | `SPRITES[0] === "enemy-hellhound"` | WIRED |
| `build.js` `panel.play("idle")` | hellhound `anims.idle` (0→5, loop) | Registered in main.js:122 | WIRED |
| Level descriptors `variant: 0/1/2` | single-entry `SPRITES` | `% CONFIG.ENEMY.SPRITES.length` modulo guard → index 0 | WIRED (crash averted — an unguarded lookup would have hit `sprite(undefined)` on levels 03/05/06/08) |
| `assets-manifest.js` | every phase-33 loadSprite path | `check-assets-manifest.mjs` → 37 assets, 0 MISSING | WIRED |

### Gate Suite — Re-run by Verifier (not trusted from SUMMARY)

| Gate | Result |
|------|--------|
| `check-gate.sh` | PASS (exit 0) |
| `check-safety.sh` | PASS (exit 0) |
| `check-import-safety.sh` | PASS (exit 0) |
| `check-progress.sh` | PASS (exit 0) |
| `check-pink-gate.sh` | PASS (exit 0) |
| `validate-levels.mjs` | PASS (exit 0) |
| `check-assets-manifest.mjs` | PASS — 37 assets, 0 MISSING |
| `browser-boot.mjs` | PASS — title → select → all 8 levels, no runtime errors |
| `audit-phase21-mechanics.mjs` | PASS — **24/24 triggered AND resolved**, 8 levels |

All 9 gates independently reproduced green. The SUMMARY's claims are accurate.

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| ART-04 | Player fully animated on a locked collider | SATISFIED | Truths 1 + 2; collider diff-proven 16×32 |
| ART-05 | Real animated art for door / checkpoint gate / enemy blocker / math gate | SATISFIED | Truths 3 + 4; blockers diff-proven byte-unchanged |

No orphaned requirements — REQUIREMENTS.md maps only ART-04/ART-05 to Phase 33, both claimed and both delivered.

### Anti-Patterns Found

None. Scanned `player.js`, `main.js`, `config.js`, `build.js`, `assets-manifest.js` for TODO/FIXME/XXX/TBD/HACK/PLACEHOLDER/stub-return patterns — **zero hits**. No debt markers introduced by this phase.

## Human Sign-off Integrity (SC1's designated arbiter)

This is the criterion most at risk of a rubber-stamp, so I checked it adversarially. It holds:

- The project config carries `auto_advance: true` / `mode: yolo`, which *would* normally auto-approve a `checkpoint:human-verify`. It was deliberately overridden.
- The gate was genuinely presented. The human **REJECTED it twice** with substantive, specific, technical objections that no LLM would author on its own behalf ("the floor / platform/ledges … have sort of a saw pattern"; "swamp has no improvement at all").
- The rejections **found 3 real defects that all 9 green gates missed** — the single strongest possible falsification of a rubber-stamp hypothesis. A rubber-stamped gate does not produce commits `27bbeb4`, `44f773f`, `f7bfc73`.
- Approval is quoted verbatim: *"approved, continue with phase 34"*.

The `44f773f` fix (hound idle 8fps → 5fps) is squarely Phase 33's own surface (ART-05), traceable to config.js:190 whose comment records the rejection reason. Verdict: **the sign-off is genuine and supersedes the v4.1 player-art lock.**

## Orthogonality Assessment — do the Phase-32 terrain fixes undermine Phase 33?

**No.** Assessed explicitly because it was raised as a concern.

Commits `27bbeb4` and `f7bfc73` are labelled `fix(32)` and touch `scripts/build-art-assets.py` (terrain bake), the four `assets/tiles/atlas-*.png`, and terrain config. They touch **none** of Phase 33's goal surface: not `player.js`, not the collider, not the entity emission in `build.js`, not any blocker. Phase 33's four success criteria are all about the *avatar and mechanic entities*; terrain is ART-02 / Phase 32.

So Phase 33's goal claim stands on its own evidence. What the episode actually proves is the *opposite* of a Phase-33 weakness: Phase 33's human gate was the mechanism that **caught a Phase-32 false pass**. The honest finding is therefore recorded as W-2 against **Phase 32**, not Phase 33 — Phase 32 shipped grey-static, sawtoothed ground with all nine gates green, meaning its verification record is stale. Phase 35 must not inherit the assumption that green gates imply sound art.

## Notes (INFO — no action required)

1. **`land` shares `fall`'s frame 11.** `main.js:75` registers `land: {from: 11, to: 11}` — the last fall frame, held 120ms. So `land` is a distinct *state* (non-looping, hold-gated, genuinely transition-triggered) but not a distinct *pose*. The bake has no dedicated land frames and the phase was scoped "wiring only" (33-RESEARCH Pitfall 2), which the plan documented openly rather than hiding. SC1 says "distinct … states", and its designated arbiter — the human, who was explicitly asked in 33-05-PLAN step 3 to confirm all five "read as visually distinct" — approved. Counted VERIFIED, but recorded here so it is never mistaken for dedicated land art.
2. **The `land` transition detector is correct.** It is gated on a `wasFalling` edge, deliberately *not* on `player.onGround()` — which fires on every grounded contact across adjacent floor colliders and would starve the `run` anim during ordinary walking. This is the same trap that got land SFX removed in Phase 27; the code avoids it by construction (`player.js:127-133`).
3. **Minor comment drift:** `config.js:89` calls `PLAYER_JUMP_SPEED` a "single-frame jump anim", but `main.js:70` registers `jump: {from: 8, to: 9}` — two frames. Behaviorally harmless (1fps non-looping over a sub-second rise means frame 8 dominates). Cosmetic only.
4. **Dead code, not dead assets:** the old enemy-1/2/3 bake body still sits in `build-art-assets.py`, but it is **not** wired into `__main__` (which calls only `build_door`, `build_math_gate`, `build_player_swamphunter`, `build_enemy_hellhound`). The PNGs are gone, CREDITS.md is corrected, and the manifest gate is green. No regeneration risk.
5. **Level descriptors still carry `variant: 0/1/2`.** Harmless — the modulo guard in `build.js:309` maps every value to index 0. Correctly left untouched rather than editing kid-validated level data for a cosmetic reason.

## Gaps Summary

**None blocking.** All four ROADMAP success criteria are achieved in the codebase, verified against real code and independently re-run gates rather than SUMMARY claims. The phase's hardest claim — "physics byte-identical" — is not merely asserted but *provable from the diff*: the collider was 16×32 before and is explicitly 16×32 now, no movement tunable moved, and every invisible blocker collider is absent from the diff.

Two warnings are recorded for follow-up, neither of which blocks Phase 34:
- **W-1** — SC2's four named `?debug=1` screenshots were never committed as durable artifacts. The check was performed live and the underlying truth is diff-proven, so this is a documentation gap, not a goal gap.
- **W-2** — the terrain defects fixed during this phase's checkpoint belong to Phase 32, whose verification is now a known false pass. This is a *finding about Phase 32*, surfaced by Phase 33's gate working correctly.

**Phase goal achieved. Ready to proceed to Phase 34.**

---

_Verified: 2026-07-14_
_Verifier: Claude (gsd-verifier) — goal-backward, adversarial stance_
