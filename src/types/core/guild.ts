/**
 * A guild and the buffs / debuffs its members bring. Neither is intrinsic to a
 * model: any model in the guild may receive a buff from a teammate, or apply a
 * debuff (e.g. −ARM) to the target. Availability is scoped to the model's guild.
 */

/**
 * A guild effect: a teammate-granted buff on the attacker (e.g. Tooled Up) or a
 * debuff applied to the target (e.g. They Ain't Tough!). Both are toggled by id
 * in `PlaybookDamageMods.buffs`; `target` decides which panel renders the toggle.
 */
export type GuildBuff = {
  /** Stable key toggled in `PlaybookDamageMods.buffs`. */
  id: string;
  label: string;
  tooltip: string;
  /**
   * Where the effect lands. `'attacker'` (default) buffs the attacker and shows
   * on the attacker panel; `'enemy'` debuffs the target (e.g. −ARM) and shows on
   * the enemy panel. Either way it stays scoped to the attacker's guild.
   */
  target?: 'attacker' | 'enemy';
  /** +damage applied to each selected playbook line that has card damage. */
  damageBonus?: number;
  /** −ARM on the enemy this activation (reduces net successes needed). */
  armorReduction?: number;
  /** Playbook damage becomes Condition Damage, ignoring the enemy's Tough Hide. */
  ignoresToughHide?: boolean;
  /** +TAC on every attack this activation (e.g. Tempered Steel's aura). */
  tacBonus?: number;
  /** Grants the attacker Searing Strike for the activation (e.g. Tempered Steel). */
  grantsSearingStrike?: boolean;
  /** Marks the target as Burning (no stat change itself; enables Burning Passion). */
  appliesBurning?: boolean;
  /**
   * Marks the target as carrying the Searing Strike condition: −1 ARM only
   * (Burning is independent — `appliesBurning` — since it can be cleared while
   * −1 ARM remains). Whole-activation; same source as the attacker's own Searing
   * Strike, so the two never stack.
   */
  appliesSearingStrike?: boolean;
};

export type Guild = {
  id: string;
  name: string;
  /** Guild signature color (hex), used to theme momentous playbook results. */
  color: string;
  /** Buffs any model in this guild can be granted by a teammate. */
  buffs: readonly GuildBuff[];
};
