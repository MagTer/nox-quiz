---
phase: 33
slug: player-entity-animation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-11
---

# Phase 33 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (project has no JS test framework by design — shell-script gates + Playwright-driven `.mjs` scripts ARE the suite, per CLAUDE.md) |
| **Config file** | none |
| **Quick run command** | `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh` |
| **Full suite command** | `bash scripts/check-gate.sh && bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-progress.sh && node scripts/validate-levels.mjs && node scripts/browser-boot.mjs && node scripts/audit-phase21-mechanics.mjs && bash scripts/check-pink-gate.sh` |
| **Estimated runtime** | ~90-120 seconds (browser-boot.mjs + audit-phase21-mechanics.mjs both drive all 8 levels headless) |

---

## Sampling Rate

- **After every task commit:** `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh` (fast, catches the two hard project-wide invariants: no-timer/no-punishment and a727c13)
- **After every plan wave:** Full suite command above
- **Before `/gsd-verify-work`:** Full suite green + genuine (non-rubber-stamped) human sign-off — this phase's checkpoint:human-verify gate (player animation + collider-lock proof) is the authoritative closer, not automation alone

---

## Per-Task Verification Map

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| ART-04 | Player collider stays exactly 16×32 across all anim states | manual (screenshot proof) + automated (physics-level) | `node scripts/browser-boot.mjs` + `?debug=1` manual screenshots at flat floor/1-tile platform/lowest ceiling/door | ✅ existing script | ⬜ pending |
| ART-04 | Full idle/run/jump/fall/land anim coverage, no stutter on state transitions | manual (visual review) | N/A — `checkpoint:human-verify` is the authoritative gate, not an automated script (no anim-frame assertion API in use) | N/A by design | ⬜ pending |
| ART-05 | Door/math-gate/enemy visual swap is collision-neutral (every encounter still triggers) | integration (real browser-driven input) | `node scripts/audit-phase21-mechanics.mjs` | ✅ existing script (Phase 21/23) | ⬜ pending |
| ART-05 | New assets pass the pink-gate | automated | `bash scripts/check-pink-gate.sh` | ✅ existing script (Phase 31) | ⬜ pending |
| ART-05 | New assets exist and are manifest-registered | automated | `node scripts/check-assets-manifest.mjs` | ✅ existing script (Phase 32) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — every automated gate this phase needs already exists from prior phases (`check-safety.sh`, `check-import-safety.sh`, `check-gate.sh`, `check-progress.sh`, `validate-levels.mjs`, `browser-boot.mjs`, `audit-phase21-mechanics.mjs`, `check-pink-gate.sh`, `check-assets-manifest.mjs`). This phase only needs to keep them all green, not build new harness.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| Player animation quality (idle/run/jump/fall/land reads as alive, no visual stutter) | ART-04 | Visual/aesthetic judgment — this project's standing "never rubber-stamp checkpoint:human-verify" precedent requires genuine human sign-off, superseding the v4.1 player-art lock | Serve locally, play through with `?debug=1`, observe all 5 anim states in real gameplay across varied terrain; confirm collider screenshots at 4 required spots (flat floor, 1-tile platform, lowest ceiling, door) |
| Door/math-gate/enemy visual quality | ART-05 | Aesthetic judgment, part of the same sign-off session | Visually confirm the new animated door/math-gate/Hell-hound art reads well against the existing biome art from Phase 32 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
