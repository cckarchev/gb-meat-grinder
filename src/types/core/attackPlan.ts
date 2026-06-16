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
  /** Active base attacks this activation (derived from traits + influence). */
  activeBaseCount: number;
};
