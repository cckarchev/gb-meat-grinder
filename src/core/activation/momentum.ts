/** Momentum pool through the activation: earned by heat picks, spent on Bonus Time. */

import { momentumEarnedBySwing } from '@/core/activation/momentousLines';
import type { MomentumParams } from '@/core/activation/momentum.types';
import { activationAttackIndices } from '@/core/attacks/attackRows';
import { BONUS_TIME_MOMENTUM_COST } from '@/core/shared/constants';

/**
 * Starting momentum plus heat picks minus Bonus Time spends, over the swings in
 * activation order up to `attackIndex` (including it when `inclusive`). Swings
 * outside the activation see just the starting momentum.
 */
const momentumAcrossSwings = (
  attackIndex: number,
  params: MomentumParams,
  inclusive: boolean,
): number => {
  const {
    attacker,
    wrapPicks,
    damageMods,
    startingMomentum,
    bonusTimeByAttack,
  } = params;

  const order = activationAttackIndices(params, wrapPicks);

  const orderPosition = order.indexOf(attackIndex);

  if (orderPosition < 0) {
    return startingMomentum;
  }

  const swingCount = inclusive ? orderPosition + 1 : orderPosition;
  let total = startingMomentum;

  for (const swingIndex of order.slice(0, swingCount)) {
    const swingPicks = wrapPicks[swingIndex] ?? [];

    total += momentumEarnedBySwing(attacker, swingPicks, damageMods);

    if (bonusTimeByAttack[swingIndex] === true) {
      total -= BONUS_TIME_MOMENTUM_COST;
    }
  }

  return total;
};

/**
 * Momentum available **before** this attack’s roll (after prior attacks’ heat
 * picks and their Bonus Time spends, not including this attack’s wrap or spend).
 */
export const momentumPoolBeforeBonusTime = (
  attackIndex: number,
  params: MomentumParams,
): number => {
  return momentumAcrossSwings(attackIndex, params, false);
};

/**
 * Total momentum after this attack in activation order: starting momentum,
 * plus heat picks through this attack, minus Bonus Time spends through this attack.
 * Earned momentum is not capped at `STARTING_MOMENTUM_RANGE.max`.
 */
export const momentumAfterAttackInclusive = (
  attackIndex: number,
  params: MomentumParams,
): number => {
  return momentumAcrossSwings(attackIndex, params, true);
};
