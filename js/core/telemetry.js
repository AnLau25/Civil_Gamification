/**
 * telemetry.js — the research log.
 *
 * Every event is appended to a capped ring buffer in localStorage. Nothing
 * leaves the device unless the student exports the CSV from data.html.
 *
 * Event shape (short keys keep the buffer small):
 *   t     epoch ms          e     event type
 *   pid   participant id    g     game id
 *   al    alias             qid   question id
 *   sec   section code      top   topic
 *                           d     difficulty
 *                           ok    1 / 0
 *                           ms    response latency
 *                           ch    chosen letter
 *                           to    1 if the timer expired
 *                           score score on end / level rows
 *                           detail free text context
 */

import { CONFIG, KEYS } from './config.js';
import { read, write } from './storage.js';
import * as player from './player.js';
import * as bank from './bank.js';

export const all = () => read(KEYS.events, []);

export function log(type, data = {}) {
  const p = player.get();
  const ev = { t: Date.now(), pid: p.pid, al: p.alias, sec: p.section, e: type, ...data };

  let events = all();
  events.push(ev);
  if (events.length > CONFIG.maxEvents) events = events.slice(-CONFIG.maxEvents);
  write(KEYS.events, events);
  return ev;
}

export const clear = () => write(KEYS.events, []);

/** Accuracy per topic across everything answered on this device, weakest first. */
export function mastery() {
  const rows = new Map();
  for (const ev of all()) {
    if (ev.e !== 'answer' || !ev.top) continue;
    const r = rows.get(ev.top) || { topic: ev.top, label: bank.label(ev.top), n: 0, c: 0, ms: 0 };
    r.n += 1;
    if (ev.ok) r.c += 1;
    r.ms += ev.ms || 0;
    rows.set(ev.top, r);
  }
  return [...rows.values()]
    .map(r => ({
      ...r,
      pct: r.n ? Math.round((r.c / r.n) * 100) : 0,
      avgSec: r.n ? Math.round(r.ms / r.n / 100) / 10 : 0
    }))
    .sort((a, b) => a.pct - b.pct);
}

export function summary() {
  const events = all();
  const answers = events.filter(e => e.e === 'answer');
  const correct = answers.filter(e => e.ok).length;
  const ms = answers.reduce((s, e) => s + (e.ms || 0), 0);
  return {
    answers: answers.length,
    correct,
    pct: answers.length ? Math.round((correct / answers.length) * 100) : 0,
    avgSec: answers.length ? Math.round(ms / answers.length / 100) / 10 : 0,
    minutes: Math.round(ms / 60000),
    runs: events.filter(e => e.e === 'start').length
  };
}

const CSV_COLUMNS = [
  'timestamp_iso', 'player_id', 'alias', 'section', 'game', 'event',
  'question_id', 'topic', 'difficulty', 'correct', 'response_ms',
  'chosen', 'timed_out', 'score', 'detail'
];

function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csv() {
  const rows = [CSV_COLUMNS.join(',')];
  for (const e of all()) {
    rows.push([
      new Date(e.t).toISOString(), e.pid, e.al, e.sec, e.g, e.e,
      e.qid, e.top, e.d,
      e.e === 'answer' ? (e.ok ? 1 : 0) : '',
      e.ms, e.ch, e.to ? 1 : '', e.score, e.detail
    ].map(csvCell).join(','));
  }
  return rows.join('\n');
}

export function download() {
  const blob = new Blob([csv()], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `fe_arcade_${player.get().alias || 'player'}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
