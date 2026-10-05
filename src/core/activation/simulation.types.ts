import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';

/** The editable inputs of one activation: the target, the resources, and the plan. */
export type ActivationScenario = {
  enemyDef: number;
  /** Enemy's printed ARM (what the stepper edits); buffs apply downstream. */
  armor: number;
  hp: number;
  /** Influence allocated to the attacker this activation (0…attacker INF cap). */
  influence: number;
  /** Whether the attacker charges (costs influence unless Furious). */
  charging: boolean;
  /** Which base attack is the charge, when charging. */
  chargeAttackIndex: number;
  enemyHasCover: boolean;
  enemyDefensiveStance: boolean;
  /** Target is Knocked Down before the activation (−1 DEF; disables playbook KD). */
  enemyKnockedDown: boolean;
  /** Target is Snared before the activation (−1 DEF). */
  enemySnared: boolean;
  /**
   * Target has Resilience: the first attack of the activation is wholly ignored
   * (no damage, effects, wraps, momentum, or Berserker trigger). It is shown but
   * disabled, and no longer carries anything over to later attacks.
   */
  enemyResilience: boolean;
  /** Extra attack dice from Ganging Up (added to TAC). */
  gangingUp: number;
  /** Attack dice lost to Crowding Out (subtracted from TAC). */
  crowdingOut: number;
  bonusTimeByAttack: boolean[];
  damageMods: PlaybookDamageMods;
  /** Toggled model-specific flat-damage abilities, by ability id. */
  specialAbilities: Record<string, boolean>;
  attackPlan: AttackPlan;
};

/** Everything the engine derives from an activation scenario. */
export type DerivedSimulation = {
  /** Active base attacks this activation (derived from traits + influence). */
  activeBaseCount: number;
  /** Charge row the engine uses: the chosen base, or -1 when not charging. */
  effectiveChargeAttackIndex: number;
  /** Enemy ARM after attacker buffs (e.g. They Ain't Tough!). */
  effectiveArmor: number;
  /** Enemy DEF after Knocked Down and Snared. */
  effectiveEnemyDef: number;
  /** Ganging Up minus Crowding Out, applied to the first swing's TAC. */
  initialTacModifier: number;
  /** Attack-array index of the swing a Resilient target ignores, or -1. */
  ignoredAttackIndex: number;
  /** Display index into `attacks` of the ignored swing (always 0), or -1. */
  ignoredDisplayIndex: number;
  effectiveWrapPicks: WrapPick[][];
  effectiveCharacterPlayPicks: CharacterPlayPickSlot[][];
  effectiveBonusTimeByAttack: boolean[];
  attacks: AttackRollContext[];
  /** Display index into `attacks` of the all-hit killing blow, or -1. */
  killingBlowIndex: number;
};
