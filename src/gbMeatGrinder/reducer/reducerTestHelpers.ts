/** Shared setup for the reducer tests: a seeded initial state and action shorthands. */

import { vi } from 'vitest';
import type { PlaybookChoiceId } from '@/core/playbook/playbook.types';
import { createInitialMeatGrinderState } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import { meatGrinderReducer } from '@/gbMeatGrinder/reducer/meatGrinderReducer';
import type {
  MeatGrinderAction,
  MeatGrinderState,
} from '@/gbMeatGrinder/reducer/reducer.types';

/** `Math.random` values that make `randomAttacker` pick each registry entry. */
export const PICK_VETERAN_BOAR = 0;
export const PICK_THRESHER = 0.9;

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
