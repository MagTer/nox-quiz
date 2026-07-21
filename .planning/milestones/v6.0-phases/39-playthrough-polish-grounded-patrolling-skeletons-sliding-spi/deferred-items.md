# Phase 39 — Deferred / out-of-scope observations

## From 39-02 (POL-05 lantern re-bake)

- **`scripts/build-art-assets.py` regenerates `assets/logo-badge.png` on a full run**
  with different bytes (3186 → 4878) than the committed Phase-38 BRAND-01 signed-off
  version. Running the monolithic bake for the swamp-lantern therefore also re-diffs the
  logo badge. Reverted `assets/logo-badge.png` to HEAD after the bake so 39-02 stays
  scoped to the lantern. Root cause NOT investigated (out of scope for POL-05) — the
  committed badge may have been hand-tuned after baking, or the badge bake is
  non-deterministic. Flag for a future prop/logo-pipeline pass.

## From 39-03 (POL-03 harness ride wiring — Task 2 verification)

- **`audit-phase21-mechanics.mjs` reports `triggered:false` for 5 of 8 shipped-level movers
  (L1 x3420, L3 x7240, L4 x4500, L7 x4490, L8 x6560) under THIS runtime (node v24.18.0).**
  L2/L5/L6 movers and every patroller/door/enemy/alcove trigger+resolve cleanly. The
  assertive `scripts/audit-motion-fixture.mjs` gate ALSO under-triggers here — including its
  injected *patroller* (which passes on every shipped level), which is the tell that this is
  a **headless mount/carry TIMING sensitivity in this runtime**, not a code defect.
  - **Not caused by 39-03:** this plan's only edit is `scripts/browser-boot.mjs`; the audit
    reaches the shared `driveToMover` solely through `audit-retry.mjs` (unchanged). `git show`
    confirms 39-01 (65cc305) never touched the `driveToMover` mount/carry body — it is
    unchanged since Phase 36. The rows are identical on HEAD~1.
  - **Runtime drift:** the harness playwright fallback pins node `v22.22.2` (now vanished from
    this box); the active runtime is `v24.18.0`. The fixture was committed GREEN on Jul 18
    (node v22). Solid-floor mover MOUNT is historically delicate — commit `ab3546e`
    ("widening regressed the audit mount") shows even a small geometry nudge destabilizes it.
  - **Why NOT auto-fixed (SCOPE BOUNDARY):** re-tuning the fragile shared mount loop against
    node v24 is out of scope for a verification-only task, risks regressing the 3 currently-
    passing movers + `browser-boot` on the canonical node-v22 runtime, and Task 2 explicitly
    forbids porting/editing a ride branch. The STRUCTURAL Task-2 truths ARE verified: the ride
    is single-sourced in `mechanic-drive.mjs:920`, `audit-phase21` carries no inline ride block
    (`grep` 0) and reaches it only via `audit-retry.mjs` — nothing copied. `audit-phase21`
    exits 0 by design (a by-eye diagnostic; the assertive gate is the fixture runner).
  - **Follow-up:** a future harness pass should re-pin/verify the mover mount against the
    project's canonical node runtime (or widen the mount deadline/hop cadence in the SHARED
    `driveToMover` once a real node baseline is fixed) so the diagnostic reads green under CI.

## From 39-06 (POL-01/02/03 — L5/L6/L7 polish)

- **`audit-phase21-mechanics.mjs` exceeded a 570s cap and was killed mid-run** (node
  v24.18.0, same runtime drift as the 39-03 entry above). With patrollers now GENUINELY
  moving (the build.js patrol() re-arm fix, commit 938faae), the audit's per-encounter
  drives take longer per level (each `driveToPatroller` now crosses a moving sweep) —
  the already-slow diagnostic now overruns. Per the phase's standing carve-out this is
  non-blocking: `browser-boot.mjs` (PASS, exit 0, all 8 levels, zero driver diagnostics
  on Task 1's run) + `validate-levels.mjs` (0 HARD-FAIL) are the authoritative gates, and
  39-06 substituted targeted Playwright probes proving sliding-spike oscillation
  (L5 2790↔2859, L7 2830↔2899 @ y304) + the shared "spike"→respawn seam firing on
  slider contact. A future harness pass should re-baseline the audit's runtime budget
  now that patrollers actually walk.
- **The audit's `driveAndDetectPatroller` was authored against FROZEN patrollers** (the
  Kaplay 3001.0.19 patrol() born-finished bug meant every patroller since Phase 36 stood
  still at x1). Its "reached the foe's live x-span" trigger logic should be re-validated
  against genuinely ping-ponging skeletons in the same future harness pass.
