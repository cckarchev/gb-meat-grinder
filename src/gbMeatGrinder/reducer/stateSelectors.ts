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

export const attackerOf = (s: MeatGrinderState): AttackerData => {
  return attackerById(s.attackerId);
};

/** Active base attacks for the current influence / charge choice. */
export const activeBaseCountOf = (s: MeatGrinderState): number => {
  return activeBaseAttackCount(attackerOf(s), s.influence, s.charging);
};

export const clampParams = (s: MeatGrinderState): AttackPlanClampParams => {
  const attacker = attackerOf(s);

  return {
    attacker,
    chargeAttackIndex: effectiveChargeIndex(s.charging, s.chargeAttackIndex),
    armor: effectiveArmor(attacker, s.armor, s.damageMods),
    enemyHasCover: s.enemyHasCover,
    enemyDefensiveStance: s.enemyDefensiveStance,
    damageMods: s.damageMods,
    enemyDef: effectiveEnemyDef(s.enemyDef, s.enemyKnockedDown, s.enemySnared),
    bonusTimeByAttack: s.bonusTimeByAttack,
    initialTacModifier: s.gangingUp - s.crowdingOut,
    enemyKnockedDown: s.enemyKnockedDown,
    activeBaseCount: activeBaseAttackCount(attacker, s.influence, s.charging),
  };
};
