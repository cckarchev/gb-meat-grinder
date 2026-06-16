/** Playbook and wrap / character-play selection types (attacker card). */

/**
 * Opaque, per-card identifier for a playbook result. It only keys selection
 * state — the engine reads effect flags on the result, never the id string.
 */
export type PlaybookChoiceId = string;

/** One wrap slot: a line, or empty (ignored for damage / chain / GB). */
export type WrapPick = PlaybookChoiceId | null;

/** Singled Out vs Stagger after GB or 1GB (each can apply once per activation). */
export type CharacterPlayPick = 'so' | 'stagger';

/** Which character-play picks have already been used on earlier swings (same activation). */
export type CharacterPlayUsage = { so: boolean; stagger: boolean };

export type PlaybookResult = {
  id: PlaybookChoiceId;
  label: string;
  /** +TAC on later attacks (Singled Out); from character play when using GB / 1GB. */
  tacBonusForLater: number;
  /** −enemy DEF on later attacks (KD / Stagger). */
  defReductionForLater: number;
  /** Damage to enemy HP when this attack hits with this line. */
  damage: number;
  /** True if this line generates momentum (momentous). */
  momentum?: boolean;
  /** After GB / 1GB, pick a character play (once each per activation). */
  picksCharacterPlay?: boolean;
  /** `>` / `>>`: removes the enemy's cover for later swings this activation. */
  clearsCover?: boolean;
  /** KD: applies Knocked Down; only the first one in the activation counts. */
  appliesKnockDown?: boolean;
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
