import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import type {
  CharacterPlayPickSlot,
  WrapPick,
} from '@/core/playbook/playbook.types';

/** Everything the engine derives from the editable Meat Grinder state. */
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
