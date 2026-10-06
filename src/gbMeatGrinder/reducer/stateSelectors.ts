/** Engine inputs derived from the app state: the model, its active bases, the clamp bounds. */

import { scenarioEffectiveStats } from '@/core/activation/scenarioStats';
import { activeBaseAttackCount } from '@/core/attacks/attackStructure';
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
  const stats = scenarioEffectiveStats(attacker, state);

  return {
    attacker,
    chargeAttackIndex: stats.effectiveChargeAttackIndex,
    armor: state.armor,
    enemyHasCover: state.enemyHasCover,
    enemyDefensiveStance: state.enemyDefensiveStance,
    damageMods: state.damageMods,
    enemyDef: stats.effectiveEnemyDef,
    bonusTimeByAttack: state.bonusTimeByAttack,
    initialTacModifier: stats.initialTacModifier,
    enemyKnockedDown: state.enemyKnockedDown,
    activeBaseCount: stats.activeBaseCount,
    targetHp: state.hp,
  };
};
