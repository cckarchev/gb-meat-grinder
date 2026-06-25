/** Playbook and wrap / character-play selection types (attacker card). */

/**
 * Opaque, per-card identifier for a playbook result. It only keys selection
 * state — the engine reads effect flags on the result, never the id string.
 */
export type PlaybookChoiceId = string;

/** One wrap slot: a line, or empty (ignored for damage / chain / GB). */
export type WrapPick = PlaybookChoiceId | null;

/**
 * A character play a GB / 1GB playbook result can trigger. Defined per guild;
 * each can be used once per activation, applying its effect to later swings.
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
   * Flat, unmodified damage dealt when this play is triggered off a GB result
   * (e.g. Impale = 3). Ignores ARM / Tough Hide / buffs; conditional on the
   * triggering swing reaching the GB line, and respecting {@link oncePerTurn}.
   */
  flatDamage?: number;
  /**
   * When true, the play is Once Per Turn: picking it on one swing removes it
   * from later swings this activation, and its effect does not re-apply
   * ("effects from the same source do not stack"). When false, the play may be
   * taken on multiple swings and stacks each time. Required on every play.
   */
  oncePerTurn: boolean;
};

/** A chosen character play, keyed by {@link CharacterPlay.id}. */
export type CharacterPlayPick = string;

/** Ids of character plays already used on earlier swings (same activation). */
export type CharacterPlayUsage = ReadonlySet<string>;

export type PlaybookResult = {
  id: PlaybookChoiceId;
  label: string;
  /**
   * +TAC on later attacks (Singled Out); from character play when using GB / 1GB.
   * Defaults to 0.
   */
  tacBonusForLater?: number;
  /** −enemy DEF on later attacks (KD / Stagger). Defaults to 0. */
  defReductionForLater?: number;
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
  /**
   * Card shows a dodge (`<`) on this result. Cosmetic only — dodges do nothing
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
  /**
   * Engine-injected, per-swing bonus added to each damaging playbook line (e.g.
   * Burning Passion on a swing where the target is already Burning). Not user
   * state: the damage helpers compute it per swing and inject a copy of the mods.
   */
  extraDamageBonus?: number;
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

/** How much selected damage contributes, split by Tough Hide vs attacker buffs. */
export type DamageModifierBreakdown = {
  /** Sum of raw card pips on selected lines (character-play damage is reported
   *  separately, at its raw amount, by `characterPlayFlatSources`). */
  rawCardDamage: number;
  /** Total Tough Hide reduction across card lines AND character-play damage. */
  toughHideReduction: number;
  /** Per-buff lift across card lines AND character-play damage (e.g. Tooled Up). */
  buffBonuses: DamageBuffBonus[];
  /** Effective damage from card lines AND character-play damage (excludes
   *  special-ability flat damage, which is unmodified and tracked separately). */
  totalEffective: number;
};
