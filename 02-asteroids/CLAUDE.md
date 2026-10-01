# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the game

No build step. Open `index.html` directly in a browser, or serve locally:

```bash
npx serve .
# then visit http://localhost:3000
```

There are no tests, no linter, and no package manager configuration.

## Architecture

The entire game lives in a single file: `game.js`. The structure is linear — classes defined first, then global state, then the `update`/`draw` functions, then the game loop.

**Game loop**: `requestAnimationFrame` calls `loop(ts)`, which computes `dt` (capped at 50 ms to prevent tunneling on tab-blur) and calls `update(dt)` then `draw()`.

**State machine**: the global `state` variable drives `update()` behavior — `'playing'`, `'dead'` (respawn timer counting down), or `'gameover'`.

**Entity lifecycle**: `Bullet`, `Asteroid`, and `Particle` instances carry a `dead` boolean. Each frame, arrays are filtered with `.filter(x => !x.dead)` after collision/TTL checks — no object pool.

**Collision**: simple circle vs. circle using `dist()`. The ship hitbox uses `0.82 × asteroid.radius` as a forgiveness factor. Bullets are checked against all asteroids in an O(n²) nested loop each frame.

**Asteroid splitting**: `Asteroid.split()` returns two new `Asteroid` instances at size−1. Size 1 asteroids return `[]`. New fragments are concatenated onto the `asteroids` array after the bullet-vs-asteroid pass.

**Wrapping**: `wrap(v, max)` handles toroidal space for all moving objects (ship, bullets, asteroids). Particles do not wrap.

**Canvas size**: hardcoded `800 × 600` in both `index.html` (`<canvas>` attributes) and `game.js` (`W`, `H` constants).


