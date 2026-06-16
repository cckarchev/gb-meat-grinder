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
  effectiveBonusTimeForResilience,
  effectiveCharacterPlayPicksForResilience,
  effectiveWrapPicksForResilience,
  resilienceIgnoredAttackIndex,
} from '@/core/resilience';
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

  // The swing a Resilient target ignores, plus plan copies with that swing
  // blanked so every downstream calculation treats it as if it never happened.
  const ignoredAttackIndex = resilienceIgnoredAttackIndex(
    attacker,
    wrapPicks,
    state.damageMods,
    activeBaseCount,
    state.enemyResilience,
  );
  const effectiveWrapPicks = useMemo(
    () => effectiveWrapPicksForResilience(wrapPicks, ignoredAttackIndex),
    [wrapPicks, ignoredAttackIndex],
  );
  const effectiveCharacterPlayPicks = useMemo(
    () =>
      effectiveCharacterPlayPicksForResilience(
        characterPlayPicks,
        ignoredAttackIndex,
      ),
    [characterPlayPicks, ignoredAttackIndex],
  );
  const effectiveBonusTimeByAttack = useMemo(
    () =>
      effectiveBonusTimeForResilience(
        state.bonusTimeByAttack,
        ignoredAttackIndex,
      ),
    [state.bonusTimeByAttack, ignoredAttackIndex],
  );

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
        effectiveWrapPicks,
        effectiveCharacterPlayPicks,
        effectiveChargeAttackIndex,
        state.enemyHasCover,
        state.enemyDefensiveStance,
        state.damageMods,
        effectiveBonusTimeByAttack,
        initialTacModifier,
        activeBaseCount,
      ),
    [
      attacker,
      enemyDef,
      armor,
      effectiveWrapPicks,
      effectiveCharacterPlayPicks,
      effectiveChargeAttackIndex,
      state.enemyHasCover,
      state.enemyDefensiveStance,
      state.damageMods,
      effectiveBonusTimeByAttack,
      initialTacModifier,
      activeBaseCount,
    ],
  );

  // Display index of the ignored swing: it is always first in activation order.
  const ignoredDisplayIndex =
    ignoredAttackIndex >= 0 && attacks.length > 0 ? 0 : -1;

  const killingBlowIndex = useMemo(
    () =>
      killingBlowDisplayIndex(
        attacks,
        damageIfAllHitsWrap(
          attacker,
          effectiveWrapPicks,
          state.damageMods,
          activeBaseCount,
        ),
        specialAbilityFlatDamage(attacker, state.specialAbilities),
        state.hp,
      ),
    [
      attacks,
      attacker,
      effectiveWrapPicks,
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
      enemyResilience: state.enemyResilience,
      startingMomentum: state.startingMomentum,
      gangingUp: state.gangingUp,
      crowdingOut: state.crowdingOut,
      damageMods: state.damageMods,
      specialAbilities: state.specialAbilities,
      bonusTimeByAttack: state.bonusTimeByAttack,
      wrapPicks,
      characterPlayPicks,
      effectiveWrapPicks,
      effectiveBonusTimeByAttack,
      ignoredAttackIndex: ignoredDisplayIndex,
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
      effectiveWrapPicks,
      effectiveBonusTimeByAttack,
      ignoredDisplayIndex,
      attacks,
      killingBlowIndex,
      activeBaseCount,
      dispatch,
    ],
  );
}
