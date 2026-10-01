# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the game

No build step — open directly or serve statically:

```bash
open index.html                 # macOS, direct
python3 -m http.server 8000    # then open http://localhost:8000
npx serve .
```

## Architecture

Three files, no dependencies:

- **`index.html`** — DOM structure: a 300×600 `<canvas id="board">` for the playing field, a 120×120 `<canvas id="next-canvas">` for the next-piece preview, a side panel with score/lines/level displays, and an overlay `<div>` reused for both PAUSE and GAME OVER states.
- **`style.css`** — Dark/retro aesthetic; overlay visibility is toggled via the `hidden` CSS class.
- **`game.js`** — All game logic (~300 lines, `'use strict'`). Global mutable state (`board`, `current`, `next`, `score`, `lines`, `level`, `paused`, `gameOver`, `dropInterval`, `animId`) is reset by `init()` on start/restart.

### Key design decisions in `game.js`

- **Board** is a `ROWS × COLS` matrix; cells hold `0` (empty) or a color index (1–7) matching `COLORS` and `PIECES` arrays.
- **Rotation** (`rotateCW`) uses transpose + row-reverse. `tryRotate` applies wall kicks of [0, ±1, ±2] columns before discarding the rotation.
- **Game loop** uses `requestAnimationFrame`; `dropAccum` accumulates elapsed ms and triggers a row drop when it exceeds `dropInterval`.
- **Ghost piece** (`ghostY`) projects the current piece downward until collision; drawn at `globalAlpha = 0.2`.
- **Line clearing** (`clearLines`) iterates bottom-up, splices full rows, and unshifts empty rows — `r++` compensates for the index shift after splice.
- **Speed formula**: `dropInterval = Math.max(100, 1000 − (level − 1) × 90)` ms; level increments every 10 lines.

### Tunable constants (top of `game.js`)

| Constant | Default | Note |
|---|---|---|
| `COLS` / `ROWS` | 10 / 20 | Also update canvas `width`/`height` in `index.html` (`COLS×BLOCK` / `ROWS×BLOCK`) |
| `BLOCK` | 30px | Pixel size per cell |
| `LINE_SCORES` | `[0,100,300,500,800]` | Points for 1–4 simultaneous line clears, multiplied by level |
