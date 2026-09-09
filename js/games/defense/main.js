/**
 * Watershed Defense — game controller.
 */

import { boot, Stage, Loop, picker as pickerFactory, ui, quiz, audio, onPause, log, util }
  from '../../core/app.js';
import { UNITS, UNIT_ORDER, UPGRADES, RULES, POLLUTANTS, waveDefinition } from './config.js';
import { buildGrid, cellAt } from './grid.js';
import { World, canUpgrade, nextUpgrade, investedIn } from './world.js';
import { machineIcon } from './machines.js';
import {
  drawSite, drawChannel, drawBuildHints, drawRange,
  drawTower, drawEnemy, drawEffects, drawDamageVignette
} from './render.js';
import { showTitle, showGrantRound, askConsentOrder, helpHtml } from './screens.js';

const GAME = 'defense';
const { esc, money, n: fmt, clamp } = util;

boot(GAME);

/* --------------------------------------------------------------------------
   DOM
   -------------------------------------------------------------------------- */
const stageEl = document.getElementById('stage');
const ov = ui.overlay(document.getElementById('ovl'), document.getElementById('ovlCard'));
const paletteEl = document.getElementById('palette');
const panelEl = document.getElementById('twpanel');
const wavePreviewEl = document.getElementById('wavePreview');
const waveBar = document.getElementById('wavebar');
const nextWaveBtn = document.getElementById('nextWave');
const speedBtn = document.getElementById('speedBtn');
const hud = {
  budget: document.getElementById('budgetEl'),
  wave: document.getElementById('waveEl'),
  quality: document.getElementById('wqEl'),
  bar: document.getElementById('wqBar')
};
const panel = {
  icon: document.getElementById('tpIcon'),
  name: document.getElementById('tpName'),
  detail: document.getElementById('tpDetail'),
  sell: document.getElementById('tpSell'),
  close: document.getElementById('tpClose'),
  a: document.getElementById('pathA'),
  b: document.getElementById('pathB'),
  dsc: document.getElementById('tpDsc')
};

const canvas = new Stage(document.getElementById('game'), () => {
  grid = buildGrid(canvas);
  if (world) {
    if (world.setGrid(grid)) ui.toast('Layout changed, displaced units refunded');
    selectedTower = null;
    paintPanel();
  }
});
const ctx = canvas.ctx;

/* --------------------------------------------------------------------------
   State
   -------------------------------------------------------------------------- */
let grid = buildGrid(canvas);
let world = null;
let picker = null;
let selectedType = null;
let selectedTower = null;
let hoverCell = null;
let running = false;
let clock = 0;
let damageFlash = 0;
const paletteButtons = new Map();

/* --------------------------------------------------------------------------
   Build palette. Built once, then only its classes change, so a tap is never
   interrupted by the DOM being rebuilt underneath it.
   -------------------------------------------------------------------------- */
function buildPalette() {
  paletteEl.innerHTML = '';
  paletteButtons.clear();

  for (const key of UNIT_ORDER) {
    const unit = UNITS[key];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tw';
    b.innerHTML = `
      <img class="ic" src="${machineIcon(unit.machine, 46)}" alt="" width="46" height="46">
      <span class="col">
        <span class="nm">${esc(unit.short)}</span>
        <span class="cs">${money(unit.cost)}</span>
      </span>`;
    b.onclick = () => {
      audio.sfx('click');
      selectedTower = null;
      paintPanel();
      selectedType = selectedType === key ? null : key;
      if (selectedType) ui.toast(`${unit.name}. Tap a bank tile to build.`, '', 1800);
      refreshPalette();
    };
    paletteEl.appendChild(b);
    paletteButtons.set(key, b);
  }
  refreshPalette();
  measurePalette();
}

/**
 * The bottom controls stack on top of the palette, whose height depends on the
 * device font size and the safe area, so it is measured rather than guessed.
 */
function measurePalette() {
  const set = () => document.documentElement.style.setProperty(
    '--paletteH', `${Math.round(paletteEl.offsetHeight || 82)}px`);
  requestAnimationFrame(set);
  if (window.ResizeObserver && !measurePalette._observing) {
    measurePalette._observing = true;
    try { new ResizeObserver(set).observe(paletteEl); } catch { /* not fatal */ }
  }
}

function refreshPalette() {
  if (!world) return;
  for (const [key, b] of paletteButtons) {
    b.classList.toggle('on', selectedType === key);
    b.classList.toggle('poor', world.budget < UNITS[key].cost);
  }
}

/* --------------------------------------------------------------------------
   Selected unit panel, with the two upgrade paths
   -------------------------------------------------------------------------- */
function paintPanel() {
  if (!selectedTower || !world) { panelEl.classList.add('hidden'); return; }

  const t = selectedTower;
  const unit = UNITS[t.type];
  const tree = UPGRADES[t.type];
  panelEl.classList.remove('hidden');

  panel.icon.src = machineIcon(unit.machine, 34);
  panel.name.textContent = unit.name;
  panel.detail.textContent = strengthLine(t);
  panel.sell.textContent = `Sell ${money(Math.round(investedIn(t) * RULES.sellRefund))}`;

  paintPath('a', tree.a, panel.a);
  paintPath('b', tree.b, panel.b);
  setDescription(defaultDescription(t));
}

function paintPath(path, def, host) {
  const t = selectedTower;
  const tier = t[path] || 0;
  const next = nextUpgrade(t, path);
  const gate = canUpgrade(t, path);
  const affordable = next && world.budget >= next.cost;

  const pips = [0, 1, 2]
    .map(i => `<i class="${i < tier ? 'on ' + path : ''}"></i>`)
    .join('');

  let label, cls, disabled;
  if (gate.reason === 'maxed')       { label = 'Fully upgraded'; cls = 'done'; disabled = true; }
  else if (gate.reason === 'locked') { label = 'Locked by the other path'; cls = 'locked'; disabled = true; }
  else { label = `${esc(next.name)} <b>${money(next.cost)}</b>`; cls = affordable ? '' : 'poor'; disabled = !affordable; }

  host.innerHTML = `
    <div class="pmeta">
      <span class="ptag ${path}">${path.toUpperCase()}</span>
      <span class="pname">${esc(def.name)}</span>
      <span class="pips">${pips}</span>
    </div>
    <button class="pbuy ${cls}" type="button" ${disabled ? 'disabled' : ''}>${label}</button>`;

  const btn = host.querySelector('.pbuy');
  const describe = () => {
    if (gate.reason === 'locked') {
      setDescription('Only one path can go past the first upgrade. Sell and rebuild if you want the other branch.');
    } else if (next) {
      setDescription(next.dsc);
    } else {
      setDescription(defaultDescription(t));
    }
  };
  btn.onmouseenter = describe;
  btn.onfocus = describe;
  if (!disabled) {
    btn.onclick = () => {
      const bought = world.upgrade(selectedTower, path);
      if (!bought) return;
      audio.sfx('upgrade');
      ui.toast(bought.name, 'gold', 2200);
      log('build', {
        g: GAME,
        detail: `upgrade;unit=${selectedTower.type};path=${path};tier=${selectedTower[path]};name=${bought.name}`
      });
      paintHud();
      paintPanel();
      setDescription(bought.dsc);
    };
  }
}

function setDescription(text) { panel.dsc.textContent = text || ''; }

function defaultDescription(t) {
  return UNITS[t.type].dsc;
}

/** "Strongest against pathogens" or the slow line for a grit chamber. */
function strengthLine(t) {
  const s = t.stats;
  if (s.slow) {
    return `Slows everything in the basin by ${Math.round(s.slow * 100)} percent`
         + (s.aura ? `, and boosts nearby units` : '');
  }
  const best = Object.entries(s.eff)
    .filter(([k, v]) => k !== 'cso' && v >= 1.2)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 2)
    .map(([k]) => SHORT[k] || k);
  const bits = [];
  if (best.length) bits.push(`Strong vs ${best.join(' and ')}`);
  if (s.targets > 1) bits.push(`hits ${s.targets}`);
  if (s.splash) bits.push('area');
  if (s.dot) bits.push('lingers');
  return bits.join(' · ') || 'General purpose';
}
const SHORT = { debris: 'debris', tss: 'solids', bod: 'BOD', path: 'pathogens', nutr: 'nutrients', metal: 'metals' };

function weaknessLine(kind) {
  const counters = UNIT_ORDER
    .map(key => ({ key, value: UNITS[key].eff[kind] || 0 }))
    .filter(counter => counter.value > 1)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map(counter => UNITS[counter.key].short);
  return counters.length ? counters.join(' / ') : 'general damage';
}

function paintWavePreview() {
  if (!world) return;

  const previewWave = world.inWave ? world.wave : world.wave + 1;
  const groups = new Map();
  for (const group of waveDefinition(previewWave)) {
    groups.set(group.kind, (groups.get(group.kind) || 0) + group.count);
  }

  wavePreviewEl.innerHTML = `
    <div class="wave-preview__head">
      <span>${world.inWave ? 'Current wave' : 'Next wave'}</span>
      <b>Wave ${previewWave}</b>
    </div>
    <div class="wave-preview__list">
      ${[...groups].map(([kind, count]) => {
        const pollutant = POLLUTANTS[kind];
        return `
          <div class="wave-preview__enemy">
            <span class="wave-preview__dot" style="background:${pollutant.col}"></span>
            <div class="wave-preview__info">
              <div><b>${count}x ${pollutant.short}</b></div>
              <small>Weak to ${esc(weaknessLine(kind))}</small>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

panel.sell.onclick = () => {
  if (!selectedTower) return;
  const back = world.sell(selectedTower);
  audio.sfx('sell');
  ui.toast(`Sold for ${money(back)}`);
  selectedTower = null;
  paintHud();
  paintPanel();
};
panel.close.onclick = () => { selectedTower = null; paintPanel(); };

/* --------------------------------------------------------------------------
   Wave controls
   -------------------------------------------------------------------------- */
nextWaveBtn.onclick = () => {
  if (!world || world.inWave) return;
  if (world.wave > 0) world.budget += RULES.earlyCallBonus;
  world.startWave();
  audio.sfx('wave');
  nextWaveBtn.disabled = true;
  nextWaveBtn.textContent = `Wave ${world.wave} running`;
  log('wave', { g: GAME, detail: `start;wave=${world.wave}` });
  ui.toast(`Wave ${world.wave} incoming`, 'bad', 1400);
  paintHud();
};

speedBtn.onclick = () => {
  if (!world) return;
  world.speed = world.speed === 1 ? 2 : 1;
  speedBtn.textContent = `${world.speed}x`;
  speedBtn.classList.toggle('on', world.speed === 2);
  audio.sfx('click');
};

function readyForWave() {
  waveBar.classList.remove('hidden');
  nextWaveBtn.disabled = false;
  nextWaveBtn.textContent = `Start wave ${world.wave + 1}`;
}

/* --------------------------------------------------------------------------
   Pointer
   -------------------------------------------------------------------------- */
stageEl.addEventListener('pointerdown', e => {
  if (!world || !running || quiz.isOpen() || ov.isOpen) return;
  if (e.target.closest('#palette, #twpanel, #wavebar, .overlay')) return;

  const { x, y } = canvas.pointer(e);
  const cell = cellAt(grid, x, y);
  if (!cell) { selectedTower = null; paintPanel(); return; }

  const existing = world.towerAt(cell.c, cell.r);
  if (existing) {
    selectedType = null;
    refreshPalette();
    selectedTower = existing;
    audio.sfx('click');
    paintPanel();
    return;
  }

  if (!world.canBuild(cell.c, cell.r)) { ui.toast('That is the channel, build on the bank'); return; }
  if (!selectedType) { selectedTower = null; paintPanel(); return; }

  const unit = UNITS[selectedType];
  if (world.budget < unit.cost) { ui.toast('Not enough budget', 'bad'); return; }

  world.build(selectedType, cell.c, cell.r);
  audio.sfx('build');
  log('build', { g: GAME, detail: `wave=${world.wave};unit=${selectedType};cost=${unit.cost}` });
  paintHud();
});

stageEl.addEventListener('pointermove', e => {
  if (!selectedType) { hoverCell = null; return; }
  const { x, y } = canvas.pointer(e);
  hoverCell = cellAt(grid, x, y);
});
stageEl.addEventListener('pointerleave', () => { hoverCell = null; });

onPause(() => {
  if (!world) return;
  world.speed = 1;
  speedBtn.textContent = '1x';
  speedBtn.classList.remove('on');
});

/* The ? button. Opening it mid-wave pauses the simulation. */
document.getElementById('help').onclick = () => {
  const wasRunning = running;
  running = false;
  ui.helpModal(helpHtml(), {
    onClose: () => { if (wasRunning) { running = true; loop.resetClock(); } }
  });
};

/* --------------------------------------------------------------------------
   HUD
   -------------------------------------------------------------------------- */
function paintHud() {
  if (!world) return;
  hud.budget.textContent = money(world.budget);
  hud.wave.textContent = world.wave;
  hud.quality.textContent = Math.round(world.quality);
  const pct = clamp(world.quality, 0, 100);
  hud.bar.style.width = `${pct}%`;
  hud.bar.className = pct > 60 ? '' : pct > 28 ? 'warn' : 'bad';
  paintWavePreview();
  refreshPalette();
  if (selectedTower) {
    /* affordability of the two upgrades changes constantly during a wave */
    paintPath('a', UPGRADES[selectedTower.type].a, panel.a);
    paintPath('b', UPGRADES[selectedTower.type].b, panel.b);
    panel.sell.textContent = `Sell ${money(Math.round(investedIn(selectedTower) * RULES.sellRefund))}`;
  }
}

/* --------------------------------------------------------------------------
   Frame
   -------------------------------------------------------------------------- */
let hudClock = 0;
const loop = new Loop(dt => {
  clock += dt;
  if (damageFlash > 0) damageFlash = Math.max(0, damageFlash - dt * 2.2);

  const active = world && running && !quiz.isOpen() && !ov.isOpen;
  if (active) {
    const now = performance.now();
    for (let i = 0; i < world.speed; i++) world.step(dt, now);
    /* the panel does real DOM work, so throttle it rather than run it at 60Hz */
    hudClock += dt;
    if (hudClock > 0.2) { hudClock = 0; paintHud(); }
  }
  render();
});

function render() {
  canvas.clear();
  drawSite(ctx, grid, clock);
  drawChannel(ctx, grid, clock);

  if (world) {
    drawBuildHints(ctx, grid, world, selectedType, hoverCell);
    if (selectedTower) drawRange(ctx, grid, world, selectedTower);
    for (const t of world.towers) drawTower(ctx, grid, t, clock, t === selectedTower);
    drawEffects(ctx, grid, world.effects);
    for (const e of world.enemies) drawEnemy(ctx, grid, e, clock);
    drawDamageVignette(ctx, canvas, damageFlash);
  }
}

/* --------------------------------------------------------------------------
   Run
   -------------------------------------------------------------------------- */
async function runGame() {
  running = false;
  world = null;
  selectedType = null;
  selectedTower = null;
  waveBar.classList.add('hidden');
  panelEl.classList.add('hidden');
  paletteEl.innerHTML = '';

  const filters = await showTitle(ov);
  picker = pickerFactory.create(filters);

  grid = buildGrid(canvas);
  world = new World(grid);
  world.onLeak = () => { damageFlash = 1; audio.sfx('leak'); };
  world.onKill = () => audio.sfx('pop');
  world.onWaveCleared = onWaveCleared;
  world.onDefeat = onDefeat;

  log('start', {
    g: GAME,
    detail: `topics=${filters.topics.join('|') || 'all'};exam=${filters.exam || 'both'}`
  });

  ov.hide();
  running = true;
  buildPalette();
  paintHud();
  readyForWave();

  /* Opt in debug handle for balancing and screenshots: open defense.html#debug */
  if (location.hash === '#debug') {
    window.__defense = {
      get world() { return world; },
      get grid() { return grid; },
      select(tower) { selectedTower = tower; paintPanel(); },
      repaint() { paintHud(); paintPanel(); }
    };
  }
}

async function onWaveCleared(wave) {
  audio.sfx('levelup');
  log('wave', { g: GAME, score: wave, detail: `clear;wave=${wave};wq=${Math.round(world.quality)}` });
  paintHud();
  await showGrantRound(ov, world, picker);
  paintHud();
  readyForWave();
}

async function onDefeat() {
  running = false;
  if (world.secondChance) {
    world.secondChance = false;
    const saved = await askConsentOrder(world, picker);
    if (saved) {
      world.reviveAfterSecondChance();
      running = true;
      loop.resetClock();
      audio.sfx('correct');
      ui.toast('Consent order met. Water quality restored to 35.', 'good', 2600);
      paintHud();
      return;
    }
  }
  finish();
}

function finish() {
  running = false;
  audio.sfx('gameover');
  const score = world.score();
  log('end', {
    g: GAME, score,
    detail: `wave=${world.wave};removed=${world.removed};leaked=${world.leaked};` +
            `upgrades=${world.upgradesBought};wq=${Math.round(world.quality)};` +
            `sec=${Math.round((Date.now() - world.startedAt) / 1000)}`
  });

  ov.hide();
  waveBar.classList.add('hidden');
  panelEl.classList.add('hidden');

  ui.gameOver({
    game: GAME,
    title: 'The river exceeded its limits',
    blurb: `Water quality hit zero on wave ${world.wave}. Look at which contaminant broke through, ` +
           `then take one unit all the way up the path that counters it. Two half-upgraded units ` +
           `lose to one fully upgraded one.`,
    score,
    stats: [
      { k: 'Score', v: fmt(score) },
      { k: 'Wave', v: String(world.wave) },
      { k: 'Removed', v: fmt(world.removed) }
    ],
    meta: { wave: world.wave, removed: world.removed, upgrades: world.upgradesBought },
    onReplay: runGame
  });
}

loop.start();
runGame();
