# AGENTS.md

## Must-follow constraints

- **No build tools.** Pure vanilla HTML/CSS/JS — no npm, no bundler, no framework. Open `index.html` directly in browser.
- **No `console.log` in production.** Test-only; remove after verification.
- **No magic numbers/strings.** Important values must be `const` at module scope (e.g., `GRID_MAX_ATTEMPTS`, `TYPING_GAME_DURATION_SECONDS`).
- **No `innerHTML`.** Use `createElement`/`textContent`/`appendChild` for all DOM construction to avoid XSS vectors.
- **Word data is static at runtime.** `getAllWords()` is cached — never mutate the returned array. Use `[...getAllWords()]` if you need a mutable copy.

## Repo-specific conventions

- All scripts use `defer` in `index.html` — load order is: `words*.js` first, then `app.js`.
- Cache version param (`?v=2.2`) on script/CSS tags — bump when changing files.
- Word files (`words.js`, `words_part1-7.js`) export global `const` arrays (`vocabulary`, `wordsPart1`–`wordsPart7`). `getAllWords()` in `app.js` concatenates them.
- Each word object shape: `{ english, turkish, englishSentence, turkishSentence }`.
- Turkish text normalization: use `normalizeText()` for all user-input comparison — it strips Turkish chars (`ığüşöç`) and punctuation.
- Game modes are screen-swapping via `.hidden` class on root-level `<div>` containers. Mode screen is `#mode-screen`.
- New game mode checklist: add button to `#mode-screen` → add screen `<div>` to `index.html` → add CSS block to `style.css` → add JS section to `app.js` with DOM refs + logic + event listeners at bottom.

## Important locations

- `app.js` — all game logic, single file, sections separated by `// ===== MODE NAME =====` comments
- `style.css` — all styles including CSS variables (`:root`), responsive breakpoints at bottom
- `words.js` + `words_part1-7.js` — word data (global arrays, no modules)

## Change safety rules

- `shuffleArray()` mutates in-place — always spread-copy before shuffling shared data: `shuffleArray([...source])`.
- Clearing `setInterval`/`setTimeout` on mode exit is mandatory — store IDs and clear in exit functions.
- `prefers-reduced-motion` media query exists — test animations work with and without it.

## Known gotchas

- `getAllWords()` result is cached after first call. If you add a new word file, you must add the `typeof` check + `concat` in `getAllWords()` AND add the `<script defer>` tag in `index.html`.
- Sentence mode regex `\b${word}\b` can fail on words with special regex chars — not currently guarded.
- `localStorage` key `blitzflash_leaderboard` is used for typing mode scores — don't collide.
