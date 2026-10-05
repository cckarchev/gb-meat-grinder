/** Knock Down only applies once per activation, and never on a target already down. */

import { activationAttackIndices } from '@/core/attacks/attackRows';
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
export const kdAlreadyTakenBeforePick = (
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

  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

  const targetPos = order.indexOf(attackIndex);

  if (targetPos < 0) {
    return false;
  }

  for (let oi = 0; oi <= targetPos; oi++) {
    const j = order[oi];
    const kLimit = j === attackIndex ? pickIndex : wrapPicks[j].length;

    for (let k = 0; k < kLimit; k++) {
      const id = wrapPicks[j][k];

      if (id != null && getPlaybookResult(attacker, id).appliesKnockDown) {
        return true;
      }
    }
  }

  return false;
};
