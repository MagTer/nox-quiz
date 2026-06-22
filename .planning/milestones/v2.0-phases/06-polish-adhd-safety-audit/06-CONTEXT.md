# Phase 6: Polish + ADHD Safety Audit - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 is the final polish pass before v2.0 ships. Three concrete deliverables:

1. **Flavor text replacement** — swap PLACEHOLDER lines in the FLAVOR arrays (Goblin, Skeleton, Dragon, Dragon Lord) with final, edgy-menacing copy; 3 lines per enemy; rotation guard already in place
2. **ADHD safety audit** — verify all five unsafe patterns are absent: (a) no timer of any form, (b) no XP/level loss on death, (c) wrong-answer damage cap checked with 10 consecutive wrong answers, (d) all animations ≤500ms, (e) death screen has zero comparison stats
3. **RPG copy text search** — confirm no occurrence of "correct", "wrong", "answer", or "question" appears in any dungeon-mode screen text (audit scoped to dungeon panels only; v1 quiz panel is intentionally untouched)

Migration verification (SC-4) is a manual browser test — the CONTEXT flags it as a verification checkpoint, not a code change.

No new modules, no DOM changes, no new CSS. Phase 6 edits only the FLAVOR arrays and verifies the existing implementation.

</domain>

<decisions>
## Implementation Decisions

### Flavor Text Tone and Count
- **Tone**: Edgy and menacing — enemies feel genuinely threatening; taunting, intense, cool-dark; matches grunge aesthetic; defeating them feels rewarding
- **Count**: 3 lines per enemy type — rotation guard already guarantees no immediate repetition; 3 is tight and sufficient for 5-room floors
- **Enemy types covered**: Goblin, Skeleton, Dragon (regular), Dragon Lord (final boss) — all 4 FLAVOR keys get new lines
- No expansion of Dragon to 5 lines — keep it symmetric

### RPG Copy Audit Scope
- Audit scoped to **dungeon panel screens only** — v1 quiz panel ("Choose the correct answer") is visible only in `data-screen="quiz"` and is intentionally untouched
- Forbidden words check: "correct", "wrong", "answer", "question" must not appear in any text node rendered by dungeon panels or DungeonRenderer at runtime
- CSS class names (`.correct`, `.wrong`) are NOT display text — excluded from the audit
- JS variable names and comments are NOT display text — excluded from the audit

### ADHD Safety Audit
- **Timer check**: `setTimeout` calls at lines 1611, 1812, 1871, 1884 must be verified as pure transition delays (fixed ms, no countdown UI) — they are acceptable if they have no visual countdown
- **XP/level loss**: `DungeonState.init()` must reset only HP/loot; `PlayerState` XP and level must be unchanged — verify code-level, not just behavioral
- **Damage cap**: CONFIG.DUNGEON.DAMAGE_WRONG = 8, PLAYER_HP = 100 → 5 wrong answers = 40 damage → 60 HP remaining. SC-5 assertion already in code; verify it passes in browser
- **Animation timing**: `setTimeout` durations in CombatInputHandler (feedback pause) must be ≤500ms
- **Death screen**: Static HTML — "You Fell" + "The dungeon claims another soul." — zero stats; confirmed in code review

### Claude's Discretion
- Exact wording of the 3 flavor lines per enemy (content is at Claude's discretion within the edgy/menacing tone)
- Whether to add a brief console verification log for migration test or leave it entirely browser-manual
- Order of ADHD checklist items in VERIFICATION.md

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FLAVOR` object at line 1467 — 4 keys (Goblin, Skeleton, Dragon, Dragon Lord); replace the 3 placeholder lines per key
- `getFlavorText(enemyName)` at line 1495 — rotation guard (do-while loop) already works; no changes needed
- `DungeonRenderer.showFeedback()` at line 1619 — used for combat copy; already outputs "Attack!", "Critical hit!", "You took a hit!"
- `DungeonState.init(floorNumber)` at line 1430 — Phase 6 must verify it does NOT touch PlayerState

### Established Patterns
- All flavor text uses `textContent` (never `innerHTML`) — enforce same for new lines
- No timer UI exists anywhere — `setTimeout` calls are invisible transition delays, not displayed countdowns
- Death screen HTML is static (lines 586–591); Phase 6 confirms it has no dynamic stats injection

### Integration Points
- FLAVOR arrays (lines 1468–1491) — only code change in Phase 6 (swap placeholder lines)
- VERIFICATION.md — Phase 6 writes a detailed ADHD checklist result and RPG copy audit result
- No new HTML, CSS, or JS modules required

</code_context>

<specifics>
## Specific Ideas

- ADHD safety checklist output should be explicit per-item PASS/FAIL with evidence (line reference or test result)
- The migration SC-4 should be called out as "requires browser test with real v1 localStorage key" — not automatable in code
- Flavor lines should feel like the enemy is "sizing you up" — threatening and cool, not cartoonishly evil

</specifics>

<deferred>
## Deferred Ideas

- Expanding Dragon flavor lines to 5 (3 is enough per decision)
- Audio feedback / sound effects (v3 candidate per REQUIREMENTS.md)
- Dungeon map room-grid visual (noted in Phase 5 CONTEXT as potential Phase 6 polish — descoped; keep lean)
- Cosmetic loot / visual skins — v3

</deferred>
