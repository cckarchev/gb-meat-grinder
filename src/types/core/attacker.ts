import type { Guild } from '@/types/core/guild';
import type { PlaybookColumn } from '@/types/core/playbook';

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
  startingMomentum: { min: number; max: number };
  initialTacModifier: { min: number; max: number };
};
