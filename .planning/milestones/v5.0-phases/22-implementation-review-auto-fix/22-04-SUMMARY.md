---
phase: 22-implementation-review-auto-fix
plan: 04
subsystem: world-engine-glue-and-data
tags: [review, auto-fix, structural-inventory, parallax, config, progress, levels]
requires:
  - 22-01 (baseline capture + FINDINGS scaffold + de-flaked gates)
  - 22-02 (Cluster A verdicts + WR-03 guard precedent)
  - 22-03 (Cluster B verdicts + engine teardown ground truth)
provides:
  - Completed 24-row Per-Entity Verdict Table (zero pending rows)
  - Structural Defect Inventory (11 rows, all deferred-to-phase-24) — Phase 23 RED calibration input
  - Cluster C findings 11-16 with regression PASS record
affects:
  - Phase 23 (validator calibration targets + heuristic-candidate list)
  - Phase 24 (structural fix backlog)
  - Plan 22-05 (FIX-02 decision round + phase-end full-suite diff)
tech-stack:
  added: []
  patterns:
    - per-key bounds defaulting at descriptor trust boundary (camera.js idiom extended to parallax.js)
    - alias-aware comment-stripped config-token consumer sweep
key-files:
  created: []
  modified:
    - src/parallax.js
    - src/config.js
    - .planning/phases/22-implementation-review-auto-fix/22-FINDINGS.md
decisions:
  - "parallax.js latent partial-bounds NaN fixed as zero-behavior-change hardening (silent-invisibility class, same asymmetric-defense shape Cluster A fixed) rather than noted-only — control probe byte-identical pre/post"
  - "CONFIG.COLLECT.CORRECT_GLOW/WRONG_GLOW removed as dead tokens (stale comments claimed usage; shipped feedback is challenge-close + fx.pop nudge); CONFIG.PROGRESS.EASY_TABLES KEPT — verbatim-port block documents the BRAIN/PROGRESS duplication as intentional (T-22-07 decision-flag guard)"
  - "player.js jump-cut release handler left unguarded: proven no-op while frozen via the vel-zero-before-pause chain at all five freeze sites; invariant recorded for future pause sites"
  - "All 11 structural inventory rows dispositioned deferred-to-phase-24; level descriptors diff-proven byte-identical to baseline 5eedee8 (Phase 23 RED-first proof preserved)"
metrics:
  duration: 13min
  tasks: 3
  files: 3
  completed: 2026-07-05
status: complete
---

# Phase 22 Plan 04: Cluster C Review + Structural Defect Inventory Summary

**One-liner:** Cluster C (engine glue + data layer) reviewed with 2 auto-fixes landed (parallax latent NaN hardening, 2 dead config tokens removed), progress.js save validation proven intact protection-by-protection, and the 11-row structural defect inventory delivered as Phase 23's calibration input — all 24 verdict rows now final, level geometry byte-identical to baseline.

## What Was Done

### Task 1: Engine glue — player.js, camera.js, parallax.js, fx.js (Findings 11–13)

- **player.js (Finding 11, clean):** the unguarded onKeyRelease jump-cut is a provable no-op while frozen — all five freeze paths zero `player.vel` synchronously BEFORE setting `paused` (door/gates/enemy/game.js grep-verified; collect.js never pauses), and no code path writes negative vel.y during a freeze. Why-benign chain + a vel-zero-before-pause invariant note recorded instead of a speculative guard. Animation transition guard (`getCurAnim()?.name`) self-heals from the no-anim state.
- **camera.js / parallax.js (Finding 12):** live-module Node probe (`probe-22-04-bounds.mjs`, Kaplay globals stubbed) fed partial bounds objects. camera.js per-key fallbacks yielded finite output on every shape — clean. parallax.js pre-fix produced `levelWidth NaN → count NaN → ZERO layer instances` (silently invisible background). **Fixed** (commit `0aa65a9`): per-key `bounds?.left/right ?? CONFIG.LEVEL_LEFT/RIGHT` defaulting in both `makeParallaxLayers` and `updateParallaxLayers`, copying camera.js's exact idiom; full-bounds control probe byte-identical pre/post. Loop-index-vs-entry usage in the parallax iteration verified in lockstep.
- **fx.js (Finding 13, clean):** all 4 effects either self-clean via `tween().onEnd(destroy)` or are swept by game.js; squash/stretch single-flight confirmed (cancel-before-start, handle-clear ordering safe in both engine semantics).

### Task 2: config.js, progress.js, build.js, levels/index.js (Findings 14–16)

- **config.js (Finding 14, fixed):** alias-aware, comment-stripped consumer sweep over all 119 tokens (scratchpad `sweep-22-04-config-tokens.mjs` + raw-grep cross-check). 116 tokens consumed; `COLLECT.CORRECT_GLOW`/`COLLECT.WRONG_GLOW` removed (commit `06c86c3`) — zero consumers, stale comments falsely claimed usage; `PROGRESS.EASY_TABLES` kept with rationale (verbatim-port block explicitly documents the intentional BRAIN/PROGRESS duplication). Full disposition table in the finding.
- **progress.js (Finding 15, clean):** every named protection verified at HEAD — version gate, triple try/catch-to-defaults, explicit-field copy (no spread — prototype-pollution mitigation), finite-number guards (both validate() and createProgress()), junk-id tolerance + registry fallback, QuotaExceededError guard. check-progress.sh + smoke-progress.mjs green on HEAD after every commit. Nothing weakened (T-22-01 mitigate satisfied).
- **build.js / levels/index.js (Finding 16, clean):** apex-derived blocker heights present at all THREE barrier types (identical WR-04/CR-02 formula); loop-variable hygiene verified (the one index-carrying loop pairs `i`/`s` correctly with collect.js's slotIndex lookup); all three glyph draws carry explicit color per 844cd08. Registry order/lookup/unlock derivation verified, smoke-covered.

### Task 3: Structural defect inventory + cluster regression + final verdicts

- **Inventory (11 rows, ALL deferred-to-phase-24):** filled from a fresh run of the pure-data interval check (`interval-check-22-04.mjs`, raw output quoted in FINDINGS): 3 over-hole math gates by EXACT interval arithmetic (level-01 x600 + x1300, level-04 x1800) and 8 possibly-unreachable platforms as explicitly-labeled heuristic candidates (level-03 x1880/x2640, level-04 x1080/1400/1760/2140/2520/3240; envelope ≈96.6px rise / ≈178.3px run, no safety factor, naive adjacency — disclosed per research risk A2).
- **Correlation note recorded:** unreached audit encounters cluster on the over-hole gates (2 of 3 over-hole rows are stable-unreached/timing-sensitive; the one stably-reached over-hole gate is bridged by an overlapping stepping-stone); level-02's unreached rows have no structural row — resonance alone explains them.
- **Descriptor-untouched proof (machine-checked):** `git diff --quiet 5eedee8..HEAD -- src/levels/level-0{1..4}.js` exits 0 — level geometry byte-identical to baseline (roadmap criterion 4).
- **Cluster C regression: PASS** — 4 static gates + smoke green after every commit; `browser-boot.mjs` exit 0 on post-fix HEAD.
- **Per-Entity Verdict Table complete:** all 24 rows carry final verdicts with finding refs; the 4 descriptor rows read deferred-to-phase-24 referencing the inventory.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `0aa65a9` | fix | per-key bounds defaulting in parallax.js (latent NaN/silent-invisibility) |
| `a36ae0c` | docs | Findings 11–13 (engine glue) |
| `06c86c3` | fix | remove dead COLLECT.CORRECT_GLOW/WRONG_GLOW config tokens |
| `a672cc5` | docs | Findings 14–16 (config sweep, progress protections, build/registry) |
| `890d1dc` | docs | structural defect inventory + Cluster C regression PASS + 24 verdict rows final |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical guard] parallax.js partial-bounds NaN hardening**
- **Found during:** Task 1 (camera/parallax probe)
- **Issue:** the plan's auto-fix trigger was "NaN path reachable from real descriptor shapes"; the probe showed the path is latent-only today (shipped descriptors always reach parallax with complete bounds). Strictly by the plan's letter this was note-only.
- **Fix:** fixed anyway as zero-behavior-change hardening — silent-invisibility is a named CONTEXT auto-fix class, the plan's own threat model flags the descriptor boundary for exactly this bug shape, and it mirrors the phase's Cluster A precedent of hardening latent asymmetric defenses before content doubles. Control probe output byte-identical pre/post.
- **Files modified:** src/parallax.js
- **Commit:** `0aa65a9`

No other deviations — dead-token removal and the paused-guard why-benign outcome were both explicitly anticipated conditional outputs in the plan.

## Known Stubs

None — no stub patterns introduced; both fix commits are guard/cleanup only.

## Threat Flags

None — no new network endpoints, auth paths, file access, or schema surface. T-22-01 (save-blob parsing) verified mitigated; T-22-07 (decision-flag deletion) mitigated via the sweep table + explicit keep of PROGRESS.EASY_TABLES.

## Next Steps

- Plan 22-05: FIX-02 batched escalation decision round (Candidates 1–3, all still PENDING-DECISION — this plan added none) + phase-end full-suite regression diff against the baseline stable cores.
- Pre-existing note stands (deferred-items.md): the audit script's screenshot dir points at the archived Phase 21 path — Phase 23 harness scope.

## Self-Check: PASSED

All 3 modified files exist on disk; all 5 plan commits (0aa65a9, a36ae0c, 06c86c3, a672cc5, 890d1dc) verified in git log.
