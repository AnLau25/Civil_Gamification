/**
 * audio.js — every sound in the arcade, synthesised in the browser.
 *
 * No mp3 files, so nothing to host, nothing to license, and nothing extra for
 * a student to download over mobile data. The whole engine is a few
 * oscillators and one noise buffer.
 *
 * Browsers refuse to start audio before a user gesture, so the context is
 * created lazily on the first tap or key press.
 *
 * Defaults are deliberate: sound effects ON, music OFF. A student opening this
 * in a lecture should not blast a soundtrack across the room.
 */

import { read, write } from './storage.js';

const KEY = 'fe_arcade_audio_v1';

const prefs = {
  sfx: true,
  music: false,
  ...read(KEY, {})
};

let ctx = null;
let master = null;
let sfxBus = null;
let musicBus = null;
let noiseBuffer = null;

/* --------------------------------------------------------------------------
   Context
   -------------------------------------------------------------------------- */
function ensure() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;

  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);

  sfxBus = ctx.createGain();
  sfxBus.gain.value = prefs.sfx ? 0.55 : 0;
  sfxBus.connect(master);

  musicBus = ctx.createGain();
  musicBus.gain.value = 0;                    // faded in by startMusic
  musicBus.connect(master);

  /* one second of white noise, reused by every percussive sound */
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  return ctx;
}

/* Unlock on the first gesture anywhere on the page. */
function unlock() {
  ensure();
  if (prefs.music && currentProfile) startMusic(currentProfile);
}
for (const evt of ['pointerdown', 'keydown', 'touchstart']) {
  window.addEventListener(evt, unlock, { once: true, passive: true });
}

/* --------------------------------------------------------------------------
   Voices
   -------------------------------------------------------------------------- */
function tone({ freq, type = 'triangle', dur = 0.18, gain = 0.5, attack = 0.005,
                slideTo = null, bus = sfxBus, delay = 0, detune = 0 }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (detune) osc.detune.setValueAtTime(detune, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);

  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(env);
  env.connect(bus);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise({ dur = 0.14, gain = 0.4, freq = 1200, q = 1, type = 'bandpass', delay = 0 }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(freq, t0);
  filter.Q.value = q;

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain, t0);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  src.connect(filter);
  filter.connect(env);
  env.connect(sfxBus);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

/* --------------------------------------------------------------------------
   Sound effects
   -------------------------------------------------------------------------- */
const SFX = {
  click:    () => tone({ freq: 520, type: 'square', dur: 0.05, gain: 0.18 }),
  jump:     () => tone({ freq: 320, slideTo: 700, dur: 0.16, gain: 0.32, type: 'square' }),
  land:     () => noise({ dur: 0.09, gain: 0.20, freq: 500, q: 0.7 }),
  crash:    () => { noise({ dur: 0.28, gain: 0.45, freq: 320, q: 0.6 }); tone({ freq: 180, slideTo: 70, dur: 0.3, gain: 0.3, type: 'sawtooth' }); },

  correct:  () => { tone({ freq: 660, dur: 0.12, gain: 0.30 });
                    tone({ freq: 880, dur: 0.16, gain: 0.28, delay: 0.09 });
                    tone({ freq: 1320, dur: 0.22, gain: 0.20, delay: 0.18 }); },
  wrong:    () => { tone({ freq: 220, dur: 0.20, gain: 0.30, type: 'sawtooth' });
                    tone({ freq: 165, dur: 0.30, gain: 0.28, type: 'sawtooth', delay: 0.12 }); },
  tick:     () => tone({ freq: 900, type: 'square', dur: 0.04, gain: 0.12 }),

  coin:     () => { tone({ freq: 990, dur: 0.07, gain: 0.26, type: 'square' });
                    tone({ freq: 1480, dur: 0.14, gain: 0.22, type: 'square', delay: 0.06 }); },
  cash:     () => { for (let i = 0; i < 4; i++) tone({ freq: 660 * Math.pow(1.26, i), dur: 0.10, gain: 0.20, type: 'square', delay: i * 0.05 }); },
  drop:     () => tone({ freq: 700, slideTo: 220, dur: 0.22, gain: 0.26, type: 'sawtooth' }),
  grab:     () => { noise({ dur: 0.10, gain: 0.32, freq: 2400, q: 2 }); tone({ freq: 420, dur: 0.08, gain: 0.22, type: 'square' }); },
  reel:     () => tone({ freq: 140, dur: 0.10, gain: 0.14, type: 'triangle' }),
  blast:    () => { noise({ dur: 0.45, gain: 0.55, freq: 220, q: 0.4, type: 'lowpass' });
                    tone({ freq: 90, slideTo: 40, dur: 0.4, gain: 0.35, type: 'sawtooth' }); },

  build:    () => { tone({ freq: 300, dur: 0.09, gain: 0.26, type: 'square' });
                    tone({ freq: 450, dur: 0.14, gain: 0.24, type: 'square', delay: 0.07 }); },
  upgrade:  () => { for (let i = 0; i < 5; i++) tone({ freq: 440 * Math.pow(1.2, i), dur: 0.13, gain: 0.22, type: 'triangle', delay: i * 0.055 }); },
  sell:     () => { tone({ freq: 500, slideTo: 260, dur: 0.16, gain: 0.22, type: 'triangle' }); },
  shot:     () => noise({ dur: 0.05, gain: 0.10, freq: 3000, q: 3 }),
  pop:      () => { noise({ dur: 0.08, gain: 0.16, freq: 1600, q: 1.5 }); },
  leak:     () => { tone({ freq: 200, slideTo: 90, dur: 0.35, gain: 0.32, type: 'sawtooth' });
                    noise({ dur: 0.3, gain: 0.2, freq: 400, q: 0.5 }); },
  wave:     () => { tone({ freq: 150, dur: 0.5, gain: 0.26, type: 'sawtooth' });
                    tone({ freq: 300, dur: 0.5, gain: 0.16, type: 'sawtooth', detune: 12 }); },

  levelup:  () => { const notes = [523, 659, 784, 1047];
                    notes.forEach((f, i) => tone({ freq: f, dur: 0.24, gain: 0.26, delay: i * 0.09 })); },
  gameover: () => { const notes = [523, 440, 349, 262];
                    notes.forEach((f, i) => tone({ freq: f, dur: 0.34, gain: 0.28, type: 'triangle', delay: i * 0.16 })); }
};

export function sfx(name) {
  if (!prefs.sfx) return;
  if (!ensure()) return;
  SFX[name]?.();
}

/* --------------------------------------------------------------------------
   Generative music

   A bass line and an arpeggio over a minor pentatonic, scheduled a bar at a
   time. Each game gets its own tempo and register so the three do not sound
   like the same track.
   -------------------------------------------------------------------------- */
const SCALE = [0, 3, 5, 7, 10];            // minor pentatonic, semitones
const PROFILES = {
  excavator: { root: 55.00, bpm: 132, arp: 'square',   pattern: [0, 2, 4, 2, 1, 3, 4, 3], swing: 0.0 },
  dig:       { root: 49.00, bpm: 108, arp: 'triangle', pattern: [0, 1, 2, 4, 3, 2, 1, 0], swing: 0.12 },
  defense:   { root: 43.65, bpm: 92,  arp: 'sine',     pattern: [0, 2, 3, 4, 3, 2, 1, 0], swing: 0.0 }
};

const semis = n => Math.pow(2, n / 12);

let musicTimer = null;
let nextNoteAt = 0;
let step = 0;
let currentProfile = null;

function scheduleBar(profile) {
  if (!ctx) return;
  const beat = 60 / profile.bpm;
  const eighth = beat / 2;
  const horizon = ctx.currentTime + 0.35;

  while (nextNoteAt < horizon) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    /* the bass walks around the pentatonic every four bars */
    const rootShift = SCALE[[0, 0, 3, 2][bar % 4]];
    const when = nextNoteAt - ctx.currentTime;
    const swing = inBar % 2 ? profile.swing * eighth : 0;

    /* bass on the beat */
    if (inBar % 2 === 0) {
      tone({
        freq: profile.root * semis(rootShift),
        type: 'triangle', dur: beat * 0.85, gain: 0.30,
        bus: musicBus, delay: Math.max(0, when)
      });
    }

    /* arpeggio */
    const degree = profile.pattern[inBar];
    const octave = degree >= SCALE.length ? 1 : 0;
    const note = SCALE[degree % SCALE.length] + rootShift + 12 * (2 + octave);
    tone({
      freq: profile.root * semis(note),
      type: profile.arp, dur: eighth * 0.9, gain: 0.13,
      bus: musicBus, delay: Math.max(0, when + swing)
    });

    /* a soft fifth on the first beat of every other bar */
    if (inBar === 0 && bar % 2 === 0) {
      tone({
        freq: profile.root * semis(rootShift + 19),
        type: 'sine', dur: beat * 3.2, gain: 0.07,
        bus: musicBus, delay: Math.max(0, when)
      });
    }

    nextNoteAt += eighth;
    step++;
  }
}

export function startMusic(profileName) {
  currentProfile = profileName;
  if (!prefs.music) return;
  if (!ensure()) return;

  const profile = PROFILES[profileName] || PROFILES.defense;
  stopScheduler();
  step = 0;
  nextNoteAt = ctx.currentTime + 0.08;

  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
  musicBus.gain.exponentialRampToValueAtTime(0.34, ctx.currentTime + 1.4);

  musicTimer = setInterval(() => scheduleBar(profile), 60);
  scheduleBar(profile);
}

function stopScheduler() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
}

export function stopMusic({ fade = 0.6 } = {}) {
  if (!ctx || !musicBus) { stopScheduler(); return; }
  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.setValueAtTime(Math.max(0.0001, musicBus.gain.value), ctx.currentTime);
  musicBus.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + fade);
  setTimeout(stopScheduler, fade * 1000 + 60);
}

/* --------------------------------------------------------------------------
   Preferences
   -------------------------------------------------------------------------- */
export const isSfxOn = () => prefs.sfx;
export const isMusicOn = () => prefs.music;

export function setSfx(on) {
  prefs.sfx = !!on;
  write(KEY, prefs);
  if (sfxBus && ctx) sfxBus.gain.setTargetAtTime(prefs.sfx ? 0.55 : 0, ctx.currentTime, 0.02);
  if (prefs.sfx) sfx('click');
}

export function setMusic(on) {
  prefs.music = !!on;
  write(KEY, prefs);
  if (prefs.music) startMusic(currentProfile || 'defense');
  else stopMusic();
}

/* Inline SVG rather than an emoji, which renders differently on every OS. */
const svg = inner =>
  `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true">${inner}</svg>`;

const SPEAKER = '<path d="M4 9v6h4l5 4V5L8 9H4z"/>';
const ICONS = {
  off:  svg(SPEAKER + '<path d="M17 9l4 6M21 9l-4 6"/>'),
  sfx:  svg(SPEAKER + '<path d="M16.5 9.5a4 4 0 0 1 0 5"/>'),
  full: svg(SPEAKER + '<path d="M16.5 9.5a4 4 0 0 1 0 5"/><path d="M19 7a8 8 0 0 1 0 10"/>')
};

/**
 * Wires the speaker button in the top bar. One tap cycles
 * off -> effects only -> effects and music -> off.
 */
export function wireToggle(el, profileName) {
  if (!el) return;
  currentProfile = profileName;

  const paint = () => {
    const state = !prefs.sfx ? 'off' : prefs.music ? 'full' : 'sfx';
    el.dataset.state = state;
    el.innerHTML = ICONS[state];
    el.setAttribute('aria-label',
      state === 'off' ? 'Sound off, tap for effects'
      : state === 'sfx' ? 'Effects on, tap to add music'
      : 'Effects and music on, tap to mute');
    el.title = el.getAttribute('aria-label');
  };

  el.onclick = () => {
    ensure();
    if (!prefs.sfx)        { setSfx(true);  setMusic(false); }
    else if (!prefs.music) { setMusic(true); }
    else                   { setSfx(false); setMusic(false); }
    paint();
  };

  paint();
  if (prefs.music) startMusic(profileName);
}

/** Pause the soundtrack when the tab goes away, resume when it comes back. */
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) { stopMusic({ fade: 0.2 }); }
  else if (prefs.music && currentProfile) { startMusic(currentProfile); }
});
