// scripts/fixtures/bad-scene.js — DELIBERATELY-BAD a727c13 calibration fixture.
//
// This is NOT shipped game code. It exists ONLY so check-import-safety.sh's
// Section 2 negative grep can be proven to go RED: the line below is the exact
// module-TOP-LEVEL engine-call trap the gate targets (a column-0 `const` whose
// initializer calls a Kaplay engine factory). In a real scene this throws at
// import time — engine globals only exist after kaplay({global}) runs — and
// blanks the canvas (the a727c13 regression).
//
// A shipped-good scene (src/scenes/game.js) keeps every engine call INSIDE the
// factory body, so the same pattern must stay GREEN on it. This fixture is the
// other half of that calibration: it must match.

import { CONFIG } from "../../src/config.js";

// THE TRAP (column-0, const-assigned engine call) — must make the negative grep fire:
const banner = add([text("nope"), pos(0, 0)]);

export function badScene() {
  return banner;
}
