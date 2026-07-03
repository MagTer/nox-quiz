---
phase: 20
slug: real-cc0-art-redo-human-sign-off
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-03
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (zero-dependency static game) — validation is static shell gates + a real-browser Playwright boot/screenshot script, per project precedent |
| **Config file** | none — see `scripts/check-*.sh`, `scripts/browser-boot.mjs`, `scripts/screenshot-phase18.mjs` |
| **Quick run command** | `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh` |
| **Full suite command** | `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-gate.sh && node scripts/smoke-progress.mjs && node scripts/browser-boot.mjs` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh`
- **After every plan wave:** full suite command above
- **Before `/gsd-verify-work`:** full suite green AND the real, recorded, blocking `AskUserQuestion` human sign-off (PROC-02) — automated green alone is explicitly insufficient
- **Max feedback latency:** ~30 seconds (script gates); human sign-off latency is unbounded (waits for a real response)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 0 | ART-05, PROC-01 | — | N/A | build | `python3 scripts/build-art-assets.py --asset player && python3 -c "from PIL import Image; assert Image.open('assets/player.png').size==(80,32)"` | ✅ (script new, dims existing) | ⬜ pending |
| 20-01-02 | 01 | 0 | ART-06, PROC-01 | — | N/A | build | `python3 scripts/build-art-assets.py --asset ground && python3 -c "from PIL import Image; assert Image.open('assets/tiles/ground.png').size==(80,16)"` | ✅ | ⬜ pending |
| 20-02-01 | 02 | 1 | ART-07, ART-08, PROC-01 | — | N/A | build | `python3 scripts/build-art-assets.py --asset parallax --asset title-bg` + dimension asserts (640x120/144/90/360) | ✅ | ⬜ pending |
| 20-02-02 | 02 | 1 | PROC-01 | — | N/A | static | `grep -ril cc0 assets/LICENSES/*.txt` (all new/rewritten proof files match) + manual cross-reference against `CREDITS.md` rows | ✅ (existing pattern, `09-VERIFICATION.md` precedent) | ⬜ pending |
| 20-03-01 | 03 | 2 | ART-05..08 | — | N/A | smoke | `node scripts/browser-boot.mjs` (title→select→level loads/animates with zero console errors) | ✅ (browser-boot.mjs exists) | ⬜ pending |
| 20-03-02 | 03 | 2 | ART-05..08 | — | N/A | smoke | `node scripts/screenshot-phase20.mjs` (title, select, in-level player+tileset, two parallax-offset camera positions) | ❌ W0 — new script this phase | ⬜ pending |
| 20-03-03 | 03 | 2 | PROC-02 | — | N/A | human, structural | `AskUserQuestion` call presenting the screenshots from 20-03-02, literal response text recorded in `20-VERIFICATION.md` | ❌ W0 — new pattern, no prior script encodes this (Pitfall 7); the executor must design this task explicitly, not treat a passing script as self-certifying | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/build-art-assets.py` — new build pipeline (crop/scale/composite/palette-remap); does not exist yet
- [ ] `assets/_kenney-src/` — staging folder for vendored raw Kenney source; does not exist yet
- [ ] `scripts/screenshot-phase20.mjs` — extends `scripts/screenshot-phase18.mjs`'s pattern to add an in-level shot (player mid-animation, tileset visible) and two camera-X positions showing parallax offset
- [ ] No new test framework install needed — existing zero-dependency validation pattern (static gates + Playwright boot/screenshot) fully covers this phase; the one genuine gap is procedural: an actually-blocking `AskUserQuestion` sign-off task (Pitfall 7), not tooling.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Player silhouette reads clearly against `#0a0a0a` in a real running level | ART-05 | Contrast/legibility is a genuine perceptual judgment; the prior "invisible player" bug shipped despite passing automated checks | Open the live page, watch the player idle/run/jump in-level; confirm silhouette stays visible at all times |
| Ground tiles show real material-transition art with no visible repeat seams | ART-06 | Seam/tiling artifacts are visual, not detectable by a script that only checks file existence/dimensions | Scroll through a full level; look for repeating patterns or visible tile-boundary seams |
| Parallax layers read as composed scenery with a horizon rhythm, camera-driven only | ART-07 | "Composed scenery" vs. "randomly scattered rectangles" is a subjective visual-quality judgment | Walk the full width of a level; confirm layers scroll only with camera movement and depict deliberate scenery, not noise |
| Title/select show real panel framing/hierarchy, no pink | ART-08 | Visual hierarchy and aesthetic fit are perceptual judgments a script cannot make | View title and select screens directly |
| Genuine human sign-off recorded (not automated-checks-only) | PROC-02 | This is the entire point of the requirement — by definition it cannot be automated | `AskUserQuestion` call per 20-03-03 above; response recorded verbatim in `20-VERIFICATION.md` |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies (PROC-02's task is intentionally human/structural, not automatable — this is correct per its own requirement, not a gap)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`build-art-assets.py`, `screenshot-phase20.mjs`, `_kenney-src/`)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s for automated gates
- [ ] `nyquist_compliant: true` set in frontmatter once Wave 0 items exist

**Approval:** pending
