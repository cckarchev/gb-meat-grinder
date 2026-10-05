import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MeatGrinderAction } from '@/gbMeatGrinder/reducer/reducer.types';
import {
  initialState,
  PICK_THRESHER,
  pick,
  reduce,
} from '@/gbMeatGrinder/reducer/reducerTestHelpers';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Bonus Time', () => {
  const spend = (attackIndex: number): MeatGrinderAction => {
    return { type: 'bonusTime', attackIndex, value: true };
  };

  it('refuses a spend without momentum', () => {
    const state = initialState(PICK_THRESHER);

    expect(reduce(state, spend(0))).toBe(state);
  });

  it('spends momentum earned on earlier swings', () => {
    const state = reduce(
      initialState(PICK_THRESHER),
      { type: 'startingMomentum', value: 1 },
      pick(0, 'm2'),
      spend(0),
      spend(1),
    );

    // 1 start - 1 on swing 0 + 1 from the momentous `m2` pays for swing 1.
    expect(state.bonusTimeByAttack.slice(0, 2)).toEqual([true, true]);
  });

  it('clears spends that can no longer be paid', () => {
    const paid = reduce(
      initialState(PICK_THRESHER),
      { type: 'startingMomentum', value: 1 },
      spend(0),
    );

    const broke = { ...paid, startingMomentum: 0 };
    const sanitized = reduce(broke, { type: 'sanitizeBonusTime' });

    expect(reduce(paid, { type: 'sanitizeBonusTime' })).toBe(paid);
    expect(sanitized.bonusTimeByAttack[0]).toBe(false);

    expect(
      reduce(paid, { type: 'bonusTime', attackIndex: 0, value: false })
        .bonusTimeByAttack[0],
    ).toBe(false);
  });
});
