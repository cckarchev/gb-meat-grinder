import { describe, expect, it } from 'vitest';
import {
  momentumAfterAttackInclusive,
  momentumPoolBeforeBonusTime,
} from '@/core/activation/momentum';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

describe('momentum', () => {
  const attacker = makeAttacker({ inf: 3 });
  const wrapPicks = [['one', 'two'], ['dodge'], ['four']];
  const bonusTime = [true, false, false];
  const startingMomentum = 1;
  const activeBaseCount = 3;

  it('counts heat picks and Bonus Time spends before a swing', () => {
    // 1 start + 2 heat on row 0 - 1 Bonus Time on row 0 + 0 on row 1.
    expect(
      momentumPoolBeforeBonusTime(
        attacker,
        wrapPicks,
        NO_MODS,
        2,
        startingMomentum,
        bonusTime,
        activeBaseCount,
      ),
    ).toBe(2);
  });

  it('includes the swing itself after it resolves', () => {
    expect(
      momentumAfterAttackInclusive(
        attacker,
        wrapPicks,
        NO_MODS,
        2,
        startingMomentum,
        bonusTime,
        activeBaseCount,
      ),
    ).toBe(3);
  });
});
