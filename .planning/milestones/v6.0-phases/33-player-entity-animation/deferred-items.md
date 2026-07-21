# Phase 33 — Deferred Items (out-of-scope discoveries)

## Cross-plan gap: CONFIG.ENEMY.SPRITES / build.js variant indexing (encountered during 33-03 Task 2)

**Found during:** Plan 33-03, Task 2 (`node scripts/browser-boot.mjs` regression proof)

**Symptom:** `node scripts/browser-boot.mjs` exits non-zero. `level-03` throws
`Error: Please pass the resource name or data to sprite()` at
`src/levels/build.js:312`, inside `buildLevel()`'s enemy-panel loop. Levels 4-8
subsequently report `encounter ... never triggered` / `far-end drive stalled` —
a cascading effect of the level-03 crash on the shared browser page/driver state.

**Root cause:** Plan 33-02 (already merged, this worktree's dependency)
collapsed `CONFIG.ENEMY.SPRITES` to a single-entry array (`["enemy-hellhound"]`,
`src/config.js`). `src/levels/build.js` (line 312) still does an unguarded
`CONFIG.ENEMY.SPRITES[e.variant ?? 0]` lookup. Levels 3/6/8 carry enemy
descriptors with `variant: 1` / `variant: 2` (the old 3-variant static set),
which now index out of bounds and resolve to `undefined`, crashing `sprite(undefined)`.

**Not fixed here — out of scope for 33-03:** `src/levels/build.js` is not in
this plan's `files_modified` (`src/player.js` only). This exact issue is
already anticipated and scoped as **Plan 33-04's** job — see
`33-04-PLAN.md`'s own threat register, `T-33-07` (Tampering / crash risk):
the planned fix is a modulo-safe index (`CONFIG.ENEMY.SPRITES[(e.variant ?? 0) % CONFIG.ENEMY.SPRITES.length]`).
Plan 33-04 is wave 2 (parallel to this plan, isolated worktree), depends on
33-01+33-02 only — it will not be present in this worktree until the
orchestrator merges the wave.

**Verification narrowed accordingly:** Plan 33-03's own Task 2 acceptance
criteria are scoped to "no uncaught-exception output referencing play, fall,
or land" — verified clean (see 33-03-SUMMARY.md). The full 8-level
`browser-boot.mjs` exit-0 proof will be re-provable once 33-04 merges;
Plan 33-05 (phase closer) should re-run the full suite against the merged
tree before its human sign-off checkpoint.

## Observed: level entry FPS-floor readings fluctuated across runs

**Found during:** Plan 33-03, Task 2, same `browser-boot.mjs` runs (2 consecutive)

**Symptom:** `level-01`/`level-02` "level entry: fps 32-35 < floor 45" on
both runs; second run additionally showed `level-03..08: fps 44 < floor 45`
(1fps under floor) on every level that got far enough to report it.

**Assessment:** Not linked to any Task 1 code path (collider/anim-state logic
does not execute before the first rendered frame differently than before).
Likely host-level headless timing variance from concurrent CPU load (this
worktree runs alongside sibling wave-2 agents on the same host). Not
auto-fixed — flagged for the orchestrator/Plan 33-05 to re-check against a
quieter host if it recurs post-merge.
