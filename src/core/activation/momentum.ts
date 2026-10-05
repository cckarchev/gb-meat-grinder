/** Momentum pool through the activation: earned by heat picks, spent on Bonus Time. */

import { pickGeneratesMomentum } from '@/core/activation/momentousLines';
import { activationAttackIndices } from '@/core/attacks/attackRows';
import type {
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import {
  BONUS_TIME_MOMENTUM_COST,
  MOMENTOUS_PICK_MOMENTUM,
} from '@/core/shared/constants';
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

  const pos = order.indexOf(attackIndex);

  if (pos < 0) {
    return startingMomentum;
  }

  const swingCount = inclusive ? pos + 1 : pos;
  let total = startingMomentum;

  for (const j of order.slice(0, swingCount)) {
    for (const id of wrapPicks[j] ?? []) {
      if (pickGeneratesMomentum(attacker, id, damageMods)) {
        total += MOMENTOUS_PICK_MOMENTUM;
      }
    }

    if (bonusTimeByAttack[j] === true) {
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
 * Earned momentum is not capped at 20.
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
