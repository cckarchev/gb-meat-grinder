import type { ActivationRollParams } from '@/core/attacks/attackSequence.types';

/** Effects earlier swings leave on the target or the attacker for a later swing. */
export type CarriedEffects = {
  tacBonus: number;
  defReduction: number;
  armorReduction: number;
};

/** What one swing inherits before it is rolled. */
export type SwingState = {
  effectsBefore: CarriedEffects;
};

/** Per-swing state, indexed by attack index (one entry per plan row). */
export type ActivationTimeline = readonly SwingState[];

/** The activation-wide inputs the timeline reads. */
export type TimelineParams = Pick<
  ActivationRollParams,
  'attacker' | 'damageMods' | 'activeBaseCount' | 'chargeAttackIndex'
>;
