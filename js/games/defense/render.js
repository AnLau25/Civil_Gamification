/**
 * Watershed Defense — all drawing.
 *
 * Every treatment unit is drawn as the thing it actually is: a bar rack with a
 * travelling rake, a clarifier with a rotating arm, a rapid mix with a paddle,
 * an aeration basin with rising bubbles, a UV bank that glows. The point is
 * that a student can recognise the process from the picture.
 */

import { UNITS, POLLUTANTS } from './config.js';
import { cellCenter, pathPoint, pathHeading, isOnPath } from './grid.js';
import { drawMachine, drawPad } from './machines.js';
import { roundRect, hashRand, clamp } from '../../core/util.js';

/* ==========================================================================
   Site
   ========================================================================== */
export function drawSite(ctx, g, time) {
  const { x0, y0, width, height, cell } = g;

  /* Full playfield ground. The inset site remains darker so the grid and
     machine positions stay visually distinct from the surrounding bank. */
  const field = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  field.addColorStop(0, '#5d9b45');
  field.addColorStop(1, '#315f2c');
  ctx.fillStyle = field;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  /* Keep the grass texture across the full playfield, not just the site. */
  const fieldTufts = Math.round((ctx.canvas.width * ctx.canvas.height) / (cell * cell) * 1.2);
  ctx.save();
  for (let i = 0; i < fieldTufts; i++) {
    const x = hashRand(i * 1.31 + 91) * ctx.canvas.width;
    const y = hashRand(i * 2.77 + 137) * ctx.canvas.height;
    const size = cell * (0.04 + hashRand(i * 4.13 + 173) * 0.04);
    ctx.strokeStyle = hashRand(i * 5.7 + 211) > 0.55
      ? 'rgba(210,255,140,.18)' : 'rgba(25,60,20,.16)';
    ctx.lineWidth = Math.max(1, cell * 0.025);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size * 0.4, y - size);
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * 0.3, y - size * 0.8);
    ctx.stroke();
  }
  ctx.restore();

  /* site base, in daylight */
  const base = ctx.createLinearGradient(0, y0, 0, y0 + height);
  base.addColorStop(0, '#4e8a3c');
  base.addColorStop(1, '#3a6d31');
  ctx.fillStyle = base;
  roundRect(ctx, x0 - cell * 0.12, y0 - cell * 0.12, width + cell * 0.24, height + cell * 0.24, cell * 0.28);
  ctx.fill();

  /* grass tufts and stones, deterministic so nothing shimmers */
  ctx.save();
  roundRect(ctx, x0, y0, width, height, cell * 0.2);
  ctx.clip();

  const tufts = Math.round((width * height) / (cell * cell) * 2.4);
  for (let i = 0; i < tufts; i++) {
    const x = x0 + hashRand(i * 1.31) * width;
    const y = y0 + hashRand(i * 2.77 + 3) * height;
    const s = cell * (0.05 + hashRand(i * 4.13) * 0.05);
    ctx.strokeStyle = hashRand(i * 5.7) > 0.55 ? 'rgba(210,255,140,.35)' : 'rgba(25,60,20,.25)';
    ctx.lineWidth = Math.max(1, cell * 0.03);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + s * 0.4, y - s);
    ctx.moveTo(x, y);
    ctx.lineTo(x - s * 0.3, y - s * 0.8);
    ctx.stroke();
  }
  ctx.restore();

  /* Always-visible placement grid. It stays light enough for machinery and
     the channel to remain the visual focus. */
  ctx.save();
  roundRect(ctx, x0, y0, width, height, cell * 0.2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(225,255,210,.20)';
  ctx.lineWidth = Math.max(1, cell * 0.018);
  for (let c = 1; c < g.cols; c++) {
    const x = x0 + c * cell;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y0 + height);
    ctx.stroke();
  }
  for (let r = 1; r < g.rows; r++) {
    const y = y0 + r * cell;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + width, y);
    ctx.stroke();
  }
  ctx.restore();
}

/* ==========================================================================
   Channel
   ========================================================================== */
export function drawChannel(ctx, g, time) {
  const cell = g.cell;

  const stroke = (w, style) => {
    ctx.strokeStyle = style;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const a = cellCenter(g, g.path[0].c, g.path[0].r);
    ctx.moveTo(a.x, a.y);
    for (let i = 1; i < g.path.length; i++) {
      const p = cellCenter(g, g.path[i].c, g.path[i].r);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  };

  /* cut into the ground */
  stroke(cell * 0.94, 'rgba(0,0,0,.20)');
  /* concrete lining */
  stroke(cell * 0.86, '#a3aeba');
  stroke(cell * 0.76, '#7e8b96');

  /* water body */
  const water = ctx.createLinearGradient(0, g.y0, 0, g.y0 + g.height);
  water.addColorStop(0, '#3b82f6');
  water.addColorStop(0.5, '#2f74e8');
  water.addColorStop(1, '#2563c4');
  stroke(cell * 0.64, water);

  /* surface sheen along the top edge of the water */
  stroke(cell * 0.30, 'rgba(191,219,254,.24)');

  /* flow chevrons drifting toward the intake */
  ctx.save();
  ctx.strokeStyle = 'rgba(191,219,254,.30)';
  ctx.lineWidth = Math.max(1.2, cell * 0.035);
  ctx.lineCap = 'round';
  const spacing = 1.7;
  const offset = (time * 0.8) % spacing;
  for (let t = offset; t < g.path.length - 1; t += spacing) {
    const p = pathPoint(g, t);
    const a = pathHeading(g, t);
    const s = cell * 0.10;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-s, -s * 0.75);
    ctx.lineTo(s * 0.5, 0);
    ctx.lineTo(-s, s * 0.75);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  drawOutfall(ctx, g);
  drawIntake(ctx, g, time);
}

function drawOutfall(ctx, g) {
  const start = g.path[0];
  const p = cellCenter(g, start.c, start.r);
  const cell = g.cell;

  ctx.fillStyle = '#475569';
  roundRect(ctx, p.x - cell * 0.30, p.y - cell * 0.30, cell * 0.60, cell * 0.60, cell * 0.12);
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(p.x, p.y, cell * 0.19, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = Math.max(1.5, cell * 0.035);
  ctx.beginPath();
  ctx.arc(p.x, p.y, cell * 0.19, 0, Math.PI * 2);
  ctx.stroke();
}

function drawIntake(ctx, g, time) {
  const end = g.path[g.path.length - 1];
  const p = cellCenter(g, end.c, end.r);
  const cell = g.cell;

  /* weir wall */
  ctx.fillStyle = '#64748b';
  roundRect(ctx, p.x - cell * 0.42, p.y - cell * 0.42, cell * 0.84, cell * 0.84, cell * 0.14);
  ctx.fill();
  ctx.fillStyle = '#94a3b8';
  roundRect(ctx, p.x - cell * 0.42, p.y - cell * 0.42, cell * 0.84, cell * 0.14, cell * 0.07);
  ctx.fill();

  /* river water inside the intake, gently moving */
  ctx.save();
  roundRect(ctx, p.x - cell * 0.32, p.y - cell * 0.24, cell * 0.64, cell * 0.56, cell * 0.08);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, p.y - cell * 0.3, 0, p.y + cell * 0.3);
  grad.addColorStop(0, '#0ea5e9');
  grad.addColorStop(1, '#0369a1');
  ctx.fillStyle = grad;
  ctx.fillRect(p.x - cell * 0.4, p.y - cell * 0.4, cell * 0.8, cell * 0.8);

  ctx.strokeStyle = 'rgba(224,242,254,.55)';
  ctx.lineWidth = Math.max(1, cell * 0.035);
  for (let i = 0; i < 3; i++) {
    const y = p.y - cell * 0.14 + i * cell * 0.14 + Math.sin(time * 2 + i) * cell * 0.02;
    ctx.beginPath();
    ctx.moveTo(p.x - cell * 0.30, y);
    ctx.quadraticCurveTo(p.x, y + cell * 0.05, p.x + cell * 0.30, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = '#0f172a';
  ctx.font = `800 ${Math.round(cell * 0.13)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RIVER', p.x, p.y - cell * 0.345);
}

/* ==========================================================================
   Build hints
   ========================================================================== */
export function drawBuildHints(ctx, g, world, selectedType, hoverCell) {
  if (!selectedType) return;
  const spec = UNITS[selectedType];
  const cell = g.cell;

  /* A soft tint and a small centre dot. A dense grid of outlined squares reads
     as a spreadsheet and swamps the site, so this stays deliberately quiet. */
  for (let c = 0; c < g.cols; c++) {
    for (let r = 0; r < g.rows; r++) {
      if (!world.canBuild(c, r)) continue;
      const x = g.x0 + c * cell;
      const y = g.y0 + r * cell;
      ctx.fillStyle = 'rgba(27,98,201,.16)';
      roundRect(ctx, x + 3, y + 3, cell - 6, cell - 6, cell * 0.18);
      ctx.fill();
      ctx.fillStyle = 'rgba(122,184,255,.40)';
      ctx.beginPath();
      ctx.arc(x + cell / 2, y + cell / 2, Math.max(1.5, cell * 0.05), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (hoverCell && world.canBuild(hoverCell.c, hoverCell.r)) {
    const p = cellCenter(g, hoverCell.c, hoverCell.r);
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, spec.range * cell, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function drawRange(ctx, g, world, tower) {
  const p = cellCenter(g, tower.c, tower.r);
  const r = (tower.stats?.range ?? UNITS[tower.type].range) * g.cell;
  ctx.fillStyle = 'rgba(122,184,255,.10)';
  ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.4)';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
}

/* ==========================================================================
   Treatment units
   ========================================================================== */
export function drawTower(ctx, g, tower, time, selected) {
  const spec = UNITS[tower.type];
  const p = cellCenter(g, tower.c, tower.r);
  const s = g.cell * 0.88;
  const fire = clamp(tower.pulse / 0.22, 0, 1);

  ctx.save();
  ctx.translate(p.x, p.y);
  drawPad(ctx, s, selected);
  drawMachine(ctx, spec.machine, s, { a: tower.a || 0, b: tower.b || 0 }, time, fire);
  drawTierPips(ctx, s, tower);
  ctx.restore();
}

/** Two rows of pips, one per upgrade path, so a build reads at a glance. */
function drawTierPips(ctx, s, tower) {
  const rows = [
    { n: tower.a || 0, y: s * 0.40, col: '#7ab8ff' },
    { n: tower.b || 0, y: s * 0.47, col: '#c9a55f' }
  ];
  for (const row of rows) {
    for (let i = 0; i < 3; i++) {
      const x = -s * 0.20 + i * s * 0.10;
      ctx.fillStyle = i < row.n ? row.col : 'rgba(255,255,255,.16)';
      ctx.beginPath();
      ctx.arc(x, row.y, Math.max(1.1, s * 0.026), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* ==========================================================================
   Contaminants
   ========================================================================== */
export function drawEnemy(ctx, g, e, time) {
  const p = pathPoint(g, e.t);
  const R = e.spec.r * g.cell;
  const hit = e.flash > 0;

  ctx.save();
  ctx.translate(p.x, p.y);

  /* soft shadow in the water */
  ctx.fillStyle = 'rgba(3,17,45,.4)';
  ctx.beginPath();
  ctx.ellipse(0, R * 0.5, R * 0.9, R * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  const body = hit ? '#ffffff' : e.spec.col;
  const dark = hit ? '#cbd5e1' : e.spec.col2;

  switch (e.kind) {
    case 'debris':  drawDebris(ctx, R, body, dark, time, e.wobble); break;
    case 'tss':     drawTss(ctx, R, body, dark, e.wobble); break;
    case 'bod':     drawBod(ctx, R, body, dark, time, e.wobble); break;
    case 'path':    drawPathogen(ctx, R, body, dark, time, e.wobble); break;
    case 'nutr':    drawNutrient(ctx, R, body, dark, time); break;
    case 'metal':   drawMetal(ctx, R, body, dark, time); break;
    case 'cso':     drawCso(ctx, R, body, dark, time); break;
    default:        ctx.fillStyle = body; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
  }

  /* status marks */
  if (e.slowUntil > performance.now()) {
    ctx.strokeStyle = 'rgba(56,189,248,.95)';
    ctx.lineWidth = Math.max(1.5, R * 0.14);
    ctx.beginPath(); ctx.arc(0, 0, R + R * 0.24, 0, Math.PI * 2); ctx.stroke();
  }
  if (e.dotUntil > performance.now()) {
    ctx.fillStyle = 'rgba(74,222,128,.9)';
    ctx.beginPath(); ctx.arc(R * 0.75, -R * 0.75, R * 0.28, 0, Math.PI * 2); ctx.fill();
  }

  /* health */
  const frac = clamp(e.hp / e.max, 0, 1);
  if (frac < 0.999) {
    const rr = R + R * (e.spec.boss ? 0.45 : 0.34);
    ctx.lineWidth = Math.max(2, R * 0.18);
    ctx.strokeStyle = 'rgba(0,0,0,.5)';
    ctx.beginPath(); ctx.arc(0, 0, rr, -Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.strokeStyle = frac > 0.5 ? '#34d399' : frac > 0.22 ? '#fbbf24' : '#f87171';
    ctx.beginPath(); ctx.arc(0, 0, rr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.stroke();
  }

  ctx.restore();
}

function drawDebris(ctx, R, body, dark, time, seed) {
  ctx.rotate(Math.sin(time * 0.8 + seed) * 0.35);
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1.5, R * 0.16);
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const a = seed + i * 1.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2);
    ctx.lineTo(Math.cos(a) * R * 1.25, Math.sin(a) * R * 1.25);
    ctx.stroke();
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const k = 1 - 0.28 * hashRand(seed * 10 + i);
    const x = Math.cos(a) * R * k, y = Math.sin(a) * R * k;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, R * 0.1);
  ctx.stroke();
}

function drawTss(ctx, R, body, dark, seed) {
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, R * 0.1);
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = dark;
  for (let i = 0; i < 8; i++) {
    const a = seed + i * 2.4;
    const d = R * (0.2 + hashRand(seed + i) * 0.6);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * d, Math.sin(a) * d, R * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBod(ctx, R, body, dark, time, seed) {
  ctx.beginPath();
  const points = 12;
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const k = 1 + 0.16 * Math.sin(time * 3 + seed + i * 1.7);
    const x = Math.cos(a) * R * k, y = Math.sin(a) * R * k;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R * 1.15);
  grad.addColorStop(0, '#bef264');
  grad.addColorStop(1, body);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, R * 0.1);
  ctx.stroke();
}

function drawPathogen(ctx, R, body, dark, time, seed) {
  ctx.rotate(time * 1.6 + seed);
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1.2, R * 0.16);
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * R * 0.7, Math.sin(a) * R * 0.7);
    ctx.lineTo(Math.cos(a) * R * 1.35, Math.sin(a) * R * 1.35);
    ctx.stroke();
  }
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.arc(0, 0, R * 0.78, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.arc(-R * 0.22, -R * 0.22, R * 0.2, 0, Math.PI * 2); ctx.fill();
}

function drawNutrient(ctx, R, body, dark, time) {
  ctx.rotate(time * 0.6);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * R, y = Math.sin(a) * R;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, -R, 0, R);
  grad.addColorStop(0, '#a5f3fc');
  grad.addColorStop(1, body);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, R * 0.12);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,.6)';
  ctx.lineWidth = Math.max(1, R * 0.09);
  ctx.beginPath(); ctx.arc(0, 0, R * 0.42, 0, Math.PI * 2); ctx.stroke();
}

function drawMetal(ctx, R, body, dark, time) {
  ctx.rotate(Math.sin(time * 0.7) * 0.2);
  ctx.beginPath();
  ctx.moveTo(0, -R * 1.15);
  ctx.lineTo(R * 0.85, 0);
  ctx.lineTo(0, R * 1.15);
  ctx.lineTo(-R * 0.85, 0);
  ctx.closePath();
  const grad = ctx.createLinearGradient(-R, -R, R, R);
  grad.addColorStop(0, '#e9d5ff');
  grad.addColorStop(0.45, body);
  grad.addColorStop(1, dark);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#4c1d95';
  ctx.lineWidth = Math.max(1, R * 0.12);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,.45)';
  ctx.lineWidth = Math.max(1, R * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, -R * 1.15); ctx.lineTo(0, R * 1.15);
  ctx.moveTo(-R * 0.85, 0); ctx.lineTo(R * 0.85, 0);
  ctx.stroke();
}

function drawCso(ctx, R, body, dark, time) {
  /* menacing glow */
  const halo = ctx.createRadialGradient(0, 0, R * 0.4, 0, 0, R * 2);
  halo.addColorStop(0, 'rgba(220,38,38,.35)');
  halo.addColorStop(1, 'rgba(220,38,38,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(0, 0, R * 2, 0, Math.PI * 2); ctx.fill();

  for (let k = 0; k < 2; k++) {
    ctx.beginPath();
    const points = 14;
    const phase = time * (1.4 + k * 0.6) + k * 2;
    for (let i = 0; i < points; i++) {
      const a = (i / points) * Math.PI * 2;
      const wob = 1 + 0.14 * Math.sin(phase + i * 1.3);
      const rr = R * (k ? 0.72 : 1) * wob;
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = k ? dark : body;
    ctx.fill();
  }

  ctx.fillStyle = '#fff';
  ctx.font = `800 ${Math.round(R * 0.62)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CSO', 0, 0);
}

/* ==========================================================================
   Effects
   ========================================================================== */
export function drawEffects(ctx, g, effects) {
  const cell = g.cell;

  for (const f of effects) {
    const k = 1 - f.t / f.life;

    if (f.kind === 'beam') {
      ctx.globalAlpha = k;
      ctx.strokeStyle = f.col;
      ctx.lineWidth = Math.max(2, cell * 0.10);
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x2, f.y2); ctx.stroke();
      ctx.globalAlpha = k * 0.4;
      ctx.lineWidth = Math.max(4, cell * 0.2);
      ctx.stroke();
      ctx.globalAlpha = 1;

    } else if (f.kind === 'bubble') {
      ctx.globalAlpha = k;
      ctx.fillStyle = f.col;
      for (let i = 0; i < 4; i++) {
        const t = (1 - k) + i * 0.12;
        const x = f.x + (f.x2 - f.x) * Math.min(1, t);
        const y = f.y + (f.y2 - f.y) * Math.min(1, t) - Math.sin(t * Math.PI) * cell * 0.14;
        ctx.beginPath();
        ctx.arc(x, y, cell * 0.05 * (1 - i * 0.14), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

    } else if (f.kind === 'ring') {
      ctx.globalAlpha = k;
      ctx.strokeStyle = f.col;
      ctx.lineWidth = Math.max(2, cell * 0.07);
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * (1.12 - k * 0.35), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

    } else if (f.kind === 'pop') {
      ctx.globalAlpha = k;
      ctx.fillStyle = f.col;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const d = cell * 0.42 * (1 - k);
        ctx.beginPath();
        ctx.arc(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, cell * 0.07 * k, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

    } else if (f.kind === 'leak') {
      ctx.globalAlpha = k;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = Math.max(3, cell * 0.09);
      ctx.beginPath();
      ctx.arc(f.x, f.y, cell * (0.4 + (1 - k) * 0.9), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

/** Red edge flash when the river takes a hit. */
export function drawDamageVignette(ctx, stage, strength) {
  if (strength <= 0) return;
  const grad = ctx.createRadialGradient(
    stage.W / 2, stage.H / 2, Math.min(stage.W, stage.H) * 0.3,
    stage.W / 2, stage.H / 2, Math.max(stage.W, stage.H) * 0.75
  );
  grad.addColorStop(0, 'rgba(239,68,68,0)');
  grad.addColorStop(1, `rgba(239,68,68,${(strength * 0.5).toFixed(2)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, stage.W, stage.H);
}
