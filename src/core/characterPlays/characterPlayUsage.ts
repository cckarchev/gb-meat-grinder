/** Once Per Turn bookkeeping: which plays earlier picks used up and which remain. */

import { activationAttackIndices } from '@/core/attacks/attackRows';
import {
  characterPlaysForAttacker,
  defaultCharacterPlayId,
  getCharacterPlay,
} from '@/core/characterPlays/characterPlayLookup';
import type {
  CharacterPlay,
  CharacterPlayPickSlot,
  CharacterPlayUsage,
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { choiceUsesCharacterPlay } from '@/core/playbook/wrapSlots';
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
  const used = new Set<string>();

  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

  const orderPosition = order.indexOf(attackIndex);

  if (orderPosition < 0) {
    return used;
  }

  for (let position = 0; position <= orderPosition; position++) {
    const swingIndex = order[position];
    const swingPicks = wrapPicks[swingIndex];
    const isTargetSwing = swingIndex === attackIndex;
    const picksToCheck = isTargetSwing ? pickIndex : swingPicks.length;

    for (let slot = 0; slot < picksToCheck; slot++) {
      const id = swingPicks[slot];

      if (id == null || !choiceUsesCharacterPlay(attacker, id)) {
        continue;
      }

      const play =
        characterPlayPicks[swingIndex]?.[slot] ??
        defaultCharacterPlayId(attacker);

      // Repeatable plays may be taken again and stack, so they never count as
      // "used up": they stay available and keep applying on later swings.
      if (
        play != null &&
        getCharacterPlay(attacker, play)?.repeatable !== true
      ) {
        used.add(play);
      }
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
