import { describe, expect, it } from 'vitest';
import {
  momentousLineStyle,
  momentumAfterAttackInclusive,
  momentumPoolBeforeBonusTime,
  pickGeneratesMomentum,
  sanitizeBonusTimeFlags,
} from '@/core/activation/momentum';
import { makeAttacker, modsWith, NO_MODS } from '@/core/testing/fixtures';

const TOUGH_HIDE = modsWith({ toughHide: true });

describe('momentum', () => {
  const attacker = makeAttacker({ inf: 3 });
  const wrapPicks = [['one', 'two'], ['dodge'], ['four']];
  const bonusTime = [true, false, false];
  const startingMomentum = 1;
  const activeBaseCount = 3;

  it('marks momentous lines by their effective damage', () => {
    expect(momentousLineStyle(attacker, 'one', NO_MODS)).toBe('heat');
    expect(momentousLineStyle(attacker, 'one', TOUGH_HIDE)).toBe('zeroed');
    expect(momentousLineStyle(attacker, 'dodge', NO_MODS)).toBe('none');
    expect(pickGeneratesMomentum(attacker, 'one', TOUGH_HIDE)).toBe(false);
    expect(pickGeneratesMomentum(attacker, null, NO_MODS)).toBe(false);
  });

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
