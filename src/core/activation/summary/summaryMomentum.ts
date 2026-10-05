/** Momentum the activation nets when every active swing hits. */

import { momentumEarnedBySwing } from '@/core/activation/momentousLines';
import { momentumAfterAttackInclusive } from '@/core/activation/momentum';
import type { ActivationSummaryInput } from '@/core/activation/summary/activationSummary.types';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';

/** Momentous picks across the active swings, one momentum each. */
export const momentousPicksIfAllHit = (
  input: ActivationSummaryInput,
  activeAttacks: readonly AttackRollContext[],
): number => {
  let momentum = 0;

  for (const swing of activeAttacks) {
    momentum += momentumEarnedBySwing(
      input.attacker,
      input.wrapPicks[swing.attackIndex] ?? [],
      input.damageMods,
    );
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
    lastSwing.attackIndex,
    input,
  );

  return endMomentum + killingBlowMomentum - input.startingMomentum;
};
