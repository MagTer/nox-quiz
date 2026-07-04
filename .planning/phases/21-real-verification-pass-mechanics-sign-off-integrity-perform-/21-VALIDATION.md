---
phase: 21
slug: real-verification-pass-mechanics-sign-off-integrity
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-04
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (no JS unit-test framework/`package.json` in this project) — validation is a bespoke suite of shell-script structural gates (`check-gate.sh`, `check-import-safety.sh`, `check-safety.sh`, `check-progress.sh`) plus Node smoke scripts (`smoke-progress.mjs`) plus a real-browser Playwright boot (`browser-boot.mjs`) |
| **Config file** | none — each gate is a standalone `.sh`/`.mjs` script in `scripts/` |
| **Quick run command** | `bash scripts/check-gate.sh && bash scripts/check-import-safety.sh && bash scripts/check-safety.sh && node scripts/smoke-progress.mjs` |
| **Full suite command** | Quick run command + `node scripts/browser-boot.mjs` (real browser) + this phase's new `node scripts/audit-phase21-mechanics.mjs` (exhaustive interactive audit, one-off/on-demand rather than per-commit) |
| **Estimated runtime** | ~30-60 seconds for quick run; full suite (with real-browser scripts) ~2-4 minutes |

---

## Sampling Rate

- **After every task commit:** Run `bash scripts/check-gate.sh && bash scripts/check-import-safety.sh && bash scripts/check-safety.sh && node scripts/smoke-progress.mjs`
- **After every plan wave:** Run hardened `node scripts/browser-boot.mjs` + full static suite
- **Before `/gsd-verify-work`:** Full suite must be green, plus one confirmed run of `node scripts/audit-phase21-mechanics.mjs` with findings recorded and fixes re-verified
- **Max feedback latency:** ~60 seconds (quick run); real-browser scripts run less frequently (per wave / phase gate) given their longer runtime

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 0 | VERIFY-01 | T-21-01 | Playwright synthesizes real key input only — no new DOM/markup sink | e2e (Playwright, real key input) | `node scripts/audit-phase21-mechanics.mjs` | ❌ W0 — new script | ⬜ pending |
| 21-01-02 | 01 | 0 | VERIFY-02 | T-21-01 | Same script re-run confirms fixes without introducing new sinks | e2e (re-run of audit script post-fix) | `node scripts/audit-phase21-mechanics.mjs` | ❌ W0 (same script, re-run) | ⬜ pending |
| 21-02-01 | 02 | 1 | VERIFY-03 | T-21-02 | Hardened boot gate still uses existing `try/finally { server.close() }` pattern | e2e (Playwright) | `node scripts/browser-boot.mjs` | ✅ exists, needs hardening | ⬜ pending |
| 21-03-01 | 03 | 1 | VERIFY-04 | — | N/A — doc-only correction | manual_procedural (doc edit) | n/a | n/a — doc-only requirement | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/audit-phase21-mechanics.mjs` — new interactive audit script (VERIFY-01/02), reusing `screenshot-phase20.mjs`'s server/launch skeleton; drives real player movement + real answer input across all 4 levels for `door.js`, `gates.js`, `enemy.js`, `mathGate.js`
- [ ] Hardened assertions inside existing `scripts/browser-boot.mjs` (VERIFY-03) — not a new file, an edit to an existing one, to actually exercise movement and at least one full mechanic resolution per level

*No shared fixture/conftest-equivalent needed — this project has no test-fixture convention beyond the existing save-seed blob pattern already used by all 3 Playwright scripts.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Correcting `v4.0-MILESTONE-AUDIT.md`'s unsupported "human sign-off recorded" claims (Phases 15–18) and the NAV-04 traceability inconsistency | VERIFY-04 | Documentation annotation of historical record — not a runtime behavior, no automated test can assert "this prose accurately reflects history" | Edit `.planning/milestones/v4.0-MILESTONE-AUDIT.md` Phase 14 row + Requirements Coverage table per RESEARCH.md's "VERIFY-04 Reference Material" section; add dated annotation, do not silently rewrite. Optionally correct Phase 15's citation error in `15-VERIFICATION.md` (references STATE.md narrative that doesn't exist; real narrative is in `15-04-SUMMARY.md`). |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`audit-phase21-mechanics.mjs`)
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s (quick run); real-browser scripts sampled per-wave/per-phase-gate
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
