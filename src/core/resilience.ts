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

import { activationAttackIndices } from '@/core/playbook';
import type { AttackerData } from '@/types/core/attacker';
import type {
  CharacterPlayPickSlot,
  PlaybookDamageMods,
  WrapPick,
} from '@/types/core/playbook';

/**
 * Attack-array index of the swing a Resilient target ignores: the first swing in
 * activation order (always base attack 0). Returns -1 when the target is not
 * Resilient or there are no attacks this activation.
 */
export function resilienceIgnoredAttackIndex(
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
  enemyResilience: boolean,
): number {
  if (!enemyResilience) return -1;
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );
  return order.length > 0 ? order[0] : -1;
}

/** Wrap picks with the ignored swing's row blanked (unchanged when none). */
export function effectiveWrapPicksForResilience(
  wrapPicks: WrapPick[][],
  ignoredIndex: number,
): WrapPick[][] {
  if (ignoredIndex < 0) return wrapPicks;
  return wrapPicks.map((row, i) =>
    i === ignoredIndex ? row.map(() => null) : row,
  );
}

/** Character-play picks with the ignored swing's row blanked (unchanged when none). */
export function effectiveCharacterPlayPicksForResilience(
  characterPlayPicks: CharacterPlayPickSlot[][],
  ignoredIndex: number,
): CharacterPlayPickSlot[][] {
  if (ignoredIndex < 0) return characterPlayPicks;
  return characterPlayPicks.map((row, i) =>
    i === ignoredIndex ? row.map(() => null) : row,
  );
}

/** Bonus-Time flags with the ignored swing forced off (unchanged when none). */
export function effectiveBonusTimeForResilience(
  bonusTimeByAttack: readonly boolean[],
  ignoredIndex: number,
): boolean[] {
  const base = bonusTimeByAttack.map((b) => b);
  if (ignoredIndex >= 0) base[ignoredIndex] = false;
  return base;
}
