/**
 * Resilience: a target trait that wholly ignores the activation's first attack.
 *
 * Rather than thread "is this swing ignored?" through every carry-over function,
 * we model it by handing the engine an *effective* copy of the plan where the
 * ignored swing's row is blanked. Every downstream calculation already reads its
 * inputs from these rows (damage, momentum, TAC/DEF/ARM carry-over, cover
 * clearing, the single Knock Down, Berserker triggers, character plays), so a
 * blank row makes the swing contribute nothing and carry nothing forward.
 */

import { activationAttackIndices } from '@/core/attacks/attackRows';
import type { ActivationOrderParams } from '@/core/attacks/attackSequence.types';
import type {
  CharacterPlayPickSlot,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { isAttackIndex } from '@/core/shared/attackIndex';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';

/**
 * Attack-array index of the swing a Resilient target ignores: the first swing
 * in activation order (always base attack 0). Returns `NO_ATTACK_INDEX` when
 * the target is not Resilient or there are no attacks this activation.
 */
export const resilienceIgnoredAttackIndex = (
  order: ActivationOrderParams,
  wrapPicks: WrapPick[][],
  enemyResilience: boolean,
): number => {
  if (!enemyResilience) {
    return NO_ATTACK_INDEX;
  }

  const attackIndices = activationAttackIndices(order, wrapPicks);

  return attackIndices.length > 0 ? attackIndices[0] : NO_ATTACK_INDEX;
};

/** Rows with the ignored swing's row blanked (the same rows when none is ignored). */
const withIgnoredRowBlanked = <T>(
  rows: (T | null)[][],
  ignoredIndex: number,
): (T | null)[][] => {
  if (!isAttackIndex(ignoredIndex)) {
    return rows;
  }

  return rows.map((row, attackIndex) => {
    return attackIndex === ignoredIndex ? row.map(() => null) : row;
  });
};

/** Wrap picks with the ignored swing's row blanked (unchanged when none). */
export const effectiveWrapPicksForResilience = (
  wrapPicks: WrapPick[][],
  ignoredIndex: number,
): WrapPick[][] => {
  return withIgnoredRowBlanked(wrapPicks, ignoredIndex);
};

/** Character-play picks with the ignored swing's row blanked (unchanged when none). */
export const effectiveCharacterPlayPicksForResilience = (
  characterPlayPicks: CharacterPlayPickSlot[][],
  ignoredIndex: number,
): CharacterPlayPickSlot[][] => {
  return withIgnoredRowBlanked(characterPlayPicks, ignoredIndex);
};

/** Bonus-Time flags with the ignored swing forced off (unchanged when none). */
export const effectiveBonusTimeForResilience = (
  bonusTimeByAttack: readonly boolean[],
  ignoredIndex: number,
): boolean[] => {
  const flags = [...bonusTimeByAttack];

  if (isAttackIndex(ignoredIndex)) {
    flags[ignoredIndex] = false;
  }

  return flags;
};
