/** Tackle takes the ball, so only one Tackle can apply per activation. */

import type { ActivationOrderParams } from "../attacks/attackSequence.types";
import type { PickPosition } from "../plan/attackPlan.types";
import { matchingPickBefore, stealsBall } from "./oncePerActivation";
import type { WrapPick } from "./playbook.types";

/**
 * True if Tackle is unavailable for this pick: a strictly earlier wrap pick
 * (activation order) already took the ball.
 */
export const tackleTakenBeforePick = (
  order: ActivationOrderParams,
  wrapPicks: WrapPick[][],
  position: PickPosition,
): boolean => matchingPickBefore(order, wrapPicks, position, stealsBall);
