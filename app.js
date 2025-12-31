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

let typingCurrentIndex = 0;
let typingCorrect = 0;
let typingWrong = 0;
let typingShuffledWords = [];
let typingCurrentWord = null;
let typingIsEnglish = true; // true = showing English, need Turkish answer

function startTypingMode() {
    modeScreen.classList.add('hidden');
    typingGameScreen.classList.remove('hidden');

    typingShuffledWords = shuffleArray(getAllWords());
    typingCurrentIndex = 0;
    typingCorrect = 0;
    typingWrong = 0;
    typingCorrectCount.textContent = '0';
    typingWrongCount.textContent = '0';

    displayTypingWord();
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
    const userAnswer = typingInput.value.trim();
    if (!userAnswer) return;

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

    // Move to next word after delay
    setTimeout(() => {
        typingCurrentIndex++;
        displayTypingWord();
    }, isCorrect ? 800 : 2000);
}

function showTypingCompletion() {
    typingWord.textContent = '🎉 Tebrikler!';
    typingBadge.textContent = 'Bitti';
    typingSentence.textContent = `${typingCorrect} doğru, ${typingWrong} yanlış`;
    typingInput.style.display = 'none';
    typingSubmit.style.display = 'none';
    typingFeedback.classList.remove('hidden', 'wrong');
    typingFeedback.classList.add('correct');
    feedbackIcon.textContent = '⭐';
    feedbackText.textContent = `Puan: ${typingCorrect * 10}`;
}

function exitTypingMode() {
    typingGameScreen.classList.add('hidden');
    modeScreen.classList.remove('hidden');
    typingInput.style.display = '';
    typingSubmit.style.display = '';
}

// Typing mode event listeners
const typingBackBtn = document.getElementById('typing-back-btn');
typingModeBtn.addEventListener('click', startTypingMode);
typingHomeBtn.addEventListener('click', exitTypingMode);
typingBackBtn.addEventListener('click', exitTypingMode);
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
    const options = generateSentenceOptions(word);
    sentenceCorrectOptionIndex = options.correctIndex;

    const optionBtns = sentenceOptions.querySelectorAll('.option-btn');
    optionBtns.forEach((btn, i) => {
        btn.textContent = options.words[i];
        btn.classList.remove('correct', 'wrong');
        btn.disabled = false;
    });

    sentenceProgressText.textContent = `${sentenceCurrentIndex + 1} / ${sentenceShuffledWords.length}`;
}

function generateSentenceOptions(correctWord) {
    // Get 3 random wrong options from vocabulary
    const wrongWords = [];
    const allWords = getAllWords();

    while (wrongWords.length < 3) {
        const randomIndex = Math.floor(Math.random() * allWords.length);
        const randomWord = allWords[randomIndex].english;

        if (randomWord !== correctWord && !wrongWords.includes(randomWord)) {
            wrongWords.push(randomWord);
        }
    }

    // Combine and shuffle
    const allOptions = [correctWord, ...wrongWords];

    // Shuffle options
    for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    // Find correct index after shuffle
    const correctIndex = allOptions.indexOf(correctWord);

    return {
        words: allOptions,
        correctIndex: correctIndex
    };
}

function checkSentenceAnswer(selectedIndex) {
    if (!sentenceCanClick) return;
    sentenceCanClick = false;

    const optionBtns = sentenceOptions.querySelectorAll('.option-btn');

    // Disable all buttons
    optionBtns.forEach(btn => btn.disabled = true);

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

        setTimeout(() => {
            sentenceCurrentIndex++;
            displaySentenceQuestion();
        }, 1000);
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

        setTimeout(() => {
            sentenceCurrentIndex++;
            displaySentenceQuestion();
        }, 2000);
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
    if (e.target.classList.contains('option-btn')) {
        const index = parseInt(e.target.dataset.index);
        checkSentenceAnswer(index);
    }
});
