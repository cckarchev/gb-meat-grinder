import { afterEach, describe, expect, it, vi } from 'vitest';
import { thresher } from '@/attackers/thresher';
import { veteranBoar } from '@/attackers/veteranBoar';
import { createInitialAttackPlan } from '@/core/attackPlanState';
import { HP_DEFAULT } from '@/core/constants';
import {
  createInitialMeatGrinderState,
  meatGrinderReducer,
} from '@/gbMeatGrinder/meatGrinderReducer';
import type {
  MeatGrinderAction,
  MeatGrinderState,
} from '@/types/gbMeatGrinder/reducer';

/** `Math.random` values that make `randomAttacker` pick each registry entry. */
const PICK_VETERAN_BOAR = 0;
const PICK_THRESHER = 0.9;

const initialState = (randomValue: number): MeatGrinderState => {
  vi.spyOn(Math, 'random').mockReturnValue(randomValue);

  return createInitialMeatGrinderState();
};

const reduce = (
  state: MeatGrinderState,
  ...actions: MeatGrinderAction[]
): MeatGrinderState => {
  return actions.reduce(meatGrinderReducer, state);
};

const pick = (
  attackIndex: number,
  id: string | null,
  pickIndex = 0,
): MeatGrinderAction => {
  return { type: 'wrapChoice', attackIndex, pickIndex, id };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('initial state', () => {
  it('starts a random model with all influence and default enemy stats', () => {
    const state = initialState(PICK_THRESHER);

    expect(state).toMatchObject({
      attackerId: thresher.id,
      influence: thresher.inf,
      charging: false,
      chargeAttackIndex: 0,
      enemyDef: 4,
      armor: 1,
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
    const crowded = reduce(withM4(), { type: 'crowdingOutRaw', value: 3 });
    const negative = reduce(withM4(), { type: 'crowdingOutRaw', value: -3 });

    expect(crowded.crowdingOut).toBe(3);
    // TAC 4 vs ARM 1 reaches 3 net: the first net-3 line, with its play.
    expect(crowded.attackPlan.wrapPicks[0]).toEqual(['three_gb']);
    expect(crowded.attackPlan.characterPlayPicks[0]).toEqual(['theyAintTough']);
    expect(negative.crowdingOut).toBe(0);
  });

  it('opens a wrap slot when Ganging Up adds dice, clamped to its range', () => {
    const state = reduce(withM4(), { type: 'gangingUpRaw', value: 9 });

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
      { type: 'gangingUpRaw', value: 5 },
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
