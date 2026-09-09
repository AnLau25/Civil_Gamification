/**
 * Gold Miner — scene geometry and all the drawing that is not an item.
 */

import { TUNING } from './config.js';
import { hashRand, roundRect, clamp } from '../../core/util.js';

/**
 * Everything positional the rest of the game needs, recomputed on resize.
 * `unit` is the smaller canvas dimension, so speeds and sizes read the same
 * on a phone in portrait as on a 16:9 desktop stage.
 */
export function makeScene(stage) {
  const { W, H } = stage;
  const unit = Math.min(W, H);

  /* The operator and his hard hat stand about 0.21 of a unit above the ground
     line. A fixed fraction of the height puts that band exactly where the HUD
     pills are on a phone, and off the top of the canvas entirely on a wide
     desktop stage, which is why the surface is pushed down to clear whatever
     the HUD actually measures rather than to a guessed number. */
  const surfaceY = Math.min(
    Math.max(H * TUNING.surfaceFrac, hudBottom(stage) + unit * TUNING.rigHeight),
    H * 0.36
  );
  const pivot = { x: W / 2, y: surfaceY + unit * 0.022 };
  const depth = H - pivot.y;

  /* The swing arc adapts to the shape of the shaft. A fixed wide arc on a tall
     phone would spend most of the sweep pointing at the side walls where
     nothing can be buried, so it is narrowed to the cone that actually reaches
     the floor of the shaft. */
  const arc = clamp(
    Math.atan((W * 0.48) / depth) * 1.25,
    TUNING.swingArcMin,
    TUNING.swingArcMax
  );

  return {
    W, H, unit,
    surfaceY,
    dirtTop: surfaceY + unit * 0.02,
    pivot,
    arc,
    minReach: unit * 0.22,
    maxReach: Math.hypot(W * 0.52, depth) + unit * 0.02
  };
}

/**
 * Where the HUD pills end, in canvas coordinates. Measured rather than assumed,
 * because the pills wrap to two rows on a narrow phone.
 */
function hudBottom(stage) {
  const hud = stage.el.parentElement?.querySelector('.hud');
  if (!hud) return 0;
  const a = hud.getBoundingClientRect();
  const b = stage.el.getBoundingClientRect();
  return Math.max(0, a.bottom - b.top);
}

/* --------------------------------------------------------------------------
   Background
   -------------------------------------------------------------------------- */
export function drawBackground(ctx, scene, time) {
  const { W, H, unit, surfaceY } = scene;

  /* sky */
  const sky = ctx.createLinearGradient(0, 0, 0, surfaceY);
  sky.addColorStop(0, '#12203c');
  sky.addColorStop(0.55, '#2d3f6b');
  sky.addColorStop(1, '#7b5a86');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, surfaceY);

  /* low sun */
  const sunX = W * 0.8, sunY = surfaceY * 0.52, sunR = unit * 0.05;
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 4);
  glow.addColorStop(0, 'rgba(251,191,36,.5)');
  glow.addColorStop(1, 'rgba(251,191,36,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 4, sunY - sunR * 4, sunR * 8, sunR * 8);
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill();

  /* two ridges of hills */
  drawRidge(ctx, W, surfaceY, unit * 0.16, 'rgba(30,41,66,.85)', 3.1, 17);
  drawRidge(ctx, W, surfaceY, unit * 0.10, 'rgba(22,31,52,.95)', 4.7, 41);

  /* grass lip */
  ctx.fillStyle = '#4d7c0f';
  ctx.fillRect(0, surfaceY - unit * 0.012, W, unit * 0.012);
  ctx.fillStyle = '#65a30d';
  ctx.fillRect(0, surfaceY - unit * 0.012, W, unit * 0.004);

  /* dirt with strata */
  const dirt = ctx.createLinearGradient(0, surfaceY, 0, H);
  dirt.addColorStop(0, '#7a4f24');
  dirt.addColorStop(0.35, '#61401f');
  dirt.addColorStop(1, '#3a2513');
  ctx.fillStyle = dirt;
  ctx.fillRect(0, surfaceY, W, H - surfaceY);

  const depth = H - surfaceY;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, surfaceY, W, depth);
  ctx.clip();

  /* strata bands */
  for (let i = 1; i <= 4; i++) {
    const y = surfaceY + depth * (i / 5) + Math.sin(i * 2.3) * unit * 0.012;
    ctx.strokeStyle = i % 2 ? 'rgba(0,0,0,.13)' : 'rgba(255,255,255,.045)';
    ctx.lineWidth = unit * (0.012 + (i % 2) * 0.006);
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += W / 8) {
      ctx.lineTo(x, y + Math.sin(x / W * 6 + i) * unit * 0.014);
    }
    ctx.stroke();
  }

  /* pebbles, deterministic so they do not boil between frames */
  const pebbles = Math.round((W * depth) / (unit * unit) * 90);
  for (let i = 0; i < pebbles; i++) {
    const x = hashRand(i * 1.7) * W;
    const y = surfaceY + hashRand(i * 3.3 + 5) * depth;
    const r = unit * (0.003 + hashRand(i * 5.9) * 0.006);
    ctx.fillStyle = hashRand(i * 7.1) > 0.5 ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.06)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  /* vignette */
  const vig = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

function drawRidge(ctx, W, baseY, height, colour, freq, seed) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  const steps = 26;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W;
    const h = height * (0.45 + 0.55 * Math.abs(Math.sin(i / steps * freq + seed)));
    ctx.lineTo(x, baseY - h);
  }
  ctx.lineTo(W, baseY);
  ctx.closePath();
  ctx.fill();
}

/* --------------------------------------------------------------------------
   The winch deck, the operator and the spoil cart

   The operator stands on the deck with both hands on the winch controls right
   in front of him. Everything he touches is within a forearm, which is what
   keeps him looking like a person rather than a stretched rubber band.
   -------------------------------------------------------------------------- */
export function drawRig(ctx, scene, { pulling, cartShake = 0, time }) {
  const { unit: u, surfaceY, pivot } = scene;

  const deckW = u * 0.30;
  const deckH = u * 0.05;
  const deckTop = surfaceY - deckH;
  const deckX = pivot.x - deckW / 2;

  drawCart(ctx, scene, cartShake);

  /* rope slot in the ground, so the rope reads as passing through the deck */
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.beginPath();
  ctx.ellipse(pivot.x, surfaceY + u * 0.004, u * 0.030, u * 0.011, 0, 0, Math.PI * 2);
  ctx.fill();

  /* deck */
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  roundRect(ctx, deckX - u * 0.006, surfaceY - u * 0.004, deckW + u * 0.012, u * 0.014, u * 0.006);
  ctx.fill();
  ctx.fillStyle = '#6b7683';
  roundRect(ctx, deckX, deckTop, deckW, deckH, u * 0.010);
  ctx.fill();
  ctx.fillStyle = '#8d99a7';
  roundRect(ctx, deckX, deckTop, deckW, u * 0.016, u * 0.008);
  ctx.fill();

  /* hazard edging along the front */
  ctx.save();
  roundRect(ctx, deckX, surfaceY - u * 0.014, deckW, u * 0.012, u * 0.005);
  ctx.clip();
  ctx.fillStyle = '#e0b93c';
  ctx.fillRect(deckX, surfaceY - u * 0.014, deckW, u * 0.012);
  ctx.fillStyle = '#22252b';
  for (let sx = -u * 0.02; sx < deckW + u * 0.02; sx += u * 0.028) {
    ctx.beginPath();
    ctx.moveTo(deckX + sx, surfaceY - u * 0.002);
    ctx.lineTo(deckX + sx + u * 0.012, surfaceY - u * 0.002);
    ctx.lineTo(deckX + sx + u * 0.024, surfaceY - u * 0.014);
    ctx.lineTo(deckX + sx + u * 0.012, surfaceY - u * 0.014);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  /* winch drum on the deck, spinning while a load comes in */
  const drumX = pivot.x - u * 0.085;
  const drumY = deckTop - u * 0.038;
  ctx.fillStyle = '#4b545e';
  roundRect(ctx, drumX - u * 0.042, drumY - u * 0.006, u * 0.084, u * 0.048, u * 0.008);
  ctx.fill();
  ctx.fillStyle = '#aab5c1';
  ctx.beginPath();
  ctx.arc(drumX, drumY + u * 0.016, u * 0.026, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b7683';
  ctx.beginPath();
  ctx.arc(drumX, drumY + u * 0.016, u * 0.011, 0, Math.PI * 2);
  ctx.fill();
  const spin = pulling ? time * 9 : time * 0.5;
  ctx.strokeStyle = '#39424c';
  ctx.lineWidth = Math.max(1, u * 0.007);
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const a = spin + (i / 3) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(drumX, drumY + u * 0.016);
    ctx.lineTo(drumX + Math.cos(a) * u * 0.021, drumY + u * 0.016 + Math.sin(a) * u * 0.021);
    ctx.stroke();
  }

  /* The sheave sits in the deck opening, not above it, so the rope reads as one
     continuous run: off the drum, over the sheave, straight down the slot. */
  const sheaveY = surfaceY - u * 0.026;
  ctx.strokeStyle = '#d6d3d1';
  ctx.lineWidth = Math.max(1, u * 0.007);
  ctx.beginPath();
  ctx.moveTo(drumX + u * 0.014, drumY + u * 0.026);
  ctx.lineTo(pivot.x - u * 0.013, sheaveY - u * 0.009);
  ctx.stroke();

  ctx.fillStyle = '#c3ccd6';
  ctx.beginPath();
  ctx.arc(pivot.x, sheaveY, u * 0.017, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b7683';
  ctx.beginPath();
  ctx.arc(pivot.x, sheaveY, u * 0.007, 0, Math.PI * 2);
  ctx.fill();

  drawOperator(ctx, scene, { pulling, time, deckTop });
}

function drawOperator(ctx, scene, { pulling, time, deckTop }) {
  const { unit: u, pivot } = scene;
  const x = pivot.x + u * 0.085;
  const feet = deckTop;
  const bob = pulling ? Math.sin(time * 10) * u * 0.005 : 0;

  /* control stand he is actually holding */
  const leverX = x - u * 0.052;
  const leverTop = feet - u * 0.085;
  ctx.strokeStyle = '#5b6570';
  ctx.lineWidth = u * 0.010;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(leverX, feet - u * 0.006);
  ctx.lineTo(leverX, leverTop);
  ctx.stroke();
  ctx.fillStyle = pulling ? '#e0b93c' : '#c0392b';
  ctx.beginPath();
  ctx.arc(leverX, leverTop, u * 0.013, 0, Math.PI * 2);
  ctx.fill();

  /* shadow on the deck */
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath();
  ctx.ellipse(x, feet + u * 0.003, u * 0.042, u * 0.009, 0, 0, Math.PI * 2);
  ctx.fill();

  /* legs and boots */
  ctx.fillStyle = '#1e3a8a';
  roundRect(ctx, x - u * 0.024, feet - u * 0.050, u * 0.020, u * 0.050, u * 0.006); ctx.fill();
  roundRect(ctx, x + u * 0.004, feet - u * 0.050, u * 0.020, u * 0.050, u * 0.006); ctx.fill();
  ctx.fillStyle = '#292524';
  roundRect(ctx, x - u * 0.028, feet - u * 0.012, u * 0.028, u * 0.012, u * 0.004); ctx.fill();
  roundRect(ctx, x + u * 0.002, feet - u * 0.012, u * 0.028, u * 0.012, u * 0.004); ctx.fill();

  /* hi-vis torso */
  const ty = feet - u * 0.108 + bob;
  const th = u * 0.062;
  ctx.fillStyle = '#f97316';
  roundRect(ctx, x - u * 0.030, ty, u * 0.060, th, u * 0.011); ctx.fill();
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x - u * 0.030, ty + u * 0.026, u * 0.060, u * 0.009);
  ctx.fillRect(x - u * 0.007, ty, u * 0.009, th);

  /* Two short arms. The forward one grips the lever, the other rests at the
     hip, and neither reaches further than a real elbow allows. */
  const shoulder = { x: x - u * 0.028, y: ty + u * 0.014 };
  const hand = { x: leverX + u * 0.004, y: leverTop + u * 0.002 };
  const pump = pulling ? Math.sin(time * 10) * u * 0.006 : 0;
  const elbow = {
    x: (shoulder.x + hand.x) / 2 - u * 0.010,
    y: (shoulder.y + hand.y) / 2 + u * 0.014 + pump
  };

  /* Both arms are stroked twice: a dark pass for the outline, then a deeper
     orange than the vest. Same-colour arms on a same-colour torso vanish. */
  const arm = (from, ctrl, to) => {
    for (const [colour, width] of [['#7c2d12', u * 0.020], ['#ea580c', u * 0.013]]) {
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.quadraticCurveTo(ctrl.x, ctrl.y, to.x, to.y);
      ctx.stroke();
    }
  };
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  arm(shoulder, elbow, hand);
  arm(
    { x: x + u * 0.028, y: ty + u * 0.014 },
    { x: x + u * 0.046, y: ty + u * 0.034 },
    { x: x + u * 0.038, y: ty + u * 0.054 }
  );

  /* glove */
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(hand.x, hand.y, u * 0.010, 0, Math.PI * 2);
  ctx.fill();

  /* head and hard hat */
  const hy = ty - u * 0.024;
  ctx.fillStyle = '#d6a06a';
  ctx.beginPath();
  ctx.arc(x, hy, u * 0.019, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.ellipse(x, hy - u * 0.008, u * 0.030, u * 0.008, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, hy - u * 0.008, u * 0.021, u * 0.022, 0, Math.PI, 0);
  ctx.fill();
}

function drawCart(ctx, scene, shake) {
  const { unit: u, surfaceY, pivot } = scene;
  const x = pivot.x - u * 0.235 + (shake > 0 ? Math.sin(shake * 40) * u * 0.006 : 0);
  const y = surfaceY;
  const w = u * 0.145, h = u * 0.075;

  /* rails */
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = u * 0.006;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.8, y + u * 0.002);
  ctx.lineTo(x + w * 0.8, y + u * 0.002);
  ctx.stroke();

  /* body */
  ctx.fillStyle = '#57534e';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h);
  ctx.lineTo(x + w / 2, y - h);
  ctx.lineTo(x + w * 0.38, y - u * 0.012);
  ctx.lineTo(x - w * 0.38, y - u * 0.012);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = u * 0.005;
  ctx.stroke();

  /* gold piled inside */
  ctx.fillStyle = '#c9a227';
  ctx.beginPath();
  ctx.ellipse(x, y - h, w * 0.32, u * 0.013, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(x - w * 0.12, y - h - u * 0.004, u * 0.008, 0, Math.PI * 2);
  ctx.fill();

  /* wheels */
  ctx.fillStyle = '#1c1917';
  for (const dx of [-w * 0.26, w * 0.26]) {
    ctx.beginPath();
    ctx.arc(x + dx, y - u * 0.008, u * 0.014, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* --------------------------------------------------------------------------
   Rope and claw
   -------------------------------------------------------------------------- */
export function drawHook(ctx, scene, hook) {
  const { unit: u, pivot } = scene;
  const tip = hook.tip();
  const holding = !!hook.grabbed;

  /* rope */
  ctx.strokeStyle = '#d6d3d1';
  ctx.lineWidth = Math.max(1.5, u * TUNING.ropeWidth);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pivot.x, pivot.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = Math.max(1, u * TUNING.ropeWidth * 0.4);
  ctx.beginPath();
  ctx.moveTo(pivot.x, pivot.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();

  /* claw */
  ctx.save();
  ctx.translate(tip.x, tip.y);
  ctx.rotate(-hook.angle);

  const s = u * 0.052;
  const spread = holding ? 0.22 : 0.85;

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = s * 0.30;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(dir * s * 0.7 * spread, s * 0.55, dir * s * 0.45 * spread, s * 1.05);
    ctx.stroke();
  }

  /* shank and collar */
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = s * 0.26;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.35);
  ctx.lineTo(0, s * 0.18);
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.19, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* --------------------------------------------------------------------------
   Floating effects: value popups, dust, blast
   -------------------------------------------------------------------------- */
export function drawFx(ctx, scene, fx) {
  const { unit: u } = scene;
  for (const f of fx) {
    const k = 1 - f.t / f.life;

    if (f.kind === 'value') {
      ctx.globalAlpha = clamp(k * 1.4, 0, 1);
      ctx.font = `800 ${Math.round(u * 0.045)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = u * 0.012;
      ctx.strokeStyle = 'rgba(0,0,0,.65)';
      ctx.strokeText(f.text, f.x, f.y - (1 - k) * u * 0.14);
      ctx.fillStyle = f.colour || '#fde68a';
      ctx.fillText(f.text, f.x, f.y - (1 - k) * u * 0.14);
      ctx.globalAlpha = 1;

    } else if (f.kind === 'dust') {
      ctx.globalAlpha = k * 0.6;
      ctx.fillStyle = '#d6c3a5';
      ctx.beginPath();
      ctx.arc(f.x, f.y, u * 0.02 * (1.6 - k), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

    } else if (f.kind === 'blast') {
      const r = u * 0.11 * (1.7 - k);
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      g.addColorStop(0, `rgba(255,255,255,${(k * 0.9).toFixed(2)})`);
      g.addColorStop(0.4, `rgba(251,146,60,${(k * 0.8).toFixed(2)})`);
      g.addColorStop(1, 'rgba(120,53,15,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Sweep guide arc under the winch, so a new player sees the swing range. */
export function drawSwingGuide(ctx, scene, alpha) {
  if (alpha <= 0) return;
  const { unit: u, pivot } = scene;
  ctx.globalAlpha = alpha * 0.35;
  ctx.strokeStyle = '#fbbf24';
  ctx.setLineDash([u * 0.02, u * 0.03]);
  ctx.lineWidth = Math.max(1, u * 0.005);
  ctx.beginPath();
  ctx.arc(pivot.x, pivot.y, u * 0.24, Math.PI / 2 - scene.arc, Math.PI / 2 + scene.arc);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}
