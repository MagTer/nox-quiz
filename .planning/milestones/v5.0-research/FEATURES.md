# Feature Research

**Domain:** Kid-friendly 2D browser platformer (v5.0 "Nox Run — Real Levels": audio/SFX + ambient music, 8 longer guaranteed-playable levels, level-select at 8, richer grunge palette, rebrand + logo)
**Researched:** 2026-07-05
**Confidence:** MEDIUM overall (web-sourced conventions cross-checked across multiple sources; Kaplay audio API verified directly against the vendored `lib/kaplay.mjs`)

> **Supersedes** the 2026-06-28 v4.0-era FEATURES.md (mid-game math mechanics — all shipped in v4.0/v4.1).
>
> **Scope note (subsequent milestone):** This document covers ONLY the NEW v5.0 features. The shipped spine — 4 levels, title + level-select with lock/unlock/cleared, four math mechanics funneled through the shared challenge UI, the 6–9-weighted brain, XP/leveling, versioned localStorage, v4.1 curated CC0 art under human sign-off — is a fixed foundation, treated below as dependencies only.
>
> **LOCKED constraints checked against every feature below:** dark grunge / NO pink · ADHD-safe (NO timers, wrong answers NEVER punish, no strobing, animation caps ≤500 ms) · vendored Kaplay, no build step · localStorage-only persistence · her saved progress must survive everything in this milestone.

---

## Feature Landscape

### Table Stakes (Users Expect These)

#### 1. Audio / SFX (AUDIO-01)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Jump SFX | The single most iconic platformer sound; its absence makes a game feel mute/unfinished | LOW | Short, soft chirp/whoosh on jump input. Kenney Impact/Interface CC0 packs cover it. |
| Land SFX | Closes the jump loop; gives the avatar weight | LOW | Quiet low thud on ground-contact after airborne; noticeably quieter than jump. |
| Pickup / collect SFX | Collect-the-answer already exists; silent pickups feel unrewarding | LOW | Gentle chime/blip; reuse for XP pickups and keys. |
| Correct-answer SFX | Positive feedback IS the game's reward loop | LOW | Warm rising 2–3 note motif. Wire once into the shared challenge-resolution path so all four mechanics (door/gates/enemy/collect + mathGate) sound identical — predictable cues are calming. |
| Wrong-answer SFX — soft and neutral, NOT a buzzer | Feedback must exist, but harsh error audio is the #1 anti-feature for this user | LOW | Soft, low, short single tone that reads "not that one, try again" — the Khan-Academy-Kids-style gentle-error convention. Pairs with the existing penalty-free re-ask. |
| Door-open / gate-clear SFX | The gate mechanics are the game's spine; resolving one should feel satisfying | LOW | Mechanical clunk/slide for doors; softer shimmer for checkpoint gates. |
| Level-clear fanfare | Standard payoff since Mario; the XP award already animates and needs its sound | LOW | Short jingle (2–4 s), moderate volume, not a blast. Kenney Music Jingles (CC0). |
| Calm ambient music loop | A silent game reads unfinished; PROJECT.md targets calm ambient explicitly | MEDIUM | Seamless OGG loop, low intensity, minimal build-up, 1–2 min long (short loops become intrusive). Kaplay `loadMusic` streams rather than buffering — right for 1–5 MB tracks. OpenGameArt "CC0 Calm/Relaxing" collections ship seamless OGG loops. 2–3 tracks across 8 levels is plenty. |
| Mute toggle (persisted) | Universal web-game expectation; also the escape hatch if audio ever overwhelms her | LOW | One key/UI toggle; persist in the existing versioned localStorage save (MDN/Chrome guidance: always give users audio control). |
| Audio unlock on first input | Browsers keep AudioContext suspended until a user gesture — audio otherwise silently fails | LOW | Structurally already solved: title screen requires a keypress/click, and the vendored Kaplay resumes `audioCtx` on input and auto-suspends it on tab-hide. Just ensure music starts after that first interaction, never on page load. |

**Format note:** OGG-only is fine for the Windows-laptop Chrome/Edge/Firefox target (Safari lacked Ogg Vorbis until 18.4; irrelevant here — add MP3 fallback only if Safari ever matters).

#### 2. Longer levels (8 total) + structural validity

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Guaranteed traversability start→goal | A level you can't finish is a broken product; known issues (doors over floor holes, unreachable areas) already violate this | MEDIUM | Automated structural validator over level data: every gap ≤ max jump, every mechanic reachable and not placed over a pit, goal reachable, no dead-end zones. Natural extension of the v4.1 boot-gate/traversal audit. |
| Checkpoint respawn in longer levels | Longer level + death = restart-from-zero is the classic frustration spiral; ADHD context makes this a hard requirement | MEDIUM | Checkpoint gates already exist as a math mechanic — extend them to double as respawn anchors. Ship together with level lengthening, not after. |
| Teach-test-twist pacing per level | Mario 1-1 pattern: introduce safely → test → combine. This is what makes a level feel *designed* rather than merely long | MEDIUM | Each new level (5–8) owns one "twist" (more verticality, hazard arrangement, mechanic combo); lengthened levels 1–4 keep their current gentle tier. |
| Rest beats between challenges | Pacing rhythm (peak → calm → peak) is what makes long levels feel fair; wall-to-wall hazards reads as punishment | LOW | Flat safe stretches, scenery moments, XP-pickup runs. Cheap, high perceived-quality payoff. |
| Gentle difficulty ramp preserved across 8 | Validated v4.0 requirement; doubling content must not break the curve | MEDIUM | Table pools continue ramping toward 6–9 (with tables 1 & 10 dropped per pending todo); platforming ramp stays gentle. |

#### 3. Level select at 8 levels

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Locked / unlocked / cleared states scale to 8 | Already shipped for 4; identical semantics expected at 8 | LOW | Extend the versioned save (levels 5–8 default locked; 5 unlocks when 4 clears). Explicit save migration, no data loss. |
| One-screen layout that fits 8 | 8 levels do NOT need worlds or scrolling; a single screen with a path or 2×4 grid is the genre norm at this count | LOW–MEDIUM | Game UI Database patterns: linear node-path (Mario-style dots on a winding path) or level cards. A winding path over the existing dark-grunge select background is the cheapest "world map feel" upgrade. |
| Clear "next level" affordance | She should never wonder where to go next | LOW | Subtle pulse/glow on the newest unlocked uncleared node — ≤500 ms, no strobe. |

#### 4. Rebrand / title logo ("Nox Run")

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Logo prominent, menu/prompt beneath | Near-universal title-screen convention: wordmark upper-center/center, single "press key" prompt or small menu below, atmospheric background in the game's art style | LOW–MEDIUM | Dark green/black "Nox Run" wordmark over the existing parallax title background. Safe raw material: monogram (CC0), Kenney Fonts (CC0), Pixel Operator (SIL OFL); render + hand-touch into a PNG logo asset. Falls under the v4.1 human-visual-sign-off rule. |
| Rebrand consistency everywhere | A rebrand touching only the title screen reads sloppy | LOW (but wide) | Title screen, HTML `<title>`, level-select header, HUD/pause/help strings, README/CREDITS, docker naming. Grep for "Math Lab". |
| Save data survives the rebrand | She must not lose XP/levels because the game changed names | LOW | Keep the existing localStorage key (or migrate explicitly in the versioned-save layer). Never silently re-key the save on the new name. |

#### 5. Richer grunge palette

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Per-level (or per-pair) color identity | Distinct tint/theme per level is how platformers make "more levels" feel like "more places" | MEDIUM | Cheapest lever: vary parallax/background tint + one accent color per level (or per pair), shared dark base. Still dark, still grunge, still no pink. |
| Readability preserved | Readable contrast is an already-validated v3.0 requirement; new colors must not regress it | LOW | Player/hazard/interactive elements stay high-contrast against every new background variant; re-check per theme. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| ADHD-safe audio mix as a *designed* feature | Most kid games get audio wrong for sensory-sensitive players (loud stingers, punishing buzzers). A deliberately calm mix is the audio equivalent of this game's "no timers" | MEDIUM | Mix hierarchy from game-audio practice: music/ambience clearly below SFX (industry guidance ~-23 LUFS music, ambience lower still — treat as guidance, not spec). Practically: Kaplay global `setVolume` as master; music at ~0.3–0.4 of SFX level; no sudden peaks; audition everything together. |
| One shared correct/wrong sound pair across all mechanics | Predictability is calming; correct always sounds the same whether it's a door, gate, enemy, collect, or the end gate | LOW | Wire into the shared challenge-resolution path once. |
| Verticality segments in new levels | Levels that climb/descend feel much bigger than horizontal corridors at the same tile count — cheap perceived length | MEDIUM | Layered platforms; a tower-ish segment in one late level. Camera-follow already exists. |
| Light secrets (1 per level) | Hidden XP alcoves reward curiosity and add replay with zero new mechanics | LOW | Existing XP pickups behind an off-path jump; no secret-tracking UI. |
| Structural validator as a permanent regression gate | Turns "fix the broken doors" into "no level can ever ship broken again" — compounds across all future level work | MEDIUM–HIGH | Formalize per-level invariants on top of the v4.1 traversal-audit investment. Known limitation to respect: the current traversal model can't reach 6/16 encounters (spike-timing resonance) — validator should assert reachability from level *data*, not only via simulated traversal. |
| Level-clear audio layering | Clear moment = the emotional peak: gate SFX → short fanfare → XP tick over the existing animation | LOW | Total under a few seconds; skippable by input. |
| Subtle logo reveal | ≤500 ms fade/settle on the Nox Run logo makes the title feel premium at near-zero cost | LOW | One-shot tween; no loops, no flicker. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Harsh wrong-answer buzzer / "fail" sting | "Clear feedback" instinct | Punishing audio is shame-inducing for a sensory-sensitive kid; auditory-sensitivity literature flags sudden negative sounds as a top aversion. Attacks the Core Value directly | Soft neutral "not that one" tone + the existing penalty-free re-ask *is* the feedback |
| Loud stingers on enemy contact / death | Standard game "impact" | Sudden unpredictable loud sounds are exactly what sensory-safe design avoids; death already restarts forgivingly | Quiet brief hit sound; death/respawn audio softer than the correct-answer sound |
| Music that intensifies with danger | "Dynamic audio" is trendy | Rising intensity = manufactured pressure — the audio version of the banned countdown timer | One constant-intensity calm loop per level theme; vary *between* levels, never within |
| Very short music loops (<30 s) or looping SFX | Smaller files | Intrusive repetition is a documented irritation/immersion-killer | 1–2 min seamless CC0 ambient loops; 2–3 tracks across 8 levels |
| Autoplaying music on page load | "Set the mood immediately" | Browsers block it (suspended AudioContext) → silent failure; also startling | Start on first input at the title screen — the gesture already exists in the flow |
| Maze-like / branching levels to add length | "Longer = more content" | Getting lost is frustration, not content — working-memory load is the wrong kind of difficulty for ADHD; backtracking kills pacing | Mostly-linear paths with short *visible* detours (secrets); length from pacing beats + verticality |
| Doubling hazard density for "harder" long levels | Easy difficulty knob | Reads as punishment; breaks rest-beat rhythm; the ramp is supposed to be gentle | Variety and arrangement twists per level at the same forgiving hazard spacing |
| Worlds/overworld map for 8 levels | Mario nostalgia | Two-tier navigation adds clicks and code for zero benefit at 8; worlds earn their keep at ~12+ | Single-screen path/grid; per-node accent colors can hint at each level's palette |
| Star ratings / per-level scores on select screen | Standard mobile pattern | Grading invites self-judgment ("1 star = I'm bad") — same shame-spiral reasoning that excluded leaderboards | Binary cleared flag (shipped); XP total stays the single progress currency |
| Full recolor of existing sprite art for "richer palette" | Reads the requirement literally | Risks undoing the human-signed-off v4.1 art; large, regression-prone | Layer richness via per-level background/parallax tints, lighting accents, UI accent colors — sprites untouched |
| Full audio options menu (per-channel sliders) | "Proper" settings | Settings-UI scope creep for a single-player kid game | Mute toggle + at most one master volume; persisted |
| Renaming the localStorage key to "noxrun…" | Naming hygiene | Silently orphans her XP/level/history — a betrayal-level bug for this specific user | Keep the old key or run an explicit versioned migration carrying all data forward |

## Feature Dependencies

```
First-input gesture (title screen, existing)
    └──required by──> ambient music start
    └──required by──> all SFX (AudioContext resume)

Mute toggle ──persists via──> versioned localStorage save (existing)

Correct/wrong SFX ──wires into──> shared challenge-resolution path (existing: door/gates/enemy/collect/mathGate)
Level-clear fanfare ──layers on──> existing XP award animation

Structural validator ──must precede──> lengthening levels 1–4
    └──must precede──> building levels 5–8
    └──extends──> v4.1 boot-gate / traversal audit (existing)

Checkpoint respawn ──extends──> checkpoint-gate mechanic (existing)
    └──required by──> longer levels (frustration control)

Level select @8 ──requires──> save-format extension (5–8 locked by default)
Per-level palette tinting ──enhances──> level identity
    └──constrained by──> readable-contrast requirement (validated v3.0)

Nox Run logo asset ──required by──> title-screen rebrand
    └──subject to──> human visual sign-off rule (v4.1 PROC decisions)
Rebrand string sweep ──must NOT touch──> localStorage save key (or explicit migration)

ADHD-safe mix hierarchy ──constrains──> every audio asset and volume choice
```

### Dependency Notes

- **Validator before level work:** without it, every level edit means another hand audit ×8; with it, structural correctness is checked for free on every change. It belongs in an early v5.0 phase, before any level lengthening.
- **Checkpoint respawn ships with lengthening:** longer levels without respawn anchors would *reduce* ADHD-safety relative to v4.1 — the two are one feature from the player's perspective.
- **Audio needs no new tech:** the vendored Kaplay already exposes `loadSound`, `loadMusic` (streamed, with play/seek/stop), `play({ loop, volume, paused })`, global `setVolume`/`getVolume`, raw `audioCtx`, and auto-suspends on tab-hide. No library change, no build step. (Verified in `lib/kaplay.mjs`.)
- **Rebrand vs persistence is the one dangerous interaction** in this milestone: the rename sweep must explicitly exclude or migrate the save key.
- **Palette enriches around, not over, the v4.1 art:** backgrounds/tints/accents only, so the existing human sign-off isn't invalidated; the new logo *does* need its own sign-off.

## MVP Definition

### Launch With (v5.0)

- [ ] Structural validator + all 8 levels passing it — the milestone's "guaranteed-playable" promise
- [ ] Core SFX set (jump, land, pickup, shared correct, shared soft wrong, door/gate, level-clear) — the table-stakes feedback loop
- [ ] 2–3 calm ambient OGG loops, gesture-gated start, music mixed clearly below SFX
- [ ] Mute toggle, persisted in the existing save
- [ ] 8 levels: 1–4 lengthened, 5–8 new; checkpoint respawns; rest beats; teach-test-twist pacing; tables 1 & 10 dropped
- [ ] Single-screen level select for 8 with existing lock/unlock/cleared semantics + next-level glow
- [ ] Nox Run dark-green/black wordmark on title screen + full string sweep, save data intact, logo human-signed-off
- [ ] Per-level background/accent tinting with contrast re-checked

### Add After Validation (v5.x)

- [ ] Master volume slider — only if the mute toggle proves too coarse in kid-UAT
- [ ] One secret per level — trigger: she clears levels fast or asks "is that all?"
- [ ] Logo reveal animation — polish, after audio/levels are signed off
- [ ] More music variety — trigger: repetition complaints in real play

### Future Consideration (v6+)

- [ ] Worlds/overworld map — only past ~12 levels
- [ ] Adaptive/positional audio — complexity against the calm-audio goal
- [ ] Ambient environmental SFX layers (wind, drips) — each added sound spends sensory budget; defer until the base mix is validated with her

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Structural validator + traversability fixes | HIGH | MEDIUM | P1 |
| Core SFX set (7 sounds) via shared resolution path | HIGH | LOW | P1 |
| Ambient music loop + gesture-gated start + calm mix | HIGH | MEDIUM | P1 |
| Soft/neutral wrong-answer sound | HIGH | LOW | P1 |
| Mute toggle (persisted) | HIGH | LOW | P1 |
| Checkpoint respawn in longer levels | HIGH | MEDIUM | P1 |
| 8 levels with pacing structure | HIGH | HIGH | P1 |
| Level select scaled to 8 (one screen) | HIGH | LOW–MEDIUM | P1 |
| Nox Run logo + save-safe rebrand sweep | MEDIUM | LOW–MEDIUM | P1 |
| Per-level palette tinting | MEDIUM | MEDIUM | P2 |
| Verticality segments (levels 5–8) | MEDIUM | MEDIUM | P2 |
| Secrets (1/level) | MEDIUM | LOW | P2 |
| Volume slider | LOW | LOW | P3 |
| Logo reveal animation | LOW | LOW | P3 |

## Competitor Feature Analysis

| Feature | Her school's Mario-style math game (north star) | Typical kid edu-apps (Khan Academy Kids pattern) | Our Approach |
|---------|--------------------------------------------------|--------------------------------------------------|--------------|
| Answer feedback audio | Game-y jingles | Gentle sounds + neutral visual change on errors; no harsh judgment | Warm correct motif; soft neutral wrong tone; identical across all mechanics |
| Music | Upbeat chiptune loops | Calm, low-stimulation backing | Calm dark-ambient loops fitting the grunge aesthetic; constant intensity, never danger-reactive |
| Level structure | Short linear stages, math at the end | N/A | Longer linear stages with mid-level math mechanics + checkpoint respawns; length from pacing/verticality, not mazes |
| Level select | Sequential unlock | World-map metaphors | One dark-grunge screen, path/grid of 8 nodes, lock/cleared marks, next-level glow — no worlds, no stars |
| Failure handling | Retry stage | No-penalty retry | Existing forgiving retry + checkpoints; death audio quieter than success audio |

## Sources

- Vendored `lib/kaplay.mjs` (this repo) — audio API surface: `loadSound`, `loadMusic`, `play({loop, volume, paused})`, `setVolume`/`getVolume`, `audioCtx`, auto-suspend on tab hide (direct code inspection; MEDIUM per confidence seam, primary source)
- [MDN Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [Chrome Developers: Web Audio autoplay](https://developer.chrome.com/blog/web-audio-autoplay) — gesture requirement, user audio controls (MEDIUM, cross-confirmed official docs)
- [Springer: Sounds in Game Design and Evaluation for Autistic People](https://link.springer.com/chapter/10.1007/978-3-032-01426-9_3), [educational-games.online sensory-friendly games](https://www.educational-games.online/post/sensory-friendly-games-for-kids), [arXiv: educational game design elements](https://arxiv.org/pdf/1709.09931) — sensory-safe audio principles (MEDIUM)
- [Medium: Lessons learned in audio feedback for game and app design](https://medium.com/@fernando1lins/lessons-learned-in-audio-feedback-for-game-and-app-design-e4818c9b72fd), [Aufait UX: child-friendly interfaces](https://www.aufaitux.com/blog/ui-ux-designing-for-children/) — gentle wrong-answer convention (MEDIUM)
- [RetroStyleGames: platformer level design tips](https://retrostylegames.com/blog/platformer-level-design-tips/), [gamedesignskills.com: 2D game levels](https://gamedesignskills.com/game-design/2d-game-levels/), [UCSC: A Framework for Analysis of 2D Platformer Levels](https://eis.ucsc.edu/papers/smith-sandbox-08.pdf) — pacing, checkpoints, verticality, secrets, teach-test-twist (MEDIUM)
- [Game UI Database: Stage/Level Select](https://www.gameuidatabase.com/index.php?scrn=42), [Level Select: World Map](https://gameuidatabase.com/index.php?scrn=6&set=1), [Title Screen](https://www.gameuidatabase.com/index.php?scrn=1) — level-select and title-screen conventions (MEDIUM for level select; LOW for title-screen specifics — thin formal literature, pattern evidence only)
- [VNDev: Balancing a Game's Loudness](https://vndev.wiki/Guide:Balancing_a_Game's_Loudness), [Airwiggles: Peak level and LUFS for game audio](https://www.airwiggles.com/c/gameaudio/peak-level-and-lufs-for-game-audio) — music below SFX, ambience lowest, headroom (MEDIUM; treat exact LUFS numbers as guidance)
- [Kenney: Audio assets](https://kenney.nl/assets/category:Audio) (Interface Sounds, UI Audio, Impact Sounds, Music Jingles — all CC0), [OpenGameArt: CC0 Calm/Relaxing Music](https://opengameart.org/content/cc0-calm-relaxing-music), [Short Loops Background Music Pack](https://opengameart.org/content/short-loops-background-music-pack) — asset sourcing (MEDIUM)
- [caniuse: Ogg Vorbis](https://caniuse.com/ogg-vorbis) — Safari lacked Ogg Vorbis before 18.4; MP3/AAC universal; OGG-only fine for the Windows target (MEDIUM)
- [monogram (CC0)](https://datagoblin.itch.io/monogram), [Kenney Fonts (CC0)](https://kenney.nl/assets/kenney-fonts), Pixel Operator (SIL OFL) — logo wordmark font options (MEDIUM)

---
*Feature research for: Nox Run v5.0 (audio, 8 longer levels + structural validity, level select at 8, richer palette, rebrand)*
*Researched: 2026-07-05*
