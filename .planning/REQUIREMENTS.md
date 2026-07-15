# Requirements: Nox Run — v6.0 SNES-Fidelity World

**Defined:** 2026-07-09
**Core Value:** She opens it because she *wants* to, not because she has to.

## v6.0 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Mechanic Cleanup

- [x] **MECH-01**: Collect-the-answer mechanic fully removed — code (`src/mechanics/collect.js`, builder blocks, config), level data (all 8 descriptors), and every defending gate/fixture (`check-gate.sh` #13, smoke-progress golden geometry, audit expectations, validator entries) updated atomically in one change
- [x] **MECH-02**: Math pacing rebalanced in the 5 affected levels (01/03/04/06/08) using the remaining mechanics — rhythm over 1:1 quota (≥2 mid-level encounters + end gate per level), XP economy re-checked
  - **Tightened 2026-07-12 (user decision):** per-level math density is now locked at EXACTLY 1 door + 1 enemy + the end-of-level goal gate = 3 challenges per level, uniform across all 8 levels. All mid-level checkpoint `mathGates` removed from every descriptor (still satisfies the "≥2 mid-level encounters" letter via door+enemy). Binding for Phases 34–38.
- [x] **MECH-03**: Secret alcove gives on-touch discovery feedback — particle burst + chime + "+5 XP" popup, one-shot per run, revealed only AFTER discovery (never pre-signposted, no secrets counter)
- [x] **MECH-04**: Secret alcove has automated coverage — point-vs-jump-reach reachability in the validator and an entity-destroy/XP-delta trigger signal in the interactive audit (never the challenge-open signal)
- [ ] **MECH-05**: Discovered alcove leaves a persistent in-level ambient change for the rest of the run (e.g. torch lights up) — positive-only reinforcement
- [x] **MECH-06**: Level-select shows a positive-only secret-found marker per cleared level (no "0/1" missing-framing; save version bump handled through the guarded progress seam)

### Art Foundation

- [x] **ART-01**: One style-coherent sourced dark pixel-art collection (ansimuz Gothicvania anchor, 3–4 biomes) vendored with licenses/credits via the existing CREDITS.md + assets/LICENSES/ process; style-board mock screen gets human sign-off BEFORE any integration; automated pink-hue scan gate added (no pink asset can land)
- [x] **ART-02**: Filled terrain — solid autotiled ground mass (surface + underground fill + edge/corner tiles) replacing the floating 16px strip, using the spike-proven chunked `{tiled:true}` rendering recipe; colliders untouched
- [x] **ART-03**: Real per-biome multi-layer parallax backgrounds (sky + 2–3 detail layers) replacing the flat triangle silhouettes
- [ ] **ART-04**: Fully animated player (idle, run 4+ frames, jump, fall, land) with the 16×32 physics collider explicitly locked via `area({ shape })` — supersedes the v4.1 player-art lock with a new human sign-off
- [ ] **ART-05**: Real animated art for mechanic entities — doors, checkpoint gates, enemy blockers, math gate (invisible blocker colliders untouched)
- [ ] **ART-06**: Visual-only `props` layer in level descriptors (torches, crates, chains…) — no colliders, validator-neutral
- [ ] **ART-07**: All 8 levels re-dressed in their assigned biome, with kid-validated geometry byte-frozen during re-dress (geometry edits live only in LVL-01/02 sanctioned fixes)

### World Motion

- [ ] **MOT-01**: Patrolling cosmetic enemies — built-in `patrol()` between fixed waypoints, walk-cycle telegraph, contact = checkpoint respawn (existing ADHD-safe hazard class), visually distinct from stationary math-blocker enemies, zero hurt/punishment wiring
- [ ] **MOT-02**: Moving platforms — native `stickToPlatform` carry, dt-based ping-pong with sine easing (natural endpoint slow-down, no timers), placed only in new/re-dressed sections
- [ ] **MOT-03**: Ambient animation — torch flames, shimmer, goal/checkpoint unlock animations (pure visual loops, check-safety-compliant idioms from spike-code only)
- [x] **MOT-04**: Validator + interactive audit learn movers BEFORE any level ships one — worst-case-extreme reachability rule proven RED-first against a failing fixture

### Level Quality

- [ ] **LVL-01**: Unreachable pickups/ledges in levels 5–8 fixed (validator-gated geometry edits, separated from visual re-dress commits)
- [ ] **LVL-02**: Level-07 and level-08 end-climb sections differentiated (no longer near-duplicates)
- [ ] **LVL-03**: All 8 levels reviewed against docs/LEVEL-DESIGN.md soft rules; motion design rules (checkpoint before every mover, missed platform = wait not death) written into LEVEL-DESIGN.md before any motion authoring

### Key Mechanic (added 2026-07-15 — REVERSES SEED-001's "no new play mechanics" lock)

- [x] **KEY-01**: A key/lock mechanic exists (`geometry.keys` / `geometry.locks` + a `src/mechanics/key.js` seam) — the game's FIRST non-math gate. Accepted knowingly by the user; it changes the thesis that multiplication is the only gate to progress.
- [x] **KEY-02**: NO SOFTLOCK IS POSSIBLE. The validator HARD-proves, per level, that every lock's key is reachable from spawn AND reachable before the lock is required; an in-engine audit proves a real driven player picks it up and opens the lock. A key she can miss on a route she cannot re-traverse is a dead end — the worst failure a no-punishment game for a 12-year-old can ship.

### Level Length & Shape (added 2026-07-15)

- [ ] **LEN-01**: All 8 levels REBUILT from scratch (not appended to) at ~2x length, authored against the agreed `docs/LEVEL-DESIGN.md` rules — including the HARD headroom rule. Suspends the kid-validated byte-freeze; Phase 38's kid-UAT becomes a real re-approval.
- [ ] **LEN-02**: Altitude is a CORE feature, not an ending. The biome-pair rhythm: odd levels introduce a biome (calmer), EVEN levels (2/4/6/8) are the second visit and go intense + vertical. Plus descents, optional high routes (risk/reward), and backtracking as VISIBLE doubling-back only — she must always see where she is going.

### Brand

- [ ] **BRAND-01**: New "n0x" logo treatment (title hero + select badge) — a redesigned mark as part of the SNES identity, not a text swap, under the Phase-26-standard multi-round human sign-off

### Mobile

- [ ] **MOB-01**: Responsive canvas — letterbox migration replacing the CSS `transform: scale(1.5)` hack, opened by a RED-first Playwright touch-coordinate probe (prove the current desync, then prove the fix, keep it as a permanent gate); desktop look and all mouse behavior preserved; stale pitfall comments rewritten
- [ ] **MOB-02**: Touch controls — discrete left/right + jump virtual buttons with hold semantics (variable-height jump), multi-touch per-identifier tracking, oversized hit zones (≥64px effective), active only on touch devices, challenge-pause-aware, tunables in CONFIG
- [ ] **MOB-03**: Math answers, mute, and reset are tappable on touch devices (via the unified coordinate mapping)
- [ ] **MOB-04**: Portrait "rotate your device" overlay + browser-gesture suppression (`touch-action: none`, viewport meta); no reliance on `screen.orientation.lock()`
- [ ] **MOB-05**: Audio gesture gate proven on real touch devices (`touchstart` is not an activation-triggering event — must be verified, not assumed); iOS ITP 7-day storage eviction documented as expectation (no backend fix — laptop stays the progress home)
- [ ] **MOB-06**: Touch layout validated with the kid on a real device and tuned from observed play (button size/placement adjustments driven by watching her hands)

### Closing Verification

- [ ] **VER-01**: Live Dokploy URL playthrough confirmed end-to-end (deferred since v3.0)
- [ ] **VER-02**: Kid-UAT live sign-off — platforming feel, world motion, touch feel, non-over-stimulation (deferred since v4.0)
- [ ] **VER-03**: MOVE-05 throttled/non-60Hz empirical feel check closed (deferred since v3.0)
- [ ] **VER-04**: Full consolidated automated gate suite — all existing gates plus every new v6.0 gate (pink-scan, touch-mapping, mover validation, alcove coverage, manifest existence) — green in one run

## Future Requirements

None deferred at definition time — the three research-surfaced differentiators (alcove ambient change, secret-found select markers, touch-layout tuning) were pulled into v6.0 scope as MECH-05, MECH-06, and MOB-06 by explicit user choice (2026-07-09).

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| New play mechanics (stomping, question blocks, power-ups) | SEED-001 locked decision: motion is cosmetic/traversal only this milestone |
| Virtual joystick / swipe controls | Game is digital 3-input; discrete buttons match `isKeyDown` movement and a 12-year-old's hands |
| Timed/crumbling platforms | A countdown in disguise — violates the no-timer/no-pressure constitution |
| Chasing or randomly-moving enemies | Unpredictable pursuit = ADHD-unsafe startle/pressure; patrols are fixed-path and telegraphed |
| Secret counters / "0/1 secrets" HUD | FOMO/failure framing; markers are positive-only after discovery |
| A replacement 4th math mechanic for collect | Rebalance with the proven three; new mechanics need their own design cycle |
| Backend/accounts/cloud save (incl. "fixing" iOS ITP eviction) | Static hosting constitution — nothing leaves her browser |
| Kaplay upgrade | 3001.0.19 pinned and final in its line; re-testing cost with zero benefit |
| 8 distinct SNES-quality themes (one per level) | Unsourceable; 3–4 real biomes covering 2–3 levels each is the SEED-001 correction |
| Keyboard rebind onto the `buttons` API | Open upstream bug #421 drops key state on partial release; kid-validated keyboard stays byte-identical |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MECH-01 | Phase 29 | Complete |
| MECH-02 | Phase 29 | Complete |
| MECH-03 | Phase 29 | Complete |
| MECH-04 | Phase 30 | Complete |
| MECH-05 | Phase 36 | Pending |
| MECH-06 | Phase 29 | Complete |
| ART-01 | Phase 31 | Complete |
| ART-02 | Phase 32 | Complete |
| ART-03 | Phase 32 | Complete |
| ART-04 | Phase 33 | Pending |
| ART-05 | Phase 33 | Pending |
| ART-06 | Phase 35 | Pending |
| ART-07 | Phase 35 | Pending |
| MOT-01 | Phase 36 | Pending |
| MOT-02 | Phase 36 | Pending |
| MOT-03 | Phase 36 | Pending |
| MOT-04 | Phase 30 | Complete |
| LVL-01 | Phase 34 | Done |
| LVL-02 | Phase 34 | Done |
| LVL-03 | Phase 34 | Done |
| KEY-01 | Phase 34.5 | Complete |
| KEY-02 | Phase 34.5 | Complete |
| LEN-01 | Phase 34.6 | Pending |
| LEN-02 | Phase 34.6 | Pending |
| BRAND-01 | Phase 38 | Pending |
| MOB-01 | Phase 37 | Pending |
| MOB-02 | Phase 37 | Pending |
| MOB-03 | Phase 37 | Pending |
| MOB-04 | Phase 37 | Pending |
| MOB-05 | Phase 37 | Pending |
| MOB-06 | Phase 38 | Pending |
| VER-01 | Phase 38 | Pending |
| VER-02 | Phase 38 | Pending |
| VER-03 | Phase 38 | Pending |
| VER-04 | Phase 38 | Pending |

**Coverage:**

- v6.0 requirements: 31 total
- Mapped to phases: 31 ✓
- Unmapped: 0

---
*Requirements defined: 2026-07-09*
*Last updated: 2026-07-09 — traceability renumbered to Phases 29–38 (roadmap revision: resized 8 → 10 phases for a Sonnet-5 executor)*
