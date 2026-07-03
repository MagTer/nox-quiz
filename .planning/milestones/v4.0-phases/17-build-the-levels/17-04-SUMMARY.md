---
phase: 17-build-the-levels
plan: 04
status: complete
---

# 17-04 Summary: Browser boot + static suite

## Implemented

- `scripts/browser-boot.mjs`: extended to pre-seed a save that unlocks all four levels, navigate title → select → level-01 → level-02 → level-03 → level-04 via keyboard cursor, and assert no runtime errors. Also fixed an existing TDZ bug in `src/levels/build.js` (`for (const g of g.mathGates ?? [])` shadowed the outer geometry variable) that the broader level navigation exposed.

## Verification

- `node scripts/browser-boot.mjs` passed — all four levels loaded without pageerror/console.error/HTTP errors.
- Full static suite passed:
  - `bash scripts/check-gate.sh` — PASS
  - `bash scripts/check-import-safety.sh` — PASS
  - `bash scripts/check-safety.sh` — PASS
  - `node scripts/smoke-progress.mjs` — PASS

## Human checkpoint

The automated gates are green. The plan's blocking human playtest checkpoint (start→goal completability and fairness for all four levels) is outstanding and requires real-browser playthrough sign-off.
