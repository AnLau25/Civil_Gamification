/**
 * quiz.js — the question modal.
 *
 * One implementation, used identically by all three games. That is deliberate:
 * the learning instrument has to be constant so any difference between games is
 * down to the game wrapper, not the way the question was presented.
 *
 *   const result = await quiz.ask({ q, game, timed: true, lifeline: true });
 *   // { ok, chosen, ms, timedOut, q }
 */

import { esc, shuffle } from './util.js';
import * as bank from './bank.js';
import * as history from './history.js';
import { log } from './telemetry.js';
import { sfx } from './audio.js';

const LETTERS = ['A', 'B', 'C', 'D'];
const DIFF_NAME = ['', 'Easy', 'Medium', 'Hard'];

let root = null;
let open = false;

export const isOpen = () => open;

function build() {
  if (root) return root;
  root = document.createElement('div');
  root.id = 'feQuiz';
  root.className = 'hidden';
  root.innerHTML = `
    <div class="qcard">
      <div class="qhead">
        <p class="qlabel" id="feQLabel">Answer to continue</p>
        <div class="qtags" id="feQTags"></div>
      </div>
      <div class="qtimer hidden" id="feQTimer"><i></i></div>
      <p class="qtext" id="feQText"></p>
      <div class="opts" id="feQOpts"></div>
      <div class="center">
        <button class="btn btn-ghost btn-sm" id="feQ5050" type="button" style="margin-top:12px">Use 50/50</button>
      </div>
      <div class="result hidden" id="feQResult">
        <p class="verdict" id="feQVerdict"></p>
        <p class="answerline" id="feQAnswer"></p>
        <p class="expl" id="feQExpl"></p>
        <button class="btn btn-primary btn-block" id="feQAction" type="button"></button>
      </div>
    </div>`;
  document.body.appendChild(root);
  return root;
}

/**
 * @param {object}   o
 * @param {object}   o.q          question from the bank
 * @param {string}   o.game       game id, recorded with the answer
 * @param {string}  [o.label]     small heading above the question
 * @param {boolean} [o.timed]     run the countdown from q.sec
 * @param {boolean} [o.lifeline]  offer one 50/50
 * @param {Function}[o.onLifeline] called when the 50/50 is spent
 * @param {Function}[o.cta]       (ok) => button text
 * @param {string}  [o.ctx]       free text logged with the answer
 * @returns {Promise<{ok:boolean, chosen:string|null, ms:number, timedOut:boolean, q:object}>}
 */
export function ask(o) {
  const q = o?.q;
  if (!q) return Promise.resolve({ ok: false, chosen: null, ms: 0, timedOut: false, q: null });

  const el = build();
  const $ = sel => el.querySelector(sel);
  const timerEl = $('#feQTimer');
  const barEl = timerEl.querySelector('i');
  const optsEl = $('#feQOpts');
  const fiftyEl = $('#feQ5050');
  const resultEl = $('#feQResult');
  const actionEl = $('#feQAction');

  $('#feQLabel').textContent = o.label || 'Answer to continue';
  $('#feQTags').innerHTML =
    `<span class="tag">${esc(bank.label(q.topic))}</span>` +
    `<span class="tag d${q.diff}">${DIFF_NAME[q.diff] || ''}</span>`;
  $('#feQText').textContent = q.q;
  resultEl.classList.add('hidden');
  optsEl.innerHTML = '';
  el.querySelector('.qcard').scrollTop = 0;

  const letters = LETTERS.filter(L => L in q.opts);
  for (const L of letters) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt';
    b.dataset.letter = L;
    b.innerHTML = `<span class="badge">${L}</span><span>${esc(q.opts[L])}</span>`;
    optsEl.appendChild(b);
  }

  fiftyEl.style.display = o.lifeline ? '' : 'none';
  fiftyEl.disabled = false;
  fiftyEl.textContent = 'Use 50/50';

  el.classList.remove('hidden');
  open = true;

  const t0 = performance.now();
  const limit = o.timed && q.sec ? q.sec * 1000 : 0;
  let settled = false;
  let timerId = null;
  let rafId = null;

  return new Promise(resolve => {
    function choose(letter, timedOut) {
      if (settled) return;
      settled = true;
      clearTimeout(timerId);
      cancelAnimationFrame(rafId);

      const ms = Math.round(performance.now() - t0);
      const ok = letter === q.ans;
      fiftyEl.style.display = 'none';

      for (const b of optsEl.querySelectorAll('.opt')) {
        b.disabled = true;
        if (b.dataset.letter === q.ans) b.classList.add('correct');
        else if (b.dataset.letter === letter) b.classList.add('wrong');
      }

      $('#feQVerdict').textContent = timedOut ? 'Time is up' : ok ? 'Correct' : 'Not quite';
      $('#feQVerdict').className = `verdict ${ok ? 'ok' : 'no'}`;
      $('#feQAnswer').textContent = `Answer ${q.ans}: ${q.opts[q.ans]}`;
      $('#feQExpl').textContent = q.why || '';
      resultEl.classList.remove('hidden');

      sfx(ok ? 'correct' : 'wrong');
      history.note(q.id, ok);
      log('answer', {
        g: o.game || '', qid: q.id, top: q.topic, d: q.diff,
        ok: ok ? 1 : 0, ms, ch: letter || '', to: timedOut ? 1 : 0,
        detail: o.ctx || ''
      });

      actionEl.textContent = o.cta ? o.cta(ok) : 'Continue';
      actionEl.onclick = () => {
        el.classList.add('hidden');
        open = false;
        document.removeEventListener('keydown', onKey, true);
        resolve({ ok, chosen: letter, ms, timedOut: !!timedOut, q });
      };
      setTimeout(() => resultEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 40);
    }

    for (const b of optsEl.querySelectorAll('.opt')) {
      b.onclick = () => choose(b.dataset.letter, false);
    }

    function useFifty() {
      if (settled || !o.lifeline || fiftyEl.disabled) return;
      fiftyEl.disabled = true;
      fiftyEl.textContent = '50/50 used';
      shuffle(letters.filter(L => L !== q.ans)).slice(0, 2).forEach(L => {
        const b = optsEl.querySelector(`.opt[data-letter="${L}"]`);
        if (b) { b.disabled = true; b.classList.add('dim'); }
      });
      o.onLifeline?.();
    }
    fiftyEl.onclick = useFifty;

    /* Keyboard: 1-4 or A-D to answer, H for the lifeline, Enter to continue. */
    function onKey(e) {
      if (!open) return;
      if (settled) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); actionEl.click(); }
        return;
      }
      let k = String(e.key).toUpperCase();
      const numeric = ['1', '2', '3', '4'].indexOf(e.key);
      if (numeric >= 0) k = LETTERS[numeric];

      if (letters.includes(k)) {
        const b = optsEl.querySelector(`.opt[data-letter="${k}"]`);
        if (b && !b.disabled) { e.preventDefault(); choose(k, false); }
      } else if (k === 'H') {
        useFifty();
      }
      e.stopPropagation();
    }
    document.addEventListener('keydown', onKey, true);

    if (limit) {
      timerEl.classList.remove('hidden');
      barEl.className = '';
      barEl.style.width = '100%';
      (function tick() {
        const frac = 1 - (performance.now() - t0) / limit;
        if (frac <= 0) { barEl.style.width = '0%'; return; }
        barEl.style.width = `${(frac * 100).toFixed(1)}%`;
        barEl.className = frac < 0.2 ? 'danger' : frac < 0.45 ? 'warn' : '';
        rafId = requestAnimationFrame(tick);
      })();
      timerId = setTimeout(() => choose(null, true), limit);
    } else {
      timerEl.classList.add('hidden');
    }
  });
}
