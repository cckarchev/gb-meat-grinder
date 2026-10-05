import type { ActivationRollParams } from '@/core/attacks/attackSequence.types';
import type { CharacterPlay } from '@/core/playbook/playbook.types';

/** Effects earlier swings leave on the target or the attacker for a later swing. */
export type CarriedEffects = {
  tacBonus: number;
  defReduction: number;
  armorReduction: number;
};

/** What one swing inherits before it is rolled. */
export type SwingState = {
  effectsBefore: CarriedEffects;
  /** The damaging play live on each pick of this swing (null when none). */
  damagingPlayBySlot: readonly (CharacterPlay | null)[];
  /** Effective DMG of that play (0 when none). */
  playDamageBySlot: readonly number[];
  /** The target is Burning before this swing (pre-applied or lit by an earlier one). */
  targetBurningBefore: boolean;
  /** +DMG on this swing's playbook damage results (Burning Passion). */
  playbookDamageBonus: number;
};

/** Per-swing state, indexed by attack index (one entry per plan row). */
export type ActivationTimeline = readonly SwingState[];

/** The activation-wide inputs the timeline reads. */
export type TimelineParams = Pick<
  ActivationRollParams,
  'attacker' | 'damageMods' | 'activeBaseCount' | 'chargeAttackIndex'
>;
