---
phase: 17-build-the-levels
plan: 03
status: complete
---

# 17-03 Summary: Register levels and extend smoke fixture

## Implemented

- `src/levels/index.js`: imported `LEVEL_02`, `LEVEL_03`, `LEVEL_04` and appended them to `LEVELS` in play order after `LEVEL_01`.
- `scripts/smoke-progress.mjs`: moved the recursive `deepEqual` helper to module scope and added expected-geometry fixtures for `level-02`, `level-03`, and `level-04`. Added assertions for `LEVEL_ORDER.length === 4` and `LEVEL_ORDER[1] === "level-02"`.

## Verification

- `node --check src/levels/index.js` passed.
- `node scripts/smoke-progress.mjs` passed.
- Derived-unlock assertion for the second level still passes.
