/** Breakdown text for the momentum and damage totals in the attacks summary. */

import type { ActivationSummaryInput } from '@/core/activation/summary/activationSummary.types';
import {
  activatedTraits,
  attackerTraits,
  joinTraitLabels,
} from '@/core/attackers/buffsAndTraits';
import { swingStateAt } from '@/core/attacks/activationTimeline';
import {
  characterPlayDamageSources,
  damageModifierBreakdown,
} from '@/core/damage/rowDamage';
import { sumOf } from '@/core/shared/sumOf';

const NO_DAMAGE_TOOLTIP =
  'No selected playbook lines deal card damage to HP (after Tough Hide).';

export const netMomentumTooltip = (
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

export const damageDealtTooltip = (input: ActivationSummaryInput): string => {
  const { flatDamage } = input;

  const breakdown = damageModifierBreakdown(
    input.attacker,
    input.wrapPicks,
    input.damageMods,
    input.activeBaseCount,
    input.timeline,
  );

  const activeIndexes = input.attacks.map((swing) => swing.attackIndex);

  const chargeDamage = sumOf(activeIndexes, (attackIndex) => {
    return swingStateAt(input.timeline, attackIndex).chargeDamage;
  });

  const dealsNothing =
    breakdown.rawCardDamage === 0 &&
    breakdown.totalEffective === 0 &&
    flatDamage === 0 &&
    chargeDamage === 0;

  if (dealsNothing) {
    return NO_DAMAGE_TOOLTIP;
  }

  let tooltip = `${breakdown.rawCardDamage} from card pips`;

  // Printed play damage sits beside the card pips; Tough Hide and buffs on
  // both are itemized on their own lines below.
  const playSources = characterPlayDamageSources(input.timeline, activeIndexes);

  for (const source of playSources) {
    tooltip += `; +${source.amount} ${source.label}`;
  }

  if (breakdown.toughHideReduction > 0) {
    tooltip += `; -${breakdown.toughHideReduction} Tough Hide`;
  }

  for (const buff of breakdown.buffBonuses) {
    if (buff.bonus > 0) {
      tooltip += `; +${buff.bonus} ${buff.label}`;
    }
  }

  // Unmodified charge damage (Sweeping Charge), named after its trait.
  if (chargeDamage > 0) {
    const chargeTraits = attackerTraits(
      input.attacker,
      input.damageMods,
    ).filter((trait) => {
      return (trait.chargeDamage ?? 0) > 0;
    });

    tooltip += `; +${chargeDamage} ${joinTraitLabels(chargeTraits)}`;
  }

  for (const trait of activatedTraits(input.attacker, input.activeTraits)) {
    tooltip += `; +${trait.flatDamage ?? 0} ${trait.label}`;
  }

  const totalDamage = breakdown.totalEffective + flatDamage + chargeDamage;

  return `${tooltip} = ${totalDamage}.`;
};
