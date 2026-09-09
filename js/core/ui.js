/**
 * ui.js — shared chrome: toasts, the name prompt, the topic chooser,
 * the end of run card, and the overlay helper the games drive their
 * start / shop / results screens with.
 */

import { esc } from './util.js';
import * as player from './player.js';
import * as bank from './bank.js';
import * as scores from './scores.js';

/* --------------------------------------------------------------------------
   Toast
   -------------------------------------------------------------------------- */
const MAX_TOASTS = 2;

export function toast(message, kind = '', ms = 1400) {
  let host = document.getElementById('feToast');
  if (!host) {
    host = document.createElement('div');
    host.id = 'feToast';
    document.body.appendChild(host);
  }
  /* Repeating the same message twice in a row is noise, not information. */
  const last = host.lastElementChild;
  if (last && last.textContent === message) return;
  while (host.children.length >= MAX_TOASTS) host.removeChild(host.firstChild);

  const el = document.createElement('div');
  el.className = kind;
  el.textContent = message;
  host.appendChild(el);

  setTimeout(() => {
    el.style.transition = 'opacity .28s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, ms);
}

/* --------------------------------------------------------------------------
   Player name chip in the top bar, plus the prompt that fills it
   -------------------------------------------------------------------------- */
export function paintWho() {
  const el = document.getElementById('who');
  if (!el) return;
  const p = player.get();
  el.innerHTML = p.alias ? `<b>${esc(p.alias)}</b>` : 'Set name';
  el.setAttribute('aria-label', 'Change player name');
  el.onclick = () => promptForName('Update your name or section.');
}
player.onChange(paintWho);

export function promptForName(message) {
  return new Promise(resolve => {
    const p = player.get();
    const box = document.createElement('div');
    box.id = 'feQuiz';
    box.innerHTML = `
      <div class="qcard" style="max-width:420px">
        <p class="qlabel">Player profile</p>
        <p class="qtext" style="font-size:16px;margin-bottom:14px">${
          esc(message || 'Pick a name for the leaderboard.')}</p>
        <div class="field">
          <label for="feAlias">Your name</label>
          <input id="feAlias" maxlength="18" autocomplete="off" autocapitalize="words"
                 enterkeyhint="done" placeholder="e.g. Anh Chau" value="${esc(p.alias)}">
        </div>
        <div class="field">
          <label for="feSection">Section code</label>
          <input id="feSection" maxlength="16" autocomplete="off" autocapitalize="characters"
                 enterkeyhint="done" placeholder="e.g. CEG3011-01" value="${esc(p.section)}">
          <p class="help">Use your real name and section code so your scores and progress
             count for your class.</p>
        </div>
        <button class="btn btn-primary btn-block" id="feSaveName">Save and play</button>
      </div>`;
    document.body.appendChild(box);

    const alias = box.querySelector('#feAlias');
    const section = box.querySelector('#feSection');
    setTimeout(() => { alias.focus(); alias.select(); }, 60);

    const done = () => {
      const a = alias.value.trim().slice(0, 18);
      if (!a) { alias.focus(); alias.style.borderColor = 'var(--bad)'; return; }
      player.save({ alias: a, section: section.value.trim().slice(0, 16) });
      box.remove();
      resolve(player.get());
    };

    box.querySelector('#feSaveName').addEventListener('click', done);
    for (const input of [alias, section]) {
      input.addEventListener('keydown', e => { if (e.key === 'Enter') done(); });
    }
  });
}

/** Resolve once the player has a name, prompting only if they do not. */
export function ensureName() {
  return player.hasName()
    ? Promise.resolve(player.get())
    : promptForName('Enter your name before you start.');
}

/* --------------------------------------------------------------------------
   Topic chooser
   -------------------------------------------------------------------------- */
export function topicChooser(el, { exam = null, initial = [], onChange } = {}) {
  let chosen = initial.slice();
  const list = bank.topics(exam);

  function paint() {
    el.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.textContent = 'All topics';
    allBtn.className = chosen.length ? '' : 'on';
    allBtn.onclick = () => { chosen = []; paint(); onChange?.(chosen); };
    el.appendChild(allBtn);

    for (const t of list) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `${t.label} ${t.n}`;
      b.className = chosen.includes(t.key) ? 'on' : '';
      b.onclick = () => {
        const i = chosen.indexOf(t.key);
        if (i >= 0) chosen.splice(i, 1); else chosen.push(t.key);
        paint();
        onChange?.(chosen);
      };
      el.appendChild(b);
    }
  }

  paint();
  return { get: () => chosen.slice() };
}

/**
 * The compact, optional topic filter every start screen uses: one folded line
 * that only becomes a chip grid if the player actually wants to drill topics.
 * Markup from topicsDisclosure(), wiring from wireTopics().
 */
export function topicsDisclosure() {
  return `
    <details class="topt">
      <summary>Topics: <b id="toptLabel">all</b></summary>
      <div class="topicgrid" id="topicGrid"></div>
    </details>`;
}

export function wireTopics(card) {
  const label = card.querySelector('#toptLabel');
  return topicChooser(card.querySelector('#topicGrid'), {
    onChange: sel => { label.textContent = sel.length ? `${sel.length} chosen` : 'all'; }
  });
}

/**
 * The two big start buttons. Picking a track IS starting the game, which keeps
 * the start screen at one decision.
 */
export function trackButtons({ recommend = '' } = {}) {
  const btn = (track, name) => `
    <button class="trackbtn ${track}" id="track${track === 'civil' ? 'Civil' : 'Env'}"
            data-track="${track}" type="button">
      <b>${name}</b>
      ${recommend === track ? '<small>recommended</small>' : '<small>start</small>'}
    </button>`;
  const order = recommend === 'env'
    ? btn('env', 'FE Environmental') + btn('civil', 'FE Civil')
    : btn('civil', 'FE Civil') + btn('env', 'FE Environmental');
  return `<div class="trackrow">${order}</div>`;
}

/* --------------------------------------------------------------------------
   Help modal: the ? button in every game opens this. It sits above the game
   in its own layer so it never disturbs whatever overlay card is open.
   -------------------------------------------------------------------------- */
export function helpModal(html, { onClose } = {}) {
  if (document.getElementById('feHelp')) return;
  const box = document.createElement('div');
  box.id = 'feHelp';
  box.innerHTML = `
    <div class="qcard" style="max-width:560px">
      <div class="helphead">
        <p class="qlabel" style="margin:0">How to play</p>
        <button class="helpx" id="feHelpX" type="button" aria-label="Close">&times;</button>
      </div>
      ${html}
      <button class="btn btn-primary btn-block" id="feHelpGo" type="button" style="margin-top:14px">Back to the game</button>
    </div>`;
  document.body.appendChild(box);

  const close = () => { box.remove(); window.removeEventListener('keydown', onKey); onClose?.(); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  box.querySelector('#feHelpX').onclick = close;
  box.querySelector('#feHelpGo').onclick = close;
  box.addEventListener('click', e => { if (e.target === box) close(); });
  window.addEventListener('keydown', onKey);
}

/* --------------------------------------------------------------------------
   Overlay helper. Each game has one .overlay with one .card inside it, and
   swaps the card contents for the start screen, shop, results and so on.
   -------------------------------------------------------------------------- */
export function overlay(overlayEl, cardEl) {
  return {
    el: overlayEl,
    card: cardEl,
    show(html) { cardEl.innerHTML = html; overlayEl.classList.remove('hidden'); cardEl.scrollTop = 0; },
    hide() { overlayEl.classList.add('hidden'); },
    get isOpen() { return !overlayEl.classList.contains('hidden'); },
    $(sel) { return cardEl.querySelector(sel); }
  };
}

/* --------------------------------------------------------------------------
   End of run card: stats, name entry if missing, score submit, leaderboard
   -------------------------------------------------------------------------- */
export function gameOver({ game, title, blurb, score, stats = [], meta = {}, onReplay }) {
  const el = document.createElement('div');
  el.id = 'feQuiz';

  el.innerHTML = `
    <div class="qcard" style="max-width:480px">
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#fff">${esc(title || 'Run over')}</h2>
      <p class="expl" style="margin:0 0 16px">${esc(blurb || '')}</p>
      <div class="stat-row">${stats.map(s => `
        <div class="stat"><div class="k">${esc(s.k)}</div><div class="v">${esc(s.v)}</div></div>`).join('')}
      </div>
      <div class="btn-row" style="margin-bottom:16px">
        <button class="btn btn-primary" id="feGoReplay" type="button">Play again</button>
        <a class="btn btn-ghost" href="index.html">Main Menu</a>
      </div>
      <p class="qlabel" style="color:var(--muted);margin:0 0 6px">Leaderboard</p>
      <div class="board" id="feGoBoard"></div>
    </div>`;
  document.body.appendChild(el);

  /* The score posts itself. The leaderboard keeps one row per player, the
     best one, so replaying can only ever move a name up. */
  const board = el.querySelector('#feGoBoard');
  scores.submit(game, score, meta).then(() => scores.render(board, game, 10));

  el.querySelector('#feGoReplay').onclick = () => { el.remove(); onReplay?.(); };
  return el;
}
