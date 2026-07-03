---
phase: 17-build-the-levels
plan: 02
status: complete
---

# 17-02 Summary: Author level-02, level-03, level-04

## Implemented

- `src/levels/level-02.js`: "The Rusted Climb" — bounds right 2800, allowedTables `[1..7]`, 4 spikes, 1 door, 2 checkpoint gates.
- `src/levels/level-03.js`: "The Hollow" — bounds right 3400, allowedTables `[3..9]`, 6 spikes, 1 enemy, 1 collect zone, 1 checkpoint gate.
- `src/levels/level-04.js`: "The Last Span" — bounds right 4000, allowedTables `[6..9]`, 7 spikes, 1 door, 2 checkpoint gates, 1 enemy, 1 collect zone.

All three descriptors follow the `level-01` schema, import only `../config.js`, and place a checkpoint before every spike/mechanic.

## Verification

- `node --check` passed for all three new level files.
- `bash scripts/check-import-safety.sh` passed.
- Geometry counts match D-07/D-10:
  - level-02: 4 spikes, 1 door, 2 mathGates, bounds.right=2800.
  - level-03: 6 spikes, 1 enemy, 1 collectZone, 1 mathGate, bounds.right=3400.
  - level-04: 7 spikes, 1 door, 2 mathGates, 1 enemy, 1 collectZone, bounds.right=4000.
