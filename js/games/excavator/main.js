/**
 * Excavator Run — game controller.
 */

import { boot, Stage, Loop, picker as pickerFactory, ui, quiz, scores, audio, onPause, log, util }
  from '../../core/app.js';
import { TUNING } from './config.js';
import { OBSTACLES } from './obstacles.js';
import { Scenery } from './scenery.js';
import { drawExcavator } from './machine.js';

const GAME = 'excavator';
const { n: fmt, rand, pick, clamp } = util;

boot(GAME);

/* --------------------------------------------------------------------------
   DOM
   -------------------------------------------------------------------------- */
const stageEl = document.getElementById('stage');
const ov = ui.overlay(document.getElementById('ovl'), document.getElementById('ovlCard'));
const hud = {
  score: document.getElementById('scoreEl'),
  best: document.getElementById('bestEl'),
  cleared: document.getElementById('clearedEl')
};
const comboEl = document.getElementById('comboEl');
const fiftyEl = document.getElementById('fiftyEl');
const tapCue = document.getElementById('tapcue');

const canvas = new Stage(document.getElementById('game'), () => {
  scenery.rebuild(view());
});
const ctx = canvas.ctx;
const scenery = new Scenery();

/* --------------------------------------------------------------------------
   Geometry, all derived from the play band
   -------------------------------------------------------------------------- */
function view() {
  const { W, H, band } = canvas;
  return { W, H, band, groundY: H - band * TUNING.groundFrac };
}
const obstacleUnit = () => canvas.band * TUNING.obstacleUnit;
const playerUnit   = () => canvas.band * TUNING.playerUnit;
const playerLeft   = () => canvas.W * (canvas.W < 520 ? 0.11 : 0.14);
const playerWidth  = () => playerUnit() * 2.7;
const playerHeight = () => playerUnit() * 2.0;

/* --------------------------------------------------------------------------
   State
   -------------------------------------------------------------------------- */
const Phase = { MENU: 'menu', RUN: 'run', QUIZ: 'quiz', PAUSED: 'paused', OVER: 'over' };
let phase = Phase.MENU;

let score = 0;
let best = 0;
let cleared = 0;
let combo = 0;
let bestCombo = 0;
let fifties = 0;
let speed = 0;
let spawnTimer = 0;
let runStartedAt = 0;
let invincibleUntil = 0;

const player = { height: 0, vy: 0, grounded: true };
let obstacles = [];
let dust = [];
let picker = null;

best = scores.best(GAME);

/* --------------------------------------------------------------------------
   Input
   -------------------------------------------------------------------------- */
stageEl.addEventListener('pointerdown', e => {
  if (phase !== Phase.RUN) return;
  if (e.target.closest('#fiftyEl')) return;
  e.preventDefault();
  jump();
}, { passive: false });

window.addEventListener('keydown', e => {
  if (quiz.isOpen()) return;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ') {
    e.preventDefault();
    if (phase === Phase.RUN) jump();
    else if (phase === Phase.PAUSED) resume();
  }
});

fiftyEl.addEventListener('click', e => {
  e.stopPropagation();
  ui.toast('Saved for the next question', 'gold');
});

function jump() {
  if (!player.grounded) return;
  player.vy = canvas.band * TUNING.jumpVelocity;
  player.grounded = false;
  audio.sfx('jump');
  puff();
}

onPause(() => { if (phase === Phase.RUN) pause(); });

function pause() {
  phase = Phase.PAUSED;
  ov.show(`
    <h2 class="center">Paused</h2>
    <p class="lead center">Your run is on hold. Nothing is lost.</p>
    <button class="btn btn-primary btn-block" id="res" type="button">Resume</button>`);
  ov.$('#res').onclick = resume;
}
function resume() {
  ov.hide();
  phase = Phase.RUN;
  loop.resetClock();
}

/* --------------------------------------------------------------------------
   Screens
   -------------------------------------------------------------------------- */
function showTitle() {
  phase = Phase.MENU;
  tapCue.classList.add('hidden');
  ov.show(`
    <h2>Excavator Run</h2>
    <p class="lead">Tap to jump. Hit an obstacle, answer to keep driving.</p>
    ${ui.topicsDisclosure()}
    ${ui.trackButtons()}`);

  const topics = ui.wireTopics(ov.card);
  for (const b of ov.card.querySelectorAll('[data-track]')) {
    b.onclick = async () => {
      await ui.ensureName();
      startRun({ topics: topics.get(), exam: b.dataset.track });
    };
  }
}

/* --------------------------------------------------------------------------
   The ? button. Opening it during a run pauses the run.
   -------------------------------------------------------------------------- */
document.getElementById('help').onclick = () => {
  const wasRunning = phase === Phase.RUN;
  if (wasRunning) phase = Phase.PAUSED;
  ui.helpModal(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#fff">Excavator Run</h2>
    <p class="expl">Tap the screen, or press space, to jump. The excavator speeds up the longer
      you drive.</p>
    <p class="expl">Hit an obstacle and an FE question stops you. <b>Right</b> keeps you driving
      with a bigger streak multiplier. <b>Wrong</b> ends the run.</p>
    <p class="expl">Every ${TUNING.fiftyEvery} correct answers in a row earn a 50/50 that removes
      two wrong choices on a question of your choosing.</p>
  `, { onClose: () => { if (wasRunning) { phase = Phase.RUN; loop.resetClock(); } } });
};

function startRun(filters) {
  picker = pickerFactory.create(filters);
  score = 0; cleared = 0; combo = 0; bestCombo = 0; fifties = 0;
  speed = canvas.W * TUNING.startSpeed;
  spawnTimer = 0.8;
  obstacles = [];
  dust = [];
  player.height = 0; player.vy = 0; player.grounded = true;
  invincibleUntil = 0;
  runStartedAt = Date.now();

  ov.hide();
  paintCombo();
  paintFifty();
  tapCue.classList.remove('hidden');
  setTimeout(() => tapCue.classList.add('hidden'), 3200);

  phase = Phase.RUN;
  loop.resetClock();
  log('start', {
    g: GAME,
    detail: `topics=${filters.topics.join('|') || 'all'};exam=${filters.exam || 'both'}`
  });
}

/* --------------------------------------------------------------------------
   Scoring
   -------------------------------------------------------------------------- */
const multiplier = () => Math.min(TUNING.comboMax, 1 + TUNING.comboStep * Math.max(0, combo - 1));
const questionPoints = q => Math.round(TUNING.pointsPerDiff * q.diff * multiplier());

function paintCombo() {
  if (combo < 2) { comboEl.classList.add('off'); return; }
  comboEl.classList.remove('off');
  comboEl.textContent = `Streak ${combo}  •  ${multiplier().toFixed(2)}x`;
}
function paintFifty() {
  fiftyEl.classList.toggle('hidden', fifties <= 0);
  fiftyEl.textContent = `50/50 x${fifties}`;
}

/* --------------------------------------------------------------------------
   Collision question
   -------------------------------------------------------------------------- */
async function askQuestion() {
  phase = Phase.QUIZ;
  audio.sfx('crash');
  const q = picker.next();
  if (!q) { endRun('noq'); return; }

  const result = await quiz.ask({
    q, game: GAME, timed: true,
    lifeline: fifties > 0,
    onLifeline: () => { fifties--; paintFifty(); },
    ctx: `streak=${combo};score=${Math.floor(score)}`,
    label: 'Obstacle hit — answer to keep driving',
    cta: ok => (ok ? `Keep driving  +${questionPoints(q)}` : 'See results')
  });

  if (!result.ok) {
    combo = 0;
    paintCombo();
    endRun('wrong');
    return;
  }

  combo++;
  cleared++;
  bestCombo = Math.max(bestCombo, combo);
  score += questionPoints(q);
  if (cleared % TUNING.fiftyEvery === 0) { fifties++; audio.sfx('coin'); ui.toast('50/50 earned', 'gold'); }
  paintCombo();
  paintFifty();

  /* clear the road ahead so the player is not instantly hit again */
  const safeX = playerLeft() + playerWidth() + canvas.W * 0.22;
  obstacles = obstacles.filter(o => o.x > safeX);
  invincibleUntil = performance.now() + TUNING.invincibleMs;

  phase = Phase.RUN;
  loop.resetClock();
}

function endRun(reason) {
  phase = Phase.OVER;
  audio.sfx('gameover');
  const final = Math.floor(score);
  best = Math.max(best, final);

  log('end', {
    g: GAME, score: final,
    detail: `cleared=${cleared};bestStreak=${bestCombo};` +
            `sec=${Math.round((Date.now() - runStartedAt) / 1000)};reason=${reason}`
  });

  ui.gameOver({
    game: GAME,
    title: reason === 'wrong' ? 'Wrong answer, run over' : 'Run over',
    blurb: reason === 'wrong'
      ? 'That one cost the run. The explanation is worth a second read before you go again.'
      : 'Nice driving. Try to beat it.',
    score: final,
    stats: [
      { k: 'Score', v: fmt(final) },
      { k: 'Cleared', v: String(cleared) },
      { k: 'Best streak', v: String(bestCombo) }
    ],
    meta: { cleared, streak: bestCombo },
    onReplay: showTitle
  });
}

/* --------------------------------------------------------------------------
   Simulation
   -------------------------------------------------------------------------- */
function spawnObstacle() {
  const tmpl = pick(OBSTACLES);
  const u = obstacleUnit();
  obstacles.push({ x: canvas.W + u, tmpl, w: tmpl.w * u, h: tmpl.h * u });
}

function puff() {
  const { groundY } = view();
  for (let i = 0; i < 6; i++) {
    dust.push({
      x: playerLeft() + rand(0, playerWidth() * 0.6),
      y: groundY - rand(0, 4),
      vx: rand(-40, -110),
      vy: rand(-10, 40),
      r: rand(canvas.band * 0.008, canvas.band * 0.02),
      life: rand(0.3, 0.6),
      t: 0
    });
  }
}

function update(dt) {
  const v = view();
  const scroll = phase === Phase.RUN ? speed
               : phase === Phase.MENU ? canvas.W * 0.30
               : 0;

  scenery.update(dt, scroll, v);

  for (let i = dust.length - 1; i >= 0; i--) {
    const p = dust[i];
    p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * canvas.band * 0.02;
    if (p.t > p.life) dust.splice(i, 1);
  }

  if (phase !== Phase.RUN) return;

  speed = Math.min(speed + canvas.W * TUNING.accel * dt, canvas.W * TUNING.maxSpeed);
  score += speed * dt * 0.02 * multiplier();

  player.vy -= canvas.band * TUNING.gravity * dt;
  player.height += player.vy * dt;
  if (player.height <= 0) { player.height = 0; player.vy = 0; player.grounded = true; }

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    const f = speed / canvas.W;
    spawnTimer = Math.max(TUNING.spawnMin, rand(TUNING.spawnRandLo, TUNING.spawnRandHi) - (f - 0.5) * 0.42);
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= speed * dt;
    if (obstacles[i].x + obstacles[i].w < -10) obstacles.splice(i, 1);
  }

  if (performance.now() <= invincibleUntil) return;

  const gY = v.groundY;
  const pL = playerLeft(), pW = playerWidth(), pH = playerHeight();
  const box = {
    x: pL + pW * 0.20, w: pW * 0.62,
    y: gY - player.height - pH + pH * 0.10, h: pH * 0.82
  };
  for (const o of obstacles) {
    const ox = o.x + o.w * 0.16, ow = o.w * 0.68;
    const oy = gY - o.h + o.h * 0.06, oh = o.h * 0.9;
    if (box.x < ox + ow && box.x + box.w > ox && box.y < oy + oh && box.y + box.h > oy) {
      askQuestion();
      break;
    }
  }
}

function render() {
  const v = view();
  const heat = Math.min(1, combo / 8);
  scenery.draw(ctx, v, heat);

  for (const p of dust) {
    ctx.fillStyle = `rgba(148,163,184,${(1 - p.t / p.life).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }

  for (const o of obstacles) {
    ctx.save();
    o.tmpl.draw(ctx, o.x, v.groundY, o.w, o.h);
    ctx.restore();
  }

  drawExcavator(ctx, {
    left: playerLeft(),
    bottom: v.groundY - player.height,
    unit: playerUnit(),
    band: canvas.band,
    height: player.height
  }, {
    heat,
    spin: (scenery.scroll * 0.06) % (Math.PI * 2),
    flashing: phase === Phase.RUN
      && performance.now() < invincibleUntil
      && Math.floor(performance.now() / 110) % 2 === 0
  });
}

/* --------------------------------------------------------------------------
   Frame
   -------------------------------------------------------------------------- */
const loop = new Loop(dt => {
  update(dt);
  render();
  hud.score.firstChild.textContent = fmt(score);
  hud.best.textContent = `best ${fmt(best)}`;
  hud.cleared.textContent = String(cleared);
});

scenery.rebuild(view());
showTitle();
loop.start();
