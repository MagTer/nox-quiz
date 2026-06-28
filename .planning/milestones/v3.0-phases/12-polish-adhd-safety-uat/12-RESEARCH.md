# Phase 12: Polish, ADHD-Safety & UAT - Research

**Researched:** 2026-06-27
**Domain:** Kaplay 3001 game-juice (tween-driven squash/dust/pop/burst), a persistent fixed() HUD hint, and a structural no-timer/forgiving audit for a zero-dependency, no-build, no-test-framework static platformer.
**Confidence:** HIGH

## Summary

This is the final polish phase for an already-complete Kaplay 3001 platformer. The goal is purely additive visual juice plus an ADHD-safety audit and a kid UAT — no new mechanics, no audio (AUDIO-01 is deferred), no firewall changes (`src/math/*`, `src/progress.js` stay untouched). Every piece of juice must obey one consistent, locked "juice language": subtle, brief, **non-strobing**, dark-grunge + neon-green (`#00ff88`), no pink, and — critically — **no timers/schedulers** (no `setTimeout`/`setInterval`, and avoid Kaplay's `wait()`/`lifespan()` because they are schedulers that the SAFE-01 audit grep must be free to ban).

The good news: the codebase already proves the entire technical pattern. `hud.js` `flashLevelUp()` and `game.js` `reset()` both self-clean via `tween(from,to,dur,setter,easing).onEnd(() => destroy(obj))` — a one-shot, frame-rate-independent, timer-free fade-then-destroy. All Phase 12 effects (squash, dust, coin pop, clear burst) are variations of this single proven idiom. The Kaplay bundle confirms `scale()` (with `.scaleTo()`/`.scaleBy()`), `tween`, `easings`, `opacity`, `move`, `destroy`, `destroyAll`, `shake`, and the `body()` land hooks `onGround()`/`onLand()` all exist in the vendored 3001.0.19. `onGround()` is the exact land-detection hook for JUICE-01 — no hand-rolled grounded-state transition needed.

**Primary recommendation:** Build one small engine-side `src/fx.js` of pure functions — `squash(obj)`, `dust(pos)`, `pop(pos)`, `clearBurst()` — that touch Kaplay globals ONLY inside the exported function bodies (never at module top level; that is the a727c13 lesson: imports are hoisted and run before `kaplay()` installs globals). Every effect is tween→`.onEnd(destroy)` + a tag for replay-safe teardown. Call `squash`/`dust` from `player.js` jump/`onGround` hooks, `pop` from the `game.js` coin `onCollide`, and `clearBurst` from the gate's correct-answer `onClear` seam. Add a persistent `fixed()` corner controls hint ("← → move · SPACE jump"). Author a `scripts/check-safety.sh` that mirrors the existing check-script discipline (greps scoped to **code lines only**, because comments across `src/` legitimately mention "setInterval"/"game-over"). Feel, over-stimulation, and contrast are inherently kid-UAT items — they are NOT automatable and the user signs them off.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Movement & Landing Juice (JUICE-01)**
- Subtle squash/stretch on the player via a `scale()` comp + tween (stretch slightly on jump, squash on land); ADHD-safe — subtle and brief, not bouncy/over-stimulating.
- Landing dust: a few short-lived grey rect particles that rise + fade + self-destroy (opacity/pos tween → destroy; NO timer abuse, no leaked handlers).
- Lives in a small new `src/fx.js` helper (engine-side), called from `src/player.js` jump/land hooks (player owns jump + ground state). Keep `src/math/*` and `src/progress.js` firewalls untouched.
- Palette: dark grunge + neon-green accent (no pink).

**Coin & Level-Clear Juice (JUICE-02, JUICE-03)**
- Coin pop (JUICE-02): on collect, a quick scale-pop + fade at the coin's position (then destroy). No "+1" text — coins are count-only (Phase 9). Subtle.
- Level-clear (JUICE-03): enhance the EXISTING moment (the gate's "LEVEL CLEAR" banner + the HUD level-up flash) with a brief, **non-strobing** celebratory burst. Distinct and celebratory but brief — no full-screen takeover, no strobe.
- NO audio this phase — visual juice only. AUDIO-01 (SFX/music) is deferred.
- One consistent juice language across all effects: subtle, brief, non-strobing, dark-grunge/neon-green.

**Discoverable Controls (SAFE-02) — USER OVERRIDE**
- **Persistent corner hint** (NOT a fading start hint): a small, always-visible controls hint pinned in a screen corner so it is discoverable at any time with zero time pressure.
- Hint text shows the move + jump keys: "← → move · SPACE jump" (intuitive primary bindings; the real bindings also include A/D and Up/W).
- Implemented as a `fixed()` scene/HUD overlay (reuse the HUD overlay idiom), dark grunge, readable contrast, non-intrusive (small, low-corner).

**ADHD-Safety Audit + Contrast + UAT (SAFE-01, SAFE-03)**
- No-timer audit (SAFE-01): a DOCUMENTED audit — a structural grep across src/ (no setTimeout/setInterval/countdown/time-pressure) PLUS a manual confirm. Reuse the existing negative-grep discipline (phase-10/11 check scripts); extend/author an audit covering the whole game.
- Forgiving audit: confirm there is no game-over / lives / XP-loss construct anywhere (already true) — fold into the same audit doc.
- Contrast (SAFE-03): a manual contrast pass on the `#0a0a0a` theme (text + sprites + HUD readable); confirm juice/effects are subtle and not over-stimulating; bump any low-contrast text. No formal WCAG tooling.
- Final UAT: a UAT checklist validated WITH THE ACTUAL KID — feel, framing, juice-not-over-stimulating, controls discoverable, no time pressure felt. Feel/framing sign-off is the user's, by design.

### Claude's Discretion
- Exact tween durations / particle counts / scale magnitudes within the "subtle & brief" mandate.
- Exact corner + size/styling of the persistent controls hint.
- Whether the no-timer audit ships as a new `scripts/check-*.sh` or a documented AUDIT.md (or both).

### Deferred Ideas (OUT OF SCOPE)
- AUDIO-01 — sound effects + ambient music — future milestone, NOT this phase.
- Additional levels / content; new mechanics.
- Formal WCAG/accessibility tooling beyond a manual contrast pass.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| JUICE-01 | Jumping and landing have satisfying visual feedback (squash/stretch, dust) | `scale()` comp + `tween` (confirmed in bundle); land hook via `body().onGround()` (confirmed); dust = grey `rect` particles tween pos+opacity → `.onEnd(destroy)`. Pattern proven by `hud.js`/`game.js`. |
| JUICE-02 | Collecting a coin gives a satisfying pop/feedback | Spawn a transient scale-pop+fade marker at the coin's `pos` BEFORE `destroy(c)` in the `game.js` coin `onCollide`. Same tween→destroy idiom. No "+1" text (coins are count-only, Phase 9). |
| JUICE-03 | Clearing the level has a distinct celebratory moment | Enhance the EXISTING moment: gate's "LEVEL CLEAR" banner + `hud.flashLevelUp()`. Add a brief NON-STROBING `clearBurst()` from `fx.js`, fired on the `onClear` seam in `game.js`. |
| SAFE-01 | No timers or countdowns appear anywhere (audited) | `scripts/check-safety.sh` — code-scoped negative grep across `src/` for `setTimeout`/`setInterval`/`countdown`/`wait(`/`lifespan(`, plus a forgiving grep (no game-over/lives/XP-loss). Current src is clean in code (only comments mention the words — grep must skip comments). |
| SAFE-02 | Controls discoverable — on-screen hint for move + jump | Persistent `fixed()` corner overlay "← → move · SPACE jump"; mount alongside the HUD (same idiom). Always visible, zero time pressure. |
| SAFE-03 | Readable contrast on dark theme; effects not over-stimulating | Manual contrast pass on `#0a0a0a`; confirm `#e8e8e8`/`#00ff88` text legible; confirm all juice is subtle/non-strobing. Kid-UAT item — not automatable. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Squash/stretch on jump & land (JUICE-01) | Player entity (`player.js`) | `fx.js` helper | The player owns jump + ground state (`onGround`/`isGrounded`); juice attaches at those hooks. `fx.js` provides the pure effect. |
| Landing dust particles (JUICE-01) | `fx.js` (engine-side) | called from `player.js` land hook | Self-contained transient entities; player decides *when*, fx decides *how*. |
| Coin pop (JUICE-02) | Scene (`game.js` coin `onCollide`) | `fx.js` `pop(pos)` | The coin collision already lives in the scene; the pop spawns at the coin pos before `destroy(c)`. |
| Level-clear burst (JUICE-03) | Gate `onClear` seam → scene (`game.js`) | `fx.js` `clearBurst()` + existing `hud.flashLevelUp()` | The clear moment already exists (gate banner + HUD flash); the burst *layers on* via the single `onClear` hook. Do NOT modify the gate's terminal cleared-state logic. |
| Persistent controls hint (SAFE-02) | HUD layer (`hud.js`) or scene | — | `fixed()` screen-space overlay, camera-immune — the HUD's exact idiom; mount once per scene, replay-safe tag. |
| No-timer / forgiving audit (SAFE-01) | `scripts/check-safety.sh` + AUDIT doc | — | Static structural verification — the project's substitute for a test framework. |
| Contrast & over-stimulation sign-off (SAFE-03) | Kid UAT (manual) | manual contrast pass | Inherently subjective/perceptual — not automatable. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kaplay (vendored) | 3001.0.19 | All juice (scale/tween/particles), rendering, the fixed() hint overlay | Already vendored and pinned; project canon. No new dependency. [VERIFIED: lib/kaplay.mjs header sha256 fb4a4ef2...] |
| Vanilla ES2020 modules | — | `src/fx.js` helper, hint mount | No build step (project canon). [VERIFIED: src/ inventory] |
| Bash + `node --check` + grep | — | `scripts/check-safety.sh` structural gate | The project has NO JS test framework; structural greps + `node --check` ARE the automated check (mirrors `scripts/check-progress.sh`, `check-gate.sh`). [VERIFIED: scripts/check-progress.sh] |

### Supporting (Kaplay symbols this phase uses — all confirmed in the vendored bundle)
| Symbol | Kind | Purpose | When to Use |
|--------|------|---------|-------------|
| `scale()` / `.scaleTo()` / `.scaleBy()` | comp + methods | Squash/stretch the player; scale-pop the coin marker | `add([... scale(1) ...])` then tween `.scaleTo()`. [VERIFIED: bundle — `scale(){return e},scaleTo(...n){...},scaleBy(...n){...}`] |
| `tween(from,to,dur,setter,easing)` | function | The one self-cleaning animation driver for ALL effects | Returns a controller with `.onEnd(cb)`. [VERIFIED: bundle `tween:`; usage proven in hud.js/game.js] |
| `easings.easeOutQuad` (also `easeOutCubic`, `easeOutBack`, `easeOutElastic`, `easeInOutQuad`, `linear`) | object | Easing for tweens | `easeOutQuad`/`easeOutCubic` for subtle ADHD-safe fades; AVOID `easeOutBack`/`easeOutElastic` for the squash if they read as "bouncy/over-stimulating". [VERIFIED: bundle members] |
| `body().onGround(cb)` | body event | LAND detection hook (fires when the player touches ground after falling) | The exact JUICE-01 land hook — no hand-rolled grounded transition. [VERIFIED: bundle `onGround(u){return this.on("ground",u)}`] |
| `body().onLand(cb)` | body event | Alt land/landed-on-platform hook | `onLand(u){return this.on("land",u)}`. Prefer `onGround` for "feet hit the floor". [VERIFIED: bundle] |
| `opacity()` | comp | Fade dust/pop/burst out | Already on the player. [VERIFIED: quoted `"opacity"`] |
| `move(dir, speed)` | comp | OPTIONAL: drift dust upward without a manual tween | `move(UP, n)`; but a `pos` tween → `.onEnd(destroy)` is preferred so teardown is explicit and audit-clean. [VERIFIED: bundle `move:`] |
| `destroy(obj)` / `destroyAll(tag)` | function | Remove a single object / all tagged objects (replay teardown) | `destroy` for one effect on `.onEnd`; `destroyAll("fx")` if a scene-leave sweep is wanted. [VERIFIED: bundle; usage in mathGate.js] |
| `shake(n)` | function | Tiny screen shake on land/clear (use sparingly) | The gate already uses `shake(6)` for a wrong-answer nudge. Keep any landing shake ≤ that and OPTIONAL — it can read as over-stimulating; gate this behind the kid's reaction. [VERIFIED: bundle; usage in mathGate.js] |

### Symbols to AVOID (timer/scheduler — banned by SAFE-01)
| Symbol | Why avoid |
|--------|-----------|
| `setTimeout` / `setInterval` | JS schedulers — the no-timer mandate's primary targets. [VERIFIED: clean in src/ code today] |
| Kaplay `wait(t, cb)` | A scheduler (deferred callback). The gate's check explicitly bans `wait(`. Use `tween().onEnd()` instead. [VERIFIED: bundle has `wait:`; banned in check-gate.sh line 58] |
| Kaplay `lifespan(t)` | A comp that auto-destroys after `t` seconds — i.e. a timer. The CONTEXT planning question explicitly flags this; recommend the explicit `tween().onEnd(destroy)` so the audit grep stays clean and teardown is deterministic. [VERIFIED: bundle has `lifespan:`] |
| Kaplay `loop(t, cb)` | A repeating scheduler. [VERIFIED: banned in check-gate.sh] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual `rect` dust particles + tween | Kaplay `particles()` comp / `addKaboom()` | `particles()` exists in the bundle but adds a config surface and is less ADHD-tuneable; the CONTEXT locks "a few short-lived grey rect particles". Hand-rolled rects keep the count/subtlety under exact control and reuse the proven tween→destroy idiom. Recommend hand-rolled rects. |
| `tween().onEnd(destroy)` self-clean | `lifespan()` auto-destroy | `lifespan` is shorter to write but is a timer — it would force the SAFE-01 grep to whitelist a scheduler, defeating the audit's purpose. Recommend tween→onEnd. |
| `pos` tween for dust rise | `move(UP, speed)` comp | `move` is a continuous drift with no built-in stop; you'd still need a tween/onEnd to fade+destroy, so a single `pos`+`opacity` tween is simpler and self-terminating. Recommend tween. |

**Installation:** None — zero new dependencies. `src/fx.js` is authored in-repo; the audit script is bash.

**Version verification:** All symbols above were verified by grepping the vendored `lib/kaplay.mjs` (3001.0.19, sha256 fb4a4ef2...). No registry lookup applies — Kaplay is vendored, not installed. No new packages are added this phase, so the Package Legitimacy Audit is N/A.

## Package Legitimacy Audit

**N/A — this phase installs NO external packages.** Kaplay is already vendored and pinned (SETUP-03). `src/fx.js` and `scripts/check-safety.sh` are authored in-repo. No npm/PyPI/crates install occurs. Disposition: nothing to audit.

## Architecture Patterns

### System Architecture Diagram

```
   PLAYER INPUT / PHYSICS                 SCENE EVENTS                 GATE (existing)
   ─────────────────────                  ────────────                 ───────────────
   player.js                              game.js                      mathGate.js
   ┌──────────────┐                       ┌────────────────┐           ┌──────────────┐
   │ onKeyPress   │── jump ──┐            │ onCollide      │           │ correct pick │
   │  (buffer)    │          │            │  "coin"        │           │  → onClear() │
   │ jump fires   │── stretch│            │   ↓            │           └──────┬───────┘
   │ body.onGround│── squash │            │  fx.pop(c.pos) │                  │
   │  (LAND)      │── dust ──┤            │  destroy(c)    │                  │
   └──────┬───────┘          │            └────────────────┘                  │
          │                  │                    │                           │
          ▼                  ▼                    ▼                           ▼
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │  src/fx.js   (engine-side PURE helpers — globals ONLY inside fn bodies)        │
   │  squash(obj) · dust(pos) · pop(pos) · clearBurst()                             │
   │  each: add([... tagged "fx" ...]) → tween(...).onEnd(() => destroy(obj))       │
   │  NO setTimeout/setInterval/wait/lifespan · NO top-level engine call            │
   └─────────────────────────────────────────────────────────────────────────────┘
                                       │
            JUICE-03 also layers on the EXISTING clear moment:
            game.js onClear → hud.flashLevelUp()  +  fx.clearBurst()
            (gate's "LEVEL CLEAR" gate-cleared banner stays untouched)

   PERSISTENT OVERLAY (SAFE-02)
   ┌───────────────────────────────────────────┐
   │ fixed() + z() corner hint: "← → move ·     │   mounted once per scene
   │ SPACE jump"  (camera-immune, always on)    │   (hud.js idiom), tagged for replay teardown
   └───────────────────────────────────────────┘
```

File-to-implementation: see the Component Responsibilities below.

### Recommended Project Structure
```
src/
├── fx.js          # NEW — squash/dust/pop/clearBurst pure effect helpers (engine-side)
├── player.js      # EDIT — call fx.squash/fx.dust at jump + onGround(land) hooks; add scale() comp
├── scenes/game.js # EDIT — fx.pop(c.pos) in coin onCollide; fx.clearBurst() on onClear
├── ui/hud.js      # EDIT (or scene) — mount the persistent fixed() controls hint
└── config.js      # EDIT — add CONFIG.FX and CONFIG.HINT namespaces (no magic numbers)

scripts/
└── check-safety.sh  # NEW — SAFE-01 no-timer + forgiving structural audit (mirrors check-progress.sh)

.planning/phases/12-.../
└── 12-AUDIT.md (optional) + 12-UAT.md  # documented audit summary + kid-UAT checklist
```

### Pattern 1: The one self-cleaning, timer-free effect idiom (USE FOR EVERY EFFECT)
**What:** A transient object that animates with `tween` and removes itself on `.onEnd` — no scheduler, frame-rate independent, replay-safe via a tag.
**When to use:** dust, coin pop, clear burst, and the scale return on squash.
**Example:**
```javascript
// Source: src/ui/hud.js flashLevelUp() (lines 105-124) + src/scenes/game.js reset() (107) — PROVEN in-repo
tween(
  1, 0,                          // from → to
  CONFIG.FX.DUST_MS / 1000,      // duration in seconds (CONFIG, no magic number)
  (v) => (obj.opacity = v),      // setter
  easings.easeOutQuad,           // subtle, decelerating — ADHD-safe
).onEnd(() => destroy(obj));     // self-clean; NO setTimeout/lifespan
```

### Pattern 2: Squash/stretch via the scale() comp at the land hook
**What:** Stretch slightly on jump (taller/thinner), squash on land (shorter/wider), then tween back to (1,1).
**When to use:** JUICE-01.
**Example:**
```javascript
// fx.js — globals used ONLY inside the exported fn (a727c13 lesson)
export function squash(obj) {
  // obj must have a scale() comp. Snap to a squashed scale, tween back to neutral.
  obj.scaleTo(CONFIG.FX.SQUASH_X, CONFIG.FX.SQUASH_Y);   // e.g. 1.15, 0.85 — SUBTLE
  tween(
    CONFIG.FX.SQUASH_Y, 1,
    CONFIG.FX.SQUASH_MS / 1000,
    (v) => obj.scaleTo(2 - v, v),   // x and y converge back to 1 together
    easings.easeOutQuad,            // NOT easeOutBack/Elastic unless the kid wants bounce
  );
}
```
The land hook in `player.js`:
```javascript
// Inside makePlayer, after the player is created (engine init done — safe to use globals)
player.onGround(() => {     // body() event: fires when feet hit the floor
  fx.squash(player);
  fx.dust(player.pos);
});
```
> NOTE: add `scale(1)` to the player's `add([...])` comp list so `scaleTo`/`scaleBy` exist. The sprite is 16x32 with the collider matching the sprite footprint — scaling is VISUAL only; do NOT let it change the `area()` collider feel (keep magnitudes small, and squash is brief so any collider wobble is negligible). Verify on the kid that the collider still feels fair.

### Pattern 3: Coin pop at the coin position before destroy
**What:** Spawn a short-lived neon-green marker (or reuse the coin's last frame) at `c.pos`, scale-pop + fade, then it self-destroys. The coin itself is destroyed immediately (count is unaffected).
**When to use:** JUICE-02.
**Example:**
```javascript
// src/scenes/game.js coin onCollide (currently lines 122-125)
player.onCollide("coin", (c) => {
  coinsCollected += 1;
  fx.pop(c.pos.clone());   // spawn the transient pop at the coin's spot
  destroy(c);              // remove the coin (tally already counted)
});
```

### Pattern 4: Layer the clear burst on the EXISTING moment (do not replace it)
**What:** JUICE-03 enhances — it does not rebuild. The gate already renders the persistent "LEVEL CLEAR" `gate-cleared` banner, and the scene already calls `hud.flashLevelUp()` on level-up. Add `fx.clearBurst()` at the same `onClear` seam.
**When to use:** JUICE-03.
**Example:**
```javascript
// src/scenes/game.js onClear (currently lines 154-171) — ADD one line, change nothing else
onClear({ table }) {
  const leveledUp = progress.addXp(table);
  hud.refresh();
  if (leveledUp) hud.flashLevelUp();
  fx.clearBurst();                       // NEW: brief, NON-STROBING celebratory burst
  writeSave(progress.serialize(brain.snapshot()));
}
```
> The burst must be NON-STROBING: a single expanding/fading ring or a few neon-green rects that fade once — NOT a rapid flicker. A flicker/strobe is an ADHD-safety violation (SAFE-03). Reuse `easeOutQuad`/`easeOutCubic`, one fade, then destroy.

### Pattern 5: Persistent fixed() corner controls hint (SAFE-02)
**What:** A small camera-immune text overlay pinned in a corner, always visible.
**When to use:** SAFE-02.
**Example:**
```javascript
// Reuse the hud.js fixed()/z() idiom. Mount once per scene; tag for replay teardown.
add([
  text("← → move · SPACE jump", { size: CONFIG.HINT.SIZE }),
  pos(CONFIG.HINT.X, CONFIG.HINT.Y),   // a low corner; keep clear of the top-left HUD badge/bar
  color(0xe8, 0xe8, 0xe8),             // #e8e8e8 — readable on #0a0a0a (~18:1, WCAG AA)
  fixed(),
  z(9000),
  "hud",                               // same teardown tag as the HUD → replay-safe
]);
```
> Mounting location: place it in `hud.js` (e.g. extend `mountHud` or add a sibling `mountControlsHint`) so it shares the HUD's fixed/replay discipline, OR mount it directly in `game.js` scene setup. Either is fine; the HUD module is the natural home. The HUD badge/bar sit at top-left (`X:16, Y:16`), so put the hint at a DIFFERENT corner (bottom-left/bottom-right) to avoid overlap. The arrow glyphs `← →` and `·` should render in Kaplay's default font — verify they don't show as tofu boxes during UAT; fall back to "LEFT/RIGHT move · SPACE jump" if they do.

### Pattern 6: The code-scoped negative-grep audit (SAFE-01) — CRITICAL nuance
**What:** A bash gate that fails if any timer/scheduler or punishment construct appears in `src/` **code** — but NOT in comments.
**Why the nuance matters:** The current `src/` is clean in code, but COMMENTS legitimately contain the banned words: `hud.js:29` says "setInterval/setTimeout — same no-timer discipline", `game.js:101` says "No game-over UI, no lives counter". A naive `grep -r 'setInterval' src/` would FALSE-POSITIVE on these. The existing scripts dodge this by targeting single files whose source is written to avoid the tokens; a whole-`src/` audit cannot. **Strip comments before grepping**, or grep with a comment-stripping pre-pass.
**Example:**
```bash
# scripts/check-safety.sh — mirror scripts/check-progress.sh structure
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
fail() { echo "safety checks: FAIL — $1" >&2; exit 1; }

# Strip // line comments and /* */ block comments so prose mentions don't false-positive.
# (Conservative: also drop full-line comments.) Build a temp "code only" view per file.
strip_comments() { sed -E 's://.*$::' "$1"; }   # line-comment strip; good enough for this codebase

# 0. Syntax gate every src module.
while IFS= read -r f; do node --check "$f" || fail "node --check failed: $f"; done \
  < <(find "$ROOT/src" -name '*.js')

# 1. NEGATIVE no-timer (SAFE-01): no scheduler in CODE (comments stripped).
while IFS= read -r f; do
  if strip_comments "$f" | grep -Eq 'setTimeout|setInterval|countdown|[^a-zA-Z]wait\(|[^a-zA-Z]loop\(|lifespan\('; then
    fail "timer/scheduler in code: $f (SAFE-01 no-timer mandate)"
  fi
done < <(find "$ROOT/src" -name '*.js')

# 2. NEGATIVE forgiving: no game-over / lives / XP-loss CODE construct.
while IFS= read -r f; do
  if strip_comments "$f" | grep -Eiq 'gameOver|game_over|loseLife|lives--|subtractXp|xp[[:space:]]*-='; then
    fail "punishment construct in code: $f (forgiving mandate)"
  fi
done < <(find "$ROOT/src" -name '*.js')

# 3. POSITIVE: the persistent controls hint text is present (SAFE-02).
grep -Rq 'SPACE jump' "$ROOT/src" || fail "missing persistent controls hint (SAFE-02)"

# 4. POSITIVE: fx self-cleans via onEnd(destroy), never lifespan/wait.
grep -q 'onEnd' "$ROOT/src/fx.js" || fail "fx.js effects must self-clean via tween().onEnd (no timer)"

echo "safety checks: PASS"
```
> The banned tokens must appear ONLY inside the grep PATTERNS, never as plain prose in `check-safety.sh` itself — same discipline the existing scripts call out. The `strip_comments` sed is line-comment-only; the codebase uses `//` line comments almost exclusively (verified), so this is sufficient. If a block `/* */` comment is ever added with a banned word, extend the stripper.

### Anti-Patterns to Avoid
- **Top-level engine calls in `fx.js`:** Any `add(...)`, `tween(...)`, `vec2(...)`, or even `typeof tween` at module scope throws at import time — imports are hoisted BEFORE `kaplay()` installs globals. This is the a727c13 bug verbatim. Globals ONLY inside exported function bodies. [VERIFIED: git show a727c13]
- **`lifespan()` / `wait()` for cleanup:** Convenient but they ARE timers — they undermine SAFE-01 and force the audit to whitelist a scheduler. Use `tween().onEnd(destroy)`.
- **Strobing/flickering bursts:** A rapid opacity flicker is an ADHD-safety violation (SAFE-03). One smooth fade only.
- **Leaked effect entities across replay:** Every transient must be tagged (`"fx"`) and self-destroy on `.onEnd`; never leave a dangling handler or untagged object that survives `go()`/respawn. (RESEARCH Pitfall 4 / mathGate anti-leak.)
- **Scaling the player so hard the collider feel changes:** Keep squash magnitudes small and brief; the `area()` collider tracks the entity — a big scale would momentarily change collision feel. Verify fairness with the kid.
- **Naive `grep -r 'setInterval' src/`:** False-positives on the existing comments. Strip comments first.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Land detection | A manual `wasGroundedLastFrame`/`isGroundedNow` transition tracker | `body().onGround(cb)` | The body comp already emits a `"ground"` event on landing — exactly the JUICE-01 hook. [VERIFIED: bundle] |
| Timed self-destroy of an effect | A `setTimeout`/frame-counter destroy | `tween(...).onEnd(() => destroy(obj))` | Already the proven in-repo idiom; frame-rate independent; audit-clean. |
| Easing curves | Hand-rolled cubic math | `easings.easeOutQuad`/`easeOutCubic` | Kaplay ships them; the project already uses `easeOutQuad`. |
| Scale setting | Manual matrix/transform | `scale()` comp + `.scaleTo()`/`.scaleBy()` | Built-in; the comp exposes the setters. [VERIFIED: bundle] |
| Tally of "is this src timer-free" by eye | Manual review only | `scripts/check-safety.sh` (repeatable) | The project's no-test-framework substitute; repeatable per-commit gate. |

**Key insight:** Every Phase 12 effect is the SAME proven primitive (`tween → onEnd(destroy)` + a tag) applied to a different comp (`scale`/`opacity`/`pos`). Resist inventing a new animation mechanism per effect; one `fx.js` of four small functions covers all of JUICE-01/02/03.

## Runtime State Inventory

> Phase 12 is additive juice + a hint + an audit + UAT — it is NOT a rename/refactor/migration. No stored data, service config, OS-registered state, secrets, or build artifacts are renamed or migrated. The new `CONFIG.FX`/`CONFIG.HINT` namespaces and `src/fx.js` are purely additive. **Nothing found in any category — verified: no string is renamed, no persisted key changes (`mathlab_platformer_v1` is untouched), no new external dependency.**

## Common Pitfalls

### Pitfall 1: Top-level engine usage in `src/fx.js` (the a727c13 trap)
**What goes wrong:** The whole game blanks on load with "X is undefined / global missing" thrown at import time.
**Why it happens:** ES `import` statements are hoisted and execute before `main.js` calls `kaplay({ global: true })`. Any Kaplay global referenced at `fx.js` module top level (including a `typeof tween` guard) runs before the globals exist.
**How to avoid:** Use globals ONLY inside the exported function bodies (`squash`/`dust`/`pop`/`clearBurst`), which are called at scene/runtime — after init. No top-level `add`/`tween`/`vec2`/guards.
**Warning signs:** A guard or constant at module scope that touches an engine symbol; a blank canvas + a thrown global error in the console.

### Pitfall 2: A timer sneaks in via `lifespan()`/`wait()` and the audit can't ban it
**What goes wrong:** An effect uses `lifespan(0.3)` to auto-destroy; SAFE-01's grep would have to whitelist a scheduler, gutting the audit.
**Why it happens:** `lifespan`/`wait` are the "easy" Kaplay way to time things, but they ARE timers.
**How to avoid:** Always `tween(...).onEnd(() => destroy(obj))`. Keep `check-safety.sh` banning `lifespan(`/`wait(`/`loop(` in code.
**Warning signs:** `lifespan`/`wait`/`loop`/`setTimeout` appearing in `src/fx.js` code (not comments).

### Pitfall 3: The audit false-positives on existing comments
**What goes wrong:** `check-safety.sh` fails on `hud.js`/`game.js` comments that mention "setInterval"/"game-over".
**Why it happens:** A whole-`src/` grep matches prose, not just code.
**How to avoid:** Strip `//` comments before grepping (the `strip_comments` pre-pass). The codebase uses `//` line comments almost exclusively. [VERIFIED: grep showed the only matches today are in comments]
**Warning signs:** The audit fails pointing at a line that is a comment.

### Pitfall 4: Effects leak across respawn/replay
**What goes wrong:** Dust/pop entities or a stale clear burst survive a `go()`/respawn and stack up.
**Why it happens:** Untagged transient or a tween that never resolves to `destroy`.
**How to avoid:** Tag every effect (`"fx"`); self-destroy on `.onEnd`. Optionally `onSceneLeave(() => destroyAll("fx"))` as a belt-and-braces sweep (mirrors `game.js` `onSceneLeave` discipline).
**Warning signs:** Growing object count after repeated respawns; lingering visuals after a respawn.

### Pitfall 5: Strobing / over-stimulating juice (the ADHD-safety failure mode)
**What goes wrong:** A flickering burst, a bouncy elastic squash, or a screen shake that's too strong overstimulates the kid — the exact thing this phase exists to prevent.
**Why it happens:** "More juice = better" instinct from generic game-feel advice.
**How to avoid:** One smooth fade per effect (`easeOutQuad`/`easeOutCubic`, not elastic), brief durations (cf. `FLASH_MS=450`), small scale magnitudes, shake ≤ the gate's `shake(6)` and optional. Confirm "subtle, not over-stimulating" in the kid UAT — this is the SAFE-03 sign-off.
**Warning signs:** The kid squints, looks away, or says it's "too much" — back the magnitudes down in `CONFIG.FX`.

### Pitfall 6: The controls hint overlaps the HUD or reads as tofu
**What goes wrong:** The hint sits under the level badge/XP bar (top-left), or the `←→·` glyphs render as boxes.
**Why it happens:** HUD badge/bar are at `X:16, Y:16`; default font may lack the arrow glyphs.
**How to avoid:** Put the hint in a different corner; verify glyphs render in UAT; fall back to "LEFT/RIGHT move · SPACE jump" if tofu appears.
**Warning signs:** Overlap; boxes instead of arrows.

## Code Examples

### Add the scale() comp to the player (player.js)
```javascript
// Source: pattern derived from src/player.js add([...]) + bundle scale() comp
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

### Dust: a few grey rects that rise + fade + self-destroy (fx.js)
```javascript
// Source: hud.js tween→onEnd idiom + bundle rect/pos/opacity/move
import { CONFIG } from "./config.js";   // ONLY non-engine import; globals used in fn bodies only

export function dust(at) {
  for (let i = 0; i < CONFIG.FX.DUST_COUNT; i++) {
    const p = add([
      rect(CONFIG.FX.DUST_SIZE, CONFIG.FX.DUST_SIZE),
      pos(at.x, at.y),
      color(0x88, 0x88, 0x88),   // grunge grey, NO pink
      opacity(0.8),
      anchor("center"),
      z(50),
      "fx",
    ]);
    const dx = (i - (CONFIG.FX.DUST_COUNT - 1) / 2) * CONFIG.FX.DUST_SPREAD;
    const targetY = at.y - CONFIG.FX.DUST_RISE;
    tween(0.8, 0, CONFIG.FX.DUST_MS / 1000, (v) => (p.opacity = v), easings.easeOutQuad);
    tween(at.y, targetY, CONFIG.FX.DUST_MS / 1000, (v) => (p.pos.y = v), easings.easeOutQuad);
    tween(at.x, at.x + dx, CONFIG.FX.DUST_MS / 1000, (v) => (p.pos.x = v), easings.linear)
      .onEnd(() => destroy(p));   // single onEnd drives teardown
  }
}
```

### CONFIG namespaces (config.js — no magic numbers)
```javascript
// Append after the existing literal, mirroring how CONFIG.GATE/HUD are namespaced.
FX: {
  SQUASH_X: 1.15, SQUASH_Y: 0.85, SQUASH_MS: 140,   // subtle, brief
  STRETCH_X: 0.9, STRETCH_Y: 1.1, STRETCH_MS: 120,  // on jump
  DUST_COUNT: 4, DUST_SIZE: 3, DUST_SPREAD: 8, DUST_RISE: 16, DUST_MS: 300,
  POP_SCALE: 1.5, POP_MS: 220,
  BURST_MS: 400,                                     // <= FLASH_MS feel; non-strobing
},
HINT: { X: 16, Y: 330, SIZE: 12 },                  // bottom-left, clear of the top HUD
```
> Magnitudes above are STARTING points within "subtle & brief" (Claude's discretion) — final values are tuned with the kid in UAT.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Kaboom.js `addKaboom`/`burp` juice helpers | Kaplay 3001 `tween`/`scale`/`particles` + body land events | Kaboom→Kaplay rename (3000+) | Use 3001 names only; the vendored bundle is the source of truth. [VERIFIED: bundle] |
| `lifespan()`/`wait()` for timed effects | Explicit `tween().onEnd(destroy)` | project ADHD no-timer mandate | Audit-clean, deterministic teardown. |

**Deprecated/outdated:** Old Kaboom sheet/anim helpers (`loadSpriteAtlas` shortcuts, `play()` audio) are out of scope (audio deferred). Code against 3001 only — STATE.md pitfall 2.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `body().onGround(cb)` fires on the player given its `body()` setup (no special opt needed) | Standard Stack / Pattern 2 | LOW — confirmed in bundle as `this.on("ground",u)`; if it doesn't fire, fall back to a manual `isGrounded()` rising-edge in the existing `onUpdate`. Verify on first run. |
| A2 | The default Kaplay font renders `← → ·` glyphs | Pattern 5 / Pitfall 6 | LOW — cosmetic; fall back to "LEFT/RIGHT move · SPACE jump". Verify in UAT. |
| A3 | A small, brief `scale()` squash does not make the `area()` collider feel unfair | Pattern 2 / Anti-Patterns | MEDIUM — collider tracks the entity; keep magnitudes small/brief and confirm fairness with the kid (UAT). |
| A4 | `sed 's://.*$::'` comment-stripping is sufficient (codebase uses `//` line comments, not `/* */` with banned words) | Pattern 6 | LOW — verified current src uses `//`; extend the stripper if a block comment with a banned word is added. |
| A5 | Exact tween durations/particle counts/scale magnitudes in CONFIG.FX are "subtle & brief" enough | CONFIG namespaces | MEDIUM — explicitly Claude's discretion; final sign-off is the kid UAT (SAFE-03). |

## Open Questions

1. **Does `onGround` fire reliably for THIS player's body config, or is a manual rising-edge needed?**
   - What we know: bundle defines `onGround(u){return this.on("ground",u)}`; the player has `body()`.
   - What's unclear: whether the merged-floor colliders + `maxVelocity` cap emit the `"ground"` event on every landing.
   - Recommendation: wire `onGround` first; if a landing is ever missed, fall back to an `isGrounded()` rising-edge check inside the existing `player.onUpdate` (`if (!wasGrounded && isGrounded()) fx.squash/dust`). Verify on first run.

2. **AUDIT.md vs. just `check-safety.sh` (or both)?**
   - What we know: CONTEXT leaves this to Claude's discretion; the existing pattern is a runnable script.
   - What's unclear: whether the user wants a human-readable audit summary doc too.
   - Recommendation: ship `scripts/check-safety.sh` (the repeatable gate) AND a short `12-AUDIT.md` recording the audit result + the manual-confirm items + the forgiving sweep — best of both, and the UAT checklist needs a doc home anyway.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node (for `node --check`) | check-safety.sh syntax gate | ✓ (used by existing check-progress.sh) | — | — |
| Bash + grep + sed | check-safety.sh | ✓ (existing scripts are bash) | — | — |
| A browser (Windows laptop) | Kid UAT (feel/contrast/over-stimulation) | ✓ (target device) | — | — |
| `python3 -m http.server` (dev server) | Manual browser UAT (file:// blocks modules) | ✓ (documented launch path, STATE.md) | — | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None — all tooling is already in use by the existing check scripts.

## Validation Architecture

> nyquist_validation is not disabled. The project has NO JS test framework (no-build/no-dep canon). Validation = `node --check` + structural greps + manual/kid UAT. Feel, over-stimulation, and contrast are inherently kid-UAT items — NOT automatable.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no JS test framework — project canon). Structural bash gates + `node --check` substitute. |
| Config file | none — see Wave 0 |
| Quick run command | `node --check src/fx.js && node --check src/player.js && node --check src/scenes/game.js` |
| Full suite command | `bash scripts/check-safety.sh && bash scripts/check-progress.sh` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| JUICE-01 | squash/stretch + dust on jump/land | structural + manual | `grep -q 'onGround' src/player.js && grep -q 'squash' src/fx.js && grep -q 'dust' src/fx.js` | ❌ Wave 0 (fx.js new) |
| JUICE-01 | dust self-cleans, no timer | structural | `grep -q 'onEnd' src/fx.js` + check-safety no-timer grep | ❌ Wave 0 |
| JUICE-02 | coin pop at coin pos before destroy | structural + manual | `grep -q 'pop(' src/scenes/game.js && grep -q 'export function pop' src/fx.js` | ❌ Wave 0 |
| JUICE-03 | clear burst layered on existing moment, non-strobing | structural + KID UAT | `grep -q 'clearBurst' src/scenes/game.js` (non-strobing is UAT) | ❌ Wave 0 |
| SAFE-01 | no timer/scheduler in src code | structural (negative) | `bash scripts/check-safety.sh` (comment-stripped grep) | ❌ Wave 0 (script new) |
| SAFE-01 | forgiving: no game-over/lives/XP-loss | structural (negative) | `bash scripts/check-safety.sh` forgiving sweep | ❌ Wave 0 |
| SAFE-02 | persistent controls hint visible | structural + manual | `grep -Rq 'SPACE jump' src/` (visibility/legibility is UAT) | ❌ Wave 0 |
| SAFE-03 | readable contrast, not over-stimulating | MANUAL / KID UAT ONLY | — (not automatable) | n/a |

### Sampling Rate
- **Per task commit:** `node --check` the edited files (quick run).
- **Per wave merge:** `bash scripts/check-safety.sh && bash scripts/check-progress.sh` (full structural suite).
- **Phase gate:** Full suite green + the kid-UAT checklist signed off by the user before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `scripts/check-safety.sh` — SAFE-01 no-timer + forgiving structural audit (comment-stripped greps; positive checks for the hint + fx.onEnd).
- [ ] `src/fx.js` — created by the JUICE waves; the audit's positive checks reference it.
- [ ] `12-UAT.md` — kid-UAT checklist (feel, juice-not-over-stimulating, controls discoverable, no time pressure felt, contrast readable). Required because SAFE-03 + feel/framing are non-automatable and the user signs them off.
- [ ] (Optional) `12-AUDIT.md` — human-readable SAFE-01 audit summary + manual-confirm record.

## Security Domain

> `security_enforcement` is not disabled; included for completeness. This phase is local-only, offline, no backend, no user input beyond keyboard, no new data flows, and renders via Kaplay canvas (no DOM/innerHTML sink — project canon continues).

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts/backend (out of scope). |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | No server. |
| V5 Input Validation | minimal | The only inputs are keyboard move/jump; no text fields, no parsing. The hint is a static string literal — no injection path. |
| V6 Cryptography | no | No secrets. |
| V14 Config | yes (light) | `src/fx.js` must not introduce a top-level engine call (load-time crash) or a DOM sink — render via Kaplay `text()`/`rect()` only, like hud.js/mathGate.js. |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| DOM/innerHTML injection via a juice/hint string | Tampering | Render via Kaplay `text()` canvas objects only (no `innerHTML`/`document.`/`alert`); the hint is a static literal. Mirrors the gate's T-09-07 / GATE-01 no-DOM-sink guard. |
| Load-time crash from top-level global use (availability) | DoS (self-inflicted) | Globals only inside fn bodies (a727c13). The check-safety syntax gate + manual load catch it. |

## Sources

### Primary (HIGH confidence)
- `lib/kaplay.mjs` (3001.0.19, sha256 fb4a4ef2...) — confirmed `scale`/`scaleTo`/`scaleBy`, `tween`, `easings.{easeOutQuad,easeOutCubic,easeOutBack,easeOutElastic,easeInOutQuad,linear}`, `opacity`, `move`, `destroy`, `destroyAll`, `shake`, `body().onGround()`, `body().onLand()`, `particles`, `lifespan`, `wait`. [VERIFIED]
- `src/ui/hud.js` (`flashLevelUp`) + `src/scenes/game.js` (`reset`) — the proven `tween(...).onEnd(() => destroy(obj))` self-cleaning, timer-free idiom. [VERIFIED]
- `src/ui/mathGate.js` — the fixed()/z() overlay idiom, `destroyAll(tag)` teardown, `shake(6)` magnitude, the "LEVEL CLEAR" `gate-cleared` terminal banner to coordinate JUICE-03 with. [VERIFIED]
- `src/player.js` — the jump/land hook points; current `add([...])` comp list (add `scale(1)`). [VERIFIED]
- `scripts/check-progress.sh`, `.planning/phases/10-.../scripts/check-gate.sh` — the structural-gate template (fail-fast asserts, banned-tokens-only-in-patterns, negative no-timer grep `setTimeout|setInterval|...|wait\(|loop\(`). [VERIFIED]
- `git show a727c13` — the top-level-engine-global crash lesson (imports hoisted before kaplay init). [VERIFIED]
- Live grep across `src/` — confirms the no-timer/forgiving CODE is already clean; the banned words appear ONLY in comments (hud.js:29, game.js:101) — the audit must strip comments. [VERIFIED]

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — ADHD-safety mandate, FLASH_MS=450 precedent, anti-leak/anti-top-level-global pitfalls, "tune feel with the kid in Phase 12". [CITED]
- `.claude/CLAUDE.md` — palette (#0a0a0a/#e8e8e8/#00ff88, no pink), WCAG AA contrast (~18:1 for #e8e8e8 on #0a0a0a), no-build/no-dep canon. [CITED]

### Tertiary (LOW confidence)
- None — all claims grounded in the vendored bundle or in-repo source.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every symbol verified directly in the vendored bundle; effect idiom already shipped in-repo.
- Architecture: HIGH — additive only; hooks (jump, onGround, coin onCollide, onClear) all exist as clean seams.
- Pitfalls: HIGH — the two highest-risk pitfalls (top-level globals; comment false-positives in the audit) are confirmed from a real prior bug and a live grep.
- Tuning magnitudes / contrast / over-stimulation: MEDIUM by nature — these are kid-UAT sign-offs, not facts to verify in code.

**Research date:** 2026-06-27
**Valid until:** 2026-07-27 (stable — vendored pinned engine, no moving dependencies)
