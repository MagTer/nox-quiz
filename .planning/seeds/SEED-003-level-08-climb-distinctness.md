---
id: SEED-003
status: dormant
planted: 2026-07-21
planted_during: v6.0 Phase 39 (Playthrough Polish) — deferred at the end-of-milestone game/state review
trigger_when: v7.0 milestone kickoff, or any future level-content pass that touches level-02 or level-08 geometry
scope: small (one focused level-authoring change + a gate decision)
---

# SEED-003: Differentiate level-08's climb from level-02 (structural-distinctness gate is RED)

## Why This Matters

`scripts/check-level-distinctness.mjs` currently HARD-FAILs one pair:

```
level-02 ≈ level-08 | HARD-FAIL | climb-profile ySeqSim=0.77 >= 0.72
```

This is the STRUCTURAL-DISTINCTNESS gate (`docs/LEVEL-DESIGN.md` §8.5 rule 7). The two
levels' ordered vertical climb profiles now share a longest-common-subsequence
similarity of 0.77, over the 0.72 fail threshold. It is a **side effect of Phase
39-07**: removing level-08's stepping-stones (moving the ferries over the real moat +
chasm) reshaped L8's climb so it reads structurally like level-02's vertical spire.

It is NOT a gameplay bug — both levels play fine and the kid (Nadja) approved the
full playthrough (VER-02, 2026-07-21). It is a design-quality gate that this project
deliberately keeps RED rather than silently loosening: LVL-02 / §8.5 rule 7 exist so
no two levels feel like clones, and this is exactly the signal the gate was built to
catch. Splitting it to a seed keeps v6.0 closeable without either shipping a
knowingly-red gate as "green" or rushing a level re-author under end-of-milestone
pressure.

## The Decision To Make (do this at trigger time)

Two legitimate resolutions — pick one deliberately, don't default:

1. **Differentiate L8's climb** (preferred if L8's finale should feel distinct):
   re-author level-08's ascent so its ordered y-profile diverges from level-02's —
   e.g. a different climb rhythm (switchback vs. straight spire), an inserted descent,
   or a different tier cadence. Re-run `check-level-distinctness.mjs --matrix` until
   the L2/L8 pair clears 0.72 with margin. Respect the frozen-geometry re-baseline
   step (`check-geometry-frozen.mjs --write`) since this touches FROZEN floors/platforms.

2. **Accept + retune the threshold** (only if L2/L8 sharing a climb signature is
   judged acceptable): document why in §8.5 rule 7 and bump `YSEQ_FAIL`. This weakens
   the guard for ALL future pairs — do this only with eyes open. Lower-confidence
   option; prefer (1).

## Pointers

- Gate: `scripts/check-level-distinctness.mjs` (`YSEQ_FAIL`, `ySeqSim` at line ~104).
- Rule: `docs/LEVEL-DESIGN.md` §8.5 rule 7.
- Levels: `src/levels/level-02.js`, `src/levels/level-08.js`.
- Root cause commits: Phase 39-07 L8 stepping-stone removal + Batch-2 re-baseline
  (`3755b61`), see `.planning/phases/39-.../.continue-here.md`.
- If touching L8 geometry: re-baseline the frozen snapshot and re-run the full gate
  suite (validate-levels, browser-boot, check-geometry-frozen).
