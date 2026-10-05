import { useMemo, useReducer } from 'react';
import { deriveSimulation } from '@/core/activation/simulation';
import { ATTACKERS } from '@/data/attackers/registry';
import type { MeatGrinderSimulation } from '@/gbMeatGrinder/meatGrinderSimulation.types';
import { createInitialMeatGrinderState } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import { meatGrinderReducer } from '@/gbMeatGrinder/reducer/meatGrinderReducer';
import { attackerOf } from '@/gbMeatGrinder/reducer/stateSelectors';
import { pickUiEngineResults } from '@/gbMeatGrinder/uiEngineResults';

export const useMeatGrinderSimulationState = (): MeatGrinderSimulation => {
  const [state, dispatch] = useReducer(
    meatGrinderReducer,
    undefined,
    createInitialMeatGrinderState,
  );

  const attacker = attackerOf(state);

  const derived = useMemo(
    () => deriveSimulation(attacker, state),
    [attacker, state],
  );

  return useMemo(() => {
    const { attackerId, attackPlan, bonusTimeByAttack, ...uiEditableState } =
      state;

    return {
      ...uiEditableState,
      ...pickUiEngineResults(derived),
      attacker,
      availableAttackers: ATTACKERS,
      wrapPicks: attackPlan.wrapPicks,
      characterPlayPicks: attackPlan.characterPlayPicks,
      dispatch,
    };
  }, [attacker, state, derived]);
};
