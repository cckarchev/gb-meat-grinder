import { useEffect, useMemo, useReducer } from 'react';
import { ATTACKERS, attackerById } from '@/attackers/registry';
import { deriveSimulation } from '@/core/simulation';
import { createInitialMeatGrinderState } from '@/gbMeatGrinder/meatGrinderInitialState';
import { meatGrinderReducer } from '@/gbMeatGrinder/meatGrinderReducer';
import type { MeatGrinderSimulation } from '@/types/gbMeatGrinder/simulation';

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

  const { wrapPicks, characterPlayPicks } = state.attackPlan;
  const { activeBaseCount } = derived;

  useEffect(() => {
    queueMicrotask(() => {
      dispatch({ type: 'sanitizeBonusTime' });
    });
  }, [wrapPicks, state.damageMods, state.startingMomentum, activeBaseCount]);

  return useMemo(
    () => ({
      attacker,
      availableAttackers: ATTACKERS,
      enemyDef: state.enemyDef,
      armor: state.armor,
      effectiveArmor: derived.effectiveArmor,
      hp: state.hp,
      influence: state.influence,
      charging: state.charging,
      chargeAttackIndex: state.chargeAttackIndex,
      activeBaseCount,
      enemyHasCover: state.enemyHasCover,
      enemyDefensiveStance: state.enemyDefensiveStance,
      enemyKnockedDown: state.enemyKnockedDown,
      enemySnared: state.enemySnared,
      enemyResilience: state.enemyResilience,
      startingMomentum: state.startingMomentum,
      gangingUp: state.gangingUp,
      crowdingOut: state.crowdingOut,
      damageMods: state.damageMods,
      specialAbilities: state.specialAbilities,
      bonusTimeByAttack: state.bonusTimeByAttack,
      wrapPicks,
      characterPlayPicks,
      effectiveWrapPicks: derived.effectiveWrapPicks,
      effectiveBonusTimeByAttack: derived.effectiveBonusTimeByAttack,
      ignoredAttackIndex: derived.ignoredDisplayIndex,
      attacks: derived.attacks,
      killingBlowIndex: derived.killingBlowIndex,
      dispatch,
    }),
    [attacker, state, derived, wrapPicks, characterPlayPicks, activeBaseCount],
  );
};
