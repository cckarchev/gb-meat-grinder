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
  attacks: AttackRollContext[];
  dispatch: Dispatch<MeatGrinderAction>;
};
