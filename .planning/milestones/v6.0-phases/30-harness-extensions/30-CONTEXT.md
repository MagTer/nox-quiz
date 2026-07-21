# Phase 30: Harness Extensions - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning

<domain>
## Phase Boundary

The verification harness can genuinely see every new v6.0 dynamic before any level ships one — alcoves become fully covered (validator + interactive audit), and the validator stops being blind to movers a full phase-boundary before Phase 36 places any. Covers MECH-04 (alcove reachability + trigger coverage) and MOT-04 (mover worst-case-extreme reachability rule, RED-first). No real level content changes, no player-visible behavior changes — this is pure verification-harness engineering. LVL-03's motion-authoring-rules writing is explicitly OUT (that's Phase 34, per REQUIREMENTS.md traceability).

</domain>

<decisions>
## Implementation Decisions

### Alcove Validator Coverage — Point-vs-Jump-Reach (MECH-04, static half)
- Model each `geometry.secretAlcove` entry as a zero-width point (not a floor-anchored footprint like doors/mathGates/enemies — alcoves float, per the shipped `~70px above a platform` placement convention in `docs/LEVEL-DESIGN.md`). Test reachability via the existing `canReach()` from every node already in the spawn-reachable set (`bfsWithPathMargin` output), mirroring the mechanic-reachability check's structure in `scripts/lib/reachability.mjs` but point-based rather than footprint-based.
- Severity: HARD-FAIL for an unreachable alcove — matches this project's exact-fact HARD-FAIL convention for any unreachable entity (bonus or required), and matches the roadmap's literal "provably catches" wording for Phase 30's first success criterion. Do NOT use WARN tier (WARN never fails; would not satisfy the RED-first proof requirement).
- RED-first fixture: extend `scripts/fixtures/bad-level.js` with a third independently-provable defect — a `secretAlcove` entry placed unconditionally out of jump range — following the file's existing "(a)/(b)" labeled-defect header convention (this becomes defect "(c)"). Do not create a separate fixture file for this.
- Reachability tolerance: reuse `canReach`/`jumpReach`/`WARN_MARGIN_RATIO` completely unmodified — no bespoke tolerance constant for alcoves. The shipped `~70px` placement convention already sits comfortably inside the calibrated envelope's `maxRise` (~88px per `JUMP_ENVELOPE`), so real alcoves across all 8 levels should PASS or at most WARN under the existing tiering with zero special-casing.
- `validate-levels.mjs`'s per-descriptor loop gains a new alcove-reachability sub-report line (mirrors the existing `over-hole`/`spawn-goal`/`gap-width`/`mechanic-reachability` row format: `{id} | secret-alcove-reachability | {status} | {descriptor}`).

### Alcove Interactive-Audit Coverage — Entity-Destroy/XP-Delta Signal (MECH-04, dynamic half)
- Extend `deriveEncounters()` in `scripts/lib/mechanic-drive.mjs` to also emit alcove encounters from `geometry.secretAlcove`, driven by the SAME `driveToXClimbing`/`driveToXPlanned` navigation helpers already used for platform/mechanic approach — real player-equivalent movement, not a teleport, is the proof of reachability (per this project's "checks that don't play the game lie" standard).
- Signal definitions (both required for a `resolved: true` row):
  - **triggered** = the player's bounding box overlapped the alcove trigger volume (position/overlap check against the alcove entity, analogous to how `triggered` is already detected for door/mathGate/enemy encounters).
  - **resolved** = the alcove entity was destroyed (`get("secret-alcove")` no longer contains it) AND the XP delta matches the expected value: `CONFIG.PROGRESS.XP_ALCOVE` on first touch this audit run, or `0` if `hasSecretFound` was already true (Phase 29's CR-01 anti-farming guard legitimately zeroes the award on replay — the audit must not fight this).
  - **NEVER** use `get("challenge").length` / the challenge-open signal as any part of alcove trigger/resolve detection — it is contractually always false for alcoves (secretAlcove.js never opens a challenge, by design), and using it would silently mark every alcove `resolved: false` forever, defeating this entire phase.
- Entity-destroy is the primary/required signal (fires unconditionally on touch, regardless of farming-guard state); XP-delta is a secondary corroborating check evaluated only on the first touch of a given alcove within one audit run. This ordering avoids a false-negative if the audit driver ever touches the same alcove twice in a single session.
- Assume `geometry.secretAlcove` is a 1-element array per level (matches the shipped "exactly one per level" rule in `docs/LEVEL-DESIGN.md` section 6), but iterate over the array generically — do not hardcode `[0]` — matching this harness's existing defensive-but-not-overbuilt `?? []`-guard posture throughout.

### Mover Reachability — Worst-Case-Extreme Rule (MOT-04)
- New minimal, forward-compatible geometry schema: `geometry.movers: [{ x1, y1, x2, y2 }]` — two fixed ping-pong endpoints. This is the smallest schema sufficient to prove the worst-case-extreme reachability rule now, without guessing at Phase 36's final visual/animation fields (sprite, ease type, speed, `stickToPlatform` wiring) — those are legitimately Phase 36's design call, not Phase 30's.
- "Worst-case-extreme" means: test reachability treating the mover as available at EITHER endpoint independently (both `(x1,y1)` and `(x2,y2)` as candidate landing/takeoff points via the same point-based `canReach` mechanism used for alcoves), then report the WORSE (lower marginRatio, more likely to fail) of the two results. This models a player arriving exactly when the platform is at its least helpful position. Checking only the two endpoints is sufficient and correct because the ping-pong motion travels a straight-line path between two fixed waypoints (MOT-02's sine easing affects only timing/velocity, never the geometric path) — the endpoints are the true geometric extremes; no continuous-position sweep is needed.
- RED-first fixture: a NEW dedicated fixture file (e.g. `scripts/fixtures/bad-level-mover.js`, not an extension of `bad-level.js`) with a mover whose near-endpoint is trivially in reach but whose far-endpoint sits just beyond the calibrated envelope — proving the validator HARD-FAILs under the worst-case rule even though a naive single-position (best-case) check would incorrectly PASS. This is a materially different code path (multi-position evaluation) from `bad-level.js`'s existing single-position defects and deserves its own fixture per that file's own "each defect independently provable" discipline.
- Zero real levels carry `geometry.movers` today (Phase 36 places the first ones) — the new mover-reachability code path must be `?? []`-guarded exactly like every other optional geometry array in this harness. Running `validate-levels.mjs` against all 8 shipped levels must produce zero new rows for this check (nothing to report on an empty array), which is how Phase 30's fourth success criterion ("full existing gate suite stays green... without false HARD-FAILs on shipped content") is satisfied — trivially, not via special-casing.

### Documentation & Scope Boundaries
- Update `docs/LEVEL-DESIGN.md` section 6 ("Secret alcove"): remove the now-false line "The validator/audit deliberately do NOT check alcoves — verify reachability by playing with `?debug=1`" and replace with a pointer to the new validator (`node scripts/validate-levels.mjs`) and audit (`node scripts/audit-phase21-mechanics.mjs`) coverage. `?debug=1` playtesting remains valid as a supplementary manual-eyeball step, just no longer the ONLY verification path.
- While in that section of the doc, also fix the adjacent stale "collectZone" references in section 4 (lines ~43-44, e.g. "every door/mathGate/enemy/collectZone must be reachable" and "Collect zones: keep ONE per level...") left over from Phase 29's mechanic removal — small, directly-adjacent cleanup, not a separate initiative.
- Do NOT write new motion-authoring rules (checkpoint-before-every-mover, missed-platform-means-wait-not-death) into `LEVEL-DESIGN.md` in this phase — `LVL-03` is explicitly mapped to Phase 34 in `REQUIREMENTS.md`'s traceability table, not Phase 30. This phase builds the validator MACHINERY that will eventually enforce those rules; Phase 34 writes the AUTHORING guidance for how to use it against real content.
- Verification split: `scripts/lib/reachability.mjs`, `scripts/lib/over-hole-check.mjs`, and `scripts/validate-levels.mjs` changes stay pure-Node / no-browser (matches this module family's existing documented design — "DELIBERATELY standalone... never launches a browser"). `scripts/lib/mechanic-drive.mjs` and `scripts/audit-phase21-mechanics.mjs` changes DO require an actual `node scripts/audit-phase21-mechanics.mjs` browser-driven run as real interactive proof for the dynamic (MECH-04 audit) half specifically — the static/dynamic split in verification approach mirrors the static/dynamic split in the two MECH-04 success criteria themselves.

### Claude's Discretion
- Exact descriptor-string wording for the new `secret-alcove-reachability` and mover-reachability validator report rows (follow the existing `{id} | {check} | {status} | {descriptor}` format precedent).
- Exact variable/function names for the new alcove-node and mover-node helpers in `reachability.mjs` (follow existing naming conventions like `buildNodes`, `nodeContaining`, `canReach`).
- Whether the new `bad-level-mover.js` fixture also needs a companion "good" mover fixture proving a reachable-at-both-endpoints case passes cleanly, beyond what real levels (which have zero movers) can demonstrate — use judgment; the RED-first proof is the hard requirement, a GREEN companion fixture is a nice-to-have if it's cheap.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/lib/reachability.mjs`'s `canReach()`, `jumpReach()`, `bfsWithPathMargin()`, `nodeContaining()` — the exact machinery to reuse (not reimplement) for both the alcove point-check and the mover worst-case-extreme check.
- `scripts/fixtures/bad-level.js` — the established RED-first fixture pattern and header-comment convention (labeled, independently-provable defects) to extend for the alcove defect.
- `scripts/lib/mechanic-drive.mjs`'s `driveToXClimbing`/`driveToXPlanned` navigation helpers — reusable for alcove approach without new navigation code.
- `scripts/audit-phase21-mechanics.mjs`'s existing `{triggered, resolved, attempts}` result-row contract — the alcove signal detection slots into this same shape, just with different underlying detection logic (destroy+XP-delta instead of challenge-open).

### Established Patterns
- `?? []`-guarded optional geometry arrays everywhere in this harness — the "never brick" convention (T-23-02) — applies to both `geometry.secretAlcove` and the new `geometry.movers`.
- Self-test-on-direct-execution idiom (`isMain` check + `check(cond, msg)` + `process.exit(1)` on failure) in every `scripts/lib/*.mjs` module — the new alcove/mover check functions need the same self-test block appended.
- Two-tier HARD-FAIL/WARN output convention (`validate-levels.mjs`'s header comment, 23-CONTEXT.md-locked) — HARD-FAIL always increments the failures counter, WARN never does.

### Integration Points
- `scripts/validate-levels.mjs`'s `main()` loop (lines 63-81) — where the new alcove-reachability and mover-reachability check calls get wired in, alongside the existing `findOverHoleBarriers`/`checkLevelReachability` calls.
- `scripts/lib/mechanic-drive.mjs`'s `deriveEncounters()` — where the new alcove-encounter emission is added, alongside the existing door/mathGate/enemy emission (collectZone emission was removed in Phase 29).
- `docs/LEVEL-DESIGN.md` sections 4 and 6 — the doc-of-record needing the coverage-status update and the adjacent stale-reference cleanup.

</code_context>

<specifics>
## Specific Ideas

No specific visual/audio references — this phase has no player-visible surface. All decisions above are concrete enough to implement directly (schema shapes, signal definitions, fixture strategy, doc edits).

</specifics>

<deferred>
## Deferred Ideas

- LVL-03 (motion-authoring rules written into LEVEL-DESIGN.md) — explicitly Phase 34 (Level Quality Pass), not this phase.
- Actually placing any real mover in a real level — explicitly Phase 36 (World Motion & Ambient Life); this phase only proves the validator CAN catch a bad one.
- Any visual/animation design for movers (sprite, easing curve specifics, `stickToPlatform` wiring) — Phase 36's call, not constrained by this phase's minimal `{x1,y1,x2,y2}` schema.

</deferred>
