# Phase 27: Audio & ADHD-Safe Sound - Research

**Researched:** 2026-07-08
**Domain:** Kaplay 3001.0.19 Web Audio integration, CC0 audio sourcing, ADHD-safe mix design
**Confidence:** HIGH (engine API — read directly from the vendored source, byte-verified) / MEDIUM (CC0 pack picks — pack existence verified, exact track/file picks deferred to implementation per CONTEXT.md's Claude's Discretion)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**SFX/Music Sourcing & Asset Pipeline**
- CC0 source: Kenney.nl audio packs — continues the exact sourcing/attribution convention already used and credited for every art asset (CREDITS.md, `assets/LICENSES/`)
- Vendored format: OGG Vorbis, converted/trimmed via `ffmpeg` (confirmed present on this host) — matches AUD-02's "seamless OGG" wording
- File layout: `assets/sfx/*.ogg` + `assets/music/*.ogg`; raw source packs vendored under `assets/_kenney-src/` (or a new sibling `_audio-src/` if pack structure doesn't fit cleanly), mirroring the existing `_kenney-src` / `_opengameart-src` split
- Licensing proof: same discipline as art — one CREDITS.md row + one `assets/LICENSES/<name>.txt` proof file (source URL + quoted CC0 declaration) per vendored asset, verified before vendoring, before any phase-close claim

**SFX Event Mapping**
- Jump: short, soft blip on the existing jump input point (`player.js` JUMP_KEYS press handler). Land SFX is optional — include only if it doesn't add unwanted noise density: judgment call at implementation time
- Correct answer: bright-but-soft positive chime, wired at the ONE shared challenge seam (`src/ui/challenge.js`, the `correct` branch around its answer-resolution point) — never duplicated per-mechanic
- Wrong answer: soft neutral tone ONLY — this is a hard requirement (REQUIREMENTS.md Out of Scope: "Buzzer / harsh wrong-answer sound... ADHD-unsafe"), not a preference
- Door/gate open: short distinct "unlock" cue, separate from the correct-chime so gate-clear reads as its own event
- Level-clear (mathGate.js): calm, non-fanfare resolve cue — celebratory but not a blast, matching the project's "no pressure" tone
- Pickup/collect: light pluck/pop, audibly distinct from the correct-chime

**Ambient Music Design**
- ONE calm ambient loop for the entire game — explicitly NOT per-level/per-theme variation. SEED-001 already put the project on notice to wrap v5.0 lean and not gold-plate; extending that discipline to audio richness
- Start trigger: gesture-gated inside `src/scenes/title.js`'s existing press-to-start handler (`const start = () => go("select")`, title.js:105) — this Kaplay build has no gesture-unlock hook, so music + `audioCtx.resume()` must start there, never at module load (already recorded in STATE.md Cross-Cutting Mitigations #4)
- Persistence across scenes: one idempotent music-manager instance/module that survives `go()` scene transitions with zero stacking/leaking (AUD-04, STATE.md mitigation #2) — repeated calls to "ensure music playing" must be safe to call from every scene's mount
- Music vs SFX balance: music mixed well below SFX (starting reference ~30-40% of SFX gain); exact number is Claude's discretion, tuned by ear and confirmed at the human sound sign-off checkpoint

**Mute Control & ADHD-Safe Mix**
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

### Deferred Ideas (OUT OF SCOPE)
- Per-level/per-theme ambient music variation — explicitly deferred past v5.0 per SEED-001's "wrap lean" guidance; candidate for v6.0 alongside the sourced-biome-art overhaul
- Full audio options menu with per-channel volume sliders — tracked as AUD-FUT-01
- Danger-reactive/intensifying music — permanently out of scope (REQUIREMENTS.md: "Audio equivalent of the banned countdown timer; ADHD-unsafe")
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUD-01 | Core SFX set (jump, land, pickup, correct, soft-neutral wrong, door/gate, level-clear) wired at the shared mechanic seams; CC0 with license proofs | Standard Stack (Kenney CC0 packs), Architecture Patterns (call-site map + code examples for every seam: player.js, challenge.js, door.js/gates.js, mathGate.js, collect.js), Recommended Project Structure (asset layout + license-proof convention) |
| AUD-02 | Calm ambient music loop(s) — seamless OGG, gesture-gated start on the title screen | Pattern 1 (two-backend dispatch), Pattern 2 (idempotent singleton), Anti-Patterns (synchronous-gesture-call-stack requirement), Code Examples (main.js loadMusic + title.js start handler) |
| AUD-03 | M-key mute toggle, persisted in its own localStorage key (not the progress save) | Pattern 3 (single master-gain mute), Pitfall 3 (per-scene key re-registration), Code Examples (mute persistence seam), Security Domain (V5 guard on the stored flag) |
| AUD-04 | Designed ADHD-safe mix — music well below SFX, no buzzers or startle stingers, no music stacking/leaking across scenes (idempotent music manager), human sound sign-off | Pattern 2/Pitfall 2 (stacking prevention), Validation Architecture (Wave 0 Gaps — automated multi-scene music-count assertion + required human checkpoint) |
</phase_requirements>

## Summary

Phase 27 wires SFX + one ambient music loop + a persisted mute toggle through Kaplay 3001.0.19's **built-in** audio API — confirmed by reading the actual vendored `lib/kaplay.mjs` source (not generic Kaplay docs). There are two distinct playback backends hiding behind one `play()` call, and picking the right one for each use case is the single most load-bearing finding of this research:

1. **`loadSound()` + `play(name, opts)`** → Web Audio `AudioBufferSourceNode` path. Precise, low-latency, fire-and-forget instances — this is what SFX (jump/land/pickup/correct/wrong/door/level-clear) must use. Each `play()` call spawns an independent instance that self-cleans when its buffer ends; volume/pan/detune/speed are all settable per-instance via the options object at creation time.
2. **`loadMusic()` + `play(name, opts)`** → `HTMLAudioElement` streaming path (Kaplay detects the string was registered via `loadMusic`, not `loadSound`, and silently routes to a different internal function). This is what the ambient loop must use. Critically, **every `play()` call on a music-registered name creates a brand-new `Audio` element** — calling it twice stacks two overlapping tracks. This is the exact bug AUD-04's "idempotent music manager" requirement exists to prevent, and it is a real, engine-verified risk, not a hypothetical one.

The mute toggle has a much simpler implementation than a naive per-instance-tracking approach would suggest: Kaplay exposes a single **master gain node** (`setVolume()`/`getVolume()`, NOT the deprecated `volume()`) that both the music path and every SFX instance's individual gain node route through before hitting the speakers. One `setVolume(0)` call silences everything simultaneously; `setVolume(1)` (or the pre-mute stored value) restores it. This turns AUD-03's "single toggle mutes both channels" requirement into a one-line implementation instead of a per-instance-array bookkeeping problem.

**Primary recommendation:** Build `src/audio.js` as a new pure-at-import module (mirroring `src/ui/challenge.js`'s shape) exporting `ensureMusicPlaying()`, `toggleMute()`, `isMuted()`, and a `wireAudioUI()` helper each scene calls once in its body. Hold the music `AudioPlay` handle and the muted boolean as **module-level** state (the one sanctioned exception to this project's closure-local-state convention, since music must survive `go()` scene transitions) — but keep every actual Kaplay engine call strictly inside function bodies, never at module top level, per the a727c13 rule. Source all SFX/music from Kenney.nl CC0 packs (Interface Sounds / Impact Sounds / Music Loops) via the same vendor-then-license-proof pipeline already used for every art asset.

## Architectural Responsibility Map

Nox Run is a single-tier client-only static game (no backend, no build step) — every capability below lives in the Browser/Client tier. The map instead distinguishes which *module* owns each responsibility, since that is the boundary this phase's plan-checker needs to verify.

| Capability | Primary Tier | Owning Module | Rationale |
|------------|-------------|----------------|-----------|
| SFX playback (jump/land/pickup/correct/wrong/door/clear) | Browser/Client | `src/audio.js` (new) | Single seam for all `loadSound`/`play` calls; mechanics modules call into it, never touch Kaplay's audio primitives directly |
| Ambient music lifecycle (start/idempotent-ensure) | Browser/Client | `src/audio.js` (new) | Module-level singleton handle is the ONE piece of cross-scene-persistent state in this phase |
| Mute state + persistence | Browser/Client | `src/audio.js` (new) + `localStorage` | Own key, own guarded read/write seam mirroring `src/progress.js`'s pattern — never touches `CONFIG.SAVE.KEY` |
| Mute key binding (`M`) | Browser/Client | Each scene body (title/select/game), via `audio.js`'s exported helper | App-bus key handlers are cleared by every `go()` (engine-verified, Phase 22-03) — must be re-registered per scene, same as `escape`/nav keys already are |
| Mute UI indicator | Browser/Client | Each scene body, via `audio.js`'s exported render helper | Same per-scene-mount reason as the key binding; mirrors `src/ui/hud.js`'s fixed-overlay idiom without importing `hud.js` (HUD only mounts in `game.js`) |
| SFX call sites (jump/correct/wrong/door/gate/clear/pickup) | Browser/Client | `player.js`, `ui/challenge.js`, `mechanics/door.js`, `mechanics/gates.js`, `ui/mathGate.js`, `mechanics/collect.js` | Each existing mechanic calls one `audio.js` function at its established resolution point — zero duplicated audio logic per mechanic |
| Tunables (volumes, key binding, storage key, icon layout) | Browser/Client | `CONFIG.AUDIO` in `src/config.js` | "All tunables live in config.js" binding rule — no magic numbers in `audio.js` |
| Asset sourcing/licensing | Build-time (static) | `assets/sfx/`, `assets/music/`, `assets/_kenney-src/`, `CREDITS.md`, `assets/LICENSES/` | Mirrors the existing art pipeline exactly — no new tooling class needed |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kaplay (vendored) | 3001.0.19 (pinned, already in repo) | `loadSound`/`loadMusic`/`play`/`setVolume`/`getVolume` — the entire audio API surface this phase needs | Zero new runtime dependency; the project's binding "no Howler.js, no npm" decision (STATE.md, REQUIREMENTS.md Out of Scope) is already confirmed sufficient — this research re-confirms it by reading the actual source |

No other library is needed or in scope. **Zero packages to install** — see Package Legitimacy Audit below.

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| ffmpeg | 6.1.1-3ubuntu5 (confirmed present, `libvorbis`/`vorbis` encoder confirmed available) | Convert/trim source audio to vendored OGG Vorbis | Every asset vendoring step (source WAV/MP3/OGG → trimmed, normalized OGG Vorbis under `assets/sfx/` or `assets/music/`) |

**ffmpeg conversion command shape** (confirmed against this host's actual ffmpeg build):

```bash
# SFX: trim to length, normalize, encode to OGG Vorbis at a reasonable quality
ffmpeg -i source.wav -t 00:00:01.5 -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
  -c:a libvorbis -q:a 4 assets/sfx/jump.ogg

# Music loop: verify/trim to a clean loop point, encode at slightly higher quality
# (music benefits from -q:a 5-6; 4 is plenty for short SFX blips)
ffmpeg -i source.wav -af "loudnorm=I=-20:TP=-1.5:LRA=11" \
  -c:a libvorbis -q:a 5 assets/music/ambient.ogg
```

`-q:a 4` (~128kbps VBR) is more than sufficient for short UI-style SFX; bump to `-q:a 5`/`6` for the longer music loop if file size isn't a concern (this is a small static site, not bandwidth-constrained). `loudnorm` is a reasonable default normalization pass so hand-picked Kenney files with inconsistent source levels don't require by-ear gain-staging per file — but the human sound sign-off (AUD-04) should still confirm the final in-engine mix, since `loudnorm`'s target LUFS is a starting point, not a guarantee of "feels right in-game."

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Kaplay's built-in `loadSound`/`play` | Howler.js | Explicitly out of scope (REQUIREMENTS.md Out of Scope) — would add an npm dependency this no-build-step project has zero infrastructure for; Kaplay's own audio API is fully sufficient (confirmed by this research) |
| ffmpeg CLI | Web-based CC0 audio converters | ffmpeg is already confirmed present on this host and is the project's existing convention for reproducible, scriptable asset pipelines (`scripts/build-art-assets.py` uses Pillow the same way) — a manual web tool would break reproducibility |

**Installation:** none — Kaplay is already vendored; ffmpeg is already present on the host.

## Package Legitimacy Audit

**Not applicable — this phase installs zero external packages.** Confirmed: no `npm install`, no new `import` of any third-party JS module. The entire audio implementation uses Kaplay's already-vendored, already-pinned `loadSound`/`loadMusic`/`play`/`setVolume`/`getVolume` API (verified by reading `lib/kaplay.mjs` directly — see Code Examples below) plus CC0 static asset files (not code packages) from Kenney.nl. The Package Legitimacy Gate protocol is therefore skipped for this phase; there is nothing to run `npm view` or `package-legitimacy check` against.

## Architecture Patterns

### System Architecture Diagram

```
                     ┌─────────────────────────────────────────┐
                     │  main.js (boot, post-kaplay() init)      │
                     │  loadSound("jump", ...) etc. (7 SFX)     │
                     │  loadMusic("ambient", ...)  (prefetch    │
                     │  only — does NOT play; safe pre-gesture) │
                     └───────────────┬───────────────────────────┘
                                     │ go("title")
                                     ▼
   ┌───────────────────────────────────────────────────────────────────┐
   │ title.js  scene body                                              │
   │   wireAudioUI()  ← registers "M" key + mounts mute icon (fresh    │
   │                     every scene mount — app-bus is cleared by go) │
   │   const start = () => {                                          │
   │     audio.ensureMusicPlaying();  ← FIRST call in the FIRST        │
   │                                     user-gesture handler          │
   │     go("select");                                                 │
   │   }                                                                │
   └───────────────────────────────┬───────────────────────────────────┘
                                     │ go("select") / go("game")
                                     ▼
   ┌───────────────────────────────────────────────────────────────────┐
   │ select.js / game.js  scene bodies                                 │
   │   wireAudioUI()  ← re-registered per scene (idempotent, cheap)    │
   │   audio.ensureMusicPlaying()  ← belt-and-braces re-assert (no-op  │
   │                                  if a handle already exists)      │
   └───────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
   ┌───────────────────────────────────────────────────────────────────┐
   │ src/audio.js  (NEW — module-level singleton, the ONE exception    │
   │  to closure-local state, since music must survive go())           │
   │                                                                    │
   │   let musicHandle = null;   ← module-level, NOT closure-local     │
   │   let muted = loadMuteFlag();                                     │
   │                                                                    │
   │   ensureMusicPlaying() {                                          │
   │     if (musicHandle) return;        ← idempotency guard           │
   │     musicHandle = play("ambient", { loop: true });                │
   │     musicHandle.volume = CONFIG.AUDIO.MUSIC_VOLUME;                │
   │   }                                                                │
   │                                                                    │
   │   toggleMute() {                                                  │
   │     muted = !muted;                                               │
   │     setVolume(muted ? 0 : 1);       ← ONE call silences BOTH      │
   │     saveMuteFlag(muted);              music AND every SFX         │
   │   }                                                                │
   │                                                                    │
   │   playSfx(name, vol) { play(name, { volume: vol ?? 1 }); }        │
   └───────────────────────────────┬───────────────────────────────────┘
                                     │ playSfx(...) calls
        ┌────────────┬──────────────┼──────────────┬─────────────┬──────────────┐
        ▼            ▼              ▼              ▼             ▼              ▼
   player.js   challenge.js    door.js/gates.js  mathGate.js  collect.js   (correct/wrong
   (jump, on   (correct/wrong   (door/gate         (level-      (pickup)     SFX shared by
    press)      resolution)      unlock)            clear)                   ALL mechanics
                                                                              via challenge.js
                                                                              — never duplicated)
```

### Recommended Project Structure

```
src/
├── audio.js              # NEW — the ONE audio seam: ensureMusicPlaying, toggleMute,
│                          #   isMuted, playSfx, wireAudioUI (key + icon, per-scene)
├── config.js              # + new CONFIG.AUDIO block (volumes, key, storage key, icon layout)
├── player.js               # + one playSfx("jump") call in the JUMP_KEYS press handler
├── ui/
│   ├── challenge.js        # + playSfx("correct") / playSfx("wrong") at the resolution seam
│   └── mathGate.js         # + playSfx("clear") in the onSuccess celebration block
└── mechanics/
    ├── door.js             # + playSfx("door") in onSuccess
    ├── gates.js             # + playSfx("door") (same cue, reused — see SFX Event Mapping)
    └── collect.js           # + playSfx("pickup") on correct pickup touch

assets/
├── sfx/                    # NEW — jump.ogg, correct.ogg, wrong.ogg, door.ogg, clear.ogg,
│                            #   pickup.ogg, (optional) land.ogg
├── music/                  # NEW — ambient.ogg (one seamless loop)
├── _kenney-src/
│   ├── interface-sounds/   # NEW — raw Kenney source pack (correct/wrong/door/clear candidates)
│   ├── impact-sounds/       # NEW — raw Kenney source pack (jump/land/pickup candidates)
│   └── music-loops/         # NEW — raw Kenney source pack (ambient candidates)
└── LICENSES/
    ├── jump.txt, correct.txt, wrong.txt, door.txt-audio, clear.txt, pickup.txt, ambient.txt
    # (door.txt already exists for the visual door sprite — the audio proof needs its own
    #  distinctly-named file, e.g. door-sfx.txt, to avoid colliding with the existing entry)
```

### Pattern 1: Two-Backend `play()` Dispatch (engine-internal, informs call-site design)

**What:** Kaplay's single exported `play(name, opts)` function internally branches on whether `name` was registered via `loadMusic` (→ streaming `HTMLAudioElement` path) or `loadSound` (→ precise `AudioBufferSourceNode` path). This is NOT visible from the public API surface or from generic Kaplay documentation — it is only visible by reading the vendored source.

**When to use:** Always register short one-shot SFX via `loadSound()` and the ambient loop via `loadMusic()`. Do not use `loadSound()` for the music loop — the buffer-source path decodes the ENTIRE file into memory eagerly (`decodeAudioData`), which is fine for a 1-second SFX but wasteful/slow for a full ambient track; `loadMusic()`'s streaming `HTMLAudioElement` path is the correct one for a longer loop.

**Example (from the vendored source, `lib/kaplay.mjs`, function names un-minified for clarity below):**

```js
// Source: lib/kaplay.mjs (vendored, read directly this session — NOT generic Kaplay docs)
// Minified names: si=loadSound, ii=loadMusic, aa=play, ia=(internal music-play helper)

// loadSound(name, url) — decodes eagerly via decodeAudioData, stores a SoundData
function loadSound(name, urlOrBuffer) {
  return assets.sounds.add(name,
    typeof urlOrBuffer === "string"
      ? SoundData.fromURL(urlOrBuffer)
      : SoundData.fromArrayBuffer(urlOrBuffer));
}

// loadMusic(name, url) — does NOT decode/play; just prefetches via a throwaway
// <audio preload="auto">, then stores the raw URL string. SAFE to call at boot,
// before any user gesture — it never calls .play().
function loadMusic(name, url) {
  const resolvedUrl = resolvePath(url);
  const el = new Audio(resolvedUrl);
  el.preload = "auto";
  assets.music[name] = resolvedUrl; // stores the URL, not the throwaway element
}

// play(name, opts) — the dispatch point
function play(name, opts = {}) {
  if (typeof name === "string" && assets.music[name]) {
    return playMusicBackend(assets.music[name], opts); // HTMLAudioElement path
  }
  // ...otherwise: Web Audio AudioBufferSourceNode path (SFX)
}
```

### Pattern 2: Idempotent Module-Level Music Singleton (the sanctioned closure-local exception)

**What:** Every other piece of run state in this codebase is explicitly closure-local per scene (Cross-Cutting Mitigation #2, enforced across `game.js`/`title.js`/`select.js`). Music playback is the ONE deliberate exception: it must survive `go()` scene transitions, so its handle must live at module scope in `audio.js`, guarded by a null-check so repeated "ensure playing" calls from multiple scenes never create a second `Audio` element (the exact stacking bug the `ia()`/music-path internals make possible if called naively).

**When to use:** Exactly once, for the music handle and the muted flag. Do NOT extend this exception to any other state in this phase — SFX instances need no tracking at all (each `play()` call is self-contained and self-cleans).

**Example:**

```js
// src/audio.js — module-level state is the ONE closure-local exception in this codebase,
// used ONLY for the music handle (must survive go() scene transitions).
// Every actual engine call below is INSIDE a function body — a727c13 compliant.

let musicHandle = null; // plain data reference, not an engine call — safe at module scope
let muted = null; // lazily initialized on first read (see isMuted below)

export function ensureMusicPlaying() {
  if (musicHandle) return; // idempotency guard — the whole point of this pattern
  musicHandle = play("ambient", { loop: true }); // engine call — inside a function body
  musicHandle.volume = CONFIG.AUDIO.MUSIC_VOLUME; // music-path volume must be set
  //                                                  AFTER creation — ia()'s opts object
  //                                                  does not read a `volume` field
}
```

### Pattern 3: Single Master-Gain Mute (not per-instance tracking)

**What:** `setVolume(x)`/`getVolume()` control `a.audio.masterNode.gain.value` — a single `GainNode` that BOTH the music path (`createMediaElementSource(...).connect(masterNode)`) and every SFX instance's own per-instance gain node (`instanceGain.connect(masterNode)`) route through before reaching the speakers.

**When to use:** For AUD-03's "single toggle mutes both channels together" requirement. This is dramatically simpler than tracking every live SFX instance and pausing/resuming each one.

**Example (from the vendored source, un-minified for clarity):**

```js
// Source: lib/kaplay.mjs — setVolume/getVolume (un-minified: lo=setVolume, mo=getVolume)
function setVolume(v) { audio.masterNode.gain.value = v; }
function getVolume() { return audio.masterNode.gain.value; }
// NOTE: the deprecated `volume()` wrapper (minified `ua`) calls a deprecation-warning
// helper before delegating to these — STATE.md already flags "use setVolume, not
// deprecated volume()"; this research confirms that warning is real (read in source).

// src/audio.js
export function toggleMute() {
  muted = !muted;
  setVolume(muted ? 0 : 1); // ONE call — silences/restores music AND every SFX instance
  writeMuteFlag(muted); // own localStorage key — see below
}
```

### Anti-Patterns to Avoid

- **Calling `play("ambient", ...)` more than once without a guard:** creates a second, fully independent `Audio` element that plays simultaneously with the first — audible stacking/phasing, the exact AUD-04 defect this phase must prove absent.
- **Setting `musicHandle.volume` inside the `play()` options object:** the music-path internal function (`ia()`) only reads `loop` and `paused` from its options — a `volume` field passed there is silently ignored. Volume must be set as a property assignment on the RETURNED handle, after creation.
- **Calling `play("ambient", ...)` asynchronously (inside a `.then()`, inside a `tween` callback, after an `await`) from the title screen's start handler:** browser autoplay policy requires `AudioContext.resume()` to happen synchronously within the original user-gesture call stack. Kaplay's internal `ia()` helper calls `audio.ctx.resume()` itself right before `.play()` — but only works reliably if the whole call chain back to the click/keypress event is synchronous. Call `ensureMusicPlaying()` as the FIRST synchronous statement inside `title.js`'s `start` function, not deferred.
- **Registering the `M` mute key or mounting the mute icon at module scope, or only once in `main.js`:** the app-wide input event bus is cleared on every `go()` (engine-verified, Phase 22-03 finding already in STATE.md) — a key handler registered once at boot would silently stop firing after the first scene transition. Register fresh in every scene body, exactly like `escape` (game.js) and the nav keys (select.js) already are.
- **Passing SFX volume above 1.0:** the SFX-path gain setter only floors at 0 (`Math.max(g, 0)`) — there is NO upper clamp, unlike the music path's `clamp(v, 0, 1)`. A volume of e.g. `1.5` will genuinely amplify past unity gain and can clip. Keep SFX volumes in the conventional `0..1` range even though the engine won't stop you from exceeding it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SFX instance pooling / cleanup | A manual pool of `AudioBufferSourceNode`s with lifecycle tracking | `play()`'s per-call instances (each self-cleans on `onended`) | The engine already does this — `AudioBufferSourceNode`s are one-shot and garbage-collected automatically once their buffer finishes; no explicit destroy call exists or is needed |
| Mute-all-channels bookkeeping | An array of every live SFX/music handle, iterated to set `.volume = 0` on each | `setVolume(0)` (master gain) | One GainNode already sits upstream of everything; per-instance iteration is strictly more code for an identical audible result |
| OGG loop-point / seamless-loop encoding | Custom loop-point metadata / manual gapless-splice logic | `loop: true` in `play()`'s options (native `HTMLAudioElement.loop`) | Native looping is a browser primitive; Kaplay exposes it as a plain boolean. A very short (<50ms) silence/click at the loop seam is a known limitation of `HTMLAudioElement` native looping on some browsers — mitigate by trimming the source file to a true zero-crossing loop point in ffmpeg, not by hand-rolling a scheduler-based crossfade (which would also violate the no-`setInterval`/no-scheduler SAFE-01 mandate) |
| AudioContext gesture-unlock detection | A custom "has the user interacted yet" flag checked before every `play()` call | Kaplay's own `ctx.resume()` call already embedded inside its internal music-play helper, triggered naturally by calling `play()`/`ensureMusicPlaying()` from within the title screen's existing `start()` gesture handler | The engine already resumes the context on every music `play()` call; the only discipline required from this phase's code is calling it synchronously from a real gesture handler, not building new gesture-detection plumbing |

**Key insight:** Every "hard part" of game audio the CONTEXT.md flagged as a risk (stacking music, gesture gating, mute-all) turns out to already have a first-class, single-call solution once you read the actual `play()`/`setVolume()` internals — the risk was in NOT knowing that and hand-rolling a heavier solution (e.g., per-instance volume tracking, a custom gesture-unlock singleton) that duplicates what the engine already does for free.

## Common Pitfalls

### Pitfall 1: Assuming `play()` options accept `volume` uniformly across both backends
**What goes wrong:** Code passes `play("ambient", { loop: true, volume: 0.35 })` expecting the music to start quiet, but it plays at full native `HTMLAudioElement.volume` (1.0) instead.
**Why it happens:** The music-path internal helper (`ia()`) destructures ONLY `e.loop` and `e.paused` from its options object — any other key, including `volume`, is silently ignored (not even a warning). The SFX-path helper (`aa()`'s non-music branch), by contrast, DOES read `e.volume` from its options.
**How to avoid:** For music, always set `.volume` as a property assignment on the object `play()` returns, immediately after creation. For SFX, pass `volume` in the options object at call time.
**Warning signs:** Music plays audibly louder than the intended "well below SFX" mix during human sign-off despite CONFIG appearing to set a lower value.

### Pitfall 2: Music stacking across scene re-entry
**What goes wrong:** Returning to the title screen (e.g., via some future navigation path, or a dev/debug re-entry) and pressing "start" again spawns a SECOND overlapping ambient track.
**Why it happens:** `play()` on a music-registered name always creates a fresh `Audio` element — there is no engine-level guard against calling it twice.
**How to avoid:** The `musicHandle` module-level idempotency guard (Pattern 2 above) is mandatory, not optional. `ensureMusicPlaying()` must be the ONLY call site that invokes `play("ambient", ...)` anywhere in the codebase.
**Warning signs:** Audible phasing/doubling of the ambient track after repeated title→select→game→escape→title loops during interactive verification.

### Pitfall 3: The "M" key silently stops working after the first scene transition
**What goes wrong:** Mute works fine on the title screen, then does nothing once the player reaches level-select or the game scene.
**Why it happens:** Kaplay 3001's `go()` clears the entire app-wide input event bus (engine-verified in Phase 22-03: `app.events.clear() + root.clearEvents()`), which is exactly where `onKeyPress` handlers live. A single boot-time registration in `main.js` (before any `go()`) would be wiped on the very first scene transition.
**How to avoid:** Call the `audio.js`-exported key-wiring helper fresh inside EVERY scene body (title.js, select.js, game.js), mirroring how `escape` (game.js) and the four nav keys (select.js) are already re-registered per scene.
**Warning signs:** Interactive verification (per this project's "checks that don't play the game lie" standard) must explicitly test "M" on all three scenes, not just the title screen, or this regression ships silently.

### Pitfall 4: `src/audio.js` not covered by the a727c13 static gate
**What goes wrong:** A future edit accidentally references a Kaplay engine global (e.g., `play`, `onKeyPress`) at module top level in `audio.js`, throwing at import and blanking the entire game — but `scripts/check-import-safety.sh`'s existing negative grep never catches it because the file isn't in the script's hardcoded scoped-file list.
**Why it happens:** `check-import-safety.sh`'s Section 1/Section 2 file lists are hardcoded (`src/scenes/title.js`, `src/scenes/select.js`, `src/ui/challenge.js`, all four `src/mechanics/*.js` — confirmed by reading the script this session) and do NOT auto-discover new modules.
**How to avoid:** The plan must add `src/audio.js` (and any new `src/ui/*.js` mute-indicator module, if split out) to `check-import-safety.sh`'s scoped file list as part of this phase's implementation — this is a REQUIRED edit, not optional hardening, given the project's existing gate-first discipline.
**Warning signs:** `bash scripts/check-import-safety.sh` returning green despite a genuine top-level engine-global reference in the new file is the failure mode to catch in code review.

### Pitfall 5: Kenney pack license-proof file name collision with the existing `door.txt`
**What goes wrong:** The visual door sprite's license proof already lives at `assets/LICENSES/door.txt` (verified this session). A new audio "door unlock" SFX proof file using the same stem would silently overwrite it.
**Why it happens:** Both assets share the conceptual name "door."
**How to avoid:** Use a distinctly-named proof file for the audio asset (e.g., `door-sfx.txt` or `door-unlock.txt`) and a correspondingly distinct `CREDITS.md` row description.
**Warning signs:** `git diff` showing `assets/LICENSES/door.txt`'s content CHANGED (not added) during this phase is the tell — it should only ever be a new file being added elsewhere.

## Code Examples

### Loading all audio at boot (main.js — mirrors the existing `loadSprite` block exactly)

```js
// Source: lib/kaplay.mjs API confirmed this session + src/main.js's existing loadSprite
// convention (../assets/... web-root path convention, called after kaplay() init,
// BEFORE any go() — same "queue loads, show loading screen until resolved" behavior
// Kaplay already provides for sprites).

// SFX — loadSound() decodes eagerly (safe pre-gesture; decodeAudioData does not require
// a resumed AudioContext).
loadSound("jump", "../assets/sfx/jump.ogg");
loadSound("correct", "../assets/sfx/correct.ogg");
loadSound("wrong", "../assets/sfx/wrong.ogg");
loadSound("door", "../assets/sfx/door.ogg");
loadSound("clear", "../assets/sfx/clear.ogg");
loadSound("pickup", "../assets/sfx/pickup.ogg");
// loadSound("land", "../assets/sfx/land.ogg"); // OPTIONAL — CONTEXT.md leaves this a judgment call

// Music — loadMusic() only PREFETCHES (new Audio(url).preload="auto"); it never calls
// .play(). Safe to call here, before any user gesture, exactly like the SFX loads above.
loadMusic("ambient", "../assets/music/ambient.ogg");
```

### SFX call site (jump — player.js's existing press handler)

```js
// Source: src/player.js:84-87 (existing code, insertion point confirmed by reading the file)
onKeyPress(JUMP_KEYS, () => {
  if (player.paused) return; // do not queue jumps while the run is frozen
  buffer = CONFIG.BUFFER_MS / 1000;
  audio.playSfx("jump"); // NEW — plays on PRESS (immediate feedback), per CONTEXT.md,
  //                          not deferred to the actual physics jump in onUpdate below
});
```

### SFX call site (correct/wrong — the ONE shared challenge seam)

```js
// Source: src/ui/challenge.js:276-303 (existing choose() function, exact insertion points
// confirmed by reading the file — CONTEXT.md's "~line 281-288" estimate matches)
function choose(i) {
  if (cleared) return;
  if (i < 0 || i >= q.choices.length) return;

  const picked = q.choices[i];
  const correct = picked === q.answer;

  brain.reportResult(q.a, correct);

  const box = boxes[i];

  if (!correct) {
    audio.playSfx("wrong"); // NEW — soft neutral tone ONLY, never a buzzer (hard requirement)
    if (box) box.color = rgb(CONFIG.PALETTE.DANGER[0], CONFIG.PALETTE.DANGER[1], CONFIG.PALETTE.DANGER[2]);
    shake(6);
    return;
  }

  cleared = true;
  audio.playSfx("correct"); // NEW — this ONE call site covers door/gates/mathGate/collect,
  //                              since they all resolve through this same choose() function
  close();
  onSuccess?.({ table: q.a });
}
```

This single insertion point is why door.js, gates.js, and mathGate.js do NOT each need their own correct/wrong SFX call — they all route through `openChallenge()`'s shared `choose()`. Door/gate/level-clear need their OWN additional SFX only for their mechanic-specific "unlock"/"celebrate" moment, layered in their own `onSuccess` callbacks (door.js/gates.js's `destroy(doorObj)` block; mathGate.js's banner block) — distinct from, and in addition to, the shared "correct" chime.

### Mute persistence (own localStorage key, mirroring progress.js's guarded-seam shape)

```js
// Source: src/audio.js pattern, modeled on src/progress.js's storageAvailable()/
// try-catch/never-throw discipline (read directly from progress.js this session).
// Key literal follows the CONFIG.SAVE.KEY naming convention ("noxrun_platformer_v1")
// — CONFIG.SAVE's docstring says the SAME key namespace, just a distinct name.
const MUTE_STORAGE_KEY = "noxrun_mute_v1";

function storageAvailable() {
  try {
    return typeof localStorage !== "undefined" && localStorage !== null;
  } catch {
    return false;
  }
}

function loadMuteFlag() {
  if (!storageAvailable()) return false;
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMuteFlag(v) {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, v ? "1" : "0");
  } catch {
    // forgiving — never throw into the caller, same mandate as progress.js
  }
}
```

`src/progress.js`'s `resetSave()` docstring (line 339, read this session) says it "removes ONLY the versioned save key... so any future, unrelated persisted setting (e.g. an audio mute-toggle key, not implemented yet) is never touched." It does NOT pin an exact literal key name or shape — that is genuinely open, and `noxrun_mute_v1` above is this research's recommendation (mirrors `CONFIG.SAVE.KEY`'s `noxrun_platformer_v1` naming convention), not a pre-existing contract. `resetSave()` itself requires no code change — it already only touches `CONFIG.SAVE.KEY` and was written to never expand its blast radius.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| N/A — this is the first audio implementation in the project (Phases 1-26 shipped silent) | Kaplay 3001's built-in `loadSound`/`loadMusic`/`play`/`setVolume` | This phase | First audio the game has ever had; no legacy pattern to migrate away from |

**Deprecated/outdated:**
- Kaplay's `volume()` global function (minified `ua`) is deprecated in favor of `setVolume()`/`getVolume()` — confirmed by reading the deprecation-warning call (`tt("volume","setVolume / getVolume")`) directly in `lib/kaplay.mjs`. STATE.md already recorded this; this research independently re-confirms it against the actual source rather than trusting the prior note at face value.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Kenney.nl's "Interface Sounds" pack (100 CC0 UI sounds) contains suitable candidates for correct/wrong/door-unlock/level-clear cues | Standard Stack / Recommended Project Structure | Low — pack existence and CC0 license are confirmed (WebSearch + WebFetch this session); exact file-name picks within the pack are unverified (would require downloading and listening) and are explicitly Claude's Discretion per CONTEXT.md. If the pack's specific sounds don't fit the ADHD-safe brief, "Impact Sounds" (130 CC0 assets) or "UI Audio" (50 CC0 assets) are documented fallback packs found in the same search |
| A2 | Kenney.nl's "Impact Sounds" pack contains suitable jump/land/pickup candidates | Recommended Project Structure | Low — same confirmation level as A1; a specific "jump" sound was not auditioned this session |
| A3 | Kenney.nl's "Music Loops" pack (CC0, .ogg format, ~15-30s tracks, already loop-ready) is the source for the ambient track | Recommended Project Structure | Low-Medium — pack is confirmed CC0 and confirmed to ship pre-looped .ogg files (ideal — less ffmpeg loop-point work); the WebFetch attempt to the pack's own kenney.nl page 404'd (URL slug likely differs from the guessed `/assets/music-loops`), so this was corroborated via WebSearch summaries + a third-party mirror listing (gamesounds.xyz), not the primary source page directly. The planner should re-resolve the exact current kenney.nl URL before vendoring — a broken/renamed pack slug is a plausible but low-risk failure mode given Kenney's asset pages are typically stable |
| A4 | `noxrun_mute_v1` is an appropriate localStorage key name for the mute flag | Code Examples (Mute persistence) | Very low — purely a naming choice, not a hard requirement; `resetSave()`'s docstring only requires the key be distinct from `CONFIG.SAVE.KEY`, which this trivially satisfies |
| A5 | A top-right screen corner (clear of `CONFIG.HUD` top-left and `CONFIG.HINT` bottom-left) is the right home for the mute icon | Architectural Responsibility Map / (implementation detail, not in a Code Example) | Low — this is a layout suggestion for the planner, explicitly flagged as Claude's Discretion in CONTEXT.md ("small persistent icon/glyph in a HUD corner") — any of the two remaining unoccupied corners (top-right or bottom-right) works equally well functionally |

**If confirming A1-A3 matters before implementation:** the plan should include a task that downloads the actual Kenney pack ZIPs and lists their contents before committing to specific filenames — this research confirms the PACKS are real, CC0, and thematically appropriate, but does not claim to have listened to or selected individual files (that step requires either a human ear or a more thorough per-file audit than this research pass performed).

## Open Questions

1. **Exact Kenney pack file names for each of the 6-7 SFX + 1 music track**
   - What we know: three plausible, CC0-confirmed candidate packs exist (Interface Sounds, Impact Sounds, Music Loops) and this project's existing `assets/_kenney-src/` convention is exactly the right vendoring shape for them.
   - What's unclear: which specific files within each pack (e.g., which of Interface Sounds' 100 files reads as "bright-but-soft positive chime" vs. "soft neutral tone") — this requires either downloading + listening, or trusting file naming conventions (Kenney packs are typically named descriptively, e.g. `confirmation_001.ogg`, `error_001.ogg`).
   - Recommendation: this is squarely Claude's Discretion per CONTEXT.md ("Exact SFX pack(s) and individual sound picks within Kenney's CC0 audio catalog") — the plan should include an early task to download the 3 packs, inventory file names, and pick candidates, BEFORE the ffmpeg conversion step, with the human sound sign-off checkpoint (AUD-04) as the final arbiter.

2. **Whether "land" gets its own SFX**
   - What we know: CONTEXT.md explicitly defers this to implementation-time judgment ("include only if it doesn't add unwanted noise density").
   - What's unclear: nothing structurally — this is a pure feel/taste call, not a technical unknown. `player.js`'s existing `player.onGround(() => { fx.squash(player); fx.dust(player.pos); })` (line 41-44) is the exact insertion point if a land SFX is added.
   - Recommendation: implement without it first, add it only if the human sign-off pass flags jump-without-land as feeling incomplete — cheaper to add than to remove after committing an asset+license-proof for it.

3. **Music loop seam quality (native `HTMLAudioElement.loop` gapless-ness)**
   - What we know: Kaplay's music path sets the native `.loop = true` property on the underlying `<audio>` element — this is a browser-native primitive, not something Kaplay adds logic around.
   - What's unclear: whether the specific chosen Kenney track, after ffmpeg trimming, loops perceptibly seamlessly in the actual target browser(s) — native HTML audio looping has historically had a small gap/click on some browser/codec combinations, though modern Chromium-based browsers (this project's primary dev/test target, per the Playwright harness) are generally solid with OGG Vorbis.
   - Recommendation: verify the loop seam specifically during the interactive verification pass (listen through at least 2 full loop cycles), not just confirm the file loads and plays.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| ffmpeg | Converting/trimming source audio to vendored OGG Vorbis | ✓ | 6.1.1-3ubuntu5, `libvorbis` encoder confirmed | — |
| Kaplay (vendored) | All playback | ✓ | 3001.0.19 (pinned, already in `lib/kaplay.mjs`) | — |
| A modern browser's Web Audio API + `AudioContext` | SFX playback, music, master-gain mute | ✓ (implicit — this is a browser game; the existing Playwright harness already confirms headless Chromium support) | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — everything required is already present on this host and already vendored in the repo.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None (project convention) — Playwright-driven custom scripts under `scripts/*.mjs` ARE the test suite, plus bash shell-gate scripts (`scripts/check-*.sh`) for static/content assertions. No JS unit-test framework exists or is expected. |
| Config file | none — see Wave 0 Gaps below for the one new gate this phase likely needs |
| Quick run command | `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh` (fast, static, no browser) |
| Full suite command | `node scripts/browser-boot.mjs` (real-browser boot + drive across levels) + a NEW audio-specific interactive check (see Wave 0 Gaps) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUD-01 | 7 distinct SFX play at their mechanic seams, CC0 with license proofs | static (asset presence + CREDITS/LICENSES rows) + interactive (audible in-browser) | `bash scripts/check-audio-assets.sh` (proposed) + manual/Playwright drive-through | ❌ Wave 0 |
| AUD-02 | Ambient music loops seamlessly, gesture-gated start | interactive (real browser, fresh incognito-equivalent context) | extend `scripts/browser-boot.mjs` OR a new focused script asserting no audio starts before the first simulated click/keypress | ❌ Wave 0 |
| AUD-03 | M toggles mute anywhere, persists across reload, doesn't touch progress save | interactive + static (grep for the distinct storage key, negative-grep that it's never combined with `CONFIG.SAVE.KEY` writes) | new `scripts/check-audio.sh` (mirrors `check-progress.sh`'s shape) | ❌ Wave 0 |
| AUD-04 | No music stacking/leaking across scenes; ADHD-safe mix; human sign-off | interactive (multi-scene-transition drive) + human checkpoint | extend `scripts/browser-boot.mjs`'s multi-level drive to also exercise title→select→game→escape→title, asserting exactly one active music element via `document.querySelectorAll('audio').length` or an equivalent in-page assertion | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh` (fast; catches a727c13/no-timer regressions immediately after each audio.js edit)
- **Per wave merge:** full `node scripts/browser-boot.mjs` drive + the new audio-specific script(s)
- **Phase gate:** full suite green + human sound sign-off (AUD-04's explicit requirement — this is a `checkpoint:human-verify` item, not automatable) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `scripts/check-audio.sh` — NEW shell gate mirroring `check-progress.sh`'s shape: asserts `assets/sfx/*.ogg` + `assets/music/*.ogg` exist, asserts one `CREDITS.md` row + one `assets/LICENSES/*.txt` proof file per vendored audio asset (mirrors the existing art-asset discipline), asserts the mute storage key literal is distinct from `CONFIG.SAVE.KEY`
- [ ] `scripts/check-import-safety.sh` — EXTEND the existing scoped-file list (Section 1 + Section 2, lines ~85-131) to include `src/audio.js` (Pitfall 4 above — this is required, not optional)
- [ ] `scripts/browser-boot.mjs` (or a new sibling script, per this project's documented "copy verbatim, fix by hand in each copy" convention for Playwright scaffolding) — EXTEND to drive a scene-transition loop (title→select→game→select→title) and assert `document.querySelectorAll('audio').length <= 1` at each stop, directly proving AUD-04's "exactly one music handle" claim in an automated, repeatable way rather than relying solely on human ear
- [ ] A `checkpoint:human-verify` task for the ADHD-safe mix sign-off itself (music-vs-SFX balance, no startle stingers, wrong-answer tone reads as neutral not punishing) — this is explicitly NOT automatable and AUD-04 requires it be "recorded"

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Project has no accounts/auth (confirmed, CLAUDE.md constraints) |
| V3 Session Management | No | No sessions — client-only static game |
| V4 Access Control | No | No access-controlled resources |
| V5 Input Validation | Marginal | All audio file paths are hardcoded literals in `main.js` (mirrors the existing `loadSprite` pattern) — there is no user-controlled input anywhere in this phase's data flow (no filename comes from a URL param, form field, or save-file blob). The ONLY untrusted-input-adjacent surface is `localStorage`'s mute flag on read — apply the same defensive pattern `progress.js`'s `validate()` already uses: read as a plain string, coerce with a strict equality check (`=== "1"`), never `JSON.parse` + spread/`Object.assign` an untrusted blob |
| V6 Cryptography | No | No cryptographic operations in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed/corrupt localStorage mute value crashing the game on boot | Denial of Service (minor) | Mirror `progress.js`'s `storageAvailable()`/try-catch/never-throw discipline exactly (Code Examples above) — `loadMuteFlag()` must never throw into the caller, same as `loadSave()` |
| A future contributor accidentally wiring a raw filename/URL from an untrusted source into `loadSound()`/`play()` | Tampering (path injection) — not currently a live risk, but worth noting for future extensibility (e.g., if per-level themed music is ever added per the deferred SEED-001 direction) | Keep all asset names as hardcoded string literals, exactly like every `loadSprite()` call in `main.js` today — never construct an asset path from any data that crossed a trust boundary (URL params, localStorage, level descriptors sourced externally) |

This phase's security surface is minimal by construction — it is a client-only static asset loader with no network calls, no user input parsing beyond a single boolean flag, and no new trust boundary. The dominant risk category here is NOT security in the traditional sense but the ADHD-safety requirement (AUD-04) — which this research treats as a first-class product requirement (see Common Pitfalls, Wave 0 Gaps) even though it falls outside ASVS's scope.

## Sources

### Primary (HIGH confidence)
- `lib/kaplay.mjs` (this repo, vendored Kaplay 3001.0.19) — read directly this session: `loadSound`/`loadMusic`/`play`/`setVolume`/`getVolume`/`SoundData` implementations, the two-backend dispatch, the AudioPlay handle's real property/method shape for both backends, the master-gain routing, the deprecation warning on `volume()`
- `src/ui/challenge.js`, `src/scenes/title.js`, `src/player.js`, `src/progress.js`, `src/mechanics/door.js`, `src/mechanics/gates.js`, `src/ui/mathGate.js`, `src/mechanics/collect.js`, `src/scenes/game.js`, `src/scenes/select.js`, `src/ui/hud.js`, `src/config.js`, `src/main.js` (this repo) — read directly this session to confirm every integration seam's exact current line numbers/shapes
- `scripts/check-import-safety.sh`, `scripts/check-safety.sh` (this repo) — read directly this session to confirm the exact static-gate scope and banned-token patterns
- `assets/LICENSES/*.txt`, `CREDITS.md` (this repo) — read directly this session to confirm the exact license-proof pattern to mirror for audio
- Host `ffmpeg -version` / `ffmpeg -codecs` output — confirmed directly this session (6.1.1-3ubuntu5, libvorbis encoder present)

### Secondary (MEDIUM confidence)
- Kenney.nl "Interface Sounds", "Impact Sounds", "UI Audio", "Digital Audio" asset pages — WebSearch + WebFetch this session confirmed pack existence, approximate asset counts (100/130/50/60 files respectively), and CC0 licensing
- Kenney.nl "Music Loops" pack — WebSearch this session confirmed CC0 licensing, .ogg format, ~15-30s pre-looped tracks, and several example track names (via a third-party mirror listing, since the primary kenney.nl page URL 404'd on direct fetch — see Assumption A3)

### Tertiary (LOW confidence)
- None used for load-bearing claims in this document — every packaging/API claim traces to the vendored source or this repo's existing code; every CC0-sourcing claim traces to at least a WebSearch-corroborated pack existence check.

## Metadata

**Confidence breakdown:**
- Standard stack / API surface: HIGH — read directly from the actual vendored `lib/kaplay.mjs`, not generic Kaplay docs or training-data memory (this was the explicit, flagged research mandate for this phase)
- Architecture / integration seams: HIGH — every insertion point (challenge.js line numbers, title.js:105, player.js's JUMP_KEYS handler, etc.) was confirmed by reading the actual current file content this session, not trusted from CONTEXT.md's estimates alone
- CC0 asset sourcing: MEDIUM — pack-level existence and licensing confirmed; individual file picks within each pack are unverified (explicitly Claude's Discretion per CONTEXT.md, deferred to implementation)
- Pitfalls: HIGH — every pitfall traces to either a specific line of the vendored engine source or a specific, already-documented engine-verified finding in this project's own STATE.md (Phase 22-03's go()-teardown finding)

**Research date:** 2026-07-08
**Valid until:** Kaplay version is pinned and not expected to change (no re-verification needed unless `lib/kaplay.mjs` is ever upgraded — re-read the source again if so, per CLAUDE.md's explicit "never upgrade without re-testing" rule). CC0 pack picks (MEDIUM confidence) should be re-confirmed at implementation time regardless, since this phase defers exact file selection to that step.
