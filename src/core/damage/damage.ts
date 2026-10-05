/**
 * Guild buffs, enemy stat modifiers and the effective damage of a playbook line.
 */

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
import type { AttackerData } from '@/data/attackers/attacker.types';
import type { CharacterTrait } from '@/data/characterTraits';
import type { GuildBuff, GuildBuffTarget } from '@/data/guilds/guild.types';

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

const DEFAULT_GUILD_BUFF_TARGET: GuildBuffTarget = 'attacker';

/** The guild's effects on one side, excluded ones included (the UI disables those). */
export const guildBuffsFor = (
  attacker: AttackerData,
  target: GuildBuffTarget,
): readonly GuildBuff[] => {
  return attacker.guild.buffs.filter((buff) => {
    const buffTarget = buff.target ?? DEFAULT_GUILD_BUFF_TARGET;

    return buffTarget === target;
  });
};

/** Guild buffs this model can receive (excludes buffs it is the source of). */
export const availableBuffs = (attacker: AttackerData) => {
  return attacker.guild.buffs.filter(
    (buff) => !guildBuffIsExcluded(attacker, buff.id),
  );
};

/** The attacker's available buffs that are currently toggled on. */
export const activeBuffs = (
  attacker: AttackerData,
  mods: PlaybookDamageMods,
) => {
  return availableBuffs(attacker).filter((buff) => mods.buffs[buff.id]);
};

/**
 * Flat, unmodified damage from the model's activated traits (e.g. Thresher's
 * Don't Fear The Reaper). Character traits ignore Tough Hide and damage buffs,
 * so it is simply added to the activation's damage.
 */
export const activeTraitFlatDamage = (
  attacker: AttackerData,
  activeTraits: Record<string, boolean>,
): number => {
  const activated = (attacker.characterTraits ?? []).filter((trait) => {
    return trait.active === true && activeTraits[trait.id] === true;
  });

  return activated.reduce((sum, trait) => sum + (trait.flatDamage ?? 0), 0);
};

/** The attacker's traits plus those granted by active buffs, once each. */
export const attackerTraits = (
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): readonly CharacterTrait[] => {
  const granted = activeBuffs(attacker, mods).flatMap((buff) => {
    return buff.grantsTraits ?? [];
  });

  const byId = new Map<string, CharacterTrait>();

  for (const trait of [...(attacker.characterTraits ?? []), ...granted]) {
    if (!byId.has(trait.id)) {
      byId.set(trait.id, trait);
    }
  }

  return [...byId.values()];
};

/** Unmodified DMG the attacker's traits add to a charge that picks a damage result. */
export const chargeTraitDamage = (
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): number => {
  return attackerTraits(attacker, mods).reduce((sum, trait) => {
    return sum + (trait.chargeDamage ?? 0);
  }, 0);
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
