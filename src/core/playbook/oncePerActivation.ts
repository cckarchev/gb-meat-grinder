/** Playbook effects that only apply once per activation: Knock Down and Tackle. */

import { picksBeforeInActivation } from '@/core/attacks/attackRows';
import type { ActivationOrderParams } from '@/core/attacks/attackSequence.types';
import type { PickPosition } from '@/core/plan/attackPlan.types';
import type { PlaybookResult, WrapPick } from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/playbookIndex';

export type PlaybookResultMatcher = (result: PlaybookResult) => boolean;

/** True for a line whose effect can only apply once per activation. */
export const isOncePerActivation: PlaybookResultMatcher = (result) => {
  const knocksDown = result.appliesKnockDown === true;
  const tackles = result.stealsBall === true;

  return knocksDown || tackles;
};

/**
 * True if a strictly earlier wrap pick (activation order) is a line that
 * `matches`.
 */
export const matchingPickBefore = (
  order: ActivationOrderParams,
  wrapPicks: WrapPick[][],
  position: PickPosition,
  matches: PlaybookResultMatcher,
): boolean => {
  const earlierPicks = picksBeforeInActivation(order, wrapPicks, position);

  return earlierPicks.some((earlier) => {
    return matches(getPlaybookResult(order.attacker, earlier.id));
  });
};
