// DOM Elements
const flashcard = document.getElementById('flashcard');
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

// Combine all vocabulary
function getAllWords() {
    let allWords = [...vocabulary];
    if (typeof wordsPart1 !== 'undefined') allWords = allWords.concat(wordsPart1);
    if (typeof wordsPart2 !== 'undefined') allWords = allWords.concat(wordsPart2);
    if (typeof wordsPart3 !== 'undefined') allWords = allWords.concat(wordsPart3);
    if (typeof wordsPart4 !== 'undefined') allWords = allWords.concat(wordsPart4);
    if (typeof wordsPart5 !== 'undefined') allWords = allWords.concat(wordsPart5);
    if (typeof wordsPart6 !== 'undefined') allWords = allWords.concat(wordsPart6);
    if (typeof wordsPart7 !== 'undefined') allWords = allWords.concat(wordsPart7);
    return allWords;
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
            const cardInner = document.getElementById('card-inner');
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

    englishWord.textContent = "🎉 Tebrikler!";
    englishSentence.textContent = `Tüm kelimeleri tamamladın!`;
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

    // Show swipe indicators during drag
    const indicators = document.querySelectorAll('.swipe-indicator');
    if (diffX > SWIPE_THRESHOLD) {
        indicators.forEach(ind => ind.style.opacity = ind.classList.contains('swipe-right') ? '1' : '0');
    } else if (diffX < -SWIPE_THRESHOLD) {
        indicators.forEach(ind => ind.style.opacity = ind.classList.contains('swipe-left') ? '1' : '0');
    } else {
        indicators.forEach(ind => ind.style.opacity = '0');
    }
});

document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    const diffX = dragCurrentX - dragStartX;

    // Reset swipe indicators
    document.querySelectorAll('.swipe-indicator').forEach(ind => ind.style.opacity = '0');

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
    typingGameActive = false;
    typingTimerDisplay.classList.remove('timer-warning');

    typingWord.textContent = '⏱️ Süre Doldu!';
    typingBadge.textContent = 'Bitti';
    typingSentence.textContent = `Skorun: ${typingCorrect} doğru cevap!`;
    typingInput.style.display = 'none';
    typingSubmit.style.display = 'none';
    typingFeedback.classList.remove('hidden', 'wrong');
    typingFeedback.classList.add('correct');
    feedbackIcon.textContent = '🏆';
    feedbackText.textContent = `${typingCorrect} doğru, ${typingWrong} yanlış`;

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

function normalizeText(text) {
    // Normalize for comparison: lowercase, trim, handle Turkish characters
    return text.toLowerCase().trim()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
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

    // Show both English and Turkish on the card
    typingBadge.textContent = '🇬🇧 / 🇹🇷';
    typingBadge.classList.remove('turkish');
    typingWord.innerHTML = `${typingCurrentWord.english} <span style="color: var(--text-muted); font-size: 0.5em; vertical-align: middle;">→</span> ${typingCurrentWord.turkish}`;
    typingSentence.innerHTML = `${typingCurrentWord.englishSentence}<br><span style="color: var(--secondary); font-style: normal;">🇹🇷 ${typingCurrentWord.turkishSentence}</span>`;

    const FEEDBACK_DELAY_MS_CORRECT = 1500;
    const FEEDBACK_DELAY_MS_WRONG = 3000;

    // Move to next word after delay
    setTimeout(() => {
        typingCurrentIndex++;
        displayTypingWord();
    }, isCorrect ? FEEDBACK_DELAY_MS_CORRECT : FEEDBACK_DELAY_MS_WRONG);
}

function showTypingCompletion() {
    clearInterval(typingTimerInterval);
    typingGameActive = false;
    typingTimerDisplay.classList.remove('timer-warning');

    typingWord.textContent = '🎉 Tebrikler!';
    typingBadge.textContent = 'Bitti';
    typingSentence.textContent = `Skorun: ${typingCorrect} doğru cevap!`;
    typingInput.style.display = 'none';
    typingSubmit.style.display = 'none';
    typingFeedback.classList.remove('hidden', 'wrong');
    typingFeedback.classList.add('correct');
    feedbackIcon.textContent = '⭐';
    feedbackText.textContent = `${typingCorrect} doğru, ${typingWrong} yanlış`;

    saveLeaderboardScore(typingCorrect, typingWrong);
    showLeaderboard();
}

function exitTypingMode() {
    clearInterval(typingTimerInterval);
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

function showLeaderboard() {
    const scores = getLeaderboardScores();
    const RANK_MEDALS = ['🥇', '🥈', '🥉'];
    leaderboardList.innerHTML = '';

    if (scores.length === 0) {
        leaderboardList.innerHTML = '<p class="leaderboard-empty">Henüz skor yok</p>';
    } else {
        scores.forEach((entry, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            if (index < 3) row.classList.add('leaderboard-top');

            const rankIcon = index < RANK_MEDALS.length ? RANK_MEDALS[index] : `${index + 1}.`;

            row.innerHTML = `
                <span class="lb-rank">${rankIcon}</span>
                <span class="lb-score">${entry.score} doğru</span>
                <span class="lb-wrong">${entry.wrong} yanlış</span>
                <span class="lb-date">${entry.date}</span>
            `;
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

    // Replace the word with a blank
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const blankSentence = sentence.replace(regex, '<span class="blank">_____</span>');
    sentenceText.innerHTML = blankSentence;

    // Generate options (1 correct + 3 random wrong)
    const optionData = generateSentenceOptions(word);
    sentenceCorrectOptionIndex = optionData.correctIndex;

    const optionBtns = sentenceOptions.querySelectorAll('.option-btn');
    optionBtns.forEach((btn, i) => {
        const opt = optionData.options[i];
        btn.innerHTML = `<span class="option-english">${opt.english}</span><span class="option-turkish hidden">${opt.turkish}</span>`;
        btn.classList.remove('correct', 'wrong');
        btn.disabled = false;
    });

    // Hide translation until answer is given
    sentenceTranslation.classList.add('hidden');

    sentenceProgressText.textContent = `${sentenceCurrentIndex + 1} / ${sentenceShuffledWords.length}`;
}

function generateSentenceOptions(correctWord) {
    // Get 3 random wrong options from vocabulary
    const wrongWordObjects = [];
    const allWords = getAllWords();

    // Find the correct word object
    const correctWordObj = allWords.find(w => w.english === correctWord);

    while (wrongWordObjects.length < 3) {
        const randomIndex = Math.floor(Math.random() * allWords.length);
        const randomWordObj = allWords[randomIndex];

        if (randomWordObj.english !== correctWord && !wrongWordObjects.some(w => w.english === randomWordObj.english)) {
            wrongWordObjects.push(randomWordObj);
        }
    }

    // Combine and shuffle
    const allOptionObjects = [correctWordObj, ...wrongWordObjects];

    // Shuffle options
    for (let i = allOptionObjects.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptionObjects[i], allOptionObjects[j]] = [allOptionObjects[j], allOptionObjects[i]];
    }

    // Find correct index after shuffle
    const correctIndex = allOptionObjects.findIndex(w => w.english === correctWord);

    return {
        options: allOptionObjects,
        correctIndex: correctIndex
    };
}

function checkSentenceAnswer(selectedIndex) {
    if (!sentenceCanClick) return;
    sentenceCanClick = false;

    const optionBtns = sentenceOptions.querySelectorAll('.option-btn');

    // Disable all buttons and show Turkish translations
    optionBtns.forEach(btn => {
        btn.disabled = true;
        const turkishSpan = btn.querySelector('.option-turkish');
        if (turkishSpan) turkishSpan.classList.remove('hidden');
    });

    if (selectedIndex === sentenceCorrectOptionIndex) {
        // Correct answer
        optionBtns[selectedIndex].classList.add('correct');
        sentenceCorrect++;
        sentenceCorrectCountEl.textContent = sentenceCorrect;

        // Fill in the blank with correct word
        const blank = sentenceText.querySelector('.blank');
        if (blank) {
            blank.textContent = sentenceCurrentWord.english;
            blank.classList.add('filled');
        }

        // Show Turkish translation with TR flag on left
        sentenceTranslation.innerHTML = `<span class="tr-flag">🇹🇷</span>${sentenceCurrentWord.turkishSentence}`;
        sentenceTranslation.classList.remove('hidden');

        setTimeout(() => {
            sentenceCurrentIndex++;
            displaySentenceQuestion();
        }, 1500);
    } else {
        // Wrong answer
        optionBtns[selectedIndex].classList.add('wrong');
        optionBtns[sentenceCorrectOptionIndex].classList.add('correct');
        sentenceWrong++;
        sentenceWrongCountEl.textContent = sentenceWrong;

        // Fill in blank with correct word
        const blank = sentenceText.querySelector('.blank');
        if (blank) {
            blank.textContent = sentenceCurrentWord.english;
            blank.classList.add('filled');
        }

        // Show Turkish translation with TR flag on left
        sentenceTranslation.innerHTML = `<span class="tr-flag">🇹🇷</span>${sentenceCurrentWord.turkishSentence}`;
        sentenceTranslation.classList.remove('hidden');

        setTimeout(() => {
            sentenceCurrentIndex++;
            displaySentenceQuestion();
        }, 2500);
    }
}

function showSentenceCompletion() {
    sentenceText.innerHTML = `🎉 Tebrikler! <br><small>${sentenceCorrect} doğru, ${sentenceWrong} yanlış - Puan: ${sentenceCorrect * 10}</small>`;

    const optionBtns = sentenceOptions.querySelectorAll('.option-btn');
    optionBtns.forEach((btn, i) => {
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
