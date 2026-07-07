---
phase: 26
slug: grunge-palette-nox-run-rebrand
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-07
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (no JS test framework) — shell gate scripts (`scripts/check-*.sh`) + Playwright-driven browser scripts (`scripts/browser-boot.mjs`, `scripts/audit-phase21-mechanics.mjs`) ARE the suite, per project convention |
| **Config file** | none — see Wave 0 gaps below |
| **Quick run command** | `bash scripts/check-safety.sh && node scripts/validate-levels.mjs` |
| **Full suite command** | `bash scripts/check-gate.sh && bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-progress.sh && node scripts/validate-levels.mjs && node scripts/browser-boot.mjs` |
| **Estimated runtime** | ~90s (full suite, matches Phase 25's evidence) |

---

## Sampling Rate

- **After every task commit:** `bash scripts/check-safety.sh` (fast — catches timer/glyph/scheduler regressions immediately)
- **After every plan wave:** Full suite command above, plus the two NEW gates (`check-rebrand.sh`, `check-contrast.mjs`) once Wave 0 creates them
- **Before `/gsd-verify-work`:** Full suite green + all human-sign-off items closed (palette hazard-readability, per-level themes, door/enemy sprites, logo, logo reveal)
- **Max feedback latency:** ~90s (full suite)

---

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists |
|--------|----------|-----------|---------------------|-------------|
| VIS-01 | `CONFIG.PALETTE` exists; no scene/UI file has a raw `[0x.., 0x.., 0x..]` color literal outside `config.js` | static/manual | `grep -rn "= \[0x" src/scenes/ src/ui/ src/fx.js src/levels/build.js` returns zero rows (new negative-grep check) | ❌ Wave 0 |
| VIS-02 | Every named palette role clears WCAG AA (4.5:1 text / 3:1 UI); no hue in the banned magenta/pink band | automated | `node scripts/check-contrast.mjs` (NEW) | ❌ Wave 0 |
| VIS-03 | All 8 levels render visually distinct backgrounds/accents in the running game | manual (human sign-off, per 26-CONTEXT.md mandate) | screenshot each level via extended `browser-boot.mjs` or manual playtest | ❌ Wave 0 |
| VIS-04 | Door and each enemy variant render as real sprites; collision/trigger behavior unchanged | automated (existing) + manual | `node scripts/audit-phase21-mechanics.mjs` — `triggered: true` for every door/enemy encounter, unchanged from pre-VIS-04 baseline — plus human visual sign-off | ✓ existing harness |
| BRAND-01 | Logo renders legibly at both baked sizes, at real title-screen scale | manual (human sign-off) | in-browser screenshot at actual canvas size (640×360 internal, 1.5× displayed) — inherently a human-judgment check per PITFALLS.md Pitfall 13 | ❌ Wave 0 |
| BRAND-02 | Zero un-allowlisted "math lab"/"mathlab" occurrences remain | automated | `bash scripts/check-rebrand.sh` (NEW — permanent grep + allowlist gate) | ❌ Wave 0 |
| BRAND-03 | Logo reveal animation completes in ≤500ms, one-shot, non-strobing | automated (timing) + manual (visual) | `bash scripts/check-safety.sh` already bans `setTimeout`/`setInterval`/`wait()`/`loop()` — reveal must use `tween()` only; ≤500ms duration is a manual check against the config constant | ✓ existing `check-safety.sh` covers the no-scheduler half |

---

## Per-Task Verification Map

Populated by the planner once tasks are drafted — every task in Waves 1+ must map to one of the automated commands above (or an explicit Wave 0 dependency) per the Phase Requirements → Test Map. No 3 consecutive tasks may lack an automated `<verify>`.

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/check-rebrand.sh` — new permanent negative-grep gate for BRAND-02 (allowlist: historical school-game comments only — the save-key literal is explicitly NOT allowlisted per 26-CONTEXT.md's save-key decision)
- [ ] `scripts/check-contrast.mjs` — new WCAG ratio calculator for VIS-02, reading `CONFIG.PALETTE`
- [ ] Negative-grep check for VIS-01 (no raw color-array literals outside `config.js` in scene/UI files) — fold into `check-safety.sh` or a new small script
- [ ] Per-level screenshot/visual-diff capability for VIS-03's 8-theme sign-off — extend `scripts/browser-boot.mjs` or add a dedicated screenshot script (precedent: `scripts/screenshot-phase20.mjs`)
- [ ] `assets/_font-src/` and `assets/_opengameart-src/` directories — do not exist yet, need creating with the same license-proof discipline as `assets/_kenney-src/`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| Per-level theme readability/distinctness | VIS-03 | Visual/subjective "does this read as distinct and still dark-grunge" judgment; no automated perceptual-difference gate exists in this project | Walk all 8 levels in a served browser, confirm each reads as visually distinct while keeping hazard/reward colors legible |
| Door/enemy sprite quality and fit | VIS-04 | New art asset — same "no auto-approval" standard as all prior CC0 art in this project | View each door and enemy variant in the running game at native scale |
| Logo legibility at real sizes | BRAND-01 | Contrast-trap risk explicitly called out in PITFALLS.md Pitfall 13 — dark-green-on-black readability is a squint-test judgment, not a ratio a script can fully substitute for | View the title screen at actual canvas scale (640×360 internal, 1.5× displayed), squint-test at both baked sizes |
| Logo reveal feel | BRAND-03 | "Non-strobing" and "premium feel" are subjective animation-quality judgments beyond the automated no-scheduler/duration checks | Watch the reveal play on a fresh title-screen load |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
