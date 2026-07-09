# Phase 28: Full Verification & Interactive Sign-off - Pattern Map

**Mapped:** 2026-07-09
**Files analyzed:** 3 (this phase modifies/extends tooling + writes closing docs; no new src/ files)
**Analogs found:** 3 / 3

This is a milestone-closing verification phase, not a feature-build phase. Per CONTEXT.md, all work extends existing tooling (`scripts/browser-boot.mjs`) or produces closing documentation (`VERIFICATION.md`, plan `SUMMARY.md` with a `checkpoint:human-verify` task). No new `src/` game code, no new mechanics, no new scripts from scratch.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/browser-boot.mjs` (extended, in place — new fresh-context proof block) | test/utility | event-driven (Playwright browser automation) | itself (extend existing pattern within the same file) | exact |
| `.planning/phases/28-full-verification-interactive-sign-off/28-VERIFICATION.md` | doc/report | batch (static report generation from evidence) | `.planning/phases/27-audio-adhd-safe-sound/27-VERIFICATION.md` | exact |
| `.planning/phases/28-full-verification-interactive-sign-off/28-0N-SUMMARY.md` (the plan carrying the human sign-off checkpoint) | doc/report | event-driven (records a human-in-the-loop checkpoint) | `.planning/phases/27-audio-adhd-safe-sound/27-07-SUMMARY.md` | exact |

No new shell gate scripts, no new `src/` files. The shell-gate suite (`check-safety.sh`, `check-import-safety.sh`, `check-gate.sh`, `check-progress.sh`, `check-audio.sh`, `check-rebrand.sh`) and `validate-levels.mjs` are RUN, not modified — no pattern extraction needed for them beyond confirming they exist and their PASS/FAIL echo convention (see Shared Patterns below), in case a plan needs to reference "run these and confirm PASS."

## Pattern Assignments

### `scripts/browser-boot.mjs` — extend in place (test/utility, event-driven browser automation)

**Analog:** itself, `/home/magnus/dev/nox-quiz/scripts/browser-boot.mjs` (287 lines, read in full)

This phase needs two NEW proofs added to this same script (per CONTEXT.md: "an automated Playwright fresh-context/clean-storage proof" for (a) audio starts only after first gesture, and (b) a fresh save under `noxrun_platformer_v1` persists/resumes across reload). Do not create a new script — extend this one, following its own established internal conventions.

**Fresh-context/clean-storage pattern already in this file** — the existing `context`/`page` setup at lines 134-136 is ALREADY a fresh, clean-storage Playwright context (new `browser.newContext()` per script run, no profile reuse, no pre-seeded storage until the script itself writes it at lines 154-157). This means the existing single boot flow already qualifies as "fresh-incognito" — no new browser context is structurally required; what's needed are new *assertions* inserted into the existing flow (or a second, explicitly separate `newContext()`/`newPage()` pair later in the same script, mirroring lines 134-136, if isolation from the existing save-seeding block at line 154 is wanted for the audio-starts-before-any-storage-write check).

**Audio-count / functional-proof idiom to copy** (lines 88-103, `assertAudioElementCount`):
```javascript
async function assertAudioElementCount(page, errors, stopLabel) {
  const count = await page.evaluate(() => document.querySelectorAll("audio").length);
  if (count > 1) {
    errors.push({
      type: "audio",
      message: `${stopLabel}: expected at most 1 <audio> element, found ${count}`,
    });
  }
}
```
This is the template for a new helper, e.g. `assertNoAudioBeforeGesture(page, errors)` — evaluate a real DOM/JS condition in-page, push a typed `{ type, message }` entry into the shared `errors` array (never throw), so one failed check doesn't abort the rest of the drive.

**Functional mute-toggle proof idiom to copy** (lines 164-184) — the closest existing analog for "prove a persisted-state behavior actually works, not just code-reads clean":
```javascript
await page.keyboard.press("m");
await page.waitForTimeout(200);
const mutedVolume = await page.evaluate(() => getVolume());
if (mutedVolume !== 0) {
  errors.push({
    type: "audio",
    message: `mute toggle: expected getVolume() === 0 after pressing M, got ${mutedVolume}`,
  });
}
```
Apply the same shape to a new save-persistence proof: write via the running game's real flow (not just `localStorage.setItem`, unless mirroring the existing seed pattern below is preferred), `page.reload()`, then `page.evaluate(() => localStorage.getItem(SAVE_KEY))` and assert the resumed state matches — push a `{ type: "progress", message: ... }` entry on mismatch.

**Save-seeding idiom already present** (lines 73-86, 154-157) — reuse this shape for constructing a fresh, valid save blob under the CURRENT key:
```javascript
const SAVE_KEY = "noxrun_platformer_v1";
const SAVE_BLOB = {
  version: 2,
  xp: 0,
  level: 1,
  accuracy: {},
  history: {},
  levels: Object.fromEntries(LEVEL_ORDER.slice(0, -1).map((id) => [id, { cleared: true }])),
};
...
await page.evaluate(({ key, blob }) => {
  localStorage.setItem(key, JSON.stringify(blob));
}, { key: SAVE_KEY, blob: SAVE_BLOB });
```
For a genuine "persists and resumes across reload" proof, prefer driving a REAL save write through the game (e.g. clearing a level, since CLAUDE.md's data-flow notes say saves write on level-clear/tab-hide) rather than only round-tripping a hand-seeded blob — but the hand-seeded pattern above is acceptable as a baseline read-back check if a full level-clear drive is judged out of scope for this proof.

**Errors/PASS-FAIL idiom to copy** (lines 271-277, 287) — the script's overall pass/fail convention, matches the shell-gate echo style:
```javascript
if (errors.length > 0) {
  console.error("Browser boot encountered errors:");
  for (const e of errors) console.error(JSON.stringify(e));
  failed = true;
} else {
  console.log("Browser boot: PASS — title -> select -> all levels loaded with no runtime errors.");
}
...
process.exit(failed ? 1 : 0);
```

**Server/path-traversal-guard boilerplate** (lines 20-51, 55-132) — this is the project's DELIBERATELY duplicated block (verbatim across `browser-boot.mjs` / `audit-phase21-mechanics.mjs` / `calibrate-jump-envelope.mjs`, per CLAUDE.md's binding-rules note). Since this phase extends `browser-boot.mjs` in place (not creating a new script), this boilerplate does NOT need to be touched or re-copied — it is only relevant if some future plan spins up a genuinely separate script, which CONTEXT.md's decisions do not call for.

---

### `28-VERIFICATION.md` (doc/report, batch)

**Analog:** `/home/magnus/dev/nox-quiz/.planning/phases/27-audio-adhd-safe-sound/27-VERIFICATION.md` (94 lines, read in full)

Copy this document's exact structure and rigor:

**Frontmatter block** (lines 1-8):
```markdown
---
phase: 27-audio-adhd-safe-sound
verified: 2026-07-08T23:30:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---
```

**Section order to replicate:** Goal Achievement (Observable Truths table mapped to ROADMAP success criteria) → Required Artifacts table → Key Link Verification table → Behavioral Spot-Checks/Probe Execution table (literal commands run + literal output + PASS/FAIL) → Requirements Coverage table → Anti-Patterns Found → Human Verification Required → Gaps Summary.

**Footnote-style supersession pattern to copy exactly** (lines 23, 31) — this is the load-bearing pattern CONTEXT.md calls out for documenting the stale save-resume clause (ROADMAP criterion 3, superseded by the Phase 26 save-key rename):
```markdown
[^1]: SC1's roadmap text still names "land" as a played SFX. During the phase-closing human
sign-off (27-07), the land SFX was deliberately REMOVED ... This is a documented,
human-requested, intentional scope change recorded in `27-07-SUMMARY.md`'s decisions
... Not counted as a failure per this verification's explicit instructions.
```
For 28-VERIFICATION.md, write an analogous footnote (or inline "Note" block, see below) explaining: which ROADMAP clause is stale (criterion 3's "pre-rebrand save resumes"), why (Phase 26 intentionally renamed the save key with no migration, per REQUIREMENTS.md BRAND-02/PROJECT.md), and what was verified instead (a fresh save under the current key `noxrun_platformer_v1` persists/resumes).

**"Note (informational, not a gap)" pattern to copy** (lines 76, matches CONTEXT.md's instruction to list known-accepted issues without re-litigating them):
```markdown
**Note (informational, not a gap):** `.planning/REQUIREMENTS.md`'s AUD-01..04 rows still show
unchecked boxes and "Pending" status in its coverage table. Based on this project's pattern
... this is bookkeeping typically updated as part of phase-close, not evidence of an
implementation gap ...
```
Use this exact style for the CONTEXT.md-listed known-accepted deferred issues (unreachable pickups levels 5-8, secretAlcove discoverability, "n0x" logo ask, 999.1/999.2 backlog items) — one bullet or note per item, explicitly stating "already accepted, not newly discovered."

**Behavioral Spot-Checks table pattern to copy** (lines 55-65) — literal command, literal captured output, PASS/FAIL column, plus the explicit "all commands re-run live by this verification session, not taken from SUMMARY.md claims" closing line:
```markdown
| Check | Command | Result | Status |
|-------|---------|--------|--------|
| Full static safety gate | `bash scripts/check-safety.sh` | `safety checks: PASS` | ✓ PASS |
```
Reuse this table shape for the consolidated one-pass gate run this phase requires: `browser-boot.mjs`, `validate-levels.mjs`, `check-safety.sh`, plus the other cheap gates CONTEXT.md says "should run too" (`check-import-safety.sh`, `check-gate.sh`, `check-progress.sh`, `check-audio.sh`, `check-rebrand.sh`).

**Citation-not-re-derivation pattern** — CONTEXT.md explicitly wants Phase 25's 36/36-triggered mechanic audit and Phase 27's re-confirmation CITED, not re-run. Model this the way 27-VERIFICATION.md cites `27-07-SUMMARY.md` verbatim (line 84) rather than re-deriving the human sign-off:
```markdown
### Human Verification Required

None. AUD-04's human sound sign-off ... was already conducted this session ... recorded
verbatim in `27-07-SUMMARY.md`. Per this verification's task instructions, this does not
need to be re-requested.
```

---

### `28-0N-SUMMARY.md` (the human sign-off plan) (doc/report, event-driven checkpoint record)

**Analog:** `/home/magnus/dev/nox-quiz/.planning/phases/27-audio-adhd-safe-sound/27-07-SUMMARY.md` (102 lines, read in full)

This is the load-bearing analog for CONTEXT.md's "genuine, non-rubber-stamped human sign-off ... specific quotes recorded verbatim" requirement, and directly matches the user's persistent memory instruction never-rubber-stamp-checkpoints.

**Frontmatter `coverage` entry pattern for a human-judgment item** (lines 49-58):
```yaml
coverage:
  - id: D1
    description: "A human listened to the running game with sound on across 3 iterative fix
      rounds ... and gave a final explicit approval (\"great.. audio approved\") — not a
      vague first-pass \"sounds fine\""
    requirement: "AUD-04"
    verification:
      - kind: manual_procedural
        ref: "in-session human sound review, 2026-07-08 — see this plan's decisions above
          for the full fix history"
        status: pass
    human_judgment: true
    rationale: "ADHD-safe mix quality ... has no automated proxy — CLAUDE.md's standing rule
      requires this exact human-in-the-loop check, and this project's own
      never-rubber-stamp-checkpoints precedent (Phase 25) required surfacing this checkpoint
      rather than auto-approving it under workflow.auto_advance"
```
For Phase 28's consolidated sign-off, use `kind: manual_procedural`, `human_judgment: true`, and a `rationale` that names the same standing rules (CLAUDE.md "no phase closes on greps/automation alone", `never-rubber-stamp-checkpoints` memory).

**"Resume-signal record" section — the exact verbatim-quote ledger pattern** (lines 86-95):
```markdown
## Resume-signal record

- Round 1 (land SFX): "Most of the annoying noise is gone. There is one triggered at top of
  a jump as well.. a short pop of some kind" → routed to jump SFX investigation.
...
- **Final: "great.. audio approved"** — explicit approval, AUD-04 closes here.

No step of this checkpoint was auto-approved under `workflow.auto_advance` — every round was
a real, specific human response routed to a real fix and re-verified ... matching this
project's `never-rubber-stamp-checkpoints` precedent and CLAUDE.md's standing "no phase closes
on greps/automation alone" rule.
```
Copy this exact section header and closing disclaimer sentence verbatim in style — it is the textual proof-of-non-rubber-stamp the project's own precedent (and the user's persistent memory note) requires. Since Phase 28's sign-off is a single holistic pass over levels+themes+logo+audio (not iterative fix rounds necessarily), the ledger can be a single entry if genuinely one clean pass, but MUST still contain a real, specific verbatim quote — not a paraphrase — and MUST still include the explicit "not auto-approved" disclaimer sentence.

**Self-Check section pattern** (lines 97-101) — list every gate re-run green after the checkpoint:
```markdown
## Self-Check: PASSED

- Full gate suite (`check-safety.sh`, `check-import-safety.sh`, `check-audio.sh`,
  `check-gate.sh`, `check-progress.sh`) green after every code/asset change, confirmed a
  final time after the last fix.
- `node scripts/browser-boot.mjs` — real-browser boot, zero runtime errors, after every
  change.
```

## Shared Patterns

### Shell-gate PASS/FAIL echo convention
**Source:** `scripts/check-audio.sh` lines 7-8, 24, 59 (pattern shared by all 6 gate scripts)
**Apply to:** Any plan action that runs the consolidated gate suite in 28-VERIFICATION.md's Behavioral Spot-Checks table
```bash
# fail-fast static assertions, clear FAIL messages, a final PASS echo on full success
fail() { echo "audio checks: FAIL — $1" >&2; exit 1; }
...
echo "audio checks: PASS"
```
Every gate script (`check-safety.sh`, `check-import-safety.sh`, `check-gate.sh`, `check-progress.sh`, `check-audio.sh`, `check-rebrand.sh`) follows this same `<name> checks: PASS` / `<name> checks: FAIL — <reason>` convention — when writing the consolidated pass in 28-VERIFICATION.md, capture the exact literal echoed line per script, matching 27-VERIFICATION.md's table style.

### Errors-array-not-throw convention (Playwright scripts)
**Source:** `scripts/browser-boot.mjs` lines 95-103, 138-147, 271-277
**Apply to:** Any new assertion helper added to `browser-boot.mjs` this phase
Push `{ type, message }` objects into a shared `errors` array rather than throwing — one failed check must not abort the rest of the drive. Final PASS/FAIL determined once, at the end, by `errors.length > 0`.

### Stale-clause-footnote convention
**Source:** `27-VERIFICATION.md` footnote `[^1]` (line 31) and inline "Note (informational, not a gap)" (line 76)
**Apply to:** 28-VERIFICATION.md's treatment of the superseded save-resume ROADMAP criterion and the list of known-accepted deferred issues from CONTEXT.md
Never silently drop or silently reinterpret a stale/superseded claim — always state which clause, why it's stale/accepted, and what was verified/decided instead, inline or as a footnote.

## No Analog Found

None — all three files this phase touches have a direct, exact-match analog from Phase 27 (itself, for the script extension; `27-VERIFICATION.md`; `27-07-SUMMARY.md`). This phase deliberately reuses established tooling and documentation conventions rather than introducing new patterns.

## Metadata

**Analog search scope:** `scripts/` (browser-boot.mjs and sibling gate scripts), `.planning/phases/27-audio-adhd-safe-sound/` (27-VERIFICATION.md, 27-07-SUMMARY.md)
**Files scanned:** `scripts/browser-boot.mjs` (full, 287 lines), `.planning/phases/27-audio-adhd-safe-sound/27-VERIFICATION.md` (full, 94 lines), `.planning/phases/27-audio-adhd-safe-sound/27-07-SUMMARY.md` (full, 102 lines), `scripts/check-audio.sh` (grepped for echo convention)
**Pattern extraction date:** 2026-07-09
</content>
