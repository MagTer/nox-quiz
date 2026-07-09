# Phase 29: Mechanic Cleanup - Context

**Gathered:** 2026-07-09
**Status:** Ready for planning

<domain>
## Phase Boundary

The mechanics that didn't land are gone or fixed before anything gets dressed — collect-the-answer dies atomically, the affected levels get their math rhythm back, and finding a secret alcove actually feels like something. Covers MECH-01 (collect removal), MECH-02 (pacing rebalance), MECH-03 (alcove discovery feedback), MECH-06 (level-select secret marker). MECH-04 (harness coverage) and MECH-05 (persistent ambient change) are explicitly OUT — they belong to Phase 30 and Phase 36 respectively per REQUIREMENTS.md traceability.

</domain>

<decisions>
## Implementation Decisions

### Collect Removal Scope (MECH-01)
- Single atomic commit spanning `src/mechanics/collect.js` deletion, `CONFIG.COLLECT` removal, all 8 level descriptors' `collectZones`/`answerPickupSlots` arrays, and every defending harness fixture — matches MECH-01's explicit "updated atomically in one change" wording. No staged/partial commits.
- Scrub `collectZones` support from harness kind-lists in `scripts/lib/reachability.mjs`, `scripts/lib/over-hole-check.mjs`, and `scripts/lib/mechanic-drive.mjs` (including the `renderChoices:false` collect-driving branch in `mechanic-drive.mjs`) — MECH-01 explicitly lists "validator entries" and "audit expectations" as in scope.
- Leave `scripts/fixtures/bad-level.js`'s `collectZones: []` untouched — it's a validator RED-path negative fixture unrelated to the collect mechanic itself; touching it is unnecessary churn.
- Delete `check-gate.sh` assertion #13 (the collect thin-caller check) outright — do not repoint it at another mechanic; nothing else needs that assertion.
- `scripts/smoke-progress.mjs`'s golden-geometry fixtures (lines ~394, ~610, ~749 per the current tree) lose their `collectZones` entries in the same commit.

### Math Pacing Rebalance (MECH-02)
- No backfill mechanics added. Verified directly: after removing collect, levels 01/03/04/06/08 retain 5/4/6/3/4 mid-level encounters (door+mathGates+enemies) respectively, plus the end gate — comfortably clears the "≥2 mid-level + end gate" bar with zero new mechanic instances.
- Delete `answerPickupSlots` alongside `collectZones` in all 5 affected descriptors — it's collect-exclusive schema; only `build.js`'s collect-zone loop ever read it.
- "XP economy re-checked" (MECH-02) is a verification note, not a code change: door/gates/enemy/collect mechanics all award **zero** direct XP today — only the end-of-level goal gate (`game.js`'s `onReachGoal` → `progress.addXp(table)`) awards XP, once per level clear. Removing collect cannot change a level's earnable XP by construction. Document this finding in the phase SUMMARY; no XP-path code changes.
- Geometry-editing boundary is deletion-only: no repositioning of surviving mathGates/doors/enemies. Confirmed by direct position inspection that no affected level develops an awkward "dead stretch" after collect removal (removed zones sit adjacent to surviving early-level mechanics in all 5 cases). Any future geometry fix is Phase 34's (Level Quality Pass) job — CLAUDE.md's "append after existing geometry, never edit inside kid-validated levels" rule applies.

### Secret Alcove Discovery Feedback (MECH-03)
- Chime SFX: reuse `"pickup"` (`assets/sfx/pickup.ogg`, played via `audio.playSfx("pickup")`) — vacated by collect.js's deletion, closest semantic fit (a rewarding one-shot collection sound), zero new asset sourcing (asset/audio sourcing is out of scope for this phase — that's Phase 31+).
- Particle burst: reuse `fx.pop()` as-is, called at the alcove's world position — it is already a neon-green scale+fade burst; zero new FX code required.
- "+5 XP" popup: a NEW small world-space floating text — `text("+5 XP")` at the alcove position, rising + fading via a self-cleaning `tween().onEnd(destroy)` (mirrors `fx.dust()`'s rise/fade idiom and `fx.js`'s tagged-"fx" anti-leak discipline). Distinct from `hud.js`'s screen-fixed "LEVEL UP" banner — this is in-world, not HUD-docked. New tunables go in `CONFIG.FX` (no magic numbers).
- One-shot-per-run semantics: keep `secretAlcove.js`'s existing closure-local `found` Set exactly as-is (fire-once per scene instance, resets on level re-entry). This is the in-run feedback latch and is separate from MECH-06's cross-run persisted marker — do not conflate the two.
- The discovery feedback (burst + chime + popup) fires from `secretAlcove.js`'s existing `player.onCollide("secret-alcove", ...)` handler, alongside the existing `addBonusXp`/`hud.refresh()` calls — no new collision wiring needed.

### Level-Select Secret Marker & Save Version (MECH-06)
- Marker visual: a small, distinct star glyph drawn in a tile corner (not replacing the existing center-bottom "v" cleared-check glyph at `select.js:157-168`), colored `PALETTE.REWARD` (neon-green), shown only when `progress.hasSecretFound(id)` is true. Purely additive — positive-only, no "0/1" or missing-framing anywhere, per MECH-06's explicit wording.
- Save version bump: `CONFIG.SAVE.VERSION` 2 → 3. MECH-06 explicitly directs a version bump; this matches the project's hard "NO migration" convention already encoded in `progress.js`'s `loadSave()` (any version mismatch already resets to `defaults()`). This is a deliberate, acknowledged reset of existing xp/level/cleared-flags — consistent with how the v1→v2 Nox Run rebrand handled its own bump.
- Data shape: extend the existing per-level record in `progress.js`'s `levels` map — `levels[id] = { cleared: true, secretFound: true }` — reusing the exact validated-field, own-keys-only pattern `validate()`/`serialize()` already use for `cleared`. No new top-level save key.
- New `progress.js` surface: `markSecretFound(id)` (sets the flag) and `hasSecretFound(id)` (strict `=== true` read), mirroring `markCleared`/`isLevelCleared` exactly. `validate()` gains the same strict-boolean-coercion parse for `secretFound` that it already does for `cleared`.
- Wiring: thread `levelId` into `wireSecretAlcove({ player, progress, hud, levelId })` (game.js already has `level.id` in scope at the call site) and call `progress.markSecretFound(levelId)` in the same `onCollide` handler as `addBonusXp`. No new save-trigger site — the flag persists at the SAME two existing write points (level-clear, tab-hide); do not add a write-on-touch path (would violate the "save writes happen on level-clear and tab-hide only" architecture rule).

### Claude's Discretion
- Exact star-glyph character/rendering approach (e.g. `"★"` vs a small drawn shape) if the glyph renders as tofu in-engine — same TOFU_FALLBACK discipline as the existing HUD hint text; verify visually during execution.
- Exact CONFIG.FX tunable names/values for the new "+5 XP" popup's rise distance/duration (follow the DUST_RISE/DUST_MS naming convention already established).
- Whether the star glyph sits top-right, top-left, or another tile corner — pick whatever avoids collision with the existing number label (center) and cleared-check glyph (center-bottom).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `fx.pop()` (`src/fx.js`) — neon-green scale+fade marker, reusable verbatim for the alcove burst.
- `audio.playSfx("pickup")` (`src/audio.js`) — existing SFX call, reassignable to the alcove find now that collect.js (its only current caller) is deleted.
- `progress.js`'s `markCleared`/`isLevelCleared` pattern — exact template for the new `markSecretFound`/`hasSecretFound` pair (same closure-local map, same strict `=== true` semantics).
- `select.js`'s existing glyph-drawing block (lines ~156-168) — template for adding the new star glyph as a sibling `add([...])` call, same `fixed()`/`z(9001)`/"select" tag pattern.

### Established Patterns
- Self-cleaning tween idiom (`tween(...).onEnd(() => destroy(obj))`) used everywhere in `fx.js`/`hud.js` — the ONLY delayed-effect mechanism allowed (no timers, SAFE-01).
- a727c13 engine-global discipline: every Kaplay primitive referenced only inside function bodies, never at module top level — applies to any new code in `secretAlcove.js`/`select.js`.
- Anti-leak: closure-local `Set`/`let` for run/scene state, never module-level — applies to any new latch state.
- `progress.js`'s explicit-field validation (`validate()`) — copies ONLY named, range/type-checked keys, never spreads the untrusted blob (prototype-pollution mitigation) — the new `secretFound` field parse must follow this exact shape.

### Integration Points
- `game.js` (lines ~279, ~24-36 imports) — the one call site that wires `wireSecretAlcove`; needs `levelId` added to its args object.
- `src/config.js` `PROGRESS`/`COLLECT`/`SAVE` blocks (lines ~165-213) — `COLLECT` block deleted entirely; `SAVE.VERSION` bumped 2→3; new FX tunables added to the existing `FX` block.
- `scripts/check-gate.sh` assertion #13 (lines 129-133), `scripts/validate-levels.mjs`, `scripts/lib/{reachability,over-hole-check,mechanic-drive}.mjs`, `scripts/smoke-progress.mjs` — all currently reference `collectZones`/`COLLECT` and need coordinated updates in the same atomic commit.

</code_context>

<specifics>
## Specific Ideas

No specific visual/audio references beyond what's captured in Decisions above — this phase reuses existing assets/SFX rather than sourcing new ones (new asset sourcing starts in Phase 31).

</specifics>

<deferred>
## Deferred Ideas

- MECH-04 (alcove reachability validator coverage + interactive-audit trigger signal) — explicitly Phase 30 (Harness Extensions), not this phase.
- MECH-05 (persistent in-level ambient change, e.g. torch lighting up after discovery) — explicitly Phase 36 (World Motion & Ambient Life), since it depends on the art/animation groundwork from Phases 31-35.
- Any geometry repositioning beyond deletion — explicitly Phase 34 (Level Quality Pass).

</deferred>
