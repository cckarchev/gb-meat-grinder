import { describe, expect, it } from 'vitest';
import { createInitialAttackPlan } from '@/core/plan/initialAttackPlan';
import { ARM_DEFAULT, DEF_DEFAULT, HP_DEFAULT } from '@/core/shared/constants';
import { thresher } from '@/data/attackers/thresher';
import { veteranBoar } from '@/data/attackers/veteranBoar';
import {
  initialState,
  PICK_THRESHER,
  PICK_VETERAN_BOAR,
  reduce,
} from '@/gbMeatGrinder/reducer/reducerTestHelpers';

describe('initial state', () => {
  it('starts a random model with all influence and default enemy stats', () => {
    const state = initialState(PICK_THRESHER);

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
      damageMods: { toughHide: false, buffs: {} },
      specialAbilities: {},
    });

    expect(state.attackPlan).toEqual(
      createInitialAttackPlan(thresher, thresher.inf, false),
    );
  });

  it('charges by default for Furious models', () => {
    expect(initialState(PICK_VETERAN_BOAR).charging).toBe(true);
  });
});

describe('model selection', () => {
  it('reset restores defaults but keeps the model', () => {
    const state = reduce(
      initialState(PICK_THRESHER),
      { type: 'hp', value: 3 },
      { type: 'reset' },
    );

    expect(state.attackerId).toBe(thresher.id);
    expect(state.hp).toBe(HP_DEFAULT);
  });

  it('ignores selecting the current model', () => {
    const state = initialState(PICK_THRESHER);

    expect(reduce(state, { type: 'selectAttacker', id: thresher.id })).toBe(
      state,
    );
  });

  it('keeps enemy stats and Tough Hide but drops attacker-side toggles', () => {
    const state = reduce(
      initialState(PICK_THRESHER),
      { type: 'enemyDef', value: 5 },
      { type: 'armor', value: 2 },
      { type: 'hp', value: 9 },
      { type: 'enemyHasCover', value: true },
      {
        type: 'damageMods',
        value: { toughHide: true, buffs: { weakPoint: true } },
      },
      { type: 'specialAbility', id: 'dontFearTheReaper', value: true },
      { type: 'selectAttacker', id: veteranBoar.id },
    );

    expect(state).toMatchObject({
      attackerId: veteranBoar.id,
      enemyDef: 5,
      armor: 2,
      hp: 9,
      enemyHasCover: true,
      charging: true,
      damageMods: { toughHide: true, buffs: {} },
      specialAbilities: {},
    });
  });
});

describe('influence and charge', () => {
  it('clamps influence to 0..INF and empties rows that lose their attack', () => {
    const start = initialState(PICK_THRESHER);
    const tooMuch = reduce(start, { type: 'influence', value: 9 });
    const negative = reduce(start, { type: 'influence', value: -1 });
    const two = reduce(start, { type: 'influence', value: 2 });

    expect(tooMuch.influence).toBe(thresher.inf);
    expect(negative.influence).toBe(0);
    expect(two.attackPlan.wrapPicks).toEqual([[null], [null], [], [], []]);
  });

  it('keeps the charge row within the active base attacks', () => {
    const charging = reduce(
      initialState(PICK_THRESHER),
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
