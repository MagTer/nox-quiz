---
phase: 29-mechanic-cleanup
verified: 2026-07-09T22:41:00Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 29: Mechanic Cleanup Verification Report

**Phase Goal:** The mechanics that didn't land are gone or fixed before anything gets dressed — collect-the-answer dies atomically, the affected levels get their math rhythm back, and finding a secret alcove actually feels like something
**Verified:** 2026-07-09T22:41:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Collect-the-answer mechanic is fully removed atomically (code, config, level data, harness fixtures) | VERIFIED | `src/mechanics/collect.js` deleted; `grep -c "COLLECT:" src/config.js` = 0; `collectZones`/`answerPickupSlots` absent from level-01/03/04/06/08 (and, per a review-pass fix WR-01, from level-02/05/07 too — commit `4204777`); `build.js`'s collect builder loops gone; `game.js` no longer imports/calls `wireCollect`; all 6 harness fixtures (`check-gate.sh` assertion #13, `smoke-progress.mjs` golden fixtures, `reachability.mjs`, `over-hole-check.mjs`, `mechanic-drive.mjs`, `check-import-safety.sh`) scrubbed — confirmed by direct grep, zero functional references remain repo-wide (only 3 harmless comment-only mentions: 2 removal-note comments in `smoke-progress.mjs`/`screenshot-phase26.mjs`, 1 deliberately-untouched RED-path fixture `scripts/fixtures/bad-level.js`). Single atomic commit `47b1912` confirmed via `git show --stat`. |
| 2 | Levels 01/03/04/06/08 retain their math rhythm (≥2 mid-level encounters + end gate) with zero new mechanic instances or XP-economy change | VERIFIED | Ran `node scripts/audit-phase21-mechanics.mjs` live (not trusted from SUMMARY): output shows exactly 5/4/6/3/4 door+mathGate+enemy encounters for level-01/03/04/06/08 respectively, all `triggered:true`/`resolved:true`, "AUDIT: ALL MECHANICS RESOLVED", exit 0. Confirmed via grep that only two XP-award call sites exist repo-wide: `game.js`'s `progress.addXp(table)` (goal clear) and `secretAlcove.js`'s `progress.addBonusXp(...)` — no door/gate/enemy mechanic calls `addXp`/`addBonusXp`, so collect removal cannot change earnable XP. |
| 3 | Touching a secret alcove produces a particle burst, chime, and rising "+5 XP" popup, exactly once per run, never pre-signposted | VERIFIED | `src/mechanics/secretAlcove.js`'s `onCollide` handler (read in full) calls `fx.pop(...)`, `fx.popupText(..., "+5 XP")`, and `audio.playSfx("pickup")` together, gated by a closure-local `found` Set (fire-once per scene) plus (per review fix CR-01) a `progress.hasSecretFound(levelId)` cross-run guard that prevents re-awarding XP on replay while still playing feedback. `fx.popupText` (new, `src/fx.js:145`) is a self-cleaning, world-space, tagged-"fx" tween effect — verified read in full, matches the `dust()` rise/fade idiom. Alcove is invisible in normal play (`opacity(0)` unless `?debug=1`), so never pre-signposted. Real human sign-off was recorded for the sensory "feels like something" judgment (commit `853c503`, checkpoint:human-verify, confirmed genuine per task context and consistent with the traced code path — not a rubber-stamp). |
| 4 | Level-select shows a positive-only star marker on levels with a found secret (no "0/1"/missing-secret framing), backed by a version-3 save that round-trips the new fact | VERIFIED | `src/scenes/select.js:175-185` renders `"★"` gated solely on `progress.hasSecretFound(t.id)`, purely additive (no negative/counter framing anywhere in the file — confirmed by full read of the tile-rendering block). `src/progress.js` gained `markSecretFound`/`hasSecretFound`, byte-for-byte mirroring `markCleared`/`isLevelCleared`; `serialize()`/`validate()` extended with the same no-spread, strict `=== true` named-key pattern already used for `cleared` (confirmed by full read). `CONFIG.SAVE.VERSION` = 3 (`src/config.js:191`). New `smoke-progress.mjs` "MECH-06" test block exercises fresh-false → mark → true (per-id-isolated) → serialize → reseed-round-trip; ran `node scripts/smoke-progress.mjs` live — PASS. Human sign-off (commit `853c503`) additionally confirmed the marker survives a real page reload. |

**Score:** 4/4 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/mechanics/collect.js` | deleted | VERIFIED | `test -f` confirms absent |
| `CONFIG.COLLECT` (src/config.js) | removed | VERIFIED | grep count 0 |
| `collectZones`/`answerPickupSlots` (level-01/03/04/06/08) | removed | VERIFIED | grep count 0 for each |
| `src/levels/build.js` collect builder loops | removed | VERIFIED | grep count 0 for collect-zone/pickup-slot patterns |
| `src/progress.js` `markSecretFound`/`hasSecretFound` | added, mirrors `markCleared`/`isLevelCleared` | VERIFIED | Full file read — exact byte-shape match confirmed |
| `src/fx.js` `popupText(at, label)` | new self-cleaning world-space effect | VERIFIED | Full function read — self-cleaning tween, tagged "fx", world-space (no `fixed()`) |
| `CONFIG.SAVE.VERSION === 3`; `CONFIG.FX.XP_POPUP_*`; `CONFIG.SELECT.SECRET_*` | present | VERIFIED | All confirmed via grep in `src/config.js` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/scenes/game.js` | `src/mechanics/secretAlcove.js` | `wireSecretAlcove({ player, progress, hud, levelId: level.id, save: ... })` | WIRED | Confirmed at `game.js:280`; `levelId` and a `save` callback (the CR-02 fix) both threaded through |
| `src/scenes/select.js` | `src/progress.js` | `progress.hasSecretFound(t.id)` gates the star-marker render | WIRED | Confirmed at `select.js:175` |
| `src/mechanics/secretAlcove.js` | `src/fx.js` / `src/audio.js` | `fx.pop`/`fx.popupText`/`audio.playSfx("pickup")` called in the `onCollide` handler | WIRED | Confirmed by full-file read; `"pickup"` SFX asset (`assets/sfx/pickup.ogg`) still loaded in `main.js:131`, vacated by collect.js's deletion as planned |
| `scripts/browser-boot.mjs` / `scripts/audit-phase21-mechanics.mjs` | `CONFIG.SAVE.VERSION` | seeded `SAVE_BLOB` literals kept at `version: 3` | WIRED | Live-run of both scripts (not trusted from SUMMARY) exits 0; `screenshot-phase26.mjs`'s independently-discovered stale `version: 2` (review finding WR-05) was fixed in commit `4b85b0d` |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full 7-command gate suite | `check-gate.sh`, `check-safety.sh`, `check-import-safety.sh`, `check-progress.sh`, `validate-levels.mjs`, `browser-boot.mjs`, `audit-phase21-mechanics.mjs` | All exit 0; audit shows 31 encounters, all `triggered:true`/`resolved:true`, zero answer-zone/collect encounters attempted | PASS |
| `smoke-progress.mjs` MECH-06 round-trip test | `node scripts/smoke-progress.mjs` | `smoke-progress: PASS` | PASS |
| Debt-marker scan on all phase-touched files | `grep -E "TBD\|FIXME\|XXX"` across the 25-file review file list | zero hits | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MECH-01 | 29-01 | Collect-the-answer removed atomically | SATISFIED | Truth 1, atomic commit `47b1912` |
| MECH-02 | 29-01 | Math pacing rebalanced, XP economy re-checked | SATISFIED | Truth 2, live audit run |
| MECH-03 | 29-02 | Alcove discovery feedback (burst+chime+popup), one-shot | SATISFIED | Truth 3, code trace + human sign-off |
| MECH-06 | 29-02 | Level-select positive-only secret marker, version-bumped save | SATISFIED | Truth 4, code trace + live smoke test + human sign-off |

No orphaned requirements: REQUIREMENTS.md's traceability table assigns exactly MECH-01/02/03/06 to Phase 29, matching both plans' `requirements:` frontmatter exactly. MECH-04 and MECH-05 are explicitly out of scope for this phase (assigned to Phase 30 and a later Motion phase respectively per REQUIREMENTS.md's traceability table) and per 29-CONTEXT.md's phase boundary — correctly not attempted here.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/levels/build.js:61-63` | — | Stale "answer zones, pickup slots" debug-overlay comment (collect.js was deleted; overlay no longer renders anything of the kind) | Info | Documentation-only, zero functional impact — code review (29-REVIEW.md, IN-04) explicitly scoped this as info-level and out of the fix pass |
| `src/levels/level-05.js:6` | — | Stale "enemy/collectZone" header comment | Info | Documentation-only — code review IN-05, same rationale |
| `scripts/lib/mechanic-drive.mjs` | 31,108,127,133,148,159-161 | Stale collect-mechanic prose inside the explicitly-deprecated, zero-callers `driveToXClimbing` function | Info | Dead code kept for historical reference only — code review IN-06 |

All three are pre-identified, info-level (not warning/blocker) findings from `29-REVIEW.md`, explicitly and correctly left out of the `29-REVIEW-FIX.md` fix scope (`fix_scope: critical_warning`). No TBD/FIXME/XXX debt markers found in any phase-touched file. Both genuine BLOCKER findings (CR-01 XP-farming, CR-02 lost-on-Escape) from the first review iteration and both WARNING findings from the second iteration (WR-05 stale save version in `screenshot-phase26.mjs`, WR-06 stale docstring in `secretAlcove.js`) were verified fixed in the current tree (traced directly, not trusted from REVIEW-FIX.md's claims) — see Truths 1, 3 evidence above and the `secretAlcove.js` full-file read.

## Deferred Items

None applicable — MECH-04 and MECH-05 were never in this phase's scope (29-CONTEXT.md's phase boundary explicitly excludes them, routing to Phase 30 and a later phase respectively) and REQUIREMENTS.md's traceability table confirms the routing.

## Human Verification Required

None. The sensory/visual truths that would normally require human judgment (MECH-03's "feels like something" burst+chime+popup, MECH-06's "no negative framing" + reload persistence) already received a genuine, non-rubber-stamped human sign-off during phase execution (commit `853c503`, `checkpoint:human-verify` gate), and this verification independently traced the underlying code to confirm it matches exactly what was signed off on.

## Gaps Summary

No gaps. All 4 observable truths verified directly against the current codebase (not from SUMMARY claims): collect-the-answer is fully and atomically gone (single commit, zero functional residue anywhere in `src/`/`scripts/`), the 5 affected levels' math rhythm is confirmed unchanged via a live interactive-audit run (5/4/6/3/4 encounters, all triggered+resolved), the secret alcove now fires real multi-sensory discovery feedback with anti-farming and anti-loss guards (both traced in the live `secretAlcove.js` source), and level-select shows a positive-only star marker backed by a version-3 save that round-trips through a live-run smoke test. The full 7-command gate suite and the code-review's two BLOCKER + four WARNING findings are all confirmed fixed in the current tree, not merely claimed in SUMMARY/REVIEW-FIX documents. Three residual info-level documentation-staleness items remain, correctly scoped out of this phase's fix pass by the review process itself.

---

*Verified: 2026-07-09T22:41:00Z*
*Verifier: Claude (gsd-verifier)*
