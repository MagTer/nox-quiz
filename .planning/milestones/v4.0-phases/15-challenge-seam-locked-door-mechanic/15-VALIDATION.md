---
phase: 15
slug: challenge-seam-locked-door-mechanic
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-02
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — project convention is bash structural gates + a mandatory manual real-browser boot (no JS test framework, confirmed project-wide) |
| **Config file** | none |
| **Quick run command** | `bash scripts/check-import-safety.sh && bash scripts/check-safety.sh` |
| **Full suite command** | `bash scripts/check-gate.sh && bash scripts/check-import-safety.sh && bash scripts/check-safety.sh` (after `check-gate.sh` is restored/repointed in Wave 0) |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** `bash scripts/check-import-safety.sh && bash scripts/check-safety.sh`
- **After every plan wave:** full suite (all three `check-*.sh` scripts) once `check-gate.sh` exists
- **Before `/gsd-verify-work`:** full suite green PLUS the mandatory real-browser boot (blocked door → answer → door opens → path clear; end gate still works byte-for-byte)
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| W0 | — | 0 | — | — | `scripts/check-gate.sh` restored from archive + re-pointed at `challenge.js` | grep | `bash scripts/check-gate.sh` | ❌ W0 | ⬜ pending |
| W0 | — | 0 | — | — | `check-import-safety.sh` file list extended to cover `door.js`/`challenge.js` | grep | `bash scripts/check-import-safety.sh` | ❌ W0 | ⬜ pending |
| MECH-01 | TBD | — | MECH-01 | — | shared `challenge.js` backs every interaction; `mathGate.js` is a thin caller; end gate behaves identically | structural + manual boot | `bash scripts/check-gate.sh` (repointed) | ❌ W0 | ⬜ pending |
| MECH-02 | TBD | — | MECH-02 | — | door blocked → answer → opens → path clear; wrong answer never locks out or consumes key | manual boot | N/A — mandatory human boot | ❌ W0 | ⬜ pending |
| MECH-02 | TBD | — | MECH-02 | — | overlay pauses world, owns input, renders above world+parallax, confirmed next to a hazard | manual boot | N/A — visual/behavioral only | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/check-gate.sh` — does not exist at the live path (archived to `.planning/milestones/v3.0-phases/10-math-gate-integration-port-the-brain/scripts/check-gate.sh` in commit `4e02732`). Must be restored and re-targeted at `src/ui/challenge.js`, plus assert `mathGate.js`/`door.js` are thin callers.
- [ ] `scripts/check-import-safety.sh` — Section 0/2 file lists are hard-scoped to `["title.js", "select.js"]` only; must add `src/mechanics/door.js` and `src/ui/challenge.js` or the a727c13 gate will not actually cover these two new modules.

*The import-safety and structural-firewall gates are pre-existing infrastructure this phase must extend before/with the modules they guard.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| End-of-level gate still works identically after extraction | MECH-01 | Runtime rendering/interaction behavior; static grep cannot prove the existing gate still boots/plays identically | Serve over HTTP, play level-01 to the goal, answer correctly, confirm identical behavior to pre-extraction (banner, XP, return-to-select) |
| Door blocked → answer → opens → path clear | MECH-02 | Runtime collision/collider-removal behavior; static grep cannot prove the door physically opens | Walk into the locked door, confirm blocked; answer correctly; confirm the door disappears and the path is walkable; confirm a wrong answer never consumes a key/locks out/sends her back |
| Overlay pause + z-order next to a hazard | success criterion #3 | Player-freeze and screen-space z-order over world+parallax are runtime-only properties; this project has no headless DOM/canvas test harness (deliberate) | Open the door challenge with a hazard (spike) nearby; confirm the player cannot move/fall/be hurt while the overlay is open, and the overlay renders above the world |

*The structural gates are the automated backstop; the real browser boot is the mandatory final gate (established project convention).*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (check-gate.sh restore, check-import-safety.sh extension)
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
