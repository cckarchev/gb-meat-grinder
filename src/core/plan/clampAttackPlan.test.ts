import { describe, expect, it } from 'vitest';
import { clampAttackPlan } from '@/core/plan/clampAttackPlan';
import type {
  CharacterPlayPickSlot,
  WrapPick,
} from '@/core/playbook/playbook.types';
import { getPlaybookResult } from '@/core/playbook/playbookIndex';
import {
  makeAttacker,
  makeRollParams,
  planOf,
  TEST_PLAYBOOK,
} from '@/core/testing/fixtures';
import type { AttackerData } from '@/data/attackers/attacker.types';

const ENEMY_KNOCKED_DOWN = true;

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

    return clampAttackPlan(planOf(wrapPicks, characterPlayPicks), {
      ...makeRollParams({ attacker: model, armor, activeBaseCount }),
      enemyKnockedDown,
    });
  };

  const fixture = makeAttacker();

  /** The fixture `kd` line without its dodge: Knock Down is all it does. */
  const bareKnockDown = { ...getPlaybookResult(fixture, 'kd'), dodge: false };

  /** Model whose only net-1 line is a bare KD and only net-2 line is a GB. */
  const knockDownThenGbAttacker = (tac: number): AttackerData => {
    return makeAttacker({
      tac,
      playbook: [
        { netSuccesses: 1, results: [bareKnockDown] },
        { netSuccesses: 2, results: [getPlaybookResult(fixture, 'gb')] },
      ],
    });
  };

  /** TAC 3 model with a net-1 `1` line and a net-3 bare KD line. */
  const bareKnockDownAttacker = makeAttacker({
    tac: 3,
    playbook: [
      { netSuccesses: 1, results: [getPlaybookResult(fixture, 'one')] },
      { netSuccesses: 3, results: [bareKnockDown] },
    ],
  });

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

  it('replaces every bare KD after the first one', () => {
    expect(
      clamp({
        attacker: bareKnockDownAttacker,
        wrapPicks: [['kd'], ['kd']],
        activeBaseCount: 2,
      }).wrapPicks,
    ).toEqual([['kd'], ['one']]);

    expect(
      clamp({
        attacker: bareKnockDownAttacker,
        wrapPicks: [['kd'], ['kd']],
        activeBaseCount: 2,
        enemyKnockedDown: ENEMY_KNOCKED_DOWN,
      }).wrapPicks,
    ).toEqual([['one'], ['one']]);
  });

  it('keeps a repeated KD line that carries other effects', () => {
    // The later KD does not apply, but its dodge (or damage) still does.
    expect(
      clamp({ wrapPicks: [['kd'], ['kd']], activeBaseCount: 2 }).wrapPicks,
    ).toEqual([['kd'], ['kd']]);

    expect(
      clamp({
        wrapPicks: [['kd'], ['kd']],
        activeBaseCount: 2,
        enemyKnockedDown: ENEMY_KNOCKED_DOWN,
      }).wrapPicks,
    ).toEqual([['kd'], ['kd']]);
  });

  it('gives a GB replacement for a duplicate KD its default play', () => {
    expect(
      clamp({
        attacker: knockDownThenGbAttacker(2),
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
        attacker: knockDownThenGbAttacker(1),
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
      ...makeRollParams({ attacker: makeAttacker({ tac: 4 }) }),
      enemyKnockedDown: false,
    });

    expect(result).toBe(plan);
  });

  it('returns a new plan when clamping changes it', () => {
    const plan = {
      wrapPicks: [['four'], ['two']],
      characterPlayPicks: [[null], [null]],
    };

    const result = clampAttackPlan(plan, {
      ...makeRollParams({ attacker: makeAttacker({ tac: 2 }) }),
      enemyKnockedDown: false,
    });

    expect(result).not.toBe(plan);
    expect(result.wrapPicks).toEqual([['push'], ['two']]);
  });
});
