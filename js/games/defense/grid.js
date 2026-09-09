/**
 * Watershed Defense — grid geometry and the channel route.
 *
 * The grid shape is worked out from the real screen, so a phone in portrait
 * gets a tall narrow site and a laptop gets a wide one. The serpentine is
 * capped at three lanes so a single wave never turns into a commute.
 */

import { clamp } from '../../core/util.js';

const PAD_TOP = 54;     // clears the HUD
const PAD_BOTTOM = 122; // clears the build palette and the wave bar
const MAX_LANES = 3;

export function buildGrid(stage) {
  const availW = stage.W - 12;
  const availH = Math.max(stage.H * 0.5, stage.H - PAD_TOP - PAD_BOTTOM);

  const aim = 52;
  let cols = clamp(Math.round(availW / aim), 6, 14);
  let rows = clamp(Math.round(availH / aim), 5, 10);
  let cell = Math.min(availW / cols, availH / rows);

  if (cell < 32) {
    cols = Math.max(6, cols - 1);
    rows = Math.max(5, rows - 1);
    cell = Math.min(availW / cols, availH / rows);
  }
  cell = Math.min(cell, 82);

  const w = cols * cell;
  const h = rows * cell;
  const horizontal = cols >= rows;

  const grid = {
    cols, rows, cell, horizontal,
    x0: (stage.W - w) / 2,
    y0: PAD_TOP + (availH - h) / 2,
    width: w,
    height: h
  };

  grid.path = makePath(cols, rows, horizontal);
  grid.onPath = new Set(grid.path.map(p => `${p.c},${p.r}`));
  return grid;
}

function makePath(cols, rows, horizontal) {
  const path = [];

  if (horizontal) {
    let lanes = [];
    for (let r = 1; r < rows - 1; r += 2) lanes.push(r);
    if (!lanes.length) lanes = [Math.floor(rows / 2)];
    if (lanes.length > MAX_LANES) {
      lanes = [lanes[0], lanes[Math.floor(lanes.length / 2)], lanes[lanes.length - 1]];
    }
    lanes.forEach((r, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      const start = dir === 1 ? 0 : cols - 1;
      for (let k = 0; k < cols; k++) path.push({ c: start + dir * k, r });
      if (i < lanes.length - 1) {
        const c = dir === 1 ? cols - 1 : 0;
        for (let rr = r + 1; rr < lanes[i + 1]; rr++) path.push({ c, r: rr });
      }
    });
  } else {
    let lanes = [];
    for (let c = 1; c < cols - 1; c += 2) lanes.push(c);
    if (!lanes.length) lanes = [Math.floor(cols / 2)];
    if (lanes.length > MAX_LANES) {
      lanes = [lanes[0], lanes[Math.floor(lanes.length / 2)], lanes[lanes.length - 1]];
    }
    lanes.forEach((c, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      const start = dir === 1 ? 0 : rows - 1;
      for (let k = 0; k < rows; k++) path.push({ c, r: start + dir * k });
      if (i < lanes.length - 1) {
        const r = dir === 1 ? rows - 1 : 0;
        for (let cc = c + 1; cc < lanes[i + 1]; cc++) path.push({ c: cc, r });
      }
    });
  }
  return path;
}

export const cellCenter = (g, c, r) => ({
  x: g.x0 + (c + 0.5) * g.cell,
  y: g.y0 + (r + 0.5) * g.cell
});

/** Position along the channel, `t` measured in path cells. */
export function pathPoint(g, t) {
  const i = Math.floor(t);
  const f = t - i;
  if (i >= g.path.length - 1) {
    const end = g.path[g.path.length - 1];
    return cellCenter(g, end.c, end.r);
  }
  const a = cellCenter(g, g.path[i].c, g.path[i].r);
  const b = cellCenter(g, g.path[i + 1].c, g.path[i + 1].r);
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

/** Heading along the channel at `t`, used to orient contaminants. */
export function pathHeading(g, t) {
  const a = pathPoint(g, Math.max(0, t - 0.15));
  const b = pathPoint(g, Math.min(g.path.length - 1, t + 0.15));
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export const isOnPath = (g, c, r) => g.onPath.has(`${c},${r}`);

/** Grid cell under a canvas point, or null if outside the site. */
export function cellAt(g, x, y) {
  const c = Math.floor((x - g.x0) / g.cell);
  const r = Math.floor((y - g.y0) / g.cell);
  if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) return null;
  return { c, r };
}
