---
phase: 22
slug: implementation-review-auto-fix
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-05
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (no JS test framework by design) — shell gate scripts + Node/Playwright audit harness |
| **Config file** | none — scripts are self-contained in `scripts/` |
| **Quick run command** | `bash scripts/check-gate.sh && bash scripts/check-import-safety.sh && bash scripts/check-safety.sh && bash scripts/check-progress.sh && node scripts/smoke-progress.mjs` |
| **Full suite command** | quick command + `node scripts/browser-boot.mjs` (interactive drive, all 4 levels) |
| **Estimated runtime** | quick ~10s; full ~2–4 min (Playwright boot + 4-level drive) |

---

## Sampling Rate

- **After every task commit:** Run the quick command (static gates + smoke)
- **After every plan wave:** Run the full suite command (includes interactive browser drive)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~240 seconds (full suite)

---

## Per-Task Verification Map

*Filled from PLAN.md task IDs during planning (2026-07-05). Baseline rule for every fix task in this phase: quick command after every commit; browser-boot at cluster/wave boundaries; 16-encounter audit at mechanic-cluster and phase boundaries (diffed row-by-row vs the recorded baseline, never by exit code).*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 22-01 | 1 | FIX-01 | T-22-05 | gate assertions preserved byte-identical | gate determinism | 20-run loop of `bash scripts/check-gate.sh` + structural greps | ✅ | ⬜ pending |
| 22-01-02 | 22-01 | 1 | FIX-01 | — | N/A | full-suite baseline | quick command + `node scripts/browser-boot.mjs` + `node scripts/audit-phase21-mechanics.mjs` | ✅ | ⬜ pending |
| 22-02-01 | 22-02 | 2 | FIX-01 | T-22-03 | canvas-only rendering (no DOM sink) | gate suite | quick command | ✅ | ⬜ pending |
| 22-02-02 | 22-02 | 2 | FIX-01 | T-22-06 | guards follow WR-03 reset-in-onSuccess shape | gate suite + greps | quick command + WR-03 presence greps | ✅ | ⬜ pending |
| 22-02-03 | 22-02 | 2 | FIX-01 | — | N/A | interactive | `node scripts/browser-boot.mjs` + audit row-diff vs baseline | ✅ | ⬜ pending |
| 22-03-01 | 22-03 | 3 | FIX-01 | — | N/A | gate suite | quick command | ✅ | ⬜ pending |
| 22-03-02 | 22-03 | 3 | FIX-01 | T-22-01 | HUD/select one-way contract intact | interactive | `node scripts/browser-boot.mjs` + `bash scripts/check-progress.sh` | ✅ | ⬜ pending |
| 22-04-01 | 22-04 | 4 | FIX-01 | — | N/A | gate suite | quick command | ✅ | ⬜ pending |
| 22-04-02 | 22-04 | 4 | FIX-01 | T-22-01 | save-blob validation intact (version gate, field copy, finite guards, quota) | gate suite + smoke | quick command + `node scripts/smoke-progress.mjs` | ✅ | ⬜ pending |
| 22-04-03 | 22-04 | 4 | FIX-01 | — | level descriptors byte-identical to baseline | interactive + git diff | `git diff --quiet <baseline>..HEAD -- <level descriptors>` + `node scripts/browser-boot.mjs` | ✅ | ⬜ pending |
| 22-05-01 | 22-05 | 5 | FIX-02 | T-22-08 | decisions recorded before implementation | manual (checkpoint:decision) + grep | zero undecided entries + ≥3 Decision lines in 22-FINDINGS.md | ✅ | ⬜ pending |
| 22-05-02 | 22-05 | 5 | FIX-02 | T-22-08 | no fix commit predates approval (git-log order) | gate suite | quick command | ✅ | ⬜ pending |
| 22-05-03 | 22-05 | 5 | FIX-01 | T-22-01 | LOCKED surfaces diff-proven untouched | full suite | quick command + browser-boot + audit row-diff + LOCKED-surface `git diff --quiet` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — the static gate scripts and the hardened interactive audit harness (v4.1 Phase 21) already exist and are green on HEAD. Wave 0 for this phase is capturing the pre-fix BASELINE run (all gates + interactive audit green, output recorded in 22-FINDINGS.md) before any fix commit lands.

- [ ] Baseline run recorded: full suite green on unmodified HEAD, output captured

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| FIX-02 escalation round | FIX-02 | Approval decisions are inherently human | Present batched design-change findings via AskUserQuestion; record approve/reject per item in 22-FINDINGS.md |
| Visual spot-check of UX fixes | FIX-01 | Rendering correctness (visibility, overlap, contrast) needs eyes on screenshots | Screenshot affected surfaces via the audit harness before/after each UX fix |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 240s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
