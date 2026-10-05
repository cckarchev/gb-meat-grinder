/** Which character plays an attacker's GB results can trigger, and the default one. */

import type {
  CharacterPlay,
  CharacterPlayPick,
  CharacterPlayPickSlot,
  PlaybookChoiceId,
} from '@/core/playbook/playbook.types';
import { choiceUsesCharacterPlay } from '@/core/playbook/wrapSlots';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Character plays this attacker's GB / 1GB results can trigger (from the catalog). */
export const characterPlaysForAttacker = (
  attacker: AttackerData,
): readonly CharacterPlay[] => {
  return attacker.characterPlays ?? [];
};

export const getCharacterPlay = (
  attacker: AttackerData,
  id: CharacterPlayPick | null,
): CharacterPlay | undefined => {
  if (id == null) {
    return undefined;
  }

  return characterPlaysForAttacker(attacker).find((c) => c.id === id);
};

/** Play picked by default when a GB result is chosen: the first guild play. */
export const defaultCharacterPlayId = (
  attacker: AttackerData,
): CharacterPlayPick | null => {
  return characterPlaysForAttacker(attacker)[0]?.id ?? null;
};

/** Play slot a freshly placed pick starts with: the default play, if it uses one. */
export const initialCharacterPlayFor = (
  attacker: AttackerData,
  id: PlaybookChoiceId,
): CharacterPlayPickSlot => {
  if (!choiceUsesCharacterPlay(attacker, id)) {
    return null;
  }

  return defaultCharacterPlayId(attacker);
};
