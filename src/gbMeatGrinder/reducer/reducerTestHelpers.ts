/** Shared setup for the reducer tests: a seeded initial state and action shorthands. */

import { vi } from 'vitest';
import type { PlaybookChoiceId } from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';
import { cast } from '@/data/attackers/cast';
import { ATTACKERS } from '@/data/attackers/registry';
import { thresher } from '@/data/attackers/thresher';
import { veteranBoar } from '@/data/attackers/veteranBoar';
import { windle } from '@/data/attackers/windle';
import { createInitialMeatGrinderState } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import { meatGrinderReducer } from '@/gbMeatGrinder/reducer/meatGrinderReducer';
import type {
  MeatGrinderAction,
  MeatGrinderState,
} from '@/gbMeatGrinder/reducer/reducer.types';

/** The `Math.random` value that makes `randomAttacker` pick `attacker`. */
const pickValueFor = (attacker: AttackerData): number => {
  const index = ATTACKERS.indexOf(attacker);

  return index / ATTACKERS.length;
};

export const PICK_VETERAN_BOAR = pickValueFor(veteranBoar);
export const PICK_THRESHER = pickValueFor(thresher);
export const PICK_CAST = pickValueFor(cast);
export const PICK_WINDLE = pickValueFor(windle);

export const initialState = (randomValue: number): MeatGrinderState => {
  vi.spyOn(Math, 'random').mockReturnValue(randomValue);

  return createInitialMeatGrinderState();
};

export const reduce = (
  state: MeatGrinderState,
  ...actions: MeatGrinderAction[]
): MeatGrinderState => {
  return actions.reduce(meatGrinderReducer, state);
};

export const pick = (
  attackIndex: number,
  id: PlaybookChoiceId | null,
  pickIndex = 0,
): MeatGrinderAction => {
  return { type: 'wrapChoice', attackIndex, pickIndex, id };
};
