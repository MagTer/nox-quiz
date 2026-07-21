---
phase: 34-level-quality-pass
plan: 05
status: SKIPPED
subsystem: level-geometry
tags: [skipped, superseded, coins, kid-validated-levels]

# Dependency graph
requires:
  - phase: 34-level-quality-pass
    provides: "34-03 (coin moves levels 04-07) and 34-04 (level-08)"
provides:
  - "Nothing. This plan was deliberately NOT executed."
affects: []

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []
---

# Phase 34 Plan 05 — SKIPPED (deliberate user decision, not an omission)

## Status: NOT EXECUTED

This plan would have moved the **8 unreachable coins in levels 01–03** (the kid-validated levels), in their own auditable commit.

**It was skipped on the user's explicit instruction, 2026-07-14.**

## Why

Mid-phase, the user inserted a new phase — **34.6, Level Redesign** — which **rebuilds every level from scratch** (their words: *"make sure to redo the entire level. not just extending, as the current placements are a bit 'beta'"*).

That makes this plan's work **throwaway**: levels 01–03's coin arrays are deleted and re-authored wholesale by the rebuild. Moving coins in a level that is about to cease existing buys nothing.

The user was offered the choice explicitly ("Trim to the durable parts" vs "Finish Phase 34 exactly as planned") and chose to trim.

## What was kept instead

The phase's **durable** outputs — the ones that survive the rebuild and that 34.6 depends on — were all completed:

| Plan | Survives the rebuild? |
|------|----|
| 34-01 coin-reachability model | ✅ It validates the NEW levels |
| 34-02 in-engine coin audit | ✅ Same — and it falsified the static model |
| 34-03 coin moves, levels 04–07 | ⚠️ Landed before the rebuild decision |
| 34-04 level-08 switchback + WYSIWYG platforms + headroom discovery | ✅ The *design direction* and the *rules* survive |
| **34-05 coin moves, levels 01–03** | ❌ **SKIPPED — pure waste** |
| 34-06 LEVEL-DESIGN rulebook + headroom HARD gate | ✅ The rules 34.6 authors AGAINST |
| 34-07 bidirectional harness | ✅ What makes the rebuilt levels PROVABLE |

## Consequence, stated plainly

`node scripts/validate-levels.mjs` remains **RED with 8 `coin-reachability` HARD-FAILs on levels 01–03**. This is a known, accepted, deliberate red — not a defect and not an oversight.

**It goes green when Phase 34.6 rebuilds those levels**, whose new coin placements must pass the very check Plan 34-01 built.

Phase 34's **SC4 ("structural validator green with zero HARD-FAILs")** is therefore NOT met, and is explicitly deferred to Phase 34.6. See `34-VERIFICATION.md`.

**Do not "fix" these 8 rows by moving the coins.** That is precisely the throwaway work this skip exists to avoid.
