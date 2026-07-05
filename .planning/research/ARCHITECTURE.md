# Architecture Research — v5.0 "Nox Run" Feature Integration

**Domain:** No-build browser platformer (vendored Kaplay 3001.0.19, static nginx hosting)
**Researched:** 2026-07-05
**Confidence:** HIGH (every integration point below was read from the live source tree, not assumed)
**Mode:** Subsequent-milestone integration research — how v5.0's features (audio/SFX, 8 levels, structural validation, palette expansion, rebrand, table-pool change) attach to the existing architecture. Supersedes the v4.0-era version of this file.

## System Overview (as-built, v4.1)

```
index.html (file:// guard, <title>, canvas CSS)
    │
main.js ── kaplay({global:true}) init ── loadSprite(...) ── scene() registry ── go("title")
    │
    ├── scenes/title.js ──go("select")──▶ scenes/select.js ──go("game",{levelId})──▶ scenes/game.js
    │                                          │                                        │
    │                                          │ reads                                  │ closure-owns ALL run state
    │                                          ▼                                        ▼
    │                                   levels/index.js ◀──────────────── getLevel(id) / LEVEL_ORDER
    │                                   (LEVELS[], BY_ID, isUnlocked)                  │
    │                                          ▲                                        ├── levels/build.js  (geometry → entities)
    │                                   level-01..04.js (pure data,                     ├── player.js        (jump/land seams)
    │                                   node-importable, a727c13)                       ├── camera.js / parallax.js / fx.js
    │                                                                                   ├── ui/hud.js  ui/mathGate.js
    ├── config.js  (leaf constants — imports nothing)                                   ├── mechanics/{door,gates,enemy,collect}.js
    ├── math/brain.js  (LOCKED, firewalled — imports only config)                       │        └──all──▶ ui/challenge.js (shared seam)
    └── progress.js  (pure factory + guarded localStorage seam)                         └── progress.js (loadSave/writeSave)

scripts/browser-boot.mjs + scripts/lib/mechanic-drive.mjs  (Playwright gate: drives all LEVEL_ORDER levels)
docker/{Dockerfile,nginx.conf}  (static hosting; .mjs MIME fix)
```

Cross-cutting invariants that every v5.0 addition MUST respect (verified present in every current module):

- **a727c13:** no Kaplay global referenced at module top level — engine globals only inside function bodies that run after `kaplay()` init. `main.js` is the single exception (it runs post-init by construction).
- **Anti-leak:** no module-level mutable run state; scene state lives in scene-factory closures; app-global listeners (e.g. `onHide` in game.js) are explicitly cancelled on scene leave.
- **SAFE-01 (enforced by `scripts/check-safety.sh`):** no `setTimeout`/`setInterval`/`wait(`/`loop(`/`lifespan(` **call forms** in src code (comment-stripped scan; `loop:` as an object *property* is explicitly allowed — this matters for looping music, see below).
- **Brain firewall:** `src/math/brain.js` imports only `../config.js`; it is LOCKED — v5.0 changes must not touch its weighting math.

---

## 1. Audio / SFX Integration

### Recommendation: new app-lifetime module `src/audio.js` + sound loads in `main.js` + one-line hooks at existing seams

**Where it lives:** `src/audio.js` at src/ root, sibling of `fx.js`, modeled directly on fx.js's discipline (fx.js's header comments are effectively the house style guide for exactly this kind of module):

- Only import: `./config.js` (new `CONFIG.AUDIO` namespace: `MUSIC_VOL` ~0.25, `SFX_VOL` ~0.5, `KEY: "noxrun_audio_v1"`).
- Every engine call (`play`, `setVolume`) only inside exported function bodies → a727c13 satisfied. The vendored Kaplay 3001 build exposes `loadSound`, `loadMusic`, `setVolume`, `audioCtx` and the `play()` global (verified by grep of `lib/kaplay.mjs`).
- **Singleton vs per-scene: app-lifetime singleton, deliberately.** Ambient music must survive `go("title") → go("select") → go("game")`; Kaplay audio handles are not scene objects and are NOT torn down by `go()`. A per-scene audio instance would restart the music on every scene change. This is the same documented app-global exception game.js already makes for `onHide` (its WR-02 comment). Concretely: `audio.js` holds a small module-scoped state object (`{ muted, musicHandle }`) that is **plain data at import time** (no engine call at top level) and is only mutated through exported functions called after init. Document it in the header as an intentional app-lifetime exception to the anti-leak rule — that rule targets *run* state leaking across replays; mute/music are *app* state by design.
- Suggested surface: `initAudio()` (reads persisted mute, applies volume), `startMusic()` (idempotent — no-op if already playing; `play("ambient", { loop: true, volume: CONFIG.AUDIO.MUSIC_VOL })`), `toggleMute()`, `isMuted()`, and one tiny function per cue: `sfxJump() / sfxLand() / sfxCoin() / sfxCorrect() / sfxWrong() / sfxClear() / sfxLevelUp()`. Each cue is a one-shot `play("sfx-x", { volume })` — one-shots need no cleanup, so no anti-leak surface.

**SAFE-01 note (verified against check-safety.sh):** the scan bans the *call form* `loop(` but explicitly allows the `loop:` object-property form — `play("ambient", { loop: true })` passes the gate as written. Do not use Kaplay's `loop()` scheduler for anything audio-related.

**Sound loading:** `loadSound("sfx-jump", "../assets/audio/jump.ogg")` etc. in `main.js`, right beside the existing `loadSprite` block — same `../assets/...` path convention (main.js's own "CRITICAL PATH RULE" comment: wrong path = silent 404). Assets go in `assets/audio/` (CC0, e.g. Kenney audio packs) with per-file license notes in `assets/LICENSES/` matching the existing convention. **nginx MIME is a non-issue:** Kaplay fetches audio as bytes and runs `decodeAudioData` (MIME-agnostic), unlike ES modules — the existing `types {}` block needs no change, though adding ogg/mp3 mappings is harmless belt-and-braces. Add `.ogg` to `scripts/browser-boot.mjs`'s MIME map (it already has `.wav`/`.mp3`).

**Autoplay policy / where music starts:** browsers suspend AudioContext until a user gesture. The title scene's `start()` handler (`title.js:69` — Enter/Space/click) is a guaranteed gesture: call `audio.startMusic()` there before `go("select")`. Do NOT start music at boot in main.js.

**Mute state persistence — separate localStorage key, NOT the existing save.** Opinionated call, three reasons grounded in the code:

1. `progress.js`'s `validate()`/`serialize()` chain is a hardened, progression-only contract (explicit-field copy, prototype-pollution guards, version gate). Threading a `settings.muted` field through it means touching the most security-audited module in the tree for a cosmetic toggle.
2. Mute can be toggled on title/select screens where **no `progress` instance exists** (select.js builds one transiently; title.js builds none). Writing mute through `progress.serialize()` would force loading + serializing the whole save on every toggle from every scene.
3. A one-key blob (`{"muted":true}`) under `CONFIG.AUDIO.KEY` with its own ~10-line guarded read/write inside audio.js (mirroring progress.js's `storageAvailable()` try-catch idiom — copy the pattern, don't import the module; progress.js stays progression-only) is simpler and keeps module responsibilities clean.

**Mute toggle input:** register `onKeyPress("m", ...)` once in `main.js` after init (app-lifetime, like the display-scale block). Keys 1–4 are reserved by challenge.js (its WR-03 comment); M is free. Add a small mute indicator to `ui/hud.js` and an "M mute" mention in the controls hint string.

**SFX hook points (exact seams, all verified):**

| Cue | File / seam | Why here |
|-----|-------------|----------|
| correct answer | `ui/challenge.js` `choose()` correct branch (just before `onSuccess?.()`, ~line 303) | ONE call site covers door, math-gate, enemy AND the end-of-level mathGate — they all route through openChallenge |
| wrong answer (soft, non-punishing) | `ui/challenge.js` `choose()` wrong branch (beside `shake(6)`, ~line 293) | same single-seam argument |
| collect: correct pickup | `mechanics/collect.js` correct branch (~line 106, beside `challenge.close()`) | collect bypasses challenge's `choose()` (renderChoices:false) — needs its own hook |
| collect: wrong pickup (soft) | `mechanics/collect.js` wrong branch (~line 114, beside `fx.pop`) | same |
| jump | `player.js` beside `fx.stretch(player)` (~line 73, the buffered-jump consume — the file's ONE jump path) | existing juice seam |
| land | `player.js` `player.onGround()` beside `fx.squash/fx.dust` (~line 41) | existing land seam |
| coin | `scenes/game.js` `player.onCollide("coin", ...)` beside `fx.pop` (~line 168) | existing seam |
| level clear | `scenes/game.js` `onClear` beside `fx.clearBurst()` (~line 222) | existing seam |
| level up | `scenes/game.js` beside `hud.flashLevelUp()` (~line 217) | existing seam |
| barrier opened (door/gate/enemy) | already covered by "correct answer" — do NOT also hook the mechanics' `onSuccess` callbacks or every clear plays two sounds | anti-double-fire |

**ADHD-safe audio contract (write into the phase's UAT criteria):** calm ambient loop at low volume; wrong-answer cue must be a soft neutral tick/thud, never a buzzer; no stinger louder than the music by more than ~2×; mute always one keypress away and persisted.

**New files:** `src/audio.js`, `assets/audio/*` (+ LICENSES entries). **Modified:** `main.js` (loadSound block, M-key, `initAudio()`), `config.js` (CONFIG.AUDIO), `scenes/title.js` (startMusic on gesture), `ui/challenge.js` (2 lines), `mechanics/collect.js` (2 lines), `player.js` (2 lines), `scenes/game.js` (3 lines), `ui/hud.js` (mute indicator, optional), `scripts/browser-boot.mjs` (.ogg MIME).

---

## 2. Eight Levels Through the Registry/Builder

The v4.0 data spine was built for exactly this and needs almost no structural change:

- **New files:** `src/levels/level-05.js` … `level-08.js` — pure-data descriptors copying the level-02+ schema (id, displayName, allowedTables, explicit `bounds` — level-02/03/04 already carry `bounds` (2800/3400/4000 wide); game.js prefers `level.bounds`, else derives from geometry. Give every new/lengthened level explicit bounds).
- **Modified:** `src/levels/index.js` — 4 new imports + append to the `LEVELS` array. That's it: `LEVEL_ORDER`, `BY_ID`, `isUnlocked` chain-unlock, select.js's tile list, and `scripts/browser-boot.mjs`'s seeded save blob (`LEVEL_ORDER.slice(0,-1)` — its WR-02 fix made it derivation-based) all **derive from LEVELS** and pick up new levels automatically.
- **Unchanged:** `build.js` (fully descriptor-driven; all mechanic arrays already `?? []`-guarded), `game.js` (loads by id, derives bounds), `progress.js` (levels map is id-keyed, schema-free).

**Lengthening the existing 4:** pure data edits in level-01..04.js (more floor runs, platforms, mechanics; extend `bounds.right`). Traps: (a) level-01 has **no explicit `bounds`** — derivation covers it, but add explicit bounds while touching it; (b) level-01's header says a Wave-0 smoke deep-equals its geometry against v3.0 values — that fixture/check must be updated or retired when the geometry changes.

**select.js at 8 tiles — must change.** `config.js`'s own IN-03 OVERFLOW FLAG documents it: one row of 96px tiles + 24px gaps from START_X 120 overflows the 640px canvas at ~5 tiles. Recommended fix: **2×4 grid**, keeping current tile size (4 tiles/row = 4×96 + 3×24 = 456px, fits centered in 640):

- `config.js` SELECT: add `COLS: 4`, `ROW_GAP: 24`; retune `ROW_Y` → first-row center ~140, second row at `ROW_Y + TILE_H + ROW_GAP` (~260; heading still clears at top; 360px canvas holds both rows).
- `select.js` layout: `x = START_X + (t.i % COLS) * (TILE_W + GAP)`, `y = ROW_Y + Math.floor(t.i / COLS) * (TILE_H + ROW_GAP)`; glyph/label offsets already tile-relative, unchanged.
- Keyboard cursor: keep left/right cycling the `selectable` list (already linear + wrapping, still fully functional); optionally add up/down = jump to the selectable entry offset by COLS. Don't over-engineer.

**Difficulty ramp data (allowedTables per level).** Current pools: L1 `[6,7,8,9]`, L2 `[1..7]`, L3 `[3..9]`, L4 `[6,7,8,9]`. Two stale things to fix while re-ramping: (a) level-01's "stays on the v3.0 hard pool — do not soften" comment is superseded by an 8-level ramp — remove it; (b) table 1 dropped everywhere (see §5). Suggested ramp (data only; roadmap can retune):

| Level | Pool | Rationale |
|-------|------|-----------|
| 01 | [2,3,4,5] | confidence on-ramp |
| 02 | [3,4,5,6] | first hard table |
| 03 | [4,5,6,7] | |
| 04 | [5,6,7,8] | |
| 05 | [6,7,8,9] | full hard pool |
| 06 | [6,7,8,9] | |
| 07 | [2..9] | mixed review (brain's own 6–9 bias does the weighting) |
| 08 | [6,7,8,9] | finale |

Platforming ramp stays authored-in-geometry (gap widths, platform chains, mechanic density) — enforced by the linter in §3.

---

## 3. Structural Validation — new static linter FIRST, existing Playwright drive as the dynamic backstop

**Recommendation: BOTH layers, with a new static linter carrying the primary load.**

**New file: `scripts/validate-levels.mjs` — a pure-node static geometry linter over the descriptors.** This is the payoff of a727c13: level descriptors import only `config.js` and are **already node-importable with zero browser** (levels/index.js's header states this; browser-boot.mjs already imports them in node today). The linter imports `LEVELS` + `CONFIG` and checks each level deterministically in milliseconds. All jump-envelope numbers derive from CONFIG (single source — the same derivation build.js's blocker heights and mechanic-drive.mjs's header already use):

- apex rise = `JUMP_FORCE² / (2·GRAVITY)` ≈ 96.6px; flat-gap airtime = `2·JUMP_FORCE/GRAVITY` ≈ 0.743s; max flat-gap horizontal = `RUN_SPEED · airtime` ≈ 178px. Apply a conservative factor (~0.85) so JUMP_CUT/edge-pixel effects can't make a "valid" level marginal.

Checks (each maps to a known v4.x bug class or a v5.0 requirement):

1. **Reachability graph:** nodes = standable surfaces (floor runs + platforms); edge A→B iff horizontal separation and rise fit the hop envelope. Assert spawn-surface → goal-surface path exists ("unreachable areas" requirement).
2. **Gap width vs jump reach:** every floor-run gap crossable directly or via a platform chain (subsumed by 1, but report per-gap for authoring feedback).
3. **Door/gate/enemy-over-hole:** each door/mathGate/enemy x-footprint (and every checkpoint x) lies fully within some floor run — the exact known "door placed over floor hole" defect class.
4. **Mechanic reachability + bypass geometry:** every mechanic sits on a surface reachable in the graph; no adjacent platform is high enough to path *around* an apex-derived blocker (the v4.1 jump-over exploit class, now checked geometrically).
5. **Placement sanity:** a checkpoint before every spike (level-01's authored policy, now enforced); pickup slots within reach of their collect zone; goal/entities within `bounds`; goal on the final run.

Wire it beside `check-safety.sh` as a per-commit/phase gate. Because it runs on all `LEVELS`, the 4 new + 4 lengthened levels are validated *as they are authored* — which is why the linter must be built **before** the level-content phases.

**Existing dynamic layer — extend, don't rewrite.** `scripts/browser-boot.mjs` + `scripts/lib/mechanic-drive.mjs` already iterate `LEVEL_ORDER` (auto-covers 8 levels) and drive real keyboard traversal (`driveToXClimbing`) + challenge resolution (`resolveIfBoxed`). Keep it as the integration gate: boots, plays, resolves mechanics with real input. Its documented limitation (6/16 encounters unreachable via spike-timing resonance in the traversal model) is precisely what the static linter does NOT suffer from — the layers are complementary. Don't try to turn the Playwright driver into a completeness proof; the linter is the completeness proof, the driver is the "it actually plays" proof.

**Anti-pattern to avoid:** putting validation *inside* src/ (e.g. build.js asserting geometry at runtime). Validation is authoring tooling; the runtime stays forgiving by design (getLevel falls back rather than crashes) and the shipped game stays lean.

---

## 4. Rebrand Touchpoints — Math Lab → Nox Run

Complete grep-verified inventory (`grep -rni "math lab\|mathlab"` over src/, docker/, docs/, scripts/, README, CREDITS):

| File | What | Change |
|------|------|--------|
| `src/index.html:6` | `<title>Math Lab — loading</title>` | rename |
| `src/index.html:37` | file:// guard page `<title>` | rename |
| `src/scenes/title.js:45` | `text("Math Lab", ...)` wordmark | **replace with logo sprite** (below) |
| `src/config.js` TITLE | wordmark size constants + comments | retune for logo (logo scale, PROMPT_DY) |
| `src/config.js:157` | `SAVE.KEY: "mathlab_platformer_v2"` | **DO NOT RENAME** — internal, invisible to the player; renaming the key (or bumping VERSION) silently wipes her XP/levels/unlocks (loadSave: unknown key/version → defaults, NO migration). Add a comment recording this decision |
| `src/progress.js:280–312` | `console.warn("[MathLab] ...")` ×5 | cosmetic rename to `[NoxRun]` |
| `src/main.js:1` | header comment | rename |
| `docker/Dockerfile:1` | comment | rename |
| `README.md`, `docs/DEPLOY.md`, `CREDITS.md` | prose + `mathlab:phase7` image-tag examples | rename |
| `scripts/browser-boot.mjs` `SAVE_KEY` | mirrors SAVE.KEY literal | unchanged iff SAVE.KEY unchanged (they must stay in sync — note it) |
| `scripts/*.py`, `scripts/check-progress.sh`, `scripts/audit-phase21-mechanics.mjs` | comments/prose | low-priority rename |

Non-touchpoints (verified clean): `ui/hud.js`, select.js heading ("Select a Level"), the controls hint, mathGate.js banner, `docker/nginx.conf` — none carry the product name.

**Logo:** new `assets/logo.png` (dark green/black wordmark at pixel-art scale that reads on the 640×360 internal canvas; no pink), `loadSprite("logo", "../assets/logo.png")` in main.js, `sprite("logo")` replacing the `text()` wordmark in title.js (same fixed()/z/anchor idiom). Add a CREDITS.md note (sourced or in-house). Optionally echo a small logo on select.js.

**Palette expansion (rides with the rebrand):** today the dark-grunge palette is **duplicated as module-local literals** in title.js, select.js, hud.js, fx.js, challenge.js, build.js (+ per-mechanic colors under CONFIG.DOOR/MATH_GATE/ENEMY/COLLECT). Recommended: add a `CONFIG.PALETTE` namespace (bg, surface, border dims, text, accent-green, the new Nox deep-green/moss tones, plus a rust/amber secondary accent — still dark, still no pink) and refactor the module-local literals to read it. Safe under a727c13 (config.js is a leaf; top-level CONFIG reads are the established pattern in every one of those files). This turns "richer grunge palette" into a one-file tuning surface plus a mechanical refactor. Also update `main.js` `background: "#0a0a0a"` and index.html's CSS/guard-page colors if the base tone shifts.

---

## 5. Dropping Tables 1 & 10 with a LOCKED Brain

The seam already exists and is already validated: `createBrain({ allowedTables })` (brain.js:60–71) sanitizes and applies a per-level pool; `calculateWeights`/`weightedRandom` respect it including the all-mastered fallback; and game.js already passes `level.allowedTables`. **Zero brain changes needed for table 1:** exclude 1 from every level's `allowedTables` pool (§2 ramp — no pool includes 1). Pure level-data edits.

Two precision points the roadmap must record:

1. **"Table 10" cannot be dropped from the rotation because it was never in it.** The brain selects tables 1–9 only (HARD_TABLES + EASY_TABLES; allowedTables validation clamps to 1..9). There is no table-10 selection to remove — this half of the todo is satisfied by documentation, not code.
2. **However, ×10 *questions* still occur via the multiplicand:** `nextQuestion()` rolls `b = Math.floor(Math.random()*10)+1` (1..10), so e.g. `7 × 10` can appear on any table. If the actual intent is "no ×10 questions", that is a one-literal change (`*10` → `*9`) **inside the LOCKED brain** — a scoped, surgical unlock decision for the milestone owner. Recommended stance: treat the rotation interpretation as primary (nothing to do for 10), and raise the multiplicand question as an explicit yes/no requirement decision with the one-line change pre-identified, rather than silently interpreting either way.

**Fallback-brain footnote:** challenge.js/mathGate.js construct a pool-less fallback `createBrain()` only if a caller forgets to pass one — game.js always passes the pooled brain, so table 1 can't leak in practice. Leave the fallback alone.

---

## Internal Boundaries (unchanged + new)

| Boundary | Direction | v5.0 impact |
|----------|-----------|-------------|
| brain.js → config.js only | LOCKED firewall | untouched (pool change is level data; multiplicand question escalated, not assumed) |
| mechanics/* → ui/challenge.js | one-way | untouched; the main SFX hook lives inside challenge.js so mechanics don't change for audio |
| progress.js ↔ localStorage (guarded seam) | today's only storage touchpoint | stays progression-only; audio.js gets its own parallel guarded seam + key |
| levels/*.js → config.js only (pure data) | node-importable | exploited by the new static linter |
| **audio.js → config.js only** (new) | app-lifetime singleton; engine calls inside functions only | mirrors fx.js discipline; documented anti-leak exception like game.js's onHide |
| scripts/ → src/levels, src/config (node imports) | tooling reads game data | validate-levels.mjs joins browser-boot.mjs on this side |

## Anti-Patterns (specific to this integration)

1. **Per-scene audio ownership** — restarts music on every `go()`; music/mute are app state, not scene state.
2. **Persisting mute through `progress.serialize()`** — couples a cosmetic toggle to the hardened save-validation chain and to scenes that hold no progress instance.
3. **Renaming `SAVE.KEY` during the rebrand** — wipes her progress for zero user-visible benefit.
4. **Double SFX on barrier clear** — hook challenge.js's correct branch OR the mechanics' onSuccess, never both.
5. **Runtime geometry asserts in src/** — validation is authoring tooling (scripts/); the runtime stays forgiving.
6. **Making the Playwright driver the reachability proof** — its traversal model has documented blind spots (spike-timing resonance); the static linter is the completeness check.
7. **Top-level `typeof play` / engine guards in audio.js** — the exact a727c13 bug class fx.js's and build.js's headers document; keep every engine reference inside function bodies.
8. **Single-row select layout patched by shrinking tiles** — 8 × anything readable doesn't fit 640px in one row; go to the 2×4 grid, don't fight the flagged overflow with tiny tiles.

## Suggested Build Order (dependency-driven)

1. **Implementation review + auto-fix pass** — clean base before building on it (milestone feature; touches everything, so it goes before content multiplies).
2. **Static level validator** (`scripts/validate-levels.mjs`) — built against the existing 4 levels; immediately surfaces the known structural defects (door-over-hole, unreachable spots). Must exist **before** level authoring so all new content is validated as written.
3. **Fix + lengthen the existing 4 levels** — data edits until the validator is green; add explicit bounds to level-01; update/retire the geometry-pinning smoke fixture.
4. **Add levels 05–08 + registry append + select.js 2×4 grid + difficulty ramp + drop table 1 from all pools** — the registry append auto-propagates to select, unlock chain, and browser-boot; record the table-10/multiplicand decision in requirements.
5. **Palette expansion** (`CONFIG.PALETTE` + module-literal refactor) — before the logo so the logo is designed against the final palette.
6. **Rebrand** (index.html titles, logo asset + title.js, console prefixes, docs/docker comments; SAVE.KEY explicitly kept).
7. **Audio** (`src/audio.js`, CONFIG.AUDIO, loadSound block in main.js, M-key, seam hooks, mute persistence, assets + licenses) — last feature phase so SFX hooks land on the final mechanics/level set; independent enough to move earlier if parallelizing.
8. **Full verification pass** — browser-boot across all 8 levels (automatic via LEVEL_ORDER), validator green, check-safety green, human sign-off on art/audio (v4.1 lesson: interactive proof, not code review).

Phases likely needing deeper per-phase research flags: **audio** (exact Kaplay 3001 `play()` handle semantics, volume model, and autoplay-resume behavior of this specific vendored build — verify against `lib/kaplay.mjs` before implementing) and **validator** (hop-envelope edge cases: diagonal platform-to-platform hops, blocker-bypass geometry). Level authoring, palette, and rebrand are pure applications of existing patterns — no research flag needed.

## Sources

- Read directly from the live tree (HIGH confidence): `src/main.js`, `src/config.js`, `src/progress.js`, `src/levels/{index,build,level-01}.js` (+grep of level-02..04 pools/bounds), `src/scenes/{title,select,game}.js`, `src/ui/{challenge,hud,mathGate}.js`, `src/mechanics/{door,collect}.js` (+grep of gates/enemy onSuccess seams), `src/math/brain.js`, `src/player.js`, `src/fx.js`, `src/index.html`, `scripts/check-safety.sh`, `scripts/browser-boot.mjs`, `scripts/lib/mechanic-drive.mjs`, `docker/{Dockerfile,nginx.conf}`, `.planning/PROJECT.md`.
- Kaplay 3001 audio API presence (`loadSound`/`loadMusic`/`setVolume`/`audioCtx`) verified by grep of the vendored `lib/kaplay.mjs` (HIGH for presence; MEDIUM for exact handle semantics — verify during the audio phase).
- Browser AudioContext autoplay-gesture requirement: standard web platform behavior (HIGH — mitigated structurally by starting music in the title gesture handler).

---
*Architecture research for: Nox Run v5.0 feature integration*
*Researched: 2026-07-05*
