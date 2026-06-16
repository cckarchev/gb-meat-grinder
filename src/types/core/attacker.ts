import type { Guild } from '@/types/core/guild';
import type { PlaybookColumn } from '@/types/core/playbook';

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
  /** Charge costs 0 influence (otherwise 2). */
  furious: boolean;
  /** One free extra attack after a base attack deals damage. */
  berserker: boolean;
  /** One free base attack that does not spend influence. */
  feral: boolean;
  playbook: readonly PlaybookColumn[];
  /** The model's guild; its buffs are the ones this model can receive. */
  guild: Guild;
  /**
   * Guild buff ids this model cannot receive as a pre-applied buff — e.g. the
   * model that is the source of the buff for the guild (applies it itself).
   */
  excludedGuildBuffs?: readonly string[];
  /** Model-specific toggleable abilities that add flat, unmodified damage. */
  specialAbilities?: readonly SpecialAbility[];
  startingMomentum: { min: number; max: number };
  initialTacModifier: { min: number; max: number };
};
