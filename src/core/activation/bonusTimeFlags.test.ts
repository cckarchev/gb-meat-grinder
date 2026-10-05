import { describe, expect, it } from 'vitest';
import { sanitizeBonusTimeFlags } from '@/core/activation/bonusTimeFlags';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

describe('sanitizeBonusTimeFlags', () => {
  const attacker = makeAttacker({ inf: 3 });
  const activeBaseCount = 3;

  it('clears Bonus Time flags that cannot be paid', () => {
    expect(
      sanitizeBonusTimeFlags(
        attacker,
        [['dodge'], ['one'], ['dodge']],
        NO_MODS,
        0,
        [true, true, true],
        activeBaseCount,
      ),
    ).toEqual([false, false, true]);
  });
});
