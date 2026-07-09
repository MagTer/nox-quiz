---
created: 2026-07-07T16:00:00.000Z
title: Reconsider secret-alcove mechanic's discoverability and value
area: level-design
resolves_phase: 29
files:
  - src/mechanics/secretAlcove.js
  - src/levels/build.js
  - .planning/phases/25-levels-5-8-difficulty-ramp-select-grid/25-CONTEXT.md
---

## Problem

User feedback (2026-07-07), during Phase 25's 25-07 human-verify checkpoint: the user
walked to level-01's secret alcove, saw the HUD XP tick up by exactly 5, and reported
"I get the XP increase but other than that.. nothing happens - no alcove?" This was
confirmed as intended design, not a bug: 25-CONTEXT.md's binding decision is "hidden
via geometry placement only, no signposting", and `build.js` ships the alcove with
`opacity(0)` — no blocker collider, no visible panel, no glyph, by design (it's meant
to be a genuinely silent, walk-through-only XP bonus).

After the design intent was explained, the user's reaction was: "seems like a
pointless feature that we might remove or adjust later. Not what I was expecting."
They then approved the Phase 25 sign-off checkpoint on the strength of level-01's
check alone, without walking the other 7 alcoves — see
`.planning/phases/25-levels-5-8-difficulty-ramp-select-grid/25-FINDINGS.md` section
(d) for the full accounting.

This is not a defect in what shipped — LVL-06's letter is satisfied and the mechanic
works exactly as specified. But the *design itself* is now an open question raised by
the actual target user's parent: does an entirely invisible, no-feedback "secret" read
as a rewarding discovery for a 12-year-old, or does it just feel like nothing
happened? Worth revisiting before investing further in more alcoves or content built
on the same silent-reward pattern.

## Solution

TBD. Options to weigh next time this comes up:
- Keep it as-is (intentional minimalism — "no signposting" was itself a deliberate
  design decision at 25-CONTEXT.md time, not an oversight).
- Add a subtle, non-signposting discovery cue that only appears AFTER the player is
  already standing in the alcove (e.g. a brief particle puff on touch) — reward
  feedback without pre-signposting the secret's existence or location.
- Remove the mechanic entirely if it's judged not worth the maintenance cost (see the
  related todo about it lacking automated test coverage, and 26-Grunge-Palette
  scope — nothing there currently plans a visual for this).

Kid-facing product decisions like this are best made with an actual playtest reaction,
not guessed at — natural slot is alongside Phase 28's full interactive sign-off, or
whenever the next kid-UAT session happens.
