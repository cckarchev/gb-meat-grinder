/** Momentum the activation nets when every active swing hits. */

import {
  momentumAfterAttackInclusive,
  pickGeneratesMomentum,
} from '@/core/activation/momentum';
import type { ActivationSummaryInput } from '@/core/activation/summary/activationSummary.types';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';

/** Momentous picks across the active swings, one momentum each. */
export const momentousPicksIfAllHit = (
  input: ActivationSummaryInput,
  activeAttacks: readonly AttackRollContext[],
): number => {
  let momentum = 0;

  for (const swing of activeAttacks) {
    for (const id of input.wrapPicks[swing.attackIndex] ?? []) {
      const momentous =
        id != null &&
        pickGeneratesMomentum(input.attacker, id, input.damageMods);

      if (momentous) {
        momentum += 1;
      }
    }
  }

  return momentum;
};

/** Momentum at the end of the last active swing, plus the killing blow, minus the start. */
export const netMomentumIfAllHit = (
  input: ActivationSummaryInput,
  activeAttacks: readonly AttackRollContext[],
  killingBlowMomentum: number,
): number => {
  if (activeAttacks.length === 0) {
    return killingBlowMomentum;
  }

  const lastSwing = activeAttacks[activeAttacks.length - 1];

  const endMomentum = momentumAfterAttackInclusive(
    input.attacker,
    input.wrapPicks,
    input.damageMods,
    lastSwing.attackIndex,
    input.startingMomentum,
    input.bonusTimeByAttack,
    input.activeBaseCount,
  );

  return endMomentum + killingBlowMomentum - input.startingMomentum;
};
