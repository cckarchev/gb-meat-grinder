/** Which character plays an attacker's GB results can trigger, and the default one. */

import type {
  CharacterPlay,
  CharacterPlayPickSlot,
  PlaybookChoiceId,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { choiceUsesCharacterPlay } from '@/core/playbook/playbookIndex';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Character plays this attacker's GB / 1GB results can trigger (from the catalog). */
export const characterPlaysForAttacker = (
  attacker: AttackerData,
): readonly CharacterPlay[] => {
  return attacker.characterPlays ?? [];
};

export const getCharacterPlay = (
  attacker: AttackerData,
  id: CharacterPlayPickSlot,
): CharacterPlay | undefined => {
  if (id == null) {
    return undefined;
  }

  return characterPlaysForAttacker(attacker).find((play) => play.id === id);
};

/** Play picked by default when a GB result is chosen: the first guild play. */
export const defaultCharacterPlayId = (
  attacker: AttackerData,
): CharacterPlayPickSlot => {
  return characterPlaysForAttacker(attacker)[0]?.id ?? null;
};

/** The play a pick resolves to: the one in its slot, or the default when empty. */
export const effectivePlayForPick = (
  attacker: AttackerData,
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
): CharacterPlayPickSlot => {
  const slot = characterPlayPicks[attackIndex]?.[pickIndex];

  return slot ?? defaultCharacterPlayId(attacker);
};

/**
 * The play slot a pick should hold: empty unless the pick uses a play, otherwise
 * the `current` play or, when there is none, the default one.
 */
export const playSlotForPick = (
  attacker: AttackerData,
  id: WrapPick,
  current: CharacterPlayPickSlot,
): CharacterPlayPickSlot => {
  if (!choiceUsesCharacterPlay(attacker, id)) {
    return null;
  }

  return current ?? defaultCharacterPlayId(attacker);
};

/** Play slot a freshly placed pick starts with: the default play, if it uses one. */
export const initialCharacterPlayFor = (
  attacker: AttackerData,
  id: PlaybookChoiceId,
): CharacterPlayPickSlot => {
  return playSlotForPick(attacker, id, null);
};

/** Slots of a swing's wrap row whose pick grants a character play. */
export const characterPlayPickIndexes = (
  attacker: AttackerData,
  rowPicks: readonly WrapPick[],
): number[] => {
  const pickIndexes: number[] = [];

  rowPicks.forEach((choiceId, pickIndex) => {
    if (choiceId != null && choiceUsesCharacterPlay(attacker, choiceId)) {
      pickIndexes.push(pickIndex);
    }
  });

  return pickIndexes;
};
