---
phase: 29-mechanic-cleanup
fixed_at: 2026-07-09T22:28:30Z
review_path: .planning/phases/29-mechanic-cleanup/29-REVIEW.md
iteration: 2
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 29: Code Review Fix Report

**Fixed at:** 2026-07-09T22:28:30Z
**Source review:** .planning/phases/29-mechanic-cleanup/29-REVIEW.md
**Iteration:** 2

**Summary:**
- Findings in scope (fix_scope: critical_warning — this re-review had 0 critical findings,
  so only WR-05/WR-06 were in scope; IN-04/IN-05/IN-06 are info-level and explicitly
  out of scope for this pass): 2
- Fixed: 2
- Skipped: 0

## Fixed Issues

### WR-05: `screenshot-phase26.mjs`'s seeded save blob used a stale save-format version, silently breaking its own level-unlock seed

**Files modified:** `scripts/screenshot-phase26.mjs`
**Commit:** `4b85b0d`
**Applied fix:** Bumped `SAVE_BLOB.version` from `2` to `3` at `scripts/screenshot-phase26.mjs:90`,
matching `CONFIG.SAVE.VERSION` (bumped to `3` in iteration 1's `09ee4df` for MECH-06's
`secretFound` field) and mirroring the pattern already used in `scripts/browser-boot.mjs:80`
and `scripts/audit-phase21-mechanics.mjs:99`. Before the fix, `progress.js`'s `loadSave()`
rejected the seeded blob on version mismatch and silently fell back to `defaults()` (empty
`levels` map), leaving only `level-01` unlocked — so the script's per-level screenshot loop
kept re-selecting `level-01` for every iteration and mislabeled 7 of its 10 output files.

**Verification beyond syntax check:** actually ran `node scripts/screenshot-phase26.mjs`
after the fix (not just confirmed the version literal matches). It produced 10 files
including `phase26-level-01-theme.png` through `phase26-level-08-theme.png`. Ran `md5sum`
over all 8 level-theme screenshots and confirmed all 8 hashes are distinct — proof the
select-scene now actually navigates to and captures each of the 8 levels, not 8 copies of
level-01. (Prior to the fix, this class of bug would have produced 8 identical hashes.)

### WR-06: `secretAlcove.js`'s file-header docstring still claimed "once per alcove object," but the CR-01 fix implemented "once per level"

**Files modified:** `src/mechanics/secretAlcove.js`
**Commit:** `5f0d6a9`
**Applied fix:** Rewrote the top-of-file overview comment (lines 5-7) from "...it is a
silent, flat XP bonus (`CONFIG.PROGRESS.XP_ALCOVE`) awarded exactly once per alcove object,
deliberately below XP_EASY..." to accurately state the per-LEVEL contract actually
implemented by the CR-01 fix (via `progress.hasSecretFound`/`markSecretFound`, both keyed
by `levelId` not by alcove object identity), and added an explicit authoring note: if a
level ever ships more than one `secretAlcove` entry, only the first one touched pays out.
This brings the header in line with the accurate inline comment at lines 51-62 (added by
the same CR-01 fix) and removes the risk of a future contributor authoring a
two-secret-alcove level expecting two payouts based on the (previously wrong) header claim.

## Skipped Issues

None — both in-scope findings (WR-05, WR-06) were fixed. IN-04/IN-05/IN-06 were
out of scope for this iteration (`fix_scope: critical_warning`) and were not touched, per
this task's explicit instruction. WR-04 (no validator coverage for
`geometry.secretAlcove`) remains deferred to Phase 30 per the roadmap — confirmed
unchanged by this re-review, not re-raised as a finding, and out of scope here regardless.

## Post-fix verification

All of the following were re-run after both fixes (final pass, all green):

- `bash scripts/check-gate.sh` — PASS
- `bash scripts/check-safety.sh` — PASS
- `bash scripts/check-import-safety.sh` — PASS
- `bash scripts/check-progress.sh` — PASS (includes `smoke-progress.mjs`)
- `node scripts/validate-levels.mjs` — PASS (zero HARD-FAIL; pre-existing WARNs
  unrelated to this fix pass)
- `node scripts/browser-boot.mjs` — PASS ("title -> select -> all levels loaded with
  no runtime errors")
- `node scripts/audit-phase21-mechanics.mjs` — "AUDIT: ALL MECHANICS RESOLVED" (every
  encounter across all 8 levels: `triggered: true`, `resolved: true`)
- `node scripts/screenshot-phase26.mjs` — ran directly (not just syntax-checked) to
  confirm the WR-05 fix resolves the mislabeling; produced 10 files, 8 distinct
  per-level screenshots verified via `md5sum` (all 8 hashes unique)

---

_Fixed: 2026-07-09T22:28:30Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
