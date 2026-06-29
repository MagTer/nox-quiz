// src/levels/index.js — the ordered level registry + the derived-unlock helper.
//
// Single responsibility: be the SINGLE source of level order and the public lookup
// surface for the rest of the app. It exposes the ordered LEVEL_ORDER (ids), a
// forgiving getLevel(id), and isUnlocked(id, progress) — which DERIVES unlock state
// purely from LEVEL_ORDER + the progress instance's cleared FACTS (research Pitfall
// 4: never store "unlocked"; it is always recomputed).
//
// This is a PURE module: it imports ONLY ./level-01.js (which itself imports only
// ../config.js). It references NO engine globals and NO storage — it must stay
// node-importable for the Wave-0 smoke. The Wave-0 negative grep asserts the
// no-engine-global invariant (a727c13).

import { LEVEL_01 } from "./level-01.js";

// The ORDERED registry — the single source of level order. Future levels append here.
const LEVELS = [LEVEL_01];

// id → descriptor lookup (built once from the ordered registry).
const BY_ID = new Map(LEVELS.map((l) => [l.id, l]));

// Ordered list of level ids — ["level-01"]. This is the unlock-derivation backbone.
export const LEVEL_ORDER = LEVELS.map((l) => l.id);

// getLevel(id): look up the descriptor by id; fall back to the FIRST level for any
// unknown/junk id so a bad save payload or scene argument can never crash the boot
// (T-13-07 — a junk id resolves to a real, safe level, never a crash).
export function getLevel(id) {
  return BY_ID.get(id) || LEVELS[0];
}

// isUnlocked(id, progress): DERIVE unlock from LEVEL_ORDER + the progress instance's
// cleared facts (research Pitfall 4 — never store unlocked). The first level (or an
// unknown id, treated as the first) is always open; level N is unlocked iff its
// predecessor in LEVEL_ORDER has been cleared. Nothing is stored here.
export function isUnlocked(id, progress) {
  const i = LEVEL_ORDER.indexOf(id);
  if (i <= 0) return true; // first level, or unknown id treated as first — always open
  // Forgiving (mirrors getLevel): a missing/malformed progress means "nothing cleared",
  // so only the first level is open — never throw on a null/undefined progress. This keeps
  // the registry immune to the boot-bricking class even once a second level is appended.
  if (!progress || typeof progress.isLevelCleared !== "function") return false;
  return progress.isLevelCleared(LEVEL_ORDER[i - 1]);
}
