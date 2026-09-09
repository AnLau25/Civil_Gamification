/**
 * Watershed Defense — treatment plant machinery.
 *
 * Every unit is drawn in a light three quarter view with real thickness, so it
 * reads as a piece of plant rather than a coloured token. The artwork changes
 * with the upgrade tiers, which is how a player sees at a glance what a
 * neighbour has actually built.
 *
 * All machines draw centred on the origin inside a box of `s` by `s`.
 * Callers translate and scale, this module never touches world state.
 */

import { roundRect, clamp } from '../../core/util.js';

/* ==========================================================================
   Primitives
   ========================================================================== */

/** A slab with visible thickness: front face first, then the lit top face. */
function box(ctx, x, y, w, h, depth, top, side, r = 3) {
  ctx.fillStyle = side;
  roundRect(ctx, x, y + h - r, w, depth + r, r);
  ctx.fill();
  ctx.fillStyle = top;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
}

/** An elliptical cylinder seen slightly from above. */
function tank(ctx, cx, cy, rx, ry, depth, top, side) {
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.ellipse(cx, cy + depth, rx, ry, 0, 0, Math.PI);
  ctx.rect(cx - rx, cy, rx * 2, depth);
  ctx.fill();
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function pipe(ctx, x1, y1, x2, y2, w, col) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** Yellow and black hazard stripe, the universal "this is plant" signal. */
function hazardStrip(ctx, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y, w, h, h * 0.35);
  ctx.clip();
  ctx.fillStyle = '#e0b93c';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#22252b';
  const step = h * 1.3;
  for (let sx = -h; sx < w + h; sx += step * 2) {
    ctx.beginPath();
    ctx.moveTo(x + sx, y + h);
    ctx.lineTo(x + sx + step, y + h);
    ctx.lineTo(x + sx + step + h, y);
    ctx.lineTo(x + sx + h, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function waterFill(ctx, x, y, w, h, r, time, tint = ['#3f9ce0', '#12518f']) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, tint[0]);
  g.addColorStop(1, tint[1]);
  ctx.fillStyle = g;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();

  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.strokeStyle = 'rgba(226,244,255,.35)';
  ctx.lineWidth = Math.max(1, h * 0.05);
  for (let i = 0; i < 2; i++) {
    const yy = y + h * (0.35 + i * 0.3) + Math.sin(time * 2 + i * 2) * h * 0.05;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.quadraticCurveTo(x + w / 2, yy + h * 0.08, x + w, yy);
    ctx.stroke();
  }
  ctx.restore();
}

/* Small helper so each machine does not re-derive its own interpolation. */
const lerp = (a, b, t) => a + (b - a) * t;

/* ==========================================================================
   Bar screen — steel gantry over a channel, with a travelling rake
   ========================================================================== */
function drawScreen(ctx, s, { a, b }, time, fire) {
  const w = s * 0.74, h = s * 0.50;
  const x = -w / 2, y = -h / 2 - s * 0.02;

  /* concrete channel */
  box(ctx, x - s * 0.05, y - s * 0.03, w + s * 0.10, h + s * 0.06, s * 0.06, '#7b8899', '#48545f', s * 0.05);
  waterFill(ctx, x, y, w, h, s * 0.04, time);

  /* bars, more of them as the openings get finer */
  const bars = 5 + a * 3;
  ctx.strokeStyle = a >= 2 ? '#f1f5f9' : '#d6dee8';
  ctx.lineWidth = Math.max(0.9, s * (a >= 2 ? 0.018 : 0.028));
  for (let i = 0; i < bars; i++) {
    const bx = x + (w / bars) * (i + 0.5);
    ctx.beginPath();
    ctx.moveTo(bx, y + s * 0.02);
    ctx.lineTo(bx, y + h - s * 0.02);
    ctx.stroke();
  }

  /* tier a3 swaps the rack for a rotating drum */
  if (a >= 3) {
    ctx.save();
    ctx.translate(0, y + h * 0.5);
    ctx.rotate(time * 1.6);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = Math.max(1.2, s * 0.03);
    ctx.beginPath();
    ctx.arc(0, 0, h * 0.36, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * h * 0.14, Math.sin(ang) * h * 0.14);
      ctx.lineTo(Math.cos(ang) * h * 0.36, Math.sin(ang) * h * 0.36);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* gantry legs and beam */
  const gy = y - s * 0.16;
  ctx.strokeStyle = '#94a3b4';
  ctx.lineWidth = Math.max(1.4, s * 0.035);
  ctx.beginPath();
  ctx.moveTo(x + s * 0.03, y + h * 0.2); ctx.lineTo(x + s * 0.03, gy);
  ctx.moveTo(x + w - s * 0.03, y + h * 0.2); ctx.lineTo(x + w - s * 0.03, gy);
  ctx.stroke();
  box(ctx, x - s * 0.01, gy - s * 0.035, w + s * 0.02, s * 0.045, s * 0.02, '#b6c2cf', '#65727f', s * 0.02);

  /* travelling rake carriage */
  const travel = (Math.sin(time * (2.0 + b * 0.7)) + 1) / 2;
  const ry = lerp(y + s * 0.04, y + h - s * 0.06, travel);
  ctx.fillStyle = fire > 0 ? '#ffd97a' : '#aab6c4';
  roundRect(ctx, x - s * 0.02, ry - s * 0.022, w + s * 0.04, s * 0.044, s * 0.02);
  ctx.fill();
  if (b >= 2) {
    pipe(ctx, 0, gy, 0, ry, Math.max(1, s * 0.016), '#6f7d8b');
  }

  /* drive house grows with the raking path */
  const dh = s * (0.10 + b * 0.02);
  box(ctx, -s * 0.11, gy - s * 0.035 - dh, s * 0.22, dh, s * 0.025, '#cfd8e2', '#7a8794', s * 0.02);
  if (b >= 3) hazardStrip(ctx, -s * 0.11, gy - s * 0.045 - dh, s * 0.22, s * 0.026);
}

/* ==========================================================================
   Grit chamber — circular basin, vortex, then aeration
   ========================================================================== */
function drawGrit(ctx, s, { a, b }, time) {
  const r = s * (0.32 + b * 0.028);

  /* inlet and outlet channel stubs, so the basin reads as part of a train */
  box(ctx, -s * 0.48, -s * 0.05, s * 0.16, s * 0.10, s * 0.03, '#7b8899', '#46525d', s * 0.02);
  box(ctx, s * 0.32, -s * 0.05, s * 0.16, s * 0.10, s * 0.03, '#7b8899', '#46525d', s * 0.02);

  /* second train appears at path b tier 2 */
  if (b >= 2) {
    tank(ctx, -r * 0.92, r * 0.52, r * 0.40, r * 0.22, s * 0.04, '#2f81b8', '#1c4f72');
  }

  tank(ctx, 0, 0, r + s * 0.05, (r + s * 0.05) * 0.62, s * 0.065, '#7b8899', '#46525d');

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createRadialGradient(0, -r * 0.2, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#9fe0ff');
  g.addColorStop(1, '#0d5988');
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  /* swirl, faster and tighter as detention improves */
  ctx.strokeStyle = 'rgba(226,244,255,.6)';
  ctx.lineWidth = Math.max(1.1, s * 0.026);
  const speed = 0.9 + a * 0.6;
  for (let i = 0; i < 3; i++) {
    const rr = r * (0.3 + i * 0.23);
    const a0 = time * speed + i * 2.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, rr, rr * 0.62, 0, a0, a0 + Math.PI * 1.15);
    ctx.stroke();
  }

  /* aerated grit chamber blows a curtain of bubbles up one side */
  if (a >= 3) {
    for (let i = 0; i < 8; i++) {
      const ph = (time * 1.1 + i * 0.27) % 1;
      ctx.fillStyle = `rgba(230,250,255,${(0.75 - ph * 0.6).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(-r * 0.6 + i * r * 0.055, r * 0.5 - ph * r * 1.05, s * 0.017, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  /* vortex cone */
  if (a >= 2) {
    ctx.fillStyle = '#dbe3ec';
    ctx.beginPath();
    ctx.moveTo(-r * 0.18, -r * 0.02); ctx.lineTo(r * 0.18, -r * 0.02); ctx.lineTo(0, r * 0.36);
    ctx.closePath(); ctx.fill();
  }

  /* walkway across the basin with handrails */
  ctx.strokeStyle = '#dfe6ee';
  ctx.lineWidth = Math.max(1.6, s * 0.045);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r - s * 0.04, -r * 0.10);
  ctx.lineTo(r + s * 0.04, -r * 0.10);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(190,205,220,.75)';
  ctx.lineWidth = Math.max(1, s * 0.016);
  ctx.beginPath();
  ctx.moveTo(-r, -r * 0.10 - s * 0.05);
  ctx.lineTo(r, -r * 0.10 - s * 0.05);
  ctx.stroke();
  for (let i = -2; i <= 2; i++) {
    const px = (i / 2) * r * 0.8;
    ctx.beginPath();
    ctx.moveTo(px, -r * 0.10);
    ctx.lineTo(px, -r * 0.10 - s * 0.05);
    ctx.stroke();
  }

  /* drive motor on the deck */
  box(ctx, -s * 0.06, -r * 0.62 - s * 0.09, s * 0.12, s * 0.075, s * 0.025, '#dbe3ec', '#78848f', s * 0.02);

  /* grit classifier: an inclined screw conveyor off the side */
  if (b >= 3) {
    ctx.save();
    ctx.translate(r * 0.74, r * 0.14);
    ctx.rotate(-0.55);
    box(ctx, 0, -s * 0.030, s * 0.30, s * 0.060, s * 0.022, '#b6c2cf', '#67737f', s * 0.026);
    ctx.strokeStyle = 'rgba(40,50,60,.5)';
    ctx.lineWidth = Math.max(1, s * 0.012);
    for (let i = 1; i < 6; i++) {
      const px = (s * 0.30 / 6) * i;
      ctx.beginPath(); ctx.moveTo(px, -s * 0.03); ctx.lineTo(px - s * 0.02, s * 0.03); ctx.stroke();
    }
    ctx.restore();
  }
}

/* ==========================================================================
   Sedimentation basin — clarifier with a travelling bridge
   ========================================================================== */
function drawClarifier(ctx, s, { a, b }, time) {
  const r = s * (0.30 + b * 0.03);

  /* launder wall */
  tank(ctx, 0, 0, r + s * 0.05, (r + s * 0.05) * 0.60, s * 0.06, '#7b8899', '#46525d');
  tank(ctx, 0, 0, r + s * 0.018, (r + s * 0.018) * 0.60, s * 0.02, '#5b6875', '#3a444e');

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.60, 0, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, r);
  g.addColorStop(0, '#b9f2f8');
  g.addColorStop(0.55, '#31c9d8');
  g.addColorStop(1, '#0d6875');
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  /* lamella plates */
  if (a >= 1) {
    ctx.strokeStyle = 'rgba(255,255,255,.45)';
    ctx.lineWidth = Math.max(1, s * 0.016);
    for (let i = -3; i <= 3; i++) {
      const px = (i / 3) * r * 0.72;
      ctx.beginPath();
      ctx.moveTo(px - r * 0.10, -r * 0.34);
      ctx.lineTo(px + r * 0.10, r * 0.34);
      ctx.stroke();
    }
  }

  /* sludge blanket shading for the solids contact clarifier */
  if (b >= 3) {
    ctx.fillStyle = 'rgba(120,86,40,.35)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.22, r * 0.9, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* dissolved air flotation: a bubble curtain and a surface scum layer */
  if (a >= 3) {
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.30, r * 0.82, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 9; i++) {
      const ph = (time * 1.3 + i * 0.23) % 1;
      ctx.fillStyle = `rgba(255,255,255,${(0.55 - ph * 0.5).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(-r * 0.7 + i * r * 0.18, r * 0.4 - ph * r * 0.8, s * 0.014, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  /* rotating bridge with a truss */
  ctx.save();
  ctx.rotate(time * 0.8);
  ctx.strokeStyle = '#e6ecf3';
  ctx.lineWidth = Math.max(1.5, s * 0.042);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.95, 0);
  ctx.lineTo(r * 0.95, 0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,214,228,.8)';
  ctx.lineWidth = Math.max(1, s * 0.016);
  for (let i = -4; i <= 4; i++) {
    if (!i) continue;
    const px = (i / 4) * r * 0.88;
    ctx.beginPath();
    ctx.moveTo(px, -s * 0.03);
    ctx.lineTo(px + s * 0.03, s * 0.05);
    ctx.stroke();
  }
  /* drive carriage on the rim */
  box(ctx, r * 0.74, -s * 0.035, s * 0.13, s * 0.058, s * 0.02, '#dbe3ec', '#7d8996', s * 0.02);
  ctx.restore();

  /* centre column and walkway rail */
  ctx.fillStyle = '#aab6c4';
  ctx.beginPath(); ctx.arc(0, 0, s * 0.055, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e6ecf3';
  ctx.beginPath(); ctx.arc(0, -s * 0.025, s * 0.036, 0, Math.PI * 2); ctx.fill();

  /* ballast tank bolted alongside */
  if (a >= 2) {
    tank(ctx, -r * 0.98, -r * 0.42, s * 0.055, s * 0.034, s * 0.05, '#e2e8f0', '#8b97a4');
  }
}

/* ==========================================================================
   Coagulation feed — silo, chemical tanker and rapid mix
   ========================================================================== */
function drawDosing(ctx, s, { a, b }, time, fire) {
  const mixW = s * 0.38, mixH = s * 0.34;
  const mx = -s * 0.10, my = -mixH / 2 - s * 0.08;

  /* rapid mix basin */
  box(ctx, mx - s * 0.03, my - s * 0.03, mixW + s * 0.06, mixH + s * 0.06, s * 0.05, '#7b8899', '#46525d', s * 0.04);
  waterFill(ctx, mx, my, mixW, mixH, s * 0.03, time, ['#f0c463', '#96590f']);

  /* paddle mixer */
  ctx.save();
  ctx.translate(mx + mixW / 2, my + mixH / 2);
  const spin = time * (3.6 + b * 1.2);
  for (let k = 0; k < 2; k++) {
    const ang = spin + (k * Math.PI) / 2;
    ctx.save();
    ctx.scale(Math.max(0.14, Math.abs(Math.cos(ang))), 1);
    ctx.fillStyle = k ? 'rgba(90,58,10,.75)' : '#6b3f08';
    roundRect(ctx, -mixW * 0.32, -mixH * 0.10, mixW * 0.64, mixH * 0.11, s * 0.014);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#5b6875';
  roundRect(ctx, -s * 0.017, -mixH * 0.62, s * 0.034, mixH * 0.72, s * 0.014);
  ctx.fill();
  ctx.restore();

  /* motor over the shaft */
  box(ctx, mx + mixW / 2 - s * 0.055, my - s * 0.085, s * 0.11, s * 0.062, s * 0.02, '#dbe3ec', '#7d8996', s * 0.02);

  /* storage silo, taller with the dose upgrades */
  const siloH = s * (0.28 + a * 0.045);
  const sx = s * 0.26;
  tank(ctx, sx, -siloH * 0.5, s * 0.085, s * 0.038, siloH, a >= 3 ? '#e08b3c' : '#e9eef4', a >= 3 ? '#8a4310' : '#93a0ad');
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath();
  ctx.ellipse(sx, -siloH * 0.5 + siloH, s * 0.085, s * 0.038, 0, 0, Math.PI);
  ctx.fill();
  /* dosing line into the basin */
  pipe(ctx, sx - s * 0.06, -siloH * 0.2, mx + mixW * 0.72, my + s * 0.02,
       Math.max(1.2, s * 0.022), fire > 0 ? '#ffe7b0' : '#93a0ad');

  /* polymer drum */
  if (a >= 2) {
    tank(ctx, sx - s * 0.16, siloH * 0.28, s * 0.045, s * 0.022, s * 0.075, '#f6f8fb', '#98a4b1');
  }

  /* chemical road tanker, side on so it reads as a vehicle */
  const tx = -s * 0.44, ty = s * 0.30;
  const barX = tx + s * 0.15, barW = s * 0.40, barH = s * 0.115;

  /* wheels behind the body */
  ctx.fillStyle = '#171d24';
  for (const dx of [s * 0.11, s * 0.36, s * 0.46]) {
    ctx.beginPath(); ctx.arc(tx + dx, ty + s * 0.055, s * 0.036, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#6b7683';
  for (const dx of [s * 0.11, s * 0.36, s * 0.46]) {
    ctx.beginPath(); ctx.arc(tx + dx, ty + s * 0.055, s * 0.014, 0, Math.PI * 2); ctx.fill();
  }

  /* chassis rail */
  ctx.fillStyle = '#2b333c';
  roundRect(ctx, tx + s * 0.05, ty + s * 0.035, s * 0.50, s * 0.026, s * 0.010);
  ctx.fill();

  /* barrel, a capsule with end rings */
  const barrel = ctx.createLinearGradient(0, ty - barH * 0.7, 0, ty + barH * 0.5);
  barrel.addColorStop(0, '#fbfdff');
  barrel.addColorStop(0.55, '#dde5ee');
  barrel.addColorStop(1, '#93a0ae');
  ctx.fillStyle = barrel;
  roundRect(ctx, barX, ty - barH * 0.72, barW, barH, barH * 0.5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(105,120,136,.75)';
  ctx.lineWidth = Math.max(1, s * 0.009);
  for (let i = 1; i < 3; i++) {
    const px = barX + (barW / 3) * i;
    ctx.beginPath();
    ctx.moveTo(px, ty - barH * 0.72 + s * 0.008);
    ctx.lineTo(px, ty - barH * 0.72 + barH - s * 0.008);
    ctx.stroke();
  }
  hazardStrip(ctx, barX + barW * 0.16, ty - barH * 0.30, barW * 0.62, s * 0.026);

  /* filler hatch on top */
  ctx.fillStyle = '#aab5c1';
  roundRect(ctx, barX + barW * 0.34, ty - barH * 0.86, barW * 0.16, s * 0.020, s * 0.008);
  ctx.fill();

  /* cab */
  box(ctx, tx, ty - s * 0.075, s * 0.135, s * 0.115, s * 0.028, '#e9eef4', '#8b97a5', s * 0.024);
  ctx.fillStyle = '#22405f';
  roundRect(ctx, tx + s * 0.018, ty - s * 0.058, s * 0.075, s * 0.048, s * 0.012);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(tx + s * 0.012, ty - s * 0.005, s * 0.011, 0, Math.PI * 2); ctx.fill();

  /* second dosing point */
  if (b >= 3) {
    pipe(ctx, sx - s * 0.06, -siloH * 0.02, mx + mixW * 0.2, my + mixH * 0.9,
         Math.max(1, s * 0.018), '#93a0ad');
  }
}

/* ==========================================================================
   Activated sludge — aeration basin with a blower skid
   ========================================================================== */
function drawAeration(ctx, s, { a, b }, time) {
  const w = s * (0.56 + b * 0.025), h = s * 0.44;
  const x = -w / 2 - s * 0.10, y = -h / 2;

  box(ctx, x - s * 0.03, y - s * 0.03, w + s * 0.06, h + s * 0.06, s * 0.055, '#7b8899', '#46525d', s * 0.04);

  /* anoxic zone runs unaerated at the head of the basin */
  const anoxic = a >= 3 ? w * 0.30 : 0;
  if (anoxic) waterFill(ctx, x, y, anoxic, h, s * 0.03, time, ['#3f6b4f', '#16321f']);
  waterFill(ctx, x + anoxic, y, w - anoxic, h, s * 0.03, time, ['#5bc98a', '#166534']);

  /* diffuser grid */
  ctx.fillStyle = '#5b6875';
  const grids = 2 + b;
  for (let i = 0; i < grids; i++) {
    const gx = x + anoxic + ((w - anoxic) / grids) * (i + 0.5);
    roundRect(ctx, gx - s * 0.012, y + h - s * 0.06, s * 0.024, s * 0.045, s * 0.008);
    ctx.fill();
  }

  /* bubbles */
  ctx.save();
  roundRect(ctx, x + anoxic, y, w - anoxic, h, s * 0.03);
  ctx.clip();
  const count = 8 + b * 3;
  for (let i = 0; i < count; i++) {
    const ph = (time * 1.0 + i * 0.29) % 1;
    const bx = x + anoxic + s * 0.03 + ((i * 7919) % 100) / 100 * (w - anoxic - s * 0.06);
    const by = y + h - ph * h;
    ctx.fillStyle = `rgba(226,255,238,${(0.25 + 0.5 * (1 - ph)).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(bx, by, s * (0.013 + (i % 3) * 0.005), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  /* blower skid and header pipe */
  const bx = x + w + s * 0.105;
  box(ctx, bx - s * 0.058, y + h * 0.06, s * 0.125, s * 0.15, s * 0.035, '#dbe3ec', '#7d8996', s * 0.022);
  ctx.fillStyle = '#8ea0b2';
  ctx.beginPath();
  ctx.arc(bx, y + h * 0.06 + s * 0.075, s * 0.030, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(bx, y + h * 0.06 + s * 0.075);
  ctx.rotate(time * 6);
  ctx.strokeStyle = '#49535e';
  ctx.lineWidth = Math.max(1, s * 0.012);
  ctx.beginPath(); ctx.moveTo(-s * 0.02, 0); ctx.lineTo(s * 0.02, 0); ctx.stroke();
  ctx.restore();
  pipe(ctx, bx - s * 0.058, y + h * 0.32, x + w * 0.5, y + h - s * 0.03, Math.max(1.2, s * 0.022), '#a9b6c3');

  /* membrane racks */
  if (b >= 2) {
    ctx.fillStyle = 'rgba(240,248,255,.75)';
    for (let i = 0; i < 4; i++) {
      roundRect(ctx, x + w * 0.55 + i * s * 0.032, y + h * 0.18, s * 0.018, h * 0.6, s * 0.008);
      ctx.fill();
    }
  }
}

/* ==========================================================================
   UV disinfection — containerised bank over an open channel
   ========================================================================== */
function drawUv(ctx, s, { a, b }, time, fire) {
  const w = s * 0.70, h = s * 0.34;
  const x = -w / 2, y = -h / 2 + s * 0.05;

  /* channel below */
  box(ctx, x - s * 0.02, y + h * 0.5, w + s * 0.04, h * 0.55, s * 0.045, '#5b6875', '#38424c', s * 0.03);
  waterFill(ctx, x + s * 0.01, y + h * 0.56, w + s * 0.02 - s * 0.02, h * 0.42, s * 0.02, time,
            ['#5f7fd6', '#22357a']);

  /* container, dark inside so the lamp bank reads as light */
  box(ctx, x, y - h * 0.55, w, h, s * 0.05, '#8d9bab', '#4d5866', s * 0.035);
  ctx.fillStyle = '#1d2532';
  roundRect(ctx, x + s * 0.035, y - h * 0.42, w - s * 0.07, h * 0.78, s * 0.025);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,26,36,.5)';
  ctx.lineWidth = Math.max(1, s * 0.010);
  for (let i = 1; i < 5; i++) {
    const px = x + (w / 5) * i;
    ctx.beginPath(); ctx.moveTo(px, y - h * 0.55 + s * 0.02); ctx.lineTo(px, y - h * 0.55 + s * 0.055); ctx.stroke();
  }

  /* lamp slot glowing into the channel */
  const glow = clamp(0.5 + 0.45 * Math.abs(Math.sin(time * 3)) + fire * 0.5, 0, 1);
  const rows = 2 + Math.min(2, b);
  for (let i = 0; i < rows; i++) {
    const ly = y - h * 0.34 + i * s * 0.055;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, `rgba(169,139,245,${(glow * 0.45).toFixed(2)})`);
    g.addColorStop(0.5, `rgba(237,233,254,${glow.toFixed(2)})`);
    g.addColorStop(1, `rgba(169,139,245,${(glow * 0.45).toFixed(2)})`);
    ctx.fillStyle = g;
    roundRect(ctx, x + s * 0.06, ly, w - s * 0.12, s * 0.026 + a * s * 0.006, s * 0.014);
    ctx.fill();
  }

  /* halo */
  ctx.save();
  ctx.globalAlpha = clamp(glow * (0.32 + a * 0.08), 0, 0.7);
  const halo = ctx.createRadialGradient(0, y - h * 0.1, 0, 0, y - h * 0.1, s * 0.6);
  halo.addColorStop(0, '#c4b5fd');
  halo.addColorStop(1, 'rgba(196,181,253,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(0, y - h * 0.1, s * 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  /* control cabinet and, at the top tier, a chlorine dosing pot */
  box(ctx, x + w * 0.06, y - h * 0.55 - s * 0.075, s * 0.14, s * 0.07, s * 0.02, '#eef2f7', '#8b97a4', s * 0.018);
  if (a >= 3) hazardStrip(ctx, x + w * 0.06, y - h * 0.55 - s * 0.098, s * 0.14, s * 0.024);
  if (b >= 3) {
    tank(ctx, x + w - s * 0.09, y - h * 0.55 - s * 0.02, s * 0.045, s * 0.020, s * 0.075, '#eaf7ef', '#4f8f6b');
  }
}

/* ==========================================================================
   Public
   ========================================================================== */
const MACHINES = {
  screen: drawScreen,
  grit: drawGrit,
  clarifier: drawClarifier,
  dosing: drawDosing,
  aeration: drawAeration,
  uv: drawUv
};

/**
 * @param {CanvasRenderingContext2D} ctx  already translated to the tile centre
 * @param {string} machine   key from UNITS[..].machine
 * @param {number} s         tile size the machine should fill
 * @param {{a:number,b:number}} tiers
 * @param {number} time      seconds, for animation
 * @param {number} fire      0..1, a recent shot
 */
export function drawMachine(ctx, machine, s, tiers, time, fire = 0) {
  const fn = MACHINES[machine];
  if (fn) fn(ctx, s, tiers, time, fire);
}

/** Concrete pad every machine stands on, drawn before it. */
export function drawPad(ctx, s, selected) {
  ctx.fillStyle = 'rgba(0,0,0,.42)';
  roundRect(ctx, -s / 2 + 1.5, -s / 2 + 3.5, s, s, s * 0.2);
  ctx.fill();

  const pad = ctx.createLinearGradient(0, -s / 2, 0, s / 2);
  pad.addColorStop(0, '#3c4a5c');
  pad.addColorStop(1, '#222c3a');
  ctx.fillStyle = pad;
  roundRect(ctx, -s / 2, -s / 2, s, s, s * 0.2);
  ctx.fill();

  ctx.strokeStyle = selected ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.16)';
  ctx.lineWidth = selected ? 2 : 1;
  roundRect(ctx, -s / 2, -s / 2, s, s, s * 0.2);
  ctx.stroke();
}

/**
 * A machine rendered once into an offscreen canvas, used as the icon on the
 * build palette. Cached, because the palette repaints on every budget change.
 */
const iconCache = new Map();

export function machineIcon(machine, px = 34, dpr = 2) {
  const key = `${machine}@${px}x${dpr}`;
  if (iconCache.has(key)) return iconCache.get(key);

  const c = document.createElement('canvas');
  c.width = px * dpr;
  c.height = px * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.translate(px / 2, px / 2 + px * 0.02);
  drawMachine(ctx, machine, px * 0.94, { a: 0, b: 0 }, 0.6, 0);

  const url = c.toDataURL();
  iconCache.set(key, url);
  return url;
}
