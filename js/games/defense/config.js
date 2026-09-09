/**
 * Watershed Defense — contaminants, treatment units, upgrade trees, waves.
 *
 * The `eff` table is the teaching core: a unit only does real work against the
 * contaminants it actually treats in a plant. UV wastes its dose on suspended
 * solids, and coagulation is the only thing that touches dissolved metals.
 *
 * Upgrades follow the Bloons rule. Two paths per unit, three tiers each, and
 * only one path may go past tier 1. Every tier is a real process upgrade, so
 * the shop doubles as a tour of the treatment train.
 */

/* --------------------------------------------------------------------------
   Contaminants
     hp    health at wave 1
     spd   cells per second
     dmg   water quality lost if it reaches the intake
     bnt   budget earned when removed
     r     radius as a fraction of a grid cell
   -------------------------------------------------------------------------- */
export const POLLUTANTS = {
  debris: { name: 'Rags and debris',    short: 'Debris',   col: '#b4801f', col2: '#6b4708', hp: 34,  spd: 1.05, dmg: 6,  bnt: 9,   r: 0.34 },
  tss:    { name: 'Suspended solids',   short: 'TSS',      col: '#b9b3ab', col2: '#57534e', hp: 24,  spd: 1.55, dmg: 5,  bnt: 8,   r: 0.30 },
  bod:    { name: 'Organic load (BOD)', short: 'BOD',      col: '#7fb833', col2: '#3d5c12', hp: 46,  spd: 1.15, dmg: 8,  bnt: 12,  r: 0.33 },
  path:   { name: 'Pathogens',          short: 'Pathogen', col: '#f43f5e', col2: '#881337', hp: 18,  spd: 2.60, dmg: 10, bnt: 11,  r: 0.24 },
  nutr:   { name: 'Nutrients, N and P', short: 'Nutrient', col: '#22d3ee', col2: '#0e7490', hp: 62,  spd: 1.10, dmg: 12, bnt: 16,  r: 0.31 },
  metal:  { name: 'Heavy metals',       short: 'Metals',   col: '#b06cf7', col2: '#5b21b6', hp: 96,  spd: 0.90, dmg: 15, bnt: 22,  r: 0.33, armour: 4 },
  cso:    { name: 'CSO surge event',    short: 'CSO',      col: '#e0413f', col2: '#7f1d1d', hp: 600, spd: 0.70, dmg: 30, bnt: 140, r: 0.48, boss: true }
};

/* --------------------------------------------------------------------------
   Treatment units. `machine` picks the artwork in render.js.
   -------------------------------------------------------------------------- */
export const UNITS = {
  screen: {
    name: 'Bar screen', short: 'Screen', machine: 'screen',
    col: '#9fb3c8', col2: '#4a5f77', accent: '#c9a55f', cost: 60,
    dmg: 9, rate: 1.7, range: 1.9, fx: 'beam',
    eff: { debris: 2.2, tss: 1.2, bod: 0.5, path: 0.3, nutr: 0.2, metal: 0.4, cso: 1.0 },
    dsc: 'Steel bar rack under a gantry, with a mechanical rake. Cheap and fast, tears through rags and debris, does nothing to anything dissolved.'
  },
  grit: {
    name: 'Grit chamber', short: 'Grit', machine: 'grit',
    col: '#634be8', col2: '#0f5f92', accent: '#bfe6ff', cost: 95,
    dmg: 0, rate: 0, range: 2.1, slow: 0.45, fx: 'none',
    eff: {},
    dsc: 'Drops the channel velocity so grit falls out of suspension. No damage at all, but everything inside it crawls, which multiplies every other unit you own.'
  },
  sed: {
    name: 'Sedimentation basin', short: 'Sed basin', machine: 'clarifier',
    col: '#31c9d8', col2: '#0d6875', accent: '#e2f6f9', cost: 145,
    dmg: 13, rate: 0.85, range: 2.2, splash: 1.05, fx: 'ring',
    eff: { debris: 1.5, tss: 2.2, bod: 0.6, path: 0.4, nutr: 0.3, metal: 0.9, cso: 1.2 },
    dsc: 'Circular clarifier with a travelling bridge and a rotating sludge rake. Quiescent settling over a wide area, so it hits everything in the basin at once.'
  },
  coag: {
    name: 'Coagulation feed', short: 'Coag', machine: 'dosing',
    col: '#e0a53c', col2: '#8a5a10', accent: '#ffe7b0', cost: 165,
    dmg: 15, rate: 0.95, range: 2.1, pierce: true, fx: 'beam',
    eff: { debris: 0.8, tss: 1.6, bod: 0.8, path: 0.5, nutr: 1.5, metal: 2.6, cso: 1.0 },
    dsc: 'Chemical tanker and silo feeding a rapid mix. Ignores armour and is the only real answer to dissolved heavy metals.'
  },
  sludge: {
    name: 'Activated sludge', short: 'Bio', machine: 'aeration',
    col: '#4fc47b', col2: '#166534', accent: '#d5f7e2', cost: 195,
    dmg: 7, rate: 1.0, range: 2.0, dot: 11, dotSec: 2.6, fx: 'bubble',
    eff: { debris: 0.4, tss: 0.8, bod: 2.6, path: 0.6, nutr: 2.1, metal: 0.5, cso: 1.1 },
    dsc: 'Aeration basin with a blower skid and diffuser grid. A small hit, but the biology keeps eating the load for seconds afterwards, which is how BOD and nutrients actually go.'
  },
  uv: {
    name: 'UV disinfection', short: 'UV', machine: 'uv',
    col: '#a98bf5', col2: '#5b21b6', accent: '#ede9fe', cost: 215,
    dmg: 44, rate: 0.55, range: 3.0, fx: 'beam',
    eff: { debris: 0.2, tss: 0.3, bod: 0.6, path: 3.2, nutr: 0.3, metal: 0.3, cso: 0.9 },
    dsc: 'Containerised UV bank over an open channel. Long reach and brutal on pathogens, close to useless on solids because they shield whatever is behind them.'
  }
};

export const UNIT_ORDER = ['screen', 'grit', 'sed', 'coag', 'sludge', 'uv'];

/* --------------------------------------------------------------------------
   UPGRADES

   Two paths per unit, three tiers each. Only one path may go past tier 1,
   so every build is a real decision.

   effect keys
     dmg / rate / range / dot   multipliers applied on top of the base
     splash                     splash radius in cells, absolute
     slow                       slow fraction, absolute
     targets                    how many contaminants one shot hits
     pierce                     ignore armour
     strip                      permanently remove this much armour on hit
     eff                        override the effectiveness value for a
                                contaminant, this is where teaching happens
     aura                       damage bonus granted to every unit in range
   -------------------------------------------------------------------------- */
export const UPGRADES = {
  screen: {
    a: {
      name: 'Finer openings',
      tiers: [
        { name: 'Fine screen 6 mm',  cost: 90,  dsc: 'Bar spacing down from 25 mm to 6 mm, so it starts catching solids as well as rags.', effect: { dmg: 1.45, eff: { tss: 1.6 } } },
        { name: 'Micro screen 1 mm', cost: 210, dsc: 'A 1 mm mesh panel. At this point it is doing primary treatment on its own.', effect: { dmg: 1.45, eff: { tss: 2.0 } } },
        { name: 'Rotating drum screen', cost: 520, dsc: 'A continuously washed drum. Screens two flows at once and never blinds over.', effect: { dmg: 1.6, targets: 2, eff: { debris: 2.8 } } }
      ]
    },
    b: {
      name: 'Raking gear',
      tiers: [
        { name: 'Chain and rake',    cost: 80,  dsc: 'A powered chain rake instead of hand raking, so the rack clears far quicker.', effect: { rate: 1.30 } },
        { name: 'Catenary rake',     cost: 190, dsc: 'A cable rake with no submerged sprockets. Faster, and reaches further along the channel.', effect: { rate: 1.35, range: 1.15 } },
        { name: 'Climber screen',    cost: 460, dsc: 'A self-cleaning climber that never stops. Constant removal, and the first thing it touches takes extra.', effect: { rate: 1.5, dmg: 1.25 } }
      ]
    }
  },

  grit: {
    a: {
      name: 'Detention',
      tiers: [
        { name: 'Longer detention',  cost: 100, dsc: 'A longer channel gives grit the settling time it needs, and everything slows down inside.', effect: { slow: 0.58 } },
        { name: 'Vortex grit chamber', cost: 230, dsc: 'A forced vortex drops grit to the centre sump. Far more effective per square metre.', effect: { slow: 0.70 } },
        { name: 'Aerated grit chamber', cost: 540, dsc: 'Diffused air rolls the flow so organics stay in suspension while grit falls out. Scours as it holds.', effect: { slow: 0.80, dot: 1, dotAdd: 5 } }
      ]
    },
    b: {
      name: 'Basin works',
      tiers: [
        { name: 'Widened channel',   cost: 85,  dsc: 'A wider cross section covers more of the site.', effect: { range: 1.25 } },
        { name: 'Parallel trains',   cost: 200, dsc: 'Two trains side by side. Wider coverage, and the turbulence knocks armour loose.', effect: { range: 1.25, strip: 2 } },
        { name: 'Grit classifier',   cost: 500, dsc: 'A washer and classifier finishing the job. Everything you own inside this basin hits 20 percent harder.', effect: { range: 1.30, aura: 0.20 } }
      ]
    }
  },

  sed: {
    a: {
      name: 'Enhanced settling',
      tiers: [
        { name: 'Lamella plates',    cost: 160, dsc: 'Inclined plate settlers multiply the effective settling area inside the same tank.', effect: { dmg: 1.50 } },
        { name: 'Ballasted floc',    cost: 380, dsc: 'Microsand ballast makes the floc heavy, so it drops in minutes instead of hours.', effect: { dmg: 1.55, eff: { tss: 2.8 } } },
        { name: 'Dissolved air flotation', cost: 820, dsc: 'Instead of settling it, float it. Fine bubbles lift floc and grease straight to a skimmer.', effect: { dmg: 1.70, eff: { debris: 2.2, bod: 1.1 } } }
      ]
    },
    b: {
      name: 'Basin size',
      tiers: [
        { name: 'Extended launder',  cost: 140, dsc: 'More weir length lowers the overflow rate, so the quiet zone reaches further.', effect: { splash: 1.30 } },
        { name: 'Two-stage clarifier', cost: 340, dsc: 'Primary and secondary in series. A bigger quiet zone and a faster turnover.', effect: { splash: 1.55, rate: 1.15 } },
        { name: 'Solids contact clarifier', cost: 760, dsc: 'A sludge blanket the flow has to pass through. Everything in the basin keeps taking damage.', effect: { splash: 1.85, dot: 1, dotAdd: 7, dotSec: 2.2 } }
      ]
    }
  },

  coag: {
    a: {
      name: 'Dose strength',
      tiers: [
        { name: 'Jar-tested dose',   cost: 170, dsc: 'The dose actually matched to the raw water instead of guessed. Cheapest improvement in any plant.', effect: { dmg: 1.50 } },
        { name: 'Polymer aid',       cost: 400, dsc: 'A polyelectrolyte bridges the microfloc into something that will settle.', effect: { dmg: 1.50, eff: { metal: 3.2 } } },
        { name: 'Ferric chloride',   cost: 880, dsc: 'Ferric instead of alum. Works over a wider pH band and takes phosphorus down with the metals.', effect: { dmg: 1.70, eff: { metal: 4.0, nutr: 2.2 }, strip: 99 } }
      ]
    },
    b: {
      name: 'Mixing',
      tiers: [
        { name: 'In-line static mixer', cost: 150, dsc: 'Instant dispersion at the dosing point, so no coagulant is wasted.', effect: { rate: 1.35 } },
        { name: 'Flash mix basin',   cost: 360, dsc: 'A high energy mixing basin. Faster dosing, and the plume reaches whatever is beside the target.', effect: { rate: 1.35, splash: 0.75 } },
        { name: 'Two-point dosing',  cost: 790, dsc: 'Dosing before and after the mixer. Two plumes at once, covering a wide slice of the channel.', effect: { rate: 1.40, splash: 1.05, targets: 2 } }
      ]
    }
  },

  sludge: {
    a: {
      name: 'Solids retention',
      tiers: [
        { name: 'Extended aeration', cost: 200, dsc: 'A long sludge age. Slow, stable, and it keeps consuming the load long after the shot lands.', effect: { dot: 1.6 } },
        { name: 'Nitrification',     cost: 470, dsc: 'Sludge age long enough for nitrifiers to establish, so ammonia becomes nitrate.', effect: { dot: 1.6, eff: { nutr: 2.6 } } },
        { name: 'Anoxic denitrification', cost: 1000, dsc: 'An anoxic zone ahead of aeration. Nitrate goes to nitrogen gas and the nutrient load collapses.', effect: { dot: 1.8, eff: { nutr: 3.4 }, dotSec: 3.4 } }
      ]
    },
    b: {
      name: 'Biomass',
      tiers: [
        { name: 'Return activated sludge', cost: 180, dsc: 'Recycling settled biomass raises the mixed liquor concentration, so every pass removes more.', effect: { dmg: 1.60 } },
        { name: 'Membrane bioreactor', cost: 430, dsc: 'Membranes instead of a clarifier. Very high biomass, and a much longer reach.', effect: { dmg: 1.60, range: 1.18 } },
        { name: 'Bioaugmentation',   cost: 930, dsc: 'Seeded specialist cultures. The whole basin is active, not just the point of contact.', effect: { dmg: 1.70, splash: 0.95 } }
      ]
    }
  },

  uv: {
    a: {
      name: 'Dose',
      tiers: [
        { name: 'Medium pressure lamps', cost: 220, dsc: 'Broad spectrum, much higher output per lamp.', effect: { dmg: 1.55 } },
        { name: 'Upstream filtration', cost: 520, dsc: 'Raising UV transmittance matters more than raising power. Clear water, real dose.', effect: { dmg: 1.55, eff: { tss: 0.8 } } },
        { name: 'Validated 40 mJ/cm2', cost: 1100, dsc: 'A validated reactor delivering the full regulatory dose. Nothing microbial survives this.', effect: { dmg: 1.80, eff: { path: 4.6 } } }
      ]
    },
    b: {
      name: 'Reactor',
      tiers: [
        { name: 'Second lamp bank', cost: 190, dsc: 'A second bank in series. Shorter cycle between exposures.', effect: { rate: 1.40 } },
        { name: 'Longer contact channel', cost: 450, dsc: 'More contact time and a longer reach along the channel.', effect: { rate: 1.40, range: 1.22 } },
        { name: 'UV plus chlorine residual', cost: 980, dsc: 'Disinfection followed by a residual, so it carries on working downstream. Hits three at once.', effect: { rate: 1.50, targets: 3 } }
      ]
    }
  }
};

/* --------------------------------------------------------------------------
   Economy and progression
   -------------------------------------------------------------------------- */
export const RULES = {
  startBudget:    300,
  startQuality:   100,
  hpGrowth:       1.175,
  waveReward:     n => 80 + n * 18,
  earlyCallBonus: 40,
  sellRefund:     0.65,
  maxTier:        3,
  offPathCap:     1,     // the Bloons rule: the second path stops here
  grantQuestions: 3,
  grantPerWave:   n => 70 + n * 28,
  secondChanceQuality: 35
};

/* --------------------------------------------------------------------------
   Waves. Unlocks are staged so a player meets one new contaminant at a time
   and can work out which unit answers it.
   -------------------------------------------------------------------------- */
export function waveDefinition(n) {
  const groups = [];
  const add = (kind, count, gap, delay = 0) => groups.push({ kind, count, gap, delay });
  const tier = Math.floor((n - 1) / 3);

  if (n % 5 === 0) {
    add('cso', n >= 15 ? 2 : 1, 3.2, 1.0);
    add('path', 4 + Math.floor(n / 2), 0.4, 2.0);
  }
  add('debris', 6 + tier * 2, 0.85);
  if (n >= 2)  add('tss',   4 + tier * 3, 0.55, 1.2);
  if (n >= 4)  add('bod',   4 + tier * 2, 0.80, 2.4);
  if (n >= 6)  add('path',  5 + tier * 3, 0.40, 3.6);
  if (n >= 8)  add('nutr',  3 + tier * 2, 0.90, 4.6);
  if (n >= 11) add('metal', 2 + tier,     1.20, 5.6);
  return groups;
}

export const hpScale = n => Math.pow(RULES.hpGrowth, n - 1);

/** Which contaminant first shows up on which wave, for the briefing card. */
export const UNLOCKS = { 2: 'tss', 4: 'bod', 5: 'cso', 6: 'path', 8: 'nutr', 11: 'metal' };
