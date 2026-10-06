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
  /** Target HP before the activation, for plays that scale with current HP. */
  targetHp: number;
  /** Target is already Knocked Down, so no playbook KD lowers its DEF again. */
  enemyKnockedDown: boolean;
};

export type AttackRollContext = {
  attackIndex: number;
  tac: number;
  /** Enemy ARM for this swing after every named reduction before it. */
  armor: number;
  defMinRoll: number;
  /** DEF once this swing lands, with the reductions it applies. */
  defMinRollAfter: number;
  /** ARM once this swing lands, with the reductions it applies. */
  armorAfter: number;
  pHit: number;
  netSuccessesNeeded: number;
  /** Net hits added after ARM, even to a roll that nets none (Instruction). */
  netHitBonus: number;
  prob: number;
};

/** Kind of swing a row represents (charge / berserker / base). */
export type AttackKind = 'charge' | 'berserker' | 'base';
