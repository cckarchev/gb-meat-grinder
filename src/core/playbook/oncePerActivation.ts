/**
 * Playbook effects that only apply once per activation: Knock Down and Tackle.
 */

import { picksBeforeInActivation } from "../attacks/attackRows";
import type { ActivationOrderParams } from "../attacks/attackSequence.types";
import type { PickPosition } from "../plan/attackPlan.types";
import type { PlaybookResult, WrapPick } from "./playbook.types";
import { getPlaybookResult } from "./playbookIndex";

export type PlaybookResultMatcher = (result: PlaybookResult) => boolean;

export const appliesKnockDown: PlaybookResultMatcher = (result) =>
  result.appliesKnockDown === true;

export const stealsBall: PlaybookResultMatcher = (result) =>
  result.stealsBall === true;

/** True for a line whose effect can only apply once per activation. */
export const isOncePerActivation: PlaybookResultMatcher = (result) =>
  appliesKnockDown(result) || stealsBall(result);

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

  return earlierPicks.some((earlier) =>
    matches(getPlaybookResult(order.attacker, earlier.id)),
  );
};
