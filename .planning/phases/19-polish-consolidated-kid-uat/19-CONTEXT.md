# Phase 19: Polish & Consolidated Kid-UAT - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss — all grey-area recommendations below were auto-accepted.

<domain>
## Phase Boundary

This phase closes the v4.0 Content & Challenge milestone by auditing everything built in Phases 13–18 for ADHD-safety and running a consolidated kid playtest. The goal is not to add new capabilities, but to verify that the assembled multi-level platformer — four levels, four math mechanics, art/animation/parallax, and the title/select shell — still honors the project’s hard no-timer / forgiving / no-game-over mandate and feels good to the kid.

In scope (SAFE-04, SAFE-05):
- Extend and re-run the whole static audit suite (`check-safety.sh`, `check-import-safety.sh`, `check-gate.sh`) across all new modules and levels.
- Run the real-browser boot script and confirm title → select → each level loads with no runtime errors.
- Conduct a structured kid-UAT session that probes every mechanic, every level, wrong-answer forgiveness, and progression/resume.
- Apply small, low-risk polish fixes driven by audit failures or kid feedback (animation timing, parallax feel, checkpoint/geometry tuning) without adding features or changing core systems.
- Record UAT results and final sign-off in `19-UAT.md`.

Out of scope:
- New math mechanics, new levels, new art assets, or new systems (AUDIO-01, CONTENT-FUT-01, CONTENT-FUT-02).
- Changing the brain algorithm, XP curve, or save format.
- Resolving v3.0 deferred verification items (MOVE-05 empirical check, live Dokploy deploy confirmation).
</domain>

<decisions>
## Implementation Decisions

### Grey Area 1/4: Safety Audit Scope & Tooling
- **D-01:** Keep `check-safety.sh` whole-src coverage as-is (it already scans all `src/**/*.js`); add only a comment/header note in the phase plan that Phase 19 verified it covers the new `src/mechanics/` and `src/parallax.js` modules. Do not maintain a separate explicit file list unless a failure requires it.
- **D-02:** Keep `check-import-safety.sh` on its existing scoped module list (`src/scenes/title.js`, `src/scenes/select.js`, `src/parallax.js`, `src/ui/challenge.js`, `src/mechanics/door.js`, `src/mechanics/gates.js`, `src/mechanics/enemy.js`, `src/mechanics/collect.js`) plus existence/syntax checks for `src/scenes/game.js` and `src/main.js`. Do not expand to a whole-src negative scan, because `game.js` and `main.js` legitimately use engine globals inside function bodies / post-init module scope.
- **D-03:** Keep the existing `check-gate.sh` assertions 10–13 as the positive proof that each mechanic calls `openChallenge`; no dynamic loop needed.
- **D-04:** Keep `scripts/browser-boot.mjs` as a navigation/load smoke (title → select → all four levels). Mechanic forgiveness is verified by static audit and kid-UAT, not by scripted mechanic interaction, to keep the boot stable and fast.

### Grey Area 2/4: Kid-UAT Protocol
- **D-05:** Use a lightweight structured checklist for UAT covering: title → select → each unlocked level → each mechanic type (door, checkpoint gate, enemy, collect-the-answer) → wrong-answer probe → level clear → progression/unlock → resume. Include open-ended questions: “Was anything unfair?”, “Did anything feel too busy?”, “Would you play again?”
- **D-06:** Record UAT results in a dedicated `19-UAT.md` file (checklist table, verbatim feedback, pass/fail per item, final sign-off). Do not embed the full UAT transcript in `19-CONTEXT.md`.
- **D-07:** Run the wrong-answer probe for every mechanic type: door, checkpoint gate, enemy, and collect pickup. Confirm that a wrong answer re-asks with zero XP loss, no position reset, no despawn, no timer, and no lockout.
- **D-08:** The kid plays all four levels during UAT. The consolidated end-to-end sign-off is the phase’s explicit success criterion.

### Grey Area 3/4: Polish Fix Scope
- **D-09:** Phase 19 may include small, low-risk feel fixes that directly address audit failures or kid feedback — e.g., animation frame-rate tweaks within existing CONFIG ranges, parallax ratio/opacity adjustments, checkpoint placement or minor level-geometry tuning. These must not add new features, new modules, or change player physics / brain / save contracts.
- **D-10:** If a level feels too hard during UAT, tune checkpoint placement or gap geometry in the level descriptor. Do NOT add new mechanics, change `RUN_SPEED`/`JUMP_FORCE`, or alter the movement spine.
- **D-11:** If parallax feels busy, reduce ratios or layer opacity within the existing `CONFIG.PARALLAX` ranges; do not add new layers or disable parallax entirely.
- **D-12:** Any soft-lock found during UAT is a blocking bug: fix it, then re-run the full static suite and browser boot before final sign-off.

### Grey Area 4/4: Final Acceptance Criteria
- **D-13:** The kid should attempt each level herself during UAT. The developer may assist only on the first level if needed, but must observe the kid playing the remaining levels to validate feel and difficulty.
- **D-14:** The final browser boot must show zero page errors and zero 4xx responses. Non-blocking warnings (e.g., font glyph tofu, harmless deprecation) are allowed if they do not affect gameplay.
- **D-15:** Sign-off bar for “fun” is the kid saying she would play again or rating the experience “fun/good”. No numeric score or star rating is required.
- **D-16:** v3.0 deferred verification items (MOVE-05 empirical check, live Dokploy deploy confirmation) remain deferred and are NOT blockers for Phase 19 / v4.0 milestone close.

### Claude's Discretion
- Exact wording of the UAT checklist, exact number of wrong-answer probes per mechanic, exact polish tweaks (animation speeds, parallax ratios, checkpoint offsets), and exact wording of the kid sign-off are at Claude's discretion, provided SAFE-04, SAFE-05, and the success criteria above are met.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & milestone context
- `.planning/PROJECT.md` — Vision, constraints, target user, dark-grunge aesthetic, no-timer/no-pink/no-backend rules.
- `.planning/REQUIREMENTS.md` — v4.0 requirements and traceability (SAFE-04, SAFE-05 mapped to Phase 19).
- `.planning/STATE.md` — v4.0 roadmap, cross-cutting mitigations (a727c13, anti-leak, real-browser boot), locked decisions, deferred items.

### Prior phase context
- `.planning/phases/15-challenge-seam-locked-door-mechanic/15-CONTEXT.md` — Shared challenge seam extraction and locked-door pattern.
- `.planning/phases/16-remaining-mechanics-difficulty-curve/16-CONTEXT.md` — Collect/gate/enemy mechanics, difficulty ramp via `allowedTables`.
- `.planning/phases/17-build-the-levels/17-CONTEXT.md` — Four authored levels, geometry schema, per-level bounds, mechanic placement.
- `.planning/phases/18-art-animation-parallax/18-CONTEXT.md` — Art/animation/parallax pass decisions and ADHD-safety caps.

### Game loop & mechanics (subjects of the audit)
- `src/scenes/game.js` — Scene closure state, mechanic wiring, goal clear flow, anti-leak teardown.
- `src/scenes/select.js` — Level-select tiles and derived unlock/cleared state.
- `src/player.js` — Player animation state machine, coyote/buffer jump, freeze-on-pause guard.
- `src/parallax.js` — Camera-driven parallax layers; must stay calm and non-strobing.
- `src/ui/challenge.js` — Shared forgiving, no-timer challenge seam.
- `src/ui/mathGate.js` — Thin end-of-level wrapper over `challenge.js`.
- `src/mechanics/door.js` — Locked-door mechanic.
- `src/mechanics/gates.js` — Checkpoint gate mechanic (MECH-04).
- `src/mechanics/enemy.js` — Defeat-enemy mechanic (MECH-05).
- `src/mechanics/collect.js` — Collect-the-answer mechanic (MECH-03).
- `src/fx.js` — Tween-based effects and the ≤400–500 ms flash-cap discipline.
- `src/config.js` — All tuning constants (FX, parallax, animation speeds, level geometry helpers).
- `src/levels/level-01.js` through `src/levels/level-04.js` — Level descriptors; polish fixes may touch geometry/checkpoints.
- `src/levels/index.js` — Registry and derived unlock.

### Gates & verification
- `scripts/check-safety.sh` — Whole-src no-timer + no-punishment audit gate.
- `scripts/check-import-safety.sh` — a727c13 module-top-level engine-global gate.
- `scripts/check-gate.sh` — Structural firewall gate for `src/ui/challenge.js` and thin mechanic callers.
- `scripts/browser-boot.mjs` — Real-browser navigation/load smoke.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/check-safety.sh`, `scripts/check-import-safety.sh`, `scripts/check-gate.sh` — All three static gates currently pass on the Phase 18 tree; they are the primary audit tooling for SAFE-04 and the a727c13 contract.
- `scripts/browser-boot.mjs` — Already seeds a save unlocking all four levels and navigates title → select → each level. It is the mandatory runtime smoke test.
- `src/ui/challenge.js` — Single shared forgiving, no-timer challenge overlay used by every math mechanic and the end gate.
- `src/fx.js` — Self-cleaning tween effects that already respect the non-strobing flash cap.
- `src/levels/index.js` + `src/progress.js` — Derived unlock and per-level cleared persistence; no second source of truth.

### Established Patterns
- **a727c13 discipline** — Engine globals only inside function bodies; new audit fixes must not introduce module-top-level engine refs.
- **Closure-local run state** — `game.js` owns coins, goal latch, checkpoint, tween handles, brain, progress, and HUD inside the scene closure.
- **Forgiving math seam** — Every mechanic pauses the player, re-asks on wrong with zero penalty, and resumes only on correct answer.
- **Tween-only effects** — No `wait()`/`loop()`/`setTimeout`; all motion is tween-based and self-destroys on `onEnd`.
- **Anti-leak teardown** — `onSceneLeave` cancels the hide controller, destroys `"parallax"`/`"fx"` tags, cancels player scale tweens and the clear-transition tween.
- **Derived unlock** — `isUnlocked(id, progress)` computes from `LEVEL_ORDER` + cleared facts; never stored.

### Integration Points
- Audit scripts run against the whole `src/` tree and the scoped scene/mechanic module list.
- Any polish fix that touches level geometry connects through `src/levels/level-NN.js` → `src/levels/build.js` → `src/scenes/game.js`.
- Any animation/parallax feel tweak connects through `src/config.js` → `src/player.js` / `src/parallax.js`.
- UAT results flow into `19-UAT.md`; only the pass/fail summary and sign-off are referenced in planning.
</code_context>

<specifics>
## Specific Ideas

- **UAT checklist proposal:**
  1. Title screen loads; Enter/Space/click advances to select.
  2. Level-select shows 1 locked/unlocked/cleared state per level; cursor + Enter loads a level.
  3. Each of the four levels loads without errors and is completable start→goal.
  4. Wrong-answer probe at a door, gate, enemy, and collect zone: zero punishment, same question re-asks.
  5. Correct answer opens the mechanic and play resumes smoothly.
  6. Progression persists: cleared level unlocks the next; XP/level HUD updates; returning to select shows the new state.
  7. Resume works: selecting a previously unlocked level does not force replay of earlier levels.
  8. Art/animation/parallax feels non-strobing and not too busy to the kid.
  9. Kid verdict: would play again / nothing unfair / nothing too busy.
- **Sign-off format:** A short `19-UAT.md` with a checklist table (Item / Expected / Observed / Pass/Fail), verbatim kid quotes, and a concluding “Signed off by:” line.
- **Polish safety guard:** Any CONFIG tweak must stay within the ranges already documented in `18-CONTEXT.md` (e.g., parallax ratios 0.15/0.45/0.75, animation speeds idle ~6–8 fps / run ~10–12 fps, FX durations ≤ 400–500 ms).
</specifics>

<deferred>
## Deferred Ideas

- Audio / SFX / calm ambient music (AUDIO-01) — remains post-v4.0.
- Additional levels or world packs (CONTENT-FUT-01).
- Star/score-based completion texture (CONTENT-FUT-02 — kept out for ADHD-safety).
- v3.0 deferred verification items: MOVE-05 empirical check and live Dokploy deploy confirmation.
- Any new feature suggested during UAT that is not a small polish fix (capture in a new phase or backlog item).
</deferred>

---

*Phase: 19-Polish & Consolidated Kid-UAT*
*Context gathered: 2026-07-03*
