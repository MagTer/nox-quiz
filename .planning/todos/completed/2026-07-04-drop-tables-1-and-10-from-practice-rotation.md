---
created: 2026-07-04T21:46:55.154Z
title: Drop tables 1 and 10 from practice rotation
area: gameplay
resolves_phase: 25
files:
  - src/math/brain.js:68-69
  - src/levels/level-02.js:15
---

## Problem

User request (2026-07-04, during v4.1 wrap-up): tables 1 and 10 are "too simple" and should be
dropped from the multiplication practice rotation. Keep tables 2-9 in play, with the existing
slight bias toward 6-9 preserved. User explicitly said this can be deferred to a later stage —
not urgent, captured here rather than implemented inline mid-milestone.

**Investigation already done (worth reading before touching anything):**

- Table 10 is a non-issue — `src/math/brain.js`'s `validTables` sanitizer already caps the pool at
  `t >= 1 && t <= 9` (line 68-69), so table 10 has never actually been reachable regardless of
  what any level's `allowedTables` array lists. No code touches table 10 today.
- Table 1 IS currently reachable: `src/levels/level-02.js:15` sets
  `allowedTables: [1, 2, 3, 4, 5, 6, 7]` — the only level that includes `1`.
  `level-01.js` (`[6,7,8,9]`), `level-03.js` (`[3,4,5,6,7,8,9]`), and `level-04.js` (`[6,7,8,9]`)
  never include table 1.
- So the actual scope of this change is narrow: remove `1` from level-02's `allowedTables` array.
  The 6-9 weighting bias itself lives in `brain.js`'s per-table weight formula (hard vs. easy
  base-weight split, `(1 - acc)^1.5` vs `(1 - acc)^0.8 * 0.3`) and does not need to change — it's
  keyed off which tables are in the allowed pool, not a specific "1" or "10" special-case.

## Solution

TBD — narrow fix once picked up: edit `level-02.js`'s `allowedTables` to `[2, 3, 4, 5, 6, 7]` (or
reconsider whether level-02 should gain 8/9 to compensate for losing table 1 — a design call, not
just a deletion). Should go through the normal GSD flow (discuss/plan/execute) rather than a
direct edit, since it's a gameplay/difficulty-curve change with its own regression-test
implications (smoke-progress.mjs's expectedGeometry, any level-02-specific audit script
assertions).
