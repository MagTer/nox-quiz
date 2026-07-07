# v6.0 Technical Spike Findings — Moving Platforms & Autotile Fill

**Run:** 2026-07-08, outside the GSD harness by explicit user authorization (pre-work for
SEED-001, alongside Phase 26 execution). Everything below was measured in a real headless
Chromium against a **byte-copy of the pinned vendored Kaplay 3001.0.19** (`lib/kaplay.mjs`),
not read from docs. Spike code + driver are committed under `spike-code/`; screenshots
under `spike-*.png`. Zero page errors in every run.

---

## Spike A — Moving platforms + player carry (MOT-02)

### Headline: the engine carries riders natively. Do NOT write carry code.

Kaplay 3001's `body()` has built-in platform-stick (verified in the vendored source, not
docs): each rider tracks `curPlatform()` and its last position, and every `update()`
applies the platform's movement delta to the rider via `moveBy` — enabled by default
(opt-out: `body({ stickToPlatform: false })`). The platform only needs `area()` +
`body({ isStatic: true })` and to move by mutating `pos` (NOT forces).

### Measured (640×360, gravity 1400, 96×16 platform, dt-based sine)

| Case | Result |
|------|--------|
| Horizontal ±80px, 3s period, 12s ride (4 cycles), native carry | **100% of frames mounted**; relative drift bounded ~30px total and non-cumulative (first third 26.9px vs last third 24.2px) — rider stays on indefinitely |
| Vertical ±60px, 3s period, 6s ride, native carry | Rode the **full 120px cycle**; 90% frame-contact (brief gravity re-catch at downward reversals — never fell off); rel. drift 6.1px |
| Jump off a moving platform → land | Clean: airborne, then grounded again (landed back on the mover itself in one run, ground in another). `jump()` explicitly clears `curPlatform` in-engine |
| **ANTI-PATTERN: manual delta-carry in the platform's onUpdate** | Double-applies on top of native carry — rider slides off in <1s (**4.2% mounted**). v6.0 build code must not hand-carry |

### Port-ready idiom (no timers — check-safety compliant)

```js
const plat = add([sprite(...), pos(x0, y0), area(), body({ isStatic: true }), "mover"]);
let t = 0;
plat.onUpdate(() => {
  t += dt();
  plat.pos.x = x0 + AMPLITUDE * Math.sin(((2 * Math.PI) / PERIOD_S) * t);
  // no rider code — body() stickToPlatform does the carry
});
```

### Bonus engine facts verified for MOT-01 (patrol enemies)

- **`patrol({ waypoints, speed, endBehavior: "loop"|"ping-pong" })` is a built-in
  component** — dt-based `moveTo` in `update()`, no timers/schedulers. This is the patrol
  enemy's movement, free. (`"loop"` here is a string literal, not the banned `loop()`
  scheduler — but expect `check-safety.sh` review when it lands in `src/`.)
- `platformEffector({ useOneWay })` (one-way platforms) and `surfaceEffector` (conveyor)
  also exist if ever wanted.

### Validator note (for planning)

Reachability must model a moving platform at BOTH extremes (a jump that works at the near
extreme may HARD-FAIL at the far one. Simplest sound rule: require reachability at the
worst-case extreme).

---

## Spike B — Autotile fill renderer (ART-02)

### Headline: neighbor-picked cap row + chunked `tiled` fill = full SNES fill at 58fps.

### What was proven

1. **Grid atlases slice fine**: `loadSprite(..., { sliceX: 4, sliceY: 2 })` works;
   per-tile `sprite("atlas", { frame: i })` renders correctly.
2. **The autotiler itself is trivial and pure** (port-ready): build an occupancy `Set`
   from the descriptor's floors+platforms on the 16px grid, then per tile:
   no-tile-above → cap (left/mid/right/single by horizontal neighbors); else fill
   (edge-left/edge-right/interior variants by parity). 8 frames suffice. Verified
   visually on floor + floating platform + tall pillar + single tile (`spike-autotile-demo.png`).
3. **Perf cliff is OBJECT COUNT, not pixels** (headless Chromium, pessimistic vs real GPU):

   | Strategy | Coverage | Objects | Build | FPS after 3s |
   |----------|----------|---------|-------|--------------|
   | Per-tile sprites | 1,120 tiles | 1,120 | 58ms | **54–60** |
   | Per-tile sprites | 5,600 tiles | 5,600 | ~300ms | **15** |
   | + `offscreen({hide})` culling | 5,600 tiles | 5,600 | ~300ms | **22** — culling is NOT the fix (update overhead dominates, not draw) |
   | **Cap row per-tile + fill as `{tiled:true}` chunk sprites** | 5,600 tiles | **410** | **9ms** | **58** |

4. **`tiled: true` gotcha**: it works — even tiling a single *frame* from a sliced atlas —
   but ONE giant tiled quad (400×13 tiles in one object) **silently renders nothing**
   (internal vertex-batch ceiling). Chunk tiled fills to **≤ ~40×16 tiles per object**.
   First run's 59fps "win" was actually an invisible fill — caught by screenshot
   verification, which is why "checks that don't look at pixels lie" applies to spikes too.

### Rendering recipe for v6.0 build.js (visual pass only — merged colliders unchanged)

- Occupancy set from `g.floors` + `g.platforms` (16px grid).
- Surface/cap row + left/right edges: per-tile `sprite("atlas-<biome>", { frame })` via the
  pure `pickFrame` (spike-code/main.js).
- Interior fill: per run, chunked `sprite("fill-<biome>", { tiled: true, width, height })`,
  ≤40 columns per chunk.
- Budget guide: per-tile sprite count stays ~O(level-width/16); a 6,200px level ≈ ~400
  cap tiles + ~20 fill chunks + edges ≈ well inside the 60fps envelope measured.

### Asset-pipeline implication (feeds ART-01 bake phase)

Gothicvania sheets are **not uniform 16px grids** — terrain comes as decorative ~32px
blocks with ~20–24px gold cap lips. The bake step must cut a clean modular atlas per biome
(the spike's 8-frame atlas was cut from the Old Dark Castle block at x512,y152; crops in
`spike-code/`). For visual quality the real atlas likely wants 16×32 cap tiles (cap + fill
transition) instead of the spike's rough 16×16 squares.

---

## Evidence & reproduction

- `spike-platform-scene.png` — rider mounted on the moving platform mid-ride
- `spike-autotile-demo.png` — autotiler frame picks on floor/platform/pillar/single
- `spike-autotile-tiled.png` — chunked tiled fill covering the full frame (the 58fps case)
- `spike-probe-tiled.png` — tiled-vs-plain sprite probe (incl. per-frame tiling from atlas)
- `spike-code/` — `main.js` (both scenes, port-ready idioms), `run-spikes.mjs` (Playwright
  driver + numeric assertions), `probe-tiled.mjs`, `index.html`, `atlas.png`, `fill.png`.
  Rebuild anywhere: copy `lib/kaplay.mjs` next to them, `node run-spikes.mjs`.
