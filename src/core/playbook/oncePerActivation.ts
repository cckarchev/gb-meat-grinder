/** Playbook effects that only apply once per activation: Knock Down and Tackle. */

import { picksBeforeInActivation } from '@/core/attacks/attackRows';
import type {
  PlaybookDamageMods,
  PlaybookResult,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/playbookIndex';
import type { AttackerData } from '@/data/attackers/attacker.types';

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
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
  matches: PlaybookResultMatcher,
): boolean => {
  const earlierPicks = picksBeforeInActivation(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
    attackIndex,
    pickIndex,
  );

  return earlierPicks.some((earlier) => {
    return matches(getPlaybookResult(attacker, earlier.id));
  });
};
