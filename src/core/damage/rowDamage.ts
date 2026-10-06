/** Per-row damage totals under the "every pick hits" projection. */

import {
  attackerTraits,
  availableBuffs,
  joinTraitLabels,
} from '@/core/attackers/buffsAndTraits';
import {
  swingDamageIfAllHit,
  swingStateAt,
  swingStateDamageMods,
} from '@/core/attacks/activationTimeline';
import type {
  ActivationTimeline,
  SwingState,
} from '@/core/attacks/activationTimeline.types';
import { attackRowIsActive } from '@/core/attacks/attackRows';
import type { ActivationOrderParams } from '@/core/attacks/attackSequence.types';
import { slotScalesWithHealth } from '@/core/attacks/swingPlayDamage';
import {
  effectivePlaybookDamage,
  effectivePlayDamage,
  withSwingDamageBonus,
} from '@/core/damage/damage';
import type {
  DamageBuffBonus,
  DamageModifierBreakdown,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/playbookIndex';
import type { AttackerData } from '@/data/attackers/attacker.types';

const TRAIT_ID_SEPARATOR = '+';

/** The breakdown line for the +DMG Assist carries into later swings. */
const ASSIST_LINE_ID = 'assist';
const ASSIST_LINE_LABEL = 'Assist';

/** The breakdown line for Burning Passion-like traits, named after them. */
const burningPassionLine = (
  attacker: AttackerData,
  damageMods: PlaybookDamageMods,
  bonus: number,
): DamageBuffBonus => {
  const traits = attackerTraits(attacker, damageMods).filter((trait) => {
    return (trait.playbookDamageVsBurning ?? 0) > 0;
  });

  const id = traits.map((trait) => trait.id).join(TRAIT_ID_SEPARATOR);
  const label = joinTraitLabels(traits);

  return { id, label, bonus };
};

/** A damage source the breakdown itemizes, at its printed amount. */
type PrintedDamageSource = { label: string; amount: number };

/**
 * The damaging plays live on the given swings, by play, at their printed amount
 * (Tough Hide and buffs are itemized on their own lines). A play scaled by the
 * target's current HP is unmodified, so it is listed at the damage it deals.
 */
export const characterPlayDamageSources = (
  timeline: ActivationTimeline,
  attackIndexes: readonly number[],
): PrintedDamageSource[] => {
  const byPlay = new Map<string, PrintedDamageSource>();

  for (const attackIndex of attackIndexes) {
    const state = swingStateAt(timeline, attackIndex);

    state.damagingPlayBySlot.forEach((play, slot) => {
      if (play == null) {
        return;
      }

      const scalesWithHealth = slotScalesWithHealth(state, slot);
      const amount = scalesWithHealth
        ? state.playDamageBySlot[slot]
        : (play.damage ?? 0);

      const source = byPlay.get(play.id) ?? { label: play.label, amount: 0 };

      byPlay.set(play.id, { ...source, amount: source.amount + amount });
    });
  }

  return [...byPlay.values()];
};

/** Effective damage of a printed amount: playbook results and plays differ. */
type DamageOf = typeof effectivePlaybookDamage;

/** A printed damage amount and how to turn it into effective damage. */
type PrintedAmount = {
  printed: number;
  mods: PlaybookDamageMods;
  damageOf: DamageOf;
};

/** One swing's card damage: the printed pips and what the swing bonus adds. */
type SwingCardAmounts = {
  rawCardDamage: number;
  passionBonus: number;
  assistBonus: number;
  amounts: PrintedAmount[];
};

/**
 * The card damage one swing's picks deal, with the share of its swing bonus
 * that is Burning Passion and the share that is the carried Assist DMG.
 */
const swingCardAmounts = (
  attacker: AttackerData,
  damageMods: PlaybookDamageMods,
  picks: readonly WrapPick[],
  state: SwingState,
): SwingCardAmounts => {
  const swingMods = swingStateDamageMods(damageMods, state);

  // The swing bonus is Burning Passion plus the carried Assist DMG.
  const carriedBonus = state.effectsBefore.damageBonus;
  const passionOnly = state.playbookDamageBonus - carriedBonus;
  const passionMods = withSwingDamageBonus(damageMods, passionOnly);

  let rawCardDamage = 0;
  let passionBonus = 0;
  let assistBonus = 0;
  const amounts: PrintedAmount[] = [];

  for (const id of picks) {
    if (id == null) {
      continue;
    }

    const cardDamage = getPlaybookResult(attacker, id).damage;

    if (cardDamage <= 0) {
      continue;
    }

    rawCardDamage += cardDamage;
    amounts.push({
      printed: cardDamage,
      mods: swingMods,
      damageOf: effectivePlaybookDamage,
    });

    const withSwingBonus = effectivePlaybookDamage(
      attacker,
      cardDamage,
      swingMods,
    );
    const withPassion = effectivePlaybookDamage(
      attacker,
      cardDamage,
      passionMods,
    );
    const withNeither = effectivePlaybookDamage(
      attacker,
      cardDamage,
      damageMods,
    );

    passionBonus += withPassion - withNeither;
    assistBonus += withSwingBonus - withPassion;
  }

  return { rawCardDamage, passionBonus, assistBonus, amounts };
};

/** One swing's play damage: printed amounts, plus plays no modifier touches. */
type SwingPlayAmounts = {
  amounts: PrintedAmount[];
  unmodifiedDamage: number;
};

/**
 * The damaging plays one swing triggers. Play damage is not a playbook damage
 * result, so no Burning Passion; a play scaled by current HP is unmodified, so
 * it only adds to the total.
 */
const swingPlayAmounts = (
  damageMods: PlaybookDamageMods,
  state: SwingState,
): SwingPlayAmounts => {
  const amounts: PrintedAmount[] = [];
  let unmodifiedDamage = 0;

  state.damagingPlayBySlot.forEach((play, slot) => {
    if (play == null) {
      return;
    }

    const scalesWithHealth = slotScalesWithHealth(state, slot);

    if (scalesWithHealth) {
      unmodifiedDamage += state.playDamageBySlot[slot];

      return;
    }

    amounts.push({
      printed: play.damage ?? 0,
      mods: damageMods,
      damageOf: effectivePlayDamage,
    });
  });

  return { amounts, unmodifiedDamage };
};

/**
 * Sums card pip damage and the marginal effects of Tough Hide and each of the
 * attacker's damage buffs across all active rows (same scope as
 * {@link rowDamageIfAllHit}). Damaging plays add to the totals and to the Tough
 * Hide and buff lines, but not to the card damage.
 */
export const damageModifierBreakdown = (
  order: ActivationOrderParams,
  wrapPicks: WrapPick[][],
  timeline: ActivationTimeline,
): DamageModifierBreakdown => {
  const { attacker, damageMods } = order;

  let rawCardDamage = 0;
  let toughHideReduction = 0;
  let totalEffective = 0;
  let passionBonus = 0;
  let assistBonus = 0;

  const buffBonuses = availableBuffs(attacker).map((buff) => ({
    id: buff.id,
    label: buff.label,
    bonus: 0,
  }));

  for (let attackIndex = 0; attackIndex < wrapPicks.length; attackIndex++) {
    const active = attackRowIsActive(order, wrapPicks, attackIndex);

    if (!active) {
      continue;
    }

    const state = swingStateAt(timeline, attackIndex);
    const cards = swingCardAmounts(
      attacker,
      damageMods,
      wrapPicks[attackIndex],
      state,
    );
    const plays = swingPlayAmounts(damageMods, state);

    rawCardDamage += cards.rawCardDamage;
    passionBonus += cards.passionBonus;
    assistBonus += cards.assistBonus;
    totalEffective += plays.unmodifiedDamage;

    for (const { printed, mods, damageOf } of [
      ...cards.amounts,
      ...plays.amounts,
    ]) {
      const effective = damageOf(attacker, printed, mods);

      totalEffective += effective;

      const withoutToughHide: PlaybookDamageMods = {
        ...mods,
        toughHide: false,
      };

      toughHideReduction +=
        damageOf(attacker, printed, withoutToughHide) - effective;

      for (const buffBonus of buffBonuses) {
        const withoutBuff: PlaybookDamageMods = {
          ...mods,
          buffs: { ...mods.buffs, [buffBonus.id]: false },
        };

        buffBonus.bonus += effective - damageOf(attacker, printed, withoutBuff);
      }
    }
  }

  // Listed only when it adds damage, so breakdowns without it keep their shape.
  if (passionBonus > 0) {
    buffBonuses.push(burningPassionLine(attacker, damageMods, passionBonus));
  }

  if (assistBonus > 0) {
    buffBonuses.push({
      id: ASSIST_LINE_ID,
      label: ASSIST_LINE_LABEL,
      bonus: assistBonus,
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
  order: ActivationOrderParams,
  wrapPicks: WrapPick[][],
  timeline: ActivationTimeline,
): number[] => {
  const { attacker, damageMods } = order;

  return wrapPicks.map((picks, attackIndex) => {
    const active = attackRowIsActive(order, wrapPicks, attackIndex);

    if (!active) {
      return 0;
    }

    const state = swingStateAt(timeline, attackIndex);

    return swingDamageIfAllHit(attacker, damageMods, picks, state);
  });
};
