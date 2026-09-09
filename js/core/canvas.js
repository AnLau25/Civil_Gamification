/**
 * canvas.js — device pixel ratio, resize handling and the frame loop.
 *
 * The interesting part is `band`. A runner or a side-on scene sized straight off
 * the canvas height blows up to half the screen on a tall phone. `band` is a
 * vertical play band derived mainly from the width, so a sprite reads the same
 * on a 390 wide phone in portrait as it does on a 16:9 desktop stage.
 */

export class Stage {
  /**
   * @param {HTMLCanvasElement} el
   * @param {(stage: Stage) => void} [onResize] called on every resize after the first
   */
  constructor(el, onResize) {
    this.el = el;
    this.ctx = el.getContext('2d');
    this.W = 0;
    this.H = 0;
    this.dpr = 1;
    this.band = 0;
    this._onResize = onResize;
    this._ready = false;

    this.resize();
    this._ready = true;

    this._boundResize = () => this.resize();
    window.addEventListener('resize', this._boundResize);
    window.addEventListener('orientationchange', () => setTimeout(this._boundResize, 220));
    /* Chrome on Android changes the visual viewport when the URL bar hides. */
    window.visualViewport?.addEventListener('resize', this._boundResize);
    if (window.ResizeObserver) {
      try { new ResizeObserver(this._boundResize).observe(el); } catch { /* not fatal */ }
    }
  }

  resize() {
    const r = this.el.getBoundingClientRect();
    if (!r.width || !r.height) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = r.width;
    this.H = r.height;
    this.el.width = Math.round(this.W * this.dpr);
    this.el.height = Math.round(this.H * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.band = Math.min(this.H * 0.95, Math.max(this.W * 0.75, this.H * 0.68));
    this.min = Math.min(this.W, this.H);

    if (this._ready) this._onResize?.(this);
  }

  clear() { this.ctx.clearRect(0, 0, this.W, this.H); }

  /** Canvas coordinates for a pointer event on this canvas. */
  pointer(e) {
    const r = this.el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
}

/**
 * requestAnimationFrame loop with a clamped delta, so a backgrounded tab does
 * not resume with a two second step and teleport everything through a wall.
 */
export class Loop {
  constructor(step, { maxDelta = 0.05 } = {}) {
    this.step = step;
    this.maxDelta = maxDelta;
    this.last = 0;
    this.running = false;
    this._frame = this._frame.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._frame);
  }

  stop() { this.running = false; }

  /** Call after a pause so the next frame does not see a huge delta. */
  resetClock() { this.last = performance.now(); }

  _frame(now) {
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    this.last = now;
    this.step(Math.min(dt, this.maxDelta), now);
    requestAnimationFrame(this._frame);
  }
}
