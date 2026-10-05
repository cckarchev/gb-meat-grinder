/** Momentum pool through the activation: earned by heat picks, spent on Bonus Time. */

import { momentumEarnedBySwing } from '@/core/activation/momentousLines';
import { activationAttackIndices } from '@/core/attacks/attackRows';
import type {
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { BONUS_TIME_MOMENTUM_COST } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/**
 * Starting momentum plus heat picks minus Bonus Time spends, over the swings in
 * activation order up to `attackIndex` (including it when `inclusive`). Swings
 * outside the activation see just the starting momentum.
 */
const momentumAcrossSwings = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  attackIndex: number,
  startingMomentum: number,
  bonusTimeByAttack: readonly boolean[],
  activeBaseCount: number,
  inclusive: boolean,
): number => {
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

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
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  attackIndex: number,
  startingMomentum: number,
  bonusTimeByAttack: readonly boolean[],
  activeBaseCount: number,
): number => {
  return momentumAcrossSwings(
    attacker,
    wrapPicks,
    damageMods,
    attackIndex,
    startingMomentum,
    bonusTimeByAttack,
    activeBaseCount,
    false,
  );
};

/**
 * Total momentum after this attack in activation order: starting momentum,
 * plus heat picks through this attack, minus Bonus Time spends through this attack.
 * Earned momentum is not capped at `STARTING_MOMENTUM_RANGE.max`.
 */
export const momentumAfterAttackInclusive = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  attackIndex: number,
  startingMomentum: number,
  bonusTimeByAttack: readonly boolean[],
  activeBaseCount: number,
): number => {
  return momentumAcrossSwings(
    attacker,
    wrapPicks,
    damageMods,
    attackIndex,
    startingMomentum,
    bonusTimeByAttack,
    activeBaseCount,
    true,
  );
};
