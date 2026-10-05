/** Bonus Time spends: toggling one and dropping spends the momentum can no longer pay. */

import {
  momentumPoolBeforeBonusTime,
  sanitizeBonusTimeFlags,
} from '@/core/activation/momentum';
import { BONUS_TIME_MOMENTUM_COST } from '@/core/shared/constants';
import type { MeatGrinderState } from '@/gbMeatGrinder/reducer/reducer.types';
import {
  activeBaseCountOf,
  attackerOf,
} from '@/gbMeatGrinder/reducer/stateSelectors';

const bonusTimeEqual = (
  a: readonly boolean[],
  b: readonly boolean[],
): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((v, i) => v === b[i]);
};

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

    if (pool < BONUS_TIME_MOMENTUM_COST) {
      return state;
    }
  }

  const nextFlags = [...state.bonusTimeByAttack];

  nextFlags[attackIndex] = value;

  return { ...state, bonusTimeByAttack: sanitizedBonusTime(state, nextFlags) };
};

export const resanitizeBonusTime = (
  state: MeatGrinderState,
): MeatGrinderState => {
  const sanitized = sanitizedBonusTime(state, state.bonusTimeByAttack);

  if (bonusTimeEqual(sanitized, state.bonusTimeByAttack)) {
    return state;
  }

  return { ...state, bonusTimeByAttack: sanitized };
};
