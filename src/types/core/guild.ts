/**
 * A guild and the buffs its members can grant each other. Buffs are not
 * intrinsic to a model: any model in the guild may receive them from a teammate.
 */

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
};

export type Guild = {
  id: string;
  name: string;
  /** Buffs any model in this guild can be granted by a teammate. */
  buffs: readonly GuildBuff[];
};
