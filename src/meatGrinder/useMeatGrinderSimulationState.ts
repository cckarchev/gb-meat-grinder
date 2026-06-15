import { useEffect, useMemo, useReducer } from 'react';
import { computeAttackSequence } from '@/core/attackSequence';
import {
  createInitialMeatGrinderState,
  meatGrinderReducer,
} from '@/meatGrinder/meatGrinderReducer';
import type { MeatGrinderSimulation } from '@/types/meatGrinder/simulation';

export function useMeatGrinderSimulationState(): MeatGrinderSimulation {
  const [state, dispatch] = useReducer(
    meatGrinderReducer,
    undefined,
    createInitialMeatGrinderState,
  );

  const { wrapPicks, characterPlayPicks } = state.attackPlan;

  useEffect(() => {
    queueMicrotask(() => {
      dispatch({ type: 'sanitizeBonusTime' });
    });
  }, [wrapPicks, state.damageMods, state.startingMomentum]);

  const { attacks } = useMemo(
    () =>
      computeAttackSequence(
        state.enemyDef,
        state.armor,
        wrapPicks,
        characterPlayPicks,
        state.chargeAttackIndex,
        state.enemyHasCover,
        state.enemyDefensiveStance,
        state.damageMods,
        state.bonusTimeByAttack,
        state.initialTacModifier,
      ),
    [
      state.enemyDef,
      state.armor,
      wrapPicks,
      characterPlayPicks,
      state.chargeAttackIndex,
      state.enemyHasCover,
      state.enemyDefensiveStance,
      state.damageMods,
      state.bonusTimeByAttack,
      state.initialTacModifier,
    ],
  );

  return useMemo(
    () => ({
      enemyDef: state.enemyDef,
      armor: state.armor,
      hp: state.hp,
      chargeAttackIndex: state.chargeAttackIndex,
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
    [state, wrapPicks, characterPlayPicks, attacks, dispatch],
  );
}
