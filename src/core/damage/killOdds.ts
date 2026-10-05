/** Kill chance, expected damage and HP left for a whole activation. */

import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import type {
  ActivationDamageOutcome,
  DamageDistribution,
  DamageForNet,
} from '@/core/damage/damage.types';
import {
  addProbability,
  convolve,
  swingDamageDistribution,
} from '@/core/damage/damageDistribution';
import { pickedDamageForNet } from '@/core/damage/pickedDamage';
import type {
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Shift every damage value by the guaranteed `flatDamage`. */
const withFlatDamage = (
  dist: DamageDistribution,
  flatDamage: number,
): DamageDistribution => {
  const shifted: DamageDistribution = new Map();

  for (const [dmg, prob] of dist) {
    addProbability(shifted, dmg + flatDamage, prob);
  }

  return shifted;
};

/**
 * Convolves every swing's damage distribution, then reports the chance the
 * activation drops the target and the mean damage dealt. `damageForNetOf`
 * selects the per-swing damage model (play-to-kill vs. sticking to picks).
 * `flatDamage` is guaranteed (special abilities) and applied as a baseline.
 */
const activationOutcome = (
  attacks: readonly AttackRollContext[],
  flatDamage: number,
  targetHp: number,
  damageForNetOf: (attack: AttackRollContext) => DamageForNet,
): ActivationDamageOutcome => {
  let total: DamageDistribution = new Map([[0, 1]]);

  for (const attack of attacks) {
    const swing = swingDamageDistribution(attack, damageForNetOf(attack));

    total = convolve(total, swing);
  }

  // Fold guaranteed flat damage into the distribution so every stat below is
  // expressed in terms of total damage actually dealt to the target.
  const damageDistribution = withFlatDamage(total, flatDamage);

  let expectedDamage = 0;
  let expectedHpRemaining = 0;
  let killProbability = 0;

  for (const [dmg, prob] of damageDistribution) {
    const hpLeft = Math.max(0, targetHp - dmg);

    expectedDamage += dmg * prob;
    expectedHpRemaining += hpLeft * prob;

    if (dmg >= targetHp) {
      killProbability += prob;
    }
  }

  return {
    killProbability,
    expectedDamage,
    expectedHpRemaining,
    damageDistribution,
  };
};

/** Each swing only deals the damage of the lines you actually picked. */
export const planDamageOutcome = (
  attacker: AttackerData,
  attacks: readonly AttackRollContext[],
  wrapPicks: readonly (readonly WrapPick[])[],
  mods: PlaybookDamageMods,
  flatDamage: number,
  targetHp: number,
): ActivationDamageOutcome => {
  const pickedDamageOf = (attack: AttackRollContext): DamageForNet => {
    const picks = wrapPicks[attack.attackIndex] ?? [];

    return (net) => {
      return pickedDamageForNet(attacker, mods, picks, net);
    };
  };

  return activationOutcome(attacks, flatDamage, targetHp, pickedDamageOf);
};
