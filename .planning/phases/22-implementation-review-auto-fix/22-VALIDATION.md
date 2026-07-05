---
phase: 22
slug: implementation-review-auto-fix
status: draft
nyquist_compliant: false
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

*To be filled from PLAN.md task IDs by the planner/executor. Baseline rule for every fix task in this phase:*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 22-XX-XX | — | — | FIX-01 | — | N/A | gate suite | quick command above | ✅ | ⬜ pending |
| 22-XX-XX | — | — | FIX-01 | — | N/A | interactive | `node scripts/browser-boot.mjs` | ✅ | ⬜ pending |

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
