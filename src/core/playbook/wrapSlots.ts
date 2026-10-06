/** Wrap slot budgets: how many playbook results a roll resolves and what each slot can reach. */

import { probAttackSucceeds } from '@/core/damage/probability';
import type {
  CharacterPlayPickSlot,
  PlaybookColumn,
  WrapPick,
} from '@/core/playbook/playbook.types';
import {
  maxPlaybookNet,
  netSuccessesForChoice,
} from '@/core/playbook/playbookIndex';
import {
  FIRST_WRAP_PICK_INDEX,
  MIN_PLAYBOOK_NET,
  MIN_WRAP_SLOTS,
} from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

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

export const defaultCharacterPlayPicks = (
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

/** Whether a swing's wrap row has slots past the primary pick. */
export const rowHasWrapContinuation = (picks: readonly WrapPick[]): boolean => {
  return picks.length > FIRST_WRAP_PICK_INDEX;
};

/** The dice a swing rolls against the target, as far as hit chances go. */
export type SwingRoll = {
  tac: number;
  pHit: number;
  armor: number;
  /** Net hits added after ARM (Instruction). */
  netHitBonus: number;
};

export type WrapSlotColumn = {
  column: PlaybookColumn;
  /** Chance the roll reaches this column from this slot. */
  hitChance: number;
};

/** The playbook columns one wrap slot can reach, each with its hit chance. */
export const wrapSlotColumns = (
  attacker: AttackerData,
  roll: SwingRoll,
  maxNet: number,
  pickIndex: number,
): WrapSlotColumn[] => {
  const budget = wrapSlotBudget(attacker, maxNet, pickIndex);

  const reachable = attacker.playbook.filter(
    (column) => column.netSuccesses <= budget,
  );

  return reachable.map((column) => {
    const netNeeded = wrapExtendedNetNeeded(
      attacker,
      pickIndex,
      column.netSuccesses,
    );

    const hitChance = probAttackSucceeds(
      roll.tac,
      roll.pHit,
      roll.armor,
      netNeeded,
      roll.netHitBonus,
    );

    return { column, hitChance };
  });
};
