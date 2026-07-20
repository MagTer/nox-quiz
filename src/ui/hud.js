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
// Colors read from the single source of truth, CONFIG.PALETTE (VIS-01; Phase 26 Plan 01).

/**
 * Mount the fixed progression HUD for one scene/session.
 *
 * FACTORY: returns a fresh { refresh, flashLevelUp, showKey } each call (no shared
 * module state), so a scene replay tears down the old HUD and mounts a clean one.
 *
 * @param {{ getLevel: () => number, getXp: () => number, nextThreshold: () => number }} progress
 *   The progression tracker (createProgress). Read ONE-WAY only — never mutated here.
 * @returns {{ refresh: () => void, flashLevelUp: () => void, showKey: () => void }}
 *   refresh() syncs the badge text + fill width to the current progress; flashLevelUp()
 *   shows a brief self-destroying "LEVEL UP" moment (fire only when addXp leveled up).
 */
export function mountHud(progress) {
  const M = CONFIG.HUD;

  // Mobile top-crop compensation (quick 260720-mob): on a coarse-pointer device the
  // fill-width bottom-anchored #stage (index.html) crops the TOP of the frame on
  // screens wider than 16:9, which would hide the top-band HUD. Shift every top-band
  // element down by CONFIG.HUD.MOBILE_DY there. Feature-detect the PRIMARY pointer via
  // matchMedia (same guard idiom as touchControls.js — a BROWSER global, not an engine
  // global, and guarded for node/headless so an import can never throw). Desktop
  // (pointer: fine) resolves to 0 — the kid-validated desktop HUD stays byte-identical.
  const mobileDy =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches
      ? M.MOBILE_DY
      : 0;

  // Level badge — neon-green text, top-left, fixed() + high z() so it floats over the
  // level and ignores the camera. Tagged "hud" → destroyed on scene teardown.
  const badge = add([
    text("LVL " + progress.getLevel(), { size: M.BADGE_SIZE }),
    pos(M.X, M.Y + mobileDy),
    color(CONFIG.PALETTE.REWARD[0], CONFIG.PALETTE.REWARD[1], CONFIG.PALETTE.REWARD[2]),
    fixed(),
    z(9000),
    "hud",
  ]);

  // XP track — the empty bar (#333 grunge grey) the fill grows across.
  add([
    rect(M.BAR_W, M.BAR_H),
    pos(M.X, M.Y + M.BAR_DY + mobileDy),
    color(CONFIG.PALETTE.BORDER[0], CONFIG.PALETTE.BORDER[1], CONFIG.PALETTE.BORDER[2]),
    fixed(),
    z(9000),
    "hud",
  ]);

  // XP fill — neon-green progress, drawn one z above the track. Starts at 1px; refresh()
  // sets its width. The rect comp's width is a live, settable property.
  const fill = add([
    rect(1, M.BAR_H),
    pos(M.X, M.Y + M.BAR_DY + mobileDy),
    color(CONFIG.PALETTE.REWARD[0], CONFIG.PALETTE.REWARD[1], CONFIG.PALETTE.REWARD[2]),
    fixed(),
    z(9001),
    "hud",
  ]);

  // Persistent controls hint (SAFE-02 — USER OVERRIDE: ALWAYS visible, NOT a fading start
  // hint). A small, always-on fixed() canvas text() reminder pinned BOTTOM-LEFT (CONFIG.HINT
  // — X:16/Y:330), deliberately clear of the top-left badge/bar so it never overlaps the
  // level/XP UI. #e8e8e8 reads ~18:1 on the #0a0a0a stage (calm, not over-stimulating —
  // SAFE-03). Tagged "hud" so it tears down with the rest of the HUD on scene replay
  // (anti-leak; mounted inside this factory, no module-level singleton). It is a static
  // literal — no innerHTML/document.* (no-DOM-sink canon), no injection path. There is NO
  // tween/scheduler on it: it is persistent, never timed away (no-timer mandate intact).
  // TOFU FALLBACK (RESEARCH A2 / Pitfall 6): if the "← → ·" glyphs render as tofu boxes in
  // the kid UAT, swap the copy to "LEFT/RIGHT move · SPACE jump" — the "SPACE jump" substring
  // MUST stay (the SAFE-02 audit positive greps for it).
  add([
    text("← → move · SPACE jump", { size: CONFIG.HINT.SIZE }),
    pos(CONFIG.HINT.X, CONFIG.HINT.Y),
    color(CONFIG.PALETTE.TEXT[0], CONFIG.PALETTE.TEXT[1], CONFIG.PALETTE.TEXT[2]),
    fixed(),
    z(9000),
    "hud",
  ]);

  // Key-held indicator (Phase 34.5, KEY-01) — hidden-by-default fixed() text, shown
  // once the player picks up a key. Placed clear of the top-left badge/bar
  // (CONFIG.HUD.X:16/Y:16 + BAR_W:160) and the top-right mute icon
  // (CONFIG.AUDIO.ICON_X:600). Tagged "hud" so it tears down with the rest of the
  // HUD on scene teardown (anti-leak — same contract as the badge/bar above).
  const keyIndicator = add([
    text(CONFIG.HUD.KEY_GLYPH, { size: CONFIG.HUD.KEY_SIZE }),
    pos(CONFIG.HUD.KEY_X, CONFIG.HUD.KEY_Y + mobileDy),
    color(CONFIG.PALETTE.REWARD[0], CONFIG.PALETTE.REWARD[1], CONFIG.PALETTE.REWARD[2]),
    fixed(),
    z(9000),
    opacity(0), // hidden until collected
    "hud",
  ]);

  /**
   * Show the persistent "key held" indicator. Called by src/mechanics/key.js's
   * pickup handler. A plain opacity(0)->1 flip — no scheduler, camera-immune,
   * stays visible for the rest of the run (key-held is run-state, never reset
   * until a full scene re-entry).
   */
  function showKey() {
    keyIndicator.opacity = 1;
  }

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
      color(CONFIG.PALETTE.REWARD[0], CONFIG.PALETTE.REWARD[1], CONFIG.PALETTE.REWARD[2]),
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

  return { refresh, flashLevelUp, showKey };
}
