# Plan 15-02 Summary: Extract Shared Challenge Overlay

## Goal
Extract the shared in-world challenge overlay from `src/ui/mathGate.js` into a new
`src/ui/challenge.js` seam, then rewrite `src/ui/mathGate.js` as a thin wrapper that
preserves its exact public contract `openMathGate({ brain, onClear })` so
`src/scenes/game.js` required **zero edits**.

## Tasks Completed

### Task 1 — Create `src/ui/challenge.js`
- Structural lift of the prior `mathGate.js` body with these transformations:
  - Tag renamed `"math-gate"` → `"challenge"` everywhere.
  - Public API: `export function openChallenge({ brain, onSuccess, prompt } = {})`.
  - Added optional plain-string `prompt` override; default remains `${q.a} × ${q.b}`.
  - Correct branch reduced to: `cleared = true; close(); onSuccess?.({ table: q.a });`.
  - Removed end-of-level vocabulary and the `ACCENT_GREEN` celebration-only palette constant.
  - Preserved verbatim: bounds guard `i < 0 || i >= q.choices.length`, forgiving wrong-branch
    `ACCENT_RED` tint + `shake(6)`, dual mouse/key input, global-key controller capture/cancel,
    and tag-based `destroyAll("challenge")` teardown.

### Task 2 — Rewrite `src/ui/mathGate.js` as thin wrapper
- Replaced the 231-line overlay implementation with a wrapper that:
  - Imports `openChallenge` from `./challenge.js`.
  - Keeps the **unchanged** export signature `openMathGate({ brain, onClear } = {})`.
  - Forwards the brain and renders the byte-identical persistent "LEVEL CLEAR" celebration
    (dim layer + banner, tag `"gate-cleared"`, z 9990/9994) inside the `onSuccess` callback.
  - Forwards the same payload shape: `onClear?.({ table })`.
- Dropped the `createBrain` import and all overlay construction logic (now owned by
  `challenge.js`).

## Verification

Ran the plan's automated verification for both tasks:

```bash
node --check src/ui/challenge.js && \
  grep -q 'export function openChallenge' src/ui/challenge.js && \
  grep -q 'onSuccess' src/ui/challenge.js && \
  grep -q 'prompt' src/ui/challenge.js && \
  test "$(grep -c '"math-gate"' src/ui/challenge.js)" = "0" && \
  test "$(grep -c 'ACCENT_GREEN' src/ui/challenge.js)" = "0" && \
  grep -q 'i < 0 || i >= q.choices.length' src/ui/challenge.js && \
  grep -q 'ACCENT_RED' src/ui/challenge.js && \
echo OK
# OK

node --check src/ui/mathGate.js && \
  grep -q 'export function openMathGate' src/ui/mathGate.js && \
  grep -q 'openChallenge' src/ui/mathGate.js && \
  grep -q '"gate-cleared"' src/ui/mathGate.js && \
  grep -q 'z(9994)' src/ui/mathGate.js && \
  test "$(grep -c 'createBrain' src/ui/mathGate.js)" = "0" && \
  grep -q 'onClear?.({ table' src/ui/mathGate.js && \
  git diff --quiet src/scenes/game.js && \
echo OK
# OK
```

## Commits

1. `fba4815` — 15-02 Task 1: extract shared in-world challenge overlay to `src/ui/challenge.js`
2. `05dc846` — 15-02 Task 2: rewrite `mathGate.js` as thin wrapper over `challenge.js`

## Files Modified

- `src/ui/challenge.js` — created (new shared seam)
- `src/ui/mathGate.js` — rewritten as thin wrapper
- `src/scenes/game.js` — **untouched** (zero diff, the MECH-01 contract proof)
