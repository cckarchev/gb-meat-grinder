import { describe, expect, it } from 'vitest';
import {
  effectiveBonusTimeForResilience,
  effectiveCharacterPlayPicksForResilience,
  effectiveWrapPicksForResilience,
  resilienceIgnoredAttackIndex,
} from '@/core/resilience';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

const RESILIENT = true;
const NOT_RESILIENT = false;
const NONE_IGNORED = -1;

describe('resilienceIgnoredAttackIndex', () => {
  const attacker = makeAttacker();
  const wrapPicks = [['one'], ['two']];

  it('is the first swing in activation order for a Resilient target', () => {
    expect(
      resilienceIgnoredAttackIndex(attacker, wrapPicks, NO_MODS, 2, RESILIENT),
    ).toBe(0);
  });

  it('is -1 when the target is not Resilient or nothing swings', () => {
    expect(
      resilienceIgnoredAttackIndex(
        attacker,
        wrapPicks,
        NO_MODS,
        2,
        NOT_RESILIENT,
      ),
    ).toBe(NONE_IGNORED);

    expect(
      resilienceIgnoredAttackIndex(attacker, wrapPicks, NO_MODS, 0, RESILIENT),
    ).toBe(NONE_IGNORED);
  });
});

describe('effective plan copies', () => {
  it('blank only the ignored row', () => {
    expect(
      effectiveWrapPicksForResilience([['one', 'two'], ['four']], 0),
    ).toEqual([[null, null], ['four']]);

    expect(
      effectiveCharacterPlayPicksForResilience([['playTac'], ['playDef']], 1),
    ).toEqual([['playTac'], [null]]);
  });

  it('return the input unchanged when nothing is ignored', () => {
    const wrapPicks = [['one']];
    const characterPlayPicks = [['playTac']];

    expect(effectiveWrapPicksForResilience(wrapPicks, NONE_IGNORED)).toBe(
      wrapPicks,
    );

    expect(
      effectiveCharacterPlayPicksForResilience(
        characterPlayPicks,
        NONE_IGNORED,
      ),
    ).toBe(characterPlayPicks);
  });

  it('force Bonus Time off on the ignored swing without mutating input', () => {
    const bonusTime = [true, true];

    expect(effectiveBonusTimeForResilience(bonusTime, 0)).toEqual([
      false,
      true,
    ]);

    expect(effectiveBonusTimeForResilience(bonusTime, NONE_IGNORED)).toEqual([
      true,
      true,
    ]);

    expect(bonusTime).toEqual([true, true]);
  });
});
