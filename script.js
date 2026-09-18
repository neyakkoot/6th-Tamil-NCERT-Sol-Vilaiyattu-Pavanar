/* =========================================================
   ஜிலேபி தமிழ் - சொல் வேட்டை விளையாட்டு
   script.js - விளையாட்டின் முழு லாஜிக்
   ========================================================= */

/* =========================================================
   1. சொல் பட்டியல் - ஒவ்வொரு பாடத்திற்கும்
   (உங்களது quiz JSON-களில் உள்ள சரியான விடைகள்)
   ========================================================= */
const LESSON_WORDS = {
  1: ["அம்மா", "ஆடு", "இலை", "ஈட்டி", "உப்பு", "ஊஞ்சல்", "எலி", "ஏணி", "ஐந்து", "ஒன்று", "ஓணான்", "ஒளவை"],
  2: ["சங்கு", "பட்டம்", "நத்தை", "சக்கரம்", "பந்து", "கப்பல்", "மரம்", "மீன்", "கண்", "நண்டு", "செங்கல்", "குழந்தை"],
  3: ["கண்", "சங்கு", "பணம்", "மயில்", "வயல்", "பள்ளம்", "பறவை", "காலை", "சாலை", "பாட்டி", "கிண்ணம்", "வீடு"],
  4: ["குரங்கு", "சுவர்", "நாடு", "துண்டு", "புடவை", "யுகம்", "எருமை", "கூண்டு", "தாண்டில்", "நூலகம்", "பூக்கள்", "வாத்து"],
  5: ["முட்டை", "நத்தை", "குகை", "பூனை", "வீணை", "பானை", "மலை", "கொக்கு", "தொப்பி", "மொட்டு", "கோழி", "தோகை"],
  6: ["மலர்", "நாய்", "பறவை", "குடை", "மீன்", "மலை", "பூனை", "கிளி", "வீடு", "சுத்தம்", "உண்மை", "மரியாதை"],
  7: ["சிங்கம்", "புலி", "மான்", "கரடி", "குரங்கு", "நரி", "யானை", "மயில்", "கிளி", "காகம்", "பருந்து", "கோழி"],
  8: ["ரோஜா", "சாமந்தி", "மல்லிகை", "தாமரை", "அல்லி", "மாம்பழம்", "வாழைப்பழம்", "திராட்சை", "தர்ப்பூசணி", "கேரட்", "தக்காளி", "மிளகாய்"],
  9: ["அப்பா", "அம்மா", "தாத்தா", "பாட்டி", "அண்ணன்", "அக்கா", "தம்பி", "தங்கை", "மாமா", "அத்தை", "மகன்", "மகள்"],
  10: ["கிழக்கு", "மேற்கு", "வடக்கு", "தெற்கு", "ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி", "மாதம்"],
  11: ["கண்", "காது", "மூக்கு", "வாய்", "கை", "கால்", "தலை", "வயிறு", "தோல்", "பல்", "நாக்கு", "விரல்"],
  12: ["பேருந்து", "சரக்குந்து", "மகிழுந்து", "வானூர்தி", "மிதிவண்டி", "படகு", "கப்பல்", "தொடர்வண்டி", "மருத்துவர்", "காவலர்", "உழவர்", "தச்சர்"],
  13: ["சிவப்பு", "மஞ்சள்", "பச்சை", "நீலம்", "ஊதா", "கருப்பு", "வெள்ளை", "சதுரம்", "வட்டம்", "முக்கோணம்", "செவ்வகம்", "உருளை"]
};

/* =========================================================
   2. விளையாட்டு நிலை (State Variables)
   ========================================================= */
let currentGridSize = 7;    // கட்ட அளவு (7×7 முதல் 10×10 வரை)
let currentLesson = 1;       // தற்போதைய பாடம்
let grid = [];               // எழுத்துக் கட்டம் (2D array)
let placedWords = [];        // கட்டத்தில் வைக்கப்பட்ட சொற்கள்
let foundWords = [];         // கண்டுபிடிக்கப்பட்ட சொற்கள்
let selectedCells = [];      // தற்போது தேர்ந்தெடுக்கப்பட்ட செல்கள்
let isSelecting = false;     // தேர்வு நடக்கிறதா?
let score = 0;               // மதிப்பெண்
let startTime = 0;           // தொடக்க நேரம்
let timerInterval = null;    // டைமர்
let allWords = [];           // தற்போதைய பாடத்தின் அனைத்து சொற்கள்

/* =========================================================
   3. DOM குறிப்புகள் (Element References)
   ========================================================= */
const $ = id => document.getElementById(id);
const gridContainer = $('grid-container');
const wordListEl = $('word-list');
const feedbackEl = $('feedback');

/* =========================================================
   4. விளையாட்டைத் தொடங்குதல் (Start Game)
   ========================================================= */
function startGame() {
  // தேர்ந்தெடுக்கப்பட்ட கடின நிலை & பாடத்தைப் பெறு
  const activeDiff = document.querySelector('#difficulty-options button.active');
  currentGridSize = activeDiff ? parseInt(activeDiff.dataset.size) : 7;
  currentLesson = parseInt($('lesson-select').value);
  allWords = [...LESSON_WORDS[currentLesson]];

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
  // பெரிய சொற்களை முதலில் வை (வெற்றி வாய்ப்பு அதிகம்)
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
    let placed = false;
    let attempts = 0;
    const maxAttempts = 300;

    while (!placed && attempts < maxAttempts) {
      attempts++;

      // சீரற்ற திசை
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const [dr, dc] = dir;

      // சொல்லை வைக்கக்கூடிய வரம்புகளைக் கணக்கிடு
      const maxRow = currentGridSize - (dr > 0 ? word.length : 1);
      const minRow = dr < 0 ? word.length - 1 : 0;
      const maxCol = currentGridSize - (dc > 0 ? word.length : 1);
      const minCol = dc < 0 ? word.length - 1 : 0;

      // சீரற்ற தொடக்க நிலை
      const row = minRow + Math.floor(Math.random() * (maxRow - minRow + 1));
      const col = minCol + Math.floor(Math.random() * (maxCol - minCol + 1));

      // வைக்க முடியுமா எனச் சரிபார்
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

/* சொல் குறிப்பிட்ட இடத்தில் வைக்க முடியுமா? */
function canPlaceWord(word, row, col, dr, dc) {
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;

    // எல்லைக்குள் உள்ளதா?
    if (r < 0 || r >= currentGridSize || c < 0 || c >= currentGridSize) {
      return false;
    }

    // ஏற்கனவே உள்ள எழுத்து பொருந்துகிறதா?
    const existing = grid[r][c];
    if (existing !== null && existing !== word[i]) {
      return false;
    }
  }
  return true;
}

/* சொல்லை கட்டத்தில் வைத்தல் */
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
   7. காலியான இடங்களை சீரற்ற எழுத்துகளால் நிரப்புதல்
   ========================================================= */
function fillEmptyCells() {
  // தமிழ் எழுத்துகள் - நிரப்புதலுக்கு
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
   8. கட்டத்தைத் திரையில் காட்டுதல் (Render Grid)
   ========================================================= */
function renderGrid() {
  gridContainer.innerHTML = '';
  gridContainer.style.gridTemplateColumns = `repeat(${currentGridSize}, 1fr)`;
  gridContainer.style.width = `min(95vw, 500px)`;
  gridContainer.classList.add('pop-in');

  // அனைத்து நிகழ்வு கேட்பான்களையும் அகற்று (மீண்டும் தொடங்கும்போது)
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
      cell.addEventListener('mousedown', (e) => { e.preventDefault(); onCellDown(r, c); });
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
   9. சொல் பட்டியலைக் காட்டுதல்
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

/* செல்களை ஒளிரச் செய்தல் */
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
  if (selectedCells.length < 2) return;

  // தேர்ந்தெடுக்கப்பட்ட எழுத்துகளை இணை
  let selectedWord = '';
  selectedCells.forEach(([r, c]) => {
    selectedWord += grid[r][c];
  });

  // எதிர் திசையிலும் சரிபார் (வலமிருந்து இடம், கீழிருந்து மேல்)
  const reversedWord = selectedWord.split('').reverse().join('');

  // ஏற்கனவே கண்டுபிடிக்கப்பட்டதா எனச் சரிபார்
  const matched = allWords.find(w =>
    (w === selectedWord || w === reversedWord) && !foundWords.includes(w)
  );

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
    feedbackEl.style.color = 'var(--jalebi-green)';
    updateScore();

    // அனைத்து சொற்களும் கண்டுபிடிக்கப்பட்டதா?
    if (foundWords.length === allWords.length) {
      setTimeout(endGame, 600);
    }
  } else if (selectedWord.length >= 2) {
    // ❌ தவறு
    feedbackEl.textContent = `❌ தவறு. மீண்டும் முயற்சி செய்!`;
    feedbackEl.style.color = 'var(--jalebi-pink)';

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
});
