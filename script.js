// Game configuration
let gameConfig = null;
let currentLevel = 0;
let targetIndex = 0;
let gameComplete = false;
let originalWords = [];
let scrambledWords = [];
let score = 0;
let timer = 0;
let countdown;

// Audio elements
let backgroundMusic = null;
let isMuted = false;

// DOM elements
const wordContainer = document.getElementById("word-container");
const timerEl = document.getElementById("timer");
const levelInfoEl = document.querySelector('.bg-green-100');
const scoreEl = document.getElementById("score-value");

// Initialize game
async function initGame() {
  console.log('Initializing game...');
  try {
    console.log('Fetching game config...');
    const response = await fetch('game-config.json');
    console.log('Response received:', response);
    gameConfig = await response.json();
    console.log('Game config loaded:', gameConfig);
    loadLevel(currentLevel);
  } catch (error) {
    console.error('Error loading game configuration:', error);
  }
}

// --- UI/Sidebar/Help Logic ---
let isPaused = false;

// Helper: Enable/disable all word buttons
function setWordButtonsEnabled(enabled) {
  const buttons = wordContainer.getElementsByClassName('word-tile');
  Array.from(buttons).forEach(btn => btn.disabled = !enabled);
}

// Pause/Resume logic
function pauseGame() {
  console.log('Pausing game...');
  isPaused = true;
  clearInterval(countdown);
  setWordButtonsEnabled(false);
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.add('sidebar-expanded');
  if (backgroundMusic) backgroundMusic.pause();
}

function resumeGame() {
  console.log('Resuming game...');
  isPaused = false;
  resetTimer();
  setWordButtonsEnabled(true);
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('sidebar-expanded');
  if (!isMuted && backgroundMusic) backgroundMusic.play();
}

// Sound logic
function toggleMute() {
  console.log('Toggling mute...');
  isMuted = !isMuted;
  const musicBtn = document.getElementById('musicBtn');
  
    if (isMuted) {
    musicBtn.classList.add('muted');
      if (backgroundMusic) backgroundMusic.pause();
    } else {
    musicBtn.classList.remove('muted');
      if (backgroundMusic) backgroundMusic.play();
  }
}

// Play sound effect
function playSound(soundName) {
  if (!isMuted && gameConfig && gameConfig.audio[soundName]) {
    const audio = new Audio(gameConfig.audio[soundName]);
    audio.play().catch(error => console.error('Error playing sound:', error));
  }
}

// Restart logic
function restartGame() {
  console.log('Restarting game...');
  clearInterval(countdown);
  loadLevel(currentLevel);
  if (isPaused) resumeGame();
}

// Help modal logic
function showHelp() {
  console.log('Showing help...');
  if (!document.getElementById('help-modal')) {
    const modal = document.createElement('div');
    modal.id = 'help-modal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.background = 'rgba(0,0,0,0.6)';
    modal.style.zIndex = '1000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.innerHTML = `
      <div style="background:white; color:#222; border-radius:1.5rem; padding:3rem; max-width:90vw; box-shadow:0 8px 32px rgba(0,0,0,0.18); text-align:center;">
        <h2 style="font-size:2.5rem; font-weight:bold; margin-bottom:2rem;">How to Play</h2>
        <p style="font-size:2rem; line-height:1.6; margin-bottom:2rem;">${gameConfig.instructions}</p>
        <button id="close-help" style="padding:1rem 3rem; background:#8A4FFF; color:white; border:none; border-radius:1rem; font-size:2rem; cursor:pointer; font-weight:bold;">Got it!</button>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('close-help').onclick = () => {
      modal.remove();
    };
  }
}

// Button handlers
window.handlePause = function() {
  console.log('Pause button clicked');
  if (isPaused) {
    resumeGame();
  } else {
    pauseGame();
  }
};

window.handleMute = function() {
  console.log('Music button clicked');
  toggleMute();
};

window.handleRestart = function() {
  console.log('Restart button clicked');
  restartGame();
};

window.handleHelp = function() {
  console.log('Help button clicked');
  showHelp();
};

// Load level
function loadLevel(levelIndex) {
  console.log('Loading level:', levelIndex);
  if (!gameConfig || levelIndex >= gameConfig.levels.length) {
    console.log('Game complete or config not loaded');
    showGameComplete();
    return;
  }
  
  const level = gameConfig.levels[levelIndex];
  console.log('Level data:', level);
  originalWords = level.sentence.split(' ');
  scrambledWords = [...originalWords];
  targetIndex = 0;
  gameComplete = false;
  
  // Update level number in the header
  document.getElementById('level-number').textContent = level.levelNum;
  
  // Initialize background music
  if (!backgroundMusic && gameConfig.audio.background) {
    backgroundMusic = new Audio(gameConfig.audio.background);
    backgroundMusic.loop = true;
    if (!isMuted) backgroundMusic.play();
  }
  
  resetTimer();
  shuffle(scrambledWords);
  renderWords();
}

function showGameComplete() {
  wordContainer.innerHTML = `
    <div class="completed-sentence text-3xl font-bold">
      Congratulations! You've completed all levels!<br>
      Final Score: ${score}
    </div>
  `;
  clearInterval(countdown);
  timerEl.style.display = 'none';
  if (backgroundMusic) backgroundMusic.pause();
}

// Shuffle array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Check if a word is in its correct position
function isWordCorrect(index) {
  // Get the current word at the clicked position
  const clickedWord = scrambledWords[index];
  // Get the word that should be at the target position
  const targetWord = originalWords[targetIndex];
  return clickedWord === targetWord;
}

// Render words as buttons
function renderWords(incorrectIndex = null) {
  wordContainer.innerHTML = '';
  scrambledWords.forEach((word, index) => {
    const button = document.createElement('button');
    button.className = 'word-tile text-2xl font-bold';
    if (incorrectIndex !== null && index === incorrectIndex) {
      button.classList.add('incorrect');
    }
    button.textContent = word;
    button.style.maxWidth = '100%';
    button.style.wordWrap = 'break-word';
    button.style.whiteSpace = 'normal';
    button.style.fontSize = '3rem';
    button.style.padding = '0.75rem 1.5rem';
    button.style.margin = '0.25rem';
    button.style.lineHeight = '1';
    button.style.height = '5.5rem';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.onclick = () => handleWordClick(index);
    wordContainer.appendChild(button);
  });
  updateCorrectWordsBorders();
}

// Handle word click with movement effects
function handleWordClick(clickedIndex) {
  if (isPaused || gameComplete) return;
  
  const buttons = wordContainer.getElementsByClassName('word-tile');
  const clickedWord = scrambledWords[clickedIndex];
  const targetWord = originalWords[targetIndex];
  
  // If clicked on the correct next word
  if (clickedWord === targetWord) {
    if (clickedIndex === targetIndex) {
      validateAndProgress(buttons[clickedIndex]);
      return;
    }
    // Move the word to the correct position
    const targetButton = buttons[targetIndex];
    const clickedButton = buttons[clickedIndex];
    setWordButtonsEnabled(false);
    if (clickedIndex > targetIndex) {
      clickedButton.classList.add('move-left');
      targetButton.classList.add('move-right');
    } else {
      clickedButton.classList.add('move-right');
      targetButton.classList.add('move-left');
    }
    [scrambledWords[clickedIndex], scrambledWords[targetIndex]] = [scrambledWords[targetIndex], scrambledWords[clickedIndex]];
    setTimeout(() => {
      renderWords();
      validateAndProgress(wordContainer.getElementsByClassName('word-tile')[targetIndex]);
      setWordButtonsEnabled(true);
    }, 300);
  } else {
    // Wrong word clicked
    const targetButton = buttons[targetIndex];
    const clickedButton = buttons[clickedIndex];
    setWordButtonsEnabled(false);
    if (clickedIndex > targetIndex) {
      clickedButton.classList.add('move-left');
      targetButton.classList.add('move-right');
    } else {
      clickedButton.classList.add('move-right');
      targetButton.classList.add('move-left');
    }
    [scrambledWords[clickedIndex], scrambledWords[targetIndex]] = [scrambledWords[targetIndex], scrambledWords[clickedIndex]];
    playSound('incorrect');
    setTimeout(() => {
      renderWords(targetIndex); // Show red border on the new target index
      setTimeout(() => {
        renderWords(); // Remove red border after 500ms
        setWordButtonsEnabled(true);
      }, 500);
    }, 300);
  }
}

function validateAndProgress(button) {
  playSound('success');
  button.classList.add('correct');
  targetIndex++;
  
  // Update the display of correct words
  updateCorrectWordsBorders();
  
  if (targetIndex === originalWords.length) {
    gameComplete = true;
    updateLevelScore();
    playSound('levelWin');
    setTimeout(() => {
      currentLevel++;
      if (currentLevel < gameConfig.levels.length) {
      loadLevel(currentLevel);
      } else {
        showGameComplete();
      }
    }, 1500);
  } else {
    setWordButtonsEnabled(true);
  }
}

function updateLevelScore() {
  const currentLevelConfig = gameConfig.levels[currentLevel];
  score += currentLevelConfig.baseScore;
  scoreEl.textContent = score;
}

function updateCorrectWordsBorders() {
  const buttons = wordContainer.getElementsByClassName('word-tile');
  Array.from(buttons).forEach((button, index) => {
    if (index < targetIndex) {
      button.classList.add('correct');
      // Add special classes for first and last correct words
      if (index === 0) {
        button.classList.add('first-correct');
      } else if (index === targetIndex - 1) {
        button.classList.add('last-correct');
      } else {
        button.classList.remove('first-correct', 'last-correct');
      }
    } else {
      button.classList.remove('correct', 'first-correct', 'last-correct');
    }
  });
}

function resetTimer() {
  timer = 0;
  updateTimer();
  clearInterval(countdown);
  countdown = setInterval(updateTimer, 1000);
}

function updateTimer() {
  timer++;
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateScore() {
  score += 100;
  scoreEl.textContent = score;
}

// Initialize the game when the page loads
console.log('Script loaded, waiting for window load...');
window.addEventListener('load', () => {
  console.log('Window loaded, initializing game...');
  initGame();
});