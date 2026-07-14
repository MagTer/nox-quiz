// src/config.js — all tunable values in ONE place.
//
// CONTEXT-locked: no magic numbers in the player / camera / scene logic modules.
// Every movement, physics, and camera number they use comes from here, so Phase 12
// can retune the game feel with the kid in a single file. Leaf-level constants only:
// this module imports nothing.
//
// Starting tune values come from CONTEXT + 08-RESEARCH.md. JUMP_FORCE and
// MAX_FALL_SPEED are set explicitly (not relying on body() defaults — RESEARCH
// Open Question #1) and are tuned on the stress strip in 08-01 Task 3.

// --- Centralized color palette (VIS-01; Phase 26 Plan 01) ---
// The single source of truth for every color used across src/scenes/, src/ui/,
// src/fx.js, and src/levels/build.js. Plain data literal — no engine calls, safe
// at module top level per the a727c13 rule. Exposed below as CONFIG.PALETTE.
const PALETTE = {
  BG: [0x0a, 0x0a, 0x0a],
  SURFACE: [20, 20, 20],
  SURFACE_ALT: [30, 30, 30],
  SURFACE_UNLOCKED: [0x11, 0x11, 0x11],
  // BORDER/MUTED_BORDER brightened from their original 0x333333/0x555555 values
  // (VIS-02; Phase 26 Plan 02) — the originals measured 1.57:1/2.66:1 against BG,
  // below the 3.0:1 UI-component WCAG threshold this plan's must-have requires
  // for every role. MUTED (0x444444, not a checked pairing) is left as-is.
  // See 26-CONTRAST.md and 26-02-SUMMARY.md's deviation log.
  BORDER: [0x5e, 0x5e, 0x5e],
  MUTED: [0x44, 0x44, 0x44],
  MUTED_BORDER: [0x70, 0x70, 0x70],
  TEXT: [0xe8, 0xe8, 0xe8],
  TEXT_DIM: [0x88, 0x88, 0x88],
  DANGER: [0xff, 0x44, 0x33],
  REWARD: [0x00, 0xff, 0x88],
  CLEARED: [0x66, 0xcc, 0xff],
  CURSOR: [0xff, 0xff, 0xff],
  // --- Hue-tinted dark accents (VIS-02; Phase 26 Plan 02, expanded Plan 26-12) ---
  // MOSS/SLATE/RUST brightened from the plan's initial literal picks
  // (0x2a3d2a/0x2c3844/0x5a3322, ~1.7:1 contrast) to clear scripts/check-contrast.mjs's
  // 3.0:1 UI-component threshold against BG — see 26-CONTRAST.md and 26-02-SUMMARY.md's
  // deviation log. Byte-unchanged since 26-02 (already human-signed-off, reused as-is).
  // FERN/TEAL/STEEL/CLAY/EMBER added in Plan 26-12 (mid-execution revision, 2026-07-07):
  // expanded from 3 shared accents to 8 — one dedicated accent per level — after Wave 3's
  // bake exposed identical themes for level pairs 1/2, 3/4, 7/8. See 26-CONTEXT.md addendum.
  ACCENT_MOSS: [0x47, 0x68, 0x47], // dark moss green — calm early-level accent (~3.15:1 vs BG) — level 1
  ACCENT_FERN: [0x4a, 0x70, 0x58], // warm mid-green, between moss and teal — level 2
  ACCENT_TEAL: [0x45, 0x70, 0x70], // green-to-blue transitional — level 3
  ACCENT_SLATE: [0x4e, 0x64, 0x78], // cold blue-grey — mid-level accent (~3.22:1 vs BG) — level 4
  ACCENT_STEEL: [0x52, 0x5e, 0x82], // cooler blue-grey than slate — level 5 (brightened from initial 0x4a5668, ~2.66:1, to clear 3.0:1 WCAG)
  ACCENT_CLAY: [0x70, 0x5a, 0x48], // warm grey-brown, transitional toward rust — level 6
  ACCENT_RUST: [0x8c, 0x50, 0x36], // muted rust/umber — harsh late-level accent (~3.13:1 vs BG) — level 7
  ACCENT_EMBER: [0xa8, 0x50, 0x2c], // harshest/most saturated stop, past rust — level 8
};

export const CONFIG = {
  PALETTE,

  // --- Movement / physics (CONTEXT starting tune values — tunable in Phase 12) ---
  RUN_SPEED: 240, // px/s — horizontal run speed (left/right)
  GRAVITY: 1400, // px/s^2 — downward acceleration applied by body()
  JUMP_FORCE: 520, // px/s — upward impulse; ~3-tile (~96px) jump at GRAVITY 1400 (tuned on strip)
  JUMP_CUT: 0.45, // unitless — variable-height: vel.y *= JUMP_CUT on early release (Plan 02)
  COYOTE_MS: 100, // ms — grace window to still jump just after leaving the ground (Plan 02)
  BUFFER_MS: 120, // ms — how long a pending jump press stays valid before landing (Plan 02)
  MAX_FALL_SPEED: 900, // px/s — terminal fall speed; body({ maxVelocity }) anti-tunnel cap

  // --- Camera (consumed in Plan 02) ---
  CAM_RATE: 10, // 1/s — half-life rate for 1 - exp(-CAM_RATE*dt()) smoothing (8..12)
  CAM_Y_FACTOR: 0.5, // unitless — gentle vertical follow relative to primary X follow

  // --- Level bounds FALLBACKS + respawn (FALL_MARGIN) ---
  // Since Phase 24 these are FALLBACKS only: game.js uses a level's explicit `bounds`
  // field when present, else derives the right edge from geometry (levels now run
  // 3640–6200px wide). Only LEVEL_LEFT/TOP/BOTTOM still commonly apply.
  LEVEL_LEFT: 0, // px — left world edge (camera clamp)
  LEVEL_RIGHT: 2240, // px — right-edge fallback (historical v3.0 single-level width; real levels override/derive)
  LEVEL_TOP: 0, // px — top world edge (camera clamp)
  LEVEL_BOTTOM: 360, // px — bottom world edge (one 360px screen tall; level is linear/horizontal)
  FALL_MARGIN: 120, // px — respawn when player.pos.y > LEVEL_BOTTOM + FALL_MARGIN

  // --- Level / content (Phase 9) ---
  TILE_SIZE: 16, // px — CC0 pack native tile size (sprite slice + floor-tile grid math)
  FLOOR_Y: 320, // px — top edge of the floor runs (player stands at this Y)
  FLOOR_THICKNESS: 40, // px — merged-floor collider depth; thick to resist tunneling on tall drops (Pitfall 3)

  // --- Visual tuning constants (Phase 18 art/animation/parallax) ---
  PLAYER_FRAMES: 12, // count — player-swamphunter.png sliceX (12 frames of 16x32)
  PLAYER_ANIM_DEADZONE: 10, // px/s — below this treat horizontal speed as idle/rest
  PLAYER_IDLE_SPEED: 6, // fps — idle anim frame rate
  PLAYER_RUN_SPEED: 10, // fps — run anim frame rate
  PLAYER_JUMP_SPEED: 1, // fps — single-frame jump anim; speed must be >0 in Kaplay
  PLAYER_FALL_SPEED: 8, // fps — fall anim frame rate, 2-frame loop over frames 10-11 of player-swamphunter.png
  PLAYER_LAND_SPEED: 1, // fps — single-frame land anim; speed must be >0 in Kaplay, mirrors PLAYER_JUMP_SPEED
  PLAYER_LAND_HOLD_MS: 120, // ms — how long the synthesized land pose (fall's last frame, index 11) holds after a falling→grounded transition before reverting to idle/run; consistent with FX.STRETCH_MS/SQUASH_MS's 120-140ms window
  GROUND_FRAMES: 5, // count — ground.png sliceX (5 frames of 16x16)
  PARALLAX: {
    FAR_RATIO: 0.15, // far layer scroll ratio vs camera
    MID_RATIO: 0.45, // mid layer scroll ratio vs camera
    NEAR_RATIO: 0.75, // near layer scroll ratio vs camera
    FAR_Z: -30, // z-order: behind everything
    MID_Z: -20,
    NEAR_Z: -10,
    // Vertical anchoring is screen-locked in src/parallax.js (far plate top at
    // view top, mid/near bottoms at view bottom) — no world-space Y tunable.
  },

  // --- Terrain rendering tunables (ART-02/ART-03; Phase 32) ---
  // Autotiled ground-mass fill + perf/proof budgets for the browser-boot terrain
  // checks. The chunk-size and fill-depth keys are consumed by the autotile builder
  // (Plan 32-03); the budget/floor/byte-size keys are consumed by the boot-time
  // proof script (Plan 32-05).
  TERRAIN: {
    FILL_CHUNK_COLS: 40, // count — max columns per {tiled:true} fill chunk; the spike-proven ceiling from SPIKE-FINDINGS.md Spike B — an oversized chunk silently renders nothing
    FLOOR_FILL_DEPTH_PX: 64, // px — fill depth for floor runs; every shipped level's floor sits at FLOOR_Y 320 with bounds.bottom 360 (or the CONFIG.LEVEL_BOTTOM 360 fallback), a real 40px gap to the camera's lower clamp edge — 64px gives comfortable margin without a per-level bounds lookup
    // NOTE — PLATFORM_FILL_DEPTH_PX (a 32px "shallow fill" under raised platforms) was
    // REMOVED on 2026-07-14. Platforms no longer draw any fill: they draw the biome
    // atlas's PLATFORM frame (frame 2), a 16px ledge that exactly matches the 16px
    // `p.h` collider (WYSIWYG). The old cap+fill emission drew a 48px slab over that
    // 16px collider, so the ledge hung 32px below the surface the player stands on and
    // ate the headroom under the tier above. Floors are unaffected and still fill to
    // FLOOR_FILL_DEPTH_PX. Do not reintroduce a platform fill depth.
    OBJECT_BUDGET: 650, // count — hard-fail ceiling for the browser-boot per-level terrain object-count assertion; the spike measured ~410 objects safe at a synthetic 16-row stress depth, real levels land ~400-420 objects at this phase's actual ~2-4-row fill depth per 32-RESEARCH.md's level-04 Metadata calculation — headroom set above that real max
    // fps — hard-fail floor for the browser-boot debug.fps() sample. Guards the
    // perf-CLIFF class (one giant tiled quad silently rendering at 15fps), not
    // frame-perfect 60. Recalibrated 45 -> 40 on 2026-07-12: the user-approved
    // full-viewport biome plates (commit f6a386e) legitimately add ~1.5 screens
    // of blended fill per frame, moving headless-Chromium/swiftshader steady-state
    // on the heaviest level (04) from ~50 to 44-45 measured over 8s — real GPUs
    // (the actual play environment) are unaffected. 40 clears both that new
    // steady-state and the known ~43 entry-transient dip the 1500ms sample can
    // catch, while still failing the 15-25fps cliff class by a wide margin.
    FPS_FLOOR: 40,
    MIN_SCREENSHOT_BYTES: 4000, // bytes — PNG screenshot byte-size floor used as a non-blank-render proxy in browser-boot; measured locally against this exact game: an about:blank page screenshots at ~2,667 bytes, a real pre-Phase-32 level-entry screenshot at ~8,735 bytes — 4,000 sits clear of the blank floor with margin below real content, and Phase 32's new terrain-mass+parallax content should only push real screenshots higher, never lower
  },

  TITLE_BG_Z: -100, // z-order for shared title/select backdrop

  COIN_FRAMES: 8, // count — coin.png is a 256x32 sheet of 8 evenly-gridded 32px frames (sliceX)
  COIN_SPIN_SPEED: 12, // fps — coin spin anim frame rate
  // (No COIN_SIZE: coin placement is intentionally data-driven via raw {x, y} in
  // level.js — the 32px frame size is never read in logic, so no constant is kept.)
  SPIKE_SIZE: 16, // px — spike sprite footprint (full tile); the hitbox is tightened below
  SPIKE_HITBOX_W: 12, // px — tightened spike collider width (narrower than the 16px tile — fair points-only hit)
  SPIKE_HITBOX_H: 8, // px — tightened spike collider height (only the upper visible spikes, not the empty base)
  GOAL_SIZE: 16, // px — goal sprite footprint
  ALCOVE_SIZE: 24, // px — secret-alcove trigger footprint (LVL-06; invisible walk-through square)

  // --- Math brain (ported verbatim from archive/math-lab.html 604-619 — DO NOT re-tune) ---
  // The 6–9 weighting + EWMA constants are already validated; the selection math is
  // locked and out of scope to change. Read by src/math/brain.js (CONFIG.BRAIN.*) only.
  BRAIN: {
    ACCURACY_ALPHA: 0.15, // EWMA weight for a new answer
    MASTERY_THRESHOLD: 0.8, // 80% over last MASTERY_WINDOW → reduce drilling
    STRUGGLE_THRESHOLD: 0.6, // below this → STRUGGLE_BOOST weight
    STRUGGLE_BOOST: 1.5, // weight multiplier for a struggling table
    MASTERY_WINDOW: 10, // sliding window size for the mastery check
    HARD_TABLES: [6, 7, 8, 9], // drilled tables (biased selection)
    EASY_TABLES: [1, 2, 3, 4, 5], // confidence tables (lower selection share)
  },

  // --- Math gate UI (dark-grunge panel; Plan 02 consumes; Phase 12 retunes visuals) ---
  GATE: {
    DIM_OPACITY: 0.6, // full-screen dim layer opacity behind the panel
    PANEL_W: 420, // px — gate panel width
    PANEL_H: 220, // px — gate panel height
    // Answer-box grid — lifted from src/ui/challenge.js inline literals (21-REVIEW IN-03;
    // 22-05 Candidate 3, APPROVED 2026-07-05; 844cd08 constant-lift convention). Values
    // byte-identical to the pre-lift literals — zero behavior change.
    BOX_W: 84, // px — answer box width
    BOX_H: 44, // px — answer box height
    BOX_GAP: 16, // px — horizontal gap between adjacent answer boxes
  },

  // --- Locked door (mid-level challenge seam; Plan 15-03) ---
  // Mirrors the level-select locked-tile palette (src/scenes/select.js) so the locked
  // visual language is consistent across the whole game.
  DOOR: {
    W: 32, // px — door footprint width
    H: 64, // px — door panel height (compact visual; an invisible tall blocker handles physics)
    SPRITES: ["door"], // real sprite art (VIS-04; Phase 26 Plan 05) — replaces the flat-color rect+glyph placeholder
  },

  // --- Key/lock (mid-level NON-MATH gate seam; Phase 34.5, KEY-01/KEY-02) ---
  // The game's first non-math barrier — reverses SEED-001's "no new play
  // mechanics" clause (user's explicit override, 34.5-CONTEXT.md). Mirrors
  // DOOR's W/H apex-blocker idiom so it reads as a related barrier, but
  // PANEL_COLOR reuses PALETTE.MUTED (a colored-rect placeholder, not a
  // sprite) so no new asset/manifest entry is needed — real art is Phase 35.
  // W is load-bearing beyond visuals: scripts/lib/key-lock-check.mjs
  // partitions the reachability graph on an x-band of exactly this width, so
  // it MUST stay in sync with the footprint src/levels/build.js emits.
  LOCK: {
    W: 32, // px — lock footprint width (mirrors DOOR.W; the validator's x-partition band width)
    H: 64, // px — lock panel height (mirrors DOOR.H)
    PANEL_COLOR: PALETTE.MUTED, // dark grunge placeholder fill — real art is Phase 35
    HINT_TEXT: "Find the key", // shown on a keyless collide; brief, non-blocking (NO pause, NO challenge)
    HINT_SIZE: 12, // px — mirrors HINT.SIZE
    HINT_Y: 120, // px — upper-center band; clear of the top HUD and the bottom-left HINT (Y:330)
    HINT_MS: 1200, // ms — self-cleaning fade window (tween().onEnd() idiom, never a timer)
  },

  // --- Key (walk-through pickup; Phase 34.5, KEY-01) ---
  // Visible and telegraphed — CONTEXT locks "no hidden/secret keys" (unlike
  // secretAlcove, which IS a secret). COLOR is a bright gold, deliberately
  // distinct from the dark LOCK.PANEL_COLOR so the pair reads as key-vs-barrier.
  KEY: {
    W: 20, // px — key trigger footprint width
    H: 20, // px — key trigger footprint height
    COLOR: [0xd4, 0xaf, 0x37], // muted gold — bright/telegraphed against the dark grunge palette
  },

  // --- Checkpoint math gates (mid-level challenge seam; MECH-04) ---
  // Mirrors DOOR dimensions/palette so the locked checkpoint reads as a related barrier.
  MATH_GATE: {
    W: 32, // px — gate footprint width
    H: 64, // px — gate panel height
    LOCKED_GREY: PALETTE.MUTED, // locked fill (matches DOOR/SELECT locked-tile palette)
    LOCKED_BORDER: PALETTE.MUTED_BORDER, // locked outline
    GLYPH_SIZE: 22, // px — gate glyph text size
  },

  // --- Defeat-enemy encounter (MECH-05) ---
  // Real sprite art since Phase 26 Plan 05 (VIS-04) — 3 distinct variants.
  ENEMY: {
    W: 32, // px — enemy footprint width
    H: 32, // px — enemy footprint height
    IDLE_SPEED: 5, // fps — enemy-hellhound idle-loop frame rate. 6 frames at 5fps = a 1.2s breathing loop. Was 8fps, which read as a sprint rather than an idle (it sat between the player's own idle at 6fps and run at 10fps) — flagged at the Phase 33 human-verify checkpoint as "a bit fast to be realistic".
    FRAME_W: 64, // px — enemy-hellhound.png's native per-frame width; twice the W/H blocker footprint, used to center the wider visual panel over the unchanged blocker
    SPRITES: ["enemy-hellhound"], // real animated sprite art (ART-05; Phase 33) — the single shared animated blocker sprite, replacing the 3-variant static set
  },

  // --- Progression / XP (ported VERBATIM from archive/math-lab.html 604-619 — DO NOT re-tune) ---
  // The XP-per-table amounts and the level-threshold curve are the validated v1/v2 values.
  // Read by src/progress.js (Phase 11 Wave 1) only. HARD_TABLES/EASY_TABLES are intentionally
  // duplicated with CONFIG.BRAIN — different consumers (XP amount vs. selection weight); the
  // firewall keeps progress.js and brain.js independent. No HP/combat/dungeon fields (out of scope).
  PROGRESS: {
    XP_EASY: 10, // XP for a correct answer on tables 1–5
    XP_HARD: 20, // XP for a correct answer on tables 6–9
    XP_ALCOVE: 5, // flat XP for touching a level's hidden secret alcove (LVL-06) — deliberately below XP_EASY so it reads as a bonus, not a shortcut
    BASE_XP: 200, // XP required for Level 1 → Level 2
    LEVEL_MULT: 1.3, // per-level threshold multiplier (threshold = round(BASE_XP * MULT^(L-1)))
    HARD_TABLES: [6, 7, 8, 9], // hard tables (award XP_HARD)
    EASY_TABLES: [1, 2, 3, 4, 5], // easy tables (award XP_EASY)
  },

  // --- Save / persistence (Phase 26 Nox Run rebrand CLEAN-RESET key — new namespace, no migration) ---
  // The Phase 26 Nox Run rebrand deliberately starts a FRESH save under a NEW key. The prior
  // pre-rebrand v4.0 clean-reset key is NOT migrated and NOT deleted — it is simply orphaned/
  // made invisible by this new key, per the explicit user-confirmed decision in 26-CONTEXT.md
  // (the rebrand intentionally resets pre-rebrand player progress).
  // CONFIG.SAVE.KEY is the single source of truth, also read by scripts/check-progress.sh's
  // grep assertion and every Playwright script's SAVE_KEY const — all updated together
  // whenever this key changes. The old key is never read or written anywhere.
  // (allowedTables et al. are level DATA, not config — they live in the level registry.)
  SAVE: {
    KEY: "noxrun_platformer_v1", // Phase 26 Nox Run rebrand clean-reset localStorage key for the platformer progression
    VERSION: 3, // save-format version (gate: a foreign/older blob → safe defaults) — bumped 2→3 for MECH-06's secretFound field (deliberate, no-migration reset)
  },

  // --- HUD layout (level badge + XP bar + level-up flash; Wave 3 consumes; Phase 12 retunes) ---
  // FLASH_MS is 450 (NOT the archive's 800) — the ADHD-safe flash window per the STATE.md
  // v2.0 tech-debt note. Subtle, no scale-bomb. Phase 12 owns final juice tuning.
  HUD: {
    X: 16, // px — top-left anchor X
    Y: 16, // px — top-left anchor Y
    BADGE_SIZE: 18, // px — level badge text size
    BAR_W: 160, // px — XP bar width
    BAR_H: 10, // px — XP bar height
    BAR_DY: 24, // px — XP bar vertical offset below the badge
    FLASH_SIZE: 36, // px — level-up flash text size
    FLASH_MS: 450, // ms — level-up flash duration (ADHD-safe window; NOT archive's 800)

    // --- Key-held indicator (Phase 34.5, KEY-01) ---
    // Persistent while the key is held; placed clear of the top-left badge/bar
    // (HUD.X:16/HUD.Y:16 + BAR_W:160) and the top-right mute icon (AUDIO.ICON_X:600).
    KEY_X: 540, // px — top band, left of the mute icon
    KEY_Y: 8, // px — top band, level with the mute icon
    KEY_SIZE: 16, // px — key-held indicator text size
    KEY_GLYPH: "KEY", // plain string — TOFU-fallback caution (hud.js:91): no glyph risk
  },

  // --- Juice / game-feel tuning (Phase 12; Plan 01 consumes — squash/dust/pop/burst) ---
  // Phase 12 juice tuning — retuned WITH THE KID in UAT (SAFE-03). Every magnitude here
  // is deliberately subtle, brief, and non-strobing: small scale deltas, short ms windows,
  // one smooth fade per effect (easeOutQuad, never elastic). BURST_MS (400) stays at or below
  // the HUD.FLASH_MS (450) feel so the level-clear burst never out-stimulates the level-up flash.
  FX: {
    SQUASH_X: 1.15, // unitless — landing squash horizontal scale (wider)
    SQUASH_Y: 0.85, // unitless — landing squash vertical scale (shorter)
    SQUASH_MS: 140, // ms — landing squash settle duration (brief)
    STRETCH_X: 0.9, // unitless — jump stretch horizontal scale (narrower)
    STRETCH_Y: 1.1, // unitless — jump stretch vertical scale (taller)
    STRETCH_MS: 120, // ms — jump stretch settle duration (brief)
    DUST_COUNT: 4, // count — number of dust particles on landing
    DUST_SIZE: 3, // px — dust particle square size
    DUST_SPREAD: 8, // px — horizontal spread between dust particles
    DUST_RISE: 16, // px — how far dust rises before fading out
    DUST_MS: 300, // ms — dust rise + fade duration
    POP_SIZE: 9, // px — coin pop marker base footprint (independent of DUST_SIZE; IN-02)
    POP_SCALE: 1.5, // unitless — coin/collect pop peak scale
    POP_MS: 220, // ms — coin/collect pop duration (brief)
    BURST_MS: 400, // ms — level-clear burst duration (<= HUD.FLASH_MS feel; non-strobing)
    BURST_SIZE: 80, // px — level-clear burst base square footprint (IN-03)
    BURST_GROW: 4, // unitless — burst peak scale; grows 1 -> BURST_GROW over BURST_MS (IN-03)
    // BURST_Z must sit ABOVE the gate-cleared dim (mathGate.js z 9990, GATE.DIM_OPACITY
    // backdrop) so the celebratory burst is actually VISIBLE over the cleared level, yet
    // BELOW the "LEVEL CLEAR" banner (mathGate.js z 9994) so it never covers that text.
    // 9993 is the only slot above the 9990 dim and below the 9994 banner (WR-01).
    BURST_Z: 9993, // z-order — above gate dim (9990), below "LEVEL CLEAR" banner (9994)

    // --- Secret-alcove discovery popup (MECH-03; Phase 29 Plan 02) ---
    // World-space rising/fading "+5 XP" text, mirrors DUST's rise/fade idiom.
    XP_POPUP_SIZE: 14, // px — "+5 XP" alcove popup text size
    XP_POPUP_RISE: 24, // px — how far the popup rises before fading out
    XP_POPUP_MS: 600, // ms — popup rise + fade duration (one smooth easeOutQuad fade, non-strobing)
  },

  // --- Title scene layout (Phase 14 NAV-01; src/scenes/title.js consumes) ---
  // Dark-grunge title screen: the baked "NOX RUN" logo (BRAND-01/BRAND-03;
  // Phase 26 Plan 07 — replaces the old plain-text wordmark, so the old
  // TITLE_SIZE text-size field is dead and removed alongside it) + a
  // press-to-start prompt below it. No magic numbers live in the scene —
  // every size/offset/duration reads here.
  TITLE: {
    // ms — one-shot, non-strobing logo-hero opacity 0->1 tween on scene-enter.
    // Was 400ms; human-verify feedback (2026-07-07) found that "not noticeable"
    // — bumped to the BRAND-03 ≤500ms ceiling itself so the reveal reads as a
    // deliberate fade rather than an instant pop-in. Still comfortably clears
    // check-safety.sh's no-scheduler gate (tween() only, still one-shot).
    LOGO_REVEAL_MS: 500,
    PROMPT_SIZE: 20, // px — "press to start" prompt text size
    PROMPT_DY: 72, // px — vertical offset of the prompt BELOW the centered title

    // --- Reset Progress control (quick-260707-95c) ---
    RESET_SIZE: 14, // px — muted "press R to reset progress" prompt text size
    RESET_Y: 336, // px — near-bottom placement, clear of the start prompt (y+72=252) and canvas bottom (360)
    // Backing chip behind the reset prompt (bug fix: RESET_FG 0x888888 is byte-identical
    // to title-bg.png's castle/hill shapes — build-art-assets.py's ENVIRONMENT_PALETTE
    // "light grey — strong edge/seam highlight" token — so the text was rendering but
    // perfectly camouflaged wherever it overlapped the art. A dark chip guarantees
    // contrast no matter what the backdrop art looks like.
    RESET_CHIP_W: 210, // px — wide enough for "press R to reset progress" at RESET_SIZE
    RESET_CHIP_H: 20, // px
    CONFIRM_PANEL_W: 420, // px — confirm overlay panel width (matches CONFIG.GATE's panel)
    CONFIRM_PANEL_H: 160, // px — confirm overlay panel height (three lines of text, not four answer boxes)
    CONFIRM_TITLE_SIZE: 22, // px — "Reset ALL progress?" heading text size
    CONFIRM_BODY_SIZE: 16, // px — confirm overlay body text size
    CONFIRM_HINT_SIZE: 14, // px — "Y = yes / N = cancel" hint text size
    RESET_FLASH_MS: 900, // ms — self-destroying "Progress reset." confirmation duration
  },

  // --- Level-select scene layout (Phase 14 NAV-02; src/scenes/select.js consumes) ---
  // A 4-column x N-row grid of numbered level tiles, three visual states
  // (locked/unlocked/cleared). No magic numbers in the scene — tile geometry + text
  // sizes read here. Real art is deferred to Phase 18; these are placeholder-but-tunable.
  //
  // IN-03 RESOLVED (Phase 25): the old single-row layout's overflow risk (flagged here
  // since Phase 14) is fixed — select.js now lays tiles in a 4-column x N-row grid using
  // ROW_GAP for vertical spacing. Appending levels beyond 8 will need EITHER more rows
  // (cheap: the `Math.floor(i/4)` row math already generalizes) OR a paging scheme if the
  // grid outgrows the 640x360 canvas vertically.
  SELECT: {
    COLS: 4, // grid column count — the single number that defines the 2x4 layout;
    // referenced by select.js tile layout, row/col derivation, and cursor navigation.
    TILE_W: 96, // px — tile width
    TILE_H: 96, // px — tile height
    GAP: 24, // px — horizontal spacing between tiles
    ROW_GAP: 16, // px — vertical gap between row 1 and row 2. Ceiling derivation (25-RESEARCH.md
    // Pitfall 5): ROW_Y(180) + TILE_H(96) + ROW_GAP + TILE_H/2(48) <= 360 requires ROW_GAP <= 36;
    // 16 is comfortably inside that.
    ROW_Y: 180, // px — vertical center of the tile row (screen-space, fixed())
    START_X: 120, // px — left edge / center anchor X of the first tile in the row
    LABEL_SIZE: 28, // px — tile number label text size
    GLYPH_SIZE: 22, // px — lock/check state-glyph text size
    HEADING_SIZE: 24, // px — "Select a Level" heading text size

    // --- Secret-found star marker (MECH-06; Phase 29 Plan 02) ---
    SECRET_SIZE: 14, // px — secret-found star marker text size
    SECRET_INSET: 10, // px — inset from a tile's top-right corner for the star marker
  },

  // --- Persistent controls hint (Phase 12; Plan 02 consumes — SAFE-02 always-visible hint) ---
  // Bottom-left corner, deliberately clear of the top-left HUD badge/bar (HUD.X:16 / HUD.Y:16)
  // so the always-on "LEFT/RIGHT move · SPACE jump" reminder never overlaps the level/XP UI.
  HINT: {
    X: 16, // px — bottom-left anchor X
    Y: 330, // px — bottom-left anchor Y (near LEVEL_BOTTOM:360, clear of the top HUD)
    SIZE: 12, // px — hint text size (small, unobtrusive)
  },

  // --- Audio (AUD-02/AUD-03/AUD-04; Phase 27 Plan 02; src/audio.js consumes) ---
  // The ONE audio seam's tunables: SFX/music gain, the mute key binding, the mute
  // persistence key, and the mute-icon layout. Per the "all tunables live in config.js"
  // binding rule, no magic numbers live in src/audio.js itself.
  AUDIO: {
    MUSIC_VOLUME: 0.35, // unitless (0..1) — ~30-40% of SFX gain per 27-CONTEXT.md; tunable at human sign-off
    SFX_VOLUME: 1.0, // unitless (0..1) — default per-SFX gain when playSfx() is called with no explicit vol
    JUMP_VOLUME: 0.2, // unitless (0..1) — per-SFX override (27-07 human sign-off: the retro jump1.ogg boing read as "too loud and too intrusive" even at 0.45; lowered further)
    MUTE_KEY: "m", // confirmed unused via codebase-wide onKeyPress grep (27-RESEARCH.md)
    MUTE_STORAGE_KEY: "noxrun_mute_v1", // OWN localStorage key — distinct from CONFIG.SAVE.KEY above; never read/written by src/progress.js
    ICON_SIZE: 14, // px — mute icon text size
    ICON_X: 600, // px — top-right corner, clear of CONFIG.HUD (top-left, X:16/Y:16) and CONFIG.HINT (bottom-left, X:16/Y:330)
    ICON_Y: 8, // px — top-right corner Y
  },
};
