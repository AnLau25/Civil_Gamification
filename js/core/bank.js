/**
 * bank.js — the question bank: normalising, filtering, topic labels.
 *
 * The raw bank lives in js/data/questions.js. Everything downstream reads it
 * through here, so a schema change only ever needs fixing in one place.
 */

import { BANK as RAW } from '../data/questions.js';

/** topic key -> display name. Seeded from the bank, extended if a question
 *  uses a topic the bank forgot to declare. */
const LABELS = { general: 'General', ...(RAW.TOPICS || {}) };

/**
 * Accepts both the current schema and the older
 * { question, options, answer, explanation } shape, so an old export can be
 * pasted straight in without breaking.
 */
function normalise(raw, i) {
  const q = {
    id:    raw.id != null ? String(raw.id) : `Q${i + 1}`,
    topic: raw.topic || 'general',
    exam:  raw.exam || ['civil', 'env'],
    diff:  raw.diff || 2,
    sec:   raw.sec || 30,
    q:     raw.q    || raw.question    || '',
    opts:  raw.opts || raw.options     || {},
    ans:   raw.ans  || raw.answer      || 'A',
    why:   raw.why  || raw.explanation || ''
  };
  if (!LABELS[q.topic]) LABELS[q.topic] = q.topic;
  return q;
}

/** Every valid question. A question whose keyed answer is missing is dropped
 *  rather than shown, so a typo never puts an unanswerable item in front of a student. */
export const all = (RAW.questions || [])
  .map(normalise)
  .filter(q => q.q && q.opts && q.opts[q.ans]);

export const meta = { version: RAW.version, source: RAW.source };
export const count = all.length;
export const labels = LABELS;

export const label = topic => LABELS[topic] || topic;

export const byId = id => all.find(q => q.id === id) || null;

/** Topics present in the bank with their counts, sorted for display. */
export function topics(examFilter) {
  const counts = new Map();
  for (const q of all) {
    if (examFilter && !q.exam.includes(examFilter)) continue;
    counts.set(q.topic, (counts.get(q.topic) || 0) + 1);
  }
  return [...counts]
    .map(([key, n]) => ({ key, label: label(key), n }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * @param {{topics?:string[], exam?:string|null, diff?:number[]}} opts
 */
export function filter(opts = {}) {
  return all.filter(q => {
    if (opts.topics?.length && !opts.topics.includes(q.topic)) return false;
    if (opts.exam && !q.exam.includes(opts.exam)) return false;
    if (opts.diff?.length && !opts.diff.includes(q.diff)) return false;
    return true;
  });
}
