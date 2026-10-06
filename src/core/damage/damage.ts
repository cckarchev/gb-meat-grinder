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
import { sumOf } from '@/core/shared/sumOf';
import type { AttackerData } from '@/data/attackers/attacker.types';
import type { CharacterTrait } from '@/data/characterTraits';
import type { GuildBuff, GuildBuffTarget } from '@/data/guilds/guild.types';

export const DEFAULT_PLAYBOOK_DAMAGE_MODS: PlaybookDamageMods = {
  toughHide: false,
  targetBurning: false,
  assistEngaged: false,
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
export const availableBuffs = (
  attacker: AttackerData,
): readonly GuildBuff[] => {
  return attacker.guild.buffs.filter(
    (buff) => !guildBuffIsExcluded(attacker, buff.id),
  );
};

/** The attacker's available buffs that are currently toggled on. */
export const activeBuffs = (
  attacker: AttackerData,
  mods: PlaybookDamageMods,
): readonly GuildBuff[] => {
  return availableBuffs(attacker).filter((buff) => mods.buffs[buff.id]);
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

/** The model's traits the user activates with a checkbox. */
export const activatableTraits = (
  attacker: AttackerData,
): readonly CharacterTrait[] => {
  return (attacker.characterTraits ?? []).filter((trait) => {
    return trait.active === true;
  });
};

/** The activatable traits currently toggled on. */
export const activatedTraits = (
  attacker: AttackerData,
  activeTraits: Record<string, boolean>,
): readonly CharacterTrait[] => {
  return activatableTraits(attacker).filter((trait) => {
    return activeTraits[trait.id] === true;
  });
};

const TRAIT_LABEL_SEPARATOR = ' + ';

/** Several traits named on one breakdown line (e.g. `Searing Strike + Sweeping Charge`). */
export const joinTraitLabels = (traits: readonly CharacterTrait[]): string => {
  return traits.map((trait) => trait.label).join(TRAIT_LABEL_SEPARATOR);
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
