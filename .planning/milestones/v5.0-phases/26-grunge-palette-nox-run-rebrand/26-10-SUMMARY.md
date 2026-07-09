---
phase: 26-grunge-palette-nox-run-rebrand
plan: 10
subsystem: docs
tags: [rebrand, docs, docker, credits, grep-gate, regression-gate]

# Dependency graph
requires:
  - phase: 26-07
    provides: "Nox Run logo baked + wired into title.js/select.js"
  - phase: 26-09
    provides: "core src/ runtime string sweep + save-key rename (noxrun_platformer_v1), sequenced first so this plan's own check-rebrand.sh verify step validates a tree where both sweep halves have already landed"
provides:
  - "README.md, docs/DEPLOY.md, docker/Dockerfile: zero 'Math Lab'/'mathlab' text; DEPLOY.md's Docker command examples use noxrun:local / --name noxrun"
  - "CREDITS.md intro + scripts/generate-art-assets.py and scripts/build-art-assets.py docstrings: zero 'Math Lab' text"
  - "scripts/check-rebrand.sh: new permanent BRAND-02 regression gate, proven RED-then-reverted, scanning src/, scripts/ (.js/.mjs/.py/.sh), README.md, CREDITS.md, docs/*.md, docker/Dockerfile, src/index.html"
affects: [26-11, 28]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "check-rebrand.sh mirrors check-safety.sh's exact shape (fail() helper, comment-stripped code scan, clear PASS banner) rather than inventing a new gate-script idiom"
    - "A permanent grep gate that must contain its own banned-literal matcher pattern self-excludes its own file from the raw-scan category (here: .sh files) to avoid matching its own allowlist/doc prose, mirroring check-safety.sh's 'the audit never matches itself' discipline"

key-files:
  created:
    - scripts/check-rebrand.sh
  modified:
    - README.md
    - docs/DEPLOY.md
    - docker/Dockerfile
    - CREDITS.md
    - scripts/generate-art-assets.py
    - scripts/build-art-assets.py

key-decisions:
  - "check-rebrand.sh self-excludes scripts/check-rebrand.sh from its own raw .sh scan category — its own source necessarily contains the literal allowlist pattern text ('mathlab_save') and explanatory prose, which would otherwise self-match and always FAIL"
  - "Deferred (not fixed): .claude/CLAUDE.md carries 2 unallowlisted 'Math Lab'/'mathlab' mentions inherited verbatim from .planning/PROJECT.md's still-unrenamed '## Project' heading — out of this plan's explicit files_modified scope and 26-CONTEXT.md's named full-sweep scope (src/, scripts/, docs/, docker/, README.md, CREDITS.md), logged to deferred-items.md per the Scope Boundary rule rather than auto-fixed"

requirements-completed: [BRAND-02]

coverage:
  - id: D1
    description: "README.md, docs/DEPLOY.md, docker/Dockerfile carry zero 'Math Lab'/'mathlab' text; DEPLOY.md's docker build/run/stop command examples use a Nox Run-branded name (noxrun:local / --name noxrun); Dockerfile's only change is its comment line"
    requirement: "BRAND-02"
    verification:
      - kind: unit
        ref: "! grep -qi 'math lab' README.md docs/DEPLOY.md docker/Dockerfile && ! grep -q 'mathlab' docs/DEPLOY.md -> exit 0; git diff docker/Dockerfile confirms only the comment line changed"
        status: pass
    human_judgment: false
  - id: D2
    description: "CREDITS.md intro sentence and both art-pipeline script docstrings (generate-art-assets.py, build-art-assets.py) carry zero 'Math Lab' text"
    requirement: "BRAND-02"
    verification:
      - kind: unit
        ref: "! grep -qi 'math lab' CREDITS.md scripts/generate-art-assets.py scripts/build-art-assets.py -> exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "scripts/check-rebrand.sh exists, follows check-safety.sh's structural pattern, was proven to catch a real violation (temporary README.md string, RED, exit 1, correct file/line) then reverted, and passes clean (PASS) against the fully-swept tree"
    requirement: "BRAND-02"
    verification:
      - kind: unit
        ref: "bash scripts/check-rebrand.sh -> 'rebrand checks: PASS', exit 0; RED self-test: temporary 'Math Lab' line prepended to README.md -> script FAILed with 'old brand name found in README.md / 1:temporary Math Lab test string', exit 1; reverted, git diff README.md clean, re-run -> PASS"
        status: pass
    human_judgment: false

# Metrics
duration: 5min
completed: 2026-07-07
status: complete
---

# Phase 26 Plan 10: Docs/Deploy/Art-Pipeline String Sweep + Permanent Rebrand Gate (BRAND-02) Summary

**Swept the remaining "Math Lab"/"mathlab" text out of README.md, docs/DEPLOY.md (including its literal Docker command examples), docker/Dockerfile's comment, CREDITS.md, and both Python art-pipeline script docstrings, then built `scripts/check-rebrand.sh` — a new permanent grep gate mirroring `check-safety.sh`'s pattern, proven RED-then-reverted before being trusted, completing the second (docs/scripts) half of the full BRAND-02 sweep started by Plan 26-09's core src/ half.**

## Performance

- **Duration:** ~5 min of active task execution (3 auto tasks, no checkpoints)
- **Started:** 2026-07-07T23:32:00Z (approx)
- **Completed:** 2026-07-07T23:34:32Z
- **Tasks:** 3 (all auto, autonomous)
- **Files modified:** 7 (6 edited + 1 new)

## Accomplishments

- `README.md`: heading `# Math Lab v3.0 — The Platformer` → `# Nox Run — The Platformer` (also dropped the stale "v3.0" version tag).
- `docs/DEPLOY.md`: heading and intro sentence rebranded to "Nox Run"; the literal `docker build`/`docker run`/`docker stop` command examples changed from `mathlab:phase7`/`--name mathlab` to `noxrun:local`/`--name noxrun`, closing the real (if low-severity) copy-paste footgun 26-RESEARCH.md flagged.
- `docker/Dockerfile`: comment-only rename ("Single-stage static file server for Nox Run."); `FROM`/`COPY`/`EXPOSE` directives byte-identical, confirmed via `git diff`.
- `CREDITS.md`: intro sentence rebranded and corrected to plural "levels" (the project now has 8, not 1).
- `scripts/generate-art-assets.py` and `scripts/build-art-assets.py`: docstring headers rebranded to "Nox Run".
- `scripts/check-rebrand.sh` created: a new permanent BRAND-02 regression gate following `check-safety.sh`'s exact shape (fail() helper, comment-stripped code scan for .js/.mjs/.py, raw scan for .sh/docs/Dockerfile/index.html, clear "rebrand checks: PASS" banner). Scans the full sweep scope named by 26-CONTEXT.md (src/, scripts/, docs/, docker/, README.md, CREDITS.md), allowlisting only `src/progress.js`'s 2 `mathlab_save_*` school-game comment lines, and self-excludes its own file from the raw `.sh` scan (its own source necessarily contains the allowlist pattern text and explanatory prose).
- Proved the gate is real per T-26-13: temporarily prepended a "Math Lab" line to README.md, re-ran the script — it FAILed (exit 1) with the exact file and matched line, then the line was reverted and the gate re-ran clean (PASS).

## Task Commits

Each task was committed atomically:

1. **Task 1: README.md, docs/DEPLOY.md, docker/Dockerfile sweep** - `7c2006b` (docs)
2. **Task 2: CREDITS.md intro + art-pipeline script docstrings** - `56992c3` (docs)
3. **Task 3: Create scripts/check-rebrand.sh (permanent BRAND-02 regression gate)** - `da182ae` (feat)

**Plan metadata:** (this commit)

_Note: no TDD tasks in this plan — all 3 are `type="auto"` doc/script edits and one new gate script._

## Files Created/Modified

- `README.md` - heading rebranded to "Nox Run — The Platformer"
- `docs/DEPLOY.md` - heading, intro sentence, and Docker command examples (`noxrun:local` / `--name noxrun`) rebranded
- `docker/Dockerfile` - comment-only rebrand; functional directives untouched
- `CREDITS.md` - intro sentence rebranded ("Nox Run ships... levels", plural)
- `scripts/generate-art-assets.py` - docstring header rebranded
- `scripts/build-art-assets.py` - docstring header rebranded
- `scripts/check-rebrand.sh` (new) - permanent BRAND-02 grep gate, proven RED-then-reverted

## Decisions Made

- **check-rebrand.sh self-excludes its own file from the `.sh` raw-scan category.** The gate's negative-match pattern (`math ?lab`, case-insensitive) and its allowlist filter (`mathlab_save`) both necessarily appear as literal text inside the script's own source (the matcher pattern itself, plus explanatory header prose). Since `.sh` files are scanned raw (unstripped, per the plan's own instruction that "a shell script's own comments are its literal prose here"), the script would otherwise always fail against itself — mirroring `check-safety.sh`'s documented "the audit never matches itself" self-referential-safety precedent, extended here via file self-exclusion rather than pattern obfuscation.
- **Deferred (not fixed): `.claude/CLAUDE.md` still carries 2 unallowlisted "Math Lab"/"mathlab" mentions.** A full-repo grep (`grep -rni "math lab\|mathlab" .` excluding `.git/`, `.planning/`, `archive/`) found these are inherited verbatim from `.planning/PROJECT.md`'s own still-unrenamed `## Project` heading (`**Math Lab**`) via GSD's `<!-- GSD:project-start source:PROJECT.md -->` sync marker. Neither `.claude/CLAUDE.md` nor `.planning/PROJECT.md` is named in this plan's `files_modified` list or in 26-CONTEXT.md's explicit "full sweep scope" (src/, scripts/, docs/, docker/, README.md, CREDITS.md) that `check-rebrand.sh`'s own `key_links` field describes it as scanning. Editing `.claude/CLAUDE.md` directly would also be overwritten by the next GSD project-sync from the unrenamed `PROJECT.md` source. Logged to `deferred-items.md` per the Scope Boundary rule rather than auto-fixed, with a suggested follow-up (rename PROJECT.md's heading at a future milestone boundary, then let `/gsd-config` propagate it).

## Deviations from Plan

None - plan executed exactly as written. (One out-of-scope discovery — see Decisions Made / deferred-items.md — was logged, not auto-fixed, per the Scope Boundary rule; it is not a deviation from this plan's own task instructions.)

## Issues Encountered

None beyond the deferred `.claude/CLAUDE.md` discovery documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- BRAND-02 is now fully closed across both sweep halves: Plan 26-09 (core `src/` runtime + save-key rename) and this plan (docs, deploy config, art-pipeline scripts, plus the new permanent gate).
- `scripts/check-rebrand.sh` is a proven, permanent regression gate — any future PR that reintroduces "Math Lab"/"mathlab" text outside the 2 allowlisted `src/progress.js` lines will fail it.
- `bash scripts/check-safety.sh` and `node scripts/validate-levels.mjs` both re-confirmed green after this plan's edits (no `src/` behavior touched).
- One pre-existing, out-of-scope documentation-drift item remains open (`.claude/CLAUDE.md` / `.planning/PROJECT.md`'s project-identity heading) — tracked in `deferred-items.md`, not blocking.

---
*Phase: 26-grunge-palette-nox-run-rebrand*
*Completed: 2026-07-07*

## Self-Check: PASSED

All 3 task commit hashes (7c2006b, 56992c3, da182ae) found in git log. scripts/check-rebrand.sh found on disk, executable, passes clean.
