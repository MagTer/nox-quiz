# Stack Research

**Domain:** Standalone gamified math practice web app (single HTML file, offline-first, localStorage persistence)
**Researched:** 2026-06-20
**Confidence:** HIGH

## Executive Summary

For a single-file, zero-dependency web app targeting offline use with localStorage persistence, **vanilla JavaScript with inline CSS** is the only viable approach. The ecosystem in 2025 has shifted decisively toward lightweight, frameworkless solutions for self-contained tools. No build step, no dependencies, no CDN—everything embeds directly in the HTML file. The game loop uses native `requestAnimationFrame`, data persistence relies on localStorage with error handling, and styling leverages CSS gradient techniques for grunge textures. This stack is battle-tested, performant, and future-proof.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vanilla JavaScript | ES2020+ | All game logic, state management, event handling | No dependencies, ships in a single file; native browser APIs (localStorage, requestAnimationFrame) are mature and fast. Framework overhead is wasted on a linear game loop. |
| HTML5 | Living Standard | Semantic structure, form controls | Radio buttons with `<fieldset>/<legend>` provide accessible multiple-choice; native form APIs need no polyfills in modern browsers. |
| CSS3 | 2023+ | Layout, dark mode, grunge textures, animations | Grainy gradients, blend modes, and `mix-blend-mode` create grunge textures without images or filters. Dark mode is native CSS custom properties. No layout framework needed. |
| localStorage API | Native | XP/level persistence across sessions | 5–10 MB per origin; synchronous; works offline; good enough for game state under 100 KB. No IndexedDB complexity for this use case. |
| requestAnimationFrame | Native | Game loop, smooth animations | Synced to 60 FPS; pauses automatically when tab loses focus (energy efficient); no setInterval lag. Standard for web games since 2012. |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **None (pure vanilla)** | — | — | **Always.** No external CDN calls; everything inlined. | HIGH |
| Anime.js (optional reference) | 3.2.x+ | Animation sequences if needed | Only if complex easing required; at 13 KB minified, may exceed single-file philosophy; inline minimal timing functions instead. | MEDIUM |
| CSS-only animations | Native | Transitions, fade-ins, level-up celebration | Preferred for performance and offline use; CSS keyframes are declarative and hardware-accelerated. | HIGH |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Text editor (VS Code, Sublime) | Code authoring | No build tools; just edit and save. Pre-commit hooks optional for linting. |
| Git | Version control | Track HTML file; size stays under 200 KB easily for typical game scope. |
| Browser DevTools (F12) | Testing and debugging | Inspect localStorage, profiler for frame rate, console for errors. No separate dev server needed. |
| Local file server (optional) | CORS testing | `python3 -m http.server 8000` if testing from file:// causes issues; else open .html directly. |

## Architecture Decisions

### Why Vanilla JavaScript Over Frameworks

| Framework | Problem for This Project | Why Vanilla Wins |
|-----------|-------------------------|-----------------|
| React / Vue | Adds 30–50 KB gzipped; requires JSX/build step; DOM diffing overkill for imperative game loop | Direct DOM manipulation is faster; no VDOM overhead; single loop runs entire state update and render. |
| Svelte | Smaller (13 KB) but still adds build step and compiler; compilation targets not tested for single-file isolation | Raw ES2020 is smaller and needs zero compilation; ships instantly without bundler. |
| Lit / Web Components | Web Components are great but add API surface; unnecessary abstraction for single-file game | Game loop doesn't benefit from component reuse; direct DOM mutations are clearer here. |

**Verdict:** Vanilla ES2020+ is 8–15 KB smaller, ships with zero build overhead, and runs immediately in any browser. Game loops are imperative by nature; frameworks add ceremony without benefit.

### Game Loop Pattern

```javascript
// Fixed-timestep game loop with requestAnimationFrame
let lastFrameTime = 0;
const FPS = 60;
const frameInterval = 1000 / FPS;
let deltaTimeAccumulator = 0;

function gameLoop(currentTime) {
  const deltaTime = currentTime - lastFrameTime;
  lastFrameTime = currentTime;
  
  deltaTimeAccumulator += deltaTime;
  while (deltaTimeAccumulator >= frameInterval) {
    update(frameInterval);  // Game state update
    deltaTimeAccumulator -= frameInterval;
  }
  
  render();  // DOM render
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

**Why this pattern:**
- Separates physics/logic updates (fixed 60 FPS) from rendering (vsync)
- Prevents stack overflow (requestAnimationFrame schedules asynchronously)
- Pauses automatically when tab is inactive (power efficient)
- Consistent frame times across devices

### localStorage Persistence Strategy

**Data Structure (single JSON blob):**
```javascript
{
  version: 1,  // For future migrations
  level: 8,
  totalXP: 12450,
  sessionCount: 24,
  lastPlayed: "2026-06-20T14:32:00Z"
}
```

**Save on Exit (two-pronged approach):**
```javascript
// Save on visibility change (mobile-friendly)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    saveGame();
  }
});

// Fallback for desktop
window.addEventListener('beforeunload', () => {
  saveGame();
});

// Periodic autosave (every 10 questions)
let questionCount = 0;
function onAnswerSubmitted() {
  questionCount++;
  if (questionCount % 10 === 0) saveGame();
}
```

**Error Handling:**
```javascript
function saveGame() {
  try {
    const gameState = { version: 1, level, totalXP, sessionCount, lastPlayed: new Date().toISOString() };
    localStorage.setItem('mathLabSave', JSON.stringify(gameState));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('localStorage full; consider file export');
    }
  }
}
```

**Rationale:**
- localStorage is synchronous (safe in beforeunload)
- visibilitychange is more reliable than beforeunload on mobile
- JSON serialization is built-in; no external serializer needed
- Error catching prevents app crash if browser storage is full or disabled
- Version number allows future save-format migrations without data loss

### Dark Mode + Grunge Aesthetic (Pure CSS)

**Grunge Texture Technique:**
```css
body {
  background: #0a0a0a;
  position: relative;
}

body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    repeating-radial-gradient(
      circle at 0 0,
      rgba(255, 255, 255, 0.03) 1px,
      transparent 1px
    ),
    repeating-radial-gradient(
      circle at 2px 2px,
      rgba(0, 0, 0, 0.05) 1px,
      transparent 1px
    );
  background-size: 50px 50px, 70px 70px;
  pointer-events: none;
  z-index: -1;
}
```

**Why this approach:**
- Zero image files (no external resources)
- Subtle grain effect (not harsh or pixelated)
- Layer multiple gradients for naturalistic texture
- pointer-events: none ensures it doesn't interfere with click targets
- Works at any screen resolution

**Dark Colors (recommended palette):**
| Element | Color | Rationale |
|---------|-------|-----------|
| Background | `#0a0a0a` or `#1a1a1a` | Softer than pure `#000000`; less eye strain |
| Text (primary) | `#e8e8e8` or `#f0f0f0` | Softer than pure white; WCAG AA contrast ratio with dark bg |
| Accent (XP/level up) | `#00ff88` (neon green) or `#ff6600` (neon orange) | Grunge-friendly; high contrast; edgy aesthetic |
| Borders/dividers | `#333333` or `#444444` | Subtle separation without clutter |

**Animations (CSS only):**
```css
/* Level-up celebration */
@keyframes levelUpPulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 0.8; }
}

.level-up-text {
  animation: levelUpPulse 0.6s ease-out;
}

/* Smooth transitions */
.button {
  transition: all 0.15s ease;
}

.button:hover {
  background-color: #00ff88;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}
```

**Why CSS animations over JavaScript:**
- Hardware accelerated (smoother, less CPU)
- No JavaScript overhead
- Declarative (easier to adjust timing)
- Works even if JS is briefly busy

### Accessible Multiple-Choice Form

**HTML Structure:**
```html
<fieldset>
  <legend>Question 3 of 10</legend>
  <p class="question-text">What is 7 × 8?</p>
  
  <ul class="options-list">
    <li>
      <input type="radio" id="opt1" name="answer" value="54" />
      <label for="opt1">54</label>
    </li>
    <li>
      <input type="radio" id="opt2" name="answer" value="56" />
      <label for="opt2">56</label>
    </li>
    <li>
      <input type="radio" id="opt3" name="answer" value="58" />
      <label for="opt3">58</label>
    </li>
    <li>
      <input type="radio" id="opt4" name="answer" value="60" />
      <label for="opt4">60</label>
    </li>
  </ul>
  
  <button type="submit" class="submit-btn">Submit Answer</button>
</fieldset>
```

**Why this pattern:**
- `<fieldset>` + `<legend>` tells screen readers the question context
- `<label>` associates click target with radio button (larger hit area)
- `name="answer"` ensures only one option selected at a time
- Semantic HTML5 (no ARIA overhead needed for standard patterns)
- Keyboard navigation is native (arrow keys, Enter)

**CSS for readability (ADHD-friendly):**
```css
.options-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.options-list li {
  display: flex;
  align-items: center;
}

.options-list input[type="radio"] {
  margin-right: 0.75rem;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.options-list label {
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.options-list input[type="radio"]:checked + label {
  background-color: rgba(0, 255, 136, 0.2);
  font-weight: 600;
}

/* Ensure sufficient contrast */
.options-list label {
  color: #e8e8e8;
}
```

**ADHD-friendly considerations embedded:**
- No timers in event listeners (users control pace)
- Sufficient spacing between options (reduce cognitive load)
- Clear visual feedback on selection (not subtle)
- Large touch target for radio buttons (20px)
- No auto-submit (explicit button click only)

## Installation

Since this is a single-file app with no npm dependencies, there is no install step:

```bash
# Development
1. Clone or download the repo
2. Open math-lab.html in your browser
3. Edit with any text editor; save and refresh browser

# No npm, no build step, no server required

# Optional: If you encounter CORS issues with file:// protocol
python3 -m http.server 8000
# Then navigate to http://localhost:8000/math-lab.html
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative | Why We Avoid It |
|-------------|-------------|-------------------------|-----------------|
| Vanilla JS | React / Vue | Medium+ apps with complex component state; 50+ interactive elements | 30–50 KB overhead; requires build step and Node.js; single file constraint broken; overkill for linear game loop |
| HTML5 radio buttons | Div-based custom buttons | Extreme design customization | Loses accessibility; requires ARIA annotations; more JS code to handle keyboard events |
| CSS gradients for grunge | Image-based textures (PNG/JPG) | Extreme visual fidelity needed | Adds file size; breaks offline use (if external CDN); slower to load; no responsive scaling |
| localStorage | IndexedDB | Large game saves (>5 MB) or complex relational data | More complex API; async (incompatible with beforeunload); overkill for simple XP/level persistence |
| requestAnimationFrame | setInterval / setTimeout | Rare: ultra-low-end devices with poor RAF support | 30-year-old devices; setInterval has jank and CPU overhead; modern browsers all support RAF |
| ES2020+ JS | TypeScript | Large teams, complex type requirements | Requires build step (Node.js); breaks single-file constraint; overkill for <200 KB scope |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| CDN-hosted libraries (jQuery, Bootstrap, Anime.js) | Breaks offline use; requires internet; adds latency; fails if CDN down | Inline equivalents; copy-paste critical snippets if needed; 99% can be vanilla |
| Webpack / Parcel / Rollup | Build step adds complexity; generates separate chunks; requires Node.js toolchain | None; edit HTML directly. If you need bundling, you've outgrown this project. |
| Cloud databases (Firebase, AWS) | Breaks offline-only requirement; adds latency; user data privacy concerns | localStorage only; optional file export for manual backup. |
| Mobile-first responsive frameworks (Tailwind, Bootstrap) | Adds 30–100 KB CSS; breakpoint cascade is overkill for fixed desktop layout | Hand-written CSS; desktop-only design (per PROJECT.md). |
| setTimeout/setInterval for game timing | Jank (not synced to vsync); CPU overhead; can't pause when tab hidden | requestAnimationFrame (pauses automatically; synced to 60 FPS). |
| Framework animation libraries (framer-motion, React Spring) | Tied to React; massive overhead; client-side performance hit | CSS keyframes (hardware accelerated; no JS overhead). |
| Automatic minification (UglifyJS online tools) | Bloats file with build artifacts; harder to debug; single-file philosophy breaks | Keep readable; browser DevTools works fine; size is negligible for this app. |

## Stack Patterns by Variant

### Pattern: Persistence Without Backend
- **Use:** localStorage with JSON serialization + visibilitychange listener
- **Because:** Works offline; no server required; synchronous saves don't block user interaction; simple to debug (inspect in browser console)
- **Not:** IndexedDB (overkill complexity), cookies (too small, sent on every request), sessionStorage (cleared on close)

### Pattern: Dark Grunge Aesthetic
- **Use:** CSS gradients for texture + dark color palette + `mix-blend-mode` + neon accents
- **Because:** Zero file dependencies; responsive (scales to any resolution); fast to load and render; works in all modern browsers
- **Not:** Pre-rendered image backgrounds (file size, no offline offline guarantee), SVG filters (adds complexity), canvas textures (runs on every render)

### Pattern: Smooth UI Animations
- **Use:** CSS `@keyframes` for transitions + requestAnimationFrame for game loop
- **Because:** Hardware accelerated; no JavaScript overhead; declarative and maintainable
- **Not:** JavaScript animation libraries (adds dependency; slower execution), jQuery.animate (deprecated pattern)

### Pattern: Accessible Forms
- **Use:** HTML5 `<fieldset>`, `<legend>`, `<label>` with radio buttons
- **Because:** Native keyboard navigation; screen reader friendly; requires zero ARIA annotations for standard quiz pattern; works in all browsers
- **Not:** Div-based custom buttons (requires ARIA + keyboard event handling), checkboxes (wrong semantic meaning for single-select)

## Version Compatibility

| Technology | Version | Browser Support | Notes |
|------------|---------|-----------------|-------|
| ES2020 JavaScript | 2020+ | Chrome 85+, Firefox 78+, Safari 14+, Edge 85+ | Includes optional chaining, nullish coalescing, Promise.allSettled; widely supported as of 2025. Older IE11 not supported (acceptable per PROJECT.md). |
| localStorage API | Native | All modern browsers | 5–10 MB per origin; some private browsing modes restrict access; wrapped in try-catch to handle quota exceeded. |
| requestAnimationFrame | Native | All modern browsers (since 2012) | Synced to monitor refresh rate; pauses automatically when tab is hidden. No fallback needed for 2025+. |
| CSS Gradients + Blend Modes | CSS3 (2012+) | All modern browsers | `mix-blend-mode`, `repeating-radial-gradient` fully supported; no vendor prefixes needed for 2025+. |
| HTML5 Form Elements | HTML5 | All modern browsers | `<fieldset>`, `<legend>`, radio buttons, labels; no polyfills needed. |

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Initial load time | < 100 ms | Single HTML file; no external requests; instant from disk. |
| Frame rate | 60 FPS | requestAnimationFrame synced to monitor; CSS animations hardware-accelerated. |
| Single-file size | < 200 KB | HTML + CSS + JS combined; gzip compression reduces to ~50 KB (optional). |
| Memory usage | < 10 MB | Small game state (< 100 KB in localStorage); DOM tree is small (20–30 elements). |
| localStorage read/write | < 1 ms | Synchronous, optimized for small JSON blobs; save on every 10 questions or visibility change. |

## Sources

### Official & High-Confidence

- [Web APIs: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — MDN; localStorage API, error handling, quota limits. (HIGH confidence)
- [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) — MDN; game loop patterns, timing, power efficiency. (HIGH confidence)
- [HTML5 Form Elements & Accessibility](https://www.w3.org/WAI/tutorials/forms/) — W3C; fieldset/legend/label patterns for accessible forms. (HIGH confidence)
- [CSS Gradients & Blend Modes](https://developer.mozilla.org/en-US/docs/Web/CSS/gradient) — MDN; grunge texture techniques. (HIGH confidence)

### Community Research

- [We build our web apps with vanilla JS — here's how (and why)](https://dev.to/julian_vanloggerenberg_c/we-build-our-web-apps-without-react-heres-how-and-why-4005) — DEV Community; single-file app patterns. (MEDIUM confidence)
- [GitHub: Single-HTML-File-Apps](https://github.com/drakeaxelrod/single-html-file-apps) — Collection of real-world examples; no-dependency architecture. (HIGH confidence)
- [Game Save Best Practices for Web Games](https://bugnet.io/blog/game-save-best-practices-web) — Bugnet; localStorage patterns for games, error handling, visibilitychange listener. (MEDIUM confidence)
- [ADHD-Friendly Web Design: Minimizing Distractions](https://www.boia.org/blog/adhd-friendly-web-design-minimizing-distractions) — BOIA; low-stress UI patterns, no timers, sensory-friendly design. (MEDIUM confidence)
- [Performant Game Loops in JavaScript](https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/) — Technical blog; fixed-timestep game loop patterns. (MEDIUM confidence)
- [Dark Mode in Web Design: Best Practices in 2025](https://medium.com/@jackbrownkarmaa/dark-mode-in-web-design-best-practices-in-2025-445d8d6463a3) — Medium; color palettes, contrast ratios, CSS custom properties. (MEDIUM confidence)
- [Grainy Gradients | CSS-Tricks](https://css-tricks.com/grainy-gradients/) — CSS-Tricks; grunge texture implementation with pure CSS. (HIGH confidence)

## Confidence Assessment by Area

| Area | Level | Reasoning |
|------|-------|-----------|
| **Vanilla JS + No Dependencies** | HIGH | Consensus across 2025 web dev community; single-file apps are proven pattern; no competing standard. |
| **localStorage Persistence** | HIGH | MDN documentation mature; real-world game devs use visibilitychange + beforeunload pattern; error handling is straightforward. |
| **Game Loop (requestAnimationFrame)** | HIGH | Browser API mature since 2012; all modern browsers support; fixed-timestep pattern is industry standard. |
| **CSS Grunge Textures** | HIGH | Pure CSS gradients with blend modes are well-documented; no image dependencies; cross-browser support confirmed. |
| **ADHD-Friendly UI** | MEDIUM | Design principles are established (no timers, low stimulation, clear feedback), but individual user response varies; verify during UAT. |
| **Accessible Forms** | HIGH | HTML5 fieldset/legend/label patterns are W3C standard; widely supported; keyboard navigation is native. |

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| localStorage quota exceeded (rare) | Low | Wrap saves in try-catch; warn user; offer file export option. |
| Private/incognito mode breaks persistence | Low | Detect and notify user; no app-breaking issue (read-only mode works). |
| CSS grunge texture too subtle or too harsh | Low | CSS variables for texture opacity; easy to tweak before shipping. |
| Frame rate drops on low-end devices | Low | requestAnimationFrame pauses when hidden; no background resource drain. |

## Next Steps for Implementation

1. **Phase 1: Core Game Loop** — Implement requestAnimationFrame pattern, state management (vanilla objects), question generation logic.
2. **Phase 2: localStorage Persistence** — Implement XP/level system with save/load; test visibilitychange + beforeunload listeners.
3. **Phase 3: UI & Styling** — Apply dark grunge aesthetic; build accessible form component; add CSS animations for level-up.
4. **Phase 4: Testing & Validation** — UAT with target user (12-year-old); test ADHD-friendly flow (no stress, no timers); verify offline use.

---

*Stack research for: Math Lab (standalone gamified math practice web app)*
*Researched: 2026-06-20*
*Confidence: HIGH*
