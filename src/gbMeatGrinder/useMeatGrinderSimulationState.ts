import { useEffect, useMemo, useReducer } from 'react';
import { attackerById, ATTACKERS } from '@/attackers/registry';
import { computeAttackSequence } from '@/core/attackSequence';
import { activeBaseAttackCount } from '@/core/attackStructure';
import {
  createInitialMeatGrinderState,
  meatGrinderReducer,
} from '@/gbMeatGrinder/meatGrinderReducer';
import type { MeatGrinderSimulation } from '@/types/gbMeatGrinder/simulation';

export function useMeatGrinderSimulationState(): MeatGrinderSimulation {
  const [state, dispatch] = useReducer(
    meatGrinderReducer,
    undefined,
    createInitialMeatGrinderState,
  );

  const { wrapPicks, characterPlayPicks } = state.attackPlan;

  const attacker = attackerById(state.attackerId);
  const activeBaseCount = activeBaseAttackCount(
    attacker,
    state.influence,
    state.charging,
  );
  const effectiveChargeAttackIndex = state.charging
    ? state.chargeAttackIndex
    : -1;

  useEffect(() => {
    queueMicrotask(() => {
      dispatch({ type: 'sanitizeBonusTime' });
    });
  }, [wrapPicks, state.damageMods, state.startingMomentum, activeBaseCount]);

  const { attacks } = useMemo(
    () =>
      computeAttackSequence(
        attacker,
        state.enemyDef,
        state.armor,
        wrapPicks,
        characterPlayPicks,
        effectiveChargeAttackIndex,
        state.enemyHasCover,
        state.enemyDefensiveStance,
        state.damageMods,
        state.bonusTimeByAttack,
        state.initialTacModifier,
        activeBaseCount,
      ),
    [
      attacker,
      state.enemyDef,
      state.armor,
      wrapPicks,
      characterPlayPicks,
      effectiveChargeAttackIndex,
      state.enemyHasCover,
      state.enemyDefensiveStance,
      state.damageMods,
      state.bonusTimeByAttack,
      state.initialTacModifier,
      activeBaseCount,
    ],
  );

  return useMemo(
    () => ({
      attacker,
      availableAttackers: ATTACKERS,
      enemyDef: state.enemyDef,
      armor: state.armor,
      hp: state.hp,
      influence: state.influence,
      charging: state.charging,
      chargeAttackIndex: state.chargeAttackIndex,
      activeBaseCount,
      enemyHasCover: state.enemyHasCover,
      enemyDefensiveStance: state.enemyDefensiveStance,
      startingMomentum: state.startingMomentum,
      initialTacModifier: state.initialTacModifier,
      damageMods: state.damageMods,
      bonusTimeByAttack: state.bonusTimeByAttack,
      wrapPicks,
      characterPlayPicks,
      attacks,
      dispatch,
    }),
    [
      state,
      attacker,
      wrapPicks,
      characterPlayPicks,
      attacks,
      activeBaseCount,
      dispatch,
    ],
  );
}
