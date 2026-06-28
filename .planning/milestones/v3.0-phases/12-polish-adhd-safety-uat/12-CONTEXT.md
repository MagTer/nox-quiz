# Phase 12: Polish, ADHD-Safety & UAT - Context

**Gathered:** 2026-06-27
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — Areas 1/2/4 accepted as recommended; Area 3 overridden (persistent corner hint)

<domain>
## Phase Boundary

The final phase. Make the game read and feel like a real game in front of the actual kid:
satisfying-but-subtle juice (jump/land squash + dust, coin pop, a distinct level-clear
moment), discoverable controls, and readable contrast — and audit + confirm the
no-timer / forgiving / low-stimulation mandate in UAT with the user.

In scope: JUICE-01 (jump/land feedback), JUICE-02 (coin pop), JUICE-03 (level-clear
celebration), SAFE-01 (no-timer audit), SAFE-02 (discoverable controls hint),
SAFE-03 (contrast + not over-stimulating), and a final kid UAT.

Out of scope (deferred): AUDIO-01 (sound effects / music) — explicitly NOT this phase;
multi-level content; any new mechanics.
</domain>

<decisions>
## Implementation Decisions

### Movement & Landing Juice (JUICE-01)
- Subtle squash/stretch on the player via a `scale()` comp + tween (stretch slightly on jump, squash on land); ADHD-safe — subtle and brief, not bouncy/over-stimulating.
- Landing dust: a few short-lived grey rect particles that rise + fade + self-destroy (opacity/pos tween → destroy; NO timer abuse, no leaked handlers).
- Lives in a small new `src/fx.js` helper (engine-side), called from `src/player.js` jump/land hooks (player owns jump + ground state). Keep `src/math/*` and `src/progress.js` firewalls untouched.
- Palette: dark grunge + neon-green accent (no pink).

### Coin & Level-Clear Juice (JUICE-02, JUICE-03)
- Coin pop (JUICE-02): on collect, a quick scale-pop + fade at the coin's position (then destroy). No "+1" text — coins are count-only (Phase 9). Subtle.
- Level-clear (JUICE-03): enhance the EXISTING moment (the gate's "LEVEL CLEAR" banner + the HUD level-up flash) with a brief, **non-strobing** celebratory burst. Distinct and celebratory but brief — no full-screen takeover, no strobe.
- NO audio this phase — visual juice only. AUDIO-01 (SFX/music) is deferred to a future milestone.
- One consistent juice language across all effects: subtle, brief, non-strobing, dark-grunge/neon-green.

### Discoverable Controls (SAFE-02) — USER OVERRIDE
- **Persistent corner hint** (NOT a fading start hint): a small, always-visible controls hint pinned in a screen corner so it is discoverable at any time with zero time pressure.
- Hint text shows the move + jump keys: "← → move · SPACE jump" (the intuitive primary bindings; the real bindings also include A/D and Up/W).
- Implemented as a `fixed()` scene/HUD overlay (reuse the HUD overlay idiom), dark grunge, readable contrast, non-intrusive (small, low-corner).

### ADHD-Safety Audit + Contrast + UAT (SAFE-01, SAFE-03)
- No-timer audit (SAFE-01): a DOCUMENTED audit — a structural grep across src/ (no setTimeout/setInterval/countdown/time-pressure) PLUS a manual confirm. Reuse the existing negative-grep discipline (the phase-10/11 check scripts); extend/author an audit that covers the whole game.
- Forgiving audit: confirm there is no game-over / lives / XP-loss construct anywhere (already true) — fold into the same audit doc.
- Contrast (SAFE-03): a manual contrast pass on the `#0a0a0a` theme (text + sprites + HUD readable); confirm juice/effects are subtle and not over-stimulating; bump any low-contrast text. No formal WCAG tooling (overkill for this single-user game).
- Final UAT: a UAT checklist validated WITH THE ACTUAL KID — feel, framing, juice-not-over-stimulating, controls discoverable, no time pressure felt. Feel/framing sign-off is the user's, by design.

### Claude's Discretion
- Exact tween durations / particle counts / scale magnitudes within the "subtle & brief" mandate.
- Exact corner + size/styling of the persistent controls hint.
- Whether the no-timer audit ships as a new `scripts/check-*.sh` or a documented AUDIT.md (or both).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/player.js` — owns jump (coyote/buffer/variable height) + ground state; the jump/land hook points for squash + dust. Has `body({ maxVelocity })`, `opacity`. Add `scale()` for squash.
- `src/scenes/game.js` — `player.onCollide("coin", …)` (coin pop hook), the goal/onClear path (level-clear burst hook), scene mount (controls hint mount).
- `src/ui/hud.js` — the `fixed()`/`z()` overlay idiom + `flashLevelUp()` (the level-clear moment to enhance) + the dark-grunge palette constants (TRACK_GREY, ACCENT_GREEN); the controls hint can mount alongside, one-way read.
- `src/ui/mathGate.js` — the gate's "LEVEL CLEAR" banner (gate-cleared tag) — coordinate the JUICE-03 burst with it.
- `src/config.js` — central constants; add CONFIG.FX / CONFIG.HINT namespaces (no magic numbers).
- The check-script pattern (`scripts/check-progress.sh`, phase-10 check-gate.sh) — model for the SAFE-01 no-timer audit script.

### Established Patterns
- Vanilla ES modules; Kaplay 3001 globals (scale, tween, easings, opacity, add, destroy, fixed, z, text, rect); canvas text, never DOM. NO build step, NO test framework.
- IMPORTANT (just-learned, a727c13): do NOT put Kaplay-global usage or `typeof <global>` guards at MODULE TOP LEVEL — imports are hoisted and run before kaplay() installs globals. Use globals only inside functions called at scene time. src/fx.js must follow this (no top-level engine calls).
- Self-cleaning effects: tween → destroy + tag, no setTimeout/setInterval (no-timer mandate, ADHD-safe), no leaked handlers across replays (factory/closure discipline).
- Subtle/brief juice (cf. FLASH_MS=450 ADHD-safe level-up flash).

### Integration Points
- player.js jump/land → src/fx.js (squash + dust).
- game.js coin collide → coin pop; goal/onClear → level-clear burst; scene mount → persistent controls hint.
- hud.js / scene → the fixed() controls hint overlay.

</code_context>

<specifics>
## Specific Ideas

- "Reads and feels like a real game in front of the actual kid" — the bar is the kid's reaction; juice must be satisfying yet calm.
- Hard ADHD-safety mandate (all milestones): NO countdown/time pressure anywhere; wrong answers never punish; effects must not be over-stimulating/strobing.
- Target device: a Windows laptop — the controls hint must be discoverable there (keyboard).
- The level-clear moment already exists (gate LEVEL CLEAR + HUD level-up flash) — enhance, don't replace.

</specifics>

<deferred>
## Deferred Ideas

- AUDIO-01 — sound effects + ambient music (the biggest remaining "real game" gap) — future milestone, NOT this phase.
- Additional levels / content; new mechanics.
- Formal WCAG/accessibility tooling beyond a manual contrast pass.

</deferred>
