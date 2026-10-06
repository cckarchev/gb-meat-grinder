import { describe, expect, it } from 'vitest';
import { createInitialAttackPlan } from '@/core/plan/initialAttackPlan';
import { ARM_DEFAULT, DEF_DEFAULT, HP_DEFAULT } from '@/core/shared/constants';
import { cast } from '@/data/attackers/cast';
import { thresher } from '@/data/attackers/thresher';
import { veteranBoar } from '@/data/attackers/veteranBoar';
import { windle } from '@/data/attackers/windle';
import { stateForAttacker } from '@/gbMeatGrinder/reducer/meatGrinderInitialState';
import { reduce } from '@/gbMeatGrinder/reducer/reducerTestHelpers';

describe('initial state', () => {
  it('starts a random model with all influence and default enemy stats', () => {
    const state = stateForAttacker(thresher);

    expect(state).toMatchObject({
      attackerId: thresher.id,
      influence: thresher.inf,
      charging: false,
      chargeAttackIndex: 0,
      enemyDef: DEF_DEFAULT,
      armor: ARM_DEFAULT,
      hp: HP_DEFAULT,
      startingMomentum: 0,
      bonusTimeByAttack: [false, false, false, false, false],
      damageMods: { toughHide: false, targetBurning: false, buffs: {} },
      activeTraits: {},
    });

    expect(state.attackPlan).toEqual(
      createInitialAttackPlan(thresher, thresher.inf, false),
    );
  });

  it('charges by default for Furious models', () => {
    expect(stateForAttacker(veteranBoar).charging).toBe(true);
  });
});

describe('model selection', () => {
  it('reset restores defaults but keeps the model', () => {
    const state = reduce(
      stateForAttacker(thresher),
      { type: 'hp', value: 3 },
      { type: 'reset' },
    );

    expect(state.attackerId).toBe(thresher.id);
    expect(state.hp).toBe(HP_DEFAULT);
  });

  it('ignores selecting the current model', () => {
    const state = stateForAttacker(thresher);

    expect(reduce(state, { type: 'selectAttacker', id: thresher.id })).toBe(
      state,
    );
  });

  it('keeps enemy stats, Tough Hide and Burning but drops attacker-side toggles', () => {
    const state = reduce(
      stateForAttacker(thresher),
      { type: 'enemyDef', value: 5 },
      { type: 'armor', value: 2 },
      { type: 'hp', value: 9 },
      { type: 'enemyHasCover', value: true },
      { type: 'toughHide', value: true },
      { type: 'targetBurning', value: true },
      { type: 'guildBuff', id: 'weakPoint', value: true },
      { type: 'activeTrait', id: 'dontFearTheReaper', value: true },
      { type: 'selectAttacker', id: veteranBoar.id },
    );

    expect(state).toMatchObject({
      attackerId: veteranBoar.id,
      enemyDef: 5,
      armor: 2,
      hp: 9,
      enemyHasCover: true,
      charging: true,
      damageMods: { toughHide: true, targetBurning: true, buffs: {} },
      activeTraits: {},
    });
  });
});

describe('influence and charge', () => {
  it('clamps influence to 0..INF and empties rows that lose their attack', () => {
    const start = stateForAttacker(thresher);
    const tooMuch = reduce(start, { type: 'influence', value: 9 });
    const negative = reduce(start, { type: 'influence', value: -1 });
    const two = reduce(start, { type: 'influence', value: 2 });

    expect(tooMuch.influence).toBe(thresher.inf);
    expect(negative.influence).toBe(0);
    expect(two.attackPlan.wrapPicks).toEqual([[null], [null], [], [], []]);
  });

  it('keeps the charge row within the active base attacks', () => {
    const charging = reduce(
      stateForAttacker(thresher),
      { type: 'charging', value: true },
      { type: 'chargeAttackIndex', value: 3 },
    );

    const lessInfluence = reduce(charging, { type: 'influence', value: 2 });

    // 5 INF: charge (2) + 3 bought = 4 bases. 2 INF: just the charge.
    expect(charging.chargeAttackIndex).toBe(3);
    expect(lessInfluence.chargeAttackIndex).toBe(0);

    expect(
      reduce(charging, { type: 'chargeAttackIndex', value: 9 })
        .chargeAttackIndex,
    ).toBe(3);

    expect(
      reduce(charging, { type: 'chargeAttackIndex', value: -2 })
        .chargeAttackIndex,
    ).toBe(0);
  });
});

describe('attacker stat ranges', () => {
  it('clamps each per-activation input to the model range', () => {
    const start = stateForAttacker(veteranBoar);

    const tooHigh = reduce(
      start,
      { type: 'startingMomentum', value: 99 },
      { type: 'gangingUp', value: 99 },
      { type: 'crowdingOut', value: 99 },
    );

    const tooLow = reduce(
      start,
      { type: 'startingMomentum', value: -3 },
      { type: 'gangingUp', value: -3 },
      { type: 'crowdingOut', value: -3 },
    );

    expect(tooHigh.startingMomentum).toBe(veteranBoar.startingMomentum.max);
    expect(tooHigh.gangingUp).toBe(veteranBoar.gangingUp.max);
    expect(tooHigh.crowdingOut).toBe(veteranBoar.crowdingOut.max);

    expect(tooLow.startingMomentum).toBe(veteranBoar.startingMomentum.min);
    expect(tooLow.gangingUp).toBe(veteranBoar.gangingUp.min);
    expect(tooLow.crowdingOut).toBe(veteranBoar.crowdingOut.min);
  });
});

describe('damage modifiers', () => {
  it('toggles one guild buff and keeps the others', () => {
    const state = reduce(
      stateForAttacker(thresher),
      { type: 'guildBuff', id: 'weakPoint', value: true },
      { type: 'guildBuff', id: 'otherBuff', value: true },
      { type: 'guildBuff', id: 'otherBuff', value: false },
    );

    expect(state.damageMods.buffs).toEqual({
      weakPoint: true,
      otherBuff: false,
    });
  });

  it('toggles Tough Hide without touching the buffs', () => {
    const state = reduce(
      stateForAttacker(thresher),
      { type: 'guildBuff', id: 'weakPoint', value: true },
      { type: 'toughHide', value: true },
    );

    expect(state.damageMods).toEqual({
      toughHide: true,
      targetBurning: false,
      assistEngaged: false,
      buffs: { weakPoint: true },
    });
  });

  it('toggles a named model engaging the target and drops it on a model change', () => {
    const engaged = reduce(stateForAttacker(thresher), {
      type: 'assistEngaged',
      value: true,
    });

    const switched = reduce(engaged, {
      type: 'selectAttacker',
      id: veteranBoar.id,
    });

    expect(engaged.damageMods.assistEngaged).toBe(true);
    expect(switched.damageMods.assistEngaged).toBe(false);
  });

  it('raises ganging up to at least 1 while a named model engages', () => {
    const engaged = reduce(stateForAttacker(thresher), {
      type: 'assistEngaged',
      value: true,
    });

    const loweredToZero = reduce(engaged, { type: 'gangingUp', value: 0 });

    const released = reduce(engaged, { type: 'assistEngaged', value: false });

    expect(engaged.gangingUp).toBe(1);
    expect(loweredToZero.gangingUp).toBe(1);
    expect(released.gangingUp).toBe(1);
    expect(reduce(released, { type: 'gangingUp', value: 0 }).gangingUp).toBe(0);
  });

  it('raises ganging up to at least 1 with Lend a Hand', () => {
    const lent = reduce(stateForAttacker(windle), {
      type: 'guildBuff',
      id: 'lendAHand',
      value: true,
    });

    expect(lent.gangingUp).toBe(1);
    expect(reduce(lent, { type: 'gangingUp', value: 0 }).gangingUp).toBe(1);
  });

  it('keeps a higher ganging up when a named model engages', () => {
    const three = reduce(stateForAttacker(thresher), {
      type: 'gangingUp',
      value: 3,
    });

    const engaged = reduce(three, { type: 'assistEngaged', value: true });

    expect(engaged.gangingUp).toBe(3);
  });
});

describe('One at a Time Lads!', () => {
  it('drops crowding out to 0 and keeps it there while on', () => {
    const crowded = reduce(stateForAttacker(cast), {
      type: 'crowdingOut',
      value: 2,
    });

    const lads = reduce(crowded, {
      type: 'guildBuff',
      id: 'oneAtATimeLads',
      value: true,
    });

    expect(crowded.crowdingOut).toBe(2);
    expect(lads.crowdingOut).toBe(0);
    expect(reduce(lads, { type: 'crowdingOut', value: 3 }).crowdingOut).toBe(0);
  });
});
