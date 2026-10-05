/** What earlier swings in the activation leave behind for a later one: cover cleared. */

import {
  coverSwingClockIndices,
  wrapPickClearsCover,
} from '@/core/playbook/coverClearing';
import type { WrapPick } from '@/core/playbook/playbook.types';
import { COVER_TAC_PENALTY } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/**
 * Cover: `COVER_TAC_PENALTY` fewer dice on this attack while the enemy is in terrain.
 * Push (>) or double push (>>) on any **earlier** attack in activation order
 * (base → berserker → …) clears that terrain benefit on later swings.
 */
export const coverTacPenaltyForAttack = (
  attacker: AttackerData,
  enemyHasCover: boolean,
  wrapPicks: WrapPick[][],
  attackIndex: number,
  activeBaseCount: number,
): number => {
  if (!enemyHasCover) {
    return 0;
  }

  /* Use fixed base → berserker clock so > / >> are never skipped when a berserker
   * row is omitted from `activationAttackIndices` (damage-gated). */
  const clock = coverSwingClockIndices(attacker, activeBaseCount);
  const clockPosition = clock.indexOf(attackIndex);

  if (clockPosition < 0) {
    return COVER_TAC_PENALTY;
  }

  const earlierSwings = clock.slice(0, clockPosition);

  const coverCleared = earlierSwings.some((earlierIndex) => {
    const row = wrapPicks[earlierIndex] ?? [];

    return row.some((id) => wrapPickClearsCover(attacker, id));
  });

  return coverCleared ? 0 : COVER_TAC_PENALTY;
};
