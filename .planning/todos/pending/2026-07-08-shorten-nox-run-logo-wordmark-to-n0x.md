---
created: 2026-07-08T20:40:57.704Z
title: Shorten Nox Run logo wordmark to "n0x"
area: ui
files:
  - src/scenes/title.js (logo reveal tween, ~Phase 26-07)
  - src/scenes/select.js (logo badge)
  - scripts/build-art-assets.py (Pillow logo bake — logo-hero.png / logo-badge.png)
  - assets/logo-hero.png
  - assets/logo-badge.png
---

## Problem

User asked (2026-07-08, mid-Phase-27) to change the logo/wordmark from "NOX RUN" to just
"n0x" — a shorter form. Raised as a side note while focused on the Phase 27 audio
checkpoint; deliberately deferred rather than actioned immediately.

Needs clarification before scoping:
- Literal text swap: same font/reveal-tween/badge treatment, just baking "n0x" instead of
  "NOX RUN" through the existing `scripts/build-art-assets.py` Pillow pipeline?
- Or a different visual treatment entirely (new casing/style, not just shorter text)?
- The current logo (`logo-hero.png` for title, `logo-badge.png` for select) went through a
  full two-round human sign-off in Phase 26 (font sourcing, ≤500ms non-strobing reveal
  animation, badge placement at real sizes) — this change should get the same sign-off
  treatment, not skip straight to shipped.

## Solution

TBD — clarify exact treatment with the user first (see Problem), then likely a small
Pillow-pipeline + human-sign-off pass mirroring Phase 26-07's original logo work.
