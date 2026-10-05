import type { Dispatch } from 'react';
import type {
  CharacterPlayPickSlot,
  WrapPick,
} from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';
import type {
  MeatGrinderAction,
  MeatGrinderState,
} from '@/gbMeatGrinder/reducer/reducer.types';
import type { UiEngineResults } from '@/gbMeatGrinder/uiEngineResults';

/** Editable state the components read as is. */
type UiEditableState = Omit<
  MeatGrinderState,
  'attackerId' | 'attackPlan' | 'bonusTimeByAttack'
>;

/** React hook + context value for the Meat Grinder simulation. */
export type MeatGrinderSimulation = UiEditableState &
  UiEngineResults & {
    /** The selected attacker model. */
    attacker: AttackerData;
    /** Every model that can be selected. */
    availableAttackers: readonly AttackerData[];
    wrapPicks: WrapPick[][];
    characterPlayPicks: CharacterPlayPickSlot[][];
    dispatch: Dispatch<MeatGrinderAction>;
  };
