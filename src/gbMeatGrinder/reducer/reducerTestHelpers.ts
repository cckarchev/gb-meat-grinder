/** Shared setup for the reducer tests: action shorthands. */

import type { PlaybookChoiceId } from '@/core/playbook/playbook.types';
import { meatGrinderReducer } from '@/gbMeatGrinder/reducer/meatGrinderReducer';
import type {
  MeatGrinderAction,
  MeatGrinderState,
} from '@/gbMeatGrinder/reducer/reducer.types';

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
