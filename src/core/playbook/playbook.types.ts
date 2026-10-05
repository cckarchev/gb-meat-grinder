/** Playbook and wrap / character-play selection types (attacker card). */

/**
 * Opaque, per-card identifier for a playbook result. It only keys selection
 * state: the engine reads effect flags on the result, never the id string.
 */
export type PlaybookChoiceId = string;

/** One wrap slot: a line, or empty (ignored for damage / chain / GB). */
export type WrapPick = PlaybookChoiceId | null;

/**
 * A character play a GB / 1GB playbook result can trigger. Shared across guilds
 * and models (see `src/data/characterPlays.ts`); each model lists the ones its
 * card offers. Applies its effect to later swings of the activation.
 */
export type CharacterPlay = {
  id: string;
  label: string;
  /** +TAC on later attacks (e.g. Singled Out). */
  tacBonusForLater?: number;
  /** −enemy DEF on later attacks (e.g. Stagger). */
  defReductionForLater?: number;
  /** −enemy ARM on later attacks (e.g. They Ain't Tough!). A condition; caps at 1. */
  armorReduction?: number;
  /**
   * When omitted/false (the default), the play is Once Per Turn: picking it on
   * one swing removes it from later swings this activation, and its effect does
   * not re-apply ("effects from the same source do not stack"). Set true for
   * plays that may be taken on multiple swings and stack each time.
   */
  repeatable?: boolean;
};

/** A chosen character play, keyed by {@link CharacterPlay.id}. */
export type CharacterPlayPick = string;

/** Ids of character plays already used on earlier swings (same activation). */
export type CharacterPlayUsage = ReadonlySet<string>;

/** What one pick carries into later swings of the same activation. */
export type PickEffects = {
  tacBonusForLater: number;
  defReductionForLater: number;
  armorReduction: number;
};

export type PlaybookResult = {
  id: PlaybookChoiceId;
  label: string;
  /** +TAC on later attacks. Omitted means none. */
  tacBonusForLater?: number;
  /** −enemy DEF on later attacks (KD). Omitted means none. */
  defReductionForLater?: number;
  /** Damage to enemy HP when this attack hits with this line. */
  damage: number;
  /** True if this line generates momentum (momentous). */
  momentum?: boolean;
  /** After GB / 1GB, pick a character play (Once Per Turn unless `repeatable`). */
  picksCharacterPlay?: boolean;
  /** `>` / `>>`: removes the enemy's cover for later swings this activation. */
  clearsCover?: boolean;
  /** KD: applies Knocked Down; only the first one in the activation counts. */
  appliesKnockDown?: boolean;
  /**
   * Card shows a dodge (`<`) on this result. Cosmetic only: dodges do nothing
   * for the attack math, but the symbol is still shown in the line label.
   */
  dodge?: boolean;
};

export type PlaybookColumn = {
  netSuccesses: number;
  results:
    | readonly [PlaybookResult]
    | readonly [PlaybookResult, PlaybookResult];
};

export type PlaybookDamageMods = {
  /** Enemy Tough Hide: −1 to each **selected** playbook line that has card damage. */
  toughHide: boolean;
  /**
   * Attacker damage buffs by id, toggled on/off. These are external (teammate /
   * guild-granted) and defined per attacker in its data file, so the keys are
   * not fixed. Each active buff adds its `damageBonus` to selected damage pips.
   */
  buffs: Record<string, boolean>;
};

/** Playbook line button look for momentous damage pips (after Tough Hide / buffs). */
export type MomentousLineStyle = 'heat' | 'zeroed' | 'none';

/** Per-pick character play slot; `null` when that pick is not GB / 1GB. */
export type CharacterPlayPickSlot = CharacterPlayPick | null;

/** Per-buff damage contribution, in the attacker's buff order. */
export type DamageBuffBonus = {
  id: string;
  label: string;
  bonus: number;
};

/** How much selected damage pips contribute, split by Tough Hide vs attacker buffs. */
export type DamageModifierBreakdown = {
  rawCardDamage: number;
  toughHideReduction: number;
  buffBonuses: DamageBuffBonus[];
  totalEffective: number;
};
