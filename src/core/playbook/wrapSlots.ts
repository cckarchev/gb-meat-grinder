/**
 * Playbook lookups and wrap slot budgets. Everything model-specific comes from
 * the `attacker` argument; the engine reads effect flags on results, never their
 * id strings.
 */

import type {
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  PlaybookResult,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { maxPlaybookNet, playbookIndex } from '@/core/playbook/playbookIndex';
import { MIN_PLAYBOOK_NET, MIN_WRAP_SLOTS } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

export const getPlaybookResult = (
  attacker: AttackerData,
  id: PlaybookChoiceId,
): PlaybookResult => {
  const result = playbookIndex(attacker).byId.get(id);

  if (!result) {
    throw new Error(`Unknown playbook id: ${id}`);
  }

  return result;
};

export const choiceUsesCharacterPlay = (
  attacker: AttackerData,
  id: WrapPick,
): id is PlaybookChoiceId => {
  if (id == null) {
    return false;
  }

  return getPlaybookResult(attacker, id).picksCharacterPlay === true;
};

export const netSuccessesForChoice = (
  attacker: AttackerData,
  id: PlaybookChoiceId,
): number => {
  const column = attacker.playbook.find((candidate) => {
    return candidate.results.some((result) => result.id === id);
  });

  if (!column) {
    throw new Error(`No column for id ${id}`);
  }

  return column.netSuccesses;
};

/** How many playbook results this attack can resolve (ceil(maxNet / card cap)). */
export const wrapSlotCount = (
  attacker: AttackerData,
  maxNet: number,
): number => {
  if (maxNet < MIN_PLAYBOOK_NET) {
    return MIN_WRAP_SLOTS;
  }

  return Math.ceil(maxNet / maxPlaybookNet(attacker));
};

/**
 * Max net for slot `slotIndex` (0-based): each full card-width step consumes
 * the widest column; leftover is the cap for the next result, not based on
 * what you picked in the previous slot.
 */
export const wrapSlotBudget = (
  attacker: AttackerData,
  maxNet: number,
  slotIndex: number,
): number => {
  const raw = maxNet - slotIndex * maxPlaybookNet(attacker);

  if (raw < MIN_PLAYBOOK_NET) {
    return 0;
  }

  return Math.min(maxPlaybookNet(attacker), raw);
};

/**
 * Total net successes needed on the roll for this slot’s column, treating later
 * wrap slots as continuing past the card’s widest column (8th, 9th, …).
 */
export const wrapExtendedNetNeeded = (
  attacker: AttackerData,
  slotIndex: number,
  columnNet: number,
): number => {
  return slotIndex * maxPlaybookNet(attacker) + columnNet;
};

/**
 * Net successes the pool must reach so every non-null wrap pick resolves,
 * using the same extended indexing as the playbook UI. Not a naive sum of
 * column costs: later wrap slots count past the card width.
 */
export const wrapNetThresholdAllHits = (
  attacker: AttackerData,
  picks: readonly WrapPick[],
): number => {
  let maxNeed = 0;

  for (let slot = 0; slot < picks.length; slot++) {
    const id = picks[slot];

    if (id == null) {
      continue;
    }

    const need = wrapExtendedNetNeeded(
      attacker,
      slot,
      netSuccessesForChoice(attacker, id),
    );

    if (need > maxNeed) {
      maxNeed = need;
    }
  }

  return maxNeed;
};

/** One row per attack, each holding a single empty slot. */
const rowsWithOneEmptySlot = (size: number): null[][] => {
  return Array.from({ length: size }, () => [null]);
};

export const defaultCharacterPlayPicksWrap = (
  size: number,
): CharacterPlayPickSlot[][] => {
  return rowsWithOneEmptySlot(size);
};

export const defaultWrapPicks = (size: number): WrapPick[][] => {
  return rowsWithOneEmptySlot(size);
};

/** Whether any slot of a swing's wrap row holds a pick. */
export const rowHasWrapPick = (
  picks: readonly WrapPick[] | undefined,
): boolean => {
  return (picks ?? []).some((id) => id != null);
};
