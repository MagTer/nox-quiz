# Phase 27: Audio & ADHD-Safe Sound - Pattern Map

**Mapped:** 2026-07-08
**Files analyzed:** 12 (1 new module, 9 modified source files, 2 new shell/script gates)
**Analogs found:** 12 / 12 (all matched — this is a well-precedented codebase; no "no analog" files)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/audio.js` (NEW) | service (singleton manager) | event-driven + CRUD (mute persistence) | `src/progress.js` (guarded localStorage seam) + `src/scenes/game.js`'s `onHide` anti-leak exception | composite role-match (no single exact analog exists — this is the first audio module) |
| `src/config.js` (+`CONFIG.AUDIO`) | config | CRUD (static tunables) | itself — existing `CONFIG.HUD`/`CONFIG.TITLE` namespaced blocks | exact |
| `src/player.js` (+jump SFX call) | component (entity factory) | event-driven (key press) | itself — existing `JUMP_KEYS` press handler | exact (same file, additive call) |
| `src/ui/challenge.js` (+correct/wrong SFX) | component (shared UI overlay) | request-response (question/answer resolution) | itself — existing `choose()` resolution branch | exact (same file, additive call) |
| `src/mechanics/door.js` (+door SFX) | mechanic/controller | event-driven (collide → challenge → onSuccess) | `src/mechanics/gates.js` (near-identical sibling mechanic) | exact |
| `src/mechanics/gates.js` (+door SFX, reused cue) | mechanic/controller | event-driven | `src/mechanics/door.js` | exact |
| `src/ui/mathGate.js` (+clear SFX) | component (end-of-level UI) | event-driven (gate cleared → banner) | `src/ui/challenge.js` (sibling fixed-overlay UI it was extracted from) | exact |
| `src/mechanics/collect.js` (+pickup SFX) | mechanic/controller | event-driven (collide → pickup) | `src/mechanics/door.js` / `gates.js` (same collide→resolve shape) | role-match |
| `src/ui/hud.js` (mute icon, OR `wireAudioUI` mirrors its idiom) | component (fixed screen-space overlay) | CRUD (render + refresh) | itself — `mountHud`'s fixed()-overlay factory idiom | exact |
| `src/scenes/title.js` (+`wireAudioUI()` + `ensureMusicPlaying()` in `start`) | route/scene | event-driven (gesture-gated) | itself — existing `start`/`openResetConfirm` key-controller wiring | exact |
| `src/scenes/select.js` / `src/scenes/game.js` (+`wireAudioUI()` per-scene) | route/scene | event-driven (per-scene key re-registration) | `game.js`'s `escape` handler / `select.js`'s nav-key re-registration | exact |
| `scripts/check-audio.sh` (NEW) | test (shell gate) | batch (static assertion) | `scripts/check-progress.sh` | exact |
| `scripts/check-import-safety.sh` (extend scoped list) | test (shell gate) | batch (static assertion) | itself — existing Section 1/2 hardcoded file lists | exact |

## Pattern Assignments

### `src/audio.js` (NEW — service, singleton manager)

**Analog 1:** `src/progress.js` (guarded localStorage seam, never-throw discipline)
**Analog 2:** `src/scenes/game.js`'s `onHide` — the project's only other precedent for module/cross-scene-surviving state wired inside function bodies (a727c13-compliant)

**Module header / firewall comment pattern** (mirror `src/progress.js:1-30`):
```js
// src/audio.js — the ONE audio seam: SFX playback, ambient music lifecycle, mute state.
//
// ENGINE-GLOBAL DISCIPLINE (a727c13): every Kaplay primitive (loadSound, loadMusic, play,
// setVolume, getVolume, onKeyPress) is referenced ONLY inside function bodies — NEVER at
// module top level. `musicHandle` and `muted` below are plain data references (not engine
// calls), so they are safe to declare at module scope.
//
// THE ONE SANCTIONED CLOSURE-LOCAL EXCEPTION: every other piece of run state in this
// codebase is closure-local per scene. Music playback must survive go() scene transitions,
// so its handle lives at module scope here — guarded by a null-check idempotency pattern
// (ensureMusicPlaying) so repeated calls from every scene body never stack a second track.
//
// GUARDED STORAGE SEAM (mirrors src/progress.js's storageAvailable()/try-catch/never-throw
// discipline exactly): mute persistence uses its OWN localStorage key, distinct from
// CONFIG.SAVE.KEY — src/progress.js's resetSave() docstring already anticipates and never
// touches this key.

import { CONFIG } from "./config.js";
```

**Guarded storage seam pattern** (copy verbatim shape from `src/progress.js:270-352`):
```js
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
    return localStorage.getItem(CONFIG.AUDIO.MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMuteFlag(v) {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(CONFIG.AUDIO.MUTE_STORAGE_KEY, v ? "1" : "0");
  } catch (e) {
    console.warn("[NoxRun] Mute save failed:", e); // forgiving — mirrors writeSave()'s catch
  }
}
```

**Idempotent module-level singleton pattern** (RESEARCH.md Pattern 2, engine-verified against `lib/kaplay.mjs`):
```js
let musicHandle = null; // module-level — the ONE sanctioned exception (must survive go())
let muted = null; // lazily initialized on first read

export function ensureMusicPlaying() {
  if (musicHandle) return; // idempotency guard — prevents the stacking bug (Pitfall 2)
  musicHandle = play("ambient", { loop: true }); // engine call — inside a function body
  musicHandle.volume = CONFIG.AUDIO.MUSIC_VOLUME; // must be set AFTER creation, not in opts
}

export function playSfx(name, vol) {
  play(name, { volume: vol ?? CONFIG.AUDIO.SFX_VOLUME });
}

export function toggleMute() {
  if (muted === null) muted = loadMuteFlag();
  muted = !muted;
  setVolume(muted ? 0 : 1); // ONE master-gain call silences/restores music AND every SFX
  writeMuteFlag(muted);
}

export function isMuted() {
  if (muted === null) muted = loadMuteFlag();
  return muted;
}
```

**Per-scene key/UI re-registration pattern** (mirror `src/scenes/title.js:236` `onKeyPress("r", openResetConfirm)` and `src/ui/hud.js`'s `mountHud` factory shape):
```js
// Called fresh from EVERY scene body (title.js, select.js, game.js) — go() clears the
// app-wide input bus (Phase 22-03 engine-verified finding), so a boot-time-only
// registration would silently stop firing after the first scene transition.
export function wireAudioUI() {
  onKeyPress(CONFIG.AUDIO.MUTE_KEY, () => {
    toggleMute();
    refreshMuteIcon();
  });
  const icon = add([
    text(isMuted() ? "MUTE" : "SND", { size: CONFIG.AUDIO.ICON_SIZE }),
    pos(CONFIG.AUDIO.ICON_X, CONFIG.AUDIO.ICON_Y),
    color(CONFIG.PALETTE.TEXT_DIM[0], CONFIG.PALETTE.TEXT_DIM[1], CONFIG.PALETTE.TEXT_DIM[2]),
    fixed(),
    z(9000),
    "hud", // reuse hud.js's teardown tag convention if mounted inside game.js;
           // title.js/select.js use their own scene tag ("title"/"select")
  ]);
  function refreshMuteIcon() {
    icon.text = isMuted() ? "MUTE" : "SND";
  }
}
```

**Error handling pattern:** never throw — every storage access wrapped in try/catch returning a safe default, identical to `progress.js`'s `loadSave()`/`writeSave()` (lines 289-334).

---

### `src/config.js` (+`CONFIG.AUDIO` block)

**Analog:** itself — existing namespaced sections (e.g. `CONFIG.HUD`, `CONFIG.TITLE`, `CONFIG.GATE`)

**Pattern** (mirror the `PALETTE`/`CONFIG.HUD` shape at `src/config.js:12-51`, `79+`):
```js
AUDIO: {
  MUSIC_VOLUME: 0.35, // ~30-40% of SFX gain per CONTEXT.md — tune at human sign-off
  SFX_VOLUME: 1.0,
  MUTE_KEY: "m", // confirmed unused via codebase-wide onKeyPress grep
  MUTE_STORAGE_KEY: "noxrun_mute_v1", // OWN key — distinct from CONFIG.SAVE.KEY, never touched by resetSave()
  ICON_SIZE: 14,
  ICON_X: 600, // top-right corner, clear of CONFIG.HUD (top-left) and CONFIG.HINT (bottom-left)
  ICON_Y: 8,
},
```
All tunables (volumes, key binding, storage key literal, icon layout) MUST live here — no magic numbers in `audio.js` or any mechanic file, per the project's binding "all tunables live in config.js" rule.

---

### `src/player.js` (+ jump SFX call site)

**Analog:** itself — existing `JUMP_KEYS` press handler (`src/player.js` ~line 40+, confirmed structure: `onKeyPress(JUMP_KEYS, () => { ... buffer = ... })`)

**Imports pattern** (mirror lines 19-20):
```js
import { CONFIG } from "./config.js";
import * as fx from "./fx.js"; // existing pattern for a sibling engine-side effects module
import * as audio from "./audio.js"; // NEW — same shape as the fx.js import above
```

**Core pattern** — add `audio.playSfx("jump")` as the first statement inside the existing `onKeyPress(JUMP_KEYS, ...)` body (plays on PRESS, not deferred to the physics jump), exactly as RESEARCH.md's Code Examples section shows verbatim against the real file.

---

### `src/ui/challenge.js` (+ correct/wrong SFX at the ONE shared resolution seam)

**Analog:** itself — the existing `choose(i)` function's `correct`/`!correct` branches

**Imports pattern** (mirror lines 1-20 module header conventions — bare engine globals, only non-engine imports listed):
```js
import * as audio from "../audio.js"; // NEW sibling import, same `../` depth as CONFIG/brain imports
```

**Core pattern** (the ONE seam — do not duplicate in door.js/gates.js/mathGate.js):
```js
function choose(i) {
  if (cleared) return;
  if (i < 0 || i >= q.choices.length) return;
  const picked = q.choices[i];
  const correct = picked === q.answer;
  brain.reportResult(q.a, correct);
  const box = boxes[i];
  if (!correct) {
    audio.playSfx("wrong"); // soft neutral tone ONLY — hard requirement, never a buzzer
    if (box) box.color = rgb(...CONFIG.PALETTE.DANGER);
    shake(6);
    return;
  }
  cleared = true;
  audio.playSfx("correct"); // covers door/gates/mathGate/collect — they all route through here
  close();
  onSuccess?.({ table: q.a });
}
```
This is the single insertion point for correct/wrong SFX — mechanic-specific "unlock"/"celebrate" SFX are layered separately in each mechanic's own `onSuccess` callback (see below), never here.

---

### `src/mechanics/door.js` and `src/mechanics/gates.js` (+ door/gate "unlock" SFX)

**Analog:** each other — near-identical sibling mechanics (both wire `player.onCollide` → `openChallenge()` → `onSuccess` → destroy the blocker)

**Core pattern** — add `audio.playSfx("door")` inside the existing `onSuccess` callback's `destroy(doorObj)` block (per RESEARCH.md's Architectural Responsibility Map), reusing the SAME "door" SFX name for both mechanics (CONTEXT.md: "Door/gate open: short distinct unlock cue... separate from the correct-chime").

**Imports pattern:** add `import * as audio from "../audio.js";` alongside each file's existing sibling imports (mechanics/ is one directory below src/, same depth as ui/).

---

### `src/ui/mathGate.js` (+ level-clear SFX)

**Analog:** `src/ui/challenge.js` (the sibling fixed-overlay UI mathGate.js was originally extracted from — same directory, same engine-global discipline header)

**Core pattern** — add `audio.playSfx("clear")` inside the existing goal-banner/celebration block, a calm non-fanfare cue distinct from "correct" and "door".

---

### `src/mechanics/collect.js` (+ pickup SFX)

**Analog:** `src/mechanics/door.js` / `src/mechanics/gates.js` (same collide → resolve → destroy shape)

**Core pattern** — add `audio.playSfx("pickup")` at the existing "correct pickup touch" resolution point, a light pluck/pop distinct from "correct".

---

### `src/scenes/title.js` (+ `wireAudioUI()` + `ensureMusicPlaying()` in the gesture handler)

**Analog:** itself — the existing `start`/key-controller wiring (`const start = () => go("select");` at line 105, `onKeyPress("r", openResetConfirm)` at line 236)

**Imports pattern** (mirror lines 22-23):
```js
import { CONFIG } from "../config.js";
import { resetSave } from "../progress.js";
import * as audio from "../audio.js"; // NEW — same `../` sibling-import depth
```

**Core pattern (gesture-gate anchor)** — `ensureMusicPlaying()` MUST be the FIRST synchronous statement inside `start`, never deferred (browser autoplay policy requires `AudioContext.resume()` inside the original gesture call stack):
```js
const start = () => {
  audio.ensureMusicPlaying(); // FIRST statement — synchronous, inside the real gesture handler
  go("select");
};
```
Call `audio.wireAudioUI()` once in the scene body (same pattern as the existing `onKeyPress("r", openResetConfirm)` bare call at the bottom of the factory).

---

### `src/scenes/select.js` / `src/scenes/game.js` (+ `wireAudioUI()` per-scene re-registration)

**Analog:** `game.js`'s `escape` handler and `select.js`'s nav-key re-registration — both already re-register per scene body because `go()` clears the app-wide input bus (Phase 22-03 engine-verified finding, already documented in this project's STATE.md)

**Core pattern** — call `audio.wireAudioUI()` once near the top of each scene factory body, alongside the scene's existing key-controller registrations; also call `audio.ensureMusicPlaying()` as a belt-and-braces re-assert (no-op if `musicHandle` already exists).

---

## Shared Patterns

### Guarded localStorage seam (own key, never-throw)
**Source:** `src/progress.js:270-352` (`storageAvailable()`/`loadSave()`/`writeSave()`/`resetSave()`)
**Apply to:** `src/audio.js`'s mute-flag read/write — same try-catch-return-default shape, own key (`CONFIG.AUDIO.MUTE_STORAGE_KEY`), never touches `CONFIG.SAVE.KEY`.

### Fixed screen-space overlay (camera-immune, tagged for teardown)
**Source:** `src/ui/hud.js:48-101` (`mountHud`'s badge/bar/hint `add([... fixed(), z(9000), "hud"])` idiom)
**Apply to:** the mute icon in `audio.js`'s `wireAudioUI()` — same `fixed()` + high `z()` + scene-tag pattern, mounted fresh per scene (no module-level singleton for the visual object itself, only for the music handle).

### Per-scene key re-registration (go() clears the input bus)
**Source:** `src/scenes/title.js:236` (`onKeyPress("r", openResetConfirm)`), `game.js`'s `escape` handler, `select.js`'s nav keys — all re-registered fresh in every scene body
**Apply to:** `audio.js`'s mute-key binding — `wireAudioUI()` must be called fresh from title.js, select.js, AND game.js; a single boot-time `main.js` registration would silently die after the first `go()`.

### Self-cleaning tween (no timers/schedulers)
**Source:** `src/ui/hud.js:134-141` (`flashLevelUp`'s `tween(...).onEnd(() => destroy(banner))`), `src/scenes/title.js:231-233` (identical idiom for the reset-confirmation banner)
**Apply to:** any transient audio-related visual feedback (e.g. a brief "muted"/"unmuted" flash, if added) — must use the tween+onEnd(destroy) idiom, never `setTimeout`/`wait()` (SAFE-01 no-timer mandate, enforced by `scripts/check-safety.sh`).

### a727c13 engine-global discipline
**Source:** `src/ui/hud.js:8-12`, `src/scenes/title.js:8-13`, `src/player.js:9-10` — the repeated module-header comment pattern documenting that every Kaplay primitive is referenced ONLY inside function bodies
**Apply to:** `src/audio.js` — `loadSound`/`loadMusic`/`play`/`setVolume`/`getVolume`/`onKeyPress` all live inside `ensureMusicPlaying()`/`toggleMute()`/`wireAudioUI()` function bodies, never at module top level. `musicHandle`/`muted` module-level `let` declarations are plain data, not engine calls, so they are the one safe exception.

### Shell gate mirroring
**Source:** `scripts/check-progress.sh` (structure: static asserts + ends with a `smoke-*.mjs` browser check)
**Apply to:** the new `scripts/check-audio.sh` — assert `assets/sfx/*.ogg` + `assets/music/*.ogg` exist, one `CREDITS.md` row + one `assets/LICENSES/*.txt` proof per vendored asset, and that `CONFIG.AUDIO.MUTE_STORAGE_KEY` is a string literal distinct from `CONFIG.SAVE.KEY`.

## No Analog Found

None — every file in this phase's scope has at least a role-match analog in the existing codebase (see table above). `src/audio.js` itself has no single exact analog since it's the first audio module, but its two composite sub-patterns (guarded storage seam + module-level cross-scene singleton) are both directly precedented.

## Metadata

**Analog search scope:** `src/`, `src/ui/`, `src/mechanics/`, `src/scenes/`, `scripts/` (existing check-*.sh gates)
**Files read this pass:** `src/progress.js`, `src/ui/hud.js`, `src/scenes/title.js`, `src/config.js` (lines 1-80), `src/player.js` (lines 1-40), `src/ui/challenge.js` (lines 1-30) — remaining integration seams (door.js, gates.js, mathGate.js, collect.js exact line numbers, check-import-safety.sh's scoped list) already read and byte-confirmed this session by 27-RESEARCH.md and reused here rather than re-read (no re-reads of ranges already in context, per phase-researcher's own sourcing log).
**Pattern extraction date:** 2026-07-08
