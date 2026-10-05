import { describe, expect, it } from 'vitest';
import { clampAttackPlan } from '@/core/plan/clampAttackPlan';
import type {
  CharacterPlayPickSlot,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/wrapSlots';
import { makeAttacker, NO_MODS, TEST_PLAYBOOK } from '@/core/testing/fixtures';
import type { AttackerData } from '@/data/attackers/attacker.types';

const NO_CHARGE = -1;

const COVER = true;

const STANCE = true;

const NO_BONUS_TIME = [false, false];

const ENEMY_KNOCKED_DOWN = true;

const ENEMY_DEF = 4;

const NO_TAC_MODIFIER = 0;

describe('clampAttackPlan', () => {
  type ClampOptions = {
    attacker?: AttackerData;
    tac?: number;
    armor?: number;
    wrapPicks: WrapPick[][];
    characterPlayPicks?: CharacterPlayPickSlot[][];
    activeBaseCount: number;
    enemyKnockedDown?: boolean;
  };

  const clamp = ({
    attacker,
    tac = 4,
    armor = 0,
    wrapPicks,
    characterPlayPicks,
    activeBaseCount,
    enemyKnockedDown = false,
  }: ClampOptions) => {
    const model = attacker ?? makeAttacker({ tac });

    const plays =
      characterPlayPicks ?? wrapPicks.map((row) => row.map(() => null));

    return clampAttackPlan(
      { wrapPicks, characterPlayPicks: plays },
      {
        attacker: model,
        chargeAttackIndex: NO_CHARGE,
        armor,
        enemyHasCover: !COVER,
        enemyDefensiveStance: !STANCE,
        damageMods: NO_MODS,
        enemyDef: ENEMY_DEF,
        bonusTimeByAttack: NO_BONUS_TIME,
        initialTacModifier: NO_TAC_MODIFIER,
        enemyKnockedDown,
        activeBaseCount,
      },
    );
  };

  /** Model whose only net-1 line is a KD and only net-2 line is a GB. */
  const kdThenGbAttacker = (tac: number): AttackerData => {
    const fixture = makeAttacker();
    const gb = getPlaybookResult(fixture, 'gb');
    const kd = getPlaybookResult(fixture, 'kd');

    return makeAttacker({
      tac,
      playbook: [
        { netSuccesses: 1, results: [kd] },
        { netSuccesses: 2, results: [gb] },
      ],
    });
  };

  it('downgrades picks the roll can never reach', () => {
    // 2 dice, ARM 0: max 2 net, so `four` becomes the first net-2 line.
    expect(
      clamp({ tac: 2, wrapPicks: [['four'], [null]], activeBaseCount: 1 })
        .wrapPicks,
    ).toEqual([['push'], []]);
  });

  it('assigns the default play when a downgrade lands on a GB line', () => {
    const result = clamp({
      tac: 3,
      wrapPicks: [['four']],
      activeBaseCount: 1,
    });

    expect(result).toEqual({
      wrapPicks: [['gb']],
      characterPlayPicks: [['playTac']],
    });
  });

  it('falls back to the first line when no column matches the budget', () => {
    const [netOne, , netThree] = TEST_PLAYBOOK;

    const gappedAttacker = makeAttacker({
      tac: 2,
      playbook: [netOne, netThree],
    });

    expect(
      clamp({
        attacker: gappedAttacker,
        wrapPicks: [['gb']],
        activeBaseCount: 1,
      }).wrapPicks,
    ).toEqual([['one']]);
  });

  it('empties the row when the roll cannot beat ARM', () => {
    expect(
      clamp({ tac: 2, armor: 2, wrapPicks: [['one']], activeBaseCount: 1 }),
    ).toEqual({ wrapPicks: [[null]], characterPlayPicks: [[null]] });
  });

  it('drops wrap slots the roll no longer reaches', () => {
    expect(
      clamp({
        wrapPicks: [['four', 'one']],
        characterPlayPicks: [[null, 'playTac']],
        activeBaseCount: 1,
      }),
    ).toEqual({ wrapPicks: [['four']], characterPlayPicks: [[null]] });
  });

  it('pads or trims character play rows to match the picks', () => {
    expect(
      clamp({
        wrapPicks: [['gb']],
        characterPlayPicks: [['playDef', 'playTac']],
        activeBaseCount: 1,
      }).characterPlayPicks,
    ).toEqual([['playDef']]);

    expect(
      clamp({
        wrapPicks: [['one']],
        characterPlayPicks: [[]],
        activeBaseCount: 1,
      }).characterPlayPicks,
    ).toEqual([[null]]);
  });

  it('re-sanitizes a repeated Once Per Turn play', () => {
    expect(
      clamp({
        wrapPicks: [['gb'], ['gb']],
        characterPlayPicks: [['playDef'], ['playDef']],
        activeBaseCount: 2,
      }).characterPlayPicks,
    ).toEqual([['playDef'], ['playTac']]);
  });

  it('empties rows beyond the active base count', () => {
    expect(
      clamp({ wrapPicks: [['one'], ['two']], activeBaseCount: 1 }).wrapPicks,
    ).toEqual([['one'], []]);
  });

  it('replaces every KD after the first one', () => {
    expect(
      clamp({ wrapPicks: [['kd'], ['kd']], activeBaseCount: 2 }).wrapPicks,
    ).toEqual([['kd'], ['one']]);

    expect(
      clamp({
        wrapPicks: [['kd'], ['kd']],
        activeBaseCount: 2,
        enemyKnockedDown: ENEMY_KNOCKED_DOWN,
      }).wrapPicks,
    ).toEqual([['one'], ['one']]);
  });

  it('gives a GB replacement for a duplicate KD its default play', () => {
    expect(
      clamp({
        attacker: kdThenGbAttacker(2),
        wrapPicks: [['kd'], ['kd']],
        activeBaseCount: 2,
      }),
    ).toEqual({
      wrapPicks: [['kd'], ['gb']],
      characterPlayPicks: [[null], ['playTac']],
    });
  });

  it('keeps a duplicate KD when no other line fits the budget', () => {
    // Characterizes current behavior: the fallback is the card's first line,
    // which here is the KD itself, so the duplicate survives.
    expect(
      clamp({
        attacker: kdThenGbAttacker(1),
        wrapPicks: [['kd'], ['kd']],
        activeBaseCount: 2,
      }).wrapPicks,
    ).toEqual([['kd'], ['kd']]);
  });

  it('returns the same plan object when nothing changes', () => {
    const plan = {
      wrapPicks: [['one'], ['two']],
      characterPlayPicks: [[null], [null]],
    };

    const result = clampAttackPlan(plan, {
      attacker: makeAttacker({ tac: 4 }),
      chargeAttackIndex: NO_CHARGE,
      armor: 0,
      enemyHasCover: !COVER,
      enemyDefensiveStance: !STANCE,
      damageMods: NO_MODS,
      enemyDef: ENEMY_DEF,
      bonusTimeByAttack: NO_BONUS_TIME,
      initialTacModifier: NO_TAC_MODIFIER,
      enemyKnockedDown: false,
      activeBaseCount: 2,
    });

    expect(result).toBe(plan);
  });

  it('returns a new plan when clamping changes it', () => {
    const plan = {
      wrapPicks: [['four'], ['two']],
      characterPlayPicks: [[null], [null]],
    };

    const result = clampAttackPlan(plan, {
      attacker: makeAttacker({ tac: 2 }),
      chargeAttackIndex: NO_CHARGE,
      armor: 0,
      enemyHasCover: !COVER,
      enemyDefensiveStance: !STANCE,
      damageMods: NO_MODS,
      enemyDef: ENEMY_DEF,
      bonusTimeByAttack: NO_BONUS_TIME,
      initialTacModifier: NO_TAC_MODIFIER,
      enemyKnockedDown: false,
      activeBaseCount: 2,
    });

    expect(result).not.toBe(plan);
    expect(result.wrapPicks).toEqual([['push'], ['two']]);
  });
});
