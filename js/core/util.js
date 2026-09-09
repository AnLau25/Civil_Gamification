/**
 * util.js — small pure helpers used across the app.
 * No DOM, no storage, no side effects.
 */

/** Escape a string for safe interpolation into innerHTML. */
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Fisher-Yates, in place. */
export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const rand  = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick  = a => a[Math.floor(Math.random() * a.length)];
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp  = (a, b, t) => a + (b - a) * t;

/** Weighted random pick. `weightOf` maps an item to a positive number. */
export function weightedPick(items, weightOf) {
  let total = 0;
  const ws = items.map(it => { const w = Math.max(0, weightOf(it)); total += w; return w; });
  if (total <= 0) return items[items.length - 1];
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= ws[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** 1234 -> "1,234" */
export const n = v => Math.floor(v).toLocaleString();

/** 1234 -> "$1,234" */
export const money = v => '$' + Math.floor(v).toLocaleString();

/** 74 -> "1:14" */
export function clock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

/** Short random id, stable enough for anonymous participant ids. */
export const uid = () =>
  'p' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

/** True on phones and tablets. Drives touch target sizing. */
export const isTouch = (() => {
  try { return matchMedia('(pointer: coarse)').matches; }
  catch { return 'ontouchstart' in window; }
})();

/** Rounded rectangle path on a 2D context. */
export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Deterministic pseudo random in [0,1) from an integer seed.
 * Used for scenery that must not flicker between frames.
 */
export function hashRand(seed) {
  let x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
