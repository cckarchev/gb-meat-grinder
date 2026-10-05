/**
 * Fits one attack row's wrap picks to the highest playbook column it reaches.
 */

import {
  initialCharacterPlayFor,
  playSlotForPick,
} from '@/core/characterPlays/characterPlayLookup';
import type { AttackPlanRow } from '@/core/plan/attackPlan.types';
import type { PlaybookChoiceId } from '@/core/playbook/playbook.types';
import {
  cheapestChoiceId,
  maxPlaybookNet,
} from '@/core/playbook/playbookIndex';
import {
  netSuccessesForChoice,
  wrapSlotBudget,
  wrapSlotCount,
} from '@/core/playbook/wrapSlots';
import { MIN_PLAYBOOK_NET } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** First line of the widest column within `maxNet`. */
const firstReachableChoiceId = (
  attacker: AttackerData,
  maxNet: number,
): PlaybookChoiceId => {
  if (maxNet < MIN_PLAYBOOK_NET) {
    return cheapestChoiceId(attacker);
  }

  const targetNet = Math.min(maxNet, maxPlaybookNet(attacker));
  const column = attacker.playbook.find((c) => c.netSuccesses === targetNet);

  return column?.results[0].id ?? cheapestChoiceId(attacker);
};

/** Trim or pad the row to exactly `slotCount` slots, plays aligned with picks. */
const fitRowToSlotCount = (
  row: AttackPlanRow,
  slotCount: number,
): AttackPlanRow => {
  const picks = row.picks.slice(0, slotCount);
  const plays = row.plays.slice(0, slotCount);

  while (plays.length < picks.length) {
    plays.push(null);
  }

  while (picks.length < slotCount) {
    picks.push(null);
    plays.push(null);
  }

  return { picks, plays };
};

/**
 * Keep every pick within its slot budget: an over-budget first pick drops to the
 * best reachable line, an empty first pick empties the wrap, and over-budget
 * later picks are cleared. Mutates `row`.
 */
const fitPicksToBudget = (
  attacker: AttackerData,
  row: AttackPlanRow,
  maxNet: number,
): void => {
  const { picks, plays } = row;
  const firstBudget = wrapSlotBudget(attacker, maxNet, 0);
  const first = picks[0];

  if (first != null && netSuccessesForChoice(attacker, first) > firstBudget) {
    const replacement = firstReachableChoiceId(attacker, firstBudget);

    picks[0] = replacement;
    plays[0] = initialCharacterPlayFor(attacker, replacement);
  }

  const wrapStarted = picks[0] != null;

  for (let slot = 1; slot < picks.length; slot++) {
    const id = picks[slot];
    const slotBudget = wrapSlotBudget(attacker, maxNet, slot);
    const overBudget =
      id != null && netSuccessesForChoice(attacker, id) > slotBudget;

    if (!wrapStarted || overBudget) {
      picks[slot] = null;
      plays[slot] = null;
    }
  }
};

/** Each play slot holds a play exactly when its pick uses one. Mutates `row`. */
const syncCharacterPlays = (
  attacker: AttackerData,
  row: AttackPlanRow,
): void => {
  const { picks, plays } = row;

  for (let slot = 0; slot < picks.length; slot++) {
    plays[slot] = playSlotForPick(attacker, picks[slot], plays[slot]);
  }
};

/** A legal copy of `row` for a row that reaches column `maxNet`. */
export const clampRowPicks = (
  attacker: AttackerData,
  row: AttackPlanRow,
  maxNet: number,
): AttackPlanRow => {
  if (maxNet < MIN_PLAYBOOK_NET) {
    return { picks: [null], plays: [null] };
  }

  const fitted = fitRowToSlotCount(row, wrapSlotCount(attacker, maxNet));

  fitPicksToBudget(attacker, fitted, maxNet);
  syncCharacterPlays(attacker, fitted);

  return fitted;
};
