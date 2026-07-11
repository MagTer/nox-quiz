---
phase: 32
slug: terrain-parallax-rendering
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-11
---

# Phase 32 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (project convention) — shell gate scripts + Playwright-driven `.mjs` scripts ARE the test suite (no pytest/jest/vitest) |
| **Config file** | none |
| **Quick run command** | `node scripts/validate-levels.mjs` (fast, pure-data, geometry-only — proves ART-02/03 rendering changes didn't touch geometry, success criterion #5) |
| **Full suite command** | `bash scripts/check-gate.sh && bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-progress.sh && node scripts/check-assets-manifest.mjs && node scripts/validate-levels.mjs && node scripts/browser-boot.mjs` |
| **Estimated runtime** | ~60-90 seconds (browser-boot.mjs dominates, drives all 8 levels headless) |

---

## Sampling Rate

- **After every task commit:** `node scripts/validate-levels.mjs` (fast, geometry-only — catches accidental geometry edits in seconds)
- **After every plan wave:** Full suite command above
- **Before `/gsd-verify-work`:** Full suite must be green, plus a real interactive playtest per this project's "checks that don't play the game lie" verification standard (CLAUDE.md)
- **Max feedback latency:** ~90 seconds (full suite)

---

## Per-Task Verification Map

Seeded from RESEARCH.md's Phase Requirements → Test Map; the planner assigns concrete task IDs as it writes each PLAN.md.

| Requirement | Behavior | Threat Ref | Test Type | Automated Command | File Exists | Status |
|-------------|----------|------------|-----------|-------------------|-------------|--------|
| ART-02 | Ground renders as solid autotiled mass (cap+fill), colliders untouched | — | integration (headless browser) | `node scripts/browser-boot.mjs` (new per-level screenshot check) | ❌ Wave 0 — extend `browser-boot.mjs` | ⬜ pending |
| ART-02 | Fill chunking never silently blanks (batch-limit trap) | — | integration (headless browser, visual) | `node scripts/browser-boot.mjs` (screenshot pixel-non-blank assertion) | ❌ Wave 0 | ⬜ pending |
| ART-02 | Level geometry arrays byte-identical | — | static/structural | `node scripts/validate-levels.mjs` + `git diff` review gate | ✅ existing script, no code change needed | ⬜ pending |
| ART-02 | Perf holds (no FPS regression from fill strategy) | — | integration (headless browser) | `node scripts/browser-boot.mjs` (new `debug.fps()` sampling + object-count budget assertion) | ❌ Wave 0 | ⬜ pending |
| ART-03 | Each biome shows a real multi-layer parallax that moves with camera | — | integration (headless browser, visual) | `node scripts/browser-boot.mjs` (existing per-level visit loop, extended with a screenshot) | ❌ Wave 0 (extend existing loop) | ⬜ pending |
| ART-02/03 (manifest) | Every manifest-declared asset exists on disk | — | static | `node scripts/check-assets-manifest.mjs` | ❌ Wave 0 — new script | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/assets-manifest.js` — the manifest itself (new file, no code exists yet)
- [ ] `scripts/check-assets-manifest.mjs` — the new existence-gate script (new file)
- [ ] `scripts/browser-boot.mjs` extensions — per-level screenshot capture, `debug.fps()` sampling, far-end non-blank check, object-count-budget assertion (new code in an existing file)
- [ ] `CONFIG.TERRAIN` block in `src/config.js` — `FILL_CHUNK_COLS`, `OBJECT_BUDGET`, FPS-floor constant (new config, no magic numbers per project convention)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| Visual quality of autotiled ground + parallax across all 4 biomes | ART-02, ART-03 | Pixel-perfect frame-picking and anomaly workarounds (Cemetery overlay, Castle inverted lip) need a human eye to confirm they read correctly, not just non-blank | Serve locally, visit all 8 levels with `?debug=1`, confirm ground reads as solid (no floating strip, no visible seams at chunk boundaries) and each biome's parallax feels layered and moves correctly with the camera |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
