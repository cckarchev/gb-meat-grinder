import type { Guild } from '@/types/core/guild';
import type { CharacterPlay, PlaybookColumn } from '@/types/core/playbook';

/**
 * A toggleable, model-specific ability that deals a flat amount of unmodified
 * damage at some point during the activation (independent of attack rolls,
 * ARM, Tough Hide and buffs) — e.g. Thresher's Don't Fear The Reaper.
 */
export type SpecialAbility = {
  id: string;
  label: string;
  tooltip: string;
  /** Guaranteed, unmodified damage added to the activation when active. */
  flatDamage: number;
  /** Only contributes on a charge (e.g. Sweeping Charge's melee-zone damage). */
  requiresCharge?: boolean;
  /**
   * Always active rather than a user toggle (e.g. Sweeping Charge, which always
   * fires on a charge). Rendered as a locked row instead of a checkbox.
   */
  alwaysActive?: boolean;
};

/**
 * A model's intrinsic data used by the calculations. Per-activation choices
 * (influence allocated, whether it charges) live in simulation state, not here;
 * attack counts are derived from these traits plus those choices.
 */
export type AttackerData = {
  id: string;
  name: string;
  /** Base TAC stat. */
  tac: number;
  /** Influence cap: most influence that can be allocated this activation. */
  inf: number;
  /** Charge costs 0 influence (otherwise 2). Defaults to false. */
  furious?: boolean;
  /** One free extra attack after a base attack deals damage. Defaults to false. */
  berserker?: boolean;
  /** One free base attack that does not spend influence. Defaults to false. */
  feral?: boolean;
  playbook: readonly PlaybookColumn[];
  /** The model's guild; its buffs are the ones this model can receive. */
  guild: Guild;
  /**
   * Character plays this model's GB / 1GB results can trigger, from the shared
   * catalog. Model-specific (each card lists its own), not guild-wide.
   */
  characterPlays?: readonly CharacterPlay[];
  /**
   * Guild buff ids this model cannot receive as a pre-applied buff — e.g. the
   * model that is the source of the buff for the guild (applies it itself).
   */
  excludedGuildBuffs?: readonly string[];
  /** Model-specific toggleable abilities that add flat, unmodified damage. */
  specialAbilities?: readonly SpecialAbility[];
  /**
   * Searing Strike: after the first attack that deals card damage, the target
   * suffers −1 ARM (its own source — stacks with guild −ARM) and the Burning
   * condition for the rest of the activation. Applied to every *later* swing,
   * not the triggering one. Intrinsic when set here; it can also be granted by a
   * guild buff (e.g. Tempered Steel), see `GuildBuff.grantsSearingStrike`.
   */
  searingStrike?: boolean;
  /**
   * Burning Passion: +1 to each damaging playbook line on swings where the target
   * was Burning *before* the swing. A Burning self-applied by Searing Strike thus
   * helps later swings, never the swing that lit it.
   */
  burningPassion?: boolean;
  startingMomentum: { min: number; max: number };
  /** Extra attack dice from Ganging Up (added to TAC). */
  gangingUp: { min: number; max: number };
  /** Attack dice lost to Crowding Out (subtracted from TAC). */
  crowdingOut: { min: number; max: number };
};
