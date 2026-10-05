/** User edits to the plan: picking a line, clearing a continuation, choosing a play. */

import { playSlotForPick } from '@/core/characterPlays/characterPlayLookup';
import { sanitizeCharacterPlayPicks } from '@/core/characterPlays/sanitizeCharacterPlayPicks';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import type {
  CharacterPlayPick,
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  PlaybookDamageMods,
} from '@/core/playbook/playbook.types';
import {
  choiceUsesCharacterPlay,
  rowHasWrapContinuation,
} from '@/core/playbook/wrapSlots';
import { PRIMARY_PICK_INDEX } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Copy every row, replacing the one at `index` with `replace(row)`. */
const withRowReplaced = <T>(
  rows: readonly (readonly T[])[],
  index: number,
  replace: (row: readonly T[]) => T[],
): T[][] => {
  return rows.map((row, rowIndex) => {
    return rowIndex === index ? replace(row) : [...row];
  });
};

/** Returns `null` when the choice is a no-op. */
export const nextPlanAfterWrapChoice = (
  attacker: AttackerData,
  prev: AttackPlan,
  attackIndex: number,
  pickIndex: number,
  id: PlaybookChoiceId | null,
): AttackPlan | null => {
  const clearsFirstSlot = pickIndex === PRIMARY_PICK_INDEX && id === null;
  const unchanged = prev.wrapPicks[attackIndex][pickIndex] === id;

  if (clearsFirstSlot || unchanged) {
    return null;
  }

  const nextPicks = withRowReplaced(prev.wrapPicks, attackIndex, (row) => {
    return row.map((current, slot) => (slot === pickIndex ? id : current));
  });

  const rowLength = nextPicks[attackIndex].length;

  const nextCharacterPlay = withRowReplaced(
    prev.characterPlayPicks,
    attackIndex,
    (row) => {
      const padded = [...row];

      while (padded.length < rowLength) {
        padded.push(null);
      }

      padded[pickIndex] = playSlotForPick(attacker, id, padded[pickIndex]);

      return padded.slice(0, rowLength);
    },
  );

  return { wrapPicks: nextPicks, characterPlayPicks: nextCharacterPlay };
};

/** Returns `null` when there is no continuation to clear. */
export const nextPlanAfterClearWrapContinuation = (
  attacker: AttackerData,
  prev: AttackPlan,
  attackIndex: number,
): AttackPlan | null => {
  const row = prev.wrapPicks[attackIndex];

  if (!rowHasWrapContinuation(row)) {
    return null;
  }

  const firstPick = row[PRIMARY_PICK_INDEX];
  const keepsPlay =
    firstPick != null && choiceUsesCharacterPlay(attacker, firstPick);

  const firstPlay: CharacterPlayPickSlot = keepsPlay
    ? (prev.characterPlayPicks[attackIndex]?.[PRIMARY_PICK_INDEX] ?? null)
    : null;

  const nextPicks = withRowReplaced(prev.wrapPicks, attackIndex, () => {
    return [firstPick];
  });

  const nextCharacterPlay = withRowReplaced(
    prev.characterPlayPicks,
    attackIndex,
    () => {
      return [firstPlay];
    },
  );

  return { wrapPicks: nextPicks, characterPlayPicks: nextCharacterPlay };
};

/** Returns `null` when the pick is unchanged. */
export const nextPlanAfterCharacterPlayPick = (
  attacker: AttackerData,
  prev: AttackPlan,
  attackIndex: number,
  pickIndex: number,
  pick: CharacterPlayPick,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): AttackPlan | null => {
  if (prev.characterPlayPicks[attackIndex]?.[pickIndex] === pick) {
    return null;
  }

  const nextCharacterPlay = withRowReplaced(
    prev.characterPlayPicks,
    attackIndex,
    (row) => {
      const next = [...row];

      next[pickIndex] = pick;

      return next;
    },
  );

  const { characterPlayPicks: sanitized } = sanitizeCharacterPlayPicks(
    attacker,
    prev.wrapPicks,
    nextCharacterPlay,
    damageMods,
    activeBaseCount,
  );

  return { wrapPicks: prev.wrapPicks, characterPlayPicks: sanitized };
};
