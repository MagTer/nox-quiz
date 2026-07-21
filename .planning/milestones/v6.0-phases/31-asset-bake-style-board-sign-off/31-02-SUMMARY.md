---
phase: 31-asset-bake-style-board-sign-off
plan: 02
subsystem: assets
tags: [gothicvania, pillow, style-board, sign-off, art-pipeline]

# Dependency graph
requires:
  - phase: 31-asset-bake-style-board-sign-off
    provides: "Plan 31-01's assets/_gothicvania-src/ extraction tree (ROOT path this plan's regeneration depends on)"
provides:
  - "Regenerated style-board-{swamp,town,cemetery,castle}.png + style-board-sheet.png showing the Swamp Hunter as the player in all 4 biomes and the Hell hound as the castle enemy"
  - "A genuine, verbatim-quoted, 5-round human sign-off on the final regenerated board, unblocking Plans 31-04/31-05 baking work"
  - "Three floor-alignment bug fixes (castle player, swamp player/spider/thing, castle hell hound) found and resolved through real iterative human review"
affects: [31-03, 31-04, 31-05, 31-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-character *_FEET_Y constants measured pixel-by-pixel against the actual sourced art (alpha-bbox / gold-trim sampling), not assumed from a shared FLOOR_Y or hardcoded literal"
    - "put_feet() is the single anchoring path for every character in every styleboard.py scene — a bare alpha_composite() paste bypassing it (the hell hound bug) is now a known anti-pattern to check for on any future scene addition"

key-files:
  created: []
  modified:
    - ".planning/research/v6-scouting/styleboard.py"
    - ".planning/research/v6-scouting/style-board-swamp.png"
    - ".planning/research/v6-scouting/style-board-town.png"
    - ".planning/research/v6-scouting/style-board-cemetery.png"
    - ".planning/research/v6-scouting/style-board-castle.png"
    - ".planning/research/v6-scouting/style-board-sheet.png"

key-decisions:
  - "Round-2 through round-4 human feedback each surfaced a genuine floor-alignment defect (castle player, swamp player/spider/thing, castle hell hound) — all three were real bugs in styleboard.py's positioning constants, not taste preferences, and all three were fixed before requesting the next round"
  - "The checkpoint was NOT rubber-stamped: 5 real rounds occurred, matching this project's standing precedent from Phases 25/27/28 of never auto-approving a checkpoint:human-verify gate"

patterns-established:
  - "Floor/feet alignment for any composited character must be measured against the actual source art's visible ground line (gold-trim top edge, alpha-bbox of the tile) rather than assumed from a shared constant or an unverified literal carried over from a different scene"

requirements-completed: []

coverage:
  - id: D1
    description: "styleboard.py regenerated to show Swamp Hunter as the player across all 4 biome renders and Hell hound as the castle enemy, with all other compositing/tiling/badge logic unchanged"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "grep -c gothic-hero styleboard.py -> 0; grep -c fire-skull styleboard.py -> 0; grep -c idle1.png styleboard.py -> >=3; grep -c hell-hound-idle styleboard.py -> >=1; python3 styleboard.py exits 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Genuine round-2 human sign-off on the regenerated style board (post-swap, pre-floor-fixes), distinct from CONTEXT.md's earlier round-1 discuss-phase kid quotes"
    requirement: "ART-01"
    verification: []
    human_judgment: true
    rationale: "Requires a human to view the rendered image and judge whether it reads right — cannot be automated. Verbatim quote recorded below."
  - id: D3
    description: "Castle player floor-alignment fix (feet_y 336->290) after round-2 feedback identified the player floating below the walkable ledge"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "git show 94e6259 --stat; style-board-castle.png regenerated, swamp/town/cemetery byte-identical (verified via git diff before staging)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Swamp floor-alignment fix (per-character SWAMP_*_FEET_Y constants added for player/spider/thing) after round-3 feedback identified the player floating above the ground"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "git show 168d301 --stat; style-board-swamp.png regenerated, town/cemetery/castle byte-identical (verified via cmp before staging)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Castle Hell hound floor-alignment fix (bare alpha_composite paste replaced with put_feet()-anchored CASTLE_HOUND_FEET_Y=258) after round-4 feedback identified the hound floating above the rope bridge"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "git show 9443f7f --stat"
        status: pass
    human_judgment: false
  - id: D6
    description: "Final round-5 genuine human sign-off: 'Looks good. Approved' — approval to proceed to baking (Plans 31-04/31-05)"
    requirement: "ART-01"
    verification: []
    human_judgment: true
    rationale: "The terminal go/no-go decision for this checkpoint; requires the human's own words, recorded verbatim, per this project's Phase 25/27/28 non-rubber-stamp precedent."

duration: ~6h (spanning multiple real human-review rounds, not continuous active work)
completed: 2026-07-10
status: complete
---

# Phase 31 Plan 02: Style Board Regeneration & 5-Round Human Sign-off Summary

**Regenerated the 4-biome style board with the Swamp Hunter (all biomes) + Hell hound (castle) swaps, then carried it through 5 real human-review rounds — 3 of them surfacing genuine floor-alignment bugs that were fixed before the board was finally approved — closing the hard gate that Plans 31-04/31-05's asset baking waits on.**

## Performance

- **Duration:** ~6h wall-clock across 5 review rounds (not continuous active work — most of the elapsed time was waiting on human review between fix cycles)
- **Started:** 2026-07-10T13:55:28+02:00 (first regeneration commit, `af3f73c`)
- **Completed:** 2026-07-10T19:29:58+02:00 (final fix commit, `9443f7f`) + this SUMMARY
- **Tasks:** 2/2 (Task 1: regeneration; Task 2: checkpoint:human-verify, closed after 4 iterative sub-rounds)
- **Files modified:** 6 (`styleboard.py` + 5 regenerated PNGs)

## Accomplishments
- `styleboard.py`'s `ROOT` constant repointed at Plan 31-01's actual extraction tree (`assets/_gothicvania-src/`), replacing the non-existent `.../extracted/` path
- `town()`, `cemetery()`, `castle()` player sprite swapped from Gothic Hero to the Swamp Hunter's native `idle1.png` — the same character now appears standing in all 4 biome renders
- `castle()` enemy sprite swapped from the fire skull to the Hell hound idle sprite
- All 5 output PNGs (4 biome renders + 2×2 contact sheet) regenerated in place with no other compositing/tiling/badge logic touched
- Three real floor-alignment bugs found through iterative human review and fixed: castle player (`feet_y` 336→290), swamp player/spider/thing (new per-character `SWAMP_*_FEET_Y` constants), and castle Hell hound (bare `alpha_composite()` paste replaced with a proper `put_feet()`-anchored `CASTLE_HOUND_FEET_Y=258`)
- A genuine, 5-round, non-rubber-stamped human sign-off obtained and recorded verbatim below

## Task Commits

Each task/fix was committed atomically:

1. **Task 1: Regenerate style board with Swamp Hunter + Hell hound swaps** - `af3f73c` (feat)
2. **Round-2 fix: castle player floor alignment** - `94e6259` (fix)
3. **Round-3 fix: swamp floor alignment (player/spider/thing)** - `168d301` (fix)
4. **Round-4 fix: castle Hell hound floor alignment** - `9443f7f` (fix)

**Plan metadata:** this SUMMARY commit (docs)

_Note: Task 2 (checkpoint:human-verify) has no commit of its own — it is the review/decision gate that drove commits 2–4 above and is closed by this SUMMARY documenting the final approval._

## Files Created/Modified
- `.planning/research/v6-scouting/styleboard.py` - ROOT path repoint, player/enemy sprite swaps, three floor-alignment fixes with measured `*_FEET_Y` constants
- `.planning/research/v6-scouting/style-board-swamp.png` - regenerated (swap-neutral initially, then swamp floor-alignment fix)
- `.planning/research/v6-scouting/style-board-town.png` - regenerated with Swamp Hunter player
- `.planning/research/v6-scouting/style-board-cemetery.png` - regenerated with Swamp Hunter player
- `.planning/research/v6-scouting/style-board-castle.png` - regenerated with Swamp Hunter player + Hell hound enemy, then two floor-alignment fixes
- `.planning/research/v6-scouting/style-board-sheet.png` - regenerated 2×2 contact sheet, updated after every fix round

## Decisions Made
- Kept fixing and re-presenting rather than settling for "close enough" — each of the 3 real defects found during rounds 2–4 was treated as a genuine bug (measured against the actual source art) rather than dismissed as a minor visual quibble
- No new architectural change was needed for any of the 3 floor-alignment fixes — all were corrections to existing `feet_y`/anchoring literals, not new compositing logic

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Castle scene player floating below the walkable floor**
- **Found during:** Task 2, round 2 (first regenerated-board review)
- **Issue:** `castle()`'s hero `feet_y` was hardcoded at 336, placing the Swamp Hunter 46px below the visible door-ledge platform, in open void
- **Fix:** Measured the actual Old Dark Castle interior art's gold-trim top edge pixel-by-pixel (crop-local y=234, canvas y = 234 + top(56) = 290) and corrected `feet_y` to 290
- **Files modified:** `.planning/research/v6-scouting/styleboard.py`, `style-board-castle.png`, `style-board-sheet.png`
- **Verification:** Regenerated castle render visually confirmed player standing on the ledge; swamp/town/cemetery renders verified byte-identical (no regression)
- **Committed in:** `94e6259`

**2. [Rule 1 - Bug] Swamp scene characters floating slightly above the ground**
- **Found during:** Task 2, round 3
- **Issue:** `swamp()`'s player, spider, and "thing" were all anchored at the shared `FLOOR_Y=320`, which is the single highest grass-blade pixel across the whole repeating ground tile — not each character's actual local grass line
- **Fix:** Sampled the ground tile's real alpha data at each character's stance x (averaged across their sprite footprint), added `SWAMP_PLAYER_FEET_Y`/`SWAMP_SPIDER_FEET_Y`/`SWAMP_THING_FEET_Y` (offsets of +4px, +2px, +1px respectively from FLOOR_Y), repointed the three `put_feet()` calls
- **Files modified:** `.planning/research/v6-scouting/styleboard.py`, `style-board-swamp.png`, `style-board-sheet.png`
- **Verification:** Regenerated swamp render visually confirmed all 3 characters standing on the grass line; town/cemetery/castle renders verified byte-identical
- **Committed in:** `168d301`

**3. [Rule 1 - Bug] Castle Hell hound floating above the rope bridge**
- **Found during:** Task 2, round 4
- **Issue:** The Hell hound was placed with a bare `alpha_composite(hound, (430, 230))` top-left paste, bypassing `put_feet()`'s feet-anchoring entirely (unlike every other character in every scene), leaving it floating above the rope bridge it stands on
- **Fix:** Sampled the bridge deck's gold-trim top edge pixel-by-pixel across the hound's footprint width, added `CASTLE_HOUND_FEET_Y=258`, replaced the bare paste with a proper `put_feet()` call
- **Files modified:** `.planning/research/v6-scouting/styleboard.py`, `style-board-castle.png`, `style-board-sheet.png`
- **Verification:** Regenerated castle render visually confirmed hound standing on the bridge deck
- **Committed in:** `9443f7f`

---

**Total deviations:** 3 auto-fixed (all Rule 1 - bugs found via genuine human review, not scope creep)
**Impact on plan:** All 3 fixes were essential correctness fixes to the checkpoint's own subject matter (the style board's visual accuracy) — exactly the kind of defect a non-rubber-stamped human-verify round exists to catch. No unrelated scope was touched.

## Issues Encountered
None beyond the 3 floor-alignment bugs documented above, all resolved within this plan.

## Human Sign-off — Full 5-Round Record

This checkpoint (`checkpoint:human-verify`, Task 2) went through **5 real rounds** with substantive human feedback at each of rounds 2–4 — the opposite of a rubber stamp, consistent with this project's standing precedent (Phases 25/27/28: never auto-approve a `checkpoint:human-verify` gate).

**Round 1 (earlier, during discuss-phase, informal — NOT this plan's formal gate):**
Kid/parent feedback on the original pre-swap style board:
> "Can they not all be there, just different levels?"
> "The monster in the castle biome is ugly"

This fed directly into CONTEXT.md's locked decision to swap in the Swamp Hunter (all biomes) and Hell hound (castle) — it shaped what Task 1 built, but was explicitly NOT the formal execute-phase sign-off for the regenerated artifact.

**Round 2 (formal, this plan, first regenerated board shown):**
> "Looks good, except for the castle part, where the player position does not align to the floor och the background, as the base varies."

**NOT approved.** Led directly to the castle player floor-alignment fix (`94e6259`, `feet_y` 336→290, measured against the actual Old Dark Castle interior art).

**Round 3:**
> "ser även ut som du lagt golvnivån lite högt i swamp. Gubben svävar lite ovanpå marken." ("Also looks like you've put the floor level a bit high in swamp. The guy is floating a bit above the ground.")

**NOT approved.** Led directly to the swamp floor-alignment fix (`168d301`, per-character `SWAMP_*_FEET_Y` constants added).

**Round 4:**
> "I almost approved it, but the castle still needs some work. The weird dog is floating in the air on that ledge."

**NOT approved.** Led directly to the Hell hound castle floor-alignment fix (`9443f7f`, `CASTLE_HOUND_FEET_Y=258`, measured against the rope bridge deck).

**Round 5 (final):**
> "Looks good. Approved"

**GENUINE APPROVAL** — the parent's exact final verbatim quote, given after 3 real, substantive fix cycles across rounds 2–4. This sign-off covers both the biome/level structure (Swamp Hunter across all biomes, Hell hound in castle) locked at round 1, and all 3 floor-alignment bugs found and fixed through real iterative review at rounds 2–4.

**No rubber-stamping occurred at any point in this gate.** Plans 31-04/31-05's asset baking work is unblocked to proceed on the final, approved regenerated style board.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
The style board is regenerated, floor-alignment-verified, and genuinely signed off. Plans 31-04/31-05 (atlas/parallax/player/enemy baking) can proceed against the approved Swamp Hunter + Hell hound decisions with no open visual-accuracy concerns. No blockers.

Note (matching Plan 31-01's precedent): `ART-01` is not marked complete in REQUIREMENTS.md by this plan — it spans all 6 plans in this phase and is left untouched here.

---
*Phase: 31-asset-bake-style-board-sign-off*
*Completed: 2026-07-10*
