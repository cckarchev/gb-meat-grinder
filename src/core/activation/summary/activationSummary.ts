/** Activation-wide totals and odds shown in the attacks summary. */

import type {
  ActivationSummary,
  ActivationSummaryInput,
} from '@/core/activation/summary/activationSummary.types';
import {
  momentousPicksIfAllHit,
  netMomentumIfAllHit,
} from '@/core/activation/summary/summaryMomentum';
import {
  damageDealtTooltip,
  netMomentumTooltip,
} from '@/core/activation/summary/summaryTooltips';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import { specialAbilityFlatDamage } from '@/core/damage/damage';
import { damageQuantile } from '@/core/damage/damageDistribution';
import { planDamageOutcome } from '@/core/damage/killOdds';
import { damageIfAllHitsWrap } from '@/core/playbook/rowDamage';
import { isAttackIndex } from '@/core/shared/attackIndex';
import { KILLING_BLOW_MOMENTUM } from '@/core/shared/constants';

/** The damage range shown is the 10th to 90th percentile of outcomes. */
const DAMAGE_RANGE_LOW_QUANTILE = 0.1;
const DAMAGE_RANGE_HIGH_QUANTILE = 0.9;

/** Swings from after any ignored lead swing through the killing blow. */
export const activeSwings = (
  attacks: readonly AttackRollContext[],
  ignoredDisplayIndex: number,
  killingBlowIndex: number,
): AttackRollContext[] => {
  const start = isAttackIndex(ignoredDisplayIndex)
    ? ignoredDisplayIndex + 1
    : 0;

  const end = isAttackIndex(killingBlowIndex)
    ? killingBlowIndex + 1
    : attacks.length;

  return attacks.slice(start, end);
};

/** Whether the swing at `displayIndex` is ignored by Resilience or comes after the killing blow. */
export const swingIsSkipped = (
  displayIndex: number,
  ignoredDisplayIndex: number,
  killingBlowIndex: number,
): boolean => {
  const ignored = displayIndex === ignoredDisplayIndex;
  const afterKill =
    isAttackIndex(killingBlowIndex) && displayIndex > killingBlowIndex;

  return ignored || afterKill;
};

export const summarizeActivation = (
  input: ActivationSummaryInput,
): ActivationSummary => {
  const activeAttacks = activeSwings(
    input.attacks,
    input.ignoredDisplayIndex,
    input.killingBlowIndex,
  );

  const flatDamage = specialAbilityFlatDamage(
    input.attacker,
    input.specialAbilities,
  );

  const rowDamageIfHit = damageIfAllHitsWrap(
    input.attacker,
    input.wrapPicks,
    input.damageMods,
    input.activeBaseCount,
  );

  const swingDamageIfAllHit = activeAttacks.reduce(
    (sum, swing) => sum + rowDamageIfHit[swing.attackIndex],
    0,
  );

  const killingBlowMomentum = isAttackIndex(input.killingBlowIndex)
    ? KILLING_BLOW_MOMENTUM
    : 0;

  const bonusTimeSpends = activeAttacks.filter(
    (swing) => input.bonusTimeByAttack[swing.attackIndex],
  ).length;

  const planSuccessProbability = activeAttacks.reduce(
    (product, swing) => product * swing.prob,
    1,
  );

  const outcome = planDamageOutcome(
    input.attacker,
    activeAttacks,
    input.wrapPicks,
    input.damageMods,
    flatDamage,
    input.targetHp,
  );

  const distribution = outcome.damageDistribution;
  const momentousPicks = momentousPicksIfAllHit(input, activeAttacks);

  return {
    activeAttacks,
    totalDamageIfAllHit: swingDamageIfAllHit + flatDamage,
    netMomentumIfAllHit: netMomentumIfAllHit(
      input,
      activeAttacks,
      killingBlowMomentum,
    ),
    netMomentumTooltip: netMomentumTooltip(
      momentousPicks,
      killingBlowMomentum,
      bonusTimeSpends,
    ),
    damageDealtTooltip: damageDealtTooltip(input, flatDamage),
    planFailureProbability: 1 - planSuccessProbability,
    killProbability: outcome.killProbability,
    expectedDamage: outcome.expectedDamage,
    expectedHpRemaining: outcome.expectedHpRemaining,
    damageRange: {
      low: damageQuantile(distribution, DAMAGE_RANGE_LOW_QUANTILE),
      high: damageQuantile(distribution, DAMAGE_RANGE_HIGH_QUANTILE),
    },
  };
};
