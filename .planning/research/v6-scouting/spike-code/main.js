// v6.0 technical spikes against the PINNED vendored Kaplay 3001.0.19 (byte-copy).
// Scene "platform": dt-based oscillating platforms + player-carry idiom (MOT-02).
// Scene "autotile": grid-atlas slicing + neighbor-based frame pick + fill terrain (ART-02).
// Throwaway code — idioms here are written to be port-ready (no timers, closure state).
import kaplay from "./kaplay.mjs";

const k = kaplay({
  width: 640,
  height: 360,
  background: "#0a0a0a",
  crisp: true,
  canvas: document.querySelector("#game"),
});

loadSprite("atlas", "./atlas.png", { sliceX: 4, sliceY: 2 });
loadSprite("fill", "./fill.png"); // dedicated 16px fill tile for tiled-region rendering

const GRAVITY = 1400; // same magnitude class as the game's CONFIG.GRAVITY

// ---------------- platform scene ----------------
scene("platform", () => {
  setGravity(GRAVITY);

  // static ground for reference/landing
  add([rect(640, 40), pos(0, 320), area(), body({ isStatic: true }), color(40, 40, 40)]);

  // Oscillating platform factory — dt-accumulated sine, NO timers/tweens.
  // Carry idiom: the platform moves itself in its own onUpdate, computes its
  // per-frame delta, and drags any body currently standing on it (curPlatform)
  // by the same delta. Closure-local state only.
  function makeMover(x0, y0, axis, amplitude, periodS, colr) {
    const plat = add([
      rect(96, 16),
      pos(x0, y0),
      area(),
      body({ isStatic: true }),
      color(...colr),
      "mover",
    ]);
    let t = 0;
    const omega = (2 * Math.PI) / periodS;
    // Engine-verified: Kaplay 3001 body() natively carries riders (stickToPlatform,
    // default ON) — manual carry DOUBLE-applies and slides the rider off. Kept here
    // behind a flag purely to demonstrate the anti-pattern.
    plat.carryEnabled = false;
    plat.onUpdate(() => {
      t += dt();
      const offset = amplitude * Math.sin(omega * t);
      const target = axis === "x" ? x0 + offset : y0 + offset;
      const delta = target - plat.pos[axis];
      plat.pos[axis] = target;
      if (plat.carryEnabled && player.curPlatform() === plat) {
        player.pos[axis] += delta;
      }
    });
    return plat;
  }

  const platH = makeMover(120, 240, "x", 80, 3, [200, 160, 60]);
  const platV = makeMover(420, 260, "y", 60, 3, [80, 160, 200]);

  const player = add([
    rect(16, 32),
    pos(150, 200),
    area(),
    body(),
    color(220, 60, 60),
    "player",
  ]);

  // per-frame sample recorder for the Playwright driver
  const samples = [];
  onUpdate(() => {
    samples.push({
      t: time(),
      px: player.pos.x,
      py: player.pos.y,
      hx: platH.pos.x,
      hy: platH.pos.y,
      vx: platV.pos.x,
      vy: platV.pos.y,
      grounded: player.isGrounded(),
      onH: player.curPlatform() === platH,
      onV: player.curPlatform() === platV,
    });
    if (samples.length > 3000) samples.shift();
  });

  window.__spike = {
    scene: "platform",
    samples,
    clearSamples() { samples.length = 0; },
    teleport(x, y) { player.pos.x = x; player.pos.y = y; player.vel.x = 0; player.vel.y = 0; },
    // mount the player just above a mover's CURRENT position (it oscillates)
    mount(which) {
      const p = which === "v" ? platV : platH;
      player.pos.x = p.pos.x + 40;
      player.pos.y = p.pos.y - 40;
      player.vel.x = 0; player.vel.y = 0;
    },
    setCarry(on) { platH.carryEnabled = on; platV.carryEnabled = on; },
    jump(f) { player.jump(f ?? 520); },
    ready: true,
  };
});

// ---------------- autotile scene ----------------
scene("autotile", () => {
  const T = 16;
  // pure, port-ready autotiler: occupancy set -> frame index
  // atlas frames: 0 cap-left, 1 cap-mid, 2 cap-right, 3 cap-single,
  //               4 fill-a, 5 fill-b, 6 edge-left, 7 edge-right
  function buildOccupancy(rects) {
    const occ = new Set();
    for (const r of rects) {
      for (let gx = r.x / T; gx < (r.x + r.w) / T; gx++) {
        for (let gy = r.y / T; gy < (r.y + r.h) / T; gy++) {
          occ.add(`${gx},${gy}`);
        }
      }
    }
    return occ;
  }
  function pickFrame(occ, gx, gy) {
    const up = occ.has(`${gx},${gy - 1}`);
    const left = occ.has(`${gx - 1},${gy}`);
    const right = occ.has(`${gx + 1},${gy}`);
    if (!up) {
      if (!left && !right) return 3; // cap-single
      if (!left) return 0;           // cap-left
      if (!right) return 2;          // cap-right
      return 1;                      // cap-mid
    }
    if (!left) return 6;             // edge-left
    if (!right) return 7;            // edge-right
    return (gx + gy) % 2 === 0 ? 4 : 5; // fill variants
  }
  function renderTerrain(rects, tag, useOffscreen) {
    const occ = buildOccupancy(rects);
    let count = 0;
    for (const key of occ) {
      const [gx, gy] = key.split(",").map(Number);
      const comps = [sprite("atlas", { frame: pickFrame(occ, gx, gy) }), pos(gx * T, gy * T), tag];
      // offscreen({hide}) = engine-side render culling for out-of-view tiles
      if (useOffscreen) comps.push(offscreen({ hide: true, distance: 64 }));
      add(comps);
      count++;
    }
    return count;
  }

  // demo terrain: floor w/ fill to bottom, floating platform, pillar, single tile
  const demo = [
    { x: 0, y: 320, w: 640, h: 48 },
    { x: 208, y: 240, w: 96, h: 32 },
    { x: 480, y: 176, w: 32, h: 144 },
    { x: 96, y: 208, w: 16, h: 16 },
  ];
  const demoCount = renderTerrain(demo, "demo");

  window.__spike = {
    scene: "autotile",
    demoCount,
    // stress: destroy demo, render a huge filled region; return counts + build ms
    stress(cols, rows, useOffscreen) {
      for (const o of get("demo")) destroy(o);
      for (const o of get("stress")) destroy(o);
      const t0 = performance.now();
      const n = renderTerrain(
        [{ x: 0, y: 360 - rows * T, w: cols * T, h: rows * T }],
        "stress",
        useOffscreen,
      );
      return { tiles: n, buildMs: performance.now() - t0 };
    },
    // tiled-fill idiom: per-tile sprites ONLY for the cap row; the whole fill body
    // below is ONE sprite with {tiled:true} — object count collapses from
    // cols*rows to cols+1 per run.
    stressTiled(cols, rows) {
      for (const o of get("demo")) destroy(o);
      for (const o of get("stress")) destroy(o);
      const t0 = performance.now();
      const yTop = 360 - rows * T;
      let n = 0;
      for (let gx = 0; gx < cols; gx++) {
        add([sprite("atlas", { frame: gx === 0 ? 0 : gx === cols - 1 ? 2 : 1 }), pos(gx * T, yTop), "stress"]);
        n++;
      }
      // one giant tiled quad silently drops past an internal batch limit —
      // chunk the fill into <=CHUNK-column tiled sprites instead
      const CHUNK = 40;
      for (let cx = 0; cx < cols; cx += CHUNK) {
        const cw = Math.min(CHUNK, cols - cx);
        add([
          sprite("fill", { tiled: true, width: cw * T, height: (rows - 1) * T }),
          pos(cx * T, yTop + T),
          "stress",
        ]);
        n++;
      }
      return { objects: n, coveredTiles: cols * rows, buildMs: performance.now() - t0 };
    },
    fps: () => debug.fps(),
    ready: true,
  };
});

const params = new URLSearchParams(location.search);
go(params.get("scene") === "autotile" ? "autotile" : "platform");
