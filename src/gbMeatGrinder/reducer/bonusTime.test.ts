import { describe, expect, it } from 'vitest';
import { thresher } from '@/data/attackers/thresher';
import { stateForAttacker } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import type {
  MeatGrinderAction,
  MeatGrinderState,
} from '@/gbMeatGrinder/reducer/reducer.types';
import { pick, reduce } from '@/gbMeatGrinder/reducer/reducerTestHelpers';

describe('Bonus Time', () => {
  const spend = (attackIndex: number): MeatGrinderAction => {
    return { type: 'bonusTime', attackIndex, value: true };
  };

  const unspend = (attackIndex: number): MeatGrinderAction => {
    return { type: 'bonusTime', attackIndex, value: false };
  };

  it('refuses a spend without momentum', () => {
    const state = stateForAttacker(thresher);

    expect(reduce(state, spend(0))).toBe(state);
  });

  it('spends momentum earned on earlier swings', () => {
    const state = reduce(
      stateForAttacker(thresher),
      { type: 'startingMomentum', value: 1 },
      pick(0, 'm2'),
      spend(0),
      spend(1),
    );

    // 1 start - 1 on swing 0 + 1 from the momentous `m2` pays for swing 1.
    expect(state.bonusTimeByAttack.slice(0, 2)).toEqual([true, true]);
  });

  it('turns a spend off', () => {
    const paid = reduce(
      stateForAttacker(thresher),
      { type: 'startingMomentum', value: 1 },
      spend(0),
    );

    const off = reduce(paid, unspend(0));

    expect(paid.bonusTimeByAttack[0]).toBe(true);
    expect(off.bonusTimeByAttack[0]).toBe(false);
  });

  it('clears a spend in the same transition that drops its momentum', () => {
    const broke = reduce(
      stateForAttacker(thresher),
      { type: 'startingMomentum', value: 1 },
      spend(0),
      { type: 'startingMomentum', value: 0 },
    );

    expect(broke.bonusTimeByAttack[0]).toBe(false);
  });

  it('clears a later spend in the same transition that replaces its momentous line', () => {
    const unpicked = reduce(
      stateForAttacker(thresher),
      { type: 'startingMomentum', value: 1 },
      pick(0, 'm2'),
      spend(0),
      spend(1),
      pick(0, 'tackle'),
    );

    expect(unpicked.bonusTimeByAttack.slice(0, 2)).toEqual([true, false]);
  });

  describe('a line only the Bonus Time die reaches', () => {
    // TAC 7 vs ARM 4 tops out at net 3, a column with no momentous line; the
    // Bonus Time die reaches the momentous `m3_dodge` (net 4).
    const ARMOR_CAPPING_NET_3 = 4;
    const BONUS_TIME_LINE = 'm3_dodge';

    const reachedWithBonusTime = (): MeatGrinderState => {
      return reduce(
        stateForAttacker(thresher),
        { type: 'armor', value: ARMOR_CAPPING_NET_3 },
        { type: 'startingMomentum', value: 1 },
        spend(0),
        pick(0, BONUS_TIME_LINE),
      );
    };

    it('is out of reach without the spend', () => {
      const state = reduce(
        stateForAttacker(thresher),
        { type: 'armor', value: ARMOR_CAPPING_NET_3 },
        pick(0, BONUS_TIME_LINE),
      );

      expect(state.attackPlan.wrapPicks[0]).not.toContain(BONUS_TIME_LINE);
    });

    it('is reachable while the spend is on', () => {
      expect(reachedWithBonusTime().attackPlan.wrapPicks[0]).toEqual([
        BONUS_TIME_LINE,
      ]);
    });

    it('drops when the spend is turned off', () => {
      const off = reduce(reachedWithBonusTime(), unspend(0));

      expect(off.attackPlan.wrapPicks[0]).not.toContain(BONUS_TIME_LINE);
    });

    it('drops when the spend can no longer be paid', () => {
      const broke = reduce(reachedWithBonusTime(), {
        type: 'startingMomentum',
        value: 0,
      });

      expect(broke.bonusTimeByAttack[0]).toBe(false);
      expect(broke.attackPlan.wrapPicks[0]).not.toContain(BONUS_TIME_LINE);
    });

    it('also clears the later spend its momentum paid for', () => {
      const broke = reduce(reachedWithBonusTime(), spend(1), {
        type: 'startingMomentum',
        value: 0,
      });

      expect(broke.bonusTimeByAttack.slice(0, 2)).toEqual([false, false]);
    });
  });
});
