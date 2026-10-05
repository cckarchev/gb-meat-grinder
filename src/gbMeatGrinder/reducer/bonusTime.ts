/**
 * Bonus Time spends: toggling one and dropping spends the momentum can no longer
 * pay. The spend adds a TAC die, so every flag change re-clamps the plan.
 */

import {
  canAffordBonusTime,
  sanitizeBonusTimeFlags,
} from '@/core/activation/bonusTimeFlags';
import { momentumPoolBeforeBonusTime } from '@/core/activation/momentum';
import { rowEqual } from '@/core/shared/gridEqual';
import { withReclampedPlan } from '@/gbMeatGrinder/reducer/planReclamp';
import type { MeatGrinderState } from '@/gbMeatGrinder/reducer/reducer.types';
import {
  activeBaseCountOf,
  attackerOf,
} from '@/gbMeatGrinder/reducer/stateSelectors';

const sanitizedBonusTime = (
  state: MeatGrinderState,
  flags: boolean[],
): boolean[] => {
  return sanitizeBonusTimeFlags(
    attackerOf(state),
    state.attackPlan.wrapPicks,
    state.damageMods,
    state.startingMomentum,
    flags,
    activeBaseCountOf(state),
  );
};

export const toggleBonusTime = (
  state: MeatGrinderState,
  attackIndex: number,
  value: boolean,
): MeatGrinderState => {
  if (value) {
    const pool = momentumPoolBeforeBonusTime(
      attackerOf(state),
      state.attackPlan.wrapPicks,
      state.damageMods,
      attackIndex,
      state.startingMomentum,
      state.bonusTimeByAttack,
      activeBaseCountOf(state),
    );

    if (!canAffordBonusTime(pool)) {
      return state;
    }
  }

  const nextFlags = [...state.bonusTimeByAttack];

  nextFlags[attackIndex] = value;

  return withReclampedPlan(state, { bonusTimeByAttack: nextFlags });
};

/**
 * Drop the spends the state can no longer pay for, keeping the same state when
 * none drop. Losing a die can drop a momentous line from the plan and unpay a
 * later spend, so it repeats until nothing drops; spends only ever turn off, so
 * it ends.
 */
export const resanitizeBonusTime = (
  state: MeatGrinderState,
): MeatGrinderState => {
  const sanitized = sanitizedBonusTime(state, state.bonusTimeByAttack);

  if (rowEqual(sanitized, state.bonusTimeByAttack)) {
    return state;
  }

  const reclamped = withReclampedPlan(state, { bonusTimeByAttack: sanitized });

  return resanitizeBonusTime(reclamped);
};
