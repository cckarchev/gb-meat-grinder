/** Activation-wide totals and odds shown in the attacks summary. */

import {
  momentumAfterAttackInclusive,
  pickGeneratesMomentum,
} from '@/core/activation/momentum';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import { specialAbilityFlatDamage } from '@/core/damage/damage';
import { damageQuantile } from '@/core/damage/damageDistribution';
import { planDamageOutcome } from '@/core/damage/killOdds';
import type {
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import {
  damageIfAllHitsWrap,
  damageModifierBreakdownWrap,
} from '@/core/playbook/rowDamage';
import { KILLING_BLOW_MOMENTUM } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** The damage range shown is the 10th to 90th percentile of outcomes. */
const DAMAGE_RANGE_LOW_QUANTILE = 0.1;
const DAMAGE_RANGE_HIGH_QUANTILE = 0.9;

const NO_DAMAGE_TOOLTIP =
  'No selected playbook lines deal card damage to HP (after Tough Hide).';

export type ActivationSummaryInput = {
  attacker: AttackerData;
  attacks: readonly AttackRollContext[];
  /** Display index of the swing Resilience ignores, or -1. */
  ignoredAttackIndex: number;
  /** Display index of the all-hit killing blow, or -1. */
  killingBlowIndex: number;
  /** Effective (Resilience-applied) wrap picks. */
  wrapPicks: WrapPick[][];
  /** Effective (Resilience-applied) Bonus Time flags. */
  bonusTimeByAttack: boolean[];
  damageMods: PlaybookDamageMods;
  specialAbilities: Record<string, boolean>;
  startingMomentum: number;
  activeBaseCount: number;
  targetHp: number;
};

export type ActivationSummary = {
  /** Swings that actually happen: after any ignored lead through the killing blow. */
  activeAttacks: AttackRollContext[];
  totalDamageIfAllHit: number;
  netMomentumIfAllHit: number;
  netMomentumTooltip: string;
  damageDealtTooltip: string;
  planFailureProbability: number;
  killProbability: number;
  expectedDamage: number;
  expectedHpRemaining: number;
  damageRange: { low: number; high: number };
};

/** Swings from after any ignored lead swing through the killing blow. */
export const activeSwings = (
  attacks: readonly AttackRollContext[],
  ignoredAttackIndex: number,
  killingBlowIndex: number,
): AttackRollContext[] => {
  const start = ignoredAttackIndex >= 0 ? ignoredAttackIndex + 1 : 0;
  const end = killingBlowIndex >= 0 ? killingBlowIndex + 1 : attacks.length;

  return attacks.slice(start, end);
};

const momentousPicksIfAllHit = (
  input: ActivationSummaryInput,
  activeAttacks: readonly AttackRollContext[],
): number => {
  let momentum = 0;

  for (const swing of activeAttacks) {
    for (const id of input.wrapPicks[swing.attackIndex] ?? []) {
      if (
        id != null &&
        pickGeneratesMomentum(input.attacker, id, input.damageMods)
      ) {
        momentum += 1;
      }
    }
  }

  return momentum;
};

const netMomentumIfAllHit = (
  input: ActivationSummaryInput,
  activeAttacks: readonly AttackRollContext[],
  killingBlowMomentum: number,
): number => {
  if (activeAttacks.length === 0) {
    return killingBlowMomentum;
  }

  const lastSwing = activeAttacks[activeAttacks.length - 1];

  const endMomentum = momentumAfterAttackInclusive(
    input.attacker,
    input.wrapPicks,
    input.damageMods,
    lastSwing.attackIndex,
    input.startingMomentum,
    input.bonusTimeByAttack,
    input.activeBaseCount,
  );

  return endMomentum + killingBlowMomentum - input.startingMomentum;
};

const netMomentumTooltip = (
  momentousPicks: number,
  killingBlowMomentum: number,
  bonusTimeSpends: number,
): string => {
  let tooltip = `+${momentousPicks} from momentous results`;

  if (killingBlowMomentum > 0) {
    tooltip += `; +${killingBlowMomentum} killing blow`;
  }

  if (bonusTimeSpends > 0) {
    tooltip += `; -${bonusTimeSpends} Bonus Time`;
  }

  return `${tooltip}.`;
};

const damageDealtTooltip = (
  input: ActivationSummaryInput,
  flatDamage: number,
): string => {
  const breakdown = damageModifierBreakdownWrap(
    input.attacker,
    input.wrapPicks,
    input.damageMods,
    input.activeBaseCount,
  );

  const dealsNothing =
    breakdown.rawCardDamage === 0 &&
    breakdown.totalEffective === 0 &&
    flatDamage === 0;

  if (dealsNothing) {
    return NO_DAMAGE_TOOLTIP;
  }

  let tooltip = `${breakdown.rawCardDamage} from card pips`;

  if (breakdown.toughHideReduction > 0) {
    tooltip += `; -${breakdown.toughHideReduction} Tough Hide`;
  }

  for (const buff of breakdown.buffBonuses) {
    if (buff.bonus > 0) {
      tooltip += `; +${buff.bonus} ${buff.label}`;
    }
  }

  const activeAbilities = (input.attacker.specialAbilities ?? []).filter(
    (ability) => input.specialAbilities[ability.id],
  );

  for (const ability of activeAbilities) {
    tooltip += `; +${ability.flatDamage} ${ability.label}`;
  }

  return `${tooltip} = ${breakdown.totalEffective + flatDamage}.`;
};

export const summarizeActivation = (
  input: ActivationSummaryInput,
): ActivationSummary => {
  const activeAttacks = activeSwings(
    input.attacks,
    input.ignoredAttackIndex,
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

  const killingBlowMomentum =
    input.killingBlowIndex >= 0 ? KILLING_BLOW_MOMENTUM : 0;

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

  return {
    activeAttacks,
    totalDamageIfAllHit: swingDamageIfAllHit + flatDamage,
    netMomentumIfAllHit: netMomentumIfAllHit(
      input,
      activeAttacks,
      killingBlowMomentum,
    ),
    netMomentumTooltip: netMomentumTooltip(
      momentousPicksIfAllHit(input, activeAttacks),
      killingBlowMomentum,
      bonusTimeSpends,
    ),
    damageDealtTooltip: damageDealtTooltip(input, flatDamage),
    planFailureProbability: 1 - planSuccessProbability,
    killProbability: outcome.killProbability,
    expectedDamage: outcome.expectedDamage,
    expectedHpRemaining: outcome.expectedHpRemaining,
    damageRange: {
      low: damageQuantile(
        outcome.damageDistribution,
        DAMAGE_RANGE_LOW_QUANTILE,
      ),
      high: damageQuantile(
        outcome.damageDistribution,
        DAMAGE_RANGE_HIGH_QUANTILE,
      ),
    },
  };
};
