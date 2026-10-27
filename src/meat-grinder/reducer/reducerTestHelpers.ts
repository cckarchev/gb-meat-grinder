/** Shared setup for the reducer tests: action shorthands. */

import type { PlaybookChoiceId } from "@/core/playbook/playbook.types";
import { meatGrinderReducer } from "./meatGrinderReducer";
import type { MeatGrinderAction, MeatGrinderState } from "./reducer.types";

export const reduce = (
  state: MeatGrinderState,
  ...actions: MeatGrinderAction[]
): MeatGrinderState => actions.reduce(meatGrinderReducer, state);

export const pick = (
  attackIndex: number,
  id: PlaybookChoiceId | null,
  pickIndex = 0,
): MeatGrinderAction => ({ type: "wrapChoice", attackIndex, pickIndex, id });
