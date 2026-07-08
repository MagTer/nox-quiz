# Phase 28: Full Verification & Interactive Sign-off - Context

**Gathered:** 2026-07-08
**Status:** Ready for planning

<domain>
## Phase Boundary

The milestone-closing verification phase for v5.0. Every v5.0 claim gets backed by interactive proof: the automated gate suite runs green in one consolidated pass, and a genuine human sign-off (not a rubber stamp) is recorded for levels, per-level themes, logo, and audio in the running game. This phase does NOT build new features, does NOT re-litigate already-accepted deferred issues, and does NOT re-derive audit coverage that Phase 25/27 already proved — it closes VALID-03, the one remaining "Pending" requirement in REQUIREMENTS.md.

</domain>

<decisions>
## Implementation Decisions

### Audit & Gate Consolidation Scope
- Do NOT re-run the full interactive mechanic audit across all 8 levels from scratch. Cite Phase 25's 36/36-triggered result (25-FINDINGS.md (b)) and Phase 27's re-confirmation as satisfying evidence for ROADMAP criterion 1; reference them explicitly in 28-VERIFICATION.md rather than re-deriving.
- DO re-run the cheaper automated gates fresh, in one consolidated pass, this phase: `node scripts/browser-boot.mjs`, `node scripts/validate-levels.mjs`, `bash scripts/check-safety.sh` (ROADMAP criterion 2 explicitly asks for "green in one run").
- `secretAlcove`'s known audit/validator blind spot does NOT block Phase 28 closure — it's an accepted by-design gap (see STATE.md pending todo `2026-07-07-add-automated-coverage-for-secretalcove-mechanic.md`). Do not build new coverage for it in this phase.
- The `docs/LEVEL-DESIGN.md` SOFT-rules review pending todo (`2026-07-07-review-levels-against-level-design-rules.md`) stays OUT of scope — user marked it "down the road, not urgent."
- The `reachability.mjs` WARN-tier precision gap stays unaddressed — documented non-blocking (no false PASS/HARD-FAIL), not required for gate-green.

### Fresh-Incognito Playthrough & Save-Resume Criterion
- ROADMAP's success criterion 3 ("a pre-rebrand save still resumes on the rebranded build") is SUPERSEDED and must be treated as stale, not literally executed. Phase 26 intentionally renamed the save key (`mathlab_platformer_v2` → `noxrun_platformer_v1`) with explicit user sign-off that no migration/resume is required (REQUIREMENTS.md BRAND-02, amended 2026-07-07; PROJECT.md Key Decisions). No migration path was ever built by design.
- Instead, verify a FRESH save under the CURRENT key (`noxrun_platformer_v1`) persists and resumes correctly across reload — that's the criterion that actually matters now.
- Document this supersession explicitly in 28-VERIFICATION.md (which ROADMAP clause, why it's stale, what was verified instead) rather than silently dropping or silently reinterpreting it.
- Do NOT attempt any old-save-key compatibility/crash-safety check — skip entirely, not even a light-touch check. No migration exists; this isn't being tested.
- "Fresh-incognito" for the audio-starts-on-first-gesture criterion means: an automated Playwright fresh-context/clean-storage proof for the mechanical part (the gesture-gated `ensureMusicPlaying()` call chain is already code-verified in 27-VERIFICATION.md — this phase's job is a fresh confirming run, not new proof), PLUS folding the real listen-and-confirm into the human sign-off checklist (a human actually hearing it start on first press, not just a boolean assertion).

### Human Sign-off Scope & Format
- ONE consolidated final human sign-off checkpoint covering levels + per-level themes + logo + audio together, done in the running game. Each piece already got its own dedicated sign-off in Phases 26 (visuals/logo) and 27 (audio) — this pass is a holistic "does the finished game feel right end-to-end" review, not a re-litigation of already-approved pieces.
- Scope of the human playthrough: full start→goal on ALL 8 levels, not a spot-check subset — matches ROADMAP criterion 1 ("all eight levels provably completable") and the project's standing "checks that don't play the game lie" rule.
- Known non-blocking issues are NOT re-raised for a new decision during this sign-off — they are already accepted as deferred. List them explicitly in 28-VERIFICATION.md as known-accepted so the milestone audit doesn't flag them as newly-discovered gaps:
  - Unreachable pickups/ledges in levels 5-8, level-07/08 end-climb repetition (25-UAT.md, accepted 2026-07-07)
  - secretAlcove discoverability/value complaint (pending todo, not actioned this milestone)
  - "n0x" logo wordmark shortening ask (deferred mid-Phase-27, needs clarification, not part of this milestone)
  - 999.1 (collect-the-answer mechanic reconsideration) and 999.2 (pink spike hazard sprite) — backlog items, explicitly out of Phase 28's scope
- If the human sign-off surfaces a genuinely NEW blocking issue (not among the above known-accepted ones): follow the established Phase 26/27 pattern — fix inline if small and in-boundary, capture as backlog if it's a bigger design question (mirrors FIX-02's precedent from Phase 22).

### Claude's Discretion
None — all grey areas for this phase were resolved above.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/audit-phase21-mechanics.mjs` — interactive mechanic audit driver; already iterates dynamically over `LEVEL_ORDER` (all 8 levels), not hardcoded to 4. Not being re-run fresh this phase per the decision above, but available if a spot-check is ever needed.
- `scripts/validate-levels.mjs` — static structural validator (spawn→goal reachability, gap widths vs calibrated jump envelope, door-over-hole, mechanic reachability). REQUIRED to be re-run green.
- `scripts/browser-boot.mjs` — real-browser boot + drive across all levels; already has audio-element-count assertions (≤1 at 4 scene-transition stops) and functional M-key mute-toggle (`getVolume()`) proof from Phase 27. REQUIRED to be re-run green.
- `scripts/check-safety.sh`, `check-import-safety.sh`, `check-gate.sh`, `check-progress.sh`, `check-audio.sh`, `check-rebrand.sh` — the existing shell-gate suite; ROADMAP criterion 2 names `check-safety.sh` explicitly but the others are cheap and should run too as part of "one run" gate consolidation.
- `scripts/lib/route-planner.mjs` — geometry-informed jump-takeoff planner the audit and validator both use; not being modified this phase.

### Established Patterns
- Human sign-off checkpoints in this project are genuine multi-round reviews, never rubber-stamped — see `never-rubber-stamp-checkpoints` precedent (Phase 25) and Phase 27's 5-round iterative sound sign-off. Expect the same rigor here: real playthrough, real listening, specific quotes recorded verbatim in the closing SUMMARY.
- VERIFICATION.md documents superseded/stale ROADMAP clauses explicitly (with the "why") rather than silently dropping or reinterpreting them — see 27-VERIFICATION.md's footnote on the removed land SFX for the pattern to follow with the stale save-resume clause.
- Deferred/accepted gaps get an explicit note in VERIFICATION.md's "Note (informational, not a gap)" style rather than being silently omitted or counted as failures.

### Integration Points
- Dev server: `python3 -m http.server 8000` from the repo root (not `src/`), browse to `http://localhost:8000/src/index.html`.
- `?debug=1` query param renders normally-invisible entities (colliders, gates, secret alcoves) for playtesting — display-only, not for production.
- Current save key: `CONFIG.SAVE.KEY = "noxrun_platformer_v1"` (`src/config.js:211`). Mute key is separate: `CONFIG.AUDIO.MUTE_STORAGE_KEY = "noxrun_mute_v1"`.

</code_context>

<specifics>
## Specific Ideas

No specific implementation references beyond the decisions above — this is a verification/closure phase, not a build phase. The "how" of driving levels/gates/audio already exists in prior phases' tooling.

</specifics>

<deferred>
## Deferred Ideas

- LEVEL-DESIGN.md SOFT-rules review across all 8 levels — stays a pending todo, not Phase 28 scope.
- secretAlcove automated coverage (audit + validator) — stays a pending todo, not Phase 28 scope.
- reachability.mjs WARN-tier precision improvement — stays a documented non-blocking gap.
- Unreachable pickups/ledges (levels 5-8), level-07/08 end-climb repetition — already accepted as deferred in Phase 25; carried forward untouched.
- secretAlcove discoverability/value redesign — pending todo, not actioned this milestone.
- "n0x" logo wordmark shortening — deferred mid-Phase-27, needs clarification before scoping; not part of Phase 28.
- 999.1 (collect-the-answer mechanic reconsideration) and 999.2 (pink spike hazard sprite) — backlog items, explicitly out of scope for this milestone's closing phase.

</deferred>
