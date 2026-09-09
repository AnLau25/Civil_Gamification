/**
 * Watershed Defense — simulation. No drawing lives in here.
 */

import { POLLUTANTS, UNITS, UPGRADES, RULES, waveDefinition, hpScale } from './config.js';
import { cellCenter, pathPoint, isOnPath } from './grid.js';

/* --------------------------------------------------------------------------
   Upgrades
   -------------------------------------------------------------------------- */

/** Resolved stats for a tower, base plus every upgrade it has bought. */
export function towerStats(tower) {
  const base = UNITS[tower.type];
  const s = {
    dmg: base.dmg,
    rate: base.rate,
    range: base.range,
    splash: base.splash || 0,
    dot: base.dot || 0,
    dotSec: base.dotSec || 0,
    slow: base.slow || 0,
    targets: 1,
    pierce: !!base.pierce,
    strip: 0,
    aura: 0,
    eff: { ...base.eff }
  };

  const tree = UPGRADES[tower.type];
  for (const path of ['a', 'b']) {
    const bought = tower[path] || 0;
    for (let i = 0; i < bought; i++) {
      const e = tree[path].tiers[i].effect;
      if (e.dmg)     s.dmg *= e.dmg;
      if (e.rate)    s.rate *= e.rate;
      if (e.range)   s.range *= e.range;
      if (e.dot)     s.dot = (s.dot || 0) * e.dot;
      if (e.dotAdd)  s.dot = (s.dot || 0) + e.dotAdd;
      if (e.dotSec)  s.dotSec = e.dotSec;
      if (e.splash)  s.splash = Math.max(s.splash, e.splash);
      if (e.slow)    s.slow = Math.max(s.slow, e.slow);
      if (e.targets) s.targets = Math.max(s.targets, e.targets);
      if (e.pierce)  s.pierce = true;
      if (e.strip)   s.strip = Math.max(s.strip, e.strip);
      if (e.aura)    s.aura = Math.max(s.aura, e.aura);
      if (e.eff)     Object.assign(s.eff, e.eff);
    }
  }
  if (s.dot > 0 && !s.dotSec) s.dotSec = 2.4;
  return s;
}

/**
 * The Bloons rule. A path can always reach tier 1. Going past tier 1 locks the
 * other path at tier 1, so exactly one path can be taken all the way.
 */
export function canUpgrade(tower, path) {
  const tier = tower[path] || 0;
  const other = tower[path === 'a' ? 'b' : 'a'] || 0;
  if (tier >= RULES.maxTier) return { ok: false, reason: 'maxed' };
  if (tier >= RULES.offPathCap && other > RULES.offPathCap) {
    return { ok: false, reason: 'locked' };
  }
  return { ok: true };
}

export const nextUpgrade = (tower, path) => {
  const tier = tower[path] || 0;
  return tier < RULES.maxTier ? UPGRADES[tower.type][path].tiers[tier] : null;
};

/** What the whole tower has cost so far, which sets the sell price. */
export function investedIn(tower) {
  let total = UNITS[tower.type].cost;
  const tree = UPGRADES[tower.type];
  for (const path of ['a', 'b']) {
    for (let i = 0; i < (tower[path] || 0); i++) total += tree[path].tiers[i].cost;
  }
  return total;
}

/* --------------------------------------------------------------------------
   World
   -------------------------------------------------------------------------- */
export class World {
  constructor(grid) {
    this.grid = grid;
    this.budget = RULES.startBudget;
    this.quality = RULES.startQuality;
    this.wave = 0;
    this.speed = 1;

    this.towers = [];
    this.enemies = [];
    this.effects = [];
    this.queue = [];

    this.inWave = false;
    this.spawnClock = 0;
    this.removed = 0;
    this.leaked = 0;
    this.upgradesBought = 0;
    this.secondChance = true;
    this.startedAt = Date.now();

    this.onWaveCleared = null;
    this.onDefeat = null;
    this.onLeak = null;
    this.onKill = null;
    this.onFire = null;
  }

  /* ---------------------------------------------------------------------- */
  setGrid(grid) {
    let displaced = 0;
    this.grid = grid;
    this.towers = this.towers.filter(t => {
      const ok = t.c < grid.cols && t.r < grid.rows && !isOnPath(grid, t.c, t.r);
      if (!ok) { this.budget += Math.round(investedIn(t) * RULES.sellRefund); displaced++; }
      return ok;
    });
    return displaced;
  }

  towerAt(c, r) { return this.towers.find(t => t.c === c && t.r === r) || null; }

  canBuild(c, r) { return !isOnPath(this.grid, c, r) && !this.towerAt(c, r); }

  build(type, c, r) {
    const spec = UNITS[type];
    if (!spec || this.budget < spec.cost || !this.canBuild(c, r)) return null;
    this.budget -= spec.cost;
    const tower = { c, r, type, a: 0, b: 0, cooldown: 0, aim: 0, pulse: 0 };
    tower.stats = towerStats(tower);
    this.towers.push(tower);
    return tower;
  }

  upgrade(tower, path) {
    if (!canUpgrade(tower, path).ok) return false;
    const next = nextUpgrade(tower, path);
    if (!next || this.budget < next.cost) return false;
    this.budget -= next.cost;
    tower[path] = (tower[path] || 0) + 1;
    tower.stats = towerStats(tower);
    this.upgradesBought++;
    return next;
  }

  sell(tower) {
    const back = Math.round(investedIn(tower) * RULES.sellRefund);
    this.budget += back;
    this.towers = this.towers.filter(t => t !== tower);
    return back;
  }

  /** Damage bonus granted to a tower by any grit classifier covering it. */
  auraFor(tower) {
    let bonus = 0;
    const here = cellCenter(this.grid, tower.c, tower.r);
    for (const other of this.towers) {
      const s = other.stats || towerStats(other);
      if (!s.aura || other === tower) continue;
      const at = cellCenter(this.grid, other.c, other.r);
      if (Math.hypot(at.x - here.x, at.y - here.y) <= s.range * this.grid.cell) bonus += s.aura;
    }
    return bonus;
  }

  /* ---------------------------------------------------------------------- */
  startWave() {
    if (this.inWave) return;
    this.wave++;
    this.inWave = true;
    this.spawnClock = 0;
    const scale = hpScale(this.wave);

    this.queue = [];
    for (const g of waveDefinition(this.wave)) {
      for (let i = 0; i < g.count; i++) {
        this.queue.push({ kind: g.kind, at: g.delay + i * g.gap, scale });
      }
    }
    this.queue.sort((a, b) => a.at - b.at);
  }

  spawn(kind, scale) {
    const spec = POLLUTANTS[kind];
    const hp = spec.hp * scale;
    this.enemies.push({
      kind, spec, t: 0,
      hp, max: hp,
      armour: spec.armour || 0,
      slowUntil: 0, slowFactor: 1,
      dot: 0, dotUntil: 0,
      flash: 0,
      wobble: Math.random() * Math.PI * 2
    });
  }

  damage(enemy, amount, pierce) {
    if (enemy.armour && !pierce) amount = Math.max(1, amount - enemy.armour);
    enemy.hp -= amount;
    enemy.flash = 0.12;
    if (enemy.hp > 0) return false;

    this.budget += enemy.spec.bnt;
    this.removed++;
    const at = pathPoint(this.grid, enemy.t);
    this.effects.push({ kind: 'pop', x: at.x, y: at.y, t: 0, life: 0.42, col: enemy.spec.col });
    this.onKill?.(enemy);
    return true;
  }

  /* ---------------------------------------------------------------------- */
  step(dt, now) {
    if (this.inWave) {
      this.spawnClock += dt;
      while (this.queue.length && this.queue[0].at <= this.spawnClock) {
        const s = this.queue.shift();
        this.spawn(s.kind, s.scale);
      }
    }

    this.stepEnemies(dt, now);
    this.stepTowers(dt, now);

    for (let i = this.effects.length - 1; i >= 0; i--) {
      this.effects[i].t += dt;
      if (this.effects[i].t > this.effects[i].life) this.effects.splice(i, 1);
    }

    if (this.inWave && !this.queue.length && !this.enemies.length) {
      this.inWave = false;
      this.budget += RULES.waveReward(this.wave);
      this.onWaveCleared?.(this.wave);
    }
  }

  stepEnemies(dt, now) {
    const end = this.grid.path.length - 1;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.flash > 0) e.flash -= dt;

      if (e.dotUntil > now && e.dot > 0 && this.damage(e, e.dot * dt, true)) {
        this.enemies.splice(i, 1);
        continue;
      }

      const factor = e.slowUntil > now ? e.slowFactor : 1;
      e.t += e.spec.spd * factor * dt;
      if (e.t < end) continue;

      this.quality -= e.spec.dmg;
      this.leaked++;
      const at = pathPoint(this.grid, end);
      this.effects.push({ kind: 'leak', x: at.x, y: at.y, t: 0, life: 0.6 });
      this.enemies.splice(i, 1);
      this.onLeak?.(e);

      if (this.quality <= 0) {
        this.quality = 0;
        this.onDefeat?.();
        return;
      }
    }
  }

  stepTowers(dt, now) {
    const cell = this.grid.cell;

    for (const tower of this.towers) {
      const s = tower.stats || (tower.stats = towerStats(tower));
      const centre = cellCenter(this.grid, tower.c, tower.r);
      const reach = s.range * cell;
      if (tower.pulse > 0) tower.pulse -= dt;

      /* Slow field. A grit chamber does no damage, it just holds everything up. */
      if (s.slow) {
        for (const e of this.enemies) {
          const at = pathPoint(this.grid, e.t);
          if (Math.hypot(at.x - centre.x, at.y - centre.y) > reach) continue;
          e.slowUntil = now + 120;
          e.slowFactor = 1 - Math.min(0.85, s.slow);
          if (s.strip && e.armour > 0) e.armour = Math.max(0, e.armour - s.strip * dt);
          if (s.dot > 0) { e.dot = Math.max(e.dot, s.dot); e.dotUntil = now + 400; }
        }
        if (!s.dmg) continue;
      }

      tower.cooldown -= dt;
      if (tower.cooldown > 0) continue;

      /* Target the contaminants closest to the intake, the classic rule. */
      const inRange = [];
      for (const e of this.enemies) {
        const at = pathPoint(this.grid, e.t);
        if (Math.hypot(at.x - centre.x, at.y - centre.y) <= reach) inRange.push(e);
      }
      if (!inRange.length) continue;
      inRange.sort((x, y) => y.t - x.t);
      const targets = inRange.slice(0, s.targets);

      tower.cooldown = 1 / s.rate;
      tower.pulse = 0.22;
      const firstAt = pathPoint(this.grid, targets[0].t);
      tower.aim = Math.atan2(firstAt.y - centre.y, firstAt.x - centre.x);

      const power = s.dmg * (1 + this.auraFor(tower));

      const apply = enemy => {
        if (s.strip && enemy.armour > 0) enemy.armour = Math.max(0, enemy.armour - s.strip);
        const mult = s.eff[enemy.kind] ?? 1;
        if (this.damage(enemy, power * mult, s.pierce)) {
          const k = this.enemies.indexOf(enemy);
          if (k >= 0) this.enemies.splice(k, 1);
        }
        if (s.dot) {
          enemy.dot = Math.max(enemy.dot, s.dot * mult);
          enemy.dotUntil = now + s.dotSec * 1000;
        }
      };

      const spec = UNITS[tower.type];
      for (const target of targets) {
        const at = pathPoint(this.grid, target.t);
        if (s.splash) {
          const radius = s.splash * cell;
          for (const e of [...this.enemies]) {
            const p = pathPoint(this.grid, e.t);
            if (Math.hypot(p.x - at.x, p.y - at.y) <= radius) apply(e);
          }
          this.effects.push({ kind: 'ring', x: at.x, y: at.y, r: radius, t: 0, life: 0.32, col: spec.col });
        } else {
          apply(target);
          this.effects.push({
            kind: spec.fx === 'bubble' ? 'bubble' : 'beam',
            x: centre.x, y: centre.y, x2: at.x, y2: at.y,
            t: 0, life: spec.fx === 'bubble' ? 0.4 : 0.14, col: spec.col
          });
        }
      }
      this.onFire?.(tower);
    }
  }

  /* ---------------------------------------------------------------------- */
  reviveAfterSecondChance() {
    this.quality = RULES.secondChanceQuality;
    this.enemies = [];
    this.budget += 150;
  }

  score() {
    return Math.round(
      this.wave * 1000 + this.removed * 8 + this.quality * 40 +
      this.budget * 0.3 + this.upgradesBought * 120
    );
  }
}
