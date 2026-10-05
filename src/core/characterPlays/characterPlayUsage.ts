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

  const targetPos = order.indexOf(attackIndex);

  if (targetPos < 0) {
    return used;
  }

  for (let oi = 0; oi <= targetPos; oi++) {
    const j = order[oi];
    const kLimit = j === attackIndex ? pickIndex : wrapPicks[j].length;

    for (let k = 0; k < kLimit; k++) {
      const id = wrapPicks[j][k];

      if (id == null || !choiceUsesCharacterPlay(attacker, id)) {
        continue;
      }

      const f = characterPlayPicks[j]?.[k] ?? defaultCharacterPlayId(attacker);

      // Repeatable plays may be taken again and stack, so they never count as
      // "used up": they stay available and keep applying on later swings.
      if (f != null && getCharacterPlay(attacker, f)?.repeatable !== true) {
        used.add(f);
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
  return characterPlaysForAttacker(attacker).filter((cp) => !used.has(cp.id));
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
