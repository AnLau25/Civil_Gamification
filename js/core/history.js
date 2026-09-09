/**
 * history.js — per question performance, kept on the device.
 *
 * Drives two things: which question the picker serves next, and the accuracy
 * report on the progress page.
 */

import { KEYS } from './config.js';
import { read, write } from './storage.js';

/** @returns {Record<string, {n:number, c:number, streak:number, lastOk:number, last:number}>} */
export const all = () => read(KEYS.qhist, {});

export function note(questionId, correct) {
  const h = all();
  const r = h[questionId] || { n: 0, c: 0, streak: 0 };
  r.n += 1;
  if (correct) { r.c += 1; r.streak = Math.max(0, r.streak) + 1; }
  else         { r.streak = 0; }
  r.lastOk = correct ? 1 : 0;
  r.last = Date.now();
  h[questionId] = r;
  write(KEYS.qhist, h);
  return r;
}

export const forQuestion = id => all()[id] || null;

export const reset = () => write(KEYS.qhist, {});
