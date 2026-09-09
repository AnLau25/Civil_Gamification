/**
 * FE Arcade — shared class leaderboard.
 *
 * Two routes, one KV namespace, no database and no server to keep alive. This
 * is why Cloudflare rather than a paid host: it costs nothing to leave running
 * between semesters.
 *
 *   POST /score  { game, cls, entry: { name, pid, section, score } }
 *   GET  /top?game=dig&cls=CEG3011-FA26&n=15
 *
 * Set apiBase in js/core/config.js to this Worker URL and the games start
 * using it. They fall back to local storage when it is unreachable, so a dead
 * network never blocks play.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const GAMES = new Set(['excavator', 'dig', 'defense']);
const MAX_PER_BOARD = 500;
const MAX_SCORE = 10000000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: CORS });

/** Trim to length and drop control characters, so a name cannot break a board. */
function clean(value, max) {
  return String(value == null ? '' : value)
    .split('')
    .filter(ch => ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) !== 127)
    .join('')
    .trim()
    .slice(0, max);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    /* ------------------------------------------------------------------ */
    if (url.pathname === '/score' && request.method === 'POST') {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'bad json' }, 400); }

      const { game, cls, entry } = body || {};
      if (!GAMES.has(game)) return json({ error: 'unknown game' }, 400);
      if (!entry || typeof entry.score !== 'number' || !Number.isFinite(entry.score)) {
        return json({ error: 'bad entry' }, 400);
      }

      const key = `${clean(cls, 32) || 'default'}:${game}`;
      const list = JSON.parse((await env.SCORES.get(key)) || '[]');

      list.push({
        name: clean(entry.name, 18) || 'Anonymous',
        pid: clean(entry.pid, 32),
        section: clean(entry.section, 16),
        score: Math.max(0, Math.min(Math.round(entry.score), MAX_SCORE)),
        ts: Date.now()
      });

      list.sort((a, b) => b.score - a.score);
      await env.SCORES.put(key, JSON.stringify(list.slice(0, MAX_PER_BOARD)));
      return json({ ok: true });
    }

    /* ------------------------------------------------------------------ */
    if (url.pathname === '/top' && request.method === 'GET') {
      const game = url.searchParams.get('game');
      if (!GAMES.has(game)) return json({ error: 'unknown game' }, 400);

      const cls = clean(url.searchParams.get('cls'), 32) || 'default';
      const raw = parseInt(url.searchParams.get('n') || '15', 10);
      const n = Math.min(Math.max(Number.isFinite(raw) ? raw : 15, 1), 100);

      const list = JSON.parse((await env.SCORES.get(`${cls}:${game}`)) || '[]');

      /* one row per player, their best */
      const seen = new Set();
      const entries = [];
      for (const e of list) {
        if (e.pid && seen.has(e.pid)) continue;
        if (e.pid) seen.add(e.pid);
        entries.push(e);
        if (entries.length >= n) break;
      }
      return json({ entries });
    }

    /* ------------------------------------------------------------------ */
    if (url.pathname === '/') return json({ ok: true, service: 'fe-arcade leaderboard' });

    return json({ error: 'not found' }, 404);
  }
};
