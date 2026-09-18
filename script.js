/* =========================================================
   ஜிலேபி தமிழ் - சொல் வேட்டை விளையாட்டு
   script.js - முழு லாஜிக் (Tamil Unicode முழுமையான சரி)
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
   3. ✅ தமிழ் Unicode உதவிச் சார்புகள்
   =========================================================
   தமிழ் "combining marks" = உயிர்க்குறியீடுகள் + virama
   
   ஒரு தமிழ் "காட்சி எழுத்து" (visual character) என்பது:
   1. உயிர் எழுத்து (1 code point): அ, ஆ, இ, ...
   2. மெய் எழுத்து (2 code points): க் = க + ்
   3. உயிர்மெய் எழுத்து (2 code points): கா = க + ா
   ========================================================= */

const TAMIL_COMBINING_MARKS = [
  '\u0BBE', // ா  (aa)
  '\u0BBF', // ி  (i)
  '\u0BC0', // ீ  (ii)
  '\u0BC1', // ு  (u)
  '\u0BC2', // ூ  (uu)
  '\u0BC6', // ெ  (e)
  '\u0BC7', // ே  (ee)
  '\u0BC8', // ை  (ai)
  '\u0BCA', // ொ  (o)
  '\u0BCB', // ோ  (oo)
  '\u0BCC', // ௌ  (au)
  '\u0BCD'  // ்  (virama / pulli)
];

/**
 * தமிழ் சொல்லை காட்சி எழுத்துகளாகப் பிரிக்கும் சார்பு
 * @param {string} word - தமிழ்ச் சொல்
 * @returns {string[]} - காட்சி எழுத்துகளின் வரிசை
 *
 * எடுத்துக்காட்டு:
 *   splitTamilWord("அம்மா") → ["அ", "ம்", "மா"]
 *   splitTamilWord("கொக்கு") → ["கொ", "க்", "கு"]
 *   splitTamilWord("தொடர்வண்டி") → ["தொ", "ட", "ர்", "வ", "ண்", "டி"]
 */
function splitTamilWord(word) {
  const chars = [];
  const codePoints = Array.from(word);

  let i = 0;
  while (i < codePoints.length) {
    const current = codePoints[i];
    const next = codePoints[i + 1];

    // அடுத்த code point ஒரு combining mark ஆக இருந்தால்,
    // அதை தற்போதைய எழுத்துடன் சேர்
    if (next && TAMIL_COMBINING_MARKS.includes(next)) {
      chars.push(current + next);
      i += 2;
    } else {
      chars.push(current);
      i += 1;
    }
  }
  return chars;
}

/* =========================================================
   4. விளையாட்டைத் தொடங்குதல் (Start Game)
   ========================================================= */
function startGame() {
  const activeDiff = document.querySelector('#difficulty-options button.active');
  currentGridSize = activeDiff ? parseInt(activeDiff.dataset.size) : 7;
  currentLesson = parseInt($('lesson-select').value);

  // words.js-இல் உள்ள getWordsForGame() சார்பைப் பயன்படுத்து
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
   5. எழுத்துக் கட்டத்தை உருவாக்குதல்
   ========================================================= */
function initGrid() {
  grid = Array.from({ length: currentGridSize }, () =>
    Array(currentGridSize).fill(null)
  );
}

/* =========================================================
   6. சொற்களை கட்டத்தில் வைத்தல் (Word Placement)
   ========================================================= */
function placeWords() {
  // பெரிய சொற்களை முதலில் வை
  const sorted = [...allWords].sort((a, b) => b.length - a.length);

  // சாத்தியமான திசைகள்: → ↓ ↘ ↗ ← ↑
  const directions = [
    [0, 1],   // கிடைமட்டம் வலது
    [1, 0],   // செங்குத்து கீழ்
    [1, 1],   // குறுக்கு கீழ்-வலது
    [-1, 1],  // குறுக்கு மேல்-வலது
    [0, -1],  // கிடைமட்டம் இடது
    [-1, 0],  // செங்குத்து மேல்
  ];

  for (const word of sorted) {
    // ✅ சொல்லை காட்சி எழுத்துகளாகப் பிரி
    const wordChars = splitTamilWord(word);
    const wordLength = wordChars.length;

    let placed = false;
    let attempts = 0;
    const maxAttempts = 300;

    while (!placed && attempts < maxAttempts) {
      attempts++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const [dr, dc] = dir;

      // சொல்லை வைக்கக்கூடிய வரம்புகளைக் கணக்கிடு
      const maxRow = currentGridSize - (dr > 0 ? wordLength : 1);
      const minRow = dr < 0 ? wordLength - 1 : 0;
      const maxCol = currentGridSize - (dc > 0 ? wordLength : 1);
      const minCol = dc < 0 ? wordLength - 1 : 0;

      if (maxRow < minRow || maxCol < minCol) continue;

      const row = minRow + Math.floor(Math.random() * (maxRow - minRow + 1));
      const col = minCol + Math.floor(Math.random() * (maxCol - minCol + 1));

      if (canPlaceWord(wordChars, row, col, dr, dc)) {
        placeWordAt(word, wordChars, row, col, dr, dc);
        placed = true;
      }
    }

    if (!placed) {
      console.warn('⚠️ சொல்லை வைக்க முடியவில்லை:', word);
    }
  }
}

/**
 * சொல் குறிப்பிட்ட இடத்தில் வைக்க முடியுமா?
 */
function canPlaceWord(wordChars, row, col, dr, dc) {
  for (let i = 0; i < wordChars.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;

    // எல்லைக்குள் உள்ளதா?
    if (r < 0 || r >= currentGridSize || c < 0 || c >= currentGridSize) {
      return false;
    }

    // ஏற்கனவே உள்ள எழுத்து பொருந்துகிறதா?
    const existing = grid[r][c];
    if (existing !== null && existing !== wordChars[i]) {
      return false;
    }
  }
  return true;
}

/**
 * சொல்லை கட்டத்தில் வைத்தல்
 */
function placeWordAt(word, wordChars, row, col, dr, dc) {
  const cells = [];
  for (let i = 0; i < wordChars.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    grid[r][c] = wordChars[i];
    cells.push([r, c]);
  }
  placedWords.push({ word, cells });
}

/* =========================================================
   7. காலியான இடங்களை நிரப்புதல்
   ========================================================= */
function fillEmptyCells() {
  // ✅ தமிழ் உயிர் + மெய் எழுத்துகள் (சரியான Unicode)
  const fillChars = [
    // உயிர் எழுத்துகள் (12)
    'அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ',
    'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ',
    // மெய் எழுத்துகள் (18)
    'க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்',
    'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்',
    'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'
  ];

  for (let r = 0; r < currentGridSize; r++) {
    for (let c = 0; c < currentGridSize; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = fillChars[Math.floor(Math.random() * fillChars.length)];
      }
    }
  }
}

/* =========================================================
   8. கட்டத்தைத் திரையில் காட்டுதல் (Render Grid)
   ========================================================= */
function renderGrid() {
  gridContainer.innerHTML = '';
  gridContainer.style.gridTemplateColumns = `repeat(${currentGridSize}, 1fr)`;
  gridContainer.style.width = `min(95vw, 500px)`;
  gridContainer.classList.add('pop-in');

  // பழைய நிகழ்வு கேட்பான்களை அகற்று
  document.removeEventListener('mouseup', onCellUp);
  document.removeEventListener('touchend', onCellUp);

  for (let r = 0; r < currentGridSize; r++) {
    for (let c = 0; c < currentGridSize; c++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.textContent = grid[r][c];
      cell.dataset.row = r;
      cell.dataset.col = c;

      // Mouse நிகழ்வுகள்
      cell.addEventListener('mousedown', (e) => {
        e.preventDefault();
        onCellDown(r, c);
      });
      cell.addEventListener('mouseenter', () => onCellEnter(r, c));

      // Touch நிகழ்வுகள்
      cell.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onCellDown(r, c);
      }, { passive: false });
      cell.addEventListener('touchmove', onTouchMove, { passive: false });

      gridContainer.appendChild(cell);
    }
  }

  // Mouse/Touch விடுவிப்பு நிகழ்வுகள்
  document.addEventListener('mouseup', onCellUp);
  document.addEventListener('touchend', onCellUp);
}

/* =========================================================
   9. சொல் பட்டியலைக் காட்டுதல் (Render Word List)
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
   10. தேர்வு லாஜிக் (Selection Logic)
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

  // ஒரே வரிசை / நெடுவரிசை / குறுக்கு வரிசை மட்டும்
  const dr = r - last[0];
  const dc = c - last[1];
  if (Math.abs(dr) > 1 || Math.abs(dc) > 1) return;

  // ஏற்கனவே தேர்ந்தெடுக்கப்பட்டதா?
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
   11. தேர்வைச் சரிபார்த்தல் (Check Selection)
   ========================================================= */
function checkSelection() {
  if (selectedCells.length < 1) return;

  // தேர்ந்தெடுக்கப்பட்ட எழுத்துகளை இணை
  let selectedWord = '';
  selectedCells.forEach(([r, c]) => {
    selectedWord += grid[r][c];
  });

  // எதிர் திசையிலும் சரிபார்
  const reversedCells = [...selectedCells].reverse();
  let reversedWord = '';
  reversedCells.forEach(([r, c]) => {
    reversedWord += grid[r][c];
  });

  // ஏற்கனவே கண்டுபிடிக்கப்பட்டதா எனச் சரிபார்
  const matched = allWords.find(w => {
    if (foundWords.includes(w)) return false;
    return w === selectedWord || w === reversedWord;
  });

  if (matched) {
    // ✅ வெற்றி!
    foundWords.push(matched);
    score += matched.length * 10;

    // செல்களை "found" ஆக்கு
    selectedCells.forEach(([r, c]) => {
      const el = gridContainer.querySelector(`[data-row="${r}"][data-col="${c}"]`);
      if (el) {
        el.classList.remove('selected');
        el.classList.add('found');
      }
    });

    // சொல் சிப்பை புதுப்பி
    const chip = wordListEl.querySelector(`[data-word="${matched}"]`);
    if (chip) chip.classList.add('found');

    // பின்னூட்டம்
    feedbackEl.textContent = `✅ "${matched}" சரி! +${matched.length * 10} புள்ளிகள்`;
    feedbackEl.style.color = '#2ecc71';
    updateScore();

    // அனைத்து சொற்களும் கண்டுபிடிக்கப்பட்டதா?
    if (foundWords.length === allWords.length) {
      setTimeout(endGame, 600);
    }
  } else if (selectedWord.length >= 1) {
    // ❌ தவறு
    feedbackEl.textContent = `❌ தவறு. மீண்டும் முயற்சி செய்!`;
    feedbackEl.style.color = '#ff3d71';

    // அதிர்வு அனிமேஷன்
    gridContainer.classList.add('shake');
    setTimeout(() => gridContainer.classList.remove('shake'), 300);
  }

  // 2 வினாடிகளில் பின்னூட்டத்தை அழி
  setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
}

/* =========================================================
   12. மதிப்பெண் புதுப்பித்தல்
   ========================================================= */
function updateScore() {
  $('score-display').textContent = `${foundWords.length} / ${allWords.length}`;
}

/* =========================================================
   13. டைமர் (Timer)
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
   14. விளையாட்டு முடிவு (End Game)
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

  // வெற்றி நிலையைத் தீர்மானி
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
   15. நிகழ்வு இணைப்புகள் (Event Listeners)
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

  // Debug: Console-இல் சரிபார்ப்பு
  console.log('🎮 ஜிலேபி தமிழ் - சொல் வேட்டை விளையாட்டு ஏற்றப்பட்டது!');
  console.log('📚 words.js ஏற்றப்பட்டது:', typeof getWordsForGame === 'function' ? '✅' : '❌');
  console.log('📝 script.js ஏற்றப்பட்டது: ✅');
});
