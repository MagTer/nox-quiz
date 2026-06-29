// scripts/fixtures/bad-scene.js — DELIBERATELY-BAD a727c13 calibration fixture.
//
// This is NOT shipped game code. It exists ONLY so check-import-safety.sh's
// calibration self-test (Section 1b) can be proven to go RED: the lines below are
// the exact module-TOP-LEVEL engine-call traps the gate targets. In a real scene
// these throw at import time — engine globals only exist after kaplay({global})
// runs — and blank the canvas (the a727c13 regression).
//
// A shipped-good scene (src/scenes/game.js) keeps every engine call INSIDE the
// factory body, so the same pattern must stay GREEN on it. This fixture is the
// other half of that calibration: it must match.

import { CONFIG } from "../../src/config.js";

// THE TRAP, form (a) — a column-0 const whose initializer calls an engine factory.
// Must make the trap fire:
const banner = add([text("nope"), pos(0, 0)]);

// THE TRAP, form (b) — a BARE column-0 engine-call statement, result unassigned.
// This is the most natural a727c13 slip (a copy-pasted go()/onKeyPress() left at
// module scope instead of inside the factory) and the WR-01 form the calibration
// must also exercise:
go("select");

export function badScene() {
  return banner;
}
