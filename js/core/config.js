/**
 * config.js — every tunable that is not game specific.
 *
 * To move the leaderboard online, set API_BASE to a Cloudflare Worker URL.
 * Leave it empty and scores stay in the browser. Nothing else changes.
 * The Worker source is in README.md.
 */

export const CONFIG = {
  /** Cloudflare Worker origin, or "" for browser-only scores. */
  apiBase: '',

  /** Keeps leaderboards separate per section or semester. */
  classCode: 'FGCU-FE',

  /** Telemetry ring buffer size, per device. */
  maxEvents: 6000,

  /** Scores retained locally, per game. */
  maxScores: 200
};

/** localStorage keys. Bump the suffix if a shape ever changes. */
export const KEYS = {
  player: 'fe_arcade_player_v1',
  events: 'fe_arcade_events_v1',
  scores: 'fe_arcade_scores_v1',
  qhist:  'fe_arcade_qhist_v1'
};

/** The three games, used by the hub and the progress page. */
export const GAMES = [
  { id: 'excavator', name: 'Excavator Run',     href: 'excavator.html' },
  { id: 'dig',       name: 'Gold Miner',        href: 'dig.html' },
  { id: 'defense',   name: 'Watershed Defense', href: 'defense.html' }
];
