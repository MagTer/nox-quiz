# Requirements: Nox Run (formerly Math Lab) — Milestone v5.0

**Defined:** 2026-07-05
**Core Value:** She opens it because she *wants* to, not because she has to.
**Milestone:** v5.0 Nox Run — Real Levels

## v5.0 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Review & Fixes

- [x] **FIX-01**: Implementation review across all game entities (player, monsters, doors, gates, collect zones, math gate, scenes, HUD) with bugs and obvious UX issues fixed autonomously
- [x] **FIX-02**: Bigger design changes surfaced from the review are presented for user approval before implementation

### Structural Validity

- [x] **VALID-01**: Static level validator (`scripts/validate-levels.mjs`) checks spawn→goal reachability, gap widths vs jump envelope, door-over-hole, and mechanic reachability on every level; exits non-zero on failure
- [x] **VALID-02**: Validator is calibrated against real engine physics (empirically measured jump envelope) and proven by catching the two known live bugs (door-over-hole, unreachable areas) before being trusted
- [ ] **VALID-03**: Interactive audit drives start→goal with mechanic encounters on all 8 levels (harness upgraded to shrink the current 6/16 encounter blind spot)
- [x] **VALID-04**: All known structural defects in existing levels fixed (doors over floor holes, unreachable areas)

### Levels & Content

- [x] **LVL-01**: Existing 4 levels lengthened (append past kid-validated sections) with checkpoint density scaled to length
- [x] **LVL-02**: 4 new levels (5–8) as pure-data descriptors through the existing registry/builder
- [x] **LVL-03**: Gentle difficulty ramp across all 8 levels (platforming + per-level table pools), including a mixed-review level
- [x] **LVL-04**: Level select scales to a 2×4 grid, preserving locked/unlocked/cleared semantics
- [x] **LVL-05**: Verticality segments in late levels (5–8)
- [x] **LVL-06**: One secret XP alcove per level — optional discovery reward, no punishment for missing it

### Math

- [x] **MATH-01**: Table 1 removed from all per-level question pools
- [x] **MATH-02**: ×10 questions eliminated entirely — second-factor roll 1–10 → 1–9 (explicitly authorized one-literal change to the LOCKED brain; nothing else in `src/math/` changes)

### Visuals

- [x] **VIS-01**: Duplicated color literals centralized into `CONFIG.PALETTE` before any expansion
- [ ] **VIS-02**: Expanded grunge palette — hue-tinted darks (moss green, blue-grey, rust), WCAG AA contrast recorded per role, no pink
- [ ] **VIS-03**: Per-level background/accent theme tinting via the art pipeline, under human visual sign-off
- [ ] **VIS-04**: Doors and enemies get real CC0 sprite art replacing their placeholder rect+glyph rendering (config.js's enemy `COLOR` is literally commented "placeholder"; door is a flat grey panel), under human visual sign-off — added 2026-07-07 per user request during Phase 26 discuss, echoing the original v5.0 kickoff framing ("make sure monster, doors and other parts of the game are reviewed and updated")

### Rebrand

- [ ] **BRAND-01**: Nox Run logo — dark green/black pixel wordmark (CC0 font, Pillow-baked PNG) with a light/neon separation element, human-signed-off in the running game
- [ ] **BRAND-02**: Full Math Lab → Nox Run string sweep (HTML title, title screen, docs, Docker, README). **Amended 2026-07-07 (26-CONTEXT.md):** the localStorage save key (`mathlab_platformer_v2`) is explicitly NOT required to survive the rebrand — user confirmed it may be freely renamed/changed, intentionally resetting pre-rebrand player progress; no save-resume verification required.
- [ ] **BRAND-03**: Logo reveal animation on title screen — ≤500ms, non-strobing

### Audio

- [ ] **AUD-01**: Core SFX set (jump, land, pickup, correct, soft-neutral wrong, door/gate, level-clear) wired at the shared mechanic seams; CC0 with license proofs
- [ ] **AUD-02**: Calm ambient music loop(s) — seamless OGG, gesture-gated start on the title screen
- [ ] **AUD-03**: M-key mute toggle, persisted in its own localStorage key (not the progress save)
- [ ] **AUD-04**: Designed ADHD-safe mix — music well below SFX, no buzzers or startle stingers, no music stacking/leaking across scenes (idempotent music manager), human sound sign-off

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Content

- **CONTENT-FUT-03**: Worlds/level-pack grouping on the select screen (earns its keep at ~12+ levels)
- **CONTENT-FUT-02**: Star/score-based completion texture (carried from v4.0 deferral — kept out to stay simple and non-punishing)

### Audio

- **AUD-FUT-01**: Full audio options menu (per-channel volume sliders) — M-key mute suffices for v5.0; revisit after UAT

### Deployment

- **DEPLOY-FUT-01**: Live Dokploy URL playthrough confirmation (deferred from v3.0 SETUP-02)

### UAT

- **UAT-FUT-01**: Kid-UAT live sign-off for platforming feel and non-over-stimulation (SAFE-05, protocol in `.planning/milestones/v4.0-phases/19-polish-consolidated-kid-uat/19-UAT.md`)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Renaming the localStorage save key | Would silently wipe her progress; the key is not part of the brand — permanent exclusion |
| Worlds map screen | 8 levels fit a 2×4 grid on one screen; worlds earn their keep at ~12+ levels |
| Star ratings / per-level scores | Shame-spiral risk — same reasoning as the standing leaderboard exclusion |
| Danger-reactive / intensifying music | Audio equivalent of the banned countdown timer; ADHD-unsafe |
| Buzzer / harsh wrong-answer sound | ADHD-unsafe; wrong answer gets a soft neutral tone only |
| Recoloring the signed-off v4.1 sprites | Sprites passed human sign-off; palette expansion tints themes, not the validated art |
| Kaplay upgrade (4000-series), Howler.js, npm/package.json | Zero new runtime dependencies confirmed sufficient by research; no-build constraint holds |
| Maze-like / heavily branching levels | ADHD anti-feature; levels stay mostly linear with optional alcoves |
| Any brain change beyond the MATH-02 one-literal | `src/math/brain.js` remains LOCKED; table scoping stays in per-level pools |
| Pink / girly visual design | Standing project exclusion |
| Timed pressure mechanics | Standing project exclusion (ADHD-safe) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FIX-01 | Phase 22 | Complete |
| FIX-02 | Phase 22 | Complete |
| VALID-01 | Phase 23 | Complete |
| VALID-02 | Phase 23 | Complete |
| VALID-03 | Phase 28 | Pending (harness-upgrade groundwork begins Phase 23) |
| VALID-04 | Phase 24 | Complete |
| LVL-01 | Phase 24 | Complete |
| LVL-02 | Phase 25 | Complete |
| LVL-03 | Phase 25 | Complete |
| LVL-04 | Phase 25 | Complete |
| LVL-05 | Phase 25 | Complete |
| LVL-06 | Phase 25 | Complete |
| MATH-01 | Phase 25 | Complete |
| MATH-02 | Phase 25 | Complete |
| VIS-01 | Phase 26 | Complete |
| VIS-02 | Phase 26 | Pending |
| VIS-03 | Phase 26 | Pending |
| VIS-04 | Phase 26 | Pending |
| BRAND-01 | Phase 26 | Pending |
| BRAND-02 | Phase 26 | Pending |
| BRAND-03 | Phase 26 | Pending |
| AUD-01 | Phase 27 | Pending |
| AUD-02 | Phase 27 | Pending |
| AUD-03 | Phase 27 | Pending |
| AUD-04 | Phase 27 | Pending |

**Coverage:**

- v5.0 requirements: 25 total (FIX-01..02, VALID-01..04, LVL-01..06, MATH-01..02, VIS-01..04, BRAND-01..03, AUD-01..04 — VIS-04 added 2026-07-07 during Phase 26 discuss)
- Mapped to phases: 25 ✓
- Unmapped: 0

---
*Requirements defined: 2026-07-05*
*Last updated: 2026-07-05 — traceability mapped during v5.0 roadmap creation (Phases 22–28)*
