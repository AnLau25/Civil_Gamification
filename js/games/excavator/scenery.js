/**
 * Excavator Run — parallax scenery.
 *
 * Two skylines and a star field. The far skyline exists mostly so the upper
 * half of a tall phone screen does not read as empty dead space.
 */

import { rand } from '../../core/util.js';

export class Scenery {
  constructor() {
    this.near = [];
    this.far = [];
    this.stars = [];
    this.clouds = [];
    this.scroll = 0;
  }

  /** Rebuild for the current canvas size. */
  rebuild(view) {
    const { W, H, band, groundY } = view;

    this.near = [];
    for (let x = 0; x < W * 2;) {
      const w = rand(band * 0.09, band * 0.22);
      this.near.push({ x, w, h: rand(band * 0.12, band * 0.34), lit: Math.random() < 0.6 });
      x += w + rand(band * 0.02, band * 0.07);
    }

    this.far = [];
    for (let x = 0; x < W * 2;) {
      const w = rand(band * 0.12, band * 0.30);
      this.far.push({ x, w, h: rand(band * 0.26, band * 0.62) });
      x += w + rand(band * 0.01, band * 0.05);
    }

    this.stars = [];
    const count = Math.round((W * H) / 26000);
    for (let i = 0; i < count; i++) {
      this.stars.push({ x: Math.random(), y: Math.random() * 0.6, r: rand(0.6, 1.8), a: rand(0.15, 0.6) });
    }

    this.clouds = [];
    for (let i = 0; i < 3; i++) {
      this.clouds.push({
        x: rand(0, W),
        y: groundY - rand(band * 0.5, band * 0.85),
        s: rand(0.7, 1.3)
      });
    }
  }

  update(dt, speed, view) {
    const { W, band, groundY } = view;
    this.scroll += speed * dt;

    for (const b of this.near) b.x -= speed * 0.18 * dt;
    recycle(this.near, () => ({
      w: rand(band * 0.09, band * 0.22),
      h: rand(band * 0.12, band * 0.34),
      lit: Math.random() < 0.6
    }), band * 0.02, band * 0.07);

    for (const b of this.far) b.x -= speed * 0.07 * dt;
    recycle(this.far, () => ({
      w: rand(band * 0.12, band * 0.30),
      h: rand(band * 0.26, band * 0.62)
    }), band * 0.01, band * 0.05);

    for (const c of this.clouds) {
      c.x -= speed * 0.08 * dt;
      if (c.x < -W * 0.3) {
        c.x = W + rand(0, W * 0.4);
        c.y = groundY - rand(band * 0.5, band * 0.85);
      }
    }
  }

  draw(ctx, view, heat) {
    const { W, H, band, groundY } = view;

    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    if (heat > 0.5) { sky.addColorStop(0, '#3b1d52'); sky.addColorStop(1, '#c2410c'); }
    else            { sky.addColorStop(0, '#0b1220'); sky.addColorStop(1, '#2b3f6b'); }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, groundY);

    if (heat <= 0.5) {
      for (const s of this.stars) {
        ctx.fillStyle = `rgba(226,232,240,${s.a.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * groundY, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = 'rgba(251,191,36,.85)';
    ctx.beginPath();
    ctx.arc(W * 0.82, groundY - band * 0.72, band * 0.055, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,.11)';
    for (const c of this.clouds) drawCloud(ctx, c.x, c.y, c.s * band * 0.05);

    ctx.fillStyle = heat > 0.5 ? 'rgba(88,28,60,.85)' : 'rgba(17,29,52,.9)';
    for (const b of this.far) ctx.fillRect(b.x, groundY - b.h, b.w, b.h);

    ctx.fillStyle = '#0a1424';
    for (const b of this.near) ctx.fillRect(b.x, groundY - b.h, b.w, b.h);

    ctx.fillStyle = 'rgba(251,191,36,.55)';
    const wc = Math.max(3, band * 0.022);
    const wg = Math.max(9, band * 0.045);
    for (const b of this.near) {
      if (!b.lit) continue;
      const cols = Math.max(1, Math.floor(b.w / wg));
      const rows = Math.max(1, Math.floor(b.h / (wg * 1.4)));
      for (let ix = 0; ix < cols; ix++) {
        for (let iy = 0; iy < rows; iy++) {
          if ((ix + iy) % 2) continue;
          ctx.fillRect(b.x + wg * 0.35 + ix * wg, groundY - b.h + wg * 0.5 + iy * wg * 1.4, wc * 0.8, wc);
        }
      }
    }

    /* road */
    ctx.fillStyle = '#2b3547';
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = '#3d4a61';
    ctx.fillRect(0, groundY, W, Math.max(2, band * 0.008));

    ctx.fillStyle = 'rgba(251,191,36,.85)';
    const dashY = groundY + (H - groundY) * 0.45;
    const gap = Math.max(46, W * 0.09);
    const dw = gap * 0.42;
    const dh = Math.max(3, band * 0.012);
    for (let x = -(this.scroll % gap); x < W; x += gap) ctx.fillRect(x, dashY, dw, dh);

    /* speed lines once the streak is hot */
    if (heat > 0.25) {
      ctx.strokeStyle = `rgba(255,255,255,${(0.22 * heat).toFixed(2)})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const y = groundY - band * (0.10 + i * 0.09);
        const x = W - ((this.scroll * 1.6 + i * 173) % (W * 1.4));
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + W * 0.11, y);
        ctx.stroke();
      }
    }
  }
}

function recycle(list, refresh, gapLo, gapHi) {
  let maxRight = 0;
  for (const b of list) maxRight = Math.max(maxRight, b.x + b.w);
  for (const b of list) {
    if (b.x + b.w >= -4) continue;
    Object.assign(b, refresh(), { x: maxRight + rand(gapLo, gapHi) });
    maxRight = b.x + b.w;
  }
}

function drawCloud(ctx, x, y, s) {
  ctx.beginPath();
  ctx.ellipse(x, y, 30 * s, 13 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 26 * s, y + 4 * s, 22 * s, 10 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 24 * s, y + 5 * s, 20 * s, 9 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}
