/**
 * Gold Miner — tuning, item table, level table, shop.
 * Everything a designer would want to change lives in this one file.
 */

/* --------------------------------------------------------------------------
   Physics and feel. All speeds are multiples of `unit`, the smaller canvas
   dimension, so the game plays the same on a phone and on a laptop.
   -------------------------------------------------------------------------- */
export const TUNING = {
  swingArcMin:   0.50,             // radians, narrow shaft on a tall phone
  swingArcMax:   1.20,             // radians, wide bench on a laptop
  swingSpeed:    1.05,             // radians per second at level 1
  swingRamp:     0.035,            // added per level
  swingSpeedMax: 1.85,

  shootSpeed:    1.60,             // x unit per second
  returnSpeed:   2.30,             // empty hook coming home
  pullBase:      1.05,             // numerator of the loaded pull speed
  pullWeight:    0.115,            // how much weight slows the pull

  clawRadius:    0.024,            // x unit, the hook tip hit circle
  ropeWidth:     0.008,

  surfaceFrac:   0.17,             // ground line as a fraction of canvas height
  rigHeight:     0.235,            // x unit, deck to the top of the hard hat
  spawnMargin:   0.055             // keep items off the very edges
};

/* --------------------------------------------------------------------------
   Items in the dirt.
     value   dollars when it lands in the cart
     weight  1 is feather light, 12 is a boulder
     r       radius as a fraction of `unit`
   -------------------------------------------------------------------------- */
export const ITEMS = {
  goldS:   { name: 'Small gold',   value: 55,  weight: 2.2,  r: 0.040, kind: 'gold' },
  goldM:   { name: 'Gold nugget',  value: 115, weight: 4.5,  r: 0.055, kind: 'gold' },
  goldL:   { name: 'Big gold',     value: 260, weight: 8.0,  r: 0.075, kind: 'gold' },
  goldXL:  { name: 'Mother lode',  value: 500, weight: 12.0, r: 0.095, kind: 'gold' },
  diamond: { name: 'Diamond',      value: 650, weight: 1.2,  r: 0.040, kind: 'diamond' },
  rockS:   { name: 'Small rock',   value: 14,  weight: 6.0,  r: 0.062, kind: 'rock' },
  rockL:   { name: 'Boulder',      value: 24,  weight: 12.0, r: 0.090, kind: 'rock' },
  rebar:   { name: 'Rebar coil',   value: 95,  weight: 5.5,  r: 0.058, kind: 'rebar' },
  hardhat: { name: 'Hard hat',     value: 48,  weight: 1.6,  r: 0.052, kind: 'hardhat' },
  bone:    { name: 'Old bone',     value: 6,   weight: 2.5,  r: 0.045, kind: 'bone' },
  bag:     { name: 'Mystery bag',  value: 0,   weight: 3.0,  r: 0.050, kind: 'bag', question: true }
};

/* --------------------------------------------------------------------------
   Levels. `mix` is a count per item type, `goal` is the dollars needed,
   `time` is the shift length in seconds.
   -------------------------------------------------------------------------- */
export const LEVELS = [
  { name: 'First shift',      goal: 520,  time: 62,
    mix: { goldS: 4, goldM: 2, rockS: 2, hardhat: 1, bag: 1 } },
  { name: 'Deeper seam',      goal: 900,  time: 62,
    mix: { goldS: 4, goldM: 3, goldL: 1, rockS: 3, rebar: 1, bag: 1, bone: 1 } },
  { name: 'Rock trouble',     goal: 1300, time: 60,
    mix: { goldS: 3, goldM: 3, goldL: 2, rockS: 4, rockL: 2, diamond: 1, bag: 1 } },
  { name: 'Diamond pocket',   goal: 1750, time: 60,
    mix: { goldS: 3, goldM: 3, goldL: 2, diamond: 2, rockS: 3, rockL: 2, bag: 2, bone: 1 } },
  { name: 'Old foundations',  goal: 2300, time: 58,
    mix: { goldM: 3, goldL: 3, goldXL: 1, rebar: 3, rockS: 3, rockL: 2, diamond: 1, bag: 2 } },
  { name: 'Boulder field',    goal: 2950, time: 58,
    mix: { goldM: 2, goldL: 3, goldXL: 2, rockS: 4, rockL: 4, diamond: 2, bag: 2, bone: 1 } },
  { name: 'The rich vein',    goal: 3700, time: 56,
    mix: { goldM: 3, goldL: 3, goldXL: 2, diamond: 3, rockS: 3, rockL: 3, rebar: 2, bag: 2 } },
  { name: 'Mother lode',      goal: 4600, time: 56,
    mix: { goldL: 3, goldXL: 3, diamond: 3, rockS: 4, rockL: 4, rebar: 2, bag: 3, bone: 1 } }
];

export function levelSpec(n) {
  if (n <= LEVELS.length) return { n, ...LEVELS[n - 1] };
  const k = n - LEVELS.length;
  return {
    n,
    name: `Deep shaft ${k}`,
    goal: 4600 + k * 1150,
    time: 56,
    mix: {
      goldL: 3, goldXL: 3 + Math.min(3, k), diamond: 3,
      rockS: 4, rockL: 4 + Math.min(4, k), rebar: 2, bag: 3, bone: 1
    }
  };
}

/* --------------------------------------------------------------------------
   Shop. `perm` items last for the whole run, the rest are spent on one level.
   -------------------------------------------------------------------------- */
export const SHOP = [
  { id: 'tnt',     icon: '🧨', name: 'Dynamite',        cost: 130, perm: false, stack: true,
    dsc: 'Blow up whatever you are hauling. You keep a quarter of its value and the hook snaps straight back. Saves a slow boulder from eating your shift.' },
  { id: 'drink',   icon: '🥤', name: 'Strength drink',  cost: 190, perm: false,
    dsc: 'Reels in 45 percent faster for one level. The single best thing to buy on a boulder level.' },
  { id: 'clover',  icon: '🍀', name: 'Lucky clover',    cost: 160, perm: false,
    dsc: 'Every mystery bag pays out on the good table for one level, even the ones you would normally regret.' },
  { id: 'watch',   icon: '⏱️', name: 'Stopwatch',       cost: 140, perm: false,
    dsc: 'Twenty extra seconds on the clock, added the moment the level starts.' },
  { id: 'book',    icon: '📖', name: 'Rock collector',  cost: 210, perm: false,
    dsc: 'Rocks are worth triple for one level. Turns the thing that wastes your time into the thing that pays.' },
  { id: 'polish',  icon: '💎', name: 'Diamond polish',  cost: 380, perm: true,
    dsc: 'Permanent. Every diamond you ever haul is worth 60 percent more.' },
  { id: 'rope',    icon: '🪢', name: 'Braided rope',    cost: 430, perm: true,
    dsc: 'Permanent. Everything reels in 20 percent faster for the rest of the run.' }
];

/* Payouts when a mystery bag is opened by answering correctly. */
export const BAG_GOOD = [
  { w: 30, kind: 'cash',    min: 320, max: 700 },
  { w: 22, kind: 'diamond' },
  { w: 20, kind: 'time',    seconds: 15 },
  { w: 18, kind: 'tool' },
  { w: 10, kind: 'jackpot', min: 900, max: 1400 }
];

/* Payouts when the bag question is missed, or on a bad clover-less roll. */
export const BAG_BAD = [
  { w: 45, kind: 'cash', min: 8, max: 30 },
  { w: 35, kind: 'junk' },
  { w: 20, kind: 'cash', min: 40, max: 90 }
];

/* Money the payroll round pays per correct answer, before the difficulty and
   streak multipliers. */
export const PAYROLL = {
  base: 70,
  streakStep: 0.35,
  maxQuestions: 10
};
