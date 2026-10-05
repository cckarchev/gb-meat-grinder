/** User edits to the plan: picking a line, clearing a continuation, choosing a play. */

import { defaultCharacterPlayId } from '@/core/characterPlays/characterPlayLookup';
import { sanitizeCharacterPlayPicksWrap } from '@/core/characterPlays/sanitizeCharacterPlayPicks';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import type {
  CharacterPlayPick,
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  PlaybookDamageMods,
} from '@/core/playbook/playbook.types';
import { choiceUsesCharacterPlay } from '@/core/playbook/wrapSlots';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Copy every row, replacing the one at `index` with `replace(row)`. */
const withRowReplaced = <T>(
  rows: readonly (readonly T[])[],
  index: number,
  replace: (row: readonly T[]) => T[],
): T[][] => {
  return rows.map((row, i) => {
    return i === index ? replace(row) : [...row];
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
  const clearsFirstSlot = pickIndex === 0 && id === null;
  const unchanged = prev.wrapPicks[attackIndex][pickIndex] === id;

  if (clearsFirstSlot || unchanged) {
    return null;
  }

  const nextPicks = withRowReplaced(prev.wrapPicks, attackIndex, (row) => {
    return row.map((cur, j) => (j === pickIndex ? id : cur));
  });

  const rowLength = nextPicks[attackIndex].length;
  const usesPlay = id !== null && choiceUsesCharacterPlay(attacker, id);

  const nextCharacterPlay = withRowReplaced(
    prev.characterPlayPicks,
    attackIndex,
    (row) => {
      const padded = [...row];

      while (padded.length < rowLength) {
        padded.push(null);
      }

      if (!usesPlay) {
        padded[pickIndex] = null;
      } else if (padded[pickIndex] == null) {
        padded[pickIndex] = defaultCharacterPlayId(attacker);
      }

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

  if (row.length <= 1) {
    return null;
  }

  const firstPick = row[0];
  const keepsPlay =
    firstPick != null && choiceUsesCharacterPlay(attacker, firstPick);

  const firstPlay: CharacterPlayPickSlot = keepsPlay
    ? (prev.characterPlayPicks[attackIndex]?.[0] ?? null)
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

  const { characterPlayPicks: sanitized } = sanitizeCharacterPlayPicksWrap(
    attacker,
    prev.wrapPicks,
    nextCharacterPlay,
    damageMods,
    activeBaseCount,
  );

  return { wrapPicks: prev.wrapPicks, characterPlayPicks: sanitized };
};
