import type { AttackerData } from '@/types/core/attacker';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/types/core/playbook';

export type AttackPlan = {
  wrapPicks: WrapPick[][];
  characterPlayPicks: CharacterPlayPickSlot[][];
};

/** Inputs to `clampAttackPlan` bundled for reuse with `clampAttackPlanState`. */
export type AttackPlanClampParams = {
  /** The model being clamped. */
  attacker: AttackerData;
  /** Effective charge row, or -1 when the model is not charging. */
  chargeAttackIndex: number;
  armor: number;
  enemyHasCover: boolean;
  /** +1 enemy DEF only on the attack that has the charge. */
  enemyDefensiveStance: boolean;
  damageMods: PlaybookDamageMods;
  enemyDef: number;
  bonusTimeByAttack: readonly boolean[];
  initialTacModifier: number;
  /** Target is already Knocked Down (disables the playbook KD). */
  enemyKnockedDown: boolean;
  /** Active base attacks this activation (derived from traits + influence). */
  activeBaseCount: number;
  /**
   * Activation-order index of the swing that lands charge flat damage (Sweeping
   * Charge), or -1. Effects on damage like Searing Strike trigger after swings
   * (the charge attack itself stays at full ARM).
   */
  chargeFlatDamageIndex: number;
};
