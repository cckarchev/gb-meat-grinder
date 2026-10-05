/** A discrete damage distribution: damage value -> probability. */
export type DamageDistribution = Map<number, number>;

/** Damage a single swing deals as a function of its net successes. */
export type DamageForNet = (net: number) => number;

export type ActivationDamageOutcome = {
  /** P(total damage >= target HP). */
  killProbability: number;
  /** Mean total damage across the activation (including guaranteed flat damage). */
  expectedDamage: number;
  /** Mean target HP left afterwards: E[max(0, targetHp - total damage)]. */
  expectedHpRemaining: number;
  /** Total activation damage distribution (incl. flat damage): damage -> probability. */
  damageDistribution: ReadonlyMap<number, number>;
};
