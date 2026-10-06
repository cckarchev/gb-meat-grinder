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
  /** −enemy ARM on later attacks (e.g. They Ain't Tough!). A named condition: it applies once. */
  armorReduction?: number;
  /**
   * DMG the play causes when triggered (e.g. Impale = 3). Modified like a
   * playbook damage result by Tough Hide and +DMG buffs, but not by effects
   * limited to playbook damage results (Burning Passion).
   */
  damage?: number;
  /**
   * Condition damage equal to the target's current HP divided by this, rounded
   * down (The Bigger They Are... = 2). Current HP is taken before the swing's
   * own card damage, since the attacker chooses that order. It is unmodified:
   * Tough Hide and +DMG buffs do not apply.
   */
  currentHealthDivisor?: number;
  /**
   * The model gains Assist [named models] (Axe A Question): while one of them
   * engages the target (`PlaybookDamageMods.assistEngaged`), later attacks get
   * +1 TAC and +1 DMG to playbook damage results.
   */
  grantsAssist?: readonly string[];
  /**
   * Once Per Turn, copied from the card: picking it on one swing removes it from
   * later swings. It only limits availability; effects of the same name never
   * stack either way (see MODELING.md, "Stacking").
   */
  oncePerTurn: boolean;
};

/** A chosen character play, keyed by {@link CharacterPlay.id}. */
export type CharacterPlayPick = string;

/** Ids of character plays already used on earlier swings (same activation). */
export type CharacterPlayUsage = ReadonlySet<string>;

/** What one pick carries into later swings of the same activation. */
export type PickEffects = {
  tacBonusForLater: number;
  defReductionForLater: number;
  armorReductionForLater: number;
  /** +DMG to playbook damage results on later attacks (Assist). */
  damageBonusForLater: number;
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
  /** After GB / 1GB, pick a character play. */
  picksCharacterPlay?: boolean;
  /** `>` / `>>`: removes the enemy's cover for later swings this activation. */
  clearsCover?: boolean;
  /** KD: applies Knocked Down; only the first one in the activation counts. */
  appliesKnockDown?: boolean;
  /** T: Tackle takes the ball; only one per activation, since the ball is gone after. */
  stealsBall?: boolean;
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
  /** The target starts the activation with the Burning condition. */
  targetBurning: boolean;
  /** A model named by the attacker's Assist (e.g. Mallet or Oak) engages the target. */
  assistEngaged: boolean;
  /**
   * Attacker damage buffs by id, toggled on/off. These are external (teammate /
   * guild-granted) and defined per attacker in its data file, so the keys are
   * not fixed. Each active buff adds its `damageBonus` to selected damage pips.
   */
  buffs: Record<string, boolean>;
  /**
   * Engine-injected +DMG for one swing's playbook damage results (Burning
   * Passion while the target is Burning). Never user state.
   */
  swingDamageBonus?: number;
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
