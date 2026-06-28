---
status: passed
phase: 12-polish-adhd-safety-uat
source: [12-VALIDATION.md]
started: 2026-06-28T00:00:00Z
updated: 2026-06-28T00:00:00Z
---

## What this is

The final kid-UAT sign-off for Phase 12 (polish + ADHD-safety). The no-timer /
forgiving half is already audited automatically by `bash scripts/check-safety.sh`
(it must print `safety checks: PASS`). Everything below is the **perceptual**
half — feel, framing, juice intensity, contrast, over-stimulation — which is
NON-automatable by design and is validated **with the actual kid** on the
Windows laptop.

**Sign-off authority:** the user, running this play-test WITH THE KID.

## How to launch

`file://` blocks ES modules, so serve over HTTP from the repo root:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in the browser on the Windows laptop and play
a full loop (move, jump, collect coins, hit a gate, answer, clear, level up).

## Current Test

number: 1
name: Jump/land juice is subtle, not over-stimulating
expected: |
  Jumping and landing repeatedly shows a subtle squash/stretch and a quick dust
  puff — brief and calm, NOT bouncy or over-stimulating; jumps land where
  expected (the collider still feels fair).
awaiting: user response

## Tests

### 1. Jump/land juice is subtle (JUICE-01)
how-to-test: Jump and land repeatedly across the floor.
expected: Subtle squash on land + brief stretch on jump + a quick dust puff — calm, NOT bouncy or over-stimulating; jumps still land where expected (collider feels fair).
result: pass

### 2. Coin collect pop (JUICE-02)
how-to-test: Run through several coins.
expected: Each coin gives a quick pop+fade — satisfying, not jarring.
result: pass

### 3. Level-clear celebration is brief + non-strobing (JUICE-03)
how-to-test: Answer a gate correctly to clear it.
expected: A celebratory burst layered on the "LEVEL CLEAR" banner + level-up flash — brief and NON-STROBING (no flicker/strobe).
result: pass

### 4. No time pressure + forgiving (SAFE-01)
how-to-test: Play a full loop; answer a gate wrong on purpose.
expected: Nothing counts down or time-pressures anywhere; a wrong answer never punishes (forgiving re-ask, no progress lost). Also confirmed automatically by `bash scripts/check-safety.sh`.
result: pass

### 5. Controls hint is discoverable + readable (SAFE-02)
how-to-test: Look at the bottom-left corner during play.
expected: The persistent hint "← → move · SPACE jump" is always visible and readable, and the arrow glyphs render (NOT tofu boxes — if tofu, fall back to "LEFT/RIGHT move · SPACE jump").
result: pass

### 6. Readable contrast + not over-stimulating (SAFE-03)
how-to-test: Glance over the HUD, hint, gate text, and sprites during play.
expected: Text / sprites / HUD all read clearly on the #0a0a0a stage; effects are calm; the kid is NOT overwhelmed or over-stimulated.
result: pass

### 7. Overall feel/framing — "reads like a real game" (JUICE/SAFE)
how-to-test: Let the kid play freely.
expected: She enjoys it, the controls are obvious, nothing feels stressful — it reads like a real game (the kid-reaction bar).
result: pass

## Audit (automated half — SAFE-01)

Record the result of the automated ADHD-safety gate here at play-test time:

- `bash scripts/check-safety.sh` → expected `safety checks: PASS` (no-timer + forgiving across all of src/, plus the SAFE-02 hint positive and the fx.js self-clean positive).

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Sign-off

Passed — the user ran the full loop WITH THE KID on the Windows laptop (2026-06-28):
"the game seems to be working… all good". Juice is calm, controls discoverable,
nothing time-pressures or punishes, contrast readable, effects not over-stimulating.

Follow-up (NOT a Phase 12 failure — new enhancement requests for the next milestone):
the rendered canvas is small (display-scaling, deferred), the sprites read as
early-MVP (art pass, deferred), and the user wants more mid-game challenge variety
(content/mechanics, deferred). Captured for v4 scoping.
