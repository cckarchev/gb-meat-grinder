/** Per-swing attack roll context produced by `computeAttackSequence`. */

import type { PlaybookDamageMods } from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Activation-wide inputs every swing's TAC, DEF and ARM are computed from. */
export type ActivationRollParams = {
  attacker: AttackerData;
  /**
   * Effective charge row, or `NO_ATTACK_INDEX` when the model is not
   * charging.
   */
  chargeAttackIndex: number;
  /** Enemy's printed ARM; every reduction comes from the timeline. */
  armor: number;
  enemyHasCover: boolean;
  /** +1 enemy DEF only on the attack that has the charge. */
  enemyDefensiveStance: boolean;
  damageMods: PlaybookDamageMods;
  enemyDef: number;
  bonusTimeByAttack: readonly boolean[];
  initialTacModifier: number;
  /** Active base attacks this activation (derived from traits + influence). */
  activeBaseCount: number;
};

export type AttackRollContext = {
  attackIndex: number;
  tac: number;
  /** Enemy ARM for this swing after every named reduction before it. */
  armor: number;
  defMinRoll: number;
  pHit: number;
  netSuccessesNeeded: number;
  prob: number;
};

/** Kind of swing a row represents (charge / berserker / base). */
export type AttackKind = 'charge' | 'berserker' | 'base';
