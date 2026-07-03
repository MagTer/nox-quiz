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

- [ ] **ART-05**: The player is a real curated pixel-art sprite (not procedurally generated) with
      idle/run/jump animation states and facing direction, whose silhouette reads clearly against
      the game's actual `#0a0a0a` in-level background (verified in-browser, not assumed).
- [ ] **ART-06**: The ground/platform tileset is real curated pixel art with designed edge/seam
      frames (left/center/right/underside) that depict an actual material transition and tile
      seamlessly — not per-pixel random noise standing in for texture.
- [ ] **ART-07**: Parallax background layers depict composed scenery (e.g. distant
      ruins/structure silhouettes with intentional horizon rhythm) rather than randomly scattered
      rectangles, remain purely camera-driven (no timers), and stay non-strobing.
- [ ] **ART-08**: Title and level-select screens use real panel framing/texture and visual
      hierarchy — not flat-color rectangles with a single text glyph, matching the dark-grunge
      aesthetic with no pink.

### Process

Closes the gap that let Phase 18 ship without anyone actually looking at whether the art was
good: the phase was auto-approved in autonomous mode on the basis of a passing browser-boot check,
and `18-UI-SPEC.md`'s own checker sign-off was left "Approval: pending."

- [ ] **PROC-01**: Every new or replaced art asset has a CC0 license proof recorded in
      `CREDITS.md` and `assets/LICENSES/*.txt` (source URL + quoted CC0 declaration), matching the
      rigor already established for the untouched v3.0 assets (player/ground/spike/goal/coin).
- [ ] **PROC-02**: The phase cannot be marked verified without an explicit human visual sign-off
      on real screenshots or the live page — the "human sign-off" checkpoint must not be
      auto-approved on the basis of automated/structural checks alone.

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
| ART-05 | Phase 20 | Pending |
| ART-06 | Phase 20 | Pending |
| ART-07 | Phase 20 | Pending |
| ART-08 | Phase 20 | Pending |
| PROC-01 | Phase 20 | Pending |
| PROC-02 | Phase 20 | Pending |

**Coverage:**
- v1 requirements: 6 total
- Mapped to phases: 6 ✓
- Unmapped: 0

---
*Requirements defined: 2026-07-03*
*Last updated: 2026-07-03 — mapped to Phase 20 (ROADMAP.md created)*
