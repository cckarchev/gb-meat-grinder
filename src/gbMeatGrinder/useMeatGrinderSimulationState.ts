import { useMemo, useReducer } from 'react';
import { deriveSimulation } from '@/core/activation/simulation';
import { ATTACKERS, attackerById } from '@/data/attackers/registry';
import { createInitialMeatGrinderState } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import { meatGrinderReducer } from '@/gbMeatGrinder/reducer/meatGrinderReducer';
import type { MeatGrinderSimulation } from '@/gbMeatGrinder/simulation.types';

export const useMeatGrinderSimulationState = (): MeatGrinderSimulation => {
  const [state, dispatch] = useReducer(
    meatGrinderReducer,
    undefined,
    createInitialMeatGrinderState,
  );

  const attacker = attackerById(state.attackerId);

  const derived = useMemo(
    () => deriveSimulation(attacker, state),
    [attacker, state],
  );

  return useMemo(() => {
    const { attackerId, attackPlan, bonusTimeByAttack, ...exposedState } =
      state;

    return {
      ...exposedState,
      attacker,
      availableAttackers: ATTACKERS,
      activeBaseCount: derived.activeBaseCount,
      effectiveChargeAttackIndex: derived.effectiveChargeAttackIndex,
      wrapPicks: attackPlan.wrapPicks,
      characterPlayPicks: attackPlan.characterPlayPicks,
      effectiveWrapPicks: derived.effectiveWrapPicks,
      effectiveBonusTimeByAttack: derived.effectiveBonusTimeByAttack,
      ignoredDisplayIndex: derived.ignoredDisplayIndex,
      attacks: derived.attacks,
      killingBlowIndex: derived.killingBlowIndex,
      dispatch,
    };
  }, [attacker, state, derived]);
};
