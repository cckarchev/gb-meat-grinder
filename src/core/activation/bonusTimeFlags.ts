/** Drops Bonus Time spends the momentum pool can no longer pay for. */

import { momentumPoolBeforeBonusTime } from '@/core/activation/momentum';
import { activationAttackIndices } from '@/core/attacks/attackRows';
import type {
  PlaybookDamageMods,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { BONUS_TIME_MOMENTUM_COST } from '@/core/shared/constants';
import type { AttackerData } from '@/data/attackers/attacker.types';

/** Passes beyond one per swing, as a safety margin for the settle loop. */
const EXTRA_SETTLE_PASSES = 2;

/** Clears Bonus Time flags that can no longer be paid (pool less than 1 before that swing). */
export const sanitizeBonusTimeFlags = (
  attacker: AttackerData,
  wrapPicks: WrapPick[][],
  damageMods: PlaybookDamageMods,
  startingMomentum: number,
  bonusTimeByAttack: readonly boolean[],
  activeBaseCount: number,
): boolean[] => {
  const order = activationAttackIndices(
    attacker,
    wrapPicks,
    damageMods,
    activeBaseCount,
  );

  const next = [...bonusTimeByAttack];
  const maxPasses = order.length + EXTRA_SETTLE_PASSES;

  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;

    for (const i of order) {
      if (!next[i]) {
        continue;
      }

      const pool = momentumPoolBeforeBonusTime(
        attacker,
        wrapPicks,
        damageMods,
        i,
        startingMomentum,
        next,
        activeBaseCount,
      );

      if (pool < BONUS_TIME_MOMENTUM_COST) {
        next[i] = false;
        changed = true;
      }
    }

    if (!changed) {
      break;
    }
  }

  return next;
};
