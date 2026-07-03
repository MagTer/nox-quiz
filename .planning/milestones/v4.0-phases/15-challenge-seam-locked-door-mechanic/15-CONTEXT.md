# Phase 15: Challenge Seam + Locked-Door Mechanic - Context

**Gathered:** 2026-07-02
**Status:** Ready for planning
**Mode:** smart discuss (autonomous — grey-area tables accepted as recommended)

<domain>
## Phase Boundary

Extract the SINGLE shared in-world challenge component (`ui/challenge.js`) from
`mathGate.js` with byte-for-byte end-of-level behavior preserved, then prove the
seam works for a SECOND caller: a locked-door/key mechanic mid-level. In scope:
MECH-01 (shared component, `mathGate.js` becomes a thin caller), MECH-02 (door
opens on correct answer, never punishes a wrong pick, never locks her out), the
overlay's pause/input/z-order contract re-confirmed for a mid-level hazard-adjacent
placement, and `check-gate.sh` re-pointed at `challenge.js`.

Out of scope (later phases): the remaining three mechanics — defeat-enemy,
multiple gates, collect-the-answer (Phase 16, MECH-03/04/05); the per-level
difficulty ramp (Phase 16, LVL-03); full level authoring / door placement across
all 3-5 levels (Phase 17); real door/key art (Phase 18 — this phase ships a
dark-grunge placeholder only, same policy as Phase 14's title/select screens).
</domain>

<decisions>
## Implementation Decisions

### Seam Extraction & Wiring
- `ui/challenge.js` exposes the shared component with a neutral `onSuccess`
  callback (renamed from `mathGate.js`'s `onClear` — a door doesn't "clear a
  level"). `mathGate.js` becomes a thin wrapper: it calls `challenge.js` and maps
  its own `onClear` param to the shared `onSuccess`, so the existing end-of-level
  call sites in `game.js` need NO changes (MECH-01's "behaves identically").
- Door-specific entity/collision/challenge-invocation code lives in a NEW
  `src/mechanics/door.js` module — establishes the `mechanics/` directory pattern
  Phase 16's MECH-03/04/05 (defeat-enemy, multiple gates, collect-the-answer) will
  reuse, keeping `game.js` from growing unbounded as mechanics accumulate.
- `scripts/check-gate.sh` KEEPS its filename (minimize churn) but its
  target/grep scope is re-pointed at `challenge.js`, with `mathGate.js` and
  `door.js` sanity-checked as thin callers of the one-way ui→brain firewall.
- `challenge.js` accepts an OPTIONAL prompt/framing override now (not hardcoded
  "answer this" text) — Phase 16's other mechanics (collect-the-answer,
  defeat-enemy) will want custom framing and this avoids re-touching the seam
  again next phase.

### Locked-Door Visual, Collision & Trigger
- Visual: a solid rect (dark-grunge palette) with an "X" lock glyph overlay —
  mirrors the EXACT visual language already established on the select screen's
  locked tiles (Phase 14) so the "locked" meaning reads consistently across the
  whole game. No sprite exists yet; Phase 18 skins it for real.
- Collision: a solid `body()` blocking collider while locked (the player
  physically cannot pass) — destroyed (collider + visual removed) on a correct
  answer, satisfying MECH-02's "opens it and clears the path to the next
  section."
- Trigger: `onCollide`-touch on the door tag opens the challenge automatically —
  matches the existing goal/coin/spike pattern exactly, zero new controls to
  teach a 12-year-old (no dedicated "interact" key).
- Placement: ONE proof door is added into level-01's existing geometry this
  phase, mid-level, positioned so the mandatory real-browser boot can confirm
  MECH-02 end-to-end (blocked → open → path clear) and the overlay's pause/z-order
  behavior next to a hazard (per success criterion #3). Phase 17 designs full
  door placement across all 3-5 authored levels — this is proof-of-seam only, not
  final level design.

### Feedback & Persistence
- Door-open reuses `fx.clearBurst()` as-is (JUICE-03 precedent) — no new
  door-specific effect this phase, keeps the "correct answer" feel consistent
  across every mechanic.
- Door removal is an instant destroy (matches the existing goal/spike/coin
  precedent) — no slide/fade transition.
- Once opened, the door stays open for the REST of the current level session
  (closure-local `doorOpened`-style flag on the scene, same anti-leak discipline
  as `coinsCollected`/`goalReached` — never a module-level `let`, never persisted
  to the save). Respawning at a checkpoint after opening the door must NEVER
  force a re-answer — that would be a punishment construct and violate the
  forgiving/no-punishment mandate (SAFE-01/GATE-04 lineage).

### Claude's Discretion
- Exact door dimensions/placement coordinates within level-01's geometry (within
  the "next to a hazard, mid-level" constraint from success criterion #3); exact
  `door.js` internal API shape beyond the locked contract above; exact CONFIG.DOOR
  tuning constants (color values, glyph size) — mirror `CONFIG.GATE`/`CONFIG.SELECT`
  conventions; whether `challenge.js`'s prompt override is a string or a richer
  options object (keep it minimal — Phase 16 can extend, not redesign).
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/ui/mathGate.js` — the CURRENT full implementation to extract FROM. Owns:
  in-world fixed()/z(9999+) overlay construction, dim backdrop, panel, question
  text, N answer boxes (mouse `box.onClick()` + `area()`, keyboard number-keys
  1-4, both calling the same `choose(i)` path), fire-once `cleared` latch, forgiving
  wrong-answer nudge (red tint + `shake(6)`, same question stays), correct-answer
  teardown (`close()` cancels key controllers + `destroyAll("math-gate")`) then a
  PERSISTENT "gate-cleared"-tagged celebration. The one-way `gate -> brain` import
  contract (GATE-06) and the anti-leak key-controller-cancel pattern are the two
  hardest-won invariants to preserve verbatim in the extraction.
- `src/scenes/game.js` — `onReachGoal()` (fire-once latch, `player.paused = true`,
  `openMathGate({brain, onClear})` call site) is the template for `door.js`'s
  collision handler; the SAME player-freeze + one bridge-call pattern applies to
  the door, just triggered by a door collider instead of the goal. The recently
  fixed `clearTransitionTween`/`onSceneLeave` anti-leak pattern (this session) is
  the reference for any door-side tween/controller that must not outlive scene
  teardown.
- `src/levels/build.js` + `src/levels/level-01.js` — the parameterized builder +
  data-driven level pattern (checkpoints/coins/spikes arrays consumed by
  `buildLevel(level)`) is the template for adding a `doors` array to the level data
  shape and having `buildLevel` instantiate tagged door entities from it.
- `src/config.js` — `CONFIG.GATE` (dim opacity, panel size) and `CONFIG.SELECT`
  (tile states/colors, including `LOCKED_GREY`/`LOCKED_BORDER`) are the direct
  precedent for a new `CONFIG.DOOR` block reusing the same locked-tile color
  language.
- `src/fx.js` — `clearBurst()` (JUICE-03, `CONFIG.FX.BURST_MS` non-strobing cap,
  tween().onEnd self-clean) is called as-is on door-open, no new fx function.
- `scripts/check-gate.sh` — the existing structural firewall gate (one-way
  ui→brain, no-DOM/no-timer/no-scenes) to re-point at `challenge.js`.

### Established Patterns
- Per-mechanic collision handler: fire-once latch (closure-local `let`) + player
  freeze + single bridge call into the shared challenge component + one clean
  correct-answer teardown path. `door.js` follows this exactly, mirroring
  `onReachGoal()`.
- a727c13: engine globals only inside scene/mechanic-body functions; `door.js`
  and `challenge.js` follow the same discipline as every other Phase 13/14 module.
- Anti-leak: any tween/controller the door mechanic creates must be captured and
  cancelled via `onSceneLeave` — the exact pattern just re-confirmed live in this
  session's Phase 14 celebration-timing fix (`clearTransitionTween`).
- Validation for this no-test-framework game: `node --check` + `check-gate.sh` +
  `check-safety.sh` + `check-import-safety.sh` + a MANDATORY real browser boot
  (door blocked → answer → door opens → path clear; verified next to the hazard
  per success criterion #3).

### Integration Points
- `game.js` end-of-level call site (`openMathGate({brain, onClear})`) stays
  UNCHANGED after extraction — `mathGate.js`'s thin-wrapper contract absorbs the
  seam change, proving MECH-01's "behaves identically."
- `levels/build.js` gains a `doors` array consumer, instantiating tagged door
  entities the same way it already does for checkpoints/coins/spikes.
- `door.js` imports `challenge.js` directly (one-way, same GATE-06 discipline) —
  it does NOT go through `mathGate.js`, which stays end-of-level-specific.
</code_context>

<specifics>
## Specific Ideas
- The whole point of this phase is proving the seam generalizes to a SECOND
  caller without behavior drift on the FIRST — the real-browser boot must
  explicitly re-confirm the existing end-of-level gate still works identically,
  not just that the new door works.
- ADHD-safe: the door mechanic inherits every forgiving/no-timer guarantee from
  the shared component automatically — no new punishment surface, no new timer,
  no new lockout.
</specifics>

<deferred>
## Deferred Ideas
- Defeat-enemy, multiple gates, collect-the-answer mechanics (Phase 16,
  MECH-03/04/05).
- Per-level difficulty ramp via allowed-tables pool (Phase 16, LVL-03).
- Full door placement across all 3-5 authored levels (Phase 17) — this phase
  places exactly one proof door in level-01.
- Real door/key art, animation (Phase 18).
</deferred>
