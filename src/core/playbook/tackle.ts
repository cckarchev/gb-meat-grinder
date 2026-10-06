/** Tackle takes the ball, so only one Tackle can apply per activation. */

import type { ActivationOrderParams } from '@/core/attacks/attackSequence.types';
import type { PickPosition } from '@/core/plan/attackPlan.types';
import { matchingPickBefore } from '@/core/playbook/oncePerActivation';
import type { PlaybookResult, WrapPick } from '@/core/playbook/playbook.types';

export const stealsBall = (result: PlaybookResult): boolean => {
  return result.stealsBall === true;
};

/**
 * True if Tackle is unavailable for this pick: a strictly earlier wrap pick
 * (activation order) already took the ball.
 */
export const tackleTakenBeforePick = (
  order: ActivationOrderParams,
  wrapPicks: WrapPick[][],
  position: PickPosition,
): boolean => {
  return matchingPickBefore(order, wrapPicks, position, stealsBall);
};
