import { describe, expect, it } from 'vitest';
import { activationTimeline } from '@/core/attacks/activationTimeline';
import { computeAttackSequence } from '@/core/attacks/attackSequence';
import type { ActivationRollParams } from '@/core/attacks/attackSequence.types';
import {
  makeAttacker,
  makeRollParams,
  modsWith,
  PLAY_ARM,
  TEAMMATE_GUILD,
} from '@/core/testing/fixtures';

const COVER = true;

const STANCE = true;

const NO_BONUS_TIME = [false, false];

const params: ActivationRollParams = makeRollParams({
  attacker: makeAttacker({ tac: 6 }),
  armor: 1,
  enemyHasCover: !COVER,
  enemyDefensiveStance: !STANCE,
  enemyDef: 4,
  bonusTimeByAttack: NO_BONUS_TIME,
});

describe('computeAttackSequence', () => {
  it('builds per-swing roll contexts with binomial success odds', () => {
    const plan = {
      wrapPicks: [['two'], ['one']],
      characterPlayPicks: [[null], [null]],
    };

    const { attacks } = computeAttackSequence(plan, params);

    // 6 dice at 4+ (p = 1/2), ARM 1. Row 0 needs 2 net (3 hits), row 1 needs 1.
    expect(attacks).toEqual([
      {
        attackIndex: 0,
        tac: 6,
        armor: 1,
        defMinRoll: 4,
        defMinRollAfter: 4,
        armorAfter: 1,
        pHit: 0.5,
        netSuccessesNeeded: 2,
        netHitBonus: 0,
        prob: 42 / 64,
      },
      {
        attackIndex: 1,
        tac: 6,
        armor: 1,
        defMinRoll: 4,
        defMinRollAfter: 4,
        armorAfter: 1,
        pHit: 0.5,
        netSuccessesNeeded: 1,
        netHitBonus: 0,
        prob: 57 / 64,
      },
    ]);
  });

  it('carries character play effects to later swings', () => {
    const plan = {
      wrapPicks: [['gb'], ['one']],
      characterPlayPicks: [['playTac'], [null]],
    };

    const { attacks } = computeAttackSequence(plan, params);

    expect(attacks.map((attack) => attack.tac)).toEqual([6, 8]);
  });

  it('gives the first swing the net hits Instruction grants', () => {
    const plan = {
      wrapPicks: [['two'], ['two']],
      characterPlayPicks: [[null], [null]],
    };

    const coached = makeRollParams({
      ...params,
      attacker: makeAttacker({ tac: 6, guild: TEAMMATE_GUILD }),
      damageMods: modsWith({ buffs: { coach: true } }),
    });

    const { attacks } = computeAttackSequence(plan, coached);

    expect(attacks.map((attack) => attack.netHitBonus)).toEqual([2, 0]);
    expect(attacks[0].prob).toBe(1);
    expect(attacks[1].prob).toBeCloseTo(42 / 64);
  });
});

describe('the activation timeline of the sequence', () => {
  it('is returned with the swings, so callers do not rebuild it', () => {
    const plan = {
      wrapPicks: [['gb'], ['one']],
      characterPlayPicks: [['playTac'], [null]],
    };

    const { timeline } = computeAttackSequence(plan, params);

    expect(timeline).toEqual(activationTimeline(plan, params));
  });
});

describe('computeAttackSequence DEF and ARM after each swing', () => {
  it('shows a KD lowering DEF on the swing that picks it', () => {
    const plan = {
      wrapPicks: [['kd'], ['one']],
      characterPlayPicks: [[null], [null]],
    };

    const { attacks } = computeAttackSequence(plan, params);

    expect(attacks.map((attack) => attack.defMinRoll)).toEqual([4, 3]);
    expect(attacks.map((attack) => attack.defMinRollAfter)).toEqual([3, 3]);
  });

  it('shows an ARM play lowering ARM on the swing that picks it', () => {
    const armorPlayer = makeRollParams({
      ...params,
      attacker: makeAttacker({ tac: 6, inf: 3, characterPlays: [PLAY_ARM] }),
    });

    const plan = {
      wrapPicks: [['gb'], ['one']],
      characterPlayPicks: [['playArm'], [null]],
    };

    const { attacks } = computeAttackSequence(plan, armorPlayer);

    expect(attacks.map((attack) => attack.armor)).toEqual([1, 0]);
    expect(attacks.map((attack) => attack.armorAfter)).toEqual([0, 0]);
  });

  it('keeps the charge-only stance DEF on the charge swing after it lands', () => {
    const chargingIntoStance = makeRollParams({
      ...params,
      chargeAttackIndex: 0,
      enemyDefensiveStance: STANCE,
    });

    const plan = {
      wrapPicks: [['one'], ['one']],
      characterPlayPicks: [[null], [null]],
    };

    const { attacks } = computeAttackSequence(plan, chargingIntoStance);

    expect(attacks.map((attack) => attack.defMinRoll)).toEqual([5, 4]);
    expect(attacks.map((attack) => attack.defMinRollAfter)).toEqual([5, 4]);
  });
});
