/**
 * Excavator Run — jobsite obstacles.
 * Each entry gives its footprint as a multiple of the obstacle unit plus a
 * draw function anchored on (left, groundY).
 */

import { roundRect } from '../../core/util.js';

const rr = (ctx, x, y, w, h, r) => roundRect(ctx, x, y, w, h, r);

function cone(ctx, x, g, w, h) {
  ctx.fillStyle = '#c2410c';
  rr(ctx, x, g - h * 0.12, w, h * 0.12, 2); ctx.fill();
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, g - h);
  ctx.lineTo(x + w * 0.9, g - h * 0.12);
  ctx.lineTo(x + w * 0.1, g - h * 0.12);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.31, g - h * 0.46);
  ctx.lineTo(x + w * 0.69, g - h * 0.46);
  ctx.lineTo(x + w * 0.74, g - h * 0.30);
  ctx.lineTo(x + w * 0.26, g - h * 0.30);
  ctx.closePath(); ctx.fill();
}

function rock(ctx, x, g, w, h) {
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.04, g);
  ctx.lineTo(x, g - h * 0.5);
  ctx.lineTo(x + w * 0.28, g - h * 0.95);
  ctx.lineTo(x + w * 0.66, g - h);
  ctx.lineTo(x + w * 0.96, g - h * 0.6);
  ctx.lineTo(x + w, g);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.28, g - h * 0.95);
  ctx.lineTo(x + w * 0.66, g - h);
  ctx.lineTo(x + w * 0.60, g - h * 0.55);
  ctx.lineTo(x + w * 0.32, g - h * 0.5);
  ctx.closePath(); ctx.fill();
}

function barrel(ctx, x, g, w, h) {
  ctx.fillStyle = '#ea580c';
  rr(ctx, x + w * 0.1, g - h, w * 0.8, h, w * 0.12); ctx.fill();
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(x + w * 0.1, g - h * 0.74, w * 0.8, h * 0.14);
  ctx.fillRect(x + w * 0.1, g - h * 0.36, w * 0.8, h * 0.14);
}

function barricade(ctx, x, g, w, h) {
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = Math.max(2, w * 0.05);
  ctx.lineCap = 'round';
  const legs = [
    [0.20, 0.55, 0.05, 1], [0.80, 0.55, 0.95, 1],
    [0.20, 0.55, 0.95, 1], [0.80, 0.55, 0.05, 1]
  ];
  for (const [x1, y1, x2] of legs) {
    ctx.beginPath();
    ctx.moveTo(x + w * x1, g - h * y1);
    ctx.lineTo(x + w * x2, g);
    ctx.stroke();
  }
  const by = g - h, bh = h * 0.42;
  ctx.save();
  rr(ctx, x, by, w, bh, 3); ctx.clip();
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x, by, w, bh);
  ctx.fillStyle = '#1f2937';
  const step = bh * 0.9;
  for (let sx = -bh; sx < w + bh; sx += step * 2) {
    ctx.beginPath();
    ctx.moveTo(x + sx, by + bh);
    ctx.lineTo(x + sx + step, by + bh);
    ctx.lineTo(x + sx + step + bh, by);
    ctx.lineTo(x + sx + bh, by);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function crate(ctx, x, g, w, h) {
  ctx.fillStyle = '#b45309';
  rr(ctx, x + w * 0.05, g - h, w * 0.9, h, 3); ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = Math.max(2, w * 0.04);
  const ix = x + w * 0.05, iy = g - h, iw = w * 0.9;
  ctx.strokeRect(ix, iy, iw, h);
  ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ix + iw, iy + h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ix + iw, iy); ctx.lineTo(ix, iy + h); ctx.stroke();
}

function sign(ctx, x, g, w, h) {
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = Math.max(3, w * 0.12);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, g);
  ctx.lineTo(x + w * 0.5, g - h * 0.5);
  ctx.stroke();
  const cx = x + w * 0.5, cy = g - h * 0.74, rad = Math.min(w, h) * 0.42;
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(cx, cy - rad); ctx.lineTo(cx + rad, cy);
  ctx.lineTo(cx, cy + rad); ctx.lineTo(cx - rad, cy);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(cx - rad * 0.09, cy - rad * 0.5, rad * 0.18, rad * 0.6);
  ctx.beginPath(); ctx.arc(cx, cy + rad * 0.42, rad * 0.11, 0, Math.PI * 2); ctx.fill();
}

function bricks(ctx, x, g, w, h) {
  const rows = 3, rh = h / rows, cols = 3;
  ctx.fillStyle = '#b91c1c';
  for (let ry = 0; ry < rows; ry++) {
    const offset = (ry % 2) * (w / cols) * 0.5;
    for (let ci = 0; ci < cols + 1; ci++) {
      const bx = x + offset + ci * (w / cols) - w / cols;
      const dX = Math.max(x, bx);
      const dW = Math.min(x + w, bx + (w / cols) * 0.92) - dX;
      if (dW <= 0) continue;
      ctx.fillRect(dX, g - h + ry * rh + 1, dW, rh - 2);
    }
  }
}

function hydrant(ctx, x, g, w, h) {
  ctx.fillStyle = '#dc2626';
  rr(ctx, x + w * 0.28, g - h * 0.85, w * 0.44, h * 0.85, w * 0.1); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w * 0.5, g - h * 0.85, w * 0.22, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(x + w * 0.05, g - h * 0.6, w * 0.9, h * 0.12);
  ctx.beginPath(); ctx.arc(x + w * 0.5, g - h * 0.95, w * 0.12, 0, Math.PI * 2); ctx.fill();
}

export const OBSTACLES = [
  { name: 'cone',      w: 0.85, h: 1.00, draw: cone },
  { name: 'rock',      w: 1.25, h: 0.85, draw: rock },
  { name: 'barrel',    w: 0.90, h: 1.15, draw: barrel },
  { name: 'barricade', w: 1.55, h: 1.00, draw: barricade },
  { name: 'crate',     w: 1.05, h: 1.05, draw: crate },
  { name: 'sign',      w: 1.05, h: 1.40, draw: sign },
  { name: 'bricks',    w: 1.40, h: 0.62, draw: bricks },
  { name: 'hydrant',   w: 0.70, h: 1.00, draw: hydrant }
];
