/**
 * Gold Miner — the hook.
 *
 * Four states, exactly like the arcade original:
 *
 *   SWING   the claw sweeps back and forth under the winch
 *   SHOOT   fired out along the current angle at a constant speed
 *   PULL    something is on the claw, coming back at a speed set by its weight
 *   RETURN  it grabbed nothing, snapping home fast
 *
 * The shoot step is sub-stepped so a fast claw can never tunnel through a
 * small nugget between two frames.
 */

import { TUNING } from './config.js';

export const State = { SWING: 'swing', SHOOT: 'shoot', PULL: 'pull', RETURN: 'return' };

export class Hook {
  constructor(scene) {
    this.scene = scene;
    this.state = State.SWING;
    this.angle = 0;          // 0 is straight down, positive is to the right
    this.swingT = 0;
    this.swingSpeed = TUNING.swingSpeed;
    this.len = 0;
    this.grabbed = null;
    this.pullSpeed = 0;
    this.strengthMul = 1;    // strength drink and braided rope
  }

  /** Re-read geometry after a resize or a new level. */
  setScene(scene) { this.scene = scene; }

  reset() {
    this.state = State.SWING;
    this.len = this.scene.unit * 0.05;
    this.grabbed = null;
  }

  get pivot() { return this.scene.pivot; }

  get minLen() { return this.scene.unit * 0.05; }

  get maxLen() { return this.scene.maxReach; }

  /** Claw tip in canvas coordinates. */
  tip(len = this.len) {
    const { pivot } = this.scene;
    return {
      x: pivot.x + Math.sin(this.angle) * len,
      y: pivot.y + Math.cos(this.angle) * len
    };
  }

  get isBusy() { return this.state !== State.SWING; }

  /** Fire. Ignored unless the claw is swinging. */
  shoot() {
    if (this.state !== State.SWING) return false;
    this.state = State.SHOOT;
    return true;
  }

  /**
   * @param {number} dt
   * @param {object[]} items live items, taken ones removed by the caller
   * @param {{onGrab:Function, onEmpty:Function, onLanded:Function}} events
   */
  update(dt, items, events) {
    const { unit } = this.scene;

    switch (this.state) {
      case State.SWING: {
        this.swingT += dt * this.swingSpeed;
        this.angle = Math.sin(this.swingT) * this.scene.arc;
        this.len = this.minLen;
        break;
      }

      case State.SHOOT: {
        const speed = TUNING.shootSpeed * unit;
        const clawR = TUNING.clawRadius * unit;
        /* sub-step so the smallest item is never skipped over */
        const stepMax = Math.max(2, unit * 0.02);
        let remaining = speed * dt;

        while (remaining > 0) {
          const step = Math.min(stepMax, remaining);
          remaining -= step;
          this.len += step;

          const tip = this.tip();
          const hit = items.find(it => !it.taken && Math.hypot(it.x - tip.x, it.y - tip.y) < it.r + clawR);
          if (hit) {
            this.grabbed = hit;
            hit.taken = true;
            this.state = State.PULL;
            this.pullSpeed = this.speedFor(hit);
            events.onGrab?.(hit);
            return;
          }

          if (this.len >= this.maxLen) {
            this.state = State.RETURN;
            events.onEmpty?.();
            return;
          }
        }
        break;
      }

      case State.PULL:
      case State.RETURN: {
        const speed = this.state === State.PULL
          ? this.pullSpeed
          : TUNING.returnSpeed * unit;
        this.len -= speed * dt;

        if (this.grabbed) {
          const tip = this.tip();
          this.grabbed.x = tip.x + Math.sin(this.angle) * this.grabbed.r * 0.55;
          this.grabbed.y = tip.y + Math.cos(this.angle) * this.grabbed.r * 0.55;
        }

        if (this.len <= this.minLen) {
          this.len = this.minLen;
          const landed = this.grabbed;
          this.grabbed = null;
          this.state = State.SWING;
          if (landed) events.onLanded?.(landed);
        }
        break;
      }
    }
  }

  /** Heavy things come back slowly. This is the whole tension of the game. */
  speedFor(item) {
    const { unit } = this.scene;
    const raw = TUNING.pullBase / (0.5 + item.weight * TUNING.pullWeight);
    return raw * unit * this.strengthMul;
  }

  /** Dynamite: destroy the load and snap home. */
  blastLoad() {
    if (this.state !== State.PULL || !this.grabbed) return null;
    const item = this.grabbed;
    this.grabbed = null;
    this.state = State.RETURN;
    return item;
  }
}
