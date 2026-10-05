/**
 * Guild buffs, enemy stat modifiers and the effective damage of a playbook line.
 */

import type {
  PlaybookChoiceId,
  PlaybookDamageMods,
} from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/playbookIndex';
import {
  ARM_MIN,
  DEF_MAX,
  KNOCKED_DOWN_DEF_PENALTY,
  SNARED_DEF_PENALTY,
  TOUGH_HIDE_DAMAGE_PENALTY,
} from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

export const DEFAULT_PLAYBOOK_DAMAGE_MODS: PlaybookDamageMods = {
  toughHide: false,
  buffs: {},
};

/** Whether the model cannot receive this guild buff (it is the source of it). */
export const guildBuffIsExcluded = (
  attacker: AttackerData,
  buffId: string,
): boolean => {
  const excluded = attacker.excludedGuildBuffs ?? [];

  return excluded.includes(buffId);
};

/** Guild buffs this model can receive (excludes buffs it is the source of). */
export const availableBuffs = (attacker: AttackerData) => {
  return attacker.guild.buffs.filter(
    (buff) => !guildBuffIsExcluded(attacker, buff.id),
  );
};

/** The attacker's available buffs that are currently toggled on. */
const activeBuffs = (attacker: AttackerData, mods: PlaybookDamageMods) => {
  return availableBuffs(attacker).filter((buff) => mods.buffs[buff.id]);
};

/**
 * Flat, unmodified damage from the model's toggled special abilities (e.g.
 * Thresher's Don't Fear The Reaper). Independent of attack rolls and ARM /
 * Tough Hide / buffs, so it is simply added to the activation's damage.
 */
export const specialAbilityFlatDamage = (
  attacker: AttackerData,
  toggled: Record<string, boolean>,
): number => {
  return (attacker.specialAbilities ?? [])
    .filter((ability) => toggled[ability.id])
    .reduce((sum, ability) => sum + ability.flatDamage, 0);
};

/** Sum of the +damage from selected buffs. */
export const playbookDamageBonusSum = (
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): number => {
  let sum = 0;

  for (const buff of activeBuffs(attacker, mods)) {
    sum += buff.damageBonus ?? 0;
  }

  return sum;
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

/** Enemy ARM after the selected buffs' reductions (floored at 0). */
export const effectiveArmor = (
  attacker: AttackerData,
  baseArmor: number,
  mods: PlaybookDamageMods,
): number => {
  const reduction = activeBuffs(attacker, mods).reduce(
    (sum, buff) => sum + (buff.armorReduction ?? 0),
    0,
  );

  return Math.max(ARM_MIN, baseArmor - reduction);
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

  return Math.max(0, cardDamage - toughHidePenalty + buffBonus);
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
