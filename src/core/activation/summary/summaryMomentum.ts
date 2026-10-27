/** Momentum the activation nets when every active swing hits. */

import type { AttackRollContext } from "../../attacks/attackSequence.types";
import { momentumEarnedBySwing } from "../momentousLines";
import { momentumAfterAttackInclusive } from "../momentum";
import type { ActivationSummaryInput } from "./activationSummary.types";

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

/**
 * Momentum at the end of the last active swing, plus the killing blow, minus
 * the start.
 */
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
