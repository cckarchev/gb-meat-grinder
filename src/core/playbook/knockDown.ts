/** Knock Down only applies once per activation, and never on a target already down. */

import type { ActivationOrderParams } from '@/core/attacks/attackSequence.types';
import type { PickPosition } from '@/core/plan/attackPlan.types';
import {
  appliesKnockDown,
  matchingPickBefore,
} from '@/core/playbook/oncePerActivation';
import type { PlaybookResult, WrapPick } from '@/core/playbook/playbook.types';

/**
 * True if Knock Down is unavailable for this pick: either the target is already
 * Knocked Down before the activation, or KD was taken on a strictly earlier wrap
 * pick (activation order). Only one KD can ever apply.
 */
export const knockDownTakenBeforePick = (
  order: ActivationOrderParams,
  wrapPicks: WrapPick[][],
  position: PickPosition,
  enemyKnockedDown: boolean,
): boolean => {
  if (enemyKnockedDown) {
    return true;
  }

  return matchingPickBefore(order, wrapPicks, position, appliesKnockDown);
};

/**
 * True if Knock Down is all this line does. A line with other effects (damage,
 * a dodge, ...) stays worth picking after KD is taken: its effects apply on
 * their own and only the KD is dropped. Momentum is not one of them: it is
 * earned by picking a valid result, and a KD on a Knocked Down target is not.
 */
export const knockDownIsOnlyEffect = (result: PlaybookResult): boolean => {
  if (!result.appliesKnockDown) {
    return false;
  }

  const hasOtherEffect =
    result.damage > 0 ||
    result.dodge === true ||
    result.clearsCover === true ||
    result.picksCharacterPlay === true ||
    (result.tacBonusForLater ?? 0) > 0;

  return !hasOtherEffect;
};
