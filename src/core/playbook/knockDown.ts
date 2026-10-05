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

  const orderPosition = order.indexOf(attackIndex);

  if (orderPosition < 0) {
    return false;
  }

  for (let position = 0; position <= orderPosition; position++) {
    const swingIndex = order[position];
    const swingPicks = wrapPicks[swingIndex];
    const isTargetSwing = swingIndex === attackIndex;
    const picksToCheck = isTargetSwing ? pickIndex : swingPicks.length;

    for (let slot = 0; slot < picksToCheck; slot++) {
      const id = swingPicks[slot];

      if (id != null && getPlaybookResult(attacker, id).appliesKnockDown) {
        return true;
      }
    }
  }

  return false;
};
