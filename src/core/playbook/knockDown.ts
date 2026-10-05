/** Knock Down only applies once per activation, and never on a target already down. */

import { picksBeforeInActivation } from '@/core/attacks/attackRows';
import type {
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/wrapSlots';
import type { AttackerData } from '@/data/attackers/attacker.types';

/**
 * True if Knock Down is unavailable for this pick: either the target is already
 * Knocked Down before the activation, or KD was taken on a strictly earlier wrap
 * pick (activation order). Only one KD can ever apply.
 */
export const knockDownTakenBeforePick = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
  enemyKnockedDown = false,
): boolean => {
  if (enemyKnockedDown) {
    return true;
  }

  const earlierPicks = picksBeforeInActivation(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
    attackIndex,
    pickIndex,
  );

  return earlierPicks.some((earlier) => {
    return getPlaybookResult(attacker, earlier.id).appliesKnockDown === true;
  });
};
