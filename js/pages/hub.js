/**
 * hub.js — the main menu.
 *
 * Two jobs. First, draw the three card thumbnails with the same code the games
 * use, so a change to the excavator or a treatment unit shows up here without a
 * second asset to keep in sync. Second, run the sheets: How to play, the
 * leaderboard and About are screens in this page rather than separate files, so
 * opening one is instant and works with no network.
 */

import { boot, GAMES, KEYS, bank, scores, telemetry, history, player, util } from '../core/app.js';
import { remove } from '../core/storage.js';
import { drawExcavator } from '../games/excavator/machine.js';
import { drawMachine } from '../games/defense/machines.js';
import { draw as drawLoot } from '../games/goldminer/items.js';
import { roundRect } from '../core/util.js';

boot('doc');

/* --------------------------------------------------------------------------
   Best score badge on each play button
   -------------------------------------------------------------------------- */
for (const g of GAMES) {
  const badge = document.querySelector(`[data-best="${g.id}"]`);
  if (!badge) continue;
  /* An empty menu should not be three loud "not played yet" chips. The badge
     only earns its space once there is a score in it. */
  const best = scores.best(g.id);
  if (!best) continue;
  badge.textContent = `best ${util.n(best)}`;
  badge.classList.remove('hidden');
}

/* --------------------------------------------------------------------------
   Card thumbnails
   -------------------------------------------------------------------------- */
const THUMBS = {
  excavator(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0b2145');
    sky.addColorStop(1, '#2b3f6b');
    ctx.fillStyle = sky;
    roundRect(ctx, 0, 0, w, h, 10);
    ctx.fill();

    const groundY = h * 0.78;
    ctx.fillStyle = '#2b3547';
    ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = '#f2b01e';
    for (let x = 4; x < w; x += 18) ctx.fillRect(x, groundY + 8, 8, 2);

    ctx.fillStyle = '#0a1424';
    for (const [bx, bw, bh] of [[6, 14, 22], [24, 10, 14], [66, 16, 26], [84, 9, 16]]) {
      ctx.fillRect(bx, groundY - bh, bw, bh);
    }
    drawExcavator(ctx, { left: w * 0.30, bottom: groundY, unit: 11, band: 70, height: 0 },
                  { heat: 0, spin: 0.6, flashing: false });
  },

  miner(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.34);
    sky.addColorStop(0, '#12203c');
    sky.addColorStop(1, '#7b5a86');
    ctx.fillStyle = sky;
    roundRect(ctx, 0, 0, w, h, 10);
    ctx.fill();
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.34);

    const dirt = ctx.createLinearGradient(0, h * 0.34, 0, h);
    dirt.addColorStop(0, '#7a4f24');
    dirt.addColorStop(1, '#3a2513');
    ctx.save();
    roundRect(ctx, 0, 0, w, h, 10);
    ctx.clip();
    ctx.fillStyle = dirt;
    ctx.fillRect(0, h * 0.34, w, h);

    /* winch deck and rope */
    ctx.fillStyle = '#6b7683';
    roundRect(ctx, w / 2 - 13, h * 0.28, 26, 7, 2);
    ctx.fill();
    ctx.fillStyle = '#e0b93c';
    ctx.fillRect(w / 2 - 13, h * 0.32, 26, 2);
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.36);
    ctx.lineTo(w * 0.62, h * 0.60);
    ctx.stroke();

    /* claw */
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.60);
      ctx.quadraticCurveTo(w * 0.62 + dir * 6, h * 0.67, w * 0.62 + dir * 4, h * 0.73);
      ctx.stroke();
    }

    /* the same loot the game draws, so the card cannot drift from the game */
    const buried = [
      { kind: 'gold',    type: 'goldM',   x: w * 0.22, y: h * 0.70, r: 9,  seed: 4 },
      { kind: 'gold',    type: 'goldL',   x: w * 0.82, y: h * 0.55, r: 11, seed: 9 },
      { kind: 'diamond', type: 'diamond', x: w * 0.48, y: h * 0.88, r: 8,  seed: 2 }
    ];
    for (const it of buried) drawLoot(ctx, it, 0.4);
    ctx.restore();
  },

  defense(ctx, w, h) {
    ctx.fillStyle = '#1d3020';
    roundRect(ctx, 0, 0, w, h, 10);
    ctx.fill();

    ctx.save();
    roundRect(ctx, 0, 0, w, h, 10);
    ctx.clip();

    /* channel */
    ctx.strokeStyle = '#4a5561';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, h * 0.26); ctx.lineTo(w * 0.72, h * 0.26);
    ctx.lineTo(w * 0.72, h * 0.74); ctx.lineTo(w + 4, h * 0.74);
    ctx.stroke();
    ctx.strokeStyle = '#1f7ae0';
    ctx.lineWidth = 11;
    ctx.stroke();

    ctx.translate(w * 0.30, h * 0.66);
    drawMachine(ctx, 'clarifier', 44, { a: 1, b: 1 }, 0.8, 0);
    ctx.restore();
  }
};

/* The thumbnail drawings were authored in a 96-wide logical space. The card
   decides the on-screen size in CSS, so measure it, give the canvas a backing
   store to match and scale the context: the art stays identical and crisp at
   any card width instead of being a stretched 96px bitmap. */
const LOGICAL_W = 96;

function paintThumbs() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  for (const btn of document.querySelectorAll('[data-thumb]')) {
    const canvas = btn.querySelector('.thumb');
    const kind = btn.dataset.thumb;
    if (!canvas || !THUMBS[kind]) continue;

    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || 240;
    const cssH = rect.height || 170;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    const ctx = canvas.getContext('2d');
    const k = (cssW * dpr) / LOGICAL_W;
    ctx.scale(k, k);
    THUMBS[kind](ctx, LOGICAL_W, (cssH / cssW) * LOGICAL_W);
  }
}
paintThumbs();

/* Repaint when the window is resized enough to change the card width. */
let thumbW = 0;
new ResizeObserver(entries => {
  const w = Math.round(entries[0].contentRect.width);
  if (Math.abs(w - thumbW) > 4) { thumbW = w; paintThumbs(); }
}).observe(document.querySelector('.playlist'));

/* --------------------------------------------------------------------------
   About: the figures, then the bank note
   -------------------------------------------------------------------------- */
const summary = telemetry.summary();
const topics = bank.topics().length;

const FACTS = [
  { v: bank.count, k: 'questions' },
  { v: topics, k: 'FE topics' },
  { v: 2, k: 'exam tracks', cls: 'green' },
  summary.answers
    ? { v: `${summary.pct}%`, k: 'your accuracy', cls: 'gold' }
    : { v: '2 to 5', k: 'minutes a round', cls: 'gold' }
];

document.getElementById('facts').innerHTML = FACTS
  .map(f => `<div class="fact ${f.cls || ''}"><b>${util.esc(String(f.v))}</b><small>${f.k}</small></div>`)
  .join('');

document.getElementById('bankNote').textContent =
  `Question bank version ${bank.meta.version || '1'}.`;

/* --------------------------------------------------------------------------
   Leaderboard
   -------------------------------------------------------------------------- */
const tabsEl = document.getElementById('tabs');
const boardEl = document.getElementById('board');
let active = GAMES[0].id;

function paintTabs() {
  tabsEl.innerHTML = '';
  for (const g of GAMES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = g.name;
    b.className = active === g.id ? 'on' : '';
    b.onclick = () => { active = g.id; paintTabs(); scores.render(boardEl, active, 15); };
    tabsEl.appendChild(b);
  }
}
paintTabs();
scores.render(boardEl, active, 15);

/* --------------------------------------------------------------------------
   My progress sheet. Repainted on every open, so the numbers are always the
   numbers as of right now.
   -------------------------------------------------------------------------- */
function renderProgress() {
  const sum = telemetry.summary();
  document.getElementById('sum').innerHTML = [
    ['Answered', util.n(sum.answers)],
    ['Accuracy', sum.answers ? `${sum.pct}%` : '—'],
    ['Avg time', sum.answers ? `${sum.avgSec}s` : '—'],
    ['Sessions', util.n(sum.runs)]
  ].map(([k, v]) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');

  const mastery = telemetry.mastery();
  document.getElementById('mastery').innerHTML = mastery.length
    ? mastery.map(r => {
        const cls = r.pct >= 75 ? '' : r.pct >= 50 ? 'mid' : 'low';
        return `
          <div class="mrow">
            <span class="nm">${util.esc(r.label)}</span>
            <span class="bar"><i class="${cls}" style="width:${r.pct}%"></i></span>
            <span class="pc">${r.pct}% • ${r.n}</span>
          </div>`;
      }).join('')
    : '<p class="lb-empty">Nothing yet. Play a few rounds and this fills in on its own.</p>';

  document.getElementById('bests').innerHTML = GAMES.map(g => {
    const b = scores.best(g.id);
    return `
      <div class="mrow">
        <span class="nm">${util.esc(g.name)}</span>
        <span class="pc" style="flex:0 0 auto">${b ? util.n(b) : 'not played'}</span>
      </div>`;
  }).join('');

  const pl = player.get();
  document.getElementById('evcount').textContent =
    `${telemetry.all().length} events stored. Player id ${pl.pid}` +
    `${pl.section ? `, section ${pl.section}` : ''}.`;
}

document.getElementById('dl').onclick = () => telemetry.download();
document.getElementById('reset').onclick = () => {
  const sure = confirm(
    'Delete all of your stored answers, scores and progress on this device? This cannot be undone.'
  );
  if (!sure) return;
  telemetry.clear();
  history.reset();
  remove(KEYS.scores);
  location.reload();
};

/* --------------------------------------------------------------------------
   Sheets
   -------------------------------------------------------------------------- */
let openSheet = null;

function open(name) {
  const el = document.getElementById(`sheet-${name}`);
  if (!el) return;
  close();
  if (name === 'progress') renderProgress();
  el.classList.remove('hidden');
  el.querySelector('.sheetbody').scrollTop = 0;
  document.body.style.overflow = 'hidden';
  openSheet = el;
  /* Move focus into the sheet so a keyboard or screen reader follows it. */
  el.querySelector('.sheetx')?.focus();
}

function close() {
  if (!openSheet) return;
  openSheet.classList.add('hidden');
  openSheet = null;
  document.body.style.overflow = '';
}

for (const b of document.querySelectorAll('[data-open]')) {
  b.addEventListener('click', () => open(b.dataset.open));
}
for (const b of document.querySelectorAll('[data-close]')) {
  b.addEventListener('click', close);
}
/* A click on the dimmed backdrop, outside the panel, also closes. */
for (const s of document.querySelectorAll('.sheet')) {
  s.addEventListener('click', e => { if (e.target === s) close(); });
}
window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

/* data.html redirects here with #progress, so old links still land somewhere. */
if (location.hash === '#progress') open('progress');
