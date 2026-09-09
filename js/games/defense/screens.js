/**
 * Watershed Defense — overlay screens.
 */

import { esc, money } from '../../core/util.js';
import * as ui from '../../core/ui.js';
import * as quiz from '../../core/quiz.js';
import { POLLUTANTS, UNITS, RULES, UNLOCKS } from './config.js';

const GAME = 'defense';

const LEGEND = [
  ['debris', 'torn out by a bar screen'],
  ['tss',    'settles out in a sedimentation basin'],
  ['bod',    'eaten by activated sludge'],
  ['path',   'killed by a UV dose'],
  ['nutr',   'biological plus chemical together'],
  ['metal',  'only coagulation really works']
];

export function showTitle(ov) {
  return new Promise(resolve => {
    ov.show(`
      <h2>Watershed Defense</h2>
      <p class="lead">Build the right treatment unit for each contaminant before it reaches
        the river. Tap the <b>?</b> up top any time for the unit guide.</p>
      ${ui.topicsDisclosure()}
      ${ui.trackButtons({ recommend: 'env' })}`);

    const topics = ui.wireTopics(ov.card);
    for (const b of ov.card.querySelectorAll('[data-track]')) {
      b.onclick = async () => {
        await ui.ensureName();
        resolve({ topics: topics.get(), exam: b.dataset.track });
      };
    }
  });
}

/** The unit guide the ? button opens: every tower, what it kills, the rule. */
export function helpHtml() {
  return `
    <h2 style="margin:0 0 8px;font-size:20px;color:#fff">Watershed Defense</h2>
    <p class="expl">Tap a unit at the bottom, then tap a grass tile to build it. Tap a built
      unit to upgrade or sell. Each unit only removes what it really treats:</p>
    <div class="legend">
      ${LEGEND.map(([k, note]) => `
        <div class="lgrow">
          <span class="lgdot" style="background:${POLLUTANTS[k].col}"></span>
          <span><b>${esc(POLLUTANTS[k].name)}</b> — ${esc(note)}</span>
        </div>`).join('')}
    </div>
    <p class="expl" style="margin-top:10px">Two upgrade paths per unit, three tiers each, and only
      one path can go past tier one. After each wave, answer questions to earn budget.</p>`;
}

/**
 * Between waves: up to three questions, each correct one releasing budget.
 * Nothing is lost on a wrong answer, so this round is pure upside and keeps
 * students answering rather than skipping.
 */
export function showGrantRound(ov, world, picker) {
  return new Promise(resolve => {
    let asked = 0;
    let earned = 0;
    const perQuestion = RULES.grantPerWave(world.wave);
    const nextUnlock = UNLOCKS[world.wave + 1];

    function paint() {
      ov.show(`
        <p class="kicker">Wave ${world.wave} cleared</p>
        <h2>Bonus round</h2>
        <p class="lead">Each correct answer adds <b style="color:var(--good2)">${money(perQuestion)}</b>
          to your budget. Wrong answers cost nothing.</p>
        ${nextUnlock ? `
          <div class="alertline">
            <span class="lgdot" style="background:${POLLUTANTS[nextUnlock].col}"></span>
            <span>Wave ${world.wave + 1} brings <b>${esc(POLLUTANTS[nextUnlock].name)}</b>.
              ${esc(counterHint(nextUnlock))}</span>
          </div>` : ''}
        <div class="stat-row">
          <div class="stat"><div class="k">Budget</div><div class="v">${money(world.budget)}</div></div>
          <div class="stat"><div class="k">Granted</div><div class="v">${money(earned)}</div></div>
          <div class="stat"><div class="k">Quality</div><div class="v">${Math.round(world.quality)}</div></div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="gAsk" type="button">Answer question ${asked + 1} of ${RULES.grantQuestions}</button>
          <button class="btn btn-ghost" id="gSkip" type="button">Build defenses</button>
        </div>`);

      const ask = ov.$('#gAsk');
      ask.disabled = asked >= RULES.grantQuestions;
      if (ask.disabled) ask.textContent = 'No questions left';
      ask.onclick = take;
      ov.$('#gSkip').onclick = () => { ov.hide(); resolve(); };
    }

    async function take() {
      const q = picker.next();
      ov.hide();
      const r = await quiz.ask({
        q, game: GAME, timed: true,
        label: `Bonus question ${asked + 1} of ${RULES.grantQuestions}`,
        ctx: `wave=${world.wave};wq=${Math.round(world.quality)}`,
        cta: ok => (ok ? 'Take the money' : 'Carry on')
      });
      asked++;
      if (r.ok) {
        const value = Math.round(perQuestion * (0.7 + 0.3 * q.diff));
        world.budget += value;
        earned += value;
        ui.toast(`+${money(value)} budget`, 'good');
      }
      paint();
    }

    paint();
  });
}

function counterHint(kind) {
  const best = Object.entries(UNITS)
    .filter(([, u]) => u.eff?.[kind])
    .sort((a, b) => b[1].eff[kind] - a[1].eff[kind])[0];
  return best ? `Build ${best[1].name}.` : '';
}

/** One question stands between the plant and a shutdown. */
export async function askConsentOrder(world, picker) {
  const q = picker.next();
  const r = await quiz.ask({
    q, game: GAME, timed: true,
    label: 'Consent order — one question to stay open',
    ctx: `wave=${world.wave};emergency`,
    cta: ok => (ok ? 'The plant stays open' : 'The plant is shut down')
  });
  return r.ok;
}
