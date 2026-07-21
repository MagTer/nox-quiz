---
id: SEED-002
status: harvested
planted: 2026-07-08
planted_during: v5.0 Phase 27 (Audio & ADHD-Safe Sound)
harvested: 2026-07-21
harvested_by: v6.0 Phase 37 (Mobile — Responsive Canvas & Touch Controls) + quick tasks 260720-mob/260721-ban/260721-cct (framing + Roblox-style HTML touch overlay). Device tuning MOB-06 remains a deferred human gate.
trigger_when: whenever mobile/tablet play becomes an actual goal — e.g. a future milestone kickoff where she wants to play away from the Windows laptop
scope: medium (likely its own phase or two, not a full milestone)
---

# SEED-002: Touch controls + responsive canvas for mobile/tablet play

## Why This Matters

Surfaced 2026-07-08 while trying to run Phase 27's audio human-verify checkpoint from a
phone over VPN: the page loaded (title bar showed "Nox Run") but rendered a black,
unusable canvas — expected, since `PROJECT.md`'s Out of Scope explicitly states
"Mobile-only UI — Windows laptop is the target device." This isn't a bug to fix now,
just a real-world friction point worth capturing: the only way to actually verify
audio/gameplay right now is from a keyboard-equipped device, which isn't always at hand.

The whole game is currently 100% keyboard-driven — movement, jump, and math-answer
selection are all wired via `onKeyPress` in `src/player.js`, `src/ui/challenge.js`, and
the scene files (title/select/game). There is no touch input layer at all, so even
where the page does render on a phone browser, nothing is tappable/controllable.

## When to Surface

**Trigger:** when mobile/tablet play becomes an actual goal (not just occasional
convenience) — e.g. raised again at a future `/gsd-new-milestone` kickoff, or if kid-UAT
feedback ever asks for it.

## Scope Estimate

**Medium — likely its own phase or two**, not a full milestone. Two independent pieces:

1. **Touch input layer** — virtual left/right + jump buttons, tappable multiple-choice
   answer targets in the challenge UI, touch equivalents for M (mute) and R (reset).
   Additive alongside the existing keyboard handlers, not a replacement (desktop/keyboard
   stays primary per the current design intent).
2. **Responsive canvas scaling** — canvas is currently fixed 640×360 internal, displayed
   at a hardcoded 1.5× via CSS `transform: scale()` (per `src/main.js`'s documented
   load-bearing note — NEVER scale via width/height, it desyncs Kaplay's mouse-offset
   mapping). Mobile would need real responsive scaling across wildly different screen
   sizes/aspect ratios, most likely locked to landscape orientation.

Reverses an explicit, deliberate Out of Scope line in `PROJECT.md` — should be a
conscious decision to revisit, not a silent scope creep.

## Breadcrumbs

- `.planning/PROJECT.md` — "Out of Scope: Mobile-only UI — Windows laptop is the target
  device" (the line this seed proposes revisiting)
- `src/player.js` — `JUMP_KEYS` / movement key handlers to extend with touch equivalents
- `src/ui/challenge.js` — multiple-choice answer selection, currently keyboard-only
- `src/scenes/title.js`, `src/scenes/select.js`, `src/scenes/game.js` — per-scene key
  registration pattern (Kaplay's `go()` clears the input bus per scene, so any touch
  layer needs the same per-scene re-registration discipline just established for
  Phase 27's audio mute key)
- `src/main.js` — the CSS `transform: scale(1.5)` display-scale note (load-bearing,
  documented pitfall for anyone touching canvas sizing)
- `CLAUDE.md` — "Serving MUST be over HTTP" guard and canvas conventions

## Notes

Captured live during Phase 27 execution while the human sound sign-off checkpoint
(27-07) was deferred pending access to a keyboard-equipped device. Not blocking —
Phase 27/28 proceed on the existing Windows-laptop/keyboard target as designed.
