import { describe, expect, it } from 'vitest';
import {
  coverTacPenaltyForAttack,
  modifiersBeforeAttack,
} from '@/core/attacks/earlierSwingEffects';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

const COVER = true;

describe('coverTacPenaltyForAttack', () => {
  const attacker = makeAttacker();

  it('costs 1 die until an earlier swing pushes', () => {
    expect(
      coverTacPenaltyForAttack(attacker, COVER, [['push'], ['one']], 0, 2),
    ).toBe(1);

    expect(
      coverTacPenaltyForAttack(attacker, COVER, [['push'], ['one']], 1, 2),
    ).toBe(0);

    expect(
      coverTacPenaltyForAttack(attacker, COVER, [['one'], ['push']], 1, 2),
    ).toBe(1);
  });

  it('is 0 without cover', () => {
    expect(
      coverTacPenaltyForAttack(attacker, !COVER, [['one'], ['one']], 1, 2),
    ).toBe(0);
  });
});

describe('modifiersBeforeAttack', () => {
  it('collects TAC and DEF carry-over from earlier swings', () => {
    const attacker = makeAttacker({ inf: 3 });

    expect(
      modifiersBeforeAttack(
        attacker,
        [['gb'], ['kd'], ['one']],
        [['playTac'], [null], [null]],
        2,
        NO_MODS,
        3,
      ),
    ).toEqual({ tacBonus: 2, defReduction: 1 });
  });
});

describe('rows outside the activation', () => {
  const attacker = makeAttacker();

  it('get the full cover penalty and no carry-over', () => {
    expect(coverTacPenaltyForAttack(attacker, COVER, [['push']], 5, 1)).toBe(1);

    expect(
      modifiersBeforeAttack(attacker, [['gb']], [['playTac']], 5, NO_MODS, 1),
    ).toEqual({ tacBonus: 0, defReduction: 0 });
  });
});
