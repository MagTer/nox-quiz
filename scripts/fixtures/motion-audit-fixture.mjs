// scripts/fixtures/motion-audit-fixture.mjs — the GREEN companion fixture for the
// Phase-36 (36-02) RED-first motion-audit proof.
//
// A minimal, node-importable level descriptor (mirrors the reachability Case-K/L mover
// fixtures — scripts/lib/reachability.mjs lines 1455-1504 — and the shipped level shape)
// carrying exactly ONE reachable moving platform and ONE crossable patroller on flat
// ground behind a checkpoint. It is NEVER added to LEVEL_ORDER (not one of the 8 shipped
// levels), so it can never affect the real select screen or the shipped-level audit.
//
// scripts/audit-motion-fixture.mjs injects THESE motion entities into a live game scene
// and drives them through auditLevelWithRetries (audit-retry.mjs) — the assertive
// RED->GREEN proof that driveToMover RIDES the platform and driveToPatroller CROSSES the
// patroller (and that contact fires the respawn seam). The geometry's `floors` mirror the
// host scene's flat spawn floor so driveToXPlanned can plan the approach.
//
// Motion schema (36-RESEARCH.md Open Question 1, RESOLVED — symmetric excluded-from-freeze
// keys): movers = geometry.movers [{x1,y1,x2,y2, w?}], patrollers = geometry.patrollers
// [{x1,y1,x2,y2, speed?}]. Both endpoints are placed reachable RIGHTWARD from spawn along
// flat ground (the validator's rightward-travel limitation; kept trivially satisfied here).
//
// PURE data module: the ONLY import is ../../src/config.js (node-importable, no engine refs).

import { CONFIG } from "../../src/config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of the flat floor the player stands on

export const MOTION_AUDIT_FIXTURE = {
  id: "motion-audit-fixture",
  displayName: "Motion Audit Fixture",
  // Kept on the shipped hard pool for parity; the fixture opens no math challenge.
  allowedTables: [6, 7, 8, 9],

  geometry: {
    // One flat spawn floor — the player walks right along it to the mover, then the
    // patroller. Matches the host scene's flat spawn island so driveToXPlanned's route
    // planning lines up with the real ground under the player.
    floors: [{ x: 0, w: 480 }],

    // ONE reachable moving platform: horizontal, LOW (72px above the floor top — a single
    // jump's reach) and WIDE (110px), oscillating between x1 and x2. Both endpoints sit
    // over the flat floor, so a missed mount just drops the player back onto the floor to
    // retry (WAIT-not-death). The raised-cosine drive in the runner reaches exactly
    // (x1,y1) and (x2,y2) at its extremes.
    movers: [{ x1: 200, y1: FLOOR_Y - 72, x2: 300, y2: FLOOR_Y - 72, w: 110 }],

    // ONE crossable patroller on the flat floor beyond the mover: a moving respawn-hazard
    // (32px tall, feet on the floor) that ping-pongs a short path. Walking into it fires
    // the respawn seam (snap back toward the checkpoint) — the cross signal.
    patrollers: [{ x1: 410, y1: FLOOR_Y - 32, x2: 450, y2: FLOOR_Y - 32, speed: 60 }],

    // A checkpoint near spawn — the respawn point the patroller cross snaps back to.
    checkpoints: [{ x: 40, y: FLOOR_Y - 48 }],

    // Nominal goal past the patroller (never driven to — present only for descriptor
    // parity with the shipped level shape).
    goal: { x: 465, y: FLOOR_Y },
  },
};

export default MOTION_AUDIT_FIXTURE;
