/** Engine inputs derived from the app state: the model, its active bases, the clamp bounds. */

import { activeBaseAttackCount } from '@/core/attacks/attackStructure';
import { effectiveArmor, effectiveEnemyDef } from '@/core/damage/damage';
import type { AttackPlanClampParams } from '@/core/plan/attackPlan.types';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
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

/** Charge row the engine should use: the chosen base, or none when not charging. */
const effectiveChargeIndex = (s: MeatGrinderState): number => {
  return s.charging ? s.chargeAttackIndex : NO_ATTACK_INDEX;
};

export const clampParams = (s: MeatGrinderState): AttackPlanClampParams => {
  return {
    attacker: attackerOf(s),
    chargeAttackIndex: effectiveChargeIndex(s),
    armor: effectiveArmor(attackerOf(s), s.armor, s.damageMods),
    enemyHasCover: s.enemyHasCover,
    enemyDefensiveStance: s.enemyDefensiveStance,
    damageMods: s.damageMods,
    enemyDef: effectiveEnemyDef(s.enemyDef, s.enemyKnockedDown, s.enemySnared),
    bonusTimeByAttack: s.bonusTimeByAttack,
    initialTacModifier: s.gangingUp - s.crowdingOut,
    enemyKnockedDown: s.enemyKnockedDown,
    activeBaseCount: activeBaseCountOf(s),
  };
};
