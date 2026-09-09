/**
 * Gold Miner — game controller.
 *
 * The shape of a run:
 *   title -> [ payroll -> shop -> shift ] repeated -> game over
 * Each screen resolves a promise, so the loop below is the actual loop.
 */

import { boot, Stage, Loop, picker as pickerFactory, ui, quiz, scores, audio, onPause, log, util }
  from '../../core/app.js';
import { levelSpec, SHOP, BAG_GOOD, BAG_BAD, TUNING, ITEMS } from './config.js';
import { spawn, draw as drawItem } from './items.js';
import { Hook, State } from './hook.js';
import { makeScene, drawBackground, drawRig, drawHook, drawFx, drawSwingGuide } from './render.js';
import { showTitle, showPayroll, showShop, showLevelCleared, askOvertime, askBag } from './screens.js';

const GAME = 'dig';
const { money, n: fmt, clock, weightedPick, rand, clamp } = util;

boot(GAME);

/* --------------------------------------------------------------------------
   DOM
   -------------------------------------------------------------------------- */
const stageEl = document.getElementById('stage');
const ov = ui.overlay(document.getElementById('ovl'), document.getElementById('ovlCard'));
const hud = {
  level: document.getElementById('lvlEl'),
  cash:  document.getElementById('cashEl'),
  goal:  document.getElementById('goalEl'),
  bar:   document.getElementById('goalBar'),
  time:  document.getElementById('timeEl')
};
const tntBtn = document.getElementById('tntBtn');

const canvas = new Stage(document.getElementById('game'), () => {
  scene = makeScene(canvas);
  hook?.setScene(scene);
});
const ctx = canvas.ctx;
let scene = makeScene(canvas);

/* --------------------------------------------------------------------------
   Run state
   -------------------------------------------------------------------------- */
let state = null;
let hook = null;
let picker = null;
let items = [];
let fx = [];
let level = null;
let phase = 'menu';              // menu | shift | paused
let resolveShift = null;
let elapsed = 0;
let cartShake = 0;
let guideAlpha = 0;

function newRun(filters) {
  return {
    filters,
    level: 1,
    cash: 0,
    score: 0,
    totalHauled: 0,
    inv: {},
    perm: {},
    boosts: {},               // per level: drink, clover, watch, book
    levelEarned: 0,
    lastBonus: 0,
    haul: {},
    timeLeft: 0,
    overtimeUsed: false,
    startedAt: Date.now()
  };
}

/* --------------------------------------------------------------------------
   Input
   -------------------------------------------------------------------------- */
stageEl.addEventListener('pointerdown', e => {
  if (phase !== 'shift' || quiz.isOpen() || ov.isOpen) return;
  if (e.target.closest('#tntBtn')) return;
  e.preventDefault();
  drop();
}, { passive: false });

window.addEventListener('keydown', e => {
  if (quiz.isOpen()) return;
  if (e.code === 'Space' || e.code === 'ArrowDown' || e.key === ' ') {
    e.preventDefault();
    if (phase === 'shift' && !ov.isOpen) drop();
  }
});

tntBtn.addEventListener('click', e => { e.stopPropagation(); useDynamite(); });

function drop() {
  if (hook.shoot()) { guideAlpha = 0; audio.sfx('drop'); }
}

onPause(() => { if (phase === 'shift') pauseShift(); });

/* The ? button. Opening it during a shift freezes the clock. */
document.getElementById('help').onclick = () => {
  const wasShift = phase === 'shift';
  if (wasShift) phase = 'menu';
  ui.helpModal(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#fff">Gold Miner</h2>
    <p class="expl">Tap, or press space, to drop the claw. It hauls back whatever it grabs.
      Heavy things come back slowly, so choosing what to grab is the whole game.</p>
    <p class="expl">Hit the money quota before the clock runs out. Between shifts, the payroll:
      each correct answer grows the pot, one wrong answer wipes whatever is not banked.</p>
    <p class="expl">Banked money buys dynamite, a strength drink and the rest in the supply store.</p>
  `, { onClose: () => { if (wasShift) { phase = 'shift'; loop.resetClock(); } } });
};

function pauseShift() {
  phase = 'paused';
  ov.show(`
    <h2 class="center">Paused</h2>
    <p class="lead center">The clock is stopped. Nothing is lost.</p>
    <button class="btn btn-primary btn-block" id="res" type="button">Back to work</button>`);
  ov.$('#res').onclick = () => { ov.hide(); phase = 'shift'; loop.resetClock(); };
}

/* --------------------------------------------------------------------------
   A shift
   -------------------------------------------------------------------------- */
function startShift() {
  level = levelSpec(state.level);
  scene = makeScene(canvas);

  hook = new Hook(scene);
  hook.reset();
  hook.swingSpeed = Math.min(
    TUNING.swingSpeedMax,
    TUNING.swingSpeed + (state.level - 1) * TUNING.swingRamp
  );
  hook.strengthMul =
    (state.boosts.drink ? 1.45 : 1) *
    (state.perm.rope ? 1.20 : 1);

  items = spawn(level.mix, scene);
  fx = [];
  state.levelEarned = 0;
  state.haul = {};
  state.timeLeft = level.time + (state.boosts.watch ? 20 : 0);
  state.overtimeUsed = false;
  elapsed = 0;
  guideAlpha = 1;
  phase = 'shift';
  loop.resetClock();

  log('level', {
    g: GAME,
    detail: `start;level=${state.level};goal=${level.goal};items=${items.length};` +
            `boosts=${Object.keys(state.boosts).join('|') || 'none'}`
  });
  ui.toast(`Level ${state.level}: ${level.name}`, 'gold', 2000);
  paintHud();
  paintTnt();

  return new Promise(resolve => { resolveShift = resolve; });
}

function endShift(result) {
  phase = 'menu';
  const r = resolveShift;
  resolveShift = null;
  r?.(result);
}

/* --------------------------------------------------------------------------
   Hauling
   -------------------------------------------------------------------------- */
async function onLanded(item) {
  cartShake = 0.45;

  if (item.question) { await openBag(item); return; }

  let value = item.value;
  if (item.kind === 'rock' && state.boosts.book) value *= 3;
  if (item.kind === 'diamond' && state.perm.polish) value = Math.round(value * 1.6);

  bank(value, item);
  audio.sfx(value >= 250 ? 'cash' : 'coin');
  checkQuota();
}

function bank(value, item) {
  state.levelEarned += value;
  state.totalHauled += value;

  if (item) {
    const row = state.haul[item.type] || (state.haul[item.type] = { count: 0, value: 0 });
    row.count++;
    row.value += value;
  }

  fx.push({
    kind: 'value',
    text: `+${money(value)}`,
    colour: value >= 250 ? '#fde68a' : value >= 60 ? '#a7f3d0' : '#cbd5e1',
    x: scene.pivot.x - scene.unit * 0.175,
    y: scene.surfaceY - scene.unit * 0.09,
    t: 0, life: 1.1
  });
  paintHud();
}

async function openBag(item) {
  const wasPlaying = phase;
  phase = 'menu';                       // freeze the clock while the modal is up
  const correct = await askBag(state, picker);
  phase = wasPlaying;
  loop.resetClock();

  const table = (correct || state.boosts.clover) ? BAG_GOOD : BAG_BAD;
  const prize = weightedPick(table, p => p.w);
  const at = { x: scene.pivot.x - scene.unit * 0.175, y: scene.surfaceY - scene.unit * 0.09 };

  switch (prize.kind) {
    case 'cash':
    case 'jackpot': {
      const v = Math.round(rand(prize.min, prize.max));
      bank(v, item);
      ui.toast(prize.kind === 'jackpot' ? `Jackpot bag: ${money(v)}` : `Bag: ${money(v)}`, 'gold', 2200);
      break;
    }
    case 'diamond': {
      const v = Math.round(ITEMS.diamond.value * (state.perm.polish ? 1.6 : 1));
      bank(v, { type: 'diamond' });
      ui.toast(`Bag: a diamond, ${money(v)}`, 'gold', 2200);
      break;
    }
    case 'time': {
      state.timeLeft += prize.seconds;
      fx.push({ kind: 'value', text: `+${prize.seconds}s`, colour: '#93c5fd', ...at, t: 0, life: 1.1 });
      ui.toast(`Bag: ${prize.seconds} extra seconds`, 'good', 2200);
      break;
    }
    case 'tool': {
      const tool = util.pick(SHOP.filter(s => !s.perm));
      state.inv[tool.id] = (state.inv[tool.id] || 0) + 1;
      if (tool.id === 'drink') hook.strengthMul *= 1.45;
      if (tool.id === 'watch') state.timeLeft += 20;
      if (tool.id === 'clover') state.boosts.clover = true;
      if (tool.id === 'book') state.boosts.book = true;
      ui.toast(`Bag: a free ${tool.name}`, 'gold', 2200);
      paintTnt();
      break;
    }
    default: {
      bank(6, item);
      ui.toast('Bag: a handful of gravel', 'bad', 1800);
    }
  }

  paintHud();
  checkQuota();
}

function checkQuota() {
  if (state.levelEarned < level.goal) return;
  audio.sfx('levelup');
  state.lastBonus = 300 + state.level * 120 + Math.round(state.timeLeft) * 18;
  state.score += state.levelEarned + state.lastBonus;
  state.cash += Math.round(state.levelEarned * 0.45);
  log('level', {
    g: GAME, score: state.levelEarned + state.lastBonus,
    detail: `cleared;level=${state.level};timeLeft=${Math.round(state.timeLeft)}`
  });
  endShift('cleared');
}

/* --------------------------------------------------------------------------
   Dynamite
   -------------------------------------------------------------------------- */
function useDynamite() {
  if (phase !== 'shift' || !state.inv.tnt || hook.state !== State.PULL || !hook.grabbed) return;
  const item = hook.blastLoad();
  if (!item) return;

  state.inv.tnt--;
  audio.sfx('blast');
  const salvage = Math.round(item.value * 0.25);
  fx.push({ kind: 'blast', x: item.x, y: item.y, t: 0, life: 0.5 });
  if (salvage > 0) bank(salvage, null);
  log('tool', { g: GAME, detail: `dynamite;level=${state.level};item=${item.type}` });
  ui.toast(salvage > 0 ? `Blasted, salvaged ${money(salvage)}` : 'Blasted clear', 'gold');
  paintTnt();
  checkQuota();
}

function paintTnt() {
  const count = state?.inv?.tnt || 0;
  tntBtn.textContent = `🧨 ${count}`;
  tntBtn.classList.toggle('hidden', count <= 0);
  tntBtn.disabled = !(hook && hook.state === State.PULL && hook.grabbed);
}

/* --------------------------------------------------------------------------
   HUD
   -------------------------------------------------------------------------- */
function paintHud() {
  if (!state) return;
  hud.level.textContent = state.level;
  hud.cash.textContent = money(state.cash);
  if (level) {
    hud.goal.textContent = `${money(state.levelEarned)}/${money(level.goal)}`;
    const pct = clamp((state.levelEarned / level.goal) * 100, 0, 100);
    hud.bar.style.width = `${pct}%`;
    hud.bar.className = pct >= 100 ? '' : pct > 55 ? '' : pct > 25 ? 'warn' : 'bad';
    hud.time.textContent = clock(state.timeLeft);
    hud.time.style.color = state.timeLeft <= 10 ? 'var(--bad2)' : '#fff';
  } else {
    hud.goal.textContent = '—';
    hud.bar.style.width = '0%';
    hud.time.textContent = '—';
  }
}

/* --------------------------------------------------------------------------
   Frame
   -------------------------------------------------------------------------- */
const loop = new Loop(dt => {
  elapsed += dt;
  if (cartShake > 0) cartShake = Math.max(0, cartShake - dt);
  if (guideAlpha > 0 && hook?.isBusy) guideAlpha = Math.max(0, guideAlpha - dt * 2);

  const active = phase === 'shift' && !quiz.isOpen() && !ov.isOpen;

  if (active) {
    state.timeLeft -= dt;
    hook.update(dt, items, {
      onGrab: it => {
        fx.push({ kind: 'dust', x: it.x, y: it.y, t: 0, life: 0.45 });
        audio.sfx('grab');
        paintTnt();
      },
      onEmpty: () => paintTnt(),
      onLanded: it => {
        items = items.filter(o => o !== it);
        paintTnt();
        onLanded(it);
      }
    });
    if (hook.state !== State.PULL) paintTnt();

    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      handleTimeUp();
    }
    paintHud();
  }

  for (let i = fx.length - 1; i >= 0; i--) {
    fx[i].t += dt;
    if (fx[i].t > fx[i].life) fx.splice(i, 1);
  }

  render();
});

let handlingTimeUp = false;
async function handleTimeUp() {
  if (handlingTimeUp) return;
  handlingTimeUp = true;

  if (!state.overtimeUsed) {
    state.overtimeUsed = true;
    phase = 'menu';
    const ok = await askOvertime(state, picker, level);
    if (ok) {
      state.timeLeft = 20;
      phase = 'shift';
      loop.resetClock();
      ui.toast('Overtime approved, twenty more seconds', 'good');
      handlingTimeUp = false;
      paintHud();
      return;
    }
  }
  handlingTimeUp = false;
  endShift('failed');
}

function render() {
  canvas.clear();
  drawBackground(ctx, scene, elapsed);

  if (phase === 'menu' && !state) {
    /* idle attract state behind the title card */
    drawRig(ctx, scene, { pulling: false, cartShake: 0, time: elapsed });
    return;
  }

  for (const it of items) if (!it.taken || hook.grabbed === it) drawItem(ctx, it, elapsed);

  drawSwingGuide(ctx, scene, guideAlpha);
  drawHook(ctx, scene, hook);
  if (hook.grabbed) drawItem(ctx, hook.grabbed, elapsed);
  drawRig(ctx, scene, { pulling: hook.state === State.PULL, cartShake, time: elapsed });
  drawFx(ctx, scene, fx);
}

/* --------------------------------------------------------------------------
   Run
   -------------------------------------------------------------------------- */
async function runGame() {
  phase = 'menu';
  state = null;
  level = null;
  items = [];
  hook = new Hook(scene);
  paintHud();
  tntBtn.classList.add('hidden');

  const filters = await showTitle(ov);
  state = newRun(filters);
  picker = pickerFactory.create(filters);
  log('start', {
    g: GAME,
    detail: `topics=${filters.topics.join('|') || 'all'};exam=${filters.exam || 'both'}`
  });

  while (true) {
    state.boosts = {};
    await showPayroll(ov, state, picker);
    const spec = levelSpec(state.level);
    await showShop(ov, state, spec);

    /* consumables bought in the shop apply to this shift only */
    for (const id of ['drink', 'clover', 'watch', 'book']) {
      if (state.inv[id] > 0) { state.inv[id]--; state.boosts[id] = true; }
    }

    const outcome = await startShift();
    if (outcome === 'failed') break;

    await showLevelCleared(ov, state, spec, state.haul);
    state.level++;
  }

  finish();
}

function finish() {
  phase = 'menu';
  audio.sfx('gameover');
  state.score += Math.round(state.cash * 0.35);
  log('end', {
    g: GAME, score: state.score,
    detail: `level=${state.level};hauled=${state.totalHauled};cash=${state.cash};` +
            `sec=${Math.round((Date.now() - state.startedAt) / 1000)}`
  });
  ov.hide();
  tntBtn.classList.add('hidden');

  ui.gameOver({
    game: GAME,
    title: 'Shift over',
    blurb: `You came up short on level ${state.level}. Heavy rock eats the clock, so leave the boulders ` +
           `unless you bought the collector book, and spend the payroll on a strength drink when the ` +
           `shaft is full of them.`,
    score: state.score,
    stats: [
      { k: 'Score', v: fmt(state.score) },
      { k: 'Level', v: String(state.level) },
      { k: 'Hauled', v: money(state.totalHauled) }
    ],
    meta: { level: state.level, hauled: state.totalHauled },
    onReplay: runGame
  });
}

/* Opt in debug handle for balancing and for the smoke test: open dig.html#debug.
   `aimed` is the honest answer to "would dropping right now catch something",
   which is what an automated test needs. A test that taps on a fixed timer
   locks to the swing period and misses everything, which looks like a broken
   game when it is only a broken harness. */
if (location.hash === '#debug') {
  window.__dig = {
    get state() { return phase; },
    get hook() { return hook; },
    get items() { return items; },
    get scene() { return scene; },
    aimed() {
      if (phase !== 'shift' || !hook || hook.isBusy) return false;
      const { pivot } = scene;
      return items.some(it => {
        if (it.taken) return false;
        const dx = it.x - pivot.x, dy = it.y - pivot.y;
        const a = Math.atan2(dx, dy);
        /* the real angular half-width of the item from the pivot, so a hit at
           this angle is geometry rather than luck */
        const halfWidth = Math.atan2(it.r * 0.85, Math.hypot(dx, dy));
        return Math.abs(a - hook.angle) <= halfWidth;
      });
    }
  };
}

loop.start();
runGame();
