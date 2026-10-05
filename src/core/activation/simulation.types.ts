import type { ActivationTimeline } from '@/core/attacks/activationTimeline.types';
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
  /** Activated traits (e.g. Don't Fear The Reaper), by trait id. */
  activeTraits: Record<string, boolean>;
  attackPlan: AttackPlan;
};

/** Everything the engine derives from an activation scenario. */
export type DerivedSimulation = {
  /** Active base attacks this activation (derived from traits + influence). */
  activeBaseCount: number;
  /**
   * Charge row the engine uses: `chargeAttackIndex` while charging, else
   * `NO_ATTACK_INDEX`.
   */
  effectiveChargeAttackIndex: number;
  /** Enemy DEF after Knocked Down and Snared. */
  effectiveEnemyDef: number;
  /** Ganging Up minus Crowding Out, applied to the first swing's TAC. */
  initialTacModifier: number;
  /**
   * Attack-array index of the swing a Resilient target ignores, or
   * `NO_ATTACK_INDEX`.
   */
  ignoredAttackIndex: number;
  /**
   * Display index into `attacks` of the swing ignored by Resilience (always 0
   * when active), or `NO_ATTACK_INDEX` when the target is not Resilient / has
   * no attacks.
   */
  ignoredDisplayIndex: number;
  /**
   * Wrap picks as the engine sees them once Resilience is applied: identical to
   * the plan's wrap picks unless the target is Resilient, in which case the
   * ignored first swing's row is blanked. Use these for damage / momentum / odds
   * math; use the raw plan picks only to render each swing's chosen lines.
   */
  effectiveWrapPicks: WrapPick[][];
  effectiveCharacterPlayPicks: CharacterPlayPickSlot[][];
  /** Bonus-Time flags with the Resilience-ignored swing forced off. */
  effectiveBonusTimeByAttack: boolean[];
  attacks: AttackRollContext[];
  /** Per-swing state the engine derived, by attack index. */
  timeline: ActivationTimeline;
  /** Damage each attack row deals if every pick on it hits, by attack index. */
  rowDamageIfHit: number[];
  /** Guaranteed damage from the activated traits, applied before any swing. */
  flatDamage: number;
  /**
   * Display index into `attacks` of the swing that drops the target to 0 HP in
   * the deterministic all-hit projection, or `NO_ATTACK_INDEX` if it never
   * falls. The activation ends here: this swing earns `KILLING_BLOW_MOMENTUM`
   * and every later swing can no longer be made.
   */
  killingBlowIndex: number;
};
