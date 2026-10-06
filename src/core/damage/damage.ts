/**
 * Damage the toggled buffs and traits add, enemy stat modifiers and the
 * effective damage of a playbook line.
 */

import {
  activatedTraits,
  activeBuffs,
  attackerTraits,
} from '@/core/attackers/buffsAndTraits';
import type {
  PlaybookChoiceId,
  PlaybookDamageMods,
} from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/playbookIndex';
import {
  DEF_MAX,
  KNOCKED_DOWN_DEF_PENALTY,
  SNARED_DEF_PENALTY,
  TOUGH_HIDE_DAMAGE_PENALTY,
} from '@/core/shared/constants';
import { sumOf } from '@/core/shared/sumOf';
import type { AttackerData } from '@/data/attackers/attacker.types';

export const DEFAULT_PLAYBOOK_DAMAGE_MODS: PlaybookDamageMods = {
  toughHide: false,
  targetBurning: false,
  assistEngaged: false,
  buffs: {},
};

/**
 * Flat, unmodified damage from the model's activated traits (e.g. Thresher's
 * Don't Fear The...). Character traits ignore Tough Hide and damage buffs,
 * so it is simply added to the activation's damage.
 */
export const activeTraitFlatDamage = (
  attacker: AttackerData,
  activeTraits: Record<string, boolean>,
): number => {
  const activated = activatedTraits(attacker, activeTraits);

  return sumOf(activated, (trait) => trait.flatDamage);
};

/** Unmodified DMG the attacker's traits add to a charge that picks a damage result. */
export const chargeTraitDamage = (
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): number => {
  const traits = attackerTraits(attacker, mods);

  return sumOf(traits, (trait) => trait.chargeDamage);
};

/** `mods` with one swing's engine-injected playbook damage bonus. */
export const withSwingDamageBonus = (
  mods: PlaybookDamageMods,
  bonus: number,
): PlaybookDamageMods => {
  if (bonus === 0) {
    return mods;
  }

  return { ...mods, swingDamageBonus: bonus };
};

/** Sum of the +damage selected buffs give playbook damage results. */
export const playbookDamageBonusSum = (
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): number => {
  const buffs = activeBuffs(attacker, mods);
  const anyDamageBonus = sumOf(buffs, (buff) => buff.damageBonus);
  const playbookOnlyBonus = sumOf(buffs, (buff) => buff.playbookDamageBonus);

  return anyDamageBonus + playbookOnlyBonus;
};

/** Sum of the +damage selected buffs give character plays that cause damage. */
const playDamageBonusSum = (
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): number => {
  const buffs = activeBuffs(attacker, mods);

  return sumOf(buffs, (buff) => buff.damageBonus);
};

/** True if a selected buff turns playbook damage into Tough-Hide-ignoring Condition Damage. */
const buffsIgnoreToughHide = (
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): boolean => {
  return activeBuffs(attacker, mods).some(
    (buff) => buff.ignoresToughHide === true,
  );
};

/**
 * Enemy DEF after pre-attack conditions. Knocked Down and Snared each give the
 * attacker −1 DEF. The result is intentionally NOT floored at `DEF_MIN`:
 * the to-hit roll floors at 2+ elsewhere (see `effectiveDefMinRoll`), and any
 * reduction past that floor is surfaced here so the engine can convert the
 * surplus into bonus attack dice (see `tacBonusFromDefReductionCap`).
 */
export const effectiveEnemyDef = (
  enemyDef: number,
  knockedDown: boolean,
  snared: boolean,
): number => {
  const knockedDownPenalty = knockedDown ? KNOCKED_DOWN_DEF_PENALTY : 0;
  const snaredPenalty = snared ? SNARED_DEF_PENALTY : 0;
  const reduction = knockedDownPenalty + snaredPenalty;

  return Math.min(DEF_MAX, enemyDef - reduction);
};

export const effectivePlaybookDamage = (
  attacker: AttackerData,
  cardDamage: number,
  mods: PlaybookDamageMods,
): number => {
  if (cardDamage <= 0) {
    return 0;
  }

  const toughHideApplies =
    mods.toughHide && !buffsIgnoreToughHide(attacker, mods);
  const toughHidePenalty = toughHideApplies ? TOUGH_HIDE_DAMAGE_PENALTY : 0;
  const buffBonus = playbookDamageBonusSum(attacker, mods);
  const swingBonus = mods.swingDamageBonus ?? 0;

  return Math.max(0, cardDamage - toughHidePenalty + buffBonus + swingBonus);
};

/**
 * Damage of a character play that causes damage: Tough Hide and the buffs that
 * reach plays (Tooled Up), but none limited to playbook damage results
 * (Butchery, Our Tools Are Sharp, Burning Passion, Assist).
 */
export const effectivePlayDamage = (
  attacker: AttackerData,
  printedDamage: number,
  mods: PlaybookDamageMods,
): number => {
  if (printedDamage <= 0) {
    return 0;
  }

  const toughHidePenalty = mods.toughHide ? TOUGH_HIDE_DAMAGE_PENALTY : 0;
  const buffBonus = playDamageBonusSum(attacker, mods);

  return Math.max(0, printedDamage - toughHidePenalty + buffBonus);
};

export const effectiveDamageForChoice = (
  attacker: AttackerData,
  id: PlaybookChoiceId,
  mods: PlaybookDamageMods,
): number => {
  return effectivePlaybookDamage(
    attacker,
    getPlaybookResult(attacker, id).damage,
    mods,
  );
};
