# Phase 36: World Motion & Ambient Life - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning
**Mode:** Interactive discuss (user answered 4 grey-area decisions live, 2026-07-18)

<domain>
## Phase Boundary

Make the world visibly MOVE — patrolling cosmetic enemies, moving platforms, flickering ambient
life — all dt-based, telegraphed, ADHD-safe, placed on the now-dressed (Phase 35) levels behind the
mover-aware validator (Phase 30) and the LEVEL-DESIGN.md motion rules (Phase 34). Requirements:
**MOT-01, MOT-02, MOT-03, MECH-05**.

IN SCOPE: patrol() cosmetic enemies (respawn-hazard class); moving platforms (stickToPlatform carry,
dt-based sine ping-pong); ambient animation (torch flicker, goal/checkpoint unlock anims, shimmer);
the alcove-discovery persistent ambient change (MECH-05, torch lights up); the mover-aware validator
+ interactive audit staying green with motion live; a genuine human sign-off on hazard placement.

OUT OF SCOPE: mobile/touch (Phase 37); n0x logo + final closing verification (Phase 38); any GEOMETRY
change (levels are byte-frozen since Phase 34.6 — motion is placed via new descriptor fields/entities,
NOT by editing floors/platforms/coins/goal/doors/enemies/keys arrays). Math brain LOCKED. No Kaplay
upgrade, no new runtime deps.
</domain>

<decisions>
## Implementation Decisions

### Motion intensity — FULL motion (user decision)
- The world should feel genuinely dynamic: patrollers are REAL respawn-hazards (not just cosmetic)
  and moving platforms are REAL traversal, across the levels. Most dynamic / most challenge of the
  offered options.
- **BOUNDED by the standing no-punishment mandate:** "challenge/risk" here means ONLY
  checkpoint-respawn. There is NO hurt, NO score loss, NO game-over, NO timer, NO punishment wiring.
  Full motion = lots of movement + respawn-stakes, NOT a difficulty spike that frustrates.

### Placement — ALL 8 levels get gameplay movers (user decision)
- Patrollers AND moving platforms appear across all 8 levels (not just the intense evens).
- Ambient animation (torch flicker, shimmer, unlock anims) also on all 8.
- Tune density to each level's shape and the calm/intense biome-pair rhythm — the calm odd levels get
  lighter mover density than the intense evens, but none is mover-free.

### Path risk — movers MAY be on the critical path (user decision, overrides "optional-only")
- User: "Regardless of path, there should be movement and risk." Moving platforms and patrollers CAN
  sit on the main route as real traversal challenge — they are NOT restricted to optional/bonus routes.
- **HARD CONSTRAINT that survives this decision — NO SOFTLOCK.** A required moving platform must ALWAYS
  return / carry the player such that the route is completable; a patroller must never trap the player.
  The Phase-30 mover-aware validator (worst-case-extreme reachability, proven RED-first) MUST stay green
  for every placement — a required mover that could strand her is the one thing this phase cannot ship.
- **Close checkpoints near every on-path hazard** (§8.5 rule 4 fall-stakes rule) so a respawn is a
  few seconds of lost progress, never a slog. Real risk, forgiving recovery.

### Patroller contact — gentle respawn-hazard (roadmap default, user-confirmed)
- Touching a patroller = respawn at the nearby checkpoint. Same forgiving hazard class as the existing
  spikes — ZERO hurt/score/punishment wiring. Slow, heavily telegraphed (visible walk-cycle, clear
  waypoint path), visually DISTINCT from the stationary math-blocker enemies so she can read intent.

### Claude's Discretion
- Exact per-level mover counts/paths/speeds, telegraph styling, which ambient anims per biome, and the
  specific alcove ambient-change art — at Claude's discretion within the decisions above, confirmed at
  the hazard-placement human checkpoint.
</decisions>

<specifics>
## Specific Ideas

- **Motion idioms come from `spike-code/` ONLY** — web Kaplay examples use banned `wait()`/`loop()`.
  Ambient loops + platform ping-pong must be dt-based (sine easing) or `tween().onEnd()` self-clean,
  check-safety-compliant (enforced by check-safety.sh).
- Moving platforms: native `stickToPlatform` carry (source-confirmed to exist in the vendored engine),
  dt-based ping-pong with sine easing for natural endpoint slow-down (no timers).
- Patrollers: built-in `patrol()` between fixed waypoints; contact routes through the EXISTING
  respawn-hazard path (same as spikes), tagged distinctly from math-blocker enemies.
- MECH-05: discovering a secret alcove leaves a PERSISTENT, visible in-level ambient change for the
  rest of the run (e.g. a dark torch lights up) — positive-only reinforcement, wired through the
  existing secretAlcove seam (which never opens a challenge).
- A real mid/late-phase `checkpoint:human-verify` on hazard placement (standing precedent — do NOT
  rubber-stamp; SC5). Movement/risk is now on the critical path, so the human look matters more.
</specifics>

<canonical_refs>
## Canonical References

- `docs/LEVEL-DESIGN.md` — motion rules (Phase 34) + §8.5 fall-stakes/close-checkpoint rules.
- Phase 30 artifacts — the mover-aware validator + interactive audit (RED-first, MOT-04 complete).
- `spike-code/` — the ONLY sanctioned source of check-safety-compliant motion idioms.
- `.planning/research/ART-PARITY-STEERING.md` — for any new mover/patroller/ambient art (styleboard normative, pink-gate, license discipline).
- Phase 35 props layer + `CONFIG.PROPS` — ambient anims (flicker) dress the static props already placed.
</canonical_refs>
