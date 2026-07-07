---
created: 2026-07-07T00:00:00.000Z
title: Review all 8 shipped levels against docs/LEVEL-DESIGN.md
area: level-design
files:
  - docs/LEVEL-DESIGN.md
  - src/levels/level-01.js
  - src/levels/level-02.js
  - src/levels/level-03.js
  - src/levels/level-04.js
  - src/levels/level-05.js
  - src/levels/level-06.js
  - src/levels/level-07.js
  - src/levels/level-08.js
---

## Problem

User request (2026-07-07): the level-design rules (ledge placement, gap widths, distances
between math-question barriers, checkpoint density) are now codified in
`docs/LEVEL-DESIGN.md`, but the 8 shipped levels were authored BEFORE the rules existed.
They need a review pass against the SOFT rules — explicitly "down the road", not urgent
(all HARD rules already pass via validate-levels.mjs).

## Known candidates (extracted from descriptor data, 2026-07-07)

- **level-04**: 1360px checkpoint gap on the Phase-24 extension (SOFT ceiling: ~700px on
  hazard-bearing stretches — check whether that stretch actually carries hazards).
- **level-02**: 2220px barrier-free stretch (extension section has no math barrier at all —
  breather or dead zone?).
- **level-03**: 1980px and 1400px barrier spacings — same question.
- **levels 01/04**: the 72px door+mathGate adjacent pairs — confirm they still read as a
  deliberate set-piece, not an accident (kid feedback may exist from v4.1 UAT).
- Barrier spacing norm elsewhere is 300–750px; extensions skew sparse because Phase 24
  appended platforming-only sections.

## Suggested approach

Data extraction is trivial (regex over descriptors — see the one-liner in LEVEL-DESIGN.md's
provenance, or re-derive). The judgment calls (breather vs dead zone, set-piece vs accident)
need play-feel, so pair the data pass with a `?debug=1` walkthrough. Natural slot: alongside
or just after Phase 28's full interactive sign-off, or as a small inserted phase before it.
