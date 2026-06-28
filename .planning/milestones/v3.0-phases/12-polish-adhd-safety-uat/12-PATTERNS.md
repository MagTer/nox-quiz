# Phase 12: Polish, ADHD-Safety & UAT - Pattern Map

**Mapped:** 2026-06-27
**Files analyzed:** 7 (2 new code, 4 modified code, 1 new doc)
**Analogs found:** 6 / 6 code files (UAT.md is a doc, no code analog)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/fx.js` (NEW) | utility (engine-side effect helpers) | event-driven / transform | `src/ui/hud.js` `flashLevelUp()` (105-124) + `src/scenes/game.js` `reset()` (102-108) | exact (idiom) |
| `scripts/check-safety.sh` (NEW) | test / audit gate | batch (static grep) | `scripts/check-progress.sh` + `.planning/phases/10-.../scripts/check-gate.sh` | exact (structure) |
| `src/player.js` (MOD) | entity factory | event-driven (jump/land hooks) | itself — existing jump path (40-80); `body().onGround()` from bundle | self / role-match |
| `src/scenes/game.js` (MOD) | scene controller | event-driven (collide/clear) | itself — coin `onCollide` (122-125), `onClear` (154-171), `reset()` (102-108) | self |
| `src/ui/hud.js` (MOD) | component (HUD overlay) | request-response (read-only render) | itself — `mountHud` factory + `fixed()`/`z()` badge (50-83), `flashLevelUp()` (105-124) | self |
| `src/config.js` (MOD) | config | n/a | itself — `CONFIG.HUD` / `CONFIG.GATE` / `CONFIG.BRAIN` namespaces (49-100) | self |
| `.planning/phases/12-.../12-UAT.md` (NEW) | doc | n/a | — | no analog (doc) |

## Pattern Assignments

### `src/fx.js` (NEW — utility, event-driven effects)

**Analog:** `src/ui/hud.js` `flashLevelUp()` (lines 105-124) and `src/scenes/game.js` `reset()` (lines 102-108).

**CRITICAL — a727c13 lesson (top-level globals ban):** `src/fx.js` must use Kaplay globals (`add`, `tween`, `rect`, `pos`, `color`, `opacity`, `anchor`, `z`, `destroy`, `easings`) ONLY inside exported function bodies. NO top-level engine call, NO `typeof tween` guard at module scope — imports are hoisted and run before `kaplay({ global: true })` installs globals. The ONLY top-level statement is `import { CONFIG } from "./config.js"` (src/fx.js is at `src/`, so the import is `./config.js`, NOT `../config.js`). This mirrors how `hud.js` declares its single CONFIG import at module top (hud.js:31) and uses every engine symbol only inside `mountHud`/`refresh`/`flashLevelUp`.

**The one self-cleaning, timer-free effect idiom — COPY EXACTLY** (from `hud.js:117-123`):
```javascript
// src/ui/hud.js flashLevelUp() lines 117-123 — the PROVEN idiom every fx fn reuses
tween(
  1,
  0,
  M.FLASH_MS / 1000,                 // duration in SECONDS, from CONFIG (no magic number)
  (v) => (banner.opacity = v),       // setter
  easings.easeOutQuad,               // subtle, decelerating — ADHD-safe
).onEnd(() => destroy(banner));      // self-clean; NO setTimeout/setInterval/lifespan/wait
```
And the shorter form from `game.js:107` (the respawn flash):
```javascript
// src/scenes/game.js reset() line 107
tween(0.2, 1, 0.18, (v) => (player.opacity = v), easings.easeOutQuad);
```

**Tagged transient + factory discipline** (from `hud.js:106-115`): every transient effect object is `add([...])` with a teardown tag (`"fx"`) so a scene replay / respawn destroys any in-flight effect. Mirror the HUD's `"hud-flash"` tag pattern:
```javascript
// hud.js:106-115 — tagged transient, fixed()/anchor/opacity/z comp shape to mirror
const banner = add([
  text("LEVEL UP", { size: M.FLASH_SIZE }),
  anchor("center"),
  pos(center()),
  color(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]),
  opacity(1),
  fixed(),
  z(9500),
  "hud-flash",        // ← fx.js uses "fx" here
]);
```
Note: dust/pop are WORLD-space (no `fixed()`, they sit at `player.pos`/`c.pos`); only `clearBurst` may use `fixed()` if it is a screen-space flourish.

**Exported functions to build:** `squash(obj)`, `dust(at)`, `pop(at)`, `clearBurst()`. Each = `add([... "fx"]) → tween(...).onEnd(() => destroy(obj))`. RESEARCH provides starter bodies for `squash` (Pattern 2) and `dust` (Code Examples §"Dust"). Palette: grunge grey `color(0x88,0x88,0x88)` for dust, neon-green `ACCENT_GREEN = [0x00,0xff,0x88]` (reused from hud.js:36) for pop/burst. NO pink.

**Anti-pattern to avoid:** NO `lifespan()`, NO `wait()`, NO `loop()`, NO strobe (one smooth fade per effect, `easeOutQuad`/`easeOutCubic`, not `easeOutBack`/`easeOutElastic`).

---

### `scripts/check-safety.sh` (NEW — audit gate, batch grep)

**Analog:** `scripts/check-progress.sh` (full file) for structure; `.planning/phases/10-.../scripts/check-gate.sh` lines 57-60 for the negative no-timer grep.

**Header/scaffold pattern — COPY** (from `check-progress.sh:21-29`):
```bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"   # works regardless of caller cwd
fail() {
  echo "safety checks: FAIL — $1" >&2
  exit 1
}
```

**The negative no-timer grep — model on `check-gate.sh:57-60`:**
```bash
# check-gate.sh lines 57-60 (single-file target). check-safety.sh extends this to ALL of src/.
if grep -Eq 'setTimeout|setInterval|countdown|timer|[^a-zA-Z]wait\(|[^a-zA-Z]loop\(' "$TARGET"; then
  fail "timer/scheduler found ... (GATE-05)"
fi
```

**CRITICAL nuance — MUST strip comments first (RESEARCH Pitfall 3):** `check-gate.sh`/`check-progress.sh` get away with raw grep because they target SINGLE files whose source is written to avoid the banned tokens in code. A whole-`src/` audit CANNOT — banned words legitimately appear in COMMENTS:
- `src/ui/hud.js:29` — comment: "...same no-timer discipline as the gate" (mentions setInterval/setTimeout)
- `src/scenes/game.js:101` — comment: "No game-over UI, no lives counter"
- `src/scenes/game.js:191-192` — comment: "NO timer-based autosave (SAFE-01)"
- `src/player.js:7` — comment: "jump() / vel + dt() timers"

A naive `grep -r 'setInterval' src/` FALSE-POSITIVES on all of these. Strip `//` line comments before grepping (per-file pre-pass). The codebase uses `//` line comments almost exclusively (verified), so a line-comment stripper is sufficient:
```bash
strip_comments() { sed -E 's://.*$::' "$1"; }   # RESEARCH-recommended pre-pass
while IFS= read -r f; do
  if strip_comments "$f" | grep -Eq 'setTimeout|setInterval|countdown|[^a-zA-Z]wait\(|[^a-zA-Z]loop\(|lifespan\('; then
    fail "timer/scheduler in code: $f (SAFE-01 no-timer mandate)"
  fi
done < <(find "$ROOT/src" -name '*.js')
```

**Syntax gate (per `check-progress.sh:31-36`):** `node --check` each `src/*.js`.

**Forgiving sweep (negative grep):** no `gameOver|game_over|loseLife|lives--|subtractXp|xp[[:space:]]*-=` in stripped code.

**Positive checks (mirror `check-progress.sh` assertion style, lines 39-82):** `grep -Rq 'SPACE jump' "$ROOT/src"` (SAFE-02 hint present); `grep -q 'onEnd' "$ROOT/src/fx.js"` (fx self-cleans). RESEARCH Pattern 6 has the full reference script.

**Self-discipline (called out in `check-progress.sh:11-12` and `check-gate.sh:9-10`):** the banned tokens must appear ONLY inside the grep PATTERNS in this script, never as plain prose — otherwise the script would match itself if it were ever scanned.

---

### `src/player.js` (MOD — entity factory, event-driven)

**Analog:** itself — the existing `add([...])` comp list (25-32) and `player.onUpdate` jump path (40-62).

**Add `scale(1)` to the comp list** (so `squash` can call `.scaleTo()`/`.scaleBy()`) — insert into the existing list at lines 25-32:
```javascript
// src/player.js 25-32 — current comp list; ADD scale(1)
const player = add([
  sprite("player"),
  pos(startX, startY),
  area(),
  body({ maxVelocity: CONFIG.MAX_FALL_SPEED }),
  opacity(1),
  scale(1),          // NEW — enables squash/stretch via .scaleTo()/.scaleBy()
  "player",
]);
```

**Stretch on jump:** the jump fires at `player.jump(CONFIG.JUMP_FORCE)` inside `onUpdate` (line 58). Call `fx.squash`/a stretch variant right after that consume block (58-61).

**Squash + dust on LAND — use `body().onGround()` (bundle-confirmed `onGround(u){return this.on("ground",u)}`):** add a hook after the player is created (engine init done — globals safe). RESEARCH Pattern 2:
```javascript
player.onGround(() => {     // body() event: fires when feet hit the floor
  fx.squash(player);
  fx.dust(player.pos);
});
```
**Fallback (RESEARCH Open Q1):** if `onGround` ever misses a landing with this body config, fall back to an `isGrounded()` rising-edge inside the existing `onUpdate` (`if (!wasGrounded && isGrounded()) {...}`) — `isGrounded()` is already used at lines 49 and 57.

**Import:** add `import { fx } from "./fx.js"` (or named `import * as fx`) at module top, alongside the existing `import { CONFIG } from "./config.js"` (line 19). Engine globals stay bare (player.js already treats `add`/`onUpdate`/`isKeyDown`/etc. as bare globals — see header lines 9-11).

**Firewall (CONTEXT-locked):** do NOT touch `src/math/*` or `src/progress.js`.

---

### `src/scenes/game.js` (MOD — scene controller, event-driven)

**Analog:** itself — coin `onCollide` (122-125), `onClear` (154-171), and the import block (19-26).

**Coin pop (JUICE-02) — extend the existing coin handler (122-125):**
```javascript
// src/scenes/game.js 122-125 — current; ADD fx.pop BEFORE destroy(c)
player.onCollide("coin", (c) => {
  coinsCollected += 1;
  fx.pop(c.pos.clone());   // NEW — transient pop at the coin's spot (clone: pos is live)
  destroy(c);
});
```

**Level-clear burst (JUICE-03) — ADD one line in `onClear`, change nothing else (154-171):**
```javascript
// src/scenes/game.js onClear, after the existing hud calls (164-165)
hud.refresh();
if (leveledUp) hud.flashLevelUp();
fx.clearBurst();           // NEW: brief, NON-STROBING celebratory burst (layers on)
writeSave(progress.serialize(brain.snapshot()));
```
> Do NOT modify the gate's terminal `gate-cleared` "LEVEL CLEAR" banner (`mathGate.js:185-219`) — JUICE-03 LAYERS on the existing moment (gate banner + `hud.flashLevelUp()`).

**Persistent controls hint mount (SAFE-02):** mount once on scene entry. Preferred home is `hud.js` (call `hud.mountControlsHint()` or fold into `mountHud`), mounted alongside `hud.refresh()` at line 66. Tag `"hud"` so it tears down on replay like every other HUD object.

**Import:** add `import { fx } from "../fx.js"` to the existing import block (19-26). (scenes/ is one level below src/, so `../fx.js` — see header lines 14-17.)

**Optional belt-and-braces teardown (mirrors `onSceneLeave` at line 202):** `onSceneLeave(() => destroyAll("fx"))` to sweep any lingering effect on scene leave.

---

### `src/ui/hud.js` (MOD — component, read-only overlay)

**Analog:** itself — the `fixed()`/`z()` badge overlay (55-62) and the `mountHud` factory shape (50-126).

**Persistent corner hint — reuse the badge overlay comp shape (55-62):**
```javascript
// Model on src/ui/hud.js 55-62 (the LVL badge). The hint is the same fixed()+z() idiom.
add([
  text("← → move · SPACE jump", { size: CONFIG.HINT.SIZE }),
  pos(CONFIG.HINT.X, CONFIG.HINT.Y),          // a DIFFERENT corner from the HUD (HUD = X:16,Y:16)
  color(0xe8, 0xe8, 0xe8),                     // #e8e8e8 — readable on #0a0a0a (~18:1, WCAG AA)
  fixed(),
  z(9000),
  "hud",                                        // same teardown tag → replay-safe
]);
```
> The HUD badge/bar sit top-left (`CONFIG.HUD.X:16, Y:16`). Put the hint at a DIFFERENT corner (bottom-left, `CONFIG.HINT` default `X:16, Y:330`) to avoid overlap. RESEARCH A2/Pitfall 6: verify `← → ·` glyphs render (not tofu) in UAT; fall back to "LEFT/RIGHT move · SPACE jump" if needed.

**Factory + tag discipline (hud.js:24-29, 50):** keep `mountHud` a factory (no module-level mutable singleton). Add the hint inside the closure with the `"hud"` tag so it shares the HUD's replay teardown. The string MUST be a Kaplay `text()` canvas object — no `innerHTML`/`document.` (hud.js:14-16 no-DOM-sink canon).

**`flashLevelUp()` coordination (105-124):** leave the level-up flash as-is; the JUICE-03 `fx.clearBurst()` is fired by the SCENE at the same `onClear` seam (game.js), so the two compose without changing this function. If a tweak is wanted, keep `FLASH_MS` ADHD-safe (450, hud.js:100 / config.js:99).

**One-way contract (hud.js:18-22, check-progress.sh:74-77):** the HUD still only READS progress — adding a static hint does not touch the one-way contract. Do NOT introduce any `progress.addXp`/`progress.level =` write.

---

### `src/config.js` (MOD — config)

**Analog:** itself — the `CONFIG.HUD` (91-100), `CONFIG.GATE` (60-64), `CONFIG.BRAIN` (49-57) namespaces.

**Add `CONFIG.FX` and `CONFIG.HINT` namespaces, mirroring the existing `HUD:`/`GATE:` namespace style** (nested object literal with `// px`/`// ms` unit comments). Append before the closing `}` (after line 100). RESEARCH §"CONFIG namespaces" provides starting values:
```javascript
FX: {
  SQUASH_X: 1.15, SQUASH_Y: 0.85, SQUASH_MS: 140,   // subtle, brief
  STRETCH_X: 0.9, STRETCH_Y: 1.1, STRETCH_MS: 120,  // on jump
  DUST_COUNT: 4, DUST_SIZE: 3, DUST_SPREAD: 8, DUST_RISE: 16, DUST_MS: 300,
  POP_SCALE: 1.5, POP_MS: 220,
  BURST_MS: 400,                                     // <= FLASH_MS feel; non-strobing
},
HINT: { X: 16, Y: 330, SIZE: 12 },                  // bottom-left, clear of the top HUD
```
> Magnitudes are STARTING points within "subtle & brief" (Claude's discretion); final values are tuned WITH THE KID in UAT (SAFE-03, RESEARCH A5). `config.js` imports nothing (leaf module, lines 5-6) — keep it that way.

---

### `.planning/phases/12-.../12-UAT.md` (NEW — doc, no code analog)

A kid-UAT checklist (NOT code). Items per CONTEXT line 47 / RESEARCH Wave 0: feel, framing, juice-not-over-stimulating (SAFE-03), controls discoverable (SAFE-02), no time pressure felt (SAFE-01), contrast readable. These are non-automatable; the USER signs them off. (RESEARCH Open Q2 suggests an optional `12-AUDIT.md` companion recording the SAFE-01 script result + manual-confirm items.)

## Shared Patterns

### The self-cleaning, timer-free effect idiom
**Source:** `src/ui/hud.js:117-123` (`flashLevelUp`) and `src/scenes/game.js:107` (`reset`).
**Apply to:** every effect in `src/fx.js` (squash return, dust, pop, clearBurst) AND the player respawn flash.
```javascript
tween(from, to, durationMs / 1000, (v) => (obj.someProp = v), easings.easeOutQuad)
  .onEnd(() => destroy(obj));   // NO setTimeout/setInterval/lifespan/wait
```

### Engine-global discipline (a727c13 lesson)
**Source:** `src/ui/hud.js:8-12, 31` and `src/player.js:9-11, 19` — the ONLY import is CONFIG; every Kaplay symbol is a bare global used INSIDE functions, never at module top.
**Apply to:** `src/fx.js` especially (the highest-risk new module), and any new function in player.js/game.js.
**Rule:** no `add`/`tween`/`vec2`/`typeof <global>` at module scope. `src/fx.js` imports CONFIG as `./config.js` (it is at `src/`, not `src/ui/`).

### Tagged transient + factory anti-leak
**Source:** `src/ui/hud.js:24-29` (factory, `"hud"`/`"hud-flash"` tags) and `src/ui/mathGate.js:229` (`destroyAll("math-gate")`).
**Apply to:** every `fx` transient (tag `"fx"`, self-destroy on `.onEnd`); the persistent hint (tag `"hud"`); optional `onSceneLeave(() => destroyAll("fx"))` in game.js (mirrors `onSceneLeave` at game.js:202).

### Negative-grep audit, banned-tokens-only-in-patterns
**Source:** `scripts/check-progress.sh:11-12, 64-82` and `.planning/phases/10-.../scripts/check-gate.sh:9-10, 53-65`.
**Apply to:** `scripts/check-safety.sh` — fail-fast `fail()` asserts; banned tokens live ONLY in the grep patterns; ADD a comment-stripping pre-pass (the one thing the single-file analogs do NOT need but a whole-src audit DOES).

### Dark-grunge palette, no pink, no DOM
**Source:** `src/ui/hud.js:35-36` (`TRACK_GREY = [0x33,0x33,0x33]`, `ACCENT_GREEN = [0x00,0xff,0x88]`); CLAUDE.md palette (`#0a0a0a` bg, `#e8e8e8` text, `#00ff88` accent).
**Apply to:** fx colors (grey dust, neon-green pop/burst), the hint text color (`0xe8,0xe8,0xe8`). All visuals are Kaplay `text()`/`rect()` canvas objects — never `innerHTML`/`document.` (hud.js:14-16 / mathGate.js GATE-01).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.planning/phases/12-.../12-UAT.md` | doc | n/a | Human kid-UAT checklist — no code analog; SAFE-03/feel are non-automatable, user-signed. |

(All six code files have strong in-repo analogs — the effect idiom and the audit-script structure both already ship in the repo.)

## Metadata

**Analog search scope:** `src/` (player.js, scenes/game.js, ui/hud.js, ui/mathGate.js, config.js), `scripts/`, `.planning/phases/10-.../scripts/`.
**Files scanned:** 7 (4 source modules read in full, 2 audit scripts read, 1 gate grepped).
**Key cross-cutting insight (RESEARCH):** Every Phase 12 effect is the SAME proven primitive — `tween → onEnd(destroy)` + a `"fx"` tag — applied to a different comp (`scale`/`opacity`/`pos`). One `src/fx.js` of four small functions covers JUICE-01/02/03; no new animation mechanism per effect.
**Pattern extraction date:** 2026-06-27
