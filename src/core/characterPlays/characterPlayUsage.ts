/** Once Per Turn bookkeeping: which plays earlier picks used up and which remain. */

import { picksBeforeInActivation } from '@/core/attacks/attackRows';
import {
  characterPlaysForAttacker,
  effectivePlayForPick,
  getCharacterPlay,
} from '@/core/characterPlays/characterPlayLookup';
import type {
  CharacterPlay,
  CharacterPlayPick,
  CharacterPlayPickSlot,
  CharacterPlayUsage,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { choiceUsesCharacterPlay } from '@/core/playbook/playbookIndex';
import type { AttackerData } from '@/data/attackers/attacker.types';

/**
 * Character plays already taken on picks strictly before `(attackIndex,
 * pickIndex)` in activation order (base then its berserker, then next base, …).
 */
export const characterPlayUsageBeforePick = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): CharacterPlayUsage => {
  const used = new Set<CharacterPlayPick>();

  const earlierPicks = picksBeforeInActivation(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
    attackIndex,
    pickIndex,
  );

  for (const earlier of earlierPicks) {
    if (!choiceUsesCharacterPlay(attacker, earlier.id)) {
      continue;
    }

    const play = effectivePlayForPick(
      attacker,
      characterPlayPicks,
      earlier.attackIndex,
      earlier.pickIndex,
    );

    // Plays that are not Once Per Turn may be picked again, so they never count
    // as used up. Their effect still applies once (same name, see the timeline).
    const oncePerTurn = getCharacterPlay(attacker, play)?.oncePerTurn === true;

    if (play != null && oncePerTurn) {
      used.add(play);
    }
  }

  return used;
};

/** The attacker's plays that are not in `used`. */
export const unusedCharacterPlays = (
  attacker: AttackerData,
  used: CharacterPlayUsage,
): CharacterPlay[] => {
  return characterPlaysForAttacker(attacker).filter(
    (play) => !used.has(play.id),
  );
};

/** Character plays still choosable on this pick (those not used by earlier picks). */
export const characterPlayAvailabilityForPick = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  characterPlayPicks: CharacterPlayPickSlot[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): { available: readonly CharacterPlay[]; depleted: boolean } => {
  const used = characterPlayUsageBeforePick(
    attacker,
    wrapPicks,
    characterPlayPicks,
    attackIndex,
    pickIndex,
    damageMods,
    activeBaseCount,
  );

  const available = unusedCharacterPlays(attacker, used);

  return { available, depleted: available.length === 0 };
};
