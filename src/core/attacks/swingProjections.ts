/** Per-swing HP and momentum under the "every pick hits" projection. */

import {
  momentumAfterAttackInclusive,
  momentumPoolBeforeBonusTime,
} from '@/core/activation/momentum';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import type {
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { isAttackIndex } from '@/core/shared/attackIndex';
import { KILLING_BLOW_MOMENTUM } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

export type SwingProjectionInput = {
  attacker: AttackerData;
  attacks: readonly AttackRollContext[];
  /** Display index of the all-hit killing blow, or -1. */
  killingBlowIndex: number;
  /** Effective (Resilience-applied) wrap picks. */
  wrapPicks: WrapPick[][];
  /** Effective (Resilience-applied) Bonus Time flags. */
  bonusTimeByAttack: boolean[];
  damageMods: PlaybookDamageMods;
  /** Damage each attack row deals if every pick on it hits, by attack index. */
  rowDamageIfHit: readonly number[];
  /** Guaranteed special-ability damage, applied before any swing. */
  flatDamage: number;
  startingMomentum: number;
  activeBaseCount: number;
  targetHp: number;
};

/** Values per display index into `attacks`. */
export type SwingProjection = {
  remainingHp: number[];
  momentum: number[];
  /** Momentum available to pay for Bonus Time before each swing. */
  bonusTimePool: number[];
};

const remainingHpAfterEachSwing = (input: SwingProjectionInput): number[] => {
  // Special-ability damage is guaranteed and untied to a swing, so apply it
  // up front as a baseline before the per-swing chip damage.
  let dealt = input.flatDamage;

  return input.attacks.map((swing) => {
    dealt += input.rowDamageIfHit[swing.attackIndex];

    return Math.max(0, input.targetHp - dealt);
  });
};

const momentumAfterEachSwing = (input: SwingProjectionInput): number[] => {
  const momentum = input.attacks.map((swing) =>
    momentumAfterAttackInclusive(
      input.attacker,
      input.wrapPicks,
      input.damageMods,
      swing.attackIndex,
      input.startingMomentum,
      input.bonusTimeByAttack,
      input.activeBaseCount,
    ),
  );

  const { killingBlowIndex } = input;

  if (!isAttackIndex(killingBlowIndex)) {
    return momentum;
  }

  // The activation ends on the killing blow: that swing earns the kill bonus
  // and later (disabled) swings freeze at the post-kill total.
  const afterKill = momentum[killingBlowIndex] + KILLING_BLOW_MOMENTUM;

  return momentum.map((value, displayIndex) =>
    displayIndex >= killingBlowIndex ? afterKill : value,
  );
};

const bonusTimePoolBeforeEachSwing = (
  input: SwingProjectionInput,
): number[] => {
  return input.attacks.map((swing) =>
    momentumPoolBeforeBonusTime(
      input.attacker,
      input.wrapPicks,
      input.damageMods,
      swing.attackIndex,
      input.startingMomentum,
      input.bonusTimeByAttack,
      input.activeBaseCount,
    ),
  );
};

export const projectSwings = (input: SwingProjectionInput): SwingProjection => {
  return {
    remainingHp: remainingHpAfterEachSwing(input),
    momentum: momentumAfterEachSwing(input),
    bonusTimePool: bonusTimePoolBeforeEachSwing(input),
  };
};
