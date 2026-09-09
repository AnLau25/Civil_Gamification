/**
 * Gold Miner — the overlay screens between shifts.
 * Each one resolves a promise, so main.js reads as the loop it actually is.
 */

import { esc, money, n as fmt } from '../../core/util.js';
import * as ui from '../../core/ui.js';
import * as quiz from '../../core/quiz.js';
import { sfx } from '../../core/audio.js';
import { log } from '../../core/telemetry.js';
import { SHOP, PAYROLL, ITEMS } from './config.js';

const GAME = 'dig';

/* --------------------------------------------------------------------------
   Title
   -------------------------------------------------------------------------- */
export function showTitle(ov) {
  return new Promise(resolve => {
    ov.show(`
      <h2>Gold Miner</h2>
      <p class="lead">Drop the claw, haul the load, hit the quota before the clock runs out.</p>
      ${ui.topicsDisclosure()}
      ${ui.trackButtons()}`);

    const topics = ui.wireTopics(ov.card);
    for (const b of ov.card.querySelectorAll('[data-track]')) {
      b.onclick = async () => {
        await ui.ensureName();
        resolve({ topics: topics.get(), exam: b.dataset.track });
      };
    }
  });
}

/* --------------------------------------------------------------------------
   Payroll: push your luck
   -------------------------------------------------------------------------- */
export function showPayroll(ov, state, picker) {
  return new Promise(resolve => {
    let pot = 0, streak = 0, asked = 0, busted = false;
    const rate = () => Math.round(PAYROLL.base * (1 + PAYROLL.streakStep * streak));

    function paint() {
      ov.show(`
        <h2>Payroll</h2>
        <p class="lead">Right answer grows the pot. Wrong answer loses the whole pot.
          Bank it any time.</p>
        <div class="potbox${busted ? ' busted' : ''}">
          <div class="lbl">${busted ? 'Pot lost' : 'Pot'}</div>
          <div class="amt">${money(pot)}</div>
          <div class="nxt">${busted
            ? 'One wrong answer took it. Head to the store.'
            : `Next correct answer: about <b>+${money(Math.round(rate() * 1.6))}</b>`}</div>
        </div>
        <div class="btn-row" style="margin-bottom:4px">
          <button class="btn btn-primary" id="pAsk" type="button">Answer a question</button>
          <button class="btn btn-gold" id="pBank" type="button">${pot > 0 ? `Bank ${money(pot)}` : 'To the store'}</button>
        </div>
        <p class="hint">Banked so far <b style="color:var(--good2)">${money(state.cash)}</b>
          &nbsp;•&nbsp; question ${Math.min(asked + 1, PAYROLL.maxQuestions)} of ${PAYROLL.maxQuestions}</p>`);

      const ask = ov.$('#pAsk');
      ask.disabled = busted || asked >= PAYROLL.maxQuestions;
      if (ask.disabled) ask.textContent = busted ? 'Round over' : 'No questions left';
      ask.onclick = takeQuestion;
      ov.$('#pBank').onclick = bank;
    }

    async function takeQuestion() {
      const q = picker.next();
      const worth = rate();
      ov.hide();

      const r = await quiz.ask({
        q, game: GAME, timed: true,
        label: `Payroll ${asked + 1} of ${PAYROLL.maxQuestions}`,
        ctx: `level=${state.level};pot=${pot};streak=${streak}`,
        cta: ok => (ok ? 'Bank it or push on' : 'Back to the yard')
      });

      asked++;
      if (r.ok) {
        const gain = Math.round(worth * q.diff * 0.8);
        pot += gain;
        streak++;
        ui.toast(`+${money(gain)} in the pot`, 'good');
      } else {
        log('payroll', { g: GAME, score: 0, detail: `level=${state.level};busted=${pot};streak=${streak}` });
        ui.toast(`Pot lost: ${money(pot)}`, 'bad');
        pot = 0;
        streak = 0;
        busted = true;
      }
      paint();
    }

    function bank() {
      state.cash += pot;
      if (pot > 0) { sfx('cash'); ui.toast(`Banked ${money(pot)}`, 'gold'); }
      log('payroll', { g: GAME, score: pot, detail: `level=${state.level};banked=${pot};streak=${streak}` });
      resolve();
    }

    paint();
  });
}

/* --------------------------------------------------------------------------
   Shop
   -------------------------------------------------------------------------- */
export function showShop(ov, state, level) {
  return new Promise(resolve => {
    function paint() {
      ov.show(`
        <p class="kicker">Level ${state.level} &nbsp;•&nbsp; ${esc(level.name)}</p>
        <h2>Supply store</h2>
        <p class="lead">You have <b style="color:var(--good2)">${money(state.cash)}</b>.
          The quota this shift is <b style="color:var(--gold)">${money(level.goal)}</b> in
          ${level.time} seconds.</p>
        <div class="shopgrid">
          ${SHOP.map(it => {
            const owned = it.perm && state.perm[it.id];
            const afford = state.cash >= it.cost && !owned;
            return `
            <button type="button" class="shopitem${owned ? ' owned' : ''}" data-id="${it.id}" ${afford ? '' : 'disabled'}>
              <div class="ttl">${it.icon} ${esc(it.name)}
                ${it.perm ? '' : `<span class="own">have ${state.inv[it.id] || 0}</span>`}</div>
              <div class="dsc">${esc(it.dsc)}</div>
              <div class="prc">${owned ? 'Owned' : money(it.cost)}</div>
            </button>`;
          }).join('')}
        </div>
        <button class="btn btn-primary btn-block" id="startLvl" type="button">Head down the shaft</button>
        <p class="hint">Dynamite is the answer to a boulder on the hook. The strength drink is the answer
          to a whole level of them.</p>`);

      for (const b of ov.card.querySelectorAll('.shopitem')) {
        b.onclick = () => {
          const it = SHOP.find(x => x.id === b.dataset.id);
          if (!it || state.cash < it.cost) return;
          state.cash -= it.cost;
          if (it.perm) state.perm[it.id] = true;
          else state.inv[it.id] = (state.inv[it.id] || 0) + 1;
          log('buy', { g: GAME, detail: `level=${state.level};item=${it.id};cost=${it.cost}` });
          sfx('build');
          ui.toast(`${it.name} bought`, 'gold');
          paint();
        };
      }
      ov.$('#startLvl').onclick = () => { ov.hide(); resolve(); };
    }
    paint();
  });
}

/* --------------------------------------------------------------------------
   Level cleared
   -------------------------------------------------------------------------- */
export function showLevelCleared(ov, state, level, haul) {
  return new Promise(resolve => {
    const rows = Object.entries(haul)
      .sort((a, b) => b[1].value - a[1].value)
      .map(([type, r]) => `<span class="haulitem"><b>${r.count}x</b> ${esc(ITEMS[type].name)}
        <i>${money(r.value)}</i></span>`)
      .join('');

    ov.show(`
      <p class="kicker">Shift ${state.level} complete</p>
      <h2>${esc(level.name)} cleared</h2>
      <div class="stat-row">
        <div class="stat"><div class="k">Hauled</div><div class="v">${money(state.levelEarned)}</div></div>
        <div class="stat"><div class="k">Quota</div><div class="v">${money(level.goal)}</div></div>
        <div class="stat"><div class="k">Bonus</div><div class="v">${money(state.lastBonus)}</div></div>
      </div>
      <div class="haul">${rows || '<span class="haulitem">Nothing but dirt.</span>'}</div>
      <button class="btn btn-primary btn-block" id="next" type="button">On to level ${state.level + 1}</button>`);

    ov.$('#next').onclick = () => resolve();
  });
}

/* --------------------------------------------------------------------------
   Overtime: one question buys more clock
   -------------------------------------------------------------------------- */
export async function askOvertime(state, picker, level) {
  const q = picker.next();
  const r = await quiz.ask({
    q, game: GAME, timed: true,
    label: 'Whistle blown — one question for overtime',
    ctx: `level=${state.level};overtime;short=${Math.max(0, level.goal - state.levelEarned)}`,
    cta: ok => (ok ? 'Back down the shaft' : 'Hand in the hard hat')
  });
  return r.ok;
}

/* --------------------------------------------------------------------------
   Mystery bag
   -------------------------------------------------------------------------- */
export async function askBag(state, picker) {
  const q = picker.next();
  const r = await quiz.ask({
    q, game: GAME, timed: true,
    label: 'Mystery bag — answer to see what is inside',
    ctx: `level=${state.level};bag`,
    cta: ok => (ok ? 'Open it' : 'Tip it out')
  });
  return r.ok;
}
