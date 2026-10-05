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
  NO_MODS,
  PLAY_ARM,
  PLAY_DEF,
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

  it('caps ARM reduction from earlier plays at 1', () => {
    const repeatableArm: CharacterPlay = { ...PLAY_ARM, repeatable: true };
    const attacker = makeAttacker({ inf: 3, characterPlays: [repeatableArm] });

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
