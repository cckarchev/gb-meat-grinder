import { describe, expect, it } from 'vitest';
import {
  activationTimeline,
  swingStateAt,
} from '@/core/attacks/activationTimeline';
import type { TimelineParams } from '@/core/attacks/activationTimeline.types';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import type { CharacterPlay } from '@/core/playbook/playbook.types';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import {
  makeAttacker,
  modsWith,
  NO_MODS,
  PLAY_ARM,
  PLAY_DAMAGE,
  PLAY_DEF,
  PLAY_REPEATABLE,
  PLAY_TAC,
} from '@/core/testing/fixtures';

const params = (overrides: Partial<TimelineParams> = {}): TimelineParams => {
  return {
    attacker: makeAttacker({
      inf: 3,
      characterPlays: [PLAY_TAC, PLAY_DEF, PLAY_ARM],
    }),
    damageMods: NO_MODS,
    activeBaseCount: 3,
    chargeAttackIndex: NO_ATTACK_INDEX,
    ...overrides,
  };
};

const NONE = { tacBonus: 0, defReduction: 0, armorReduction: 0 };

describe('activationTimeline carried effects', () => {
  it('starts every swing with nothing when no pick carries an effect', () => {
    const plan: AttackPlan = {
      wrapPicks: [['one'], ['two'], ['four']],
      characterPlayPicks: [[null], [null], [null]],
    };

    const timeline = activationTimeline(plan, params());

    expect(timeline.map((state) => state.effectsBefore)).toEqual([
      NONE,
      NONE,
      NONE,
    ]);
  });

  it('carries a play and a KD into later swings only', () => {
    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['kd'], ['one']],
      characterPlayPicks: [['playTac'], [null], [null]],
    };

    const timeline = activationTimeline(plan, params());

    expect(timeline[0].effectsBefore).toEqual(NONE);
    expect(timeline[1].effectsBefore).toEqual({ ...NONE, tacBonus: 2 });
    expect(timeline[2].effectsBefore).toEqual({
      ...NONE,
      tacBonus: 2,
      defReduction: 1,
    });
  });

  it('carries an ARM play into later swings', () => {
    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['one'], ['one']],
      characterPlayPicks: [['playArm'], [null], [null]],
    };

    const timeline = activationTimeline(plan, params());

    expect(timeline[1].effectsBefore.armorReduction).toBe(1);
    expect(timeline[2].effectsBefore.armorReduction).toBe(1);
  });

  it('applies an ARM play picked twice only once', () => {
    const anyTurnArm: CharacterPlay = { ...PLAY_ARM, oncePerTurn: false };
    const attacker = makeAttacker({ inf: 3, characterPlays: [anyTurnArm] });

    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['gb'], ['one']],
      characterPlayPicks: [['playArm'], ['playArm'], [null]],
    };

    const timeline = activationTimeline(plan, params({ attacker }));

    expect(timeline[0].effectsBefore.armorReduction).toBe(0);
    expect(timeline[2].effectsBefore.armorReduction).toBe(1);
  });

  it('gives rows outside the activation no carry-over', () => {
    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['one'], ['one']],
      characterPlayPicks: [['playTac'], [null], [null]],
    };

    const timeline = activationTimeline(plan, params({ activeBaseCount: 1 }));

    expect(timeline[1].effectsBefore).toEqual(NONE);
    expect(timeline[2].effectsBefore).toEqual(NONE);
  });

  it('gives rows past the plan no carry-over', () => {
    const plan: AttackPlan = {
      wrapPicks: [['gb']],
      characterPlayPicks: [['playTac']],
    };

    const timeline = activationTimeline(plan, params({ activeBaseCount: 1 }));

    expect(swingStateAt(timeline, 5).effectsBefore).toEqual(NONE);
  });
});

describe('named effects do not stack', () => {
  it('applies a pre-applied guild ARM debuff from the first swing', () => {
    const plan: AttackPlan = {
      wrapPicks: [['one'], ['one']],
      characterPlayPicks: [[null], [null]],
    };

    const timeline = activationTimeline(
      plan,
      params({
        activeBaseCount: 2,
        damageMods: modsWith({ buffs: { sunder: true } }),
      }),
    );

    expect(timeline[0].effectsBefore.armorReduction).toBe(1);
    expect(timeline[1].effectsBefore.armorReduction).toBe(1);
  });

  it('stacks effects with different names', () => {
    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['one']],
      characterPlayPicks: [['playArm'], [null]],
    };

    const timeline = activationTimeline(
      plan,
      params({
        activeBaseCount: 2,
        damageMods: modsWith({ buffs: { sunder: true } }),
      }),
    );

    expect(timeline[1].effectsBefore.armorReduction).toBe(2);
  });

  it('applies a play that is not Once Per Turn only once', () => {
    const attacker = makeAttacker({
      inf: 3,
      characterPlays: [PLAY_REPEATABLE],
    });

    const plan: AttackPlan = {
      wrapPicks: [['gb'], ['gb'], ['one']],
      characterPlayPicks: [['playRepeatable'], ['playRepeatable'], [null]],
    };

    const timeline = activationTimeline(plan, params({ attacker }));

    expect(timeline[2].effectsBefore.tacBonus).toBe(1);
  });
});

describe('damaging character plays', () => {
  const attacker = makeAttacker({ characterPlays: [PLAY_DAMAGE] });

  const twoGbs: AttackPlan = {
    wrapPicks: [['gb'], ['gb']],
    characterPlayPicks: [['playDamage'], ['playDamage']],
  };

  it('puts the play damage on the slot that triggers it', () => {
    const timeline = activationTimeline(twoGbs, params({ attacker }));

    expect(timeline[0].playDamageBySlot).toEqual([3]);
  });

  it('deals an Once Per Turn play only the first time', () => {
    const timeline = activationTimeline(twoGbs, params({ attacker }));

    expect(timeline[1].playDamageBySlot).toEqual([0]);
  });

  it('applies Tough Hide and damage buffs to it', () => {
    const toughHide = activationTimeline(
      twoGbs,
      params({ attacker, damageMods: modsWith({ toughHide: true }) }),
    );

    const sharp = activationTimeline(
      twoGbs,
      params({ attacker, damageMods: modsWith({ buffs: { sharp: true } }) }),
    );

    expect(toughHide[0].playDamageBySlot).toEqual([2]);
    expect(sharp[0].playDamageBySlot).toEqual([4]);
  });
});
