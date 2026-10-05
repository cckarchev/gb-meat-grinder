import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import type { SwingProjectionInput } from '@/core/attacks/swingProjections';

/** The swing projection's input, plus what only the summary reads. */
export type ActivationSummaryInput = SwingProjectionInput & {
  /** Display index of the swing Resilience ignores, or `NO_ATTACK_INDEX`. */
  ignoredDisplayIndex: number;
  specialAbilities: Record<string, boolean>;
};

export type ActivationSummary = {
  /** Swings that actually happen: after any ignored lead through the killing blow. */
  activeAttacks: AttackRollContext[];
  totalDamageIfAllHit: number;
  netMomentumIfAllHit: number;
  netMomentumTooltip: string;
  damageDealtTooltip: string;
  planFailureProbability: number;
  killProbability: number;
  expectedDamage: number;
  expectedHpRemaining: number;
  damageRange: { low: number; high: number };
};
