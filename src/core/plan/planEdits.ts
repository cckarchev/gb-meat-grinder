/**
 * User edits to the plan: picking a line, clearing a continuation, choosing a
 * play.
 */

import type { AttackerData } from "@/data/attackers/attacker.types";
import type { ActivationOrderParams } from "../attacks/attackSequence.types";
import { playSlotForPick } from "../character-plays/characterPlayLookup";
import { sanitizeCharacterPlayPicks } from "../character-plays/sanitizeCharacterPlayPicks";
import type { CharacterPlayPickSlot } from "../playbook/playbook.types";
import { choiceUsesCharacterPlay } from "../playbook/playbookIndex";
import { rowHasWrapContinuation } from "../playbook/wrapSlots";
import { PRIMARY_PICK_INDEX } from "../shared/constants";
import type {
  AttackPlan,
  CharacterPlayPickEdit,
  WrapChoiceEdit,
} from "./attackPlan.types";

/** Copy every row, replacing the one at `index` with `replace(row)`. */
const withRowReplaced = <T>(
  rows: readonly (readonly T[])[],
  index: number,
  replace: (row: readonly T[]) => T[],
): T[][] =>
  rows.map((row, rowIndex) => (rowIndex === index ? replace(row) : [...row]));

/** Returns `null` when the choice is a no-op. */
export const nextPlanAfterWrapChoice = (
  prev: AttackPlan,
  edit: WrapChoiceEdit,
  attacker: AttackerData,
): AttackPlan | null => {
  const { attackIndex, pickIndex, id } = edit;
  const clearsFirstSlot = pickIndex === PRIMARY_PICK_INDEX && id === null;
  const unchanged = prev.wrapPicks[attackIndex][pickIndex] === id;

  if (clearsFirstSlot || unchanged) {
    return null;
  }

  const nextPicks = withRowReplaced(prev.wrapPicks, attackIndex, (row) =>
    row.map((current, slot) => (slot === pickIndex ? id : current)),
  );

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
  prev: AttackPlan,
  attackIndex: number,
  attacker: AttackerData,
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

  const nextPicks = withRowReplaced(prev.wrapPicks, attackIndex, () => [
    firstPick,
  ]);

  const nextCharacterPlay = withRowReplaced(
    prev.characterPlayPicks,
    attackIndex,
    () => [firstPlay],
  );

  return { wrapPicks: nextPicks, characterPlayPicks: nextCharacterPlay };
};

/** Returns `null` when the pick is unchanged. */
export const nextPlanAfterCharacterPlayPick = (
  prev: AttackPlan,
  edit: CharacterPlayPickEdit,
  params: ActivationOrderParams,
): AttackPlan | null => {
  const { attackIndex, pickIndex, pick } = edit;

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

  const { characterPlayPicks: sanitized } = sanitizeCharacterPlayPicks(params, {
    wrapPicks: prev.wrapPicks,
    characterPlayPicks: nextCharacterPlay,
  });

  return { wrapPicks: prev.wrapPicks, characterPlayPicks: sanitized };
};
