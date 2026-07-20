// src/audio.js — the ONE audio seam: SFX playback, ambient music lifecycle, mute state
// + persistence. Every later wiring plan (27-03, 27-04, 27-05) imports this module and
// calls its exported functions at their mechanic seam.
//
// ENGINE-GLOBAL DISCIPLINE (a727c13): every Kaplay primitive this module touches
// (loadSound, loadMusic, play, setVolume, getVolume, onKeyPress, add, text, color,
// fixed, z) is referenced ONLY inside function bodies — NEVER at module top level.
// `musicHandle` and `muted` below are plain data references (not engine calls), so
// they are safe to declare at module scope. Policed by scripts/check-import-safety.sh.
//
// THE ONE SANCTIONED CLOSURE-LOCAL EXCEPTION: every other piece of run state in this
// codebase is closure-local per scene (game.js's `onHide` is the project's only other
// precedent for state surviving a scene boundary). Music playback must survive go()
// scene transitions, so its handle lives at module scope here — guarded by a null-check
// idempotency pattern (ensureMusicPlaying) so repeated calls from every scene body never
// stack a second overlapping track (AUD-04).
//
// GUARDED STORAGE SEAM: mute persistence mirrors src/progress.js's
// storageAvailable()/try-catch/never-throw discipline exactly, using its OWN localStorage
// key (CONFIG.AUDIO.MUTE_STORAGE_KEY) — CONFIG.SAVE.KEY is never read or written here,
// and src/progress.js's resetSave() docstring already anticipates and never touches this
// key.

import { CONFIG } from "./config.js";

// --- Module-level state (the ONE sanctioned exception to closure-local run state) ---
let musicHandle = null; // plain data reference, not an engine call — safe at module scope
let muted = null; // lazily loaded on first read via isMuted()/loadMuteFlag()

// ---------------------------------------------------------------------------
// Guarded localStorage seam — mirrors src/progress.js's storageAvailable()/
// loadSave()/writeSave() shape verbatim, own key, never throws.
// ---------------------------------------------------------------------------

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
    // Plain string flag, not a JSON blob — never JSON.parse this. Strict "1" comparison
    // means any malformed/corrupt/missing value safely defaults to false (T-27-01).
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
    console.warn("[NoxRun] Mute save failed:", e); // forgiving — mirrors writeSave()'s catch, never rethrows
  }
}

/**
 * Whether audio is currently muted. Lazily loads the persisted flag on first call.
 * @returns {boolean}
 */
export function isMuted() {
  if (muted === null) muted = loadMuteFlag();
  return muted;
}

/**
 * Ensure the ambient music loop is playing. Idempotent: if a music handle already
 * exists, this is a no-op — the ONLY thing standing between this codebase and a
 * music-stacking bug (AUD-04). Must be called synchronously from within a real user
 * gesture handler (browser autoplay policy) — see title.js's start handler.
 */
export function ensureMusicPlaying() {
  if (musicHandle) return; // idempotency guard — the whole point of this pattern
  musicHandle = play("ambient", { loop: true });
  // The music-path internal helper only reads `loop`/`paused` from the options object
  // passed to play() — a `volume` key there is silently ignored (27-RESEARCH.md
  // Pitfall 1). Volume must be set on the returned handle, AFTER creation.
  musicHandle.volume = CONFIG.AUDIO.MUSIC_VOLUME;
}

/**
 * Play a one-shot SFX by name.
 * @param {string} name - a loadSound()-registered asset name.
 * @param {number} [vol] - 0..1 gain; defaults to CONFIG.AUDIO.SFX_VOLUME.
 */
export function playSfx(name, vol) {
  play(name, { volume: vol ?? CONFIG.AUDIO.SFX_VOLUME });
}

/**
 * Re-apply the persisted mute flag to the actual master gain. Idempotent and cheap —
 * REQUIRED (not just toggleMute()) for AUD-03's "persists across reload" to actually be
 * true: without this, a fresh page load with muted=true previously saved would leave the
 * master gain at its default (unmuted) value even though the UI shows "MUTE". Called as
 * the first statement inside wireAudioUI() on every scene mount.
 */
function applyMuteState() {
  setVolume(isMuted() ? 0 : 1);
}

/**
 * Flip the mute flag, apply it to the master gain (ONE call silences/restores music AND
 * every SFX instance simultaneously), and persist it.
 */
export function toggleMute() {
  if (muted === null) muted = loadMuteFlag();
  muted = !muted;
  setVolume(muted ? 0 : 1);
  writeMuteFlag(muted);
}

/**
 * Wire the per-scene audio UI: re-sync actual output to the persisted mute flag, register
 * the M-key toggle AND a click on the icon itself (2026-07-08 human sign-off: the icon
 * read as a plain label, not a control — clicking it should also work, mirroring
 * select.js's box.onClick() pattern), and mount a small mute-state icon. Must be called
 * fresh from EVERY scene body (title.js, select.js, game.js) — go() clears the app-wide
 * input bus (Phase 22-03 engine-verified finding), so a boot-time-only registration would
 * silently stop firing after the first scene transition.
 */
export function wireAudioUI() {
  applyMuteState(); // re-sync master gain to the persisted flag on every scene mount

  // Mobile top-crop compensation (quick 260720-mob): the top-band mute icon shifts down
  // by CONFIG.HUD.MOBILE_DY on a coarse-pointer device (the bottom-anchored mobile stage
  // crops the top of the frame — see hud.js / index.html). matchMedia is a BROWSER
  // global (not an engine global) and the guard keeps node/headless imports safe.
  // Desktop resolves to 0 — byte-identical.
  const iconDy =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches
      ? CONFIG.HUD.MOBILE_DY
      : 0;

  const icon = add([
    text(isMuted() ? "MUTE" : "SND", { size: CONFIG.AUDIO.ICON_SIZE }),
    pos(CONFIG.AUDIO.ICON_X, CONFIG.AUDIO.ICON_Y + iconDy),
    color(
      CONFIG.PALETTE.TEXT_DIM[0],
      CONFIG.PALETTE.TEXT_DIM[1],
      CONFIG.PALETTE.TEXT_DIM[2],
    ),
    area(), // required for onClick() below — text() alone has no clickable hitbox
    fixed(),
    z(9000),
  ]);

  const handleToggle = () => {
    toggleMute();
    icon.text = isMuted() ? "MUTE" : "SND"; // update in place — never create a new icon per press
  };

  onKeyPress(CONFIG.AUDIO.MUTE_KEY, handleToggle);
  icon.onClick(handleToggle); // object-scoped — only fires when the icon itself is clicked

  // --- MOB-05: global first-gesture audio unlock (belt-and-braces over title.js) ---
  // A bare global onClick registered fresh on EVERY scene mount (go() clears the app
  // input bus per wireAudioUI's own contract above), so the FIRST tap/click ANYWHERE in
  // ANY scene unlocks the AudioContext — not just the title's start prompt. On touch,
  // Kaplay's touchToMouse synthesizes this left-click from a real tap, so a first finger
  // press unlocks audio too. ensureMusicPlaying() is idempotent (its null-handle guard),
  // so firing it on every first tap is harmless on repeat and byte-identical on desktop
  // (a click that would already run start()'s own ensureMusicPlaying()).
  //
  // WHY onClick (NOT touchstart) — iOS user-activation rule (37-RESEARCH.md Pitfall 6):
  // iOS Safari treats only certain events (pointerup / click / touchend / keydown) as a
  // user activation that may call AudioContext.resume(). A `touchstart` is NOT activation-
  // triggering on iOS, so wiring unlock there leaves music silent. Kaplay's onClick fires
  // on the pointerup/click edge, so it satisfies the activation rule. Do NOT rewire this
  // to touchstart. The REAL-DEVICE proof that this unlocks iOS audio is DEFERRED to a
  // physical-device gate (Phase 38 / MOB-06): Playwright synthetic taps grant activation
  // unconditionally, so a headless pass cannot prove the iOS-specific case.
  //
  // iOS ITP ~7-DAY STORAGE EVICTION (documentation-only expectation, 37-RESEARCH.md A4):
  // On iOS, Intelligent Tracking Prevention may evict this origin's localStorage (the mute
  // flag above AND src/progress.js's save blob) after ~7 days without a first-party
  // interaction. There is NO backend fix and NO code path here depends on persistence
  // surviving that window — the guarded seams already default forgivingly on a missing
  // value. The laptop remains the progress home; an evicted iOS save simply reads as a
  // fresh start, exactly like clearing browser data (per CLAUDE.md's persistence canon).
  onClick(() => ensureMusicPlaying());
}
