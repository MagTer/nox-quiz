# Plan 15-01 Summary — Restore + Re-point `check-gate.sh`, Extend `check-import-safety.sh`

## Goal
Land the verification infrastructure for the Phase 15 shared challenge seam alongside the modules it guards:
- Restore the archived Phase 10 structural firewall as `scripts/check-gate.sh`, re-pointed at `src/ui/challenge.js`.
- Extend `scripts/check-import-safety.sh` so its existence/syntax loop and a727c13 negative-scan loop both cover `src/ui/challenge.js` and `src/mechanics/door.js`.

## Files Touched
- `scripts/check-gate.sh` — created/restored at the live repo-root path (commit `02df5ce`).
- `scripts/check-import-safety.sh` — extended Section 0 and Section 2 file lists + updated header comment (commit `77a569d`).

No `src/` files were modified.

## Task 1 — `scripts/check-gate.sh`
Restored from `.planning/milestones/v3.0-phases/10-math-gate-integration-port-the-brain/scripts/check-gate.sh` (commit `4e02732`) with these deltas:
- `TARGET` re-pointed to `$ROOT/src/ui/challenge.js`.
- Added `strip_comments()` helper (mirrors `scripts/check-safety.sh`) and routed every positive and negative grep through it.
- Public API assertion changed to `export function openChallenge`.
- Leak-safe-close assertion fixed to accept `destroy(` OR `destroyAll(`.
- Added two thin-caller assertions:
  - `src/ui/mathGate.js` must exist and call `openChallenge`.
  - `src/mechanics/door.js` must exist and call `openChallenge`.
- Header updated to cite the archive, explain `strip_comments`, and state the expected-red condition.

## Task 2 — `scripts/check-import-safety.sh`
Two additive edits:
- Section 0 existence/syntax loop: appended `src/ui/challenge.js` and `src/mechanics/door.js` after the existing four files.
- Section 2 negative a727c13 scan: appended the same two files after `title.js`/`select.js`.
- Header comment updated to document the expanded Phase 15 scope.

## Verification
Static checks pass:
- `bash -n scripts/check-gate.sh` — OK
- `bash -n scripts/check-import-safety.sh` — OK
- `grep -q 'export function openChallenge' scripts/check-gate.sh` — OK
- `grep -q 'src/ui/challenge.js' scripts/check-gate.sh` — OK
- `grep -q 'src/ui/mathGate.js' scripts/check-gate.sh` — OK
- `grep -q 'src/mechanics/door.js' scripts/check-gate.sh` — OK
- `grep -q 'strip_comments' scripts/check-gate.sh` — OK
- `grep -q 'destroyAll' scripts/check-gate.sh` — OK
- `grep -c 'src/ui/challenge.js' scripts/check-import-safety.sh` = `2` — OK
- `grep -c 'src/mechanics/door.js' scripts/check-import-safety.sh` = `2` — OK

Runtime gates are live and RED as expected, though the specific failure differs slightly from the plan's assumption:

```
$ bash scripts/check-gate.sh
gate checks: FAIL — src/ui/mathGate.js does not call openChallenge — must be a thin wrapper over the shared seam
exit: 1

$ bash scripts/check-import-safety.sh
import-safety checks: FAIL — missing module: src/mechanics/door.js
exit: 1
```

The plan assumed both scripts would fail citing the missing `src/ui/challenge.js`. In the current working tree, `src/ui/challenge.js` already exists (created by later plan `15-02`), so `check-gate.sh` advances to the thin-caller assertion for `mathGate.js`, and `check-import-safety.sh` reaches `door.js` first in the Section 0 loop. Both scripts still fail loudly, proving the gates are live and not no-ops.

## Commits
- `02df5ce` — feat(15-01): restore and re-point check-gate.sh at the shared challenge seam
- `77a569d` — feat(15-01): extend check-import-safety.sh to cover challenge.js and door.js
