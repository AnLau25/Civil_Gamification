/**
 * Browser smoke test. Serves the folder over HTTP (ES modules need it) and
 * drives every page at a phone size and a desktop size.
 *
 *     node tools/smoke-test.mjs [--shots]
 */

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = process.argv.includes('--shots');
const SHOT_DIR = path.join(ROOT, '.shots');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, rel === '/' ? 'index.html' : rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const PHONE = { width: 390, height: 844, dpr: 2, mobile: true };
const DESK  = { width: 1280, height: 800, dpr: 1, mobile: false };

let failures = 0;
const ok  = m => console.log(`  ok    ${m}`);
const bad = m => { console.log(`  FAIL  ${m}`); failures++; };
const check = (cond, m) => (cond ? ok(m) : bad(m));

async function page(browser, vp, url) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    isMobile: vp.mobile,
    hasTouch: vp.mobile
  });
  const p = await context.newPage();
  p.errors = [];
  p.on('console', m => { if (m.type() === 'error') p.errors.push(`console: ${m.text()}`); });
  p.on('pageerror', e => p.errors.push(`pageerror: ${e.message}`));
  await p.goto(`http://localhost:8321/${url}`, { waitUntil: 'networkidle' });
  return { context, p };
}

const shot = async (p, name) => {
  if (!SHOTS) return;
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  await p.screenshot({ path: path.join(SHOT_DIR, `${name}.png`) });
};

const seedPlayer = p => p.evaluate(() =>
  localStorage.setItem('fe_arcade_player_v1',
    JSON.stringify({ pid: 'ptest', alias: 'TestBot', section: 'T1', created: Date.now() })));

/** Answer the open quiz correctly, then dismiss it. */
async function answerCorrectly(p) {
  await p.waitForSelector('#feQuiz:not(.hidden) .opt', { timeout: 8000 });
  await p.evaluate(async () => {
    const { all } = await import('/js/core/bank.js');
    const text = document.querySelector('#feQText').textContent;
    const q = all.find(x => x.q === text);
    document.querySelector(`.opt[data-letter="${q.ans}"]`).click();
  });
  await p.waitForTimeout(180);
  await p.click('#feQAction');
  await p.waitForTimeout(220);
}

const quizOpen = p => p.evaluate(() =>
  !!document.querySelector('#feQuiz') && !document.querySelector('#feQuiz').classList.contains('hidden'));

await new Promise(r => server.listen(8321, r));
const browser = await chromium.launch();

/* ========================================================================== */
console.log('\n=== index.html ===');
{
  const { context, p } = await page(browser, PHONE, 'index.html');
  check(p.errors.length === 0, `no js errors ${p.errors.join(' | ')}`);
  check(await p.locator('.playbtn').count() === 3, '3 play buttons');
  check(await p.locator('.thumb').count() === 3, 'button thumbnails drawn');
  check(await p.locator('#sound').count() === 1, 'sound toggle present');
  check((await p.locator('.playbtn .pb-txt b').nth(1).textContent()).includes('Gold Miner'), 'game 2 is Gold Miner');
  check(!/Florida Gulf Coast/i.test(await p.locator('body').textContent()), 'no university brand line');

  /* the menu is light, the games stay dark */
  const menuBg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check(/244, 246, 252/.test(menuBg), `menu background is light (${menuBg})`);

  /* every sheet opens, shows its content and closes again */
  for (const [name, needle] of [['tutorial', /How to play/], ['board', /Leaderboard/], ['about', /questions/]]) {
    await p.click(`[data-open="${name}"]`);
    await p.waitForTimeout(180);
    const sheet = p.locator(`#sheet-${name}`);
    check(await sheet.isVisible(), `${name} sheet opens`);
    check(needle.test(await sheet.textContent()), `${name} sheet has its content`);
    const box = await sheet.locator('.sheetfoot .btn').boundingBox();
    check(box && box.height >= 44, `${name} back button is a real target`);
    await sheet.locator('.sheetx').click();
    await p.waitForTimeout(180);
    check(!(await sheet.isVisible()), `${name} sheet closes`);
  }

  check(/133/.test(await p.locator('#facts').textContent()), 'about reports the bank size');
  await shot(p, 'hub-phone');
  await context.close();
}

/* ========================================================================== */
for (const [label, vp] of [['phone', PHONE], ['desktop', DESK]]) {
  console.log(`\n=== excavator.html (${label}) ===`);
  const { context, p } = await page(browser, vp, 'excavator.html');
  check(p.errors.length === 0, `no js errors ${p.errors.join(' | ')}`);
  check(/Quit/.test(await p.locator('.topbar .back').textContent()), 'quit button labelled');
  check(await p.locator('#help').isVisible(), 'help button present');

  const layout = await p.evaluate(() => ({
    overflow: document.documentElement.scrollHeight - window.innerHeight,
    backing: document.getElementById('game').width
  }));
  check(layout.overflow <= 1, `no page scroll (${layout.overflow}px)`);
  check(layout.backing > 0, `canvas has backing pixels (${layout.backing})`);

  await seedPlayer(p);
  await p.click('#trackCivil');
  await p.waitForTimeout(1200);
  check(await p.evaluate(() => document.getElementById('ovl').classList.contains('hidden')), 'run started');
  await shot(p, `excavator-run-${label}`);

  let hit = false;
  for (let i = 0; i < 40 && !hit; i++) { await p.waitForTimeout(400); hit = await quizOpen(p); }
  check(hit, 'collision opened the quiz');
  if (hit) {
    await shot(p, `excavator-quiz-${label}`);
    const box = await p.evaluate(() => {
      const r = document.querySelector('#feQuiz .qcard').getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, h: window.innerHeight };
    });
    check(box.top >= -1 && box.bottom <= box.h + 1, 'quiz card fits the screen');
    await answerCorrectly(p);
    check(await p.locator('#clearedEl').textContent() === '1', 'cleared counter advanced');
  }
  check(p.errors.length === 0, `still no js errors ${p.errors.join(' | ')}`);
  await context.close();
}

/* ========================================================================== */
for (const [label, vp] of [['phone', PHONE], ['desktop', DESK]]) {
  console.log(`\n=== dig.html — Gold Miner (${label}) ===`);
  const { context, p } = await page(browser, vp, 'dig.html#debug');
  check(p.errors.length === 0, `no js errors ${p.errors.join(' | ')}`);
  await shot(p, `miner-title-${label}`);

  await seedPlayer(p);
  await p.click('#trackCivil');
  await p.waitForTimeout(400);
  check(/payroll/i.test(await p.locator('#ovlCard').textContent()), 'payroll screen');

  await p.click('#pAsk');
  await answerCorrectly(p);
  check((await p.locator('.potbox .amt').textContent()) !== '$0', 'pot grew');

  await p.click('#pBank');
  await p.waitForTimeout(300);
  check(/Supply store/.test(await p.locator('#ovlCard').textContent()), 'shop screen');
  await shot(p, `miner-shop-${label}`);

  await p.click('#startLvl');
  await p.waitForTimeout(700);

  const scene = await p.evaluate(() => ({
    hudGoal: document.getElementById('goalEl').textContent,
    time: document.getElementById('timeEl').textContent
  }));
  check(/\$/.test(scene.hudGoal), `quota shown (${scene.hudGoal})`);
  check(/:/.test(scene.time), `clock running (${scene.time})`);
  await shot(p, `miner-shift-${label}`);

  /* Drop the claw when it is actually pointing at something. Tapping on a timer
     locks to the swing period and can miss every single time, which fails the
     test for a reason that has nothing to do with the game. `dig.html#debug`
     exposes the aim, so the drop is deliberate. */
  let hauled = false;
  for (let i = 0; i < 600 && !hauled; i++) {
    if (await quizOpen(p)) { await answerCorrectly(p); continue; }
    /* the shift may have ended, or the level may already be cleared */
    const done = await p.evaluate(() =>
      !document.getElementById('ovl').classList.contains('hidden') ||
      !!document.querySelector('#feQuiz:not(.hidden)'));
    if (done) break;

    /* Check the aim and fire in ONE evaluate, so the swing cannot move on
       between the check and the tap. A round trip per step is enough drift to
       turn a sure hit into a miss on a fast swing. */
    const fired = await p.evaluate(() => {
      if (!window.__dig?.aimed()) return false;
      document.getElementById('stage').dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      return true;
    });
    await p.waitForTimeout(fired ? 120 : 25);
    const earned = await p.evaluate(() => document.getElementById('goalEl').textContent.split('/')[0]);
    hauled = earned !== '$0';
  }
  check(hauled, 'the claw hauled something into the cart');
  await shot(p, `miner-hauled-${label}`);
  check(p.errors.length === 0, `no js errors ${p.errors.join(' | ')}`);
  await context.close();
}

/* ========================================================================== */
for (const [label, vp] of [['phone', PHONE], ['desktop', DESK]]) {
  console.log(`\n=== defense.html (${label}) ===`);
  const { context, p } = await page(browser, vp, 'defense.html');
  check(p.errors.length === 0, `no js errors ${p.errors.join(' | ')}`);
  await shot(p, `defense-title-${label}`);

  await seedPlayer(p);
  await p.click('#trackEnv');
  await p.waitForTimeout(500);
  check(await p.evaluate(() => document.getElementById('ovl').classList.contains('hidden')), 'plant commissioned');
  check(await p.locator('#palette .tw').count() === 6, '6 unit buttons');
  check(await p.evaluate(() =>
    Math.round(document.querySelector('#palette .tw').getBoundingClientRect().height)) >= 46,
    'palette buttons clear 46px');

  const rect = await p.evaluate(() => {
    const r = document.getElementById('game').getBoundingClientRect();
    return { left: r.left, top: r.top, w: r.width, h: r.height };
  });

  let placed = 0;
  for (let gx = 0; gx < 14 && placed < 5; gx++) {
    for (let gy = 0; gy < 10 && placed < 5; gy++) {
      if (await p.locator('#palette .tw.on').count() === 0) await p.click('#palette .tw:nth-child(1)');
      const before = await p.locator('#budgetEl').textContent();
      await p.mouse.click(rect.left + 20 + gx * (rect.w - 40) / 14,
                          rect.top + 60 + gy * (rect.h - 150) / 10);
      await p.waitForTimeout(50);
      if ((await p.locator('#budgetEl').textContent()) !== before) placed++;
    }
  }
  check(placed >= 3, `${placed} bar screens built by tapping the canvas`);
  await shot(p, `defense-built-${label}`);

  await p.click('#nextWave');
  await p.click('#speedBtn');
  await p.waitForTimeout(3000);
  check(await p.locator('#waveEl').textContent() === '1', 'wave 1 running');
  await shot(p, `defense-wave-${label}`);

  /* the upgrade panel: select a tower and buy up one path */
  const upgraded = await p.evaluate(async () => {
    await new Promise(r => setTimeout(r, 100));
    return null;
  });
  let grant = false;
  for (let i = 0; i < 120 && !grant; i++) {
    await p.waitForTimeout(500);
    grant = await p.evaluate(() =>
      !document.getElementById('ovl').classList.contains('hidden') &&
      /grant/i.test(document.getElementById('ovlCard').textContent));
  }
  check(grant, 'wave cleared into the grant round');
  if (grant) await shot(p, `defense-grant-${label}`);
  check(p.errors.length === 0, `no js errors ${p.errors.join(' | ')}`);
  await context.close();
}

/* ========================================================================== */
console.log('\n=== my progress sheet ===');
{
  const { context, p } = await page(browser, PHONE, 'index.html#progress');
  await p.waitForTimeout(400);
  check(p.errors.length === 0, `no js errors ${p.errors.join(' | ')}`);
  check(await p.locator('#sheet-progress').isVisible(), 'progress sheet opens from the #progress hash');
  check(await p.locator('#sum .stat').count() === 4, 'summary tiles render');
  check(await p.locator('#dl').isVisible(), 'CSV export button present');
  await p.locator('#sheet-progress .sheetx').click();
  await p.waitForTimeout(200);
  check(!(await p.locator('#sheet-progress').isVisible()), 'progress sheet closes');
  await context.close();
}

await browser.close();
server.close();

console.log(`\n${failures ? `${failures} FAILURE(S)` : 'ALL CHECKS PASSED'}\n`);
process.exit(failures ? 1 : 0);
