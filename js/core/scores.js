/**
 * scores.js — leaderboard adapter.
 *
 * Promise based on purpose. Today every call resolves from localStorage.
 * Set CONFIG.apiBase to a Cloudflare Worker URL and the same calls go online,
 * falling back to local storage whenever the network fails, so a dead
 * connection never blocks play. No caller changes.
 */

import { CONFIG, KEYS } from './config.js';
import { read, write } from './storage.js';
import * as player from './player.js';
import { esc, n as fmt } from './util.js';

const allScores = () => read(KEYS.scores, {});

export const isOnline = () => !!CONFIG.apiBase;

export function submit(game, score, meta = {}) {
  const p = player.get();
  const entry = {
    name: p.alias || 'Anonymous',
    pid: p.pid,
    section: p.section || '',
    score: Math.round(score),
    ts: Date.now(),
    meta
  };

  const store = allScores();
  const list = store[game] || (store[game] = []);
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  if (list.length > CONFIG.maxScores) store[game] = list.slice(0, CONFIG.maxScores);
  write(KEYS.scores, store);

  if (!CONFIG.apiBase) return Promise.resolve(entry);

  return fetch(`${CONFIG.apiBase}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game, cls: CONFIG.classCode, entry })
  })
    .then(r => r.json())
    .catch(() => entry);
}

export function top(game, limit = 12, { dedupe = true } = {}) {
  const fromLocal = () => {
    let list = (allScores()[game] || []).slice().sort((a, b) => b.score - a.score);
    if (dedupe) {
      /* One row per player, their best. Keyed by the visible name so the same
         student on two devices still collapses to one line. */
      const seen = new Set();
      list = list.filter(e => {
        const key = (e.name || '').trim().toLowerCase() || e.pid;
        return seen.has(key) ? false : (seen.add(key), true);
      });
    }
    return list.slice(0, limit);
  };

  if (!CONFIG.apiBase) return Promise.resolve(fromLocal());

  const url = `${CONFIG.apiBase}/top?game=${encodeURIComponent(game)}`
            + `&cls=${encodeURIComponent(CONFIG.classCode)}&n=${limit}`;
  return fetch(url)
    .then(r => r.json())
    .then(d => d?.entries || fromLocal())
    .catch(fromLocal);
}

/** This player's best on a game, from local storage. */
export function best(game) {
  const p = player.get();
  const mine = (allScores()[game] || []).filter(e => e.pid === p.pid);
  return mine.length ? Math.max(...mine.map(e => e.score)) : 0;
}

/** Render a leaderboard table into a container element. */
export function render(el, game, limit = 12) {
  if (!el) return Promise.resolve();
  el.innerHTML = '<p class="lb-empty">Loading…</p>';

  return top(game, limit).then(rows => {
    if (!rows.length) {
      el.innerHTML = '<p class="lb-empty">No scores yet. Be the first name on the board.</p>';
      return;
    }
    const me = player.get().pid;
    el.innerHTML =
      '<table class="lb"><thead><tr><th></th><th>Player</th>' +
      '<th style="text-align:right">Score</th></tr></thead><tbody>' +
      rows.map((r, i) => `
        <tr class="${r.pid === me ? 'me' : ''}">
          <td class="rank">${i + 1}</td>
          <td class="name">${esc(r.name)}${
            r.section ? ` <span style="color:var(--muted);font-size:11px">${esc(r.section)}</span>` : ''
          }</td>
          <td class="score">${fmt(r.score)}</td>
        </tr>`).join('') +
      '</tbody></table>';
  });
}
