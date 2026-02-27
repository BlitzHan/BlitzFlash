// DOM Elements
const flashcard = document.getElementById('flashcard');
const cardInner = document.getElementById('card-inner');
const englishWord = document.getElementById('english-word');
const englishSentence = document.getElementById('english-sentence');
const turkishWord = document.getElementById('turkish-word');
const turkishSentence = document.getElementById('turkish-sentence');
const correctBtn = document.getElementById('correct-btn');
const wrongBtn = document.getElementById('wrong-btn');
const flipBtn = document.getElementById('flip-btn');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const correctCount = document.getElementById('correct-count');
const wrongCount = document.getElementById('wrong-count');
const totalCount = document.getElementById('total-count');

// Cached swipe indicator refs (F6 — avoid querySelectorAll in hot paths)
const swipeIndicators = document.querySelectorAll('.swipe-indicator');
const swipeLeftIndicator = document.querySelector('.swipe-indicator.swipe-left');
const swipeRightIndicator = document.querySelector('.swipe-indicator.swipe-right');

// Mode Selection Elements
const modeScreen = document.getElementById('mode-screen');
const gameArea = document.getElementById('game-area');
const freeModeBtn = document.getElementById('free-mode-btn');

// State
let currentIndex = 0;
let correct = 0;
let wrong = 0;
let shuffledVocabulary = [];
let gameMode = 'free';
let isGameActive = false;

// Combine all vocabulary (F1 — cached; word data is static at runtime)
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

// Fisher-Yates shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Start Free Mode
function startFreeMode() {
    gameMode = 'free';
    modeScreen.classList.add('hidden');
    gameArea.classList.remove('hidden');
    startGame();
}

// Start Game
function startGame() {
    shuffledVocabulary = shuffleArray(getAllWords());
    currentIndex = 0;
    correct = 0;
    wrong = 0;
    isGameActive = true;

    totalCount.textContent = shuffledVocabulary.length;
    updateStats();
    displayCurrentWord();
    updateProgress();
}

// Display current word
function displayCurrentWord() {
    if (!isGameActive || currentIndex >= shuffledVocabulary.length) return;

    const word = shuffledVocabulary[currentIndex];
    flashcard.classList.remove('flipped');

    englishWord.textContent = word.english;
    englishSentence.textContent = word.englishSentence;
    turkishWord.textContent = word.turkish;
    turkishSentence.textContent = word.turkishSentence;

    updateProgress();
}

// Update progress
function updateProgress() {
    const progress = ((currentIndex + 1) / shuffledVocabulary.length) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${currentIndex + 1} / ${shuffledVocabulary.length}`;
}

// Update stats
function updateStats() {
    correctCount.textContent = correct;
    wrongCount.textContent = wrong;
}

// Mark correct
function markCorrect() {
    if (!isGameActive) return;
    correct++;
    updateStats();
    swipeCard('right');
}

// Mark wrong
function markWrong() {
    if (!isGameActive) return;
    wrong++;
    updateStats();
    swipeCard('left');
}

// Swipe card
function swipeCard(direction) {
    flashcard.classList.add(`swiping-${direction}`);

    setTimeout(() => {
        flashcard.classList.remove(`swiping-${direction}`);

        if (currentIndex < shuffledVocabulary.length - 1) {
            currentIndex++;

            // Snap card to front face instantly before showing new content
            // to prevent the next card's back face from being briefly visible
            cardInner.style.transition = 'none';
            flashcard.classList.remove('flipped');
            // Force reflow so the instant snap takes effect
            void cardInner.offsetHeight;
            cardInner.style.transition = '';

            flashcard.classList.add('entering');
            displayCurrentWord();
            setTimeout(() => flashcard.classList.remove('entering'), 150);
        } else {
            showFreeCompletion();
        }
    }, 200);
}

// Show free mode completion
function showFreeCompletion() {
    isGameActive = false;
    const percentage = Math.round((correct / shuffledVocabulary.length) * 100);

    englishWord.textContent = '🎉 Tebrikler!';
    englishSentence.textContent = 'Tüm kelimeleri tamamladın!';
    turkishWord.textContent = `Skor: %${percentage}`;
    turkishSentence.textContent = `${correct} doğru, ${wrong} yanlış`;
    flashcard.classList.remove('flipped');
}

// Toggle flip
function toggleFlip() {
    flashcard.classList.toggle('flipped');
}

// Event Listeners
freeModeBtn.addEventListener('click', startFreeMode);

// Back button
const backBtn = document.getElementById('back-btn');
backBtn.addEventListener('click', goBack);

function goBack() {
    isGameActive = false;
    gameArea.classList.add('hidden');
    modeScreen.classList.remove('hidden');
}

// Drag tracking variables (declared early for click handler access)
let isDragging = false;
let dragStartX = 0;
let dragCurrentX = 0;

flashcard.addEventListener('click', (e) => {
    // Don't flip if we just finished dragging
    if (Math.abs(dragCurrentX - dragStartX) > 5) return;
    toggleFlip();
});
correctBtn.addEventListener('click', markCorrect);
wrongBtn.addEventListener('click', markWrong);
flipBtn.addEventListener('click', toggleFlip);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!isGameActive) return;
    switch (e.key) {
        case 'ArrowRight': markCorrect(); break;
        case 'ArrowLeft': markWrong(); break;
        case ' ':
        case 'Enter':
            e.preventDefault();
            toggleFlip();
            break;
    }
});

// Touch swipe support
let touchStartX = 0;
let touchStartY = 0;

flashcard.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

flashcard.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    const diffX = touchStartX - touchEndX;
    const diffY = Math.abs(touchStartY - touchEndY);

    if (Math.abs(diffX) > 80 && diffY < 100) {
        if (diffX > 0) markWrong();
        else markCorrect();
    }
}, { passive: true });

// Mouse drag swipe support (for desktop)
const SWIPE_THRESHOLD = 80;

flashcard.addEventListener('mousedown', (e) => {
    if (!isGameActive) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragCurrentX = e.clientX;
    flashcard.style.transition = 'none';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    dragCurrentX = e.clientX;
    const diffX = dragCurrentX - dragStartX;
    const rotation = diffX * 0.08;
    const opacity = Math.max(1 - Math.abs(diffX) / 400, 0.5);
    flashcard.style.transform = `translateX(${diffX}px) rotate(${rotation}deg)`;
    flashcard.style.opacity = opacity;

    // Show swipe indicators during drag (F6 — using cached refs)
    if (diffX > SWIPE_THRESHOLD) {
        swipeLeftIndicator.style.opacity = '0';
        swipeRightIndicator.style.opacity = '1';
    } else if (diffX < -SWIPE_THRESHOLD) {
        swipeLeftIndicator.style.opacity = '1';
        swipeRightIndicator.style.opacity = '0';
    } else {
        swipeLeftIndicator.style.opacity = '0';
        swipeRightIndicator.style.opacity = '0';
    }
});

document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    const diffX = dragCurrentX - dragStartX;

    // Reset swipe indicators (F6 — using cached refs)
    swipeIndicators.forEach(ind => ind.style.opacity = '0');

    flashcard.style.transition = '';
    flashcard.style.transform = '';
    flashcard.style.opacity = '';

    if (Math.abs(diffX) > SWIPE_THRESHOLD) {
        if (diffX > 0) markCorrect();
        else markWrong();
    }
});

// ===== TYPING GAME MODE =====
const typingGameScreen = document.getElementById('typing-game-screen');
const typingModeBtn = document.getElementById('typing-mode-btn');
const typingHomeBtn = document.getElementById('typing-home-btn');
const typingBadge = document.getElementById('typing-badge');
const typingWord = document.getElementById('typing-word');
const typingSentence = document.getElementById('typing-sentence');
const typingInput = document.getElementById('typing-input');
const typingSubmit = document.getElementById('typing-submit');
const typingFeedback = document.getElementById('typing-feedback');
const feedbackIcon = document.getElementById('feedback-icon');
const feedbackText = document.getElementById('feedback-text');
const typingCorrectCount = document.getElementById('typing-correct-count');
const typingWrongCount = document.getElementById('typing-wrong-count');
const typingProgressText = document.getElementById('typing-progress-text');
const typingTimerValue = document.getElementById('typing-timer-value');
const typingTimerDisplay = document.getElementById('typing-timer-display');

const TYPING_GAME_DURATION_SECONDS = 60;
const LEADERBOARD_STORAGE_KEY = 'blitzflash_leaderboard';
const LEADERBOARD_MAX_ENTRIES = 10;
const FEEDBACK_DELAY_MS_CORRECT = 1500;
const FEEDBACK_DELAY_MS_WRONG = 3000;
const typingLeaderboard = document.getElementById('typing-leaderboard');
const leaderboardList = document.getElementById('leaderboard-list');
const typingPlayAgainBtn = document.getElementById('typing-play-again-btn');

let typingCurrentIndex = 0;
let typingCorrect = 0;
let typingWrong = 0;
let typingShuffledWords = [];
let typingCurrentWord = null;
let typingIsEnglish = true; // true = showing English, need Turkish answer
let typingTimerInterval = null;
let typingTimeRemaining = TYPING_GAME_DURATION_SECONDS;
let typingTimerStarted = false;
let typingGameActive = false;
let typingFeedbackTimeout = null; // F13 — cancelable timeout ref

function startTypingMode() {
    modeScreen.classList.add('hidden');
    typingGameScreen.classList.remove('hidden');

    typingShuffledWords = shuffleArray(getAllWords());
    typingCurrentIndex = 0;
    typingCorrect = 0;
    typingWrong = 0;
    typingCorrectCount.textContent = '0';
    typingWrongCount.textContent = '0';
    typingTimeRemaining = TYPING_GAME_DURATION_SECONDS;
    typingTimerValue.textContent = typingTimeRemaining;
    typingTimerStarted = false;
    typingGameActive = true;
    clearInterval(typingTimerInterval);
    typingLeaderboard.classList.add('hidden');

    displayTypingWord();
}

function startTypingTimer() {
    typingTimerStarted = true;
    typingTimerInterval = setInterval(() => {
        typingTimeRemaining--;
        typingTimerValue.textContent = typingTimeRemaining;

        if (typingTimeRemaining <= 10) {
            typingTimerDisplay.classList.add('timer-warning');
        }

        if (typingTimeRemaining <= 0) {
            endTypingGame();
        }
    }, 1000);
}

function endTypingGame() {
    clearInterval(typingTimerInterval);
    clearTimeout(typingFeedbackTimeout);
    typingGameActive = false;
    typingTimerDisplay.classList.remove('timer-warning');

    showTypingEndScreen('⏱️ Süre Doldu!', '🏆', typingCorrect, typingWrong);
    saveLeaderboardScore(typingCorrect, typingWrong);
    showLeaderboard();
}

function displayTypingWord() {
    if (typingCurrentIndex >= typingShuffledWords.length) {
        showTypingCompletion();
        return;
    }

    typingCurrentWord = typingShuffledWords[typingCurrentIndex];

    // Randomly decide to show English or Turkish (50/50)
    typingIsEnglish = Math.random() > 0.5;

    if (typingIsEnglish) {
        typingBadge.textContent = 'English';
        typingBadge.classList.remove('turkish');
        typingWord.textContent = typingCurrentWord.english;
        typingSentence.textContent = typingCurrentWord.englishSentence;
    } else {
        typingBadge.textContent = 'Türkçe';
        typingBadge.classList.add('turkish');
        typingWord.textContent = typingCurrentWord.turkish;
        typingSentence.textContent = typingCurrentWord.turkishSentence;
    }

    typingInput.value = '';
    typingInput.focus();
    typingFeedback.classList.add('hidden');
    typingProgressText.textContent = `${typingCurrentIndex + 1} / ${typingShuffledWords.length}`;
}

// F8 — single-pass Turkish normalization using char map
const TURKISH_CHAR_MAP = { 'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c' };
const TURKISH_CHAR_REGEX = /[ığüşöç]/g;

function normalizeText(text) {
    return text.toLowerCase().trim()
        .replace(TURKISH_CHAR_REGEX, ch => TURKISH_CHAR_MAP[ch])
        .replace(/[^\w\s]/g, ''); // Remove punctuation
}

function checkTypingAnswer() {
    if (!typingGameActive) return;
    const userAnswer = typingInput.value.trim();
    if (!userAnswer) return;

    // Start timer on first answer
    if (!typingTimerStarted) {
        startTypingTimer();
    }

    let correctAnswer;
    if (typingIsEnglish) {
        // User needs to type Turkish
        correctAnswer = typingCurrentWord.turkish;
    } else {
        // User needs to type English
        correctAnswer = typingCurrentWord.english;
    }

    // Check if answer is correct (strict matching)
    const normalizedUser = normalizeText(userAnswer);
    const normalizedCorrect = normalizeText(correctAnswer);

    // For translations with multiple meanings (e.g., "Sevgi / Aşk / Sevmek"), check each part
    const correctParts = correctAnswer.split('/').map(part => normalizeText(part.trim()));

    // User answer must exactly match one of the correct parts
    const isCorrect = correctParts.some(part => part === normalizedUser) ||
        normalizedCorrect === normalizedUser;

    showTypingFeedback(isCorrect, correctAnswer);
}

function showTypingFeedback(isCorrect, correctAnswer) {
    typingFeedback.classList.remove('hidden', 'correct', 'wrong');

    if (isCorrect) {
        typingFeedback.classList.add('correct');
        feedbackIcon.textContent = '✓';
        feedbackText.textContent = 'Doğru!';
        typingCorrect++;
        typingCorrectCount.textContent = typingCorrect;
    } else {
        typingFeedback.classList.add('wrong');
        feedbackIcon.textContent = '✗';
        feedbackText.textContent = `Yanlış! Doğrusu: ${correctAnswer}`;
        typingWrong++;
        typingWrongCount.textContent = typingWrong;
    }

    // Show both English and Turkish on the card (F4 — safe DOM construction)
    typingBadge.textContent = '🇬🇧 / 🇹🇷';
    typingBadge.classList.remove('turkish');
    typingWord.textContent = `${typingCurrentWord.english} → ${typingCurrentWord.turkish}`;
    typingSentence.textContent = `${typingCurrentWord.englishSentence} | 🇹🇷 ${typingCurrentWord.turkishSentence}`;

    // F13 — cancelable timeout to prevent race on mode exit
    clearTimeout(typingFeedbackTimeout);
    typingFeedbackTimeout = setTimeout(() => {
        typingCurrentIndex++;
        displayTypingWord();
    }, isCorrect ? FEEDBACK_DELAY_MS_CORRECT : FEEDBACK_DELAY_MS_WRONG);
}

// F5 — shared typing end screen to avoid duplication
function showTypingEndScreen(title, icon, correctCnt, wrongCnt) {
    typingWord.textContent = title;
    typingBadge.textContent = 'Bitti';
    typingSentence.textContent = `Skorun: ${correctCnt} doğru cevap!`;
    typingInput.style.display = 'none';
    typingSubmit.style.display = 'none';
    typingFeedback.classList.remove('hidden', 'wrong');
    typingFeedback.classList.add('correct');
    feedbackIcon.textContent = icon;
    feedbackText.textContent = `${correctCnt} doğru, ${wrongCnt} yanlış`;
}

function showTypingCompletion() {
    clearInterval(typingTimerInterval);
    clearTimeout(typingFeedbackTimeout);
    typingGameActive = false;
    typingTimerDisplay.classList.remove('timer-warning');

    showTypingEndScreen('🎉 Tebrikler!', '⭐', typingCorrect, typingWrong);
    saveLeaderboardScore(typingCorrect, typingWrong);
    showLeaderboard();
}

function exitTypingMode() {
    clearInterval(typingTimerInterval);
    clearTimeout(typingFeedbackTimeout); // F13
    typingGameActive = false;
    typingTimerDisplay.classList.remove('timer-warning');
    typingGameScreen.classList.add('hidden');
    modeScreen.classList.remove('hidden');
    typingInput.style.display = '';
    typingSubmit.style.display = '';
    typingLeaderboard.classList.add('hidden');
}

// ===== LEADERBOARD =====
function getLeaderboardScores() {
    const data = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveLeaderboardScore(correctCount, wrongCount) {
    const scores = getLeaderboardScores();
    scores.push({
        score: correctCount,
        wrong: wrongCount,
        date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    });
    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    // Keep only top entries
    const trimmed = scores.slice(0, LEADERBOARD_MAX_ENTRIES);
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(trimmed));
}

// F4 — leaderboard built with safe DOM API instead of innerHTML
const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function createSpan(className, text) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
}

function showLeaderboard() {
    const scores = getLeaderboardScores();
    leaderboardList.textContent = '';

    if (scores.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'leaderboard-empty';
        emptyMsg.textContent = 'Henüz skor yok';
        leaderboardList.appendChild(emptyMsg);
    } else {
        scores.forEach((entry, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            if (index < 3) row.classList.add('leaderboard-top');

            const rankIcon = index < RANK_MEDALS.length ? RANK_MEDALS[index] : `${index + 1}.`;
            row.appendChild(createSpan('lb-rank', rankIcon));
            row.appendChild(createSpan('lb-score', `${entry.score} doğru`));
            row.appendChild(createSpan('lb-wrong', `${entry.wrong} yanlış`));
            row.appendChild(createSpan('lb-date', entry.date));
            leaderboardList.appendChild(row);
        });
    }

    typingLeaderboard.classList.remove('hidden');
}

function playAgainTyping() {
    typingLeaderboard.classList.add('hidden');
    startTypingMode();
}

// Typing mode event listeners
const typingBackBtn = document.getElementById('typing-back-btn');
typingModeBtn.addEventListener('click', startTypingMode);
typingHomeBtn.addEventListener('click', exitTypingMode);
typingBackBtn.addEventListener('click', exitTypingMode);
typingPlayAgainBtn.addEventListener('click', playAgainTyping);
typingSubmit.addEventListener('click', checkTypingAnswer);
typingInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        checkTypingAnswer();
    }
});

// ===== SENTENCE COMPLETION MODE =====
const sentenceGameScreen = document.getElementById('sentence-game-screen');
const sentenceModeBtn = document.getElementById('sentence-mode-btn');
const sentenceHomeBtn = document.getElementById('sentence-home-btn');
const sentenceText = document.getElementById('sentence-text');
const sentenceTranslation = document.getElementById('sentence-translation');
const sentenceOptions = document.getElementById('sentence-options');
const sentenceCorrectCountEl = document.getElementById('sentence-correct-count');
const sentenceWrongCountEl = document.getElementById('sentence-wrong-count');
const sentenceProgressText = document.getElementById('sentence-progress-text');

let sentenceCurrentIndex = 0;
let sentenceCorrect = 0;
let sentenceWrong = 0;
let sentenceShuffledWords = [];
let sentenceCurrentWord = null;
let sentenceCorrectOptionIndex = 0;
let sentenceCanClick = true;

function startSentenceMode() {
    modeScreen.classList.add('hidden');
    sentenceGameScreen.classList.remove('hidden');

    sentenceShuffledWords = shuffleArray(getAllWords());
    sentenceCurrentIndex = 0;
    sentenceCorrect = 0;
    sentenceWrong = 0;
    sentenceCorrectCountEl.textContent = '0';
    sentenceWrongCountEl.textContent = '0';
    sentenceCanClick = true;

    displaySentenceQuestion();
}

function displaySentenceQuestion() {
    if (sentenceCurrentIndex >= sentenceShuffledWords.length) {
        showSentenceCompletion();
        return;
    }

    sentenceCurrentWord = sentenceShuffledWords[sentenceCurrentIndex];
    sentenceCanClick = true;

    // Create sentence with blank
    const sentence = sentenceCurrentWord.englishSentence;
    const word = sentenceCurrentWord.english;

    // Replace the word with a blank (F4 — build blank via DOM, not innerHTML)
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const parts = sentence.split(regex);
    sentenceText.textContent = '';
    parts.forEach((part, i) => {
        sentenceText.appendChild(document.createTextNode(part));
        if (i < parts.length - 1) {
            const blankSpan = document.createElement('span');
            blankSpan.className = 'blank';
            blankSpan.textContent = '_____';
            sentenceText.appendChild(blankSpan);
        }
    });

    // Generate options (1 correct + 3 random wrong)
    const optionData = generateSentenceOptions(word);
    sentenceCorrectOptionIndex = optionData.correctIndex;

    // F4 — build option content via DOM API
    const optionBtns = sentenceOptions.querySelectorAll('.option-btn');
    optionBtns.forEach((btn, i) => {
        const opt = optionData.options[i];
        btn.textContent = '';
        const engSpan = document.createElement('span');
        engSpan.className = 'option-english';
        engSpan.textContent = opt.english;
        const trSpan = document.createElement('span');
        trSpan.className = 'option-turkish hidden';
        trSpan.textContent = opt.turkish;
        btn.appendChild(engSpan);
        btn.appendChild(trSpan);
        btn.classList.remove('correct', 'wrong');
        btn.disabled = false;
    });

    // Hide translation until answer is given
    sentenceTranslation.classList.add('hidden');

    sentenceProgressText.textContent = `${sentenceCurrentIndex + 1} / ${sentenceShuffledWords.length}`;
}

// F2 — deterministic option generation (no retry loop)
function generateSentenceOptions(correctWord) {
    const allWords = getAllWords();
    const correctWordObj = allWords.find(w => w.english === correctWord);

    // Filter out correct word, then Fisher-Yates partial shuffle to pick 3
    const pool = allWords.filter(w => w.english !== correctWord);
    const DISTRACTOR_COUNT = 3;
    for (let i = pool.length - 1; i > pool.length - 1 - DISTRACTOR_COUNT && i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const wrongWordObjects = pool.slice(-DISTRACTOR_COUNT);

    // F12 — reuse existing shuffleArray instead of inline shuffle
    const allOptionObjects = shuffleArray([correctWordObj, ...wrongWordObjects]);
    const correctIndex = allOptionObjects.findIndex(w => w.english === correctWord);

    return { options: allOptionObjects, correctIndex };
}

// F14 — consolidated correct/wrong handling
const SENTENCE_DELAY_CORRECT = 1500;
const SENTENCE_DELAY_WRONG = 2500;

function checkSentenceAnswer(selectedIndex) {
    if (!sentenceCanClick) return;
    sentenceCanClick = false;

    const optionBtns = sentenceOptions.querySelectorAll('.option-btn');
    const isCorrect = selectedIndex === sentenceCorrectOptionIndex;

    // Disable all buttons and show Turkish translations
    optionBtns.forEach(btn => {
        btn.disabled = true;
        const turkishSpan = btn.querySelector('.option-turkish');
        if (turkishSpan) turkishSpan.classList.remove('hidden');
    });

    // Mark selected + correct buttons
    optionBtns[selectedIndex].classList.add(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) optionBtns[sentenceCorrectOptionIndex].classList.add('correct');

    // Update score
    if (isCorrect) {
        sentenceCorrect++;
        sentenceCorrectCountEl.textContent = sentenceCorrect;
    } else {
        sentenceWrong++;
        sentenceWrongCountEl.textContent = sentenceWrong;
    }

    // Fill in the blank with correct word
    const blank = sentenceText.querySelector('.blank');
    if (blank) {
        blank.textContent = sentenceCurrentWord.english;
        blank.classList.add('filled');
    }

    // F4 — show Turkish translation with TR flag via safe DOM
    sentenceTranslation.textContent = '';
    const flagSpan = document.createElement('span');
    flagSpan.className = 'tr-flag';
    flagSpan.textContent = '🇹🇷';
    sentenceTranslation.appendChild(flagSpan);
    sentenceTranslation.appendChild(document.createTextNode(sentenceCurrentWord.turkishSentence));
    sentenceTranslation.classList.remove('hidden');

    setTimeout(() => {
        sentenceCurrentIndex++;
        displaySentenceQuestion();
    }, isCorrect ? SENTENCE_DELAY_CORRECT : SENTENCE_DELAY_WRONG);
}

// F4 — safe DOM construction for completion screen
function showSentenceCompletion() {
    sentenceText.textContent = '';
    sentenceText.appendChild(document.createTextNode('🎉 Tebrikler!'));
    sentenceText.appendChild(document.createElement('br'));
    const small = document.createElement('small');
    small.textContent = `${sentenceCorrect} doğru, ${sentenceWrong} yanlış - Puan: ${sentenceCorrect * 10}`;
    sentenceText.appendChild(small);

    const optionBtns = sentenceOptions.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
        btn.style.display = 'none';
        btn.disabled = true;
    });
}

function exitSentenceMode() {
    sentenceGameScreen.classList.add('hidden');
    modeScreen.classList.remove('hidden');

    // Reset option buttons visibility
    const optionBtns = sentenceOptions.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
        btn.style.display = '';
        btn.classList.remove('correct', 'wrong');
    });
}

// Sentence mode event listeners
const sentenceBackBtn = document.getElementById('sentence-back-btn');
sentenceModeBtn.addEventListener('click', startSentenceMode);
sentenceHomeBtn.addEventListener('click', exitSentenceMode);
sentenceBackBtn.addEventListener('click', exitSentenceMode);

sentenceOptions.addEventListener('click', (e) => {
    const btn = e.target.closest('.option-btn');
    if (btn) {
        const index = parseInt(btn.dataset.index);
        checkSentenceAnswer(index);
    }
});

// ===== GRID GAME MODE (Kelime Avı) =====
const gridGameScreen = document.getElementById('grid-game-screen');
const gridModeBtn = document.getElementById('grid-mode-btn');
const gridHomeBtn = document.getElementById('grid-home-btn');
const gridBackBtn = document.getElementById('grid-back-btn');
const gridWordContainer = document.getElementById('grid-word-container');
const gridScoreEl = document.getElementById('grid-score');
const gridProgressEl = document.getElementById('grid-progress');
const gridInputOverlay = document.getElementById('grid-input-overlay');
const gridInputLang = document.getElementById('grid-input-lang');
const gridInputWord = document.getElementById('grid-input-word');
const gridInputAttempts = document.getElementById('grid-input-attempts');
const gridInputEl = document.getElementById('grid-input');
const gridInputCancel = document.getElementById('grid-input-cancel');
const gridInputSubmit = document.getElementById('grid-input-submit');
const gridInputFeedback = document.getElementById('grid-input-feedback');

const GRID_WORD_COUNT = 30;
const GRID_MAX_ATTEMPTS = 3;

let gridWords = [];          // { wordObj, isEnglish, attempts, solved, cardEl }
let gridScore = 0;
let gridSolvedCount = 0;
let gridActiveIndex = -1;    // currently open word index

function startGridMode() {
    modeScreen.classList.add('hidden');
    gridGameScreen.classList.remove('hidden');

    const allWords = shuffleArray([...getAllWords()]);
    const selected = allWords.slice(0, GRID_WORD_COUNT);

    gridWords = selected.map(wordObj => ({
        wordObj,
        isEnglish: Math.random() > 0.5,
        attempts: 0,
        solved: false,
        failed: false,
        cardEl: null
    }));

    gridScore = 0;
    gridSolvedCount = 0;
    gridActiveIndex = -1;
    gridScoreEl.textContent = '0';
    gridProgressEl.textContent = `0/${gridWords.length}`;

    renderGridWords();
}

function renderGridWords() {
    gridWordContainer.textContent = '';

    gridWords.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'grid-word-card';
        card.dataset.index = index;

        const langBadge = document.createElement('span');
        langBadge.className = `grid-card-lang ${item.isEnglish ? 'lang-en' : 'lang-tr'}`;
        langBadge.textContent = item.isEnglish ? 'EN' : 'TR';

        const text = document.createElement('span');
        text.className = 'grid-card-text';
        text.textContent = item.isEnglish ? item.wordObj.english : item.wordObj.turkish;

        const points = document.createElement('span');
        points.className = 'grid-card-points';
        points.textContent = '+3 puan';

        card.appendChild(langBadge);
        card.appendChild(text);
        card.appendChild(points);

        card.addEventListener('click', () => openGridWord(index));

        item.cardEl = card;
        gridWordContainer.appendChild(card);
    });
}

function openGridWord(index) {
    const item = gridWords[index];
    if (item.solved || item.failed) return;

    gridActiveIndex = index;

    // Set up modal
    const isEn = item.isEnglish;
    gridInputLang.textContent = isEn ? 'English → Türkçe yaz' : 'Türkçe → English yaz';
    gridInputLang.classList.toggle('turkish', !isEn);
    gridInputWord.textContent = isEn ? item.wordObj.english : item.wordObj.turkish;

    // Render attempt hearts
    renderAttemptHearts(item.attempts);

    gridInputEl.value = '';
    gridInputEl.classList.remove('shake');
    gridInputFeedback.classList.add('hidden');
    gridInputFeedback.classList.remove('correct', 'wrong');
    gridInputOverlay.classList.remove('hidden');

    setTimeout(() => gridInputEl.focus(), 100);
}

function renderAttemptHearts(usedAttempts) {
    gridInputAttempts.textContent = '';
    for (let i = 0; i < GRID_MAX_ATTEMPTS; i++) {
        const heart = document.createElement('span');
        heart.className = 'attempt-heart';
        heart.textContent = '❤️';
        if (i < usedAttempts) heart.classList.add('lost');
        gridInputAttempts.appendChild(heart);
    }
}

function closeGridInput() {
    gridInputOverlay.classList.add('hidden');
    gridActiveIndex = -1;
}

function checkGridAnswer() {
    if (gridActiveIndex === -1) return;
    const userAnswer = gridInputEl.value.trim();
    if (!userAnswer) return;

    const item = gridWords[gridActiveIndex];
    const isEn = item.isEnglish;

    // Determine correct answer
    const correctAnswer = isEn ? item.wordObj.turkish : item.wordObj.english;
    const normalizedUser = normalizeText(userAnswer);

    // Check against all parts (handle "A / B / C" translations)
    const correctParts = correctAnswer.split('/').map(p => normalizeText(p.trim()));
    const isCorrect = correctParts.some(p => p === normalizedUser) ||
        normalizeText(correctAnswer) === normalizedUser;

    if (isCorrect) {
        // Calculate points: remaining attempts = points
        const pointsEarned = GRID_MAX_ATTEMPTS - item.attempts;
        item.solved = true;
        gridScore += pointsEarned;
        gridSolvedCount++;

        // Show feedback in modal
        gridInputFeedback.textContent = `✓ Doğru! +${pointsEarned} puan`;
        gridInputFeedback.classList.remove('hidden', 'wrong');
        gridInputFeedback.classList.add('correct');

        // Update card
        updateGridCard(gridActiveIndex, pointsEarned);
        updateGridStats();

        // Close modal after delay
        setTimeout(() => {
            closeGridInput();
            if (gridSolvedCount + countGridFailed() >= gridWords.length) {
                showGridCompletion();
            }
        }, 800);
    } else {
        item.attempts++;
        renderAttemptHearts(item.attempts);

        if (item.attempts >= GRID_MAX_ATTEMPTS) {
            // All attempts used — fail
            item.failed = true;
            gridScore -= 1;
            gridSolvedCount; // don't increment

            gridInputFeedback.textContent = `✗ Doğrusu: ${correctAnswer} (-1 puan)`;
            gridInputFeedback.classList.remove('hidden', 'correct');
            gridInputFeedback.classList.add('wrong');

            updateGridCardFailed(gridActiveIndex, correctAnswer);
            updateGridStats();

            setTimeout(() => {
                closeGridInput();
                if (gridSolvedCount + countGridFailed() >= gridWords.length) {
                    showGridCompletion();
                }
            }, 1500);
        } else {
            // Wrong but has attempts left
            const remaining = GRID_MAX_ATTEMPTS - item.attempts;
            gridInputFeedback.textContent = `✗ Yanlış! ${remaining} hak kaldı`;
            gridInputFeedback.classList.remove('hidden', 'correct');
            gridInputFeedback.classList.add('wrong');

            gridInputEl.classList.add('shake');
            gridInputEl.value = '';
            setTimeout(() => gridInputEl.classList.remove('shake'), 400);
        }
    }
}

function countGridFailed() {
    return gridWords.filter(w => w.failed).length;
}

function updateGridCard(index, points) {
    const item = gridWords[index];
    const card = item.cardEl;
    card.classList.add('solved');

    // Add translation below
    const translation = document.createElement('span');
    translation.className = 'grid-card-translation';
    translation.textContent = item.isEnglish ? item.wordObj.turkish : item.wordObj.english;
    card.appendChild(translation);

    // Update points display
    const pointsEl = card.querySelector('.grid-card-points');
    pointsEl.textContent = `+${points}`;
}

function updateGridCardFailed(index, correctAnswer) {
    const item = gridWords[index];
    const card = item.cardEl;
    card.classList.add('failed');

    // Show correct answer
    const translation = document.createElement('span');
    translation.className = 'grid-card-translation';
    translation.textContent = correctAnswer;
    card.appendChild(translation);

    // Update points display
    const pointsEl = card.querySelector('.grid-card-points');
    pointsEl.textContent = '-1';
}

function updateGridStats() {
    gridScoreEl.textContent = gridScore;
    const totalDone = gridSolvedCount + countGridFailed();
    gridProgressEl.textContent = `${totalDone}/${gridWords.length}`;
}

function showGridCompletion() {
    const failed = countGridFailed();
    const completion = document.createElement('div');
    completion.className = 'grid-completion';

    const title = document.createElement('div');
    title.className = 'grid-completion-title';
    title.textContent = '🎉 Tebrikler!';

    const score = document.createElement('div');
    score.className = 'grid-completion-score';
    score.textContent = `${gridScore} Puan`;

    const detail = document.createElement('div');
    detail.className = 'grid-completion-detail';
    detail.textContent = `${gridSolvedCount} doğru, ${failed} başarısız`;

    const playAgain = document.createElement('button');
    playAgain.className = 'grid-play-again-btn';
    playAgain.textContent = '🔄 Tekrar Oyna';
    playAgain.addEventListener('click', startGridMode);

    completion.appendChild(title);
    completion.appendChild(score);
    completion.appendChild(detail);
    completion.appendChild(playAgain);

    // Replace grid with completion
    gridWordContainer.textContent = '';
    gridWordContainer.style.display = 'block';
    gridWordContainer.appendChild(completion);
}

function exitGridMode() {
    gridGameScreen.classList.add('hidden');
    gridInputOverlay.classList.add('hidden');
    modeScreen.classList.remove('hidden');
    gridWordContainer.style.display = '';
}

// Grid mode event listeners
gridModeBtn.addEventListener('click', startGridMode);
gridHomeBtn.addEventListener('click', exitGridMode);
gridBackBtn.addEventListener('click', exitGridMode);
gridInputCancel.addEventListener('click', closeGridInput);
gridInputSubmit.addEventListener('click', checkGridAnswer);
gridInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        checkGridAnswer();
    }
});

// Close overlay on backdrop click
gridInputOverlay.addEventListener('click', (e) => {
    if (e.target === gridInputOverlay) closeGridInput();
});

