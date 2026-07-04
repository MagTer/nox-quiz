# Requirements: Math Lab — v4.1 Art Rework

**Defined:** 2026-07-03
**Core Value:** She opens it because she *wants* to, not because she has to.

## v1 Requirements

Requirements for the v4.1 Art Rework milestone. Each maps to roadmap phases.

### Art Quality

Redoes Phase 18's asset deliverables (ART-01..ART-04 from v4.0) with real curated CC0 pixel art
in place of the procedurally-generated placeholder noise (`scripts/generate-art-assets.py`) that
actually shipped. Technical contracts (frame layout, animation state machine, z-order, parallax
scroll ratios, color/spacing/typography tokens) carry forward unchanged from `18-UI-SPEC.md` —
only the asset content changes.

- [x] **ART-05**: The player is a real curated pixel-art sprite (not procedurally generated) with
      idle/run/jump animation states and facing direction, whose silhouette reads clearly against
      the game's actual `#0a0a0a` in-level background (verified in-browser, not assumed).

- [x] **ART-06**: The ground/platform tileset is real curated pixel art with designed edge/seam
      frames (left/center/right/underside) that depict an actual material transition and tile
      seamlessly — not per-pixel random noise standing in for texture.

- [x] **ART-07**: Parallax background layers depict composed scenery (e.g. distant
      ruins/structure silhouettes with intentional horizon rhythm) rather than randomly scattered
      rectangles, remain purely camera-driven (no timers), and stay non-strobing.

- [x] **ART-08**: Title and level-select screens use real panel framing/texture and visual
      hierarchy — not flat-color rectangles with a single text glyph, matching the dark-grunge
      aesthetic with no pink.

### Process

Closes the gap that let Phase 18 ship without anyone actually looking at whether the art was
good: the phase was auto-approved in autonomous mode on the basis of a passing browser-boot check,
and `18-UI-SPEC.md`'s own checker sign-off was left "Approval: pending."

- [x] **PROC-01**: Every new or replaced art asset has a CC0 license proof recorded in
      `CREDITS.md` and `assets/LICENSES/*.txt` (source URL + quoted CC0 declaration), matching the
      rigor already established for the untouched v3.0 assets (player/ground/spike/goal/coin).

- [x] **PROC-02**: The phase cannot be marked verified without an explicit human visual sign-off
      on real screenshots or the live page — the "human sign-off" checkpoint must not be
      auto-approved on the basis of automated/structural checks alone.

### Verification Integrity

Investigation into Kimi's other v4.0 phases (13–19, all executed by the same non-Claude runtime
per the post-ship diagnostic) found the art phase's pattern repeats for gameplay verification:
"human sign-off" claims from Phase 15 onward are thin, unsubstantiated one-liners with no session
narrative — unlike Phases 13–14's detailed, evidence-rich logs — and `v4.0-MILESTONE-AUDIT.md`
certified the whole milestone PASSED on the strength of those claims, which is how a total
soft-lock and 5 other real bugs (found and fixed in `collect.js` via a from-scratch interactive
Playwright harness) shipped undetected until a real playtest.

- [x] **VERIFY-01**: `door.js`, `gates.js`, `enemy.js`, and `mathGate.js` have each been driven
      interactively (real player movement + real answer input, not teleport-only) across all 4
      levels, with findings recorded the way the post-ship diagnostic recorded collect.js's bugs.

- [x] **VERIFY-02**: Any real bugs found while exercising VERIFY-01 are fixed and re-verified.
- [x] **VERIFY-03**: The automated boot check actually exercises movement and at least one full
      mechanic resolution per level — not just "scene loaded, zero console errors."

- [x] **VERIFY-04**: `v4.0-MILESTONE-AUDIT.md`'s unsupported "human sign-off recorded" claims
      (Phases 15–18) are corrected or annotated to reflect what verification actually happened,
      and the NAV-04 traceability inconsistency (flagged by `14-VERIFICATION.md`, never corrected)
      is resolved.

## v2 Requirements

None new for this milestone — see `PROJECT.md` "Next Milestone Goals" for the existing v5.0
candidate list (audio/SFX, more worlds, deployment hardening), unchanged by this milestone.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| New math mechanics, level geometry, or difficulty changes | Out of scope for an art-only redo; already verified in Phases 15–17 |
| Audio / SFX / music | Deferred to v5.0 (AUDIO-01) |
| More worlds / level packs | Deferred to v5.0 (CONTENT-FUT-01) |
| Deployment hardening (live Dokploy confirmation) | Deferred to v5.0 |
| Upgrading Kaplay or adding runtime dependencies | Not needed for an asset swap |
| Changing the brain algorithm, XP curve, or save format | Unrelated to art |
| `scripts/generate-art-assets.py` as the shipped art pipeline | This is precisely what's being replaced; may remain in the repo only as a clearly-labeled dev/prototyping tool |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ART-05 | Phase 20 | Complete |
| ART-06 | Phase 20 | Complete |
| ART-07 | Phase 20 | Complete |
| ART-08 | Phase 20 | Complete |
| PROC-01 | Phase 20 | Complete |
| PROC-02 | Phase 20 | Complete |
| VERIFY-01 | Phase 21 | Complete |
| VERIFY-02 | Phase 21 | Complete |
| VERIFY-03 | Phase 21 | Complete |
| VERIFY-04 | Phase 21 | Complete |

**Coverage:**

- v1 requirements: 10 total
- Mapped to phases: 10 ✓
- Unmapped: 0

---
*Requirements defined: 2026-07-03*
*Last updated: 2026-07-03 — mapped to Phase 20 (ROADMAP.md created)*
