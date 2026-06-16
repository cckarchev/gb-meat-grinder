import { useEffect, useMemo, useReducer } from 'react';
import { attackerById, ATTACKERS } from '@/attackers/registry';
import { computeAttackSequence } from '@/core/attackSequence';
import { activeBaseAttackCount } from '@/core/attackStructure';
import {
  damageIfAllHitsWrap,
  effectiveArmor,
  effectiveEnemyDef,
  specialAbilityFlatDamage,
} from '@/core/playbook';
import { killingBlowDisplayIndex } from '@/core/killingBlow';
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
  const armor = effectiveArmor(attacker, state.armor, state.damageMods);
  const enemyDef = effectiveEnemyDef(
    state.enemyDef,
    state.enemyKnockedDown,
    state.enemySnared,
  );
  const initialTacModifier = state.gangingUp - state.crowdingOut;

  useEffect(() => {
    queueMicrotask(() => {
      dispatch({ type: 'sanitizeBonusTime' });
    });
  }, [wrapPicks, state.damageMods, state.startingMomentum, activeBaseCount]);

  const { attacks } = useMemo(
    () =>
      computeAttackSequence(
        attacker,
        enemyDef,
        armor,
        wrapPicks,
        characterPlayPicks,
        effectiveChargeAttackIndex,
        state.enemyHasCover,
        state.enemyDefensiveStance,
        state.damageMods,
        state.bonusTimeByAttack,
        initialTacModifier,
        activeBaseCount,
      ),
    [
      attacker,
      enemyDef,
      armor,
      wrapPicks,
      characterPlayPicks,
      effectiveChargeAttackIndex,
      state.enemyHasCover,
      state.enemyDefensiveStance,
      state.damageMods,
      state.bonusTimeByAttack,
      initialTacModifier,
      activeBaseCount,
    ],
  );

  const killingBlowIndex = useMemo(
    () =>
      killingBlowDisplayIndex(
        attacks,
        damageIfAllHitsWrap(
          attacker,
          wrapPicks,
          state.damageMods,
          activeBaseCount,
        ),
        specialAbilityFlatDamage(attacker, state.specialAbilities),
        state.hp,
      ),
    [
      attacks,
      attacker,
      wrapPicks,
      state.damageMods,
      activeBaseCount,
      state.specialAbilities,
      state.hp,
    ],
  );

  return useMemo(
    () => ({
      attacker,
      availableAttackers: ATTACKERS,
      enemyDef: state.enemyDef,
      armor: state.armor,
      effectiveArmor: armor,
      hp: state.hp,
      influence: state.influence,
      charging: state.charging,
      chargeAttackIndex: state.chargeAttackIndex,
      activeBaseCount,
      enemyHasCover: state.enemyHasCover,
      enemyDefensiveStance: state.enemyDefensiveStance,
      enemyKnockedDown: state.enemyKnockedDown,
      enemySnared: state.enemySnared,
      startingMomentum: state.startingMomentum,
      gangingUp: state.gangingUp,
      crowdingOut: state.crowdingOut,
      damageMods: state.damageMods,
      specialAbilities: state.specialAbilities,
      bonusTimeByAttack: state.bonusTimeByAttack,
      wrapPicks,
      characterPlayPicks,
      attacks,
      killingBlowIndex,
      dispatch,
    }),
    [
      state,
      attacker,
      armor,
      wrapPicks,
      characterPlayPicks,
      attacks,
      killingBlowIndex,
      activeBaseCount,
      dispatch,
    ],
  );
}
