---
phase: 37
slug: mobile-responsive-canvas-touch-controls
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-19
---

# Phase 37 — Validation Strategy

> Per-phase validation contract. This project has NO JS test framework — the shell/Playwright
> gates ARE the suite (CLAUDE.md). "Tests" below = those gates + touch-emulated Playwright probes.
> Sourced from 37-RESEARCH.md §Validation Architecture. Backs the nyquist sampling map that
> plans 37-06 (touch-controls-drive) and 37-07 (consolidated suite) reference.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (vanilla ES2020, no build); gates = bash + Node + Playwright touch/desktop contexts |
| **Quick run command** | `node scripts/touch-coordinate-probe.mjs && bash scripts/check-safety.sh && bash scripts/check-import-safety.sh` |
| **Full suite command** | `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-progress.sh && bash scripts/check-gate.sh && node scripts/validate-levels.mjs && node scripts/browser-boot.mjs && node scripts/touch-coordinate-probe.mjs && node scripts/touch-orientation-probe.mjs && node scripts/touch-tap-ui-probe.mjs && node scripts/touch-controls-drive.mjs` |
| **Estimated runtime** | ~120–240s (browser-boot + four touch probes dominate) |

The four NEW permanent touch gates (all dup browser-boot's hardened loopback/ROOT-clamped server + `resolvePlaywright()` per the deliberate-duplication convention):

- `scripts/touch-coordinate-probe.mjs` — RED-first coordinate-desync gate (RED ~480 on the transform build → GREEN ~320 after letterbox). MOB-01.
- `scripts/touch-orientation-probe.mjs` — portrait-vs-landscape `getComputedStyle(#rotate/#stage).display` assertion in a coarse-pointer context. MOB-04.
- `scripts/touch-tap-ui-probe.mjs` — tap resolves a math answer + toggles mute + arms & confirms the title reset. MOB-03.
- `scripts/touch-controls-drive.mjs` — CDP-driven touch: jump rises, held-jump rises higher (variable height), left/right move, left+jump multi-touch. MOB-02.

---

## Sampling Rate

- **Per task commit (fast static):** `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh` + `node scripts/touch-coordinate-probe.mjs`.
- **Per wave merge:** add `node scripts/browser-boot.mjs` (desktop parity — the HARD gate) + `node scripts/validate-levels.mjs` + the touch probe relevant to that wave's requirement.
- **Phase gate (37-07):** full suite green in one pass (existing CLAUDE.md gates + the four permanent touch gates); PLUS a manual desktop-parity visual spot-check (Assumption A1) and an explicit note that MOB-05 real-device audio proof + MOB-06 kid ergonomics are formally DEFERRED to Phase 38.

---

## Per-Requirement Verification Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| MOB-01 | Touch tap at canvas center maps to game-x ≈320 under letterbox (RED ~480 before, GREEN ~320 after) | integration (touch-emu) | `node scripts/touch-coordinate-probe.mjs` | ❌ Wave 0 (author RED-first) |
| MOB-01 | Desktop mouse behavior unchanged — level-select tile clicks + mute-icon click still land; stale comments rewritten | integration | `node scripts/browser-boot.mjs` | ✅ (keep green) |
| MOB-02 | Virtual buttons drive `src/input.js`; jump reuses buffer/coyote/variable-height; held-jump > tapped-jump; left+jump multi-touch; coarse-pointer only | integration (touch-emu) | `node scripts/touch-controls-drive.mjs` | ❌ Wave 0 |
| MOB-02 | No timer + no engine global at module top level in `input.js`/`touchControls.js` | static | `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh` | ✅ |
| MOB-03 | Tap resolves a math answer box (touchToMouse + unified `Qe`) | integration (touch-emu) | `node scripts/touch-tap-ui-probe.mjs` | ❌ Wave 0 |
| MOB-03 | Tap toggles mute; tap arms the title reset confirm; tap Yes/No resolves it (coarse-pointer area()+onClick, keyboard byte-identical) | integration (touch-emu) | `node scripts/touch-tap-ui-probe.mjs` | ❌ Wave 0 |
| MOB-04 | Portrait shows `#rotate` overlay + hides `#stage`; landscape reverses — machine-asserted, not grepped | integration (touch-emu) | `node scripts/touch-orientation-probe.mjs` | ❌ Wave 0 |
| MOB-04 | `touch-action: none` on canvas + scale-pinned viewport meta present; no `screen.orientation.lock()` | static | `grep touch-action / orientation.lock` in `src/index.html` | ✅ (grep) |
| MOB-05 | `AudioContext` resumes on gesture (HEADLESS — NOT the device proof); unlock wired to click/pointerup, never touchstart | integration | existing `assertAudioContextState` in `node scripts/browser-boot.mjs` | ✅ (device proof DEFERRED) |

---

## Wave 0 Requirements

- [ ] `scripts/touch-coordinate-probe.mjs` (37-01) — RED-first permanent gate. Author asserting ≈320, prove RED on the transform build, land the letterbox migration (37-02), prove GREEN.
- [ ] `scripts/touch-orientation-probe.mjs` (37-04) — portrait/landscape overlay `getComputedStyle` assertion in a coarse-pointer context.
- [ ] `scripts/touch-tap-ui-probe.mjs` (37-05) — tap-resolves-answer + tap-toggles-mute + tap-arms-reset + tap-confirms-reset.
- [ ] `scripts/touch-controls-drive.mjs` (37-06) — CDP touch drive: jump/move/variable-height/multi-touch.
- [ ] No new framework install needed (zero-dependency, vendored engine only).

*Existing infra (browser-boot, validate-levels, check-safety, check-import-safety, check-progress, check-gate) covers the rest.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Desktop pixel-parity vs the current transform build ("byte-identical" = behavioral/geometry parity; literal pixels are Assumption A1) | MOB-01 | Letterbox render path differs from CSS transform; taste/legibility is human-judged | Desktop-parity visual spot-check at Phase-38 UAT; if pixels visibly differ and that's unacceptable, the letterbox-only-on-touch device-branch fallback is documented (avoid unless forced). |
| Audio genuinely starts after the FIRST real touch on an iOS device (`touchstart` is not an activation event) | MOB-05 | Playwright synthetic taps DO grant user-activation, so the headless gate passes even where a real iPhone would fail (Assumption A3) | DEFERRED to Phase 38 on-device gate — verify on a real iOS device, not headless. |
| Touch button size/placement fits the kid's actual hands | MOB-06 | Ergonomics require watching her play on her device | DEFERRED to Phase 38 (MOB-06 kid tuning). |

---

## Deferred to Phase 38 (out of this phase's buildable scope)

- MOB-05 real-device audio-activation PROOF (headless taps grant activation — cannot be proven here; A3).
- MOB-06 kid touch-layout tuning (button size/placement from observed play; A2 device predicate).
- iOS ITP ~7-day localStorage eviction — DOCUMENTED as expectation only; no backend fix; the laptop stays the progress home (A4).
- Desktop pixel-parity spot-check (A1).

---

## Validation Sign-Off

- [ ] RED-first coordinate probe recorded RED (~480) then GREEN (~320)
- [ ] All four permanent touch gates green (coordinate, orientation, tap-ui, controls-drive)
- [ ] browser-boot desktop parity green (mouse audits + keyboard drive + audio gesture-gate)
- [ ] check-safety + check-import-safety + check-progress + check-gate + validate-levels green
- [ ] MOB-05 device proof + MOB-06 tuning explicitly recorded as deferred to Phase 38
- [ ] `nyquist_compliant: true` set

**Approval:** pending
