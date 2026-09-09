/**
 * Excavator Run — the machine itself.
 * Turns from yellow to orange as the answer streak heats up.
 */

import { roundRect } from '../../core/util.js';

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{left:number, bottom:number, unit:number, band:number, height:number}} pos
 * @param {{heat:number, spin:number, flashing:boolean}} look
 */
export function drawExcavator(ctx, pos, look) {
  const { left, bottom, unit: u, band, height } = pos;
  const { heat = 0, spin = 0, flashing = false } = look;

  ctx.globalAlpha = flashing ? 0.45 : 1;
  const body = heat > 0.6 ? '#fb923c' : '#fbbf24';
  const edge = heat > 0.6 ? '#c2410c' : '#d99a00';

  const trackW = u * 2.5, trackH = u * 0.5, ty = bottom - trackH;

  /* shadow shrinks as the machine leaves the ground */
  const shadow = Math.max(0.4, 1 - height / (band * 0.4));
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath();
  ctx.ellipse(left + trackW * 0.5, bottom + u * 0.06, trackW * 0.5 * shadow, u * 0.16 * shadow, 0, 0, Math.PI * 2);
  ctx.fill();

  /* tracks */
  ctx.fillStyle = '#111827';
  roundRect(ctx, left, ty, trackW, trackH, trackH * 0.5);
  ctx.fill();
  ctx.fillStyle = '#475569';
  for (let i = 0; i < 3; i++) {
    const wx = left + u * 0.55 + i * u * 0.7;
    const wy = ty + trackH * 0.5;
    ctx.beginPath(); ctx.arc(wx, wy, u * 0.17, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = Math.max(1.5, u * 0.045);
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + Math.cos(spin) * u * 0.14, wy + Math.sin(spin) * u * 0.14);
    ctx.stroke();
  }

  /* house and cab */
  const bodyW = u * 1.9, bodyH = u * 0.62;
  const bx = left + u * 0.32, by = ty - bodyH;
  ctx.fillStyle = body;
  ctx.strokeStyle = edge;
  ctx.lineWidth = Math.max(1, u * 0.035);
  roundRect(ctx, bx, by, bodyW, bodyH, u * 0.12); ctx.fill(); ctx.stroke();

  const cabW = u * 0.92, cabH = u * 0.72;
  const cabX = bx + u * 0.12, cabY = by - cabH;
  roundRect(ctx, cabX, cabY, cabW, cabH, u * 0.1); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#0a1424';
  roundRect(ctx, cabX + cabW * 0.18, cabY + cabH * 0.16, cabW * 0.66, cabH * 0.5, u * 0.06);
  ctx.fill();

  /* boom, stick and bucket */
  const pivX = bx + bodyW - u * 0.18, pivY = by + bodyH * 0.3;
  const elbX = pivX + u * 1.0, elbY = pivY - u * 0.62;
  const buX = elbX + u * 0.22, buY = elbY + u * 0.78;

  ctx.strokeStyle = body;
  ctx.lineCap = 'round';
  ctx.lineWidth = u * 0.2;
  ctx.beginPath(); ctx.moveTo(pivX, pivY); ctx.lineTo(elbX, elbY); ctx.stroke();
  ctx.lineWidth = u * 0.16;
  ctx.beginPath(); ctx.moveTo(elbX, elbY); ctx.lineTo(buX, buY); ctx.stroke();

  ctx.fillStyle = body;
  ctx.strokeStyle = edge;
  ctx.lineWidth = Math.max(1, u * 0.035);
  ctx.beginPath();
  ctx.moveTo(buX - u * 0.05, buY - u * 0.08);
  ctx.lineTo(buX + u * 0.32, buY + u * 0.02);
  ctx.lineTo(buX + u * 0.26, buY + u * 0.34);
  ctx.lineTo(buX - u * 0.06, buY + u * 0.30);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  ctx.globalAlpha = 1;
}
