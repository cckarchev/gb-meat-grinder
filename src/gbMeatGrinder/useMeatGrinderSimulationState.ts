import { useMemo, useReducer } from 'react';
import { deriveSimulation } from '@/core/activation/simulation';
import { ATTACKERS } from '@/data/attackers/registry';
import { createInitialMeatGrinderState } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import { meatGrinderReducer } from '@/gbMeatGrinder/reducer/meatGrinderReducer';
import { attackerOf } from '@/gbMeatGrinder/reducer/stateSelectors';
import type { MeatGrinderSimulation } from '@/gbMeatGrinder/simulation.types';

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
      rowDamageIfHit: derived.rowDamageIfHit,
      flatDamage: derived.flatDamage,
      killingBlowIndex: derived.killingBlowIndex,
      dispatch,
    };
  }, [attacker, state, derived]);
};
