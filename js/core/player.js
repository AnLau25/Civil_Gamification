/**
 * player.js — anonymous participant identity.
 *
 *   pid     stable random id, this is what the research data is keyed on
 *   alias   self chosen leaderboard name, never required to be a real name
 *   section optional course section code so an instructor can group a class
 *
 * Pure state. Anything that renders lives in ui.js.
 */

import { KEYS } from './config.js';
import { read, write } from './storage.js';
import { uid } from './util.js';

const listeners = new Set();

export function get() {
  let p = read(KEYS.player, null);
  if (!p || !p.pid) {
    p = { pid: uid(), alias: '', section: '', created: Date.now() };
    write(KEYS.player, p);
  }
  return p;
}

export function save(patch) {
  const p = { ...get(), ...patch };
  write(KEYS.player, p);
  listeners.forEach(fn => { try { fn(p); } catch { /* a bad listener must not break saving */ } });
  return p;
}

export const name = () => get().alias || 'Anonymous';
export const hasName = () => !!get().alias;

/** Subscribe to identity changes. Returns an unsubscribe function. */
export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
