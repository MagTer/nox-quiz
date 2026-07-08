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

  const icon = add([
    text(isMuted() ? "MUTE" : "SND", { size: CONFIG.AUDIO.ICON_SIZE }),
    pos(CONFIG.AUDIO.ICON_X, CONFIG.AUDIO.ICON_Y),
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
}
