---
quick_id: 260708-pud
slug: fix-dev-serving-instructions-in-claude-m
date: 2026-07-08
type: execute
autonomous: true
files_modified:
  - .claude/CLAUDE.md
  - .planning/codebase/STACK.md
  - README.md
must_haves:
  truths:
    - "Serving the game per .claude/CLAUDE.md's corrected Serving row (repo-root `python3 -m http.server 8000`, browse to `/src/index.html`) returns HTTP 200 for both `src/index.html` and `lib/kaplay.mjs` — proven live, not just asserted in prose"
    - "README.md's 'Run locally' section and its 'Web-root / path parity' explanation describe the same repo-root convention, so a developer following either doc gets a working dev server on the first try"
    - ".planning/codebase/STACK.md (the GSD generation source for CLAUDE.md's Technology Stack table) states the identical corrected convention, so a future docs regeneration cannot silently reintroduce the broken instruction"
  artifacts:
    - ".claude/CLAUDE.md Technology Stack table's Serving row instructs serving from the repo root and browsing to `http://localhost:8000/src/index.html`"
    - ".planning/codebase/STACK.md's Serving row matches CLAUDE.md's corrected text"
    - "README.md's 'Run locally' code block and 'Web-root / path parity' bullets describe the repo-root convention, with no leftover instruction to change into `src/` before starting the server"
  key_links:
    - "docker/Dockerfile's flattened src/+lib/ production layout <-> the corrected dev instruction (same relative-import resolution `../lib/kaplay.mjs`, already confirmed via curl against both the raw checkout and the built container)"
    - "scripts/browser-boot.mjs's existing repo-root serving convention (already used by the project's own regression gate) <-> the corrected documentation now describing that same convention instead of contradicting it"
---

<objective>
Correct the dev-serving instructions documented in `.claude/CLAUDE.md`, its GSD
generation source `.planning/codebase/STACK.md`, and `README.md`. All three
currently instruct changing into the `src/` subdirectory before starting
Python's standard-library HTTP server, which 404s on `lib/kaplay.mjs` because
`lib/` lives at the repo root as a sibling of `src/`, not nested inside it —
already reproduced via curl (see `<confirmed_root_cause>` in the planning
context). The correct convention — already used in production
(`docker/Dockerfile` flattens `src/` to the web root and copies `lib/` in
beside it) and already used by the project's own trusted regression gate
(`scripts/browser-boot.mjs`, which serves from the repo root) — is: run the
HTTP server from the repo root, then browse to `/src/index.html`.

Purpose: a developer (or a future agent) who follows the documented command
literally hits a 404 on the engine module and gets a blank/broken game on the
very first setup attempt. This has been silently wrong since the very first
commit that introduced `lib/kaplay.mjs` (Phase 7, v3.0) — not a regression,
a standing documentation defect.

Output: corrected "Serving" instructions in three current, forward-facing
docs (`.claude/CLAUDE.md`, `.planning/codebase/STACK.md`, `README.md`), kept
textually consistent with each other and with the already-correct
`docker/Dockerfile` and `scripts/browser-boot.mjs`. `docs/DEPLOY.md` was
checked and does not repeat this instruction (it only documents the Docker
build/run + curl deploy-verification flow) — no change needed there.
Historical/archived planning artifacts (`.planning/milestones/**`, closed
phase `PLAN`/`SUMMARY`/`VERIFICATION`/`RESEARCH` docs, and `STATE.md`'s
running session log) are deliberately left untouched — they are point-in-time
records, not standing developer-facing instructions, and rewriting them here
would be scope creep beyond this documentation fix.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.claude/CLAUDE.md
@.planning/codebase/STACK.md
@README.md
@docker/Dockerfile
@scripts/browser-boot.mjs

Key facts already confirmed (no need to re-derive):
- Root cause reproduced via curl before this plan was requested: starting the
  server from inside `src/` returns 404 for `lib/kaplay.mjs`; starting it from
  the repo root and requesting `/src/index.html` returns 200 for both
  `src/index.html` and `lib/kaplay.mjs` (content-type `text/javascript`).
- `docker/Dockerfile` explicitly documents the correct layout in its own
  comment: `src/` is flattened to the web root and `lib/` is copied in as a
  sibling — "identical to dev" when dev is served the same way (repo root).
- `scripts/browser-boot.mjs` already resolves its server root as the parent
  of `scripts/` (i.e. the repo root) and serves the app at `/src/index.html`
  — this is the convention that already works and that the docs must match.
- `.claude/CLAUDE.md`'s Technology Stack table lives inside a GSD-managed
  block delimited by `<!-- GSD:stack-start source:codebase/STACK.md -->` and
  `<!-- GSD:stack-end -->` — that block is generated FROM
  `.planning/codebase/STACK.md`. Editing only `.claude/CLAUDE.md` without
  also correcting `.planning/codebase/STACK.md` would leave the fix fragile:
  a future docs regeneration would pull the still-broken source text back in
  and silently undo this fix. Both must be corrected identically.
- `README.md`'s current "Web-root / path parity" explanation is not just an
  outdated command — its reasoning is actively wrong: it claims serving from
  inside `src/` makes `../lib/kaplay.mjs` "resolve to the sibling `lib/`
  directory", which is false (that is exactly the 404 case). The prose needs
  correcting, not just the command line.
- `docs/DEPLOY.md` was checked (read in full) and contains no instance of
  this instruction — it only covers the Docker build/run/curl deploy-checklist
  flow, which is already correct. No edit needed there.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Correct the dev-serving instructions in CLAUDE.md, its generation source, and README.md</name>
  <files>.claude/CLAUDE.md, .planning/codebase/STACK.md, README.md</files>
  <action>
    **`.claude/CLAUDE.md`** (inside the `<!-- GSD:stack-start source:codebase/STACK.md -->` /
    `<!-- GSD:stack-end -->` block, Technology Stack table): find the table row
    beginning `| Serving |`. Its Dev instruction currently changes into the
    `src/` subdirectory before invoking Python's standard-library HTTP server
    module on port 8000, with no target URL given. Replace the Dev instruction
    (keep the Production sentence in the same cell as-is) so it reads: run
    `python3 -m http.server 8000` from the **repo root** — explicitly noting
    `lib/` is a sibling of `src/`, not nested inside it, so a server rooted at
    `src/` 404s on `lib/kaplay.mjs` — then browse to
    `http://localhost:8000/src/index.html`. Note it matches
    `scripts/browser-boot.mjs`'s serving convention and the Dockerfile's
    flattened production layout.

    **`.planning/codebase/STACK.md`**: this file is the GSD generation source
    for the block just edited above — it has the identical `| Serving |` row.
    Apply the exact same correction here so the two files stay in sync (a
    future docs regeneration reads FROM this file; if it is left stale, it
    will silently reintroduce the broken instruction into CLAUDE.md).

    **`README.md`**: two locations need correcting, both under the "Run
    locally (development only)" heading.

    First, the fenced bash block (currently: change into `src/`, then invoke
    the server, with a comment noting the bare root URL). Replace it with a
    two-line block: run `python3 -m http.server 8000` from the repo root,
    then a comment noting to open `http://localhost:8000/src/index.html`. Also
    update the sentence introducing the block (currently says to start the
    server "from inside the `src/` directory") to instead say to run it from
    the **repo root**.

    Second, the "Web-root / path parity (dev vs. production)" subsection
    below it. Its "In development" bullet currently claims serving from
    inside `src/` makes the `../lib/kaplay.mjs` import "resolve to the
    sibling `lib/` directory" and treats serving from the repo root as merely
    an "equivalent" alternative in a parenthetical aside — both are wrong:
    serving from inside `src/` is the broken case (no `lib/` reachable
    underneath that docroot, so the request 404s), and serving from the repo
    root while opening `/src/index.html` is the ONLY correct dev convention,
    matching production exactly. Rewrite the bullet to state plainly: in
    development, serve from the repo root and open
    `http://localhost:8000/src/index.html`; `lib/` being a sibling of `src/`
    at the repo root is exactly why a repo-root docroot resolves
    `../lib/kaplay.mjs` correctly, while a docroot rooted inside `src/` itself
    has no `lib/` underneath it and 404s (confirmed empirically). Update the
    closing "takeaway" sentence to say the server must be started from the
    repo root, not from inside `src/`, and that this matches the Dockerfile's
    production layout and `scripts/browser-boot.mjs`'s existing convention.
    Leave the "In production" bullet and the rest of the file (Kaplay pin,
    Project layout, Production play path sections) untouched — they don't
    reference this instruction.

    Do not touch `docker/Dockerfile`, `src/main.js`, `docs/DEPLOY.md` (already
    checked clean), or any file under `.planning/milestones/`,
    `.planning/phases/`, or `.planning/STATE.md` — those are either already
    correct, out of scope per the task constraints, or historical records
    that should not be rewritten after the fact.
  </action>
  <verify>
    <automated>
FILES=".claude/CLAUDE.md .planning/codebase/STACK.md README.md"
for f in $FILES; do
  ! grep -Fq 'cd src && python3 -m http.server' "$f" || { echo "FAIL: broken chained dev command still present in $f"; exit 1; }
  ! grep -Exq 'cd src' "$f" || { echo "FAIL: bare src-relative cd line still present in $f"; exit 1; }
  grep -Fq 'localhost:8000/src/index.html' "$f" || { echo "FAIL: corrected repo-root URL missing from $f"; exit 1; }
done
! grep -Fq 'cd src && python3 -m http.server' docs/DEPLOY.md || { echo "FAIL: docs/DEPLOY.md unexpectedly contains the broken command"; exit 1; }
echo "doc text: OK (all 3 files corrected, DEPLOY.md confirmed clean)"

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
python3 -m http.server 8971 >/tmp/devserve-verify.log 2>&1 &
SRV=$!
sleep 1
CODE_HTML=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8971/src/index.html)
CODE_LIB=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8971/lib/kaplay.mjs)
kill "$SRV" 2>/dev/null
if [ "$CODE_HTML" = "200" ] && [ "$CODE_LIB" = "200" ]; then
  echo "live serve per corrected instructions: OK (200/200)"
else
  echo "FAIL: live serve check per corrected instructions got index.html=$CODE_HTML lib/kaplay.mjs=$CODE_LIB"
  exit 1
fi
    </automated>
  </verify>
  <done>
    `.claude/CLAUDE.md`, `.planning/codebase/STACK.md`, and `README.md` all
    instruct serving from the repo root and browsing to
    `http://localhost:8000/src/index.html`, with no remaining instruction to
    change into `src/` before starting the server. Doing exactly what the
    corrected docs say returns HTTP 200 for both `src/index.html` and
    `lib/kaplay.mjs` (proven live by the automated verify, not just asserted
    in prose). `docs/DEPLOY.md` confirmed to need no change.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Documentation text -> developer's shell | A developer (or agent) copy-pastes the documented command verbatim; the only "boundary" here is doc-accuracy, not code execution against untrusted input. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-260708-01 | N/A (no security-relevant surface) | .claude/CLAUDE.md, .planning/codebase/STACK.md, README.md | low | accept | This is a documentation-only text correction with no new code path, no new dependency, and no runtime behavior change — it does not introduce or touch any trust boundary. Accepted with no mitigation needed beyond the correctness verify already in Task 1. |
</threat_model>

<verification>
- Automated grep confirms the broken chained/`cd`-into-`src/` instruction is gone from all three target docs, and confirms `docs/DEPLOY.md` never had it.
- Automated grep confirms the corrected `http://localhost:8000/src/index.html` instruction is present in all three target docs.
- Automated live-server check spins up `python3 -m http.server` from the repo root (exactly as the corrected docs now instruct) and curls both `src/index.html` and `lib/kaplay.mjs`, asserting HTTP 200 on both — directly reproducing the same repro steps already used to confirm the root cause, now proving the fix.
</verification>

<success_criteria>
- Following `.claude/CLAUDE.md`'s Serving row exactly (or README.md's "Run locally" section exactly) results in a working dev server with no 404 on `lib/kaplay.mjs`.
- `.claude/CLAUDE.md` and its generation source `.planning/codebase/STACK.md` are textually consistent, so a future docs regeneration cannot silently reintroduce the bug.
- No production code, config, or historical planning artifact was touched — this is a pure documentation fix.
</success_criteria>

<output>
Create `.planning/quick/260708-pud-fix-dev-serving-instructions-in-claude-m/260708-pud-SUMMARY.md` when done
</output>
