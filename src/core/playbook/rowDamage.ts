/** Per-row damage totals under the "every pick hits" projection. */

import { attackRowIsActive } from '@/core/attacks/attackRows';
import { availableBuffs, effectiveDamageForChoice } from '@/core/damage/damage';
import type {
  DamageModifierBreakdown,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/wrapSlots';
import type { AttackerData } from '@/data/attackers/attacker.types';

/**
 * Sums card pip damage and the marginal effects of Tough Hide and each of the
 * attacker's damage buffs across all active rows (same scope as
 * {@link damageIfAllHitsWrap}).
 */
export const damageModifierBreakdownWrap = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): DamageModifierBreakdown => {
  let rawCardDamage = 0;
  let toughHideReduction = 0;
  let totalEffective = 0;

  const buffBonuses = availableBuffs(attacker).map((buff) => ({
    id: buff.id,
    label: buff.label,
    bonus: 0,
  }));

  for (let attackIndex = 0; attackIndex < wrapPicks.length; attackIndex++) {
    const active = attackRowIsActive(
      attacker,
      wrapPicks,
      attackIndex,
      damageMods,
      activeBaseCount,
    );

    if (!active) {
      continue;
    }

    for (const id of wrapPicks[attackIndex]) {
      if (id == null) {
        continue;
      }

      const cardDamage = getPlaybookResult(attacker, id).damage;

      if (cardDamage <= 0) {
        continue;
      }

      rawCardDamage += cardDamage;

      const effective = effectiveDamageForChoice(attacker, id, damageMods);

      totalEffective += effective;

      toughHideReduction +=
        effectiveDamageForChoice(attacker, id, {
          ...damageMods,
          toughHide: false,
        }) - effective;

      for (const buffBonus of buffBonuses) {
        const withoutBuff: PlaybookDamageMods = {
          ...damageMods,
          buffs: { ...damageMods.buffs, [buffBonus.id]: false },
        };

        buffBonus.bonus +=
          effective - effectiveDamageForChoice(attacker, id, withoutBuff);
      }
    }
  }

  return {
    rawCardDamage,
    toughHideReduction,
    buffBonuses,
    totalEffective,
  };
};

/** Damage per attack if every pick on that attack hits (playbook modifiers applied). */
export const damageIfAllHitsWrap = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): number[] => {
  const pickDamage = (id: WrapPick): number => {
    if (id == null) {
      return 0;
    }

    return effectiveDamageForChoice(attacker, id, damageMods);
  };

  return wrapPicks.map((picks, attackIndex) => {
    const active = attackRowIsActive(
      attacker,
      wrapPicks,
      attackIndex,
      damageMods,
      activeBaseCount,
    );

    if (!active) {
      return 0;
    }

    return picks.reduce((sum, id) => sum + pickDamage(id), 0);
  });
};
