/**
 * app.js — the barrel every page imports from, plus boot().
 *
 *   import { boot, quiz, picker, ui, log } from './js/core/app.js';
 *
 * Keeping one entry point means a page never has to know how the core is
 * split up internally.
 */

export { CONFIG, KEYS, GAMES } from './config.js';
export * as util from './util.js';
export * as player from './player.js';
export * as bank from './bank.js';
export * as history from './history.js';
export * as picker from './picker.js';
export * as telemetry from './telemetry.js';
export * as scores from './scores.js';
export * as quiz from './quiz.js';
export * as audio from './audio.js';
export * as ui from './ui.js';
export { Stage, Loop } from './canvas.js';
export { log } from './telemetry.js';

import * as bank from './bank.js';
import { log } from './telemetry.js';
import { paintWho, toast } from './ui.js';
import { wireToggle } from './audio.js';

const pauseHandlers = new Set();

/** Games register here so play stops when the tab or the screen goes away. */
export function onPause(fn) {
  pauseHandlers.add(fn);
  return () => pauseHandlers.delete(fn);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  pauseHandlers.forEach(fn => { try { fn(); } catch { /* one bad handler must not block the rest */ } });
});

/**
 * Call once per page.
 * @param {'excavator'|'dig'|'defense'|'doc'} page
 */
export function boot(page) {
  document.body.classList.add(page === 'doc' ? 'docpage' : 'gamepage');
  paintWho();
  wireToggle(document.getElementById('sound'), page);
  log('session', { g: page });

  if (page !== 'doc') hardenTouch();

  if (!bank.count) toast('No questions loaded. Check js/data/questions.js', 'bad', 6000);
}

/**
 * Stops the browser gestures that ruin a game on a phone: pinch zoom,
 * double tap zoom, and the long press context menu that fires mid drag.
 */
function hardenTouch() {
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, e => e.preventDefault(), { passive: false });
  }

  let lastTouchEnd = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTouchEnd < 320) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  document.getElementById('stage')
    ?.addEventListener('contextmenu', e => e.preventDefault());
}
