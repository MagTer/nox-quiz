---
phase: 8
slug: platformer-core-movement-physics-camera
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-24
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — browser game (no JS build step, no test runner per project constraints) |
| **Config file** | none |
| **Quick run command** | `python3 -m http.server 8000` (manual in-browser verification of test strip) |
| **Full suite command** | Manual UAT in browser via the Phase 8 test strip scene |
| **Estimated runtime** | ~30 seconds (manual playthrough) |

---

## Sampling Rate

- **After every task commit:** Load the test strip in browser, verify the task's observable behavior
- **After every plan wave:** Full manual playthrough of run/jump/land/camera/respawn
- **Before `/gsd-verify-work`:** Test strip exercises all 5 success criteria
- **Max feedback latency:** ~30 seconds (page reload + playthrough)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 8-01-* | 01 | 1 | MOVE-01, MOVE-02 | — | N/A (local static game) | manual + `node --check` | browser stress strip (run/jump/solid-land + seam-stick/tunneling check) | ❌ W0 | ⬜ pending |
| 8-02-* | 02 | 2 | MOVE-03, MOVE-04, LEVEL-06 | — | N/A | manual + `node --check` | browser (variable jump/coyote/buffer, clamped camera, checkpoint respawn) | ❌ W0 | ⬜ pending |
| 8-03-* | 03 | 3 | MOVE-05 | — | N/A | manual (blocking human gate) | throttled / non-60Hz playthrough | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test strip scene (long flat run + tall fast-drop ledge + gaps/platforms) — the deliberate stress harness for seam-stick / tunneling. This IS the verification surface for the phase; it must exist before movement/collision can be validated.

*No unit-test framework — project constraint is a single-purpose browser game with no JS build step. Verification is manual in-browser against the stress strip.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Run left/right (arrows + WASD), jump (Space/Up) | MOVE-01 | Input feel is observable, not unit-testable | Load test strip; press each key; confirm movement + jump |
| Variable jump height, coyote time, jump buffering | MOVE-02 | Game-feel is perceptual | Tap vs hold jump; jump just after leaving ledge; press jump just before landing |
| Solid landing — no seam-stick, no tunneling on fast drop | MOVE-03 | Emergent collision behavior | Run across tile seams; drop from the tall ledge at full speed; confirm no stick / no fall-through |
| Smooth clamped camera; identical feel on non-60Hz / throttled display | MOVE-04, MOVE-05 | Requires real display + throttling | Watch camera follow for jitter; throttle to ~30fps (DevTools) and confirm same movement distance/feel; verify camera never shows outside level bounds |
| Fall-off-world → respawn at last checkpoint, progress preserved, no game-over | LEVEL-06 | Observable game-state behavior | Walk off world; confirm respawn at last-touched checkpoint with quick fade, no lives/game-over UI |

*All phase behaviors are verified manually in-browser — this is appropriate for a no-build-step browser game.*

---

## Validation Sign-Off

- [ ] Test strip stress harness exists (Wave 0)
- [ ] Sampling continuity: each success criterion has a manual verification instruction
- [ ] All 5 ROADMAP success criteria mapped to a manual test
- [ ] MOVE-05 validated specifically on a throttled / non-60Hz display
- [ ] `nyquist_compliant: true` set in frontmatter after sign-off

**Approval:** pending
