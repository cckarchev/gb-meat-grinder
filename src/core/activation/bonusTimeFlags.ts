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

/** Whether a momentum pool can pay for one Bonus Time spend. */
export const canAffordBonusTime = (pool: number): boolean => {
  return pool >= BONUS_TIME_MOMENTUM_COST;
};

/** Clears Bonus Time flags that can no longer be paid (pool below `BONUS_TIME_MOMENTUM_COST` before that swing). */
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

    for (const attackIndex of order) {
      if (!next[attackIndex]) {
        continue;
      }

      const pool = momentumPoolBeforeBonusTime(
        attacker,
        wrapPicks,
        damageMods,
        attackIndex,
        startingMomentum,
        next,
        activeBaseCount,
      );

      if (!canAffordBonusTime(pool)) {
        next[attackIndex] = false;
        changed = true;
      }
    }

    if (!changed) {
      break;
    }
  }

  return next;
};
