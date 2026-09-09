/**
 * picker.js — adaptive, non repeating question feeder.
 *
 * A question you missed comes back much sooner. A question you have answered
 * correctly three times running fades out. Unseen questions are favoured over
 * ones you already know.
 *
 * This is a real confound for a study, so it is documented here and in the
 * research plan: in-game accuracy rises partly because the feeder is adaptive.
 */

import * as bank from './bank.js';
import * as history from './history.js';
import { clamp, weightedPick } from './util.js';

const WEIGHT = {
  unseen:   2.0,
  missed:   3.2,   // got it wrong last time
  seen:     1.0,
  learning: 0.6,   // two correct in a row
  mastered: 0.35   // three or more correct in a row
};

/**
 * @param {{topics?:string[], exam?:string|null, diff?:number[], adaptive?:boolean}} opts
 */
export function create(opts = {}) {
  let pool = bank.filter(opts);
  if (!pool.length) pool = bank.all.slice();

  const recent = [];
  const recentMax = clamp(Math.floor(pool.length * 0.4), 4, 25);

  function weight(q) {
    if (opts.adaptive === false) return 1;
    const h = history.forQuestion(q.id);
    if (!h) return WEIGHT.unseen;
    if (!h.lastOk) return WEIGHT.missed;
    if (h.streak >= 3) return WEIGHT.mastered;
    if (h.streak === 2) return WEIGHT.learning;
    return WEIGHT.seen;
  }

  return {
    size: pool.length,
    pool,

    /** @returns the next question, never one of the last `recentMax` served */
    next() {
      let eligible = pool.filter(q => !recent.includes(q.id));
      if (!eligible.length) { recent.length = 0; eligible = pool.slice(); }

      const chosen = weightedPick(eligible, weight);
      recent.push(chosen.id);
      if (recent.length > recentMax) recent.shift();
      return chosen;
    }
  };
}
