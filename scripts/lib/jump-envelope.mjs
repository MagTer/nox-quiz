// scripts/lib/jump-envelope.mjs — the FROZEN, empirically-calibrated jump envelope
// (VALID-02). Consumed by scripts/lib/reachability.mjs (Wave 2) as the Δy-aware
// jump-edge model's horizontal-speed budget and rise ceiling.
//
// This module performs NO measurement itself and imports NOTHING Playwright-
// related — it is a one-time, checked-in snapshot of a single calibration run.
// Re-run scripts/calibrate-jump-envelope.mjs ONLY if CONFIG.RUN_SPEED / GRAVITY /
// JUMP_FORCE (src/config.js) is ever retuned, then hand-update the numbers below
// from its freshly printed trial data.
//
// PROVENANCE (raw sampled data from running `node scripts/calibrate-jump-envelope.mjs`
// against the real vendored Kaplay engine on 2026-07-05, CONFIG: RUN_SPEED=240
// GRAVITY=1400 JUMP_FORCE=520 — see the trial arrays in JUMP_ENVELOPE.raw below):
//
//   standing-jump rise trials (px): [93.99, 93.99, 94.10, 93.98, 94.13, 93.83,
//     93.98, 93.99, 92.98, 93.88, 93.99, 94.09]
//   -> min=92.98 mean=93.91 max=94.13 (relative spread (max-min)/mean = 1.22%)
//
//   running-jump reach trials (px): [171.41, 176.98, 172.99, 172.97, 172.18,
//     171.19, 170.54, 173.71, 170.50, 175.97, 172.90, 171.17]
//   -> min=170.50 mean=172.71 max=176.98 (relative spread (max-min)/mean = 3.75%)
//
// This is a real, engine-measured result, NOT the closed-form approximation
// (JUMP_FORCE**2/(2*GRAVITY) ~= 96.57px rise; RUN_SPEED*2*JUMP_FORCE/GRAVITY ~=
// 178.29px reach) that Phase 22 already proved produces unsafe-margin false
// candidates (22-FINDINGS.md's "no safety factor" flaw) — the measured max rise
// above (94.13px) and max reach (176.98px) both sit slightly BELOW their
// respective closed-form ceilings, which is exactly what real per-frame dt()
// discretization on the running engine should produce.
//
// MARGIN DERIVATION: marginPct is the larger of the two trial sets' relative
// spreads ((max-min)/mean), rounded UP to the nearest whole percent, with a floor
// of 5% (the margin must never be zero — the exact flaw the closed-form heuristic
// had). Standing spread rounds up to 2%; running spread (3.75%) rounds up to 4%.
// The larger of the two (4%) is still below the 5% floor, so marginPct = 5% is
// used here — this is the floor case, not the rounded-running-spread case.
//
// maxRise = minObservedRise * (1 - marginPct) = 92.98 * 0.95 = 88.331
//   (strictly below the 96.57px theoretical ceiling, as any margin-shaved
//   empirical measurement must be.)
//
// tFlat = 2 * CONFIG.JUMP_FORCE / CONFIG.GRAVITY = 2*520/1400 ~= 0.742857s
//   (the flat-Δy time-of-flight — src/config.js's GRAVITY=1400/JUMP_FORCE=520.)
//
// runSpeed = (minObservedReach * (1 - marginPct)) / tFlat
//          = (170.50 * 0.95) / 0.742857 ~= 218.043 px/s
//   (the calibrated, margin-shaved effective horizontal-speed constant that
//   scripts/lib/reachability.mjs plugs into the Δy-aware quadratic jump model
//   instead of raw CONFIG.RUN_SPEED — deliberately smaller than RUN_SPEED's
//   240px/s so the reachability graph never over-credits a hop's real reach.)

export const JUMP_ENVELOPE = {
  maxRise: 88.331,
  runSpeed: 218.043,
  marginPct: 0.05,
  raw: {
    standing: {
      trials: [93.99, 93.99, 94.10, 93.98, 94.13, 93.83, 93.98, 93.99, 92.98, 93.88, 93.99, 94.09],
      min: 92.98,
      mean: 93.91,
      max: 94.13,
    },
    running: {
      trials: [171.41, 176.98, 172.99, 172.97, 172.18, 171.19, 170.54, 173.71, 170.50, 175.97, 172.90, 171.17],
      min: 170.50,
      mean: 172.71,
      max: 176.98,
    },
  },
};
