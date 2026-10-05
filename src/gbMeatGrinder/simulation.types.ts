import type { Dispatch } from 'react';
import type { DerivedSimulation } from '@/core/activation/simulation.types';
import type {
  CharacterPlayPickSlot,
  WrapPick,
} from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';
import type {
  MeatGrinderAction,
  MeatGrinderState,
} from '@/gbMeatGrinder/reducer/reducer.types';

/** Editable state the components read as is. */
type ExposedState = Omit<
  MeatGrinderState,
  'attackerId' | 'attackPlan' | 'bonusTimeByAttack'
>;

/** Engine results the components read. */
type ExposedDerivation = Pick<
  DerivedSimulation,
  | 'activeBaseCount'
  | 'effectiveChargeAttackIndex'
  | 'effectiveWrapPicks'
  | 'effectiveBonusTimeByAttack'
  | 'ignoredDisplayIndex'
  | 'attacks'
  | 'rowDamageIfHit'
  | 'flatDamage'
  | 'killingBlowIndex'
>;

/** React hook + context value for the Meat Grinder simulation. */
export type MeatGrinderSimulation = ExposedState &
  ExposedDerivation & {
    /** The selected attacker model. */
    attacker: AttackerData;
    /** Every model that can be selected. */
    availableAttackers: readonly AttackerData[];
    wrapPicks: WrapPick[][];
    characterPlayPicks: CharacterPlayPickSlot[][];
    dispatch: Dispatch<MeatGrinderAction>;
  };
