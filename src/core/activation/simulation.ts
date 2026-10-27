import type { AttackerData } from "@/data/attackers/attacker.types";
import { computeAttackSequence } from "../attacks/attackSequence";
import { activeTraitFlatDamage } from "../damage/damage";
import { killingBlowDisplayIndex } from "../damage/killingBlow";
import {
  effectiveBonusTimeForResilience,
  effectiveCharacterPlayPicksForResilience,
  effectiveWrapPicksForResilience,
  resilienceIgnoredAttackIndex,
} from "../damage/resilience";
import { rowDamageIfAllHit } from "../damage/rowDamage";
import { isAttackIndex } from "../shared/attackIndex";
import { NO_ATTACK_INDEX } from "../shared/constants";
import { scenarioEffectiveStats } from "./scenarioStats";
import type { ActivationScenario, DerivedSimulation } from "./simulation.types";

type ResiliencePlan = Pick<
  DerivedSimulation,
  | "ignoredAttackIndex"
  | "effectiveWrapPicks"
  | "effectiveCharacterPlayPicks"
  | "effectiveBonusTimeByAttack"
>;

/**
 * The swing a Resilient target ignores, plus plan copies with that swing
 * blanked so every downstream calculation treats it as if it never happened.
 */
const resiliencePlan = (
  attacker: AttackerData,
  scenario: ActivationScenario,
  activeBaseCount: number,
): ResiliencePlan => {
  const { wrapPicks, characterPlayPicks } = scenario.attackPlan;

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

  return {
    ignoredAttackIndex,
    effectiveWrapPicks,
    effectiveCharacterPlayPicks,
    effectiveBonusTimeByAttack,
  };
};

/** Run the whole engine pipeline for one activation scenario. */
export const deriveSimulation = (
  attacker: AttackerData,
  scenario: ActivationScenario,
): DerivedSimulation => {
  const stats = scenarioEffectiveStats(attacker, scenario);

  const {
    activeBaseCount,
    effectiveChargeAttackIndex,
    effectiveEnemyDef,
    initialTacModifier,
  } = stats;

  const resilience = resiliencePlan(attacker, scenario, activeBaseCount);

  const effectivePlan = {
    wrapPicks: resilience.effectiveWrapPicks,
    characterPlayPicks: resilience.effectiveCharacterPlayPicks,
  };

  const { attacks, timeline } = computeAttackSequence(effectivePlan, {
    attacker,
    chargeAttackIndex: effectiveChargeAttackIndex,
    armor: scenario.armor,
    enemyHasCover: scenario.enemyHasCover,
    enemyDefensiveStance: scenario.enemyDefensiveStance,
    damageMods: scenario.damageMods,
    enemyDef: effectiveEnemyDef,
    bonusTimeByAttack: resilience.effectiveBonusTimeByAttack,
    initialTacModifier,
    activeBaseCount,
    targetHp: scenario.hp,
    enemyKnockedDown: scenario.enemyKnockedDown,
  });

  // The ignored swing is always first in activation order.
  const hasIgnoredSwing =
    isAttackIndex(resilience.ignoredAttackIndex) && attacks.length > 0;
  const ignoredDisplayIndex = hasIgnoredSwing ? 0 : NO_ATTACK_INDEX;

  const rowDamageIfHit = rowDamageIfAllHit(
    { attacker, damageMods: scenario.damageMods, activeBaseCount },
    resilience.effectiveWrapPicks,
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
    ...resilience,
    ignoredDisplayIndex,
    attacks,
    timeline,
    rowDamageIfHit,
    flatDamage,
    killingBlowIndex,
  };
};
