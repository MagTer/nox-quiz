# Walking Skeleton — Math Lab

**Phase:** 1
**Generated:** 2026-06-20

## Capability Proven End-to-End

A user opens `math-lab.html` directly in Chrome, sees a multiplication question with 4 answer choices, clicks an answer and sees immediate colored feedback, earns XP that is saved to localStorage, and sees a level-up overlay when the XP threshold is crossed — all without a server, build step, or internet connection.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | None — vanilla HTML/CSS/JS (ES2020+) | Single-file constraint requires no framework. Direct DOM manipulation is appropriate for a linear game loop; no VDOM overhead. |
| Data layer | localStorage with JSON serialization (`mathlab_save_v1`) | Synchronous, offline, 5–10 MB limit, sufficient for <100 KB game state. Works on file:// protocol. Versioned key enables future migration. |
| Auth | None | Local single-user game. No accounts, no login, no data leaves the device. |
| Deployment target | Local file (`math-lab.html`) opened via file:// or double-click | Zero install. The file IS the deployment. No server, no build step. |
| Module system | IIFE closure modules (not ES6 modules) | ES6 `import/export` requires a server (CORS) on file:// in some browsers. Closure IIFEs work on any file:// origin. |
| Directory layout | Single file (`math-lab.html`), no subdirectories | All HTML, CSS, and JS embedded in one file. Version-controlled with git; <200 KB. |
| Game loop | `requestAnimationFrame` + event-driven (click → answer) | rAF pauses when tab is hidden (power-efficient). Click events drive state transitions — no continuous update cycle needed for a turn-based quiz. |
| State management | Closure-based modules: PlayerState, QuestionSelector, Renderer, InputHandler | No global state. Each module owns its data. InputHandler coordinates between modules on click events. |
| Persistence strategy | Save on every answer + `visibilitychange` + `beforeunload` | Belt-and-suspenders: covers mid-session tab switches, mobile Chrome backgrounding, and desktop window close. |
| CSS architecture | Custom properties (`:root`) + BEM-lite class naming | Color palette as CSS variables for easy tuning. Keyframe animations for level-up and feedback (hardware-accelerated, no JS overhead). |
| Accessibility | HTML5 fieldset + legend + radio + label (native semantics) | Native keyboard navigation, screen reader support, zero ARIA annotations needed. Radio inputs visually hidden; labels are the click targets. |
| Grunge texture | SVG feTurbulence as CSS data URI on `body::after` | Zero file size impact. No external image request. Procedural — scales to any resolution. Opacity controlled by CSS custom property. |

## Stack Touched in Phase 1

- [x] Project scaffold — single HTML file with embedded `<style>` and `<script>` blocks
- [x] Routing — no routing needed (single view); game state is the "screen"
- [x] Data layer — localStorage read (on init) and write (on every answer + visibility events)
- [x] UI — interactive multiple-choice answer buttons wired to XP/accuracy state
- [x] Deployment — open `math-lab.html` in Chrome; documented local server fallback: `python3 -m http.server 8000`

## Out of Scope (Deferred to Later Slices)

These features are explicitly NOT in the skeleton. Future work must not re-litigate Phase 1's minimalism:

- Audio feedback / reward sounds (v2 — ENG-02)
- Session summary screen after play sessions (v2 — ENG-01)
- Novelty rotation / alternative question formats (v2 — ENG-03)
- Cosmetic progression / unlockable themes (v2 — ENG-04)
- Streak mechanics (v2)
- High-contrast mode toggle (v2)
- Difficulty mode selector (v2 — auto-adaptation via accuracy weighting handles this in v1)
- Mobile-first responsive layout (Windows laptop desktop target only)
- Any online/server component, leaderboards, or social features (out of scope permanently)

## Subsequent Slice Plan

Math Lab is a single-phase MVP. Phase 1 delivers the complete v1 product. Future versions add engagement features on top of this skeleton without changing its architectural decisions:

- v2 Phase 2: Engagement features (session summary, streak celebration, cosmetic unlocks)
- v2 Phase 3: Audio (optional reward sounds, ambient mode)
- v2 Phase 4: Novelty rotation (2–3 alternative question formats)
