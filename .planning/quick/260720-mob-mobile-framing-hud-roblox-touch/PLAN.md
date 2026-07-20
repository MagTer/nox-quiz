---
phase: quick-260720-mob
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/index.html
  - src/config.js
  - src/ui/hud.js
  - src/ui/touchControls.js
  - src/audio.js
  - src/scenes/select.js
autonomous: true
requirements: []

must_haves:
  truths:
    - "On Android Chrome landscape the game fills the screen WIDTH and the BOTTOM (ground + player + action) is fully visible; overflow crops the TOP (sky), never the bottom"
    - "The score/XP HUD (badge, bar, key indicator, mute icon) sits below the cropped top band on mobile"
    - "Touch controls are noticeably bigger, raised for thumb reach, Roblox layout (movement bottom-left, jump bottom-right), and a synthesized tap on JUMP makes the player jump while a held touch on RIGHT walks the player right (Qe mapping intact with negative canvas top)"
    - "Desktop (pointer: fine) is visually byte-identical: 960x540 stage, HUD at original coords, no touch buttons drawn; browser-boot passes"
  artifacts:
    - "src/index.html coarse-pointer #stage: fill-width 16:9 box, position:fixed bottom-anchored, body 100dvh + overflow:hidden"
    - "src/config.js: HUD.MOBILE_DY, AUDIO reuse of the same shift, SELECT.MOBILE_DY, retuned TOUCH rects"
    - "src/ui/hud.js + src/audio.js + src/scenes/select.js applying the coarse-only Y shift"
    - "src/ui/touchControls.js drawing bigger circular buttons from the retuned CONFIG.TOUCH rects"
  key_links:
    - "Kaplay letterbox stays ON so the single Qe transform keeps mouse+touch in one coordinate space; #stage box is exactly 16:9 so zero bars"
---

<objective>
Real-phone (Android Chrome landscape) play-test fixes:

1. FRAMING: the game's bottom half falls below the visible fold. Root cause: on coarse
   pointer #stage is 100vw x 100vh, and 100vh on mobile Chrome is the LARGE viewport
   (includes the space under the dynamic toolbar), so Kaplay letterboxes the 640x360
   buffer into an oversized box whose bottom is hidden. Fix: size #stage to a fill-width
   16:9 box (width:100vw; height:calc(100vw * 9 / 16)) anchored position:fixed at the
   viewport BOTTOM, body capped at 100dvh with overflow:hidden — the ground/player hug
   the visible bottom edge and only sky crops off the top.
2. HUD: config-driven coarse-pointer Y shift (CONFIG.HUD.MOBILE_DY) so badge/XP bar/key
   indicator/mute icon move below the cropped top band. Same idea for the select screen's
   logo badge + heading (CONFIG.SELECT.MOBILE_DY). Desktop shift is 0 — byte-identical.
3. CONTROLS: retune CONFIG.TOUCH — bigger (96px pads, 112px jump), raised off the bottom
   edge, Roblox layout kept (movement bottom-LEFT, jump bottom-RIGHT), circular visuals.
   Hit-testing stays the existing AABB against CONFIG.TOUCH rects; input still flows only
   through src/input.js (no new jump/movement logic).

Verification: Playwright Android-Chrome-landscape emulation (mobile viewport + hasTouch +
isMobile + DPR), before/after screenshots to the session scratchpad, synthesized CDP touch
events proving JUMP and RIGHT map correctly with the canvas top above the fold, then the
desktop gates (check-gate/check-safety/check-import-safety/check-progress/validate-levels/
browser-boot) all green.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: fill-width bottom-anchored mobile framing + HUD/select move-down</name>
  <files>src/index.html, src/config.js, src/ui/hud.js, src/audio.js, src/scenes/select.js</files>
  <action>Coarse-pointer-only CSS reframe in index.html (fine-pointer rules untouched); add MOBILE_DY tunables to config; apply matchMedia("(pointer: coarse)")-guarded Y offsets in hud.js/audio.js/select.js (0 on desktop).</action>
  <verify><automated>emulation screenshots + gates</automated></verify>
  <done>Ground/player at visible bottom in emulation; HUD visible; desktop gates green.</done>
</task>

<task type="auto">
  <name>Task 2: bigger raised Roblox-style touch controls</name>
  <files>src/config.js, src/ui/touchControls.js</files>
  <verify><automated>synthesized CDP touchStart/touchEnd on JUMP (player jumps) and held RIGHT (player walks right); desktop draws nothing (browser-boot parity)</automated></verify>
  <done>Buttons bigger + raised, circular, taps map correctly through Qe with negative canvas top.</done>
</task>

</tasks>

<commit_discipline>
Stage ONLY the named src files + this plan dir + STATE.md. NEVER git add -A: the tree
carries unrelated untracked WIP (.planning/phases/26-grunge-palette-nox-run-rebrand/,
assets/enemy-1..3.png) that must stay uncommitted.
</commit_discipline>
