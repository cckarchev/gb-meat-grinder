/**
 * A guild and the effects its members bring: buffs a teammate grants the
 * attacker, and debuffs already on the target. Neither is intrinsic to a model;
 * availability is scoped to the model's guild.
 */

import type { CharacterTrait } from '@/data/characterTraits';

/** Which side a guild effect lands on, and so which panel shows it. */
export type GuildBuffTarget = 'attacker' | 'enemy';

/** A buff a teammate can grant (e.g. Tooled Up, They Ain't Tough!). */
export type GuildBuff = {
  /** Stable key toggled in `PlaybookDamageMods.buffs`. */
  id: string;
  label: string;
  tooltip: string;
  /** +damage applied to each selected playbook line that has card damage. */
  damageBonus?: number;
  /** −ARM on the enemy this activation (reduces net successes needed). */
  armorReduction?: number;
  /** Playbook damage becomes Condition Damage, ignoring the enemy's Tough Hide. */
  ignoresToughHide?: boolean;
  /** +TAC on every attack this activation (e.g. Tempered Steel). */
  tacBonus?: number;
  /** Traits the attacker gains while the buff is on (Tempered Steel grants Searing Strike). */
  grantsTraits?: readonly CharacterTrait[];
  /**
   * Where the effect lands: `'attacker'` (default) buffs the attacker and shows on
   * the Attacker panel; `'enemy'` is a condition on the target (e.g. -ARM) and
   * shows on the Enemy panel. Either way it is scoped to the attacker's guild.
   */
  target?: GuildBuffTarget;
};

export type Guild = {
  id: string;
  name: string;
  /** Guild signature color (hex), used to theme momentous playbook results. */
  color: string;
  /** Buffs any model in this guild can be granted by a teammate. */
  buffs: readonly GuildBuff[];
};
