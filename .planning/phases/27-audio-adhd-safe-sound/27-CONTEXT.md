# Phase 27: Audio & ADHD-Safe Sound - Context

**Gathered:** 2026-07-08
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — user stepped away before this phase started ("make recommended choices"); all 4 grey areas auto-accepted on their recommended answer, zero overrides. No area needed the "Discuss deeper" path — REQUIREMENTS.md's AUD-01..04 text and STATE.md's cross-cutting mitigations already locked most of the real ambiguity.

<domain>
## Phase Boundary

The game sounds alive — calm ambient music and satisfying SFX she can mute, with a mix designed to never startle. Delivers AUD-01 (core SFX set), AUD-02 (ambient music loop), AUD-03 (persisted M-key mute), AUD-04 (ADHD-safe mix + human sound sign-off). Zero new runtime dependencies — Kaplay 3001's built-in audio API only (`loadSound`/`play`/AudioPlay handle). Per SEED-001, this phase should wrap lean — no per-level themed music, no options menu (that's AUD-FUT-01).

</domain>

<decisions>
## Implementation Decisions

### SFX/Music Sourcing & Asset Pipeline
- CC0 source: Kenney.nl audio packs — continues the exact sourcing/attribution convention already used and credited for every art asset (CREDITS.md, `assets/LICENSES/`)
- Vendored format: OGG Vorbis, converted/trimmed via `ffmpeg` (confirmed present on this host) — matches AUD-02's "seamless OGG" wording
- File layout: `assets/sfx/*.ogg` + `assets/music/*.ogg`; raw source packs vendored under `assets/_kenney-src/` (or a new sibling `_audio-src/` if pack structure doesn't fit cleanly), mirroring the existing `_kenney-src` / `_opengameart-src` split
- Licensing proof: same discipline as art — one CREDITS.md row + one `assets/LICENSES/<name>.txt` proof file (source URL + quoted CC0 declaration) per vendored asset, verified before vendoring, before any phase-close claim

### SFX Event Mapping
- Jump: short, soft blip on the existing jump input point (`player.js` JUMP_KEYS press handler). Land SFX is optional — include only if it doesn't add unwanted noise density: judgment call at implementation time
- Correct answer: bright-but-soft positive chime, wired at the ONE shared challenge seam (`src/ui/challenge.js`, the `correct` branch around its answer-resolution point) — never duplicated per-mechanic
- Wrong answer: soft neutral tone ONLY — this is a hard requirement (REQUIREMENTS.md Out of Scope: "Buzzer / harsh wrong-answer sound... ADHD-unsafe"), not a preference
- Door/gate open: short distinct "unlock" cue, separate from the correct-chime so gate-clear reads as its own event
- Level-clear (mathGate.js): calm, non-fanfare resolve cue — celebratory but not a blast, matching the project's "no pressure" tone
- Pickup/collect: light pluck/pop, audibly distinct from the correct-chime

### Ambient Music Design
- ONE calm ambient loop for the entire game — explicitly NOT per-level/per-theme variation. SEED-001 (`.planning/seeds/SEED-001-v6-snes-fidelity-world-overhaul.md`) already put the project on notice to wrap v5.0 lean and not gold-plate; extending that discipline to audio richness
- Start trigger: gesture-gated inside `src/scenes/title.js`'s existing press-to-start handler (`const start = () => go("select")`, title.js:105) — this Kaplay build has no gesture-unlock hook, so music + `audioCtx.resume()` must start there, never at module load (already recorded in STATE.md Cross-Cutting Mitigations #4)
- Persistence across scenes: one idempotent music-manager instance/module that survives `go()` scene transitions with zero stacking/leaking (AUD-04, STATE.md mitigation #2) — repeated calls to "ensure music playing" must be safe to call from every scene's mount
- Music vs SFX balance: music mixed well below SFX (starting reference ~30-40% of SFX gain); exact number is Claude's discretion, tuned by ear and confirmed at the human sound sign-off checkpoint

### Mute Control & ADHD-Safe Mix
- Mute key: `m` (confirmed unused via codebase-wide onKeyPress grep — no collision with existing bindings)
- Single toggle mutes both music and SFX together (AUD-03 describes one mute, not independent channels — per-channel sliders are explicitly AUD-FUT-01, out of scope here)
- Persistence: its own localStorage key, separate from `CONFIG.SAVE.KEY` — `src/progress.js`'s `resetSave()` docstring already anticipates this exact future key and is written to never touch it
- UI indicator: small persistent icon/glyph in a HUD corner, following `src/ui/hud.js`'s existing fixed-overlay pattern (screen-space, camera-immune, tagged for scene-teardown cleanup) — key-only with no visual affordance was rejected as undiscoverable, breaking the project's standing "discoverable controls" precedent from the v3.0 ADHD-safe audit
- No per-channel volume sliders this phase — deferred to AUD-FUT-01 per REQUIREMENTS.md Future Requirements

### Claude's Discretion
- Exact SFX pack(s) and individual sound picks within Kenney's CC0 audio catalog
- Whether "land" gets its own SFX or is skipped
- Exact music:SFX gain ratio (subject to human sign-off)
- Internal module name/shape for the music/mute manager (e.g. `src/audio.js`), as long as it follows the a727c13 rule (no engine global at module top level — STATE.md notes audio.js gets a documented anti-leak exception like game.js's `onHide`) and the anti-leak/idempotency mandates above

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/ui/challenge.js` — the ONE shared math-challenge panel; its correct/wrong resolution point (~line 281-288, `const correct = picked === q.answer; ... if (!correct) {`) is the single seam for correct/wrong SFX, not per-mechanic duplication
- `src/ui/hud.js` — fixed screen-space overlay factory pattern (`mountHud`) to mirror for a mute indicator; camera-immune, tagged for teardown, zero shared module state
- `src/config.js` — namespaced CONFIG sections (PARALLAX, BRAIN, GATE, DOOR, MATH_GATE, ENEMY, COLLECT, PROGRESS, SAVE, HUD, FX, TITLE, SELECT, HINT); a new `CONFIG.AUDIO` section is the natural home for volume/key tunables, per the "all tunables live in config.js" binding rule
- `src/progress.js` `resetSave()` docstring already documents and scopes around a future separate audio mute-toggle key
- `scripts/build-art-assets.py` + `CREDITS.md` + `assets/LICENSES/*.txt` — the reproducible "vendor raw CC0 source, bake final asset via script, document proof" pipeline to mirror for audio (ffmpeg trim/convert in place of Pillow bake)

### Established Patterns
- a727c13 rule: engine globals only inside function bodies, never module top level; game.js's `onHide` is the precedent anti-leak exception STATE.md says `audio.js` should mirror
- Anti-leak: closure-local run state; global controllers cancelled on `onSceneLeave`
- No-timer/forgiving mandate extends to audio: no buzzers, no startle stingers, wrong answer = soft neutral tone only
- CC0-only asset sourcing with per-asset license proof file + CREDITS.md row — zero exceptions in this project's history

### Integration Points
- `src/scenes/title.js:105` — gesture-gate anchor for starting ambient music
- `src/mechanics/door.js`, `src/mechanics/gates.js` — gate/door-open SFX hook points
- `src/ui/mathGate.js` — level-clear SFX hook point
- `src/mechanics/collect.js` — pickup SFX hook point
- `src/player.js` JUMP_KEYS press handler — jump SFX hook point
- Kaplay 3001.0.19 (`lib/kaplay.mjs`) confirmed to expose `loadSound`, `play`, and an AudioPlay handle with `paused`/`speed`/`detune`/`seek`/`onEnd` — exact volume/loop/autoplay option semantics still need verification against the vendored build before implementation (flagged in STATE.md Blockers/Concerns: "re-verify exact Kaplay 3001 play() handle/volume/autoplay semantics against lib/kaplay.mjs before implementing" — this is plan-phase research's job, not resolved here)

</code_context>

<specifics>
## Specific Ideas

No specific asset picks or exact sound references from the user for this session (offline). Follow the recommended sourcing/mapping above; plan-phase research should pin down concrete Kenney pack names and exact Kaplay 3001 audio API call shapes.

</specifics>

<deferred>
## Deferred Ideas

- Per-level/per-theme ambient music variation — explicitly deferred past v5.0 per SEED-001's "wrap lean" guidance; candidate for v6.0 alongside the sourced-biome-art overhaul
- Full audio options menu with per-channel volume sliders — tracked as AUD-FUT-01
- Danger-reactive/intensifying music — permanently out of scope (REQUIREMENTS.md: "Audio equivalent of the banned countdown timer; ADHD-unsafe")

</deferred>
