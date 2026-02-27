# BlitzFlash — Full Optimization Audit

**Audit Date:** 2026-02-27  
**Files Reviewed:** `app.js`, `index.html`, `style.css`, `words.js`, `words_part1.js`–`words_part7.js`

---

## 1) Optimization Summary

**Current Health:** Moderate. The app is a vanilla HTML/CSS/JS flashcard tool with ~800 words loaded up-front via 8 synchronous `<script>` tags. For its size it works, but several structural patterns will cause real pain as the word count grows or features are added.

**Top 3 Highest-Impact Improvements:**

1. **`getAllWords()` is called repeatedly without caching** — every mode start, every option generation, every sentence question calls it, each time creating a new concatenated array from 8 sources (~800 objects).
2. **`generateSentenceOptions()` calls `getAllWords()` again internally AND uses an unbounded retry loop** to pick 3 unique distractors — O(n) find per call, with theoretical infinite-loop risk on tiny word sets.
3. **Eight synchronous `<script>` tags block page render** — ~107 KB of word data is loaded render-blocking in the `<body>`.

**Biggest risk if no changes are made:**  
Adding more words will linearly worsen startup time and make the `generateSentenceOptions` retry loop increasingly expensive per question. `innerHTML` usage without sanitization also carries an XSS vector if word data ever comes from user input.

---

## 2) Findings (Prioritized)

### F1 — `getAllWords()` Called Redundantly on Every Mode Start
- **Category:** Algorithm / Memory
- **Severity:** High
- **Impact:** CPU time, memory allocations (creates ~800-element array copies every call)
- **Evidence:** `getAllWords()` called in `startGame()` (L61), `startTypingMode()` (L314), `startSentenceMode()` (L592), AND inside `generateSentenceOptions()` (L642) — so it runs once per sentence question too.
- **Why it's inefficient:** Each call runs 7 `typeof` checks, 7 `concat()` operations, and produces a fresh array. During sentence mode it's called *per question*.
- **Recommended fix:** Cache the result at module scope. Compute once on first use, invalidate only if word list changes (it never does at runtime).
  ```js
  let _cachedAllWords = null;
  function getAllWords() {
      if (!_cachedAllWords) {
          _cachedAllWords = [...vocabulary];
          if (typeof wordsPart1 !== 'undefined') _cachedAllWords = _cachedAllWords.concat(wordsPart1);
          // ...
      }
      return _cachedAllWords;
  }
  ```
- **Tradeoffs / Risks:** None — word data is static at runtime.
- **Expected impact:** Eliminates ~800+ object copies per mode start; eliminates per-question concatenation in sentence mode.
- **Removal Safety:** Safe
- **Reuse Scope:** Module-wide

---

### F2 — `generateSentenceOptions()` Unbounded Retry Loop
- **Category:** Algorithm
- **Severity:** High
- **Impact:** CPU latency per sentence question; theoretical infinite loop with < 4 words
- **Evidence:** L647–L654 — `while (wrongWordObjects.length < 3)` picks random indices and retries on collision.
- **Why it's inefficient:** With 800 words this averages ~3 iterations, but it calls `getAllWords()` inside AND does a `some()` scan on each attempt. If the word pool ever shrinks below 4, it's an infinite loop.
- **Recommended fix:** Pre-shuffle or use Fisher-Yates partial selection to pick 3 unique distractors in O(1) amortized:
  ```js
  function generateSentenceOptions(correctWord) {
      const allWords = getAllWords(); // now cached
      const filtered = allWords.filter(w => w.english !== correctWord);
      // Fisher-Yates pick 3
      for (let i = filtered.length - 1; i > filtered.length - 4 && i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
      }
      const wrong = filtered.slice(-3);
      const options = [allWords.find(w => w.english === correctWord), ...wrong];
      // shuffle options...
  }
  ```
- **Tradeoffs / Risks:** `filter()` creates one array per call, but it's bounded and deterministic.
- **Expected impact:** Eliminates retry loop and worst-case risk; ~30% faster option generation.
- **Removal Safety:** Safe
- **Reuse Scope:** Local file

---

### F3 — Render-Blocking Script Tags for Word Data
- **Category:** Frontend / I/O
- **Severity:** Medium
- **Impact:** Initial page load time (First Contentful Paint)
- **Evidence:** `index.html` L248–L256 — eight `<script>` tags loaded synchronously in `<body>`.
- **Why it's inefficient:** Each script blocks parsing. Total ~107 KB of JS data must be downloaded, parsed, and executed before the page becomes interactive.
- **Recommended fix:** Add `defer` attribute to all word scripts, or consolidate into a single file, or load asynchronously:
  ```html
  <script src="words.js?v=2.1" defer></script>
  ```
  Or better, merge all word files into one `words_all.js` to reduce HTTP requests.
- **Tradeoffs / Risks:** Must ensure `app.js` runs after word data is available. `defer` handles this automatically for scripts in order.
- **Expected impact:** ~50-100ms faster FCP on slow connections.
- **Removal Safety:** Likely Safe (test load order)
- **Reuse Scope:** Service-wide

---

### F4 — `innerHTML` Used Without Sanitization
- **Category:** Reliability / Security
- **Severity:** Medium
- **Impact:** XSS vector if word data ever comes from untrusted sources
- **Evidence:**
  - `showTypingFeedback()` L459–460: `typingWord.innerHTML = ...${typingCurrentWord.english}...`
  - `sentenceTranslation.innerHTML` (L701, L723)
  - `displaySentenceQuestion()` L618: `sentenceText.innerHTML = blankSentence`
  - `showLeaderboard()` L537: `row.innerHTML = ...`
- **Why it's inefficient:** Even without XSS risk, `innerHTML` triggers full re-parse of the element. `textContent` + DOM API would be faster for most cases.
- **Recommended fix:** Use `textContent` for plain text. For structured content, use `createElement`/`appendChild` or template literals only with escaped values.
- **Tradeoffs / Risks:** More verbose code for structured HTML.
- **Expected impact:** Low performance gain, but eliminates XSS risk category entirely.
- **Removal Safety:** Needs Verification
- **Reuse Scope:** Module-wide

---

### F5 — Duplicated Completion Logic Across Modes
- **Category:** Code Reuse
- **Severity:** Medium
- **Impact:** Maintenance cost, bug surface area
- **Evidence:** Three nearly identical completion functions:
  - `showFreeCompletion()` (L146–155)
  - `showTypingCompletion()` (L472–489)
  - `endTypingGame()` (L346–363)
  
  These all: clear intervals, set `gameActive = false`, update card text with emoji + score, show leaderboard.
- **Why it's inefficient:** Any change to completion flow must be replicated in 3 places. Bug drift risk is high.
- **Recommended fix:** Extract a shared `showGameCompletion({ title, emoji, correct, wrong, showLeaderboard })` function.
- **Tradeoffs / Risks:** Minor refactor; must preserve mode-specific differences.
- **Expected impact:** ~30% reduction in completion-related code; single point of change.
- **Removal Safety:** Safe
- **Reuse Scope:** Module-wide
- **Classification:** Reuse Opportunity

---

### F6 — Duplicated DOM Query `document.querySelectorAll('.swipe-indicator')` in Hot Path
- **Category:** Frontend / DOM
- **Severity:** Medium
- **Impact:** Unnecessary DOM queries during every mousemove event
- **Evidence:** 
  - `mousemove` handler (L246): `document.querySelectorAll('.swipe-indicator')` called on every mouse move during drag.
  - `mouseup` handler (L262): Same query again.
- **Why it's inefficient:** `querySelectorAll` scans the DOM tree every call. During drag, `mousemove` fires 60+ times/second.
- **Recommended fix:** Cache the indicator elements at module scope:
  ```js
  const swipeIndicators = document.querySelectorAll('.swipe-indicator');
  const swipeLeftIndicator = document.querySelector('.swipe-indicator.swipe-left');
  const swipeRightIndicator = document.querySelector('.swipe-indicator.swipe-right');
  ```
- **Tradeoffs / Risks:** None — elements are static.
- **Expected impact:** Eliminates ~120+ DOM queries per second during drag.
- **Removal Safety:** Safe
- **Reuse Scope:** Local file

---

### F7 — `document.getElementById('card-inner')` Inside `swipeCard()`
- **Category:** Frontend / DOM
- **Severity:** Low
- **Impact:** Redundant DOM lookup on every card swipe
- **Evidence:** L129: `const cardInner = document.getElementById('card-inner');` — called inside `swipeCard()` which runs on every correct/wrong action.
- **Why it's inefficient:** Element is static; should be cached at module scope like other DOM refs.
- **Recommended fix:** Add `const cardInner = document.getElementById('card-inner');` to the top-level DOM element declarations (near L2).
- **Tradeoffs / Risks:** None.
- **Expected impact:** Negligible per-swipe, but follows consistent caching pattern.
- **Removal Safety:** Safe
- **Reuse Scope:** Local file

---

### F8 — `normalizeText()` Uses 6 Sequential `.replace()` Calls
- **Category:** Algorithm / CPU
- **Severity:** Low
- **Impact:** Minor CPU per typing answer check
- **Evidence:** L396–403 — six separate `replace()` calls for Turkish character normalization, plus one more for punctuation removal.
- **Why it's inefficient:** Each `replace()` creates a new string and scans the full input. A single regex with a character map would do one pass.
- **Recommended fix:**
  ```js
  const TURKISH_CHAR_MAP = { 'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c' };
  const TURKISH_CHAR_REGEX = /[ığüşöç]/g;

  function normalizeText(text) {
      return text.toLowerCase().trim()
          .replace(TURKISH_CHAR_REGEX, ch => TURKISH_CHAR_MAP[ch])
          .replace(/[^\w\s]/g, '');
  }
  ```
- **Tradeoffs / Risks:** None.
- **Expected impact:** ~3x fewer string allocations per normalization call.
- **Removal Safety:** Safe
- **Reuse Scope:** Module-wide

---

### F9 — Dead / Legacy CSS Still Present
- **Category:** Frontend / Build
- **Severity:** Low
- **Impact:** Bundle size, maintainability
- **Evidence:**
  - **Time Selection styles** (L1417–1452): `.time-selection`, `.time-title`, `.time-options`, `.time-btn` — comment says "(legacy)". No HTML uses these classes.
  - **Countdown Overlay styles** (L1454–1489): `.countdown-overlay`, `.countdown-number` — no HTML references these.
  - **Results Screen styles** (L829–908): `.results-screen`, `.results-container`, etc. — no HTML references these.
- **Why it's inefficient:** ~130 lines of dead CSS increase file size and confuse future maintenance.
- **Recommended fix:** Remove all three dead CSS blocks after verifying no JS dynamically creates these elements.
- **Tradeoffs / Risks:** Must verify no dynamic DOM creation uses these classes.
- **Expected impact:** ~130 lines removed, ~3 KB saved.
- **Removal Safety:** Likely Safe
- **Reuse Scope:** Local file
- **Classification:** Dead Code

---

### F10 — Dead HTML: Timer Display in Free Mode
- **Category:** Frontend / Dead Code
- **Severity:** Low
- **Impact:** Unnecessary DOM nodes, confusion
- **Evidence:** `index.html` L177–180 — `#timer-display` div exists in the free mode game area but is always hidden and never used by `app.js` (no JS references `timer-display` or `timer-value` in free mode).
- **Why it's inefficient:** Dead DOM nodes that are never shown.
- **Recommended fix:** Remove the timer display div from the free mode HTML.
- **Tradeoffs / Risks:** None.
- **Expected impact:** Cleaner DOM.
- **Removal Safety:** Safe
- **Reuse Scope:** Local file
- **Classification:** Dead Code

---

### F11 — Word Data Spread Across 8 Files
- **Category:** I/O / Network
- **Severity:** Low
- **Impact:** 8 HTTP requests vs 1; cache invalidation complexity with `?v=2.1`
- **Evidence:** 8 separate `<script>` tags for word data (~107 KB total).
- **Why it's inefficient:** 8 round-trips for static data. Each file has a manual cache-bust version query param.
- **Recommended fix:** Merge all word files into a single `words_all.js`. Or use a build step / JS module system.
- **Tradeoffs / Risks:** Slightly harder to edit individual word sections.
- **Expected impact:** 7 fewer HTTP requests; faster load on HTTP/1.1.
- **Removal Safety:** Safe
- **Reuse Scope:** Service-wide

---

### F12 — Inline Shuffle Duplication in `generateSentenceOptions()`
- **Category:** Code Reuse
- **Severity:** Low
- **Impact:** Maintenance cost
- **Evidence:** L660–663 — Fisher-Yates shuffle is inlined again inside `generateSentenceOptions()`, even though `shuffleArray()` exists at L43.
- **Why it's inefficient:** Duplicated algorithm; any shuffle fix must be applied twice.
- **Recommended fix:** Replace inline shuffle with `shuffleArray(allOptionObjects)`.
- **Tradeoffs / Risks:** None.
- **Expected impact:** ~4 lines removed, single implementation source.
- **Removal Safety:** Safe
- **Reuse Scope:** Local file
- **Classification:** Reuse Opportunity

---

### F13 — `showTypingFeedback()` Creates Uncancellable `setTimeout`
- **Category:** Reliability
- **Severity:** Medium
- **Impact:** Race condition if user exits typing mode or game ends while timeout is pending
- **Evidence:** L466–469 — `setTimeout` advances to next word after delay, but is never cleared on mode exit or game end.
- **Why it's inefficient:** If user presses "Geri" during the feedback delay, `displayTypingWord()` will still fire and could error or show stale state.
- **Recommended fix:** Store the timeout ID and clear it in `exitTypingMode()` and `endTypingGame()`:
  ```js
  let typingFeedbackTimeout = null;
  // In showTypingFeedback:
  typingFeedbackTimeout = setTimeout(() => { ... }, delay);
  // In exitTypingMode / endTypingGame:
  clearTimeout(typingFeedbackTimeout);
  ```
- **Tradeoffs / Risks:** None.
- **Expected impact:** Eliminates potential state corruption on rapid mode exit.
- **Removal Safety:** Safe
- **Reuse Scope:** Local file

---

### F14 — Sentence Mode `checkSentenceAnswer()` Has Duplicated Correct/Wrong Blocks
- **Category:** Code Reuse
- **Severity:** Low
- **Impact:** Maintenance cost
- **Evidence:** L687–730 — The correct and wrong branches both: disable buttons, fill blank, show translation, set timeout. Only differences are: which class to add, which counter to increment, and timeout duration.
- **Why it's inefficient:** ~20 lines of near-identical code in each branch.
- **Recommended fix:** Extract shared post-answer logic; pass `isCorrect` and timeout duration as parameters.
- **Tradeoffs / Risks:** Minor refactor.
- **Expected impact:** ~15 lines reduction; single point of maintenance.
- **Removal Safety:** Safe
- **Reuse Scope:** Local file
- **Classification:** Reuse Opportunity

---

### F15 — CSS `backdrop-filter: blur(20px)` on Multiple Elements
- **Category:** Frontend / GPU
- **Severity:** Low
- **Impact:** GPU compositing cost on low-end devices
- **Evidence:** `.header` (L291), `.footer` (L820), `.game-header` (L937) all use `backdrop-filter: blur(20px)`.
- **Why it's inefficient:** Blur is GPU-expensive, especially on mobile. Three simultaneous blur layers compound the cost.
- **Recommended fix:** Consider reducing blur radius to `blur(10px)` or removing it from footer (least visible). Test on low-end Android.
- **Tradeoffs / Risks:** Slightly different visual appearance.
- **Expected impact:** Measurable FPS improvement on low-end mobile devices.
- **Removal Safety:** Needs Verification
- **Reuse Scope:** Local file

---

### F16 — Background Grid Animation Runs Continuously
- **Category:** Frontend / GPU
- **Severity:** Low
- **Impact:** Continuous GPU compositing even when user is idle
- **Evidence:** L78 — `animation: gridMove 25s linear infinite;` on `.background-effects::before`.
- **Why it's inefficient:** Infinite CSS animation on a full-screen pseudo-element forces continuous repainting.
- **Recommended fix:** Use `will-change: transform` (already implied by animation), but consider pausing the animation when UI is not in focus:
  ```css
  @media (prefers-reduced-motion: reduce) {
      .background-effects::before { animation: none; }
      .gradient-orb { animation: none; }
  }
  ```
- **Tradeoffs / Risks:** Users with `prefers-reduced-motion` won't see the animation (which is the intended behavior).
- **Expected impact:** Battery savings on mobile; accessibility compliance.
- **Removal Safety:** Safe
- **Reuse Scope:** Local file

---

## 3) Quick Wins (Do First)

| # | Finding | Effort | Impact |
|---|---------|--------|--------|
| 1 | **F1:** Cache `getAllWords()` result | 5 min | High — eliminates per-question array copy |
| 2 | **F6:** Cache swipe indicator DOM refs | 2 min | Medium — kills 120+ DOM queries/sec during drag |
| 3 | **F7:** Cache `card-inner` DOM ref | 1 min | Low — consistency |
| 4 | **F12:** Replace inline shuffle with `shuffleArray()` | 2 min | Low — dedup |
| 5 | **F8:** Single-pass Turkish normalization | 5 min | Low — cleaner, fewer allocations |
| 6 | **F13:** Store and clear feedback timeout | 3 min | Medium — prevents race condition |
| 7 | **F16:** Add `prefers-reduced-motion` media query | 3 min | Low — accessibility + battery |

**Total Quick Wins Effort:** ~20 minutes

---

## 4) Deeper Optimizations (Do Next)

| # | Finding | Effort | Impact |
|---|---------|--------|--------|
| 1 | **F2:** Rewrite `generateSentenceOptions()` with deterministic selection | 20 min | High — eliminates retry loop |
| 2 | **F9:** Remove dead CSS (~130 lines) | 15 min | Low — cleaner codebase |
| 3 | **F10:** Remove dead timer HTML | 2 min | Low — cleaner DOM |
| 4 | **F5:** Extract shared completion function | 30 min | Medium — maintainability |
| 5 | **F14:** Consolidate correct/wrong answer handling | 20 min | Low — maintainability |
| 6 | **F11:** Merge 8 word files into 1 | 15 min | Medium — fewer HTTP requests |
| 7 | **F3:** Add `defer` to script tags | 5 min | Medium — faster FCP |
| 8 | **F4:** Replace `innerHTML` with safe DOM methods | 45 min | Medium — security hardening |

---

## 5) Validation Plan

### Automated / Manual Tests
1. **Functional smoke test:** Open each mode (Serbest, Yazarak Tahmin, Cümle Tamamla), play through 5+ words, verify correct/wrong counting, card flip, swipe, keyboard nav.
2. **Sentence mode regression:** Verify 4 unique options are always generated, correct answer is always among them, blank is filled on answer.
3. **Typing mode timer:** Verify timer starts on first answer, ends at 0, leaderboard saves.
4. **Edge case test:** Test with only 3 words available — should not infinite-loop in sentence mode.
5. **Race condition test:** In typing mode, rapidly press "Geri" during feedback delay — should not crash or show stale state.

### Performance Benchmarks
1. **`getAllWords()` call count:** Before/after — use `console.count('getAllWords')` temporarily to confirm caching works.
2. **Drag performance:** Open DevTools > Performance tab, drag card for 3 seconds, compare "Scripting" time before/after indicator caching.
3. **Page load:** DevTools > Network tab — verify script count drops from 9 to 2 (or 1+1 with defer) after file merge.

### Metrics to Compare
| Metric | Before | After (Expected) |
|--------|--------|-------------------|
| `getAllWords()` calls per sentence game | N (one per question) | 1 total |
| DOM queries during 3s drag | ~360+ | 0 |
| Render-blocking scripts | 9 | 1–2 |
| CSS dead lines | ~130 | 0 |
| `setTimeout` leak potential | Yes | No |

---

## 6) Optimized Code Snippets

### Cached `getAllWords()` (F1)
```javascript
let _cachedAllWords = null;
function getAllWords() {
    if (_cachedAllWords) return _cachedAllWords;
    _cachedAllWords = [...vocabulary];
    if (typeof wordsPart1 !== 'undefined') _cachedAllWords = _cachedAllWords.concat(wordsPart1);
    if (typeof wordsPart2 !== 'undefined') _cachedAllWords = _cachedAllWords.concat(wordsPart2);
    if (typeof wordsPart3 !== 'undefined') _cachedAllWords = _cachedAllWords.concat(wordsPart3);
    if (typeof wordsPart4 !== 'undefined') _cachedAllWords = _cachedAllWords.concat(wordsPart4);
    if (typeof wordsPart5 !== 'undefined') _cachedAllWords = _cachedAllWords.concat(wordsPart5);
    if (typeof wordsPart6 !== 'undefined') _cachedAllWords = _cachedAllWords.concat(wordsPart6);
    if (typeof wordsPart7 !== 'undefined') _cachedAllWords = _cachedAllWords.concat(wordsPart7);
    return _cachedAllWords;
}
```

### Cached DOM Refs (F6, F7)
```javascript
// Add near top with other DOM constants
const cardInner = document.getElementById('card-inner');
const swipeIndicators = document.querySelectorAll('.swipe-indicator');
const swipeLeftIndicator = document.querySelector('.swipe-indicator.swipe-left');
const swipeRightIndicator = document.querySelector('.swipe-indicator.swipe-right');
```

### Single-Pass Turkish Normalization (F8)
```javascript
const TURKISH_CHAR_MAP = { 'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c' };
const TURKISH_CHAR_REGEX = /[ığüşöç]/g;

function normalizeText(text) {
    return text.toLowerCase().trim()
        .replace(TURKISH_CHAR_REGEX, ch => TURKISH_CHAR_MAP[ch])
        .replace(/[^\w\s]/g, '');
}
```

### Cancelable Feedback Timeout (F13)
```javascript
let typingFeedbackTimeout = null;

// In showTypingFeedback(), replace the setTimeout:
typingFeedbackTimeout = setTimeout(() => {
    typingCurrentIndex++;
    displayTypingWord();
}, isCorrect ? FEEDBACK_DELAY_MS_CORRECT : FEEDBACK_DELAY_MS_WRONG);

// In exitTypingMode() and endTypingGame(), add:
clearTimeout(typingFeedbackTimeout);
```

### Accessibility Motion Reduction (F16)
```css
@media (prefers-reduced-motion: reduce) {
    .background-effects::before { animation: none; }
    .gradient-orb { animation: none; }
    .hint-icon { animation: none; }
    .flashcard.swiping-right { animation: none; }
    .flashcard.swiping-left { animation: none; }
}
```
