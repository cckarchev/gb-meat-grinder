/** One pass over the activation: what each swing inherits from the swings before it. */

import type {
  ActivationTimeline,
  CarriedEffects,
  SwingState,
  TimelineParams,
} from '@/core/attacks/activationTimeline.types';
import { activationAttackIndices } from '@/core/attacks/attackRows';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import { pickEffectsForLaterSwings } from '@/core/playbook/rowEffects';
import { MAX_ARMOR_REDUCTION } from '@/core/shared/constants';

const NO_CARRIED_EFFECTS: CarriedEffects = {
  tacBonus: 0,
  defReduction: 0,
  armorReduction: 0,
};

const EMPTY_SWING_STATE: SwingState = { effectsBefore: NO_CARRIED_EFFECTS };

/** A row's state, or an empty one for a row past the end of the plan. */
export const swingStateAt = (
  timeline: ActivationTimeline,
  attackIndex: number,
): SwingState => {
  return timeline[attackIndex] ?? EMPTY_SWING_STATE;
};

export const activationTimeline = (
  plan: AttackPlan,
  params: TimelineParams,
): ActivationTimeline => {
  const { wrapPicks, characterPlayPicks } = plan;
  const { attacker, damageMods, activeBaseCount } = params;

  const states: SwingState[] = wrapPicks.map(() => EMPTY_SWING_STATE);

  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

  let tacBonus = 0;
  let defReduction = 0;
  let armorReduction = 0;

  for (const attackIndex of order) {
    states[attackIndex] = {
      effectsBefore: {
        tacBonus,
        defReduction,
        armorReduction: Math.min(MAX_ARMOR_REDUCTION, armorReduction),
      },
    };

    const row = wrapPicks[attackIndex] ?? [];

    for (let pickIndex = 0; pickIndex < row.length; pickIndex++) {
      const effects = pickEffectsForLaterSwings(
        attacker,
        wrapPicks,
        characterPlayPicks,
        attackIndex,
        pickIndex,
        damageMods,
        activeBaseCount,
      );

      tacBonus += effects.tacBonusForLater;
      defReduction += effects.defReductionForLater;
      armorReduction += effects.armorReduction;
    }
  }

  return states;
};
