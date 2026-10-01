const COLS = 10, ROWS = 20, SIZE = 30;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const nextCtx = document.getElementById('next').getContext('2d');

const SHAPES = {
  I: { color: '#0ff', m: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
  O: { color: '#ff0', m: [[1,1],[1,1]] },
  T: { color: '#a0f', m: [[0,1,0],[1,1,1],[0,0,0]] },
  S: { color: '#0f0', m: [[0,1,1],[1,1,0],[0,0,0]] },
  Z: { color: '#f00', m: [[1,1,0],[0,1,1],[0,0,0]] },
  J: { color: '#00f', m: [[1,0,0],[1,1,1],[0,0,0]] },
  L: { color: '#f80', m: [[0,0,1],[1,1,1],[0,0,0]] },
};
const KEYS = Object.keys(SHAPES);
const LINE_POINTS = [0, 100, 300, 500, 800];

let board, piece, nextPiece, score, lines, level, state, dropTimer, last = 0;

function randomPiece() {
  const type = KEYS[Math.floor(Math.random() * KEYS.length)];
  const m = SHAPES[type].m.map(r => r.slice());
  return { type, m, x: Math.floor((COLS - m.length) / 2), y: 0 };
}

function reset() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  score = 0; lines = 0; level = 1; dropTimer = 0;
  piece = randomPiece();
  nextPiece = randomPiece();
  state = 'playing';
  updateHud();
}

function collides(p, dx = 0, dy = 0, m = p.m) {
  for (let r = 0; r < m.length; r++)
    for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const x = p.x + c + dx, y = p.y + r + dy;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && board[y][x]) return true;
    }
  return false;
}

function rotate(m) {
  return m[0].map((_, c) => m.map(row => row[c]).reverse());
}

function tryRotate() {
  const m = rotate(piece.m);
  for (const k of [0, -1, 1, -2, 2]) {
    if (!collides(piece, k, 0, m)) {
      piece.m = m; piece.x += k;
      return;
    }
  }
}

function move(dx) {
  if (!collides(piece, dx, 0)) piece.x += dx;
}

function lock() {
  piece.m.forEach((row, r) => row.forEach((v, c) => {
    if (v && piece.y + r >= 0) board[piece.y + r][piece.x + c] = SHAPES[piece.type].color;
  }));
  let cleared = 0;
  board = board.filter(row => {
    const full = row.every(Boolean);
    if (full) cleared++;
    return !full;
  });
  while (board.length < ROWS) board.unshift(Array(COLS).fill(null));
  if (cleared) {
    score += LINE_POINTS[cleared] * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
  }
  piece = nextPiece;
  nextPiece = randomPiece();
  if (collides(piece)) state = 'gameover';
  updateHud();
}

function drop() {
  if (!collides(piece, 0, 1)) piece.y++;
  else lock();
  dropTimer = 0;
}

function hardDrop() {
  let n = 0;
  while (!collides(piece, 0, 1)) { piece.y++; n++; }
  score += n * 2;
  lock();
  dropTimer = 0;
}

function updateHud() {
  document.getElementById('score').textContent = score;
  document.getElementById('lines').textContent = lines;
  document.getElementById('level').textContent = level;
}

function drawCell(c, x, y, color, size = SIZE) {
  c.fillStyle = color;
  c.fillRect(x * size, y * size, size, size);
  c.strokeStyle = 'rgba(0,0,0,0.5)';
  c.strokeRect(x * size + 0.5, y * size + 0.5, size - 1, size - 1);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  board.forEach((row, y) => row.forEach((color, x) => color && drawCell(ctx, x, y, color)));
  if (state !== 'gameover') {
    // fantasma
    let g = 0;
    while (!collides(piece, 0, g + 1)) g++;
    piece.m.forEach((row, r) => row.forEach((v, c) => {
      if (!v) return;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect((piece.x + c) * SIZE, (piece.y + r + g) * SIZE, SIZE, SIZE);
    }));
    piece.m.forEach((row, r) => row.forEach((v, c) =>
      v && drawCell(ctx, piece.x + c, piece.y + r, SHAPES[piece.type].color)));
  }

  nextCtx.fillStyle = '#000';
  nextCtx.fillRect(0, 0, 120, 120);
  const n = nextPiece.m, off = (4 - n.length) / 2;
  n.forEach((row, r) => row.forEach((v, c) =>
    v && drawCell(nextCtx, c + off, r + off, SHAPES[nextPiece.type].color)));

  if (state === 'paused' || state === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '28px monospace';
    ctx.fillText(state === 'paused' ? 'PAUSA' : 'GAME OVER', canvas.width / 2, 280);
    ctx.font = '14px monospace';
    ctx.fillText(state === 'paused' ? 'P para continuar' : 'Enter para reiniciar', canvas.width / 2, 310);
  }
}

function loop(ts) {
  const dt = Math.min(ts - last, 50);
  last = ts;
  if (state === 'playing') {
    dropTimer += dt;
    if (dropTimer >= Math.max(100, 800 - (level - 1) * 70)) drop();
  }
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (state === 'gameover') {
    if (e.key === 'Enter') reset();
    return;
  }
  if (e.key === 'p' || e.key === 'P') {
    state = state === 'paused' ? 'playing' : 'paused';
    return;
  }
  if (state !== 'playing') return;
  switch (e.key) {
    case 'ArrowLeft': move(-1); break;
    case 'ArrowRight': move(1); break;
    case 'ArrowDown': drop(); score++; updateHud(); break;
    case 'ArrowUp': tryRotate(); break;
    case ' ': hardDrop(); break;
    default: return;
  }
  e.preventDefault();
});

reset();
requestAnimationFrame(loop);
