/* =========================================================
   ஜிலேபி தமிழ் - சொல் வேட்டை விளையாட்டு
   script.js - விளையாட்டின் முழு லாஜிக்
   ========================================================= */

/* =========================================================
   1. விளையாட்டு நிலை (State Variables)
   ========================================================= */
let currentGridSize = 7;
let currentLesson = 1;
let grid = [];
let placedWords = [];
let foundWords = [];
let selectedCells = [];
let isSelecting = false;
let score = 0;
let startTime = 0;
let timerInterval = null;
let allWords = [];

/* =========================================================
   2. DOM குறிப்புகள் (Element References)
   ========================================================= */
const $ = id => document.getElementById(id);
const gridContainer = $('grid-container');
const wordListEl = $('word-list');
const feedbackEl = $('feedback');

/* =========================================================
   3. விளையாட்டைத் தொடங்குதல் (Start Game)
   ========================================================= */
function startGame() {
  // தேர்ந்தெடுக்கப்பட்ட கடின நிலை & பாடத்தைப் பெறு
  const activeDiff = document.querySelector('#difficulty-options button.active');
  currentGridSize = activeDiff ? parseInt(activeDiff.dataset.size) : 7;
  currentLesson = parseInt($('lesson-select').value);

  // ✅ words.js-இல் உள்ள getWordsForGame() சார்பைப் பயன்படுத்து
  allWords = getWordsForGame(currentLesson, currentGridSize);

  // திரை மாற்றம்
  $('home-screen').classList.add('hidden');
  $('game-screen').classList.remove('hidden');
  $('result-screen').classList.add('hidden');

  // நிலை மீட்டமை
  grid = [];
  placedWords = [];
  foundWords = [];
  selectedCells = [];
  score = 0;
  feedbackEl.textContent = '';

  // விளையாட்டை உருவாக்கு
  initGrid();
  placeWords();
  fillEmptyCells();
  renderGrid();
  renderWordList();
  updateScore();
  startTimer();
}

/* =========================================================
   4. எழுத்துக் கட்டத்தை உருவாக்குதல்
   ========================================================= */
function initGrid() {
  grid = Array.from({ length: currentGridSize }, () =>
    Array(currentGridSize).fill(null)
  );
}

/* =========================================================
   5. சொற்களை கட்டத்தில் வைத்தல் (Word Placement)
   ========================================================= */
function placeWords() {
  const sorted = [...allWords].sort((a, b) => b.length - a.length);

  const directions = [
    [0, 1],   // கிடைமட்டம் வலது
    [1, 0],   // செங்குத்து கீழ்
    [1, 1],   // குறுக்கு கீழ்-வலது
    [-1, 1],  // குறுக்கு மேல்-வலது
    [0, -1],  // கிடைமட்டம் இடது
    [-1, 0],  // செங்குத்து மேல்
  ];

  for (const word of sorted) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 300;

    while (!placed && attempts < maxAttempts) {
      attempts++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const [dr, dc] = dir;

      const maxRow = currentGridSize - (dr > 0 ? word.length : 1);
      const minRow = dr < 0 ? word.length - 1 : 0;
      const maxCol = currentGridSize - (dc > 0 ? word.length : 1);
      const minCol = dc < 0 ? word.length - 1 : 0;

      const row = minRow + Math.floor(Math.random() * (maxRow - minRow + 1));
      const col = minCol + Math.floor(Math.random() * (maxCol - minCol + 1));

      if (canPlaceWord(word, row, col, dr, dc)) {
        placeWordAt(word, row, col, dr, dc);
        placed = true;
      }
    }

    if (!placed) {
      console.warn('⚠️ சொல்லை வைக்க முடியவில்லை:', word);
    }
  }
}

function canPlaceWord(word, row, col, dr, dc) {
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;

    if (r < 0 || r >= currentGridSize || c < 0 || c >= currentGridSize) {
      return false;
    }

    const existing = grid[r][c];
    if (existing !== null && existing !== word[i]) {
      return false;
    }
  }
  return true;
}

function placeWordAt(word, row, col, dr, dc) {
  const cells = [];
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    grid[r][c] = word[i];
    cells.push([r, c]);
  }
  placedWords.push({ word, cells });
}

/* =========================================================
   6. காலியான இடங்களை நிரப்புதல்
   ========================================================= */
function fillEmptyCells() {
  const fillChars = 'அஆஇஈஉஊஎஏஐஒஓஔகசடதபமயரலவழளறனஙஞணந'.split('');

  for (let r = 0; r < currentGridSize; r++) {
    for (let c = 0; c < currentGridSize; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = fillChars[Math.floor(Math.random() * fillChars.length)];
      }
    }
  }
}

/* =========================================================
   7. கட்டத்தைத் திரையில் காட்டுதல்
   ========================================================= */
function renderGrid() {
  gridContainer.innerHTML = '';
  gridContainer.style.gridTemplateColumns = `repeat(${currentGridSize}, 1fr)`;
  gridContainer.style.width = `min(95vw, 500px)`;
  gridContainer.classList.add('pop-in');

  document.removeEventListener('mouseup', onCellUp);
  document.removeEventListener('touchend', onCellUp);

  for (let r = 0; r < currentGridSize; r++) {
    for (let c = 0; c < currentGridSize; c++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.textContent = grid[r][c];
      cell.dataset.row = r;
      cell.dataset.col = c;

      cell.addEventListener('mousedown', (e) => { e.preventDefault(); onCellDown(r, c); });
      cell.addEventListener('mouseenter', () => onCellEnter(r, c));
      cell.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onCellDown(r, c);
      }, { passive: false });
      cell.addEventListener('touchmove', onTouchMove, { passive: false });

      gridContainer.appendChild(cell);
    }
  }

  document.addEventListener('mouseup', onCellUp);
  document.addEventListener('touchend', onCellUp);
}

/* =========================================================
   8. சொல் பட்டியலைக் காட்டுதல்
   ========================================================= */
function renderWordList() {
  wordListEl.innerHTML = '';
  allWords.forEach(word => {
    const chip = document.createElement('div');
    chip.className = 'word-chip';
    chip.textContent = word;
    chip.dataset.word = word;
    wordListEl.appendChild(chip);
  });
}

/* =========================================================
   9. தேர்வு லாஜிக் (Selection Logic)
   ========================================================= */
function onCellDown(r, c) {
  isSelecting = true;
  selectedCells = [[r, c]];
  updateCellHighlight();
}

function onCellEnter(r, c) {
  if (!isSelecting) return;

  const last = selectedCells[selectedCells.length - 1];
  if (!last) return;

  const dr = r - last[0];
  const dc = c - last[1];
  if (Math.abs(dr) > 1 || Math.abs(dc) > 1) return;

  if (selectedCells.some(([sr, sc]) => sr === r && sc === c)) return;

  selectedCells.push([r, c]);
  updateCellHighlight();
}

function onTouchMove(e) {
  e.preventDefault();
  if (!isSelecting) return;

  const touch = e.touches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);

  if (el && el.classList.contains('grid-cell')) {
    const r = parseInt(el.dataset.row);
    const c = parseInt(el.dataset.col);
    onCellEnter(r, c);
  }
}

function onCellUp() {
  if (!isSelecting) return;
  isSelecting = false;
  checkSelection();
  selectedCells = [];
  updateCellHighlight();
}

function updateCellHighlight() {
  document.querySelectorAll('.grid-cell').forEach(el => {
    el.classList.remove('selected');
  });

  selectedCells.forEach(([r, c]) => {
    const el = gridContainer.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    if (el && !el.classList.contains('found')) {
      el.classList.add('selected');
    }
  });
}

/* =========================================================
   10. தேர்வைச் சரிபார்த்தல்
   ========================================================= */
function checkSelection() {
  if (selectedCells.length < 2) return;

  let selectedWord = '';
  selectedCells.forEach(([r, c]) => {
    selectedWord += grid[r][c];
  });

  const reversedWord = selectedWord.split('').reverse().join('');

  const matched = allWords.find(w =>
    (w === selectedWord || w === reversedWord) && !foundWords.includes(w)
  );

  if (matched) {
    foundWords.push(matched);
    score += matched.length * 10;

    selectedCells.forEach(([r, c]) => {
      const el = gridContainer.querySelector(`[data-row="${r}"][data-col="${c}"]`);
      if (el) {
        el.classList.remove('selected');
        el.classList.add('found');
      }
    });

    const chip = wordListEl.querySelector(`[data-word="${matched}"]`);
    if (chip) chip.classList.add('found');

    feedbackEl.textContent = `✅ "${matched}" சரி! +${matched.length * 10} புள்ளிகள்`;
    feedbackEl.style.color = '#2ecc71';
    updateScore();

    if (foundWords.length === allWords.length) {
      setTimeout(endGame, 600);
    }
  } else if (selectedWord.length >= 2) {
    feedbackEl.textContent = `❌ தவறு. மீண்டும் முயற்சி செய்!`;
    feedbackEl.style.color = '#ff3d71';

    gridContainer.classList.add('shake');
    setTimeout(() => gridContainer.classList.remove('shake'), 300);
  }

  setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
}

/* =========================================================
   11. மதிப்பெண் புதுப்பித்தல்
   ========================================================= */
function updateScore() {
  $('score-display').textContent = `${foundWords.length} / ${allWords.length}`;
}

/* =========================================================
   12. டைமர்
   ========================================================= */
function startTimer() {
  startTime = Date.now();
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    $('timer-display').textContent = `${m}:${s}`;
  }, 1000);
}

/* =========================================================
   13. விளையாட்டு முடிவு
   ========================================================= */
function endGame() {
  clearInterval(timerInterval);

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');

  $('game-screen').classList.add('hidden');
  $('result-screen').classList.remove('hidden');

  const total = allWords.length;
  const pct = Math.round((foundWords.length / total) * 100);

  let emoji = '🎉', title = 'அற்புதம்!';
  if (pct === 100) { emoji = '🏆'; title = 'சாதனை! அனைத்தும் சரி!'; }
  else if (pct >= 75) { emoji = '🎉'; title = 'மிக நன்று!'; }
  else if (pct >= 50) { emoji = '👏'; title = 'நல்ல முயற்சி!'; }
  else { emoji = '💪'; title = 'மீண்டும் முயற்சி செய்!'; }

  $('result-emoji').textContent = emoji;
  $('result-title').textContent = title;
  $('result-time').textContent = `${m}:${s}`;
  $('result-found').textContent = `${foundWords.length} / ${total}`;
  $('result-score').textContent = score;
}

/* =========================================================
   14. நிகழ்வு இணைப்புகள் (Event Listeners)
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // கடின நிலை பொத்தான்கள்
  document.querySelectorAll('#difficulty-options button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#difficulty-options button').forEach(b => {
        b.classList.remove('active');
      });
      btn.classList.add('active');
    });
  });

  // விளையாட்டைத் தொடங்கு
  $('start-btn').addEventListener('click', startGame);

  // மீண்டும் விளையாடு
  $('play-again-btn').addEventListener('click', () => {
    $('result-screen').classList.add('hidden');
    startGame();
  });

  // முகப்புக்குத் திரும்பு
  $('home-btn').addEventListener('click', () => {
    $('result-screen').classList.add('hidden');
    $('home-screen').classList.remove('hidden');
    clearInterval(timerInterval);
  });

  // விளையாட்டை விட்டு வெளியேறு
  $('quit-btn').addEventListener('click', () => {
    if (confirm('விளையாட்டை விட்டு வெளியேற விரும்புகிறீர்களா?')) {
      clearInterval(timerInterval);
      $('game-screen').classList.add('hidden');
      $('home-screen').classList.remove('hidden');
    }
  });

  // வெளியே கிளிக் செய்தால் தேர்வு ரத்து
  document.addEventListener('mouseup', () => {
    if (isSelecting) onCellUp();
  });
});
