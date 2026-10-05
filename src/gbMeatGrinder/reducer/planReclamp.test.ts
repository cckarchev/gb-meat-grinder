import { describe, expect, it } from 'vitest';
import { thresher } from '@/data/attackers/thresher';
import {
  initialState,
  PICK_THRESHER,
  pick,
  reduce,
} from '@/gbMeatGrinder/reducer/reducerTestHelpers';

describe('re-clamping the plan', () => {
  // Thresher: TAC 7 vs ARM 1 reaches 6 net, so `m4` (net 6) is legal.
  const withM4 = () => {
    return reduce(initialState(PICK_THRESHER), pick(0, 'm4'));
  };

  it('downgrades picks when ARM rises', () => {
    const state = reduce(withM4(), { type: 'armor', value: 3 });

    expect(state.attackPlan.wrapPicks[0]).toEqual(['m3_dodge']);
  });

  it('downgrades picks when cover costs a die', () => {
    const state = reduce(withM4(), { type: 'enemyHasCover', value: true });

    expect(state.attackPlan.wrapPicks[0]).toEqual(['m3_kd']);
  });

  it('downgrades picks when Crowding Out costs dice, clamped to its range', () => {
    const crowded = reduce(withM4(), { type: 'crowdingOut', value: 3 });
    const negative = reduce(withM4(), { type: 'crowdingOut', value: -3 });

    expect(crowded.crowdingOut).toBe(3);
    // TAC 4 vs ARM 1 reaches 3 net: the first net-3 line, with its play.
    expect(crowded.attackPlan.wrapPicks[0]).toEqual(['three_gb']);
    expect(crowded.attackPlan.characterPlayPicks[0]).toEqual(['theyAintTough']);
    expect(negative.crowdingOut).toBe(0);
  });

  it('opens a wrap slot when Ganging Up adds dice, clamped to its range', () => {
    const state = reduce(withM4(), { type: 'gangingUp', value: 9 });

    expect(state.gangingUp).toBe(thresher.gangingUp.max);
    expect(state.attackPlan.wrapPicks[0]).toEqual(['m4', null]);
  });

  it('opens a wrap slot when a buff lowers ARM', () => {
    const state = reduce(withM4(), {
      type: 'damageMods',
      value: { toughHide: false, buffs: { weakPoint: true } },
    });

    expect(state.attackPlan.wrapPicks[0]).toEqual(['m4', null]);
  });

  it('replaces a playbook KD when the target is already Knocked Down', () => {
    const state = reduce(initialState(PICK_THRESHER), pick(0, 'kd_dodge'), {
      type: 'enemyKnockedDown',
      value: true,
    });

    expect(state.attackPlan.wrapPicks[0]).toEqual(['dodge']);
  });

  it('keeps the same plan object when nothing becomes illegal', () => {
    const state = withM4();

    expect(reduce(state, { type: 'enemySnared', value: true }).attackPlan).toBe(
      state.attackPlan,
    );

    expect(
      reduce(state, { type: 'enemyDefensiveStance', value: true }).attackPlan,
    ).toBe(state.attackPlan);

    expect(reduce(state, { type: 'enemyDef', value: 5 }).attackPlan).toBe(
      state.attackPlan,
    );
  });

  it('does not re-clamp for target-only or display-only changes', () => {
    const state = withM4();

    expect(
      reduce(state, { type: 'enemyResilience', value: true }),
    ).toMatchObject({
      enemyResilience: true,
      attackPlan: state.attackPlan,
    });

    expect(reduce(state, { type: 'hp', value: 3 }).attackPlan).toBe(
      state.attackPlan,
    );

    expect(reduce(state, { type: 'startingMomentum', value: 4 })).toMatchObject(
      {
        startingMomentum: 4,
        attackPlan: state.attackPlan,
      },
    );
  });
});
