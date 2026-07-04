# Deferred Items — Phase 21

Out-of-scope discoveries logged during plan execution (per SCOPE BOUNDARY rule — not
fixed, only recorded).

## From Plan 21-07 (Task 2)

**`scripts/check-gate.sh` is intermittently flaky (pipefail + `grep -q` SIGPIPE race).**

- **Found during:** Task 2's full static gate suite re-run.
- **Symptom:** `bash scripts/check-gate.sh` occasionally exits non-zero with a message like
  `gate checks: FAIL — missing 'export function openChallenge' (public API contract)` or
  `gate checks: FAIL — missing 'fixed(' screen-space overlay (GATE-01 camera-immune render)`
  even though a direct `sed -E 's://.*$::' file | grep -q 'pattern'` run of the exact same
  assertion finds a match. Reproduced 1 failure in 6 consecutive runs on an untouched,
  clean working tree (`git status --short` empty) — not caused by any Plan 21-07 edit.
- **Root cause (not fixed, just diagnosed):** the script runs under `set -euo pipefail`
  and every assertion is `strip_comments "$TARGET" | grep -q 'pattern'`. `grep -q` exits
  immediately after its first match, closing its stdin pipe; the upstream `sed` process
  can then receive `SIGPIPE` before it finishes writing the rest of the file, which under
  `pipefail` makes the *pipeline's* exit status reflect `sed`'s SIGPIPE-induced non-zero
  exit rather than `grep`'s successful (match-found) exit — a classic bash pipefail/`-q`
  race. Whether it triggers depends on pipe-buffer timing, hence the intermittent (not
  every-run) failure.
- **Why deferred:** out of this plan's scope (`files_modified: scripts/browser-boot.mjs`
  only) — `check-gate.sh` targets `src/ui/challenge.js`/`src/mechanics/*.js`, none of
  which this plan touches. Not fixed per the SCOPE BOUNDARY rule.
- **Suggested fix for a future plan:** replace every `grep -q` in the pipeline with
  `grep -c 'pattern' > /dev/null` (reads to EOF, no early-exit SIGPIPE) or add
  `2>/dev/null || true` around the `sed` stage, or drop `pipefail` for these specific
  assertions.
