// Game levels
const levels = [
  {
    sentence: "Be water my friend",
    author: "Bruce Lee",
    levelNum: 1
  },
  {
    sentence: "Those who move don't notice their chains",
    author: "Rosa Luxemburg",
    levelNum: 2
  },
  {
    sentence: "Tell me and I forget teach me and I remember involve me and I learn",
    author: "Benjamin Franklin",
    levelNum: 3
  }
];

let currentLevel = 0;
let targetIndex = 0;
let gameComplete = false;
let originalWords = [];
let scrambledWords = [];
let score = 0;
let timer = 0;
let countdown;

const wordContainer = document.getElementById("word-container");
const timerEl = document.getElementById("timer");
const levelInfoEl = document.querySelector('.bg-green-100');
const scoreEl = document.getElementById("score-value");

// --- UI/Sidebar/Help Logic ---

let isPaused = false;
let isMuted = false;

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
}

function resumeGame() {
  console.log('Resuming game...');
  isPaused = false;
  resetTimer();
  setWordButtonsEnabled(true);
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('sidebar-expanded');
}

// Sound logic
function toggleMute() {
  console.log('Toggling mute...');
  isMuted = !isMuted;
  const musicBtn = document.getElementById('musicBtn');
  if (musicBtn) {
    if (isMuted) {
      musicBtn.style.background = '#ef4444';
    } else {
      musicBtn.style.background = '#14CC60';
    }
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
      <div style="background:white; color:#222; border-radius:1.5rem; padding:2rem; max-width:90vw; box-shadow:0 8px 32px rgba(0,0,0,0.18); text-align:center;">
        <h2 style="font-size:1.5rem; font-weight:bold; margin-bottom:1rem;">How to Play</h2>
        <p style="margin-bottom:1.5rem;">Unscramble the sentence by clicking the words in the correct order. Use the sidebar to pause, restart, or mute the game.</p>
        <button id="close-help" style="padding:0.5rem 1.5rem; background:#8A4FFF; color:white; border:none; border-radius:0.5rem; font-size:1rem; cursor:pointer;">Got it!</button>
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

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing game...');
  loadLevel(currentLevel);
});

// Load level
function loadLevel(levelIndex) {
  if (levelIndex >= levels.length) {
    showGameComplete();
    return;
  }
  
  const level = levels[levelIndex];
  originalWords = level.sentence.split(' ');
  scrambledWords = [...originalWords];
  targetIndex = 0;
  gameComplete = false;
  
  levelInfoEl.innerHTML = `
    <div>
      <span class="text-sm">${level.levelNum} / ${levels.length}</span>
    </div>
    <div class="text-lg font-semibold flex items-center justify-center">
      ${level.author}
    </div>
  `;
  
  resetTimer();
  shuffle(scrambledWords);
  renderWords();
}

function showGameComplete() {
  wordContainer.innerHTML = `
    <div class="completed-sentence">
      Congratulations! You've completed all levels!<br>
      Final Score: ${score}
    </div>
  `;
  clearInterval(countdown);
  timerEl.style.display = 'none';
}

function debugState() {
  console.log('Current state:', {
    targetIndex,
    scrambledWords,
    originalWords,
    gameComplete
  });
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
  return scrambledWords[index] === originalWords[targetIndex];
}

// Render words as buttons
function renderWords() {
  wordContainer.innerHTML = '';
  scrambledWords.forEach((word, index) => {
    const button = document.createElement('button');
    button.className = 'word-tile';
    button.textContent = word;
    button.onclick = () => handleWordClick(index);
    wordContainer.appendChild(button);
  });
  updateCorrectWordsBorders();
}

// Handle word click with movement effects
function handleWordClick(clickedIndex) {
  if (isPaused || gameComplete) return;
  
  const buttons = wordContainer.getElementsByClassName('word-tile');
  
  // If clicked on the correct next word
  if (isWordCorrect(clickedIndex) && clickedIndex === targetIndex) {
    validateAndProgress(buttons[clickedIndex]);
    return;
  }
  
  // If clicked on the current target word but it's incorrect
  if (clickedIndex === targetIndex) return;
  
  const targetButton = buttons[targetIndex];
  const clickedButton = buttons[clickedIndex];
  
  // Disable all buttons during animation
  setWordButtonsEnabled(false);
  
  // Add movement classes based on direction
  if (clickedIndex > targetIndex) {
    clickedButton.classList.add('move-left');
    targetButton.classList.add('move-right');
  } else {
    clickedButton.classList.add('move-right');
    targetButton.classList.add('move-left');
  }
  
  // Swap the words in the array
  [scrambledWords[targetIndex], scrambledWords[clickedIndex]] = 
    [scrambledWords[clickedIndex], scrambledWords[targetIndex]];
  
  // After animation completes, update the display
  setTimeout(() => {
    targetButton.textContent = scrambledWords[targetIndex];
    clickedButton.textContent = scrambledWords[clickedIndex];
    
    // Remove movement classes
    targetButton.classList.remove('move-right', 'move-left');
    clickedButton.classList.remove('move-right', 'move-left');
    
    // Re-enable buttons
    setWordButtonsEnabled(true);
    
    // Check if the target word is now correct
    if (isWordCorrect(targetIndex)) {
      validateAndProgress(targetButton);
    } else {
      targetButton.classList.add('incorrect');
      setTimeout(() => {
        targetButton.classList.remove('incorrect');
      }, 500);
    }
  }, 300);
}

// Validate word and progress game
function validateAndProgress(button) {
  button.classList.add('correct');
  targetIndex++;
  
  // Update score
  score += Math.max(10 - Math.floor(timer / 5), 1);
  if (scoreEl) scoreEl.textContent = score;
  
  updateCorrectWordsBorders();
  
  if (targetIndex === originalWords.length) {
    showCompletedSentence();
    setTimeout(() => {
      currentLevel++;
      loadLevel(currentLevel);
    }, 2000);
  }
}

// Update border radius for correct words
function updateCorrectWordsBorders() {
  const correctButtons = wordContainer.getElementsByClassName('correct');
  Array.from(correctButtons).forEach((btn, index) => {
    btn.classList.remove('first-correct', 'last-correct');
    if (index === 0) {
      btn.classList.add('first-correct');
    }
    if (index === correctButtons.length - 1) {
      btn.classList.add('last-correct');
    }
  });
}
// Show completed sentence
function showCompletedSentence() {
  gameComplete = true;
  clearInterval(countdown);
  wordContainer.innerHTML = `
    <div class="completed-sentence">
      Level Complete!<br>
      "${originalWords.join(' ')}"
    </div>
  `;
}

// Timer and Score handling
function resetTimer() {
  clearInterval(countdown);
  timer = 0;
  updateTimer();
  countdown = setInterval(() => {
    timer++;
    updateTimer();
  }, 1000);
}

function updateTimer() {
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateScore() {
  if (scoreEl) {
    scoreEl.textContent = score;
  }
}