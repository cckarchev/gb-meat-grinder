/** Per-swing HP and momentum under the "every pick hits" projection. */

import {
  momentumAfterAttackInclusive,
  momentumPoolBeforeBonusTime,
} from '@/core/activation/momentum';
import type { ActivationTimeline } from '@/core/attacks/activationTimeline.types';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import { hpAfterDamage } from '@/core/damage/hpAfterDamage';
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
  /** Display index of the all-hit killing blow, or `NO_ATTACK_INDEX`. */
  killingBlowIndex: number;
  /** Effective (Resilience-applied) wrap picks. */
  wrapPicks: WrapPick[][];
  /** Effective (Resilience-applied) Bonus Time flags. */
  bonusTimeByAttack: boolean[];
  damageMods: PlaybookDamageMods;
  /** Per-swing state the engine derived, by attack index. */
  timeline: ActivationTimeline;
  /** Damage each attack row deals if every pick on it hits, by attack index. */
  rowDamageIfHit: readonly number[];
  /** Guaranteed activated-trait damage, applied before any swing. */
  flatDamage: number;
  startingMomentum: number;
  activeBaseCount: number;
  targetHp: number;
};

/** Values per display index into `attacks`. */
type SwingProjection = {
  /** HP before the first swing, after activated-trait damage. */
  startingHp: number;
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

    return hpAfterDamage(input.targetHp, dealt);
  });
};

const momentumAfterEachSwing = (input: SwingProjectionInput): number[] => {
  const momentum = input.attacks.map((swing) =>
    momentumAfterAttackInclusive(swing.attackIndex, input),
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
    momentumPoolBeforeBonusTime(swing.attackIndex, input),
  );
};

export const projectSwings = (input: SwingProjectionInput): SwingProjection => {
  return {
    startingHp: hpAfterDamage(input.targetHp, input.flatDamage),
    remainingHp: remainingHpAfterEachSwing(input),
    momentum: momentumAfterEachSwing(input),
    bonusTimePool: bonusTimePoolBeforeEachSwing(input),
  };
};
