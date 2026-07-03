---
phase: 13-fresh-save-format-level-registry-data
verified: 2026-06-29T00:00:00Z
status: passed
human_verification_result: passed (2026-06-29 — kid's-dad browser boot)
score: 8/8 must-haves verified (automated) + 3/3 human-verify items passed
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Real-browser boot of the data spine (13-04 Task 3, checkpoint:human-verify, gate=blocking). Serve over HTTP (python3 -m http.server 8000 → http://localhost:8000/). Confirm level-01 renders from the registry (floor/platforms/coins/spikes/goal — NOT a blank/loading-stuck screen). Play it: merged-floor feel intact (no seam-stick), spikes kill only on a real points touch. Reach goal, answer the math gate to clear."
    expected: "Game boots to a visible level-01 with the merged-floor/spike feel intact; the level clears on a correct answer at the goal."
    why_human: "a727c13 import-time-global regressions surface ONLY in a real browser after kaplay({global}) runs — greps and node import cannot see them. Collider/spike 'feel' is a visual/physics judgment. This is the most expensive v3.0 lesson (greps ≠ boots); the executor deliberately did not launch a browser."
  - test: "Persistence under the new key across a reload. DevTools → Application → Local Storage: confirm key mathlab_platformer_v2 holds JSON with a levels object marking level-01 cleared:true plus xp/level/accuracy/history; the old mathlab_platformer_v1 key (if present) is NOT read or modified. Reload the page and confirm the cleared fact + xp/level survive."
    expected: "mathlab_platformer_v2 exists with levels['level-01'].cleared===true and survives a reload; v3.0 key untouched."
    why_human: "Runtime localStorage write/read + reload persistence cannot be exercised headlessly (node has no localStorage; createProgress is pure-by-design). The round-trip is proven against in-memory blobs by the smoke, but the live browser write→reload→read path is unverified by code."
  - test: "Corrupt-save-never-bricks (live). In DevTools console set localStorage.mathlab_platformer_v2 to a junk string (e.g. \"not json\"), reload, and confirm the game still boots to safe defaults."
    expected: "A junk save string never bricks boot — the game loads to safe defaults."
    why_human: "The never-brick guards are unit-proven in the smoke (Infinity/junk/foreign/__proto__ via JSON.parse), but the live loadSave→boot path through a corrupt localStorage entry is a browser-only behavior."
---

# Phase 13: Fresh Save Format + Level Registry/Data Verification Report

**Phase Goal:** A fresh, versioned, clean-reset save format (per-level completion/unlock + XP/level/practice-history) and a pure level registry + parameterized builder are in place — the data spine every later phase consumes, with zero engine (a727c13) risk.
**Verified:** 2026-06-29
**Status:** passed (automated 8/8 + human browser boot validated 2026-06-29)
**Re-verification:** No — initial verification

## Human Verification Result (2026-06-29)

All 3 blocking browser-boot items passed in a live HTTP-served browser session:
1. **Boot + render + feel** — PASS. level-01 renders from the registry and "looks the same as last time" (merged-floor/spike feel intact; no a727c13 import-time regression).
2. **Persistence under the new key** — PASS. localStorage `mathlab_platformer_v2` held `{version:2, xp:40, level:1, levels:{level-01:{cleared:true}}, accuracy:{...}, history:{6:[true],9:[true]}}` and survived reload; no v1 key written.
3. **Corrupt-save-never-bricks** — PASS. Broken JSON in the save key did not block reload; game booted to safe defaults.

Note: "No second level yet — everything stops after the first level" is the EXPECTED Phase 13 boundary (data spine only; level-select is Phase 14, additional levels Phase 17). Not a gap.

## Goal Achievement

Every automated must-have is VERIFIED in the codebase. Both project gates run green in this verifier's own process. The ONE outstanding item is the blocking `checkpoint:human-verify` real-browser boot (13-04 Task 3), which the executor intentionally did not perform (documented as pending in 13-04-SUMMARY.md). Per the goal's "zero a727c13 risk" clause and the success criteria's runtime-persistence assertions, the live boot is required to certify the data spine end-to-end — automated checks cannot substitute for it. Status is therefore `human_needed`, not `passed`.

### Observable Truths (Roadmap Success Criteria + Plan must_haves)

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | SC1/SAVE-05: fresh versioned save under a NEW key; v3.0 NOT migrated; missing/stale/foreign/corrupt loads safe defaults, never bricks | ✓ VERIFIED (code) | config.js:87-88 KEY="mathlab_platformer_v2" VERSION=2; progress.js loadSave() version-gate + try/catch + storageAvailable() defaults() on every failure path; createProgress Number.isFinite guards reject Infinity/NaN; validate() copies only named keys (no spread). Smoke SAVE-05 cases pass (Infinity, junk-id, foreign blob, __proto__ via JSON.parse). NO mathlab_platformer_v1 anywhere in src/+scripts/. Live boot/reload behavior → human. |
| 2 | SC2/SAVE-06: per-level `cleared` persists; `unlocked` DERIVED from LEVEL_ORDER, never stored | ✓ VERIFIED (code) | progress.js: closure `cleared` map + isLevelCleared/markCleared; serialize() emits only `{cleared:true}` (no `unlocked` field). index.js isUnlocked() derives from LEVEL_ORDER.indexOf + predecessor cleared; WR-01 null-progress guard present. Smoke SAVE-06 round-trip + derived-unlock cases pass. Live reload persistence → human. |
| 3 | SC3/SAVE-07: XP/level + per-table history persist under the new key; seed the (unchanged) brain | ✓ VERIFIED (code) | progress.js serialize() carries version/xp/level/accuracy/history + levels; validate() range-checks accuracy(1..9,0..1)/history. brain.js createBrain accepts seedAccuracy/seedHistory; nextQuestion threads allowedTables via validated closure allowedSet — LOCKED weighting formulas untouched. brain13 probes pass ([6,7]→only 6,7; [99,100]→sanitized to all-9). Cross-visit persistence → human. |
| 4 | SC4/LVL-02: plain-JS level data + ONE parameterized builder + ordered registry; v3.0 lifts verbatim as level-01; no build step / addLevel / Tiled | ✓ VERIFIED (code) | src/levels/{index,build,level-01}.js exist. buildLevel(levelData) reads levelData.geometry. LEVEL_ORDER/getLevel/isUnlocked exported. Smoke LVL-02 regression deep-equals geometry vs v3.0; confirmed byte-for-byte against git fa44246^:src/level.js. No real addLevel (only a "do NOT use addLevel" comment). |
| 5 | a727c13 firewall: level-01.js + index.js reference NO engine globals at top level; build.js keeps Rect guard INSIDE buildLevel body | ✓ VERIFIED (code) | Comment-stripped grep: zero engine globals in level-01.js and index.js. build.js `typeof Rect` guard at line 46, AFTER `export function buildLevel` (line 38) — inside the body. Live import-time check → human (boot). |
| 6 | Descriptor carries id/displayName/geometry/allowedTables + unset mechanics/theme/parallax | ✓ VERIFIED (code) | level-01.js:22-106 — id "level-01", displayName, allowedTables [6,7,8,9], geometry{floors,platforms,coins,spikes,goal,checkpoints}, mechanics:[], theme:null, parallax:null. |
| 7 | game.js loads by id from registry + builds via buildLevel; checkpoint read-site moved to level.geometry.checkpoints | ✓ VERIFIED (code) | game.js:23-24 registry imports; :65 getLevel(data?.levelId ?? LEVEL_ORDER[0]); :85 buildLevel(level); :101 for(const cp of level.geometry.checkpoints). |
| 8 | On clear, markCleared(level.id) persists via writeSave(serialize(snapshot)) in one write; src/level.js deleted; no import references it | ✓ VERIFIED (code) | game.js:180 markCleared after addXp, :194 writeSave(progress.serialize(...)). src/level.js DELETED (fa44246); grep across all src/ files = 0 old-path imports. Live cleared-persists-on-clear → human. |

**Score:** 8/8 must-haves verified (automated). 0 behavior-unverified. The runtime/persistence behaviors of truths 1–3, 5, 8 are present + wired in code and unit-proven against in-memory blobs, but their live browser manifestation is routed to the mandatory human boot below (consistent with the phase's own blocking checkpoint design — not counted as a code gap).

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/config.js` | CONFIG.SAVE new key/version | ✓ VERIFIED | KEY="mathlab_platformer_v2", VERSION=2; leaf module, no imports |
| `src/progress.js` | levels cleared-map + helpers + serialize/validate branches | ✓ VERIFIED | markCleared/isLevelCleared, levels in defaults/validate/serialize; imports only ./config.js |
| `src/levels/index.js` | LEVEL_ORDER, getLevel, isUnlocked (derived) | ✓ VERIFIED | 3 exports; pure; no engine/localStorage; WR-01 guard |
| `src/levels/build.js` | buildLevel(levelData), Rect guard in body | ✓ VERIFIED | export function buildLevel; merged-floor isStatic; SPIKE_HITBOX; guard in body; no addLevel |
| `src/levels/level-01.js` | verbatim v3.0 geometry in descriptor | ✓ VERIFIED | byte-equal to git fa44246^:src/level.js; pure data; ../config.js import |
| `src/scenes/game.js` | registry-driven load + cleared-persist | ✓ VERIFIED | registry imports, getLevel, buildLevel(level), markCleared, geometry.checkpoints |
| `src/math/brain.js` | allowedTables threaded | ✓ VERIFIED | createBrain accepts allowedTables; sanitized closure allowedSet; formulas untouched |
| `scripts/smoke-progress.mjs` | SAVE-05/06/07 + LVL-02 cases | ✓ VERIFIED | 28 requirement-tagged checks; LVL-02 deep-equal regression; PASS |
| `scripts/check-progress.sh` | new key + registry + import-safety greps | ✓ VERIFIED | greps v2 key (no v1), registry files, levels seam, negative engine-global grep; PASS |

### Key Link Verification

| From | To | Via | Status |
| ---- | -- | --- | ------ |
| game.js | levels/index.js | getLevel + LEVEL_ORDER load-by-id | ✓ WIRED (line 23, 65) |
| game.js | levels/build.js | buildLevel(level) at scene time | ✓ WIRED (line 24, 85) |
| game.js | progress.js | markCleared(level.id) + writeSave(serialize) | ✓ WIRED (line 180, 194) |
| progress.js | config.js | CONFIG.SAVE.KEY/VERSION | ✓ WIRED (single ./config.js import) |
| index.js | level-01.js | imports LEVEL_01 for registry | ✓ WIRED (line 14) |
| build.js | config.js | ../config.js (two-dot depth) | ✓ WIRED (line 28) |
| brain.js | (closure) | allowedTables → allowedSet → calculateWeights | ✓ WIRED (line 60-71, 140-142) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Node smoke gate | `node scripts/smoke-progress.mjs` | smoke-progress: PASS (exit 0) | ✓ PASS |
| Structural gate | `bash scripts/check-progress.sh` | progress checks: PASS (exit 0) | ✓ PASS |
| allowedTables restricts pool | createBrain({allowedTables:[6,7]}) ×300 | only 6,7 | ✓ PASS |
| Out-of-range pool sanitized (WR-02) | createBrain({allowedTables:[99,100]}) ×300 | all 1..9, no 99/100 | ✓ PASS |
| isUnlocked null-progress guard (WR-01) | isUnlocked('level-01', null/undefined) | true (no throw) | ✓ PASS |
| level-01 descriptor probe | id/floors(3)/checkpoints(4)/allowedTables | OK | ✓ PASS |
| Geometry verbatim vs v3.0 | git fa44246^:src/level.js diff | byte-identical | ✓ PASS |
| Real-browser boot/play/persist/reload | serve + manual | NOT RUN | ? SKIP → human |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| SAVE-05 | 13-01,02 | Fresh versioned save; no migration; never bricks | ✓ SATISFIED (code; live boot → human) | Truth 1 |
| SAVE-06 | 13-01,02,03,04 | Per-level cleared persists; unlock derived | ✓ SATISFIED (code; live reload → human) | Truth 2 |
| SAVE-07 | 13-01,02,04 | XP/level/history persist; seed brain | ✓ SATISFIED (code; cross-visit → human) | Truth 3 |
| LVL-02 | 13-01,03,04 | Plain-JS data + builder + registry; verbatim level-01 | ✓ SATISFIED | Truth 4 |

All 4 declared requirement IDs are accounted for in REQUIREMENTS.md (lines 17, 45-47), each mapped to Phase 13 and marked Complete (lines 85, 101-103). No orphaned requirements: REQUIREMENTS.md line 115 lists exactly SAVE-05/06/07/LVL-02 for Phase 13 — every ID appears in at least one plan's frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | None | — | No TBD/FIXME/XXX/HACK/TODO/PLACEHOLDER debt markers in any modified file. No stub returns, no hollow data, no orphaned artifacts. |

### Human Verification Required

The blocking real-browser boot (13-04 Task 3) is the single outstanding item — see frontmatter `human_verification` for the three concrete checks: (1) boot + render + merged-floor/spike feel, (2) persistence under mathlab_platformer_v2 across a reload, (3) corrupt-save-never-bricks live. The orchestrator must route this for manual testing (resume signal "approved").

### Gaps Summary

No code gaps. All 8 automated must-haves VERIFIED; both gates green; geometry byte-verbatim; a727c13 firewall holds; key bump clean (zero v1 references); unlock derived-not-stored; all REVIEW findings (WR-01..04, IN-01..03) confirmed fixed in the code. The phase is code-complete and correctly self-reports the mandatory browser boot as pending. Status `human_needed` reflects that the goal's runtime-persistence and zero-a727c13-risk guarantees require the live boot that greps cannot substitute for.

---

_Verified: 2026-06-29_
_Verifier: Claude (gsd-verifier)_
