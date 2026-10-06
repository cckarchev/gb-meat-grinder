/** Tackle takes the ball, so only one Tackle can apply per activation. */

import type { ActivationOrderParams } from '@/core/attacks/attackSequence.types';
import type { PickPosition } from '@/core/plan/attackPlan.types';
import {
  matchingPickBefore,
  stealsBall,
} from '@/core/playbook/oncePerActivation';
import type { WrapPick } from '@/core/playbook/playbook.types';

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
