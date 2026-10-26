/** Drops Bonus Time spends the momentum pool can no longer pay for. */

import { activationAttackIndices } from "../attacks/attackRows";
import { BONUS_TIME_MOMENTUM_COST } from "../shared/constants";
import { momentumPoolBeforeBonusTime } from "./momentum";
import type { MomentumParams } from "./momentum.types";

/** Passes beyond one per swing, as a safety margin for the settle loop. */
const EXTRA_SETTLE_PASSES = 2;

/** Whether a momentum pool can pay for one Bonus Time spend. */
export const canAffordBonusTime = (pool: number): boolean =>
  pool >= BONUS_TIME_MOMENTUM_COST;

/**
 * Clears Bonus Time flags that can no longer be paid (pool below
 * `BONUS_TIME_MOMENTUM_COST` before that swing).
 */
export const sanitizeBonusTimeFlags = (params: MomentumParams): boolean[] => {
  const order = activationAttackIndices(params, params.wrapPicks);

  const next = [...params.bonusTimeByAttack];
  const maxPasses = order.length + EXTRA_SETTLE_PASSES;

  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;

    for (const attackIndex of order) {
      if (!next[attackIndex]) {
        continue;
      }

      // Each check sees the spends this pass already dropped.
      const pool = momentumPoolBeforeBonusTime(attackIndex, {
        ...params,
        bonusTimeByAttack: next,
      });

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
