const SIZE = 4;
const STORAGE_KEY = "2048-best-score";

let board = [];
let score = 0;
let bestScore = Number.parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
let won = false;
let locked = false;

const boardElement = document.querySelector("#game-board");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#best-score");
const messageElement = document.querySelector("#game-message");
const messageTitle = document.querySelector("#message-title");
const messageText = document.querySelector("#message-text");

function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function startGame() {
  board = createEmptyBoard();
  score = 0;
  won = false;
  locked = false;
  hideMessage();
  addRandomTile();
  addRandomTile();
  render();
}

function emptyCells() {
  const cells = [];
  board.forEach((row, rowIndex) => row.forEach((value, colIndex) => {
    if (value === 0) cells.push([rowIndex, colIndex]);
  }));
  return cells;
}

function addRandomTile() {
  const cells = emptyCells();
  if (!cells.length) return;
  const [row, col] = cells[Math.floor(Math.random() * cells.length)];
  board[row][col] = Math.random() < 0.9 ? 2 : 4;
}

function slideLine(line) {
  const compact = line.filter(Boolean);
  const result = [];
  let gained = 0;
  for (let i = 0; i < compact.length; i += 1) {
    if (compact[i] === compact[i + 1]) {
      const merged = compact[i] * 2;
      result.push(merged);
      gained += merged;
      i += 1;
    } else {
      result.push(compact[i]);
    }
  }
  while (result.length < SIZE) result.push(0);
  return { line: result, gained };
}

function move(direction) {
  if (locked) return;
  const before = JSON.stringify(board);
  let gained = 0;
  const next = createEmptyBoard();

  for (let index = 0; index < SIZE; index += 1) {
    const line = direction === "left" || direction === "right"
      ? board[index].slice()
      : board.map((row) => row[index]);
    if (direction === "right" || direction === "down") line.reverse();
    const moved = slideLine(line);
    const result = direction === "right" || direction === "down" ? moved.line.reverse() : moved.line;
    if (direction === "left" || direction === "right") next[index] = result;
    else result.forEach((value, position) => { next[position][index] = value; });
    gained += moved.gained;
  }

  board = next;
  if (JSON.stringify(board) === before) {
    if (!hasMoves()) endGame();
    return;
  }
  score += gained;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(STORAGE_KEY, String(bestScore));
  }
  addRandomTile();
  render();
  if (!won && board.some((row) => row.includes(2048))) showWin();
  else if (!hasMoves()) endGame();
}

function hasMoves() {
  if (emptyCells().length) return true;
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (row < SIZE - 1 && board[row][col] === board[row + 1][col]) return true;
      if (col < SIZE - 1 && board[row][col] === board[row][col + 1]) return true;
    }
  }
  return false;
}

function render() {
  boardElement.innerHTML = "";
  board.forEach((row, rowIndex) => row.forEach((value, colIndex) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-label", value ? `${value} 方块` : "空白方格");
    if (value) {
      cell.dataset.value = value;
      cell.textContent = value;
      cell.classList.add("pop");
    }
    cell.dataset.row = rowIndex;
    cell.dataset.col = colIndex;
    boardElement.appendChild(cell);
  }));
  scoreElement.textContent = score;
  bestScoreElement.textContent = bestScore;
}

function showWin() {
  won = true;
  messageTitle.textContent = "你做到了！";
  messageText.textContent = "成功合成 2048，太棒了！还可以继续挑战更高分。";
  messageElement.hidden = false;
}

function endGame() {
  locked = true;
  messageTitle.textContent = "游戏结束";
  messageText.textContent = "没有更多移动了，试试再来一局吧。";
  messageElement.hidden = false;
}

function hideMessage() { messageElement.hidden = true; }

document.addEventListener("keydown", (event) => {
  const keys = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down" };
  const direction = keys[event.key] || keys[event.key.toLowerCase()];
  if (direction) {
    event.preventDefault();
    move(direction);
  }
});

let touchStart = null;
boardElement.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });
boardElement.addEventListener("touchend", (event) => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
}, { passive: true });

document.querySelector("#new-game").addEventListener("click", startGame);
document.querySelector("#try-again").addEventListener("click", startGame);

startGame();
