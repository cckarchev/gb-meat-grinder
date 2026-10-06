/** Tackle takes the ball, so only one Tackle can apply per activation. */

import { matchingPickBefore } from '@/core/playbook/oncePerActivation';
import type {
  PlaybookDamageMods,
  PlaybookResult,
  WrapPick,
} from '@/core/playbook/playbook.types';
import type { AttackerData } from '@/data/attackers/attacker.types';

export const stealsBall = (result: PlaybookResult): boolean => {
  return result.stealsBall === true;
};

/**
 * True if Tackle is unavailable for this pick: a strictly earlier wrap pick
 * (activation order) already took the ball.
 */
export const tackleTakenBeforePick = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  attackIndex: number,
  pickIndex: number,
  damageMods: PlaybookDamageMods,
  activeBaseCount: number,
): boolean => {
  return matchingPickBefore(
    attacker,
    wrapPicks,
    attackIndex,
    pickIndex,
    damageMods,
    activeBaseCount,
    stealsBall,
  );
};
