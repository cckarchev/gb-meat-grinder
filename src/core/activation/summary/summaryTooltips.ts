/** Breakdown text for the momentum and damage totals in the attacks summary. */

import type { ActivationSummaryInput } from '@/core/activation/summary/activationSummary.types';
import { damageModifierBreakdownWrap } from '@/core/playbook/rowDamage';

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

export const damageDealtTooltip = (
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

  const totalDamage = breakdown.totalEffective + flatDamage;

  return `${tooltip} = ${totalDamage}.`;
};
