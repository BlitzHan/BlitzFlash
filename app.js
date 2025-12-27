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
const timedModeBtn = document.getElementById('timed-mode-btn');
const timeSelection = document.getElementById('time-selection');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
const timerDisplay = document.getElementById('timer-display');
const timerValue = document.getElementById('timer-value');
const resultsScreen = document.getElementById('results-screen');
const resultsScore = document.getElementById('results-score');
const resultCorrect = document.getElementById('result-correct');
const resultWrong = document.getElementById('result-wrong');
const playAgainBtn = document.getElementById('play-again-btn');

// State
let currentIndex = 0;
let correct = 0;
let wrong = 0;
let shuffledVocabulary = [];
let gameMode = 'free'; // 'free' or 'timed'
let timeLimit = 0;
let timeRemaining = 0;
let timerInterval = null;
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
    timerDisplay.classList.add('hidden');
    startGame();
}

// Show Time Selection
function showTimeSelection() {
    timeSelection.classList.remove('hidden');
}

// Start Timed Mode
function startTimedMode(seconds) {
    gameMode = 'timed';
    timeLimit = seconds;
    timeRemaining = seconds;
    modeScreen.classList.add('hidden');

    // Show countdown
    countdownOverlay.classList.remove('hidden');
    startCountdown();
}

// Countdown 3-2-1
function startCountdown() {
    let count = 3;
    countdownNumber.textContent = count;

    const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownNumber.textContent = count;
            // Re-trigger animation
            countdownNumber.style.animation = 'none';
            setTimeout(() => countdownNumber.style.animation = 'countdownPulse 1s ease-in-out', 10);
        } else {
            clearInterval(countInterval);
            countdownOverlay.classList.add('hidden');
            gameArea.classList.remove('hidden');
            timerDisplay.classList.remove('hidden');
            startGame();
            startTimer();
        }
    }, 1000);
}

// Start Timer
function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            endTimedGame();
        }
    }, 1000);
}

// Update Timer Display
function updateTimerDisplay() {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    timerValue.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// End Timed Game
function endTimedGame() {
    clearInterval(timerInterval);
    isGameActive = false;

    // Calculate score: doğru * 10 - yanlış * 5
    const score = Math.max(0, (correct * 10) - (wrong * 5));

    gameArea.classList.add('hidden');
    resultsScreen.classList.remove('hidden');

    resultsScore.textContent = score;
    resultCorrect.textContent = correct;
    resultWrong.textContent = wrong;
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
            flashcard.classList.add('entering');
            displayCurrentWord();
            setTimeout(() => flashcard.classList.remove('entering'), 150);
        } else if (gameMode === 'free') {
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

// Play Again
function playAgain() {
    resultsScreen.classList.add('hidden');
    gameArea.classList.add('hidden');
    timeSelection.classList.add('hidden');
    modeScreen.classList.remove('hidden');
    clearInterval(timerInterval);
}

// Event Listeners
freeModeBtn.addEventListener('click', startFreeMode);
timedModeBtn.addEventListener('click', showTimeSelection);

// Back button
const backBtn = document.getElementById('back-btn');
backBtn.addEventListener('click', goBack);

function goBack() {
    isGameActive = false;
    clearInterval(timerInterval);
    gameArea.classList.add('hidden');
    timerDisplay.classList.add('hidden');
    timeSelection.classList.add('hidden');
    modeScreen.classList.remove('hidden');
}

document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        startTimedMode(parseInt(btn.dataset.time));
    });
});

flashcard.addEventListener('click', toggleFlip);
correctBtn.addEventListener('click', markCorrect);
wrongBtn.addEventListener('click', markWrong);
flipBtn.addEventListener('click', toggleFlip);
playAgainBtn.addEventListener('click', playAgain);

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
