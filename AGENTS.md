# guilliman.ru

Static single-page site — no build, no runtime deps, no tests.

## Structure
- `index.html` — inert wrapper (`#bezel > #screen > #terminal > #output`)
- `js/terminal.js` — IIFE: connection sequence → ASCII box header → menu of 7 services → prompt. All content is runtime-generated.
- `js/emojifall.js` — emoji snowfall layer spawned into `#screen`
- `css/style.css` — CRT aesthetics (scanlines, vignette, flicker, power-on animation), screensaver mode (`.saver-mode`)
- `phrases.json` — taglines fetched on load; served from `/phrases.json`

## Services (index 0–6)
guilliman.ru (screensaver on 1), blog.guilliman.ru, input.guilliman.ru, tartan.guilliman.ru, stl.guilliman.ru, password.guilliman.ru, md.guilliman.ru

## Key conventions
- **All JS is ES6+** (async/await, arrow functions). Must pass `node -c`.
- `TYPE_SPEED` in `terminal.js:26` — typing speed multiplier (1 = normal, <1 faster, >1 slower)
- `setEmojiSpawnRate(ms)` in `emojifall.js:30` — controls emoji spawn interval
- Screensaver: press `1` or click first link → `body.saver-mode` class → terminal collapses, emojis brighten
- Any keypress/click during screensaver reloads the page
- Links injected after typewriter via `makeLinksClickable()` — replaces plain text with `<a class="svc-link">`
- Header tagline loaded from `phrases.json` at random per page load

## Deployment
- Deployed via GitHub Pages to `guilliman.ru` (see `CNAME`)
- Push to `main` to deploy
