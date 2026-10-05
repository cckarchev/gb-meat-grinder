import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import type {
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';

export type ActivationSummaryInput = {
  attacker: AttackerData;
  attacks: readonly AttackRollContext[];
  /** Display index of the swing Resilience ignores, or -1. */
  ignoredDisplayIndex: number;
  /** Display index of the all-hit killing blow, or -1. */
  killingBlowIndex: number;
  /** Effective (Resilience-applied) wrap picks. */
  wrapPicks: WrapPick[][];
  /** Effective (Resilience-applied) Bonus Time flags. */
  bonusTimeByAttack: boolean[];
  damageMods: PlaybookDamageMods;
  specialAbilities: Record<string, boolean>;
  startingMomentum: number;
  activeBaseCount: number;
  targetHp: number;
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
