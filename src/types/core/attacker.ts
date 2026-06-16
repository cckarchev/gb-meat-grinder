import type { PlaybookColumn } from '@/types/core/playbook';

/**
 * An attacker-side damage buff (e.g. Tooled Up). These are external / teammate
 * granted; enemy traits such as Tough Hide are not buffs and live separately.
 */
export type AttackerBuff = {
  /** Stable key toggled in `PlaybookDamageMods.buffs`. */
  id: string;
  label: string;
  tooltip: string;
  /** +damage applied to each selected playbook line that has card damage. */
  damageBonus: number;
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
  damageBuffs: readonly AttackerBuff[];
  startingMomentum: { min: number; max: number };
  initialTacModifier: { min: number; max: number };
};
