// src/ui/hud.js — the fixed, camera-immune progression HUD (SAVE-04).
//
// This is the one genuinely new Kaplay module of Phase 11: a screen-space level
// badge + XP fill bar that reads the loaded XP/level and a distinct, ADHD-safe
// level-up moment. It mirrors the src/ui/mathGate.js fixed()-overlay idiom exactly
// and reuses the dark-grunge palette (NO pink).
//
// ENGINE-GLOBAL DISCIPLINE (mirror src/ui/mathGate.js 9-16): Kaplay primitives
// (add, text, rect, color, pos, anchor, opacity, width, fixed, z, center, tween,
// easings, destroy) come from Kaplay `global: true`. They are used as bare globals
// exactly like mathGate.js does — they are NOT imported. The ONE import is CONFIG.
// src/ui/ is one directory below src/, so the sibling config import is `../config.js`.
//
// IN-WORLD, NOT THE DOM (CLAUDE.md canon): every visual is a Kaplay canvas object
// (text()/rect()). There is no innerHTML / document.* / markup-string sink anywhere
// here — the HUD is pure canvas draws, so there is no injection path.
//
// ONE-WAY CONTRACT (GATE-06 analogue / check-progress.sh assertion 8): the HUD only
// READS progress — via getLevel(), getXp(), nextThreshold(). It NEVER awards XP and
// NEVER assigns the tracker's level/xp. The arrow points scene -> HUD; the HUD is a
// passive reflection of the progression state. (The negative grep that enforces this
// is satisfied because this file contains no write-back call on the progress object.)
//
// ANTI-LEAK (RESEARCH Pitfall 4): mountHud is a FACTORY — no module-level mutable
// singleton — so a replay gets a fresh HUD. Every object is tagged ("hud" for the
// persistent badge/bar, "hud-flash" for the transient level-up banner) and mounts
// inside the scene closure, so KAPLAY destroys them on scene teardown (no stacking
// across go()/respawn). The flash self-destroys via an opacity tween + destroy (no
// setInterval/setTimeout — same no-timer discipline as the gate, ADHD-safe).

import { CONFIG } from "../config.js"; // HUD layout constants — the only non-engine import

// Dark-grunge palette per CLAUDE.md (#333 track border-grey, neon-green accent, NO pink).
// Reused verbatim from src/ui/mathGate.js 39-42 so the HUD reads as the same world.
const TRACK_GREY = [0x33, 0x33, 0x33]; // XP bar track (empty portion)
const ACCENT_GREEN = [0x00, 0xff, 0x88]; // badge + XP fill + level-up flash

/**
 * Mount the fixed progression HUD for one scene/session.
 *
 * FACTORY: returns a fresh { refresh, flashLevelUp } each call (no shared module
 * state), so a scene replay tears down the old HUD and mounts a clean one.
 *
 * @param {{ getLevel: () => number, getXp: () => number, nextThreshold: () => number }} progress
 *   The progression tracker (createProgress). Read ONE-WAY only — never mutated here.
 * @returns {{ refresh: () => void, flashLevelUp: () => void }}
 *   refresh() syncs the badge text + fill width to the current progress; flashLevelUp()
 *   shows a brief self-destroying "LEVEL UP" moment (fire only when addXp leveled up).
 */
export function mountHud(progress) {
  const M = CONFIG.HUD;

  // Level badge — neon-green text, top-left, fixed() + high z() so it floats over the
  // level and ignores the camera. Tagged "hud" → destroyed on scene teardown.
  const badge = add([
    text("LVL " + progress.getLevel(), { size: M.BADGE_SIZE }),
    pos(M.X, M.Y),
    color(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]),
    fixed(),
    z(9000),
    "hud",
  ]);

  // XP track — the empty bar (#333 grunge grey) the fill grows across.
  add([
    rect(M.BAR_W, M.BAR_H),
    pos(M.X, M.Y + M.BAR_DY),
    color(TRACK_GREY[0], TRACK_GREY[1], TRACK_GREY[2]),
    fixed(),
    z(9000),
    "hud",
  ]);

  // XP fill — neon-green progress, drawn one z above the track. Starts at 1px; refresh()
  // sets its width. The rect comp's width is a live, settable property.
  const fill = add([
    rect(1, M.BAR_H),
    pos(M.X, M.Y + M.BAR_DY),
    color(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]),
    fixed(),
    z(9001),
    "hud",
  ]);

  /**
   * One-way sync: re-read progress and update the badge text + fill width. Called by the
   * scene on entry (show loaded progress) and after each XP award. Never writes progress.
   */
  function refresh() {
    badge.text = "LVL " + progress.getLevel();
    // Fraction toward the next-level threshold, clamped to [0, 1] (a freshly leveled-up
    // surplus stays well under 1; guard against a 0 threshold just in case).
    const denom = progress.nextThreshold() || 1;
    const frac = Math.min(1, progress.getXp() / denom);
    fill.width = Math.max(1, M.BAR_W * frac); // >=1px so the bar is always visible
  }

  /**
   * The level-up moment (SAVE-04): a brief, subtle "LEVEL UP" banner that fades out and
   * self-destroys over CONFIG.HUD.FLASH_MS (450ms — ADHD-safe, NOT the archive's 800).
   * No scale-bomb, no lingering banner, no timer — a single opacity tween then destroy.
   * Tagged "hud-flash" so any in-flight banner is also wiped on scene teardown (anti-leak).
   * The scene fires this ONLY when the XP award returned a level-up.
   */
  function flashLevelUp() {
    const banner = add([
      text("LEVEL UP", { size: M.FLASH_SIZE }),
      anchor("center"),
      pos(center()),
      color(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]),
      opacity(1),
      fixed(),
      z(9500),
      "hud-flash",
    ]);
    // Fade 1 -> 0 over FLASH_MS, then remove the object — self-cleaning, no leaked handler.
    tween(
      1,
      0,
      M.FLASH_MS / 1000,
      (v) => (banner.opacity = v),
      easings.easeOutQuad,
    ).onEnd(() => destroy(banner));
  }

  return { refresh, flashLevelUp };
}
