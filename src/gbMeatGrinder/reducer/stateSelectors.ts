/** Engine inputs derived from the app state: the model, its active bases, the clamp bounds. */

import {
  activeBaseAttackCount,
  effectiveChargeIndex,
} from '@/core/attacks/attackStructure';
import { effectiveArmor, effectiveEnemyDef } from '@/core/damage/damage';
import type { AttackPlanClampParams } from '@/core/plan/attackPlan.types';
import type { AttackerData } from '@/data/attackers/attacker.types';
import { attackerById } from '@/data/attackers/registry';
import type { MeatGrinderState } from '@/gbMeatGrinder/reducer/reducer.types';

export const attackerOf = (state: MeatGrinderState): AttackerData => {
  return attackerById(state.attackerId);
};

/** Active base attacks for the current influence / charge choice. */
export const activeBaseCountOf = (state: MeatGrinderState): number => {
  return activeBaseAttackCount(
    attackerOf(state),
    state.influence,
    state.charging,
  );
};

export const clampParams = (state: MeatGrinderState): AttackPlanClampParams => {
  const attacker = attackerOf(state);

  return {
    attacker,
    chargeAttackIndex: effectiveChargeIndex(
      state.charging,
      state.chargeAttackIndex,
    ),
    armor: effectiveArmor(attacker, state.armor, state.damageMods),
    enemyHasCover: state.enemyHasCover,
    enemyDefensiveStance: state.enemyDefensiveStance,
    damageMods: state.damageMods,
    enemyDef: effectiveEnemyDef(
      state.enemyDef,
      state.enemyKnockedDown,
      state.enemySnared,
    ),
    bonusTimeByAttack: state.bonusTimeByAttack,
    initialTacModifier: state.gangingUp - state.crowdingOut,
    enemyKnockedDown: state.enemyKnockedDown,
    activeBaseCount: activeBaseCountOf(state),
  };
};
