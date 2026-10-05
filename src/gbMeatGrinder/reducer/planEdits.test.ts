import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  initialState,
  PICK_THRESHER,
  PICK_VETERAN_BOAR,
  pick,
  reduce,
} from '@/gbMeatGrinder/reducer/reducerTestHelpers';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('plan edits', () => {
  it('ignores no-op wrap choices', () => {
    const state = initialState(PICK_THRESHER);

    expect(reduce(state, pick(0, null))).toBe(state);
  });

  it('defaults the character play on a GB pick', () => {
    const state = reduce(initialState(PICK_THRESHER), pick(0, 'three_gb'));

    expect(state.attackPlan.characterPlayPicks[0]).toEqual(['theyAintTough']);
  });

  it('clamps an unreachable pick', () => {
    const state = reduce(
      initialState(PICK_THRESHER),
      { type: 'armor', value: 5 },
      pick(0, 'm4'),
    );

    expect(state.attackPlan.wrapPicks[0]).toEqual(['tackle']);
  });

  it('clears a wrap continuation but keeps the slot open', () => {
    const wrapped = reduce(
      initialState(PICK_THRESHER),
      { type: 'gangingUp', value: 5 },
      pick(0, 'm4'),
      pick(0, 'm2', 1),
    );

    const cleared = reduce(wrapped, {
      type: 'clearWrapContinuation',
      attackIndex: 0,
    });

    expect(wrapped.attackPlan.wrapPicks[0]).toEqual(['m4', 'm2']);
    expect(cleared.attackPlan.wrapPicks[0]).toEqual(['m4', null]);

    expect(
      reduce(initialState(PICK_THRESHER), {
        type: 'clearWrapContinuation',
        attackIndex: 0,
      }).attackPlan,
    ).toEqual(initialState(PICK_THRESHER).attackPlan);
  });

  it('changes a character play pick', () => {
    const withGb = reduce(initialState(PICK_VETERAN_BOAR), pick(0, 'gb'));

    const stagger = reduce(withGb, {
      type: 'characterPlayPick',
      attackIndex: 0,
      pickIndex: 0,
      pick: 'stagger',
    });

    const same = reduce(withGb, {
      type: 'characterPlayPick',
      attackIndex: 0,
      pickIndex: 0,
      pick: 'singledOut',
    });

    // A charging Veteran Boar rolls 12 dice, so row 0 has a second wrap slot.
    expect(withGb.attackPlan.characterPlayPicks[0]).toEqual([
      'singledOut',
      null,
    ]);

    expect(stagger.attackPlan.characterPlayPicks[0]).toEqual(['stagger', null]);
    expect(same).toBe(withGb);
  });
});
