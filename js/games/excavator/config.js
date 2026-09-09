/**
 * Excavator Run — tuning.
 * Distances are multiples of `band`, the vertical play band from Stage, so the
 * jump always clears the same fraction of an obstacle on any screen.
 */

export const TUNING = {
  groundFrac:    0.20,    // ground line sits this far above the bottom, x band
  obstacleUnit:  0.135,   // x band
  playerUnit:    0.085,   // x band

  jumpVelocity:  2.15,    // x band per second
  gravity:       6.00,    // x band per second squared

  startSpeed:    0.50,    // x canvas width per second
  accel:         0.045,
  maxSpeed:      1.05,

  spawnMin:      0.70,    // seconds between obstacles at top speed
  spawnRandLo:   1.05,
  spawnRandHi:   1.90,

  invincibleMs:  1600,    // grace window after clearing a question
  comboStep:     0.25,    // points multiplier gained per streak
  comboMax:      3.0,
  pointsPerDiff: 50,      // question points = this x difficulty x multiplier
  fiftyEvery:    3        // correct answers per 50/50 earned
};
