import type { Dispatch } from 'react';
import type { AttackRollContext } from '@/types/core/attackSequence';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/types/core/playbook';
import type { KillItAction } from '@/types/killIt/reducer';

/** React hook + context value for the Kill It simulation. */
export type KillItSimulation = {
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
  dispatch: Dispatch<KillItAction>;
};
