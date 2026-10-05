import type { DerivedSimulation } from '@/core/activation/simulation.types';
import { computeAttackSequence } from '@/core/attacks/attackSequence';
import { activeBaseAttackCount } from '@/core/attacks/attackStructure';
import {
  effectiveArmor,
  effectiveEnemyDef,
  specialAbilityFlatDamage,
} from '@/core/damage/damage';
import { killingBlowDisplayIndex } from '@/core/damage/killingBlow';
import {
  effectiveBonusTimeForResilience,
  effectiveCharacterPlayPicksForResilience,
  effectiveWrapPicksForResilience,
  resilienceIgnoredAttackIndex,
} from '@/core/damage/resilience';
import { damageIfAllHitsWrap } from '@/core/playbook/rowDamage';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';
import type { MeatGrinderState } from '@/gbMeatGrinder/reducer.types';

/** Run the whole engine pipeline for one editable state. */
export const deriveSimulation = (
  attacker: AttackerData,
  state: MeatGrinderState,
): DerivedSimulation => {
  const { wrapPicks, characterPlayPicks } = state.attackPlan;

  const activeBaseCount = activeBaseAttackCount(
    attacker,
    state.influence,
    state.charging,
  );

  const effectiveChargeAttackIndex = state.charging
    ? state.chargeAttackIndex
    : NO_ATTACK_INDEX;

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

  const effectiveWrapPicks = effectiveWrapPicksForResilience(
    wrapPicks,
    ignoredAttackIndex,
  );

  const effectiveCharacterPlayPicks = effectiveCharacterPlayPicksForResilience(
    characterPlayPicks,
    ignoredAttackIndex,
  );

  const effectiveBonusTimeByAttack = effectiveBonusTimeForResilience(
    state.bonusTimeByAttack,
    ignoredAttackIndex,
  );

  const { attacks } = computeAttackSequence(
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
  );

  // The ignored swing is always first in activation order.
  const hasIgnoredSwing = ignoredAttackIndex >= 0 && attacks.length > 0;
  const ignoredDisplayIndex = hasIgnoredSwing ? 0 : NO_ATTACK_INDEX;

  const rowDamageIfHit = damageIfAllHitsWrap(
    attacker,
    effectiveWrapPicks,
    state.damageMods,
    activeBaseCount,
  );

  const flatDamage = specialAbilityFlatDamage(attacker, state.specialAbilities);

  const killingBlowIndex = killingBlowDisplayIndex(
    attacks,
    rowDamageIfHit,
    flatDamage,
    state.hp,
  );

  return {
    activeBaseCount,
    effectiveChargeAttackIndex,
    effectiveArmor: armor,
    effectiveEnemyDef: enemyDef,
    initialTacModifier,
    ignoredAttackIndex,
    ignoredDisplayIndex,
    effectiveWrapPicks,
    effectiveCharacterPlayPicks,
    effectiveBonusTimeByAttack,
    attacks,
    killingBlowIndex,
  };
};
