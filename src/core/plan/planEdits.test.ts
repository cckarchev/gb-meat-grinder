import { describe, expect, it } from 'vitest';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import {
  nextPlanAfterCharacterPlayPick,
  nextPlanAfterClearWrapContinuation,
  nextPlanAfterWrapChoice,
} from '@/core/plan/planEdits';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

const attacker = makeAttacker();

const plan = (
  wrapPicks: AttackPlan['wrapPicks'],
  characterPlayPicks: AttackPlan['characterPlayPicks'],
): AttackPlan => {
  return { wrapPicks, characterPlayPicks };
};

describe('nextPlanAfterWrapChoice', () => {
  const prev = plan([['one'], ['two']], [[null], [null]]);

  it('is a no-op for clearing slot 0 or re-picking the same line', () => {
    expect(nextPlanAfterWrapChoice(attacker, prev, 0, 0, null)).toBeNull();
    expect(nextPlanAfterWrapChoice(attacker, prev, 0, 0, 'one')).toBeNull();
  });

  it('defaults the character play on a GB pick and clears it otherwise', () => {
    const withGb = nextPlanAfterWrapChoice(attacker, prev, 1, 0, 'gb');

    expect(withGb).toEqual(plan([['one'], ['gb']], [[null], ['playTac']]));

    if (!withGb) {
      return;
    }

    expect(nextPlanAfterWrapChoice(attacker, withGb, 1, 0, 'one')).toEqual(
      plan([['one'], ['one']], [[null], [null]]),
    );
  });
});

describe('nextPlanAfterClearWrapContinuation', () => {
  it('keeps only the first pick of the row', () => {
    const prev = plan([['gb', 'two'], ['one']], [['playDef', null], [null]]);

    expect(nextPlanAfterClearWrapContinuation(attacker, prev, 0)).toEqual(
      plan([['gb'], ['one']], [['playDef'], [null]]),
    );
  });

  it('is a no-op without a continuation', () => {
    const prev = plan([['one']], [[null]]);

    expect(nextPlanAfterClearWrapContinuation(attacker, prev, 0)).toBeNull();
  });
});

describe('nextPlanAfterCharacterPlayPick', () => {
  const prev = plan([['gb'], ['gb']], [['playTac'], ['playDef']]);

  it('is a no-op for the same play', () => {
    expect(
      nextPlanAfterCharacterPlayPick(
        attacker,
        prev,
        0,
        0,
        'playTac',
        NO_MODS,
        2,
      ),
    ).toBeNull();
  });

  it('re-sanitizes later picks that became illegal', () => {
    expect(
      nextPlanAfterCharacterPlayPick(
        attacker,
        prev,
        0,
        0,
        'playDef',
        NO_MODS,
        2,
      ),
    ).toEqual(plan([['gb'], ['gb']], [['playDef'], ['playTac']]));
  });
});

describe('plan edge cases', () => {
  it('pads the play row when picking a later wrap slot', () => {
    const prev = plan([['four', null]], [[null]]);

    expect(nextPlanAfterWrapChoice(attacker, prev, 0, 1, 'gb')).toEqual(
      plan([['four', 'gb']], [[null, 'playTac']]),
    );
  });

  it('drops a stale play when the kept first pick is not GB', () => {
    const prev = plan([['one', 'two']], [['playTac', null]]);

    expect(nextPlanAfterClearWrapContinuation(attacker, prev, 0)).toEqual(
      plan([['one']], [[null]]),
    );
  });
});
