// src/camera.js — frame-rate-independent camera follow, clamped to level bounds.
//
// followCamera(target) is called once per frame from the scene's onUpdate. It moves
// the camera center toward the target using exponential (half-life) smoothing that
// is correct at ANY refresh rate — NOT a raw constant-factor lerp, which would
// converge faster at higher refresh rates and break frame-rate independence (MOVE-05,
// RESEARCH Pitfall 4). The result is clamped to level bounds so void is never shown
// at the level edges (RESEARCH Pitfall 6).
//
// Engine globals (getCamPos, setCamPos, lerp, clamp, width, height, dt) come from
// Kaplay `global: true` — only CONFIG needs importing. KAPLAY 3001 setter names are
// used (setCamPos, not the deprecated camPos alias).

import { CONFIG } from "./config.js";

export function followCamera(target) {
  const cur = getCamPos(); // current camera center

  // Frame-rate-independent smoothing factor: 1 - exp(-rate * dt()).
  const t = 1 - Math.exp(-CONFIG.CAM_RATE * dt());

  let nx = lerp(cur.x, target.pos.x, t); // primary X follow
  let ny = lerp(cur.y, target.pos.y, t * CONFIG.CAM_Y_FACTOR); // gentle Y follow

  // Clamp so the half-viewport never extends past the level bounds (no void at edges).
  const halfW = width() / 2;
  const halfH = height() / 2;
  nx = clamp(nx, CONFIG.LEVEL_LEFT + halfW, CONFIG.LEVEL_RIGHT - halfW);
  ny = clamp(ny, CONFIG.LEVEL_TOP + halfH, CONFIG.LEVEL_BOTTOM - halfH);

  setCamPos(nx, ny);
}
