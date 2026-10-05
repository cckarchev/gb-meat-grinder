import type {
  ActivationScenario,
  DerivedSimulation,
} from '@/core/activation/simulation.types';
import { computeAttackSequence } from '@/core/attacks/attackSequence';
import {
  activeBaseAttackCount,
  effectiveChargeIndex,
} from '@/core/attacks/attackStructure';
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
import { isAttackIndex } from '@/core/shared/attackIndex';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Run the whole engine pipeline for one activation scenario. */
export const deriveSimulation = (
  attacker: AttackerData,
  scenario: ActivationScenario,
): DerivedSimulation => {
  const { wrapPicks, characterPlayPicks } = scenario.attackPlan;

  const activeBaseCount = activeBaseAttackCount(
    attacker,
    scenario.influence,
    scenario.charging,
  );

  const effectiveChargeAttackIndex = effectiveChargeIndex(
    scenario.charging,
    scenario.chargeAttackIndex,
  );

  const armor = effectiveArmor(attacker, scenario.armor, scenario.damageMods);

  const enemyDef = effectiveEnemyDef(
    scenario.enemyDef,
    scenario.enemyKnockedDown,
    scenario.enemySnared,
  );

  const initialTacModifier = scenario.gangingUp - scenario.crowdingOut;

  // The swing a Resilient target ignores, plus plan copies with that swing
  // blanked so every downstream calculation treats it as if it never happened.
  const ignoredAttackIndex = resilienceIgnoredAttackIndex(
    attacker,
    wrapPicks,
    scenario.damageMods,
    activeBaseCount,
    scenario.enemyResilience,
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
    scenario.bonusTimeByAttack,
    ignoredAttackIndex,
  );

  const { attacks } = computeAttackSequence(
    attacker,
    enemyDef,
    armor,
    effectiveWrapPicks,
    effectiveCharacterPlayPicks,
    effectiveChargeAttackIndex,
    scenario.enemyHasCover,
    scenario.enemyDefensiveStance,
    scenario.damageMods,
    effectiveBonusTimeByAttack,
    initialTacModifier,
    activeBaseCount,
  );

  // The ignored swing is always first in activation order.
  const hasIgnoredSwing =
    isAttackIndex(ignoredAttackIndex) && attacks.length > 0;
  const ignoredDisplayIndex = hasIgnoredSwing ? 0 : NO_ATTACK_INDEX;

  const rowDamageIfHit = damageIfAllHitsWrap(
    attacker,
    effectiveWrapPicks,
    scenario.damageMods,
    activeBaseCount,
  );

  const flatDamage = specialAbilityFlatDamage(
    attacker,
    scenario.specialAbilities,
  );

  const killingBlowIndex = killingBlowDisplayIndex(
    attacks,
    rowDamageIfHit,
    flatDamage,
    scenario.hp,
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
    rowDamageIfHit,
    flatDamage,
    killingBlowIndex,
  };
};
