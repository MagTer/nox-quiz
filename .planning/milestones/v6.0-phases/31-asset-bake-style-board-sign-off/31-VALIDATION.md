---
phase: 31
slug: asset-bake-style-board-sign-off
status: reviewed
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-10
---

# Phase 31 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — project convention: shell gate scripts + Python/Pillow scripts ARE the test suite (no pytest/jest, matches every prior phase) |
| **Config file** | none — Wave 0 creates the new script |
| **Quick run command** | `python3 scripts/lib/pink_scan.py assets/tiles/atlas-town.png` (single-asset spot check, once written) |
| **Full suite command** | `bash scripts/check-pink-gate.sh` (scans all vendored assets) |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bash scripts/check-pink-gate.sh` once it exists; before that (re-fetch, style-board regen tasks), rely on visual review only — no automated check exists yet for those early tasks.
- **After every plan wave:** Re-run `bash scripts/check-pink-gate.sh` over the full `assets/` tree.
- **Before `/gsd-verify-work`:** `check-pink-gate.sh` green AND a genuine (non-rubber-stamped) style-board sign-off, both required.
- **Max feedback latency:** ~5 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 31-01 tasks | 01 | 1 | ART-01 | supply-chain (zip download/extraction) | no zip-slip, `.gitignore`d scratch dir | script | `git check-ignore assets/_gothicvania-src/` | ✅ (plan-checker verified) | ⬜ pending |
| 31-02 tasks | 02 | 2 | ART-01 | — / — | N/A | checkpoint:human-verify (blocking, inherently manual) | quoted round-2 sign-off in SUMMARY.md | N/A | ⬜ pending |
| 31-03 tasks | 03 | 2 | ART-01 | — / — | N/A | gate (RED-first on 2 known pink assets, then GREEN post-retint) | `bash scripts/check-pink-gate.sh` | ✅ (plan-checker verified) | ⬜ pending |
| 31-04 tasks | 04 | 3 | ART-01 | — / — | N/A | script (baking) | visual + pink-gate spot check | ✅ (plan-checker verified) | ⬜ pending |
| 31-05 tasks | 05 | 4 | ART-01 | — / — | N/A | script (baking) | visual + pink-gate spot check | ✅ (plan-checker verified) | ⬜ pending |
| 31-06 tasks | 06 | 5 | ART-01 | — / — | N/A | manual/structural + full gate re-run | `bash scripts/check-pink-gate.sh` full tree | ✅ (plan-checker verified) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/check-pink-gate.sh` + `scripts/lib/pink_scan.py` (new HSV dominant-pink-hue scan helper) — does not exist yet, this phase creates it
- [ ] `assets/_gothicvania-src/` (or equivalent scratch/download dir) — does not exist yet, this phase's first task creates it via re-fetch from the OGA URLs in ASSET-SCOUTING.md
- [ ] No framework install needed — Pillow already present (10.2.0, verified installed)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Style-board sign-off is genuine, multi-round, not rubber-stamped | ART-01 | Creative/subjective visual judgment call by a human (parent/kid), matches Phase 26/27 precedent | Regenerate style board with Swamp Hunter + Hell hound, present fresh at execute time, get explicit re-confirmation, quote both rounds in SUMMARY.md |
| CREDITS.md / LICENSES completeness | ART-01 | No existing automated CREDITS-completeness gate anywhere in this repo (established precedent, not a gap unique to this phase) | Manual review: every new vendored file has a CREDITS.md row + a matching `assets/LICENSES/<name>.txt` proof file |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (verified by gsd-plan-checker — only the 31-02 checkpoint:human-verify task lacks one, which is correct: sign-off is inherently manual)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (31-01 creates `check-pink-gate.sh`/`pink_scan.py` and the gitignored source-fetch dir before any dependent task runs)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-10 (gsd-plan-checker pass — 0 blockers, 2 non-blocking process warnings resolved directly)
