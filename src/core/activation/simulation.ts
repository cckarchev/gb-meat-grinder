import { scenarioEffectiveStats } from '@/core/activation/scenarioStats';
import type {
  ActivationScenario,
  DerivedSimulation,
} from '@/core/activation/simulation.types';
import { computeAttackSequence } from '@/core/attacks/attackSequence';
import { activeTraitFlatDamage } from '@/core/damage/damage';
import { killingBlowDisplayIndex } from '@/core/damage/killingBlow';
import {
  effectiveBonusTimeForResilience,
  effectiveCharacterPlayPicksForResilience,
  effectiveWrapPicksForResilience,
  resilienceIgnoredAttackIndex,
} from '@/core/damage/resilience';
import { rowDamageIfAllHit } from '@/core/damage/rowDamage';
import { isAttackIndex } from '@/core/shared/attackIndex';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Run the whole engine pipeline for one activation scenario. */
export const deriveSimulation = (
  attacker: AttackerData,
  scenario: ActivationScenario,
): DerivedSimulation => {
  const { wrapPicks, characterPlayPicks } = scenario.attackPlan;

  const stats = scenarioEffectiveStats(attacker, scenario);

  const {
    activeBaseCount,
    effectiveChargeAttackIndex,
    effectiveEnemyDef,
    initialTacModifier,
  } = stats;

  // The swing a Resilient target ignores, plus plan copies with that swing
  // blanked so every downstream calculation treats it as if it never happened.
  const ignoredAttackIndex = resilienceIgnoredAttackIndex(
    { attacker, damageMods: scenario.damageMods, activeBaseCount },
    wrapPicks,
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

  const effectivePlan = {
    wrapPicks: effectiveWrapPicks,
    characterPlayPicks: effectiveCharacterPlayPicks,
  };

  const { attacks, timeline } = computeAttackSequence(effectivePlan, {
    attacker,
    chargeAttackIndex: effectiveChargeAttackIndex,
    armor: scenario.armor,
    enemyHasCover: scenario.enemyHasCover,
    enemyDefensiveStance: scenario.enemyDefensiveStance,
    damageMods: scenario.damageMods,
    enemyDef: effectiveEnemyDef,
    bonusTimeByAttack: effectiveBonusTimeByAttack,
    initialTacModifier,
    activeBaseCount,
    targetHp: scenario.hp,
    enemyKnockedDown: scenario.enemyKnockedDown,
  });

  // The ignored swing is always first in activation order.
  const hasIgnoredSwing =
    isAttackIndex(ignoredAttackIndex) && attacks.length > 0;
  const ignoredDisplayIndex = hasIgnoredSwing ? 0 : NO_ATTACK_INDEX;

  const rowDamageIfHit = rowDamageIfAllHit(
    { attacker, damageMods: scenario.damageMods, activeBaseCount },
    effectiveWrapPicks,
    timeline,
  );

  const flatDamage = activeTraitFlatDamage(attacker, scenario.activeTraits);

  const killingBlowIndex = killingBlowDisplayIndex(
    attacks,
    rowDamageIfHit,
    flatDamage,
    scenario.hp,
  );

  return {
    ...stats,
    ignoredAttackIndex,
    ignoredDisplayIndex,
    effectiveWrapPicks,
    effectiveCharacterPlayPicks,
    effectiveBonusTimeByAttack,
    attacks,
    timeline,
    rowDamageIfHit,
    flatDamage,
    killingBlowIndex,
  };
};
