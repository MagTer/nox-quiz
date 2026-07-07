# Pitfalls Research

**Domain:** No-build vendored-Kaplay 3001 browser platformer (v5.0 "Nox Run — Real Levels") — adding audio/SFX to a game that has none, scaling 4 hand-built levels to 8 longer ones with structural validation, expanding the dark-grunge palette, and rebranding Math Lab → Nox Run on an EXISTING, interactively-audited system
**Researched:** 2026-07-05
**Confidence:** HIGH overall — grounded in direct inspection of this repo (vendored `lib/kaplay.mjs` audio internals, `src/progress.js` save seam, `src/camera.js`/`src/scenes/game.js` bounds derivation, `scripts/audit-phase21-mechanics.mjs` + `scripts/lib/mechanic-drive.mjs` harness) plus cross-checked web sources (MEDIUM per classify-confidence for verified websearch findings)

> **Framing.** This is a SUBSEQUENT milestone on a working, kid-validated game. The dominant risk is not "can we build these features" — it's **regression and false confidence**: audio leaking across the strictly anti-leak scene system, new levels shipping outside the interactive-audit standard that v4.1 just fought to establish, a rebrand nuking the one save file that matters, and a structural validator that *looks* like proof but models physics the engine doesn't have. v4.0's core lesson applies to every line below: **checks that don't actually play the game lie.**

---

## Critical Pitfalls

### Pitfall 1: Title music silently blocked by autoplay policy (suspended AudioContext)

**What goes wrong:**
Music started when the title scene loads — before the first keypress/click — never plays. Chrome creates the `AudioContext` in the `suspended` state until the page receives a user gesture; Web Audio sounds started while suspended silently no-op or queue up and burst later. Worse: it *works in dev* because the developer has interacted with the page (or has autoplay exceptions from repeated visits), then fails silently on her machine on first load. Verified against the vendored lib: Kaplay 3001.0.19 only calls `ctx.resume()` in the streaming-play path, `onShow`, and the `debug.paused` setter — buffer-based `play()` relies entirely on the browser auto-resuming when `start()` is called *while playback is already allowed*.

**Why it happens:**
Autoplay blocking is invisible in the console (no error, just silence), and developer machines carry autoplay-permission history that a fresh browser doesn't.

**How to avoid:**
- Start music **inside the first input handler**, never on scene entry of the title screen. The title scene already has a press-to-start gesture — that keypress is the natural unlock point: `onKeyPress(() => { startMusic(); go("select"); })`.
- After unlock, scene-entry music starts are fine (the context is running for the rest of the session).
- Add a one-line state check to the boot gate: assert `audioCtx.state === "running"` after the scripted title keypress in `browser-boot.mjs`.
- Test the real flow once in a **fresh incognito window** (no autoplay history) — this is the only honest manual test for autoplay.

**Warning signs:**
Music works "sometimes"; works for the developer but not on a fresh profile; sounds burst in a pile the moment the user first clicks; `audioCtx.state === "suspended"` in the console.

**Phase to address:**
The audio phase — make gesture-gated unlock the first task, before any SFX wiring.

---

### Pitfall 2: Audio leaking across scenes — music stacking on death/restart and `go()`

**What goes wrong:**
Kaplay sound handles are **not scene objects** — `play()` returns a handle backed by the shared `AudioContext`/`masterNode`, and it keeps playing across `go()`. Two concrete failure modes:
1. **Music stacking:** the game scene starts music on entry; player dies → scene restarts → a second copy of the loop starts on top of the first. Three deaths in, the music is a phase-shifted mush at 4× volume. This is the single most common kaboom/kaplay audio bug.
2. **Scene leak:** level music keeps playing over the level-select or title screen after `go("select")`, violating this project's strict anti-leak rules (the same class of bug the closure-local-state rule exists to prevent).

**Why it happens:**
Everything *else* in Kaplay auto-destroys on `go()`, so authors assume sounds do too. They don't — audio lives beside the scene graph, not in it.

**How to avoid:**
- One **audio manager module** owning all handles, built as a factory per the project's a727c13 rule (no Kaplay globals at module top level; `createAudio()` invoked from `main.js` after `kaplay()`).
- `playMusic(trackId)` must be **idempotent**: if the requested track is already playing, do nothing; otherwise `stop()` the current handle first, then start the new one. This single contract kills both failure modes (restart replays and cross-scene leaks) at once.
- Every scene declares its music on entry (`audio.playMusic("ambient-1")` / `audio.playMusic(null)` for silence) — the manager reconciles. Never raw `play(music)` in scene code.
- SFX (short one-shots) don't need scene teardown, but any *looping* SFX (e.g., a hum near a door) must be closure-local to the scene and stopped in the same teardown path the existing anti-leak code uses.

**Warning signs:**
Music gets louder over a play session; audible echo/phasing after dying; level music heard on the title screen; more than one call site invokes Kaplay's `play()` with a music asset.

**Phase to address:**
The audio phase — the manager-with-idempotent-`playMusic` is the architecture decision; the interactive audit for this phase must include "die twice, listen" and "exit to select, listen."

---

### Pitfall 3: Audible loop seam in the ambient music (MP3 encoder gap)

**What goes wrong:**
The calm ambient loop has a click/silence hiccup every N seconds. MP3 encoding inserts leading/trailing silence (encoder delay) that makes MP3 fundamentally unable to loop gaplessly; HTML5 `<audio loop>` adds its own gap on top. For *calm ambient* music specifically, a periodic seam is maximally noticeable and maximally annoying — the exact opposite of the ADHD-safe intent.

**Why it happens:**
MP3 is the default format people reach for; the gap is inaudible in a one-shot listen and only shows up on loop.

**How to avoid:**
- Use **OGG Vorbis** for music (loops sample-accurately through Web Audio's buffer `loop = true`; Kaplay's buffer path handles this). Target platform is Chrome/Edge on a Windows laptop — OGG support is not a concern.
- Trim any leading/trailing silence in an editor before export; verify the loop by listening across at least 3 loop boundaries.
- Keep music files small (a 1–2 minute OGG at modest bitrate is a few MB) — the whole game currently loads in well under a second and should stay that way.

**Warning signs:**
A "tick," dropout, or obvious restart at a fixed period; music asset committed as `.mp3`.

**Phase to address:**
The audio phase — format choice is a day-one asset-pipeline decision, painful to redo after tracks are picked and mixed.

---

### Pitfall 4: Mute/volume forgotten or persisted by breaking the save schema

**What goes wrong:**
Two coupled failures:
1. **No mute at all** — for an ADHD-context kid, being unable to turn sound off is worse than having no sound. Audio ships without a visible, one-key mute and the feature backfires.
2. **Mute persisted wrong** — the mute flag gets bolted into the versioned save blob carelessly. `CONFIG.SAVE.KEY` (`mathlab_platformer_v2`, version 2) is deserialized by defensive code in `src/progress.js`, and the same `SAVE_BLOB` shape is **hardcoded in three audit scripts** (`browser-boot.mjs`, `screenshot-phase20.mjs`, `audit-phase21-mechanics.mjs`). A schema change that isn't backward-compatible either resets her progress or silently desyncs the audit harness from the real save shape.

**How to avoid:**
- Ship mute (at minimum) with the audio phase itself, not "later." Persist it.
- Persist audio settings in a **separate localStorage key** (e.g., `..._audio_v1`) rather than touching the progress save schema. Audio prefs are not progress; keeping them out of the versioned blob means zero migration risk, zero audit-script churn, and the math-brain/save seam stays untouched (the save seam and brain are load-bearing, audited code).
- If it *must* go in the save blob: additive optional field only, tolerated-missing on load, and update all three scripts' `SAVE_BLOB` in the same commit.

**Warning signs:**
A diff touching `progress.js` serialization for an audio feature; `SAVE_BLOB` in scripts no longer matching what the game writes; no way to silence the game from the keyboard.

**Phase to address:**
The audio phase (mute + persistence in-scope from the start); the settings-key decision belongs in that phase's plan.

---

### Pitfall 5: Audio drifting out of ADHD-safe — startle stingers and punishing failure sounds

**What goes wrong:**
The audio layer quietly reintroduces the pressure the project has spent five milestones excluding: a loud level-clear fanfare that startles, a harsh buzzer on wrong answers (auditory punishment → shame spiral risk, same category as the banned countdown timer), spike-death sounds that sting, or SFX mixed hot over the calm ambient bed so every coin pickup spikes the volume.

**Why it happens:**
Game-feel defaults from ordinary platformers (juicy = loud + sharp) get copied without passing them through this project's ADHD-safe filter. Audio has no equivalent of the existing "≤500ms non-strobing" visual rule yet, so there's no gate to fail.

**How to avoid:**
- Write the audio equivalent of the visual safety rule into the phase plan **before** picking sounds: no sudden loud transients; wrong-answer sound is neutral/soft (a low "nope" thud, not a buzzer) — or reuse silence + the existing gentle visual feedback; death/respawn sound is soft; celebration sounds are warm, not shrill.
- Mix discipline: master volume modest by default; SFX peak level within a few dB of the music bed; verify by playing a full level with eyes closed.
- Correct-answer/level-clear sounds *should* be clearly rewarding — positive audio reinforcement is the point; the constraint is on harshness and startle, not on reward.
- Human (ideally kid) sign-off on the sound set, same as the v4.1 art sign-off — sounds are an aesthetic deliverable and get the same mandatory human checkpoint.

**Warning signs:**
Any sound that makes *you* flinch on first play; a distinct "failure" sound that feels bad to hear three times in a row; SFX clearly louder than music.

**Phase to address:**
The audio phase — as acceptance criteria, not post-hoc review.

---

### Pitfall 6: New levels shipping below the v4.1 interactive-audit bar (the harness can't reach what it can't drive)

**What goes wrong:**
This is the project's own scar tissue: v4.0 shipped a total soft-lock because automated checks only verified scenes *loaded*. v4.1 fixed it with real Playwright-driven playthroughs — but the traversal model in `scripts/lib/mechanic-drive.mjs` already can't reach **6 of 16 mechanic encounters** (spike-hazard timing resonance). Doubling to 8 levels — each *longer*, with *more* encounters — under the same harness mechanically grows the blind-spot count. The failure mode: 8 levels "pass" the audit, but a growing fraction of encounters were never actually driven, and the next collect.js-class soft-lock ships in exactly that shadow.

**Why it happens:**
The harness limitation is documented as "not a game bug," which makes it easy to treat as acceptable forever. It was acceptable at 6/16 on shipped, hand-playtested levels; it is not acceptable as the *default coverage level for brand-new content*.

**How to avoid:**
- **Upgrade the harness before (or alongside) authoring new levels**, not after. Options in rising order of effort: (a) make the drive model spike-aware (pause-wait-cross at hazards instead of constant-motion, which is where the resonance comes from); (b) author new levels to be *audit-drivable by construction* (spike placement that doesn't resonate with the drive cadence — but this couples level design to test-tool quirks, worse); (c) hybrid — drive normally, and for encounters the driver can't reach, teleport *near* the encounter and still exercise the real trigger/resolve input path (keeps the "real input surface" property that matters).
- Set an explicit coverage bar in the roadmap: **every mechanic encounter in every one of the 8 levels is interactively driven**, or has a documented, individually-reviewed exception. "6/16 unreachable" must not silently become "14/40 unreachable."
- Every new/lengthened level gets a scripted **start→goal completion run** (not just encounter pokes) — completion is the check that would have caught the v4.0 soft-lock.

**Warning signs:**
Audit output whose "blocked/unreachable" count grows with the level count; a new level merged with encounter results marked skipped; the phrase "known tooling limitation" appearing in a new level's verification notes.

**Phase to address:**
A dedicated **harness/validation phase ordered before level authoring** — this is the highest-leverage ordering decision in the milestone.

---

### Pitfall 7: Structural validator false confidence — geometry checks that don't match real jump physics

**What goes wrong:**
The milestone promises "validate every level is fully traversable start→goal with all mechanics reachable." The trap is building a static validator over the level descriptors (floors/platforms/gaps as data) with an *assumed* jump envelope — and then trusting it. If the validator says a 200px gap is crossable but the real engine (RUN_SPEED 240, JUMP_FORCE 520, GRAVITY 1400, JUMP_CUT 0.45, MAX_FALL_SPEED 900) tops out lower, the validator green-stamps unwinnable geometry. Derived from those constants: max jump height ≈ 96px (`v²/2g`) and theoretical max flat-gap flight distance ≈ 178px (`2v/g × runSpeed`) — but the *real* clearable gap is smaller (takeoff/landing edge geometry, input timing), and only the engine knows by how much. A validator is a *model*; the v4.0 lesson is that models that never touch the running game lie.

**Why it happens:**
Static checks are fast, deterministic, and easy to run in CI, so they become the gate; the slow interactive check quietly becomes optional.

**How to avoid:**
- Derive the validator's jump envelope **from `CONFIG` constants, never hardcoded numbers**, so a future physics tune can't silently invalidate it.
- **Calibrate the envelope empirically once**: measure actual max jump height/distance in the real engine (a tiny Playwright script on a test strip), and have the validator use the *measured* envelope minus a safety margin — not the theoretical one.
- Keep the division of labor explicit: the static validator is a **fast author-time linter** (catches doors-over-holes, gap-too-wide, spike-without-preceding-checkpoint, mechanic floating over void); the **interactive start→goal run is the gate**. Static pass + interactive pass = done; static pass alone = not done.
- Make the validator a real gate with a non-zero exit code on failure. Note the existing precedent trap: `audit-phase21-mechanics.mjs` deliberately always exits 0 (diagnostic). Copying that skeleton for the validator produces a "gate" that can never fail a commit.
- Validate the known live bug classes *by name*: door x-range must overlap a floor run (doors-over-holes), every mechanic trigger zone must intersect the reachable set (unreachable areas), every spike must have a checkpoint before it (ADHD-safe respawn rule already used in level-01).

**Warning signs:**
Validator code containing literal pixel thresholds; a validator that passes all 8 levels on its first-ever run (suspicious — it should catch the two *known* live bugs); interactive runs demoted to "manual, when convenient."

**Phase to address:**
The harness/validation phase (build + calibrate), then enforced in every level-authoring phase.

---

### Pitfall 8: Copy-paste level drift and the fixture trap when lengthening the existing 4 levels

**What goes wrong:**
New/lengthened levels get authored by duplicating existing descriptor chunks, and the hand-tuned quirks come along wrongly: level-01's coins are deliberately off-grid (32px sprites, top-left anchor, visually centered by +16px offset — documented in the descriptor); FLOOR_Y-relative expressions assume floor-level placement; spike/checkpoint pairings get separated in the paste. Meanwhile the Wave-0 regression smoke **deep-equals level-01's geometry byte-for-byte against the v3.0 values** — lengthening level-01 *will* fail that check, and the failure invites the wrong fix (deleting the check) instead of the right one (consciously re-baselining the fixture as part of a reviewed geometry change).

**Why it happens:**
Descriptor data looks self-explanatory, so authors copy shapes without the comments' constraints; regression fixtures written to freeze v3.0 geometry were never meant to survive a deliberate lengthening.

**How to avoid:**
- Before authoring, extract shared authoring rules into the validator (Pitfall 7) so the linter, not tribal comments, enforces them: coin-anchor convention, spike→checkpoint pairing, gap-width ceiling, mechanic-on-floor rule.
- Treat fixture updates as first-class review items: "level-01 geometry changed → smoke fixture re-baselined → interactive start→goal re-run" as one atomic unit. Never weaken the deep-equal into a shape check.
- Lengthen by **appending/segmenting**, not by editing tuned early sections that the kid has already validated as feeling good.

**Warning signs:**
A PR that both edits a level and deletes/loosens its regression fixture; coins visually off-center in a new level; a spike with no checkpoint within comfortable distance before it.

**Phase to address:**
Level-authoring phases, with the validator from the harness phase as the enforcement mechanism.

---

### Pitfall 9: Difficulty and pacing breaking across 8 longer levels (spikes, fatigue, and the table ramp)

**What goes wrong:**
Three coupled pacing failures:
1. **Platforming difficulty spikes** — with 8 levels the ramp is easy to break; community consensus and this project's ADHD framing both say sudden jumps in challenge are the top frustration driver. Longer levels amplify it: a hard section deep in a long level costs more emotional capital.
2. **Checkpoint density not scaling with length** — the current rule ("a respawn never costs meaningful progress") was calibrated on ~3.5-screen levels. Doubling length without adding checkpoints silently violates it.
3. **Table ramp mishandled** — pools must be redistributed across 8 levels while (a) keeping level-01's deliberate hard pool [6,7,8,9] decision or consciously revisiting it, (b) implementing "drop tables 1 & 10" **via per-level pools only** — table 1 currently appears in level-02's pool `[1,2,3,4,5,6,7]`; table 10 is already impossible (the brain filters to integer tables 1..9). The trap is "fixing" this in `brain.js` — the math brain is LOCKED and any edit there violates the milestone's own constraint and risks the tuned 6–9 weighting.
4. **Question fatigue** — longer levels mean more encounters per level; too many math stops per level turns the game back into a quiz with walking between questions.

**How to avoid:**
- Plan the 8-level ramp as a table on paper first (per level: platforming difficulty tier, table pool, encounter count, checkpoint count) and review it as a design artifact before authoring.
- Encode checkpoint density in the validator: max distance (or max hazard count) between checkpoints.
- Encounter budget per level (e.g., 3–5) held roughly constant even as levels lengthen — length should come from *platforming*, the fun part, not from more math stops.
- Grep-verify at milestone end: no diff in `src/math/brain.js`; table 1 absent from every `allowedTables`.

**Warning signs:**
A new level with more math encounters than platforming ideas; any commit touching `src/math/`; playtest deaths clustering at one section of one level; a level that takes >2× the previous level's completion time.

**Phase to address:**
A design/planning task at the start of the level-content phase; validator enforces the mechanical parts.

---

### Pitfall 10: Rebrand renames the save key (or the URL) and wipes her progress

> **Consciously accepted 2026-07-07 (26-CONTEXT.md):** for the save-key half of this pitfall specifically, the user explicitly confirmed — after being asked to verify they understood the effect — that the save key MAY be freely renamed/changed as part of Phase 26, intentionally accepting the progress reset this section warns about. This is exactly the "consciously accepts a progress reset and tells her" escape hatch this pitfall's own mitigation section already named as a legitimate alternative to keeping the key frozen. The deployed-origin/URL half of this pitfall is unaffected — no URL change is planned.

**What goes wrong:**
The most dangerous 5 minutes of the milestone: a thorough "Nox Run" rename sweeps up `mathlab_platformer_v2` — the localStorage key holding the XP, levels, and unlocks of the one player who matters. Rename it and her progress is gone on next visit. A subtler variant: the rebrand motivates a new deployment URL/origin — localStorage is origin-scoped, so a new origin orphans the save just as thoroughly with zero code changes.

**Why it happens:**
Rebrands are executed as global find/replace on the old name, and `mathlab` matches. The key lives in `CONFIG.SAVE.KEY` (single source in src) **and** as hardcoded literals in three audit scripts, so even a "careful" partial rename desyncs game from harness.

**How to avoid:**
- Write it into the rebrand phase plan explicitly: **the storage key is not part of the brand.** `mathlab_platformer_v2` stays, with a comment saying why. (If a rename is ever truly wanted, it needs a read-old-write-new migration — pure cost, no user value; don't.)
- Same rule for the deployed origin: Nox Run ships at the same URL, or the milestone consciously accepts a progress reset and tells her.
- Add a check to the rebrand's verification: after the rename sweep, load the game against a pre-rebrand save blob and confirm XP/unlocks resume.

**Warning signs:**
`CONFIG.SAVE.KEY` in the rebrand diff; any `SAVE_KEY` literal changing in `scripts/`; talk of a new domain/subpath for the relaunch.

**Phase to address:**
The rebrand phase — as a stated non-goal ("key unchanged") plus the resume-check verification.

---

### Pitfall 11: Stale-brand scatter — the rename that's 90% done forever

**What goes wrong:**
"Nox Run" ships on the title screen while "Math Lab" survives in: `src/index.html` `<title>` (twice — including the file://-fallback error page), `src/scenes/title.js` wordmark comment and `ACCENT_GREEN` doc-comment, `README.md` (still says "Math Lab v3.0"), `docker/Dockerfile` comment, docs/, CREDITS.md, and dozens of code comments. Browser tab still says "Math Lab — loading." None of it breaks the game, which is exactly why it never gets finished.

**Why it happens:**
Rename tasks are judged done when the visible title screen changes; nobody greps.

**How to avoid:**
- Grep-driven checklist: `grep -rin "math lab\|mathlab" src/ docker/ docs/ README.md CREDITS.md scripts/` *before* starting (inventory) and *after* finishing (verification), with an explicit allowlist for the two intentional survivors: the save key and the school-game key-avoidance comments (`mathlab_save_v1/v2` references in `progress.js` describe *someone else's* keys and must stay accurate).
- User-visible surfaces first and verified in-browser: `<title>`, title-screen wordmark/logo, level-select header, HTML meta/favicon if any, nginx-served error pages.
- Make the post-sweep grep a one-line negative gate in `check-gate.sh` style so regressions (new code copying old comments) fail loudly.

**Warning signs:**
Browser tab text unchanged; grep hit count > allowlist size; new files created mid-milestone containing "Math Lab" copied from templates.

**Phase to address:**
The rebrand phase, with the negative grep persisting as a permanent gate.

---

### Pitfall 12: Palette expansion breaking readability — contrast, vibration, and gameplay semantics

**What goes wrong:**
"More colors, still dark/grunge" fails three ways:
1. **Contrast regressions:** new mid-tone colors on the dark background fall below WCAG AA (4.5:1 text, 3:1 UI components) — answer-box labels, HUD text, or level-select tiles become squint material. The dark theme must pass *on its own*; there's no light mode to fall back on.
2. **Saturation vibration/halation:** fully-saturated accents on near-black "vibrate"/bleed even when the ratio passes; pure white on pure black passes AA but causes halation for astigmatic users. The fix direction for dark UIs is *desaturate and lighten* accents, off-white (not #fff) body text.
3. **Gameplay semantics scrambled:** colors are load-bearing — spikes must read as danger, doors/gates share a deliberate related-barrier grey family, the neon green accent means reward/XP. An expanded palette that recolors decor into hazard-adjacent hues (or makes hazards prettier than they are dangerous) causes real deaths, not just style drift. And "richer palette" is the exact vector by which pink sneaks in — desaturated magentas/mauves read as pink; keep new hues in the green/olive/rust/ochre/steel family that fits both grunge and the new dark-green/black brand.

**Why it happens:**
Palette work is judged on screenshots ("looks cool") rather than ratios and in-motion readability; the current palette constants are also **partially duplicated across modules** (title.js has a local `ACCENT_GREEN`; gates deliberately mirror door/select greys by copy, per comments in `config.js`) — expansion multiplies the drift surface.

**How to avoid:**
- **Centralize before expanding:** move the duplicated color literals into `CONFIG` (or a palette module) first, then expand in one place. This is a small refactor with outsized payoff.
- Define the expanded palette as a **named-role table** (bg / surface / text / text-dim / danger / reward / barrier / accent-1..n) with a checked contrast ratio per text/UI role, committed as a doc artifact. Automate the ratio check if trivial; otherwise record the numbers in the sign-off.
- Hue guardrail in the palette doc: an explicit banned-hue band around magenta/pink.
- Human visual sign-off on the running game (per v4.1 PROC rules), including a "can you instantly tell hazard from decor at speed?" pass on the busiest level.

**Warning signs:**
A new color used for both a hazard and a decoration; any hex with high saturation + high lightness against `#0a0a0a`-family backgrounds; palette values appearing in scene files instead of config; anything a neutral observer would call pinkish.

**Phase to address:**
The visuals/palette phase — centralization task first, role-table + sign-off as acceptance criteria.

---

### Pitfall 13: The Nox Run logo — dark-green-on-black that nobody can see

**What goes wrong:**
The requested "fancy dark green/black themed logo" is a contrast trap by specification: dark green on near-black backgrounds can land under 3:1 and the flagship brand asset reads as a smudge — on the title screen, and worse at small sizes "throughout the UI." Secondary trap: the logo lands as a large PNG with off-brand anti-aliasing halos against the dark bg, or as procedurally-generated placeholder art — the exact class of asset v4.1 existed to purge.

**How to avoid:**
- Brief the logo with a **value-separation requirement**: the mark needs a light/neon element (the existing `#00ff88` accent green is on-brand and already the wordmark color) or a light outline/glow so it separates from black at both title-size and small UI size.
- Test at actual sizes on the actual title screen and in the HUD before sign-off — not on a design canvas.
- The logo is an art deliverable → mandatory human visual sign-off, same standard as v4.1 art (no auto-approval).

**Warning signs:**
Logo unreadable in a squint test or when the laptop brightness is low; logo delivered only at one large size; sign-off recorded without a screenshot of it in the running game.

**Phase to address:**
The rebrand phase, gated on human sign-off in the running game.

---

### Pitfall 14: Audio breaking the automated harness (and the harness pretending audio doesn't exist)

**What goes wrong:**
Two directions of failure:
1. **Audio breaks the scripts:** the four Node static servers in `scripts/` (`browser-boot.mjs`, `screenshot-phase18/20.mjs`, `audit-phase21-mechanics.mjs`) share a `MIME` map with **no audio extensions** (`.ogg`/`.mp3`/`.wav` absent) — audio files get served with no/wrong Content-Type. `fetch`+`decodeAudioData` usually tolerates that, but nginx's config also needs verifying for the same types, and a failing/missing audio asset can stall Kaplay's loading screen — turning the boot gate red (good) or, worse, hanging it (timeout ambiguity). Headless Chromium autoplay behavior also differs from headed Chrome, so unlock logic can pass in CI and fail live, or vice versa.
2. **The harness ignores audio entirely:** every existing audit is visual/positional. Audio regressions (stacking, leaks, silence) are invisible to it, so the milestone's newest subsystem ships with the *least* automated coverage — the v4.0 pattern repeating in a new domain.

**How to avoid:**
- Add audio MIME types to the shared script server (ideally deduplicate the server into `scripts/lib/` while touching it) and confirm nginx serves the audio types; keep asset 404s fail-loud in the boot gate.
- Launch audit Chromium with `--autoplay-policy=no-user-gesture-required` for deterministic runs, but keep **one** boot-gate assertion that exercises the real gesture-unlock path *without* the flag (assert `audioCtx.state === "running"` only after the scripted keypress).
- Cheap audio assertions in the boot gate: after entering a level, exactly one music handle is live; after die-and-respawn, still exactly one; after `go("select")`, the level track is stopped. The audio manager (Pitfall 2) can expose a debug count to make this a one-liner.

**Warning signs:**
Boot gate runtime suddenly longer (decode stall); audit passes but a manual session has stacked music; audio files in `assets/` with no corresponding MIME entry in scripts.

**Phase to address:**
The audio phase (manager debug hook + MIME) and the harness/validation phase (assertions).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Raw `play()` calls scattered in scene code instead of an audio manager | Fastest possible "sound works" demo | Music stacking, cross-scene leaks, no single mute point — retrofit touches every scene | Never — the manager is ~50 lines and the anti-leak rules already mandate the pattern |
| Keeping the 6/16 unreachable-encounter status quo while adding 4 levels | Level authoring starts immediately | Blind-spot fraction grows with content; next soft-lock ships unseen (v4.0 repeat) | Never for *new* levels; existing exceptions stay documented individually |
| Static-only structural validation (skip interactive calibration) | Validator ships in a day | Green-stamps geometry the engine can't traverse — false confidence is worse than no validator | Only as an interim linter, clearly labeled non-gate, until calibration lands |
| Find/replace rebrand without inventory grep + allowlist | Rename "done" in an hour | Save-key wipe risk, stale brand scatter, desynced audit scripts | Never — the inventory grep costs 5 minutes |
| Adding new colors inline per-scene instead of centralizing palette first | No refactor before the fun part | Palette drift across duplicated constants; contrast auditing becomes whack-a-mole | Never — duplication already flagged in existing code comments |
| Bolting audio prefs into the progress save blob | One storage key | Version churn in load-bearing audited code + 3 script fixtures | Only if a separate key is somehow impossible (it isn't) |
| Lengthening levels by editing kid-validated early sections | Reuses tuned geometry | Invalidates prior kid-UAT on exactly the sections she liked | Never — append/extend instead |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Kaplay audio × scene system | Assuming `go()` stops sounds (it doesn't — handles outlive scenes) | Idempotent `playMusic()` manager; loops stopped in scene teardown |
| Kaplay audio × browser autoplay | Starting music on title-scene entry before first gesture | Start music inside the press-to-start input handler; assert `ctx.state === "running"` in boot gate |
| Kaplay audio × tab switching | Surprise at music halting on tab hide | That's vendored default (`ctx.suspend()` on hide unless `backgroundAudio: true`) — desired behavior here; don't "fix" it |
| Audio assets × script servers / nginx | `.ogg`/`.wav`/`.mp3` missing from the scripts' MIME maps; nginx types unverified | Add types to the shared server helper + verify nginx; keep 404s fail-loud |
| New levels × camera/parallax | Trusting `CONFIG.LEVEL_RIGHT` (2240, v3.0-era) — it's only the *fallback*; bounds are derived from floors/platforms/goal in `game.js`, so an off-floor mechanic or decoration past the last floor sits outside derived bounds | Include all placed entities in the bounds derivation (or set explicit `level.bounds`); interactive run must walk to the true right edge |
| New levels × audit scripts | Forgetting `LEVEL_ORDER` drives script `SAVE_BLOB` unlocks (good — derived), but the traversal driver still needs per-level viability | Run the audit against each new level as it lands, not once at milestone end |
| Drop tables 1 & 10 × math brain | "Fixing" it in `brain.js` | Brain is LOCKED; table 10 already impossible (brain filters 1..9); remove table 1 from `level-02.js`'s pool and any new-level pools |
| Rebrand × localStorage | Renaming `mathlab_platformer_v2` or changing the deployed origin | Key and origin are not part of the brand; verify resume against a pre-rebrand blob |
| Rebrand × school game | Sweeping the `mathlab_save_v1/v2` *avoidance comments* in `progress.js` into the rename | Those document someone else's keys — allowlist them |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Decoding all music tracks at boot | Longer Kaplay loading screen as tracks accumulate | Keep music short/compressed OGG; one ambient bed shared across levels beats 8 unique tracks | Noticeable past a few MB of audio on the initial load |
| New `play()` per rapid-fire SFX (e.g., coin runs) | Audible pile-up, crackle on cheap laptop audio | Debounce identical SFX within ~50ms in the manager | A coin line collected at full run speed |
| Parallax tile count scaling with level width | More draw objects on 2×-long levels | Existing tiling derives from bounds — fine; just spot-check FPS on the longest level | Unlikely at 8 levels; check once, don't engineer |
| Longer levels × more live mechanic objects | Frame dips late in big levels | Kaplay handles offscreen fine at this scale; profile only if the boot gate's FPS probe dips | Not expected at this content size |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| New/copied audit scripts reintroducing bind-all-interfaces or path traversal (v4.1 fixed these once) | Local test server exposed on LAN / file disclosure | New scripts copy the *fixed* skeleton (`audit-phase21` post-WR-02); keep `check-safety.sh`-style gates running |
| Sourcing audio from packs without license checks | Non-CC0 audio shipped in a public repo/URL | Same CC0-with-CREDITS.md discipline as the art assets; record source + license per file at download time |
| Rebrand touching nginx/Docker config carelessly | Broken headers/routes on redeploy | Config diff reviewed separately from the cosmetic rename; curl-check the container after |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No mute / buried mute | Sound becomes a reason to close the game (sensory overload risk) | One obvious key (e.g., `M`) + visible state, persisted; discoverable alongside existing control hints |
| Harsh wrong-answer sound | Auditory punishment → shame spiral; undoes the forgiving-mechanics work | Neutral soft cue or silence + existing gentle visual feedback |
| Loud stingers/fanfares | Startle response; ADHD-unsafe | Warm, mid-volume reward sounds; nothing that spikes above the ambient bed |
| Longer levels without more checkpoints | Death costs real progress → frustration loop | Checkpoint-density rule enforced by the validator |
| Doubling math encounters because levels doubled | Game regresses toward "quiz with walking" | Hold encounter budget ~constant; length comes from platforming |
| Logo/palette that only works on the designer's bright monitor | She plays on a laptop, possibly dim | Sign off at realistic brightness, at real sizes, in the running game |
| Renaming the game she knows without telling her | Confusion / "where's my game?" | The rebrand is a *feature* — let the title screen make Nox Run feel like an upgrade, same URL, progress intact |

## "Looks Done But Isn't" Checklist

- [ ] **Audio:** plays for the developer — verify in a **fresh incognito profile** (no autoplay history) that title music starts on the first keypress
- [ ] **Audio:** sounds correct in one session — verify **die twice + exit to select**: still exactly one music instance, correct track per scene
- [ ] **Audio:** music loops — verify across **3+ loop boundaries** for seams (OGG, trimmed)
- [ ] **Audio:** mute works — verify it **persists across reload** and doesn't touch the progress save
- [ ] **Levels:** validator green — verify the **interactive start→goal run** also passed for the same level (static pass alone is not done)
- [ ] **Levels:** audit script green — verify **encounter coverage count**: driven/total per level, exceptions individually documented (bar: no silent growth past the known 6/16)
- [ ] **Levels:** level-01 lengthened — verify the geometry **fixture was re-baselined deliberately**, not deleted
- [ ] **Rebrand:** title screen says Nox Run — verify **browser tab title**, README, Dockerfile, docs, and the file:// fallback page via the inventory grep (allowlist: save key + school-game comments)
- [ ] **Rebrand:** rename merged — verify **pre-rebrand save blob still resumes** (XP, unlocks intact)
- [ ] **Palette:** looks great in screenshots — verify **contrast ratios recorded per text/UI role** and hazard-vs-decor readability at speed
- [ ] **Tables:** "dropped 1 & 10" — verify table 1 absent from every `allowedTables` and **zero diff in `src/math/`**
- [ ] **Everything:** automation green — verify a **human played the new content** (v4.0's lesson never expires)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Music stacking shipped | LOW | Introduce the idempotent manager, route all `play()` music calls through it; add the handle-count boot-gate assertion |
| Save wiped by key rename | MEDIUM | Ship a read-old-key migration immediately (old blob is still in her localStorage until overwritten/cleared — act before she plays much on the empty save) |
| Validator green-stamped an uncrossable gap | LOW–MEDIUM | Fix geometry; recalibrate the envelope from a real-engine measurement; add the failing case as a validator regression fixture |
| New level shipped with undriven encounters hiding a soft-lock | MEDIUM | Same playbook as v4.0→v4.1: from-scratch interactive playthrough, fix, extend harness so that encounter class is drivable |
| Palette shipped with contrast regressions | LOW | Colors are (post-centralization) config values — adjust in one place, re-record ratios, re-sign-off |
| Stale brand strings found post-ship | LOW | Run the inventory grep, sweep, add the negative gate that should have existed |

## Pitfall-to-Phase Mapping

Suggested ordering rationale: **harness/validation before level content** (Pitfalls 6–7 are prerequisites for trustworthy levels), audio and rebrand independent of both, palette centralization before palette expansion.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Autoplay-blocked music | Audio phase | Fresh-incognito manual check + `ctx.state === "running"` boot-gate assertion after scripted keypress |
| 2. Audio scene leaks / stacking | Audio phase | Die-twice + exit-to-select listen; handle-count assertion in boot gate |
| 3. Loop seam | Audio phase | 3-loop-boundary listen; `.ogg` in assets, no `.mp3` music |
| 4. Mute persistence / save schema | Audio phase | Reload-persists check; zero diff to `progress.js` serialization (or additive + 3 scripts updated atomically) |
| 5. ADHD-unsafe audio | Audio phase | Written audio-safety criteria in plan; human/kid sign-off on the sound set |
| 6. Audit coverage degradation | Harness/validation phase (ordered **before** level authoring) | Encounter coverage report per level; no silent exception growth |
| 7. Validator false confidence | Harness/validation phase | Envelope calibrated against real engine; validator catches the 2 known live bugs before being trusted; non-zero exit on fail |
| 8. Copy-paste drift / fixture trap | Level-authoring phases | Validator lint rules; fixture re-baseline reviewed with each geometry change |
| 9. Difficulty/pacing/table ramp | Level-content design task, enforced by validator | 8-level ramp table reviewed; checkpoint-density rule; `src/math/` untouched; table 1 absent from pools |
| 10. Save-key/origin wipe | Rebrand phase (stated non-goal) | Pre-rebrand blob resumes post-rename; same origin |
| 11. Stale brand scatter | Rebrand phase | Inventory grep before/after with allowlist; permanent negative gate |
| 12. Palette contrast/semantics | Visuals/palette phase (centralize first) | Role table with recorded ratios; hazard-readability + no-pink human sign-off |
| 13. Invisible logo | Rebrand phase | In-game sign-off at real sizes/brightness |
| 14. Audio × harness | Audio + harness phases | MIME types added; audit runs deterministic; one real-gesture unlock assertion kept |

## Sources

- **This repo (HIGH):** `lib/kaplay.mjs` (audio internals: `ctx.resume()` sites, `backgroundAudio`, masterNode, handle API — inspected directly), `src/progress.js` (save seam, LOCKED-brain firewall, school-game key comments), `src/config.js` (physics constants, palette duplication notes, `LEVEL_RIGHT` fallback), `src/camera.js` + `src/scenes/game.js` (bounds derivation), `src/levels/level-0*.js` (pools incl. table 1 in level-02; hand-tuning comments; fixture note), `src/scenes/title.js` + `src/index.html` + `README.md` + `docker/Dockerfile` (brand-string inventory), `scripts/audit-phase21-mechanics.mjs` + `scripts/lib/mechanic-drive.mjs` + `scripts/browser-boot.mjs` (SAVE_KEY literals, MIME maps, always-exit-0 diagnostic pattern, spike-resonance limitation), PROJECT.md v4.0/v4.1 history (soft-lock post-mortem, interactive-audit standard, sign-off process rules)
- **Autoplay policy (MEDIUM, cross-verified):** [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay), [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [WebAudio spec issue #1802](https://github.com/WebAudio/web-audio-api/issues/1802), [Chromium autoplay docs](https://www.chromium.org/audio-video/autoplay/)
- **Gapless loops (MEDIUM, cross-verified):** [SeamlessLoop](https://github.com/Hivenfour/SeamlessLoop), [Seamless audio looping in HTML5/JS](https://www.kevssite.com/seamless-audio-looping/), [Gearspace: gapless MP3 looping](https://gearspace.com/board/mastering-forum/632775-gapless-mp3-looping.html)
- **Dark palette / contrast (MEDIUM, cross-verified):** [BOIA: dark mode ≠ WCAG compliance](https://www.boia.org/blog/offering-a-dark-mode-doesnt-satisfy-wcag-color-contrast-requirements), [DubBot dark mode a11y](https://dubbot.com/dubblog/2023/dark-mode-a11y.html), [Accessibility Checker dark mode guide](https://www.accessibilitychecker.org/blog/dark-mode-accessibility/), [ColorArchive contrast guide](https://colorarchive.me/guides/color-contrast-accessibility-guide/)
- **Level design (MEDIUM, cross-verified):** [RetroStyle platformer level design tips](https://retrostylegames.com/blog/platformer-level-design-tips/), [GameDev.net 2D platformer level design](https://gamedev.net/forums/topic/674970-2d-platformer-level-design/), [Gimkit: common platformer mistakes](https://forum.creative.gimkit.com/t/8-more-common-mistakes-that-can-make-your-platformer-less-enjoyable-and-how-to-fix-them/95449)
- Jump-envelope numbers (≈96px height, ≈178px theoretical flat-gap flight) derived from `CONFIG` (RUN_SPEED 240, JUMP_FORCE 520, GRAVITY 1400) — HIGH as math, but explicitly **must be calibrated against the running engine** before a validator trusts them (see Pitfall 7)

---
*Pitfalls research for: Math Lab → Nox Run v5.0 (audio, 8 longer validated levels, palette expansion, rebrand)*
*Researched: 2026-07-05*
