# Project Research Summary

**Project:** Nox Run (formerly Math Lab) — v5.0 "Nox Run — Real Levels"
**Domain:** No-build browser 2D platformer (vendored Kaplay 3001.0.19) — subsequent-milestone integration research
**Researched:** 2026-07-05
**Confidence:** HIGH

## Executive Summary

v5.0 adds audio/SFX + ambient music, scales 4 levels to 8 longer guaranteed-playable levels, expands the dark-grunge palette, rebrands Math Lab → Nox Run with a dark-green/black logo, and drops tables 1 & 10 from the practice rotation — all on a working, kid-validated game. The headline stack finding: **zero new runtime dependencies are needed.** The vendored Kaplay 3001.0.19 already ships the full audio surface (`loadSound` buffer SFX, `loadMusic` streaming, `play()` options, `setVolume`/`getVolume`, `audioCtx`) — verified by direct source inspection of the minified build. New level validation is a pure-Node static analyzer over the already-node-importable level descriptors; logo and palette are extensions of the existing Pillow art pipeline. The only new files are CC0 audio assets (Kenney SFX, OpenGameArt ambient loops, OGG format) and one build-time-only CC0 pixel font.

The dominant risk is **not** "can we build these features" — it's regression and false confidence on a shipped product. Four risks tower over everything: (1) audio leaking or stacking across the strictly anti-leak scene system (Kaplay sound handles survive `go()`), (2) the rebrand renaming the `mathlab_platformer_v2` localStorage key and wiping the one save that matters, (3) new levels shipping below the v4.1 interactive-audit bar (the Playwright driver already can't reach 6/16 encounters — doubling content grows that blind spot), and (4) a static validator that models physics the engine doesn't have, green-stamping unwinnable geometry. All four have concrete, cheap preventions identified in PITFALLS.md.

The recommended approach is dependency-driven ordering: implementation review + auto-fix first (clean base), then the static level validator (`scripts/validate-levels.mjs`) **before any level authoring** so all 8 levels are validated as written, then fix/lengthen the existing 4, then author 5–8 with the new difficulty ramp, then palette centralization + expansion, then rebrand (save key explicitly untouched), then audio last so SFX hooks land on the final mechanics set, closing with a full verification pass and human sign-off (v4.1 lesson: interactive proof, not code review).

## Key Findings

### Recommended Stack

Nothing new at runtime. Everything v5.0 needs is served by the vendored engine, static assets, and existing build/audit tooling. Do not add Howler.js, npm/package.json, or upgrade Kaplay to 4000-series.

**Core technologies:**
- **Kaplay 3001.0.19 audio API (vendored):** `loadSound` for all SFX (zero-latency buffer replay), `loadMusic` for streaming ambient tracks (doesn't block boot loading), `setVolume`/`getVolume` for master mute. **`volume(n)` is deprecated in this exact build — use `setVolume`.** Music-handle `detune` is a no-op. No audio buses exist — music/SFX balance lives in a ~60-line `src/audio.js` wrapper.
- **OGG Vorbis** for all audio: MP3's encoder padding makes gapless ambient loops impossible; OGG loops sample-accurately. Target is Chrome/Edge/Firefox on Windows — Safari's OGG gap is irrelevant. Sources: Kenney CC0 packs (SFX/jingles), OpenGameArt CC0 calm/ambient collection (music), vendored with the existing license-proof discipline.
- **Node ≥18 static analyzer** (`scripts/validate-levels.mjs`, zero deps): imports the pure-data level modules directly, builds a reachability graph from the CONFIG-derived jump envelope (rise ≈96.6px, flat-gap ≈178px, with ~0.85 safety factor), asserts spawn→goal path, doors-not-over-holes, mechanic reachability. Exits non-zero — a real gate (unlike the always-exit-0 `audit-phase21` pattern).
- **Pillow 10.2.0 (existing)** renders the Nox Run logo as pre-baked PNG(s) via a CC0 pixel TTF (monogram, first choice) — reject runtime Kaplay text styling for the wordmark. Palette expansion is named tokens in the existing remap pipeline; per-theme sub-palettes give the 8 levels visual identity.

**Critical verified gotcha:** this Kaplay build has **no gesture unlock hook** — `audioCtx` stays suspended until code resumes it. Start music + `audioCtx.resume()` inside the title screen's existing press-to-start handler; never at module load.

### Expected Features

**Must have (table stakes) — v5.0 launch set:**
- Core SFX (jump, land, pickup, shared correct, **soft neutral wrong — never a buzzer**, door/gate, level-clear fanfare) wired once into the shared challenge-resolution path so all mechanics sound identical
- 2–3 calm ambient OGG loops (1–2 min, seamless), gesture-gated start, music mixed clearly below SFX
- Mute toggle (M key), persisted — in a **separate localStorage key**, not the progress save
- 8 levels: 1–4 lengthened (append, don't edit kid-validated sections), 5–8 new; checkpoint respawns scale with length; teach-test-twist pacing; rest beats; tables 1 & 10 dropped via per-level pools
- Structural validator with all 8 levels passing + interactive start→goal runs
- Level select scaled to 8: 2×4 grid on one screen (single row overflows the 640px canvas per the existing IN-03 flag), existing lock/unlock/cleared semantics, next-level glow ≤500 ms
- Nox Run dark-green/black wordmark + full string sweep; save data intact; logo human-signed-off with a light/neon separation element (dark-green-on-black is a contrast trap by spec)
- Per-level background/accent tinting with contrast re-checked per theme

**Should have (differentiators, mostly v5.x):** ADHD-safe audio mix as a designed feature (music ~0.3–0.4 of SFX), verticality segments in late levels, one secret XP alcove per level, logo reveal animation.

**Defer / anti-features:** worlds map (earns keep at ~12+ levels), star ratings (shame-spiral risk), danger-reactive music (audio version of the banned timer), full audio options menu, maze/branching levels, recoloring the signed-off v4.1 sprites, renaming the localStorage key.

### Architecture Approach

Every feature attaches to a verified existing seam; the v4.0 data spine was built for exactly this scaling. New app-lifetime singleton `src/audio.js` (imports only config.js, engine calls inside function bodies per a727c13, documented anti-leak exception like game.js's `onHide`); `playMusic()` must be **idempotent** — the single contract that kills both music-stacking-on-death and cross-scene leaks. SFX hook points are exact and enumerated (challenge.js `choose()` branches cover door/gate/enemy/mathGate in one seam; collect.js needs its own; player.js jump/land seams; game.js coin/clear/level-up seams — never also hook mechanics' `onSuccess` or clears double-fire). Levels 05–08 are pure-data descriptors + a registry append; `LEVEL_ORDER`, unlock chain, select tiles, and the boot-gate save blob all derive automatically. `play("ambient", { loop: true })` passes the SAFE-01 gate (property form allowed; call form banned).

**Major components:**
1. `src/audio.js` (NEW) — app-lifetime audio manager: idempotent music, per-cue SFX functions, mute persisted under its own key (`CONFIG.AUDIO.KEY`), mirroring progress.js's guarded-storage idiom without importing it
2. `scripts/validate-levels.mjs` (NEW) — static geometry linter over LEVELS; primary structural gate; complements (not replaces) the Playwright dynamic drive
3. `src/levels/level-05..08.js` (NEW) + lengthened 01–04 — pure data; explicit `bounds` on every level; ramp table [2,3,4,5]→[6,7,8,9] with a mixed-review level 07
4. `CONFIG.PALETTE` + `CONFIG.AUDIO` — centralize today's module-local color literals before expanding; single tuning surface shared with the Python pipeline
5. `assets/logo.png` + rebrand sweep — grep-verified touchpoint inventory exists in ARCHITECTURE.md; `SAVE.KEY` explicitly excluded

**Tables 1 & 10 precision (must be recorded in requirements):** table 1 is dropped purely via level `allowedTables` pools — zero brain changes. Table 10 **was never in the rotation** (brain clamps to 1..9) — that half is satisfied by documentation. However, ×10 *questions* still occur via the multiplicand roll (`b = 1..10`); if the intent is "no ×10 questions," that's a one-literal change inside the LOCKED brain — escalate as an explicit yes/no decision, don't silently interpret.

### Critical Pitfalls

1. **Autoplay-suspended AudioContext** — music started before first gesture silently no-ops; works in dev, fails on her machine. Start music inside the press-to-start handler; assert `audioCtx.state === "running"` in the boot gate; test once in fresh incognito.
2. **Music stacking / scene leaks** — Kaplay handles outlive `go()`; death-restart stacks loops. Idempotent `playMusic()` manager; verification: "die twice, listen" + "exit to select, listen" + handle-count boot-gate assertion.
3. **Save wiped by the rebrand** — find/replace on "mathlab" catches `mathlab_platformer_v2`. The storage key is not part of the brand; keep it with a comment; verify a pre-rebrand blob resumes post-rename. Allowlist the school-game key-avoidance comments in progress.js.
4. **Audit coverage silently degrading** — the driver's 6/16 unreachable-encounter blind spot grows with 8 longer levels. Upgrade the harness before/alongside level authoring; explicit coverage bar: every encounter driven or individually excepted.
5. **Validator false confidence** — theoretical jump envelope ≠ real clearable gap. Derive from CONFIG, calibrate empirically against the running engine once, keep the interactive start→goal run as the gate (static pass alone ≠ done), and require the validator to catch the two *known* live bugs (door-over-hole, unreachable areas) before it's trusted.

Also high-salience: ADHD-safe audio criteria written into the plan before picking sounds (no buzzers, no startle stingers); palette centralization before expansion with a recorded contrast-ratio role table and an explicit banned-hue band around magenta/pink; level-01's geometry-pinning smoke fixture must be consciously re-baselined (not deleted) when lengthened.

## Implications for Roadmap

Based on research, suggested phase structure (mirrors ARCHITECTURE.md's dependency-driven build order):

### Phase 1: Implementation Review + Auto-Fix
**Rationale:** Milestone feature; touches everything, so it precedes content multiplication — a clean base before building on it.
**Delivers:** Reviewed/fixed codebase; known defects (door-over-hole, unreachable areas) inventoried.
**Avoids:** Compounding existing bugs into 2× the level content.

### Phase 2: Validation Harness (Static Linter + Dynamic Upgrade)
**Rationale:** Highest-leverage ordering decision in the milestone (Pitfalls 6–7). Must exist before any level authoring; built against the existing 4 levels it must immediately flag the known live bugs.
**Delivers:** `scripts/validate-levels.mjs` (reachability graph, gap-width, door-over-hole, checkpoint-density, mechanic-on-floor checks; non-zero exit; envelope calibrated empirically); mechanic-drive spike-awareness or teleport-near fallback; explicit encounter-coverage bar.
**Avoids:** Validator false confidence; audit blind-spot growth; the v4.0 soft-lock pattern repeating.

### Phase 3: Fix + Lengthen Levels 1–4
**Rationale:** Data-only edits gated by the new validator; establishes authoring conventions before new levels.
**Delivers:** 4 lengthened levels green on both layers; explicit bounds on level-01; smoke fixture deliberately re-baselined; append-don't-edit for kid-validated sections; checkpoint density scaled.
**Avoids:** Copy-paste drift, fixture trap, checkpoint-density violation.

### Phase 4: Levels 5–8 + Select Grid + Difficulty Ramp + Table Drop
**Rationale:** Registry append auto-propagates everywhere; ramp and pools designed as one reviewed table.
**Delivers:** 4 new pure-data levels (one twist each, verticality, rest beats); select.js 2×4 grid; ramp [2,3,4,5]→[6,7,8,9]; table 1 out of all pools; table-10/multiplicand decision recorded; save extension for levels 5–8 locked-by-default.
**Avoids:** Difficulty spikes, question fatigue (hold encounter budget ~constant), brain.js edits (LOCKED — verify zero diff in `src/math/`).

### Phase 5: Palette Centralization + Expansion
**Rationale:** Centralize duplicated module-local color literals into `CONFIG.PALETTE` first, then expand once; must precede the logo so the logo is designed against the final palette.
**Delivers:** Named-role palette table with recorded contrast ratios; per-theme sub-palettes in the Python pipeline; hue-tinted darks (moss green, blue-grey, rust) within the sign-off-validated luminance band; no-pink guardrail.
**Avoids:** Contrast regressions, hazard/decor semantic confusion, palette drift.

### Phase 6: Rebrand (Nox Run)
**Rationale:** After palette (logo on final tokens); the one dangerous interaction with persistence handled as a stated non-goal.
**Delivers:** Pillow-rendered logo PNG (CC0 pixel font, light/neon separation element), title.js sprite swap, grep-driven string sweep with allowlist (save key + school-game comments), README/docs/docker rename, permanent negative grep gate.
**Avoids:** Save-key wipe (pre-rebrand blob resume check), stale-brand scatter, invisible dark-green-on-black logo (human sign-off at real sizes in the running game).

### Phase 7: Audio
**Rationale:** Last feature phase so SFX hooks land on the final mechanics/level set (independent enough to move earlier if parallelizing).
**Delivers:** `src/audio.js` singleton, CONFIG.AUDIO, loadSound block in main.js, gesture-gated music start in title.js, exact seam hooks (challenge/collect/player/game), M-key mute persisted under its own key, CC0 OGG assets with license proofs, .ogg MIME in script servers, boot-gate audio assertions (ctx running, single music handle after die/leave).
**Avoids:** Autoplay silence, stacking/leaks, MP3 loop seam, save-schema coupling, ADHD-unsafe mix (written criteria + human/kid sign-off).

### Phase 8: Full Verification Pass
**Rationale:** v4.0's lesson never expires — checks that don't play the game lie.
**Delivers:** browser-boot across all 8 levels, validator green, check-safety green, encounter-coverage report, fresh-incognito audio check, pre-rebrand save resume check, human interactive sign-off on levels/art/audio.

### Phase Ordering Rationale

- **Validator before content:** without it every level edit means another hand audit ×8; with it structural correctness is free on every change (all three research files independently converge on this).
- **Checkpoints ship with lengthening:** longer levels without respawn anchors would reduce ADHD-safety relative to v4.1 — one feature from the player's perspective.
- **Palette before logo; audio last:** the logo is designed against final tokens; SFX hooks against final seams.
- **Rebrand isolated:** its only dangerous coupling (save key/origin) is neutralized by stating it as a non-goal with a resume-check.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 7 (Audio):** exact Kaplay 3001 `play()` handle semantics, volume model, and autoplay-resume behavior of this specific vendored build — re-verify against `lib/kaplay.mjs` before implementing.
- **Phase 2 (Validator):** hop-envelope edge cases — diagonal platform-to-platform hops, blocker-bypass geometry, and the one-time empirical calibration run against the real engine.

Phases with standard patterns (skip research-phase):
- **Phases 3–4 (level authoring), 5 (palette), 6 (rebrand):** pure applications of existing, verified repo patterns — descriptor schema, remap pipeline, grep sweep. No external unknowns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Kaplay audio API verified by direct inspection of the vendored minified build (not docs); tooling claims verified against the live repo. Asset-source/format claims MEDIUM (web-cross-checked). |
| Features | MEDIUM | Web-sourced genre conventions cross-checked; ADHD-safe audio principles established but individual response varies — validate in kid-UAT. |
| Architecture | HIGH | Every integration point read from the live source tree; exact file/line seams enumerated. |
| Pitfalls | HIGH | Grounded in this repo's own v4.0/v4.1 scar tissue plus direct engine-source inspection; web findings MEDIUM. |

**Overall confidence:** HIGH

### Gaps to Address

- **×10 multiplicand decision:** "drop table 10" is ambiguous — rotation (already impossible) vs. no ×10 questions at all (one-literal change inside the LOCKED brain). Escalate as an explicit requirements decision; do not interpret silently.
- **Jump-envelope calibration:** the ≈96px/≈178px numbers are closed-form theory; the validator must use an empirically measured envelope minus margin (one-time Playwright measurement task in Phase 2).
- **ADHD-safe audio in practice:** mix-hierarchy guidance is directional, not spec; the real gate is human/kid sign-off on the assembled sound set.
- **Kaplay music-handle edge semantics:** presence verified HIGH; exact streaming-handle behavior (seek/onEnd under loop) MEDIUM — verify during the audio phase.
- **Title-screen convention evidence is thin** (pattern databases, no formal literature) — low risk; sign-off covers it.

## Sources

### Primary (HIGH confidence)
- `lib/kaplay.mjs` @ 3001.0.19 — direct source inspection: full audio API surface, `volume()` deprecation, no gesture-unlock hook, tab-hide suspend
- Live repo tree — `src/config.js`, `progress.js`, `levels/*`, `scenes/*`, `ui/challenge.js`, `mechanics/*`, `player.js`, `fx.js`, `scripts/check-safety.sh`, `browser-boot.mjs`, `mechanic-drive.mjs`, docker config, PROJECT.md v4.x history

### Secondary (MEDIUM confidence)
- MDN/Chrome autoplay + Web Audio best practices — gesture requirement, user audio controls
- Kenney CC0 audio packs; OpenGameArt CC0 calm/ambient collections; monogram/Public Pixel CC0 fonts — asset sourcing
- caniuse OGG Vorbis; gapless-loop community sources — MP3 loop-gap, OGG choice
- Platformer level-design literature (RetroStyleGames, gamedesignskills, UCSC framework) — pacing, checkpoints, teach-test-twist
- Sensory-safe/ADHD audio design sources (Springer, BOIA, kid-UX guides) — gentle-error convention, no-startle mix
- Dark-mode contrast guidance (BOIA, DubBot) — WCAG on dark themes, desaturate-and-lighten accents

### Tertiary (LOW confidence)
- Game UI Database title-screen conventions — pattern evidence only; validated by sign-off, not research

---
*Research completed: 2026-07-05*
*Ready for roadmap: yes*