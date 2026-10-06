/** Kill chance, expected damage and HP left for a whole activation. */

import {
  swingStateAt,
  swingStateDamageMods,
} from '@/core/attacks/activationTimeline';
import type {
  ActivationTimeline,
  SwingState,
} from '@/core/attacks/activationTimeline.types';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import {
  playDamageForHealth,
  swingHasHealthPlay,
} from '@/core/attacks/swingPlayDamage';
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

  for (const [damage, prob] of dist) {
    addProbability(shifted, damage + flatDamage, prob);
  }

  return shifted;
};

/** One swing's damage distribution when the target has `hpLeft` HP before it. */
const swingDistributionAt = (
  attacker: AttackerData,
  attack: AttackRollContext,
  picks: readonly WrapPick[],
  swingMods: PlaybookDamageMods,
  state: SwingState,
  hpLeft: number,
): DamageDistribution => {
  const extras = {
    playDamageBySlot: playDamageForHealth(state, hpLeft),
    chargeTraitDamage: state.chargeTraitDamage,
  };

  const pickedDamage: DamageForNet = (net) => {
    return pickedDamageForNet(attacker, swingMods, picks, net, extras);
  };

  return swingDamageDistribution(attack, pickedDamage);
};

/**
 * Adds a swing whose play damage scales with the target's current HP: for each
 * damage total so far, the swing is rolled against the HP that total leaves.
 */
const addHealthDependentSwing = (
  total: DamageDistribution,
  swingAt: (hpLeft: number) => DamageDistribution,
  targetHp: number,
): DamageDistribution => {
  const next: DamageDistribution = new Map();

  for (const [damageSoFar, probSoFar] of total) {
    const swing = swingAt(targetHp - damageSoFar);

    for (const [swingDamage, swingProb] of swing) {
      addProbability(next, damageSoFar + swingDamage, probSoFar * swingProb);
    }
  }

  return next;
};

/**
 * Convolves every swing's damage distribution, where each swing only deals the
 * damage of the lines actually picked (a play scaled by current HP is rolled
 * per damage total instead, since it depends on what came before), then
 * reports the chance the activation drops the target and the mean damage
 * dealt. `flatDamage` is guaranteed (activated traits) and applied as a
 * baseline.
 */
export const planDamageOutcome = (
  attacker: AttackerData,
  attacks: readonly AttackRollContext[],
  wrapPicks: readonly (readonly WrapPick[])[],
  mods: PlaybookDamageMods,
  flatDamage: number,
  targetHp: number,
  timeline: ActivationTimeline,
): ActivationDamageOutcome => {
  let total: DamageDistribution = new Map([[0, 1]]);

  for (const attack of attacks) {
    const picks = wrapPicks[attack.attackIndex] ?? [];
    const state = swingStateAt(timeline, attack.attackIndex);
    const swingMods = swingStateDamageMods(mods, state);

    const swingAt = (hpLeft: number): DamageDistribution => {
      return swingDistributionAt(
        attacker,
        attack,
        picks,
        swingMods,
        state,
        hpLeft,
      );
    };

    if (swingHasHealthPlay(state)) {
      total = addHealthDependentSwing(total, swingAt, targetHp);

      continue;
    }

    total = convolve(total, swingAt(targetHp));
  }

  // Fold guaranteed flat damage into the distribution so every stat below is
  // expressed in terms of total damage actually dealt to the target.
  const damageDistribution = withFlatDamage(total, flatDamage);

  let expectedDamage = 0;
  let expectedHpRemaining = 0;
  let killProbability = 0;

  for (const [damage, prob] of damageDistribution) {
    const hpLeft = Math.max(0, targetHp - damage);

    expectedDamage += damage * prob;
    expectedHpRemaining += hpLeft * prob;

    if (damage >= targetHp) {
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
