/**
 * Guild buffs, enemy stat modifiers and the effective damage of a playbook line.
 */

import { DEF_MAX } from '@/core/constants';
import { getPlaybookResult } from '@/core/wrapSlots';
import type { AttackerData } from '@/types/core/attacker';
import type {
  PlaybookChoiceId,
  PlaybookDamageMods,
} from '@/types/core/playbook';

export const DEFAULT_PLAYBOOK_DAMAGE_MODS: PlaybookDamageMods = {
  toughHide: false,
  buffs: {},
};

/** Guild buffs this model can receive (excludes buffs it is the source of). */
export const availableBuffs = (attacker: AttackerData) => {
  const excluded = attacker.excludedGuildBuffs ?? [];

  return attacker.guild.buffs.filter((b) => !excluded.includes(b.id));
};

/** The attacker's available buffs that are currently toggled on. */
const activeBuffs = (attacker: AttackerData, mods: PlaybookDamageMods) => {
  return availableBuffs(attacker).filter((b) => mods.buffs[b.id]);
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
    .filter((a) => toggled[a.id])
    .reduce((sum, a) => sum + a.flatDamage, 0);
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
  return activeBuffs(attacker, mods).some((b) => b.ignoresToughHide === true);
};

/**
 * Enemy DEF after pre-attack conditions. Knocked Down and Snared each give the
 * attacker −1 DEF. The result is intentionally NOT floored at {@link DEF_MIN}:
 * the to-hit roll floors at 2+ elsewhere (see `effectiveDefMinRoll`), and any
 * reduction past that floor is surfaced here so the engine can convert the
 * surplus into bonus attack dice (see `tacBonusFromDefReductionCap`).
 */
export const effectiveEnemyDef = (
  enemyDef: number,
  knockedDown: boolean,
  snared: boolean,
): number => {
  const reduction = (knockedDown ? 1 : 0) + (snared ? 1 : 0);

  return Math.min(DEF_MAX, enemyDef - reduction);
};

/** Enemy ARM after the selected buffs' reductions (floored at 0). */
export const effectiveArmor = (
  attacker: AttackerData,
  baseArmor: number,
  mods: PlaybookDamageMods,
): number => {
  const reduction = activeBuffs(attacker, mods).reduce(
    (s, b) => s + (b.armorReduction ?? 0),
    0,
  );

  return Math.max(0, baseArmor - reduction);
};

export const effectivePlaybookDamage = (
  attacker: AttackerData,
  cardDamage: number,
  mods: PlaybookDamageMods,
): number => {
  if (cardDamage <= 0) {
    return 0;
  }

  const pen = mods.toughHide && !buffsIgnoreToughHide(attacker, mods) ? 1 : 0;

  return Math.max(0, cardDamage - pen + playbookDamageBonusSum(attacker, mods));
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
