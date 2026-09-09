#!/usr/bin/env node
/**
 * Validate the question bank before class.
 *
 *     node tools/validate-questions.mjs
 *
 * Exits non zero if anything is wrong, so it also works as a CI step or a
 * pre-commit hook.
 */

import { BANK } from '../js/data/questions.js';

const LETTERS = ['A', 'B', 'C', 'D'];
const errors = [];
const warnings = [];

const questions = BANK.questions || [];
const topics = BANK.TOPICS || {};

if (!questions.length) errors.push('The bank is empty.');

const seenIds = new Set();
const answerCounts = {};
const topicCounts = {};
const diffCounts = {};

for (const [i, q] of questions.entries()) {
  const where = `#${i + 1} ${q.id ?? '(no id)'}`;

  if (!q.id) errors.push(`${where}: missing id`);
  else if (seenIds.has(q.id)) errors.push(`${where}: duplicate id`);
  else seenIds.add(q.id);

  if (!q.q || q.q.length < 10) errors.push(`${where}: question text is missing or too short`);
  if (q.q && q.q.length > 260) warnings.push(`${where}: stem is ${q.q.length} characters, it may wrap badly on a phone`);

  if (!q.opts) {
    errors.push(`${where}: no options`);
  } else {
    for (const L of LETTERS) {
      if (!(L in q.opts)) errors.push(`${where}: missing option ${L}`);
    }
    const texts = LETTERS.map(L => q.opts[L]).filter(Boolean);
    if (new Set(texts).size !== texts.length) errors.push(`${where}: two options have identical text`);
  }

  if (!q.ans) errors.push(`${where}: no answer key`);
  else if (!q.opts?.[q.ans]) errors.push(`${where}: answer key "${q.ans}" is not one of the options`);
  else answerCounts[q.ans] = (answerCounts[q.ans] || 0) + 1;

  if (!q.why || q.why.length < 15) warnings.push(`${where}: explanation is very short`);

  if (!q.topic) errors.push(`${where}: no topic`);
  else {
    if (!topics[q.topic]) errors.push(`${where}: topic "${q.topic}" is not declared in TOPICS`);
    topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
  }

  if (![1, 2, 3].includes(q.diff)) errors.push(`${where}: diff must be 1, 2 or 3`);
  else diffCounts[q.diff] = (diffCounts[q.diff] || 0) + 1;

  if (!Array.isArray(q.exam) || !q.exam.length) errors.push(`${where}: exam must be a non empty array`);
  else for (const e of q.exam) {
    if (!['civil', 'env'].includes(e)) errors.push(`${where}: unknown exam track "${e}"`);
  }

  if (typeof q.sec !== 'number' || q.sec < 8 || q.sec > 120) {
    warnings.push(`${where}: sec is ${q.sec}, expected roughly 15 to 45`);
  }
}

/* An answer letter that dominates lets a student guess their way through. */
const total = Object.values(answerCounts).reduce((a, b) => a + b, 0);
for (const [letter, count] of Object.entries(answerCounts)) {
  const share = count / total;
  if (share > 0.35) warnings.push(`Answer ${letter} is the key ${Math.round(share * 100)} percent of the time, spread them out`);
}

/* Report */
const line = '─'.repeat(64);
console.log(line);
console.log(`FE Arcade question bank  ·  version ${BANK.version || '(unset)'}`);
console.log(line);
console.log(`Questions   ${questions.length}`);
console.log(`Topics      ${Object.keys(topicCounts).length} of ${Object.keys(topics).length} declared`);
console.log(`Difficulty  ${[1, 2, 3].map(d => `${d}:${diffCounts[d] || 0}`).join('  ')}`);
console.log(`Answer key  ${LETTERS.map(L => `${L}:${answerCounts[L] || 0}`).join('  ')}`);

const unused = Object.keys(topics).filter(t => !topicCounts[t]);
if (unused.length) console.log(`Unused topics: ${unused.join(', ')}`);

console.log(line);
if (warnings.length) {
  console.log(`${warnings.length} warning${warnings.length === 1 ? '' : 's'}:`);
  for (const w of warnings) console.log(`  · ${w}`);
  console.log(line);
}

if (errors.length) {
  console.log(`${errors.length} ERROR${errors.length === 1 ? '' : 'S'}:`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log(line);
  process.exit(1);
}

console.log('No errors. The bank is ready to ship.');
console.log(line);
