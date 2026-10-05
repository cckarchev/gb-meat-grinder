import { describe, expect, it } from 'vitest';
import {
  canAffordBonusTime,
  sanitizeBonusTimeFlags,
} from '@/core/activation/bonusTimeFlags';
import { BONUS_TIME_MOMENTUM_COST } from '@/core/shared/constants';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

describe('canAffordBonusTime', () => {
  it('needs a pool that covers the cost', () => {
    expect(canAffordBonusTime(BONUS_TIME_MOMENTUM_COST)).toBe(true);
    expect(canAffordBonusTime(BONUS_TIME_MOMENTUM_COST - 1)).toBe(false);
  });
});

describe('sanitizeBonusTimeFlags', () => {
  const attacker = makeAttacker({ inf: 3 });
  const activeBaseCount = 3;

  it('clears Bonus Time flags that cannot be paid', () => {
    expect(
      sanitizeBonusTimeFlags({
        attacker,
        wrapPicks: [['dodge'], ['one'], ['dodge']],
        damageMods: NO_MODS,
        startingMomentum: 0,
        bonusTimeByAttack: [true, true, true],
        activeBaseCount,
      }),
    ).toEqual([false, false, true]);
  });
});
