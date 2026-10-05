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
  withSwingDamageBonus,
} from '@/core/damage/damage';
import type {
  DamageModifierBreakdown,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/playbookIndex';
import type { AttackerData } from '@/data/attackers/attacker.types';

const BURNING_PASSION_ID = 'burningPassion';
const BURNING_PASSION_LABEL = 'Burning Passion';

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
  let passionBonus = 0;

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

    const state = swingStateAt(timeline, attackIndex);
    const swingMods = withSwingDamageBonus(
      damageMods,
      state.playbookDamageBonus,
    );

    const printedAmounts: { printed: number; mods: PlaybookDamageMods }[] = [];

    for (const id of wrapPicks[attackIndex]) {
      if (id == null) {
        continue;
      }

      const cardDamage = getPlaybookResult(attacker, id).damage;

      if (cardDamage <= 0) {
        continue;
      }

      rawCardDamage += cardDamage;
      printedAmounts.push({ printed: cardDamage, mods: swingMods });

      passionBonus +=
        effectivePlaybookDamage(attacker, cardDamage, swingMods) -
        effectivePlaybookDamage(attacker, cardDamage, damageMods);
    }

    // Play damage is not a playbook damage result: no Burning Passion.
    for (const play of state.damagingPlayBySlot) {
      if (play != null) {
        printedAmounts.push({ printed: play.damage ?? 0, mods: damageMods });
      }
    }

    for (const { printed, mods } of printedAmounts) {
      const effective = effectivePlaybookDamage(attacker, printed, mods);

      totalEffective += effective;

      const withoutToughHide: PlaybookDamageMods = {
        ...mods,
        toughHide: false,
      };

      toughHideReduction +=
        effectivePlaybookDamage(attacker, printed, withoutToughHide) -
        effective;

      for (const buffBonus of buffBonuses) {
        const withoutBuff: PlaybookDamageMods = {
          ...mods,
          buffs: { ...mods.buffs, [buffBonus.id]: false },
        };

        buffBonus.bonus +=
          effective - effectivePlaybookDamage(attacker, printed, withoutBuff);
      }
    }
  }

  // Listed only when it adds damage, so breakdowns without it keep their shape.
  if (passionBonus > 0) {
    buffBonuses.push({
      id: BURNING_PASSION_ID,
      label: BURNING_PASSION_LABEL,
      bonus: passionBonus,
    });
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
  const pickDamage = (id: WrapPick, mods: PlaybookDamageMods): number => {
    if (id == null) {
      return 0;
    }

    return effectiveDamageForChoice(attacker, id, mods);
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

    const state = swingStateAt(timeline, attackIndex);
    const swingMods = withSwingDamageBonus(
      damageMods,
      state.playbookDamageBonus,
    );

    const cardDamage = picks.reduce((sum, id) => {
      return sum + pickDamage(id, swingMods);
    }, 0);

    const playDamage = swingPlayDamage(state);

    return cardDamage + playDamage + state.chargeDamage;
  });
};
