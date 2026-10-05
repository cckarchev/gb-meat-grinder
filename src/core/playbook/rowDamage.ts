/** Per-row damage totals under the "every pick hits" projection. */

import {
  swingPlayDamage,
  swingStateAt,
} from '@/core/attacks/activationTimeline';
import type { ActivationTimeline } from '@/core/attacks/activationTimeline.types';
import { attackRowIsActive } from '@/core/attacks/attackRows';
import {
  availableBuffs,
  effectiveDamageForChoice,
  effectivePlaybookDamage,
} from '@/core/damage/damage';
import type {
  DamageModifierBreakdown,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/playbookIndex';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** A damage source the breakdown itemizes, at its printed amount. */
export type PrintedDamageSource = { label: string; amount: number };

/**
 * The damaging plays live on the given swings, by play, at their printed amount
 * (Tough Hide and buffs are itemized on their own lines).
 */
export const characterPlayDamageSources = (
  timeline: ActivationTimeline,
  attackIndexes: readonly number[],
): PrintedDamageSource[] => {
  const byPlay = new Map<string, PrintedDamageSource>();

  for (const attackIndex of attackIndexes) {
    const state = swingStateAt(timeline, attackIndex);

    for (const play of state.damagingPlayBySlot) {
      if (play == null) {
        continue;
      }

      const printed = play.damage ?? 0;
      const source = byPlay.get(play.id) ?? { label: play.label, amount: 0 };

      byPlay.set(play.id, { ...source, amount: source.amount + printed });
    }
  }

  return [...byPlay.values()];
};

/**
 * Sums card pip damage and the marginal effects of Tough Hide and each of the
 * attacker's damage buffs across all active rows (same scope as
 * {@link rowDamageIfAllHit}). Damaging plays add to the totals and to the Tough
 * Hide and buff lines, but not to the card damage.
 */
export const damageModifierBreakdown = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
  timeline: ActivationTimeline,
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

    const printedAmounts: number[] = [];

    for (const id of wrapPicks[attackIndex]) {
      if (id == null) {
        continue;
      }

      const cardDamage = getPlaybookResult(attacker, id).damage;

      if (cardDamage <= 0) {
        continue;
      }

      rawCardDamage += cardDamage;
      printedAmounts.push(cardDamage);
    }

    for (const play of swingStateAt(timeline, attackIndex).damagingPlayBySlot) {
      if (play != null) {
        printedAmounts.push(play.damage ?? 0);
      }
    }

    for (const printed of printedAmounts) {
      const effective = effectivePlaybookDamage(attacker, printed, damageMods);

      totalEffective += effective;

      const withoutToughHide: PlaybookDamageMods = {
        ...damageMods,
        toughHide: false,
      };

      toughHideReduction +=
        effectivePlaybookDamage(attacker, printed, withoutToughHide) -
        effective;

      for (const buffBonus of buffBonuses) {
        const withoutBuff: PlaybookDamageMods = {
          ...damageMods,
          buffs: { ...damageMods.buffs, [buffBonus.id]: false },
        };

        buffBonus.bonus +=
          effective - effectivePlaybookDamage(attacker, printed, withoutBuff);
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

/**
 * Damage per attack if every pick on that attack hits (playbook modifiers
 * applied), including the damaging plays those picks trigger.
 */
export const rowDamageIfAllHit = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
  timeline: ActivationTimeline,
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

    const cardDamage = picks.reduce((sum, id) => sum + pickDamage(id), 0);
    const playDamage = swingPlayDamage(swingStateAt(timeline, attackIndex));

    return cardDamage + playDamage;
  });
};
