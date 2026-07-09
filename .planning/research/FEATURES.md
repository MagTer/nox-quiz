# Feature Research

**Domain:** Kid-friendly browser 2D platformer (educational math gates, ADHD-safe) — v6.0 "SNES-Fidelity World" NEW features only
**Researched:** 2026-07-09
**Confidence:** MEDIUM overall (web findings cross-checked across 2+ sources each; world-motion engine facts and the touch-coordinate trap are HIGH — measured/verified against the pinned vendored engine)

> **Scope note:** This is milestone-scoped research. It covers ONLY the v6.0 target features
> (mobile touch controls + responsive canvas, moving platforms + patrol enemies, secret-alcove
> discovery feedback, math-pacing rebalance after collect-the-answer removal). Shipped features
> (platforming core, level select, challenge panel, persistence, audio, tint themes) are NOT
> re-researched. Binding milestone decisions (collect removal, cosmetic-only world motion, no new
> play mechanics, alcove keeps its secrecy) are treated as fixed inputs, not open questions.

## Feature Landscape

### Table Stakes (Users Expect These)

#### Area 1 — Mobile touch controls + responsive canvas

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Fixed on-screen buttons: left/right bottom-left, jump bottom-right | The canonical mobile-platformer layout; matches natural thumb zones in landscape. Discrete buttons (not a joystick) match this game's digital `isKeyDown` movement exactly | MEDIUM | Touch layer sets the SAME intent flags the keyboard handlers set (additive input state consumed by `src/player.js`), never a parallel movement path. Keyboard stays primary |
| Oversized hit areas, bigger than the drawn button | #1 mitigation for lost tactile feedback (MDN, Suzy Cube postmortem). Kids with developing motor skills need larger-than-adult targets | LOW | Guidelines: WCAG 2.2 AA min 24px, Apple 44pt, Material 48dp — for a 12-year-old's game controls target **≥64–80 effective CSS px visible, invisible hit zone larger still**. Measure EFFECTIVE on-screen px after canvas scale, not internal 640×360 px |
| Hold semantics on jump (keydown/keyup emulation) | The variable-height jump (`src/player.js`) reads press duration; a tap-only button would silently flatten every jump and break the calibrated jump envelope | MEDIUM | Touch button must map touchstart→"key down", touchend→"key up". This is one of the two most breakable touch details for this codebase (the other is the coordinate trap below) |
| Multi-touch (move + jump simultaneously) | Platforming is unplayable without running jumps; naive single-touch handlers drop the movement finger when jump is pressed | MEDIUM | Track touches per `identifier` (or use pointer events per `pointerId`). Test the run-off-a-ledge-and-jump case explicitly |
| Tappable answer boxes in the challenge panel — **with touch-coordinate scale compensation** | Answer selection is the OTHER half of the game; keyboard-only answers = math gates soft-lock mobile play | MEDIUM | **Verified trap (HIGH — vendored engine source):** Kaplay 3001's mouse path reads `offsetX/offsetY` (untransformed layout coords, transform-immune), but its touch path computes `clientX − canvas.getBoundingClientRect().x` with NO scale compensation — and `getBoundingClientRect()` returns the post-transform box. Under CSS `transform: scale`, canvas touch taps land scale× too far in world space: `box.onClick()` is correct with a mouse and **systematically wrong on touch**. Touch answers need a coordinate-compensation shim (divide by current scale before Kaplay consumes the touch) OR DOM-overlay answer buttons. Plus ≥44px effective size + spacing between the 4 boxes (WCAG 2.5.8) |
| Touch equivalents for mute + reset | Phone has no M/R key; mute icon is already clickable (Phase 27) — reset confirm (Y/N) needs tap targets too | LOW | Title-screen Reset flow (`R` → Y/N) needs on-screen confirm buttons on touch. Mute icon's `onClick` is subject to the same touch-coordinate trap above |
| Touch-proven audio unlock | The gesture-gated music start must genuinely fire from a first TAP, not just a first click/keypress | LOW–MEDIUM | `touchstart` is NOT an activation-triggering input event per the HTML spec (only keydown/mousedown/pointerdown-mouse/pointerup-touch/touchend are) — and Kaplay fires its synthetic click path on `touchstart`. Transient activation from the same tap's pointerup usually still covers `AudioContext.resume()`, but this must be proven on a real device as part of mobile verification, never assumed from desktop |
| Responsive letterbox canvas scaling | Table stakes for any mobile web game: preserve 640×360 aspect, scale to viewport, letterbox the rest | MEDIUM | Compute scale from viewport instead of hardcoded 1.5×, still applied via CSS `transform: scale()` + `image-rendering: pixelated`. Never via width/height (documented mouse-mapping desync). Integer-ish snapping keeps pixels crisp. A dynamic scale factor makes the touch-coordinate shim above mandatory, not optional |
| Browser-gesture suppression | Pull-to-refresh, double-tap zoom, long-press selection, and pinch all fire during frantic play and eject the player from the game | LOW | `touch-action: none` on the play surface, viewport meta, `user-select: none`, `preventDefault` in touch handlers. Cheap, mandatory, easy to forget |
| Portrait → "rotate your device" overlay | 640×360 in portrait is a sliver; every mobile landscape game handles this | LOW | CSS `orientation: portrait` media query overlay. This is the ONLY reliable cross-browser answer — see anti-features for why `screen.orientation.lock()` is not it |
| Touch controls appear only on touch devices | Desktop players should never see thumb buttons over the game | LOW | Gate on `matchMedia('(pointer: coarse)')` and/or first `touchstart`; keyboard remains fully functional on mobile too (tablets with keyboards) |
| Mobile save-persistence expectation set | iOS/Safari ITP deletes ALL script-writable storage (localStorage included) after 7 days of Safari use without visiting the site — a first-party game save silently vanishes on an iPhone/iPad she hasn't opened in a week | LOW | No in-scope technical fix (no backend, by constraint). Handle by expectation-setting: the laptop stays the progress home; mobile progress is bonus/fragile, exactly like "clearing browser data resets it." Each visit resets the 7-day counter; add-to-home-screen gets its own counter. Document in DEPLOY/kid-UAT notes |

#### Area 2 — Moving platforms + patrol enemies (cosmetic world motion)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Ping-pong platform motion at constant gentle speed, path fully visible | Telegraphing = the fairness rule for moving obstacles; motion is already in progress when the player arrives, so behavior is readable before the jump commitment | LOW–MEDIUM | Spike-proven idiom: dt-based sine in `onUpdate`, `body({isStatic:true})` + `area()`, mutate `pos`. Engine carries riders natively (`stickToPlatform`) — hand-carry is a measured anti-pattern (rider slides off in <1s) |
| Endpoint easing (sine) instead of explicit end-waits | Sinusoidal motion decelerates naturally at both extremes — the "waits at the ends so you can board" affordance — WITHOUT any timer/scheduler, so it's check-safety compliant for free | LOW | This is the ADHD-safe substitute for the genre's "pause N seconds at endpoints" pattern, which would need timer-like logic |
| No-strand guarantee under every mover | Missing a moving platform must never soft-lock or feel like punishment; fall consequence stays the existing spike-class respawn-at-checkpoint (XP intact, no lives) | MEDIUM | Validator must learn movers: reachability checked at the WORST-CASE extreme (spike finding). First mover per level introduced over safe ground, not over a pit |
| Linear waypoint patrol enemies with walk-cycle animation | The canonical Mario/Goomba pattern; the walk cycle + constant speed IS the telegraph ("avoid me"). Simple behavior avoids cognitive overload alongside jump precision — directly relevant to the ADHD context | LOW–MEDIUM | Built-in `patrol({waypoints, speed, endBehavior:"ping-pong"})` — dt-based, no timers (spike-verified). Contact = existing spike-class checkpoint respawn, nothing new |
| Instant visual distinction: patrol hazard vs math-blocker enemy | Two enemy classes now exist (avoid vs answer-to-defeat); a kid must read which is which in one glance or contact feels unfair | LOW | Different silhouettes/palettes from the Gothicvania enemy sets; math-blockers stay stationary, patrollers move — motion itself disambiguates, art should reinforce it |
| Debug-overlay markers for patrol paths + platform extents | Project convention: every invisible behavior is inspectable via `?debug=1` | LOW | Draw waypoint lines / travel extents in the existing overlay; keeps the interactive audit honest |

#### Area 3 — Secret alcove discovery feedback

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| On-touch reveal burst: particles + distinct chime + brief "+5 XP" popup at the alcove | Industry-wide pattern (DKC bonus jingle, Celeste strawberry pop, Mario block bump): the discovery must be FELT at the instant it happens. This is exactly what the parent's "nothing happens — no alcove?" feedback identified as missing | LOW | Wire through existing seams: `src/fx.js` burst/pop + the Phase 27 SFX manager (one new CC0 chime, same sourcing/sign-off process). Feedback fires AFTER entry — secrecy before discovery is preserved (binding decision) |
| One-shot trigger per level visit | Re-triggering the fanfare on every re-entry cheapens it and reads as a bug | LOW | Closure-local "found" flag per run (anti-leak convention); XP already awards once |
| Automated reachability + trigger coverage | Milestone requirement; secretAlcove is the known blind spot in both the validator and the interactive audit | MEDIUM | Add alcove to `validate-levels.mjs` mechanic-reachability + drive it in the interactive audit. The visible cue finally gives the audit something observable to assert |

#### Area 4 — Math-pacing rebalance after collect-the-answer removal

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Every level keeps a felt math presence: ≥2 mid-level encounters + the end gate | Math is the product's reason to exist; a level with only an end gate regresses to the v3.0 "thin content" problem | MEDIUM | 5 of 8 levels lose an encounter. Replace only where the level's rhythm has a real gap — doors and checkpoint gates are drop-in (both use the shared challenge panel), defeat-enemy where a blocker fits |
| Spacing rule: platforming stretches between encounters, never back-to-back challenges | Intrinsic-integration research: the game part is what makes the math part work; clustered interruptions read as a quiz with a skin — the exact v1/v2 failure mode | LOW | Treat spacing as a soft rule in the LEVEL-DESIGN.md review pass; density follows level rhythm, not a quota |
| Encounter variety preserved within a level | Where collect provided the level's variety, its removal shouldn't leave 3 identical doors in a row | LOW | 3 mechanics remain (door, checkpoint gate, defeat-enemy); mix per level |
| XP-economy re-check | Collect encounters awarded XP; removing 5 of them changes XP-per-run and therefore leveling pace | LOW–MEDIUM | Audit XP per level before/after; retune replacement-encounter XP or thresholds in `src/config.js` if leveling noticeably slows. No brain changes — `src/math/brain.js` stays locked |
| Gate-suite updates in the same change | `check-gate.sh` invariants, the 36/36 mechanics-audit expectation, and validator mechanic-reachability all encode collect's existence; stale expectations = red gates or, worse, vacuous green | MEDIUM | Remove `src/mechanics/collect.js` + its wiring + its audit/validator entries atomically |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Audio cue on every touch-button press | Research-backed substitute for tactile feedback ("audible cue significantly improves the experience"); the SFX layer already exists, so this is nearly free polish most browser games skip | LOW | Soft click through the Phase 27 SFX manager; respects mute |
| Visible pressed-state on touch buttons | Second half of the feedback substitute; makes controls feel responsive rather than mushy | LOW | Sprite/opacity swap on touchstart/touchend |
| Post-discovery ambient change in the alcove (e.g. a torch lights) | Ties the alcove cue into MOT-03 ambient animation; the world "remembers" her discovery — rewarding without pre-signposting | LOW–MEDIUM | Only after the biome art lands; pure visual, validator-neutral |
| Secret-found marker on level select (per cleared level) | Gentle collection meta: "I found 5 of my 8 secrets" invites replay of favorite levels — HER choice, no pressure | MEDIUM | Touches the save format (version bump + guarded `progress.js` seams). Defer-able; see anti-features for the pressure-framing trap |
| Motion introduced low-stakes-first per level | First mover over safe ground, first patroller in a wide corridor — the genre's kindest teaching pattern, and cheap since levels are re-dressed anyway | LOW | A placement rule for the re-dress pass, not code |
| Rebalance toward mechanics that landed, not 1:1 substitution | Collect was removed because it confused her; its slots are a chance to double down on what she reads well (doors/gates), guided by the kid-UAT this milestone finally closes | LOW | Design stance for the rebalance pass |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Analog virtual joystick | "Real" gamepad feel; common in mobile templates | Imprecise without tactile feedback; this game's movement is digital left/right — a joystick adds dead-zone tuning and drift for zero gameplay gain | Two discrete left/right buttons (or move-zone) + jump button |
| Swipe/gesture movement or swipe-to-jump | Feels modern, keeps screen clean | Hidden affordance (nothing to see = nothing to learn), laggy for precision platforming; discovery friction is exactly wrong for the ADHD context | Visible, labeled, oversized buttons |
| Relying on `screen.orientation.lock()` | "Just lock it to landscape" | **Not supported on iOS Safari at all** (16.4 added only type/angle/onchange); elsewhere it requires fullscreen. A lock-based design silently fails on the most likely phone | CSS portrait-overlay ("rotate your device") as the guaranteed path; optionally attempt `lock()` inside a user-gesture fullscreen where supported |
| Backend sync to survive iOS storage eviction | "Fix" the ITP 7-day localStorage wipe properly | Violates the hard static-hosting/no-backend/no-accounts constraint; adds privacy surface for a marginal gain | Expectation-setting (laptop = progress home; mobile = bonus); note that regular visits and add-to-home-screen each mitigate |
| Tilt/vibration feedback | "Mobile-native" polish | Vibration API absent on iOS Safari; tilt is unusable for platforming; both add permission/compat surface | Audio + visual pressed-state cues |
| Separate mobile UI fork / mobile-first relayout | "Do mobile properly" | Doubles every future change; keyboard/desktop is explicitly primary this milestone | One canvas, one UI, additive touch layer + responsive scale |
| Timed / crumbling / disappearing platforms | Genre-standard difficulty spice alongside movers | It's a countdown in disguise — violates the no-timer/no-pressure mandate outright (`check-safety.sh` would rightly block the idiom) | Ping-pong movers with sine easing; difficulty via placement, not time pressure |
| Chasing / accelerating / randomized enemies | "More alive" world | Startle + unpredictability = unfair by the telegraphing rule, and stress for this player; randomness breaks the validator's reachability reasoning | Fixed-waypoint constant-speed patrols; "alive" comes from walk cycles + ambient animation (MOT-03) |
| Stomp-to-kill / combat on patrol enemies | Mario muscle memory says jump on heads | Locked scope decision: NO new play mechanics this milestone; also blurs the avoid-vs-answer enemy distinction | Patrollers are pure hazards (checkpoint respawn); defeat-enemy stays the math mechanic |
| Pre-signposting secrets (sparkles/arrows at hidden spots) | Directly "fixes" discoverability | Destroys the secret — it becomes a pickup; contradicts the binding keep-the-secret decision | Feedback ON discovery (burst + chime + XP popup), never before |
| "Secrets: 0/1" counter in the HUD or per level | Standard completionist UX | Turns an optional bonus into visible incompleteness — FOMO/failure framing for an ADHD player; missing a secret must stay consequence-free and invisible | At most a positive-only found-marker on level select (shows what she HAS found, never what's missing) |
| 1:1 replacement of every removed collect encounter | "Keep the math amount identical" | Intrinsic-integration research says value comes from meaningful diegetic gates, not interruption frequency; quota-filling over-gates the fun part | Rebalance by level rhythm; accept slightly fewer, better encounters where geometry doesn't want another gate |
| A new 4th math mechanic to fill collect's slot | Symmetry ("we had four") | Violates the locked no-new-play-mechanics decision; new mechanic = new confusion risk, the very thing being removed | Redistribute across the 3 proven mechanics |

## Feature Dependencies

```
Mechanic cleanup (collect removal + alcove cue)
    └──must precede──> Level re-dress / biome art pass   (binding order: don't dress content about to change)

Responsive canvas scaling (transform-based)
    └──required by──> Touch button layout                (button positions derive from the scaled viewport)
    └──makes mandatory──> Touch-coordinate scale shim    (Kaplay's touch path is NOT transform-aware — verified)

Touch answer selection / mute tap / any canvas onClick on touch
    └──requires──> Touch-coordinate scale shim (or DOM-overlay buttons)

Touch input layer
    └──requires──> per-scene registration discipline     (Kaplay go() clears the input bus — Phase 27 mute-key pattern)
    └──requires──> hold-semantics bridge                 (variable-height jump reads press duration)

Audio gesture gate on mobile
    └──requires──> real-device touch activation proof    (touchstart is not activation-triggering; Kaplay clicks fire on touchstart)

Moving platforms ──requires──> validator extension       (reachability at worst-case extreme)
Patrol enemies  ──requires──> check-safety compliance    (patrol() is dt-based — verified, but expect review)
World motion    ──enhanced by──> biome art               (walk cycles / platform sprites come from the sourced packs)

Alcove discovery cue
    └──requires──> fx.js + Phase 27 SFX seam (one new CC0 chime)
    └──enables──> automated alcove trigger coverage      (a visible/audible effect gives the audit something to assert)

Math-pacing rebalance ──requires──> gate-suite updates   (check-gate.sh, 36/36 audit count, validator entries — atomic)

Secret-found select marker (differentiator) ──requires──> save version bump via guarded progress.js seams

Touch controls ──conflicts──> screen.orientation.lock reliance (iOS Safari)
Mobile persistence ──constrained by──> Safari ITP 7-day script-writable-storage wipe (no in-scope fix; expectation-setting)
Movers/patrols ──conflict──> timers/schedulers of any kind (check-safety mandate)
```

### Dependency Notes

- **Cleanup before re-dress:** already binding in PROJECT.md — collect removal and the alcove cue land first so no soon-to-change content gets biome-dressed.
- **The touch-coordinate trap is the load-bearing mobile fact:** the desktop rule ("transform scaling keeps `onClick` working") is a MOUSE-path guarantee only. The vendored engine's touch path subtracts the post-transform `getBoundingClientRect()` origin but never divides by scale, so every canvas touch tap is off by the scale factor. Any plan that says "answers are already clickable, touch is free" is wrong — budget the shim (or DOM overlay) explicitly.
- **World motion is engine-cheap, verification-priced:** `patrol()` and `stickToPlatform` make the runtime nearly free (spike-proven); the real cost is the validator learning movers and the interactive audit covering new hazards.
- **Touch and world motion are independent:** they share no code and can be planned as parallel tracks; both converge only at the closing kid-UAT/live-deploy verification.
- **Mobile audio + saves have platform ceilings, not bugs:** the touch audio unlock needs one real-device proof (activation semantics), and iOS save eviction has no static-hosting fix — both are verification/documentation items, not engineering projects.

## MVP Definition

### Launch With (v6.0 must-haves)

- [ ] Collect-the-answer removed + pacing rebalanced + gate suite updated — unblocks the re-dress; binding order
- [ ] Alcove on-touch burst/chime/XP-popup + automated reachability/trigger coverage — closes the parent-reported "nothing happens" gap and the known audit blind spot
- [ ] Ping-pong moving platforms (native carry, sine easing) + validator support — headline world-motion feature, spike-de-risked
- [ ] Linear patrol enemies (built-in `patrol()`, ping-pong, walk cycle, checkpoint-respawn contact) — second world-motion pillar
- [ ] Responsive letterbox canvas (transform-based) + portrait rotate-overlay + gesture suppression — mobile foundation everything touch sits on
- [ ] Touch-coordinate scale shim (or DOM-overlay interactive elements) — without it every canvas tap (answers, mute) is scale× off; verified engine fact
- [ ] Touch buttons (left/right/jump with hold semantics + multi-touch) + tappable answers + touch mute/reset — the complete mobile play loop
- [ ] Touch-button press feedback (visual + audio cue) — cheap, research-backed; without it controls feel broken, so it's effectively table stakes
- [ ] Real-device proof that the audio gesture gate opens from a first tap — activation semantics differ from desktop; fold into the closing verification pass

### Add After Validation (v6.x, post kid-UAT)

- [ ] Post-discovery ambient change in alcoves (torch lights) — after biome art lands; only if the burst cue tests well
- [ ] Secret-found markers on level select — only if she engages with secrets after the cue ships; needs save version bump
- [ ] Touch-layout nudges (button size/position) — tune from watching HER hands in the live kid-UAT, not from guidelines alone

### Future Consideration (v7+)

- [ ] Fullscreen + best-effort orientation lock on supporting browsers — polish, never a dependency
- [ ] Configurable touch-button scale/side-swap — accessibility depth, wait for demand
- [ ] New play mechanics interacting with movers/patrols (stomping, ride-puzzles) — explicitly out of scope this milestone

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Collect removal + pacing rebalance | HIGH (removes confusion) | MEDIUM | P1 |
| Alcove discovery cue + coverage | HIGH (fixes "nothing happens") | LOW | P1 |
| Moving platforms (validator-aware) | HIGH (world feels alive) | MEDIUM | P1 |
| Patrol enemies | HIGH | LOW–MEDIUM | P1 |
| Responsive canvas + portrait overlay + gesture suppression | HIGH (mobile gateway) | MEDIUM | P1 |
| Touch-coordinate scale shim | HIGH (blocks all canvas taps) | LOW–MEDIUM | P1 |
| Touch buttons + tappable answers + touch mute/reset | HIGH | MEDIUM–HIGH | P1 |
| Touch press feedback (visual + audio) | MEDIUM–HIGH | LOW | P1 |
| Real-device audio-unlock + ITP expectation docs | MEDIUM (silent-failure risks) | LOW | P1 |
| Ambient alcove change post-discovery | MEDIUM | LOW–MEDIUM | P2 |
| Secret-found select markers | MEDIUM | MEDIUM (save bump) | P2 |
| Fullscreen + best-effort lock() | LOW | MEDIUM | P3 |
| Configurable touch layout | LOW | MEDIUM | P3 |

## Competitor Feature Analysis

| Feature | Genre convention (Mario/DKC/Celeste-class) | Typical mobile web game | Our Approach |
|---------|--------------------------------------------|--------------------------|--------------|
| Moving platforms | Constant visible ping-pong/loop; often adds timed variants | Same, often with crumble/timer variants | Ping-pong + sine easing ONLY — timed variants are banned (no-timer mandate) |
| Patrol enemies | Stompable, sometimes chasing | Same | Pure cosmetic hazards, fixed waypoints, checkpoint respawn — avoid vs answer stays visually unambiguous |
| Secret feedback | Loud reveal at discovery (jingle, pop, counter) | Often adds per-level secret counters | Reveal-on-touch burst/chime/XP popup; NO counters, NO pre-signposting — positive-only |
| Touch controls | N/A (console) | Virtual joystick templates, single-touch bugs common | Discrete buttons matching digital movement, hold-jump semantics, multi-touch tested, keyboard primary |
| Orientation | N/A | Many silently assume lock() works | Portrait overlay as the guaranteed path (iOS Safari has no lock()) |
| Math pacing | Her school game: math at stage end | Ed-games often quiz-interrupt every few seconds | Diegetic gates spaced by real platforming stretches (intrinsic-integration research) |

## Sources

- Cross-checked web findings (MEDIUM per classify-confidence seam, provider `websearch --verified`):
  - Touch controls: [MDN Mobile touch controls](https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Mobile_touch), [Suzy Cube: Mobile Controls That Feel Great (Game Developer)](https://www.gamedeveloper.com/design/lessons-from-suzy-cube-mobile-controls-that-feel-great), [Mobile touch controls from scratch in HTML5 (aaronbell.com)](https://www.aaronbell.com/mobile-touch-controls-from-scratch/)
  - Touch target sizes: [WCAG 2.5.8 guide (AllAccessible)](https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide), [Apple HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [NN/g Touch Targets](https://www.nngroup.com/articles/touch-target-size/), [LogRocket: accessible touch target sizes](https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/)
  - Orientation lock: [MDN ScreenOrientation.lock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock), [mdn/browser-compat-data #19355 (Safari lock unsupported)](https://github.com/mdn/browser-compat-data/issues/19355)
  - Canvas scaling: [William Malone: HTML5 Game Scaling](https://www.williammalone.com/articles/html5-game-scaling/), [web.dev: Auto-Resizing HTML5 Games](https://web.dev/gopherwoord-studios-resizing-html5-games/)
  - Movers/enemies/telegraphing: [Game Design Skills: Platformer](https://gamedesignskills.com/game-design/platformer/), [Game Developer: Enemy Attacks and Telegraphing](https://www.gamedeveloper.com/design/enemy-attacks-and-telegraphing), [Game Design Skills: Enemy Design](https://gamedesignskills.com/game-design/enemy-design/), [Dev.Mag: How to design levels for a platformer](http://devmag.org.za/2011/07/04/how-to-design-levels-for-a-platformer/)
  - Secret feedback: [Game Developer: Monochroma platformer design elements](https://www.gamedeveloper.com/design/the-path-to-monochroma-platformer-design-elements), [RetroStyleGames: Platformer level design tips](https://retrostylegames.com/blog/platformer-level-design-tips/)
  - Math pacing: [Habgood & Ainsworth 2011, intrinsic integration (JLS)](https://www.tandfonline.com/doi/abs/10.1080/10508406.2010.508029), [ACM 2022: Intrinsic integration directs attention](https://dl.acm.org/doi/abs/10.1145/3549503)
  - Activation-triggering input events (touchstart excluded) and Safari ITP 7-day script-writable-storage cap: cached research-store digests (keys `119ad5d3…`, `c0b2019c…`), MEDIUM
- Local verified facts (HIGH — measured/verified against the pinned vendored engine):
  - Kaplay 3001.0.19 touch path lacks transform-scale compensation while the mouse path is transform-immune (cached digest `17410dd5…`, source: vendored `lib/kaplay.mjs` read)
  - `.planning/research/v6-scouting/SPIKE-FINDINGS.md` — `stickToPlatform` native carry, manual-carry anti-pattern, `patrol()` built-in dt-based, validator worst-case-extreme rule
  - `.planning/research/v6-scouting/ASSET-SCOUTING.md` — Gothicvania biome/enemy/hero coverage
- Project inputs (binding): `.planning/PROJECT.md` v6.0 section, SEED-001, SEED-002, `2026-07-07-reconsider-secret-alcove-...` todo (parent's verbatim "nothing happens" feedback)

---
*Feature research for: Nox Run v6.0 "SNES-Fidelity World" (kid/ADHD browser platformer)*
*Researched: 2026-07-09*
