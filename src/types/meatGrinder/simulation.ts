import type { Dispatch } from 'react';
import type { AttackRollContext } from '@/types/core/attackSequence';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/types/core/playbook';
import type { MeatGrinderAction } from '@/types/meatGrinder/reducer';

/** React hook + context value for the Meat Grinder simulation. */
export type MeatGrinderSimulation = {
  enemyDef: number;
  armor: number;
  hp: number;
  chargeAttackIndex: number;
  enemyHasCover: boolean;
  enemyDefensiveStance: boolean;
  startingMomentum: number;
  initialTacModifier: number;
  damageMods: PlaybookDamageMods;
  bonusTimeByAttack: boolean[];
  wrapPicks: WrapPick[][];
  characterPlayPicks: CharacterPlayPickSlot[][];
  attacks: AttackRollContext[];
  dispatch: Dispatch<MeatGrinderAction>;
};
