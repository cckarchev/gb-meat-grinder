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
  chargeAttackIndex: number;
  armor: number;
  enemyHasCover: boolean;
  /** +1 enemy DEF only on the attack that has the charge. */
  enemyDefensiveStance: boolean;
  damageMods: PlaybookDamageMods;
  enemyDef: number;
  bonusTimeByAttack: readonly boolean[];
  initialTacModifier: number;
};
