import type { Dispatch } from 'react';
import type { AttackerData } from '@/types/core/attacker';
import type { AttackRollContext } from '@/types/core/attackSequence';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/types/core/playbook';
import type { MeatGrinderAction } from '@/types/gbMeatGrinder/reducer';

/** React hook + context value for the Meat Grinder simulation. */
export type MeatGrinderSimulation = {
  /** The selected attacker model. */
  attacker: AttackerData;
  /** Every model that can be selected. */
  availableAttackers: readonly AttackerData[];
  enemyDef: number;
  /** Enemy's printed ARM (what the stepper edits). */
  armor: number;
  /** ARM after attacker buffs (e.g. They Ain't Tough!); used in the rolls. */
  effectiveArmor: number;
  hp: number;
  influence: number;
  charging: boolean;
  chargeAttackIndex: number;
  /** Active base attacks this activation (derived from traits + influence). */
  activeBaseCount: number;
  enemyHasCover: boolean;
  enemyDefensiveStance: boolean;
  /** Target is Knocked Down before the activation (−1 DEF; disables playbook KD). */
  enemyKnockedDown: boolean;
  /** Target is Snared before the activation (−1 DEF). */
  enemySnared: boolean;
  /** Target has Resilience: the first attack of the activation is wholly ignored. */
  enemyResilience: boolean;
  startingMomentum: number;
  /** Extra attack dice from Ganging Up (added to TAC). */
  gangingUp: number;
  /** Attack dice lost to Crowding Out (subtracted from TAC). */
  crowdingOut: number;
  damageMods: PlaybookDamageMods;
  /** Toggled model-specific flat-damage abilities, by ability id. */
  specialAbilities: Record<string, boolean>;
  bonusTimeByAttack: boolean[];
  wrapPicks: WrapPick[][];
  characterPlayPicks: CharacterPlayPickSlot[][];
  /**
   * Wrap picks as the engine sees them once Resilience is applied: identical to
   * `wrapPicks` unless the target is Resilient, in which case the ignored first
   * swing's row is blanked. Use these for damage / momentum / odds math; use the
   * raw `wrapPicks` only to render each swing's chosen lines.
   */
  effectiveWrapPicks: WrapPick[][];
  /** Bonus-Time flags with the Resilience-ignored swing forced off. */
  effectiveBonusTimeByAttack: boolean[];
  /**
   * Display index into `attacks` of the swing ignored by Resilience (always 0
   * when active), or -1 when the target is not Resilient / has no attacks.
   */
  ignoredAttackIndex: number;
  attacks: AttackRollContext[];
  /**
   * Display index into `attacks` of the swing that drops the target to 0 HP in
   * the deterministic all-hit projection, or -1 if it never falls. The
   * activation ends here: this swing earns +1 momentum (killing blow) and every
   * later swing can no longer be made.
   */
  killingBlowIndex: number;
  dispatch: Dispatch<MeatGrinderAction>;
};

/** Momentum gained for taking the target out (killing blow). */
export const KILLING_BLOW_MOMENTUM = 1;
