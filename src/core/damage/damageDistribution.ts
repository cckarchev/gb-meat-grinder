/** Discrete damage distributions: one swing's, the sum of several, and their quantiles. */

import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import type {
  DamageDistribution,
  DamageForNet,
  ReadonlyDamageDistribution,
} from '@/core/damage/damage.types';
import { binomialPmf } from '@/core/damage/probability';

/** Add `prob` to the probability already recorded for `damage`. */
export const addProbability = (
  dist: DamageDistribution,
  damage: number,
  prob: number,
): void => {
  const existing = dist.get(damage) ?? 0;

  dist.set(damage, existing + prob);
};

/** P(net = 0): every roll of `armor` hits or fewer is fully soaked. */
const probNoNetSuccesses = (
  tac: number,
  pHit: number,
  armor: number,
): number => {
  let prob = 0;

  for (let hits = 0; hits <= armor; hits++) {
    prob += binomialPmf(tac, pHit, hits);
  }

  return prob;
};

/**
 * Distribution of damage from one swing. Net successes are `max(0, hits - ARM)`
 * with hits ~ Binomial(tac, pHit); each net level maps to damage via `damageForNet`.
 */
export const swingDamageDistribution = (
  attack: AttackRollContext,
  damageForNet: DamageForNet,
): DamageDistribution => {
  const { tac, armor, pHit } = attack;
  const maxNet = Math.max(0, tac - armor);
  const dist: DamageDistribution = new Map();

  for (let net = 0; net <= maxNet; net++) {
    const prob =
      net === 0
        ? probNoNetSuccesses(tac, pHit, armor)
        : binomialPmf(tac, pHit, net + armor);

    if (prob <= 0) {
      continue;
    }

    addProbability(dist, damageForNet(net), prob);
  }

  return dist;
};

/** Distribution of the sum of two independent damage values. */
export const convolve = (
  a: DamageDistribution,
  b: DamageDistribution,
): DamageDistribution => {
  const sum: DamageDistribution = new Map();

  for (const [damageA, probabilityA] of a) {
    for (const [damageB, probabilityB] of b) {
      addProbability(sum, damageA + damageB, probabilityA * probabilityB);
    }
  }

  return sum;
};

/**
 * Smallest total damage whose cumulative probability reaches `quantile` (0..1).
 * Used for "likely damage" ranges (e.g. 10th/90th percentile) from a discrete
 * damage distribution. Returns 0 for an empty distribution.
 */
export const damageQuantile = (
  distribution: ReadonlyDamageDistribution,
  quantile: number,
): number => {
  const damages = [...distribution.keys()].sort((a, b) => a - b);

  if (damages.length === 0) {
    return 0;
  }

  let cumulative = 0;

  for (const damage of damages) {
    cumulative += distribution.get(damage) ?? 0;

    if (cumulative >= quantile) {
      return damage;
    }
  }

  return damages[damages.length - 1];
};
