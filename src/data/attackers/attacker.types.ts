import type {
  CharacterPlay,
  PlaybookColumn,
} from '@/core/playbook/playbook.types';
import type { CharacterTrait } from '@/data/characterTraits';
import type { Guild } from '@/data/guilds/guild.types';

/** Inclusive bounds for a per-activation input the model allows. */
export type StatRange = { min: number; max: number };

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
   * Character plays this model's GB / 1GB results can trigger, from the shared
   * catalog. Model-specific (each card lists its own), not guild-wide.
   */
  characterPlays?: readonly CharacterPlay[];
  /**
   * Guild buff ids this model cannot receive as a pre-applied buff, e.g. the
   * model that is the source of the buff for the guild (applies it itself).
   */
  excludedGuildBuffs?: readonly string[];
  /** Character traits from the shared catalog that affect the attack math. */
  characterTraits?: readonly CharacterTrait[];
  startingMomentum: StatRange;
  /** Extra attack dice from Ganging Up (added to TAC). */
  gangingUp: StatRange;
  /** Attack dice lost to Crowding Out (subtracted from TAC). */
  crowdingOut: StatRange;
};
