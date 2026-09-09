/**
 * Gold Miner — item spawning and item art.
 *
 * Every item carries its own `seed` so the jitter that makes a nugget look
 * hand cut is stable from frame to frame instead of boiling.
 *
 * The art is drawn rather than loaded, so there are no image files to host and
 * every piece scales with the canvas.
 */

import { ITEMS, TUNING } from './config.js';
import { rand, hashRand, roundRect } from '../../core/util.js';

let nextId = 1;

/**
 * Scatter the level mix across the dirt without overlapping.
 * @param {{cols?:number}} scene geometry from render.js
 */
export function spawn(mix, scene) {
  const items = [];
  const { unit, W, H, dirtTop, pivot, arc, minReach, maxReach } = scene;
  const margin = TUNING.spawnMargin * unit;

  /* A spot is only worth burying treasure in if the claw can swing to it. */
  const reachable = (x, y, r) => {
    const dx = x - pivot.x;
    const dy = y - pivot.y;
    const dist = Math.hypot(dx, dy);
    if (dist < minReach + r || dist > maxReach - r) return false;
    return Math.abs(Math.atan2(dx, dy)) <= arc * 0.94;
  };

  const wanted = [];
  for (const [type, count] of Object.entries(mix)) {
    for (let i = 0; i < count; i++) wanted.push(type);
  }
  /* Biggest first: a boulder that cannot find a slot is a worse failure than a
     small nugget that cannot, so give the big ones first pick. */
  wanted.sort((a, b) => ITEMS[b].r - ITEMS[a].r);

  for (const type of wanted) {
    const spec = ITEMS[type];
    const r = spec.r * unit;
    let placed = null;

    for (let attempt = 0; attempt < 240 && !placed; attempt++) {
      const x = rand(margin + r, W - margin - r);
      const y = rand(dirtTop + r + unit * 0.03, H - margin - r);
      if (!reachable(x, y, r)) continue;
      const clear = items.every(o => Math.hypot(o.x - x, o.y - y) > o.r + r + unit * 0.018);
      if (clear) placed = { x, y };
    }
    if (!placed) continue;   // dense level on a small screen, quietly drop one

    items.push({
      id: nextId++,
      type,
      ...spec,
      x: placed.x,
      y: placed.y,
      r,
      seed: nextId * 7 + 13,
      taken: false
    });
  }
  return items;
}

/* --------------------------------------------------------------------------
   Art
   -------------------------------------------------------------------------- */

/** @param {CanvasRenderingContext2D} ctx */
export function draw(ctx, item, time) {
  ctx.save();
  ctx.translate(item.x, item.y);

  /* contact shadow so items sit in the dirt rather than float on it */
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath();
  ctx.ellipse(0, item.r * 0.82, item.r * 0.92, item.r * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (item.kind) {
    case 'gold':    drawGold(ctx, item, time); break;
    case 'diamond': drawDiamond(ctx, item, time); break;
    case 'rock':    drawRock(ctx, item); break;
    case 'rebar':   drawRebar(ctx, item); break;
    case 'hardhat': drawHardhat(ctx, item); break;
    case 'bone':    drawBone(ctx, item); break;
    case 'bag':     drawBag(ctx, item, time); break;
  }
  ctx.restore();
}

/** Irregular closed polygon, stable per item. */
function nuggetPath(ctx, r, seed, points = 9, jitter = 0.26) {
  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const k = 1 - jitter * hashRand(seed + i * 3.7);
    const x = Math.cos(a) * r * k;
    const y = Math.sin(a) * r * k * 0.88;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawGold(ctx, item, time) {
  const r = item.r;
  nuggetPath(ctx, r, item.seed);

  const g = ctx.createLinearGradient(-r * 0.6, -r * 0.8, r * 0.6, r * 0.8);
  g.addColorStop(0, '#fde68a');
  g.addColorStop(0.45, '#f7b733');
  g.addColorStop(1, '#b45309');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.stroke();

  /* facets */
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#fff3c4';
  nuggetPath(ctx, r * 0.48, item.seed + 11, 7, 0.34);
  ctx.fill();
  ctx.globalAlpha = 1;

  /* specular glint that drifts, so gold reads as gold at a glance */
  const t = (time * 0.9 + item.seed) % 3;
  if (t < 0.55) {
    ctx.globalAlpha = 0.85 * Math.sin((t / 0.55) * Math.PI);
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.34, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawDiamond(ctx, item, time) {
  const r = item.r;
  const top = -r * 0.62, girdle = -r * 0.12, tip = r * 1.0;
  const hw = r * 0.92, tw = r * 0.46;

  const g = ctx.createLinearGradient(0, top, 0, tip);
  g.addColorStop(0, '#ecfeff');
  g.addColorStop(0.4, '#67e8f9');
  g.addColorStop(1, '#0e7490');

  ctx.beginPath();
  ctx.moveTo(-tw, top);
  ctx.lineTo(tw, top);
  ctx.lineTo(hw, girdle);
  ctx.lineTo(0, tip);
  ctx.lineTo(-hw, girdle);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#155e75';
  ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.stroke();

  /* facet lines */
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.beginPath();
  ctx.moveTo(-tw, top); ctx.lineTo(-hw * 0.35, girdle); ctx.lineTo(0, tip);
  ctx.moveTo(tw, top);  ctx.lineTo(hw * 0.35, girdle);  ctx.lineTo(0, tip);
  ctx.moveTo(-hw, girdle); ctx.lineTo(hw, girdle);
  ctx.stroke();

  /* sparkle */
  const s = (Math.sin(time * 3 + item.seed) + 1) / 2;
  if (s > 0.55) {
    const a = (s - 0.55) / 0.45;
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, r * 0.09);
    ctx.lineCap = 'round';
    const L = r * 0.75 * a;
    ctx.beginPath();
    ctx.moveTo(-L, top * 0.6); ctx.lineTo(L, top * 0.6);
    ctx.moveTo(0, top * 0.6 - L); ctx.lineTo(0, top * 0.6 + L);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawRock(ctx, item) {
  const r = item.r;
  nuggetPath(ctx, r, item.seed, 8, 0.22);
  const g = ctx.createLinearGradient(-r * 0.5, -r * 0.7, r * 0.5, r * 0.7);
  g.addColorStop(0, '#cbd5e1');
  g.addColorStop(0.5, '#8593a8');
  g.addColorStop(1, '#3f4a5c');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#2b3444';
  ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.stroke();

  ctx.fillStyle = 'rgba(30,41,59,.45)';
  for (let i = 0; i < 5; i++) {
    const a = hashRand(item.seed + i * 5.1) * Math.PI * 2;
    const d = hashRand(item.seed + i * 9.3) * r * 0.55;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * d, Math.sin(a) * d * 0.85, r * (0.06 + hashRand(item.seed + i) * 0.06), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRebar(ctx, item) {
  const r = item.r;
  const barW = r * 0.30, len = r * 1.7;
  ctx.rotate(-0.35);
  for (let i = -1; i <= 1; i++) {
    const x = i * barW * 1.15;
    const g = ctx.createLinearGradient(x - barW / 2, 0, x + barW / 2, 0);
    g.addColorStop(0, '#94a3b8');
    g.addColorStop(0.4, '#e2e8f0');
    g.addColorStop(1, '#64748b');
    ctx.fillStyle = g;
    roundRect(ctx, x - barW / 2, -len / 2, barW, len, barW * 0.35);
    ctx.fill();

    /* deformation ribs */
    ctx.strokeStyle = 'rgba(51,65,85,.75)';
    ctx.lineWidth = Math.max(1, r * 0.035);
    for (let y = -len / 2 + barW * 0.5; y < len / 2; y += barW * 0.72) {
      ctx.beginPath();
      ctx.moveTo(x - barW / 2, y);
      ctx.lineTo(x + barW / 2, y - barW * 0.28);
      ctx.stroke();
    }
  }
  /* tie wire */
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = Math.max(1.5, r * 0.075);
  ctx.beginPath();
  ctx.moveTo(-barW * 2, -len * 0.18);
  ctx.lineTo(barW * 2, -len * 0.18);
  ctx.moveTo(-barW * 2, len * 0.22);
  ctx.lineTo(barW * 2, len * 0.22);
  ctx.stroke();
}

function drawHardhat(ctx, item) {
  const r = item.r;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.34, r * 1.05, r * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();

  const g = ctx.createLinearGradient(0, -r * 0.7, 0, r * 0.35);
  g.addColorStop(0, '#fcd34d');
  g.addColorStop(1, '#d97706');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.32, r * 0.72, r * 0.78, 0, Math.PI, 0);
  ctx.fill();

  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.beginPath();
  ctx.moveTo(0, r * 0.3);
  ctx.lineTo(0, -r * 0.44);
  ctx.stroke();
}

function drawBone(ctx, item) {
  const r = item.r;
  ctx.rotate(-0.4);
  ctx.fillStyle = '#e7e5e4';
  ctx.strokeStyle = '#a8a29e';
  ctx.lineWidth = Math.max(1, r * 0.07);
  roundRect(ctx, -r * 0.75, -r * 0.16, r * 1.5, r * 0.32, r * 0.16);
  ctx.fill(); ctx.stroke();
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sx * r * 0.72, sy * r * 0.22, r * 0.26, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
  }
}

function drawBag(ctx, item, time) {
  const r = item.r;
  const pulse = 1 + Math.sin(time * 2.4 + item.seed) * 0.03;
  ctx.scale(pulse, pulse);

  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, '#a16207');
  g.addColorStop(1, '#5b3a0c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-r * 0.28, -r * 0.55);
  ctx.bezierCurveTo(-r * 1.05, -r * 0.05, -r * 0.85, r * 0.95, 0, r * 0.95);
  ctx.bezierCurveTo(r * 0.85, r * 0.95, r * 1.05, -r * 0.05, r * 0.28, -r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3f2a08';
  ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.stroke();

  /* tied neck */
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = Math.max(1.5, r * 0.11);
  ctx.beginPath();
  ctx.moveTo(-r * 0.34, -r * 0.5);
  ctx.lineTo(r * 0.34, -r * 0.5);
  ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.font = `800 ${Math.round(r * 0.95)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 0, r * 0.32);
}
