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

  for (let i = 0; i < wrapPicks.length; i++) {
    if (
      !attackRowIsActive(attacker, wrapPicks, i, damageMods, activeBaseCount)
    ) {
      continue;
    }

    for (const id of wrapPicks[i]) {
      if (id == null) {
        continue;
      }

      const card = getPlaybookResult(attacker, id).damage;

      if (card <= 0) {
        continue;
      }

      rawCardDamage += card;

      const full = effectiveDamageForChoice(attacker, id, damageMods);

      totalEffective += full;

      toughHideReduction +=
        effectiveDamageForChoice(attacker, id, {
          ...damageMods,
          toughHide: false,
        }) - full;

      for (const bb of buffBonuses) {
        const without: PlaybookDamageMods = {
          ...damageMods,
          buffs: { ...damageMods.buffs, [bb.id]: false },
        };

        bb.bonus += full - effectiveDamageForChoice(attacker, id, without);
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
  return wrapPicks.map((picks, i) =>
    attackRowIsActive(attacker, wrapPicks, i, damageMods, activeBaseCount)
      ? picks.reduce(
          (s, id) =>
            s +
            (id == null
              ? 0
              : effectiveDamageForChoice(attacker, id, damageMods)),
          0,
        )
      : 0,
  );
};
